import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { Progress } from '../components/atoms'

interface StatTile {
  k: string
  v: string
  d: string
}

const STATS: StatTile[] = [
  { k: 'Usuarios', v: '—', d: 'sin datos' },
  { k: 'Activos 30d', v: '—', d: 'sin datos' },
  { k: 'Pendientes', v: '—', d: 'aprobación' },
  { k: 'Errores 24h', v: '—', d: 'sin incidentes' },
]

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

export function AdminHome() {
  return (
    <div className="admin-home" data-mod="admin">
      {/* Page title — module pill + serif italic display */}
      <div className="ah-title-block">
        <div className="module-pill">Admin</div>
        <div className="display ah-title">
          <em>Panel</em> de control
        </div>
        <div className="ah-subtitle">Omega Medicina · producción</div>
      </div>

      {/* 4 stat tiles */}
      <div className="ah-stats">
        {STATS.map((s) => (
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

      {/* Pending approvals — empty state */}
      <div className="ah-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Aprobaciones pendientes</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>0 pendientes</div>
        </div>
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Sin aprobaciones pendientes.
          </p>
        </div>
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
