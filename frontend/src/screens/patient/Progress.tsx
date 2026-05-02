import { useState } from 'react'
import { Icon } from '../../components/Icon'

interface Metric {
  k: string
  l: string
  unit: string
  color: string
}

const METRICS: Metric[] = [
  { k: 'peso', l: 'Peso', unit: 'kg', color: '#7D8CFF' },
  { k: 'grasa', l: '% Grasa', unit: '%', color: '#4FB8A8' },
  { k: 'musculo', l: 'Masa Mag.', unit: 'kg', color: '#E23E4A' },
  { k: 'cintura', l: 'Cintura', unit: 'cm', color: '#E8A93A' },
]

const PERIODS = ['3M', '12M', 'Máx', 'Personalizado'] as const

export function Progress() {
  const [metric, setMetric] = useState<string>('peso')
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('3M')
  const activeColor = METRICS.find((m) => m.k === metric)?.color ?? 'var(--analytic)'

  return (
    <div className="pr-screen" data-mod="analytics">
      {/* Top row — Progreso pill + Performance Clock link */}
      <div className="row-between">
        <div className="module-pill">Progreso</div>
        <div className="pr-perf-link">
          Performance Clock <Icon name="chevR" size={14} />
        </div>
      </div>

      <div className="display pr-title">
        <em>Composición</em> Corporal
      </div>

      {/* Metric selector (horizontal scroll) */}
      <div className="pr-metrics">
        {METRICS.map((m) => {
          const active = metric === m.k
          return (
            <button
              key={m.k}
              type="button"
              className={'pr-metric' + (active ? ' is-active' : '')}
              style={
                active
                  ? { borderColor: m.color, background: m.color + '1a' }
                  : undefined
              }
              onClick={() => setMetric(m.k)}
            >
              <div className="mono pr-metric-label">{m.l}</div>
              <div className="pr-metric-num">
                — <span className="pr-metric-unit">{m.unit}</span>
              </div>
              <div className="pr-metric-delta" style={{ color: m.color }}>
                Sin datos
              </div>
            </button>
          )
        })}
      </div>

      {/* Period segmented tabs */}
      <div className="pr-periods">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            className={'pr-period' + (period === p ? ' is-active' : '')}
            onClick={() => setPeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chart card — empty state */}
      <div className="card pr-chart">
        <div className="pr-chart-label">Promedio 90 días</div>
        <div className="pr-chart-num">
          — <span className="pr-chart-unit">{METRICS.find((m) => m.k === metric)?.unit}</span>
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
            <path
              d="M 0 80 L 320 80"
              fill="none"
              stroke={activeColor}
              strokeOpacity="0.25"
              strokeWidth="2"
              strokeDasharray="4 6"
            />
          </svg>
          <div className="pr-chart-empty-msg">
            Sin datos suficientes para graficar.
          </div>
        </div>
      </div>

      {/* Measurements list — empty state */}
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Registros</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>0 registros</div>
        </div>
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Sin mediciones registradas todavía.
          </p>
        </div>
      </div>

      <button type="button" className="btn btn-full pr-add">
        <Icon name="plus" size={16} /> Registrar medición
      </button>
    </div>
  )
}
