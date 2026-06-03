import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { Progress } from '../components/atoms'
import { adminService } from '../services/adminService'
import { ApiError } from '../services/apiClient'
import type { AdminDashboardStats, AdminModuleStats } from '../types/api'

interface ModuleUsage {
  name: string
  value: number               // 0–100 (% relative)
  raw: number                 // absolute count
  color: string
}

interface SystemAction {
  title: string
  sub: string
  icon: IconName
  target?: 'audit' | 'users' | 'db' | 'strength'
}

interface Props {
  onOpenPending?: () => void
  onOpenAudit?: () => void
  onOpenUsers?: () => void
  onOpenDb?: () => void
  onOpenStrength?: () => void
}

export function AdminHome({ onOpenPending, onOpenAudit, onOpenUsers, onOpenDb, onOpenStrength }: Props = {}) {
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [pendingErr, setPendingErr] = useState<string | null>(null)
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [statsErr, setStatsErr] = useState<string | null>(null)
  const [modStats, setModStats] = useState<AdminModuleStats | null>(null)

  const SYSTEM_ACTIONS: SystemAction[] = [
    { title: 'Usuarios', sub: 'Cuentas activas', icon: 'user', target: 'users' },
    { title: 'Tests de fuerza', sub: 'Por paciente', icon: 'dumbbell', target: 'strength' },
    { title: 'Audit log', sub: 'Ver eventos', icon: 'history', target: 'audit' },
    { title: 'Base de datos', sub: 'Tablas + export', icon: 'data', target: 'db' },
    { title: 'Limpieza', sub: 'Temporales · logs', icon: 'settings' },
  ]

  useEffect(() => {
    let cancelled = false
    adminService.listPendingUsers()
      .then((r) => { if (!cancelled) setPendingCount(r.total) })
      .catch((e) => {
        if (cancelled) return
        setPendingErr(e instanceof ApiError ? e.message : 'Error cargando pendientes')
      })
    adminService.dashboardStats()
      .then((s) => { if (!cancelled) setStats(s) })
      .catch((e) => {
        if (cancelled) return
        setStatsErr(e instanceof ApiError ? e.message : 'Error cargando KPIs')
      })
    adminService.moduleStats()
      .then((s) => { if (!cancelled) setModStats(s) })
      .catch(() => { /* swallow — sólo afecta a las barras de módulos */ })
    return () => { cancelled = true }
  }, [])

  /** Compute the module-usage bars from /admin/stats. The "value" is the
   *  percent of the largest module so the bars stay comparable. */
  const moduleUsage: ModuleUsage[] = (() => {
    const raw = modStats ? [
      { name: 'Entrenamiento', raw: modStats.entrenamiento?.planes_activos ?? 0, color: 'var(--omega)' as const },
      { name: 'Nutrición', raw: modStats.nutricion?.planes_nutricionales ?? 0, color: 'var(--nutri)' as const },
      { name: 'Medicina', raw: (modStats.telemedicina?.situaciones ?? 0) + (modStats.telemedicina?.documentos ?? 0), color: 'var(--medic)' as const },
      { name: 'Analítica', raw: modStats.usuarios?.activos_30_dias ?? 0, color: 'var(--analytic)' as const },
    ] : [
      { name: 'Entrenamiento', raw: 0, color: 'var(--omega)' as const },
      { name: 'Nutrición', raw: 0, color: 'var(--nutri)' as const },
      { name: 'Medicina', raw: 0, color: 'var(--medic)' as const },
      { name: 'Analítica', raw: 0, color: 'var(--analytic)' as const },
    ]
    const max = Math.max(1, ...raw.map((r) => r.raw))
    return raw.map((r) => ({ ...r, value: Math.round((r.raw / max) * 100) }))
  })()

  const fmt = (v?: number | null) => statsErr ? '—' : v == null ? '…' : String(v)

  const kpis = [
    { k: 'Usuarios', v: fmt(stats?.total_users), d: statsErr ? 'sin acceso' : 'total cuentas' },
    { k: 'Activos', v: fmt(stats?.active_users), d: statsErr ? 'sin acceso' : 'verificados' },
    { k: 'Pendientes', v: pendingErr ? '—' : pendingCount != null ? String(pendingCount) : '…', d: pendingErr ? 'sin acceso' : 'aprobación' },
    {
      k: 'Profesionales',
      v: statsErr ? '—' : stats == null ? '…' : String((stats.doctors ?? 0) + (stats.nutricionistas ?? 0) + (stats.entrenadores ?? 0)),
      d: statsErr ? 'sin acceso' : 'doc + nutri + entreno'
    },
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
        {kpis.map((s) => (
          <div key={s.k} className="stat">
            <div className="k">{s.k}</div>
            <div className="v">{s.v}</div>
            <div className="d">{s.d}</div>
          </div>
        ))}
      </div>

      {/* Module usage bars (raw counts, scaled to the largest module) */}
      <div className="ah-section">
        <div className="section-label">Uso por módulo</div>
        <div className="card">
          {moduleUsage.map((m, i) => (
            <div key={m.name} style={{ marginTop: i ? 12 : 0 }}>
              <div className="row-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{m.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: m.color }}>
                  {modStats ? m.raw : '—'}
                </span>
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
          {SYSTEM_ACTIONS.map((a) => {
            const handler =
              a.target === 'audit' ? onOpenAudit
              : a.target === 'users' ? onOpenUsers
              : a.target === 'db' ? onOpenDb
              : a.target === 'strength' ? onOpenStrength
              : undefined
            return (
              <button
                key={a.title}
                className="ah-system-card"
                type="button"
                onClick={handler}
                disabled={!handler}
                style={{ cursor: handler ? 'pointer' : 'default', opacity: handler ? 1 : 0.55 }}
              >
                <Icon name={a.icon} size={16} />
                <div className="ah-system-title">{a.title}</div>
                <div className="ah-system-sub">{a.sub}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
