import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { Avatar, Progress } from '../components/atoms'
import { analyticsService } from '../services/analyticsService'
import { assignmentService } from '../services/assignmentService'
import { checkinService } from '../services/checkinService'
import { engagementService } from '../services/engagementService'
import { goalService } from '../services/goalService'
import { measurementService } from '../services/measurementService'
import { ApiError } from '../services/apiClient'
import type {
  EngagementInsight,
  Goal,
  GoalProjection,
  HealthIndex,
  MyRequest,
  MySpecialist,
  PendingAssignment,
  Reminder,
  UserTask,
} from '../types/api'

type ModuleKey = 'training' | 'nutrition' | 'medicine' | 'performance'

interface ModuleTile {
  key: ModuleKey
  label: string
  sub: string
  icon: IconName
  color: string
}

/** Health-Index has 7 components weighted 35/20/15/10/10/5/5. For the home
 *  card we collapse them into 4 conceptual buckets matching the design. */
function healthStats(hi: HealthIndex | null): { k: string; v: number; c: string }[] {
  if (!hi) {
    return [
      { k: 'Sueño', v: 0, c: 'var(--analytic)' },
      { k: 'Nutri', v: 0, c: 'var(--nutri)' },
      { k: 'Entreno', v: 0, c: 'var(--omega)' },
      { k: 'Ánimo', v: 0, c: 'var(--medic)' },
    ]
  }
  return [
    { k: 'Sueño', v: Math.round(hi.comp_sueno || 0), c: 'var(--analytic)' },
    { k: 'Cuerpo', v: Math.round(hi.comp_corporal || 0), c: 'var(--nutri)' },
    { k: 'Activ.', v: Math.round(hi.comp_actividad || 0), c: 'var(--omega)' },
    { k: 'Ánimo', v: Math.round(hi.comp_recuperacion || 0), c: 'var(--medic)' },
  ]
}

const ROLE_LABEL: Record<string, string> = {
  doctor: 'Médico',
  nutricionista: 'Nutricionista',
  nutritionist: 'Nutricionista',
  entrenador: 'Entrenador',
  trainer: 'Entrenador',
}

const ROLE_COLOR: Record<string, string> = {
  doctor: '#4FB8A8',
  nutricionista: '#E8A93A',
  nutritionist: '#E8A93A',
  entrenador: '#7D8CFF',
  trainer: '#7D8CFF',
}

interface Props {
  userName?: string
  userId?: string | null
  onCheckIn?: () => void
  onBrowseSpecialists?: () => void
  onOpenModule?: (m: ModuleKey) => void
}

export function PatientHome({ userId, onCheckIn, onBrowseSpecialists, onOpenModule }: Props = {}) {
  const [specialists, setSpecialists] = useState<MySpecialist[]>([])
  const [incoming, setIncoming] = useState<PendingAssignment[]>([])
  const [outgoing, setOutgoing] = useState<MyRequest[]>([])
  const [loadingLinks, setLoadingLinks] = useState(true)
  const [actingId, setActingId] = useState<number | null>(null)
  const [linksError, setLinksError] = useState<string | null>(null)
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)
  const [projection, setProjection] = useState<GoalProjection | null>(null)
  const [healthIndex, setHealthIndex] = useState<HealthIndex | null>(null)
  const [healthDelta, setHealthDelta] = useState<number | null>(null)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [tasks, setTasks] = useState<UserTask[]>([])
  const [insights, setInsights] = useState<EngagementInsight[]>([])
  const [completingReminder, setCompletingReminder] = useState<number | null>(null)
  const [completingTask, setCompletingTask] = useState<number | null>(null)

  const reloadLinks = useCallback(async () => {
    setLoadingLinks(true)
    setLinksError(null)
    try {
      const [sp, inc, out] = await Promise.all([
        assignmentService.mySpecialists().catch(() => ({ specialists: [] })),
        assignmentService.pendingForPatient().catch(() => ({ pending: [] })),
        assignmentService.myOutgoingRequests().catch(() => ({ requests: [] })),
      ])
      setSpecialists(sp.specialists)
      setIncoming(inc.pending)
      setOutgoing(out.requests)
    } catch (e) {
      setLinksError(e instanceof ApiError ? e.message : 'Error cargando vínculos')
    } finally {
      setLoadingLinks(false)
    }
  }, [])

  const reloadGoal = useCallback(async () => {
    if (!userId) return
    const [gp, proj] = await Promise.all([
      goalService.getActive(userId).catch(() => ({ user_id: '', goal: null })),
      analyticsService.projection().catch(() => null),
    ])
    setActiveGoal(gp.goal)
    setProjection(proj)
    // Fire-and-forget — keeps the latest measurement around for any other UI
    // that needs it. The home doesn't render it itself anymore.
    measurementService.list(userId, 1).catch(() => null)
  }, [userId])

  const reloadHealth = useCallback(async () => {
    try {
      const [hi, trend] = await Promise.all([
        checkinService.getHealthIndex().catch(() => null),
        checkinService.getHealthIndexTrend(7).catch(() => ({ trend: [], total: 0 })),
      ])
      setHealthIndex(hi)
      if (hi && trend.trend.length >= 2) {
        const prev = trend.trend[trend.trend.length - 2]
        setHealthDelta(hi.score - prev.score)
      } else {
        setHealthDelta(null)
      }
    } catch {
      setHealthIndex(null)
      setHealthDelta(null)
    }
  }, [])

  const reloadEngagement = useCallback(async () => {
    const [remRes, taskRes, insRes] = await Promise.all([
      engagementService.listReminders({ status: 'pending', limit: 5 }).catch(() => ({ reminders: [], total: 0 })),
      engagementService.listTasks({ status: 'pending', limit: 5 }).catch(() => ({ tasks: [], total: 0 })),
      engagementService.insights().catch(() => ({ insights: [], total: 0 })),
    ])
    setReminders(remRes.reminders)
    setTasks(taskRes.tasks)
    setInsights(insRes.insights.slice(0, 3))
  }, [])

  useEffect(() => { reloadLinks() }, [reloadLinks])
  useEffect(() => { reloadGoal() }, [reloadGoal])
  useEffect(() => { reloadHealth() }, [reloadHealth])
  useEffect(() => { reloadEngagement() }, [reloadEngagement])

  const handleCompleteReminder = async (id: number) => {
    setCompletingReminder(id)
    try {
      await engagementService.completeReminder(id)
      await reloadEngagement()
    } catch {
      // swallow — list stays as-is
    } finally {
      setCompletingReminder(null)
    }
  }

  const handleCompleteTask = async (id: number) => {
    setCompletingTask(id)
    try {
      await engagementService.updateTask(id, { status: 'completed' })
      await reloadEngagement()
    } catch {
      // swallow
    } finally {
      setCompletingTask(null)
    }
  }

  const handleAccept = async (id: number) => {
    setActingId(id)
    try {
      await assignmentService.accept(id)
      await reloadLinks()
    } finally {
      setActingId(null)
    }
  }
  const handleReject = async (id: number) => {
    if (!confirm('¿Rechazar esta solicitud?')) return
    setActingId(id)
    try {
      await assignmentService.reject(id)
      await reloadLinks()
    } finally {
      setActingId(null)
    }
  }
  const handleCancel = async (id: number) => {
    if (!confirm('¿Cancelar esta solicitud?')) return
    setActingId(id)
    try {
      await assignmentService.cancel(id)
      await reloadLinks()
    } finally {
      setActingId(null)
    }
  }

  const hasAnyLinks = specialists.length + incoming.length + outgoing.length > 0

  return (
    <div className="patient-home">
      {/* Health Index hero */}
      <div className="card ph-health">
        <div className="row-between">
          <div className="mono">Health Index · hoy</div>
          <Icon name="chevR" size={16} />
        </div>
        <div className="ph-health-score">
          <div className="ph-score-num">{healthIndex ? Math.round(healthIndex.score) : '—'}</div>
          <div
            className="ph-score-delta"
            style={
              healthDelta == null
                ? undefined
                : { color: healthDelta >= 0 ? 'var(--ok)' : 'var(--omega)' }
            }
          >
            {healthDelta == null ? (
              <>
                <Icon name="arrowUp" size={12} /> {healthIndex ? 'Hoy' : 'Sin datos'}
              </>
            ) : (
              <>
                <Icon name={healthDelta >= 0 ? 'arrowUp' : 'arrowDown'} size={12} />
                {healthDelta > 0 ? '+' : ''}
                {Math.round(healthDelta)} pts vs ayer
              </>
            )}
          </div>
        </div>
        <div className="ph-stats">
          {healthStats(healthIndex).map((s) => (
            <div key={s.k}>
              <div className="mono ph-stat-k">{s.k}</div>
              <div className="ph-stat-v" style={{ color: s.c }}>
                {healthIndex ? s.v : '—'}
              </div>
              <Progress value={s.v} color={s.c} />
            </div>
          ))}
        </div>
      </div>

      {/* Proyección hacia el objetivo */}
      {projection && projection.goal && (
        <div className="ph-section">
          <div
            className="card"
            style={{
              background: 'linear-gradient(160deg, rgba(232,169,58,0.10), rgba(125,140,255,0.04)), var(--bg-1)',
              border: '1px solid rgba(232,169,58,0.30)',
            }}
          >
            <div className="row-between" style={{ marginBottom: 6 }}>
              <div
                className="mono"
                style={{
                  color: 'var(--warn)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Proyección
              </div>
              <div style={{ fontSize: 14 }}>
                {'★'.repeat(projection.stars)}<span style={{ color: 'var(--text-3)' }}>{'★'.repeat(Math.max(0, 5 - projection.stars))}</span>
              </div>
            </div>
            {projection.estimates ? (
              <>
                <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-1)' }}>
                  {projection.estimates.dias} días
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', margin: '4px 0' }}>
                  para llegar a tu objetivo · ETA{' '}
                  {new Date(projection.estimates.fecha_estimada).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6 }}>
                  Score {Math.round(projection.score)}/100
                  {projection.rates?.peso_kg_per_week != null && ` · Ritmo ${projection.rates.peso_kg_per_week > 0 ? '+' : ''}${projection.rates.peso_kg_per_week.toFixed(2)} kg/sem`}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>
                  Aún no puedo proyectar
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>
                  Necesito más mediciones para estimar tu plazo
                  {projection.samples != null ? ` (tenés ${projection.samples})` : ''}.
                </div>
              </>
            )}
            <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '8px 0 0' }}>{projection.narrative}</p>
          </div>
        </div>
      )}

      {/* Objetivo activo — read-only display */}
      {activeGoal && (
        <div className="ph-section">
          <div
            className="card"
            style={{
              background: 'linear-gradient(160deg, rgba(79,184,168,0.12), rgba(125,140,255,0.04)), var(--bg-1)',
              border: '1px solid rgba(79,184,168,0.3)',
            }}
          >
            <div className="row-between" style={{ marginBottom: 6 }}>
              <div
                className="mono"
                style={{
                  color: 'var(--ok)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Tu objetivo
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
              {activeGoal.peso_objetivo != null && (
                <div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>PESO</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{activeGoal.peso_objetivo.toFixed(1)} kg</div>
                </div>
              )}
              {activeGoal.bf_objetivo != null && (
                <div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>% GRASA</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{activeGoal.bf_objetivo.toFixed(1)}%</div>
                </div>
              )}
              {activeGoal.ffmi_objetivo != null && (
                <div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>FFMI</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{activeGoal.ffmi_objetivo.toFixed(1)}</div>
                </div>
              )}
            </div>
            {activeGoal.notas && (
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '10px 0 0' }}>{activeGoal.notas}</p>
            )}
          </div>
        </div>
      )}

      {/* Modules quick-access — counts derived from real link state */}
      <div className="ph-section">
        <div className="section-label">Módulos</div>
        <div className="ph-modules">
          {(() => {
            const hasMedicalSpecialist = specialists.some(
              (s) => (s.specialist_role || '').toLowerCase().includes('doctor')
                  || (s.specialist_role || '').toLowerCase().includes('medic'),
            )
            const hasNutritionist = specialists.some(
              (s) => (s.specialist_role || '').toLowerCase().includes('nutri'),
            )
            const hasTrainer = specialists.some(
              (s) => (s.specialist_role || '').toLowerCase().includes('entren')
                  || (s.specialist_role || '').toLowerCase().includes('train'),
            )
            const tiles: ModuleTile[] = [
              {
                key: 'training',
                label: 'Entrenamiento',
                sub: hasTrainer ? 'Plan activo' : 'Sin entrenador',
                icon: 'training',
                color: 'var(--omega)',
              },
              {
                key: 'nutrition',
                label: 'Nutrición',
                sub: hasNutritionist ? 'Plan activo' : 'Sin nutricionista',
                icon: 'nutrition',
                color: 'var(--nutri)',
              },
              {
                key: 'medicine',
                label: 'Medicina',
                sub: hasMedicalSpecialist ? 'Médico vinculado' : 'Sin médico vinculado',
                icon: 'medicine',
                color: 'var(--medic)',
              },
              {
                key: 'performance',
                label: 'Performance',
                sub: healthIndex ? `Score ${Math.round(healthIndex.score)}/100` : 'Clock semanal',
                icon: 'target',
                color: 'var(--analytic)',
              },
            ]
            return tiles.map((m) => (
              <button
                key={m.key}
                className="ph-module-card"
                type="button"
                onClick={() => onOpenModule?.(m.key)}
                disabled={!onOpenModule}
              >
                <div className="ph-module-ic" style={{ background: `${m.color}22`, color: m.color }}>
                  <Icon name={m.icon} size={18} />
                </div>
                <div className="ph-module-label">{m.label}</div>
                <div className="ph-module-sub">{m.sub}</div>
              </button>
            ))
          })()}
        </div>
      </div>

      {/* Engagement insights — pull from /api/v3/engagement/insights */}
      {insights.length > 0 && (
        <div className="ph-section">
          <div className="section-label">Para tu día</div>
          <div className="card" style={{ padding: 0 }}>
            {insights.map((ins, i) => (
              <div
                key={`${ins.type}-${i}`}
                className="ph-link-row"
                style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: ins.prioridad === 'alta' ? 'rgba(226,62,74,0.12)' : 'rgba(125,140,255,0.12)',
                    color: ins.prioridad === 'alta' ? 'var(--omega)' : 'var(--analytic)',
                    display: 'grid', placeItems: 'center',
                  }}
                >
                  <Icon name="target" size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ph-link-name">{ins.titulo}</div>
                  <div className="ph-link-meta">{ins.descripcion}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tareas (lista + creación rápida) */}
      <TasksBlock
        tasks={tasks}
        completingTask={completingTask}
        onComplete={handleCompleteTask}
        onCreated={reloadEngagement}
      />


      {/* Reminders próximos */}
      {reminders.length > 0 && (
        <div className="ph-section">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div className="section-label">Recordatorios</div>
            <div className="mono" style={{ color: 'var(--text-3)' }}>
              {reminders.length} pendiente{reminders.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {reminders.map((r, i) => (
              <div
                key={r.id}
                className="ph-link-row"
                style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'rgba(232,169,58,0.12)', color: 'var(--warn)',
                    display: 'grid', placeItems: 'center',
                  }}
                >
                  <Icon name="bell" size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ph-link-name">{r.titulo}</div>
                  {r.descripcion && (
                    <div className="ph-link-meta">{r.descripcion}</div>
                  )}
                </div>
                <button
                  type="button"
                  className="ph-link-btn ph-link-accept"
                  onClick={() => handleCompleteReminder(r.id)}
                  disabled={completingReminder === r.id}
                  aria-label="Marcar como completado"
                >
                  <Icon name="check" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solicitudes recibidas — patient must accept/reject */}
      {!loadingLinks && incoming.length > 0 && (
        <div className="ph-section">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div className="section-label">Solicitudes recibidas</div>
            <div className="mono" style={{ color: 'var(--text-3)' }}>
              {incoming.length} pendiente{incoming.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {incoming.map((r, i) => {
              const role = (r.specialist_role || '').toLowerCase()
              const color = ROLE_COLOR[role] || 'var(--medic)'
              return (
                <div
                  key={r.id}
                  className="ph-link-row"
                  style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
                >
                  <Avatar name={r.specialist_name} color={color} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ph-link-name">{r.specialist_name}</div>
                    <div className="ph-link-meta">
                      Te quiere vincular como {ROLE_LABEL[role] || role || 'especialista'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="ph-link-btn ph-link-accept"
                      onClick={() => handleAccept(r.id)}
                      disabled={actingId === r.id}
                      aria-label="Aceptar"
                    >
                      <Icon name="check" size={14} />
                    </button>
                    <button
                      type="button"
                      className="ph-link-btn ph-link-reject"
                      onClick={() => handleReject(r.id)}
                      disabled={actingId === r.id}
                      aria-label="Rechazar"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mis profesionales — accepted links */}
      {!loadingLinks && specialists.length > 0 && (
        <div className="ph-section">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div className="section-label">Mis profesionales</div>
            <div className="mono" style={{ color: 'var(--text-3)' }}>
              {specialists.length} vinculad{specialists.length === 1 ? 'o' : 'os'}
            </div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {specialists.map((s, i) => {
              const role = (s.specialist_role || '').toLowerCase()
              const color = ROLE_COLOR[role] || 'var(--medic)'
              return (
                <div
                  key={s.id}
                  className="ph-link-row"
                  style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
                >
                  <Avatar name={s.specialist_name} color={color} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ph-link-name">{s.specialist_name}</div>
                    <div className="ph-link-meta">
                      {ROLE_LABEL[role] || role || 'Especialista'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Solicitudes enviadas — patient can cancel */}
      {!loadingLinks && outgoing.length > 0 && (
        <div className="ph-section">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div className="section-label">Solicitudes enviadas</div>
            <div className="mono" style={{ color: 'var(--text-3)' }}>
              {outgoing.length} esperando
            </div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {outgoing.map((r, i) => {
              const role = (r.specialist_role || '').toLowerCase()
              const color = ROLE_COLOR[role] || 'var(--medic)'
              return (
                <div
                  key={r.id}
                  className="ph-link-row"
                  style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
                >
                  <Avatar name={r.specialist_name} color={color} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ph-link-name">{r.specialist_name}</div>
                    <div className="ph-link-meta" style={{ color: 'var(--warn)' }}>
                      Esperando respuesta · {ROLE_LABEL[role] || role}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ph-link-btn ph-link-reject"
                    onClick={() => handleCancel(r.id)}
                    disabled={actingId === r.id}
                    aria-label="Cancelar"
                    title="Cancelar"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state when no links of any kind — invite to browse */}
      {!loadingLinks && !linksError && !hasAnyLinks && onBrowseSpecialists && (
        <div className="ph-section">
          <div className="section-label">Tu equipo</div>
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 10px' }}>
              Todavía no tenés profesionales vinculados. Pedí seguimiento de un médico, nutricionista o entrenador.
            </p>
            <button
              type="button"
              className="ph-cta"
              onClick={onBrowseSpecialists}
            >
              <Icon name="user" size={14} /> Buscar profesional
              <Icon name="chevR" size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Today agenda — empty state with check-in CTA */}
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Hoy</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>Sin eventos</div>
        </div>
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Sin actividades programadas para hoy.
          </p>
          {onCheckIn && (
            <button
              type="button"
              className="ph-cta"
              onClick={onCheckIn}
            >
              <Icon name="heart" size={14} /> Hacer check-in diario
              <Icon name="chevR" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Current phase — empty state */}
      <div className="ph-section">
        <div className="card">
          <div className="row-between">
            <div>
              <div className="mono" style={{ color: 'var(--text-2)' }}>Fase actual</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>Sin fase activa</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 10, marginBottom: 10 }}>
            Tu fase aparecerá acá cuando tu profesional la asigne.
          </p>
          <Progress value={0} color="var(--text-3)" />
        </div>
      </div>
    </div>
  )
}

/** Inline tasks list + quick-add form. Wraps `engagementService.createTask` so
 *  the patient can add their own follow-up reminders without leaving home. */
function TasksBlock({
  tasks,
  completingTask,
  onComplete,
  onCreated,
}: {
  tasks: UserTask[]
  completingTask: number | null
  onComplete: (id: number) => void
  onCreated: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!draft.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await engagementService.createTask({ titulo: draft.trim() })
      setDraft('')
      setAdding(false)
      onCreated()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos crear la tarea')
    } finally {
      setSubmitting(false)
    }
  }

  if (tasks.length === 0 && !adding) {
    return (
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Tus tareas</div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '4px 10px', fontSize: 11 }}
            onClick={() => setAdding(true)}
          >
            <Icon name="plus" size={12} /> Agregar
          </button>
        </div>
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Sin tareas pendientes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="ph-section">
      <div className="row-between" style={{ marginBottom: 10 }}>
        <div className="section-label">Tus tareas</div>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: '4px 10px', fontSize: 11 }}
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? 'Cerrar' : (<><Icon name="plus" size={12} /> Agregar</>)}
        </button>
      </div>

      {adding && (
        <div className="card" style={{ padding: 10, marginBottom: 10 }}>
          <input
            type="text"
            className="adm-input"
            placeholder="¿Qué necesitás recordar?"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            style={{ marginBottom: 8 }}
          />
          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={submit}
            disabled={submitting || !draft.trim()}
          >
            <Icon name="check" size={14} /> {submitting ? ' Guardando…' : ' Crear tarea'}
          </button>
          {error && (
            <p style={{ fontSize: 12, color: 'var(--omega)', margin: '6px 0 0' }}>{error}</p>
          )}
        </div>
      )}

      {tasks.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          {tasks.map((t, i) => (
            <div
              key={t.id}
              className="ph-link-row"
              style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'rgba(79,184,168,0.12)', color: 'var(--ok)',
                  display: 'grid', placeItems: 'center',
                }}
              >
                <Icon name="check" size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ph-link-name">{t.titulo}</div>
                {t.descripcion && (
                  <div className="ph-link-meta">{t.descripcion}</div>
                )}
              </div>
              <button
                type="button"
                className="ph-link-btn ph-link-accept"
                onClick={() => onComplete(t.id)}
                disabled={completingTask === t.id}
                aria-label="Marcar como completada"
              >
                <Icon name="check" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
