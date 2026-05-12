import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Avatar } from '../../components/atoms'
import { AdminApproveSheet } from '../../components/AdminApproveSheet'
import { AdminRejectSheet } from '../../components/AdminRejectSheet'
import { adminService } from '../../services/adminService'
import { ApiError } from '../../services/apiClient'
import type { PendingUser } from '../../types/api'

const ROLE_LABEL: Record<string, string> = {
  patient: 'Paciente',
  doctor: 'Médico',
  nutricionista: 'Nutricionista',
  nutritionist: 'Nutricionista',
  entrenador: 'Entrenador',
  trainer: 'Entrenador',
}

const ROLE_COLOR: Record<string, string> = {
  patient: '#E23E4A',
  doctor: '#4FB8A8',
  nutricionista: '#E8A93A',
  nutritionist: '#E8A93A',
  entrenador: '#7D8CFF',
  trainer: '#7D8CFF',
}

type Filter = 'all' | 'email_verified' | 'email_pending'

export function AdminPending() {
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [approveTarget, setApproveTarget] = useState<PendingUser | null>(null)
  const [rejectTarget, setRejectTarget] = useState<PendingUser | null>(null)
  const [breakdown, setBreakdown] = useState<{ verified: number; awaiting: number } | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await adminService.listPendingUsers()
      setUsers(r.users)
      if (r.breakdown) {
        setBreakdown({
          verified: r.breakdown.email_verified_awaiting_admin,
          awaiting: r.breakdown.awaiting_email_verification,
        })
      } else {
        setBreakdown(null)
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando pendientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const visible = users.filter((u) => {
    if (filter === 'email_verified') return u.email_verified !== false
    if (filter === 'email_pending') return u.email_verified === false
    return true
  })

  return (
    <div className="ap-screen" data-mod="admin">
      <div className="ap-title-block">
        <div className="module-pill">Admin</div>
        <div className="display ap-title">
          <em>Pendientes</em> de aprobación
        </div>
      </div>

      {breakdown && (
        <div className="ah-stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="stat">
            <div className="k">Email verificado</div>
            <div className="v">{breakdown.verified}</div>
            <div className="d">esperando admin</div>
          </div>
          <div className="stat">
            <div className="k">Sin verificar</div>
            <div className="v">{breakdown.awaiting}</div>
            <div className="d">email pendiente</div>
          </div>
        </div>
      )}

      <div className="dp-filters">
        {([
          { id: 'all', label: 'Todos' },
          { id: 'email_verified', label: 'Email OK' },
          { id: 'email_pending', label: 'Sin verificar' },
        ] as const).map((f) => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              type="button"
              className={'chip dp-chip' + (active ? ' is-active' : '')}
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
            >
              {f.label}
            </button>
          )
        })}
      </div>

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

      {!loading && !error && visible.length === 0 && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            {filter === 'all'
              ? 'Sin usuarios pendientes de aprobación.'
              : 'Sin resultados para este filtro.'}
          </p>
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          {visible.map((u, i) => {
            const role = (u.desired_role || u.role || '').toLowerCase()
            const color = ROLE_COLOR[role] || 'var(--text-2)'
            return (
              <div
                key={u.id}
                className="ph-link-row"
                style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)', alignItems: 'stretch', gap: 12 }}
              >
                <Avatar name={u.display_name || u.email} color={color} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ph-link-name">{u.display_name || u.email}</div>
                  <div className="ph-link-meta">
                    {u.email}
                    {u.email_verified === false && (
                      <span style={{ color: 'var(--warn)', marginLeft: 6 }}>
                        · email sin verificar
                      </span>
                    )}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                    {ROLE_LABEL[role] || role || '—'}
                    {u.telefono ? ` · ${u.telefono}` : ''}
                    {u.patient_dni ? ` · DNI ${u.patient_dni}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignSelf: 'center' }}>
                  <button
                    type="button"
                    className="ph-link-btn ph-link-accept"
                    onClick={() => setApproveTarget(u)}
                    aria-label="Aprobar"
                    title="Aprobar"
                  >
                    <Icon name="check" size={14} />
                  </button>
                  <button
                    type="button"
                    className="ph-link-btn ph-link-reject"
                    onClick={() => setRejectTarget(u)}
                    aria-label="Rechazar"
                    title="Rechazar"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AdminApproveSheet
        user={approveTarget}
        onClose={() => setApproveTarget(null)}
        onApproved={() => { setApproveTarget(null); reload() }}
      />
      <AdminRejectSheet
        user={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onRejected={() => { setRejectTarget(null); reload() }}
      />
    </div>
  )
}
