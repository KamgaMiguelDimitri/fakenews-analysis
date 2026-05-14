# ============================================================
# Fichier  : stream_pipeline.py
# Rôle     : Pipeline de streaming Spark Structured Streaming (V2)
# Version  : V2 (scaffolded)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================
# Non actif en V1.
# ============================================================

import logging

log = logging.getLogger(__name__)


def build_streaming_pipeline(spark, input_path: str, checkpoint_path: str):
    """
    Construit un pipeline Spark Structured Streaming
    qui lit des fichiers JSONL depuis input_path
    (simule le flux Bluesky en V1).
    """
    from pyspark.sql import functions as F
    from pyspark.sql.types import StringType, StructType, StructField

    schema = StructType([
        StructField("text", StringType()),
        StructField("did", StringType()),
        StructField("timestamp", StringType()),
    ])

    stream = (
        spark.readStream
        .schema(schema)
        .json(input_path)
    )

    cleaned = stream.withColumn(
        "clean_text",
        F.regexp_replace(F.lower(F.col("text")), r"[^a-z\s]", " ")
    )

    query = (
        cleaned.writeStream
        .format("parquet")
        .option("checkpointLocation", checkpoint_path)
        .option("path", "09_data/processed/streaming/")
        .outputMode("append")
        .start()
    )

    return query
