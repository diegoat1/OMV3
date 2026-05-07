import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { Avatar } from './atoms'
import { adminService } from '../services/adminService'
import { ApiError } from '../services/apiClient'
import type { PendingUser } from '../types/api'

interface Props {
  user: PendingUser | null
  onClose: () => void
  onRejected: () => void
}

export function AdminRejectSheet({ user, onClose, onRejected }: Props) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setReason('')
      setSubmitting(false)
      setError(null)
    }
  }, [user])

  if (!user) return null

  const submit = async () => {
    setError(null)
    if (!reason.trim()) {
      setError('Ingresá un motivo para rechazar.')
      return
    }
    setSubmitting(true)
    try {
      await adminService.rejectUser(user.id, { reason: reason.trim() })
      onRejected()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos rechazar al usuario.')
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
            <div className="adm-sheet-name">Rechazar a {user.display_name || user.email}</div>
            <div className="adm-sheet-meta">
              El usuario recibirá un email con el motivo.
            </div>
          </div>
          <button type="button" className="adm-sheet-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="adm-field">
          <label className="adm-field-label">Motivo</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Información incompleta, datos inválidos, etc."
            rows={4}
            className="adm-input"
            autoFocus
          />
        </div>

        {error && <div className="adm-error">{error}</div>}

        <button
          type="button"
          className="btn btn-full adm-reject-submit"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? 'Rechazando…' : 'Confirmar rechazo'}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-full"
          onClick={onClose}
          style={{ marginTop: 8 }}
        >
          Cancelar
        </button>
      </div>
    </>
  )
}
