"""
ENGAGEMENT Routes - Reminders, Tasks, Insights, Performance
"""

from flask import request
from . import engagement_bp
from ..common.responses import success_response, error_response, ErrorCodes
from ..common.auth import require_auth, get_current_user
from ..common.database import get_db_connection
import sqlite3
import json
from datetime import datetime, timedelta


# ============================================
# RECORDATORIOS (REMINDERS)
# ============================================

@engagement_bp.route('/reminders', methods=['GET'])
@require_auth
def list_reminders():
    """
    Lista los recordatorios del usuario.
    Query Params: status (pending|completed|all), limit
    """
    user = get_current_user()
    status = request.args.get('status', 'pending')
    limit = request.args.get('limit', 20, type=int)

    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()

        # Ensure table exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS RECORDATORIOS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_dni TEXT NOT NULL,
                nombre_apellido TEXT,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                tipo TEXT DEFAULT 'general',
                prioridad TEXT DEFAULT 'normal',
                fecha_vencimiento DATETIME,
                completado INTEGER DEFAULT 0,
                fecha_creacion DATETIME DEFAULT (datetime('now','localtime')),
                fecha_completado DATETIME
            )
        """)
        conn.commit()

        query = "SELECT * FROM RECORDATORIOS WHERE user_dni = ?"
        params = [user['dni']]

        if status == 'pending':
            query += " AND completado = 0"
        elif status == 'completed':
            query += " AND completado = 1"

        query += " ORDER BY fecha_vencimiento ASC, prioridad DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        reminders = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return success_response({
            'reminders': reminders,
            'total': len(reminders)
        })

    except Exception as e:
        return error_response(
            f'Error listando recordatorios: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@engagement_bp.route('/reminders', methods=['POST'])
@require_auth
def create_reminder():
    """
    Crea un nuevo recordatorio.
    Request Body: { titulo, descripcion?, tipo?, prioridad?, fecha_vencimiento? }
    """
    user = get_current_user()
    data = request.get_json() or {}

    if not data.get('titulo'):
        return error_response('El título es requerido', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO RECORDATORIOS
            (user_dni, nombre_apellido, titulo, descripcion, tipo, prioridad, fecha_vencimiento)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [
            user['dni'],
            user['nombre_apellido'],
            data['titulo'],
            data.get('descripcion'),
            data.get('tipo', 'general'),
            data.get('prioridad', 'normal'),
            data.get('fecha_vencimiento'),
        ])

        reminder_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return success_response(
            {'id': reminder_id},
            message='Recordatorio creado exitosamente'
        )

    except Exception as e:
        return error_response(
            f'Error creando recordatorio: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@engagement_bp.route('/reminders/<int:reminder_id>/complete', methods=['PATCH'])
@require_auth
def complete_reminder(reminder_id):
    """Marca un recordatorio como completado."""
    user = get_current_user()

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE RECORDATORIOS
            SET completado = 1, fecha_completado = datetime('now','localtime')
            WHERE id = ? AND user_dni = ?
        """, [reminder_id, user['dni']])

        if cursor.rowcount == 0:
            conn.close()
            return error_response('Recordatorio no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        conn.commit()
        conn.close()

        return success_response({'id': reminder_id, 'completado': True}, message='Recordatorio completado')

    except Exception as e:
        return error_response(
            f'Error completando recordatorio: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@engagement_bp.route('/reminders/<int:reminder_id>', methods=['DELETE'])
@require_auth
def delete_reminder(reminder_id):
    """Elimina un recordatorio."""
    user = get_current_user()

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM RECORDATORIOS WHERE id = ? AND user_dni = ?", [reminder_id, user['dni']])

        if cursor.rowcount == 0:
            conn.close()
            return error_response('Recordatorio no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        conn.commit()
        conn.close()

        return success_response({'id': reminder_id, 'deleted': True})

    except Exception as e:
        return error_response(
            f'Error eliminando recordatorio: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


# ============================================
# TAREAS (TASKS)
# ============================================

@engagement_bp.route('/tasks', methods=['GET'])
@require_auth
def list_tasks():
    """
    Lista las tareas/objetivos del usuario.
    Query Params: status (pending|in_progress|completed|all), category
    """
    user = get_current_user()
    status = request.args.get('status', 'all')
    category = request.args.get('category', '')

    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS TAREAS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_dni TEXT NOT NULL,
                nombre_apellido TEXT,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                categoria TEXT DEFAULT 'general',
                estado TEXT DEFAULT 'pending',
                progreso INTEGER DEFAULT 0,
                fecha_limite DATETIME,
                fecha_creacion DATETIME DEFAULT (datetime('now','localtime')),
                fecha_completado DATETIME,
                metadata_json TEXT
            )
        """)
        conn.commit()

        query = "SELECT * FROM TAREAS WHERE user_dni = ?"
        params = [user['dni']]

        if status != 'all':
            query += " AND estado = ?"
            params.append(status)

        if category:
            query += " AND categoria = ?"
            params.append(category)

        query += " ORDER BY fecha_limite ASC, fecha_creacion DESC"

        cursor.execute(query, params)
        tasks = []
        for row in cursor.fetchall():
            t = dict(row)
            if t.get('metadata_json'):
                try:
                    t['metadata'] = json.loads(t['metadata_json'])
                except:
                    pass
            tasks.append(t)

        conn.close()

        return success_response({
            'tasks': tasks,
            'total': len(tasks)
        })

    except Exception as e:
        return error_response(
            f'Error listando tareas: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@engagement_bp.route('/tasks', methods=['POST'])
@require_auth
def create_task():
    """
    Crea una nueva tarea.
    Request Body: { titulo, descripcion?, categoria?, fecha_limite?, metadata? }
    """
    user = get_current_user()
    data = request.get_json() or {}

    if not data.get('titulo'):
        return error_response('El título es requerido', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        metadata = json.dumps(data.get('metadata', {})) if data.get('metadata') else None

        cursor.execute("""
            INSERT INTO TAREAS
            (user_dni, nombre_apellido, titulo, descripcion, categoria, fecha_limite, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [
            user['dni'],
            user['nombre_apellido'],
            data['titulo'],
            data.get('descripcion'),
            data.get('categoria', 'general'),
            data.get('fecha_limite'),
            metadata,
        ])

        task_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return success_response({'id': task_id}, message='Tarea creada exitosamente')

    except Exception as e:
        return error_response(
            f'Error creando tarea: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@engagement_bp.route('/tasks/<int:task_id>', methods=['PATCH'])
@require_auth
def update_task(task_id):
    """
    Actualiza una tarea (estado, progreso, etc).
    Request Body: { estado?, progreso?, titulo?, descripcion? }
    """
    user = get_current_user()
    data = request.get_json() or {}

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        updates = []
        values = []

        for field in ['titulo', 'descripcion', 'categoria', 'estado', 'fecha_limite']:
            if field in data:
                updates.append(f"{field} = ?")
                values.append(data[field])

        if 'progreso' in data:
            updates.append("progreso = ?")
            values.append(int(data['progreso']))

        if data.get('estado') == 'completed':
            updates.append("fecha_completado = datetime('now','localtime')")

        if not updates:
            return error_response('No hay campos para actualizar', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

        values.extend([task_id, user['dni']])

        cursor.execute(f"""
            UPDATE TAREAS SET {', '.join(updates)}
            WHERE id = ? AND user_dni = ?
        """, values)

        if cursor.rowcount == 0:
            conn.close()
            return error_response('Tarea no encontrada', code=ErrorCodes.NOT_FOUND, status_code=404)

        conn.commit()
        conn.close()

        return success_response({'id': task_id, 'updated': True})

    except Exception as e:
        return error_response(
            f'Error actualizando tarea: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@engagement_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
@require_auth
def delete_task(task_id):
    """Elimina una tarea."""
    user = get_current_user()

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM TAREAS WHERE id = ? AND user_dni = ?", [task_id, user['dni']])

        if cursor.rowcount == 0:
            conn.close()
            return error_response('Tarea no encontrada', code=ErrorCodes.NOT_FOUND, status_code=404)

        conn.commit()
        conn.close()

        return success_response({'id': task_id, 'deleted': True})

    except Exception as e:
        return error_response(
            f'Error eliminando tarea: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


# ============================================
# INSIGHTS (Auto-generated tips & recommendations)
# ============================================

@engagement_bp.route('/insights', methods=['GET'])
@require_auth
def get_insights():
    """
    Genera insights personalizados basados en datos del usuario.
    Analyzes nutrition, training, and body composition data to provide actionable tips.
    """
    user = get_current_user()

    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        insights = []

        # 1. Check body composition trends
        cursor.execute("""
            SELECT PESO, BF, IMMC, FECHA_REGISTRO FROM PERFILDINAMICO
            WHERE NOMBRE_APELLIDO = ?
            ORDER BY FECHA_REGISTRO DESC LIMIT 3
        """, [user['nombre_apellido']])
        measurements = cursor.fetchall()

        if len(measurements) >= 2:
            latest = measurements[0]
            prev = measurements[1]
            peso_diff = float(latest[0] or 0) - float(prev[0] or 0)
            bf_diff = float(latest[1] or 0) - float(prev[1] or 0)

            if bf_diff < -0.5:
                insights.append({
                    'id': 'bf_improving',
                    'tipo': 'composicion',
                    'icono': 'trending-down',
                    'titulo': 'Grasa corporal bajando',
                    'mensaje': f'Tu grasa corporal bajó {abs(bf_diff):.1f}% desde la última medición. ¡Excelente progreso!',
                    'prioridad': 'positive',
                })
            elif bf_diff > 1.0:
                insights.append({
                    'id': 'bf_rising',
                    'tipo': 'composicion',
                    'icono': 'alert-triangle',
                    'titulo': 'Grasa corporal subiendo',
                    'mensaje': f'Tu grasa corporal subió {bf_diff:.1f}%. Revisá tu plan nutricional.',
                    'prioridad': 'warning',
                })

            if peso_diff > 0 and bf_diff <= 0:
                insights.append({
                    'id': 'lean_gain',
                    'tipo': 'composicion',
                    'icono': 'zap',
                    'titulo': 'Ganancia magra',
                    'mensaje': f'Ganaste {peso_diff:.1f}kg sin aumentar grasa. Estás en recomposición corporal.',
                    'prioridad': 'positive',
                })

        elif len(measurements) == 0:
            insights.append({
                'id': 'no_measurements',
                'tipo': 'onboarding',
                'icono': 'clipboard',
                'titulo': 'Sin mediciones',
                'mensaje': 'Aún no tenés mediciones registradas. Pedí tu primera evaluación.',
                'prioridad': 'info',
            })

        # 2. Check nutrition plan
        cursor.execute("""
            SELECT CALORIAS, PROTEINA, GRASA, CH, FECHA_CREACION
            FROM DIETA WHERE NOMBRE_APELLIDO = ?
            ORDER BY FECHA_CREACION DESC LIMIT 1
        """, [user['nombre_apellido']])
        dieta = cursor.fetchone()

        if dieta:
            fecha_dieta = dieta[4]
            if fecha_dieta:
                try:
                    dt = datetime.strptime(str(fecha_dieta)[:10], '%Y-%m-%d')
                    days_old = (datetime.now() - dt).days
                    if days_old > 60:
                        insights.append({
                            'id': 'old_plan',
                            'tipo': 'nutricion',
                            'icono': 'refresh-cw',
                            'titulo': 'Plan nutricional desactualizado',
                            'mensaje': f'Tu plan tiene {days_old} días. Considerá actualizarlo.',
                            'prioridad': 'warning',
                        })
                except:
                    pass
        else:
            insights.append({
                'id': 'no_plan',
                'tipo': 'nutricion',
                'icono': 'utensils',
                'titulo': 'Sin plan nutricional',
                'mensaje': 'No tenés un plan nutricional asignado. Consultá con tu profesional.',
                'prioridad': 'info',
            })

        # 3. Check training activity
        cursor.execute("""
            SELECT COUNT(*) FROM SESIONES_ENTRENAMIENTO
            WHERE user_id = ? AND fecha >= datetime('now', '-7 days', 'localtime')
        """, [user['dni']])
        sessions_week = cursor.fetchone()

        if sessions_week:
            count = sessions_week[0]
            if count == 0:
                insights.append({
                    'id': 'no_training',
                    'tipo': 'entrenamiento',
                    'icono': 'activity',
                    'titulo': 'Sin entrenamientos esta semana',
                    'mensaje': 'No registraste entrenamientos en los últimos 7 días. ¡Es hora de volver!',
                    'prioridad': 'warning',
                })
            elif count >= 4:
                insights.append({
                    'id': 'consistent_training',
                    'tipo': 'entrenamiento',
                    'icono': 'award',
                    'titulo': 'Consistencia de entrenamiento',
                    'mensaje': f'{count} sesiones esta semana. ¡Gran constancia!',
                    'prioridad': 'positive',
                })

        # 4. Check water intake recommendation
        if measurements:
            peso = float(measurements[0][0] or 70)
            agua_ml = round(peso * 35)
            insights.append({
                'id': 'water',
                'tipo': 'hidratacion',
                'icono': 'droplet',
                'titulo': 'Hidratación diaria',
                'mensaje': f'Recordá tomar al menos {agua_ml}ml de agua ({agua_ml / 1000:.1f}L) por día.',
                'prioridad': 'tip',
            })

        # 5. Pending reminders count
        cursor.execute("""
            SELECT COUNT(*) FROM RECORDATORIOS
            WHERE user_dni = ? AND completado = 0
        """, [user['dni']])
        pending = cursor.fetchone()
        if pending and pending[0] > 0:
            insights.append({
                'id': 'pending_reminders',
                'tipo': 'organizacion',
                'icono': 'bell',
                'titulo': f'{pending[0]} recordatorio(s) pendiente(s)',
                'mensaje': 'Tenés recordatorios sin completar. Revisalos.',
                'prioridad': 'info',
            })

        conn.close()

        return success_response({
            'insights': insights,
            'total': len(insights),
            'generated_at': datetime.now().isoformat(),
        })

    except Exception as e:
        return error_response(
            f'Error generando insights: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


# ============================================
# PERFORMANCE SUMMARY
# ============================================

@engagement_bp.route('/performance', methods=['GET'])
@require_auth
def get_performance():
    """
    Resumen de rendimiento semanal/mensual del usuario.
    Combines training sessions, nutrition adherence, and body composition progress.
    Query Params: period (week|month|quarter)
    """
    user = get_current_user()
    period = request.args.get('period', 'week')

    days_map = {'week': 7, 'month': 30, 'quarter': 90}
    days = days_map.get(period, 7)

    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()

        # Training sessions in period
        cursor.execute("""
            SELECT COUNT(*) as total,
                   COALESCE(SUM(duracion_minutos), 0) as total_min
            FROM SESIONES_ENTRENAMIENTO
            WHERE user_id = ? AND fecha >= datetime('now', ? || ' days', 'localtime')
        """, [user['dni'], f'-{days}'])
        training = cursor.fetchone()
        training_sessions = training[0] if training else 0
        training_minutes = training[1] if training else 0

        # Tasks completed in period
        cursor.execute("""
            SELECT COUNT(*) FROM TAREAS
            WHERE user_dni = ? AND estado = 'completed'
            AND fecha_completado >= datetime('now', ? || ' days', 'localtime')
        """, [user['dni'], f'-{days}'])
        tasks_row = cursor.fetchone()
        tasks_completed = tasks_row[0] if tasks_row else 0

        # Total tasks
        cursor.execute("SELECT COUNT(*) FROM TAREAS WHERE user_dni = ?", [user['dni']])
        tasks_total_row = cursor.fetchone()
        tasks_total = tasks_total_row[0] if tasks_total_row else 0

        # Reminders completed in period
        cursor.execute("""
            SELECT COUNT(*) FROM RECORDATORIOS
            WHERE user_dni = ? AND completado = 1
            AND fecha_completado >= datetime('now', ? || ' days', 'localtime')
        """, [user['dni'], f'-{days}'])
        rem_row = cursor.fetchone()
        reminders_completed = rem_row[0] if rem_row else 0

        # Body measurements in period
        cursor.execute("""
            SELECT COUNT(*) FROM PERFILDINAMICO
            WHERE NOMBRE_APELLIDO = ?
            AND FECHA_REGISTRO >= datetime('now', ? || ' days', 'localtime')
        """, [user['nombre_apellido'], f'-{days}'])
        meas_row = cursor.fetchone()
        measurements_count = meas_row[0] if meas_row else 0

        # Strength tests in period
        cursor.execute("""
            SELECT COUNT(*) FROM FUERZA
            WHERE NOMBRE_APELLIDO = ?
            AND FECHA_ANALISIS >= datetime('now', ? || ' days', 'localtime')
        """, [user['nombre_apellido'], f'-{days}'])
        str_row = cursor.fetchone()
        strength_tests = str_row[0] if str_row else 0

        conn.close()

        # Calculate engagement score (0-100)
        score = 0
        if training_sessions > 0:
            score += min(training_sessions * 10, 40)  # max 40 pts for training
        score += min(tasks_completed * 5, 20)  # max 20 pts for tasks
        score += min(reminders_completed * 5, 15)  # max 15 pts for reminders
        score += measurements_count * 10  # 10 pts per measurement
        score += strength_tests * 5  # 5 pts per strength test
        score = min(score, 100)

        return success_response({
            'performance': {
                'period': period,
                'days': days,
                'engagement_score': score,
                'training': {
                    'sessions': training_sessions,
                    'total_minutes': training_minutes,
                },
                'tasks': {
                    'completed': tasks_completed,
                    'total': tasks_total,
                },
                'reminders_completed': reminders_completed,
                'measurements': measurements_count,
                'strength_tests': strength_tests,
            }
        })

    except Exception as e:
        return error_response(
            f'Error obteniendo rendimiento: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )
