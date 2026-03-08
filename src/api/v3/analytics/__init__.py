"""
ANALYTICS Module - Dashboard y Calculadoras
"""

from flask import Blueprint

analytics_bp = Blueprint('analytics_v3', __name__, url_prefix='/analytics')

from . import routes
