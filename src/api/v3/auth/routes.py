"""
AUTH Routes - Endpoints de autenticación
"""

from flask import request
from . import auth_bp
from ..common.responses import success_response, error_response, ErrorCodes
from ..common.auth import generate_token, decode_token, get_token_from_request, require_auth, get_current_user
from ..common.database import get_db_connection, get_auth_connection
import sqlite3
import bcrypt


def _log_audit(user_id, user_name, action, details, ip=None):
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


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login con email y contraseña (documento como contraseña inicial).
    
    Request Body:
        {
            "email": "user@example.com",
            "password": "12345678"
        }
    
    Returns:
        Token JWT y datos del usuario
    """
    data = request.get_json() or {}
    
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()
    
    if not email or not password:
        return error_response(
            'Email y contraseña son requeridos',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    try:
        # 1. Buscar usuario en auth.db
        auth_conn = get_auth_connection(sqlite3.Row)
        auth_cursor = auth_conn.cursor()
        
        auth_cursor.execute("""
            SELECT u.id, u.email, u.password_hash, u.role, u.display_name, u.is_active,
                   u.status, u.desired_role, l.patient_dni
            FROM users u
            LEFT JOIN patient_user_link l ON u.id = l.user_id
            WHERE LOWER(u.email) = ?
        """, [email])
        
        auth_user = auth_cursor.fetchone()
        auth_conn.close()
        
        if not auth_user:
            return error_response(
                'Credenciales inválidas',
                code=ErrorCodes.UNAUTHORIZED,
                status_code=401
            )
        
        auth_dict = dict(auth_user)
        
        # Verificar cuenta activa
        if not auth_dict.get('is_active', 1):
            return error_response(
                'Cuenta desactivada',
                code=ErrorCodes.UNAUTHORIZED,
                status_code=401
            )
        
        # Verificar estado de verificación
        user_status = auth_dict.get('status', 'active')
        if user_status == 'pending_verification':
            return error_response(
                'Tu cuenta está pendiente de verificación por el administrador.',
                code='PENDING_VERIFICATION',
                status_code=403
            )
        
        # Verificar contraseña con bcrypt
        if not bcrypt.checkpw(
            password.encode('utf-8'),
            auth_dict['password_hash'].encode('utf-8')
        ):
            return error_response(
                'Credenciales inválidas',
                code=ErrorCodes.UNAUTHORIZED,
                status_code=401
            )
        
        # 2. Obtener datos extra del perfil legacy
        patient_dni = auth_dict.get('patient_dni', '')
        perfil_data = {}
        
        if patient_dni:
            try:
                legacy_conn = get_db_connection(sqlite3.Row)
                legacy_cursor = legacy_conn.cursor()
                legacy_cursor.execute("""
                    SELECT SEXO, ALTURA, NUMERO_TELEFONO AS TELEFONO, FECHA_NACIMIENTO
                    FROM PERFILESTATICO WHERE DNI = ?
                """, [patient_dni])
                perfil = legacy_cursor.fetchone()
                legacy_conn.close()
                if perfil:
                    perfil_data = dict(perfil)
            except Exception:
                pass
        
        is_admin = 'admin' in [r.strip() for r in (auth_dict['role'] or '').split(',')]
        desired_role = auth_dict.get('desired_role') or ''

        # 3. Generar token
        token_data = {
            'user_id': str(auth_dict['id']),
            'dni': patient_dni,
            'email': auth_dict['email'],
            'nombre_apellido': auth_dict['display_name'] or '',
            'rol': auth_dict['role'],
            'desired_role': desired_role,
            'is_admin': is_admin
        }

        token = generate_token(token_data)

        _log_audit(
            auth_dict['id'], auth_dict['display_name'] or email,
            'login',
            f'Inicio de sesión como {auth_dict["role"]}',
            request.remote_addr
        )

        return success_response({
            'token': token,
            'user': {
                'id': str(auth_dict['id']),
                'dni': patient_dni,
                'email': auth_dict['email'],
                'nombre_apellido': auth_dict['display_name'] or '',
                'sexo': perfil_data.get('SEXO'),
                'altura': perfil_data.get('ALTURA'),
                'telefono': perfil_data.get('TELEFONO'),
                'fecha_nacimiento': perfil_data.get('FECHA_NACIMIENTO'),
                'rol': auth_dict['role'],
                'desired_role': desired_role,
                'is_admin': is_admin
            }
        }, message='Login exitoso')
        
    except Exception as e:
        return error_response(
            f'Error en login: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Registro de nuevo usuario. Queda pendiente de verificación.
    Contrato alineado con frontend/src/types/api.ts:RegisterPayload.
    No requiere documento: la creación del patient_user_link y del registro
    en clinical.db.patients se difiere a "completar perfil clínico".
    """
    data = request.get_json() or {}

    nombre = (data.get('nombre') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    sexo = (data.get('sexo') or '').strip().upper() or None
    fecha_nacimiento = (data.get('fecha_nacimiento') or '').strip() or None
    telefono = (data.get('telefono') or '').strip()
    desired_roles = data.get('desired_roles') or []

    # Compatibilidad con el contrato viejo (singular)
    if not desired_roles and data.get('desired_role'):
        desired_roles = [data['desired_role']]

    if not nombre or not email or not password:
        return error_response(
            'Nombre, email y password son requeridos',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )

    if sexo and sexo not in ('M', 'F'):
        return error_response(
            'Sexo inválido',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )

    try:
        auth_conn = get_auth_connection(sqlite3.Row)
        cursor = auth_conn.cursor()

        # Verificar email duplicado
        cursor.execute('SELECT id FROM users WHERE LOWER(email) = ?', [email])
        if cursor.fetchone():
            auth_conn.close()
            return error_response(
                'Ya existe una cuenta con ese email',
                code=ErrorCodes.VALIDATION_ERROR,
                status_code=409
            )

        # Hash del password que envió el usuario
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Mapear primer rol deseado a la columna `role` legacy
        primary = (desired_roles[0] if desired_roles else 'patient').lower()
        role = 'doctor' if primary in ('doctor', 'nutritionist', 'trainer', 'professional') else 'user'

        # Guardar el array completo como CSV (admin lo lee como string)
        desired_role_csv = ','.join(str(r).lower() for r in desired_roles) or 'patient'

        cursor.execute("""
            INSERT INTO users (email, password_hash, role, display_name, is_active, status,
                               telefono, desired_role, sexo, fecha_nacimiento)
            VALUES (?, ?, ?, ?, 1, 'pending_verification', ?, ?, ?, ?)
        """, [email, password_hash, role, nombre, telefono, desired_role_csv, sexo, fecha_nacimiento])

        user_id = cursor.lastrowid

        auth_conn.commit()
        auth_conn.close()

        _log_audit(
            user_id, nombre,
            'user_registered',
            f'Nuevo registro: {nombre} ({email}) - roles deseados: {desired_role_csv}',
            request.remote_addr
        )

        return success_response({
            'user_id': user_id,
            'status': 'pending_verification',
            'email_verified': False,
            'email_verification_required': True,
        }, message='Registro exitoso. Tu cuenta está pendiente de verificación.')

    except Exception as e:
        return error_response(
            f'Error en registro: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    """
    Logout - Invalida el token actual.
    
    Note: Con JWT stateless, el logout es manejado por el cliente
    eliminando el token. Este endpoint es para compatibilidad.
    """
    return success_response(
        {'logged_out': True},
        message='Sesión cerrada exitosamente'
    )


@auth_bp.route('/validate', methods=['GET'])
def validate_token():
    """
    Valida el token actual y retorna datos del usuario.
    
    Headers:
        Authorization: Bearer <token>
    
    Returns:
        Datos del usuario si el token es válido
    """
    token = get_token_from_request()
    
    if not token:
        return error_response(
            'Token no proporcionado',
            code=ErrorCodes.UNAUTHORIZED,
            status_code=401
        )
    
    payload = decode_token(token)
    
    if not payload:
        return error_response(
            'Token inválido o expirado',
            code=ErrorCodes.TOKEN_INVALID,
            status_code=401
        )
    
    return success_response({
        'valid': True,
        'user': {
            'id': payload.get('user_id'),
            'dni': payload.get('dni'),
            'email': payload.get('email'),
            'nombre_apellido': payload.get('nombre_apellido'),
            'rol': payload.get('rol', 'user'),
            'is_admin': payload.get('is_admin', False)
        }
    })


@auth_bp.route('/refresh', methods=['POST'])
@require_auth
def refresh_token():
    """
    Refresca el token actual generando uno nuevo.
    
    Headers:
        Authorization: Bearer <token>
    
    Returns:
        Nuevo token JWT
    """
    user = get_current_user()
    
    if not user:
        return error_response(
            'Usuario no encontrado',
            code=ErrorCodes.UNAUTHORIZED,
            status_code=401
        )
    
    # Generar nuevo token
    new_token = generate_token(user)
    
    return success_response({
        'token': new_token,
        'user': user
    }, message='Token refrescado exitosamente')


@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_me():
    """
    Obtiene los datos del usuario autenticado.
    
    Headers:
        Authorization: Bearer <token>
    
    Returns:
        Datos completos del usuario
    """
    user = get_current_user()
    
    if not user:
        return error_response(
            'Usuario no encontrado',
            code=ErrorCodes.UNAUTHORIZED,
            status_code=401
        )
    
    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        # Obtener datos completos del perfil estático
        cursor.execute("""
            SELECT DNI, NOMBRE_APELLIDO, EMAIL, SEXO, ALTURA, NUMERO_TELEFONO AS TELEFONO, FECHA_NACIMIENTO
            FROM PERFILESTATICO 
            WHERE DNI = ?
        """, [user['dni']])
        
        perfil_estatico = cursor.fetchone()
        
        # Obtener último perfil dinámico
        cursor.execute("""
            SELECT * FROM PERFILDINAMICO 
            WHERE NOMBRE_APELLIDO = ?
            ORDER BY FECHA_REGISTRO DESC 
            LIMIT 1
        """, [user['nombre_apellido']])
        
        perfil_dinamico = cursor.fetchone()
        
        conn.close()
        
        # Merge perfil_estatico fields into user object for frontend
        merged_user = dict(user)
        # Normalize: JWT stores 'user_id', but frontend expects 'id'
        if 'user_id' in merged_user and 'id' not in merged_user:
            merged_user['id'] = merged_user.pop('user_id')
        if perfil_estatico:
            pe = dict(perfil_estatico)
            merged_user['sexo'] = pe.get('SEXO')
            merged_user['altura'] = pe.get('ALTURA')
            merged_user['telefono'] = pe.get('TELEFONO') or merged_user.get('telefono')
            merged_user['fecha_nacimiento'] = pe.get('FECHA_NACIMIENTO')

        # `desired_role` (CSV of requested role(s)) drives the frontend
        # role-switcher options. Fall back to a fresh auth.db lookup if the
        # JWT was issued before this field was added to the token payload.
        if not merged_user.get('desired_role'):
            try:
                auth_conn = get_auth_connection(sqlite3.Row)
                auth_cursor = auth_conn.cursor()
                auth_cursor.execute(
                    "SELECT desired_role FROM users WHERE id = ?",
                    [merged_user.get('id')],
                )
                row = auth_cursor.fetchone()
                auth_conn.close()
                if row:
                    merged_user['desired_role'] = dict(row).get('desired_role') or ''
            except Exception:
                merged_user['desired_role'] = ''
        
        response_data = {
            'user': merged_user,
            'perfil_estatico': dict(perfil_estatico) if perfil_estatico else None,
            'perfil_dinamico': dict(perfil_dinamico) if perfil_dinamico else None
        }
        
        return success_response(response_data)
        
    except Exception as e:
        return error_response(
            f'Error obteniendo datos: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@auth_bp.route('/change-password', methods=['POST'])
@require_auth
def change_password():
    """
    Change the authenticated user's password.

    Body: { "current_password": "...", "new_password": "..." }
    Validates the current password (bcrypt) before re-hashing the new one.
    """
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    current = (data.get('current_password') or '').strip()
    new = (data.get('new_password') or '').strip()

    if not current or not new:
        return error_response(
            'current_password y new_password son requeridos',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400,
        )
    if len(new) < 8:
        return error_response(
            'La nueva contraseña debe tener al menos 8 caracteres',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400,
        )
    if current == new:
        return error_response(
            'La nueva contraseña debe ser distinta a la actual',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400,
        )

    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute("SELECT id, password_hash FROM users WHERE id = ?", [user['user_id']])
        row = cursor.fetchone()
        if not row:
            conn.close()
            return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        stored_hash = dict(row)['password_hash']
        if not bcrypt.checkpw(current.encode('utf-8'), stored_hash.encode('utf-8')):
            conn.close()
            return error_response(
                'La contraseña actual no es correcta',
                code=ErrorCodes.UNAUTHORIZED,
                status_code=401,
            )

        new_hash = bcrypt.hashpw(new.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", [new_hash, user['user_id']])
        conn.commit()
        conn.close()

        try:
            _log_audit_safe(user['user_id'], user.get('nombre_apellido', ''), 'password_changed',
                            'Cambio de contraseña', request.remote_addr)
        except Exception:
            pass

        return success_response({'changed': True}, message='Contraseña actualizada.')
    except Exception as e:
        return error_response(f'Error: {e}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


def _log_audit_safe(user_id, user_name, action, details, ip):
    """Best-effort audit log write — never raises into the caller."""
    try:
        conn = get_auth_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO audit_log (user_id, user_name, action, details, ip_address, created_at)
               VALUES (?, ?, ?, ?, ?, datetime('now'))""",
            [user_id, user_name, action, details, ip or ''],
        )
        conn.commit()
        conn.close()
    except Exception:
        pass
