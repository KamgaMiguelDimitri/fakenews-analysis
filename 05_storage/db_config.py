# ============================================================
# Fichier  : db_config.py
# Rôle     : Configuration et connexion base de données
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================
#
# Supporte : MongoDB | CockroachDB (PostgreSQL-compatible) | mock
# Contrôlé par la variable DB_TYPE dans .env
#
# ============================================================

import logging
import os
from typing import Optional

log = logging.getLogger(__name__)


def get_db_connection():
    """
    Retourne la connexion DB selon DB_TYPE dans .env.
    Retourne None si DB_TYPE n'est pas défini (mode mock).
    """
    db_type = os.getenv("DB_TYPE", "").lower().strip()

    if not db_type:
        log.info("DB_TYPE non défini — mode mock activé (pas de persistance)")
        return None

    if db_type == "mongodb":
        return _connect_mongodb()
    elif db_type == "cockroachdb":
        return _connect_cockroachdb()
    else:
        log.warning(f"DB_TYPE inconnu : '{db_type}' — mode mock activé")
        return None


def _connect_mongodb():
    """Connexion MongoDB via pymongo."""
    try:
        import pymongo
        uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/fakenews")
        client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=3000)
        client.server_info()
        log.info("✓ MongoDB connecté")
        return client
    except Exception as e:
        log.error(f"MongoDB connexion échouée : {e}")
        return None


def _connect_cockroachdb():
    """Connexion CockroachDB via psycopg2."""
    try:
        import psycopg2
        uri = os.getenv("COCKROACHDB_URI")
        if not uri:
            log.error("COCKROACHDB_URI non défini dans .env")
            return None
        conn = psycopg2.connect(uri)
        log.info("✓ CockroachDB connecté")
        return conn
    except Exception as e:
        log.error(f"CockroachDB connexion échouée : {e}")
        return None


def init_tables(db) -> None:
    """Initialise les tables/collections si elles n'existent pas."""
    if db is None:
        return

    db_type = os.getenv("DB_TYPE", "").lower()

    if db_type == "mongodb":
        database = db["fakenews"]
        if "predictions" not in database.list_collection_names():
            database.create_collection("predictions")
            log.info("Collection MongoDB 'predictions' créée")

    elif db_type == "cockroachdb":
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id          SERIAL PRIMARY KEY,
                text        TEXT NOT NULL,
                label       VARCHAR(10) NOT NULL,
                confidence  FLOAT NOT NULL,
                model_used  VARCHAR(50),
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        db.commit()
        cursor.close()
        log.info("Table CockroachDB 'predictions' créée/vérifiée")
