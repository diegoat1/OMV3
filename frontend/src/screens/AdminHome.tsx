import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { Progress } from '../components/atoms'
import { adminService } from '../services/adminService'
import { ApiError } from '../services/apiClient'

interface ModuleUsage {
  name: string
  value: number
  color: string
}

const MODULE_USAGE: ModuleUsage[] = [
  { name: 'Entrenamiento', value: 0, color: 'var(--omega)' },
  { name: 'Nutrición', value: 0, color: 'var(--nutri)' },
  { name: 'Medicina', value: 0, color: 'var(--medic)' },
  { name: 'Analítica', value: 0, color: 'var(--analytic)' },
]

interface SystemAction {
  title: string
  sub: string
  icon: IconName
}

const SYSTEM_ACTIONS: SystemAction[] = [
  { title: 'Backup BD', sub: 'Sin backups recientes', icon: 'data' },
  { title: 'Exportar datos', sub: 'CSV / JSON', icon: 'upload' },
  { title: 'Audit log', sub: 'Ver eventos', icon: 'history' },
  { title: 'Limpieza', sub: 'Temporales · logs', icon: 'settings' },
]

interface Props {
  onOpenPending?: () => void
}

export function AdminHome({ onOpenPending }: Props = {}) {
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [pendingErr, setPendingErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    adminService.listPendingUsers()
      .then((r) => { if (!cancelled) setPendingCount(r.total) })
      .catch((e) => {
        if (cancelled) return
        setPendingErr(e instanceof ApiError ? e.message : 'Error cargando pendientes')
      })
    return () => { cancelled = true }
  }, [])

  const stats = [
    { k: 'Usuarios', v: '—', d: 'sin datos' },
    { k: 'Activos 30d', v: '—', d: 'sin datos' },
    { k: 'Pendientes', v: pendingErr ? '—' : pendingCount != null ? String(pendingCount) : '…', d: pendingErr ? 'sin acceso' : 'aprobación' },
    { k: 'Errores 24h', v: '—', d: 'sin incidentes' },
  ]

  return (
    <div className="admin-home" data-mod="admin">
      <div className="ah-title-block">
        <div className="module-pill">Admin</div>
        <div className="display ah-title">
          <em>Panel</em> de control
        </div>
        <div className="ah-subtitle">Omega Medicina · producción</div>
      </div>

      <div className="ah-stats">
        {stats.map((s) => (
          <div key={s.k} className="stat">
            <div className="k">{s.k}</div>
            <div className="v">{s.v}</div>
            <div className="d">{s.d}</div>
          </div>
        ))}
      </div>

      {/* Module usage bars */}
      <div className="ah-section">
        <div className="section-label">Uso por módulo · 7 días</div>
        <div className="card">
          {MODULE_USAGE.map((m, i) => (
            <div key={m.name} style={{ marginTop: i ? 12 : 0 }}>
              <div className="row-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{m.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: m.color }}>{m.value}%</span>
              </div>
              <Progress value={m.value} color={m.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Pending approvals — link to AdminPending */}
      <div className="ah-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Aprobaciones pendientes</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>
            {pendingErr ? '— sin acceso' : pendingCount != null ? `${pendingCount} pendiente${pendingCount === 1 ? '' : 's'}` : 'cargando…'}
          </div>
        </div>
        <button
          type="button"
          className="card"
          onClick={onOpenPending}
          disabled={!onOpenPending}
          style={{
            width: '100%',
            textAlign: 'left',
            border: '1px solid var(--line)',
            background: 'var(--bg-1)',
            color: 'var(--text-1)',
            cursor: onOpenPending ? 'pointer' : 'default',
            transition: 'background 0.12s',
          }}
        >
          <div className="row-between">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              {pendingErr
                ? pendingErr
                : pendingCount === 0
                  ? 'Sin aprobaciones pendientes.'
                  : pendingCount != null
                    ? `${pendingCount} usuario${pendingCount === 1 ? '' : 's'} esperando revisión. Tocá para abrir el panel.`
                    : 'Cargando estado…'}
            </p>
            {onOpenPending && pendingCount != null && pendingCount > 0 && (
              <Icon name="chevR" size={16} />
            )}
          </div>
        </button>
      </div>

      {/* System quick actions */}
      <div className="ah-section">
        <div className="section-label">Sistema</div>
        <div className="ah-system-grid">
          {SYSTEM_ACTIONS.map((a) => (
            <button key={a.title} className="ah-system-card" type="button">
              <Icon name={a.icon} size={16} />
              <div className="ah-system-title">{a.title}</div>
              <div className="ah-system-sub">{a.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
