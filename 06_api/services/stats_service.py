# ============================================================
# Fichier  : stats_service.py
# Rôle     : Agrégation des statistiques et KPIs
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================

import logging
import os
from typing import Optional

log = logging.getLogger(__name__)


class StatsService:
    """
    Gère les statistiques et KPIs.
    Fonctionne en mode mock si aucune DB n'est configurée.
    """

    def __init__(self, db=None):
        self.db = db
        self.db_type = os.getenv("DB_TYPE", "").lower()
        self._mock_counter = 0

    def get_kpis(self) -> dict:
        """Retourne les KPIs. Mode mock si pas de DB."""
        if self.db is None:
            return self._mock_kpis()

        try:
            if self.db_type == "mongodb":
                from ..storage.mongo_client import get_kpis
                return get_kpis(self.db)
            return self._mock_kpis()
        except Exception as e:
            log.error(f"Erreur KPIs : {e}")
            return self._mock_kpis()

    def get_recent_predictions(self, limit: int = 50) -> list[dict]:
        """Retourne les N dernières prédictions."""
        if self.db is None:
            return []

        try:
            if self.db_type == "mongodb":
                from ..storage.mongo_client import get_recent_predictions
                return get_recent_predictions(self.db, limit)
            return []
        except Exception as e:
            log.error(f"Erreur historique : {e}")
            return []

    def _mock_kpis(self) -> dict:
        """KPIs de démonstration pour le développement frontend."""
        return {
            "total_predictions": 1247,
            "fake_count": 523,
            "real_count": 724,
            "fake_ratio": 41.9,
            "avg_confidence": 0.847,
        }
