import { useState } from 'react'
import { Icon } from './Icon'
import { goalService } from '../services/goalService'
import { ApiError } from '../services/apiClient'
import type { Goal, Measurement } from '../types/api'

interface Props {
  goal: Goal
  userId: number | string
  /** Optional last measurement so the sheet can show current → target deltas. */
  latestMeasurement?: Measurement | null
  onClose: () => void
  onAccepted: () => void
  onRejected: () => void
}

const CATEGORIA_LABEL: Record<string, string> = {
  recomposicion: 'Recomposición',
  volumen: 'Volumen',
  definicion: 'Definición',
  mantenimiento: 'Mantenimiento',
}

function formatDate(iso?: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return iso
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function AcceptGoalSheet({
  goal,
  userId,
  latestMeasurement,
  onClose,
  onAccepted,
  onRejected,
}: Props) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const targets: { k: string; v: number | null; current: number | null | undefined; u: string; c: string }[] = [
    { k: 'Peso', v: goal.peso_objetivo, current: latestMeasurement?.peso, u: 'kg', c: 'var(--analytic)' },
    { k: '% Grasa', v: goal.bf_objetivo, current: latestMeasurement?.bf_percent, u: '%', c: 'var(--medic)' },
    { k: 'FFMI', v: goal.ffmi_objetivo, current: latestMeasurement?.ffmi, u: '', c: 'var(--ok)' },
  ].filter((t) => t.v != null)

  const handleAccept = async () => {
    setError(null)
    setSubmitting(true)
    try {
      await goalService.accept(userId, goal.id)
      onAccepted()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos aceptar el objetivo.')
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    setError(null)
    if (!rejectReason.trim()) {
      setError('Contanos brevemente por qué lo rechazás.')
      return
    }
    setSubmitting(true)
    try {
      await goalService.reject(userId, goal.id, rejectReason.trim())
      onRejected()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos rechazar el objetivo.')
      setSubmitting(false)
    }
  }

  const plazo = goal.fecha_objetivo
    ? `Para ${formatDate(goal.fecha_objetivo)}`
    : goal.meses_estimados
      ? `~ ${goal.meses_estimados} mes${goal.meses_estimados === 1 ? '' : 'es'}`
      : null

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet adm-sheet" role="dialog" aria-label="Aceptar objetivo">
        <div className="sheet-handle" />
        <div className="adm-sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="adm-sheet-name">Objetivo propuesto</div>
            <div className="adm-sheet-meta">
              Tu profesional armó este plan. Aceptalo o rechazalo con un comentario.
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

        {/* Categoría + plazo header */}
        <div className="row-between">
          <div
            className="mono"
            style={{ color: 'var(--analytic)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}
          >
            {CATEGORIA_LABEL[goal.categoria || ''] || goal.categoria || 'Objetivo'}
          </div>
          {plazo && (
            <div className="mono" style={{ color: 'var(--text-3)', fontSize: 11 }}>
              {plazo}
            </div>
          )}
        </div>

        {/* Targets */}
        {targets.length > 0 ? (
          <div className="goal-targets">
            {targets.map((t) => {
              const d = t.current != null && t.v != null ? t.v - t.current : null
              return (
                <div key={t.k} className="goal-target">
                  <div className="mono" style={{ color: 'var(--text-3)' }}>
                    {t.k}
                  </div>
                  <div className="goal-target-row">
                    {t.current != null && (
                      <span style={{ color: 'var(--text-3)' }}>{t.current.toFixed(1)} →</span>
                    )}
                    <span style={{ color: t.c, fontWeight: 600 }}>
                      {t.v!.toFixed(1)}
                      {t.u}
                    </span>
                    {d != null && Math.abs(d) >= 0.05 && (
                      <span
                        className="goal-target-delta"
                        style={{ color: d > 0 ? 'var(--ok)' : 'var(--omega)' }}
                      >
                        ({d > 0 ? '+' : ''}
                        {d.toFixed(1)})
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>
            Sin targets numéricos definidos en este objetivo.
          </p>
        )}

        {goal.notas && (
          <p className="goal-notas">{goal.notas}</p>
        )}

        {error && <div className="adm-error">{error}</div>}

        {!showRejectForm && (
          <>
            <button
              type="button"
              className="btn btn-primary btn-full adm-submit"
              onClick={handleAccept}
              disabled={submitting}
              style={{ background: 'var(--ok)', color: '#0a1a0a' }}
            >
              <Icon name="check" size={14} /> {submitting ? 'Guardando…' : 'Aceptar objetivo'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-full"
              onClick={() => setShowRejectForm(true)}
              disabled={submitting}
              style={{ marginTop: 8 }}
            >
              Rechazar
            </button>
          </>
        )}

        {showRejectForm && (
          <>
            <div className="adm-field">
              <label className="adm-field-label">Motivo del rechazo</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej: el plazo es muy corto, prefiero un objetivo distinto, etc."
                rows={3}
                className="adm-input"
                autoFocus
              />
            </div>
            <button
              type="button"
              className="btn btn-full adm-reject-submit"
              onClick={handleReject}
              disabled={submitting}
            >
              {submitting ? 'Rechazando…' : 'Confirmar rechazo'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-full"
              onClick={() => { setShowRejectForm(false); setRejectReason(''); setError(null) }}
              disabled={submitting}
              style={{ marginTop: 8 }}
            >
              Volver
            </button>
          </>
        )}
      </div>
    </>
  )
}
