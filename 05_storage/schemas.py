# ============================================================
# Fichier  : schemas.py
# Rôle     : Schémas de données pour la persistance
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class PredictionRecord:
    """Enregistrement d'une prédiction pour la persistance DB."""
    text: str
    label: str                       # "FAKE" | "REAL"
    confidence: float
    fake_probability: float
    real_probability: float
    model_used: str
    processing_time_ms: float
    created_at: datetime = field(default_factory=datetime.utcnow)
    id: Optional[int] = None


def prediction_to_dict(record: PredictionRecord) -> dict:
    """Convertit un PredictionRecord en dict pour MongoDB/SQL."""
    return {
        "text": record.text[:500],   # Tronquer pour la DB
        "label": record.label,
        "confidence": record.confidence,
        "fake_probability": record.fake_probability,
        "real_probability": record.real_probability,
        "model_used": record.model_used,
        "processing_time_ms": record.processing_time_ms,
        "created_at": record.created_at.isoformat(),
    }
