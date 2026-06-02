"""
Motor de recomendaciones de prevención (USPSTF) — in-process.

Port directo del servicio externo `prevention-task-force-api` (api/filtering.py,
api/bmi.py, api/routes/recommendations.py) para que OMV3 sea all-in-one: no
necesita un segundo servicio corriendo en producción. La data (142
recomendaciones específicas) se versiona junto al código en `uspstf_data.json`.

El proxy en routes.py sigue soportando un `PREVENTION_API_URL` externo como
override opcional; si no está seteado, se usa este motor.

Fuente de datos: U.S. Preventive Services Task Force (USPSTF).
"""

import json
import os
from pathlib import Path

_DATA_PATH = Path(
    os.environ.get(
        'USPSTF_DATA_PATH',
        str(Path(__file__).resolve().parent / 'uspstf_data.json'),
    )
)

_cache = None


def load_recommendations():
    """Lista `specificRecommendations` del dataset USPSTF (cacheada)."""
    global _cache
    if _cache is None:
        with _DATA_PATH.open('r', encoding='utf-8') as f:
            data = json.load(f)
        _cache = data.get('specificRecommendations', [])
    return _cache


def reset_cache():
    global _cache
    _cache = None


def calculate_bmi(weight_kg, height_cm):
    """BMI + categoría (mismos umbrales que el servicio externo)."""
    height_m = height_cm / 100.0
    if height_m <= 0:
        return None
    bmi = round(weight_kg / (height_m * height_m), 1)
    if bmi <= 18.5:
        return {'value': bmi, 'abbr': 'UW', 'display': 'Underweight', 'categories': ['UW']}
    if bmi <= 25:
        return {'value': bmi, 'abbr': 'N', 'display': 'Normal', 'categories': ['N']}
    if bmi < 30:
        return {'value': bmi, 'abbr': 'O', 'display': 'Overweight', 'categories': ['N', 'O']}
    return {'value': bmi, 'abbr': 'OB', 'display': 'Obese', 'categories': ['N', 'O', 'OB']}


def _matches(rec, p, bmi):
    grades = p.get('grades')
    if grades and rec.get('grade') not in grades:
        return False

    rec_bmi = rec.get('bmi')
    if rec_bmi and bmi is not None and rec_bmi not in bmi['categories']:
        return False

    age_range = rec.get('ageRange') or [0, 120]
    age_min, age_max = age_range[0], age_range[1]
    if not (age_min <= p['age'] <= age_max):
        return False

    rec_sex = rec.get('sex')
    if rec_sex != p['sex'] and rec_sex != 'men and women':
        return False

    risk_name = rec.get('riskName') or ''
    if p['sex'] == 'male' and risk_name == 'Pregnant':
        return False
    if not p.get('pregnant') and risk_name == 'Pregnant':
        return False
    if not p.get('tobacco') and risk_name == 'Tobacco user':
        return False
    if not p.get('sexuallyActive') and risk_name == 'Sexually Active':
        return False

    kw = (p.get('keywords') or '').lower().strip()
    if kw:
        haystack = (rec.get('title', '') + ' ' + rec.get('text', '')).lower()
        if kw not in haystack:
            return False

    return True


def filter_recommendations(patient, recommendations, bmi=None):
    return [r for r in recommendations if _matches(r, patient, bmi)]


def recommend(payload):
    """Replica la respuesta del endpoint externo POST /api/v1/recommendations.

    payload: dict con age, sex, tobacco, sexuallyActive, pregnant?, heightCm?,
             weightKg?, keywords?, grades?
    Devuelve: {patient: {bmi, bmiCategory}, count, recommendations}
    """
    recs = load_recommendations()
    bmi = None
    h = payload.get('heightCm')
    w = payload.get('weightKg')
    if h and w:
        bmi = calculate_bmi(float(w), float(h))
    matches = filter_recommendations(payload, recs, bmi)
    return {
        'patient': {
            'bmi': bmi['value'] if bmi else None,
            'bmiCategory': bmi['display'] if bmi else None,
        },
        'count': len(matches),
        'recommendations': matches,
    }
