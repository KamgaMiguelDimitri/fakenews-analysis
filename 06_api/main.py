# ============================================================
# Fichier  : main.py
# Rôle     : Point d'entrée FastAPI — FakeNews Analyzer API
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================
#
# Lancement :
#   cd 06_api && uvicorn main:app --reload --port 8000
#
# ============================================================

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .routers import health, predict, stats
from .services.model_service import ModelService
from .services.stats_service import StatsService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("fakenews.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialisation au démarrage, nettoyage à l'arrêt."""
    log.info("=" * 50)
    log.info("FakeNews Analyzer API — Démarrage")
    log.info("=" * 50)

    # Chargement du modèle
    model_service = ModelService()
    model_service.load_best_model()
    app.state.model_service = model_service

    # Connexion DB (optionnel)
    try:
        from ..storage.db_config import get_db_connection, init_tables
        db = get_db_connection()
        if db:
            init_tables(db)
        app.state.db = db
    except Exception:
        app.state.db = None

    # Service de stats
    app.state.stats_service = StatsService(db=getattr(app.state, "db", None))

    log.info(f"Modèle actif : {model_service.model_name} (prêt: {model_service.is_ready})")
    log.info("API prête")

    yield

    log.info("Arrêt de l'API")


app = FastAPI(
    title="FakeNews Analyzer API",
    description="API de détection de fake news — FakeNews Analyzer V1",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — autorise le frontend Next.js en développement
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware de logging avec durée."""
    start = time.perf_counter()
    response = await call_next(request)
    duration = round((time.perf_counter() - start) * 1000, 2)
    log.info(f"{request.method} {request.url.path} → {response.status_code} ({duration}ms)")
    return response


# Inclusion des routeurs
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(predict.router, prefix="/api", tags=["predict"])
app.include_router(stats.router, prefix="/api", tags=["stats"])


@app.get("/")
async def root():
    return {"message": "FakeNews Analyzer API", "version": "1.0.0", "docs": "/docs"}
