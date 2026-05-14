# ============================================================
# Fichier  : ingest_huggingface.py
# Rôle     : Ingestion des datasets HuggingFace via la lib datasets
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================
#
# Usage :
#   python 01_ingestion/ingest_huggingface.py
#   python 01_ingestion/ingest_huggingface.py --source fake_news
#
# ============================================================

import argparse
import logging
import os
import sys
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, str(Path(__file__).parent.parent))
from config_sources import HF_SOURCES

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("ingest_hf")


def normalize_labels(df: pd.DataFrame, source: dict) -> pd.DataFrame:
    """
    Normalise les labels selon le mapping défini dans config_sources.py.
    Gère les labels numériques (int) et textuels (str).
    """
    fixed_label = source.get("fixed_label")
    label_mapping = source.get("label_mapping", {})

    if fixed_label is not None:
        df["label"] = int(fixed_label)
        return df

    if not label_mapping:
        log.warning(f"Pas de label_mapping pour {source['name']} — labels inchangés")
        return df

    normalized_mapping = {}
    for k, v in label_mapping.items():
        normalized_mapping[k] = v
        try:
            normalized_mapping[int(k)] = v
        except (ValueError, TypeError):
            pass

    before = len(df)
    df["label"] = df["label"].map(normalized_mapping)
    df = df.dropna(subset=["label"])
    df["label"] = df["label"].astype(int)
    after = len(df)

    if before != after:
        log.info(f"  Labels hors mapping supprimés : {before - after} lignes")

    return df


def ingest_source(source: dict, base_dir: str) -> bool:
    """Télécharge un dataset HuggingFace et le sauvegarde en CSV."""
    try:
        from datasets import load_dataset
    except ImportError:
        log.error("Module datasets non installé. Lancer : pip install datasets")
        return False

    name = source["name"]
    hf_path = source["hf_path"]
    text_field = source["text_field"]
    label_field = source.get("label_field")

    # Les sources HuggingFace sont regroupées sous raw/huggingface/
    destination_dir = os.path.join(base_dir, "09_data", "raw", "huggingface", name)
    destination_csv = os.path.join(destination_dir, f"{name}.csv")
    os.makedirs(destination_dir, exist_ok=True)

    log.info(f"Téléchargement HuggingFace : {hf_path}")

    try:
        hf_token = os.getenv("HF_TOKEN")
        dataset = load_dataset(hf_path, token=hf_token if hf_token else None)

        dfs = []
        for split_name, split_data in dataset.items():
            df_split = split_data.to_pandas()
            df_split["split"] = split_name
            dfs.append(df_split)

        df = pd.concat(dfs, ignore_index=True)
        log.info(f"  Lignes totales (tous splits) : {len(df)}")

        columns_to_keep = [col for col in [text_field, label_field, "split"] if col and col in df.columns]
        df = df[columns_to_keep].copy()

        df = df.rename(columns={text_field: "text"})
        if label_field and label_field in df.columns:
            df = df.rename(columns={label_field: "label"})

        df = df.dropna(subset=["text"])
        df = df[df["text"].str.strip() != ""]
        log.info(f"  Après suppression des textes vides : {len(df)}")

        if "label" in df.columns:
            df = normalize_labels(df, source)

        df["source"] = name

        if "label" in df.columns:
            dist = df["label"].value_counts().to_dict()
            real_count = dist.get(0, 0)
            fake_count = dist.get(1, 0)
            log.info(f"  Distribution : REAL={real_count} ({real_count/len(df)*100:.1f}%) "
                     f"| FAKE={fake_count} ({fake_count/len(df)*100:.1f}%)")

        df.to_csv(destination_csv, index=False, encoding="utf-8")
        log.info(f"  ✓ Sauvegardé : {destination_csv} ({len(df)} lignes)")
        return True

    except Exception as e:
        log.error(f"  ✗ Erreur lors de l'ingestion de {name} : {e}")
        return False


def main() -> None:
    parser = argparse.ArgumentParser(description="FakeNews Analyzer — Ingestion HuggingFace")
    parser.add_argument("--source", default="all", help="Nom de la source HF (défaut : all)")
    args = parser.parse_args()

    base_dir = str(Path(__file__).parent.parent)

    log.info("=" * 60)
    log.info("FakeNews Analyzer — Ingestion HuggingFace")
    log.info("=" * 60)

    if args.source == "all":
        targets = [s for s in HF_SOURCES if s.get("active", False)]
    else:
        targets = [s for s in HF_SOURCES if s["name"] == args.source]
        if not targets:
            log.error(f"Source '{args.source}' introuvable dans HF_SOURCES")
            sys.exit(1)

    if not targets:
        log.warning("Aucune source HuggingFace active. Vérifiez config_sources.py")
        return

    results = {"success": [], "failed": []}
    for source in targets:
        log.info(f"\n── {source['name']} ──────────────────────────────────")
        log.info(f"  {source.get('description', '')}")
        ok = ingest_source(source, base_dir)
        (results["success"] if ok else results["failed"]).append(source["name"])

    log.info("\n" + "=" * 60)
    log.info("RAPPORT FINAL")
    log.info("=" * 60)
    log.info(f"✓ Succès  : {results['success']}")
    log.info(f"✗ Échecs  : {results['failed']}")

    if results["failed"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
