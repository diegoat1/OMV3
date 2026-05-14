import { useState } from 'react'
import { Icon } from './Icon'
import { assignmentService } from '../services/assignmentService'
import { ApiError } from '../services/apiClient'

interface Props {
  /** Label of the subject ("paciente" o "atleta") used for copy. */
  subjectSingular?: string
  onClose: () => void
  onCreated: () => void
}

export function AddPatientSheet({ subjectSingular = 'paciente', onClose, onCreated }: Props) {
  const [query, setQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    setOkMsg(null)
    const trimmed = query.trim()
    if (!trimmed) {
      setError(`Indicá el email o nombre del ${subjectSingular}.`)
      return
    }
    setSubmitting(true)
    try {
      // The backend's `query` field disambiguates: looks like an email → email;
      // pure digits → legacy DNI; otherwise → display_name LIKE.
      const res = await assignmentService.specialistRequest({ query: trimmed })
      setOkMsg(`Solicitud enviada a ${res.patient_name}. Tiene que aceptarla.`)
      setTimeout(() => { onCreated() }, 900)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos enviar la solicitud.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet adm-sheet" role="dialog" aria-label={`Agregar ${subjectSingular}`}>
        <div className="sheet-handle" />
        <div className="adm-sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="adm-sheet-name">
              Agregar {subjectSingular}
            </div>
            <div className="adm-sheet-meta">
              Le mandamos una solicitud para vincularse. Tiene que aceptarla desde su cuenta.
            </div>
          </div>
          <button
            type="button"
            className="adm-sheet-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="adm-field">
          <label className="adm-field-label">Email o nombre</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ej: maria@email.com  ·  Pérez, María"
            className="adm-input"
            autoFocus
            disabled={submitting}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          />
          <p className="mono" style={{ fontSize: 10, color: 'var(--text-3)', margin: '6px 2px 0' }}>
            Ingresá el email registrado o el nombre completo (apellido, nombre).
          </p>
        </div>

        {error && <div className="adm-error">{error}</div>}
        {okMsg && (
          <div className="adm-error" style={{ background: 'rgba(60,200,140,0.08)', color: 'var(--ok)', borderColor: 'rgba(60,200,140,0.3)' }}>
            {okMsg}
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary btn-full adm-submit"
          onClick={submit}
          disabled={submitting || !!okMsg}
        >
          {submitting ? 'Enviando…' : okMsg ? '✓ Enviada' : 'Enviar solicitud'}
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
