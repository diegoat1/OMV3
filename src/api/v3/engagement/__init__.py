"""
ENGAGEMENT Module - Reminders, Tasks, Insights, Performance
"""

from flask import Blueprint

engagement_bp = Blueprint('engagement', __name__, url_prefix='/engagement')

from . import routes  # noqa
