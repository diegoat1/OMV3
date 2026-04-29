"""
WSGI entrypoint for PythonAnywhere.

Serves the API at /api/v3/* and (if frontend/dist/index.html is present) the
built React SPA at the root with a path-fallback for client-side routes.

Usage in PythonAnywhere WSGI config (account: omegamedicina):
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
from flask import Flask, send_from_directory
from flask_cors import CORS

# Import API v3 blueprint
from api.v3 import api_v3

# Frontend build directory (sibling of src/). When present, wsgi serves it
# as a SPA at the root: assets pass through, unknown paths fall back to
# index.html so client-side routing works.
FRONTEND_DIST = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
)

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

def _frontend_built():
    return os.path.isfile(os.path.join(FRONTEND_DIST, 'index.html'))


@app.route('/')
def serve_spa_root():
    if not _frontend_built():
        return {'message': 'OMV3 API is running. See /api/v3/health'}, 200
    return send_from_directory(FRONTEND_DIST, 'index.html')


@app.route('/<path:filename>')
def serve_spa(filename):
    if _frontend_built():
        candidate = os.path.join(FRONTEND_DIST, filename)
        if os.path.isfile(candidate):
            return send_from_directory(FRONTEND_DIST, filename)
        return send_from_directory(FRONTEND_DIST, 'index.html')
    return {'error': 'Not found'}, 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
