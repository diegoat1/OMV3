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


def generate_token(user_data, expires_in_hours=JWT_EXPIRATION_HOURS):
    """
    Genera un token JWT para el usuario.
    
    Args:
        user_data: Dict con datos del usuario (id, dni, email, nombre_apellido, rol)
        expires_in_hours: Horas hasta expiración
    
    Returns:
        Token JWT string
    """
    payload = {
        'user_id': user_data.get('id') or user_data.get('user_id'),
        'dni': user_data.get('dni'),
        'email': user_data.get('email'),
        'nombre_apellido': user_data.get('nombre_apellido'),
        'rol': user_data.get('rol', 'user'),
        'is_admin': user_data.get('is_admin', False),
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=expires_in_hours)
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token):
    """
    Decodifica y valida un token JWT.
    
    Args:
        token: Token JWT string
    
    Returns:
        Dict con payload del token o None si es inválido
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


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
