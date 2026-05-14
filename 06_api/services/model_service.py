# ============================================================
# Fichier  : model_service.py
# Rôle     : Chargement et inférence des modèles
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================

import json
import logging
import os
import time
from pathlib import Path
from typing import Optional

log = logging.getLogger(__name__)

PROJECT_ROOT  = Path(__file__).parent.parent.parent
MODELS_DIR    = PROJECT_ROOT / "04_models"
METADATA_PATH = MODELS_DIR / "metadata.json"


class ModelService:
    """
    Gère le chargement et l'inférence des modèles.
    Priorité : DistilBERT > meilleur classique > baseline LogReg > simulation
    """

    def __init__(self):
        self.model = None
        self.model_name = "none"
        self.model_type = "none"
        self.is_ready = False
        self._tfidf_vectorizer = None
        self._tokenizer = None

    def load_best_model(self) -> None:
        """Essaie de charger les modèles dans l'ordre de priorité."""
        distilbert_path = MODELS_DIR / "distilbert"
        if self._try_load_distilbert(distilbert_path):
            return

        if self._try_load_best_classical():
            return

        baseline_path = MODELS_DIR / "baseline" / "tfidf_logreg.pkl"
        if self._try_load_sklearn(baseline_path, "baseline_logreg"):
            return

        log.warning(
            "Aucun modèle disponible. Mode simulation activé.\n"
            "Pour utiliser un vrai modèle :\n"
            "  1. Exécuter les notebooks de preprocessing et modélisation\n"
            "  2. Télécharger DistilBERT depuis Colab vers 04_models/distilbert/"
        )
        self.model_name = "simulation"
        self.model_type = "simulation"
        self.is_ready = False

    def _try_load_distilbert(self, model_path: Path) -> bool:
        """Charge DistilBERT si disponible."""
        config_path = model_path / "config.json"
        if not config_path.exists():
            return False
        try:
            from transformers import DistilBertForSequenceClassification, DistilBertTokenizerFast
            self.model = DistilBertForSequenceClassification.from_pretrained(str(model_path))
            self._tokenizer = DistilBertTokenizerFast.from_pretrained(str(model_path))
            self.model.eval()
            self.model_name = "distilbert"
            self.model_type = "transformers"
            self.is_ready = True
            log.info(f"✓ DistilBERT chargé depuis {model_path}")
            return True
        except Exception as e:
            log.warning(f"DistilBERT non chargeable : {e}")
            return False

    def _try_load_best_classical(self) -> bool:
        """Charge le meilleur modèle classique sklearn disponible."""
        patterns = list((MODELS_DIR / "baseline").glob("best_classical_*.pkl"))
        if not patterns:
            return False
        return self._try_load_sklearn(patterns[0], patterns[0].stem)

    def _try_load_sklearn(self, model_path: Path, name: str) -> bool:
        """Charge un modèle sklearn + pipeline TF-IDF."""
        if not model_path.exists():
            return False
        try:
            import joblib
            self.model = joblib.load(str(model_path))
            tfidf_path = MODELS_DIR / "baseline" / "tfidf_vectorizer"
            if tfidf_path.exists():
                from .tfidf_inference import load_tfidf_pipeline
                self._tfidf_vectorizer = load_tfidf_pipeline(str(tfidf_path))
            self.model_name = name
            self.model_type = "sklearn"
            self.is_ready = True
            log.info(f"✓ Modèle sklearn chargé : {model_path}")
            return True
        except Exception as e:
            log.warning(f"Sklearn non chargeable ({model_path}) : {e}")
            return False

    def predict(self, text: str) -> dict:
        """Effectue une prédiction sur un texte nettoyé."""
        if not self.is_ready:
            return self._simulate_prediction(text)

        start = time.perf_counter()

        if self.model_type == "transformers":
            result = self._predict_transformers(text)
        elif self.model_type == "sklearn":
            result = self._predict_sklearn(text)
        else:
            result = self._simulate_prediction(text)

        result["processing_time_ms"] = round((time.perf_counter() - start) * 1000, 2)
        result["model_used"] = self.model_name
        return result

    def predict_batch(self, texts: list[str]) -> list[dict]:
        """Prédiction sur un batch de textes."""
        return [self.predict(text) for text in texts]

    def _predict_transformers(self, text: str) -> dict:
        """Inférence DistilBERT."""
        import torch
        inputs = self._tokenizer(
            text, truncation=True, max_length=256,
            padding="max_length", return_tensors="pt"
        )
        with torch.no_grad():
            logits = self.model(**inputs).logits
        probs = torch.softmax(logits, dim=-1).squeeze().tolist()
        real_prob, fake_prob = probs[0], probs[1]
        label = "FAKE" if fake_prob > real_prob else "REAL"
        return {
            "label": label,
            "confidence": round(max(fake_prob, real_prob), 4),
            "fake_probability": round(fake_prob, 4),
            "real_probability": round(real_prob, 4),
        }

    def _predict_sklearn(self, text: str) -> dict:
        """Inférence sklearn (LogReg / SVM / etc.)."""
        if self._tfidf_vectorizer:
            X = self._tfidf_vectorizer.transform([text])
        else:
            import scipy.sparse as sp
            log.warning("TF-IDF Spark non disponible — utilisation d'un vecteur vide")
            X = sp.csr_matrix((1, 50_000))

        proba = self.model.predict_proba(X)[0]
        real_prob, fake_prob = float(proba[0]), float(proba[1])
        label = "FAKE" if fake_prob > real_prob else "REAL"
        return {
            "label": label,
            "confidence": round(max(fake_prob, real_prob), 4),
            "fake_probability": round(fake_prob, 4),
            "real_probability": round(real_prob, 4),
        }

    def _simulate_prediction(self, text: str) -> dict:
        """Mode simulation : résultats reproductibles via hash MD5."""
        import hashlib
        import random
        seed = int(hashlib.md5(text.encode()).hexdigest()[:8], 16)
        rng = random.Random(seed)
        fake_prob = round(rng.uniform(0.1, 0.9), 4)
        real_prob = round(1.0 - fake_prob, 4)
        label = "FAKE" if fake_prob > 0.5 else "REAL"
        return {
            "label": label,
            "confidence": round(max(fake_prob, real_prob), 4),
            "fake_probability": fake_prob,
            "real_probability": real_prob,
            "_simulated": True,
        }

    def get_model_info(self) -> dict:
        """Retourne les informations sur le modèle actif."""
        metadata = {}
        if METADATA_PATH.exists():
            with open(METADATA_PATH) as f:
                metadata = json.load(f)
        model_meta = metadata.get(self.model_name, {})
        return {
            "model_name": self.model_name,
            "model_type": self.model_type,
            "is_ready": self.is_ready,
            "accuracy": model_meta.get("accuracy"),
            "f1_score": model_meta.get("f1_score"),
            "auc_roc": model_meta.get("auc_roc"),
            "trained_at": model_meta.get("trained_at"),
        }
