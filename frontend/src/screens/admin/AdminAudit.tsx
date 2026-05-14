import { useCallback, useEffect, useState } from 'react'
import { adminService } from '../../services/adminService'
import { ApiError } from '../../services/apiClient'
import type { AdminAuditEntry } from '../../types/api'

const FILTERS = ['Todo', 'Aprobaciones', 'Roles', 'Login', 'Sistema'] as const
type Filter = (typeof FILTERS)[number]

/** Map the chip filters to action prefixes the backend stores in audit_log. */
function matchesFilter(entry: AdminAuditEntry, filter: Filter): boolean {
  if (filter === 'Todo') return true
  const a = (entry.action || '').toLowerCase()
  switch (filter) {
    case 'Aprobaciones':
      return a.includes('approve') || a.includes('reject') || a.includes('pending') || a.includes('assignment')
    case 'Roles':
      return a.includes('role') || a.includes('admin')
    case 'Login':
      return a.includes('login') || a.includes('logout') || a.includes('auth')
    case 'Sistema':
      return a.includes('delete') || a.includes('toggle') || a.includes('database') || a.includes('export')
    default:
      return true
  }
}

function formatRelative(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return iso
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'recién'
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} d`
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

export function AdminAudit() {
  const [filter, setFilter] = useState<Filter>('Todo')
  const [entries, setEntries] = useState<AdminAuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminService.audit(100)
      setEntries(res.entries)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando audit log')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const filtered = entries.filter((e) => matchesFilter(e, filter))

  return (
    <div className="aa-screen" data-mod="admin">
      {/* Page title — module pill + serif italic display */}
      <div className="ah-title-block">
        <div className="module-pill">Admin</div>
        <div className="display ah-title">
          <em>Audit</em> log
        </div>
        <div className="ah-subtitle">Eventos del sistema</div>
      </div>

      {/* Filter chips */}
      <div className="aa-filters">
        {FILTERS.map((f) => {
          const active = filter === f
          return (
            <button
              key={f}
              type="button"
              className={'chip aa-chip' + (active ? ' is-active' : '')}
              onClick={() => setFilter(f)}
              aria-pressed={active}
            >
              {f}
            </button>
          )
        })}
      </div>

      {/* Events timeline */}
      <div className="ah-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Eventos</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>
            {loading ? 'cargando…' : `${filtered.length} evento${filtered.length === 1 ? '' : 's'}`}
          </div>
        </div>

        {error && (
          <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
            <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
          </div>
        )}

        {!error && !loading && filtered.length === 0 && (
          <div className="card aa-empty">
            <div className="aa-empty-dot" />
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              Sin eventos para mostrar.
              <br />
              <span style={{ color: 'var(--text-3)' }}>
                Probá con otro filtro o esperá a que ocurran nuevas acciones.
              </span>
            </p>
          </div>
        )}

        {!error && filtered.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {filtered.map((e, i) => (
              <div
                key={e.id}
                style={{
                  borderTop: i === 0 ? 0 : '1px solid var(--line)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--analytic)',
                      }}
                    >
                      {e.action}
                    </span>
                    {e.user_name && (
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>· {e.user_name}</span>
                    )}
                  </div>
                  {e.details && (
                    <div style={{ fontSize: 13, color: 'var(--text-1)' }}>{e.details}</div>
                  )}
                  {e.ip_address && (
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                      {e.ip_address}
                    </div>
                  )}
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                  {formatRelative(e.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
