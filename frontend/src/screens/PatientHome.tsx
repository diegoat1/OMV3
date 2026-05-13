import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { Avatar, Progress } from '../components/atoms'
import { AcceptGoalSheet } from '../components/AcceptGoalSheet'
import { assignmentService } from '../services/assignmentService'
import { checkinService } from '../services/checkinService'
import { goalService } from '../services/goalService'
import { measurementService } from '../services/measurementService'
import { ApiError } from '../services/apiClient'
import type {
  Goal,
  HealthIndex,
  Measurement,
  MyRequest,
  MySpecialist,
  PendingAssignment,
} from '../types/api'

interface ModuleTile {
  label: string
  sub: string
  icon: IconName
  color: string
}

const MODULES: ModuleTile[] = [
  { label: 'Entrenamiento', sub: 'Sin plan activo', icon: 'training', color: 'var(--omega)' },
  { label: 'Nutrición', sub: 'Sin plan alimentario', icon: 'nutrition', color: 'var(--nutri)' },
  { label: 'Medicina', sub: 'Sin médico vinculado', icon: 'medicine', color: 'var(--medic)' },
  { label: 'Performance', sub: 'Clock semanal', icon: 'target', color: 'var(--analytic)' },
]

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
}

export function PatientHome({ userId, onCheckIn, onBrowseSpecialists }: Props = {}) {
  const [specialists, setSpecialists] = useState<MySpecialist[]>([])
  const [incoming, setIncoming] = useState<PendingAssignment[]>([])
  const [outgoing, setOutgoing] = useState<MyRequest[]>([])
  const [loadingLinks, setLoadingLinks] = useState(true)
  const [actingId, setActingId] = useState<number | null>(null)
  const [linksError, setLinksError] = useState<string | null>(null)
  const [proposedGoal, setProposedGoal] = useState<Goal | null>(null)
  const [latestMeasurement, setLatestMeasurement] = useState<Measurement | null>(null)
  const [acceptGoalOpen, setAcceptGoalOpen] = useState(false)
  const [healthIndex, setHealthIndex] = useState<HealthIndex | null>(null)
  const [healthDelta, setHealthDelta] = useState<number | null>(null)

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
    const [gp, m] = await Promise.all([
      goalService.getProposed(userId).catch(() => ({ user_id: '', goal: null })),
      measurementService.list(userId, 1).catch(() => ({ user_id: '', nombre_apellido: '', measurements: [], total: 0 })),
    ])
    setProposedGoal(gp.goal)
    setLatestMeasurement(m.measurements[0] ?? null)
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

  useEffect(() => { reloadLinks() }, [reloadLinks])
  useEffect(() => { reloadGoal() }, [reloadGoal])
  useEffect(() => { reloadHealth() }, [reloadHealth])

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

      {/* Proposed goal — patient must accept or reject */}
      {proposedGoal && (
        <div className="ph-section">
          <div
            className="card"
            style={{
              background: 'linear-gradient(160deg, rgba(125,140,255,0.16), rgba(79,184,168,0.06)), var(--bg-1)',
              border: '1px solid rgba(125,140,255,0.4)',
              cursor: 'pointer',
            }}
            onClick={() => setAcceptGoalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setAcceptGoalOpen(true)
              }
            }}
          >
            <div className="row-between" style={{ marginBottom: 6 }}>
              <div
                className="mono"
                style={{
                  color: 'var(--analytic)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Objetivo propuesto
              </div>
              <Icon name="chevR" size={16} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-1)' }}>
              Tu profesional armó un plan para vos
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '6px 0 0' }}>
              Revisalo y aceptalo para activarlo, o pedile cambios.
            </p>
          </div>
        </div>
      )}

      {/* Modules quick-access */}
      <div className="ph-section">
        <div className="section-label">Módulos</div>
        <div className="ph-modules">
          {MODULES.map((m) => (
            <button key={m.label} className="ph-module-card" type="button">
              <div className="ph-module-ic" style={{ background: `${m.color}22`, color: m.color }}>
                <Icon name={m.icon} size={18} />
              </div>
              <div className="ph-module-label">{m.label}</div>
              <div className="ph-module-sub">{m.sub}</div>
            </button>
          ))}
        </div>
      </div>

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

      {/* Accept-goal sheet */}
      {proposedGoal && acceptGoalOpen && userId && (
        <AcceptGoalSheet
          goal={proposedGoal}
          userId={userId}
          latestMeasurement={latestMeasurement}
          onClose={() => setAcceptGoalOpen(false)}
          onAccepted={() => {
            setAcceptGoalOpen(false)
            reloadGoal()
          }}
          onRejected={() => {
            setAcceptGoalOpen(false)
            reloadGoal()
          }}
        />
      )}
    </div>
  )
}
