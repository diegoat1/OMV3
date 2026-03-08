from flask import Blueprint

checkin_bp = Blueprint('checkin', __name__, url_prefix='/checkin')

from . import routes  # noqa: E402, F401
