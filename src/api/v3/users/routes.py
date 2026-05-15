"""
USERS Routes - Endpoints de usuarios y perfiles
"""

from flask import request
from . import users_bp
from ..common.responses import success_response, error_response, paginated_response, ErrorCodes
from ..common.auth import require_auth, require_admin, require_owner_or_admin, get_current_user, is_assigned_professional, check_patient_access
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
            query += " AND (nombre LIKE ? OR email LIKE ?)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param])
        
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
    Obtiene un usuario por ID (auth user_id numérico o nombre_apellido).

    Si el auth user existe pero no tiene fila en clinical.db.patients, se
    aprovisiona vía resolve_patient_id(auto_create=True). Esto cubre cuentas
    registradas por el flow v3 a las que algún profesional ya vinculó.
    """
    pat = resolve_patient_id(user_id, auto_create=str(user_id).isdigit())

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        user = None
        if pat:
            cursor.execute("SELECT * FROM patients WHERE id = ?", [pat['patient_id']])
            user = cursor.fetchone()

        if not user:
            try:
                conn.close()
            except Exception:
                pass
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
            ORDER BY fecha DESC , id DESC LIMIT 1
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
    Crea un nuevo perfil clínico vinculado a un auth user existente.

    Request Body:
        {
            "auth_user_id": 42,            // requerido
            "nombre_apellido": "Apellido, Nombre",
            "email": "user@example.com",
            "sexo": "M" | "F",
            "altura": 175,
            "telefono": "123456789",
            "fecha_nacimiento": "1990-01-01"
        }
    """
    data = request.get_json() or {}

    required_fields = ['auth_user_id', 'nombre_apellido', 'email', 'sexo', 'altura']
    missing = [f for f in required_fields if not data.get(f)]

    if missing:
        return error_response(
            f'Campos requeridos faltantes: {", ".join(missing)}',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )

    try:
        auth_uid = int(data['auth_user_id'])
    except (TypeError, ValueError):
        return error_response(
            'auth_user_id debe ser numérico',
            code=ErrorCodes.VALIDATION_ERROR, status_code=400,
        )

    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM patients WHERE auth_user_id = ?", [auth_uid])
        if cursor.fetchone():
            conn.close()
            return error_response(
                'Ya existe un paciente vinculado a ese auth_user_id',
                code=ErrorCodes.CONFLICT,
                status_code=409
            )

        cursor.execute("""
            INSERT INTO patients
            (auth_user_id, nombre, email, sexo, altura, telefono, fecha_nacimiento)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [
            auth_uid,
            data['nombre_apellido'],
            data['email'],
            data['sexo'],
            data['altura'],
            data.get('telefono'),
            data.get('fecha_nacimiento')
        ])

        new_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return success_response(
            {'patient_id': new_id, 'auth_user_id': auth_uid,
             'nombre_apellido': data['nombre_apellido']},
            message='Usuario creado exitosamente'
        )

    except Exception as e:
        return error_response(
            f'Error creando usuario: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@users_bp.route('/<user_id>', methods=['PUT'])
@require_auth
def update_user(user_id):
    """
    Update the static profile (perfil estático).

    Allowed for: the patient themselves, the patient's assigned specialist
    (any role), or admin. Constitutional fields the patient is allowed to
    self-edit: altura, envergadura, circ_cuello, circ_muneca, circ_tobillo,
    telefono, sexo, fecha_nacimiento. Everything else here is shared with the
    professional.
    """
    user = get_current_user()
    if not check_patient_access(user, user_id):
        return error_response(
            'No tenés permisos sobre este paciente',
            code=ErrorCodes.FORBIDDEN, status_code=403,
        )

    pat = resolve_patient_id(user_id, auto_create=str(user_id).isdigit())

    data = request.get_json() or {}

    if not data:
        return error_response(
            'No hay datos para actualizar',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400,
        )

    if not pat:
        return error_response(
            'Usuario no encontrado',
            code=ErrorCodes.NOT_FOUND,
            status_code=404,
        )
    patient_id = pat['patient_id']

    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()

        # All clinical.db `patients` columns the static profile knows about.
        field_map = {
            'nombre_apellido': 'nombre',
            'nombre': 'nombre',
            'email': 'email',
            'telefono': 'telefono',
            'sexo': 'sexo',
            'fecha_nacimiento': 'fecha_nacimiento',
            'altura': 'altura',
            'circ_cuello': 'circ_cuello',
            'circ_muneca': 'circ_muneca',
            'circ_tobillo': 'circ_tobillo',
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
                status_code=400,
            )

        updates.append("updated_at = CURRENT_TIMESTAMP")
        values.append(patient_id)
        cursor.execute(f"UPDATE patients SET {', '.join(updates)} WHERE id = ?", values)

        conn.commit()
        conn.close()

        return success_response(
            {'patient_id': patient_id, 'updated_fields': list(data.keys())},
            message='Perfil actualizado.',
        )

    except Exception as e:
        return error_response(
            f'Error actualizando usuario: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500,
        )


@users_bp.route('/<user_id>', methods=['DELETE'])
@require_admin
def delete_user(user_id):
    """
    Elimina un usuario (solo admin).
    """
    pat = resolve_patient_id(user_id)

    if not pat:
        return error_response(
            'Usuario no encontrado',
            code=ErrorCodes.NOT_FOUND,
            status_code=404
        )
    patient_id = pat['patient_id']

    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()

        # Eliminar datos relacionados (CASCADE should handle this, but explicit is safer)
        cursor.execute("DELETE FROM measurements WHERE patient_id = ?", [patient_id])
        cursor.execute("DELETE FROM goals WHERE patient_id = ?", [patient_id])
        cursor.execute("DELETE FROM nutrition_plans WHERE patient_id = ?", [patient_id])
        cursor.execute("DELETE FROM patients WHERE id = ?", [patient_id])

        conn.commit()
        conn.close()

        return success_response(
            {'patient_id': patient_id, 'deleted': True},
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
    pat = resolve_patient_id(user_id, auto_create=str(user_id).isdigit())

    limit = min(request.args.get('limit', 50, type=int), 500)

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        if pat:
            cursor.execute("SELECT id, nombre FROM patients WHERE id = ?", [pat['patient_id']])
            user = cursor.fetchone()
        else:
            user = None
        
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
    pat = resolve_patient_id(user_id, auto_create=str(user_id).isdigit())

    data = request.get_json() or {}

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        if pat:
            cursor.execute("""
                SELECT id, nombre, sexo, altura, circ_cuello, circ_muneca, circ_tobillo
                FROM patients WHERE id = ?
            """, [pat['patient_id']])
            user = cursor.fetchone()
        else:
            user = None

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


@users_bp.route('/<user_id>/measurements/<int:measurement_id>', methods=['PUT'])
@require_auth
def update_measurement(user_id, measurement_id):
    """
    Edit an already-saved measurement.

    Permissions: assigned specialist (any role) or admin. The patient
    themselves CANNOT edit their own measurements — they can only register
    new ones via POST. The reasoning is dynamic anthropometrics (peso,
    cintura, abdomen, cadera, …) should only be corrected by the professional
    who supervises the case.

    Body — any subset of: peso, circ_abdomen, circ_cintura, circ_cadera,
    fecha. Calculated columns (bf_percent, imc, ffmi, peso_magro, peso_graso)
    are recomputed from the new dynamic + the patient's static profile.
    """
    user = get_current_user()
    if not check_patient_access(user, user_id):
        return error_response('No tenés permisos sobre este paciente',
                              code=ErrorCodes.FORBIDDEN, status_code=403)

    # Block the patient themselves: only specialist or admin can edit.
    target_pat = resolve_patient_id(user_id)
    target_name = (target_pat or {}).get('nombre') or ''
    target_auth_uid = None
    if target_pat:
        try:
            conn_id = get_clinical_connection(sqlite3.Row)
            cur_id = conn_id.cursor()
            cur_id.execute("SELECT auth_user_id FROM patients WHERE id = ?", [target_pat['patient_id']])
            r_id = cur_id.fetchone()
            conn_id.close()
            target_auth_uid = r_id[0] if r_id else None
        except Exception:
            target_auth_uid = None
    is_self = (
        (target_auth_uid is not None and str(user.get('user_id') or '') == str(target_auth_uid))
        or (target_name and str(user.get('nombre_apellido') or '') == str(target_name))
    )
    if is_self and not user.get('is_admin'):
        return error_response(
            'Solo el profesional asignado o un administrador pueden editar mediciones ya cargadas.',
            code=ErrorCodes.FORBIDDEN, status_code=403,
        )

    data = request.get_json() or {}
    if not data:
        return error_response('Nada que actualizar', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, patient_id FROM measurements WHERE id = ?", [measurement_id])
        row = cursor.fetchone()
        if not row:
            conn.close()
            return error_response('Medición no encontrada', code=ErrorCodes.NOT_FOUND, status_code=404)

        editable = {
            'peso': 'peso',
            'circ_abdomen': 'circ_abdomen',
            'circ_cintura': 'circ_cintura',
            'circ_cadera': 'circ_cadera',
            'fecha': 'fecha',
        }
        updates = []
        values = []
        for key, col in editable.items():
            if key in data:
                updates.append(f"{col} = ?")
                values.append(data[key])
        if not updates:
            conn.close()
            return error_response('No hay campos válidos para actualizar',
                                  code=ErrorCodes.VALIDATION_ERROR, status_code=400)

        # Recompute derived columns if any anthropometric changed.
        cursor.execute(
            "SELECT m.peso, m.circ_abdomen, m.circ_cintura, m.circ_cadera, p.altura, p.circ_cuello, p.sexo "
            "FROM measurements m JOIN patients p ON p.id = m.patient_id WHERE m.id = ?",
            [measurement_id],
        )
        cur_row = cursor.fetchone()
        peso     = data.get('peso',         cur_row[0])
        c_abd    = data.get('circ_abdomen', cur_row[1])
        c_cint   = data.get('circ_cintura', cur_row[2])
        c_cad    = data.get('circ_cadera',  cur_row[3])
        altura   = cur_row[4]
        c_cuello = cur_row[5]
        sexo     = cur_row[6]

        if peso and altura and c_cuello and sexo and (c_abd or (c_cint and c_cad)):
            import math
            try:
                if sexo == 'M':
                    bf = 86.010 * math.log10((c_abd or 0) - c_cuello) - 70.041 * math.log10(altura) + 36.76
                else:
                    bf = 163.205 * math.log10((c_cint or 0) + (c_cad or 0) - c_cuello) - 97.684 * math.log10(altura) - 78.387
                bf = max(2.0, min(60.0, bf))
                imc = peso / ((altura / 100) ** 2)
                peso_graso = peso * bf / 100
                peso_magro = peso - peso_graso
                ffmi = peso_magro / ((altura / 100) ** 2) + 6.1 * (1.8 - altura / 100)
                for col, val in [('bf_percent', round(bf, 2)), ('imc', round(imc, 2)),
                                 ('peso_magro', round(peso_magro, 2)), ('peso_graso', round(peso_graso, 2)),
                                 ('ffmi', round(ffmi, 2))]:
                    updates.append(f"{col} = ?")
                    values.append(val)
            except Exception:
                pass  # leave derived columns untouched

        values.append(measurement_id)
        cursor.execute(f"UPDATE measurements SET {', '.join(updates)} WHERE id = ?", values)
        conn.commit()
        cursor.execute("SELECT * FROM measurements WHERE id = ?", [measurement_id])
        cursor.row_factory = None
        col_names = [d[0] for d in cursor.description]
        cursor.execute("SELECT * FROM measurements WHERE id = ?", [measurement_id])
        record = dict(zip(col_names, cursor.fetchone()))
        conn.close()
        return success_response(record, message='Medición actualizada.')

    except Exception as e:
        return error_response(f'Error actualizando medición: {e}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


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
# OBJETIVOS — lifecycle propose → accept/reject → complete/archive (Fix 13)
# ============================================
#
# Estados (`status`):
#   proposed   — cargado por el profesional, esperando que el paciente acepte
#   accepted   — aceptado (activo). Solo uno por paciente a la vez.
#   rejected   — el paciente lo rechazó (terminal)
#   completed  — alcanzado (terminal). Marca completed_at.
#   archived   — reemplazado por uno nuevo (terminal). Marca archived_at.
#
# Origen (`source`):
#   manual         — escrito a mano por el profesional
#   auto-accepted  — propuesta del sistema aceptada sin cambios
#   auto-modified  — propuesta del sistema editada antes de guardar
# ============================================

# Campos REST → columnas clinical.db.goals
_GOAL_FIELD_MAP = {
    'peso_objetivo': 'goal_peso',
    'bf_objetivo': 'goal_bf',
    'ffmi_objetivo': 'goal_ffmi',
    'circ_abdomen_objetivo': 'goal_abdomen',
    'circ_cintura_objetivo': 'goal_cintura',
    'circ_cadera_objetivo': 'goal_cadera',
    'circ_hombro_objetivo': 'goal_hombro',
    'circ_pecho_objetivo': 'goal_pecho',
    'circ_brazo_objetivo': 'goal_brazo',
    'circ_antebrazo_objetivo': 'goal_antebrazo',
    'circ_muslo_objetivo': 'goal_muslo',
    'circ_pantorrilla_objetivo': 'goal_pantorrilla',
    'tiempo_estimado_meses': 'tiempo_estimado_meses',
    'fecha_objetivo': 'fecha_objetivo',
    'notas': 'notas',
    'source_roadmap_id': 'source_roadmap_id',
    'source_phase_index': 'source_phase_index',
}

_GOAL_VALID_STATUS = {'proposed', 'accepted', 'rejected', 'completed', 'archived'}
_GOAL_VALID_SOURCE = {'manual', 'auto-accepted', 'auto-modified'}


def _resolve_patient_for_goals(user_id):
    """Resuelve el paciente con auto_create=True (OMV-89). Devuelve (patient_dict, error_response|None)."""
    patient = resolve_patient_id(user_id, auto_create=True)
    if not patient:
        return None, error_response(
            'Usuario no encontrado',
            code=ErrorCodes.NOT_FOUND,
            status_code=404,
        )
    return patient, None


def _patient_auth_user_id(patient_id):
    """Devuelve el auth.db user_id vinculado a este patient_id, o None."""
    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT auth_user_id FROM patients WHERE id = ?", [int(patient_id)])
        row = cursor.fetchone()
        conn.close()
        return row[0] if row else None
    except Exception:
        return None


def _archive_active_goals(cursor, patient_id, exclude_id=None):
    """
    Marca como archivados los goals activos (status proposed o accepted) del paciente.
    Usado por POST /goals para no perder histórico al crear uno nuevo (OMV-39).
    """
    sql = (
        "UPDATE goals SET status='archived', activo=0, "
        "archived_at=datetime('now','localtime'), updated_at=datetime('now','localtime') "
        "WHERE patient_id = ? AND status IN ('proposed','accepted')"
    )
    params = [patient_id]
    if exclude_id is not None:
        sql += " AND id != ?"
        params.append(exclude_id)
    cursor.execute(sql, params)
    return cursor.rowcount


def _compute_fecha_objetivo(tiempo_meses, base_fecha=None):
    """Devuelve fecha_objetivo (YYYY-MM-DD) sumando `tiempo_meses` a base_fecha (default: hoy)."""
    if tiempo_meses is None:
        return None
    try:
        meses = float(tiempo_meses)
    except (TypeError, ValueError):
        return None
    if meses <= 0:
        return None
    base = base_fecha or datetime.now()
    delta = timedelta(days=meses * 30.44)
    return (base + delta).date().isoformat()


def _serialize_goal(goal_row):
    """Convierte una fila sqlite de goals a dict serializable."""
    if goal_row is None:
        return None
    return dict(goal_row)


@users_bp.route('/<user_id>/goals', methods=['GET'])
@require_owner_or_admin
def get_goals(user_id):
    """
    Obtiene el objetivo activo del usuario.

    Query params:
        status: filtra por status (default: 'accepted'). Use 'proposed' para ver
                propuestas del profesional pendientes de aceptación.
        include_pending: si '1' o 'true', incluye también el goal 'proposed' además del 'accepted'.
    """
    patient, err = _resolve_patient_for_goals(user_id)
    if err:
        return err

    status_filter = request.args.get('status', 'accepted').strip().lower()
    include_pending = request.args.get('include_pending', '').lower() in ('1', 'true', 'yes')

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM goals WHERE patient_id = ? AND status = ? "
            "ORDER BY created_at DESC LIMIT 1",
            [patient['patient_id'], status_filter],
        )
        active = _serialize_goal(cursor.fetchone())

        pending = None
        if include_pending and status_filter != 'proposed':
            cursor.execute(
                "SELECT * FROM goals WHERE patient_id = ? AND status = 'proposed' "
                "ORDER BY created_at DESC LIMIT 1",
                [patient['patient_id']],
            )
            pending = _serialize_goal(cursor.fetchone())

        conn.close()

        payload = {
            'user_id': user_id,
            'patient_id': patient['patient_id'],
            'goal': active,
        }
        if include_pending:
            payload['proposed'] = pending
        return success_response(payload)

    except Exception as e:
        return error_response(
            f'Error obteniendo objetivos: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500,
        )


@users_bp.route('/<user_id>/goals', methods=['POST'])
@require_owner_or_admin
def create_goal(user_id):
    """
    Crea un objetivo nuevo (siempre INSERT — OMV-39 sin pisar histórico).

    Lifecycle:
      - Si quien postea es el paciente mismo → status default = 'accepted'
      - Si quien postea es admin/profesional asignado → status default = 'proposed'
      - El body puede sobreescribir con `status` explícito ('proposed'|'accepted').

    Request Body (todos opcionales salvo notar):
        peso_objetivo, bf_objetivo, ffmi_objetivo,
        circ_{abdomen|cintura|cadera|hombro|pecho|brazo|antebrazo|muslo|pantorrilla}_objetivo,
        tiempo_estimado_meses, fecha_objetivo, notas,
        status ('proposed'|'accepted'),
        source ('manual'|'auto-accepted'|'auto-modified'),
        source_roadmap_id, source_phase_index
    """
    patient, err = _resolve_patient_for_goals(user_id)
    if err:
        return err

    data = request.get_json(silent=True) or {}
    current = get_current_user() or {}
    poster_user_id = current.get('user_id')

    # Determinar status default según quien postea
    patient_auth_uid = _patient_auth_user_id(patient['patient_id'])
    poster_is_patient = (
        poster_user_id is not None
        and patient_auth_uid is not None
        and str(poster_user_id) == str(patient_auth_uid)
    )
    default_status = 'accepted' if poster_is_patient else 'proposed'
    status = (data.get('status') or default_status).strip().lower()
    if status not in {'proposed', 'accepted'}:
        return error_response(
            f"status debe ser 'proposed' o 'accepted' al crear (got: {status})",
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400,
        )

    source = (data.get('source') or data.get('tipo') or 'manual').strip().lower()
    # Mapeo legacy: tipo='auto' (sin más detalle) → 'auto-accepted'
    if source == 'auto':
        source = 'auto-accepted'
    if source not in _GOAL_VALID_SOURCE:
        return error_response(
            f"source inválido: {source}. Permitidos: {sorted(_GOAL_VALID_SOURCE)}",
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400,
        )

    # Derivar fecha_objetivo si no vino y sí vino tiempo_estimado_meses
    tiempo_meses = data.get('tiempo_estimado_meses')
    fecha_objetivo = data.get('fecha_objetivo') or _compute_fecha_objetivo(tiempo_meses)

    # Construir map de columnas a insertar
    cols = {
        'patient_id': patient['patient_id'],
        'status': status,
        'source': source,
        'tipo': 'auto' if source.startswith('auto') else 'manual',  # legacy mirror
        'activo': 1 if status == 'accepted' else 0,
        'created_by_user_id': poster_user_id,
        'fecha_objetivo': fecha_objetivo,
    }
    if status == 'accepted':
        cols['accepted_by_user_id'] = poster_user_id

    for body_key, db_col in _GOAL_FIELD_MAP.items():
        if body_key in data:
            cols[db_col] = data[body_key]
    # tiempo_estimado_meses ya viene en el map; reasignar para asegurar
    if tiempo_meses is not None:
        cols['tiempo_estimado_meses'] = tiempo_meses

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        # Encontrar previous active para encadenar
        cursor.execute(
            "SELECT id FROM goals WHERE patient_id = ? AND status IN ('proposed','accepted') "
            "ORDER BY created_at DESC LIMIT 1",
            [patient['patient_id']],
        )
        prev = cursor.fetchone()
        if prev:
            cols['previous_goal_id'] = prev['id']

        # Si el nuevo es 'accepted' → archivar prior activos (OMV-39)
        if status == 'accepted':
            _archive_active_goals(cursor, patient['patient_id'])

        # Si el nuevo es 'proposed' → archivar otra propuesta abierta del mismo paciente
        # (no archiva el accepted vigente; puede convivir hasta que el paciente decida)
        elif status == 'proposed':
            cursor.execute(
                "UPDATE goals SET status='archived', activo=0, "
                "archived_at=datetime('now','localtime'), updated_at=datetime('now','localtime') "
                "WHERE patient_id = ? AND status = 'proposed'",
                [patient['patient_id']],
            )

        col_names = list(cols.keys())
        placeholders = ', '.join('?' * len(col_names))
        sql = f"INSERT INTO goals ({', '.join(col_names)}) VALUES ({placeholders})"
        cursor.execute(sql, [cols[c] for c in col_names])
        new_id = cursor.lastrowid

        cursor.execute("SELECT * FROM goals WHERE id = ?", [new_id])
        new_goal = _serialize_goal(cursor.fetchone())

        conn.commit()
        conn.close()

        return success_response(
            {
                'user_id': user_id,
                'patient_id': patient['patient_id'],
                'goal': new_goal,
                'action': 'created',
                'status': status,
            },
            message=f"Objetivo creado con status='{status}'",
            status_code=201,
        )

    except Exception as e:
        return error_response(
            f'Error guardando objetivo: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500,
        )


# ============================================
# Lifecycle: accept / reject / complete (OMV-35, OMV-40)
# ============================================

def _load_goal_for_user(cursor, patient_id, goal_id):
    cursor.execute(
        "SELECT * FROM goals WHERE id = ? AND patient_id = ?",
        [goal_id, patient_id],
    )
    return cursor.fetchone()


@users_bp.route('/<user_id>/goals/<int:goal_id>/accept', methods=['POST'])
@require_owner_or_admin
def accept_goal(user_id, goal_id):
    """
    El paciente (o admin) acepta una propuesta. status: 'proposed' → 'accepted'.
    Archiva cualquier otro 'accepted' activo.
    """
    patient, err = _resolve_patient_for_goals(user_id)
    if err:
        return err

    current = get_current_user() or {}
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        goal = _load_goal_for_user(cursor, patient['patient_id'], goal_id)
        if not goal:
            conn.close()
            return error_response('Goal no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        if goal['status'] != 'proposed':
            conn.close()
            return error_response(
                f"Solo se puede aceptar un goal con status='proposed' (este tiene '{goal['status']}')",
                code=ErrorCodes.CONFLICT,
                status_code=409,
            )

        # Archivar otros activos
        _archive_active_goals(cursor, patient['patient_id'], exclude_id=goal_id)

        cursor.execute(
            "UPDATE goals SET status='accepted', activo=1, "
            "accepted_by_user_id=?, updated_at=datetime('now','localtime') "
            "WHERE id = ?",
            [current.get('user_id'), goal_id],
        )

        cursor.execute("SELECT * FROM goals WHERE id = ?", [goal_id])
        updated = _serialize_goal(cursor.fetchone())

        conn.commit()
        conn.close()

        return success_response(
            {'user_id': user_id, 'goal': updated, 'action': 'accepted'},
            message='Objetivo aceptado',
        )

    except Exception as e:
        return error_response(
            f'Error aceptando objetivo: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500,
        )


@users_bp.route('/<user_id>/goals/<int:goal_id>/reject', methods=['POST'])
@require_owner_or_admin
def reject_goal(user_id, goal_id):
    """
    El paciente rechaza una propuesta. status: 'proposed' → 'rejected'.
    Acepta `notas` en el body para registrar motivo.
    """
    patient, err = _resolve_patient_for_goals(user_id)
    if err:
        return err

    data = request.get_json(silent=True) or {}
    notas = data.get('notas')

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        goal = _load_goal_for_user(cursor, patient['patient_id'], goal_id)
        if not goal:
            conn.close()
            return error_response('Goal no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        if goal['status'] != 'proposed':
            conn.close()
            return error_response(
                f"Solo se puede rechazar un goal con status='proposed' (este tiene '{goal['status']}')",
                code=ErrorCodes.CONFLICT,
                status_code=409,
            )

        if notas:
            cursor.execute(
                "UPDATE goals SET status='rejected', activo=0, notas=?, "
                "updated_at=datetime('now','localtime') WHERE id = ?",
                [notas, goal_id],
            )
        else:
            cursor.execute(
                "UPDATE goals SET status='rejected', activo=0, "
                "updated_at=datetime('now','localtime') WHERE id = ?",
                [goal_id],
            )

        cursor.execute("SELECT * FROM goals WHERE id = ?", [goal_id])
        updated = _serialize_goal(cursor.fetchone())

        conn.commit()
        conn.close()

        return success_response(
            {'user_id': user_id, 'goal': updated, 'action': 'rejected'},
            message='Objetivo rechazado',
        )

    except Exception as e:
        return error_response(
            f'Error rechazando objetivo: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500,
        )


@users_bp.route('/<user_id>/goals/<int:goal_id>/complete', methods=['POST'])
@require_owner_or_admin
def complete_goal(user_id, goal_id):
    """
    Marca un goal como cumplido y devuelve la siguiente fase del roadmap como propuesta candidata.
    status: 'accepted' → 'completed'.
    """
    patient, err = _resolve_patient_for_goals(user_id)
    if err:
        return err

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        goal = _load_goal_for_user(cursor, patient['patient_id'], goal_id)
        if not goal:
            conn.close()
            return error_response('Goal no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        if goal['status'] != 'accepted':
            conn.close()
            return error_response(
                f"Solo se puede completar un goal con status='accepted' (este tiene '{goal['status']}')",
                code=ErrorCodes.CONFLICT,
                status_code=409,
            )

        cursor.execute(
            "UPDATE goals SET status='completed', activo=0, "
            "completed_at=datetime('now','localtime'), updated_at=datetime('now','localtime') "
            "WHERE id = ?",
            [goal_id],
        )
        cursor.execute("SELECT * FROM goals WHERE id = ?", [goal_id])
        completed = _serialize_goal(cursor.fetchone())
        conn.commit()
        conn.close()

    except Exception as e:
        return error_response(
            f'Error completando objetivo: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500,
        )

    # Calcular siguiente fase del roadmap como sugerencia (no se persiste)
    next_proposal = _next_phase_proposal(patient)

    return success_response(
        {
            'user_id': user_id,
            'goal': completed,
            'action': 'completed',
            'next_proposal': next_proposal,
        },
        message='Objetivo completado',
    )


@users_bp.route('/<user_id>/goals/history', methods=['GET'])
@require_owner_or_admin
def get_goals_history(user_id):
    """
    Lista todos los goals del usuario, más reciente primero (OMV-39).
    Query params: status (filtro opcional), limit (default 50).
    """
    patient, err = _resolve_patient_for_goals(user_id)
    if err:
        return err

    status_filter = request.args.get('status')
    try:
        limit = max(1, min(int(request.args.get('limit', 50)), 200))
    except (TypeError, ValueError):
        limit = 50

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        if status_filter:
            cursor.execute(
                "SELECT * FROM goals WHERE patient_id = ? AND status = ? "
                "ORDER BY created_at DESC LIMIT ?",
                [patient['patient_id'], status_filter, limit],
            )
        else:
            cursor.execute(
                "SELECT * FROM goals WHERE patient_id = ? "
                "ORDER BY created_at DESC LIMIT ?",
                [patient['patient_id'], limit],
            )
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()

        return success_response({
            'user_id': user_id,
            'patient_id': patient['patient_id'],
            'count': len(rows),
            'goals': rows,
        })

    except Exception as e:
        return error_response(
            f'Error obteniendo histórico: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500,
        )


@users_bp.route('/<user_id>/goals/auto', methods=['GET'])
@require_owner_or_admin
def get_auto_goals(user_id):
    """
    [DEPRECATED — Fix 13 / OMV-43]
    Calcula objetivos automáticos basados en límites genéticos (solo el destino final).

    Use en su lugar:
        GET /goals/auto-roadmap?include_phases=false   (mismo destino, mismo formato)
        GET /goals/auto-roadmap                         (con fases progresivas)
        GET /goals/next-step                            (siguiente fase como propuesta lista)

    Este endpoint sigue funcionando pero ya no se mantendrá. Se devuelve el header
    `Deprecation: true` y `Sunset` con la fecha de remoción tentativa.
    """
    patient = resolve_patient_id(user_id, auto_create=True)

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

        resp = success_response({
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
                'altura': altura,
                'deprecated': True,
                'use_instead': '/users/<id>/goals/auto-roadmap?include_phases=false',
            }
        })
        # Headers RFC 8594 / RFC 8631 (OMV-43)
        resp[0].headers['Deprecation'] = 'true'
        resp[0].headers['Sunset'] = 'Wed, 31 Dec 2026 23:59:59 GMT'
        resp[0].headers['Link'] = '</api/v3/users/' + str(user_id) + '/goals/auto-roadmap?include_phases=false>; rel="successor-version"'
        return resp

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


# ============================================
# Helpers de roadmap (Fix 13)
# ============================================

def _check_roadmap_permission(user, user_id, patient):
    """Devuelve error_response o None. owner / admin / profesional asignado."""
    patient_auth_uid = _patient_auth_user_id(patient.get('patient_id'))
    is_owner = (
        patient['nombre'] == user.get('nombre_apellido')
        or (patient_auth_uid is not None and str(patient_auth_uid) == str(user.get('user_id') or ''))
        or str(user_id) == str(user.get('user_id', ''))
    )
    if not is_owner and not user.get('is_admin') and not is_assigned_professional(user.get('user_id'), patient.get('nombre', '')):
        return error_response(
            'No tienes permisos para ver datos de este paciente',
            code=ErrorCodes.FORBIDDEN, status_code=403,
        )
    return None


def _load_roadmap_inputs(patient_id):
    """
    Carga (patient_row, latest_measurement_row) desde clinical.db.
    Devuelve (None, None) si falta cualquiera de los dos.
    """
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT nombre, sexo, altura, fecha_nacimiento, circ_cuello FROM patients WHERE id = ?",
            [patient_id],
        )
        pat = cursor.fetchone()
        if not pat:
            conn.close()
            return None, None
        cursor.execute(
            "SELECT peso, bf_percent, ffmi, peso_graso, peso_magro, "
            "circ_abdomen, circ_cintura, circ_cadera, fecha "
            "FROM measurements WHERE patient_id = ? "
            "ORDER BY fecha DESC LIMIT 1",
            [patient_id],
        )
        med = cursor.fetchone()
        conn.close()
        return pat, med
    except Exception:
        return None, None


def _compute_full_roadmap(pat, med):
    """
    Cálculo puro del roadmap (sin permisos ni I/O extra). Devuelve dict completo:
    {datos_actuales, objetivos_geneticos, cambios_necesarios, tiempo_estimado,
     objetivos_parciales, metadata}.
    Asume `pat` y `med` ya validados.
    """
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

    peso_actual = float(med['peso'])
    bf_actual = float(med['bf_percent'] or 20)
    ffmi_actual = float(med['ffmi'] or 0)
    peso_graso = float(med['peso_graso'] or peso_actual * bf_actual / 100)
    peso_magro = float(med['peso_magro'] or peso_actual - peso_graso)
    circ_abd = float(med['circ_abdomen'] or 0)
    circ_cin = float(med['circ_cintura'] or 0)
    circ_cad = float(med['circ_cadera'] or 0)

    altura_m = altura / 100
    if sexo == 'M':
        ffmi_limite, bf_esencial, ganancia_musculo_mes = 23.7, 6.0, 0.375
    else:
        ffmi_limite, bf_esencial, ganancia_musculo_mes = 18.9, 14.0, 0.188

    peso_magro_obj = ffmi_limite * (altura_m ** 2)
    peso_obj = peso_magro_obj / (1 - bf_esencial / 100)
    peso_graso_obj = peso_obj - peso_magro_obj

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

    cambio_peso = peso_obj - peso_actual
    cambio_magro = peso_magro_obj - peso_magro
    cambio_graso = peso_graso_obj - peso_graso

    meses_musculo = abs(cambio_magro) / ganancia_musculo_mes if cambio_magro > 0 else 0
    perdida_semanal = peso_actual * 0.0075
    semanas_grasa = abs(cambio_graso) / perdida_semanal if cambio_graso < 0 else 0
    tiempo_meses = max(meses_musculo, semanas_grasa / 4.33)

    fases_raw = _calcular_objetivos_parciales(
        peso_actual, bf_actual, peso_magro, peso_graso, altura, sexo,
    )

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

    return {
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
    }


def _load_cached_roadmap(patient_id):
    """Devuelve el roadmap activo persistido (dict) o None."""
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM roadmaps WHERE patient_id = ? AND activo = 1 "
            "ORDER BY created_at DESC LIMIT 1",
            [patient_id],
        )
        row = cursor.fetchone()
        conn.close()
        if not row:
            return None
        try:
            payload = json.loads(row['fases_json'])
        except Exception:
            return None
        payload.setdefault('metadata', {})
        payload['metadata']['roadmap_id'] = row['id']
        payload['metadata']['roadmap_created_at'] = row['created_at']
        payload['metadata']['source'] = 'cached'
        return payload
    except Exception:
        return None


def _save_roadmap(patient_id, roadmap_payload):
    """Persiste un roadmap en la tabla roadmaps. Desactiva el anterior. Devuelve nuevo id."""
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE roadmaps SET activo = 0 WHERE patient_id = ? AND activo = 1",
            [patient_id],
        )
        cursor.execute(
            "INSERT INTO roadmaps "
            "(patient_id, fases_json, total_meses, ffmi_limite, bf_esencial, "
            " sexo, altura, peso_inicial, bf_inicial, activo) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)",
            [
                patient_id,
                json.dumps(roadmap_payload, ensure_ascii=False),
                (roadmap_payload.get('tiempo_estimado') or {}).get('meses'),
                (roadmap_payload.get('objetivos_geneticos') or {}).get('ffmi_limite'),
                (roadmap_payload.get('objetivos_geneticos') or {}).get('bf_esencial'),
                (roadmap_payload.get('metadata') or {}).get('sexo'),
                (roadmap_payload.get('metadata') or {}).get('altura'),
                (roadmap_payload.get('datos_actuales') or {}).get('peso'),
                (roadmap_payload.get('datos_actuales') or {}).get('bf'),
            ],
        )
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return new_id
    except Exception:
        return None


def _phase_to_goal_proposal(fase, source_roadmap_id=None, source_phase_index=None):
    """Convierte una fase del roadmap en un objeto goal listo para POST /goals."""
    if not fase:
        return None
    proposal = {
        'peso_objetivo': fase.get('peso_objetivo'),
        'bf_objetivo': fase.get('bf_objetivo'),
        'ffmi_objetivo': fase.get('ffmi_objetivo'),
        'tiempo_estimado_meses': fase.get('tiempo_meses'),
        'fecha_objetivo': _compute_fecha_objetivo(fase.get('tiempo_meses')),
        'descripcion': fase.get('descripcion'),
        'fase': fase.get('fase'),
        'categoria': fase.get('categoria'),
        'tipo_fase': fase.get('tipo'),
        'source': 'auto-accepted',
    }
    if 'medida_abdomen' in fase:
        proposal['circ_abdomen_objetivo'] = fase['medida_abdomen']
    if 'medida_cintura_cadera' in fase:
        m = fase['medida_cintura_cadera']
        proposal['circ_cintura_objetivo'] = m.get('cintura')
        proposal['circ_cadera_objetivo'] = m.get('cadera')
    if source_roadmap_id is not None:
        proposal['source_roadmap_id'] = source_roadmap_id
    if source_phase_index is not None:
        proposal['source_phase_index'] = source_phase_index
    return proposal


def _next_phase_proposal(patient):
    """
    Devuelve la próxima fase del roadmap (cached → primera; si todas las fases ya
    se cumplieron, None).
    """
    cached = _load_cached_roadmap(patient['patient_id'])
    if cached and cached.get('objetivos_parciales'):
        roadmap_id = cached.get('metadata', {}).get('roadmap_id')
        # Cuántos goals completed hay → asumir esa cantidad de fases ya cumplidas
        try:
            conn = get_clinical_connection(sqlite3.Row)
            cursor = conn.cursor()
            cursor.execute(
                "SELECT COUNT(*) FROM goals WHERE patient_id = ? AND status = 'completed' "
                "AND source_roadmap_id = ?",
                [patient['patient_id'], roadmap_id],
            )
            done = cursor.fetchone()[0] or 0
            conn.close()
        except Exception:
            done = 0
        fases = cached['objetivos_parciales']
        if done < len(fases):
            return _phase_to_goal_proposal(fases[done], roadmap_id, done)
        return None

    # Sin cache → calcular on-the-fly y devolver fases[0]
    pat, med = _load_roadmap_inputs(patient['patient_id'])
    if not pat or not med:
        return None
    payload = _compute_full_roadmap(pat, med)
    fases = payload.get('objetivos_parciales') or []
    if not fases:
        return None
    return _phase_to_goal_proposal(fases[0], None, 0)


@users_bp.route('/<user_id>/goals/auto-roadmap', methods=['GET'])
@require_auth
def get_auto_roadmap(user_id):
    """
    Devuelve el roadmap del paciente.

    Query params:
        recalculate=1        — fuerza recálculo desde la última medición (ignora cache)
        include_phases=false — omite `objetivos_parciales` (equivalente a /goals/auto)
        save=1               — además de devolver, persiste el cálculo (solo con recalculate=1)
    """
    user = get_current_user() or {}
    patient = resolve_patient_id(user_id, auto_create=True)
    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    perm_err = _check_roadmap_permission(user, user_id, patient)
    if perm_err:
        return perm_err

    recalculate = request.args.get('recalculate', '').lower() in ('1', 'true', 'yes')
    include_phases = request.args.get('include_phases', 'true').lower() not in ('0', 'false', 'no')
    save = request.args.get('save', '').lower() in ('1', 'true', 'yes')

    payload = None
    source = 'cached'
    if not recalculate:
        payload = _load_cached_roadmap(patient['patient_id'])

    if payload is None:
        pat, med = _load_roadmap_inputs(patient['patient_id'])
        if not pat:
            return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
        if not med:
            return error_response(
                'No hay mediciones para calcular roadmap',
                code=ErrorCodes.NOT_FOUND, status_code=404,
            )
        try:
            payload = _compute_full_roadmap(pat, med)
            source = 'computed'
        except Exception as e:
            import traceback
            traceback.print_exc()
            return error_response(
                f'Error calculando roadmap: {str(e)}',
                code=ErrorCodes.INTERNAL_ERROR, status_code=500,
            )

        if save and recalculate:
            new_id = _save_roadmap(patient['patient_id'], payload)
            if new_id:
                payload.setdefault('metadata', {})
                payload['metadata']['roadmap_id'] = new_id
                source = 'computed+saved'

    payload.setdefault('metadata', {})
    payload['metadata']['source'] = source

    if not include_phases:
        payload.pop('objetivos_parciales', None)

    return success_response(payload)


@users_bp.route('/<user_id>/goals/auto-roadmap/save', methods=['POST'])
@require_auth
def save_auto_roadmap(user_id):
    """
    Calcula el roadmap desde la medición más reciente y lo persiste como activo
    para este paciente (OMV-41). Desactiva el roadmap previo si existía.
    """
    user = get_current_user() or {}
    patient = resolve_patient_id(user_id, auto_create=True)
    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    perm_err = _check_roadmap_permission(user, user_id, patient)
    if perm_err:
        return perm_err

    pat, med = _load_roadmap_inputs(patient['patient_id'])
    if not pat:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
    if not med:
        return error_response(
            'No hay mediciones para calcular roadmap',
            code=ErrorCodes.NOT_FOUND, status_code=404,
        )

    try:
        payload = _compute_full_roadmap(pat, med)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return error_response(
            f'Error calculando roadmap: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500,
        )

    new_id = _save_roadmap(patient['patient_id'], payload)
    if not new_id:
        return error_response(
            'No se pudo persistir el roadmap',
            code=ErrorCodes.INTERNAL_ERROR, status_code=500,
        )

    payload.setdefault('metadata', {})
    payload['metadata']['roadmap_id'] = new_id
    payload['metadata']['source'] = 'computed+saved'

    return success_response(
        {
            'user_id': user_id,
            'patient_id': patient['patient_id'],
            'roadmap_id': new_id,
            'roadmap': payload,
        },
        message='Roadmap persistido correctamente',
        status_code=201,
    )


@users_bp.route('/<user_id>/goals/next-step', methods=['GET'])
@require_owner_or_admin
def get_next_step(user_id):
    """
    Devuelve la PRÓXIMA fase del roadmap como un objeto goal listo para usar
    como propuesta (precarga del form del profesional). Si hay roadmap persistido,
    cuenta cuántas fases ya están como goals 'completed' y avanza desde ahí.
    """
    patient, err = _resolve_patient_for_goals(user_id)
    if err:
        return err

    proposal = _next_phase_proposal(patient)
    if proposal is None:
        return success_response(
            {
                'user_id': user_id,
                'patient_id': patient['patient_id'],
                'next_step': None,
                'message': 'No hay próxima fase disponible (¿roadmap completado?)',
            },
        )

    return success_response({
        'user_id': user_id,
        'patient_id': patient['patient_id'],
        'next_step': proposal,
    })
