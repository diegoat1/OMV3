"""
TRAINING Module - Entrenamiento y Fuerza
"""

from flask import Blueprint

training_bp = Blueprint('training_v3', __name__, url_prefix='/training')

from . import routes
