import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { Avatar } from './atoms'
import { adminService } from '../services/adminService'
import { ApiError } from '../services/apiClient'
import type { PendingUser } from '../types/api'

interface Props {
  user: PendingUser | null
  onClose: () => void
  onApproved: () => void
}

/** Minimal approve flow.
 *
 *  The v3 backend (`admin/routes.py:approve_user`) only runs:
 *      UPDATE users SET status = 'active' WHERE id = ?
 *  No payment, membership window, or email gate is persisted today, so the
 *  sheet sticks to the single irreversible action and offers an optional
 *  internal note for the audit log entry the admin can review later.
 */
export function AdminApproveSheet({ user, onClose, onApproved }: Props) {
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setNotes('')
      setSubmitting(false)
      setError(null)
    }
  }, [user])

  if (!user) return null

  const submit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      // Note: the backend ignores any payload fields besides validating the
      // user id. We pass an empty body to match the contract exactly.
      await adminService.approveUser(user.id, {})
      onApproved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos aprobar al usuario.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet adm-sheet">
        <div className="sheet-handle" />
        <div className="adm-sheet-head">
          <Avatar name={user.display_name || user.email} size={42} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="adm-sheet-name">Aprobar a {user.display_name || user.email}</div>
            <div className="adm-sheet-meta">{user.email}</div>
          </div>
          <button type="button" className="adm-sheet-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="card" style={{ background: 'rgba(125,140,255,0.05)', borderColor: 'rgba(125,140,255,0.2)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Activa la cuenta para que el usuario pueda iniciar sesión. El backend todavía
            no maneja membresías, pagos ni notificaciones por email — esa lógica se sumará
            cuando estén los endpoints correspondientes.
          </p>
        </div>

        <div className="adm-field">
          <label className="adm-field-label">Nota interna (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contexto para vos / el resto del equipo (no se persiste todavía)."
            rows={2}
            className="adm-input"
          />
        </div>

        {error && <div className="adm-error">{error}</div>}

        <button
          type="button"
          className="btn btn-primary btn-full adm-submit"
          onClick={submit}
          disabled={submitting}
        >
          <Icon name="check" size={14} />
          {submitting ? ' Aprobando…' : ' Confirmar aprobación'}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-full"
          onClick={onClose}
          disabled={submitting}
          style={{ marginTop: 8 }}
        >
          Cancelar
        </button>
      </div>
    </>
  )
}
