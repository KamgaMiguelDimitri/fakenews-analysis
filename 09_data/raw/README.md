# 09_data/raw/ — Données brutes

Ce dossier contient les données téléchargées par les scripts d'ingestion.

## Structure réelle

```
09_data/raw/
├── kaggle/                         ← données téléchargées via Kaggle
│   ├── fake_job_postings.csv       ← 17 000 offres (label: fraudulent 0/1)
│   └── news/
│       ├── Fake.csv                ← ISOT articles fake (label ajouté auto : 1)
│       └── True.csv                ← ISOT articles réels (label ajouté auto : 0)
├── huggingface/                    ← datasets téléchargés via HuggingFace
│   ├── fake_news/
│   │   └── fake_news.csv           ← ~44 900 articles (mrm8488/fake-news)
│   └── welfake/
│       └── welfake.csv             ← 72 000 articles (davanstrien/WELFake)
├── bluesky/                        ← collecte Bluesky
│   ├── posts.json                  ← batch
│   └── stream/                     ← flux temps réel (JSONL)
└── .gitkeep
```

## Sources disponibles

| Source | Fichier | Texte | Label | Lignes |
|--------|---------|-------|-------|--------|
| ISOT Fake | `kaggle/news/Fake.csv` | `text` | ajouté auto (1) | ~23 000 |
| ISOT True | `kaggle/news/True.csv` | `text` | ajouté auto (0) | ~21 000 |
| Fake Jobs | `kaggle/fake_job_postings.csv` | `description` | `fraudulent` | ~17 000 |
| Fake News HF | `huggingface/fake_news/fake_news.csv` | `text` | `label` | ~44 900 |
| WELFake | `huggingface/welfake/welfake.csv` | `text` | `label` | ~72 000 |

## Télécharger les données manquantes

### Datasets HuggingFace (fake_news + welfake)
```bash
python 01_ingestion/ingest_huggingface.py
```

### Datasets Kaggle (si besoin de re-télécharger)
```bash
python 01_ingestion/ingest_kaggle.py
```

## Note sur les labels ISOT

`Fake.csv` et `True.csv` n'ont **pas** de colonne `label` dans le fichier brut.
`spark_utils.load_raw_sources()` ajoute automatiquement :
- `Fake.csv` → `label = 1` (FAKE)
- `True.csv` → `label = 0` (REAL)
