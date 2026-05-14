# ============================================================
# Fichier  : kafka_config.py
# Rôle     : Configuration Kafka pour le streaming V2
# Version  : V2 (scaffolded)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================
# Non actif en V1. Prévu pour la V2 avec Bluesky Firehose.
# ============================================================

import os

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC_RAW         = os.getenv("KAFKA_TOPIC_RAW", "raw-posts")
TOPIC_CLEANED     = os.getenv("KAFKA_TOPIC_CLEANED", "cleaned-posts")
TOPIC_PREDICTIONS = os.getenv("KAFKA_TOPIC_PREDICTIONS", "predictions")

PRODUCER_CONFIG = {
    "bootstrap.servers": KAFKA_BOOTSTRAP_SERVERS,
    "acks": "1",
    "retries": 3,
}

CONSUMER_CONFIG = {
    "bootstrap.servers": KAFKA_BOOTSTRAP_SERVERS,
    "group.id": "fakenews-consumer",
    "auto.offset.reset": "earliest",
}
