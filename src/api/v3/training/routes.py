"""
TRAINING Routes - Endpoints de entrenamiento y fuerza

Step 6 (OMV-53/55/56/57/58/59/61): toda la persistencia de planes, sesiones,
estandares y programas vive en clinical.db. Las helpers en `training.helpers`
reemplazan los imports legacy (`import functions`, `from main import ...`).
"""

from flask import request
from . import training_bp
from . import helpers
from ..common.responses import success_response, error_response, paginated_response, ErrorCodes
from ..common.auth import (
    require_auth, require_admin, require_owner_or_admin,
    get_current_user, check_patient_access,
)
from ..common.database import get_db_connection, get_clinical_connection, resolve_patient_id
import sqlite3
import json
from datetime import datetime


# ============================================
# ANALISIS DE FUERZA
# ============================================

@training_bp.route('/strength', methods=['GET'])
@require_auth
def get_strength_data():
    """
    Obtiene los datos de fuerza del usuario autenticado o paciente target.
    Admin / especialista asignado puede ver con ?user=<nombre>.
    """
    user = get_current_user()
    user_param = request.args.get('user', user.get('nombre_apellido'))
    patient = resolve_patient_id(user_param)

    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    if not check_patient_access(user, patient['nombre']):
        return error_response(
            'No tienes permisos para ver datos de este paciente',
            code=ErrorCodes.FORBIDDEN, status_code=403
        )

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM strength_tests
            WHERE patient_id = ?
            ORDER BY fecha DESC
            LIMIT 1
        """, [patient['patient_id']])

        strength = cursor.fetchone()
        conn.close()

        if not strength:
            return success_response({
                'user': patient['nombre'],
                'strength_data': None,
                'message': 'No hay datos de fuerza registrados'
            })

        strength_dict = dict(strength)
        for field in ['lift_inputs_json', 'lifts_results_json', 'categories_results_json',
                      'muscle_groups_json', 'standards_json']:
            if strength_dict.get(field):
                try:
                    strength_dict[field] = json.loads(strength_dict[field])
                except (TypeError, ValueError, json.JSONDecodeError):
                    pass

        return success_response({
            'user': patient['nombre'],
            'strength_data': strength_dict
        })

    except Exception as e:
        return error_response(
            f'Error obteniendo datos de fuerza: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


@training_bp.route('/strength', methods=['POST'])
@require_auth
def create_strength_record():
    """
    Registra un nuevo test de fuerza simple en clinical.db.strength_tests.

    Body:
        ejercicios: { 'squat': {peso, reps}, ... }
        peso_corporal: float
        nombre_apellido | patient: opcional (admin / especialista)
    """
    user = get_current_user()
    data = request.get_json() or {}

    target_name = data.get('nombre_apellido') or data.get('patient')
    if target_name:
        if not check_patient_access(user, target_name):
            return error_response('No tienes permisos para este paciente',
                                  code=ErrorCodes.FORBIDDEN, status_code=403)
        patient = resolve_patient_id(target_name)
    else:
        patient = resolve_patient_id(user.get('nombre_apellido') or user.get('dni'))

    if not data.get('ejercicios'):
        return error_response(
            'Los datos de ejercicios son requeridos',
            code=ErrorCodes.VALIDATION_ERROR, status_code=400
        )
    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()

        # Calcular 1RM (formula Epley)
        ejercicios_calculados = {}
        for ejercicio, valores in data['ejercicios'].items():
            peso = float(valores.get('peso', 0))
            reps = int(valores.get('reps', 1))
            one_rm = peso if reps == 1 else peso * (1 + reps / 30)
            ejercicios_calculados[ejercicio] = {
                'peso': peso, 'reps': reps, 'one_rm': round(one_rm, 1),
            }

        cursor.execute("""
            INSERT INTO strength_tests
                (patient_id, fecha, bodyweight, lift_inputs_json, lifts_results_json)
            VALUES (?, datetime('now', 'localtime'), ?, ?, ?)
        """, [
            patient['patient_id'],
            data.get('peso_corporal'),
            json.dumps(data['ejercicios']),
            json.dumps(ejercicios_calculados),
        ])

        record_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return success_response({
            'id': record_id,
            'ejercicios_calculados': ejercicios_calculados
        }, message='Test de fuerza registrado exitosamente')

    except Exception as e:
        return error_response(
            f'Error registrando test de fuerza: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


@training_bp.route('/strength/history', methods=['GET'])
@require_auth
def get_strength_history():
    """
    Historial de tests de fuerza desde clinical.db.strength_tests.

    Query params:
        limit (default 20)
        user: nombre/dni/email del paciente target (admin / especialista)
    """
    user = get_current_user()
    limit = request.args.get('limit', 20, type=int)
    user_param = request.args.get('user', user.get('nombre_apellido'))
    patient = resolve_patient_id(user_param)

    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    if not check_patient_access(user, patient['nombre']):
        return error_response(
            'No tienes permisos para ver datos de este paciente',
            code=ErrorCodes.FORBIDDEN, status_code=403
        )

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM strength_tests
            WHERE patient_id = ?
            ORDER BY fecha DESC
            LIMIT ?
        """, [patient['patient_id'], limit])

        records = []
        for row in cursor.fetchall():
            record = dict(row)
            for field in ['lift_inputs_json', 'lifts_results_json',
                          'categories_results_json', 'muscle_groups_json', 'standards_json']:
                if record.get(field):
                    try:
                        record[field] = json.loads(record[field])
                    except (TypeError, ValueError, json.JSONDecodeError):
                        pass
            records.append(record)
        conn.close()

        return success_response({
            'user': patient['nombre'],
            'history': records,
            'total': len(records),
        })

    except Exception as e:
        return error_response(
            f'Error obteniendo historial: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


@training_bp.route('/strength/<int:record_id>', methods=['DELETE'])
@require_admin
def delete_strength_record(record_id):
    """Elimina un registro de fuerza (solo admin)."""
    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM strength_tests WHERE id = ?", [record_id])
        if cursor.rowcount == 0:
            conn.close()
            return error_response('Registro no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
        conn.commit()
        conn.close()
        return success_response({'id': record_id, 'deleted': True},
                                message='Registro eliminado exitosamente')
    except Exception as e:
        return error_response(
            f'Error eliminando registro: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


# ============================================
# OMV-57: Strength standards desde DB
# ============================================

@training_bp.route('/strength/standards', methods=['GET'])
def get_strength_standards():
    """
    Estandares de fuerza desde clinical.db.strength_standards (OMV-57).
    Endpoint publico.

    Query params:
        sex: 'M' (default) | 'F' | 'A'
        lift: opcional, filtra por un solo lift_key
    """
    sex = (request.args.get('sex') or 'M').upper()
    if sex not in ('M', 'F', 'A'):
        sex = 'M'
    lift_filter = request.args.get('lift')

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        if lift_filter:
            cursor.execute("""
                SELECT lift_key, level, sex, bw_multiplier
                FROM strength_standards
                WHERE sex = ? AND lift_key = ?
                ORDER BY lift_key, bw_multiplier ASC
            """, [sex, lift_filter])
        else:
            cursor.execute("""
                SELECT lift_key, level, sex, bw_multiplier
                FROM strength_standards
                WHERE sex = ?
                ORDER BY lift_key, bw_multiplier ASC
            """, [sex])

        standards = {}
        levels_seen = []
        for row in cursor.fetchall():
            standards.setdefault(row['lift_key'], {})[row['level']] = row['bw_multiplier']
            if row['level'] not in levels_seen:
                levels_seen.append(row['level'])
        conn.close()

        if not standards:
            return success_response({
                'standards': {},
                'note': 'No hay standards cargados para sex=' + sex,
                'sex': sex,
                'categories': [],
            })

        return success_response({
            'standards': standards,
            'note': 'Valores expresados como multiplo del peso corporal',
            'sex': sex,
            'categories': levels_seen or ['beginner', 'novice', 'intermediate', 'advanced', 'elite'],
        })

    except Exception as e:
        return error_response(
            f'Error obteniendo standards: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


# ============================================
# LEVANTAMIENTOS (LIFTS) — legacy table, no migrado en step 6
# ============================================

@training_bp.route('/lifts', methods=['GET'])
@require_auth
def get_lifts():
    """Estado de ejercicios del usuario (legacy ESTADO_EJERCICIO_USUARIO)."""
    user = get_current_user()
    target_user = request.args.get('user', user.get('nombre_apellido'))

    if not check_patient_access(user, target_user):
        return error_response(
            'No tienes permisos para ver datos de este paciente',
            code=ErrorCodes.FORBIDDEN, status_code=403
        )

    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM ESTADO_EJERCICIO_USUARIO WHERE user_id = ?
        """, [target_user])
        lifts = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return success_response({'user': target_user, 'lifts': lifts, 'total': len(lifts)})
    except Exception as e:
        return error_response(
            f'Error obteniendo levantamientos: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


@training_bp.route('/lifts', methods=['POST'])
@require_auth
def save_lift():
    """Guarda un levantamiento en ESTADO_EJERCICIO_USUARIO (legacy)."""
    user = get_current_user()
    data = request.get_json() or {}
    required = ['ejercicio', 'peso', 'reps']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return error_response(
            f'Campos requeridos: {", ".join(missing)}',
            code=ErrorCodes.VALIDATION_ERROR, status_code=400
        )

    target_name = data.get('nombre_apellido') or data.get('patient')
    if target_name:
        if not check_patient_access(user, target_name):
            return error_response('No tienes permisos para este paciente',
                                  code=ErrorCodes.FORBIDDEN, status_code=403)
        target_user_name = target_name
    else:
        target_user_name = user.get('nombre_apellido')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        peso = float(data['peso'])
        reps = int(data['reps'])
        one_rm = peso * (1 + reps / 30) if reps > 1 else peso

        # Schema legacy de ESTADO_EJERCICIO_USUARIO con UNIQUE(user_id, ejercicio_nombre)
        cursor.execute("""
            INSERT INTO ESTADO_EJERCICIO_USUARIO
                (user_id, ejercicio_nombre, current_columna, current_sesion,
                 current_peso, last_test_reps, last_test_date)
            VALUES (?, ?, 1, 1, ?, ?, datetime('now', 'localtime'))
            ON CONFLICT(user_id, ejercicio_nombre) DO UPDATE SET
                current_peso = excluded.current_peso,
                last_test_reps = excluded.last_test_reps,
                last_test_date = excluded.last_test_date
        """, [target_user_name, data['ejercicio'], peso, reps])

        conn.commit()
        conn.close()
        return success_response({
            'ejercicio': data['ejercicio'], 'peso': peso, 'reps': reps,
            'one_rm': round(one_rm, 1),
        }, message='Levantamiento guardado exitosamente')
    except Exception as e:
        return error_response(
            f'Error guardando levantamiento: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


@training_bp.route('/exercises', methods=['GET'])
@require_auth
def list_exercises():
    """Lista los ejercicios disponibles (lista hardcoded simple — el catalogo
    relacional vivo esta en /v2/exercises)."""
    exercises = [
        {'id': 'squat', 'nombre': 'Sentadilla', 'categoria': 'piernas', 'principal': True},
        {'id': 'bench', 'nombre': 'Press de Banca', 'categoria': 'pecho', 'principal': True},
        {'id': 'deadlift', 'nombre': 'Peso Muerto', 'categoria': 'espalda', 'principal': True},
        {'id': 'overhead_press', 'nombre': 'Press Militar', 'categoria': 'hombros', 'principal': True},
        {'id': 'row', 'nombre': 'Remo', 'categoria': 'espalda', 'principal': True},
        {'id': 'pullup', 'nombre': 'Dominadas', 'categoria': 'espalda', 'principal': False},
        {'id': 'dip', 'nombre': 'Fondos', 'categoria': 'pecho', 'principal': False},
        {'id': 'curl', 'nombre': 'Curl de Biceps', 'categoria': 'brazos', 'principal': False},
        {'id': 'tricep_extension', 'nombre': 'Extension de Triceps', 'categoria': 'brazos', 'principal': False},
        {'id': 'leg_press', 'nombre': 'Prensa de Piernas', 'categoria': 'piernas', 'principal': False},
        {'id': 'leg_curl', 'nombre': 'Curl de Piernas', 'categoria': 'piernas', 'principal': False},
        {'id': 'calf_raise', 'nombre': 'Elevacion de Talones', 'categoria': 'piernas', 'principal': False},
        {'id': 'lateral_raise', 'nombre': 'Elevaciones Laterales', 'categoria': 'hombros', 'principal': False},
        {'id': 'face_pull', 'nombre': 'Face Pull', 'categoria': 'espalda', 'principal': False},
    ]
    return success_response({
        'exercises': exercises, 'total': len(exercises),
        'categorias': ['piernas', 'pecho', 'espalda', 'hombros', 'brazos'],
    })


# ============================================
# PLANES DE ENTRENAMIENTO (OMV-55: clinical.db.training_plans_v2)
# ============================================

@training_bp.route('/plans', methods=['GET'])
@require_auth
def list_training_plans():
    """Lista planes desde clinical.db.training_plans_v2 (OMV-55)."""
    user = get_current_user()
    target_name = request.args.get('nombre_apellido') or request.args.get('patient')

    if target_name:
        if not check_patient_access(user, target_name):
            return error_response('No tienes permisos para este paciente',
                                  code=ErrorCodes.FORBIDDEN, status_code=403)
        target = resolve_patient_id(target_name)
    else:
        target = resolve_patient_id(user.get('nombre_apellido') or user.get('dni'))

    if not target:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        plans = helpers.list_plans_for_patient(target['patient_id'])
        return success_response({'plans': plans, 'total': len(plans)})
    except Exception as e:
        return error_response(
            f'Error listando planes: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


@training_bp.route('/plans/<int:plan_id>', methods=['GET'])
@require_auth
def get_training_plan(plan_id):
    """Plan especifico desde clinical.db.training_plans_v2 (OMV-55)."""
    user = get_current_user()
    try:
        plan = helpers.get_plan_by_id(plan_id)
        if not plan:
            return error_response('Plan no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
        if not check_patient_access(user, plan.get('patient_id')):
            return error_response(
                'No tienes permisos para ver este plan',
                code=ErrorCodes.FORBIDDEN, status_code=403
            )
        return success_response({'plan': plan})
    except Exception as e:
        return error_response(
            f'Error obteniendo plan: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


@training_bp.route('/plans', methods=['POST'])
@require_auth
def create_training_plan():
    """
    Crea un plan manual en clinical.db.training_plans_v2 (OMV-55).

    Body:
        plan_data: {dias: [{dia: 1, ejercicios: [...]}, ...]}  (string o objeto)
        total_dias: 1-14 (default 5)
        name, distribution_key, progression_key (opcional)
        nombre_apellido | patient (opcional, para especialista/admin)
    """
    user = get_current_user()
    data = request.get_json() or {}

    target_name = data.get('nombre_apellido') or data.get('patient')
    if target_name:
        if not check_patient_access(user, target_name):
            return error_response('No tienes permisos para este paciente',
                                  code=ErrorCodes.FORBIDDEN, status_code=403)
        target = resolve_patient_id(target_name)
    else:
        target = resolve_patient_id(user.get('nombre_apellido') or user.get('dni'))
    if not target:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    plan_data = data.get('plan_data') or data.get('plan_json')
    if not plan_data:
        return error_response('plan_data es requerido',
                              code=ErrorCodes.VALIDATION_ERROR, status_code=400)
    if isinstance(plan_data, str):
        try:
            plan_data_obj = json.loads(plan_data)
        except (json.JSONDecodeError, ValueError):
            return error_response('plan_data debe ser JSON valido',
                                  code=ErrorCodes.VALIDATION_ERROR, status_code=400)
    else:
        plan_data_obj = plan_data

    try:
        total_dias = int(data.get('total_dias', 5))
    except (TypeError, ValueError):
        return error_response('total_dias debe ser un entero',
                              code=ErrorCodes.VALIDATION_ERROR, status_code=400)
    if total_dias < 1 or total_dias > 14:
        return error_response('total_dias debe estar entre 1 y 14',
                              code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    try:
        plan_id = helpers.create_manual_plan(
            target['patient_id'], plan_data_obj, total_dias,
            name=data.get('name') or data.get('nombre'),
            distribution_key=data.get('distribution_key'),
            progression_key=data.get('progression_key'),
        )
        return success_response({
            'id': plan_id,
            'patient_id': target['patient_id'],
            'user_id': target.get('dni'),
            'total_dias': total_dias,
            'current_dia': 1,
            'active': True,
        }, message='Plan de entrenamiento creado exitosamente', status_code=201)
    except Exception as e:
        return error_response(
            f'Error creando plan de entrenamiento: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


@training_bp.route('/plans/<int:plan_id>/optimize', methods=['POST'])
@require_auth
def optimize_training_plan(plan_id):
    """
    Optimiza/regenera un plan usando PuLP (OMV-53).
    Body: numeroDias?, numeroEjercicios?, runningConfig?, source_strength_id?
    """
    user = get_current_user()
    data = request.get_json() or {}

    plan = helpers.get_plan_by_id(plan_id)
    if not plan:
        return error_response('Plan no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    patient_id = plan.get('patient_id')
    if not check_patient_access(user, patient_id):
        return error_response(
            'No tienes permisos para optimizar este plan',
            code=ErrorCodes.FORBIDDEN, status_code=403
        )

    try:
        numero_dias = int(data.get('numeroDias') or plan.get('total_days') or 3)
        numero_ejercicios = int(data.get('numeroEjercicios') or 3)
    except (TypeError, ValueError):
        return error_response(
            'numeroDias / numeroEjercicios deben ser enteros',
            code=ErrorCodes.VALIDATION_ERROR, status_code=400
        )

    try:
        result = helpers.optimize_plan_for_patient(
            patient_id,
            numero_dias=numero_dias,
            numero_ejercicios=numero_ejercicios,
            running_config=data.get('runningConfig'),
            source_strength_id=data.get('source_strength_id'),
        )
        return success_response({
            'plan_id': result.get('plan_id'),
            'previous_plan_id': plan_id,
            'source_strength_id': result.get('source_strength_id'),
            'relativeData': result['relativeData'],
            'optimizationResults': result['optimizationResults'],
        }, message='Plan optimizado y persistido')
    except ValueError as e:
        return error_response(str(e), code=ErrorCodes.VALIDATION_ERROR, status_code=400)
    except Exception as e:
        return error_response(
            f'Error en optimizacion: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


# ============================================
# SESIONES DE ENTRENAMIENTO (OMV-55, OMV-61)
# ============================================

@training_bp.route('/sessions/current', methods=['GET'])
@require_auth
def get_current_session():
    """Sesion actual del usuario o paciente target (clinical.db.training_plans_v2)."""
    user = get_current_user()
    target_name = request.args.get('nombre_apellido') or request.args.get('patient')

    if target_name:
        if not check_patient_access(user, target_name):
            return error_response('No tienes permisos para este paciente',
                                  code=ErrorCodes.FORBIDDEN, status_code=403)
        target = resolve_patient_id(target_name)
    else:
        target = resolve_patient_id(user.get('nombre_apellido') or user.get('dni'))

    if not target:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        plan = helpers.get_active_plan(target['patient_id'])
        if not plan:
            return success_response({
                'session': None,
                'message': 'No hay plan de entrenamiento activo'
            })
        return success_response({
            'session': {
                'plan_id': plan.get('id'),
                'dia_actual': plan.get('current_dia', 1),
                'total_dias': plan.get('total_dias', 1),
                'cycle_week': plan.get('cycle_week', 1),
                'plan_data': plan.get('plan_data'),
            }
        })
    except Exception as e:
        return error_response(
            f'Error obteniendo sesion: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


@training_bp.route('/sessions', methods=['POST'])
@require_auth
def register_session():
    """
    Registra una sesion completada en clinical.db (training_sessions + session_exercises).

    Body: plan_id, ejercicios_completados[], duracion_minutos, notas, plan_id, day_number
    """
    user = get_current_user()
    data = request.get_json() or {}

    target_name = data.get('nombre_apellido') or data.get('patient')
    if target_name:
        if not check_patient_access(user, target_name):
            return error_response('No tienes permisos para este paciente',
                                  code=ErrorCodes.FORBIDDEN, status_code=403)
        target_patient = resolve_patient_id(target_name)
    else:
        target_patient = resolve_patient_id(user.get('nombre_apellido') or user.get('dni'))

    if not target_patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    pid = target_patient['patient_id']
    ejercicios = data.get('ejercicios_completados') or data.get('exercises') or []

    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO training_sessions
                (patient_id, plan_id, day_number, fecha,
                 started_at, finished_at, duration_minutes,
                 overall_difficulty, notes, completed)
            VALUES (?, ?, ?, date('now', 'localtime'),
                    datetime('now', 'localtime'), datetime('now', 'localtime'), ?,
                    ?, ?, ?)
        """, [
            pid,
            data.get('plan_id'),
            data.get('day_number') or data.get('dia_actual'),
            data.get('duracion_minutos') or data.get('duration_minutes'),
            data.get('overall_difficulty') or data.get('rpe_general'),
            data.get('notas') or data.get('notes'),
            1 if data.get('completed', True) else 0,
        ])
        session_id = cursor.lastrowid

        for i, ex in enumerate(ejercicios):
            if not isinstance(ex, dict):
                continue
            cursor.execute("""
                INSERT INTO session_exercises
                    (session_id, exercise_key, order_index,
                     prescribed_sets, prescribed_reps, prescribed_weight,
                     sets_json, difficulty, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                session_id,
                ex.get('exercise_key') or ex.get('ejercicio') or 'unknown',
                i,
                ex.get('prescribed_sets') or ex.get('sets'),
                ex.get('prescribed_reps') or ex.get('reps'),
                ex.get('prescribed_weight') or ex.get('peso') or ex.get('weight'),
                json.dumps(ex.get('sets_json') or ex.get('sets_detail') or []),
                ex.get('difficulty') or ex.get('rpe'),
                ex.get('notas') or ex.get('notes'),
            ])

        conn.commit()
        conn.close()

        return success_response({
            'session_id': session_id,
            'patient_id': pid,
            'ejercicios_registrados': len([e for e in ejercicios if isinstance(e, dict)]),
        }, message='Sesion registrada exitosamente')

    except Exception as e:
        return error_response(
            f'Error registrando sesion: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


@training_bp.route('/sessions/advance', methods=['POST'])
@require_auth
def advance_day():
    """
    Avanza al siguiente dia del plan activo en clinical.db.training_plans_v2 (OMV-55, OMV-61).
    Si se completa el ciclo, incrementa cycle_week.
    """
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    target_name = data.get('nombre_apellido') or data.get('patient')

    if target_name:
        if not check_patient_access(user, target_name):
            return error_response('No tienes permisos para este paciente',
                                  code=ErrorCodes.FORBIDDEN, status_code=403)
        target = resolve_patient_id(target_name)
    else:
        target = resolve_patient_id(user.get('nombre_apellido') or user.get('dni'))

    if not target:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        result = helpers.advance_plan_day(target['patient_id'])
        if not result:
            return error_response('No hay plan activo', code=ErrorCodes.NOT_FOUND, status_code=404)
        return success_response(result, message='Dia avanzado exitosamente')
    except Exception as e:
        return error_response(
            f'Error avanzando dia: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


@training_bp.route('/sessions/complete', methods=['POST'])
@require_auth
def complete_session():
    """
    Marca una sesion completada y avanza la progresion (OMV-61).

    Body:
        nombre_apellido | patient: opcional (especialista/admin)
        ejercicios: [{
            exercise_key | ejercicio,
            completed: bool (default True),
            test_reps: int (cuando estaba en sesion TEST),
            test_minutes, test_speed, speed_increment (running TEST),
            weight_increment: float (kg si reps==10),
            converted_to_test: bool (forzar test)
        }]
        advance_day: bool (default True). Si true, avanza tambien current_day.
    """
    user = get_current_user()
    data = request.get_json() or {}
    target_name = data.get('nombre_apellido') or data.get('patient')

    if target_name:
        if not check_patient_access(user, target_name):
            return error_response('No tienes permisos para este paciente',
                                  code=ErrorCodes.FORBIDDEN, status_code=403)
        target = resolve_patient_id(target_name)
    else:
        target = resolve_patient_id(user.get('nombre_apellido') or user.get('dni'))

    if not target:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    ejercicios = data.get('ejercicios') or data.get('exercises') or []
    if not isinstance(ejercicios, list) or not ejercicios:
        return error_response(
            'ejercicios es requerido (lista no vacia)',
            code=ErrorCodes.VALIDATION_ERROR, status_code=400
        )

    try:
        progress_results = helpers.advance_progression_after_session(target['patient_id'], ejercicios)
        day_result = None
        if data.get('advance_day', True):
            day_result = helpers.advance_plan_day(target['patient_id'])
        return success_response({
            'ejercicios_actualizados': progress_results,
            'day': day_result,
        }, message='Sesion procesada')
    except Exception as e:
        return error_response(
            f'Error completando sesion: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


@training_bp.route('/sessions/history', methods=['GET'])
@require_auth
def get_session_history():
    """
    Historial de sesiones desde clinical.db.training_sessions + session_exercises.
    Query params: limit (default 20), nombre_apellido | patient (opcional).
    """
    user = get_current_user()
    limit = request.args.get('limit', 20, type=int)
    target_name = request.args.get('nombre_apellido') or request.args.get('patient')

    if target_name:
        if not check_patient_access(user, target_name):
            return error_response('No tienes permisos para este paciente',
                                  code=ErrorCodes.FORBIDDEN, status_code=403)
        target_patient = resolve_patient_id(target_name)
    else:
        target_patient = resolve_patient_id(user.get('nombre_apellido') or user.get('dni'))

    if not target_patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    pid = target_patient['patient_id']

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM training_sessions
            WHERE patient_id = ?
            ORDER BY fecha DESC
            LIMIT ?
        """, [pid, limit])

        sessions = []
        for row in cursor.fetchall():
            s = dict(row)
            cursor.execute("""
                SELECT exercise_key, order_index, prescribed_sets, prescribed_reps,
                       prescribed_weight, sets_json, difficulty, notes
                FROM session_exercises
                WHERE session_id = ?
                ORDER BY order_index ASC
            """, [s['id']])
            ejercicios = []
            for ex in cursor.fetchall():
                ex_dict = dict(ex)
                if ex_dict.get('sets_json'):
                    try:
                        ex_dict['sets'] = json.loads(ex_dict['sets_json'])
                    except (json.JSONDecodeError, TypeError):
                        pass
                ejercicios.append(ex_dict)
            s['ejercicios'] = ejercicios
            sessions.append(s)
        conn.close()
        return success_response({'sessions': sessions, 'total': len(sessions)})

    except Exception as e:
        return error_response(
            f'Error obteniendo historial de sesiones: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


@training_bp.route('/sessions/today', methods=['GET'])
@require_auth
def get_today_session():
    """
    Ejercicios del dia actual del plan activo, con prescripcion derivada
    de exercise_progress (OMV-55, OMV-61).
    """
    user = get_current_user()
    target_name = request.args.get('nombre_apellido') or request.args.get('patient')

    if target_name:
        if not check_patient_access(user, target_name):
            return error_response('No tienes permisos para este paciente',
                                  code=ErrorCodes.FORBIDDEN, status_code=403)
        target = resolve_patient_id(target_name)
    else:
        target = resolve_patient_id(user.get('nombre_apellido') or user.get('dni'))

    if not target:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    target_pid = target['patient_id']

    try:
        plan = helpers.get_active_plan(target_pid)
        if not plan:
            return success_response({
                'today': None,
                'message': 'No hay plan de entrenamiento activo'
            })

        dia_actual = plan.get('current_dia', 1) or 1
        total_dias = plan.get('total_dias', 1) or 1
        plan_data = plan.get('plan_data')

        already_done = False
        try:
            conn2 = get_clinical_connection()
            cursor2 = conn2.cursor()
            cursor2.execute("""
                SELECT id FROM training_sessions
                WHERE patient_id = ? AND date(fecha) = date('now', 'localtime')
            """, [target_pid])
            already_done = cursor2.fetchone() is not None
            conn2.close()
        except Exception:
            pass

        raw_exercises = []
        if plan_data:
            dias = plan_data.get('dias', []) if isinstance(plan_data, dict) else []
            if isinstance(dias, list):
                for d in dias:
                    if isinstance(d, dict) and d.get('dia') == dia_actual:
                        raw_exercises = d.get('ejercicios', [])
                        break
            elif isinstance(dias, dict):
                day_data = dias.get(str(dia_actual)) or dias.get(f'dia_{dia_actual}')
                if day_data:
                    raw_exercises = day_data if isinstance(day_data, list) else day_data.get('ejercicios', [])

        today_exercises = []
        for ex in raw_exercises:
            if isinstance(ex, dict):
                key = str(ex.get('exercise_key') or ex.get('ejercicio') or '').strip()
                base = dict(ex)
            else:
                key = str(ex).strip()
                base = {'exercise_key': key}
            if not key:
                continue
            try:
                presc = helpers.get_progression_prescription(target_pid, key)
                if presc:
                    base.setdefault('prescription', presc.get('prescription'))
                    base.setdefault('current_session', presc.get('current_session'))
                    base.setdefault('current_level', presc.get('current_level'))
                    base.setdefault('current_weight', presc.get('current_weight'))
                    base.setdefault('extra_load', presc.get('extra_load'))
                    base.setdefault('is_test', presc.get('is_test'))
                    base.setdefault('sets', presc.get('sets'))
            except Exception:
                pass
            today_exercises.append(base)

        return success_response({
            'today': {
                'plan_id': plan.get('id'),
                'plan_nombre': plan.get('name') or 'Plan activo',
                'dia_actual': dia_actual,
                'total_dias': total_dias,
                'cycle_week': plan.get('cycle_week', 1),
                'ejercicios': today_exercises,
                'already_done': already_done,
            }
        })

    except Exception as e:
        return error_response(
            f'Error obteniendo sesion de hoy: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


# ============================================
# PROGRAMAS GRATUITOS (OMV-59: clinical.db.training_programs)
# ============================================

@training_bp.route('/programs', methods=['GET'])
def list_programs():
    """Lista programas desde clinical.db.training_programs (OMV-59). Publico."""
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT program_key, titulo, descripcion, duracion, duracion_dias,
                   nivel, equipamiento, frecuencia, duracion_sesion, orden
            FROM training_programs
            WHERE activo = 1
            ORDER BY orden ASC, id ASC
        """)
        programs = []
        for row in cursor.fetchall():
            programs.append({
                'id': row['program_key'],
                'titulo': row['titulo'],
                'descripcion': row['descripcion'],
                'duracion': row['duracion'],
                'duracion_dias': row['duracion_dias'],
                'nivel': row['nivel'],
                'equipamiento': row['equipamiento'],
                'frecuencia': row['frecuencia'],
                'duracion_sesion': row['duracion_sesion'],
            })
        conn.close()
        return success_response({'programs': programs, 'total': len(programs)})
    except Exception as e:
        return error_response(
            f'Error listando programas: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


@training_bp.route('/programs/<program_id>', methods=['GET'])
def get_program(program_id):
    """Detalle de un programa desde clinical.db.training_programs (OMV-59)."""
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT program_key, titulo, descripcion, descripcion_completa,
                   duracion, duracion_dias, nivel, equipamiento, frecuencia,
                   duracion_sesion, template, activo
            FROM training_programs
            WHERE program_key = ? AND activo = 1
        """, [program_id])
        row = cursor.fetchone()
        conn.close()

        if not row:
            return error_response('Programa no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        program = {
            'id': row['program_key'],
            'titulo': row['titulo'],
            'descripcion': row['descripcion'],
            'descripcion_completa': row['descripcion_completa'] or row['descripcion'],
            'duracion': row['duracion'],
            'duracion_dias': row['duracion_dias'],
            'nivel': row['nivel'],
            'equipamiento': row['equipamiento'],
            'frecuencia': row['frecuencia'],
            'duracion_sesion': row['duracion_sesion'],
            'template': row['template'],
        }
        return success_response({'program': program})

    except Exception as e:
        return error_response(
            f'Error obteniendo programa: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


# ============================================
# SUBMIT STRENGTH RESULTS (OMV-56: usa helpers, no functions legacy)
# ============================================

@training_bp.route('/strength/submit', methods=['POST'])
@require_auth
def submit_strength_results():
    """
    Guarda resultados completos de analisis de fuerza en clinical.db.strength_tests
    (OMV-56: ya no llama a functions.guardar_historia_levantamiento_completa).

    Body: { rawData, calculatedData, bodySvg?, selectedPatient?, customAnalysisDate? }
    """
    user = get_current_user()
    data = request.get_json()

    if not data:
        return error_response('No se recibieron datos validos',
                              code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    raw_data = data.get('rawData')
    calculated_data = data.get('calculatedData') or data.get('results')
    body_svg = data.get('bodySvg')

    missing = []
    if not raw_data:
        missing.append('rawData')
    if not calculated_data:
        missing.append('calculatedData')
    if missing:
        return error_response(
            f"Faltan datos: {', '.join(missing)}",
            code=ErrorCodes.VALIDATION_ERROR, status_code=400
        )

    if body_svg and isinstance(calculated_data, dict):
        calculated_data['bodySvg'] = body_svg

    target_name = data.get('selectedPatient') or data.get('nombre_apellido') or data.get('patient')
    if target_name and target_name.strip():
        target_name = target_name.strip()
        if not check_patient_access(user, target_name):
            return error_response('No tienes permisos para este paciente',
                                  code=ErrorCodes.FORBIDDEN, status_code=403)
        patient = resolve_patient_id(target_name)
    else:
        patient = resolve_patient_id(user.get('nombre_apellido') or user.get('dni'))

    if not patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        new_id = helpers.save_strength_test_complete(calculated_data, raw_data, patient['patient_id'])
        if new_id:
            return success_response({
                'id': new_id,
                'patient_id': patient['patient_id'],
                'usuario': patient['nombre'],
                'message': 'Datos de fuerza guardados exitosamente',
            })
        return error_response(
            'No se pudo guardar el test de fuerza',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )
    except Exception as e:
        return error_response(
            f'Error guardando resultados de fuerza: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


# ============================================
# STRENGTH ADMIN (OMV-56: clinical.db, sin functions legacy)
# ============================================

@training_bp.route('/strength/admin', methods=['GET'])
@require_auth
@require_admin
def get_all_strength_admin():
    """
    Todos los registros de fuerza desde clinical.db.strength_tests (OMV-56).
    Solo admin.
    """
    try:
        records = helpers.get_all_strength_admin()
        return success_response({
            'registros': records,
            'total': len(records),
        })
    except Exception as e:
        return error_response(
            f'Error obteniendo datos de fuerza admin: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


# ============================================
# OPTIMIZER ALIAS DEPRECATED (OMV-58)
# Endpoint canonico: POST /plans/<plan_id>/optimize  (OMV-53)
# ============================================

@training_bp.route('/strength/<int:record_id>/optimize', methods=['POST'])
@require_auth
def optimize_training(record_id):
    """
    DEPRECADO (OMV-58): usar POST /plans/<plan_id>/optimize.

    Optimiza el plan del paciente al que pertenece el strength_test record_id.
    Equivalente a /plans/<plan_activo>/optimize con source_strength_id=record_id.
    """
    user = get_current_user()
    data = request.get_json() or {}

    try:
        numero_dias = int(data.get('numeroDias', 3))
        numero_ejercicios = int(data.get('numeroEjercicios', 3))
    except (TypeError, ValueError):
        return error_response(
            'numeroDias / numeroEjercicios deben ser enteros',
            code=ErrorCodes.VALIDATION_ERROR, status_code=400
        )

    # Resolver patient_id desde el strength_test (clinical.db) o legacy FUERZA
    patient_id = None
    try:
        cc = get_clinical_connection(sqlite3.Row)
        cur = cc.cursor()
        cur.execute("SELECT patient_id FROM strength_tests WHERE id = ?", [record_id])
        row = cur.fetchone()
        cc.close()
        if row:
            patient_id = row['patient_id']
    except Exception:
        patient_id = None

    if patient_id is None:
        try:
            conn = get_db_connection(sqlite3.Row)
            cur = conn.cursor()
            cur.execute("SELECT user_id FROM FUERZA WHERE id = ?", [record_id])
            row = cur.fetchone()
            conn.close()
            if row:
                resolved = resolve_patient_id(row['user_id'])
                if resolved:
                    patient_id = resolved['patient_id']
        except Exception:
            pass

    if patient_id is None:
        return error_response(
            f'Registro de fuerza {record_id} no encontrado',
            code=ErrorCodes.NOT_FOUND, status_code=404
        )

    if not check_patient_access(user, patient_id):
        return error_response(
            'No tenes permisos para optimizar el plan de este paciente',
            code=ErrorCodes.FORBIDDEN, status_code=403
        )

    try:
        result = helpers.optimize_plan_for_patient(
            patient_id,
            numero_dias=numero_dias,
            numero_ejercicios=numero_ejercicios,
            running_config=data.get('runningConfig'),
            source_strength_id=record_id,
        )
        return success_response({
            'plan_id': result.get('plan_id'),
            'source_strength_id': result.get('source_strength_id'),
            'relativeData': result['relativeData'],
            'optimizationResults': result['optimizationResults'],
            'deprecated': 'Use POST /api/v3/training/plans/<plan_id>/optimize',
        }, message='Plan optimizado y persistido')
    except ValueError as e:
        return error_response(str(e), code=ErrorCodes.VALIDATION_ERROR, status_code=400)
    except Exception as e:
        return error_response(
            f'Error optimizando entrenamiento: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )
