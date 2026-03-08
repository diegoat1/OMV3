"""
TRAINING Routes - Endpoints de entrenamiento y fuerza
"""

from flask import request
from . import training_bp
from ..common.responses import success_response, error_response, paginated_response, ErrorCodes
from ..common.auth import require_auth, require_admin, require_owner_or_admin, get_current_user
from ..common.database import get_db_connection, get_clinical_connection, resolve_patient_id
import sqlite3
import json
from datetime import datetime


# ============================================
# ANÁLISIS DE FUERZA
# ============================================

@training_bp.route('/strength', methods=['GET'])
@require_auth
def get_strength_data():
    """
    Obtiene los datos de fuerza del usuario autenticado.
    Admin puede ver todos con ?user=<nombre>
    """
    user = get_current_user()
    user_param = request.args.get('user', user['nombre_apellido'])
    patient = resolve_patient_id(user_param)
    
    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
    
    if patient['nombre'] != user['nombre_apellido'] and not user['is_admin']:
        return error_response(
            'No tienes permisos para ver datos de otros usuarios',
            code=ErrorCodes.FORBIDDEN,
            status_code=403
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
        
        # Parsear JSON si existe
        for field in ['lift_inputs_json', 'lifts_results_json', 'categories_results_json', 'muscle_groups_json', 'standards_json']:
            if strength_dict.get(field):
                try:
                    strength_dict[field] = json.loads(strength_dict[field])
                except:
                    pass
        
        return success_response({
            'user': patient['nombre'],
            'strength_data': strength_dict
        })
        
    except Exception as e:
        return error_response(
            f'Error obteniendo datos de fuerza: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@training_bp.route('/strength', methods=['POST'])
@require_auth
def create_strength_record():
    """
    Registra un nuevo test de fuerza.
    
    Request Body:
        {
            "ejercicios": {
                "squat": {"peso": 100, "reps": 5},
                "bench": {"peso": 80, "reps": 5},
                "deadlift": {"peso": 120, "reps": 5},
                ...
            },
            "peso_corporal": 75
        }
    """
    user = get_current_user()
    data = request.get_json() or {}
    patient = resolve_patient_id(user['nombre_apellido'])
    
    if not data.get('ejercicios'):
        return error_response(
            'Los datos de ejercicios son requeridos',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
    
    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()
        
        # Calcular 1RM para cada ejercicio (formula Epley)
        ejercicios_calculados = {}
        for ejercicio, valores in data['ejercicios'].items():
            peso = float(valores.get('peso', 0))
            reps = int(valores.get('reps', 1))
            
            if reps == 1:
                one_rm = peso
            else:
                one_rm = peso * (1 + reps / 30)  # Formula Epley
            
            ejercicios_calculados[ejercicio] = {
                'peso': peso,
                'reps': reps,
                'one_rm': round(one_rm, 1)
            }
        
        # Insertar registro en clinical.db
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
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@training_bp.route('/strength/history', methods=['GET'])
@require_auth
def get_strength_history():
    """
    Obtiene el historial de tests de fuerza.
    
    Query Params:
        limit: Número máximo de registros (default: 20)
        user: Usuario específico (solo admin)
    """
    user = get_current_user()
    limit = request.args.get('limit', 20, type=int)
    user_param = request.args.get('user', user['nombre_apellido'])
    patient = resolve_patient_id(user_param)
    
    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
    
    if patient['nombre'] != user['nombre_apellido'] and not user['is_admin']:
        return error_response(
            'No tienes permisos para ver datos de otros usuarios',
            code=ErrorCodes.FORBIDDEN,
            status_code=403
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
            for field in ['lift_inputs_json', 'lifts_results_json', 'categories_results_json', 'muscle_groups_json', 'standards_json']:
                if record.get(field):
                    try:
                        record[field] = json.loads(record[field])
                    except:
                        pass
            records.append(record)
        
        conn.close()
        
        return success_response({
            'user': patient['nombre'],
            'history': records,
            'total': len(records)
        })
        
    except Exception as e:
        return error_response(
            f'Error obteniendo historial: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@training_bp.route('/strength/<int:record_id>', methods=['DELETE'])
@require_admin
def delete_strength_record(record_id):
    """
    Elimina un registro de fuerza (solo admin).
    """
    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM strength_tests WHERE id = ?", [record_id])
        
        if cursor.rowcount == 0:
            conn.close()
            return error_response(
                'Registro no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        conn.commit()
        conn.close()
        
        return success_response(
            {'id': record_id, 'deleted': True},
            message='Registro eliminado exitosamente'
        )
        
    except Exception as e:
        return error_response(
            f'Error eliminando registro: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@training_bp.route('/strength/standards', methods=['GET'])
def get_strength_standards():
    """
    Obtiene los estándares de fuerza por categoría.
    Endpoint público (no requiere auth).
    """
    standards = {
        'squat': {
            'beginner': 0.75,
            'novice': 1.0,
            'intermediate': 1.5,
            'advanced': 2.0,
            'elite': 2.5
        },
        'bench': {
            'beginner': 0.5,
            'novice': 0.75,
            'intermediate': 1.0,
            'advanced': 1.5,
            'elite': 2.0
        },
        'deadlift': {
            'beginner': 1.0,
            'novice': 1.25,
            'intermediate': 1.75,
            'advanced': 2.5,
            'elite': 3.0
        },
        'overhead_press': {
            'beginner': 0.35,
            'novice': 0.55,
            'intermediate': 0.75,
            'advanced': 1.0,
            'elite': 1.25
        },
        'row': {
            'beginner': 0.5,
            'novice': 0.75,
            'intermediate': 1.0,
            'advanced': 1.25,
            'elite': 1.5
        }
    }
    
    return success_response({
        'standards': standards,
        'note': 'Valores expresados como múltiplo del peso corporal',
        'categories': ['beginner', 'novice', 'intermediate', 'advanced', 'elite']
    })


# ============================================
# LEVANTAMIENTOS (LIFTS)
# ============================================

@training_bp.route('/lifts', methods=['GET'])
@require_auth
def get_lifts():
    """
    Obtiene los levantamientos actuales del usuario.
    """
    user = get_current_user()
    target_user = request.args.get('user', user['nombre_apellido'])
    
    if target_user != user['nombre_apellido'] and not user['is_admin']:
        return error_response(
            'No tienes permisos para ver datos de otros usuarios',
            code=ErrorCodes.FORBIDDEN,
            status_code=403
        )
    
    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        # Obtener estado de ejercicios del usuario
        cursor.execute("""
            SELECT * FROM ESTADO_EJERCICIO_USUARIO 
            WHERE user_id = ?
        """, [target_user])
        
        lifts = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return success_response({
            'user': target_user,
            'lifts': lifts,
            'total': len(lifts)
        })
        
    except Exception as e:
        return error_response(
            f'Error obteniendo levantamientos: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@training_bp.route('/lifts', methods=['POST'])
@require_auth
def save_lift():
    """
    Guarda un nuevo levantamiento.
    
    Request Body:
        {
            "ejercicio": "squat",
            "peso": 100,
            "reps": 5,
            "rpe": 8
        }
    """
    user = get_current_user()
    data = request.get_json() or {}
    
    required = ['ejercicio', 'peso', 'reps']
    missing = [f for f in required if not data.get(f)]
    
    if missing:
        return error_response(
            f'Campos requeridos: {", ".join(missing)}',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Calcular 1RM
        peso = float(data['peso'])
        reps = int(data['reps'])
        one_rm = peso * (1 + reps / 30) if reps > 1 else peso
        
        # Insertar o actualizar estado del ejercicio
        cursor.execute("""
            INSERT OR REPLACE INTO ESTADO_EJERCICIO_USUARIO 
            (user_id, ejercicio, peso_actual, reps_actual, one_rm, rpe, fecha_actualizacion)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        """, [
            user['nombre_apellido'],
            data['ejercicio'],
            peso,
            reps,
            round(one_rm, 1),
            data.get('rpe')
        ])
        
        conn.commit()
        conn.close()
        
        return success_response({
            'ejercicio': data['ejercicio'],
            'peso': peso,
            'reps': reps,
            'one_rm': round(one_rm, 1)
        }, message='Levantamiento guardado exitosamente')
        
    except Exception as e:
        return error_response(
            f'Error guardando levantamiento: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@training_bp.route('/exercises', methods=['GET'])
@require_auth
def list_exercises():
    """
    Lista los ejercicios disponibles.
    """
    exercises = [
        {'id': 'squat', 'nombre': 'Sentadilla', 'categoria': 'piernas', 'principal': True},
        {'id': 'bench', 'nombre': 'Press de Banca', 'categoria': 'pecho', 'principal': True},
        {'id': 'deadlift', 'nombre': 'Peso Muerto', 'categoria': 'espalda', 'principal': True},
        {'id': 'overhead_press', 'nombre': 'Press Militar', 'categoria': 'hombros', 'principal': True},
        {'id': 'row', 'nombre': 'Remo', 'categoria': 'espalda', 'principal': True},
        {'id': 'pullup', 'nombre': 'Dominadas', 'categoria': 'espalda', 'principal': False},
        {'id': 'dip', 'nombre': 'Fondos', 'categoria': 'pecho', 'principal': False},
        {'id': 'curl', 'nombre': 'Curl de Bíceps', 'categoria': 'brazos', 'principal': False},
        {'id': 'tricep_extension', 'nombre': 'Extensión de Tríceps', 'categoria': 'brazos', 'principal': False},
        {'id': 'leg_press', 'nombre': 'Prensa de Piernas', 'categoria': 'piernas', 'principal': False},
        {'id': 'leg_curl', 'nombre': 'Curl de Piernas', 'categoria': 'piernas', 'principal': False},
        {'id': 'calf_raise', 'nombre': 'Elevación de Talones', 'categoria': 'piernas', 'principal': False},
        {'id': 'lateral_raise', 'nombre': 'Elevaciones Laterales', 'categoria': 'hombros', 'principal': False},
        {'id': 'face_pull', 'nombre': 'Face Pull', 'categoria': 'espalda', 'principal': False}
    ]
    
    return success_response({
        'exercises': exercises,
        'total': len(exercises),
        'categorias': ['piernas', 'pecho', 'espalda', 'hombros', 'brazos']
    })


# ============================================
# PLANES DE ENTRENAMIENTO
# ============================================

@training_bp.route('/plans', methods=['GET'])
@require_auth
def list_training_plans():
    """
    Lista los planes de entrenamiento del usuario.
    """
    user = get_current_user()
    
    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM PLANES_ENTRENAMIENTO 
            WHERE user_id = ?
            ORDER BY created_date DESC
        """, [user['dni']])
        
        plans = []
        for row in cursor.fetchall():
            plan = dict(row)
            if plan.get('plan_json'):
                try:
                    plan['plan_data'] = json.loads(plan['plan_json'])
                except:
                    pass
            plans.append(plan)
        
        conn.close()
        
        return success_response({
            'plans': plans,
            'total': len(plans)
        })
        
    except Exception as e:
        return error_response(
            f'Error listando planes: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@training_bp.route('/plans/<int:plan_id>', methods=['GET'])
@require_auth
def get_training_plan(plan_id):
    """
    Obtiene un plan de entrenamiento específico.
    """
    user = get_current_user()
    
    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM PLANES_ENTRENAMIENTO WHERE id = ?", [plan_id])
        plan = cursor.fetchone()
        
        if not plan:
            conn.close()
            return error_response(
                'Plan no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        plan_dict = dict(plan)
        
        # Verificar permisos
        if not user['is_admin'] and plan_dict.get('user_id') != user['dni']:
            conn.close()
            return error_response(
                'No tienes permisos para ver este plan',
                code=ErrorCodes.FORBIDDEN,
                status_code=403
            )
        
        if plan_dict.get('plan_json'):
            try:
                plan_dict['plan_data'] = json.loads(plan_dict['plan_json'])
            except:
                pass
        
        conn.close()
        
        return success_response({'plan': plan_dict})
        
    except Exception as e:
        return error_response(
            f'Error obteniendo plan: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@training_bp.route('/plans/<int:plan_id>/optimize', methods=['POST'])
@require_auth
def optimize_training_plan(plan_id):
    """
    Optimiza un plan de entrenamiento usando PuLP.
    Este endpoint llama a la lógica legacy de optimización.
    """
    user = get_current_user()
    
    try:
        # Importar función de optimización del sistema legacy
        import sys
        sys.path.insert(0, 'src')
        
        return success_response({
            'plan_id': plan_id,
            'status': 'optimization_pending',
            'message': 'La optimización con PuLP debe ejecutarse desde el sistema legacy. Use /optimizar_entrenamiento/<id>'
        })
        
    except Exception as e:
        return error_response(
            f'Error en optimización: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


# ============================================
# SESIONES DE ENTRENAMIENTO
# ============================================

@training_bp.route('/sessions/current', methods=['GET'])
@require_auth
def get_current_session():
    """
    Obtiene la sesión de entrenamiento actual del usuario.
    """
    user = get_current_user()
    
    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        # Obtener plan activo
        cursor.execute("""
            SELECT * FROM PLANES_ENTRENAMIENTO 
            WHERE user_id = ? AND active = 1
            ORDER BY created_date DESC LIMIT 1
        """, [user['dni']])
        
        plan = cursor.fetchone()
        
        if not plan:
            conn.close()
            return success_response({
                'session': None,
                'message': 'No hay plan de entrenamiento activo'
            })
        
        plan_dict = dict(plan)
        
        if plan_dict.get('plan_json'):
            try:
                plan_dict['plan_data'] = json.loads(plan_dict['plan_json'])
            except:
                pass
        
        conn.close()
        
        return success_response({
            'session': {
                'plan_id': plan_dict.get('id'),
                'dia_actual': plan_dict.get('current_dia', 1),
                'total_dias': plan_dict.get('total_dias', 1),
                'plan_data': plan_dict.get('plan_data')
            }
        })
        
    except Exception as e:
        return error_response(
            f'Error obteniendo sesión: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@training_bp.route('/sessions', methods=['POST'])
@require_auth
def register_session():
    """
    Registra una sesión de entrenamiento completada.
    
    Request Body:
        {
            "plan_id": 1,
            "ejercicios_completados": [...],
            "duracion_minutos": 60,
            "notas": "..."
        }
    """
    user = get_current_user()
    data = request.get_json() or {}
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Registrar sesión (simplificado)
        cursor.execute("""
            INSERT INTO SESIONES_ENTRENAMIENTO 
            (user_id, plan_id, fecha, ejercicios_json, duracion_minutos, notas)
            VALUES (?, ?, datetime('now', 'localtime'), ?, ?, ?)
        """, [
            user['dni'],
            data.get('plan_id'),
            json.dumps(data.get('ejercicios_completados', [])),
            data.get('duracion_minutos'),
            data.get('notas')
        ])
        
        session_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return success_response(
            {'session_id': session_id},
            message='Sesión registrada exitosamente'
        )
        
    except Exception as e:
        return error_response(
            f'Error registrando sesión: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@training_bp.route('/sessions/advance', methods=['POST'])
@require_auth
def advance_day():
    """
    Avanza al siguiente día del plan de entrenamiento.
    """
    user = get_current_user()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Obtener plan activo
        cursor.execute("""
            SELECT id, current_dia, total_dias 
            FROM PLANES_ENTRENAMIENTO 
            WHERE user_id = ? AND active = 1
        """, [user['dni']])
        
        plan = cursor.fetchone()
        
        if not plan:
            conn.close()
            return error_response(
                'No hay plan activo',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        plan_id, current_dia, total_dias = plan
        total_dias = total_dias or 5
        
        # Avanzar día (cycle back to 1 after total_dias)
        nuevo_dia = (current_dia or 0) + 1
        if nuevo_dia > total_dias:
            nuevo_dia = 1
        
        cursor.execute("""
            UPDATE PLANES_ENTRENAMIENTO 
            SET current_dia = ?
            WHERE id = ?
        """, [nuevo_dia, plan_id])
        
        conn.commit()
        conn.close()
        
        return success_response({
            'plan_id': plan_id,
            'dia_actual': nuevo_dia,
            'total_dias': total_dias
        }, message='Día avanzado exitosamente')
        
    except Exception as e:
        return error_response(
            f'Error avanzando día: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@training_bp.route('/sessions/history', methods=['GET'])
@require_auth
def get_session_history():
    """
    Lista el historial de sesiones de entrenamiento del usuario.
    Query Params: limit (default 20)
    """
    user = get_current_user()
    limit = request.args.get('limit', 20, type=int)

    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM SESIONES_ENTRENAMIENTO
            WHERE user_id = ?
            ORDER BY fecha DESC
            LIMIT ?
        """, [user['dni'], limit])

        sessions = []
        for row in cursor.fetchall():
            s = dict(row)
            if s.get('ejercicios_json'):
                try:
                    s['ejercicios'] = json.loads(s['ejercicios_json'])
                except:
                    pass
            sessions.append(s)

        conn.close()

        return success_response({
            'sessions': sessions,
            'total': len(sessions)
        })

    except Exception as e:
        return error_response(
            f'Error obteniendo historial de sesiones: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@training_bp.route('/sessions/today', methods=['GET'])
@require_auth
def get_today_session():
    """
    Obtiene los ejercicios específicos del día actual del plan activo.
    Combines plan data with the current day/week to show today's workout.
    """
    user = get_current_user()

    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM PLANES_ENTRENAMIENTO
            WHERE user_id = ? AND active = 1
            ORDER BY created_date DESC LIMIT 1
        """, [user['dni']])

        plan = cursor.fetchone()

        if not plan:
            conn.close()
            return success_response({
                'today': None,
                'message': 'No hay plan de entrenamiento activo'
            })

        plan_dict = dict(plan)
        dia_actual = plan_dict.get('current_dia', 1) or 1
        total_dias = plan_dict.get('total_dias', 1) or 1

        plan_data = None
        if plan_dict.get('plan_json'):
            try:
                plan_data = json.loads(plan_dict['plan_json'])
            except:
                pass

        # Check if session already logged today (table may not exist)
        already_done = False
        try:
            cursor.execute("""
                SELECT id FROM SESIONES_ENTRENAMIENTO
                WHERE user_id = ? AND date(fecha) = date('now', 'localtime')
            """, [user['dni']])
            already_done = cursor.fetchone() is not None
        except Exception:
            pass

        conn.close()

        # Extract today's exercises from plan data
        today_exercises = []
        if plan_data:
            dias = plan_data.get('dias', [])
            if isinstance(dias, list):
                # dias is a list of day objects: [{'dia': 1, 'ejercicios': [...]}, ...]
                for d in dias:
                    if d.get('dia') == dia_actual:
                        today_exercises = d.get('ejercicios', [])
                        break
            elif isinstance(dias, dict):
                day_data = dias.get(str(dia_actual), dias.get(f'dia_{dia_actual}'))
                if day_data:
                    today_exercises = day_data if isinstance(day_data, list) else day_data.get('ejercicios', [])

        return success_response({
            'today': {
                'plan_id': plan_dict.get('id'),
                'plan_nombre': plan_dict.get('nombre', 'Plan activo'),
                'dia_actual': dia_actual,
                'total_dias': total_dias,
                'ejercicios': today_exercises,
                'already_done': already_done,
            }
        })

    except Exception as e:
        return error_response(
            f'Error obteniendo sesión de hoy: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


# ============================================
# PROGRAMAS GRATUITOS
# ============================================

@training_bp.route('/programs', methods=['GET'])
def list_programs():
    """
    Lista los programas de entrenamiento gratuitos.
    Endpoint público.
    """
    programs = [
        {
            'id': '30-dias-principiantes',
            'titulo': 'Programa de 30 Días para Principiantes',
            'descripcion': 'Programa de bajo impacto perfecto para quienes comienzan su viaje fitness.',
            'duracion': '30 días',
            'nivel': 'Principiante',
            'equipamiento': 'Sin equipamiento'
        },
        {
            'id': '30-dias-forma',
            'titulo': 'Desafío de 30 Días para Ponerse en Forma',
            'descripcion': 'Programa intermedio que combina cardio, kickboxing y fuerza.',
            'duracion': '30 días',
            'nivel': 'Principiante a Intermedio',
            'equipamiento': 'Mancuernas ligeras'
        },
        {
            'id': 'warrior-90',
            'titulo': 'Rutina de Entrenamiento Guerrero 90 Días',
            'descripcion': 'Programa avanzado de 90 días con 30 rutinas diferentes.',
            'duracion': '90 días',
            'nivel': 'Intermedio a Avanzado',
            'equipamiento': 'Mancuernas'
        },
        {
            'id': 'hero-90',
            'titulo': 'Hero 90 - Programa de Alta Intensidad',
            'descripcion': 'El programa más desafiante con 55+ rutinas de alta intensidad.',
            'duracion': '90 días',
            'nivel': 'Avanzado',
            'equipamiento': 'Mancuernas'
        },
        {
            'id': '30-abdominales',
            'titulo': '30 Días para Abdominales Marcados',
            'descripcion': 'Programa intensivo especializado en abdominales.',
            'duracion': '30 días',
            'nivel': 'Intermedio',
            'equipamiento': 'Sin equipamiento'
        },
        {
            'id': '30-dias-adolescentes',
            'titulo': '30 Días Pérdida de Peso para Adolescentes',
            'descripcion': 'Programa especializado para jóvenes de 13 a 19 años.',
            'duracion': '30 días',
            'nivel': 'Principiante a Intermedio',
            'equipamiento': 'Sin equipamiento'
        },
        {
            'id': '90-dias-musculo',
            'titulo': '90 Días Construcción de Músculo',
            'descripcion': 'Programa intensivo para maximizar el crecimiento muscular.',
            'duracion': '90 días',
            'nivel': 'Intermedio a Avanzado',
            'equipamiento': 'Mancuernas y gimnasio'
        }
    ]
    
    return success_response({
        'programs': programs,
        'total': len(programs)
    })


@training_bp.route('/programs/<program_id>', methods=['GET'])
def get_program(program_id):
    """
    Obtiene el detalle de un programa específico.
    """
    programs_detail = {
        '30-dias-principiantes': {
            'id': '30-dias-principiantes',
            'titulo': 'Programa de 30 Días para Principiantes',
            'descripcion_completa': 'Este programa de bajo impacto es perfecto para quienes comienzan su viaje fitness, adultos mayores, personas con obesidad, o cualquiera con problemas de rodillas o espalda.',
            'duracion': '30 días',
            'nivel': 'Principiante',
            'equipamiento': 'Sin equipamiento (opcional: mancuernas ligeras)',
            'frecuencia': '5-6 días por semana',
            'duracion_sesion': '20-30 minutos',
            'template': 'programa_30_dias_principiantes.html'
        }
        # Agregar más programas según necesidad
    }
    
    program = programs_detail.get(program_id)
    
    if not program:
        return error_response(
            'Programa no encontrado',
            code=ErrorCodes.NOT_FOUND,
            status_code=404
        )
    
    return success_response({'program': program})


# ============================================
# SUBMIT STRENGTH RESULTS (migrated from legacy /api/submit-strength-results)
# ============================================

@training_bp.route('/strength/submit', methods=['POST'])
@require_auth
def submit_strength_results():
    """
    Guarda resultados completos de análisis de fuerza.
    Body: {
        rawData: object,          // Input data (age, bodyweight, lifts, etc.)
        calculatedData: object,   // Calculated scores, categories, muscle groups
        bodySvg?: string,         // SVG visualization
        selectedPatient?: string, // Admin: save for another user
        customAnalysisDate?: string
    }
    """
    import sys
    sys.path.insert(0, 'src')
    try:
        import functions
    except ImportError:
        return error_response('Módulo functions no disponible', code=ErrorCodes.INTERNAL_ERROR, status_code=500)

    user = get_current_user()
    data = request.get_json()

    if not data:
        return error_response('No se recibieron datos válidos', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    raw_data = data.get('rawData')
    calculated_data = data.get('calculatedData') or data.get('results')
    body_svg = data.get('bodySvg')

    if not raw_data or not calculated_data:
        missing = []
        if not raw_data:
            missing.append('rawData')
        if not calculated_data:
            missing.append('calculatedData')
        return error_response(
            f"Faltan datos: {', '.join(missing)}",
            code=ErrorCodes.VALIDATION_ERROR, status_code=400
        )

    # Attach bodySvg to calculated data if present
    if body_svg and isinstance(calculated_data, dict):
        calculated_data['bodySvg'] = body_svg

    # Determine target user (admin can save for patients)
    username_to_save = user['nombre_apellido']
    selected_patient = data.get('selectedPatient')
    if selected_patient and selected_patient.strip() and user.get('is_admin'):
        username_to_save = selected_patient.strip()

    custom_date = data.get('customAnalysisDate')

    try:
        result = functions.guardar_historia_levantamiento_completa(
            calculated_data, raw_data, username_to_save, custom_date
        )
        if result:
            return success_response({
                'message': 'Datos de fuerza guardados exitosamente',
                'usuario': username_to_save,
            })
        else:
            return error_response(
                'Error interno al guardar datos de fuerza',
                code=ErrorCodes.INTERNAL_ERROR, status_code=500
            )
    except Exception as e:
        return error_response(
            f'Error guardando resultados de fuerza: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


# ============================================
# STRENGTH DATA ADMIN (all users - admin only)
# ============================================

@training_bp.route('/strength/admin', methods=['GET'])
@require_auth
@require_admin
def get_all_strength_admin():
    """
    Obtiene todos los registros de fuerza de todos los usuarios (solo admin).
    """
    import sys
    sys.path.insert(0, 'src')
    try:
        import functions
    except ImportError:
        return error_response('Módulo functions no disponible', code=ErrorCodes.INTERNAL_ERROR, status_code=500)

    try:
        records = functions.get_all_strength_data_admin()
        return success_response({
            'registros': records,
            'total': len(records) if records else 0,
        })
    except Exception as e:
        return error_response(
            f'Error obteniendo datos de fuerza admin: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )


# ============================================
# TRAINING OPTIMIZER (PuLP) - migrated from legacy /optimizar_entrenamiento/<id>
# ============================================

def _decode_json_data(raw):
    """Decode JSON data that may be string or already parsed."""
    if raw is None:
        return None
    if isinstance(raw, (dict, list)):
        return raw
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            return None
    return None


@training_bp.route('/strength/<int:record_id>/optimize', methods=['POST'])
@require_auth
@require_admin
def optimize_training(record_id):
    """
    Optimiza distribución de entrenamiento basándose en análisis de fuerza.
    Usa PuLP optimizer para distribuir ejercicios priorizando debilidades.
    Body: {
        numeroDias?: int (default 3),
        numeroEjercicios?: int (default 3),
        runningConfig?: { enabled: bool, days: int[], initialSpeed: float, initialMinutes: float }
    }
    """
    import sys
    sys.path.insert(0, 'src')
    try:
        import functions
    except ImportError:
        return error_response('Módulo functions no disponible', code=ErrorCodes.INTERNAL_ERROR, status_code=500)

    data = request.get_json() or {}
    numero_dias = int(data.get('numeroDias', 3))
    numero_ejercicios = int(data.get('numeroEjercicios', 3))
    running_config = data.get('runningConfig') or {}
    incluir_correr = bool(running_config.get('enabled', False))
    dias_correr = running_config.get('days') or []
    velocidad_inicial = float(running_config.get('initialSpeed', 0) or 0)
    minutos_iniciales = float(running_config.get('initialMinutes', 0) or 0)

    try:
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, user_id, categories_results_json, lifts_results_json, lift_fields_json
            FROM FUERZA WHERE id = ?
        """, (record_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return error_response(f'Registro de fuerza {record_id} no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        usuario_id = row['user_id']
        categories_results = _decode_json_data(row['categories_results_json'])
        lifts_results = _decode_json_data(row['lifts_results_json'])
        lift_fields = _decode_json_data(row['lift_fields_json'])
        conn.close()

        if incluir_correr:
            functions.actualizar_estado_running(usuario_id, velocidad_inicial, minutos_iniciales)

        # Category score extraction
        relative_categories = {}
        exercise_percentages = {}
        exercise_entrenamientos = {}
        plan_entrenamiento = {}
        total_sesiones = numero_dias * numero_ejercicios

        if categories_results and isinstance(categories_results, dict):
            cat_keys = ['squat', 'floorPull', 'horizontalPress', 'verticalPress', 'pullup']
            scores = [float(categories_results.get(k, 0)) for k in cat_keys]
            scores_nz = [s for s in scores if s > 0]
            max_score = max(scores_nz) if scores_nz else 1

            ratios = [(max_score / s if s > 0 else 0) for s in scores]
            suma_ratios = sum(ratios)
            mult = total_sesiones / suma_ratios if suma_ratios > 0 else 0
            entrenamientos = [round(r * mult) if r > 0 else 0 for r in ratios]

            for i, k in enumerate(cat_keys):
                relative_categories[k] = {'value': scores[i], 'type': 'neutral'}

            ejercicios_por_cat = {
                'squat': ['backSquat', 'frontSquat'],
                'floorPull': ['deadlift', 'sumoDeadlift', 'powerClean'],
                'horizontalPress': ['benchPress', 'inclineBenchPress', 'dip'],
                'verticalPress': ['overheadPress', 'snatchPress', 'pushPress'],
                'pullup': ['pullup', 'chinup', 'pendlayRow'],
            }

            sesiones_por_cat = dict(zip(cat_keys, entrenamientos))

            if lifts_results and isinstance(lifts_results, dict):
                scores_ejercicios = {}
                for ex_name, ex_data in lifts_results.items():
                    if ex_data and 'userScore' in ex_data and ex_data['userScore'] is not None:
                        user_score = float(ex_data['userScore'])
                        scores_ejercicios[ex_name] = user_score
                        exercise_percentages[ex_name] = {
                            'value': user_score,
                            'type': 'fortaleza' if user_score > 60 else 'debilidad',
                        }

                for cat, ejercicios in ejercicios_por_cat.items():
                    disponibles = [e for e in ejercicios if e in scores_ejercicios]
                    if not disponibles:
                        continue
                    max_sc = max(scores_ejercicios[e] for e in disponibles)
                    rats = [(max_sc / scores_ejercicios[e] if scores_ejercicios[e] > 0 else 0) for e in disponibles]
                    sr = sum(rats)
                    total_cat = sesiones_por_cat[cat]
                    if sr > 0:
                        m = total_cat / sr
                        asignadas = 0
                        for i, ej in enumerate(disponibles):
                            if i == len(disponibles) - 1:
                                exercise_entrenamientos[ej] = total_cat - asignadas
                            else:
                                s = round(rats[i] * m)
                                exercise_entrenamientos[ej] = s
                                asignadas += s

                # Balance adjustment
                total_ej = sum(exercise_entrenamientos.values())
                if total_ej != total_sesiones and exercise_entrenamientos:
                    dif = total_sesiones - total_ej
                    if dif > 0:
                        weakest = min(exercise_entrenamientos, key=lambda e: scores_ejercicios.get(e, 100))
                        exercise_entrenamientos[weakest] += dif
                    elif dif < 0:
                        strongest = max(exercise_entrenamientos, key=lambda e: scores_ejercicios.get(e, 0))
                        exercise_entrenamientos[strongest] = max(0, exercise_entrenamientos[strongest] + dif)

                # PuLP optimizer
                try:
                    from workout_optimizer import optimize_split
                    sessions_dict = {ej: s for ej, s in exercise_entrenamientos.items() if s > 0}
                    grid, penalty = optimize_split(sessions_dict, days=numero_dias, ex_per_day=numero_ejercicios)

                    if incluir_correr:
                        dias_validos = [int(d) for d in dias_correr if 1 <= int(d) <= numero_dias] or list(range(1, numero_dias + 1))
                        for dia in dias_validos:
                            idx = dia - 1
                            if idx in grid and 'running' not in grid[idx]:
                                grid[idx].append('running')

                    for d in grid:
                        plan_entrenamiento[f"dia_{d + 1}"] = grid[d]

                except ImportError:
                    plan_entrenamiento = {}
                except Exception:
                    plan_entrenamiento = {}

        # Save the plan if generated
        if plan_entrenamiento:
            try:
                from main import guardar_plan_optimizado
                plan_fmt = []
                for dk, ejs in plan_entrenamiento.items():
                    num = int(dk.split('_')[1])
                    plan_fmt.append({'dia': num, 'ejercicios': ejs})
                datos_fuerza = {}
                if lift_fields and isinstance(lift_fields, dict):
                    for ej, d in lift_fields.items():
                        datos_fuerza[ej] = {'weight': d.get('weight', 50), 'reps': d.get('reps', 1)}
                guardar_plan_optimizado(usuario_id, plan_fmt, datos_fuerza)
            except Exception:
                pass  # Plan save is best-effort

        return success_response({
            'relativeData': {
                'categories': relative_categories,
                'exercises': exercise_percentages,
            },
            'optimizationResults': {
                'categorias': {k: v for k, v in sesiones_por_cat.items()} if 'sesiones_por_cat' in dir() else {},
                'ejercicios': exercise_entrenamientos,
                'parametros': {
                    'numeroDias': numero_dias,
                    'numeroEjercicios': numero_ejercicios,
                    'totalSesiones': total_sesiones,
                },
                'planEntrenamiento': plan_entrenamiento,
            },
        })

    except Exception as e:
        return error_response(f'Error optimizando entrenamiento: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)
