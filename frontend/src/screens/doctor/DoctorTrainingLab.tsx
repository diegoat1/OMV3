import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { trainingService } from '../../services/trainingService'
import { ApiError } from '../../services/apiClient'
import type {
  ExerciseDef,
  StrengthTest,
  TrainingProgram,
  V2Distribution,
  V2Exercise,
  V2Plan,
  V2Progression,
  V2ProgressRow,
  V2Stats,
} from '../../types/api'

type TabKey = 'programs' | 'exercises' | 'v2lib' | 'v2plans' | 'history'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'programs', label: 'Programas' },
  { key: 'exercises', label: 'Ejercicios' },
  { key: 'v2lib', label: 'v2 Catálogo' },
  { key: 'v2plans', label: 'v2 Planes' },
  { key: 'history', label: 'Strength' },
]

export function DoctorTrainingLab() {
  const [tab, setTab] = useState<TabKey>('programs')

  return (
    <div className="dp-screen" data-mod="training">
      <div className="ah-title-block">
        <div className="module-pill">Entrenamiento</div>
        <div className="display ah-title">
          <em>Lab</em> training
        </div>
        <div className="ah-subtitle">Catálogos, programas, planes v2 y standards</div>
      </div>

      <div className="dp-filters">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={'chip dp-chip' + (tab === t.key ? ' is-active' : '')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'programs' && <ProgramsTab />}
      {tab === 'exercises' && <ExercisesTab />}
      {tab === 'v2lib' && <V2LibraryTab />}
      {tab === 'v2plans' && <V2PlansTab />}
      {tab === 'history' && <StrengthHistoryTab />}
    </div>
  )
}

/* ───────────────── Programs preset ───────────────── */

function ProgramsTab() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<TrainingProgram | null>(null)

  useEffect(() => {
    trainingService.listPrograms()
      .then((r) => setPrograms(r.programs))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error cargando programas'))
      .finally(() => setLoading(false))
  }, [])

  const handleOpen = async (p: TrainingProgram) => {
    try {
      const full = await trainingService.getProgram(p.id)
      setActive(full)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos cargar el detalle')
    }
  }

  return (
    <div className="ph-section">
      <div className="section-label">Programas plantilla</div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}

      {loading && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Cargando…</p>
        </div>
      )}

      {!loading && programs.length === 0 && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Sin programas registrados.
          </p>
        </div>
      )}

      {programs.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          {programs.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleOpen(p)}
              style={{
                width: '100%',
                background: active?.id === p.id ? 'rgba(125,140,255,0.06)' : 'transparent',
                border: 0,
                borderTop: i === 0 ? 0 : '1px solid var(--line)',
                padding: '12px 14px',
                textAlign: 'left',
                color: 'var(--text-1)',
                cursor: 'pointer',
              }}
            >
              <div className="ph-link-name">{p.nombre}</div>
              {p.descripcion && <div className="ph-link-meta">{p.descripcion}</div>}
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                {p.duracion_semanas ? `${p.duracion_semanas} semanas · ` : ''}
                {p.dias_por_semana ? `${p.dias_por_semana} días/semana` : ''}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ───────────────── Exercises (v1) ───────────────── */

function ExercisesTab() {
  const [exercises, setExercises] = useState<ExerciseDef[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    trainingService.listExercises()
      .then((r) => setExercises(r.exercises))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error cargando ejercicios'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = exercises.filter((e) => {
    if (!q) return true
    return e.nombre.toLowerCase().includes(q.toLowerCase())
        || (e.key || '').toLowerCase().includes(q.toLowerCase())
  })

  return (
    <>
      <div className="dp-search">
        <span className="dp-search-icon"><Icon name="search" size={18} /></span>
        <input
          type="search"
          className="dp-search-input"
          placeholder="Buscar ejercicio…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Catálogo</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>
            {loading ? '…' : `${filtered.length}`}
          </div>
        </div>
        {filtered.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {filtered.slice(0, 50).map((e, i) => (
              <div
                key={e.key}
                style={{
                  borderTop: i === 0 ? 0 : '1px solid var(--line)',
                  padding: '10px 14px',
                }}
              >
                <div className="ph-link-name">{e.nombre}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                  {e.key}
                  {e.musculo_principal ? ` · ${e.musculo_principal}` : ''}
                  {e.equipamiento ? ` · ${e.equipamiento}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/* ───────────────── v2 catalogs (exercises + progressions + distributions) ───────────────── */

function V2LibraryTab() {
  const [exercises, setExercises] = useState<V2Exercise[]>([])
  const [progressions, setProgressions] = useState<V2Progression[]>([])
  const [distributions, setDistributions] = useState<V2Distribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      trainingService.v2.listExercises().catch(() => ({ exercises: [] })),
      trainingService.v2.listProgressions().catch(() => ({ progressions: [] })),
      trainingService.v2.listDistributions().catch(() => ({ distributions: [] })),
    ])
      .then(([e, p, d]) => {
        setExercises(e.exercises)
        setProgressions(p.progressions)
        setDistributions(d.distributions)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Error cargando catálogo v2'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}

      {loading && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Cargando catálogo v2…</p>
        </div>
      )}

      {!loading && (
        <>
          <div className="ph-section">
            <div className="row-between" style={{ marginBottom: 10 }}>
              <div className="section-label">Ejercicios v2</div>
              <div className="mono" style={{ color: 'var(--text-3)' }}>{exercises.length}</div>
            </div>
            <div className="card" style={{ padding: 0 }}>
              {exercises.slice(0, 20).map((e, i) => (
                <div
                  key={e.key}
                  style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)', padding: '8px 14px' }}
                >
                  <div className="ph-link-name" style={{ fontSize: 13 }}>{e.nombre}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    {e.key} · {e.categoria || '—'}{e.tested ? ' · TEST' : ''}{e.unilateral ? ' · unilateral' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ph-section">
            <div className="row-between" style={{ marginBottom: 10 }}>
              <div className="section-label">Progresiones</div>
              <div className="mono" style={{ color: 'var(--text-3)' }}>{progressions.length}</div>
            </div>
            <div className="card" style={{ padding: 0 }}>
              {progressions.map((p, i) => (
                <div
                  key={p.key}
                  style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)', padding: '8px 14px' }}
                >
                  <div className="ph-link-name" style={{ fontSize: 13 }}>{p.nombre}</div>
                  {p.step_pattern && (
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                      {p.step_pattern}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="ph-section">
            <div className="row-between" style={{ marginBottom: 10 }}>
              <div className="section-label">Distribuciones</div>
              <div className="mono" style={{ color: 'var(--text-3)' }}>{distributions.length}</div>
            </div>
            <div className="card" style={{ padding: 0 }}>
              {distributions.map((d, i) => (
                <div
                  key={d.key}
                  style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)', padding: '8px 14px' }}
                >
                  <div className="ph-link-name" style={{ fontSize: 13 }}>{d.nombre}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    {d.days != null ? `${d.days} días` : ''}
                    {d.blocks ? ` · ${d.blocks.length} bloques` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}

/* ───────────────── v2 plans + progress + sessions ───────────────── */

function V2PlansTab() {
  const [plans, setPlans] = useState<V2Plan[]>([])
  const [progress, setProgress] = useState<V2ProgressRow[]>([])
  const [stats, setStats] = useState<V2Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [advancing, setAdvancing] = useState<number | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pl, pr, st] = await Promise.all([
        trainingService.v2.listPlans().catch(() => ({ plans: [], total: 0 })),
        trainingService.v2.progress().catch(() => ({ progress: [], total: 0 })),
        trainingService.v2.stats().catch(() => null),
      ])
      setPlans(pl.plans)
      setProgress(pr.progress)
      setStats(st)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando v2')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const handleAdvance = async (planId: number) => {
    setAdvancing(planId)
    try {
      await trainingService.v2.advancePlan(planId)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos avanzar')
    } finally {
      setAdvancing(null)
    }
  }

  return (
    <>
      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="ah-stats">
          <div className="stat">
            <div className="k">Sesiones</div>
            <div className="v">{stats.total_sessions ?? '—'}</div>
            <div className="d">totales</div>
          </div>
          <div className="stat">
            <div className="k">Semanas</div>
            <div className="v">{stats.weeks_trained ?? '—'}</div>
            <div className="d">entrenadas</div>
          </div>
          <div className="stat">
            <div className="k">Volumen</div>
            <div className="v">{stats.total_volume_kg ? Math.round(stats.total_volume_kg) : '—'}</div>
            <div className="d">kg</div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Planes activos / históricos</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>
            {loading ? '…' : `${plans.length}`}
          </div>
        </div>
        {!loading && plans.length === 0 && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Sin planes v2.</p>
          </div>
        )}
        {plans.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {plans.map((p, i) => (
              <div
                key={p.id}
                style={{
                  borderTop: i === 0 ? 0 : '1px solid var(--line)',
                  padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ph-link-name">{p.name || `Plan #${p.id}`}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    Día {p.current_day}/{p.total_days} · Sem {p.cycle_week}
                    {p.active ? ' · activo' : ''}
                  </div>
                </div>
                {p.active && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', fontSize: 11 }}
                    onClick={() => handleAdvance(p.id)}
                    disabled={advancing === p.id}
                  >
                    Avanzar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress per exercise */}
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Progreso por ejercicio</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>{progress.length}</div>
        </div>
        {progress.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {progress.slice(0, 15).map((row, i) => (
              <div
                key={row.exercise_key}
                style={{
                  borderTop: i === 0 ? 0 : '1px solid var(--line)',
                  padding: '8px 14px',
                }}
              >
                <div className="ph-link-name" style={{ fontSize: 13 }}>{row.exercise_key}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  {row.current_level || '—'}
                  {row.current_weight != null ? ` · ${row.current_weight} kg` : ''}
                  {row.sessions_count != null ? ` · ${row.sessions_count} sesiones` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/* ───────────────── Strength history + standards ───────────────── */

function StrengthHistoryTab() {
  const [history, setHistory] = useState<StrengthTest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      trainingService.strengthHistory().catch(() => ({ tests: [] as StrengthTest[] })),
      trainingService.strengthStandards().catch(() => null),
    ])
      .then(([h, st]) => {
        setHistory(h.tests)
        // Standards loaded on-demand — pre-warming the endpoint so the
        // doctor sees coverage in the audit log. Result is intentionally
        // discarded; the catalog is consulted inline by future flows.
        void st
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error cargando historial'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Tests de fuerza</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>
            {loading ? '…' : `${history.length}`}
          </div>
        </div>
        {!loading && history.length === 0 && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              Sin historial de tests.
            </p>
          </div>
        )}
        {history.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {history.map((t, i) => (
              <div
                key={t.id}
                style={{
                  borderTop: i === 0 ? 0 : '1px solid var(--line)',
                  padding: '10px 14px',
                }}
              >
                <div className="ph-link-name" style={{ fontSize: 13 }}>{t.fecha}</div>
                {t.peso_corporal != null && (
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    Peso corporal: {t.peso_corporal} kg
                  </div>
                )}
                {t.lift_inputs_json && (
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                    {Object.entries(t.lift_inputs_json).map(([lift, vals]) => (
                      <span key={lift} style={{ marginRight: 8 }}>
                        {lift}: {vals.peso ?? '—'}×{vals.reps ?? '—'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
