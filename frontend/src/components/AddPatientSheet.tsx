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
  const [dni, setDni] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    setOkMsg(null)
    const trimmed = dni.trim()
    if (!trimmed) {
      setError('Ingresá el DNI del paciente.')
      return
    }
    setSubmitting(true)
    try {
      const res = await assignmentService.specialistRequest({ patient_dni: trimmed })
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
              Agregar {subjectSingular} por DNI
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
          <label className="adm-field-label">DNI</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="12345678"
            className="adm-input"
            autoFocus
            disabled={submitting}
          />
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
