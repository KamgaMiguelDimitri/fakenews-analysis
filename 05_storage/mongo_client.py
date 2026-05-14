# ============================================================
# Fichier  : mongo_client.py
# Rôle     : Opérations CRUD MongoDB
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================

import logging
import os
from typing import Optional
from .schemas import PredictionRecord, prediction_to_dict

log = logging.getLogger(__name__)


def save_prediction(client, record: PredictionRecord) -> Optional[str]:
    """Sauvegarde une prédiction en MongoDB. Retourne l'ID inséré."""
    if client is None:
        return None
    try:
        db = client["fakenews"]
        result = db["predictions"].insert_one(prediction_to_dict(record))
        return str(result.inserted_id)
    except Exception as e:
        log.error(f"Erreur MongoDB insert : {e}")
        return None


def get_recent_predictions(client, limit: int = 50) -> list[dict]:
    """Récupère les N dernières prédictions."""
    if client is None:
        return []
    try:
        db = client["fakenews"]
        cursor = db["predictions"].find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
        return list(cursor)
    except Exception as e:
        log.error(f"Erreur MongoDB find : {e}")
        return []


def get_kpis(client) -> dict:
    """Calcule les KPIs depuis MongoDB."""
    if client is None:
        return {}
    try:
        db = client["fakenews"]
        total = db["predictions"].count_documents({})
        fake_count = db["predictions"].count_documents({"label": "FAKE"})
        real_count = db["predictions"].count_documents({"label": "REAL"})
        pipeline = [{"$group": {"_id": None, "avg_confidence": {"$avg": "$confidence"}}}]
        avg_result = list(db["predictions"].aggregate(pipeline))
        avg_confidence = avg_result[0]["avg_confidence"] if avg_result else 0.0
        return {
            "total_predictions": total,
            "fake_count": fake_count,
            "real_count": real_count,
            "fake_ratio": round(fake_count / total * 100, 1) if total > 0 else 0,
            "avg_confidence": round(avg_confidence, 3),
        }
    except Exception as e:
        log.error(f"Erreur MongoDB KPIs : {e}")
        return {}
