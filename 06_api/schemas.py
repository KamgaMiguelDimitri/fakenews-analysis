# ============================================================
# Fichier  : schemas.py
# Rôle     : Schémas Pydantic pour l'API REST
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================

from pydantic import BaseModel, Field
from typing import Optional


class PredictRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=50_000, description="Texte à analyser")


class BatchPredictRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, max_length=100, description="Liste de textes (max 100)")


class PredictResponse(BaseModel):
    label: str                        # "FAKE" | "REAL"
    confidence: float
    fake_probability: float
    real_probability: float
    model_used: str
    processing_time_ms: float
    nlp_features: Optional[dict] = None
    _simulated: Optional[bool] = None


class BatchPredictResponse(BaseModel):
    results: list[PredictResponse]
    total: int
    processing_time_ms: float


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str
    version: str = "1.0.0"


class KpiResponse(BaseModel):
    total_predictions: int
    fake_count: int
    real_count: int
    fake_ratio: float
    avg_confidence: float
    model_name: str
