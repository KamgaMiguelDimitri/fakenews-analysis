# ============================================================
# Fichier  : downloader.py
# Rôle     : Télécharge les sources définies dans config_sources.py
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================

import os
import sys
import zipfile
import logging
import time
from pathlib import Path
from typing import Optional

import requests
from tqdm import tqdm

sys.path.insert(0, str(Path(__file__).parent.parent))
from config_sources import SOURCES

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("downloader")

MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 5
CHUNK_SIZE = 8192


def download_file(url: str, destination_path: str, retries: int = MAX_RETRIES) -> bool:
    """
    Télécharge un fichier depuis une URL avec barre de progression.
    Réessaie automatiquement en cas d'erreur réseau (max 3 fois).
    """
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            log.info(f"  Téléchargement (tentative {attempt}/{MAX_RETRIES}) : {url}")
            response = requests.get(url, stream=True, timeout=60)
            response.raise_for_status()

            total_size = int(response.headers.get("content-length", 0))
            os.makedirs(os.path.dirname(destination_path), exist_ok=True)

            with open(destination_path, "wb") as f, tqdm(
                total=total_size,
                unit="B",
                unit_scale=True,
                unit_divisor=1024,
                desc=os.path.basename(destination_path),
            ) as progress:
                for chunk in response.iter_content(chunk_size=CHUNK_SIZE):
                    if chunk:
                        f.write(chunk)
                        progress.update(len(chunk))

            log.info(f"  ✓ Fichier sauvegardé : {destination_path}")
            return True

        except requests.exceptions.RequestException as e:
            log.warning(f"  ✗ Tentative {attempt} échouée : {e}")
            if attempt < MAX_RETRIES:
                log.info(f"  Pause {RETRY_DELAY_SECONDS}s avant retry...")
                time.sleep(RETRY_DELAY_SECONDS)
            else:
                log.error(f"  ✗ Échec définitif après {MAX_RETRIES} tentatives")
                return False

    return False


def extract_zip(zip_path: str, destination_dir: str) -> None:
    """Extrait un fichier ZIP dans le répertoire de destination."""
    log.info(f"  Extraction ZIP : {zip_path} → {destination_dir}")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(destination_dir)
    os.remove(zip_path)
    log.info(f"  ✓ Extraction terminée")


def process_source(source: dict, base_dir: str = ".") -> Optional[str]:
    """
    Télécharge et prépare une source de données.
    """
    name = source["name"]
    url = source.get("url", "").strip()
    file_type = source.get("type", "csv")
    destination_dir = os.path.join(base_dir, source["destination"])

    if not url:
        log.warning(f"  [{name}] URL vide — ajoutez l'URL dans config_sources.py")
        return None

    filename = f"{name}.{file_type}"
    destination_path = os.path.join(destination_dir, filename)

    if os.path.exists(destination_path) and file_type != "zip":
        log.info(f"  [{name}] Déjà téléchargé — ignoré")
        return destination_path

    success = download_file(url, destination_path)
    if not success:
        return None

    if file_type == "zip":
        extract_zip(destination_path, destination_dir)
        return destination_dir

    return destination_path


def main() -> None:
    base_dir = str(Path(__file__).parent.parent)

    log.info("=" * 60)
    log.info("FakeNews Analyzer — Downloader")
    log.info("=" * 60)

    active_sources = [s for s in SOURCES if s.get("active", False)]
    inactive_sources = [s for s in SOURCES if not s.get("active", False)]

    log.info(f"Sources actives    : {len(active_sources)}")
    log.info(f"Sources inactives  : {len(inactive_sources)}")
    log.info("")

    results = {"success": [], "failed": [], "skipped": []}

    for source in SOURCES:
        name = source["name"]
        log.info(f"── {name} ──────────────────────────────────")

        if not source.get("active", False):
            log.info(f"  Ignorée (active=False)")
            results["skipped"].append(name)
            continue

        path = process_source(source, base_dir)
        if path:
            results["success"].append(name)
        else:
            results["failed"].append(name)

    log.info("")
    log.info("=" * 60)
    log.info("RAPPORT FINAL")
    log.info("=" * 60)
    log.info(f"✓ Succès   : {len(results['success'])} — {results['success']}")
    log.info(f"✗ Échoués  : {len(results['failed'])} — {results['failed']}")
    log.info(f"○ Ignorés  : {len(results['skipped'])} — {results['skipped']}")

    if results["failed"]:
        log.error("Certaines sources ont échoué. Vérifiez les URLs dans config_sources.py")
        sys.exit(1)


if __name__ == "__main__":
    main()
