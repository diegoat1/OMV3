import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Chip } from '../../components/atoms'
import { preventionService } from '../../services/preventionService'
import { ApiError } from '../../services/apiClient'
import type {
  PreventionGrade,
  PreventionRecommendation,
  PreventionRequest,
  PreventionResponse,
} from '../../types/api'

/** Clinical overrides the patient toggles in-screen. OMV3 doesn't store these
 *  in the profile, so we let the patient set them and re-fetch on change. */
interface Overrides {
  tobacco?: boolean
  sexuallyActive?: boolean
  pregnant?: boolean
}

/** Chip variant + label per USPSTF grade.
 *  A/B → recommended (green/ok), C → neutral, D → discouraged (err),
 *  I → insufficient evidence (neutral/muted). */
const GRADE_META: Record<PreventionGrade, { chip: string; label: string }> = {
  A: { chip: 'ok', label: 'Recomendado (A)' },
  B: { chip: 'ok', label: 'Recomendado (B)' },
  C: { chip: 'info', label: 'Selectivo (C)' },
  D: { chip: 'err', label: 'No recomendado (D)' },
  I: { chip: '', label: 'Evidencia insuficiente (I)' },
}

const GRADE_ORDER: PreventionGrade[] = ['A', 'B', 'C', 'D', 'I']

const SEX_LABEL: Record<'male' | 'female', string> = {
  male: 'Masculino',
  female: 'Femenino',
}

interface Props {
  /** Specialist-only: consult another patient's recommendations. Patients omit it. */
  patient?: string
}

/** Maps an ApiError to a patient-friendly message, handling the two documented
 *  backend failure modes (upstream USPSTF API down → 502; missing profile → 400). */
function describeError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 502) {
      return 'El servicio de prevención no está disponible en este momento. Probá de nuevo en unos minutos.'
    }
    if (e.status === 400) {
      return 'Completá tu perfil (sexo y fecha de nacimiento) para ver tus recomendaciones de prevención.'
    }
    return e.message
  }
  return 'No pudimos cargar tus recomendaciones de prevención.'
}

export function Prevention({ patient }: Props = {}) {
  const [data, setData] = useState<PreventionResponse | null>(null)
  const [overrides, setOverrides] = useState<Overrides>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const reload = useCallback(async (ov: Overrides) => {
    setLoading(true)
    setError(null)
    try {
      const payload: PreventionRequest = { ...ov }
      if (patient) payload.patient = patient
      const res = await preventionService.getRecommendations(payload)
      setData(res)
    } catch (e) {
      setError(describeError(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [patient])

  // Initial fetch (no overrides).
  useEffect(() => { reload({}) }, [reload])

  const setOverride = (key: keyof Overrides, value: boolean) => {
    setOverrides((prev) => {
      const next = { ...prev, [key]: value }
      reload(next)
      return next
    })
  }

  const toggleExpanded = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Group + order recommendations by grade (A → B → C → D → I).
  const grouped = useMemo(() => {
    if (!data) return [] as { grade: PreventionGrade; items: PreventionRecommendation[] }[]
    const byGrade = new Map<PreventionGrade, PreventionRecommendation[]>()
    for (const rec of Array.isArray(data.recommendations) ? data.recommendations : []) {
      const list = byGrade.get(rec.grade) ?? []
      list.push(rec)
      byGrade.set(rec.grade, list)
    }
    return GRADE_ORDER
      .map((grade) => ({ grade, items: byGrade.get(grade) ?? [] }))
      .filter((g) => g.items.length > 0)
  }, [data])

  const echo = data?.patient ?? null
  const isFemale = echo?.sex === 'female'

  return (
    <div className="pr-screen" data-mod="medicine">
      {/* Top row */}
      <div className="row-between">
        <div className="module-pill">
          <Icon name="shield" size={12} /> Prevención
        </div>
      </div>

      <div className="display pr-title">
        <em>Estudios</em> recomendados
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
        Screenings preventivos sugeridos para tu perfil según las guías USPSTF.
      </p>

      {/* Profile echo summary */}
      {echo && (
        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="section-label">Edad</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{echo.age} años</div>
          </div>
          <div>
            <div className="section-label">Sexo</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{SEX_LABEL[echo.sex]}</div>
          </div>
          {echo.bmi != null && (
            <div>
              <div className="section-label">IMC</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                {echo.bmi.toFixed(1)}
                {echo.bmiCategory && (
                  <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-2)' }}>
                    {' '}· {echo.bmiCategory}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clinical overrides the profile doesn't store */}
      <div className="ph-section">
        <div className="section-label">Datos clínicos</div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ToggleRow
            label="¿Sos fumador/a?"
            value={overrides.tobacco ?? echo?.tobacco}
            disabled={loading}
            onChange={(v) => setOverride('tobacco', v)}
          />
          <ToggleRow
            label="¿Sexualmente activo/a?"
            value={overrides.sexuallyActive ?? echo?.sexuallyActive}
            disabled={loading}
            onChange={(v) => setOverride('sexuallyActive', v)}
          />
          {isFemale && (
            <ToggleRow
              label="¿Estás embarazada?"
              value={overrides.pregnant ?? echo?.pregnant}
              disabled={loading}
              onChange={(v) => setOverride('pregnant', v)}
            />
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Icon name="shield" size={16} />
            <p style={{ fontSize: 13, color: 'var(--err)', margin: 0 }}>{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Calculando tus recomendaciones…
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && data && data.count === 0 && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            No hay screenings de prevención sugeridos para tu perfil en este momento.
          </p>
        </div>
      )}

      {/* Populated */}
      {!loading && !error && data && data.count > 0 && (
        <>
          <div className="row-between">
            <div className="section-label">Recomendaciones</div>
            <div className="mono" style={{ color: 'var(--text-3)', fontSize: 11 }}>
              {data.count} {data.count === 1 ? 'estudio' : 'estudios'}
            </div>
          </div>

          {grouped.map((group) => (
            <div key={group.grade} className="ph-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Chip variant={GRADE_META[group.grade].chip}>
                  {GRADE_META[group.grade].label}
                </Chip>
              </div>
              <div className="card" style={{ padding: 0 }}>
                {group.items.map((rec, i) => {
                  const open = expanded.has(rec.id)
                  return (
                    <button
                      key={rec.id}
                      type="button"
                      className="ph-link-row"
                      onClick={() => toggleExpanded(rec.id)}
                      aria-expanded={open}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 0,
                        borderTop: i === 0 ? 0 : '1px solid var(--line)',
                        cursor: 'pointer',
                        display: 'block',
                      }}
                    >
                      <div className="row-between" style={{ gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="ph-link-name">{rec.title}</div>
                          {(rec.servFreq || rec.ageRange || rec.sex) && (
                            <div className="ph-link-meta">
                              {[
                                rec.servFreq,
                                rec.ageRange ? `${rec.ageRange[0]}–${rec.ageRange[1]} años` : null,
                                rec.sex && rec.sex !== 'both'
                                  ? SEX_LABEL[rec.sex as 'male' | 'female'] ?? rec.sex
                                  : null,
                              ].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </div>
                        <Icon name={open ? 'chevD' : 'chevR'} size={16} />
                      </div>
                      {open && (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
                            {rec.text}
                          </p>
                          {rec.riskText && (
                            <div>
                              <div className="section-label" style={{ marginBottom: 2 }}>
                                {rec.riskName || 'Factores de riesgo'}
                              </div>
                              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
                                {rec.riskText}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '4px 0 0', lineHeight: 1.5 }}>
            Información orientativa basada en las guías USPSTF. No reemplaza la
            consulta con tu profesional de salud.
          </p>
        </>
      )}
    </div>
  )
}

interface ToggleRowProps {
  label: string
  value?: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}

/** Sí/No segmented toggle, styled with the shared pain-row/pain-btn classes
 *  (themed to --medic via the screen's data-mod="medicine"). */
function ToggleRow({ label, value, disabled, onChange }: ToggleRowProps) {
  return (
    <div className="row-between" style={{ gap: 10 }}>
      <span style={{ fontSize: 13, color: 'var(--text-1)' }}>{label}</span>
      <div className="pain-row" style={{ flex: '0 0 auto' }}>
        <button
          type="button"
          className={'pain-btn' + (value === false ? ' is-active' : '')}
          onClick={() => onChange(false)}
          disabled={disabled}
        >No</button>
        <button
          type="button"
          className={'pain-btn' + (value === true ? ' is-active' : '')}
          onClick={() => onChange(true)}
          disabled={disabled}
        >Sí</button>
      </div>
    </div>
  )
}
