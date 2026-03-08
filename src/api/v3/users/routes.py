"""
USERS Routes - Endpoints de usuarios y perfiles
"""

from flask import request
from . import users_bp
from ..common.responses import success_response, error_response, paginated_response, ErrorCodes
from ..common.auth import require_auth, require_admin, require_owner_or_admin, get_current_user, is_assigned_professional
from ..common.database import get_db_connection, execute_query, resolve_user_identity, get_clinical_connection, resolve_patient_id
import sqlite3
import math
from datetime import datetime


@users_bp.route('', methods=['GET'])
@require_admin
def list_users():
    """
    Lista todos los usuarios (solo admin).
    
    Query Params:
        page: Página (default: 1)
        per_page: Items por página (default: 20)
        q: Búsqueda por nombre
        activo: Filtrar por estado activo
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('q', '').strip()
    
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        # Query base
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
        
        # Paginacion
        query += " ORDER BY nombre ASC LIMIT ? OFFSET ?"
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


@users_bp.route('/<user_id>', methods=['GET'])
@require_owner_or_admin
def get_user(user_id):
    """
    Obtiene un usuario por ID (auth.db ID, DNI, or nombre_apellido).
    """
    identity = resolve_user_identity(user_id)
    resolved_dni = identity['dni'] if identity else user_id
    
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM patients WHERE dni = ?", [resolved_dni])
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return error_response(
                'Usuario no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        user_dict = dict(user)
        patient_id = user_dict['id']
        
        # Obtener ultima medicion
        cursor.execute("""
            SELECT * FROM measurements 
            WHERE patient_id = ?
            ORDER BY fecha DESC LIMIT 1
        """, [patient_id])
        
        perfil_dinamico = cursor.fetchone()
        
        # Obtener objetivo
        cursor.execute("""
            SELECT * FROM goals WHERE patient_id = ? AND activo = 1
        """, [patient_id])
        
        objetivo = cursor.fetchone()
        
        conn.close()
        
        return success_response({
            'user': user_dict,
            'perfil_dinamico': dict(perfil_dinamico) if perfil_dinamico else None,
            'objetivo': dict(objetivo) if objetivo else None
        })
        
    except Exception as e:
        return error_response(
            f'Error obteniendo usuario: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@users_bp.route('', methods=['POST'])
@require_admin
def create_user():
    """
    Crea un nuevo usuario (perfil estático).
    
    Request Body:
        {
            "dni": "12345678",
            "nombre_apellido": "Apellido, Nombre",
            "email": "user@example.com",
            "sexo": "M" | "F",
            "altura": 175,
            "telefono": "123456789",
            "fecha_nacimiento": "1990-01-01"
        }
    """
    data = request.get_json() or {}
    
    # Validaciones
    required_fields = ['dni', 'nombre_apellido', 'email', 'sexo', 'altura']
    missing = [f for f in required_fields if not data.get(f)]
    
    if missing:
        return error_response(
            f'Campos requeridos faltantes: {", ".join(missing)}',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()
        
        # Verificar si ya existe
        cursor.execute("SELECT dni FROM patients WHERE dni = ?", [data['dni']])
        if cursor.fetchone():
            conn.close()
            return error_response(
                'Ya existe un usuario con ese DNI',
                code=ErrorCodes.CONFLICT,
                status_code=409
            )
        
        # Insertar
        cursor.execute("""
            INSERT INTO patients 
            (dni, nombre, email, sexo, altura, telefono, fecha_nacimiento)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [
            data['dni'],
            data['nombre_apellido'],
            data['email'],
            data['sexo'],
            data['altura'],
            data.get('telefono'),
            data.get('fecha_nacimiento')
        ])
        
        conn.commit()
        conn.close()
        
        return success_response(
            {'dni': data['dni'], 'nombre_apellido': data['nombre_apellido']},
            message='Usuario creado exitosamente'
        )
        
    except Exception as e:
        return error_response(
            f'Error creando usuario: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@users_bp.route('/<user_id>', methods=['PUT'])
@require_owner_or_admin
def update_user(user_id):
    """
    Actualiza un usuario (perfil estático).
    """
    identity = resolve_user_identity(user_id)
    resolved_dni = identity['dni'] if identity else user_id
    
    data = request.get_json() or {}
    
    if not data:
        return error_response(
            'No hay datos para actualizar',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()
        
        # Verificar que existe
        cursor.execute("SELECT dni FROM patients WHERE dni = ?", [resolved_dni])
        if not cursor.fetchone():
            conn.close()
            return error_response(
                'Usuario no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        # Campos actualizables (map legacy names to clinical.db)
        field_map = {
            'nombre_apellido': 'nombre', 'email': 'email', 'sexo': 'sexo',
            'altura': 'altura', 'telefono': 'telefono', 'fecha_nacimiento': 'fecha_nacimiento'
        }
        updates = []
        values = []
        
        for key, col in field_map.items():
            if key in data:
                updates.append(f"{col} = ?")
                values.append(data[key])
        
        if not updates:
            conn.close()
            return error_response(
                'No hay campos validos para actualizar',
                code=ErrorCodes.VALIDATION_ERROR,
                status_code=400
            )
        
        values.append(resolved_dni)
        
        cursor.execute(f"""
            UPDATE patients 
            SET {', '.join(updates)}
            WHERE dni = ?
        """, values)
        
        conn.commit()
        conn.close()
        
        return success_response(
            {'dni': resolved_dni, 'updated_fields': list(data.keys())},
            message='Usuario actualizado exitosamente'
        )
        
    except Exception as e:
        return error_response(
            f'Error actualizando usuario: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@users_bp.route('/<user_id>', methods=['DELETE'])
@require_admin
def delete_user(user_id):
    """
    Elimina un usuario (solo admin).
    """
    identity = resolve_user_identity(user_id)
    resolved_dni = identity['dni'] if identity else user_id
    
    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()
        
        # Verificar que existe
        cursor.execute("SELECT id FROM patients WHERE dni = ?", [resolved_dni])
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return error_response(
                'Usuario no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        patient_id = user[0]
        
        # Eliminar datos relacionados (CASCADE should handle this, but explicit is safer)
        cursor.execute("DELETE FROM measurements WHERE patient_id = ?", [patient_id])
        cursor.execute("DELETE FROM goals WHERE patient_id = ?", [patient_id])
        cursor.execute("DELETE FROM nutrition_plans WHERE patient_id = ?", [patient_id])
        cursor.execute("DELETE FROM patients WHERE id = ?", [patient_id])
        
        conn.commit()
        conn.close()
        
        return success_response(
            {'dni': resolved_dni, 'deleted': True},
            message='Usuario eliminado exitosamente'
        )
        
    except Exception as e:
        return error_response(
            f'Error eliminando usuario: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


# ============================================
# MEDICIONES (Perfil Dinámico)
# ============================================

@users_bp.route('/<user_id>/measurements', methods=['GET'])
@require_owner_or_admin
def get_measurements(user_id):
    """
    Obtiene el historial de mediciones de un usuario.
    
    Query Params:
        limit: Número máximo de registros (default: 50)
    """
    identity = resolve_user_identity(user_id)
    resolved_dni = identity['dni'] if identity else user_id
    
    limit = min(request.args.get('limit', 50, type=int), 500)

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        # Obtener paciente
        cursor.execute("SELECT id, nombre FROM patients WHERE dni = ?", [resolved_dni])
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return error_response(
                'Usuario no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        patient_id = user[0]
        nombre = user[1]
        
        # Obtener mediciones
        cursor.execute("""
            SELECT * FROM measurements 
            WHERE patient_id = ?
            ORDER BY fecha DESC
            LIMIT ?
        """, [patient_id, limit])
        
        measurements = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return success_response({
            'user_id': user_id,
            'nombre_apellido': nombre,
            'measurements': measurements,
            'total': len(measurements)
        })
        
    except Exception as e:
        return error_response(
            f'Error obteniendo mediciones: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@users_bp.route('/<user_id>/measurements', methods=['POST'])
@require_owner_or_admin
def create_measurement(user_id):
    """
    Crea una nueva medición (perfil dinámico).

    Acepta campos estáticos (se actualizan en patients):
        altura, circ_cuello, circ_muneca, circ_tobillo

    Campos de medición (se insertan en measurements):
        peso*, circ_abdomen*, circ_cintura, circ_cadera,
        circ_hombro, circ_pecho, circ_brazo, circ_antebrazo, circ_muslo, circ_pantorrilla

    Validación por sexo:
        M: peso + circ_abdomen obligatorios
        F: peso + circ_cintura + circ_cadera + circ_abdomen obligatorios
    """
    identity = resolve_user_identity(user_id)
    resolved_dni = identity['dni'] if identity else user_id

    data = request.get_json() or {}

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        # Obtener datos del usuario
        cursor.execute("""
            SELECT id, nombre, sexo, altura, circ_cuello, circ_muneca, circ_tobillo
            FROM patients WHERE dni = ?
        """, [resolved_dni])
        user = cursor.fetchone()

        if not user:
            conn.close()
            return error_response(
                'Usuario no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )

        patient_id = user['id']
        sexo = user['sexo']
        altura = user['altura']

        # Validación por sexo
        if not data.get('peso'):
            conn.close()
            return error_response(
                'El peso es requerido',
                code=ErrorCodes.VALIDATION_ERROR,
                status_code=400
            )

        if sexo == 'F':
            missing = []
            if not data.get('circ_cintura'): missing.append('circ_cintura')
            if not data.get('circ_cadera'): missing.append('circ_cadera')
            if not data.get('circ_abdomen'): missing.append('circ_abdomen')
            if missing:
                conn.close()
                return error_response(
                    f'Campos obligatorios para mujeres: {", ".join(missing)}',
                    code=ErrorCodes.VALIDATION_ERROR,
                    status_code=400
                )
        elif sexo == 'M':
            if not data.get('circ_abdomen'):
                conn.close()
                return error_response(
                    'circ_abdomen es obligatorio para hombres',
                    code=ErrorCodes.VALIDATION_ERROR,
                    status_code=400
                )

        # Actualizar campos estáticos en patients si se proporcionan
        static_fields = {}
        for field in ['altura', 'circ_cuello', 'circ_muneca', 'circ_tobillo']:
            if data.get(field) is not None:
                static_fields[field] = float(data[field])

        if static_fields:
            set_clause = ', '.join(f"{k} = ?" for k in static_fields)
            cursor.execute(
                f"UPDATE patients SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                list(static_fields.values()) + [patient_id]
            )
            # Use updated altura for calculations
            if 'altura' in static_fields:
                altura = static_fields['altura']

        peso = float(data['peso'])
        circ_abdomen = float(data.get('circ_abdomen') or 0)
        circ_cintura = float(data.get('circ_cintura') or 0)
        circ_cadera = float(data.get('circ_cadera') or 0)

        # Campos de seguimiento
        circ_hombro = float(data['circ_hombro']) if data.get('circ_hombro') else None
        circ_pecho = float(data['circ_pecho']) if data.get('circ_pecho') else None
        circ_brazo = float(data['circ_brazo']) if data.get('circ_brazo') else None
        circ_antebrazo = float(data['circ_antebrazo']) if data.get('circ_antebrazo') else None
        circ_muslo = float(data['circ_muslo']) if data.get('circ_muslo') else None
        circ_pantorrilla = float(data['circ_pantorrilla']) if data.get('circ_pantorrilla') else None

        # Calcular BF% usando metodo Navy
        altura_cm = float(altura) if altura else 170
        bf_percent = 0

        if sexo == 'M' and circ_abdomen > 0:
            bf_percent = 495 / (1.0324 - 0.19077 * math.log10(circ_abdomen) + 0.15456 * math.log10(altura_cm)) - 450
        elif sexo == 'F' and circ_cintura > 0 and circ_cadera > 0:
            bf_percent = 495 / (1.29579 - 0.35004 * math.log10(circ_cintura + circ_cadera) + 0.22100 * math.log10(altura_cm)) - 450

        bf_percent = max(0, min(60, bf_percent))  # Limitar entre 0-60%

        # Calcular peso magro y graso
        peso_graso = peso * (bf_percent / 100)
        peso_magro = peso - peso_graso

        # Calcular FFMI
        altura_m = altura_cm / 100
        ffmi = peso_magro / (altura_m ** 2) + 6.1 * (1.8 - altura_m) if altura_m > 0 else 0

        fecha_registro = data.get('fecha_registro') or datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Insertar medicion
        cursor.execute("""
            INSERT INTO measurements
            (patient_id, fecha, peso, circ_abdomen, circ_cintura, circ_cadera,
             circ_hombro, circ_pecho, circ_brazo, circ_antebrazo, circ_muslo, circ_pantorrilla,
             bf_percent, peso_magro, peso_graso, ffmi)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            patient_id,
            fecha_registro,
            peso,
            circ_abdomen,
            circ_cintura,
            circ_cadera,
            circ_hombro,
            circ_pecho,
            circ_brazo,
            circ_antebrazo,
            circ_muslo,
            circ_pantorrilla,
            round(bf_percent, 2),
            round(peso_magro, 2),
            round(peso_graso, 2),
            round(ffmi, 2)
        ])

        measurement_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return success_response({
            'id': measurement_id,
            'user_id': user_id,
            'peso': peso,
            'bf_percent': round(bf_percent, 2),
            'peso_magro': round(peso_magro, 2),
            'peso_graso': round(peso_graso, 2),
            'ffmi': round(ffmi, 2),
            'fecha_registro': fecha_registro,
            'static_updated': list(static_fields.keys()) if static_fields else []
        }, message='Medición registrada exitosamente')

    except Exception as e:
        return error_response(
            f'Error creando medición: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@users_bp.route('/<user_id>/measurements/<int:measurement_id>', methods=['DELETE'])
@require_owner_or_admin
def delete_measurement(user_id, measurement_id):
    """
    Elimina una medición específica.
    """
    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM measurements WHERE id = ?", [measurement_id])
        
        if cursor.rowcount == 0:
            conn.close()
            return error_response(
                'Medición no encontrada',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        conn.commit()
        conn.close()
        
        return success_response(
            {'id': measurement_id, 'deleted': True},
            message='Medición eliminada exitosamente'
        )
        
    except Exception as e:
        return error_response(
            f'Error eliminando medición: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


# ============================================
# OBJETIVOS
# ============================================

@users_bp.route('/<user_id>/goals', methods=['GET'])
@require_owner_or_admin
def get_goals(user_id):
    """
    Obtiene los objetivos del usuario.
    """
    identity = resolve_user_identity(user_id)
    resolved_dni = identity['dni'] if identity else user_id
    
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        # Obtener paciente
        cursor.execute("SELECT id FROM patients WHERE dni = ?", [resolved_dni])
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return error_response(
                'Usuario no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        patient_id = user[0]
        
        cursor.execute("SELECT * FROM goals WHERE patient_id = ? AND activo = 1", [patient_id])
        goal = cursor.fetchone()
        conn.close()
        
        return success_response({
            'user_id': user_id,
            'goal': dict(goal) if goal else None
        })
        
    except Exception as e:
        return error_response(
            f'Error obteniendo objetivos: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@users_bp.route('/<user_id>/goals', methods=['POST'])
@require_owner_or_admin
def create_or_update_goal(user_id):
    """
    Crea o actualiza el objetivo del usuario.
    
    Request Body:
        {
            "peso_objetivo": 70,
            "bf_objetivo": 12,
            "ffmi_objetivo": 22,
            "circ_abdomen_objetivo": 80,
            "circ_cintura_objetivo": 75,
            "circ_cadera_objetivo": 90
        }
    """
    identity = resolve_user_identity(user_id)
    resolved_dni = identity['dni'] if identity else user_id
    
    data = request.get_json() or {}
    
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        # Obtener paciente
        cursor.execute("SELECT id FROM patients WHERE dni = ?", [resolved_dni])
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return error_response(
                'Usuario no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        patient_id = user[0]
        
        # Verificar si ya existe objetivo activo
        cursor.execute("SELECT id FROM goals WHERE patient_id = ? AND activo = 1", [patient_id])
        existing = cursor.fetchone()
        
        # Map request fields to clinical.db column names
        field_map = {
            'peso_objetivo': 'goal_peso', 'bf_objetivo': 'goal_bf',
            'ffmi_objetivo': 'goal_ffmi',
            'circ_abdomen_objetivo': 'goal_abdomen',
            'circ_cintura_objetivo': 'goal_cintura',
            'circ_cadera_objetivo': 'goal_cadera',
            'notas': 'notas',
            'tipo': 'tipo',
        }

        if existing:
            # Actualizar
            fields = ["updated_at = datetime('now', 'localtime')"]
            values = []

            for key, value in data.items():
                if value is not None and key in field_map:
                    fields.append(f"{field_map[key]} = ?")
                    values.append(value)

            values.append(existing[0])
            cursor.execute(f"""
                UPDATE goals
                SET {', '.join(fields)}
                WHERE id = ?
            """, values)

            action = 'updated'
        else:
            # Insertar
            cursor.execute("""
                INSERT INTO goals
                (patient_id, goal_peso, goal_bf, goal_ffmi,
                 goal_abdomen, goal_cintura, goal_cadera, notas, tipo, activo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, [
                patient_id,
                data.get('peso_objetivo'),
                data.get('bf_objetivo'),
                data.get('ffmi_objetivo'),
                data.get('circ_abdomen_objetivo'),
                data.get('circ_cintura_objetivo'),
                data.get('circ_cadera_objetivo'),
                data.get('notas'),
                data.get('tipo', 'manual'),
            ])
            action = 'created'
        
        conn.commit()
        conn.close()
        
        return success_response(
            {'user_id': user_id, 'action': action},
            message=f'Objetivo {action} exitosamente'
        )
        
    except Exception as e:
        return error_response(
            f'Error guardando objetivo: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@users_bp.route('/<user_id>/goals/auto', methods=['GET'])
@require_owner_or_admin
def get_auto_goals(user_id):
    """
    Calcula objetivos automáticos basados en límites genéticos.
    """
    patient = resolve_patient_id(user_id)
    
    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
    
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        # Obtener datos del paciente
        cursor.execute("""
            SELECT nombre, sexo, altura 
            FROM patients WHERE id = ?
        """, [patient['patient_id']])
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return error_response(
                'Usuario no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        nombre_apellido = user[0]
        sexo = user[1]
        altura = float(user[2]) if user[2] else 170
        
        # Obtener ultima medicion (using correct clinical.db column names)
        cursor.execute("""
            SELECT peso, bf_percent, peso_magro, peso_graso, ffmi
            FROM measurements 
            WHERE patient_id = ?
            ORDER BY fecha DESC LIMIT 1
        """, [patient['patient_id']])
        
        medicion = cursor.fetchone()
        conn.close()
        
        if not medicion:
            return error_response(
                'No hay mediciones para calcular objetivos',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        peso_actual = float(medicion[0])
        bf_actual = float(medicion[1]) if medicion[1] else 20
        peso_magro_actual = float(medicion[2]) if medicion[2] else peso_actual * 0.8
        
        # Límites genéticos según sexo
        if sexo == 'M':
            ffmi_limite = 23.7  # Score 100 para hombres
            bf_esencial = 6.0   # Score 100 para hombres
        else:
            ffmi_limite = 18.9  # Score 100 para mujeres
            bf_esencial = 14.0  # Score 100 para mujeres
        
        # Calcular peso objetivo
        altura_m = altura / 100
        peso_magro_objetivo = (ffmi_limite - 6.1 * (1.8 - altura_m)) * (altura_m ** 2)
        peso_graso_objetivo = peso_magro_objetivo * (bf_esencial / 100) / (1 - bf_esencial / 100)
        peso_objetivo = peso_magro_objetivo + peso_graso_objetivo
        
        # Calcular cambios necesarios
        cambio_peso = peso_objetivo - peso_actual
        cambio_magro = peso_magro_objetivo - peso_magro_actual
        
        # Tiempo estimado (0.5kg/semana pérdida, 0.25kg/semana ganancia)
        if cambio_peso < 0:
            semanas = abs(cambio_peso) / 0.5
        else:
            semanas = cambio_peso / 0.25
        
        meses = semanas / 4.33
        
        return success_response({
            'datos_actuales': {
                'peso': peso_actual,
                'bf': bf_actual,
                'peso_magro': peso_magro_actual,
                'ffmi': float(medicion[4]) if medicion[4] else 0
            },
            'objetivos_geneticos': {
                'ffmi_limite': ffmi_limite,
                'bf_esencial': bf_esencial,
                'peso_objetivo': round(peso_objetivo, 1),
                'peso_magro_objetivo': round(peso_magro_objetivo, 1),
                'peso_graso_objetivo': round(peso_graso_objetivo, 1)
            },
            'cambios_necesarios': {
                'peso': round(cambio_peso, 1),
                'peso_magro': round(cambio_magro, 1)
            },
            'tiempo_estimado': {
                'semanas': round(semanas, 0),
                'meses': round(meses, 1)
            },
            'metadata': {
                'sexo': sexo,
                'altura': altura
            }
        })
        
    except Exception as e:
        return error_response(
            f'Error calculando objetivos: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


# ============================================
# AUTO-ROADMAP (objetivos parciales progresivos)
# ============================================

def _obtener_categoria_ffmi(ffmi, sexo):
    """Categoría FFMI según rangos del dashboard."""
    if sexo == 'M':
        if ffmi < 15: return 'Muy Pobre'
        if ffmi < 17: return 'Pobre'
        if ffmi < 18.5: return 'Bajo'
        if ffmi < 20: return 'Casi Normal'
        if ffmi < 21.5: return 'Normal'
        if ffmi < 23: return 'Bueno'
        if ffmi < 25: return 'Muy Bueno'
        if ffmi < 28: return 'Excelente'
        return 'Superior'
    else:
        if ffmi < 12: return 'Muy Pobre'
        if ffmi < 13: return 'Pobre'
        if ffmi < 14.5: return 'Bajo'
        if ffmi < 16: return 'Casi Normal'
        if ffmi < 17.5: return 'Normal'
        if ffmi < 19: return 'Bueno'
        if ffmi < 21: return 'Muy Bueno'
        if ffmi < 24: return 'Excelente'
        return 'Superior'


def _calcular_objetivos_parciales(peso_actual, bf_actual, peso_magro_actual, peso_graso_actual, altura, sexo):
    """
    Calcula fases progresivas de corte/volumen hasta el límite genético.

    DEFINICIÓN: Del peso perdido, 75% es grasa y 25% es músculo
    VOLUMEN: Del peso ganado, 50% es grasa y 50% es músculo
    """
    objetivos = []

    if sexo == 'M':
        umbrales_def_inicial = [31, 24, 17, 12]
        categorias_def = ['Obesidad', 'Alto', 'Fitness/Promedio', 'Base Fitness']
        bf_base = 12.0
        bf_volumen = 18.0
        ffmi_limite = 25.0
        bf_elite = 6.0
    else:
        umbrales_def_inicial = [38, 31, 24, 20]
        categorias_def = ['Obesidad', 'Alto', 'Fitness/Promedio', 'Base Fitness']
        bf_base = 20.0
        bf_volumen = 25.0
        ffmi_limite = 21.0
        bf_elite = 14.0

    W = peso_actual
    FM = peso_graso_actual
    LM = peso_magro_actual
    altura_m = altura / 100

    # FASE 1: Initial cuts to reach base BF
    for i, bf_target in enumerate(umbrales_def_inicial):
        if (bf_actual * 100) > bf_target:
            t = bf_target / 100
            delta = (FM - t * W) / (0.75 - t)
            if delta > 0:
                W_new = W - delta
                FM_new = t * W_new
                LM_new = W_new - FM_new
                FFMI_new = LM_new / (altura_m ** 2)
                objetivos.append({
                    'tipo': 'definicion',
                    'bf_objetivo': bf_target,
                    'ffmi_objetivo': round(FFMI_new, 1),
                    'ffmi_categoria': _obtener_categoria_ffmi(FFMI_new, sexo),
                    'peso_objetivo': round(W_new, 1),
                    'cambio_peso': round(-delta, 1),
                    'cambio_musculo': round(LM_new - LM, 1),
                    'cambio_grasa': round(FM_new - FM, 1),
                    'descripcion': f'Definición → {bf_target}% BF',
                    'categoria': categorias_def[i],
                    'fase': 'Corte inicial (75% grasa / 25% músculo)',
                })
                W, FM, LM = W_new, FM_new, LM_new

    # FASE 2: Bulk/Cut cycles until FFMI limit
    FFMI_current = LM / (altura_m ** 2)
    ciclo = 1
    max_ciclos = 10

    while FFMI_current < ffmi_limite and ciclo <= max_ciclos:
        W_antes_vol, LM_antes_vol, FM_antes_vol = W, LM, FM

        # VOLUMEN
        t_vol = bf_volumen / 100
        ganancia = (FM - t_vol * W) / (t_vol - 0.5)
        if ganancia > 0:
            W_vol = W + ganancia
            FM_vol = t_vol * W_vol
            LM_vol = W_vol - FM_vol
            FFMI_vol = LM_vol / (altura_m ** 2)

            if FFMI_vol > ffmi_limite:
                LM_vol = ffmi_limite * (altura_m ** 2)
                ganancia_musculo = LM_vol - LM_antes_vol
                FM_vol = FM_antes_vol + ganancia_musculo
                W_vol = LM_vol + FM_vol
                ganancia = W_vol - W
                FFMI_vol = ffmi_limite

            objetivos.append({
                'tipo': 'volumen',
                'bf_objetivo': round((FM_vol / W_vol) * 100, 1),
                'ffmi_objetivo': round(FFMI_vol, 1),
                'ffmi_categoria': _obtener_categoria_ffmi(FFMI_vol, sexo),
                'peso_objetivo': round(W_vol, 1),
                'cambio_peso': round(ganancia, 1),
                'cambio_musculo': round(LM_vol - LM_antes_vol, 1),
                'cambio_grasa': round(FM_vol - FM_antes_vol, 1),
                'descripcion': f'Volumen #{ciclo} → {bf_volumen}% BF',
                'categoria': 'Construcción Muscular',
                'fase': 'Volumen (50% grasa / 50% músculo)',
            })

            W, FM, LM = W_vol, FM_vol, LM_vol
            FFMI_current = FFMI_vol

            if FFMI_current >= ffmi_limite:
                break

            # DEFINICIÓN back to base
            t_base = bf_base / 100
            delta_base = (FM - t_base * W) / (0.75 - t_base)
            if delta_base > 0:
                W_base = W - delta_base
                FM_base = t_base * W_base
                LM_base = W_base - FM_base
                FFMI_base = LM_base / (altura_m ** 2)
                objetivos.append({
                    'tipo': 'definicion',
                    'bf_objetivo': bf_base,
                    'ffmi_objetivo': round(FFMI_base, 1),
                    'ffmi_categoria': _obtener_categoria_ffmi(FFMI_base, sexo),
                    'peso_objetivo': round(W_base, 1),
                    'cambio_peso': round(-delta_base, 1),
                    'cambio_musculo': round(LM_base - LM, 1),
                    'cambio_grasa': round(FM_base - FM, 1),
                    'descripcion': f'Definición #{ciclo} → {bf_base}% BF',
                    'categoria': 'Mantenimiento',
                    'fase': 'Corte (75% grasa / 25% músculo)',
                })
                W, FM, LM = W_base, FM_base, LM_base
                FFMI_current = FFMI_base

        ciclo += 1

    # FASE 3: Elite cut
    if FFMI_current >= ffmi_limite * 0.95:
        t_elite = bf_elite / 100
        delta_elite = (FM - t_elite * W) / (0.75 - t_elite)
        if delta_elite > 0:
            W_elite = W - delta_elite
            FM_elite = t_elite * W_elite
            LM_elite = W_elite - FM_elite
            FFMI_elite = LM_elite / (altura_m ** 2)
            ffmi_score_100 = 23.7 if sexo == 'M' else 18.9
            if FFMI_elite >= ffmi_score_100:
                objetivos.append({
                    'tipo': 'definicion',
                    'bf_objetivo': bf_elite,
                    'ffmi_objetivo': round(FFMI_elite, 1),
                    'ffmi_categoria': _obtener_categoria_ffmi(FFMI_elite, sexo),
                    'peso_objetivo': round(W_elite, 1),
                    'cambio_peso': round(-delta_elite, 1),
                    'cambio_musculo': round(LM_elite - LM, 1),
                    'cambio_grasa': round(FM_elite - FM, 1),
                    'descripcion': f'Recorte Final Élite → {bf_elite}% BF',
                    'categoria': 'Élite',
                    'fase': 'Corte extremo (75% grasa / 25% músculo)',
                })

    return objetivos


@users_bp.route('/<user_id>/goals/auto-roadmap', methods=['GET'])
@require_auth
def get_auto_roadmap(user_id):
    """
    Calcula un roadmap de fases progresivas (corte/volumen) desde el estado actual
    hasta el límite genético, incluyendo circunferencias por fase.
    """
    user = get_current_user()
    patient = resolve_patient_id(user_id)

    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    # Permission: owner, admin, or assigned professional
    is_owner = (patient['nombre'] == user['nombre_apellido']
                or str(patient.get('dni', '')) == str(user.get('dni', ''))
                or str(user_id) == str(user.get('user_id', '')))
    if not is_owner and not user['is_admin'] and not is_assigned_professional(user['user_id'], patient.get('dni', '')):
        return error_response(
            'No tienes permisos para ver datos de este paciente',
            code=ErrorCodes.FORBIDDEN, status_code=403
        )

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute(
            "SELECT nombre, sexo, altura, fecha_nacimiento, circ_cuello FROM patients WHERE id = ?",
            [patient['patient_id']]
        )
        pat = cursor.fetchone()
        if not pat:
            conn.close()
            return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        sexo = pat['sexo'] or 'M'
        altura = float(pat['altura'] or 170)
        circ_cuello = float(pat['circ_cuello'] or 38) if pat['circ_cuello'] else 38

        edad = None
        if pat['fecha_nacimiento']:
            try:
                born = datetime.strptime(str(pat['fecha_nacimiento']), '%Y-%m-%d')
                today = datetime.today()
                edad = today.year - born.year - ((today.month, today.day) < (born.month, born.day))
            except Exception:
                pass

        cursor.execute("""
            SELECT peso, bf_percent, ffmi, peso_graso, peso_magro,
                   circ_abdomen, circ_cintura, circ_cadera, fecha
            FROM measurements WHERE patient_id = ?
            ORDER BY fecha DESC LIMIT 1
        """, [patient['patient_id']])
        med = cursor.fetchone()
        conn.close()

        if not med:
            return error_response('No hay mediciones para calcular roadmap', code=ErrorCodes.NOT_FOUND, status_code=404)

        peso_actual = float(med['peso'])
        bf_actual = float(med['bf_percent'] or 20)
        ffmi_actual = float(med['ffmi'] or 0)
        peso_graso = float(med['peso_graso'] or peso_actual * bf_actual / 100)
        peso_magro = float(med['peso_magro'] or peso_actual - peso_graso)
        circ_abd = float(med['circ_abdomen'] or 0)
        circ_cin = float(med['circ_cintura'] or 0)
        circ_cad = float(med['circ_cadera'] or 0)

        altura_m = altura / 100

        # Genetic limits
        if sexo == 'M':
            ffmi_limite = 23.7
            bf_esencial = 6.0
            ganancia_musculo_mes = 0.375
        else:
            ffmi_limite = 18.9
            bf_esencial = 14.0
            ganancia_musculo_mes = 0.188

        peso_magro_obj = ffmi_limite * (altura_m ** 2)
        peso_obj = peso_magro_obj / (1 - bf_esencial / 100)
        peso_graso_obj = peso_obj - peso_magro_obj

        # Circumference targets (Navy method inverse)
        circ_abd_obj = 0
        circ_cin_obj = 0
        circ_cad_obj = 0
        try:
            if sexo == 'M':
                circ_abd_obj = circ_cuello + math.exp(
                    5152 * math.log(altura) / 6359
                    + 103240 * math.log(10) / 19077
                    - 16500000 * math.log(10) / (6359 * (bf_esencial + 450))
                )
            else:
                circ_cad_obj = (10 * circ_cuello + 10 * math.exp(
                    5525 * math.log(altura) / 8751
                    + 43193 * math.log(10) / 11668
                    - 4125000 * math.log(10) / (2917 * (bf_esencial + 450))
                )) / 17
                circ_cin_obj = circ_cad_obj * 0.7
        except Exception:
            pass

        # Changes needed
        cambio_peso = peso_obj - peso_actual
        cambio_magro = peso_magro_obj - peso_magro
        cambio_graso = peso_graso_obj - peso_graso

        # Time estimate
        meses_musculo = abs(cambio_magro) / ganancia_musculo_mes if cambio_magro > 0 else 0
        perdida_semanal = peso_actual * 0.0075
        semanas_grasa = abs(cambio_graso) / perdida_semanal if cambio_graso < 0 else 0
        tiempo_meses = max(meses_musculo, semanas_grasa / 4.33)

        # Compute phases
        fases_raw = _calcular_objetivos_parciales(peso_actual, bf_actual, peso_magro, peso_graso, altura, sexo)

        # Enrich phases with circumferences and time estimates
        fases = []
        for fase in fases_raw:
            bf_obj = fase['bf_objetivo']
            try:
                if sexo == 'M':
                    circ = circ_cuello + math.exp(
                        5152 * math.log(altura) / 6359
                        + 103240 * math.log(10) / 19077
                        - 16500000 * math.log(10) / (6359 * (bf_obj + 450))
                    )
                    fase['medida_abdomen'] = round(circ, 1)
                else:
                    circ_cad_f = (10 * circ_cuello + 10 * math.exp(
                        5525 * math.log(altura) / 8751
                        + 43193 * math.log(10) / 11668
                        - 4125000 * math.log(10) / (2917 * (bf_obj + 450))
                    )) / 17
                    fase['medida_cintura_cadera'] = {
                        'cintura': round(circ_cad_f * 0.7, 1),
                        'cadera': round(circ_cad_f, 1),
                    }
            except Exception:
                pass

            if fase['tipo'] == 'definicion':
                tiempo = abs(fase['cambio_peso']) / (peso_actual * 0.01 * 4.33)
            else:
                tiempo = abs(fase['cambio_musculo']) / ganancia_musculo_mes if ganancia_musculo_mes else 0
            fase['tiempo_meses'] = round(tiempo, 1)

            fases.append(fase)

        return success_response({
            'datos_actuales': {
                'peso': round(peso_actual, 1),
                'bf': round(bf_actual, 1),
                'ffmi': round(ffmi_actual, 1),
                'peso_magro': round(peso_magro, 1),
                'peso_graso': round(peso_graso, 1),
                'circ_abdomen': round(circ_abd, 1) if circ_abd else None,
                'circ_cintura': round(circ_cin, 1) if circ_cin else None,
                'circ_cadera': round(circ_cad, 1) if circ_cad else None,
            },
            'objetivos_geneticos': {
                'ffmi_limite': ffmi_limite,
                'bf_esencial': bf_esencial,
                'peso_objetivo': round(peso_obj, 1),
                'peso_magro_objetivo': round(peso_magro_obj, 1),
                'peso_graso_objetivo': round(peso_graso_obj, 1),
                'circ_abdomen_objetivo': round(circ_abd_obj, 1) if sexo == 'M' else None,
                'circ_cintura_objetivo': round(circ_cin_obj, 1) if sexo == 'F' else None,
                'circ_cadera_objetivo': round(circ_cad_obj, 1) if sexo == 'F' else None,
            },
            'cambios_necesarios': {
                'peso': round(cambio_peso, 1),
                'peso_magro': round(cambio_magro, 1),
                'peso_graso': round(cambio_graso, 1),
                'abdomen': round(circ_abd_obj - circ_abd, 1) if sexo == 'M' and circ_abd else 0,
                'cintura': round(circ_cin_obj - circ_cin, 1) if sexo == 'F' and circ_cin else 0,
                'cadera': round(circ_cad_obj - circ_cad, 1) if sexo == 'F' and circ_cad else 0,
            },
            'tiempo_estimado': {
                'meses': round(tiempo_meses, 1),
                'años': round(tiempo_meses / 12, 1),
            },
            'objetivos_parciales': fases,
            'metadata': {
                'sexo': sexo,
                'edad': edad,
                'altura': altura,
                'fecha_ultimo_registro': med['fecha'],
            },
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return error_response(
            f'Error calculando roadmap: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500
        )
