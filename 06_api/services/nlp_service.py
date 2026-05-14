# ============================================================
# Fichier  : nlp_service.py
# Rôle     : Preprocessing NLP pour l'inférence en temps réel
# Version  : V1 (local)
# Projet   : FakeNews Analyzer — DevComplex
# Auteur   : DevComplex
# ============================================================
#
# Ce service applique le même pipeline de nettoyage que le
# preprocessing offline (02_preprocessing/02_cleaning.ipynb).
# Important : la cohérence train/inférence est essentielle.
#
# ============================================================

import re
import logging
from functools import lru_cache

log = logging.getLogger(__name__)

ENGLISH_STOPWORDS = frozenset([
    'the','a','an','and','or','but','in','on','at','to','for','of','with',
    'is','are','was','were','be','been','being','have','has','had','do','does',
    'did','will','would','could','should','may','might','shall','can','need',
    'i','me','my','myself','we','our','ours','ourselves','you','your','yours',
    'he','him','his','himself','she','her','hers','herself','it','its','itself',
    'they','them','their','theirs','themselves','what','which','who','whom',
    'this','that','these','those','am','if','else','each','both','few','more',
    'most','other','some','such','no','nor','not','only','own','same','so',
    'than','too','very','just','because','as','until','while','about','against',
    'between','into','through','during','before','after','above','below','from',
    'up','down','out','off','over','under','again','further','then','once','here',
    'there','when','where','why','how','all','any','both','each','every','either',
    'neither','one','two','first','last','many','much','more','most','less','least',
    'few','little','new','old','good','great','well','also','still','even','back',
    'way','its','get','make','like','know','see','look','go','come','say','think',
    'take','want','give','use','find','tell','ask','seem','feel','try','leave','call'
])

_RE_HTML    = re.compile(r'<[^>]+>')
_RE_URL     = re.compile(r'https?://\S+|www\.\S+')
_RE_MENTION = re.compile(r'[@#]\w+')
_RE_NON_AZ  = re.compile(r'[^a-z\s]')
_RE_SPACES  = re.compile(r'\s+')


def preprocess_for_inference(text: str) -> str:
    """
    Applique le même nettoyage que le preprocessing offline.
    Supprime HTML, URLs, ponctuation, stopwords, tokens courts.
    """
    if not text or not isinstance(text, str):
        return ""

    t = _RE_HTML.sub(' ', text)
    t = _RE_URL.sub(' ', t)
    t = _RE_MENTION.sub(' ', t)
    t = t.lower()
    t = _RE_NON_AZ.sub(' ', t)
    t = _RE_SPACES.sub(' ', t).strip()

    tokens = [
        tok for tok in t.split()
        if len(tok) >= 3 and tok not in ENGLISH_STOPWORDS
    ]
    return ' '.join(tokens)


def extract_nlp_features(text: str) -> dict:
    """
    Extrait les features NLP additionnelles.
    Calculées sur le texte ORIGINAL (avant nettoyage).
    """
    if not text:
        return {"word_count": 0, "sentiment_score": 0.0, "capital_ratio": 0.0}

    word_count = len(text.split())
    alpha_chars = [c for c in text if c.isalpha()]
    capital_ratio = sum(1 for c in alpha_chars if c.isupper()) / len(alpha_chars) if alpha_chars else 0.0

    sentiment_score = 0.0
    try:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        analyzer = _get_vader_analyzer()
        sentiment_score = analyzer.polarity_scores(text)["compound"]
    except ImportError:
        pass

    return {
        "word_count": word_count,
        "sentiment_score": round(sentiment_score, 3),
        "capital_ratio": round(capital_ratio, 3),
        "exclamation_count": text.count("!"),
        "question_count": text.count("?"),
    }


@lru_cache(maxsize=1)
def _get_vader_analyzer():
    """Cache le SentimentIntensityAnalyzer (initialisation coûteuse)."""
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    return SentimentIntensityAnalyzer()
