"""
Formatos de respuesta estándar para API v3
"""

from flask import jsonify
from datetime import datetime


def success_response(data=None, message=None, meta=None):
    """
    Genera una respuesta exitosa estándar.
    
    Args:
        data: Datos a retornar
        message: Mensaje opcional
        meta: Metadatos adicionales
    
    Returns:
        JSON response con formato estándar
    """
    response = {
        'success': True,
        'data': data,
        'meta': {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'version': 'v3',
            **(meta or {})
        }
    }
    
    if message:
        response['message'] = message
    
    return jsonify(response)


def error_response(message, code='ERROR', details=None, status_code=400):
    """
    Genera una respuesta de error estándar.
    
    Args:
        message: Mensaje de error
        code: Código de error (ej: VALIDATION_ERROR, NOT_FOUND)
        details: Detalles adicionales del error
        status_code: Código HTTP
    
    Returns:
        Tuple (JSON response, status_code)
    """
    response = {
        'success': False,
        'error': {
            'code': code,
            'message': message
        },
        'meta': {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'version': 'v3'
        }
    }
    
    if details:
        response['error']['details'] = details
    
    return jsonify(response), status_code


def paginated_response(data, page, per_page, total):
    """
    Genera una respuesta paginada estándar.
    
    Args:
        data: Lista de items
        page: Página actual (1-indexed)
        per_page: Items por página
        total: Total de items
    
    Returns:
        JSON response con paginación
    """
    total_pages = (total + per_page - 1) // per_page if per_page > 0 else 0
    
    return jsonify({
        'success': True,
        'data': data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_prev': page > 1
        },
        'meta': {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'version': 'v3'
        }
    })


# Códigos de error comunes
class ErrorCodes:
    VALIDATION_ERROR = 'VALIDATION_ERROR'
    NOT_FOUND = 'NOT_FOUND'
    UNAUTHORIZED = 'UNAUTHORIZED'
    FORBIDDEN = 'FORBIDDEN'
    CONFLICT = 'CONFLICT'
    INTERNAL_ERROR = 'INTERNAL_ERROR'
    BAD_REQUEST = 'BAD_REQUEST'
    TOKEN_EXPIRED = 'TOKEN_EXPIRED'
    TOKEN_INVALID = 'TOKEN_INVALID'
