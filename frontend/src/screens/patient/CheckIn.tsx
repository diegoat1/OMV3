import { useState } from 'react'
import { Icon } from '../../components/Icon'

const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😄'] as const
const PAIN_LEVELS = ['No', 'Leve', 'Moderado', 'Fuerte'] as const

interface Props {
  onClose?: () => void
}

export function CheckIn({ onClose }: Props) {
  const [mood, setMood] = useState<number>(4)
  const [sleep, setSleep] = useState<number>(7.5)
  const [energy, setEnergy] = useState<number>(3)
  const [pain, setPain] = useState<string | null>(null)

  const handleSubmit = () => {
    // TODO: POST to api/v3/checkin/ when backend is wired
    onClose?.()
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

      {/* Submit */}
      <button
        type="button"
        className="btn btn-full checkin-submit"
        onClick={handleSubmit}
      >
        <Icon name="check" size={18} /> Guardar check-in
      </button>
    </div>
  )
}
