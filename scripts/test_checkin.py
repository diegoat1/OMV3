"""Test checkin endpoints"""
import requests

BASE = 'http://127.0.0.1:8000/api/v3'

# Login
r = requests.post(f'{BASE}/auth/login', json={
    'email': 'datoffaletti@gmail.com',
    'password': '37070509'
})
token = r.json()['data']['token']
headers = {'Authorization': f'Bearer {token}'}

# 1. GET today (should be null initially)
r = requests.get(f'{BASE}/checkin/today', headers=headers)
print(f"GET /checkin/today: {r.status_code}")
print(f"  data: {r.json().get('data')}")

# 2. POST today
r = requests.post(f'{BASE}/checkin/today', headers=headers, json={
    'fumo': False,
    'alcohol': 'no',
    'actividad_fisica': True,
    'actividad_tipo': 'gym',
    'actividad_minutos': 60,
    'horas_sueno': 7.5,
    'calidad_sueno': 7,
    'estres': 4,
    'energia': 7,
    'animo': 8,
    'deposicion': True,
    'deposicion_veces': 2,
    'bristol': 4,
    'dolor_abdominal': False,
    'sangre_moco': False,
    'hidratacion_litros': 2.5,
    'hambre_ansiedad': 3,
    'tomo_medicacion': False,
    'completado': True,
})
d = r.json()
print(f"\nPOST /checkin/today: {r.status_code}")
if d.get('success'):
    hi = d['data'].get('health_index', {})
    print(f"  Health Index: {hi.get('score')}")
    print(f"    corporal={hi.get('comp_corporal')}, cintura={hi.get('comp_cintura')}, actividad={hi.get('comp_actividad')}")
    print(f"    sueno={hi.get('comp_sueno')}, recuperacion={hi.get('comp_recuperacion')}, digestivo={hi.get('comp_digestivo')}, habitos={hi.get('comp_habitos')}")
else:
    print(f"  Error: {d}")

# 3. GET health-index
r = requests.get(f'{BASE}/checkin/health-index', headers=headers)
print(f"\nGET /checkin/health-index: {r.status_code}")
hi = r.json().get('data', {})
print(f"  score: {hi.get('score')}")

# 4. GET stats
r = requests.get(f'{BASE}/checkin/stats', headers=headers)
print(f"\nGET /checkin/stats: {r.status_code}")
stats = r.json().get('data', {})
print(f"  adherencia: {stats.get('adherencia_pct')}%")
print(f"  avg_sueno: {stats.get('avg_sueno')}, avg_estres: {stats.get('avg_estres')}")

# 5. POST symptom
r = requests.post(f'{BASE}/checkin/symptoms', headers=headers, json={
    'sistema': 'musculoesqueletico',
    'descripcion': 'Dolor lumbar leve',
    'intensidad': 4,
    'detalle': {
        'zona': 'lumbar',
        'limita_actividad': False,
    }
})
print(f"\nPOST /checkin/symptoms: {r.status_code}")
sym = r.json().get('data', {})
print(f"  id={sym.get('id')}, sistema={sym.get('sistema')}")

# 6. GET symptoms
r = requests.get(f'{BASE}/checkin/symptoms', headers=headers)
print(f"\nGET /checkin/symptoms: {r.status_code}")
syms = r.json().get('data', [])
print(f"  count: {len(syms)}")

# 7. GET health-index/trend
r = requests.get(f'{BASE}/checkin/health-index/trend?days=7', headers=headers)
print(f"\nGET /checkin/health-index/trend: {r.status_code}")
trend = r.json().get('data', {})
print(f"  points: {trend.get('total')}")
for pt in trend.get('trend', []):
    print(f"    {pt['fecha']}: {pt['score']}")
