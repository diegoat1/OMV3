"""
TELEMEDICINE Routes - Appointments, Medical Records, Vitals, Documents
Migrated from legacy /api/telemed/* endpoints in main.py
"""

from flask import request
from . import telemedicine_bp
from ..common.responses import success_response, error_response, ErrorCodes
from ..common.auth import require_auth, require_admin, get_current_user
from ..common.database import get_telemed_connection, execute_telemed_query
import sqlite3
import json
from datetime import datetime


# ============================================
# HELPER FUNCTIONS (migrated from legacy)
# ============================================

def _to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None

def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

def _to_bool(value):
    if isinstance(value, bool):
        return 1 if value else 0
    if isinstance(value, str):
        return 1 if value.strip().lower() in ['true', '1', 'si', 'sí', 'on'] else 0
    if value in (0, 1):
        return value
    return 1 if value else 0

def _clean_text(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None

def _calculate_age(date_str):
    if not date_str:
        return None
    try:
        nacimiento = datetime.strptime(date_str, '%Y-%m-%d').date()
        hoy = datetime.now().date()
        return hoy.year - nacimiento.year - ((hoy.month, hoy.day) < (nacimiento.month, nacimiento.day))
    except ValueError:
        return None

def _serialize_tags(raw_value):
    if not raw_value:
        return []
    if isinstance(raw_value, list):
        return raw_value
    if isinstance(raw_value, str):
        try:
            parsed = json.loads(raw_value)
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            pass
        return [tag.strip() for tag in raw_value.split(',') if tag.strip()]
    return []

def _serialize_diagnosticos(raw_value):
    if not raw_value:
        return []
    def normalize_entry(entry):
        code = str(entry.get('code') or entry.get('c') or '').strip()
        name = str(entry.get('name') or entry.get('d') or '').strip()
        principal = bool(entry.get('principal') or entry.get('main'))
        if not code and not name:
            return None
        return {'code': code or 'SN/CIE10', 'name': name or code, 'principal': principal}
    if isinstance(raw_value, list):
        return [item for item in (normalize_entry(e) for e in raw_value) if item]
    if isinstance(raw_value, str):
        try:
            parsed = json.loads(raw_value)
            if isinstance(parsed, list):
                return [item for item in (normalize_entry(e) for e in parsed) if item]
        except json.JSONDecodeError:
            pass
    return []

def _limpiar_diagnosticos(payload):
    if not payload:
        return []
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            payload = _serialize_diagnosticos(payload)
    if not isinstance(payload, list):
        return []
    diagnosticos = []
    for entry in payload:
        if not isinstance(entry, dict):
            continue
        code = str(entry.get('code') or entry.get('c') or '').strip().upper()
        name = str(entry.get('name') or entry.get('d') or '').strip()
        principal = bool(entry.get('principal') or entry.get('main'))
        if not code and not name:
            continue
        diagnosticos.append({'code': code or 'SN/CIE10', 'name': name or code, 'principal': principal})
    if diagnosticos and not any(d.get('principal') for d in diagnosticos):
        diagnosticos[0]['principal'] = True
    return diagnosticos

def _serialize_patient(row):
    """Serialize a TELEMED_PACIENTES row to dict with proper types."""
    registro = dict(row)
    if not registro.get('paciente_nombre'):
        nombre = (registro.get('nombre') or '').strip()
        apellido = (registro.get('apellido') or '').strip()
        registro['paciente_nombre'] = ' '.join([p for p in [nombre, apellido] if p]).strip()
    registro['es_fumador'] = bool(registro.get('es_fumador'))
    registro['activo_sexualmente'] = bool(registro.get('activo_sexualmente'))
    registro['embarazo'] = bool(registro.get('embarazo'))
    registro['edad_calculada'] = _calculate_age(registro.get('fecha_nacimiento'))
    if registro['edad_calculada'] is None:
        registro['edad_calculada'] = registro.get('edad')
    return registro

def _serialize_situation(row):
    """Serialize a TELEMED_SITUACIONES row with tags and diagnosticos."""
    registro = dict(row)
    registro['etiquetas'] = _serialize_tags(registro.get('etiquetas'))
    registro['diagnostico_cie10'] = _serialize_diagnosticos(registro.get('diagnostico_cie10'))
    return registro

def _serialize_document(row):
    """Serialize a TELEMED_DOCUMENTOS row."""
    registro = dict(row)
    registro['etiquetas'] = _serialize_tags(registro.get('etiquetas'))
    if registro.get('tamano_archivo') is not None:
        try:
            registro['tamano_archivo'] = int(registro['tamano_archivo'])
        except (TypeError, ValueError):
            registro['tamano_archivo'] = None
    return registro


# ============================================
# APPOINTMENTS (CITAS_MEDICAS)
# ============================================

@telemedicine_bp.route('/appointments', methods=['GET'])
@require_auth
def get_appointments():
    """
    List appointments for the current user (doctor or patient).
    Query params: status, from_date, to_date, limit
    """
    user = get_current_user()
    status = request.args.get('status')
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')
    limit = request.args.get('limit', 50, type=int)

    query = "SELECT * FROM CITAS_MEDICAS WHERE user_id = ?"
    params = [user['nombre_apellido']]

    if status:
        query += " AND estado = ?"
        params.append(status)
    if from_date:
        query += " AND DATE(fecha_cita) >= ?"
        params.append(from_date)
    if to_date:
        query += " AND DATE(fecha_cita) <= ?"
        params.append(to_date)

    query += " ORDER BY fecha_cita DESC LIMIT ?"
    params.append(limit)

    try:
        rows = execute_telemed_query(query, params)
        return success_response({'appointments': rows or [], 'total': len(rows or [])})
    except Exception as e:
        return error_response(f'Error obteniendo citas: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@telemedicine_bp.route('/appointments', methods=['POST'])
@require_auth
def create_appointment():
    """Create a new appointment."""
    user = get_current_user()
    data = request.get_json() or {}

    required = ['fecha_cita', 'tipo_cita']
    for field in required:
        if field not in data:
            return error_response(f'Campo requerido: {field}', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    try:
        conn = get_telemed_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO CITAS_MEDICAS (
                user_id, fecha_cita, tipo_cita, especialidad, medico_nombre,
                medico_especialidad, institucion, direccion, telefono, modalidad,
                link_videollamada, motivo_consulta, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'programada')
        """, [
            user['nombre_apellido'],
            data['fecha_cita'], data['tipo_cita'],
            data.get('especialidad'), data.get('medico_nombre'),
            data.get('medico_especialidad'), data.get('institucion'),
            data.get('direccion'), data.get('telefono'),
            data.get('modalidad', 'presencial'), data.get('link_videollamada'),
            data.get('motivo_consulta'),
        ])
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return success_response({'id': new_id, 'message': 'Cita creada'}, status_code=201)
    except Exception as e:
        return error_response(f'Error creando cita: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@telemedicine_bp.route('/appointments/<int:appointment_id>', methods=['GET'])
@require_auth
def get_appointment(appointment_id):
    """Get a single appointment by ID."""
    user = get_current_user()
    try:
        row = execute_telemed_query(
            "SELECT * FROM CITAS_MEDICAS WHERE id = ? AND user_id = ?",
            [appointment_id, user['nombre_apellido']], fetch_one=True, fetch_all=False
        )
        if not row:
            return error_response('Cita no encontrada', code=ErrorCodes.NOT_FOUND, status_code=404)
        return success_response(row)
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@telemedicine_bp.route('/appointments/<int:appointment_id>/status', methods=['PATCH'])
@require_auth
def update_appointment_status(appointment_id):
    """Update appointment status (programada, confirmada, realizada, cancelada, reagendada)."""
    user = get_current_user()
    data = request.get_json() or {}
    new_status = data.get('estado')
    valid = ['programada', 'confirmada', 'realizada', 'cancelada', 'reagendada']
    if new_status not in valid:
        return error_response(f'Estado inválido. Válidos: {valid}', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    try:
        conn = get_telemed_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE CITAS_MEDICAS SET estado = ? WHERE id = ? AND user_id = ?",
                        [new_status, appointment_id, user['nombre_apellido']])
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        if affected == 0:
            return error_response('Cita no encontrada', code=ErrorCodes.NOT_FOUND, status_code=404)
        return success_response({'message': f'Estado actualizado a {new_status}'})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================
# MEDICAL RECORDS / HISTORY
# ============================================

@telemedicine_bp.route('/records', methods=['GET'])
@require_auth
def get_medical_records():
    """Get medical history records."""
    user = get_current_user()
    tipo = request.args.get('tipo')
    limit = request.args.get('limit', 50, type=int)

    query = "SELECT * FROM HISTORIA_MEDICA WHERE user_id = ?"
    params = [user['nombre_apellido']]
    if tipo:
        query += " AND tipo_registro = ?"
        params.append(tipo)
    query += " ORDER BY fecha_registro DESC LIMIT ?"
    params.append(limit)

    try:
        rows = execute_telemed_query(query, params)
        return success_response({'records': rows or [], 'total': len(rows or [])})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@telemedicine_bp.route('/records', methods=['POST'])
@require_auth
def create_medical_record():
    """Create a new medical history record."""
    user = get_current_user()
    data = request.get_json() or {}

    if not data.get('tipo_registro') or not data.get('descripcion'):
        return error_response('tipo_registro y descripcion requeridos', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    try:
        conn = get_telemed_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO HISTORIA_MEDICA (
                user_id, tipo_registro, categoria, descripcion, fecha_evento,
                medico_tratante, institucion, medicamentos, dosis,
                duracion_tratamiento, resultado_tratamiento, estado, importancia, notas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            user['nombre_apellido'],
            data['tipo_registro'], data.get('categoria'), data['descripcion'],
            data.get('fecha_evento'), data.get('medico_tratante'),
            data.get('institucion'), data.get('medicamentos'), data.get('dosis'),
            data.get('duracion_tratamiento'), data.get('resultado_tratamiento'),
            data.get('estado', 'activo'), data.get('importancia', 'media'),
            data.get('notas'),
        ])
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return success_response({'id': new_id, 'message': 'Registro creado'}, status_code=201)
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================
# TELEMED PATIENTS (Doctor's patient files)
# ============================================

@telemedicine_bp.route('/patients', methods=['GET'])
@require_auth
def get_telemed_patients():
    """
    List telemedicine patient files. Admin sees all; regular users see own.
    Query: ?paciente=name (filter by patient name)
    """
    user = get_current_user()
    is_admin = user.get('is_admin', False)
    paciente = request.args.get('paciente')

    try:
        conn = get_telemed_connection(sqlite3.Row)
        cursor = conn.cursor()

        query = """
            SELECT id, user_id, paciente_nombre, paciente_dni, documento, documento_tipo,
                   nombre, apellido, fecha_nacimiento, edad, altura_cm, peso_kg,
                   alergias, patologias_previas, antecedentes, telefono, es_fumador,
                   activo_sexualmente, embarazo, notas, fecha_registro
            FROM TELEMED_PACIENTES WHERE 1=1
        """
        params = []
        if not is_admin:
            query += " AND user_id = ?"
            params.append(user.get('dni') or user['nombre_apellido'])
        if paciente:
            query += " AND paciente_nombre = ?"
            params.append(paciente)
        query += " ORDER BY fecha_registro DESC"

        cursor.execute(query, params)
        registros = [_serialize_patient(row) for row in cursor.fetchall()]
        conn.close()
        return success_response({'patients': registros, 'total': len(registros)})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@telemedicine_bp.route('/patients', methods=['POST'])
@require_auth
def create_or_update_telemed_patient():
    """
    Create or update a telemedicine patient file.
    If body contains 'id', it updates; otherwise creates.
    """
    user = get_current_user()
    is_admin = user.get('is_admin', False)
    user_dni = user.get('dni') or user['nombre_apellido']
    data = request.get_json() or {}

    nombre = (data.get('nombre') or '').strip()
    apellido = (data.get('apellido') or '').strip()
    paciente_nombre = (data.get('paciente_nombre') or '').strip()
    if not paciente_nombre:
        paciente_nombre = ' '.join(p for p in [nombre, apellido] if p).strip()
    if not paciente_nombre:
        return error_response('El nombre del paciente es obligatorio', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    if not nombre and not apellido:
        partes = paciente_nombre.split()
        nombre = partes[0] if partes else ''
        apellido = ' '.join(partes[1:]) if len(partes) > 1 else ''

    fecha_nacimiento = (data.get('fecha_nacimiento') or '').strip() or None
    edad_calculada = _calculate_age(fecha_nacimiento)
    edad_valor = edad_calculada if edad_calculada is not None else _to_int(data.get('edad'))

    common_values = {
        'paciente_nombre': paciente_nombre,
        'nombre': nombre or None, 'apellido': apellido or None,
        'paciente_dni': (data.get('paciente_dni') or data.get('documento') or '').strip() or None,
        'documento': (data.get('documento') or '').strip() or None,
        'documento_tipo': (data.get('documento_tipo') or '').strip() or None,
        'fecha_nacimiento': fecha_nacimiento, 'edad': edad_valor,
        'altura_cm': _to_float(data.get('altura_cm') or data.get('altura')),
        'peso_kg': _to_float(data.get('peso_kg') or data.get('peso')),
        'alergias': _clean_text(data.get('alergias')),
        'patologias_previas': _clean_text(data.get('patologias_previas')),
        'antecedentes': _clean_text(data.get('antecedentes')),
        'telefono': _clean_text(data.get('telefono')),
        'es_fumador': _to_bool(data.get('es_fumador')),
        'activo_sexualmente': _to_bool(data.get('activo_sexualmente')),
        'embarazo': _to_bool(data.get('embarazo')),
        'notas': _clean_text(data.get('notas')),
    }

    try:
        conn = get_telemed_connection(sqlite3.Row)
        cursor = conn.cursor()
        record_id = data.get('id')

        if record_id:
            campos_update = [f"{c} = ?" for c in common_values.keys()]
            vals = list(common_values.values())
            condicion = "WHERE id = ?"
            vals.append(record_id)
            if not is_admin:
                condicion += " AND user_id = ?"
                vals.append(user_dni)

            cursor.execute(f"UPDATE TELEMED_PACIENTES SET {', '.join(campos_update)}, fecha_registro = CURRENT_TIMESTAMP {condicion}", vals)
            if cursor.rowcount == 0:
                conn.close()
                return error_response('Registro no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
            conn.commit()

            cursor.execute("SELECT * FROM TELEMED_PACIENTES WHERE id = ?", (record_id,))
            updated = _serialize_patient(cursor.fetchone())
            conn.close()
            return success_response({'paciente': updated, 'updated': True})

        # INSERT
        cursor.execute("""
            INSERT INTO TELEMED_PACIENTES (
                user_id, paciente_nombre, nombre, apellido, paciente_dni, documento, documento_tipo,
                fecha_nacimiento, edad, altura_cm, peso_kg,
                alergias, patologias_previas, antecedentes, telefono,
                es_fumador, activo_sexualmente, embarazo, notas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            user_dni, common_values['paciente_nombre'], common_values['nombre'], common_values['apellido'],
            common_values['paciente_dni'], common_values['documento'], common_values['documento_tipo'],
            common_values['fecha_nacimiento'], common_values['edad'],
            common_values['altura_cm'], common_values['peso_kg'],
            common_values['alergias'], common_values['patologias_previas'],
            common_values['antecedentes'], common_values['telefono'],
            common_values['es_fumador'], common_values['activo_sexualmente'],
            common_values['embarazo'], common_values['notas'],
        ])
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM TELEMED_PACIENTES WHERE id = ?", (new_id,))
        creado = _serialize_patient(cursor.fetchone())
        conn.close()
        return success_response({'paciente': creado, 'created': True}, status_code=201)
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@telemedicine_bp.route('/patients/<int:patient_id>', methods=['GET'])
@require_auth
def get_telemed_patient(patient_id):
    """Get a single patient file with proper serialization."""
    user = get_current_user()
    is_admin = user.get('is_admin', False)
    try:
        conn = get_telemed_connection(sqlite3.Row)
        cursor = conn.cursor()
        query = "SELECT * FROM TELEMED_PACIENTES WHERE id = ?"
        params = [patient_id]
        if not is_admin:
            query += " AND user_id = ?"
            params.append(user.get('dni') or user['nombre_apellido'])
        cursor.execute(query, params)
        row = cursor.fetchone()
        conn.close()
        if not row:
            return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
        return success_response(_serialize_patient(row))
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================
# CLINICAL SITUATIONS (TELEMED_SITUACIONES)
# ============================================

@telemedicine_bp.route('/situations', methods=['GET'])
@require_auth
def get_situations():
    """
    List clinical situation records with advanced filters.
    Query: ?paciente=name, ?fecha_desde=YYYY-MM-DD, ?fecha_hasta=YYYY-MM-DD, ?cie10=code
    """
    user = get_current_user()
    is_admin = user.get('is_admin', False)
    paciente = request.args.get('paciente')
    fecha_desde = (request.args.get('fecha_desde') or '').strip() or None
    fecha_hasta = (request.args.get('fecha_hasta') or '').strip() or None
    diagnostico = (request.args.get('cie10') or request.args.get('diagnostico') or '').strip() or None

    try:
        conn = get_telemed_connection(sqlite3.Row)
        cursor = conn.cursor()

        query = """
            SELECT id, paciente_nombre, paciente_dni, tipo_consulta, tipo_consulta_personalizada,
                   motivo_consulta, historia_enfermedad_actual, antecedentes_personales,
                   laboratorios, estudios_complementarios, interconsultas,
                   situacion_actual, tratamiento_farmacologico,
                   medidas_estilo_vida, signos_alarma, proximos_controles,
                   diagnostico_cie10, informe_dimision, indicaciones, resumen_clinico,
                   etiquetas, fecha_registro
            FROM TELEMED_SITUACIONES WHERE 1=1
        """
        params = []
        if not is_admin:
            query += " AND user_id = ?"
            params.append(user.get('dni') or user['nombre_apellido'])
        if paciente:
            query += " AND paciente_nombre = ?"
            params.append(paciente)
        if fecha_desde:
            query += " AND DATE(fecha_registro) >= DATE(?)"
            params.append(fecha_desde)
        if fecha_hasta:
            query += " AND DATE(fecha_registro) <= DATE(?)"
            params.append(fecha_hasta)
        if diagnostico:
            query += " AND LOWER(COALESCE(diagnostico_cie10, '')) LIKE ?"
            params.append(f"%{diagnostico.lower()}%")
        query += " ORDER BY fecha_registro DESC"

        cursor.execute(query, params)
        registros = [_serialize_situation(row) for row in cursor.fetchall()]
        conn.close()
        return success_response({'situations': registros, 'total': len(registros)})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@telemedicine_bp.route('/situations', methods=['POST'])
@require_auth
def create_or_update_situation():
    """
    Create or update a clinical situation record.
    If body contains 'id', it updates; otherwise creates.
    Full CIE-10 diagnostics and tags support.
    """
    user = get_current_user()
    is_admin = user.get('is_admin', False)
    user_dni = user.get('dni') or user['nombre_apellido']
    data = request.get_json() or {}

    paciente_nombre = (data.get('paciente_nombre') or '').strip()
    if not paciente_nombre:
        return error_response('Seleccione un paciente', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    etiquetas = data.get('etiquetas') or []
    if isinstance(etiquetas, str):
        etiquetas = [tag.strip() for tag in etiquetas.split(',') if tag.strip()]

    diagnosticos = _limpiar_diagnosticos(data.get('diagnosticos') or data.get('diagnostico_cie10'))

    campos_comunes = {
        'paciente_nombre': paciente_nombre,
        'paciente_dni': _clean_text(data.get('paciente_dni')),
        'tipo_consulta': _clean_text(data.get('tipo_consulta')),
        'tipo_consulta_personalizada': _clean_text(data.get('tipo_consulta_personalizada')),
        'motivo_consulta': _clean_text(data.get('motivo_consulta')),
        'historia_enfermedad_actual': _clean_text(data.get('historia_enfermedad_actual')),
        'antecedentes_personales': _clean_text(data.get('antecedentes_personales')),
        'laboratorios': _clean_text(data.get('laboratorios')),
        'estudios_complementarios': _clean_text(data.get('estudios_complementarios')),
        'interconsultas': _clean_text(data.get('interconsultas')),
        'situacion_actual': _clean_text(data.get('situacion_actual')),
        'tratamiento_farmacologico': _clean_text(data.get('tratamiento_farmacologico')),
        'medidas_estilo_vida': _clean_text(data.get('medidas_estilo_vida')),
        'signos_alarma': _clean_text(data.get('signos_alarma')),
        'proximos_controles': _clean_text(data.get('proximos_controles')),
        'diagnostico_cie10': json.dumps(diagnosticos) if diagnosticos else None,
        'informe_dimision': _clean_text(data.get('informe_dimision')),
        'indicaciones': _clean_text(data.get('indicaciones')),
        'resumen_clinico': _clean_text(data.get('resumen_clinico')),
        'etiquetas': json.dumps(etiquetas) if etiquetas else None,
    }

    try:
        conn = get_telemed_connection(sqlite3.Row)
        cursor = conn.cursor()
        situacion_id = data.get('id')

        if situacion_id:
            set_clause = ", ".join(f"{c} = ?" for c in campos_comunes.keys())
            params = list(campos_comunes.values())
            params.append(situacion_id)
            condicion = "WHERE id = ?"
            if not is_admin:
                condicion += " AND user_id = ?"
                params.append(user_dni)
            cursor.execute(f"UPDATE TELEMED_SITUACIONES SET {set_clause}, fecha_registro = CURRENT_TIMESTAMP {condicion}", params)
            if cursor.rowcount == 0:
                conn.close()
                return error_response('Registro no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
            conn.commit()
            conn.close()
            return success_response({'updated': True})

        campos_insert = ['user_id'] + list(campos_comunes.keys())
        valores_insert = [user_dni] + list(campos_comunes.values())
        placeholders = ", ".join(['?'] * len(campos_insert))
        cursor.execute(f"INSERT INTO TELEMED_SITUACIONES ({', '.join(campos_insert)}) VALUES ({placeholders})", valores_insert)
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return success_response({'id': new_id, 'created': True}, status_code=201)
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@telemedicine_bp.route('/situations/<int:situacion_id>', methods=['DELETE'])
@require_auth
def delete_situation(situacion_id):
    """Delete a clinical situation record."""
    user = get_current_user()
    is_admin = user.get('is_admin', False)
    user_dni = user.get('dni') or user['nombre_apellido']

    try:
        conn = get_telemed_connection()
        cursor = conn.cursor()
        condicion = "WHERE id = ?"
        params = [situacion_id]
        if not is_admin:
            condicion += " AND user_id = ?"
            params.append(user_dni)
        cursor.execute(f"DELETE FROM TELEMED_SITUACIONES {condicion}", params)
        if cursor.rowcount == 0:
            conn.close()
            return error_response('Registro no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
        conn.commit()
        conn.close()
        return success_response({'deleted': True})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================
# VITAL SIGNS (SIGNOS_VITALES)
# ============================================

@telemedicine_bp.route('/vitals', methods=['GET'])
@require_auth
def get_vitals():
    """Get vital signs history."""
    user = get_current_user()
    limit = request.args.get('limit', 30, type=int)

    try:
        rows = execute_telemed_query(
            "SELECT * FROM SIGNOS_VITALES WHERE user_id = ? ORDER BY fecha_registro DESC LIMIT ?",
            [user['nombre_apellido'], limit]
        )
        return success_response({'vitals': rows or [], 'total': len(rows or [])})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@telemedicine_bp.route('/vitals', methods=['POST'])
@require_auth
def create_vital_sign():
    """Record new vital signs."""
    user = get_current_user()
    data = request.get_json() or {}

    try:
        conn = get_telemed_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO SIGNOS_VITALES (
                user_id, presion_sistolica, presion_diastolica,
                frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
                saturacion_oxigeno, glucosa_sangre, peso, nivel_dolor,
                nivel_fatiga, nivel_estres, calidad_sueño, horas_sueño,
                apetito, estado_animo, notas, medido_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            user['nombre_apellido'],
            data.get('presion_sistolica'), data.get('presion_diastolica'),
            data.get('frecuencia_cardiaca'), data.get('frecuencia_respiratoria'),
            data.get('temperatura'), data.get('saturacion_oxigeno'),
            data.get('glucosa_sangre'), data.get('peso'),
            data.get('nivel_dolor'), data.get('nivel_fatiga'),
            data.get('nivel_estres'), data.get('calidad_sueno'),
            data.get('horas_sueno'), data.get('apetito'),
            data.get('estado_animo'), data.get('notas'),
            data.get('medido_por', 'paciente'),
        ])
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return success_response({'id': new_id, 'message': 'Signos vitales registrados'}, status_code=201)
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================
# DOCUMENTS (TELEMED_DOCUMENTOS)
# ============================================

@telemedicine_bp.route('/documents', methods=['GET'])
@require_auth
def get_documents():
    """
    List medical documents with advanced filters.
    Query: ?paciente=name, ?tipo=type, ?fecha_desde, ?fecha_hasta, ?q=search
    """
    user = get_current_user()
    is_admin = user.get('is_admin', False)
    paciente = request.args.get('paciente')
    tipo = request.args.get('tipo')
    fecha_desde = (request.args.get('fecha_desde') or '').strip() or None
    fecha_hasta = (request.args.get('fecha_hasta') or '').strip() or None
    search_term = (request.args.get('q') or request.args.get('search') or '').strip()

    try:
        conn = get_telemed_connection(sqlite3.Row)
        cursor = conn.cursor()

        query = """
            SELECT id, user_id, paciente_nombre, paciente_dni, tipo_documento,
                   descripcion, fecha_documento, drive_url, etiquetas, fecha_registro,
                   notas, nombre_archivo, mime_type, tamano_archivo, drive_file_id, carpeta_id
            FROM TELEMED_DOCUMENTOS WHERE 1=1
        """
        params = []
        if not is_admin:
            query += " AND user_id = ?"
            params.append(user.get('dni') or user['nombre_apellido'])
        if paciente:
            query += " AND paciente_nombre = ?"
            params.append(paciente)
        if tipo:
            query += " AND tipo_documento = ?"
            params.append(tipo)
        if fecha_desde:
            query += " AND DATE(COALESCE(fecha_documento, fecha_registro)) >= DATE(?)"
            params.append(fecha_desde)
        if fecha_hasta:
            query += " AND DATE(COALESCE(fecha_documento, fecha_registro)) <= DATE(?)"
            params.append(fecha_hasta)
        if search_term:
            like_val = f"%{search_term.lower()}%"
            query += " AND (LOWER(COALESCE(descripcion, '')) LIKE ? OR LOWER(COALESCE(etiquetas, '')) LIKE ? OR LOWER(COALESCE(paciente_nombre, '')) LIKE ?)"
            params.extend([like_val, like_val, like_val])
        query += " ORDER BY fecha_documento DESC, fecha_registro DESC"

        cursor.execute(query, params)
        registros = [_serialize_document(row) for row in cursor.fetchall()]
        conn.close()
        return success_response({'documents': registros, 'total': len(registros)})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@telemedicine_bp.route('/documents', methods=['POST'])
@require_auth
def create_document():
    """Register a new medical document (metadata — links to Google Drive)."""
    user = get_current_user()
    user_dni = user.get('dni') or user['nombre_apellido']
    data = request.get_json() or {}

    paciente_nombre = (data.get('paciente_nombre') or '').strip()
    tipo_documento = (data.get('tipo_documento') or '').strip()
    drive_url = (data.get('drive_url') or '').strip()

    if not paciente_nombre or not tipo_documento or not drive_url:
        return error_response(
            'Paciente, tipo de documento y enlace de Drive son obligatorios',
            code=ErrorCodes.VALIDATION_ERROR, status_code=400
        )

    etiquetas = data.get('etiquetas') or []
    if isinstance(etiquetas, str):
        etiquetas = [tag.strip() for tag in etiquetas.split(',') if tag.strip()]

    tamano = data.get('tamano_archivo')
    try:
        tamano = int(tamano) if tamano is not None else None
    except (TypeError, ValueError):
        tamano = None

    try:
        conn = get_telemed_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO TELEMED_DOCUMENTOS (
                user_id, paciente_nombre, paciente_dni, tipo_documento,
                descripcion, fecha_documento, drive_url, etiquetas, notas,
                drive_file_id, nombre_archivo, mime_type, tamano_archivo, carpeta_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            user_dni, paciente_nombre, data.get('paciente_dni'),
            tipo_documento, _clean_text(data.get('descripcion')),
            data.get('fecha_documento'), drive_url,
            json.dumps(etiquetas) if etiquetas else None,
            _clean_text(data.get('notas')),
            _clean_text(data.get('drive_file_id')),
            _clean_text(data.get('nombre_archivo')),
            _clean_text(data.get('mime_type')), tamano,
            _clean_text(data.get('carpeta_id')),
        ])
        conn.commit()
        cursor.execute("SELECT * FROM TELEMED_DOCUMENTOS WHERE id = ?", (cursor.lastrowid,))
        doc = _serialize_document(cursor.fetchone())
        conn.close()
        return success_response({'documento': doc, 'created': True}, status_code=201)
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@telemedicine_bp.route('/documents/<int:documento_id>', methods=['PUT'])
@require_auth
def update_document(documento_id):
    """Update a medical document's metadata."""
    user = get_current_user()
    is_admin = user.get('is_admin', False)
    user_dni = user.get('dni') or user['nombre_apellido']
    data = request.get_json() or {}

    campos = {}
    for clave in ('paciente_nombre', 'tipo_documento', 'descripcion', 'fecha_documento', 'drive_url', 'paciente_dni', 'carpeta_id', 'notas'):
        if clave in data:
            valor = data.get(clave)
            if isinstance(valor, str):
                valor = valor.strip()
            campos[clave] = valor or None

    if 'etiquetas' in data:
        etiquetas = data.get('etiquetas') or []
        if isinstance(etiquetas, str):
            etiquetas = [tag.strip() for tag in etiquetas.split(',') if tag.strip()]
        campos['etiquetas'] = json.dumps(etiquetas) if etiquetas else None

    if not campos:
        return error_response('No hay cambios para aplicar', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    try:
        conn = get_telemed_connection(sqlite3.Row)
        cursor = conn.cursor()
        set_clause = ", ".join(f"{c} = ?" for c in campos.keys())
        params = list(campos.values())
        params.append(documento_id)
        condicion = "WHERE id = ?"
        if not is_admin:
            condicion += " AND user_id = ?"
            params.append(user_dni)

        cursor.execute(f"UPDATE TELEMED_DOCUMENTOS SET {set_clause}, fecha_registro = CURRENT_TIMESTAMP {condicion}", params)
        if cursor.rowcount == 0:
            conn.close()
            return error_response('Documento no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
        conn.commit()
        cursor.execute("SELECT * FROM TELEMED_DOCUMENTOS WHERE id = ?", (documento_id,))
        doc = _serialize_document(cursor.fetchone())
        conn.close()
        return success_response({'documento': doc})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@telemedicine_bp.route('/documents/<int:documento_id>', methods=['DELETE'])
@require_auth
def delete_document(documento_id):
    """Delete a medical document."""
    user = get_current_user()
    is_admin = user.get('is_admin', False)
    user_dni = user.get('dni') or user['nombre_apellido']

    try:
        conn = get_telemed_connection()
        cursor = conn.cursor()
        condicion = "WHERE id = ?"
        params = [documento_id]
        if not is_admin:
            condicion += " AND user_id = ?"
            params.append(user_dni)
        cursor.execute(f"DELETE FROM TELEMED_DOCUMENTOS {condicion}", params)
        if cursor.rowcount == 0:
            conn.close()
            return error_response('Documento no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
        conn.commit()
        conn.close()
        return success_response({'deleted': True})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================
# PREVENTION PROGRAMS (PROGRAMAS_PREVENCION)
# ============================================

@telemedicine_bp.route('/prevention', methods=['GET'])
@require_auth
def get_prevention_programs():
    """List prevention programs."""
    user = get_current_user()
    try:
        rows = execute_telemed_query(
            "SELECT * FROM PROGRAMAS_PREVENCION WHERE user_id = ? ORDER BY proxima_fecha ASC",
            [user['nombre_apellido']]
        )
        return success_response({'programs': rows or [], 'total': len(rows or [])})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@telemedicine_bp.route('/prevention', methods=['POST'])
@require_auth
def create_prevention_program():
    """Create a new prevention program."""
    user = get_current_user()
    user_dni = user.get('dni') or user['nombre_apellido']
    data = request.get_json() or {}

    try:
        conn = get_telemed_connection()
        cursor = conn.cursor()
        campos = ['user_id']
        valores = [user_dni]
        placeholders = ['?']
        for campo, valor in data.items():
            if valor is not None and valor != '':
                campos.append(campo)
                valores.append(valor)
                placeholders.append('?')
        cursor.execute(f"INSERT INTO PROGRAMAS_PREVENCION ({', '.join(campos)}) VALUES ({', '.join(placeholders)})", valores)
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return success_response({'id': new_id, 'message': 'Programa de prevención creado'}, status_code=201)
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================
# PERFORMANCE TESTS (2.5 modules - migrated from legacy placeholders)
# Generic GET/POST pattern for: body measurements, speed, flexibility, mobility, endurance
# ============================================

def _generic_performance_get(table_name, db_type='legacy'):
    """Generic GET for performance tables."""
    user = get_current_user()
    user_id = user.get('dni') or user['nombre_apellido']
    try:
        if db_type == 'telemed':
            conn = get_telemed_connection(sqlite3.Row)
        else:
            from ..common.database import get_db_connection
            conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {table_name} WHERE user_id = ? ORDER BY fecha_registro DESC", (user_id,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return success_response({'registros': rows, 'total': len(rows)})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


def _generic_performance_post(table_name, db_type='legacy', success_msg='Registro guardado'):
    """Generic POST for performance tables."""
    user = get_current_user()
    user_id = user.get('dni') or user['nombre_apellido']
    data = request.get_json() or {}
    try:
        if db_type == 'telemed':
            conn = get_telemed_connection()
        else:
            from ..common.database import get_db_connection
            conn = get_db_connection()
        cursor = conn.cursor()
        campos = ['user_id']
        valores = [user_id]
        placeholders = ['?']
        for campo, valor in data.items():
            if valor is not None and valor != '':
                campos.append(campo)
                valores.append(valor)
                placeholders.append('?')
        cursor.execute(f"INSERT INTO {table_name} ({', '.join(campos)}) VALUES ({', '.join(placeholders)})", valores)
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return success_response({'id': new_id, 'message': success_msg}, status_code=201)
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# Body Measurements
@telemedicine_bp.route('/body-measurements', methods=['GET'])
@require_auth
def get_body_measurements():
    """Get body measurement history (MEDIDAS_CORPORALES)."""
    return _generic_performance_get('MEDIDAS_CORPORALES', 'legacy')

@telemedicine_bp.route('/body-measurements', methods=['POST'])
@require_auth
def create_body_measurement():
    """Record new body measurements."""
    return _generic_performance_post('MEDIDAS_CORPORALES', 'legacy', 'Medidas registradas')


# Speed Tests
@telemedicine_bp.route('/performance/speed', methods=['GET'])
@require_auth
def get_speed_tests():
    """Get speed test history (RENDIMIENTO_VELOCIDAD)."""
    return _generic_performance_get('RENDIMIENTO_VELOCIDAD', 'legacy')

@telemedicine_bp.route('/performance/speed', methods=['POST'])
@require_auth
def create_speed_test():
    """Record a new speed test."""
    return _generic_performance_post('RENDIMIENTO_VELOCIDAD', 'legacy', 'Prueba de velocidad registrada')


# Flexibility Tests
@telemedicine_bp.route('/performance/flexibility', methods=['GET'])
@require_auth
def get_flexibility_tests():
    """Get flexibility test history (RENDIMIENTO_FLEXIBILIDAD)."""
    return _generic_performance_get('RENDIMIENTO_FLEXIBILIDAD', 'legacy')

@telemedicine_bp.route('/performance/flexibility', methods=['POST'])
@require_auth
def create_flexibility_test():
    """Record a new flexibility test."""
    return _generic_performance_post('RENDIMIENTO_FLEXIBILIDAD', 'legacy', 'Prueba de flexibilidad registrada')


# Mobility Tests
@telemedicine_bp.route('/performance/mobility', methods=['GET'])
@require_auth
def get_mobility_tests():
    """Get mobility test history (RENDIMIENTO_MOVILIDAD)."""
    return _generic_performance_get('RENDIMIENTO_MOVILIDAD', 'legacy')

@telemedicine_bp.route('/performance/mobility', methods=['POST'])
@require_auth
def create_mobility_test():
    """Record a new mobility test."""
    return _generic_performance_post('RENDIMIENTO_MOVILIDAD', 'legacy', 'Evaluación de movilidad registrada')


# Endurance Tests
@telemedicine_bp.route('/performance/endurance', methods=['GET'])
@require_auth
def get_endurance_tests():
    """Get endurance test history (RENDIMIENTO_RESISTENCIA) — stored in telemed DB."""
    return _generic_performance_get('RENDIMIENTO_RESISTENCIA', 'telemed')

@telemedicine_bp.route('/performance/endurance', methods=['POST'])
@require_auth
def create_endurance_test():
    """Record a new endurance test."""
    return _generic_performance_post('RENDIMIENTO_RESISTENCIA', 'telemed', 'Prueba de resistencia registrada')


# ============================================
# TEMPLATES (PLANTILLAS) — Doctor plan templates
# ============================================

def _ensure_templates_table():
    """Create PLANTILLAS table if not exists."""
    conn = get_telemed_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS PLANTILLAS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'nutrition',
            name TEXT NOT NULL,
            description TEXT,
            content TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()


@telemedicine_bp.route('/templates', methods=['GET'])
@require_auth
def get_templates():
    """List templates for the current doctor. Admins see all."""
    _ensure_templates_table()
    user = get_current_user()
    is_admin = user.get('is_admin', False)
    template_type = request.args.get('type')

    conn = get_telemed_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = "SELECT * FROM PLANTILLAS WHERE 1=1"
    params = []

    if not is_admin:
        query += " AND user_id = ?"
        params.append(user.get('dni') or user['nombre_apellido'])

    if template_type:
        query += " AND type = ?"
        params.append(template_type)

    query += " ORDER BY updated_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    templates = []
    for row in rows:
        t = dict(row)
        if t.get('content'):
            try:
                t['content'] = json.loads(t['content'])
            except (json.JSONDecodeError, TypeError):
                pass
        templates.append(t)

    return success_response(data={'templates': templates, 'total': len(templates)})


@telemedicine_bp.route('/templates', methods=['POST'])
@require_auth
def create_template():
    """Create a new template."""
    _ensure_templates_table()
    user = get_current_user()
    data = request.get_json() or {}

    name = data.get('name', '').strip()
    if not name:
        return error_response('El nombre es obligatorio', ErrorCodes.VALIDATION_ERROR, 400)

    tpl_type = data.get('type', 'nutrition')
    description = data.get('description', '')
    content = data.get('content')
    if content and not isinstance(content, str):
        content = json.dumps(content, ensure_ascii=False)

    user_id = user.get('dni') or user['nombre_apellido']
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    conn = get_telemed_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO PLANTILLAS (user_id, type, name, description, content, created_at, updated_at) VALUES (?,?,?,?,?,?,?)",
        [user_id, tpl_type, name, description, content, now, now]
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return success_response(data={'id': new_id, 'message': 'Plantilla creada'}, status_code=201)


@telemedicine_bp.route('/templates/<int:template_id>', methods=['PUT'])
@require_auth
def update_template(template_id):
    """Update an existing template."""
    _ensure_templates_table()
    user = get_current_user()
    data = request.get_json() or {}
    user_id = user.get('dni') or user['nombre_apellido']
    is_admin = user.get('is_admin', False)

    conn = get_telemed_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if is_admin:
        cursor.execute("SELECT * FROM PLANTILLAS WHERE id = ?", [template_id])
    else:
        cursor.execute("SELECT * FROM PLANTILLAS WHERE id = ? AND user_id = ?", [template_id, user_id])

    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return error_response('Plantilla no encontrada', ErrorCodes.NOT_FOUND, 404)

    name = data.get('name', existing['name'])
    tpl_type = data.get('type', existing['type'])
    description = data.get('description', existing['description'])
    content = data.get('content', existing['content'])
    if content and not isinstance(content, str):
        content = json.dumps(content, ensure_ascii=False)
    is_active = data.get('is_active', existing['is_active'])
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    cursor.execute(
        "UPDATE PLANTILLAS SET name=?, type=?, description=?, content=?, is_active=?, updated_at=? WHERE id=?",
        [name, tpl_type, description, content, int(is_active), now, template_id]
    )
    conn.commit()
    conn.close()

    return success_response(data={'message': 'Plantilla actualizada'})


@telemedicine_bp.route('/templates/<int:template_id>', methods=['DELETE'])
@require_auth
def delete_template(template_id):
    """Delete a template."""
    _ensure_templates_table()
    user = get_current_user()
    user_id = user.get('dni') or user['nombre_apellido']
    is_admin = user.get('is_admin', False)

    conn = get_telemed_connection()
    cursor = conn.cursor()

    if is_admin:
        cursor.execute("DELETE FROM PLANTILLAS WHERE id = ?", [template_id])
    else:
        cursor.execute("DELETE FROM PLANTILLAS WHERE id = ? AND user_id = ?", [template_id, user_id])

    deleted = cursor.rowcount
    conn.commit()
    conn.close()

    if deleted == 0:
        return error_response('Plantilla no encontrada', ErrorCodes.NOT_FOUND, 404)

    return success_response(data={'message': 'Plantilla eliminada'})
