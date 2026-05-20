# ============================================================
# Fichier  : spark_utils.py
# Rôle     : Fonctions Spark réutilisables par tous les notebooks
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================
#
# Adapté depuis fake-detection-spark/spark/session.py et preprocessing.py
# Toutes les fonctions sont importables depuis les notebooks :
#   from spark_utils import get_spark_session, load_raw_sources, ...
#
# ============================================================

import logging
import os
from typing import Optional

log = logging.getLogger(__name__)


def get_spark_session(app_name: str = "FakeNewsAnalyzer", memory: str = "8g"):
    """
    Crée une SparkSession locale optimisée pour le preprocessing V1.

    Args:
        app_name : nom de l'application Spark
        memory   : mémoire allouée au driver (ex: '4g', '8g', '16g')

    Returns:
        SparkSession configurée
    """
    # SPARK_HOME global (ex: Spark 4.x) entrerait en conflit avec PySpark 3.5.1 pip.
    # On le supprime pour forcer l'utilisation des JARs embarqués dans le package pip.
    os.environ.pop("SPARK_HOME", None)
    os.environ.pop("SPARK_DIST_CLASSPATH", None)

    # Java 17 est requis — Java 21 cause des incompatibilités de modules avec PySpark 3.5.x.
    # On force JAVA_HOME vers JDK 17 si disponible.
    java17_path = r"C:\Program Files\Java\jdk-17"
    if os.path.isdir(java17_path):
        os.environ["JAVA_HOME"] = java17_path
        os.environ["PATH"] = (
            os.path.join(java17_path, "bin") + os.pathsep + os.environ.get("PATH", "")
        )

    # Forcer Spark à utiliser le même Python que le process courant (venv actif).
    # Sans ça, le JVM lance un worker Python depuis le PATH système → socket timeout.
    import sys
    os.environ["PYSPARK_PYTHON"] = sys.executable
    os.environ["PYSPARK_DRIVER_PYTHON"] = sys.executable

    from pyspark.sql import SparkSession

    spark = (
        SparkSession.builder
        .appName(app_name)
        .master("local[*]")
        # Mémoire driver — à ajuster selon votre machine
        .config("spark.driver.memory", memory)
        # Réduire le nombre de partitions shuffle pour les petits volumes V1
        .config("spark.sql.shuffle.partitions", "100")
        # Désactiver les logs verbeux de Spark
        .config("spark.ui.showConsoleProgress", "false")
        # Améliore les performances sur les petits datasets locaux
        .config("spark.sql.adaptive.enabled", "true")
        .getOrCreate()
    )

    # Supprimer les logs INFO/WARN de Spark (trop verbeux dans les notebooks)
    spark.sparkContext.setLogLevel("ERROR")

    log.info(f"SparkSession créée : {app_name} | Driver memory : {memory}")
    return spark


def load_raw_sources(spark, raw_dir: str) -> dict:
    """
    Scanne raw_dir récursivement et charge chaque CSV comme une source distincte.
    Le nom de source = stem du fichier (ex: Fake.csv → "isot_fake").

    Structure attendue :
        raw/kaggle/news/Fake.csv         → source "isot_fake"  (label=1 ajouté)
        raw/kaggle/news/True.csv         → source "isot_true"  (label=0 ajouté)
        raw/kaggle/fake_job_postings.csv → source "fake_jobs"
        raw/huggingface/liar/liar.csv    → source "liar"
        raw/huggingface/welfake/welfake.csv → source "welfake"

    Args:
        spark   : SparkSession active
        raw_dir : chemin vers 09_data/raw/

    Returns:
        Dict {nom_source: DataFrame} pour les sources trouvées
    """
    from pyspark.sql import functions as F

    # Alias de noms de fichiers → nom de source lisible
    STEM_ALIASES: dict[str, str] = {
        "fake":              "isot_fake",
        "true":              "isot_true",
        "fake_job_postings": "fake_jobs",
    }

    # Pour les fichiers sans colonne label : ajouter un label fixe basé sur le stem
    FIXED_LABELS: dict[str, int] = {
        "fake": 1,   # Fake.csv du dataset ISOT → articles frauduleux
        "true": 0,   # True.csv du dataset ISOT → articles légitimes
    }

    sources: dict = {}

    if not os.path.exists(raw_dir):
        log.warning(f"Répertoire introuvable : {raw_dir}")
        return sources

    for root, dirs, files in os.walk(raw_dir):
        # Ne pas descendre dans le dossier stream/ (données Bluesky brutes)
        dirs[:] = [d for d in sorted(dirs) if d != "stream"]

        csv_files = [f for f in files if f.lower().endswith(".csv")]

        for filename in csv_files:
            filepath = os.path.join(root, filename)
            stem = os.path.splitext(filename)[0].lower()
            source_name = STEM_ALIASES.get(stem, stem)

            try:
                df = (
                    spark.read
                    .option("header", "true")
                    .option("escape", '"')
                    .option("multiLine", "true")
                    .option("encoding", "UTF-8")
                    .csv(filepath)
                )

                # Ajouter label fixe pour les fichiers ISOT (pas de colonne label)
                cols_lower = [c.lower() for c in df.columns]
                if stem in FIXED_LABELS and "label" not in cols_lower:
                    df = df.withColumn("label", F.lit(FIXED_LABELS[stem]).cast("integer"))

                sources[source_name] = df
                log.info(f"Source chargée : {source_name} ({filename}) — colonnes : {df.columns}")

            except Exception as e:
                log.warning(f"Erreur chargement {filepath} : {e}")

    if not sources:
        log.warning(f"Aucun CSV trouvé dans {raw_dir}")

    return sources


def show_label_distribution(df, label_col: str = "label") -> None:
    """
    Affiche la distribution des labels avec pourcentages.
    Fonctionne avec les labels 0/1 (int) et string.
    """
    from pyspark.sql import functions as F

    total = df.count()
    if total == 0:
        print("DataFrame vide — pas de distribution à afficher")
        return

    dist = (
        df.groupBy(label_col)
        .count()
        .withColumn("pourcentage", F.round(F.col("count") / total * 100, 2))
        .orderBy(label_col)
    )

    print(f"\nDistribution des labels (total : {total:,})")
    print("-" * 40)
    dist.show(truncate=False)


def save_parquet(df, path: str, overwrite: bool = True) -> None:
    """Sauvegarde un Spark DataFrame en format Parquet."""
    mode = "overwrite" if overwrite else "error"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    df.write.mode(mode).parquet(path)
    log.info(f"Parquet sauvegardé : {path}")
    print(f"✓ Sauvegardé : {path}")


def load_parquet(spark, path: str):
    """Charge un Parquet avec vérification d'existence."""
    if not os.path.exists(path):
        log.warning(f"Parquet introuvable : {path}")
        return None
    df = spark.read.parquet(path)
    log.info(f"Parquet chargé : {path} — {df.count()} lignes")
    return df


def stratified_split(df, label_col: str = "label", test_size: float = 0.2, seed: int = 42) -> tuple:
    """
    Effectue un split train/test stratifié par label.
    Garantit des proportions FAKE/REAL similaires dans les deux splits.
    """
    from pyspark.sql import functions as F

    labels = [row[label_col] for row in df.select(label_col).distinct().collect()]
    train_parts, test_parts = [], []

    for label in labels:
        subset = df.filter(F.col(label_col) == label)
        train_sub, test_sub = subset.randomSplit([1 - test_size, test_size], seed=seed)
        train_parts.append(train_sub)
        test_parts.append(test_sub)

    train_df = train_parts[0]
    test_df = test_parts[0]
    for t, v in zip(train_parts[1:], test_parts[1:]):
        train_df = train_df.union(t)
        test_df = test_df.union(v)

    log.info(f"Split stratifié : train={train_df.count()} | test={test_df.count()}")
    return train_df, test_df


def check_class_balance(df, label_col: str = "label", min_minority_ratio: float = 0.35) -> None:
    """
    Vérifie l'équilibre des classes et affiche un warning si déséquilibré.
    """
    from pyspark.sql import functions as F

    total = df.count()
    counts = df.groupBy(label_col).count().collect()
    counts_dict = {row[label_col]: row["count"] for row in counts}

    for label, count in counts_dict.items():
        ratio = count / total
        label_name = "FAKE" if label == 1 else "REAL"
        if ratio < min_minority_ratio:
            print(
                f"\n⚠️  DÉSÉQUILIBRE DÉTECTÉ : {label_name} = {ratio*100:.1f}% "
                f"(seuil : {min_minority_ratio*100:.0f}%)\n"
                f"   Recommandation : utiliser class_weight='balanced' ou oversampling\n"
            )
