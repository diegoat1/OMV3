"""
Decoradores y utilidades de autenticación para API v3
"""

import jwt
import os
from functools import wraps
from flask import request, g
from datetime import datetime, timedelta
from .responses import error_response, ErrorCodes
from .database import get_auth_connection

# Configuración JWT
JWT_SECRET = os.getenv('JWT_SECRET', 'omega_medicina_secret_key_2025')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Usuario admin hardcodeado (legacy)
ADMIN_USERNAME = 'Toffaletti, Diego Alejandro'
ADMIN_DNI = '37070509'


def generate_token(user_data, expires_in_hours=JWT_EXPIRATION_HOURS, jti=None):
    """
    Genera un token JWT para el usuario.

    Args:
        user_data: Dict con datos del usuario (id, dni, email, nombre_apellido, rol)
        expires_in_hours: Horas hasta expiración
        jti: opcional, JWT ID — si se pasa, va al payload para permitir
             revocación selectiva (OMV-75, OMV-80). Si se omite se genera
             uno nuevo automáticamente.

    Returns:
        Token JWT string
    """
    import secrets
    if jti is None:
        jti = secrets.token_hex(16)
    exp = datetime.utcnow() + timedelta(hours=expires_in_hours)
    payload = {
        'user_id': user_data.get('id') or user_data.get('user_id'),
        'dni': user_data.get('dni'),
        'email': user_data.get('email'),
        'nombre_apellido': user_data.get('nombre_apellido'),
        'rol': user_data.get('rol', 'user'),
        'is_admin': user_data.get('is_admin', False),
        'jti': jti,
        'iat': datetime.utcnow(),
        'exp': exp,
    }

    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def is_token_revoked(jti) -> bool:
    """Returns True if the JWT id is in revoked_tokens."""
    if not jti:
        return False
    try:
        conn = get_auth_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM revoked_tokens WHERE jti = ? LIMIT 1", [jti])
        row = cursor.fetchone()
        conn.close()
        return bool(row)
    except Exception:
        # Tabla puede no existir antes de migration 014 — fail-open
        # (un fail-closed bloquearía el login en deploys viejos).
        return False


def revoke_token(jti, user_id=None, reason='manual', expires_at=None):
    """Persist a JTI into revoked_tokens. Best-effort; never raises."""
    if not jti:
        return
    try:
        conn = get_auth_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR IGNORE INTO revoked_tokens (jti, user_id, expires_at, reason)
            VALUES (?, ?, ?, ?)
        """, [jti, user_id, expires_at, reason])
        conn.commit()
        conn.close()
    except Exception:
        pass


def decode_token(token):
    """
    Decodifica y valida un token JWT.

    Args:
        token: Token JWT string

    Returns:
        Dict con payload del token o None si es inválido o revocado.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    # OMV-75 / OMV-80: bloqueo via revoked_tokens
    if is_token_revoked(payload.get('jti')):
        return None
    return payload


def get_token_from_request():
    """
    Extrae el token del header Authorization.
    
    Returns:
        Token string o None
    """
    auth_header = request.headers.get('Authorization', '')
    
    if auth_header.startswith('Bearer '):
        return auth_header[7:]
    
    return None


def get_current_user():
    """
    Obtiene el usuario actual del contexto de la request.
    
    Returns:
        Dict con datos del usuario o None
    """
    return getattr(g, 'current_user', None)


def require_auth(f):
    """
    Decorador que requiere autenticación válida.
    
    Usage:
        @require_auth
        def my_endpoint():
            user = get_current_user()
            ...
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        
        if not token:
            return error_response(
                'Token de autenticación requerido',
                code=ErrorCodes.UNAUTHORIZED,
                status_code=401
            )
        
        payload = decode_token(token)
        
        if not payload:
            return error_response(
                'Token inválido o expirado',
                code=ErrorCodes.TOKEN_INVALID,
                status_code=401
            )
        
        # Guardar usuario en contexto
        g.current_user = {
            'user_id': payload.get('user_id'),
            'dni': payload.get('dni'),
            'email': payload.get('email'),
            'nombre_apellido': payload.get('nombre_apellido'),
            'rol': payload.get('rol', 'user'),
            'is_admin': payload.get('is_admin', False)
        }
        
        return f(*args, **kwargs)
    
    return decorated


def require_admin(f):
    """
    Decorador que requiere rol de administrador.
    
    Usage:
        @require_admin
        def admin_only_endpoint():
            ...
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        
        if not token:
            return error_response(
                'Token de autenticación requerido',
                code=ErrorCodes.UNAUTHORIZED,
                status_code=401
            )
        
        payload = decode_token(token)
        
        if not payload:
            return error_response(
                'Token inválido o expirado',
                code=ErrorCodes.TOKEN_INVALID,
                status_code=401
            )
        
        # Verificar si es admin
        is_admin = (
            payload.get('is_admin', False) or 
            payload.get('rol') == 'admin' or
            payload.get('nombre_apellido') == ADMIN_USERNAME or
            payload.get('dni') == ADMIN_DNI
        )
        
        if not is_admin:
            return error_response(
                'Acceso denegado. Se requieren permisos de administrador.',
                code=ErrorCodes.FORBIDDEN,
                status_code=403
            )
        
        # Guardar usuario en contexto
        g.current_user = {
            'user_id': payload.get('user_id'),
            'dni': payload.get('dni'),
            'email': payload.get('email'),
            'nombre_apellido': payload.get('nombre_apellido'),
            'rol': 'admin',
            'is_admin': True
        }
        
        return f(*args, **kwargs)
    
    return decorated


def is_assigned_professional(specialist_user_id, patient_identifier):
    """
    Check if a specialist has an accepted assignment with a patient.

    Args:
        specialist_user_id: The auth.db user_id of the specialist
        patient_identifier: The patient's DNI or nombre_apellido

    Returns:
        True if the specialist has an accepted assignment with the patient
    """
    try:
        conn = get_auth_connection()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT 1 FROM specialist_assignments
               WHERE specialist_id = ? AND patient_dni = ? AND status = 'accepted'
               LIMIT 1""",
            [specialist_user_id, patient_identifier]
        )
        result = cursor.fetchone()
        conn.close()
        return result is not None
    except Exception:
        return False


def check_patient_access(user, patient_identifier):
    """
    Devuelve True si el `user` actual tiene acceso al paciente `patient_identifier`.

    Acceso:
        - admin (is_admin / rol == 'admin') siempre.
        - el propio paciente (match por auth_user_id, DNI, nombre, o patient_id
          resuelto via resolve_patient_id).
        - especialista con assignment 'accepted' (auth.db.specialist_assignments).

    Args:
        user: dict devuelto por get_current_user().
        patient_identifier: string o int — auth_user_id, DNI, nombre_apellido,
            email, o patient_id.

    Returns:
        bool
    """
    if not user:
        return False

    if user.get('is_admin') or user.get('rol') == 'admin':
        return True

    if patient_identifier in (None, ''):
        return False

    pid_str = str(patient_identifier).strip()
    candidates = {
        str(user.get('user_id') or ''),
        str(user.get('dni') or ''),
        str(user.get('nombre_apellido') or ''),
        str(user.get('email') or '').lower(),
    }
    if pid_str in candidates or pid_str.lower() in candidates:
        return True

    # Resolver el identifier al paciente (clinical.db) y comparar
    try:
        from .database import resolve_patient_id  # local to avoid circular
        target = resolve_patient_id(pid_str)
    except Exception:
        target = None

    if target:
        target_keys = {
            str(target.get('patient_id') or ''),
            str(target.get('auth_user_id') or ''),
            str(target.get('dni') or ''),
            str(target.get('nombre') or ''),
            str(target.get('email') or '').lower(),
        }
        if target_keys & candidates:
            return True
        # Especialista asignado: probar con DNI y con nombre
        specialist_id = user.get('user_id')
        if specialist_id:
            for key in (target.get('dni'), target.get('nombre')):
                if key and is_assigned_professional(specialist_id, key):
                    return True

    # Ultimo intento: pasar el identifier crudo al chequeo de assignments
    specialist_id = user.get('user_id')
    if specialist_id and is_assigned_professional(specialist_id, pid_str):
        return True

    return False


def require_owner_or_admin(f):
    """
    Decorador que requiere ser dueño del recurso o administrador.
    El ID del recurso debe estar en kwargs como 'user_id' o 'id'.

    Usage:
        @require_owner_or_admin
        def get_user_data(user_id):
            ...
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        
        if not token:
            return error_response(
                'Token de autenticación requerido',
                code=ErrorCodes.UNAUTHORIZED,
                status_code=401
            )
        
        payload = decode_token(token)
        
        if not payload:
            return error_response(
                'Token inválido o expirado',
                code=ErrorCodes.TOKEN_INVALID,
                status_code=401
            )
        
        # Verificar si es admin
        is_admin = (
            payload.get('is_admin', False) or 
            payload.get('rol') == 'admin' or
            payload.get('nombre_apellido') == ADMIN_USERNAME or
            payload.get('dni') == ADMIN_DNI
        )
        
        # Obtener ID del recurso solicitado
        resource_id = kwargs.get('user_id') or kwargs.get('id')
        token_user_id = str(payload.get('user_id') or '')
        token_dni = str(payload.get('dni') or '')
        token_name = str(payload.get('nombre_apellido') or '')
        
        # Verificar si es dueño o admin (accept auth.db ID, DNI, or nombre_apellido)
        if resource_id:
            rid = str(resource_id)
            is_owner = rid == token_user_id or rid == token_dni or rid == token_name
        else:
            is_owner = True
        
        if not is_admin and not is_owner:
            return error_response(
                'Acceso denegado. No tienes permisos para este recurso.',
                code=ErrorCodes.FORBIDDEN,
                status_code=403
            )
        
        # Guardar usuario en contexto
        g.current_user = {
            'user_id': payload.get('user_id'),
            'dni': payload.get('dni'),
            'email': payload.get('email'),
            'nombre_apellido': payload.get('nombre_apellido'),
            'rol': 'admin' if is_admin else payload.get('rol', 'user'),
            'is_admin': is_admin
        }
        
        return f(*args, **kwargs)
    
    return decorated
