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
    Specialist cancels a pending or accepted assignment.
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

        # Only the specialist or admin can cancel
        if str(a['specialist_id']) != str(user['user_id']) and not user.get('is_admin'):
            conn.close()
            return error_response('No tenés permiso', code=ErrorCodes.FORBIDDEN, status_code=403)

        if a['status'] in ('rejected', 'cancelled'):
            conn.close()
            return error_response('Ya fue cancelada o rechazada', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

        now = datetime.utcnow().isoformat()
        cursor.execute("UPDATE specialist_assignments SET status = 'cancelled', updated_at = ? WHERE id = ?", [now, assignment_id])
        conn.commit()
        conn.close()

        _log_audit(
            user['user_id'], user.get('nombre_apellido', 'Especialista'),
            'assignment_cancelled',
            f'Canceló asignación ID {assignment_id} con paciente {a["patient_name"]}',
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
