# ============================================================
# Fichier  : predict.py
# Rôle     : Routes /api/predict et /api/predict/batch
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================

import time
import logging
from fastapi import APIRouter, Request, HTTPException
from ..schemas import PredictRequest, BatchPredictRequest, PredictResponse, BatchPredictResponse
from ..services.nlp_service import preprocess_for_inference, extract_nlp_features

log = logging.getLogger(__name__)
router = APIRouter()


@router.post("/predict", response_model=PredictResponse)
async def predict(request: Request, body: PredictRequest) -> PredictResponse:
    """Prédit si un texte est FAKE ou REAL."""
    model_service = request.app.state.model_service

    # Extraire les features NLP sur le texte brut (avant nettoyage)
    nlp_features = extract_nlp_features(body.text)

    # Nettoyer le texte comme lors de l'entraînement
    clean_text = preprocess_for_inference(body.text)
    if not clean_text:
        raise HTTPException(status_code=422, detail="Texte trop court ou vide après nettoyage")

    result = model_service.predict(clean_text)
    result["nlp_features"] = nlp_features

    return PredictResponse(**result)


@router.post("/predict/batch", response_model=BatchPredictResponse)
async def predict_batch(request: Request, body: BatchPredictRequest) -> BatchPredictResponse:
    """Prédit sur un batch de textes (max 100)."""
    model_service = request.app.state.model_service

    start = time.perf_counter()
    results = []

    for text in body.texts:
        nlp_features = extract_nlp_features(text)
        clean_text = preprocess_for_inference(text)
        if not clean_text:
            results.append(PredictResponse(
                label="REAL", confidence=0.5, fake_probability=0.5,
                real_probability=0.5, model_used="error",
                processing_time_ms=0, nlp_features=nlp_features
            ))
            continue
        result = model_service.predict(clean_text)
        result["nlp_features"] = nlp_features
        results.append(PredictResponse(**result))

    total_ms = round((time.perf_counter() - start) * 1000, 2)
    return BatchPredictResponse(results=results, total=len(results), processing_time_ms=total_ms)
