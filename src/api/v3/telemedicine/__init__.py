"""
TELEMEDICINE Module - Appointments, medical records, vitals, documents
"""

from flask import Blueprint

telemedicine_bp = Blueprint('telemedicine_v3', __name__, url_prefix='/telemedicine')

from . import routes
