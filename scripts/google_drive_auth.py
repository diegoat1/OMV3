"""Flujo asistido para obtener credenciales OAuth de Google Drive.

Este script abre un flujo de autorización (modo consola) y guarda el token
refrescable que la app usará para subir archivos a Drive con la cuenta del
usuario. Debe ejecutarse desde la raíz del proyecto:

    python scripts/google_drive_auth.py

Requisitos previos:
- Haber creado el OAuth Client ID (Desktop) en Google Cloud
- Guardar el archivo descargado como config/google-oauth-client.json
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/drive.file']
CLIENT_ENV = 'GOOGLE_DRIVE_OAUTH_CLIENT_JSON'
TOKEN_ENV = 'GOOGLE_DRIVE_OAUTH_TOKEN_JSON'
DEFAULT_CLIENT_PATH = Path('config/google-oauth-client.json')
DEFAULT_TOKEN_PATH = Path('config/google-drive-token.json')


def _get_client_path() -> Path:
    client_path = Path(os.getenv(CLIENT_ENV) or DEFAULT_CLIENT_PATH)
    if not client_path.exists():
        raise FileNotFoundError(
            'No se encontró el archivo de credenciales OAuth. Guarda el credentials.json '
            f'en {client_path} o define {CLIENT_ENV} con la ruta correcta.'
        )
    return client_path


def _get_token_path() -> Path:
    token_path = Path(os.getenv(TOKEN_ENV) or DEFAULT_TOKEN_PATH)
    token_path.parent.mkdir(parents=True, exist_ok=True)
    return token_path


def run_flow() -> Credentials:
    client_path = _get_client_path()
    token_path = _get_token_path()

    creds: Credentials | None = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), scopes=SCOPES)

    if creds and creds.valid:
        return creds

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        flow = InstalledAppFlow.from_client_secrets_file(str(client_path), scopes=SCOPES)
        flow.redirect_uri = 'http://localhost'
        auth_url, _ = flow.authorization_url(
            prompt='consent',
            access_type='offline',
            include_granted_scopes='true'
        )
        print('Visita esta URL en tu navegador para autorizar el acceso (copia y pégala completa):\n')
        print(auth_url)
        code = input('\nIngresa el código de verificación que muestra Google: ').strip()
        flow.fetch_token(code=code)
        creds = flow.credentials

    with token_path.open('w', encoding='utf-8') as token_file:
        token_file.write(creds.to_json())

    return creds


def main():
    creds = run_flow()
    user_email = creds.id_token.get('email') if creds.id_token else 'tu cuenta'
    print('\n✅ Credenciales guardadas correctamente.')
    print(f'   Archivo token: {_get_token_path()}')
    print(f'   Cuenta autorizada: {user_email}')


if __name__ == '__main__':
    main()
