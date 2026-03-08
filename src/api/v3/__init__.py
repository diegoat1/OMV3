"""
OMV3 API v3 - Blueprint Principal
================================
API RESTful moderna para Omega Medicina.

Módulos:
- auth: Autenticación y autorización
- users: Gestión de usuarios y perfiles
- nutrition: Nutrición y planes alimentarios
- training: Entrenamiento y fuerza
- telemedicine: Telemedicina y salud
- analytics: Dashboard y calculadoras
- admin: Administración
"""

from flask import Blueprint

# Blueprint principal de la API v3
api_v3 = Blueprint('api_v3', __name__, url_prefix='/api/v3')

# Importar y registrar sub-blueprints
from .auth import auth_bp
from .users import users_bp
from .nutrition import nutrition_bp
from .training import training_bp
from .analytics import analytics_bp
from .admin import admin_bp
from .assignments import assignments_bp
from .telemedicine import telemedicine_bp
from .engagement import engagement_bp
from .checkin import checkin_bp

# Registrar blueprints
api_v3.register_blueprint(auth_bp)
api_v3.register_blueprint(users_bp)
api_v3.register_blueprint(nutrition_bp)
api_v3.register_blueprint(training_bp)
api_v3.register_blueprint(analytics_bp)
api_v3.register_blueprint(admin_bp)
api_v3.register_blueprint(assignments_bp)
api_v3.register_blueprint(telemedicine_bp)
api_v3.register_blueprint(engagement_bp)
api_v3.register_blueprint(checkin_bp)

# Endpoint de health check
@api_v3.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    from .common.responses import success_response
    return success_response({
        'status': 'healthy',
        'version': 'v3',
        'modules': ['auth', 'users', 'nutrition', 'training', 'analytics', 'admin', 'assignments', 'telemedicine', 'engagement']
    })

@api_v3.route('/', methods=['GET'])
def api_info():
    """Información de la API"""
    from .common.responses import success_response
    return success_response({
        'name': 'Omega Medicina API',
        'version': 'v3',
        'description': 'API RESTful para gestión de nutrición, entrenamiento y telemedicina',
        'endpoints': {
            'auth': '/api/v3/auth',
            'users': '/api/v3/users',
            'nutrition': '/api/v3/nutrition',
            'training': '/api/v3/training',
            'analytics': '/api/v3/analytics',
            'admin': '/api/v3/admin',
            'assignments': '/api/v3/assignments',
            'telemedicine': '/api/v3/telemedicine',
            'engagement': '/api/v3/engagement'
        }
    })
