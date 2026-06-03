import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { checkinService } from '../../services/checkinService'
import { ApiError } from '../../services/apiClient'
import type { CheckinPayload, CheckinRow } from '../../types/api'

const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😄'] as const
const PAIN_LEVELS = ['No', 'Leve', 'Moderado', 'Fuerte'] as const
const PAIN_VALUES: Record<(typeof PAIN_LEVELS)[number], number> = {
  No: 0,
  Leve: 3,
  Moderado: 6,
  Fuerte: 9,
}
const PAIN_FROM_VALUE = (v?: number | null): string | null => {
  if (v == null) return null
  if (v >= 8) return 'Fuerte'
  if (v >= 5) return 'Moderado'
  if (v >= 2) return 'Leve'
  if (v === 0) return 'No'
  return null
}

interface Props {
  onClose?: () => void
}

export function CheckIn({ onClose }: Props) {
  // Quick block (always visible)
  const [mood, setMood] = useState<number>(4)
  const [sleep, setSleep] = useState<number>(7.5)
  const [energy, setEnergy] = useState<number>(3)
  const [pain, setPain] = useState<string | null>(null)

  // Expanded block (toggled)
  const [showMore, setShowMore] = useState(false)
  const [fumo, setFumo] = useState<0 | 1 | null>(null)
  const [alcohol, setAlcohol] = useState<0 | 1 | null>(null)
  const [actividad, setActividad] = useState<0 | 1 | null>(null)
  const [actividadMin, setActividadMin] = useState<number>(0)
  const [calidadSueno, setCalidadSueno] = useState<number>(7)
  const [estres, setEstres] = useState<number>(5)
  const [hidratacion, setHidratacion] = useState<number>(2)
  const [deposicion, setDeposicion] = useState<0 | 1 | null>(null)

  // Submission state
  const [loading, setLoading] = useState(true)
  const [hydratedFromExisting, setHydratedFromExisting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hydrate from today's existing row so we don't overwrite previously saved data.
  useEffect(() => {
    let cancelled = false
    checkinService
      .getToday()
      .then((row: CheckinRow | null) => {
        if (cancelled || !row) return
        setHydratedFromExisting(true)
        // The UI uses 1–5 scales while backend stores 0–10; halve to map back.
        if (row.animo != null) setMood(Math.max(1, Math.round(row.animo / 2)))
        if (row.energia != null) setEnergy(Math.max(1, Math.round(row.energia / 2)))
        if (row.horas_sueno != null) setSleep(row.horas_sueno)
        if (row.dolor_abdominal != null) setPain(PAIN_FROM_VALUE(row.dolor_abdominal))

        if (row.fumo != null) setFumo(row.fumo)
        if (row.alcohol != null) setAlcohol(row.alcohol)
        if (row.actividad_fisica != null) setActividad(row.actividad_fisica)
        if (row.actividad_minutos != null) setActividadMin(row.actividad_minutos)
        if (row.calidad_sueno != null) setCalidadSueno(row.calidad_sueno)
        if (row.estres != null) setEstres(row.estres)
        if (row.hidratacion_litros != null) setHidratacion(row.hidratacion_litros)
        if (row.deposicion != null) setDeposicion(row.deposicion)

        // Auto-expand if user already filled extended fields.
        if (
          row.fumo != null || row.alcohol != null || row.actividad_fisica != null ||
          row.calidad_sueno != null || row.estres != null || row.hidratacion_litros != null ||
          row.deposicion != null
        ) {
          setShowMore(true)
        }
      })
      .catch(() => { /* swallow — first-fill of the day */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const payload: CheckinPayload = {
        // Scale up 1-5 → 0-10 for backend (OMV-68).
        animo: mood * 2,
        energia: energy * 2,
        horas_sueno: sleep,
        dolor_abdominal: pain ? PAIN_VALUES[pain as (typeof PAIN_LEVELS)[number]] : 0,
        completado: 1,
      }
      // Only send extended fields if the user touched them.
      if (showMore) {
        if (fumo != null) payload.fumo = fumo
        if (alcohol != null) payload.alcohol = alcohol
        if (actividad != null) {
          payload.actividad_fisica = actividad
          if (actividad === 1 && actividadMin > 0) payload.actividad_minutos = actividadMin
        }
        payload.calidad_sueno = calidadSueno
        payload.estres = estres
        payload.hidratacion_litros = hidratacion
        if (deposicion != null) payload.deposicion = deposicion
      }
      await checkinService.submitToday(payload)
      onClose?.()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos guardar el check-in.')
      setSubmitting(false)
    }
  }

  return (
    <div className="checkin" data-mod="medicine">
      {/* Top bar */}
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
        <div className="checkin-sub">
          {loading
            ? 'Cargando datos del día…'
            : hydratedFromExisting
              ? 'Ya cargaste check-in hoy — podés actualizar.'
              : '1 minuto · ayuda a calibrar tu plan'}
        </div>
      </div>

      {/* Mood */}
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

      {/* Sleep hours */}
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

      {/* Energy */}
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

      {/* Pain */}
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

      {/* Expand-more toggle */}
      <button
        type="button"
        className="btn btn-ghost btn-full"
        onClick={() => setShowMore(!showMore)}
        style={{ marginTop: 4 }}
      >
        <Icon name={showMore ? 'chevR' : 'plus'} size={14} />
        {showMore ? ' Ocultar detalles' : ' Más detalles (mejora tu Health Index)'}
      </button>

      {showMore && (
        <>
          {/* Activity */}
          <div className="checkin-section">
            <div className="section-label">¿Hiciste actividad física hoy?</div>
            <div className="pain-row">
              <button
                type="button"
                className={'pain-btn' + (actividad === 0 ? ' is-active' : '')}
                onClick={() => setActividad(0)}
              >No</button>
              <button
                type="button"
                className={'pain-btn' + (actividad === 1 ? ' is-active' : '')}
                onClick={() => setActividad(1)}
              >Sí</button>
            </div>
            {actividad === 1 && (
              <div style={{ marginTop: 10 }}>
                <div className="row-between">
                  <div className="section-label" style={{ padding: 0 }}>Minutos</div>
                  <div style={{ fontSize: 13 }}>
                    <span style={{ color: 'var(--medic)' }}>{actividadMin}</span> min
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={180}
                  step={5}
                  value={actividadMin}
                  onChange={(e) => setActividadMin(parseInt(e.target.value, 10))}
                  className="checkin-range"
                />
              </div>
            )}
          </div>

          {/* Sleep quality */}
          <div className="checkin-section">
            <div className="row-between">
              <div className="section-label">Calidad de sueño</div>
              <div style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--medic)' }}>{calidadSueno}</span>/10
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={calidadSueno}
              onChange={(e) => setCalidadSueno(parseInt(e.target.value, 10))}
              className="checkin-range"
            />
          </div>

          {/* Stress */}
          <div className="checkin-section">
            <div className="row-between">
              <div className="section-label">Estrés</div>
              <div style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--medic)' }}>{estres}</span>/10
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={estres}
              onChange={(e) => setEstres(parseInt(e.target.value, 10))}
              className="checkin-range"
            />
          </div>

          {/* Hydration */}
          <div className="checkin-section">
            <div className="row-between">
              <div className="section-label">Hidratación</div>
              <div style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--medic)' }}>{hidratacion.toFixed(1)}</span> L
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={0.25}
              value={hidratacion}
              onChange={(e) => setHidratacion(parseFloat(e.target.value))}
              className="checkin-range"
            />
          </div>

          {/* Smoking */}
          <div className="checkin-section">
            <div className="section-label">¿Fumaste hoy?</div>
            <div className="pain-row">
              <button
                type="button"
                className={'pain-btn' + (fumo === 0 ? ' is-active' : '')}
                onClick={() => setFumo(0)}
              >No</button>
              <button
                type="button"
                className={'pain-btn' + (fumo === 1 ? ' is-active' : '')}
                onClick={() => setFumo(1)}
              >Sí</button>
            </div>
          </div>

          {/* Alcohol */}
          <div className="checkin-section">
            <div className="section-label">¿Tomaste alcohol?</div>
            <div className="pain-row">
              <button
                type="button"
                className={'pain-btn' + (alcohol === 0 ? ' is-active' : '')}
                onClick={() => setAlcohol(0)}
              >No</button>
              <button
                type="button"
                className={'pain-btn' + (alcohol === 1 ? ' is-active' : '')}
                onClick={() => setAlcohol(1)}
              >Sí</button>
            </div>
          </div>

          {/* Bowel */}
          <div className="checkin-section">
            <div className="section-label">¿Tuviste deposición regular?</div>
            <div className="pain-row">
              <button
                type="button"
                className={'pain-btn' + (deposicion === 0 ? ' is-active' : '')}
                onClick={() => setDeposicion(0)}
              >No</button>
              <button
                type="button"
                className={'pain-btn' + (deposicion === 1 ? ' is-active' : '')}
                onClick={() => setDeposicion(1)}
              >Sí</button>
            </div>
          </div>

          {/* Symptom quick-log */}
          <SymptomQuickLog />
        </>
      )}

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
        disabled={submitting || loading}
      >
        <Icon name="check" size={18} />
        {submitting ? ' Guardando…' : hydratedFromExisting ? ' Actualizar check-in' : ' Guardar check-in'}
      </button>
    </div>
  )
}

/** Optional add-on inside CheckIn: report a discrete symptom via
 *  `POST /checkin/symptoms`. The previously-listed symptoms come from
 *  `GET /checkin/symptoms` so the patient can confirm what's persisted. */
function SymptomQuickLog() {
  const [tipo, setTipo] = useState('')
  const [severidad, setSeveridad] = useState<number>(3)
  const [descripcion, setDescripcion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [recent, setRecent] = useState<{ tipo: string; fecha: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    checkinService.listSymptoms({ days: 7 })
      .then((r) => setRecent((Array.isArray(r.symptoms) ? r.symptoms : []).slice(0, 3).map((s) => ({ tipo: s.tipo, fecha: s.fecha }))))
      .catch(() => { /* swallow — feature is best-effort */ })
  }, [])

  const submit = async () => {
    if (!tipo.trim()) return
    setSubmitting(true)
    setError(null)
    setOk(false)
    try {
      await checkinService.reportSymptom({
        tipo: tipo.trim(),
        severidad,
        descripcion: descripcion.trim() || undefined,
      })
      setTipo('')
      setDescripcion('')
      setOk(true)
      const r = await checkinService.listSymptoms({ days: 7 })
      setRecent((Array.isArray(r.symptoms) ? r.symptoms : []).slice(0, 3).map((s) => ({ tipo: s.tipo, fecha: s.fecha })))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos guardar el síntoma.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="checkin-section">
      <div className="section-label">Síntomas (opcional)</div>
      <div className="card" style={{ padding: 10 }}>
        <input
          type="text"
          className="adm-input"
          placeholder="Ej: dolor de cabeza, náuseas…"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          style={{ marginBottom: 6 }}
        />
        <input
          type="text"
          className="adm-input"
          placeholder="Detalle (opcional)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <div className="row-between" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Severidad</span>
          <span style={{ fontSize: 12 }}>
            <span style={{ color: 'var(--medic)' }}>{severidad}</span>/10
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={severidad}
          onChange={(e) => setSeveridad(parseInt(e.target.value, 10))}
          className="checkin-range"
          style={{ marginBottom: 8 }}
        />
        <button
          type="button"
          className="btn btn-ghost btn-full"
          onClick={submit}
          disabled={submitting || !tipo.trim()}
        >
          <Icon name="plus" size={14} />
          {submitting ? ' Guardando…' : ok ? ' ✓ Registrado' : ' Registrar síntoma'}
        </button>
        {error && (
          <p style={{ fontSize: 12, color: 'var(--omega)', margin: '8px 0 0' }}>{error}</p>
        )}
        {recent.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>
              ÚLTIMOS 7 DÍAS
            </div>
            {recent.map((s, i) => (
              <div key={i} className="mono" style={{ fontSize: 11, color: 'var(--text-2)' }}>
                · {s.tipo} ({(s.fecha ?? '').slice(0, 10)})
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
