"""
ADMIN Module - Administración
"""

from flask import Blueprint

admin_bp = Blueprint('admin_v3', __name__, url_prefix='/admin')

from . import routes
