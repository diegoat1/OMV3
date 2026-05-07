import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { Avatar } from './atoms'
import { adminService } from '../services/adminService'
import { ApiError } from '../services/apiClient'
import type { ApprovePayload, PendingUser } from '../types/api'

interface Props {
  user: PendingUser | null
  onClose: () => void
  onApproved: () => void
}

const PAYMENT_METHODS = ['transferencia', 'efectivo', 'mercadopago', 'tarjeta'] as const
const CURRENCIES = ['ARS', 'USD'] as const

export function AdminApproveSheet({ user, onClose, onApproved }: Props) {
  const [registerPayment, setRegisterPayment] = useState(true)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>('ARS')
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>('transferencia')
  const [transactionRef, setTransactionRef] = useState('')
  const [notes, setNotes] = useState('')
  const [periodDays, setPeriodDays] = useState('30')
  const [forceEmail, setForceEmail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset on open
  useEffect(() => {
    if (user) {
      setRegisterPayment(true)
      setAmount('')
      setCurrency('ARS')
      setMethod('transferencia')
      setTransactionRef('')
      setNotes('')
      setPeriodDays('30')
      setForceEmail(false)
      setSubmitting(false)
      setError(null)
    }
  }, [user])

  if (!user) return null

  const submit = async () => {
    setError(null)
    const days = Number(periodDays)
    if (!Number.isFinite(days) || days < 1 || days > 3650) {
      setError('La duración de la membresía debe estar entre 1 y 3650 días.')
      return
    }
    const payload: ApprovePayload = {
      membership_period_days: days,
    }
    if (registerPayment) {
      const numericAmount = amount ? Number(amount) : undefined
      if (amount && (!Number.isFinite(numericAmount) || (numericAmount as number) < 0)) {
        setError('Monto inválido.')
        return
      }
      payload.payment = {
        ...(numericAmount !== undefined ? { amount: numericAmount } : {}),
        currency,
        payment_method: method,
        ...(transactionRef.trim() ? { transaction_ref: transactionRef.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }
    }
    if (!user.email_verified && forceEmail) {
      payload.force_email_verification = true
    }
    setSubmitting(true)
    try {
      await adminService.approveUser(user.id, payload)
      onApproved()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
        setError(
          'El usuario todavía no verificó su email. Activá la opción "Aprobar igual" para forzar.',
        )
      } else {
        setError(err instanceof ApiError ? err.message : 'No pudimos aprobar al usuario.')
      }
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
            <div className="adm-sheet-name">{user.display_name || user.email}</div>
            <div className="adm-sheet-meta">
              {user.email}
              {!user.email_verified && (
                <span className="adm-sheet-badge"> · email sin verificar</span>
              )}
            </div>
          </div>
          <button type="button" className="adm-sheet-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Membership */}
        <div className="sheet-section-label">Membresía</div>
        <div className="adm-field">
          <label className="adm-field-label">Duración (días)</label>
          <input
            type="number"
            min={1}
            max={3650}
            value={periodDays}
            onChange={(e) => setPeriodDays(e.target.value)}
            className="adm-input"
          />
        </div>

        {/* Payment toggle */}
        <div className="adm-toggle-row">
          <label className="adm-toggle">
            <input
              type="checkbox"
              checked={registerPayment}
              onChange={(e) => setRegisterPayment(e.target.checked)}
            />
            <span>Registrar pago</span>
          </label>
        </div>

        {registerPayment && (
          <>
            <div className="adm-field-row">
              <div className="adm-field" style={{ flex: 1 }}>
                <label className="adm-field-label">Monto</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="adm-input"
                />
              </div>
              <div className="adm-field" style={{ width: 100 }}>
                <label className="adm-field-label">Moneda</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as (typeof CURRENCIES)[number])}
                  className="adm-input"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Método</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as (typeof PAYMENT_METHODS)[number])}
                className="adm-input"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Referencia (opcional)</label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="ID de transacción / comprobante"
                className="adm-input"
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalles internos del pago"
                rows={2}
                className="adm-input"
              />
            </div>
          </>
        )}

        {!user.email_verified && (
          <div className="adm-toggle-row" style={{ marginTop: 8 }}>
            <label className="adm-toggle">
              <input
                type="checkbox"
                checked={forceEmail}
                onChange={(e) => setForceEmail(e.target.checked)}
              />
              <span>Aprobar igual (sin verificación de email)</span>
            </label>
          </div>
        )}

        {error && <div className="adm-error">{error}</div>}

        <button
          type="button"
          className="btn btn-primary btn-full adm-submit"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? 'Aprobando…' : 'Aprobar y registrar'}
        </button>
      </div>
    </>
  )
}
