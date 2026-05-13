import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { checkinService } from '../../services/checkinService'
import { ApiError } from '../../services/apiClient'

const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😄'] as const
const PAIN_LEVELS = ['No', 'Leve', 'Moderado', 'Fuerte'] as const
const PAIN_VALUES: Record<(typeof PAIN_LEVELS)[number], number> = {
  No: 0,
  Leve: 3,
  Moderado: 6,
  Fuerte: 9,
}

interface Props {
  onClose?: () => void
}

export function CheckIn({ onClose }: Props) {
  const [mood, setMood] = useState<number>(4)
  const [sleep, setSleep] = useState<number>(7.5)
  const [energy, setEnergy] = useState<number>(3)
  const [pain, setPain] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      // UI uses 1-5 scales; backend OMV-68 expects 0-10 ranges, so scale x2.
      await checkinService.submitToday({
        animo: mood * 2,
        energia: energy * 2,
        horas_sueno: sleep,
        dolor_abdominal: pain ? PAIN_VALUES[pain as (typeof PAIN_LEVELS)[number]] : 0,
        completado: 1,
      })
      onClose?.()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos guardar el check-in.')
      setSubmitting(false)
    }
  }

  return (
    <div className="checkin" data-mod="medicine">
      {/* Top bar — close + screen label. Acts as a modal-like header,
          separated by a divider so it reads as a contained sub-screen. */}
      <div className="checkin-top">
        <button
          type="button"
          className="checkin-close"
          aria-label="Cerrar"
          onClick={onClose}
        >
          <Icon name="x" size={22} />
        </button>
        <div className="mono">Check-in diario</div>
        <div className="checkin-top-spacer" />
      </div>

      {/* Hero title */}
      <div className="checkin-hero">
        <div className="display checkin-title">
          <em>¿Cómo</em> amaneciste?
        </div>
        <div className="checkin-sub">1 minuto · ayuda a calibrar tu plan</div>
      </div>

      {/* Mood — 5 emoji buttons */}
      <div className="checkin-section">
        <div className="section-label">Ánimo</div>
        <div className="mood-row">
          {MOOD_EMOJI.map((emoji, i) => {
            const value = i + 1
            const active = mood === value
            return (
              <button
                key={value}
                type="button"
                className={'mood-btn' + (active ? ' is-active' : '')}
                onClick={() => setMood(value)}
                aria-label={`Ánimo ${value} de 5`}
                aria-pressed={active}
              >
                {emoji}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sleep — range slider */}
      <div className="checkin-section">
        <div className="row-between">
          <div className="section-label">Sueño</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            <span style={{ color: 'var(--medic)' }}>{sleep}</span> h
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={12}
          step={0.5}
          value={sleep}
          onChange={(e) => setSleep(parseFloat(e.target.value))}
          className="checkin-range"
        />
        <div className="checkin-range-ticks">
          <span>0h</span><span>6h</span><span>12h</span>
        </div>
      </div>

      {/* Energy — 5 incremental segments */}
      <div className="checkin-section">
        <div className="section-label">Energía</div>
        <div className="energy-row">
          {[1, 2, 3, 4, 5].map((i) => {
            const filled = i <= energy
            return (
              <button
                key={i}
                type="button"
                className={'energy-btn' + (filled ? ' is-filled' : '')}
                onClick={() => setEnergy(i)}
                aria-label={`Energía ${i} de 5`}
                aria-pressed={filled}
              >
                {i}
              </button>
            )
          })}
        </div>
      </div>

      {/* Pain — segmented control */}
      <div className="checkin-section">
        <div className="section-label">¿Dolor o molestia?</div>
        <div className="pain-row">
          {PAIN_LEVELS.map((label) => {
            const active = pain === label
            return (
              <button
                key={label}
                type="button"
                className={'pain-btn' + (active ? ' is-active' : '')}
                onClick={() => setPain(label)}
                aria-pressed={active}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--err)',
            background: 'rgba(226, 62, 74, 0.08)',
            border: '1px solid rgba(226, 62, 74, 0.25)',
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        className="btn btn-full checkin-submit"
        onClick={handleSubmit}
        disabled={submitting}
      >
        <Icon name="check" size={18} /> {submitting ? 'Guardando…' : 'Guardar check-in'}
      </button>
    </div>
  )
}
