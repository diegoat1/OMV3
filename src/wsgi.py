"""
WSGI entrypoint for PythonAnywhere (API-only, no legacy imports).

Usage in PythonAnywhere WSGI config:
    import sys, os
    path = '/home/omegamedicina/OMV3/src'
    if path not in sys.path:
        sys.path.insert(0, path)
    os.environ['DATABASE_DIR'] = '/home/omegamedicina/omv3-data'
    os.environ['JWT_SECRET'] = 'your_secret_here'
    from wsgi import app as application
"""

import os
import sqlite3
from flask import Flask
from flask_cors import CORS

# Import API v3 blueprint
from api.v3 import api_v3

app = Flask(__name__)
app.secret_key = os.environ.get('JWT_SECRET', 'omega_medicina_secret_key_2025')

# Register API v3 blueprint
app.register_blueprint(api_v3)
CORS(app, resources={r"/api/v3/*": {"origins": "*"}})

# Disable CSRF entirely (API-only, uses Bearer tokens)
app.config['WTF_CSRF_CHECK_DEFAULT'] = False

# Auto-initialize clinical.db from schema.sql if it doesn't exist
def _init_clinical_db():
    from api.v3.common.database import CLINICAL_DATABASE_PATH
    if os.path.exists(CLINICAL_DATABASE_PATH):
        return
    schema_path = os.path.join(os.path.dirname(__file__), 'db', 'schema.sql')
    if not os.path.exists(schema_path):
        print(f"[wsgi] WARNING: schema.sql not found at {schema_path}")
        return
    # Ensure parent directory exists
    os.makedirs(os.path.dirname(CLINICAL_DATABASE_PATH), exist_ok=True)
    print(f"[wsgi] Initializing clinical.db at {CLINICAL_DATABASE_PATH}")
    conn = sqlite3.connect(CLINICAL_DATABASE_PATH)
    with open(schema_path, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())
    conn.close()

_init_clinical_db()

# Root route redirect to health check
@app.route('/')
def root():
    return {'message': 'OMV3 API is running. See /api/v3/health'}, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
