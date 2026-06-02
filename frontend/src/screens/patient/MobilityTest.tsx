import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Chip } from '../../components/atoms'
import { telemedicineService } from '../../services/telemedicineService'
import { ApiError } from '../../services/apiClient'
import type {
  CreateMobilityPayload,
  MobilityLevel,
  MobilityRecord,
  MobilityZoneScores,
} from '../../types/api'

/** Zonas evaluadas (modelo GoWOD adaptado a autoevaluación sin cámara). */
const ZONES: { key: string; label: string }[] = [
  { key: 'tobillo', label: 'Tobillos' },
  { key: 'cadera', label: 'Cadera' },
  { key: 'hombro', label: 'Hombros' },
  { key: 'toracica', label: 'Columna torácica' },
  { key: 'muneca', label: 'Muñecas' },
  { key: 'isquios', label: 'Isquiotibiales' },
  { key: 'sentadilla', label: 'Sentadilla profunda' },
  { key: 'overhead', label: 'Movilidad overhead' },
]

const LEVELS: { v: MobilityLevel; label: string }[] = [
  { v: 1, label: 'Limitado' },
  { v: 2, label: 'Moderado' },
  { v: 3, label: 'Bueno' },
]

interface Props {
  /** Profesional registrando/viendo a un paciente. El paciente lo omite. */
  patient?: string
}

function scoreChip(score: number): string {
  if (score >= 67) return 'ok'
  if (score >= 34) return 'info'
  return 'err'
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return iso
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function MobilityTest({ patient }: Props = {}) {
  const [scores, setScores] = useState<Record<string, MobilityLevel | undefined>>({})
  const [notas, setNotas] = useState('')
  const [history, setHistory] = useState<MobilityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedOk, setSavedOk] = useState(false)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await telemedicineService.listMobility(patient)
      setHistory(res.registros ?? [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cargar el historial de movilidad')
    } finally {
      setLoading(false)
    }
  }, [patient])

  useEffect(() => { loadHistory() }, [loadHistory])

  const answered = ZONES.filter((z) => scores[z.key] != null).length
  const allAnswered = answered === ZONES.length

  const { globalScore, focuses } = useMemo(() => {
    const vals = ZONES.map((z) => scores[z.key]).filter((v): v is MobilityLevel => v != null)
    if (vals.length === 0) return { globalScore: 0, focuses: [] as string[] }
    const total = Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length * 3)) * 100)
    const f = ZONES.filter((z) => scores[z.key] === 1).map((z) => z.label)
    return { globalScore: total, focuses: f }
  }, [scores])

  const setZone = (key: string, level: MobilityLevel) => {
    setSavedOk(false)
    setScores((prev) => ({ ...prev, [key]: level }))
  }

  const save = async () => {
    if (!allAnswered) return
    setSaving(true)
    setError(null)
    setSavedOk(false)
    try {
      const detalle: MobilityZoneScores = {}
      for (const z of ZONES) detalle[z.key] = scores[z.key]!
      const payload: CreateMobilityPayload = {
        tipo_evaluacion: 'autoevaluacion',
        puntuacion_total: globalScore,
        puntuacion_detalle: JSON.stringify(detalle),
        limitaciones_identificadas: focuses.length ? focuses.join(', ') : 'ninguna',
        recomendaciones: focuses.length
          ? `Priorizar movilidad de: ${focuses.join(', ')}.`
          : 'Buena movilidad general; mantener rutina de mantenimiento.',
        notas: notas.trim() || undefined,
      }
      if (patient) payload.patient = patient
      await telemedicineService.createMobility(payload)
      setSavedOk(true)
      setNotas('')
      await loadHistory()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar la evaluación')
    } finally {
      setSaving(false)
    }
  }

  const last = history[0] ?? null

  return (
    <div className="pr-screen" data-mod="medicine">
      <div className="row-between">
        <div className="module-pill">
          <Icon name="activity" size={12} /> Movilidad
        </div>
      </div>

      <div className="display pr-title">
        Test de <em>movilidad</em>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
        Autoevaluá tu rango de movimiento por zona. Calculamos tu score global y
        las zonas a priorizar (focuses).
      </p>

      {/* Última evaluación */}
      {last && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <div className="section-label">Último score</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{last.puntuacion_total ?? '—'}<span style={{ fontSize: 13, color: 'var(--text-2)' }}>/100</span></div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="section-label">Zonas a mejorar</div>
            <div style={{ fontSize: 13 }}>{last.limitaciones_identificadas || '—'}</div>
          </div>
          <div className="mono" style={{ color: 'var(--text-3)', fontSize: 11 }}>{formatDate(last.fecha_registro)}</div>
        </div>
      )}

      {/* Cuestionario por zona */}
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 6 }}>
          <div className="section-label">Evaluación por zona</div>
          <div className="mono" style={{ color: 'var(--text-3)', fontSize: 11 }}>{answered}/{ZONES.length}</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ZONES.map((z) => (
            <div key={z.key} className="row-between" style={{ gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-1)' }}>{z.label}</span>
              <div className="pain-row" style={{ flex: '0 0 auto' }}>
                {LEVELS.map((lv) => (
                  <button
                    key={lv.v}
                    type="button"
                    className={'pain-btn' + (scores[z.key] === lv.v ? ' is-active' : '')}
                    onClick={() => setZone(z.key, lv.v)}
                    disabled={saving}
                  >
                    {lv.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resultado en vivo */}
      {answered > 0 && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <div className="section-label">Score global</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>
              {globalScore}<span style={{ fontSize: 13, color: 'var(--text-2)' }}>/100</span>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {focuses.length === 0 ? (
              <Chip variant="ok">Sin zonas limitadas</Chip>
            ) : (
              focuses.map((f) => <Chip key={f} variant="err">{f}</Chip>)
            )}
          </div>
          <Chip variant={scoreChip(globalScore)}>{globalScore >= 67 ? 'Bueno' : globalScore >= 34 ? 'Moderado' : 'Limitado'}</Chip>
        </div>
      )}

      {/* Notas */}
      <div className="ph-section">
        <div className="section-label">Notas (opcional)</div>
        <textarea
          className="input"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Molestias, contexto, etc."
          rows={2}
          style={{ width: '100%', resize: 'vertical' }}
          disabled={saving}
        />
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--err)', margin: 0 }}>{error}</p>
        </div>
      )}
      {savedOk && (
        <div className="card" style={{ borderColor: 'rgba(111,207,111,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--ok)', margin: 0 }}>Evaluación guardada.</p>
        </div>
      )}

      <button
        type="button"
        className="btn btn-full"
        onClick={save}
        disabled={!allAnswered || saving}
        style={{ background: 'var(--medic)', color: '#fff' }}
        title={!allAnswered ? 'Completá todas las zonas' : ''}
      >
        <Icon name="check" size={14} /> {saving ? 'Guardando…' : 'Guardar evaluación'}
      </button>

      {/* Historial */}
      <div className="ph-section">
        <div className="section-label">Historial</div>
        {loading ? (
          <div className="card"><p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Cargando…</p></div>
        ) : history.length === 0 ? (
          <div className="card"><p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Sin evaluaciones registradas todavía.</p></div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {history.map((r, i) => (
              <div
                key={r.id}
                className="row-between"
                style={{ padding: 12, gap: 10, borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(r.fecha_registro)}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {r.limitaciones_identificadas && r.limitaciones_identificadas !== 'ninguna'
                      ? `Focuses: ${r.limitaciones_identificadas}`
                      : 'Sin zonas limitadas'}
                  </div>
                </div>
                <Chip variant={scoreChip(r.puntuacion_total ?? 0)}>{r.puntuacion_total ?? '—'}/100</Chip>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
