"""
ASSIGNMENTS Module - Specialist-Patient assignment requests
"""

from flask import Blueprint

assignments_bp = Blueprint('assignments_v3', __name__, url_prefix='/assignments')

from . import routes
