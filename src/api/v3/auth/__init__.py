"""
AUTH Module - Autenticación y Autorización
"""

from flask import Blueprint

auth_bp = Blueprint('auth_v3', __name__, url_prefix='/auth')

from . import routes
