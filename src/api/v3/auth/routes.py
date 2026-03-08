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
                   u.status, l.patient_dni
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
        
        # 3. Generar token
        token_data = {
            'user_id': str(auth_dict['id']),
            'dni': patient_dni,
            'email': auth_dict['email'],
            'nombre_apellido': auth_dict['display_name'] or '',
            'rol': auth_dict['role'],
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
    """
    data = request.get_json() or {}
    
    nombre = (data.get('nombre') or '').strip()
    email = (data.get('email') or '').strip().lower()
    documento = (data.get('documento') or '').strip()
    telefono = (data.get('telefono') or '').strip()
    desired_role = (data.get('desired_role') or 'patient').strip()
    
    if not nombre or not email or not documento:
        return error_response(
            'Nombre, email y documento son requeridos',
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
        
        # Verificar documento duplicado
        cursor.execute('SELECT user_id FROM patient_user_link WHERE patient_dni = ?', [documento])
        if cursor.fetchone():
            auth_conn.close()
            return error_response(
                'Ya existe una cuenta con ese documento',
                code=ErrorCodes.VALIDATION_ERROR,
                status_code=409
            )
        
        # Hash password (documento como contraseña inicial)
        password_hash = bcrypt.hashpw(documento.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Mapear desired_role a role en DB
        role = 'doctor' if desired_role == 'professional' else 'user'
        
        # Insertar usuario con status pending
        cursor.execute("""
            INSERT INTO users (email, password_hash, role, display_name, is_active, status, telefono, desired_role)
            VALUES (?, ?, ?, ?, 1, 'pending_verification', ?, ?)
        """, [email, password_hash, role, nombre, telefono, desired_role])
        
        user_id = cursor.lastrowid
        
        # Crear link con DNI
        cursor.execute("""
            INSERT INTO patient_user_link (user_id, patient_dni)
            VALUES (?, ?)
        """, [user_id, documento])
        
        auth_conn.commit()
        auth_conn.close()

        _log_audit(
            user_id, nombre,
            'user_registered',
            f'Nuevo registro: {nombre} ({email}) - rol deseado: {desired_role}',
            request.remote_addr
        )
        
        return success_response({
            'user_id': user_id,
            'status': 'pending_verification'
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
