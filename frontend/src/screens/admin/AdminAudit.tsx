import { useState } from 'react'

const FILTERS = ['Todo', 'Clínico', 'Admin', 'Sistema', 'Errores'] as const

export function AdminAudit() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Todo')

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

      {/* Filter chips — horizontal scroll */}
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

      {/* Events timeline — empty state */}
      <div className="ah-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Eventos</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>0 eventos</div>
        </div>
        <div className="card aa-empty">
          <div className="aa-empty-dot" />
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Sin eventos para mostrar.
            <br />
            <span style={{ color: 'var(--text-3)' }}>
              Los eventos del sistema aparecerán acá a medida que ocurran.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
