import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { trainingService } from '../../services/trainingService'
import { ApiError } from '../../services/apiClient'
import type {
  CreateStrengthPayload,
  StrengthTest,
  TrainingPlanRow,
} from '../../types/api'

interface Props {
  patientId: number
  patientName: string
}

const DEFAULT_LIFTS = ['squat', 'bench', 'deadlift', 'overhead_press'] as const
const LIFT_LABEL: Record<string, string> = {
  squat: 'Sentadilla',
  bench: 'Press de banca',
  deadlift: 'Peso muerto',
  overhead_press: 'Press militar',
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return iso
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function PatientTrainingPlan({ patientId: _patientId, patientName }: Props) {
  const [strength, setStrength] = useState<StrengthTest | null>(null)
  const [plans, setPlans] = useState<TrainingPlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [showStrengthForm, setShowStrengthForm] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [sr, pr] = await Promise.all([
        trainingService.getStrength(patientName).catch(() => ({ user: '', strength_data: null })),
        trainingService.listPlans(patientName).catch(() => ({ plans: [], total: 0 })),
      ])
      setStrength(sr?.strength_data ?? null)
      setPlans(Array.isArray(pr?.plans) ? pr.plans : [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando datos de entrenamiento')
    } finally {
      setLoading(false)
    }
  }, [patientName])

  useEffect(() => { reload() }, [reload])

  const activePlan = plans.find((p) => p.active) || plans[0] || null

  const handleOptimize = async () => {
    if (!activePlan) return
    setOptimizing(true)
    setError(null)
    setInfo(null)
    try {
      const r = await trainingService.optimizePlan(activePlan.id, {
        source_strength_id: strength?.id,
      })
      setInfo(`Plan optimizado: #${r.plan_id} (reemplaza al #${r.previous_plan_id})`)
      reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error optimizando plan')
    } finally {
      setOptimizing(false)
    }
  }

  const handleStrengthSaved = () => {
    setShowStrengthForm(false)
    setInfo('Test de fuerza registrado.')
    reload()
  }

  // Extract lift summary from strength.lift_inputs_json for display
  const lifts: { key: string; label: string; peso?: number; reps?: number; rm?: number }[] =
    strength?.lift_inputs_json
      ? Object.entries(strength.lift_inputs_json).map(([k, v]) => ({
          key: k,
          label: LIFT_LABEL[k] || k,
          peso: v?.peso,
          reps: v?.reps,
          rm: v?.rm,
        }))
      : []

  return (
    <div>
      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)', marginBottom: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}
      {info && (
        <div className="card" style={{ borderColor: 'rgba(111,207,111,0.3)', marginBottom: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--ok)', margin: 0 }}>{info}</p>
        </div>
      )}
      {loading && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Cargando entrenamiento…</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Strength test */}
          <div className="ph-section">
            <div className="row-between" style={{ marginBottom: 10 }}>
              <div className="section-label">Test de fuerza</div>
              <button
                type="button"
                className="dpd-edit-btn"
                onClick={() => setShowStrengthForm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
              >
                <Icon name="plus" size={12} /> {strength ? 'Nuevo test' : 'Cargar test'}
              </button>
            </div>
            {strength ? (
              <div className="card">
                <p className="mono" style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>
                  Último test · {formatDate(strength.fecha)}
                  {strength.peso_corporal != null ? ` · ${strength.peso_corporal} kg corporal` : ''}
                </p>
                {lifts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                    {lifts.map((l) => (
                      <div key={l.key} className="row-between" style={{ fontSize: 13 }}>
                        <span style={{ color: 'var(--text-1)' }}>{l.label}</span>
                        <span className="mono" style={{ color: 'var(--text-2)' }}>
                          {l.peso != null ? `${l.peso} kg` : '—'}
                          {l.reps ? ` × ${l.reps}` : ''}
                          {l.rm != null ? ` → 1RM ${Math.round(l.rm)} kg` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '10px 0 0' }}>
                    Test registrado sin detalle de lifts.
                  </p>
                )}
              </div>
            ) : (
              <div className="card">
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
                  Sin tests de fuerza registrados. Cargá los 1RM del paciente para poder optimizar el plan.
                </p>
              </div>
            )}
          </div>

          {/* Active plan */}
          <div className="ph-section">
            <div className="row-between" style={{ marginBottom: 10 }}>
              <div className="section-label">Plan activo</div>
              {plans.length > 0 && (
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  {plans.length} plan{plans.length === 1 ? '' : 'es'} en historial
                </span>
              )}
            </div>
            {activePlan ? (
              <div className="card">
                <div className="row-between">
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>
                      {activePlan.name || `Plan #${activePlan.id}`}
                    </div>
                    <p className="mono" style={{ fontSize: 11, color: 'var(--text-3)', margin: '4px 0 0' }}>
                      Día {activePlan.current_dia ?? 1} / {activePlan.total_dias ?? activePlan.total_days ?? '?'}
                      {activePlan.cycle_week ? ` · Semana ${activePlan.cycle_week}` : ''}
                      {activePlan.source ? ` · ${activePlan.source}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-full"
                  onClick={handleOptimize}
                  disabled={optimizing}
                  style={{
                    marginTop: 12,
                    background: 'var(--omega)',
                    color: '#fff',
                    fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                  title={!strength ? 'Cargá un test de fuerza para alimentar la optimización' : undefined}
                >
                  <Icon name="target" size={14} />
                  {optimizing ? 'Optimizando…' : 'Re-optimizar plan'}
                </button>
              </div>
            ) : (
              <div className="card">
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
                  Sin plan de entrenamiento. Cargá un test de fuerza y armá un plan desde el panel completo (próximamente).
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {showStrengthForm && (
        <StrengthTestSheet
          patientName={patientName}
          onClose={() => setShowStrengthForm(false)}
          onSaved={handleStrengthSaved}
          initial={strength?.lift_inputs_json ?? null}
          initialBodyweight={strength?.peso_corporal ?? null}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Strength test sheet — simple form to log 1RMs across the main lifts
// ─────────────────────────────────────────────────────────────────────────────

interface StrengthSheetProps {
  patientName: string
  onClose: () => void
  onSaved: () => void
  initial: Record<string, { peso?: number; reps?: number }> | null
  initialBodyweight: number | null
}

function StrengthTestSheet({ patientName, onClose, onSaved, initial, initialBodyweight }: StrengthSheetProps) {
  type Row = { key: string; label: string; peso: string; reps: string }
  const [rows, setRows] = useState<Row[]>(() =>
    DEFAULT_LIFTS.map((k) => {
      const ex = initial?.[k]
      return {
        key: k,
        label: LIFT_LABEL[k] || k,
        peso: ex?.peso != null ? String(ex.peso) : '',
        reps: ex?.reps != null ? String(ex.reps) : '',
      }
    }),
  )
  const [bodyweight, setBodyweight] = useState(initialBodyweight != null ? String(initialBodyweight) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateRow = (key: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  const save = async () => {
    setError(null)
    const ejercicios: Record<string, { peso: number; reps: number }> = {}
    for (const r of rows) {
      const peso = parseFloat(r.peso)
      const reps = parseFloat(r.reps)
      if (Number.isFinite(peso) && peso > 0 && Number.isFinite(reps) && reps > 0) {
        ejercicios[r.key] = { peso, reps }
      }
    }
    if (Object.keys(ejercicios).length === 0) {
      setError('Cargá al menos un ejercicio con peso y reps.')
      return
    }
    const payload: CreateStrengthPayload = { ejercicios, nombre_apellido: patientName }
    const bw = parseFloat(bodyweight)
    if (Number.isFinite(bw) && bw > 0) payload.peso_corporal = bw

    setSaving(true)
    try {
      await trainingService.createStrength(payload)
      onSaved()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos guardar el test.')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet adm-sheet" role="dialog" aria-label="Test de fuerza">
        <div className="sheet-handle" />
        <div className="adm-sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="adm-sheet-name">Test de fuerza</div>
            <div className="adm-sheet-meta">
              Cargá los 1RM (peso × reps). Epley calcula el 1RM en el servidor.
            </div>
          </div>
          <button type="button" className="adm-sheet-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="adm-field">
          <label className="adm-field-label">Peso corporal (kg, opcional)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={bodyweight}
            onChange={(e) => setBodyweight(e.target.value)}
            placeholder="—"
            className="adm-input"
          />
        </div>

        <div className="sheet-section-label">Lifts</div>
        {rows.map((r) => (
          <div key={r.key} className="adm-field">
            <label className="adm-field-label">{r.label}</label>
            <div className="adm-field-row">
              <div className="adm-field" style={{ flex: 1 }}>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min={0}
                  value={r.peso}
                  onChange={(e) => updateRow(r.key, { peso: e.target.value })}
                  placeholder="Peso (kg)"
                  className="adm-input"
                />
              </div>
              <div className="adm-field" style={{ flex: 1 }}>
                <input
                  type="number"
                  inputMode="decimal"
                  step="1"
                  min={0}
                  value={r.reps}
                  onChange={(e) => updateRow(r.key, { reps: e.target.value })}
                  placeholder="Reps"
                  className="adm-input"
                />
              </div>
            </div>
          </div>
        ))}

        {error && <div className="adm-error">{error}</div>}

        <button
          type="button"
          className="btn btn-primary btn-full adm-submit"
          onClick={save}
          disabled={saving}
          style={{ background: 'var(--omega)', color: '#fff' }}
        >
          {saving ? 'Guardando…' : 'Registrar test'}
        </button>
      </div>
    </>
  )
}
