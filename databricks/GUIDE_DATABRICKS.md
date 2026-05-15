# Guide Databricks — FakeNews Analyzer

---

## Données à envoyer sur Databricks

Avant de lancer quoi que ce soit, uploader ces fichiers sur DBFS.

### Structure cible sur DBFS

```
dbfs:/FileStore/fakenews/raw/
├── kaggle/
│   ├── news/
│   │   ├── Fake.csv
│   │   └── True.csv
│   └── fake_job_postings.csv
└── huggingface/
    ├── fake_news/
    │   └── fake_news.csv
    └── welfake/
        └── welfake.csv
```

### Comment uploader

**Option A — Interface Databricks (recommandé)**

1. Dans Databricks → **Data** (icône base de données, colonne gauche)
2. Cliquer **Add data** → **Upload files**
3. Glisser-déposer chaque CSV
4. Databricks indique le chemin DBFS automatiquement

**Option B — Databricks CLI (si installée)**

```bash
# Installer si besoin
pip install databricks-cli
databricks configure --token
# (entrer l'URL de votre workspace + Personal Access Token)

# Créer les dossiers
databricks fs mkdirs dbfs:/FileStore/fakenews/raw/kaggle/news
databricks fs mkdirs dbfs:/FileStore/fakenews/raw/kaggle
databricks fs mkdirs dbfs:/FileStore/fakenews/raw/huggingface/fake_news
databricks fs mkdirs dbfs:/FileStore/fakenews/raw/huggingface/welfake

# Uploader
databricks fs cp 09_data/raw/kaggle/news/Fake.csv               dbfs:/FileStore/fakenews/raw/kaggle/news/Fake.csv
databricks fs cp 09_data/raw/kaggle/news/True.csv               dbfs:/FileStore/fakenews/raw/kaggle/news/True.csv
databricks fs cp 09_data/raw/kaggle/fake_job_postings.csv       dbfs:/FileStore/fakenews/raw/kaggle/fake_job_postings.csv
databricks fs cp 09_data/raw/huggingface/fake_news/fake_news.csv dbfs:/FileStore/fakenews/raw/huggingface/fake_news/fake_news.csv
databricks fs cp 09_data/raw/huggingface/welfake/welfake.csv     dbfs:/FileStore/fakenews/raw/huggingface/welfake/welfake.csv

# Vérifier
databricks fs ls dbfs:/FileStore/fakenews/raw/kaggle/news
```

---

## Étape 1 — Configurer le cluster

1. Aller dans **Compute** → votre cluster → **Edit**
2. Vérifier le runtime : **Databricks Runtime 13.x ML** (ou 14.x ML)
   - "ML" est important : inclut scikit-learn, pandas, matplotlib, scipy
3. Dans l'onglet **Libraries** → **Install New** → installer :
   | Type | Nom |
   |------|-----|
   | PyPI | `wordcloud` |
   | PyPI | `vaderSentiment` |
   | PyPI | `xgboost` |

---

## Étape 2 — Copier les notebooks dans Databricks Repos

Votre repo GitHub est déjà lié à Databricks Repos. Faites un **Pull** pour récupérer le dossier `databricks/` que vous venez d'ajouter :

1. Dans Databricks → **Repos** → votre repo `fakenews-analyzer`
2. Cliquer les **...** → **Pull**
3. Vous verrez apparaître le dossier `databricks/` avec les 7 notebooks

---

## Étape 3 — Exécuter les notebooks dans l'ordre

Ouvrir chaque notebook, cliquer **Connect** (sélectionner votre cluster), puis **Run All**.

| # | Notebook | Durée estimée | Produit |
|---|----------|---------------|---------|
| 1 | `01_exploration_db` | 10–15 min | Rapports qualité sur DBFS |
| 2 | `02_cleaning_db` | 15–25 min | `cleaned_*.parquet` sur DBFS |
| 3 | `03_unification_db` | 10–15 min | `unified/train/test.parquet` sur DBFS |
| 4 | `04_feature_engineering_db` | 20–30 min | `colab_exports/` sur DBFS |
| 5 | `05_baseline_tfidf_db` | 5–10 min | `tfidf_logreg.pkl` sur DBFS |
| 6 | `06_nlp_classical_db` | 15–20 min | `best_classical_*.pkl` sur DBFS |
| 7 | `07_evaluation_db` | 2–5 min | `final_report.json` sur DBFS |

---

## Étape 4 — Récupérer les fichiers pour continuer en local

Après l'exécution sur Databricks, télécharger les fichiers nécessaires pour :
- Continuer avec **Google Colab** (DistilBERT)
- Lancer l'**API FastAPI** en local

### Ce dont Google Colab a besoin

Depuis Databricks → **Data** → naviguer dans DBFS jusqu'à `/FileStore/fakenews/colab_exports/` et télécharger :

```
train_texts.csv       ← textes pour DistilBERT
test_texts.csv
train_features.npz    ← features TF-IDF (optionnel pour Colab)
test_features.npz
train_labels.npy
test_labels.npy
```

### Ce dont l'API locale a besoin

Télécharger depuis `/FileStore/fakenews/models/baseline/` vers votre dossier local `04_models/baseline/` :

```
tfidf_logreg.pkl
best_classical_<nom>.pkl
metadata.json
```

**Via CLI :**
```bash
databricks fs cp dbfs:/FileStore/fakenews/models/baseline/tfidf_logreg.pkl 04_models/baseline/tfidf_logreg.pkl
databricks fs cp dbfs:/FileStore/fakenews/models/baseline/ 04_models/baseline/ --recursive
databricks fs cp dbfs:/FileStore/fakenews/models/metadata.json 04_models/metadata.json
```

---

## Récapitulatif des chemins DBFS

| Contenu | Chemin DBFS |
|---------|-------------|
| CSV bruts | `dbfs:/FileStore/fakenews/raw/` |
| Parquets nettoyés | `dbfs:/FileStore/fakenews/processed/` |
| Modèles entraînés | `dbfs:/FileStore/fakenews/models/` |
| Exports pour Colab | `dbfs:/FileStore/fakenews/colab_exports/` |
| Rapports / graphes | `dbfs:/FileStore/fakenews/reports/` |

---

## Différences clés avec les notebooks locaux

| Local | Databricks |
|-------|-----------|
| `get_spark_session()` requis | `spark` déjà disponible |
| `sys.path.insert(0, '..')` | résolution via `dbutils.notebookPath()` |
| `../09_data/raw` | `/dbfs/FileStore/fakenews/raw` |
| `spark.stop()` en fin | jamais appeler `spark.stop()` |
| `.show()` | `display()` (plus lisible) |
| `glob.glob` | `dbutils.fs.ls()` |
| `spark.stop()` | interdit — arrêterait le cluster |
