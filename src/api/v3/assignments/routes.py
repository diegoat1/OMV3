"""
ASSIGNMENTS Routes - Specialist-Patient assignment flow

Flow:
1. Doctor/specialist requests assignment by patient DNI
2. Patient sees pending request and accepts or rejects
3. Once accepted, the specialist can see the patient in their list
"""

from flask import request
from . import assignments_bp
from ..common.responses import success_response, error_response, ErrorCodes
from ..common.auth import require_auth, get_current_user
from ..common.database import get_auth_connection
import sqlite3
from datetime import datetime


SPECIALIST_ROLES = ('doctor', 'nutricionista', 'entrenador')


def _has_specialist_role(role_str):
    """Check if comma-separated role string contains any specialist role."""
    roles = set(r.strip() for r in (role_str or '').split(','))
    return bool(roles & set(SPECIALIST_ROLES))


def _get_specialist_role(role_str):
    """Return the first specialist role found."""
    roles = [r.strip() for r in (role_str or '').split(',')]
    for r in roles:
        if r in SPECIALIST_ROLES:
            return r
    return None


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


@assignments_bp.route('/request', methods=['POST'])
@require_auth
def request_assignment():
    """
    Specialist requests to be assigned to a patient by DNI.

    Body: { "patient_dni": "12345678" }

    The specialist must have a specialist role (doctor, nutricionista, entrenador).
    The patient must exist in auth.db (via patient_user_link).
    Creates a pending request the patient must accept.
    """
    user = get_current_user()
    data = request.get_json() or {}
    patient_dni = (data.get('patient_dni') or '').strip()

    if not patient_dni:
        return error_response('DNI del paciente es requerido', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    # Verify specialist has correct role
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("SELECT id, display_name, role FROM users WHERE id = ?", [user['user_id']])
        specialist = cursor.fetchone()
        if not specialist:
            conn.close()
            return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        spec = dict(specialist)
        if not _has_specialist_role(spec['role']):
            conn.close()
            return error_response(
                'Solo profesionales (médico, nutricionista, entrenador) pueden solicitar asignación',
                code=ErrorCodes.FORBIDDEN, status_code=403
            )

        spec_role = _get_specialist_role(spec['role'])

        # Find patient by DNI
        cursor.execute("""
            SELECT u.id, u.display_name, u.is_active, l.patient_dni
            FROM users u
            JOIN patient_user_link l ON u.id = l.user_id
            WHERE l.patient_dni = ?
        """, [patient_dni])
        patient = cursor.fetchone()

        if not patient:
            conn.close()
            return error_response(
                'No se encontró un paciente con ese documento',
                code=ErrorCodes.NOT_FOUND, status_code=404
            )

        pat = dict(patient)

        # Can't assign to yourself
        if str(pat['id']) == str(user['user_id']):
            conn.close()
            return error_response('No podés asignarte a vos mismo', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

        # Check for existing pending or accepted assignment
        cursor.execute("""
            SELECT id, status FROM specialist_assignments
            WHERE specialist_id = ? AND patient_id = ? AND status IN ('pending_patient', 'accepted')
        """, [spec['id'], pat['id']])
        existing = cursor.fetchone()

        if existing:
            ex = dict(existing)
            if ex['status'] == 'accepted':
                conn.close()
                return error_response('Ya estás asignado a este paciente', code=ErrorCodes.VALIDATION_ERROR, status_code=409)
            else:
                conn.close()
                return error_response('Ya existe una solicitud pendiente para este paciente', code=ErrorCodes.VALIDATION_ERROR, status_code=409)

        # Create the assignment request
        now = datetime.utcnow().isoformat()
        cursor.execute("""
            INSERT INTO specialist_assignments
                (specialist_id, specialist_name, specialist_role, patient_id, patient_name, patient_dni, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'pending_patient', ?, ?)
        """, [spec['id'], spec['display_name'], spec_role, pat['id'], pat['display_name'] or '', patient_dni, now, now])

        assignment_id = cursor.lastrowid
        conn.commit()
        conn.close()

        _log_audit(
            spec['id'], spec['display_name'],
            'assignment_requested',
            f'{spec["display_name"]} solicitó asignación al paciente {pat["display_name"]} (DNI {patient_dni})',
            request.remote_addr
        )

        return success_response({
            'assignment_id': assignment_id,
            'patient_name': pat['display_name'],
            'status': 'pending_patient'
        }, message=f'Solicitud enviada. {pat["display_name"]} debe aceptar la asignación.')

    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@assignments_bp.route('/my-requests', methods=['GET'])
@require_auth
def my_requests():
    """
    Returns outgoing assignment requests for the current specialist.
    """
    user = get_current_user()
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, specialist_id, specialist_name, specialist_role,
                   patient_id, patient_name, patient_dni, status, created_at, updated_at
            FROM specialist_assignments
            WHERE specialist_id = ?
            ORDER BY created_at DESC
        """, [user['user_id']])
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return success_response({'requests': rows})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@assignments_bp.route('/pending', methods=['GET'])
@require_auth
def pending_for_patient():
    """
    Returns pending assignment requests for the current patient.
    """
    user = get_current_user()
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, specialist_id, specialist_name, specialist_role,
                   patient_id, patient_name, patient_dni, status, created_at
            FROM specialist_assignments
            WHERE patient_id = ? AND status = 'pending_patient'
            ORDER BY created_at DESC
        """, [user['user_id']])
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return success_response({'pending': rows})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@assignments_bp.route('/<int:assignment_id>/accept', methods=['POST'])
@require_auth
def accept_assignment(assignment_id):
    """
    Patient accepts a pending assignment request.
    """
    user = get_current_user()
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, specialist_id, specialist_name, patient_id, patient_name, status
            FROM specialist_assignments WHERE id = ?
        """, [assignment_id])
        row = cursor.fetchone()

        if not row:
            conn.close()
            return error_response('Solicitud no encontrada', code=ErrorCodes.NOT_FOUND, status_code=404)

        a = dict(row)

        if str(a['patient_id']) != str(user['user_id']):
            conn.close()
            return error_response('No tenés permiso para esta acción', code=ErrorCodes.FORBIDDEN, status_code=403)

        if a['status'] != 'pending_patient':
            conn.close()
            return error_response('Esta solicitud ya fue procesada', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

        now = datetime.utcnow().isoformat()
        cursor.execute("UPDATE specialist_assignments SET status = 'accepted', updated_at = ? WHERE id = ?", [now, assignment_id])
        conn.commit()
        conn.close()

        _log_audit(
            a['patient_id'], a['patient_name'],
            'assignment_accepted',
            f'{a["patient_name"]} aceptó a {a["specialist_name"]} como especialista',
            request.remote_addr
        )

        return success_response({'assignment_id': assignment_id, 'status': 'accepted'},
                                message=f'Aceptaste a {a["specialist_name"]} como tu especialista.')

    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@assignments_bp.route('/<int:assignment_id>/reject', methods=['POST'])
@require_auth
def reject_assignment(assignment_id):
    """
    Patient rejects a pending assignment request.
    """
    user = get_current_user()
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, specialist_id, specialist_name, patient_id, patient_name, status
            FROM specialist_assignments WHERE id = ?
        """, [assignment_id])
        row = cursor.fetchone()

        if not row:
            conn.close()
            return error_response('Solicitud no encontrada', code=ErrorCodes.NOT_FOUND, status_code=404)

        a = dict(row)

        if str(a['patient_id']) != str(user['user_id']):
            conn.close()
            return error_response('No tenés permiso para esta acción', code=ErrorCodes.FORBIDDEN, status_code=403)

        if a['status'] != 'pending_patient':
            conn.close()
            return error_response('Esta solicitud ya fue procesada', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

        now = datetime.utcnow().isoformat()
        cursor.execute("UPDATE specialist_assignments SET status = 'rejected', updated_at = ? WHERE id = ?", [now, assignment_id])
        conn.commit()
        conn.close()

        _log_audit(
            a['patient_id'], a['patient_name'],
            'assignment_rejected',
            f'{a["patient_name"]} rechazó a {a["specialist_name"]}',
            request.remote_addr
        )

        return success_response({'assignment_id': assignment_id, 'status': 'rejected'},
                                message='Solicitud rechazada.')

    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@assignments_bp.route('/specialists', methods=['GET'])
@require_auth
def list_available_specialists():
    """
    Returns approved specialists the patient can browse and request a link to.

    Query params:
      - role: filter by 'doctor' | 'nutricionista' | 'entrenador'
      - q: search by display_name or email (LIKE %q%)

    Returns: { specialists: [{ id, display_name, email, roles[] }], total }

    Excludes:
      - The caller itself
      - Users not active / not status='active' (i.e. pending or rejected)
      - Admins (admin-only role)
      - Specialists already accepted-linked to the caller (to avoid duplicates)
    """
    user = get_current_user()
    role_filter = (request.args.get('role') or '').strip().lower()
    q = (request.args.get('q') or '').strip()

    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        # Match users whose comma-separated role contains any specialist role.
        # The role column holds CSV strings like "doctor,user" or
        # "admin,doctor,nutricionista". SQLite has no easy CSV-element match,
        # so we filter in Python after a coarse LIKE prefilter on the role
        # column.
        params = [user['user_id']]
        query = """
            SELECT id, email, display_name, role, status, is_active
            FROM users
            WHERE id != ?
              AND is_active = 1
              AND status = 'active'
              AND (role LIKE '%doctor%' OR role LIKE '%nutricionista%' OR role LIKE '%entrenador%')
        """
        if q:
            query += " AND (display_name LIKE ? OR email LIKE ?)"
            qparam = f'%{q}%'
            params.extend([qparam, qparam])

        cursor.execute(query, params)
        all_rows = [dict(r) for r in cursor.fetchall()]

        # Strip admins (role contains 'admin') from the list — admins aren't
        # bookable as clinical specialists from the patient flow.
        def specialist_roles(role_csv):
            parts = [r.strip().lower() for r in (role_csv or '').split(',')]
            allowed = {'doctor', 'nutricionista', 'entrenador'}
            return [r for r in parts if r in allowed]

        # Build specialists list with their specialist roles only
        specialists = []
        for r in all_rows:
            roles = specialist_roles(r['role'])
            if not roles:
                continue
            # Optional role filter
            if role_filter and role_filter not in roles:
                continue
            specialists.append({
                'id': r['id'],
                'display_name': r['display_name'] or r['email'],
                'email': r['email'],
                'roles': roles,
            })

        # Exclude specialists already accepted-linked to the caller (patient)
        cursor.execute("""
            SELECT specialist_id FROM specialist_assignments
            WHERE patient_id = ? AND status = 'accepted'
        """, [user['user_id']])
        already_linked = {row['specialist_id'] for row in cursor.fetchall()}
        specialists = [s for s in specialists if s['id'] not in already_linked]

        conn.close()
        return success_response({
            'specialists': specialists,
            'total': len(specialists),
        })

    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@assignments_bp.route('/patient-request', methods=['POST'])
@require_auth
def patient_request_specialist():
    """
    Patient-initiated link request. Creates an assignment with
    status='pending_specialist' (waiting for the specialist to accept).

    Body: { specialist_id: int, specialist_role?: 'doctor'|'nutricionista'|'entrenador' }

    The specialist_role is recorded on the assignment when the specialist offers
    multiple roles (e.g. doctor+nutricionista) so they know which capacity the
    patient is requesting.
    """
    user = get_current_user()
    data = request.get_json() or {}
    specialist_id = data.get('specialist_id')
    requested_role = (data.get('specialist_role') or '').strip().lower() or None

    if not specialist_id:
        return error_response('specialist_id es requerido',
                              code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        # Verify caller is a patient (anyone non-admin can request — but they
        # can't request to themselves)
        if str(specialist_id) == str(user['user_id']):
            conn.close()
            return error_response('No podés solicitarte a vos mismo',
                                  code=ErrorCodes.VALIDATION_ERROR, status_code=400)

        # Verify specialist exists, is active, and has a specialist role
        cursor.execute("""
            SELECT id, display_name, role, is_active, status
            FROM users WHERE id = ?
        """, [specialist_id])
        spec = cursor.fetchone()
        if not spec:
            conn.close()
            return error_response('Especialista no encontrado',
                                  code=ErrorCodes.NOT_FOUND, status_code=404)
        spec = dict(spec)
        if not spec['is_active'] or spec['status'] != 'active':
            conn.close()
            return error_response('Especialista no activo',
                                  code=ErrorCodes.VALIDATION_ERROR, status_code=400)
        if not _has_specialist_role(spec['role']):
            conn.close()
            return error_response('El usuario indicado no es un especialista',
                                  code=ErrorCodes.VALIDATION_ERROR, status_code=400)

        spec_role = requested_role if requested_role in ('doctor', 'nutricionista', 'entrenador') else _get_specialist_role(spec['role'])

        # Block duplicates: don't create another pending/accepted for the same pair+role
        cursor.execute("""
            SELECT id, status FROM specialist_assignments
            WHERE patient_id = ? AND specialist_id = ?
              AND status IN ('pending_patient', 'pending_specialist', 'accepted')
        """, [user['user_id'], specialist_id])
        existing = cursor.fetchone()
        if existing:
            ex = dict(existing)
            if ex['status'] == 'accepted':
                conn.close()
                return error_response('Ya estás vinculado a este especialista',
                                      code=ErrorCodes.VALIDATION_ERROR, status_code=409)
            conn.close()
            return error_response('Ya existe una solicitud pendiente con este especialista',
                                  code=ErrorCodes.VALIDATION_ERROR, status_code=409)

        # Resolve patient name + DNI
        patient_name = user.get('nombre_apellido') or ''
        patient_dni = user.get('dni') or ''

        now = datetime.utcnow().isoformat()
        cursor.execute("""
            INSERT INTO specialist_assignments
                (specialist_id, specialist_name, specialist_role,
                 patient_id, patient_name, patient_dni,
                 status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'pending_specialist', ?, ?)
        """, [
            specialist_id, spec['display_name'] or '', spec_role,
            user['user_id'], patient_name, patient_dni,
            now, now,
        ])
        assignment_id = cursor.lastrowid
        conn.commit()
        conn.close()

        _log_audit(
            user['user_id'], patient_name,
            'patient_requested_specialist',
            f'{patient_name} solicitó vincularse con {spec["display_name"]} ({spec_role})',
            request.remote_addr
        )

        return success_response({
            'assignment_id': assignment_id,
            'status': 'pending_specialist',
            'specialist_name': spec['display_name'],
            'specialist_role': spec_role,
        }, message='Solicitud enviada. El especialista debe aceptarla.', status_code=201)

    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@assignments_bp.route('/my-outgoing-requests', methods=['GET'])
@require_auth
def my_outgoing_requests():
    """
    Returns outgoing assignment requests sent by the current patient
    (waiting for the specialist to accept). Mirror of /my-requests for the
    patient side. Used by PatientHome to show "Solicitudes enviadas".
    """
    user = get_current_user()
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, specialist_id, specialist_name, specialist_role,
                   patient_id, patient_name, patient_dni, status, created_at, updated_at
            FROM specialist_assignments
            WHERE patient_id = ? AND status = 'pending_specialist'
            ORDER BY created_at DESC
        """, [user['user_id']])
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return success_response({'requests': rows})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@assignments_bp.route('/my-specialists', methods=['GET'])
@require_auth
def my_specialists():
    """
    Returns accepted specialists for the current patient.
    """
    user = get_current_user()
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, specialist_id, specialist_name, specialist_role, created_at, updated_at
            FROM specialist_assignments
            WHERE patient_id = ? AND status = 'accepted'
            ORDER BY updated_at DESC
        """, [user['user_id']])
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return success_response({'specialists': rows})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@assignments_bp.route('/my-patients', methods=['GET'])
@require_auth
def my_patients():
    """
    Returns accepted patients for the current specialist.
    """
    user = get_current_user()
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT MIN(sa.id) as id, sa.patient_id, sa.patient_name, sa.patient_dni,
                   sa.status, MAX(sa.created_at) as created_at, MAX(sa.updated_at) as updated_at,
                   u.email as patient_email, u.is_active as patient_active
            FROM specialist_assignments sa
            JOIN users u ON u.id = sa.patient_id
            WHERE sa.specialist_id = ? AND sa.status = 'accepted'
            GROUP BY sa.patient_id
            ORDER BY sa.patient_name ASC
        """, [user['user_id']])
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return success_response({'patients': rows})
    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@assignments_bp.route('/<int:assignment_id>/cancel', methods=['POST'])
@require_auth
def cancel_assignment(assignment_id):
    """
    Cancels a pending or accepted assignment.

    Who may cancel:
      - The specialist (their outgoing requests + accepted assignments).
      - The patient (their outgoing requests in 'pending_specialist').
      - Admin.
    """
    user = get_current_user()
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM specialist_assignments WHERE id = ?", [assignment_id])
        row = cursor.fetchone()
        if not row:
            conn.close()
            return error_response('Solicitud no encontrada', code=ErrorCodes.NOT_FOUND, status_code=404)

        a = dict(row)
        uid = str(user['user_id'])
        is_specialist = str(a['specialist_id']) == uid
        # Patient can only cancel their OWN outgoing requests (pending_specialist)
        is_patient_cancelling_own = (
            str(a['patient_id']) == uid and a['status'] == 'pending_specialist'
        )

        if not (is_specialist or is_patient_cancelling_own or user.get('is_admin')):
            conn.close()
            return error_response('No tenés permiso', code=ErrorCodes.FORBIDDEN, status_code=403)

        if a['status'] in ('rejected', 'cancelled'):
            conn.close()
            return error_response('Ya fue cancelada o rechazada', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

        now = datetime.utcnow().isoformat()
        cursor.execute("UPDATE specialist_assignments SET status = 'cancelled', updated_at = ? WHERE id = ?", [now, assignment_id])
        conn.commit()
        conn.close()

        actor_label = 'Paciente' if is_patient_cancelling_own else 'Especialista'
        target_label = a['specialist_name'] if is_patient_cancelling_own else a['patient_name']
        _log_audit(
            user['user_id'], user.get('nombre_apellido', actor_label),
            'assignment_cancelled',
            f'Canceló asignación ID {assignment_id} con {target_label}',
            request.remote_addr
        )

        return success_response({'assignment_id': assignment_id, 'status': 'cancelled'}, message='Asignación cancelada.')

    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@assignments_bp.route('/unassign-patient/<int:patient_id>', methods=['POST'])
@require_auth
def unassign_patient(patient_id):
    """
    Specialist unassigns a patient — cancels ALL accepted assignments for that patient_id.
    """
    user = get_current_user()
    try:
        conn = get_auth_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, patient_name FROM specialist_assignments
            WHERE specialist_id = ? AND patient_id = ? AND status = 'accepted'
        """, [user['user_id'], patient_id])
        rows = cursor.fetchall()

        if not rows:
            conn.close()
            return error_response('No hay asignaciones activas con este paciente',
                                  code=ErrorCodes.NOT_FOUND, status_code=404)

        now = datetime.utcnow().isoformat()
        ids = [r['id'] for r in rows]
        patient_name = rows[0]['patient_name']
        placeholders = ','.join('?' * len(ids))
        cursor.execute(
            f"UPDATE specialist_assignments SET status = 'cancelled', updated_at = ? WHERE id IN ({placeholders})",
            [now] + ids
        )
        conn.commit()
        conn.close()

        _log_audit(
            user['user_id'], user.get('nombre_apellido', 'Especialista'),
            'patient_unassigned',
            f'Desasignó al paciente {patient_name} (IDs: {ids})',
            request.remote_addr
        )

        return success_response(
            {'patient_id': patient_id, 'cancelled_count': len(ids)},
            message=f'Paciente {patient_name} desasignado correctamente.'
        )

    except Exception as e:
        return error_response(f'Error: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)
