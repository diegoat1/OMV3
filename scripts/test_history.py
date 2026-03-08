import requests

# Login
r = requests.post('http://127.0.0.1:8000/api/v3/auth/login', json={
    'email': 'datoffaletti@gmail.com',
    'password': '37070509'
})
token = r.json()['data']['token']

# Body composition history
r2 = requests.get('http://127.0.0.1:8000/api/v3/analytics/body-composition/history?limit=3', headers={
    'Authorization': f'Bearer {token}'
})
d2 = r2.json()
if d2.get('success'):
    hist = d2['data'].get('history', [])
    print(f"History records: {d2['data'].get('total', len(hist))}")
    for h in hist[:3]:
        print(f"  {h.get('FECHA_REGISTRO')}: abd={h.get('CIRC_ABDOMEN')}, cin={h.get('CIRC_CINTURA')}, peso={h.get('PESO')}")
else:
    print(f"Error: {d2}")
