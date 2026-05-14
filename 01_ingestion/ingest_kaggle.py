# ============================================================
# Fichier  : ingest_kaggle.py
# Rôle     : Télécharge les datasets Kaggle via l'API officielle
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================
#
# Prérequis :
#   1. pip install kaggle
#   2. Créer un token sur https://www.kaggle.com/settings > API
#   3. Placer kaggle.json dans ~/.kaggle/ (Linux/macOS)
#      ou %USERPROFILE%\.kaggle\ (Windows)
#   4. Ou définir KAGGLE_USERNAME et KAGGLE_KEY dans .env
#
# Usage :
#   python 01_ingestion/ingest_kaggle.py
#   python 01_ingestion/ingest_kaggle.py --dataset isot
#   python 01_ingestion/ingest_kaggle.py --list
#
# ============================================================

import argparse
import logging
import os
import sys
import zipfile
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("ingest_kaggle")

KAGGLE_DATASETS: list[dict] = [
    {
        "name": "isot",
        "dataset_id": "clmentbisaillon/fake-and-real-news-dataset",
        "destination": "09_data/raw/kaggle/news/",
        "description": "ISOT Fake News Dataset (Fake.csv + True.csv — 44 000 articles)",
        "active": True,
    },
    {
        "name": "fake_job_postings",
        "dataset_id": "shivamb/real-or-fake-fake-jobpostings-prediction",
        "destination": "09_data/raw/kaggle/",
        "description": "Fake Job Postings (17 000 offres d'emploi)",
        "active": True,
    },
    {
        "name": "fakenewsnet",
        "dataset_id": "mdepak/fakenewsnet",
        "destination": "09_data/raw/kaggle/fakenewsnet/",
        "description": "FakeNewsNet — GossipCop + PolitiFact",
        "active": False,
    },
]


def setup_kaggle_credentials() -> bool:
    """Configure les credentials Kaggle depuis les variables d'environnement."""
    username = os.getenv("KAGGLE_USERNAME")
    key = os.getenv("KAGGLE_KEY")

    if username and key:
        os.environ["KAGGLE_USERNAME"] = username
        os.environ["KAGGLE_KEY"] = key
        log.info("Credentials Kaggle chargés depuis .env")
        return True

    kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
    if kaggle_json.exists():
        log.info(f"Credentials Kaggle trouvés : {kaggle_json}")
        return True

    log.error(
        "Credentials Kaggle introuvables.\n"
        "Option 1 : définir KAGGLE_USERNAME et KAGGLE_KEY dans .env\n"
        "Option 2 : placer kaggle.json dans ~/.kaggle/\n"
        "           Télécharger sur : https://www.kaggle.com/settings > API"
    )
    return False


def download_dataset(dataset: dict, base_dir: str) -> bool:
    """Télécharge un dataset Kaggle et extrait le ZIP."""
    try:
        import kaggle
    except ImportError:
        log.error("Module kaggle non installé. Lancer : pip install kaggle")
        return False

    name = dataset["name"]
    dataset_id = dataset["dataset_id"]
    destination = os.path.join(base_dir, dataset["destination"])
    os.makedirs(destination, exist_ok=True)

    log.info(f"Téléchargement Kaggle : {dataset_id}")
    log.info(f"Destination          : {destination}")

    try:
        kaggle.api.authenticate()
        kaggle.api.dataset_download_files(
            dataset=dataset_id,
            path=destination,
            unzip=True,
            quiet=False,
        )
        log.info(f"✓ [{name}] Téléchargement terminé")
        return True

    except Exception as e:
        log.error(f"✗ [{name}] Erreur : {e}")
        return False


def main() -> None:
    parser = argparse.ArgumentParser(description="FakeNews Analyzer — Ingestion Kaggle")
    parser.add_argument("--dataset", default="all", help="Nom du dataset (défaut : all)")
    parser.add_argument("--list", action="store_true", help="Afficher la liste des datasets")
    args = parser.parse_args()

    base_dir = str(Path(__file__).parent.parent)

    if args.list:
        print("\nDatasets Kaggle disponibles :")
        print("-" * 60)
        for d in KAGGLE_DATASETS:
            status = "✓ actif" if d["active"] else "○ inactif"
            print(f"  {d['name']:<20} {status:<12} {d['description']}")
        print()
        return

    if not setup_kaggle_credentials():
        sys.exit(1)

    if args.dataset == "all":
        targets = [d for d in KAGGLE_DATASETS if d["active"]]
    else:
        targets = [d for d in KAGGLE_DATASETS if d["name"] == args.dataset]
        if not targets:
            log.error(f"Dataset '{args.dataset}' introuvable. Lancer --list pour la liste.")
            sys.exit(1)

    results = {"success": [], "failed": []}
    for dataset in targets:
        ok = download_dataset(dataset, base_dir)
        (results["success"] if ok else results["failed"]).append(dataset["name"])

    log.info("")
    log.info("=" * 50)
    log.info(f"✓ Succès  : {results['success']}")
    log.info(f"✗ Échecs  : {results['failed']}")

    if results["failed"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
