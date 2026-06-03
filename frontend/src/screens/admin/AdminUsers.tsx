import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Avatar } from '../../components/atoms'
import { adminService } from '../../services/adminService'
import { ApiError } from '../../services/apiClient'
import type { AdminAuthUser } from '../../types/api'

type StatusFilter = '' | 'active' | 'pending_verification' | 'rejected' | 'inactive'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'pending_verification', label: 'Pendientes' },
  { value: 'rejected', label: 'Rechazados' },
  { value: 'inactive', label: 'Inactivos' },
]

const ROLE_LABEL: Record<string, string> = {
  user: 'Paciente',
  doctor: 'Doctor',
  nutricionista: 'Nutricionista',
  entrenador: 'Entrenador',
  admin: 'Admin',
}

const ROLE_COLOR: Record<string, string> = {
  user: 'var(--text-2)',
  doctor: 'var(--medic)',
  nutricionista: 'var(--nutri)',
  entrenador: 'var(--omega)',
  admin: 'var(--analytic)',
}

function parseRoles(csv: string): string[] {
  return (csv || '').split(',').map((r) => r.trim()).filter(Boolean)
}

function statusBadge(status: string, isActive: boolean): { label: string; color: string } {
  if (!isActive) return { label: 'Inactivo', color: 'var(--text-3)' }
  if (status === 'pending_verification') return { label: 'Pendiente', color: 'var(--warn)' }
  if (status === 'rejected') return { label: 'Rechazado', color: 'var(--omega)' }
  return { label: 'Activo', color: 'var(--ok)' }
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminAuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [actingId, setActingId] = useState<number | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminService.listAuthUsers({ q: q.trim() || undefined, status: status || undefined })
      setUsers(Array.isArray(res.users) ? res.users : [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando usuarios')
    } finally {
      setLoading(false)
    }
  }, [q, status])

  useEffect(() => {
    // Debounce the search input so we don't hammer the API.
    const id = setTimeout(reload, 250)
    return () => clearTimeout(id)
  }, [reload])

  const total = users.length

  const breakdown = useMemo(() => {
    let active = 0, pending = 0, inactive = 0
    for (const u of users) {
      if (!u.is_active) inactive++
      else if (u.status === 'pending_verification') pending++
      else if (u.status === 'active') active++
    }
    return { active, pending, inactive }
  }, [users])

  const handleToggleActive = async (u: AdminAuthUser) => {
    setActingId(u.id)
    try {
      await adminService.toggleActive(u.id)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos cambiar el estado')
    } finally {
      setActingId(null)
    }
  }

  const handleToggleRole = async (u: AdminAuthUser, role: 'doctor' | 'admin' | 'nutricionista' | 'entrenador') => {
    setActingId(u.id)
    try {
      await adminService.toggleRole(u.id, role)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos cambiar el rol')
    } finally {
      setActingId(null)
    }
  }

  const handleDelete = async (u: AdminAuthUser) => {
    if (!confirm(`Eliminar definitivamente a ${u.display_name || u.email}?`)) return
    setActingId(u.id)
    try {
      await adminService.deleteUser(u.id)
      setExpandedId(null)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos eliminar al usuario')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="ap-screen" data-mod="admin">
      <div className="ah-title-block">
        <div className="module-pill">Admin</div>
        <div className="display ah-title">
          <em>Usuarios</em> registrados
        </div>
        <div className="ah-subtitle">
          {loading ? 'Cargando…' : `${total} cuenta${total === 1 ? '' : 's'}`}
        </div>
      </div>

      {/* Breakdown KPIs */}
      <div className="ah-stats">
        <div className="stat">
          <div className="k">Activos</div>
          <div className="v">{loading ? '…' : breakdown.active}</div>
          <div className="d">verificados</div>
        </div>
        <div className="stat">
          <div className="k">Pendientes</div>
          <div className="v">{loading ? '…' : breakdown.pending}</div>
          <div className="d">por aprobar</div>
        </div>
        <div className="stat">
          <div className="k">Inactivos</div>
          <div className="v">{loading ? '…' : breakdown.inactive}</div>
          <div className="d">deshabilitados</div>
        </div>
      </div>

      {/* Search */}
      <div className="dp-search">
        <span className="dp-search-icon">
          <Icon name="search" size={18} />
        </span>
        <input
          type="search"
          className="dp-search-input"
          placeholder="Buscar por nombre o email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Status filter chips */}
      <div className="dp-filters">
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt.value
          return (
            <button
              key={opt.value || 'all'}
              type="button"
              className={'chip dp-chip' + (active ? ' is-active' : '')}
              onClick={() => setStatus(opt.value)}
              aria-pressed={active}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="ph-section">
        {error && (
          <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
            <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
          </div>
        )}

        {!error && !loading && users.length === 0 && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              {q ? `Sin resultados para "${q}".` : 'Sin usuarios en este filtro.'}
            </p>
          </div>
        )}

        {!error && users.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {users.map((u, i) => {
              const expanded = expandedId === u.id
              const roles = parseRoles(u.role)
              const badge = statusBadge(u.status, u.is_active)
              return (
                <div
                  key={u.id}
                  style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
                >
                  <button
                    type="button"
                    className="dp-patient-row"
                    onClick={() => setExpandedId(expanded ? null : u.id)}
                    style={{
                      width: '100%', background: 'transparent', border: 0,
                      padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                    aria-expanded={expanded}
                  >
                    <Avatar name={u.display_name || u.email} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ph-link-name">{u.display_name || '—'}</div>
                      <div className="ph-link-meta">{u.email}</div>
                    </div>
                    <span
                      className="mono"
                      style={{
                        fontSize: 10,
                        color: badge.color,
                        marginRight: 8,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {badge.label}
                    </span>
                    <div
                      className="dp-chev"
                      style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)' }}
                    >
                      <Icon name="chevR" size={16} />
                    </div>
                  </button>

                  {expanded && (
                    <div className="dp-actions" style={{ paddingTop: 6 }}>
                      {/* Current roles */}
                      <div style={{ padding: '4px 14px 8px' }}>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6 }}>
                          ROLES
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {roles.length === 0 && (
                            <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
                          )}
                          {roles.map((r) => (
                            <span
                              key={r}
                              className="chip"
                              style={{
                                fontSize: 11,
                                color: ROLE_COLOR[r] || 'var(--text-2)',
                                borderColor: 'var(--line)',
                                padding: '4px 10px',
                              }}
                            >
                              {ROLE_LABEL[r] || r}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Toggle role buttons */}
                      <div style={{ padding: '0 14px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(['doctor', 'nutricionista', 'entrenador', 'admin'] as const).map((r) => {
                          const has = roles.includes(r)
                          return (
                            <button
                              key={r}
                              type="button"
                              className="chip"
                              onClick={() => handleToggleRole(u, r)}
                              disabled={actingId === u.id}
                              style={{
                                fontSize: 11,
                                padding: '4px 10px',
                                background: has ? 'rgba(255,255,255,0.05)' : 'transparent',
                                color: has ? (ROLE_COLOR[r] || 'var(--text-1)') : 'var(--text-3)',
                                borderColor: has ? (ROLE_COLOR[r] || 'var(--line)') : 'var(--line)',
                                cursor: 'pointer',
                              }}
                            >
                              {has ? '✓ ' : '+ '}{ROLE_LABEL[r] || r}
                            </button>
                          )
                        })}
                      </div>

                      <button
                        type="button"
                        className="dp-action"
                        onClick={() => handleToggleActive(u)}
                        disabled={actingId === u.id}
                      >
                        <Icon name={u.is_active ? 'x' : 'check'} size={16} />
                        <span>{u.is_active ? 'Desactivar cuenta' : 'Reactivar cuenta'}</span>
                      </button>
                      <button
                        type="button"
                        className="dp-action dp-action-danger"
                        onClick={() => handleDelete(u)}
                        disabled={actingId === u.id}
                      >
                        <Icon name="x" size={16} />
                        <span>Eliminar definitivamente</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
