# ============================================================
# Fichier  : config_sources.py
# Rôle     : Configuration centrale des sources de données
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================
#
# C'est LE seul fichier à modifier pour ajouter ou désactiver
# une source de données. Aucun autre fichier n'est à toucher.
#
# Pour ajouter une source :
#   1. Ajouter une entrée dans SOURCES (lien direct) ou HF_SOURCES (HuggingFace)
#   2. Mettre active=True
#   3. Lancer : python 01_ingestion/downloader.py
#
# ============================================================

# ── Sources téléchargeables via lien direct ──────────────────
SOURCES: list[dict] = [
    {
        "name": "isot_fake",
        # ↓ Remplacer par le lien direct vers Fake.csv si besoin de re-télécharger
        "url": "",
        "type": "csv",
        "destination": "09_data/raw/kaggle/news/",   # ← structure réelle du projet
        "label_column": None,                         # ISOT n'a pas de colonne label
        "fixed_label": 1,                             # Fake.csv → tous FAKE (1)
        "text_column": "text",
        "label_mapping": {},
        "active": False,                              # Déjà présent — pas besoin de re-télécharger
        "description": "ISOT Fake News Dataset — articles Fake (déjà dans kaggle/news/)"
    },
    {
        "name": "isot_true",
        "url": "",
        "type": "csv",
        "destination": "09_data/raw/kaggle/news/",   # ← structure réelle du projet
        "label_column": None,
        "fixed_label": 0,                             # True.csv → tous REAL (0)
        "text_column": "text",
        "label_mapping": {},
        "active": False,                              # Déjà présent — pas besoin de re-télécharger
        "description": "ISOT Fake News Dataset — articles True (déjà dans kaggle/news/)"
    },
    {
        "name": "fake_jobs",
        "url": "",
        "type": "csv",
        "destination": "09_data/raw/kaggle/",        # ← structure réelle du projet
        "label_column": "fraudulent",
        "text_column": "description",
        "label_mapping": {0: 0, 1: 1},
        "active": False,                              # Déjà présent — pas besoin de re-télécharger
        "description": "Fake Job Postings — offres d'emploi frauduleuses (déjà dans kaggle/)"
    },
    # ── Exemple structure pour un ZIP ────────────────────────
    # {
    #     "name": "fakenewsnet",
    #     "url": "https://example.com/fakenewsnet.zip",
    #     "type": "zip",
    #     "destination": "09_data/raw/kaggle/",
    #     "label_column": "label",
    #     "text_column": "news_content",
    #     "label_mapping": {"fake": 1, "real": 0},
    #     "active": False,
    #     "description": "FakeNewsNet dataset — GossipCop + PolitiFact"
    # },
]

# ── Sources HuggingFace (téléchargées via la lib datasets) ───
HF_SOURCES: list[dict] = [
    {
        "name": "fake_news",
        "hf_path": "mrm8488/fake-news",
        "text_field": "text",
        "label_field": "label",
        # LIAR a 6 classes → on binarise : 0=crédible, 1=non-crédible
        "label_mapping": {
            1: 1,
            0: 0,
        },
        "fixed_label": None,
        "active": True,
        "description": "LIAR dataset — 44 900 déclarations politiques étiquetées"
    },
    {
        "name": "welfake",
        "hf_path": "davanstrien/WELFake",
        "text_field": "text",
        "label_field": "label",
        # WELFake : 0=FAKE, 1=REAL (déjà binaire)
        "label_mapping": {0: 0, 1: 1},
        "fixed_label": None,
        "active": True,
        "description": "WELFake — 72 000 articles (Kaggle+McIntire+Reuters+BuzzFeed)"
    },
    {
        "name": "covid_fake",
        "hf_path": "nanyy1025/covid_fake_news",
        "text_field": "tweet",
        "label_field": "label",
        "label_mapping": {"real": 1, "fake": 0},  # Inversé pour que 1=crédible, 0=non-crédible
        "fixed_label": None,
        "active": False,                    # Désactivé par défaut — volume limité
        "description": "Covid fake news tweets — optionnel"
    },
]
