import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { goalService } from '../services/goalService'
import { ApiError } from '../services/apiClient'
import type {
  AutoRoadmapResponse,
  Measurement,
  ProposeGoalPayload,
  StaticProfile,
} from '../types/api'

interface Props {
  profile: StaticProfile
  /** Most recent measurement, used to show "current vs objetivo" deltas inline. */
  latestMeasurement?: Measurement | null
  onClose: () => void
  onSaved: () => void
}

type Mode = 'manual' | 'auto'

const TIPOS = [
  { id: 'recomposicion', label: 'Recomposición' },
  { id: 'volumen', label: 'Volumen' },
  { id: 'definicion', label: 'Definición' },
  { id: 'mantenimiento', label: 'Mantenimiento' },
] as const

function num(v: string): number | null {
  const n = parseFloat(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

function delta(target: number | null, current: number | null | undefined): string | null {
  if (target == null || current == null) return null
  const d = target - current
  if (Math.abs(d) < 0.05) return null
  return (d > 0 ? '+' : '') + d.toFixed(1)
}

function formatChange(n: number, unit = 'kg'): string {
  if (Math.abs(n) < 0.05) return `±0 ${unit}`
  return (n > 0 ? '+' : '') + n.toFixed(1) + ' ' + unit
}

export function ProposeGoalSheet({ profile, latestMeasurement, onClose, onSaved }: Props) {
  const [mode, setMode] = useState<Mode>('manual')

  // Manual form state
  const [tipo, setTipo] = useState<string>('recomposicion')
  const [pesoObjetivo, setPesoObjetivo] = useState('')
  const [bfObjetivo, setBfObjetivo] = useState('')
  const [ffmiObjetivo, setFfmiObjetivo] = useState('')
  const [mesesEstimados, setMesesEstimados] = useState('3')
  const [notas, setNotas] = useState('')

  // Auto-roadmap state
  const [roadmap, setRoadmap] = useState<AutoRoadmapResponse | null>(null)
  const [loadingRoadmap, setLoadingRoadmap] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)

  // Shared state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load auto-roadmap the first time the user switches to Auto mode.
  // Note: `roadmap` and `loadingRoadmap` are intentionally NOT in the deps —
  // including them would cause the cleanup to cancel the in-flight request as
  // soon as setLoadingRoadmap(true) re-fires the effect.
  useEffect(() => {
    if (mode !== 'auto') return
    if (roadmap) return
    let cancelled = false
    setLoadingRoadmap(true)
    setError(null)
    goalService
      .getAutoRoadmap(profile.user_id)
      .then((rm) => {
        if (cancelled) return
        setRoadmap(rm)
        setSelectedIdx(0)
      })
      .catch((e) => {
        if (cancelled) return
        setError(
          e instanceof ApiError
            ? `No se pudo calcular el roadmap: ${e.message}`
            : 'No se pudo calcular el roadmap.',
        )
      })
      .finally(() => {
        if (!cancelled) setLoadingRoadmap(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, profile.user_id])

  const submitManual = async (): Promise<void> => {
    setError(null)
    const peso = num(pesoObjetivo)
    const bf = num(bfObjetivo)
    const ffmi = num(ffmiObjetivo)
    const meses = num(mesesEstimados)

    if (!peso && !bf && !ffmi) {
      setError('Definí al menos uno: peso, % grasa o FFMI objetivo.')
      return
    }
    if (!meses) {
      setError('Indicá cuántos meses estimás para alcanzarlo.')
      return
    }

    // El doctor SIEMPRE propone — el paciente lo acepta o rechaza después.
    // Mandamos status='proposed' explícito para que no se autoacepte cuando
    // el paciente y el doctor son el mismo auth_user_id (caso ver-mi-propio-
    // perfil del admin con doble rol).
    // tiempo_estimado_meses va como campo estructurado y la fecha_objetivo
    // se deriva en el backend (`_compute_fecha_objetivo`) si no la mandamos.
    const notasFinal = [
      notas.trim(),
      `Categoría: ${tipo}`,
    ].filter(Boolean).join(' · ')

    const payload: ProposeGoalPayload = {
      status: 'proposed',
      source: 'manual',
      ...(peso !== null ? { peso_objetivo: peso } : {}),
      ...(bf !== null ? { bf_objetivo: bf } : {}),
      ...(ffmi !== null ? { ffmi_objetivo: ffmi } : {}),
      ...(meses !== null ? { tiempo_estimado_meses: meses } : {}),
      notas: notasFinal,
    }

    setSubmitting(true)
    try {
      await goalService.propose(profile.user_id, payload)
      onSaved()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos guardar el objetivo.')
    } finally {
      setSubmitting(false)
    }
  }

  const submitAuto = async (): Promise<void> => {
    if (!roadmap || !roadmap.objetivos_parciales[selectedIdx]) return
    setError(null)
    const phase = roadmap.objetivos_parciales[selectedIdx]
    setSubmitting(true)
    try {
      // El doctor propone una fase auto-calculada. El backend persiste el
      // tiempo_estimado_meses como columna y deriva fecha_objetivo solo.
      const notasAuto = [
        phase.descripcion,
        phase.fase,
        `Fase ${selectedIdx + 1}/${roadmap.objetivos_parciales.length}`,
      ].filter(Boolean).join(' · ')

      const payload: ProposeGoalPayload = {
        status: 'proposed',
        source: 'auto-accepted',
        source_phase_index: selectedIdx,
        peso_objetivo: phase.peso_objetivo,
        bf_objetivo: phase.bf_objetivo,
        ffmi_objetivo: phase.ffmi_objetivo,
        ...(phase.tiempo_meses ? { tiempo_estimado_meses: phase.tiempo_meses } : {}),
        ...(phase.medida_abdomen != null ? { circ_abdomen_objetivo: phase.medida_abdomen } : {}),
        ...(phase.medida_cintura_cadera
          ? {
              circ_cintura_objetivo: phase.medida_cintura_cadera.cintura,
              circ_cadera_objetivo: phase.medida_cintura_cadera.cadera,
            }
          : {}),
        notas: notasAuto,
      }
      await goalService.propose(profile.user_id, payload)
      onSaved()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos guardar el objetivo automático.')
    } finally {
      setSubmitting(false)
    }
  }

  const submit = mode === 'manual' ? submitManual : submitAuto
  const canSubmit = mode === 'manual'
    ? true
    : !!(roadmap && roadmap.objetivos_parciales.length > 0)

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet adm-sheet">
        <div className="sheet-handle" />
        <div className="adm-sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="adm-sheet-name">Proponer objetivo</div>
            <div className="adm-sheet-meta">
              {profile.nombre} · el paciente debe aceptarlo
            </div>
          </div>
          <button type="button" className="adm-sheet-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="goal-mode-toggle">
          <button
            type="button"
            className={'goal-mode-chip' + (mode === 'manual' ? ' is-active' : '')}
            onClick={() => setMode('manual')}
          >
            <Icon name="edit" size={14} /> Manual
          </button>
          <button
            type="button"
            className={'goal-mode-chip' + (mode === 'auto' ? ' is-active' : '')}
            onClick={() => setMode('auto')}
          >
            <Icon name="target" size={14} /> Auto-calcular
          </button>
        </div>

        {mode === 'manual' && (
          <>
            <div className="sheet-section-label">Tipo de objetivo</div>
            <div className="goal-tipo-row">
              {TIPOS.map((t) => {
                const active = tipo === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={'goal-tipo-chip' + (active ? ' is-active' : '')}
                    onClick={() => setTipo(t.id)}
                    aria-pressed={active}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>

            <div className="sheet-section-label">Targets · al menos uno</div>
            <div className="adm-field-row">
              <div className="adm-field" style={{ flex: 1 }}>
                <label className="adm-field-label">Peso (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={pesoObjetivo}
                  onChange={(e) => setPesoObjetivo(e.target.value)}
                  placeholder={latestMeasurement?.peso ? String(latestMeasurement.peso) : '—'}
                  className="adm-input"
                />
                {delta(num(pesoObjetivo), latestMeasurement?.peso) && (
                  <div className="goal-delta" style={{ color: 'var(--analytic)' }}>
                    {delta(num(pesoObjetivo), latestMeasurement?.peso)} kg
                  </div>
                )}
              </div>
              <div className="adm-field" style={{ flex: 1 }}>
                <label className="adm-field-label">% Grasa</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={bfObjetivo}
                  onChange={(e) => setBfObjetivo(e.target.value)}
                  placeholder={latestMeasurement?.bf_percent ? latestMeasurement.bf_percent.toFixed(1) : '—'}
                  className="adm-input"
                />
                {delta(num(bfObjetivo), latestMeasurement?.bf_percent) && (
                  <div className="goal-delta" style={{ color: 'var(--medic)' }}>
                    {delta(num(bfObjetivo), latestMeasurement?.bf_percent)} %
                  </div>
                )}
              </div>
            </div>
            <div className="adm-field">
              <label className="adm-field-label">FFMI objetivo</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={ffmiObjetivo}
                onChange={(e) => setFfmiObjetivo(e.target.value)}
                placeholder={latestMeasurement?.ffmi ? latestMeasurement.ffmi.toFixed(1) : '—'}
                className="adm-input"
              />
              {delta(num(ffmiObjetivo), latestMeasurement?.ffmi) && (
                <div className="goal-delta" style={{ color: 'var(--ok)' }}>
                  {delta(num(ffmiObjetivo), latestMeasurement?.ffmi)} FFMI
                </div>
              )}
            </div>

            <div className="sheet-section-label">Plazo</div>
            <div className="adm-field">
              <label className="adm-field-label">Meses estimados *</label>
              <input
                type="number"
                inputMode="decimal"
                min={1}
                max={36}
                step="1"
                value={mesesEstimados}
                onChange={(e) => setMesesEstimados(e.target.value)}
                placeholder="3"
                className="adm-input"
              />
            </div>

            <div className="adm-field">
              <label className="adm-field-label">Notas (opcional)</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Contexto, recomendaciones, particularidades…"
                rows={3}
                className="adm-input"
              />
            </div>
          </>
        )}

        {mode === 'auto' && (
          <AutoRoadmapView
            roadmap={roadmap}
            loading={loadingRoadmap}
            selectedIdx={selectedIdx}
            onSelect={setSelectedIdx}
          />
        )}

        {error && <div className="adm-error">{error}</div>}

        <button
          type="button"
          className="btn btn-primary btn-full adm-submit"
          onClick={submit}
          disabled={submitting || !canSubmit}
        >
          {submitting
            ? 'Guardando…'
            : mode === 'auto'
              ? 'Proponer fase y guardar plan'
              : 'Proponer al paciente'}
        </button>
      </div>
    </>
  )
}

function AutoRoadmapView({
  roadmap,
  loading,
  selectedIdx,
  onSelect,
}: {
  roadmap: AutoRoadmapResponse | null
  loading: boolean
  selectedIdx: number
  onSelect: (idx: number) => void
}) {
  if (loading) {
    return (
      <div className="goal-auto-loading">Calculando roadmap a partir de la última medición…</div>
    )
  }
  if (!roadmap) {
    return null
  }
  const { datos_actuales, objetivos_geneticos, tiempo_estimado, objetivos_parciales } = roadmap
  if (!objetivos_parciales.length) {
    return (
      <div className="goal-auto-empty">
        Las mediciones actuales ya están en el límite genético. No hay fases pendientes.
      </div>
    )
  }
  const phase = objetivos_parciales[selectedIdx]

  return (
    <>
      <div className="sheet-section-label">Estado actual → límite genético</div>
      <div className="goal-auto-summary">
        <div className="goal-auto-stat">
          <div className="mono">Peso</div>
          <div>
            {datos_actuales.peso} → <strong>{objetivos_geneticos.peso_objetivo}</strong> kg
          </div>
        </div>
        <div className="goal-auto-stat">
          <div className="mono">% Grasa</div>
          <div>
            {datos_actuales.bf} → <strong>{objetivos_geneticos.bf_esencial}</strong> %
          </div>
        </div>
        <div className="goal-auto-stat">
          <div className="mono">FFMI</div>
          <div>
            {datos_actuales.ffmi} → <strong>{objetivos_geneticos.ffmi_limite}</strong>
          </div>
        </div>
        <div className="goal-auto-stat">
          <div className="mono">Tiempo total</div>
          <div>
            ~ <strong>{tiempo_estimado.meses}</strong> meses
          </div>
        </div>
      </div>

      <div className="sheet-section-label">
        Fases del plan ({objetivos_parciales.length})
      </div>
      <div className="goal-auto-phases">
        {objetivos_parciales.map((p, i) => {
          const active = i === selectedIdx
          return (
            <button
              key={i}
              type="button"
              className={'goal-auto-phase' + (active ? ' is-active' : '')}
              onClick={() => onSelect(i)}
            >
              <div className="goal-auto-phase-head">
                <span className={'goal-auto-phase-tag goal-auto-phase-tag--' + p.tipo}>
                  {p.tipo === 'definicion' ? 'Corte' : 'Volumen'} · {i + 1}
                </span>
                <span className="mono goal-auto-phase-time">{p.tiempo_meses} m</span>
              </div>
              <div className="goal-auto-phase-desc">{p.descripcion}</div>
              <div className="goal-auto-phase-grid">
                <span>Peso <strong>{p.peso_objetivo}</strong></span>
                <span>BF <strong>{p.bf_objetivo}%</strong></span>
                <span>FFMI <strong>{p.ffmi_objetivo}</strong></span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="sheet-section-label">Fase seleccionada</div>
      <div className="goal-auto-detail">
        <div className="goal-auto-detail-title">{phase.descripcion}</div>
        <div className="goal-auto-detail-meta mono">{phase.fase}</div>
        <div className="goal-auto-detail-rows">
          <div className="goal-auto-detail-row">
            <span>Peso</span>
            <span className="mono">
              {formatChange(phase.cambio_peso)} → <strong>{phase.peso_objetivo} kg</strong>
            </span>
          </div>
          <div className="goal-auto-detail-row">
            <span>Músculo</span>
            <span className="mono">{formatChange(phase.cambio_musculo)}</span>
          </div>
          <div className="goal-auto-detail-row">
            <span>Grasa</span>
            <span className="mono">{formatChange(phase.cambio_grasa)}</span>
          </div>
          <div className="goal-auto-detail-row">
            <span>FFMI objetivo</span>
            <span className="mono">
              <strong>{phase.ffmi_objetivo}</strong>
              {phase.ffmi_categoria ? ` · ${phase.ffmi_categoria}` : ''}
            </span>
          </div>
          {phase.medida_abdomen != null && (
            <div className="goal-auto-detail-row">
              <span>Abdomen objetivo</span>
              <span className="mono">{phase.medida_abdomen} cm</span>
            </div>
          )}
          {phase.medida_cintura_cadera && (
            <>
              <div className="goal-auto-detail-row">
                <span>Cintura objetivo</span>
                <span className="mono">{phase.medida_cintura_cadera.cintura} cm</span>
              </div>
              <div className="goal-auto-detail-row">
                <span>Cadera objetivo</span>
                <span className="mono">{phase.medida_cintura_cadera.cadera} cm</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
