"""QA helpers para probar endpoints v3 contra el backend corriendo en :8000.

Acuña un JWT válido (mismo JWT_SECRET y shape de payload que
src/api/v3/common/auth.generate_token) para no depender de contraseñas reales.

Uso CLI:
  python scripts/qa_helpers.py token
  python scripts/qa_helpers.py token --name "Fernandez Hurtado, Noelia" --rol nutricionista --user-id 39 --no-admin

Uso como módulo:
  from qa_helpers import mint_token, api
"""
import argparse
import os
from datetime import datetime, timedelta

import jwt

SECRET = os.getenv('JWT_SECRET', 'omega_medicina_secret_key_2025')
BASE = os.getenv('OMV3_BASE', 'http://127.0.0.1:8000/api/v3')

# Admin hardcodeado en common/auth.py (match por nombre_apellido).
ADMIN_NAME = 'Toffaletti, Diego Alejandro'


def mint_token(nombre=ADMIN_NAME, rol='admin', is_admin=True,
               user_id=1, email='datoffaletti@gmail.com', hours=24):
    now = datetime.utcnow()
    payload = {
        'user_id': user_id,
        'email': email,
        'nombre_apellido': nombre,
        'rol': rol,
        'is_admin': is_admin,
        'jti': f'qa-{user_id}-{rol}',
        'iat': now,
        'exp': now + timedelta(hours=hours),
    }
    return jwt.encode(payload, SECRET, algorithm='HS256')


def auth_header(**kw):
    return {'Authorization': f'Bearer {mint_token(**kw)}'}


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    t = sub.add_parser('token')
    t.add_argument('--name', default=ADMIN_NAME)
    t.add_argument('--rol', default='admin')
    t.add_argument('--user-id', type=int, default=1)
    t.add_argument('--email', default='datoffaletti@gmail.com')
    t.add_argument('--no-admin', action='store_true')
    args = ap.parse_args()
    if args.cmd == 'token':
        print(mint_token(args.name, args.rol, not args.no_admin,
                         args.user_id, args.email), end='')
