"""
CHECKIN Routes - Daily health check-in, symptoms by system, Health Index
"""

from flask import request
from . import checkin_bp
from ..common.responses import success_response, error_response, ErrorCodes
from ..common.auth import require_auth, get_current_user, check_patient_access
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

    # Fix 6 — OMV-63: evaluar reglas de signos rojos y persistir alertas.
    new_alerts = _evaluate_clinical_alerts(pid, saved, checkin_id)

    return success_response({
        'checkin': saved,
        'health_index': health_index,
        'alerts_triggered': new_alerts,
    })


# ============================================
# CLINICAL ALERTS (Fix 6 — OMV-63)
# ============================================

# Cada regla es una función (row) -> dict | None.
# Si devuelve dict, se persiste una alerta con esos campos:
#   { rule, severity, message, payload }
def _rule_sangre_moco(row):
    if (row or {}).get('sangre_moco'):
        return {
            'rule': 'sangre_moco_deposicion',
            'severity': 'high',
            'message': 'Presencia de sangre o moco en deposición — requiere evaluación clínica.',
            'payload': {'sangre_moco': 1},
        }
    return None


def _rule_dolor_severo(row):
    d = (row or {}).get('dolor_abdominal') or 0
    try:
        d = float(d)
    except (TypeError, ValueError):
        return None
    if d >= 8:
        return {
            'rule': 'dolor_abdominal_severo',
            'severity': 'high',
            'message': f'Dolor abdominal severo reportado ({int(d)}/10).',
            'payload': {'dolor_abdominal': d},
        }
    if d >= 6:
        return {
            'rule': 'dolor_abdominal_moderado',
            'severity': 'medium',
            'message': f'Dolor abdominal moderado ({int(d)}/10) — seguimiento sugerido.',
            'payload': {'dolor_abdominal': d},
        }
    return None


def _rule_bristol_extremo(row):
    b = (row or {}).get('bristol')
    if b is None or b == '':
        return None
    try:
        b = int(b)
    except (TypeError, ValueError):
        return None
    if b in (1, 2):
        return {
            'rule': 'bristol_constipacion',
            'severity': 'medium',
            'message': f'Tipo Bristol {b} — constipación marcada.',
            'payload': {'bristol': b},
        }
    if b in (6, 7):
        return {
            'rule': 'bristol_diarrea',
            'severity': 'medium',
            'message': f'Tipo Bristol {b} — diarrea / heces líquidas.',
            'payload': {'bristol': b},
        }
    return None


def _rule_animo_critico(row):
    a = (row or {}).get('animo')
    if a is None:
        return None
    try:
        a = float(a)
    except (TypeError, ValueError):
        return None
    if a <= 1:
        return {
            'rule': 'animo_critico',
            'severity': 'high',
            'message': 'Ánimo crítico (≤1/10) — considerar contención.',
            'payload': {'animo': a},
        }
    return None


def _rule_hidratacion_baja(row):
    h = (row or {}).get('hidratacion_litros')
    if h is None:
        return None
    try:
        h = float(h)
    except (TypeError, ValueError):
        return None
    if h < 0.5:
        return {
            'rule': 'hidratacion_muy_baja',
            'severity': 'medium',
            'message': f'Hidratación muy baja ({h} L).',
            'payload': {'hidratacion_litros': h},
        }
    return None


_ALERT_RULES = (
    _rule_sangre_moco,
    _rule_dolor_severo,
    _rule_bristol_extremo,
    _rule_animo_critico,
    _rule_hidratacion_baja,
)


def _evaluate_clinical_alerts(patient_id, checkin_row, checkin_id):
    """Run rules over the saved row and persist any triggered alerts.

    Devuelve la lista de alertas nuevas creadas. Idempotente — si una alerta
    con el mismo (patient_id, rule, source_id) ya existe sin resolver, no la
    duplica.
    """
    triggered = []
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        for rule_fn in _ALERT_RULES:
            res = rule_fn(checkin_row)
            if not res:
                continue
            # Skip si ya hay una alerta activa idéntica para este checkin.
            cursor.execute(
                "SELECT id FROM clinical_alerts "
                "WHERE patient_id = ? AND rule = ? AND source_id = ? AND resolved_at IS NULL "
                "LIMIT 1",
                [patient_id, res['rule'], checkin_id],
            )
            if cursor.fetchone():
                continue
            cursor.execute(
                "INSERT INTO clinical_alerts "
                "(patient_id, rule, severity, message, source, source_id, payload_json) "
                "VALUES (?, ?, ?, ?, 'checkin', ?, ?)",
                [
                    patient_id, res['rule'], res['severity'], res['message'],
                    checkin_id, json.dumps(res.get('payload') or {}),
                ],
            )
            triggered.append({
                'id': cursor.lastrowid,
                'rule': res['rule'],
                'severity': res['severity'],
                'message': res['message'],
            })
        conn.commit()
        conn.close()
    except Exception:
        # No frenar el guardado del check-in si hay error en alertas.
        pass
    return triggered


@checkin_bp.route('/alerts', methods=['GET'])
@require_auth
def list_clinical_alerts():
    """
    Lista alertas clínicas del paciente.

    Query params:
        - patient: display_name (profesional viendo a paciente vinculado)
        - resolved: 0|1 — por defecto sólo activas
        - severity: low|medium|high
        - limit: default 50
    """
    user = get_current_user()
    target_name = request.args.get('patient') or user.get('nombre_apellido')
    if target_name != user.get('nombre_apellido'):
        if not check_patient_access(user, target_name):
            return error_response('No tenés permisos sobre este paciente',
                                  code=ErrorCodes.FORBIDDEN, status_code=403)
    pat = resolve_patient_id(target_name)
    if not pat:
        return error_response('Paciente no encontrado',
                              code=ErrorCodes.NOT_FOUND, status_code=404)

    resolved_filter = request.args.get('resolved', '0')
    severity = request.args.get('severity')
    limit = request.args.get('limit', 50, type=int)

    sql = "SELECT * FROM clinical_alerts WHERE patient_id = ?"
    params = [pat['patient_id']]
    if resolved_filter == '0':
        sql += " AND resolved_at IS NULL"
    elif resolved_filter == '1':
        sql += " AND resolved_at IS NOT NULL"
    if severity in ('low', 'medium', 'high'):
        sql += " AND severity = ?"
        params.append(severity)
    sql += " ORDER BY created_at DESC, id DESC LIMIT ?"
    params.append(limit)

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute(sql, params)
        rows = []
        for r in cursor.fetchall():
            d = dict(r)
            try:
                d['payload'] = json.loads(d.pop('payload_json') or '{}')
            except Exception:
                d['payload'] = {}
                d.pop('payload_json', None)
            rows.append(d)
        conn.close()
        return success_response({'alerts': rows, 'total': len(rows)})
    except Exception as e:
        return error_response(f'Error leyendo alertas: {e}',
                              code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@checkin_bp.route('/alerts/<int:alert_id>/resolve', methods=['PATCH'])
@require_auth
def resolve_clinical_alert(alert_id):
    """
    Marca una alerta como resuelta. Solo profesional asignado o admin.
    Body opcional: { "notes": "..." }
    """
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    notes = (data.get('notes') or '').strip() or None
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT a.id, a.patient_id, a.resolved_at, p.nombre AS patient_nombre "
            "FROM clinical_alerts a JOIN patients p ON p.id = a.patient_id "
            "WHERE a.id = ?",
            [alert_id],
        )
        row = cursor.fetchone()
        if not row:
            conn.close()
            return error_response('Alerta no encontrada',
                                  code=ErrorCodes.NOT_FOUND, status_code=404)
        a = dict(row)
        if a['resolved_at']:
            conn.close()
            return success_response({'id': alert_id, 'already_resolved': True},
                                    message='La alerta ya estaba resuelta')
        # Permiso: el paciente NO resuelve sus propias alertas (solo el profesional).
        is_owner = (a['patient_nombre'] == user.get('nombre_apellido'))
        if is_owner and not user.get('is_admin'):
            conn.close()
            return error_response(
                'Solo el profesional asignado o un administrador pueden resolver alertas.',
                code=ErrorCodes.FORBIDDEN, status_code=403,
            )
        if not is_owner and not check_patient_access(user, a['patient_nombre']):
            conn.close()
            return error_response('No tenés permisos sobre este paciente',
                                  code=ErrorCodes.FORBIDDEN, status_code=403)

        cursor.execute(
            "UPDATE clinical_alerts SET resolved_at = CURRENT_TIMESTAMP, "
            "resolved_by = ?, notes = COALESCE(?, notes) WHERE id = ?",
            [user.get('user_id'), notes, alert_id],
        )
        conn.commit()
        conn.close()
        return success_response({'id': alert_id, 'resolved': True},
                                message='Alerta resuelta')
    except Exception as e:
        return error_response(f'Error: {e}',
                              code=ErrorCodes.INTERNAL_ERROR, status_code=500)


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
        WHERE patient_id = ? ORDER BY fecha DESC , id DESC LIMIT 1
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
        WHERE patient_id = ? ORDER BY fecha DESC , id DESC LIMIT 1
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


@checkin_bp.route('/patient-summary', methods=['GET'])
@require_auth
def patient_summary():
    """
    Consolidated weekly summary for the professional. Returns last checkin,
    last 7 daily-logs, last measurement, active goal, and health-index trend
    in a single round-trip.

    Query params:
        - patient: display_name (required when the caller is not the patient)
        - days:    window for trend/logs (default 7)
    """
    user = get_current_user()
    target_name = request.args.get('patient') or user.get('nombre_apellido')
    days = request.args.get('days', 7, type=int)
    days = max(1, min(60, days))

    if target_name != user.get('nombre_apellido'):
        if not check_patient_access(user, target_name):
            return error_response('No tenés permisos sobre este paciente',
                                  code=ErrorCodes.FORBIDDEN, status_code=403)

    pat = resolve_patient_id(target_name)
    if not pat:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    pid = pat['patient_id']
    out = {
        'patient': {'nombre': pat['nombre'], 'patient_id': pid, 'dni': pat.get('dni')},
        'last_checkin': None,
        'last_measurement': None,
        'active_goal': None,
        'health_index_today': None,
        'health_index_trend': [],
        'daily_logs': [],
    }

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM daily_checkins
            WHERE patient_id = ?
            ORDER BY fecha DESC, id DESC LIMIT 1
        """, [pid])
        row = cursor.fetchone()
        if row:
            out['last_checkin'] = dict(row)

        cursor.execute("""
            SELECT * FROM measurements
            WHERE patient_id = ?
            ORDER BY fecha DESC, id DESC LIMIT 1
        """, [pid])
        row = cursor.fetchone()
        if row:
            out['last_measurement'] = dict(row)

        cursor.execute("""
            SELECT * FROM goals
            WHERE patient_id = ? AND activo = 1
            ORDER BY id DESC LIMIT 1
        """, [pid])
        row = cursor.fetchone()
        if row:
            out['active_goal'] = dict(row)

        # health index trend (last N days)
        try:
            cursor.execute("""
                SELECT fecha, score, comp_corporal, comp_cintura, comp_actividad,
                       comp_sueno, comp_recuperacion, comp_digestivo, comp_habitos
                FROM health_index_history
                WHERE patient_id = ?
                ORDER BY fecha DESC LIMIT ?
            """, [pid, days])
            trend = [dict(r) for r in cursor.fetchall()]
            trend.reverse()
            out['health_index_trend'] = trend
            if trend:
                out['health_index_today'] = trend[-1]
        except Exception:
            pass

        # last N daily logs (summary rows)
        try:
            cursor.execute("""
                SELECT fecha, meals_completed, meals_total,
                       total_p, total_g, total_c, total_cal,
                       target_p, target_g, target_c, target_cal,
                       daily_score
                FROM nutrition_daily_summary
                WHERE patient_id = ?
                ORDER BY fecha DESC LIMIT ?
            """, [pid, days])
            logs = [dict(r) for r in cursor.fetchall()]
            logs.reverse()
            out['daily_logs'] = logs
        except Exception:
            pass

        conn.close()
        return success_response(out)
    except Exception as e:
        return error_response(f'Error armando resumen: {e}',
                              code=ErrorCodes.INTERNAL_ERROR, status_code=500)
