"""
AUTH Routes - Endpoints de autenticación
"""

from flask import request
from . import auth_bp
from ..common.responses import success_response, error_response, ErrorCodes
from ..common.auth import (
    generate_token, decode_token, get_token_from_request,
    require_auth, get_current_user, revoke_token,
)
from ..common.database import get_db_connection, get_auth_connection
from ..common.user_serializer import serialize_user
from ..common.validators import (
    validate_email_format, validate_telefono, validate_fecha_nacimiento, validate_sexo,
)
import sqlite3
import bcrypt
import secrets
from datetime import datetime, timedelta


# Rate-limit policy (OMV-76, OMV-86)
_LOGIN_WINDOW_MIN = 15
_LOGIN_MAX_FAILED = 5
# Verification / reset token lifetimes
_VERIFY_TOKEN_DAYS = 7
_RESET_TOKEN_HOURS = 2


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


def _log_login_attempt(email, ip, success, reason=None):
    """Persist a login_attempts row + bump users.failed_login_count on failure."""
    try:
        conn = get_auth_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO login_attempts (email, ip_address, success, reason) VALUES (?, ?, ?, ?)",
            [email, ip, 1 if success else 0, reason],
        )
        if success:
            cursor.execute(
                "UPDATE users SET last_login_at = CURRENT_TIMESTAMP, failed_login_count = 0 "
                "WHERE LOWER(email) = ?", [email.lower()],
            )
        else:
            cursor.execute(
                "UPDATE users SET failed_login_count = COALESCE(failed_login_count, 0) + 1 "
                "WHERE LOWER(email) = ?", [email.lower()],
            )
        conn.commit()
        conn.close()
    except Exception:
        pass


def _is_rate_limited(email) -> bool:
    """Check login_attempts within the window — OMV-76/86."""
    try:
        conn = get_auth_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM login_attempts "
            "WHERE email = ? AND success = 0 AND created_at >= datetime('now', ?) ",
            [email, f'-{_LOGIN_WINDOW_MIN} minutes'],
        )
        n = cursor.fetchone()[0] or 0
        conn.close()
        return n >= _LOGIN_MAX_FAILED
    except Exception:
        return False


def _queue_email(to_email, subject, body, template=None):
    """Enqueue an outbound email — OMV-21, OMV-78. Worker sends; we just persist."""
    try:
        conn = get_auth_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO email_outbox (to_email, subject, body, template) VALUES (?, ?, ?, ?)",
            [to_email, subject, body, template],
        )
        conn.commit()
        conn.close()
    except Exception:
        pass


def _is_membership_expired(row) -> bool:
    exp = row.get('membership_expires_at') if isinstance(row, dict) else None
    if not exp:
        return False
    try:
        return datetime.fromisoformat(str(exp).replace(' ', 'T')) < datetime.utcnow()
    except Exception:
        return False


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login con email y contraseña.

    Request Body:
        { "email": "user@example.com", "password": "..." }

    Hardening (Fix 11/12):
    - Rate-limit: 5 intentos fallidos por email en 15 min → 429.
    - Reordenado: rejected → inactive → pending_verification → membership
      expirada → password.
    - Audit-log: cada intento (success o failed) en login_attempts.
    - Shape unificado vía serialize_user.
    """
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()
    ip = request.remote_addr

    if not email or not password:
        return error_response('Email y contraseña son requeridos',
                              code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    # OMV-76 / OMV-86: rate-limit antes de revelar si el email existe.
    if _is_rate_limited(email):
        _log_login_attempt(email, ip, False, 'rate_limited')
        return error_response(
            f'Demasiados intentos fallidos. Esperá {_LOGIN_WINDOW_MIN} minutos.',
            code='RATE_LIMITED', status_code=429,
        )

    try:
        auth_conn = get_auth_connection(sqlite3.Row)
        auth_cursor = auth_conn.cursor()
        auth_cursor.execute("""
            SELECT u.id, u.email, u.password_hash, u.role, u.display_name, u.is_active,
                   u.status, u.desired_role, u.email_verified, u.membership_expires_at
            FROM users u
            WHERE LOWER(u.email) = ?
        """, [email])
        auth_user = auth_cursor.fetchone()
        auth_conn.close()

        if not auth_user:
            _log_login_attempt(email, ip, False, 'no_such_user')
            return error_response('Credenciales inválidas',
                                  code=ErrorCodes.UNAUTHORIZED, status_code=401)

        auth_dict = dict(auth_user)
        user_status = auth_dict.get('status', 'active') or 'active'

        # OMV-85: rejected antes de inactive — devuelve 403 ACCOUNT_REJECTED.
        if user_status == 'rejected':
            _log_login_attempt(email, ip, False, 'account_rejected')
            return error_response(
                'Tu cuenta fue rechazada. Contactá al administrador.',
                code='ACCOUNT_REJECTED', status_code=403,
            )

        if not auth_dict.get('is_active', 1):
            _log_login_attempt(email, ip, False, 'account_inactive')
            return error_response('Cuenta desactivada',
                                  code='ACCOUNT_INACTIVE', status_code=401)

        if user_status == 'pending_verification':
            _log_login_attempt(email, ip, False, 'pending_verification')
            return error_response(
                'Tu cuenta está pendiente de verificación por el administrador.',
                code='PENDING_VERIFICATION', status_code=403,
            )

        # OMV-81: membresía vencida → 403.
        if _is_membership_expired(auth_dict):
            _log_login_attempt(email, ip, False, 'membership_expired')
            return error_response(
                'Tu membresía está vencida. Contactá al administrador para renovarla.',
                code='MEMBERSHIP_EXPIRED', status_code=403,
            )

        # Password
        if not bcrypt.checkpw(password.encode('utf-8'),
                              auth_dict['password_hash'].encode('utf-8')):
            _log_login_attempt(email, ip, False, 'bad_password')
            return error_response('Credenciales inválidas',
                                  code=ErrorCodes.UNAUTHORIZED, status_code=401)

        # Success — armar payload del token + serializar respuesta.
        is_admin = 'admin' in [r.strip() for r in (auth_dict['role'] or '').split(',')]
        token_data = {
            'user_id': str(auth_dict['id']),
            'email': auth_dict['email'],
            'nombre_apellido': auth_dict['display_name'] or '',
            'rol': auth_dict['role'],
            'is_admin': is_admin,
        }
        token = generate_token(token_data)

        _log_login_attempt(email, ip, True)
        _log_audit(auth_dict['id'], auth_dict['display_name'] or email,
                   'login', f'Inicio de sesión como {auth_dict["role"]}', ip)

        user_payload = serialize_user({
            **token_data,
            'desired_role': auth_dict.get('desired_role') or '',
            'email_verified': bool(auth_dict.get('email_verified')),
            'membership_expires_at': auth_dict.get('membership_expires_at'),
        })
        return success_response({'token': token, 'user': user_payload},
                                message='Login exitoso')

    except Exception as e:
        return error_response(f'Error en login: {str(e)}',
                              code=ErrorCodes.INTERNAL_ERROR, status_code=500)


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

    # OMV-15: validar shape de email + teléfono.
    ok_email, err_email = validate_email_format(email)
    if not ok_email:
        return error_response(err_email, code=ErrorCodes.VALIDATION_ERROR, status_code=400)
    if telefono:
        ok_tel, err_tel = validate_telefono(telefono)
        if not ok_tel:
            return error_response(err_tel, code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    ok_sexo, err_sexo = validate_sexo(sexo)
    if not ok_sexo:
        return error_response(err_sexo, code=ErrorCodes.VALIDATION_ERROR, status_code=400)
    ok_fn, err_fn = validate_fecha_nacimiento(fecha_nacimiento)
    if not ok_fn:
        return error_response(err_fn, code=ErrorCodes.VALIDATION_ERROR, status_code=400)

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

        # OMV-16: token de verificación inicial.
        verification_token = secrets.token_urlsafe(32)

        cursor.execute("""
            INSERT INTO users (email, password_hash, role, display_name, is_active, status,
                               telefono, desired_role, sexo, fecha_nacimiento,
                               email_verified, email_verification_token,
                               email_verification_sent_at)
            VALUES (?, ?, ?, ?, 1, 'pending_verification', ?, ?, ?, ?,
                    0, ?, CURRENT_TIMESTAMP)
        """, [email, password_hash, role, nombre, telefono, desired_role_csv,
              sexo, fecha_nacimiento, verification_token])

        user_id = cursor.lastrowid

        auth_conn.commit()
        auth_conn.close()

        # OMV-17: la fila clínica se aprovisiona en el mismo flow (single
        # transaction lógica). Si falla, el alta queda OK pero el perfil
        # se creará lazy en el primer acceso (no abortamos el registro).
        patient_id = None
        try:
            from ..common.database import _ensure_patient_link
            ensured = _ensure_patient_link(user_id, display_name=nombre, email=email)
            if ensured:
                patient_id = ensured.get('patient_id')
        except Exception:
            pass

        _log_audit(
            user_id, nombre,
            'user_registered',
            f'Nuevo registro: {nombre} ({email}) - roles deseados: {desired_role_csv}',
            request.remote_addr
        )

        # OMV-21: encolar email de verificación.
        _queue_email(
            email,
            'Confirmá tu email — Omega Medicina',
            f'Hola {nombre},\n\nBienvenido. Para verificar tu email entrá a:\n'
            f'https://omegamedicina.pythonanywhere.com/verify-email?token={verification_token}\n\n'
            f'Tu cuenta queda pendiente de aprobación por un administrador.',
            template='register_welcome',
        )

        return success_response({
            'user_id': user_id,
            'patient_id': patient_id,
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
    Logout — revoca el JTI del token actual (OMV-75).
    """
    user = get_current_user()
    token = get_token_from_request()
    payload = decode_token(token) if token else None
    if payload and payload.get('jti'):
        revoke_token(
            payload['jti'],
            user_id=payload.get('user_id'),
            reason='logout',
            expires_at=datetime.utcfromtimestamp(payload['exp']).isoformat()
                if payload.get('exp') else None,
        )
    _log_audit(user.get('user_id') if user else None,
               user.get('nombre_apellido', '') if user else '',
               'logout', 'Cerró sesión', request.remote_addr)
    return success_response({'logged_out': True}, message='Sesión cerrada')


@auth_bp.route('/validate', methods=['GET'])
def validate_token():
    """
    Valida el token actual y retorna el usuario serializado (shape canónico
    vía `serialize_user` — OMV-1).
    """
    token = get_token_from_request()
    if not token:
        return error_response('Token no proporcionado',
                              code=ErrorCodes.UNAUTHORIZED, status_code=401)

    payload = decode_token(token)
    if not payload:
        return error_response('Token inválido, expirado o revocado',
                              code=ErrorCodes.TOKEN_INVALID, status_code=401)

    return success_response({
        'valid': True,
        'user': serialize_user(payload),
    })


@auth_bp.route('/refresh', methods=['POST'])
@require_auth
def refresh_token():
    """
    Mint a fresh token AND revoke the old one (OMV-80). Also re-checks
    membership_expires_at — un token vencido en membresía no debe poder
    renovarse (OMV-81).
    """
    user = get_current_user()
    if not user:
        return error_response('Usuario no encontrado',
                              code=ErrorCodes.UNAUTHORIZED, status_code=401)

    # Re-query DB para chequear membership / status actualizado
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT membership_expires_at, status, is_active, email_verified, desired_role "
            "FROM users WHERE id = ?",
            [user.get('user_id')],
        )
        row = cursor.fetchone()
        conn.close()
        row_dict = dict(row) if row else {}
        if not row_dict.get('is_active', 1):
            return error_response('Cuenta desactivada',
                                  code='ACCOUNT_INACTIVE', status_code=401)
        if row_dict.get('status') == 'rejected':
            return error_response('Cuenta rechazada',
                                  code='ACCOUNT_REJECTED', status_code=403)
        if _is_membership_expired(row_dict):
            return error_response('Membresía vencida — no se puede refrescar',
                                  code='MEMBERSHIP_EXPIRED', status_code=403)
    except Exception:
        row_dict = {}

    # Revocar el JTI viejo + emitir token nuevo con nuevo JTI
    old_token = get_token_from_request()
    old_payload = decode_token(old_token) if old_token else None
    if old_payload and old_payload.get('jti'):
        revoke_token(old_payload['jti'], user_id=user.get('user_id'),
                     reason='refresh',
                     expires_at=datetime.utcfromtimestamp(old_payload['exp']).isoformat()
                         if old_payload.get('exp') else None)

    new_token = generate_token(user)
    return success_response({
        'token': new_token,
        'user': serialize_user({
            **user,
            'desired_role': row_dict.get('desired_role') or '',
            'email_verified': bool(row_dict.get('email_verified')),
            'membership_expires_at': row_dict.get('membership_expires_at'),
        }),
    }, message='Token refrescado')


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
        return error_response('Usuario no encontrado',
                              code=ErrorCodes.UNAUTHORIZED, status_code=401)

    # Enriquecer con email_verified + membership_expires_at + desired_role
    extras = {}
    try:
        auth_conn = get_auth_connection(sqlite3.Row)
        auth_cursor = auth_conn.cursor()
        auth_cursor.execute(
            "SELECT desired_role, email_verified, membership_expires_at "
            "FROM users WHERE id = ?",
            [user.get('user_id')],
        )
        row = auth_cursor.fetchone()
        auth_conn.close()
        if row:
            d = dict(row)
            extras['desired_role'] = d.get('desired_role') or ''
            extras['email_verified'] = bool(d.get('email_verified'))
            extras['membership_expires_at'] = d.get('membership_expires_at')
    except Exception:
        pass

    # OMV-1: shape canónico via serialize_user (autocomplete desde clinical.db).
    merged_user = serialize_user({**user, **extras})
    return success_response({'user': merged_user})


# =====================================================================
# Verification + password reset (Fix 12 — OMV-16, OMV-78)
# =====================================================================

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """
    Confirma el email del usuario usando el token mandado por mail.

    Body: { "token": "<verification_token>" }
    """
    data = request.get_json(silent=True) or {}
    token = (data.get('token') or '').strip()
    if not token:
        return error_response('token requerido',
                              code=ErrorCodes.VALIDATION_ERROR, status_code=400)
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, email, email_verified, email_verification_sent_at "
            "FROM users WHERE email_verification_token = ?",
            [token],
        )
        row = cursor.fetchone()
        if not row:
            conn.close()
            return error_response('Token de verificación inválido',
                                  code=ErrorCodes.NOT_FOUND, status_code=404)
        d = dict(row)
        if d.get('email_verified'):
            conn.close()
            return success_response({'verified': True},
                                    message='El email ya estaba verificado')
        # Expiración del token
        sent_at = d.get('email_verification_sent_at')
        if sent_at:
            try:
                sent_dt = datetime.fromisoformat(str(sent_at).replace(' ', 'T'))
                if (datetime.utcnow() - sent_dt) > timedelta(days=_VERIFY_TOKEN_DAYS):
                    conn.close()
                    return error_response('Token expirado. Pedí uno nuevo.',
                                          code='TOKEN_EXPIRED', status_code=400)
            except Exception:
                pass

        cursor.execute(
            "UPDATE users SET email_verified = 1, email_verification_token = NULL "
            "WHERE id = ?", [d['id']],
        )
        conn.commit()
        conn.close()
        _log_audit(d['id'], d['email'], 'email_verified',
                   'Email confirmado por el usuario', request.remote_addr)
        return success_response({'verified': True},
                                message='Email verificado.')
    except Exception as e:
        return error_response(f'Error: {e}',
                              code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """
    Genera un nuevo token de verificación de email y lo encola en email_outbox.
    Body: { "email": "..." }. Devuelve 200 incluso si el email no existe
    (anti-enumeración).
    """
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    if not email:
        return error_response('email requerido',
                              code=ErrorCodes.VALIDATION_ERROR, status_code=400)
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute("SELECT id, display_name, email_verified FROM users "
                       "WHERE LOWER(email) = ?", [email])
        row = cursor.fetchone()
        if row and not dict(row).get('email_verified'):
            token = secrets.token_urlsafe(32)
            cursor.execute(
                "UPDATE users SET email_verification_token = ?, "
                "email_verification_sent_at = CURRENT_TIMESTAMP WHERE id = ?",
                [token, dict(row)['id']],
            )
            conn.commit()
            _queue_email(
                email,
                'Verificá tu email — Omega Medicina',
                f'Hola {dict(row).get("display_name") or ""},\n\n'
                f'Confirmá tu email entrando a:\n'
                f'https://omegamedicina.pythonanywhere.com/verify-email?token={token}\n\n'
                f'El link expira en {_VERIFY_TOKEN_DAYS} días.',
                template='verify_email',
            )
        conn.close()
        return success_response({'sent': True},
                                message='Si el email existe, te llegará el link.')
    except Exception as e:
        return error_response(f'Error: {e}',
                              code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Inicia el reset. Genera un password_reset_token y lo encola en email_outbox.
    Devuelve 200 siempre (anti-enumeración).
    Body: { "email": "..." }
    """
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    if not email:
        return error_response('email requerido',
                              code=ErrorCodes.VALIDATION_ERROR, status_code=400)
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute("SELECT id, display_name FROM users WHERE LOWER(email) = ?", [email])
        row = cursor.fetchone()
        if row:
            uid = dict(row)['id']
            display = dict(row).get('display_name') or ''
            token = secrets.token_urlsafe(32)
            expires_at = (datetime.utcnow() + timedelta(hours=_RESET_TOKEN_HOURS)).isoformat()
            cursor.execute(
                "INSERT INTO password_reset_tokens (token, user_id, expires_at) "
                "VALUES (?, ?, ?)", [token, uid, expires_at],
            )
            conn.commit()
            _queue_email(
                email,
                'Recuperá tu contraseña — Omega Medicina',
                f'Hola {display},\n\n'
                f'Para resetear tu contraseña, entrá a:\n'
                f'https://omegamedicina.pythonanywhere.com/reset-password?token={token}\n\n'
                f'El link expira en {_RESET_TOKEN_HOURS} horas.',
                template='forgot_password',
            )
        conn.close()
        return success_response({'sent': True},
                                message='Si el email existe, te llegará el link.')
    except Exception as e:
        return error_response(f'Error: {e}',
                              code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Aplica el reset usando el token recibido por mail.
    Body: { "token": "...", "new_password": "..." }
    """
    data = request.get_json(silent=True) or {}
    token = (data.get('token') or '').strip()
    new_password = (data.get('new_password') or '').strip()
    if not token or not new_password:
        return error_response('token y new_password requeridos',
                              code=ErrorCodes.VALIDATION_ERROR, status_code=400)
    if len(new_password) < 8:
        return error_response('La nueva contraseña debe tener al menos 8 caracteres',
                              code=ErrorCodes.VALIDATION_ERROR, status_code=400)
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token = ?",
            [token],
        )
        row = cursor.fetchone()
        if not row:
            conn.close()
            return error_response('Token inválido',
                                  code=ErrorCodes.NOT_FOUND, status_code=404)
        d = dict(row)
        if d.get('used_at'):
            conn.close()
            return error_response('Token ya usado',
                                  code='TOKEN_USED', status_code=400)
        try:
            if datetime.fromisoformat(str(d['expires_at']).replace(' ', 'T')) < datetime.utcnow():
                conn.close()
                return error_response('Token expirado',
                                      code='TOKEN_EXPIRED', status_code=400)
        except Exception:
            pass
        # Aplicar
        new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute("UPDATE users SET password_hash = ?, failed_login_count = 0 WHERE id = ?",
                       [new_hash, d['user_id']])
        cursor.execute(
            "UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = ?",
            [token],
        )
        conn.commit()
        conn.close()
        _log_audit(d['user_id'], '', 'password_reset',
                   'Reset de contraseña con token', request.remote_addr)
        return success_response({'reset': True},
                                message='Contraseña actualizada.')
    except Exception as e:
        return error_response(f'Error: {e}',
                              code=ErrorCodes.INTERNAL_ERROR, status_code=500)


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
