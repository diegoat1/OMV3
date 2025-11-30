"""Utilidades para subir archivos a Google Drive (OAuth o cuentas de servicio)."""

from __future__ import annotations

import io
import json
import os
import unicodedata
from typing import Dict, Optional

from google.auth.transport.requests import Request
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseUpload


DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file']
SERVICE_ACCOUNT_FILE_ENV = 'GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON'
SERVICE_ACCOUNT_INFO_ENV = 'GOOGLE_DRIVE_SERVICE_ACCOUNT_INFO'
GOOGLE_APPLICATION_CREDENTIALS_ENV = 'GOOGLE_APPLICATION_CREDENTIALS'
OAUTH_CLIENT_ENV = 'GOOGLE_DRIVE_OAUTH_CLIENT_JSON'
OAUTH_TOKEN_ENV = 'GOOGLE_DRIVE_OAUTH_TOKEN_JSON'
DEFAULT_SERVICE_ACCOUNT_PATH = os.path.join('config', 'google-service-account.json')
DEFAULT_OAUTH_CLIENT_PATH = os.path.join('config', 'google-oauth-client.json')
DEFAULT_OAUTH_TOKEN_PATH = os.path.join('config', 'google-drive-token.json')
_drive_service = None


def _load_credentials():
    """Carga credenciales preferentemente desde OAuth; usa service account si está configurada."""
    if _has_service_account_config():
        return _load_service_account_credentials()
    return _load_oauth_credentials()


def _has_service_account_config() -> bool:
    """Determina si hay configuración de cuenta de servicio disponible."""
    if os.getenv(SERVICE_ACCOUNT_INFO_ENV):
        return True

    credentials_path = (
        os.getenv(SERVICE_ACCOUNT_FILE_ENV)
        or os.getenv(GOOGLE_APPLICATION_CREDENTIALS_ENV)
        or DEFAULT_SERVICE_ACCOUNT_PATH
    )
    return os.path.exists(credentials_path)


def _load_service_account_credentials():
    """Carga credenciales desde una cuenta de servicio (legacy)."""
    raw_json = os.getenv(SERVICE_ACCOUNT_INFO_ENV)
    credentials_path = (
        os.getenv(SERVICE_ACCOUNT_FILE_ENV)
        or os.getenv(GOOGLE_APPLICATION_CREDENTIALS_ENV)
        or DEFAULT_SERVICE_ACCOUNT_PATH
    )

    if raw_json:
        try:
            info = json.loads(raw_json)
            return service_account.Credentials.from_service_account_info(info, scopes=DRIVE_SCOPES)
        except json.JSONDecodeError as exc:
            raise RuntimeError('GOOGLE_DRIVE_SERVICE_ACCOUNT_INFO no contiene JSON válido') from exc

    if not os.path.exists(credentials_path):
        raise FileNotFoundError('No se encontró el archivo de la cuenta de servicio configurada.')

    return service_account.Credentials.from_service_account_file(credentials_path, scopes=DRIVE_SCOPES)


def _load_oauth_credentials():
    """Carga credenciales OAuth almacenadas en disco (token refrescable)."""
    client_path = os.getenv(OAUTH_CLIENT_ENV) or DEFAULT_OAUTH_CLIENT_PATH
    token_path = os.getenv(OAUTH_TOKEN_ENV) or DEFAULT_OAUTH_TOKEN_PATH

    if not os.path.exists(client_path):
        raise FileNotFoundError(
            'No se encontró el archivo de cliente OAuth. Guarda credentials.json en '
            f"{client_path} o define {OAUTH_CLIENT_ENV}."
        )

    if not os.path.exists(token_path):
        raise RuntimeError(
            'No se encontró el token OAuth. Ejecuta `python scripts/google_drive_auth.py` '
            'para completar el flujo de autorización.'
        )

    credentials = Credentials.from_authorized_user_file(token_path, scopes=DRIVE_SCOPES)
    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
        with open(token_path, 'w', encoding='utf-8') as token_file:
            token_file.write(credentials.to_json())

    if not credentials.valid:
        raise RuntimeError('Las credenciales OAuth no son válidas. Ejecuta nuevamente el script de autorización.')

    return credentials


def get_drive_service(force_refresh: bool = False):
    """Devuelve una instancia del cliente de Drive reutilizable."""
    global _drive_service
    if _drive_service is not None and not force_refresh:
        return _drive_service

    credentials = _load_credentials()
    _drive_service = build('drive', 'v3', credentials=credentials, cache_discovery=False)
    return _drive_service


def slugify(value: str) -> str:
    """Convierte un texto en un slug seguro para nombres de archivo."""
    if not value:
        return 'documento'
    normalized = unicodedata.normalize('NFKD', value)
    ascii_value = normalized.encode('ascii', 'ignore').decode('ascii')
    safe_chars = []
    for char in ascii_value.lower():
        if char.isalnum():
            safe_chars.append(char)
        elif char in (' ', '-', '_'):
            safe_chars.append('-')
    slug = ''.join(safe_chars).strip('-')
    return slug or 'documento'


def upload_file_to_drive(
    file_stream: io.IOBase,
    filename: str,
    mime_type: Optional[str] = None,
    folder_id: Optional[str] = None,
    description: Optional[str] = None,
) -> Dict[str, str]:
    """Sube un archivo al Drive y devuelve los metadatos útiles."""
    service = get_drive_service()
    media = MediaIoBaseUpload(file_stream, mimetype=mime_type or 'application/octet-stream', resumable=False)

    metadata: Dict[str, object] = {'name': filename}
    if folder_id:
        metadata['parents'] = [folder_id]
    if description:
        metadata['description'] = description

    try:
        uploaded = service.files().create(
            body=metadata,
            media_body=media,
            fields='id, name, mimeType, size, parents, webViewLink, webContentLink'
        ).execute()
    except HttpError as exc:
        raise RuntimeError(f'Error al subir a Google Drive: {exc}') from exc

    # Garantizar que el archivo sea accesible con enlace
    try:
        service.permissions().create(
            fileId=uploaded['id'],
            body={'role': 'reader', 'type': 'anyone'},
            fields='id'
        ).execute()
    except HttpError:
        # Puede fallar si la organización tiene políticas estrictas; continuamos con el enlace disponible.
        pass

    if not uploaded.get('webViewLink'):
        uploaded['webViewLink'] = f"https://drive.google.com/file/d/{uploaded['id']}/view?usp=drivesdk"

    if not uploaded.get('webContentLink'):
        uploaded['webContentLink'] = f"https://drive.google.com/uc?id={uploaded['id']}&export=download"

    return uploaded
