# ============================================================
# Fichier  : health.py
# Rôle     : Route /api/health
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================

from fastapi import APIRouter, Request
from ..schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request) -> HealthResponse:
    """Vérifie l'état de l'API et du modèle chargé."""
    model_service = request.app.state.model_service
    return HealthResponse(
        status="ok",
        model_loaded=model_service.is_ready,
        model_name=model_service.model_name,
    )
