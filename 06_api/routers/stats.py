# ============================================================
# Fichier  : stats.py
# Rôle     : Routes /api/stats et /api/kpis
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================

from fastapi import APIRouter, Request
from ..schemas import KpiResponse

router = APIRouter()


@router.get("/kpis", response_model=KpiResponse)
async def get_kpis(request: Request) -> KpiResponse:
    """Retourne les KPIs globaux (depuis DB ou mock)."""
    stats_service = request.app.state.stats_service
    kpis = stats_service.get_kpis()
    model_service = request.app.state.model_service
    return KpiResponse(
        total_predictions=kpis.get("total_predictions", 0),
        fake_count=kpis.get("fake_count", 0),
        real_count=kpis.get("real_count", 0),
        fake_ratio=kpis.get("fake_ratio", 0.0),
        avg_confidence=kpis.get("avg_confidence", 0.0),
        model_name=model_service.model_name,
    )


@router.get("/stats/model")
async def get_model_stats(request: Request) -> dict:
    """Retourne les métriques du modèle actif."""
    model_service = request.app.state.model_service
    return model_service.get_model_info()


@router.get("/history")
async def get_history(request: Request, limit: int = 50) -> dict:
    """Retourne les N dernières prédictions."""
    stats_service = request.app.state.stats_service
    history = stats_service.get_recent_predictions(limit=limit)
    return {"predictions": history, "total": len(history)}
