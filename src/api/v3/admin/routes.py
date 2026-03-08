"""
ADMIN Routes - Endpoints de administración
"""

from flask import request
from . import admin_bp
from ..common.responses import success_response, error_response, paginated_response, ErrorCodes
from ..common.auth import require_admin, get_current_user
from ..common.database import get_db_connection, get_telemed_connection, get_auth_connection, get_clinical_connection
import sqlite3
from datetime import datetime


def _log_audit(user_id, user_name, action, details, ip=None):
    """Helper to insert an audit log entry."""
    try:
        conn = get_auth_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO audit_log (user_id, user_name, action, details, ip_address) VALUES (?, ?, ?, ?, ?)",
            [user_id, user_name, action, details, ip]
        )
        conn.commit()
        conn.close()
    except Exception:
        pass


@admin_bp.route('/stats', methods=['GET'])
@require_admin
def get_stats():
    """
    Obtiene estadísticas generales del sistema.
    """
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        # Contar usuarios
        cursor.execute("SELECT COUNT(*) FROM patients")
        total_users = cursor.fetchone()[0]
        
        # Usuarios con mediciones recientes (últimos 30 días)
        cursor.execute("""
            SELECT COUNT(DISTINCT patient_id) FROM measurements 
            WHERE DATE(fecha) >= DATE('now', '-30 days')
        """)
        active_users = cursor.fetchone()[0]
        
        # Contar alimentos
        cursor.execute("SELECT COUNT(*) FROM foods")
        total_alimentos = cursor.fetchone()[0]
        
        # Contar recetas
        cursor.execute("SELECT COUNT(*) FROM recipes")
        total_recetas = cursor.fetchone()[0]
        
        # Contar planes de entrenamiento
        cursor.execute("SELECT COUNT(*) FROM training_plans WHERE activo = 1")
        total_entrenamientos = cursor.fetchone()[0]
        
        # Contar planes nutricionales
        cursor.execute("SELECT COUNT(*) FROM nutrition_plans")
        total_dietas = cursor.fetchone()[0]
        
        conn.close()
        
        # Stats de telemedicina
        try:
            telemed_conn = get_telemed_connection(sqlite3.Row)
            telemed_cursor = telemed_conn.cursor()
            
            telemed_cursor.execute("SELECT COUNT(*) FROM TELEMED_PACIENTES")
            total_pacientes = telemed_cursor.fetchone()[0]
            
            telemed_cursor.execute("SELECT COUNT(*) FROM TELEMED_SITUACIONES")
            total_situaciones = telemed_cursor.fetchone()[0]
            
            telemed_cursor.execute("SELECT COUNT(*) FROM TELEMED_DOCUMENTOS")
            total_documentos = telemed_cursor.fetchone()[0]
            
            telemed_conn.close()
        except:
            total_pacientes = 0
            total_situaciones = 0
            total_documentos = 0
        
        return success_response({
            'usuarios': {
                'total': total_users,
                'activos_30_dias': active_users
            },
            'nutricion': {
                'alimentos': total_alimentos,
                'recetas': total_recetas,
                'planes_nutricionales': total_dietas
            },
            'entrenamiento': {
                'planes_activos': total_entrenamientos
            },
            'telemedicina': {
                'pacientes': total_pacientes,
                'situaciones': total_situaciones,
                'documentos': total_documentos
            }
        })
        
    except Exception as e:
        return error_response(
            f'Error obteniendo estadísticas: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@admin_bp.route('/users', methods=['GET'])
@require_admin
def list_users():
    """
    Lista todos los usuarios con filtros.
    
    Query Params:
        q: Búsqueda por nombre/email/DNI
        page: Página
        per_page: Items por página
        order_by: Campo para ordenar
        order: asc/desc
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('q', '').strip()
    order_by = request.args.get('order_by', 'NOMBRE_APELLIDO')
    order = request.args.get('order', 'asc').upper()
    
    # Validar orden
    allowed_order_by = ['NOMBRE_APELLIDO', 'DNI', 'EMAIL']
    if order_by not in allowed_order_by:
        order_by = 'NOMBRE_APELLIDO'
    if order not in ['ASC', 'DESC']:
        order = 'ASC'
    
    # Map legacy order_by to clinical.db columns
    order_map = {'NOMBRE_APELLIDO': 'nombre', 'DNI': 'dni', 'EMAIL': 'email'}
    order_col = order_map.get(order_by, 'nombre')
    
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        query = "SELECT * FROM patients WHERE 1=1"
        params = []
        
        if search:
            query += " AND (nombre LIKE ? OR email LIKE ? OR dni LIKE ?)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])
        
        # Contar total
        count_query = query.replace("SELECT *", "SELECT COUNT(*)")
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        # Ordenar y paginar
        query += f" ORDER BY {order_col} {order} LIMIT ? OFFSET ?"
        params.extend([per_page, (page - 1) * per_page])
        
        cursor.execute(query, params)
        users = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return paginated_response(users, page, per_page, total)
        
    except Exception as e:
        return error_response(
            f'Error listando usuarios: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@admin_bp.route('/users/<user_id>', methods=['GET'])
@require_admin
def get_user_detail(user_id):
    """
    Obtiene el detalle completo de un usuario.
    """
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        # Paciente
        cursor.execute("SELECT * FROM patients WHERE dni = ?", [user_id])
        patient = cursor.fetchone()
        
        if not patient:
            conn.close()
            return error_response(
                'Usuario no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        patient_dict = dict(patient)
        patient_id = patient_dict['id']
        
        # Ultima medicion
        cursor.execute("""
            SELECT * FROM measurements 
            WHERE patient_id = ?
            ORDER BY fecha DESC LIMIT 1
        """, [patient_id])
        perfil_dinamico = cursor.fetchone()
        
        # Plan nutricional
        cursor.execute("""
            SELECT * FROM nutrition_plans WHERE patient_id = ?
            ORDER BY created_at DESC LIMIT 1
        """, [patient_id])
        dieta = cursor.fetchone()
        
        # Objetivo
        cursor.execute("SELECT * FROM goals WHERE patient_id = ? AND activo = 1", [patient_id])
        objetivo = cursor.fetchone()
        
        # Conteo de mediciones
        cursor.execute("""
            SELECT COUNT(*) FROM measurements WHERE patient_id = ?
        """, [patient_id])
        total_mediciones = cursor.fetchone()[0]
        
        conn.close()
        
        return success_response({
            'user': patient_dict,
            'perfil_dinamico': dict(perfil_dinamico) if perfil_dinamico else None,
            'plan_nutricional': dict(dieta) if dieta else None,
            'objetivo': dict(objetivo) if objetivo else None,
            'stats': {
                'total_mediciones': total_mediciones
            }
        })
        
    except Exception as e:
        return error_response(
            f'Error obteniendo usuario: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@admin_bp.route('/users/search', methods=['GET'])
@require_admin
def search_users():
    """
    Búsqueda rápida de usuarios.
    
    Query Params:
        q: Término de búsqueda
        limit: Máximo de resultados (default: 10)
    """
    search = request.args.get('q', '').strip()
    limit = request.args.get('limit', 10, type=int)
    
    if not search:
        return success_response({'users': []})
    
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT dni, nombre, email 
            FROM patients 
            WHERE nombre LIKE ? OR email LIKE ? OR dni LIKE ?
            ORDER BY nombre ASC
            LIMIT ?
        """, [f"%{search}%", f"%{search}%", f"%{search}%", limit])
        
        users = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return success_response({
            'users': users,
            'total': len(users)
        })
        
    except Exception as e:
        return error_response(
            f'Error buscando usuarios: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@admin_bp.route('/database/tables', methods=['GET'])
@require_admin
def list_tables():
    """
    Lista todas las tablas de la base de datos.
    """
    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        """)
        
        tables = []
        for row in cursor.fetchall():
            table_name = row[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            tables.append({
                'name': table_name,
                'rows': count
            })
        
        conn.close()
        
        # También obtener tablas de clinical.db
        try:
            clinical_conn = get_clinical_connection(sqlite3.Row)
            clinical_cursor = clinical_conn.cursor()
            
            clinical_cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_%'
                ORDER BY name
            """)
            
            clinical_tables = []
            for row in clinical_cursor.fetchall():
                table_name = row[0]
                clinical_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = clinical_cursor.fetchone()[0]
                clinical_tables.append({
                    'name': table_name,
                    'rows': count,
                    'database': 'clinical'
                })
            
            clinical_conn.close()
        except:
            clinical_tables = []
        
        # También obtener tablas de telemedicina
        try:
            telemed_conn = get_telemed_connection(sqlite3.Row)
            telemed_cursor = telemed_conn.cursor()
            
            telemed_cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            """)
            
            telemed_tables = []
            for row in telemed_cursor.fetchall():
                table_name = row[0]
                telemed_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = telemed_cursor.fetchone()[0]
                telemed_tables.append({
                    'name': table_name,
                    'rows': count,
                    'database': 'telemedicina'
                })
            
            telemed_conn.close()
        except:
            telemed_tables = []
        
        return success_response({
            'main_database': tables,
            'clinical_database': clinical_tables,
            'telemedicina_database': telemed_tables
        })
        
    except Exception as e:
        return error_response(
            f'Error listando tablas: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@admin_bp.route('/database/tables/<table_name>', methods=['GET'])
@require_admin
def get_table_data(table_name):
    """
    Obtiene los datos de una tabla específica.
    
    Query Params:
        page: Página
        per_page: Items por página
        database: 'main' o 'telemedicina'
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    database = request.args.get('database', 'main')
    
    # Validar nombre de tabla (prevenir SQL injection)
    if not table_name.replace('_', '').isalnum():
        return error_response(
            'Nombre de tabla inválido',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    try:
        if database == 'telemedicina':
            conn = get_telemed_connection(sqlite3.Row)
        elif database == 'clinical':
            conn = get_clinical_connection(sqlite3.Row)
        else:
            conn = get_db_connection(sqlite3.Row)
        
        cursor = conn.cursor()
        
        # Verificar que la tabla existe
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name = ?
        """, [table_name])
        
        if not cursor.fetchone():
            conn.close()
            return error_response(
                'Tabla no encontrada',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        # Obtener estructura
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [{'name': col[1], 'type': col[2]} for col in cursor.fetchall()]
        
        # Contar total
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        total = cursor.fetchone()[0]
        
        # Obtener datos paginados
        cursor.execute(f"SELECT * FROM {table_name} LIMIT ? OFFSET ?", 
                      [per_page, (page - 1) * per_page])
        rows = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return success_response({
            'table': table_name,
            'columns': columns,
            'data': rows,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        return error_response(
            f'Error obteniendo datos: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@admin_bp.route('/database/tables/<table_name>/<row_id>', methods=['PUT'])
@require_admin
def update_table_row(table_name, row_id):
    """
    Actualiza una fila específica de una tabla.
    
    Request Body:
        {
            "column": "NOMBRE_COLUMNA",
            "value": "nuevo_valor"
        }
    """
    data = request.get_json() or {}
    database = request.args.get('database', 'main')
    
    column = data.get('column')
    value = data.get('value')
    
    if not column:
        return error_response(
            'Columna requerida',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    # Validar nombres (prevenir SQL injection)
    if not table_name.replace('_', '').isalnum():
        return error_response(
            'Nombre de tabla inválido',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    if not column.replace('_', '').isalnum():
        return error_response(
            'Nombre de columna inválido',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    try:
        if database == 'telemedicina':
            conn = get_telemed_connection()
        elif database == 'clinical':
            conn = get_clinical_connection()
        else:
            conn = get_db_connection()
        
        cursor = conn.cursor()
        
        # Obtener nombre de la columna PK
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns_info = cursor.fetchall()
        pk_column = columns_info[0][1]  # Primera columna como PK
        
        # Actualizar
        cursor.execute(f"""
            UPDATE {table_name} 
            SET {column} = ?
            WHERE {pk_column} = ?
        """, [value, row_id])
        
        if cursor.rowcount == 0:
            conn.close()
            return error_response(
                'Registro no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        conn.commit()
        conn.close()
        
        return success_response({
            'table': table_name,
            'row_id': row_id,
            'column': column,
            'new_value': value
        }, message='Registro actualizado exitosamente')
        
    except Exception as e:
        return error_response(
            f'Error actualizando registro: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@admin_bp.route('/database/export/<table_name>', methods=['GET'])
@require_admin
def export_table(table_name):
    """
    Exporta una tabla completa en formato JSON.
    """
    database = request.args.get('database', 'main')
    
    if not table_name.replace('_', '').isalnum():
        return error_response(
            'Nombre de tabla inválido',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    try:
        if database == 'telemedicina':
            conn = get_telemed_connection(sqlite3.Row)
        elif database == 'clinical':
            conn = get_clinical_connection(sqlite3.Row)
        else:
            conn = get_db_connection(sqlite3.Row)
        
        cursor = conn.cursor()
        
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return success_response({
            'table': table_name,
            'total_rows': len(rows),
            'data': rows
        })
        
    except Exception as e:
        return error_response(
            f'Error exportando tabla: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


# ============================================================
# AUTH.DB ADMIN ENDPOINTS - Real user management
# ============================================================

@admin_bp.route('/dashboard-stats', methods=['GET'])
@require_admin
def dashboard_stats():
    """
    KPIs reales desde auth.db: total users, active, doctors, admins, pending.
    """
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM users")
        total = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM users WHERE is_active = 1 AND (status IS NULL OR status = 'active')")
        active = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM users WHERE role LIKE '%doctor%'")
        doctors = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM users WHERE role LIKE '%admin%'")
        admins = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM users WHERE role LIKE '%nutricionista%'")
        nutricionistas = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM users WHERE role LIKE '%entrenador%'")
        entrenadores = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM users WHERE status = 'pending_verification'")
        pending = cursor.fetchone()[0]

        conn.close()

        return success_response({
            'total_users': total,
            'active_users': active,
            'doctors': doctors,
            'admins': admins,
            'nutricionistas': nutricionistas,
            'entrenadores': entrenadores,
            'pending_verification': pending,
        })
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@admin_bp.route('/auth-users', methods=['GET'])
@require_admin
def list_auth_users():
    """
    Lista todos los usuarios de auth.db con status, role, permisos.
    Query params: ?q=search&status=active|pending_verification
    """
    search = request.args.get('q', '').strip()
    status_filter = request.args.get('status', '').strip()

    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        query = """
            SELECT u.id, u.email, u.display_name, u.role, u.is_active, u.status,
                   u.telefono, u.desired_role, u.created_at,
                   l.patient_dni
            FROM users u
            LEFT JOIN patient_user_link l ON u.id = l.user_id
            WHERE 1=1
        """
        params = []

        if search:
            query += " AND (u.display_name LIKE ? OR u.email LIKE ? OR l.patient_dni LIKE ?)"
            s = f"%{search}%"
            params.extend([s, s, s])

        if status_filter:
            query += " AND u.status = ?"
            params.append(status_filter)

        query += " ORDER BY u.created_at DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        users = []
        for row in rows:
            d = dict(row)
            users.append({
                'id': d['id'],
                'email': d['email'],
                'display_name': d['display_name'] or '',
                'role': d['role'] or 'user',
                'is_active': bool(d['is_active']),
                'status': d['status'] or 'active',
                'telefono': d['telefono'] or '',
                'desired_role': d['desired_role'] or '',
                'patient_dni': d['patient_dni'] or '',
                'created_at': d['created_at'] or '',
            })

        return success_response({'users': users, 'total': len(users)})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@admin_bp.route('/pending-users', methods=['GET'])
@require_admin
def list_pending_users():
    """
    Lista usuarios pendientes de verificación.
    """
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT u.id, u.email, u.display_name, u.role, u.telefono, u.desired_role, u.created_at,
                   l.patient_dni
            FROM users u
            LEFT JOIN patient_user_link l ON u.id = l.user_id
            WHERE u.status = 'pending_verification'
            ORDER BY u.created_at DESC
        """)
        rows = cursor.fetchall()
        conn.close()

        users = []
        for row in rows:
            d = dict(row)
            users.append({
                'id': d['id'],
                'email': d['email'],
                'display_name': d['display_name'] or '',
                'role': d['role'] or 'user',
                'telefono': d['telefono'] or '',
                'desired_role': d['desired_role'] or '',
                'patient_dni': d['patient_dni'] or '',
                'created_at': d['created_at'] or '',
            })

        return success_response({'users': users, 'total': len(users)})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@admin_bp.route('/auth-users/<int:user_id>/approve', methods=['POST'])
@require_admin
def approve_user(user_id):
    """
    Aprueba un usuario pendiente: cambia status a 'active'.
    """
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("SELECT id, display_name, status FROM users WHERE id = ?", [user_id])
        user = cursor.fetchone()
        if not user:
            conn.close()
            return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        cursor.execute("UPDATE users SET status = 'active' WHERE id = ?", [user_id])
        conn.commit()
        conn.close()

        admin = get_current_user()
        _log_audit(
            admin.get('user_id'), admin.get('nombre_apellido', 'Admin'),
            'user_approved',
            f'Aprobó usuario: {dict(user)["display_name"]} (ID {user_id})',
            request.remote_addr
        )

        return success_response({'user_id': user_id, 'status': 'active'}, message='Usuario aprobado')
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@admin_bp.route('/auth-users/<int:user_id>/reject', methods=['POST'])
@require_admin
def reject_user(user_id):
    """
    Rechaza un usuario pendiente: cambia is_active a 0 y status a 'rejected'.
    """
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("SELECT id, display_name FROM users WHERE id = ?", [user_id])
        user = cursor.fetchone()
        if not user:
            conn.close()
            return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        cursor.execute("UPDATE users SET status = 'rejected', is_active = 0 WHERE id = ?", [user_id])
        conn.commit()
        conn.close()

        admin = get_current_user()
        _log_audit(
            admin.get('user_id'), admin.get('nombre_apellido', 'Admin'),
            'user_rejected',
            f'Rechazó usuario: {dict(user)["display_name"]} (ID {user_id})',
            request.remote_addr
        )

        return success_response({'user_id': user_id, 'status': 'rejected'}, message='Usuario rechazado')
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@admin_bp.route('/auth-users/<int:user_id>/toggle-active', methods=['POST'])
@require_admin
def toggle_user_active(user_id):
    """
    Activa/desactiva un usuario.
    """
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("SELECT id, display_name, is_active FROM users WHERE id = ?", [user_id])
        user = cursor.fetchone()
        if not user:
            conn.close()
            return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        new_active = 0 if dict(user)['is_active'] else 1
        cursor.execute("UPDATE users SET is_active = ? WHERE id = ?", [new_active, user_id])
        conn.commit()
        conn.close()

        admin = get_current_user()
        action = 'user_activated' if new_active else 'user_deactivated'
        _log_audit(
            admin.get('user_id'), admin.get('nombre_apellido', 'Admin'),
            action,
            f'{"Activó" if new_active else "Desactivó"} usuario: {dict(user)["display_name"]} (ID {user_id})',
            request.remote_addr
        )

        return success_response({'user_id': user_id, 'is_active': bool(new_active)})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@admin_bp.route('/auth-users/<int:user_id>/role', methods=['POST'])
@require_admin
def update_user_role(user_id):
    """
    Toggle a role for a user. Roles are stored comma-separated.
    Body: { "role": "doctor" }  — toggles that role on/off.
    'user' is always implicit (base role).
    """
    VALID_ROLES = ('user', 'doctor', 'admin', 'nutricionista', 'entrenador')
    data = request.get_json() or {}
    toggle_role = data.get('role', '').strip()

    if toggle_role not in VALID_ROLES:
        return error_response('Rol inválido', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("SELECT id, display_name, role FROM users WHERE id = ?", [user_id])
        user = cursor.fetchone()
        if not user:
            conn.close()
            return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        old_roles_str = dict(user)['role'] or 'user'
        current_roles = set(r.strip() for r in old_roles_str.split(',') if r.strip())

        if toggle_role == 'user':
            # 'user' is base, reset to just user
            current_roles = {'user'}
        elif toggle_role in current_roles:
            current_roles.discard(toggle_role)
        else:
            current_roles.add(toggle_role)

        # Ensure 'user' is always present as base
        current_roles.add('user')

        new_roles_str = ','.join(sorted(current_roles))
        cursor.execute("UPDATE users SET role = ? WHERE id = ?", [new_roles_str, user_id])
        conn.commit()
        conn.close()

        admin = get_current_user()
        _log_audit(
            admin.get('user_id'), admin.get('nombre_apellido', 'Admin'),
            'role_change',
            f'Roles de {dict(user)["display_name"]}: {old_roles_str} → {new_roles_str}',
            request.remote_addr
        )

        return success_response({'user_id': user_id, 'roles': new_roles_str}, message=f'Roles actualizados: {new_roles_str}')
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@admin_bp.route('/auth-users/<int:user_id>', methods=['DELETE'])
@require_admin
def delete_auth_user(user_id):
    """
    Elimina un usuario de auth.db y su link.
    """
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("SELECT id, display_name, email FROM users WHERE id = ?", [user_id])
        user = cursor.fetchone()
        if not user:
            conn.close()
            return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        u = dict(user)
        cursor.execute("DELETE FROM patient_user_link WHERE user_id = ?", [user_id])
        cursor.execute("DELETE FROM users WHERE id = ?", [user_id])
        conn.commit()
        conn.close()

        admin = get_current_user()
        _log_audit(
            admin.get('user_id'), admin.get('nombre_apellido', 'Admin'),
            'user_deleted',
            f'Eliminó usuario: {u["display_name"]} ({u["email"]}, ID {user_id})',
            request.remote_addr
        )

        return success_response({'user_id': user_id}, message='Usuario eliminado')
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@admin_bp.route('/audit', methods=['GET'])
@require_admin
def get_audit_log():
    """
    Devuelve las últimas entradas del audit log.
    Query params: ?limit=20
    """
    limit = request.args.get('limit', 20, type=int)

    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, user_id, user_name, action, details, ip_address, created_at
            FROM audit_log
            ORDER BY created_at DESC
            LIMIT ?
        """, [limit])
        rows = cursor.fetchall()
        conn.close()

        entries = [dict(row) for row in rows]
        return success_response({'entries': entries, 'total': len(entries)})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)
