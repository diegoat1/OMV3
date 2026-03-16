"""
Training Module v2 — Comprehensive training system
Endpoints under /api/v3/training/v2/

Exercise catalog, progressions, distributions, plan generation,
session logging with per-exercise modifications.
"""

import json
import sqlite3
from datetime import datetime, date
from flask import request

from . import training_bp
from ..common.auth import require_auth, require_admin, get_current_user
from ..common.responses import success_response, error_response, ErrorCodes
from ..common.database import (
    get_clinical_connection, get_db_connection,
    resolve_patient_id
)


# ============================================================
# Helpers
# ============================================================

def _ensure_v2_tables(conn):
    """Create v2 tables if they don't exist (idempotent)."""
    import os
    migration_path = os.path.join(
        os.path.dirname(__file__), '..', '..', '..', '..', 'migrations', '006_training_v2.sql'
    )
    if not os.path.exists(migration_path):
        return
    # Check if exercises table exists
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='exercises'")
    if cursor.fetchone():
        return
    with open(migration_path, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())


def _get_patient(user):
    """Resolve current user to patient_id."""
    nombre = user.get('nombre_apellido', '')
    uid = user.get('user_id', user.get('dni', ''))
    info = resolve_patient_id(uid) or resolve_patient_id(nombre)
    return info


def _parse_json_field(val, default=None):
    if val is None:
        return default
    if isinstance(val, (list, dict)):
        return val
    try:
        return json.loads(val)
    except (json.JSONDecodeError, TypeError):
        return default


def _exercise_row_to_dict(row):
    d = dict(row)
    d['muscle_groups'] = _parse_json_field(d.get('muscle_groups'), [])
    d['secondary_muscles'] = _parse_json_field(d.get('secondary_muscles'), [])
    return d


# ============================================================
# 1. EXERCISE CATALOG
# ============================================================

@training_bp.route('/v2/exercises', methods=['GET'])
@require_auth
def v2_list_exercises():
    """List all exercises with optional filters."""
    category = request.args.get('category')
    equipment = request.args.get('equipment')
    modality = request.args.get('modality')
    analysis_only = request.args.get('analysis_only')

    try:
        conn = get_clinical_connection(sqlite3.Row)
        _ensure_v2_tables(conn)
        cursor = conn.cursor()

        query = "SELECT * FROM exercises WHERE 1=1"
        params = []
        if category:
            query += " AND category = ?"
            params.append(category)
        if equipment:
            query += " AND equipment = ?"
            params.append(equipment)
        if modality:
            query += " AND modality = ?"
            params.append(modality)
        if analysis_only == 'true':
            query += " AND is_analysis_lift = 1"
        query += " ORDER BY category, name_es"

        cursor.execute(query, params)
        exercises = [_exercise_row_to_dict(r) for r in cursor.fetchall()]
        conn.close()

        return success_response({
            'exercises': exercises,
            'total': len(exercises),
            'categories': list(set(e['category'] for e in exercises))
        })
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@training_bp.route('/v2/exercises/<exercise_key>', methods=['GET'])
@require_auth
def v2_get_exercise(exercise_key):
    """Get exercise detail."""
    try:
        conn = get_clinical_connection(sqlite3.Row)
        _ensure_v2_tables(conn)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM exercises WHERE key = ?", [exercise_key])
        row = cursor.fetchone()
        conn.close()
        if not row:
            return error_response("Ejercicio no encontrado", code=ErrorCodes.NOT_FOUND, status_code=404)
        return success_response({'exercise': _exercise_row_to_dict(row)})
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================================
# 2. PROGRESSIONS
# ============================================================

@training_bp.route('/v2/progressions', methods=['GET'])
@require_auth
def v2_list_progressions():
    """List available progression templates."""
    try:
        conn = get_clinical_connection(sqlite3.Row)
        _ensure_v2_tables(conn)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM progression_templates ORDER BY name_es")
        rows = cursor.fetchall()
        conn.close()
        progressions = []
        for r in rows:
            d = dict(r)
            d['config'] = _parse_json_field(d.pop('config_json'), {})
            progressions.append(d)
        return success_response({'progressions': progressions, 'total': len(progressions)})
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@training_bp.route('/v2/progressions/<progression_key>', methods=['GET'])
@require_auth
def v2_get_progression(progression_key):
    """Get progression template detail."""
    try:
        conn = get_clinical_connection(sqlite3.Row)
        _ensure_v2_tables(conn)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM progression_templates WHERE key = ?", [progression_key])
        row = cursor.fetchone()
        conn.close()
        if not row:
            return error_response("Progresion no encontrada", code=ErrorCodes.NOT_FOUND, status_code=404)
        d = dict(row)
        d['config'] = _parse_json_field(d.pop('config_json'), {})
        return success_response({'progression': d})
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================================
# 3. DISTRIBUTIONS
# ============================================================

@training_bp.route('/v2/distributions', methods=['GET'])
@require_auth
def v2_list_distributions():
    """List available distribution templates."""
    try:
        conn = get_clinical_connection(sqlite3.Row)
        _ensure_v2_tables(conn)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM distribution_templates ORDER BY name_es")
        rows = cursor.fetchall()
        conn.close()
        distributions = []
        for r in rows:
            d = dict(r)
            d['config'] = _parse_json_field(d.pop('config_json'), {})
            distributions.append(d)
        return success_response({'distributions': distributions, 'total': len(distributions)})
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================================
# 4. PLANS v2
# ============================================================

@training_bp.route('/v2/plans', methods=['GET'])
@require_auth
def v2_list_plans():
    """List patient's training plans."""
    user = get_current_user()
    patient = _get_patient(user)
    if not patient:
        return error_response("Paciente no encontrado", code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        conn = get_clinical_connection(sqlite3.Row)
        _ensure_v2_tables(conn)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM training_plans_v2
            WHERE patient_id = ? ORDER BY created_at DESC
        """, [patient['patient_id']])
        plans = []
        for r in cursor.fetchall():
            d = dict(r)
            d['plan'] = _parse_json_field(d.pop('plan_json'), [])
            d['config'] = _parse_json_field(d.pop('config_json'), {})
            plans.append(d)
        conn.close()
        return success_response({'plans': plans, 'total': len(plans)})
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@training_bp.route('/v2/plans', methods=['POST'])
@require_auth
def v2_create_plan():
    """
    Create a training plan.

    Body:
    {
        "distribution_key": "push_pull_legs",
        "progression_key": "linear_simple",
        "total_days": 4,
        "exercises_per_day": 3,
        "name": "Mi plan PPL",
        "nombre_apellido": "..." (admin only, for another patient)
    }

    If distribution_key is "weakness_priority", uses strength analysis + PuLP optimizer.
    Otherwise generates from distribution template.
    """
    user = get_current_user()
    data = request.get_json(silent=True) or {}

    # Resolve patient
    target_name = data.get('nombre_apellido')
    if target_name and user.get('is_admin'):
        patient = resolve_patient_id(target_name)
    else:
        patient = _get_patient(user)
    if not patient:
        return error_response("Paciente no encontrado", code=ErrorCodes.NOT_FOUND, status_code=404)

    dist_key = data.get('distribution_key', 'weakness_priority')
    prog_key = data.get('progression_key', 'matrix_3x9')
    total_days = int(data.get('total_days', 4))
    ex_per_day = int(data.get('exercises_per_day', 3))
    plan_name = data.get('name', '')

    try:
        conn = get_clinical_connection(sqlite3.Row)
        _ensure_v2_tables(conn)
        cursor = conn.cursor()

        # Load exercises catalog
        cursor.execute("SELECT * FROM exercises WHERE is_analysis_lift = 1")
        all_exercises = {r['key']: dict(r) for r in cursor.fetchall()}

        # Load progression template
        cursor.execute("SELECT * FROM progression_templates WHERE key = ?", [prog_key])
        prog_row = cursor.fetchone()
        prog_config = _parse_json_field(prog_row['config_json'], {}) if prog_row else {}

        # Load distribution template
        cursor.execute("SELECT * FROM distribution_templates WHERE key = ?", [dist_key])
        dist_row = cursor.fetchone()
        dist_config = _parse_json_field(dist_row['config_json'], {}) if dist_row else {}

        # Generate plan based on distribution type
        plan_dias = []

        if dist_key == 'weakness_priority':
            plan_dias = _generate_weakness_plan(
                cursor, patient['patient_id'], total_days, ex_per_day, all_exercises
            )
        elif dist_key in ('push_pull_legs', 'upper_lower'):
            plan_dias = _generate_split_plan(
                dist_config, total_days, ex_per_day, all_exercises
            )
        elif dist_key == 'full_body':
            plan_dias = _generate_fullbody_plan(
                total_days, ex_per_day, all_exercises
            )
        else:
            return error_response(f"Distribucion desconocida: {dist_key}",
                                  code=ErrorCodes.VALIDATION_ERROR, status_code=400)

        # Enrich with prescribed sets/reps from progression
        plan_dias = _apply_progression_defaults(plan_dias, prog_key, prog_config, all_exercises)

        # Deactivate previous plans
        cursor.execute("""
            UPDATE training_plans_v2 SET active = 0
            WHERE patient_id = ? AND active = 1
        """, [patient['patient_id']])

        # Insert new plan
        source_strength = None
        cursor.execute("SELECT id FROM strength_tests WHERE patient_id = ? ORDER BY fecha DESC LIMIT 1",
                       [patient['patient_id']])
        st = cursor.fetchone()
        if st:
            source_strength = st['id']

        cursor.execute("""
            INSERT INTO training_plans_v2
            (patient_id, name, distribution_key, progression_key, total_days, current_day,
             active, plan_json, source_strength_id, config_json)
            VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
        """, [
            patient['patient_id'],
            plan_name or f"{dist_row['name_es'] if dist_row else dist_key} - {total_days} dias",
            dist_key, prog_key, total_days,
            json.dumps(plan_dias, ensure_ascii=False),
            source_strength,
            json.dumps({'exercises_per_day': ex_per_day}, ensure_ascii=False)
        ])
        plan_id = cursor.lastrowid

        # Initialize exercise_progress for each exercise in the plan
        exercise_keys = set()
        for dia in plan_dias:
            for ej in dia.get('ejercicios', []):
                exercise_keys.add(ej['exercise_key'])
        for ek in exercise_keys:
            cursor.execute("""
                INSERT OR IGNORE INTO exercise_progress
                (patient_id, exercise_key, progression_key, current_level, current_session, current_weight, extra_load)
                VALUES (?, ?, ?, 0, 1, 0, 0)
            """, [patient['patient_id'], ek, prog_key])

        conn.commit()
        conn.close()

        return success_response({
            'plan_id': plan_id,
            'name': plan_name,
            'total_days': total_days,
            'distribution': dist_key,
            'progression': prog_key,
            'plan': plan_dias
        })
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@training_bp.route('/v2/plans/<int:plan_id>', methods=['GET'])
@require_auth
def v2_get_plan(plan_id):
    """Get plan detail with today's workout and exercise progress."""
    user = get_current_user()
    patient = _get_patient(user)

    try:
        conn = get_clinical_connection(sqlite3.Row)
        _ensure_v2_tables(conn)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM training_plans_v2 WHERE id = ?", [plan_id])
        row = cursor.fetchone()
        if not row:
            return error_response("Plan no encontrado", code=ErrorCodes.NOT_FOUND, status_code=404)

        d = dict(row)
        plan = _parse_json_field(d['plan_json'], [])
        d['plan'] = plan
        d['config'] = _parse_json_field(d.pop('config_json'), {})
        del d['plan_json']

        # Current day workout
        current_day = d['current_day']
        today_workout = None
        if plan and 1 <= current_day <= len(plan):
            today_workout = plan[current_day - 1]

        # Enrich with exercise progress
        if today_workout and patient:
            exercise_keys = [ej['exercise_key'] for ej in today_workout.get('ejercicios', [])]
            if exercise_keys:
                placeholders = ','.join('?' * len(exercise_keys))
                cursor.execute(f"""
                    SELECT * FROM exercise_progress
                    WHERE patient_id = ? AND exercise_key IN ({placeholders})
                """, [patient['patient_id']] + exercise_keys)
                progress_map = {r['exercise_key']: dict(r) for r in cursor.fetchall()}

                # Enrich with exercise metadata
                cursor.execute(f"""
                    SELECT * FROM exercises WHERE key IN ({placeholders})
                """, exercise_keys)
                exercise_meta = {r['key']: _exercise_row_to_dict(r) for r in cursor.fetchall()}

                for ej in today_workout.get('ejercicios', []):
                    ek = ej['exercise_key']
                    if ek in progress_map:
                        ej['progress'] = progress_map[ek]
                    if ek in exercise_meta:
                        ej['exercise'] = exercise_meta[ek]

        # Check if already trained today
        already_today = False
        if patient:
            cursor.execute("""
                SELECT id FROM training_sessions
                WHERE patient_id = ? AND plan_id = ? AND fecha = ?
            """, [patient['patient_id'], plan_id, date.today().isoformat()])
            already_today = cursor.fetchone() is not None

        conn.close()

        return success_response({
            'plan': d,
            'today': today_workout,
            'current_day': current_day,
            'already_trained_today': already_today
        })
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@training_bp.route('/v2/plans/<int:plan_id>/advance', methods=['POST'])
@require_auth
def v2_advance_plan(plan_id):
    """Advance plan to next day (cyclic)."""
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute("SELECT current_day, total_days FROM training_plans_v2 WHERE id = ?", [plan_id])
        row = cursor.fetchone()
        if not row:
            return error_response("Plan no encontrado", code=ErrorCodes.NOT_FOUND, status_code=404)

        next_day = (row['current_day'] % row['total_days']) + 1
        cursor.execute("""
            UPDATE training_plans_v2 SET current_day = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, [next_day, plan_id])
        conn.commit()
        conn.close()

        return success_response({
            'plan_id': plan_id,
            'previous_day': row['current_day'],
            'current_day': next_day,
            'total_days': row['total_days']
        })
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================================
# 5. EXERCISE PROGRESS
# ============================================================

@training_bp.route('/v2/progress', methods=['GET'])
@require_auth
def v2_get_progress():
    """Get exercise progress for current user."""
    user = get_current_user()
    patient = _get_patient(user)
    if not patient:
        return error_response("Paciente no encontrado", code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        conn = get_clinical_connection(sqlite3.Row)
        _ensure_v2_tables(conn)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ep.*, e.name_es, e.category, e.equipment, e.load_type
            FROM exercise_progress ep
            LEFT JOIN exercises e ON ep.exercise_key = e.key
            WHERE ep.patient_id = ?
            ORDER BY e.category, e.name_es
        """, [patient['patient_id']])
        progress = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return success_response({'progress': progress, 'total': len(progress)})
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@training_bp.route('/v2/progress/<exercise_key>', methods=['PUT'])
@require_auth
def v2_update_progress(exercise_key):
    """Update exercise progress (weight, level, etc)."""
    user = get_current_user()
    patient = _get_patient(user)
    if not patient:
        return error_response("Paciente no encontrado", code=ErrorCodes.NOT_FOUND, status_code=404)

    data = request.get_json(silent=True) or {}
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        fields = []
        values = []
        for field in ['current_level', 'current_session', 'current_weight', 'last_reps', 'extra_load', 'progression_key']:
            if field in data:
                fields.append(f"{field} = ?")
                values.append(data[field])
        if not fields:
            return error_response("Sin campos para actualizar", code=ErrorCodes.VALIDATION_ERROR, status_code=400)

        fields.append("updated_at = CURRENT_TIMESTAMP")
        values.extend([patient['patient_id'], exercise_key])

        cursor.execute(f"""
            UPDATE exercise_progress SET {', '.join(fields)}
            WHERE patient_id = ? AND exercise_key = ?
        """, values)

        if cursor.rowcount == 0:
            # Insert if doesn't exist
            cursor.execute("""
                INSERT INTO exercise_progress
                (patient_id, exercise_key, current_weight, current_level, current_session, extra_load)
                VALUES (?, ?, ?, ?, ?, ?)
            """, [
                patient['patient_id'], exercise_key,
                data.get('current_weight', 0),
                data.get('current_level', 0),
                data.get('current_session', 1),
                data.get('extra_load', 0)
            ])

        conn.commit()
        conn.close()
        return success_response({'exercise_key': exercise_key, 'updated': True})
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================================
# 6. SESSIONS (Workout Logging)
# ============================================================

@training_bp.route('/v2/sessions', methods=['POST'])
@require_auth
def v2_create_session():
    """
    Create a training session (start a workout).

    Body:
    {
        "plan_id": 1,            (optional, null for ad-hoc)
        "day_number": 3,         (optional, from plan)
        "fecha": "2025-10-06",   (optional, defaults to today)
        "exercises": [           (optional, pre-populate from plan)
            {
                "exercise_key": "backSquat",
                "prescribed_sets": 3,
                "prescribed_reps": 5,
                "prescribed_weight": 80,
                "order_index": 0
            }
        ]
    }
    """
    user = get_current_user()
    patient = _get_patient(user)
    if not patient:
        return error_response("Paciente no encontrado", code=ErrorCodes.NOT_FOUND, status_code=404)

    data = request.get_json(silent=True) or {}
    plan_id = data.get('plan_id')
    day_number = data.get('day_number')
    fecha = data.get('fecha', date.today().isoformat())

    try:
        conn = get_clinical_connection(sqlite3.Row)
        _ensure_v2_tables(conn)
        cursor = conn.cursor()

        # If plan_id provided and no exercises, load from plan
        exercises = data.get('exercises', [])
        if plan_id and not exercises:
            cursor.execute("SELECT plan_json, current_day FROM training_plans_v2 WHERE id = ?", [plan_id])
            plan_row = cursor.fetchone()
            if plan_row:
                plan = _parse_json_field(plan_row['plan_json'], [])
                day = day_number or plan_row['current_day']
                if plan and 1 <= day <= len(plan):
                    day_data = plan[day - 1]
                    exercises = day_data.get('ejercicios', [])
                    day_number = day

        # Create session
        cursor.execute("""
            INSERT INTO training_sessions
            (patient_id, plan_id, day_number, fecha, started_at, completed)
            VALUES (?, ?, ?, ?, ?, 0)
        """, [patient['patient_id'], plan_id, day_number, fecha,
              datetime.now().isoformat()])
        session_id = cursor.lastrowid

        # Insert exercises
        for i, ej in enumerate(exercises):
            ek = ej.get('exercise_key', ej.get('key', ''))
            cursor.execute("""
                INSERT INTO session_exercises
                (session_id, exercise_key, order_index, prescribed_sets,
                 prescribed_reps, prescribed_weight)
                VALUES (?, ?, ?, ?, ?, ?)
            """, [
                session_id, ek,
                ej.get('order_index', i),
                ej.get('prescribed_sets'),
                ej.get('prescribed_reps'),
                ej.get('prescribed_weight')
            ])

        conn.commit()
        conn.close()

        return success_response({
            'session_id': session_id,
            'plan_id': plan_id,
            'day_number': day_number,
            'fecha': fecha,
            'exercises_count': len(exercises)
        })
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@training_bp.route('/v2/sessions/<int:session_id>', methods=['GET'])
@require_auth
def v2_get_session(session_id):
    """Get session detail with all exercises and extras."""
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM training_sessions WHERE id = ?", [session_id])
        session = cursor.fetchone()
        if not session:
            return error_response("Sesion no encontrada", code=ErrorCodes.NOT_FOUND, status_code=404)

        session_dict = dict(session)

        # Get exercises with metadata
        cursor.execute("""
            SELECT se.*, e.name_es, e.category, e.equipment, e.load_type,
                   e.modality, e.metric_type, e.muscle_groups, e.secondary_muscles
            FROM session_exercises se
            LEFT JOIN exercises e ON se.exercise_key = e.key
            WHERE se.session_id = ?
            ORDER BY se.order_index
        """, [session_id])
        exercises = []
        for r in cursor.fetchall():
            d = dict(r)
            d['sets'] = _parse_json_field(d.pop('sets_json', None), [])
            d['muscle_groups'] = _parse_json_field(d.get('muscle_groups'), [])
            d['secondary_muscles'] = _parse_json_field(d.get('secondary_muscles'), [])
            exercises.append(d)
        session_dict['exercises'] = exercises

        # Get extras
        cursor.execute("""
            SELECT * FROM session_extras WHERE session_id = ?
            ORDER BY id
        """, [session_id])
        extras = []
        for r in cursor.fetchall():
            d = dict(r)
            d['details'] = _parse_json_field(d.pop('details_json', None), {})
            extras.append(d)
        session_dict['extras'] = extras

        conn.close()
        return success_response({'session': session_dict})
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@training_bp.route('/v2/sessions/<int:session_id>', methods=['PUT'])
@require_auth
def v2_update_session(session_id):
    """
    Update a session — log exercises, finish workout, add extras.

    Body:
    {
        "completed": true,
        "duration_minutes": 65,
        "overall_difficulty": 7,
        "notes": "Buena sesion",
        "exercises": [
            {
                "id": 1,                    (session_exercises.id, for update)
                "exercise_key": "backSquat",  (for new exercises)
                "sets": [
                    {"set_num": 1, "reps_or_time": 5, "weight": 80, "rpe": 7, "completed": true, "is_warmup": false},
                    {"set_num": 2, "reps_or_time": 5, "weight": 80, "rpe": 8, "completed": true, "is_warmup": false}
                ],
                "difficulty": 7,
                "is_superset": false,
                "superset_group": null,
                "notes": ""
            }
        ],
        "extras": [
            {"type": "warmup", "description": "5 min remo", "duration_minutes": 5},
            {"type": "cardio", "description": "30 min cinta", "duration_minutes": 30, "intensity": "moderate",
             "details": {"speed": 8.5, "incline": 2}},
            {"type": "stretching", "description": "Elongacion general", "duration_minutes": 10},
            {"type": "mobility", "description": "Movilidad de cadera", "duration_minutes": 5}
        ]
    }
    """
    data = request.get_json(silent=True) or {}
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM training_sessions WHERE id = ?", [session_id])
        session = cursor.fetchone()
        if not session:
            return error_response("Sesion no encontrada", code=ErrorCodes.NOT_FOUND, status_code=404)

        # Update session fields
        update_fields = []
        update_values = []
        for field in ['duration_minutes', 'overall_difficulty', 'notes']:
            if field in data:
                update_fields.append(f"{field} = ?")
                update_values.append(data[field])
        if data.get('completed'):
            update_fields.append("completed = 1")
            update_fields.append("finished_at = ?")
            update_values.append(datetime.now().isoformat())

        if update_fields:
            update_values.append(session_id)
            cursor.execute(f"""
                UPDATE training_sessions SET {', '.join(update_fields)}
                WHERE id = ?
            """, update_values)

        # Update/insert exercises
        if 'exercises' in data:
            for ej in data['exercises']:
                sets_json = json.dumps(ej.get('sets', []), ensure_ascii=False) if 'sets' in ej else None
                ej_id = ej.get('id')
                ek = ej.get('exercise_key', '')

                # Try to find existing by id or by exercise_key
                if not ej_id and ek:
                    cursor.execute("""
                        SELECT id FROM session_exercises
                        WHERE session_id = ? AND exercise_key = ? LIMIT 1
                    """, [session_id, ek])
                    existing = cursor.fetchone()
                    if existing:
                        ej_id = existing['id']

                if ej_id:
                    # Update existing
                    ex_updates = []
                    ex_values = []
                    if sets_json is not None:
                        ex_updates.append("sets_json = ?")
                        ex_values.append(sets_json)
                    for f in ['difficulty', 'is_superset', 'superset_group', 'notes']:
                        if f in ej:
                            ex_updates.append(f"{f} = ?")
                            ex_values.append(ej[f])
                    if ex_updates:
                        ex_values.append(ej_id)
                        cursor.execute(f"""
                            UPDATE session_exercises SET {', '.join(ex_updates)}
                            WHERE id = ?
                        """, ex_values)
                else:
                    # Insert new exercise (ad-hoc addition)
                    cursor.execute("""
                        INSERT INTO session_exercises
                        (session_id, exercise_key, order_index, prescribed_sets,
                         prescribed_reps, prescribed_weight, sets_json,
                         difficulty, is_superset, superset_group, notes)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, [
                        session_id, ek,
                        ej.get('order_index', 0),
                        ej.get('prescribed_sets'),
                        ej.get('prescribed_reps'),
                        ej.get('prescribed_weight'),
                        sets_json,
                        ej.get('difficulty'),
                        ej.get('is_superset', 0),
                        ej.get('superset_group'),
                        ej.get('notes')
                    ])

        # Update/insert extras
        if 'extras' in data:
            # Replace all extras
            cursor.execute("DELETE FROM session_extras WHERE session_id = ?", [session_id])
            for extra in data['extras']:
                details_json = json.dumps(extra.get('details', {}), ensure_ascii=False) if 'details' in extra else None
                cursor.execute("""
                    INSERT INTO session_extras
                    (session_id, type, description, duration_minutes, intensity, details_json, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, [
                    session_id,
                    extra.get('type', 'warmup'),
                    extra.get('description'),
                    extra.get('duration_minutes'),
                    extra.get('intensity'),
                    details_json,
                    extra.get('notes')
                ])

        # If session completed, update exercise_progress
        if data.get('completed') and 'exercises' in data:
            _update_progress_from_session(cursor, session['patient_id'], data['exercises'])
            # Advance plan day
            if session['plan_id']:
                cursor.execute("SELECT current_day, total_days FROM training_plans_v2 WHERE id = ?",
                               [session['plan_id']])
                plan = cursor.fetchone()
                if plan:
                    next_day = (plan['current_day'] % plan['total_days']) + 1
                    cursor.execute("""
                        UPDATE training_plans_v2 SET current_day = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    """, [next_day, session['plan_id']])

        conn.commit()
        conn.close()

        return success_response({
            'session_id': session_id,
            'completed': bool(data.get('completed')),
            'updated': True
        })
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@training_bp.route('/v2/sessions/history', methods=['GET'])
@require_auth
def v2_session_history():
    """Get session history with summary per session."""
    user = get_current_user()
    patient = _get_patient(user)
    if not patient:
        return error_response("Paciente no encontrado", code=ErrorCodes.NOT_FOUND, status_code=404)

    limit = int(request.args.get('limit', 20))
    try:
        conn = get_clinical_connection(sqlite3.Row)
        _ensure_v2_tables(conn)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ts.*, tp.name as plan_name, tp.distribution_key
            FROM training_sessions ts
            LEFT JOIN training_plans_v2 tp ON ts.plan_id = tp.id
            WHERE ts.patient_id = ?
            ORDER BY ts.fecha DESC, ts.created_at DESC
            LIMIT ?
        """, [patient['patient_id'], limit])

        sessions = []
        for r in cursor.fetchall():
            d = dict(r)
            # Count exercises
            cursor.execute("""
                SELECT COUNT(*) as count FROM session_exercises WHERE session_id = ?
            """, [d['id']])
            d['exercises_count'] = cursor.fetchone()['count']
            sessions.append(d)

        conn.close()
        return success_response({'sessions': sessions, 'total': len(sessions)})
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@training_bp.route('/v2/sessions/<int:session_id>/exercises/<int:exercise_id>', methods=['PUT'])
@require_auth
def v2_update_session_exercise(session_id, exercise_id):
    """
    Update a single exercise within a session.
    Allows patient to modify sets, reps, weight, difficulty before/during workout.

    Body:
    {
        "sets": [
            {"set_num": 1, "reps_or_time": 5, "weight": 82.5, "rpe": 8, "completed": true, "is_warmup": false}
        ],
        "difficulty": 8,
        "is_superset": true,
        "superset_group": 1,
        "notes": "Subi peso"
    }
    """
    data = request.get_json(silent=True) or {}
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM session_exercises WHERE id = ? AND session_id = ?
        """, [exercise_id, session_id])
        if not cursor.fetchone():
            return error_response("Ejercicio no encontrado en la sesion",
                                  code=ErrorCodes.NOT_FOUND, status_code=404)

        updates = []
        values = []
        if 'sets' in data:
            updates.append("sets_json = ?")
            values.append(json.dumps(data['sets'], ensure_ascii=False))
        for f in ['difficulty', 'is_superset', 'superset_group', 'notes',
                   'prescribed_sets', 'prescribed_reps', 'prescribed_weight']:
            if f in data:
                updates.append(f"{f} = ?")
                values.append(data[f])

        if not updates:
            return error_response("Sin campos para actualizar",
                                  code=ErrorCodes.VALIDATION_ERROR, status_code=400)

        values.append(exercise_id)
        cursor.execute(f"UPDATE session_exercises SET {', '.join(updates)} WHERE id = ?", values)
        conn.commit()
        conn.close()

        return success_response({'exercise_id': exercise_id, 'updated': True})
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================================
# 7. STATS
# ============================================================

@training_bp.route('/v2/stats', methods=['GET'])
@require_auth
def v2_training_stats():
    """Training stats for current user: total sessions, volume, streak."""
    user = get_current_user()
    patient = _get_patient(user)
    if not patient:
        return error_response("Paciente no encontrado", code=ErrorCodes.NOT_FOUND, status_code=404)

    days = int(request.args.get('days', 30))
    try:
        conn = get_clinical_connection(sqlite3.Row)
        _ensure_v2_tables(conn)
        cursor = conn.cursor()
        pid = patient['patient_id']

        # Total sessions in period
        cursor.execute("""
            SELECT COUNT(*) as total,
                   SUM(duration_minutes) as total_minutes,
                   AVG(overall_difficulty) as avg_difficulty
            FROM training_sessions
            WHERE patient_id = ? AND completed = 1
              AND fecha >= date('now', ?)
        """, [pid, f'-{days} days'])
        stats = dict(cursor.fetchone())

        # Sessions per week
        cursor.execute("""
            SELECT strftime('%W', fecha) as week, COUNT(*) as count
            FROM training_sessions
            WHERE patient_id = ? AND completed = 1
              AND fecha >= date('now', ?)
            GROUP BY week ORDER BY week
        """, [pid, f'-{days} days'])
        weekly = [dict(r) for r in cursor.fetchall()]

        # Exercises volume (total sets completed)
        cursor.execute("""
            SELECT se.exercise_key, e.name_es, COUNT(*) as sessions,
                   MAX(json_extract(se.sets_json, '$[0].weight')) as max_weight
            FROM session_exercises se
            JOIN training_sessions ts ON se.session_id = ts.id
            LEFT JOIN exercises e ON se.exercise_key = e.key
            WHERE ts.patient_id = ? AND ts.completed = 1
              AND ts.fecha >= date('now', ?)
            GROUP BY se.exercise_key
            ORDER BY sessions DESC
        """, [pid, f'-{days} days'])
        exercise_freq = [dict(r) for r in cursor.fetchall()]

        # Current streak
        cursor.execute("""
            SELECT DISTINCT fecha FROM training_sessions
            WHERE patient_id = ? AND completed = 1
            ORDER BY fecha DESC LIMIT 30
        """, [pid])
        dates = [r['fecha'] for r in cursor.fetchall()]
        streak = _calc_streak(dates)

        conn.close()

        return success_response({
            'period_days': days,
            'total_sessions': stats['total'] or 0,
            'total_minutes': stats['total_minutes'] or 0,
            'avg_difficulty': round(stats['avg_difficulty'] or 0, 1),
            'weekly_distribution': weekly,
            'exercise_frequency': exercise_freq,
            'current_streak': streak
        })
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================================
# Plan Generation Helpers
# ============================================================

def _generate_weakness_plan(cursor, patient_id, total_days, ex_per_day, all_exercises):
    """Generate plan prioritizing weak categories from strength analysis."""
    # Get latest strength test
    cursor.execute("""
        SELECT categories_results_json, lifts_results_json
        FROM strength_tests WHERE patient_id = ?
        ORDER BY fecha DESC LIMIT 1
    """, [patient_id])
    st = cursor.fetchone()

    if not st:
        # No strength data — fallback to balanced distribution
        return _generate_fullbody_plan(total_days, ex_per_day, all_exercises)

    categories = _parse_json_field(st['categories_results_json'], {})
    if not categories:
        return _generate_fullbody_plan(total_days, ex_per_day, all_exercises)

    # Calculate sessions per category (inverse of score)
    total_score = sum(categories.values()) or 1
    total_sessions = total_days * ex_per_day
    cat_sessions = {}
    for cat, score in categories.items():
        # Lower score = more sessions
        inverse = (total_score - score)
        cat_sessions[cat] = max(1, inverse)

    # Normalize to total_sessions
    norm_sum = sum(cat_sessions.values()) or 1
    for cat in cat_sessions:
        cat_sessions[cat] = max(1, round(cat_sessions[cat] / norm_sum * total_sessions))

    # Try PuLP optimizer
    try:
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))
        from workout_optimizer import optimize_split

        # Map categories to exercises
        cat_exercises = {}
        for ek, ex in all_exercises.items():
            cat = ex['category']
            if cat not in cat_exercises:
                cat_exercises[cat] = []
            cat_exercises[cat].append(ek)

        # Distribute exercises across sessions
        exercise_sessions = {}
        for cat, num in cat_sessions.items():
            exs = cat_exercises.get(cat, [])
            if not exs:
                continue
            per_ex = max(1, num // len(exs))
            for ex in exs:
                exercise_sessions[ex] = per_ex

        grid, _ = optimize_split(exercise_sessions, days=total_days, ex_per_day=ex_per_day)

        # Convert grid to plan format
        plan = []
        for day_idx, day_exercises in enumerate(grid):
            plan.append({
                'dia': day_idx + 1,
                'ejercicios': [{'exercise_key': ek, 'order_index': i} for i, ek in enumerate(day_exercises)]
            })
        return plan
    except Exception:
        # Fallback: manual distribution
        return _generate_manual_weakness_plan(cat_sessions, all_exercises, total_days, ex_per_day)


def _generate_manual_weakness_plan(cat_sessions, all_exercises, total_days, ex_per_day):
    """Manual fallback when PuLP not available."""
    cat_exercises = {}
    for ek, ex in all_exercises.items():
        cat = ex['category']
        if cat not in cat_exercises:
            cat_exercises[cat] = []
        cat_exercises[cat].append(ek)

    # Build pool of exercises weighted by weakness
    pool = []
    for cat, num in sorted(cat_sessions.items(), key=lambda x: -x[1]):
        exs = cat_exercises.get(cat, [])
        for i in range(num):
            pool.append(exs[i % len(exs)])

    plan = []
    idx = 0
    for d in range(total_days):
        day_exs = []
        for _ in range(ex_per_day):
            if idx < len(pool):
                day_exs.append({'exercise_key': pool[idx], 'order_index': len(day_exs)})
                idx += 1
        plan.append({'dia': d + 1, 'ejercicios': day_exs})
    return plan


def _generate_split_plan(dist_config, total_days, ex_per_day, all_exercises):
    """Generate PPL or Upper/Lower split."""
    split = dist_config.get('split', {})
    days_config = dist_config.get('days_config', {})
    day_types = days_config.get(str(total_days), [])
    if not day_types:
        day_types = list(split.keys()) * (total_days // len(split) + 1)
        day_types = day_types[:total_days]

    # Map categories to exercises
    cat_exercises = {}
    for ek, ex in all_exercises.items():
        cat = ex['category']
        if cat not in cat_exercises:
            cat_exercises[cat] = []
        cat_exercises[cat].append(ek)

    plan = []
    cat_counters = {}
    for d, day_type in enumerate(day_types):
        categories = split.get(day_type, [])
        day_exs = []
        for cat in categories:
            exs = cat_exercises.get(cat, [])
            if not exs:
                continue
            counter = cat_counters.get(cat, 0)
            # Pick exercises rotating through the list
            for _ in range(max(1, ex_per_day // len(categories))):
                if len(day_exs) >= ex_per_day:
                    break
                ek = exs[counter % len(exs)]
                day_exs.append({'exercise_key': ek, 'order_index': len(day_exs)})
                counter += 1
            cat_counters[cat] = counter
        plan.append({'dia': d + 1, 'tipo': day_type, 'ejercicios': day_exs[:ex_per_day]})
    return plan


def _generate_fullbody_plan(total_days, ex_per_day, all_exercises):
    """Generate full body plan — 1 exercise per category per day, rotating variants."""
    categories = ['squat', 'floorPull', 'horizontalPress', 'verticalPress', 'pullup']
    cat_exercises = {}
    for ek, ex in all_exercises.items():
        cat = ex['category']
        if cat in categories:
            if cat not in cat_exercises:
                cat_exercises[cat] = []
            cat_exercises[cat].append(ek)

    plan = []
    for d in range(total_days):
        day_exs = []
        for i, cat in enumerate(categories):
            if len(day_exs) >= ex_per_day:
                break
            exs = cat_exercises.get(cat, [])
            if exs:
                ek = exs[d % len(exs)]
                day_exs.append({'exercise_key': ek, 'order_index': len(day_exs)})
        plan.append({'dia': d + 1, 'tipo': 'full_body', 'ejercicios': day_exs})
    return plan


def _apply_progression_defaults(plan_dias, prog_key, prog_config, all_exercises):
    """Enrich plan exercises with default sets/reps from progression template."""
    for dia in plan_dias:
        for ej in dia.get('ejercicios', []):
            if prog_key == 'linear_simple':
                ej['prescribed_sets'] = prog_config.get('sets', 3)
                ej['prescribed_reps'] = prog_config.get('target_reps', 5)
            elif prog_key == 'double_progression':
                ej['prescribed_sets'] = prog_config.get('sets', 3)
                rep_range = prog_config.get('rep_range', [8, 12])
                ej['prescribed_reps'] = rep_range[0]
            elif prog_key == 'wave_531':
                # First week defaults
                weeks = prog_config.get('weeks', [])
                if weeks:
                    ej['prescribed_sets'] = len(weeks[0].get('sets', []))
                    ej['prescribed_reps'] = weeks[0]['sets'][0].get('reps', 5) if weeks[0].get('sets') else 5
            else:
                # matrix or unknown — use 3x5 default
                ej['prescribed_sets'] = 3
                ej['prescribed_reps'] = 5
    return plan_dias


def _update_progress_from_session(cursor, patient_id, exercises):
    """Update exercise_progress based on completed session exercises."""
    for ej in exercises:
        ek = ej.get('exercise_key', '')
        if not ek:
            continue
        sets = ej.get('sets', [])
        completed_sets = [s for s in sets if s.get('completed') and not s.get('is_warmup')]
        if not completed_sets:
            continue

        max_weight = max((s.get('weight', 0) for s in completed_sets), default=0)
        last_reps = completed_sets[-1].get('reps_or_time', 0) if completed_sets else 0

        cursor.execute("""
            UPDATE exercise_progress
            SET current_weight = MAX(current_weight, ?),
                last_reps = ?,
                current_session = current_session + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE patient_id = ? AND exercise_key = ?
        """, [max_weight, last_reps, patient_id, ek])


def _calc_streak(dates):
    """Calculate consecutive training day streak from sorted date list."""
    if not dates:
        return 0
    streak = 1
    for i in range(1, len(dates)):
        try:
            d1 = datetime.strptime(dates[i - 1], '%Y-%m-%d').date()
            d2 = datetime.strptime(dates[i], '%Y-%m-%d').date()
            diff = (d1 - d2).days
            if diff <= 2:  # Allow 1 rest day
                streak += 1
            else:
                break
        except (ValueError, TypeError):
            break
    return streak
