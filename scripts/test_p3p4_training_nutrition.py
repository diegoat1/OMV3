"""
Tests funcionales P3 (Fitbod) + P4 (Fitia) del roadmap de paridad.

P3: recuperación muscular, alternativas de ejercicio, predicción de sesiones.
P4: flags de optimizador (is_not_divisible -> porciones enteras en solve_meal),
    Rechange (equivalencias por macros).

Requiere backend en :8000 (python src/main.py).
    python scripts/test_p3p4_training_nutrition.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import requests
from qa_helpers import mint_token, BASE

H = {'Authorization': f'Bearer {mint_token()}'}
_results = []


def check(label, ok, detail=''):
    _results.append(ok)
    print(f'[{"OK" if ok else "FAIL"}] {label}' + (f' — {detail}' if detail else ''))


def main():
    # ── P3: alternativas de ejercicio ──
    r = requests.get(f'{BASE}/training/exercises/backSquat/alternatives', headers=H, timeout=10)
    d = r.json().get('data', {})
    alt_keys = [a['key'] for a in d.get('alternatives', [])]
    check('alternativas backSquat (200 + comparten músculo)',
          r.status_code == 200 and 'frontSquat' in alt_keys, f'{alt_keys[:4]}')
    r = requests.get(f'{BASE}/training/exercises/__nope__/alternatives', headers=H, timeout=10)
    check('alternativas inexistente -> 404', r.status_code == 404)

    # ── P3: recuperación muscular (smoke: responde 200 con estructura) ──
    r = requests.get(f'{BASE}/training/recovery', headers=H, params={'user': 'SaiyanKiwi'}, timeout=10)
    check('recovery 200 + estructura', r.status_code == 200 and 'muscles' in r.json().get('data', {}))

    # ── P3/P5: predicción de próximas sesiones (smoke) ──
    r = requests.get(f'{BASE}/training/sessions/predict', headers=H, params={'user': 'SaiyanKiwi', 'num': 3}, timeout=10)
    check('predict 200 + estructura', r.status_code == 200 and 'predicciones' in r.json().get('data', {}))

    # ── P4: solve-meal honra is_not_divisible (porciones enteras) ──
    body = {
        'objetivo': {'proteina': 30, 'grasa': 15, 'carbohidratos': 80}, 'libertad': 20,
        'alimentos': [
            {'id': 'egg', 'nombre': 'Huevo', 'proteina_100g': 13, 'grasa_100g': 11,
             'carbohidratos_100g': 1, 'medida_casera_g': 50, 'medida_desc': 'unidad', 'is_not_divisible': True},
            {'id': 'rice', 'nombre': 'Arroz', 'proteina_100g': 7, 'grasa_100g': 1,
             'carbohidratos_100g': 78, 'medida_casera_g': 100, 'medida_desc': 'g'},
        ],
    }
    r = requests.post(f'{BASE}/nutrition/solve-meal', headers=H, json=body, timeout=20)
    d = r.json().get('data', {})
    egg = next((a for a in d.get('alimentos', []) if a.get('id') == 'egg'), None)
    egg_int = egg is not None and float(egg['porciones']) == int(float(egg['porciones']))
    check('solve-meal: status success', r.status_code == 200 and d.get('status') == 'success')
    check('solve-meal: egg (is_not_divisible) -> porciones entera',
          egg_int, str(egg.get('porciones') if egg else None))

    # ── P4: Rechange (equivalencias por macros) ──
    r = requests.post(f'{BASE}/nutrition/foods/rechange', headers=H,
                      json={'proteina': 20, 'grasa': 5, 'carbohidratos': 30, 'limit': 5}, timeout=15)
    d = r.json().get('data', {})
    eq = d.get('equivalents', [])
    ranked = all(eq[i]['macro_error'] <= eq[i + 1]['macro_error'] for i in range(len(eq) - 1))
    check('rechange: devuelve equivalentes rankeados por error', r.status_code == 200 and len(eq) >= 1 and ranked,
          f'top={eq[0]["nombre"][:24] if eq else None}')

    # ── P6: Strength standards lookup (percentil, datos de Strength Level) ──
    def lookup(lift):
        return requests.get(f'{BASE}/training/strength/standards-lookup', headers=H,
                            params={'exercise': 'bench-press', 'sex': 'M', 'bodyweight': 80, 'lift': lift, 'unit': 'kg'}, timeout=10)
    r = lookup(100)
    d = r.json().get('data', {})
    check('strength lookup: bench M 80/100kg -> nivel + percentil',
          r.status_code == 200 and d.get('level') in ('intermediate', 'advanced') and d.get('percentile') is not None,
          f"{d.get('level')} p{d.get('percentile')}")
    p_lo = lookup(60).json().get('data', {}).get('percentile')
    p_hi = lookup(140).json().get('data', {}).get('percentile')
    check('strength lookup: percentil monótono (60<100<140kg)',
          p_lo is not None and p_hi is not None and p_lo < d.get('percentile', 0) < p_hi,
          f'{p_lo} < {d.get("percentile")} < {p_hi}')
    r404 = requests.get(f'{BASE}/training/strength/standards-lookup', headers=H,
                        params={'exercise': '__nope__', 'sex': 'M', 'bodyweight': 80, 'lift': 100}, timeout=10)
    check('strength lookup: ejercicio inexistente -> 404', r404.status_code == 404)

    # ── P6: cardio lookup + catálogos EXRX / Darebee ──
    r = requests.get(f'{BASE}/training/cardio-standards', headers=H,
                     params={'distance': '5k', 'sex': 'M', 'age': 25, 'time': '22:31'}, timeout=10)
    d = r.json().get('data', {})
    check('cardio lookup: 5k M -> nivel + percentil',
          r.status_code == 200 and d.get('level') == 'intermediate' and d.get('percentile') is not None,
          f"{d.get('level')} p{d.get('percentile')}")
    r = requests.get(f'{BASE}/training/exercise-catalog', headers=H, params={'q': 'squat', 'limit': 5}, timeout=10)
    check('exercise-catalog (EXRX): q=squat', r.status_code == 200 and r.json().get('data', {}).get('total', 0) >= 1)
    r = requests.get(f'{BASE}/training/darebee-catalog', headers=H, params={'kind': 'workout', 'limit': 5}, timeout=10)
    check('darebee-catalog: workouts', r.status_code == 200 and r.json().get('data', {}).get('total', 0) >= 1)

    print('-' * 60)
    passed = sum(1 for x in _results if x)
    print(f'{passed}/{len(_results)} checks OK')
    sys.exit(0 if passed == len(_results) else 1)


if __name__ == '__main__':
    main()
