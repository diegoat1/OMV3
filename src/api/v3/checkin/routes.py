"""
CHECKIN Routes - Daily health check-in, symptoms by system, Health Index
"""

from flask import request
from . import checkin_bp
from ..common.responses import success_response, error_response, ErrorCodes
from ..common.auth import require_auth, get_current_user
from ..common.database import get_clinical_connection, resolve_patient_id
import sqlite3
import json
from datetime import datetime, date, timedelta


# ============================================
# HELPERS
# ============================================

def _get_patient_for_user(user):
    """Resolve the logged-in user to a clinical patient record."""
    patient = resolve_patient_id(user['nombre_apellido'])
    if not patient:
        patient = resolve_patient_id(str(user.get('id', '')))
    return patient


def _today_str():
    return date.today().isoformat()


# ============================================
# CHECK-IN DE HOY
# ============================================

CHECKIN_FIELDS = [
    'fumo', 'alcohol', 'actividad_fisica', 'actividad_tipo', 'actividad_minutos',
    'horas_sueno', 'calidad_sueno', 'estres', 'energia', 'animo',
    'deposicion', 'deposicion_veces', 'bristol', 'dolor_abdominal', 'sangre_moco',
    'hidratacion_litros', 'hambre_ansiedad', 'tomo_medicacion', 'medicacion_detalle',
    'completado',
]


@checkin_bp.route('/today', methods=['GET'])
@require_auth
def get_today():
    """Get today's check-in (or null if not filled yet)."""
    user = get_current_user()
    patient = _get_patient_for_user(user)
    if not patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    conn = get_clinical_connection(sqlite3.Row)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM daily_checkins WHERE patient_id = ? AND fecha = ?",
                   [patient['patient_id'], _today_str()])
    row = cursor.fetchone()
    conn.close()

    if not row:
        return success_response(None)

    return success_response(dict(row))


@checkin_bp.route('/today', methods=['POST'])
@require_auth
def submit_today():
    """Create or update today's check-in. After saving, recalculates Health Index."""
    user = get_current_user()
    patient = _get_patient_for_user(user)
    if not patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    data = request.get_json(silent=True) or {}
    pid = patient['patient_id']
    hoy = _today_str()

    conn = get_clinical_connection(sqlite3.Row)
    cursor = conn.cursor()

    # Check if already exists
    cursor.execute("SELECT id FROM daily_checkins WHERE patient_id = ? AND fecha = ?", [pid, hoy])
    existing = cursor.fetchone()

    if existing:
        # UPDATE
        sets = []
        vals = []
        for f in CHECKIN_FIELDS:
            if f in data:
                sets.append(f"{f} = ?")
                vals.append(data[f])
        if sets:
            vals.extend([pid, hoy])
            cursor.execute(f"UPDATE daily_checkins SET {', '.join(sets)} WHERE patient_id = ? AND fecha = ?", vals)
            conn.commit()
        checkin_id = existing['id']
    else:
        # INSERT
        cols = ['patient_id', 'fecha']
        vals = [pid, hoy]
        for f in CHECKIN_FIELDS:
            if f in data:
                cols.append(f)
                vals.append(data[f])
        placeholders = ', '.join(['?'] * len(vals))
        cursor.execute(f"INSERT INTO daily_checkins ({', '.join(cols)}) VALUES ({placeholders})", vals)
        conn.commit()
        checkin_id = cursor.lastrowid

    # Re-read the saved row
    cursor.execute("SELECT * FROM daily_checkins WHERE id = ?", [checkin_id])
    saved = dict(cursor.fetchone())
    conn.close()

    # Recalculate and persist Health Index
    health_index = _calculate_and_save_health_index(pid, hoy)

    return success_response({
        'checkin': saved,
        'health_index': health_index,
    })


# ============================================
# HISTORIAL DE CHECK-INS
# ============================================

@checkin_bp.route('/history', methods=['GET'])
@require_auth
def get_history():
    """Check-in history. Query params: limit (default 14), desde (YYYY-MM-DD)."""
    user = get_current_user()
    patient = _get_patient_for_user(user)
    if not patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    limit = request.args.get('limit', 14, type=int)
    desde = request.args.get('desde')

    conn = get_clinical_connection(sqlite3.Row)
    cursor = conn.cursor()

    query = "SELECT * FROM daily_checkins WHERE patient_id = ?"
    params = [patient['patient_id']]

    if desde:
        query += " AND fecha >= ?"
        params.append(desde)

    query += " ORDER BY fecha DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return success_response(rows)


# ============================================
# STATS SEMANALES
# ============================================

@checkin_bp.route('/stats', methods=['GET'])
@require_auth
def get_stats():
    """Weekly averages: sleep, stress, energy, mood, adherence %."""
    user = get_current_user()
    patient = _get_patient_for_user(user)
    if not patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    pid = patient['patient_id']
    hace_7 = (date.today() - timedelta(days=6)).isoformat()

    conn = get_clinical_connection(sqlite3.Row)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            COUNT(*) as dias_completados,
            AVG(calidad_sueno) as avg_sueno,
            AVG(estres) as avg_estres,
            AVG(energia) as avg_energia,
            AVG(animo) as avg_animo,
            AVG(horas_sueno) as avg_horas_sueno,
            AVG(hidratacion_litros) as avg_hidratacion
        FROM daily_checkins
        WHERE patient_id = ? AND fecha >= ?
    """, [pid, hace_7])
    row = cursor.fetchone()
    conn.close()

    dias = row['dias_completados'] or 0

    return success_response({
        'periodo': f'{hace_7} a {_today_str()}',
        'dias_completados': dias,
        'adherencia_pct': round((dias / 7) * 100),
        'avg_sueno': round(row['avg_sueno'] or 0, 1),
        'avg_horas_sueno': round(row['avg_horas_sueno'] or 0, 1),
        'avg_estres': round(row['avg_estres'] or 0, 1),
        'avg_energia': round(row['avg_energia'] or 0, 1),
        'avg_animo': round(row['avg_animo'] or 0, 1),
        'avg_hidratacion': round(row['avg_hidratacion'] or 0, 1),
    })


# ============================================
# SÍNTOMAS POR SISTEMA
# ============================================

VALID_SISTEMAS = [
    'respiratorio', 'orl', 'cardiologico', 'genitourinario',
    'musculoesqueletico', 'neurologico', 'piel', 'temperatura',
]


@checkin_bp.route('/symptoms', methods=['POST'])
@require_auth
def submit_symptom():
    """Submit a symptom event for a body system."""
    user = get_current_user()
    patient = _get_patient_for_user(user)
    if not patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    data = request.get_json(silent=True) or {}
    sistema = data.get('sistema', '').lower()

    if sistema not in VALID_SISTEMAS:
        return error_response(
            f'Sistema invalido. Opciones: {", ".join(VALID_SISTEMAS)}',
            code=ErrorCodes.VALIDATION_ERROR, status_code=400
        )

    pid = patient['patient_id']
    hoy = _today_str()

    # Find today's checkin_id (optional link)
    conn = get_clinical_connection(sqlite3.Row)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM daily_checkins WHERE patient_id = ? AND fecha = ?", [pid, hoy])
    checkin_row = cursor.fetchone()
    checkin_id = checkin_row['id'] if checkin_row else None

    detalle = data.get('detalle')
    if detalle and isinstance(detalle, dict):
        detalle = json.dumps(detalle, ensure_ascii=False)

    cursor.execute("""
        INSERT INTO symptom_events (patient_id, checkin_id, fecha, sistema, descripcion, intensidad, detalle_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, [pid, checkin_id, hoy, sistema, data.get('descripcion'), data.get('intensidad'), detalle])
    conn.commit()

    event_id = cursor.lastrowid
    cursor.execute("SELECT * FROM symptom_events WHERE id = ?", [event_id])
    saved = dict(cursor.fetchone())
    conn.close()

    return success_response(saved)


@checkin_bp.route('/symptoms', methods=['GET'])
@require_auth
def get_symptoms():
    """Recent symptom events. Query param: days (default 7)."""
    user = get_current_user()
    patient = _get_patient_for_user(user)
    if not patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    days = request.args.get('days', 7, type=int)
    desde = (date.today() - timedelta(days=days - 1)).isoformat()

    conn = get_clinical_connection(sqlite3.Row)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM symptom_events
        WHERE patient_id = ? AND fecha >= ?
        ORDER BY fecha DESC, created_at DESC
    """, [patient['patient_id'], desde])
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    # Parse detalle_json back to dict
    for row in rows:
        if row.get('detalle_json'):
            try:
                row['detalle'] = json.loads(row['detalle_json'])
            except Exception:
                row['detalle'] = row['detalle_json']

    return success_response(rows)


# ============================================
# HEALTH INDEX
# ============================================

@checkin_bp.route('/health-index', methods=['GET'])
@require_auth
def get_health_index():
    """Get today's Health Index (score + breakdown). Calculates on the fly if missing."""
    user = get_current_user()
    patient = _get_patient_for_user(user)
    if not patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    pid = patient['patient_id']
    hoy = _today_str()

    # Try to read from history first
    conn = get_clinical_connection(sqlite3.Row)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM health_index_history WHERE patient_id = ? AND fecha = ?", [pid, hoy])
    row = cursor.fetchone()
    conn.close()

    if row:
        return success_response(dict(row))

    # Calculate and save
    result = _calculate_and_save_health_index(pid, hoy)
    return success_response(result)


@checkin_bp.route('/health-index/trend', methods=['GET'])
@require_auth
def get_health_index_trend():
    """Health Index trend over time. Query param: days (default 30)."""
    user = get_current_user()
    patient = _get_patient_for_user(user)
    if not patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    days = request.args.get('days', 30, type=int)
    desde = (date.today() - timedelta(days=days - 1)).isoformat()

    conn = get_clinical_connection(sqlite3.Row)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT fecha, score, comp_corporal, comp_cintura, comp_actividad,
               comp_sueno, comp_recuperacion, comp_digestivo, comp_habitos
        FROM health_index_history
        WHERE patient_id = ? AND fecha >= ?
        ORDER BY fecha ASC
    """, [patient['patient_id'], desde])
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return success_response({
        'trend': rows,
        'total': len(rows),
    })


# ============================================
# HEALTH INDEX CALCULATION ENGINE
# ============================================

def _calculate_and_save_health_index(patient_id, fecha_str):
    """
    Calculate the Health Index 0-100 and save to health_index_history.

    Components:
      35% Composicion corporal (score_bf + score_ffmi from measurements)
      20% Perimetro cintura (value vs healthy range)
      15% Actividad fisica (active days in last 7 / 7)
      10% Sueno (avg calidad_sueno last 7 / 10)
      10% Recuperacion mental (avg of inverted estres + animo + energia / 30)
       5% Digestivo (no red flags = 100%, bristol extreme or blood = 0%)
       5% Habitos (no smoking + no/little alcohol = 100%)
    """
    conn = get_clinical_connection(sqlite3.Row)
    cursor = conn.cursor()
    hace_7 = (date.fromisoformat(fecha_str) - timedelta(days=6)).isoformat()

    # --- 1. Composicion corporal (35%) ---
    cursor.execute("""
        SELECT score_ffmi, score_bf FROM measurements
        WHERE patient_id = ? ORDER BY fecha DESC LIMIT 1
    """, [patient_id])
    meas = cursor.fetchone()
    if meas and meas['score_ffmi'] is not None and meas['score_bf'] is not None:
        # Both scores are 0-100; average them
        comp_corporal = (meas['score_ffmi'] + meas['score_bf']) / 2
    elif meas and meas['score_bf'] is not None:
        comp_corporal = meas['score_bf']
    elif meas and meas['score_ffmi'] is not None:
        comp_corporal = meas['score_ffmi']
    else:
        comp_corporal = 50  # neutral if no data

    # --- 2. Perimetro cintura (20%) ---
    cursor.execute("""
        SELECT circ_abdomen, circ_cintura FROM measurements
        WHERE patient_id = ? ORDER BY fecha DESC LIMIT 1
    """, [patient_id])
    circ = cursor.fetchone()
    cursor.execute("SELECT sexo FROM patients WHERE id = ?", [patient_id])
    pat = cursor.fetchone()
    sexo = pat['sexo'] if pat else 'M'

    waist = None
    if circ:
        waist = circ['circ_cintura'] if circ['circ_cintura'] and circ['circ_cintura'] > 0 else circ['circ_abdomen']

    if waist and waist > 0:
        # Healthy range: M < 94cm, F < 80cm (WHO)
        threshold = 94 if sexo == 'M' else 80
        high_risk = 102 if sexo == 'M' else 88
        if waist <= threshold:
            comp_cintura = 100
        elif waist <= high_risk:
            # Linear decay from 100 to 30
            comp_cintura = 100 - 70 * (waist - threshold) / (high_risk - threshold)
        else:
            comp_cintura = max(0, 30 - (waist - high_risk))
    else:
        comp_cintura = 50  # neutral

    # --- 3. Actividad fisica (15%) ---
    cursor.execute("""
        SELECT COUNT(*) as dias_activos FROM daily_checkins
        WHERE patient_id = ? AND fecha >= ? AND actividad_fisica = 1
    """, [patient_id, hace_7])
    act = cursor.fetchone()
    dias_activos = act['dias_activos'] if act else 0
    comp_actividad = min(100, round((dias_activos / 7) * 100))

    # --- 4. Sueno (10%) ---
    cursor.execute("""
        SELECT AVG(calidad_sueno) as avg_sueno FROM daily_checkins
        WHERE patient_id = ? AND fecha >= ? AND calidad_sueno IS NOT NULL
    """, [patient_id, hace_7])
    sue = cursor.fetchone()
    avg_sueno = sue['avg_sueno'] if sue and sue['avg_sueno'] is not None else 5
    comp_sueno = min(100, round(avg_sueno * 10))

    # --- 5. Recuperacion mental (10%) ---
    cursor.execute("""
        SELECT AVG(estres) as avg_e, AVG(energia) as avg_en, AVG(animo) as avg_a
        FROM daily_checkins
        WHERE patient_id = ? AND fecha >= ?
          AND (estres IS NOT NULL OR energia IS NOT NULL OR animo IS NOT NULL)
    """, [patient_id, hace_7])
    rec = cursor.fetchone()
    if rec and any(rec[k] is not None for k in ['avg_e', 'avg_en', 'avg_a']):
        estres_inv = 10 - (rec['avg_e'] or 5)  # invert: low stress = good
        energia_val = rec['avg_en'] or 5
        animo_val = rec['avg_a'] or 5
        comp_recuperacion = min(100, round(((estres_inv + energia_val + animo_val) / 30) * 100))
    else:
        comp_recuperacion = 50

    # --- 6. Digestivo (5%) ---
    cursor.execute("""
        SELECT sangre_moco, dolor_abdominal, bristol FROM daily_checkins
        WHERE patient_id = ? AND fecha = ?
    """, [patient_id, fecha_str])
    dig = cursor.fetchone()
    if dig:
        red_flags = 0
        if dig['sangre_moco']:
            red_flags += 2
        if dig['dolor_abdominal']:
            red_flags += 1
        if dig['bristol'] is not None and (dig['bristol'] <= 1 or dig['bristol'] >= 7):
            red_flags += 1
        comp_digestivo = max(0, 100 - red_flags * 30)
    else:
        comp_digestivo = 75  # assume ok if not filled

    # --- 7. Habitos (5%) ---
    cursor.execute("""
        SELECT fumo, alcohol FROM daily_checkins
        WHERE patient_id = ? AND fecha = ?
    """, [patient_id, fecha_str])
    hab = cursor.fetchone()
    if hab:
        score_hab = 100
        if hab['fumo']:
            score_hab -= 50
        alc = hab['alcohol'] or 'no'
        if alc == 'mucho':
            score_hab -= 50
        elif alc == 'moderado':
            score_hab -= 25
        elif alc == 'poco':
            score_hab -= 10
        comp_habitos = max(0, score_hab)
    else:
        comp_habitos = 75  # assume ok

    # --- SCORE TOTAL ---
    score = round(
        comp_corporal * 0.35 +
        comp_cintura * 0.20 +
        comp_actividad * 0.15 +
        comp_sueno * 0.10 +
        comp_recuperacion * 0.10 +
        comp_digestivo * 0.05 +
        comp_habitos * 0.05,
        1
    )

    # Round components
    comp_corporal = round(comp_corporal, 1)
    comp_cintura = round(comp_cintura, 1)
    comp_actividad = round(comp_actividad, 1)
    comp_sueno = round(comp_sueno, 1)
    comp_recuperacion = round(comp_recuperacion, 1)
    comp_digestivo = round(comp_digestivo, 1)
    comp_habitos = round(comp_habitos, 1)

    # Persist (upsert)
    cursor.execute("""
        INSERT INTO health_index_history
            (patient_id, fecha, score, comp_corporal, comp_cintura, comp_actividad,
             comp_sueno, comp_recuperacion, comp_digestivo, comp_habitos)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(patient_id, fecha) DO UPDATE SET
            score = excluded.score,
            comp_corporal = excluded.comp_corporal,
            comp_cintura = excluded.comp_cintura,
            comp_actividad = excluded.comp_actividad,
            comp_sueno = excluded.comp_sueno,
            comp_recuperacion = excluded.comp_recuperacion,
            comp_digestivo = excluded.comp_digestivo,
            comp_habitos = excluded.comp_habitos
    """, [patient_id, fecha_str, score, comp_corporal, comp_cintura, comp_actividad,
          comp_sueno, comp_recuperacion, comp_digestivo, comp_habitos])
    conn.commit()
    conn.close()

    return {
        'patient_id': patient_id,
        'fecha': fecha_str,
        'score': score,
        'comp_corporal': comp_corporal,
        'comp_cintura': comp_cintura,
        'comp_actividad': comp_actividad,
        'comp_sueno': comp_sueno,
        'comp_recuperacion': comp_recuperacion,
        'comp_digestivo': comp_digestivo,
        'comp_habitos': comp_habitos,
    }
