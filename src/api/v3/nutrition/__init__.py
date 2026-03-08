"""
NUTRITION Module - Nutrición y Planes Alimentarios
"""

from flask import Blueprint

nutrition_bp = Blueprint('nutrition_v3', __name__, url_prefix='/nutrition')

from . import routes
