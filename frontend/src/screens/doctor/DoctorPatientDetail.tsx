import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { userService } from '../../services/userService'
import { measurementService } from '../../services/measurementService'
import { goalService } from '../../services/goalService'
import { ApiError } from '../../services/apiClient'
import type { Goal, Measurement, NextStepResponse, SavedRoadmap, StaticProfile } from '../../types/api'
import { EditConstitutionalSheet } from '../../components/EditConstitutionalSheet'
import { NewMeasurementSheet } from '../../components/NewMeasurementSheet'
import { ProposeGoalSheet } from '../../components/ProposeGoalSheet'
import { PatientNutritionPlan } from './PatientNutritionPlan'
import { PatientTrainingPlan } from './PatientTrainingPlan'

interface Props {
  patientId: number | null
  onClose?: () => void
}

const TABS = ['Resumen', 'Historial', 'Planes', 'Labs', 'Archivos'] as const
type Tab = (typeof TABS)[number]

interface PlanRow {
  label: string
  sub: string
  color: string
}

const PLANS: PlanRow[] = [
  { label: 'Entreno · sin plan', sub: 'Asignar plan de entrenamiento', color: 'var(--omega)' },
  { label: 'Nutri · sin plan', sub: 'Asignar plan alimentario', color: 'var(--nutri)' },
  { label: 'Programa · sin programa', sub: 'Asignar programa clínico', color: 'var(--medic)' },
]

function fmt(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined) return '—'
  return value.toFixed(digits)
}

function formatAge(fecha?: string | null): string {
  if (!fecha) return '—'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  return `${years} años`
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return iso
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function DoctorPatientDetail({ patientId, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('Resumen')
  const [profile, setProfile] = useState<StaticProfile | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)
  const [proposedGoal, setProposedGoal] = useState<Goal | null>(null)
  const [roadmap, setRoadmap] = useState<SavedRoadmap | null>(null)
  const [nextStep, setNextStep] = useState<NextStepResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editProfile, setEditProfile] = useState(false)
  const [newMeasurement, setNewMeasurement] = useState(false)
  const [proposeGoal, setProposeGoal] = useState(false)
  const [completingGoal, setCompletingGoal] = useState(false)
  const [planesSubTab, setPlanesSubTab] = useState<'nutricion' | 'entreno'>('nutricion')

  const reload = useCallback(async () => {
    if (patientId === null) return
    setLoading(true)
    setError(null)
    try {
      const [p, m, gActive, gProposed, rm, ns] = await Promise.all([
        userService.getStaticProfile(patientId),
        measurementService.list(patientId).catch((e) => {
          if (e instanceof ApiError) return { user_id: '', nombre_apellido: '', measurements: [], total: 0 }
          throw e
        }),
        goalService.getActive(patientId).catch(() => ({ user_id: '', goal: null })),
        goalService.getProposed(patientId).catch(() => ({ user_id: '', goal: null })),
        goalService.getActiveRoadmap(patientId).catch(() => ({ roadmap: null })),
        goalService.getNextStep(patientId).catch(() => null),
      ])
      setProfile(p)
      setMeasurements(m.measurements)
      setActiveGoal(gActive.goal)
      setProposedGoal(gProposed.goal)
      setRoadmap(rm.roadmap)
      setNextStep(ns)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando paciente')
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => { reload() }, [reload])

  const latest = measurements[0] ?? null
  const previous = measurements[1] ?? null
  const isEmpty = patientId === null

  const handleCompleteGoal = async () => {
    if (!patientId || !activeGoal) return
    if (!confirm('¿Marcar el objetivo como completado?')) return
    setCompletingGoal(true)
    try {
      await goalService.complete(patientId, activeGoal.id)
      await reload()
    } finally {
      setCompletingGoal(false)
    }
  }

  return (
    <div className="dpd-screen" data-mod="medicine">
      {/* Top bar */}
      <div className="dpd-top">
        <button type="button" className="dpd-close" aria-label="Volver" onClick={onClose}>
          <Icon name="chevL" size={22} />
        </button>
        <div className="mono">Ficha de paciente</div>
        <button type="button" className="dpd-more" aria-label="Más opciones">
          <Icon name="more" size={20} />
        </button>
      </div>

      {/* Patient header */}
      <div className="dpd-patient">
        <div className="dpd-avatar">
          {profile ? initials(profile.nombre) : '—'}
        </div>
        <div className="dpd-patient-info">
          <div className="dpd-patient-name">
            {loading ? 'Cargando…' : profile?.nombre || 'Sin paciente seleccionado'}
          </div>
          <div className="dpd-patient-bio">
            {profile
              ? `${formatAge(profile.fecha_nacimiento)} · ${profile.altura ? profile.altura + ' cm' : 'altura —'} · ${profile.sexo || '—'}`
              : '— años · — · Fase: —'}
          </div>
        </div>
        <button type="button" className="dpd-video-btn" aria-label="Iniciar videollamada">
          <Icon name="video" size={18} />
        </button>
      </div>

      {/* Quick stats — pulled from latest measurement when available */}
      <div className="dpd-stats">
        {[
          { k: 'Peso', value: latest?.peso, u: 'kg', c: 'var(--analytic)' },
          { k: '% Grasa', value: latest?.bf_percent, u: '%', c: 'var(--medic)' },
          { k: 'Magro', value: latest?.peso_magro, u: 'kg', c: 'var(--omega)' },
          { k: 'FFMI', value: latest?.ffmi, u: '', c: 'var(--ok)' },
        ].map((s) => (
          <div key={s.k} className="dpd-stat">
            <div className="dpd-stat-k">{s.k}</div>
            <div className="dpd-stat-v" style={{ color: s.c }}>{fmt(s.value)}</div>
            <div className="dpd-stat-u">{s.u}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="dpd-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={'dpd-tab' + (tab === t ? ' is-active' : '')}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}

      {tab === 'Resumen' && !isEmpty && (
        <>
          {/* Constitutional profile card */}
          <div className="ph-section">
            <div className="row-between" style={{ marginBottom: 10 }}>
              <div className="section-label">Datos constitucionales</div>
              {profile && !profile.perfil_completo && (
                <span className="dpd-incomplete-badge mono">incompleto</span>
              )}
            </div>
            <div className="card">
              <div className="dpd-const-grid">
                <Field label="Sexo" value={profile?.sexo} />
                <Field label="Altura" value={profile?.altura ? `${profile.altura} cm` : null} />
                <Field label="Envergadura" value={profile?.envergadura ? `${profile.envergadura} cm` : null} />
                <Field label="C. Cuello" value={profile?.circ_cuello ? `${profile.circ_cuello} cm` : null} />
                <Field label="C. Muñeca" value={profile?.circ_muneca ? `${profile.circ_muneca} cm` : null} />
                <Field label="C. Tobillo" value={profile?.circ_tobillo ? `${profile.circ_tobillo} cm` : null} />
              </div>
              <button
                type="button"
                className="btn btn-full dpd-edit-btn"
                onClick={() => setEditProfile(true)}
                disabled={loading || !profile}
              >
                <Icon name="edit" size={14} />
                {profile?.perfil_completo ? 'Editar datos' : 'Completar datos'}
              </button>
            </div>
          </div>

          {/* Measurements */}
          <div className="ph-section">
            <div className="row-between" style={{ marginBottom: 10 }}>
              <div className="section-label">Mediciones</div>
              <div className="mono" style={{ color: 'var(--text-3)' }}>
                {measurements.length} registro{measurements.length === 1 ? '' : 's'}
              </div>
            </div>
            {latest ? (
              <div className="card">
                <div className="row-between" style={{ marginBottom: 8 }}>
                  <div>
                    <div className="mono" style={{ color: 'var(--medic)' }}>Última</div>
                    <div className="dpd-latest-date">{formatDate(latest.fecha)}</div>
                  </div>
                </div>
                <div className="dpd-latest-grid">
                  <Metric k="Peso" v={fmt(latest.peso)} u="kg" delta={delta(latest.peso, previous?.peso)} c="var(--analytic)" />
                  <Metric k="% Grasa" v={fmt(latest.bf_percent)} u="%" delta={delta(latest.bf_percent, previous?.bf_percent)} c="var(--medic)" />
                  <Metric k="Magro" v={fmt(latest.peso_magro)} u="kg" delta={delta(latest.peso_magro, previous?.peso_magro)} c="var(--omega)" />
                  <Metric k="Graso" v={fmt(latest.peso_graso)} u="kg" delta={delta(latest.peso_graso, previous?.peso_graso)} c="var(--nutri)" />
                </div>
              </div>
            ) : (
              <div className="card">
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
                  Sin mediciones registradas todavía.
                </p>
              </div>
            )}
            <button
              type="button"
              className="btn btn-full dpd-new-meas-btn"
              onClick={() => setNewMeasurement(true)}
              disabled={!profile?.perfil_completo}
              title={!profile?.perfil_completo ? 'Completá los datos constitucionales primero' : ''}
            >
              <Icon name="plus" size={14} /> Nueva medición
            </button>
            {!profile?.perfil_completo && profile && (
              <p className="dpd-blocker mono">
                Cargá sexo, altura y circ. cuello para habilitar mediciones.
              </p>
            )}
          </div>

          {/* Objetivo activo */}
          <div className="ph-section">
            <div className="row-between" style={{ marginBottom: 10 }}>
              <div className="section-label">Objetivo</div>
              {proposedGoal && (
                <span className="dpd-incomplete-badge mono" style={{ background: 'rgba(125,140,255,0.15)', color: 'var(--analytic)', borderColor: 'rgba(125,140,255,0.3)' }}>
                  esperando paciente
                </span>
              )}
            </div>
            {activeGoal ? (
              <GoalCard
                goal={activeGoal}
                latest={latest}
                onComplete={handleCompleteGoal}
                completing={completingGoal}
              />
            ) : proposedGoal ? (
              <div className="card">
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
                  Hay una propuesta en espera. El paciente debe aceptarla para activarla.
                </p>
                <GoalSummary goal={proposedGoal} latest={latest} />
              </div>
            ) : (
              <div className="card">
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
                  Sin objetivo activo. Proponé uno para que el paciente lo acepte.
                </p>
              </div>
            )}
            <button
              type="button"
              className="btn btn-full dpd-new-meas-btn"
              onClick={() => setProposeGoal(true)}
              disabled={!profile || !!proposedGoal}
              title={proposedGoal ? 'Ya hay una propuesta en espera' : ''}
              style={{ background: 'var(--analytic)', color: '#fff' }}
            >
              <Icon name="target" size={14} /> {activeGoal ? 'Proponer nuevo objetivo' : 'Proponer objetivo'}
            </button>
          </div>

          {/* Roadmap activo (auto-calculado y persistido) */}
          {roadmap && roadmap.fases && roadmap.fases.length > 0 && (
            <div className="ph-section">
              <div className="row-between" style={{ marginBottom: 10 }}>
                <div className="section-label">Plan multi-fase</div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  {nextStep && !nextStep.completed
                    ? `${(nextStep.completed_phases ?? 0)} / ${nextStep.total_phases ?? roadmap.fases.length}`
                    : `${roadmap.fases.length} fases`}
                </span>
              </div>
              <RoadmapTimeline
                roadmap={roadmap}
                activePhaseIdx={
                  activeGoal?.source_roadmap_id === roadmap.id
                    ? activeGoal.source_phase_index ?? null
                    : null
                }
                nextPhaseIdx={nextStep?.next_phase_index ?? null}
                completedCount={nextStep?.completed_phases ?? 0}
              />
            </div>
          )}

          {/* Planes activos placeholder */}
          <div className="ph-section">
            <div className="section-label">Planes activos</div>
            <div className="dpd-plans">
              {PLANS.map((p) => (
                <div key={p.label} className="card dpd-plan">
                  <div className="dpd-plan-bar" style={{ background: p.color }} />
                  <div style={{ flex: 1 }}>
                    <div className="dpd-plan-label">{p.label}</div>
                    <div className="dpd-plan-sub">{p.sub}</div>
                  </div>
                  <Icon name="edit" size={16} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'Historial' && !isEmpty && (
        <div className="card" style={{ padding: 0 }}>
          {measurements.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, padding: 14 }}>
              Sin historial de mediciones.
            </p>
          ) : (
            measurements.map((m, i) => (
              <div
                key={m.id}
                className="dpd-history-row"
                style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
              >
                <div style={{ flex: 1 }}>
                  <div className="dpd-history-date">{formatDate(m.fecha)}</div>
                  <div className="dpd-history-line">
                    <span style={{ color: 'var(--analytic)' }}>{fmt(m.peso)} kg</span>
                    {' · '}
                    <span style={{ color: 'var(--medic)' }}>{fmt(m.bf_percent)}%</span>
                    {' · '}
                    <span style={{ color: 'var(--text-2)' }}>FFMI {fmt(m.ffmi)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'Planes' && !isEmpty && profile && (
        <>
          {/* Sub-tab toggle: Nutrición / Entreno */}
          <div className="goal-mode-toggle" style={{ marginBottom: 12 }}>
            <button
              type="button"
              className={'goal-mode-chip' + (planesSubTab === 'nutricion' ? ' is-active' : '')}
              onClick={() => setPlanesSubTab('nutricion')}
            >
              <Icon name="nutrition" size={14} /> Nutrición
            </button>
            <button
              type="button"
              className={'goal-mode-chip' + (planesSubTab === 'entreno' ? ' is-active' : '')}
              onClick={() => setPlanesSubTab('entreno')}
            >
              <Icon name="training" size={14} /> Entreno
            </button>
          </div>
          {planesSubTab === 'nutricion' && (
            <PatientNutritionPlan patientId={patientId!} patientName={profile.nombre} />
          )}
          {planesSubTab === 'entreno' && (
            <PatientTrainingPlan patientId={patientId!} patientName={profile.nombre} />
          )}
        </>
      )}

      {(tab === 'Labs' || tab === 'Archivos') && !isEmpty && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            {tab === 'Labs' && 'Sin laboratorios cargados.'}
            {tab === 'Archivos' && 'Sin archivos compartidos.'}
          </p>
        </div>
      )}

      {isEmpty && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Sin paciente seleccionado.
          </p>
        </div>
      )}

      {/* Sheets */}
      {profile && editProfile && (
        <EditConstitutionalSheet
          profile={profile}
          onClose={() => setEditProfile(false)}
          onSaved={() => {
            setEditProfile(false)
            reload()
          }}
        />
      )}
      {profile && newMeasurement && (
        <NewMeasurementSheet
          profile={profile}
          onClose={() => setNewMeasurement(false)}
          onSaved={() => {
            setNewMeasurement(false)
            reload()
          }}
        />
      )}
      {profile && proposeGoal && (
        <ProposeGoalSheet
          profile={profile}
          latestMeasurement={latest}
          onClose={() => setProposeGoal(false)}
          onSaved={() => {
            setProposeGoal(false)
            reload()
          }}
        />
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Goal display helpers
// ──────────────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  latest,
  onComplete,
  completing,
}: {
  goal: Goal
  latest: Measurement | null
  onComplete: () => void
  completing: boolean
}) {
  return (
    <div className="card goal-card">
      <div className="row-between" style={{ marginBottom: 6 }}>
        <div className="mono" style={{ color: 'var(--analytic)' }}>
          {goal.categoria || goal.tipo || 'Objetivo'}
        </div>
        {goal.meses_estimados && (
          <div className="mono" style={{ color: 'var(--text-3)' }}>
            {goal.meses_estimados} {goal.meses_estimados === 1 ? 'mes' : 'meses'}
          </div>
        )}
      </div>
      <GoalSummary goal={goal} latest={latest} />
      {goal.notas && (
        <p className="goal-notas">{goal.notas}</p>
      )}
      <button
        type="button"
        className="btn btn-full"
        onClick={onComplete}
        disabled={completing}
        style={{
          marginTop: 10,
          background: 'var(--ok)',
          color: '#0a1a0a',
          fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        <Icon name="check" size={14} /> {completing ? 'Marcando…' : 'Marcar como completado'}
      </button>
    </div>
  )
}

function GoalSummary({ goal, latest }: { goal: Goal; latest: Measurement | null }) {
  const targets: { k: string; v: number | null; current: number | null | undefined; u: string; c: string }[] = [
    { k: 'Peso', v: goal.peso_objetivo, current: latest?.peso, u: 'kg', c: 'var(--analytic)' },
    { k: '% Grasa', v: goal.bf_objetivo, current: latest?.bf_percent, u: '%', c: 'var(--medic)' },
    { k: 'FFMI', v: goal.ffmi_objetivo, current: latest?.ffmi, u: '', c: 'var(--ok)' },
  ].filter((t) => t.v != null)

  if (targets.length === 0) {
    return <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '6px 0 0' }}>Sin targets definidos.</p>
  }

  return (
    <div className="goal-targets">
      {targets.map((t) => {
        const d = t.current != null && t.v != null ? t.v - t.current : null
        return (
          <div key={t.k} className="goal-target">
            <div className="mono" style={{ color: 'var(--text-3)' }}>{t.k}</div>
            <div className="goal-target-row">
              {t.current != null && (
                <span style={{ color: 'var(--text-3)' }}>{t.current.toFixed(1)} →</span>
              )}
              <span style={{ color: t.c, fontWeight: 600 }}>{t.v!.toFixed(1)}{t.u}</span>
              {d != null && Math.abs(d) >= 0.05 && (
                <span className="goal-target-delta" style={{ color: d > 0 ? 'var(--ok)' : 'var(--omega)' }}>
                  ({d > 0 ? '+' : ''}{d.toFixed(1)})
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RoadmapTimeline({
  roadmap,
  activePhaseIdx,
  nextPhaseIdx,
  completedCount,
}: {
  roadmap: SavedRoadmap
  activePhaseIdx: number | null
  nextPhaseIdx: number | null
  completedCount: number
}) {
  return (
    <div className="card roadmap-card">
      <ol className="roadmap-list">
        {roadmap.fases.map((p, i) => {
          const isActive = activePhaseIdx === i
          const isNext = !isActive && nextPhaseIdx === i
          const isDone = i < completedCount
          const cls = ['roadmap-step']
          if (isActive) cls.push('is-active')
          else if (isNext) cls.push('is-next')
          else if (isDone) cls.push('is-done')
          return (
            <li key={i} className={cls.join(' ')}>
              <div className="roadmap-step-marker">{isDone ? '✓' : i + 1}</div>
              <div className="roadmap-step-body">
                <div className="roadmap-step-head">
                  <span className={'goal-auto-phase-tag goal-auto-phase-tag--' + p.tipo}>
                    {p.tipo === 'definicion' ? 'Corte' : 'Volumen'}
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    ~{p.tiempo_meses} m
                  </span>
                </div>
                <div className="roadmap-step-desc">{p.descripcion}</div>
                <div className="roadmap-step-meta mono">
                  {p.peso_objetivo} kg · {p.bf_objetivo}% BF · FFMI {p.ffmi_objetivo}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
      {nextPhaseIdx != null && roadmap.fases[nextPhaseIdx] && (
        <div className="roadmap-footer mono">
          Próxima fase pendiente: <strong>#{nextPhaseIdx + 1} · {roadmap.fases[nextPhaseIdx].descripcion}</strong>
        </div>
      )}
    </div>
  )
}

function initials(name: string): string {
  if (!name) return '—'
  const parts = name.includes(',')
    ? name.split(',').reverse().join(' ').trim().split(/\s+/)
    : name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase() || '—'
}

function delta(curr: number | null | undefined, prev: number | null | undefined): string | null {
  if (curr == null || prev == null) return null
  const d = curr - prev
  if (Math.abs(d) < 0.05) return null
  return (d > 0 ? '+' : '') + d.toFixed(1)
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="dpd-const-field">
      <div className="dpd-const-label mono">{label}</div>
      <div className="dpd-const-value">{value || '—'}</div>
    </div>
  )
}

function Metric({ k, v, u, delta, c }: { k: string; v: string; u: string; delta: string | null; c: string }) {
  return (
    <div>
      <div className="dpd-stat-k">{k}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
        <span style={{ fontSize: 18, fontWeight: 500, color: c }}>{v}</span>
        {u && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{u}</span>}
      </div>
      {delta && (
        <div
          style={{
            fontSize: 10,
            color: delta.startsWith('+') ? 'var(--ok)' : 'var(--omega)',
            fontFamily: 'var(--font-mono)',
            marginTop: 2,
          }}
        >
          {delta}
        </div>
      )}
    </div>
  )
}
