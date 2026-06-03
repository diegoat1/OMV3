import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { measurementService } from '../../services/measurementService'
import { checkinService } from '../../services/checkinService'
import { ApiError } from '../../services/apiClient'
import type { CheckinStats, HealthIndexTrendPoint, Measurement } from '../../types/api'

interface MetricDef {
  key: 'peso' | 'grasa' | 'musculo' | 'cintura'
  label: string
  unit: string
  color: string
  /** Picks the value from a Measurement row. */
  pick: (m: Measurement) => number | null | undefined
}

const METRICS: MetricDef[] = [
  { key: 'peso',    label: 'Peso',      unit: 'kg', color: '#7D8CFF', pick: (m) => m.peso },
  { key: 'grasa',   label: '% Grasa',   unit: '%',  color: '#4FB8A8', pick: (m) => m.bf_percent },
  { key: 'musculo', label: 'Masa Mag.', unit: 'kg', color: '#E23E4A', pick: (m) => m.peso_magro },
  { key: 'cintura', label: 'Cintura',   unit: 'cm', color: '#E8A93A', pick: (m) => m.circ_cintura },
]

const PERIODS: { key: '3M' | '12M' | 'Máx'; days: number | null }[] = [
  { key: '3M', days: 90 },
  { key: '12M', days: 365 },
  { key: 'Máx', days: null },
]

interface Props {
  userId?: string | null
}

function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return iso
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function fmtNum(n: number | null | undefined, decimals: number = 1): string {
  if (n == null || isNaN(n)) return '—'
  return n.toFixed(decimals)
}

export function Progress({ userId }: Props = {}) {
  const [metric, setMetric] = useState<MetricDef['key']>('peso')
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['key']>('3M')
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [trend, setTrend] = useState<HealthIndexTrendPoint[]>([])
  const [stats, setStats] = useState<CheckinStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [mRes, tRes, sRes] = await Promise.all([
        measurementService.list(userId).catch(() => ({ user_id: '', nombre_apellido: '', measurements: [], total: 0 })),
        checkinService.getHealthIndexTrend(90).catch(() => ({ trend: [], total: 0 })),
        checkinService.getStats({ days: 30 }).catch(() => null),
      ])
      setMeasurements(Array.isArray(mRes.measurements) ? mRes.measurements : [])
      setTrend(Array.isArray(tRes.trend) ? tRes.trend : [])
      setStats(sRes)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando progreso')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { reload() }, [reload])

  // Filter measurements by period window
  const cutoffMs = useMemo(() => {
    const p = PERIODS.find((x) => x.key === period)
    if (!p || p.days == null) return 0
    return Date.now() - p.days * 24 * 60 * 60 * 1000
  }, [period])

  const filteredMeasurements = useMemo(() => {
    if (!cutoffMs) return measurements
    return measurements.filter((m) => {
      const d = m.fecha ? new Date(m.fecha.replace(' ', 'T')).getTime() : NaN
      return !isNaN(d) && d >= cutoffMs
    })
  }, [measurements, cutoffMs])

  // Compute current + delta for each metric
  const metricSummary = useMemo(() => {
    return METRICS.map((m) => {
      const sorted = [...filteredMeasurements].sort((a, b) =>
        (a.fecha ? new Date(a.fecha.replace(' ', 'T')).getTime() : 0) - (b.fecha ? new Date(b.fecha.replace(' ', 'T')).getTime() : 0)
      )
      const series = sorted.map(m.pick).filter((v): v is number => v != null)
      const current = series.length ? series[series.length - 1] : null
      const first = series.length ? series[0] : null
      const delta = current != null && first != null && series.length > 1 ? current - first : null
      return { ...m, current, delta, series, sortedMeasurements: sorted }
    })
  }, [filteredMeasurements])

  const activeMetric = metricSummary.find((m) => m.key === metric) ?? metricSummary[0]
  const activeColor = activeMetric.color

  // Compute SVG path for the active metric series
  const chartPath = useMemo(() => {
    const series = activeMetric.series
    if (series.length < 2) return null
    const max = Math.max(...series)
    const min = Math.min(...series)
    const range = max - min || 1
    const W = 320
    const H = 140
    const padX = 10
    const padY = 20
    const step = (W - padX * 2) / (series.length - 1)
    const points = series.map((v, i) => {
      const x = padX + i * step
      const y = padY + (H - padY * 2) * (1 - (v - min) / range)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    return `M ${points[0]} L ${points.slice(1).join(' L ')}`
  }, [activeMetric.series])

  const avg = activeMetric.series.length
    ? activeMetric.series.reduce((a, b) => a + b, 0) / activeMetric.series.length
    : null

  return (
    <div className="pr-screen" data-mod="analytics">
      {/* Top row */}
      <div className="row-between">
        <div className="module-pill">Progreso</div>
        <div className="pr-perf-link">
          Performance Clock <Icon name="chevR" size={14} />
        </div>
      </div>

      <div className="display pr-title">
        <em>Composición</em> Corporal
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Metric selector */}
      <div className="pr-metrics">
        {metricSummary.map((m) => {
          const active = metric === m.key
          const deltaSign = m.delta == null ? null : m.delta > 0 ? '+' : ''
          return (
            <button
              key={m.key}
              type="button"
              className={'pr-metric' + (active ? ' is-active' : '')}
              style={active ? { borderColor: m.color, background: m.color + '1a' } : undefined}
              onClick={() => setMetric(m.key)}
            >
              <div className="mono pr-metric-label">{m.label}</div>
              <div className="pr-metric-num">
                {loading ? '…' : fmtNum(m.current)} <span className="pr-metric-unit">{m.unit}</span>
              </div>
              <div className="pr-metric-delta" style={{ color: m.color }}>
                {m.delta == null
                  ? (loading ? 'Cargando' : 'Sin datos')
                  : `${deltaSign}${m.delta.toFixed(1)} ${m.unit}`}
              </div>
            </button>
          )
        })}
      </div>

      {/* Period segmented tabs */}
      <div className="pr-periods">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={'pr-period' + (period === p.key ? ' is-active' : '')}
            onClick={() => setPeriod(p.key)}
          >
            {p.key}
          </button>
        ))}
      </div>

      {/* Chart card */}
      <div className="card pr-chart">
        <div className="pr-chart-label">
          Promedio · {period === '3M' ? '90 días' : period === '12M' ? '12 meses' : 'todo'}
        </div>
        <div className="pr-chart-num">
          {fmtNum(avg)} <span className="pr-chart-unit">{activeMetric.unit}</span>
        </div>
        <div className="pr-chart-empty">
          <svg viewBox="0 0 320 140" className="pr-chart-svg">
            {[0, 1, 2, 3].map((i) => (
              <line
                key={i}
                x1="0"
                y1={20 + i * 30}
                x2="320"
                y2={20 + i * 30}
                stroke="rgba(255,255,255,0.04)"
              />
            ))}
            {chartPath ? (
              <path
                d={chartPath}
                fill="none"
                stroke={activeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M 0 80 L 320 80"
                fill="none"
                stroke={activeColor}
                strokeOpacity="0.25"
                strokeWidth="2"
                strokeDasharray="4 6"
              />
            )}
          </svg>
          {!chartPath && (
            <div className="pr-chart-empty-msg">
              {loading ? 'Cargando…' : activeMetric.series.length === 1
                ? 'Hace falta otra medición para graficar.'
                : 'Sin datos suficientes para graficar.'}
            </div>
          )}
        </div>
      </div>

      {/* Check-in adherence stats */}
      {stats && (
        <div className="ph-section">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div className="section-label">Check-ins · 30 días</div>
            <div className="mono" style={{ color: 'var(--text-3)' }}>
              {stats.days_filled}/{stats.days_total}
            </div>
          </div>
          <div className="ah-stats">
            <div className="stat">
              <div className="k">Racha</div>
              <div className="v">{stats.current_streak}</div>
              <div className="d">días</div>
            </div>
            <div className="stat">
              <div className="k">Récord</div>
              <div className="v">{stats.longest_streak}</div>
              <div className="d">días</div>
            </div>
            <div className="stat">
              <div className="k">Promedio</div>
              <div className="v">{stats.avg_score != null ? Math.round(stats.avg_score) : '—'}</div>
              <div className="d">de 100</div>
            </div>
          </div>
        </div>
      )}

      {/* Health index trend (if any) */}
      {trend.length > 0 && (
        <div className="ph-section">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div className="section-label">Health Index · {trend.length} días</div>
            <div className="mono" style={{ color: 'var(--text-3)' }}>
              {(trend[trend.length - 1]?.score ?? 0).toFixed(0)}/100
            </div>
          </div>
          <div className="card pr-chart" style={{ padding: 14 }}>
            <svg viewBox="0 0 320 80" style={{ width: '100%', height: 80 }}>
              {trend.length > 1 && (() => {
                const scores = trend.map((t) => t.score)
                const max = Math.max(...scores, 100)
                const min = Math.min(...scores, 0)
                const range = max - min || 1
                const step = 320 / (trend.length - 1)
                const pts = scores.map((s, i) => {
                  const x = i * step
                  const y = 70 - (s - min) / range * 60
                  return `${x.toFixed(1)},${y.toFixed(1)}`
                })
                return (
                  <path
                    d={`M ${pts[0]} L ${pts.slice(1).join(' L ')}`}
                    fill="none"
                    stroke="var(--ok)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )
              })()}
            </svg>
          </div>
        </div>
      )}

      {/* Measurements list */}
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Registros</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>
            {loading ? '…' : `${filteredMeasurements.length} registro${filteredMeasurements.length === 1 ? '' : 's'}`}
          </div>
        </div>
        {!loading && filteredMeasurements.length === 0 && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              Sin mediciones registradas todavía.
            </p>
          </div>
        )}
        {filteredMeasurements.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {[...filteredMeasurements]
              .sort((a, b) =>
                (b.fecha ? new Date(b.fecha.replace(' ', 'T')).getTime() : 0) - (a.fecha ? new Date(a.fecha.replace(' ', 'T')).getTime() : 0)
              )
              .slice(0, 10)
              .map((m, i) => (
                <div
                  key={m.id}
                  className="ph-link-row"
                  style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ph-link-name">{fmtDate(m.fecha)}</div>
                    <div className="ph-link-meta">
                      {[m.peso && `${fmtNum(m.peso)} kg`,
                        m.bf_percent != null && `${fmtNum(m.bf_percent)}%`,
                        m.ffmi != null && `FFMI ${fmtNum(m.ffmi)}`,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <button type="button" className="btn btn-full pr-add" disabled>
        <Icon name="plus" size={16} /> Registrar medición
      </button>
    </div>
  )
}
