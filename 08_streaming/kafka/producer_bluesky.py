# ============================================================
# Fichier  : producer_bluesky.py
# Rôle     : Collecte Bluesky Firehose → Kafka (V2)
# Version  : V2 (scaffolded)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================
# Non actif en V1.
# ============================================================

import json
import logging
import os
from datetime import datetime

log = logging.getLogger(__name__)


def run_bluesky_producer() -> None:
    """
    Se connecte à la Bluesky Firehose via AT Protocol
    et publie les posts dans le topic Kafka raw-posts.
    Nécessite BLUESKY_HANDLE et BLUESKY_PASSWORD dans .env
    """
    try:
        from atproto import FirehoseSubscribeReposClient, parse_subscribe_repos_message
        from kafka import KafkaProducer
    except ImportError:
        log.error("Modules manquants. Installer : pip install atproto kafka-python")
        return

    from .kafka_config import KAFKA_BOOTSTRAP_SERVERS, TOPIC_RAW

    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    )

    client = FirehoseSubscribeReposClient()

    def on_message(message) -> None:
        commit = parse_subscribe_repos_message(message)
        if not hasattr(commit, "ops"):
            return
        for op in commit.ops:
            if op.action == "create" and op.path.startswith("app.bsky.feed.post"):
                record = op.record
                if hasattr(record, "text") and record.text:
                    payload = {
                        "text": record.text,
                        "did": commit.repo,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                    producer.send(TOPIC_RAW, payload)

    log.info(f"Connexion Bluesky Firehose → Kafka topic '{TOPIC_RAW}'")
    client.start(on_message)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_bluesky_producer()
