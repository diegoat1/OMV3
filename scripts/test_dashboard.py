import requests

# Login
r = requests.post('http://127.0.0.1:8000/api/v3/auth/login', json={
    'email': 'datoffaletti@gmail.com',
    'password': '37070509'
})
d = r.json()
token = d['data']['token']
user = d['data']['user']
print("=== LOGIN ===")
print(f"nombre_apellido: {user.get('nombre_apellido')}")
print(f"sexo: {user.get('sexo')}")
print(f"altura: {user.get('altura')}")
print(f"fecha_nacimiento: {user.get('fecha_nacimiento')}")

# Dashboard
r2 = requests.get('http://127.0.0.1:8000/api/v3/analytics/dashboard', headers={
    'Authorization': f'Bearer {token}'
})
d2 = r2.json()
if not d2.get('success'):
    print(f"\n=== DASHBOARD ERROR ===\n{d2}")
else:
    comp = d2['data'].get('composicion_corporal', {})
    meta = d2['data'].get('metadata', {})
    print("\n=== DASHBOARD ===")
    print(f"abdomen: {comp.get('abdomen')}")
    print(f"circunferencia_cuello: {comp.get('circunferencia_cuello')}")
    print(f"circunferencia_cintura: {comp.get('circunferencia_cintura')}")
    print(f"peso: {comp.get('peso')}")
    print(f"bf: {comp.get('bf_percent')}")
    print(f"ffmi: {comp.get('ffmi')}")
    print(f"nivel_actividad: {meta.get('nivel_actividad')}")
    print(f"edad: {meta.get('edad')}")
    print(f"sexo: {meta.get('sexo')}")

# /me endpoint
r3 = requests.get('http://127.0.0.1:8000/api/v3/auth/me', headers={
    'Authorization': f'Bearer {token}'
})
d3 = r3.json()
me_user = d3['data'].get('user', {})
print("\n=== /ME ===")
print(f"sexo: {me_user.get('sexo')}")
print(f"altura: {me_user.get('altura')}")
print(f"fecha_nacimiento: {me_user.get('fecha_nacimiento')}")
print(f"telefono: {me_user.get('telefono')}")

# Foods
r4 = requests.get('http://127.0.0.1:8000/api/v3/nutrition/foods?per_page=3', headers={
    'Authorization': f'Bearer {token}'
})
d4 = r4.json()
print(f"\n=== FOODS (first 3) ===")
if d4.get('success'):
    for f in d4['data'][:3]:
        print(f"  {f.get('ID', f.get('id'))}: {f.get('Largadescripcion', f.get('nombre', 'unknown'))}")
    print(f"  Total: {d4.get('total', len(d4['data']))}")
else:
    print(f"  Error: {d4}")

# Recipes
r5 = requests.get('http://127.0.0.1:8000/api/v3/nutrition/recipes?per_page=3', headers={
    'Authorization': f'Bearer {token}'
})
d5 = r5.json()
print(f"\n=== RECIPES (first 3) ===")
if d5.get('success'):
    for rec in d5['data'][:3]:
        print(f"  {rec.get('ID', rec.get('id'))}: {rec.get('NOMBRERECETA', rec.get('nombre', 'unknown'))}")
    print(f"  Total: {d5.get('total', len(d5['data']))}")
else:
    print(f"  Error: {d5}")
