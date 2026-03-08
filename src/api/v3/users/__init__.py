"""
USERS Module - Gestión de Usuarios y Perfiles
"""

from flask import Blueprint

users_bp = Blueprint('users_v3', __name__, url_prefix='/users')

from . import routes
