"""
Tests funcionales P1 (Prevención USPSTF) + P2 (rendimiento físico) + calculadoras.

Cubre el trabajo del roadmap de paridad:
  - 🐞 endurance fix: RENDIMIENTO_RESISTENCIA en Basededatos (antes apuntaba mal a telemed.db)
  - 1RM: Epley/Brzycki/Lombardi/O'Conner + tabla de prescripción
  - Riegel: predictor de tiempos de carrera
  - Prevención in-process (all-in-one, sin servicio externo) + persistencia de flags + scoping

Requiere el backend corriendo en :8000 (python src/main.py) y NO requiere
PREVENTION_API_URL (usa el motor in-process por defecto).

    python scripts/test_p1p2_prevention_performance.py
"""

import sys
import os
import sqlite3

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import requests
from qa_helpers import mint_token, BASE

_REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

ADMIN = {'Authorization': f'Bearer {mint_token()}'}  # Toffaletti = admin/clinical writer
PATIENT_NAME = 'SaiyanKiwi'
# token de un paciente cualquiera (no clinical writer)
PATIENT = {'Authorization': f'Bearer {mint_token(nombre=PATIENT_NAME, rol="paciente", is_admin=False, user_id=999)}'}

_results = []


def check(label, ok, detail=''):
    _results.append(ok)
    print(f'[{"OK" if ok else "FAIL"}] {label}' + (f' — {detail}' if detail else ''))


def post(path, body, headers=ADMIN):
    return requests.post(f'{BASE}{path}', json=body, headers=headers, timeout=15)


def get(path, headers=ADMIN, **params):
    return requests.get(f'{BASE}{path}', params=params, headers=headers, timeout=15)


def n_risk(recs, name):
    return sum(1 for r in recs if (r.get('riskName') or '') == name)


def main():
    # --- health ---
    r = get('/health')
    check('health 200', r.status_code == 200 and r.json()['data']['status'] == 'healthy')

    # --- endurance (bug fix: tabla en legacy, no telemed) ---
    r = get('/telemedicine/performance/endurance')
    check('GET endurance 200 (no "no such table")', r.status_code == 200 and r.json().get('success'),
          f'status={r.status_code}')
    r = post('/telemedicine/performance/endurance',
             {'tipo_prueba': 'Cooper 12min', 'duracion_minutos': 12, 'distancia_metros': 2600})
    check('POST endurance 201', r.status_code == 201 and r.json().get('success'),
          f'status={r.status_code}')

    # --- 1RM ---
    r = get('/training/strength/1rm', weight=100, reps=5, formula='epley')
    check('1RM epley=116.67', r.status_code == 200 and abs(r.json()['data']['one_rm'] - 116.67) < 0.1,
          str(r.json().get('data', {}).get('one_rm')))
    r = get('/training/strength/1rm', weight=100, reps=5, formula='brzycki')
    check('1RM brzycki=112.5', r.status_code == 200 and abs(r.json()['data']['one_rm'] - 112.5) < 0.1)
    r = get('/training/strength/1rm', weight=100)
    check('1RM sin reps -> 400', r.status_code == 400)

    # --- Riegel ---
    r = post('/analytics/calculators/race-time',
             {'current_distance_km': 5, 'current_time': '00:22:30', 'target_distance_km': 10})
    ok = r.status_code == 200 and r.json()['data']['predicted_time'] == '46:55'
    check('Riegel 5k@22:30 -> 10k = 46:55', ok, r.json().get('data', {}).get('predicted_time'))
    r = post('/analytics/calculators/race-time',
             {'current_distance_km': 0, 'current_time': '10:00', 'target_distance_km': 10})
    check('Riegel inválido -> 400', r.status_code == 400)

    # --- Prevención (motor in-process) + persistencia ---
    # reset a estado conocido
    post('/telemedicine/prevention/recommendations',
         {'patient': PATIENT_NAME, 'tobacco': False, 'sexuallyActive': False})
    base = post('/telemedicine/prevention/recommendations', {'patient': PATIENT_NAME})
    bj = base.json()
    check('prevención base 200 (in-process, sin :5000)', base.status_code == 200 and bj.get('success'),
          f'status={base.status_code}')
    if bj.get('success'):
        bd = bj['data']
        check('prevención: count>0 + echo edad/sexo', bd['count'] > 0 and bd['patient']['age'] and bd['patient']['sex'])
        check('prevención: sin tabaco -> 0 recs de tabaco', n_risk(bd['recommendations'], 'Tobacco user') == 0)
        on = post('/telemedicine/prevention/recommendations',
                  {'patient': PATIENT_NAME, 'tobacco': True}).json()['data']
        check('prevención: tabaco=on suma recs de tabaco', n_risk(on['recommendations'], 'Tobacco user') > 0)
        persisted = post('/telemedicine/prevention/recommendations', {'patient': PATIENT_NAME}).json()['data']
        check('prevención: flag persiste (sin reenviar) ', persisted['patient']['tobacco'] is True
              and n_risk(persisted['recommendations'], 'Tobacco user') > 0)
        ga = post('/telemedicine/prevention/recommendations',
                  {'patient': PATIENT_NAME, 'grades': ['A']}).json()['data']
        check('prevención: grades=[A] filtra', all(x.get('grade') == 'A' for x in ga['recommendations']))

    # --- scoping: un paciente NO puede pedir otro paciente ---
    r = post('/telemedicine/prevention/recommendations',
             {'patient': 'Toffaletti, Miguel Angel'}, headers=PATIENT)
    check('prevención: paciente pidiendo OTRO paciente -> 403', r.status_code == 403, f'status={r.status_code}')

    # --- Movilidad (P2): self-report del paciente + scoping del profesional ---
    mb = {'tipo_evaluacion': 'autoevaluacion', 'puntuacion_total': 75,
          'puntuacion_detalle': '{"cadera":1,"hombro":3}',
          'limitaciones_identificadas': 'Cadera', 'notas': 'qa-mobility'}
    r = post('/telemedicine/performance/mobility', mb, headers=PATIENT)
    check('movilidad: paciente auto-reporta (201)', r.status_code == 201, f'status={r.status_code}')
    r = get('/telemedicine/performance/mobility', headers=PATIENT)
    mine = [x for x in r.json().get('data', {}).get('registros', []) if x.get('notas') == 'qa-mobility']
    check('movilidad: paciente ve su historial', r.status_code == 200 and len(mine) >= 1)
    r = post('/telemedicine/performance/mobility', {**mb, 'patient': 'Toffaletti, Miguel Angel'}, headers=PATIENT)
    check('movilidad: paciente registrando para OTRO -> 403', r.status_code == 403, f'status={r.status_code}')
    r = get('/telemedicine/performance/mobility', user=PATIENT_NAME)
    check('movilidad: profesional ve la del paciente',
          r.status_code == 200 and any(x.get('notas') == 'qa-mobility'
                                       for x in r.json().get('data', {}).get('registros', [])))

    # --- cleanup: filas de movilidad de prueba + flags persistidos del paciente ---
    try:
        c = sqlite3.connect(os.path.join(_REPO, 'src', 'Basededatos'))
        c.execute("DELETE FROM RENDIMIENTO_MOVILIDAD WHERE notas='qa-mobility'")
        c.commit(); c.close()
    except Exception:
        pass
    post('/telemedicine/prevention/recommendations',
         {'patient': PATIENT_NAME, 'tobacco': False, 'sexuallyActive': False})

    print('-' * 60)
    passed = sum(1 for x in _results if x)
    print(f'{passed}/{len(_results)} checks OK')
    sys.exit(0 if passed == len(_results) else 1)


if __name__ == '__main__':
    main()
