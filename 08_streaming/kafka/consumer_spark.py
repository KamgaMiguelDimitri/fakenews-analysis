# ============================================================
# Fichier  : consumer_spark.py
# Rôle     : Spark Structured Streaming depuis Kafka (V2)
# Version  : V2 (scaffolded)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================
# Non actif en V1.
# ============================================================

import logging

log = logging.getLogger(__name__)


def run_spark_consumer() -> None:
    """
    Consomme le topic Kafka cleaned-posts via Spark Structured Streaming
    et écrit les prédictions dans le topic predictions.
    """
    from pyspark.sql import SparkSession
    from pyspark.sql import functions as F
    from pyspark.sql.types import StringType, StructType, StructField
    from .kafka_config import KAFKA_BOOTSTRAP_SERVERS, TOPIC_CLEANED, TOPIC_PREDICTIONS

    spark = (
        SparkSession.builder
        .appName("FakeNews-KafkaConsumer")
        .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1")
        .getOrCreate()
    )

    schema = StructType([
        StructField("text", StringType()),
        StructField("timestamp", StringType()),
    ])

    stream = (
        spark.readStream
        .format("kafka")
        .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP_SERVERS)
        .option("subscribe", TOPIC_CLEANED)
        .load()
        .selectExpr("CAST(value AS STRING) as json_value")
        .select(F.from_json("json_value", schema).alias("data"))
        .select("data.*")
    )

    query = (
        stream.writeStream
        .format("console")
        .outputMode("append")
        .start()
    )

    query.awaitTermination()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_spark_consumer()
