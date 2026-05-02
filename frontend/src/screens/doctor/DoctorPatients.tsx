import { useState } from 'react'
import { Icon } from '../../components/Icon'
import type { Role } from '../../types/api'

const FILTERS = ['Todos', 'Hoy', 'Alta adherencia', 'Necesitan atención', 'Nuevos'] as const

interface Props {
  role?: Role
  onOpenDemoPatient?: () => void
}

export function DoctorPatients({ role = 'doctor', onOpenDemoPatient }: Props) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Todos')
  const subjectPlural = role === 'trainer' ? 'atletas' : 'pacientes'
  const subjectAct = role === 'trainer' ? 'Atletas' : 'Pacientes'
  const dataMod = role === 'trainer' ? 'training' : role === 'nutritionist' ? 'nutrition' : 'medicine'

  return (
    <div className="dp-screen" data-mod={dataMod}>
      {/* Page title — module pill + serif italic display */}
      <div className="row-between">
        <div className="module-pill">{subjectAct}</div>
        <button type="button" className="dp-add" aria-label={`Agregar ${subjectPlural.slice(0, -1)}`}>
          <Icon name="plus" size={22} />
        </button>
      </div>

      <div className="display ah-title" style={{ marginTop: 4 }}>
        <em>0</em> activos
      </div>

      {/* Search input */}
      <div className="dp-search">
        <span className="dp-search-icon">
          <Icon name="search" size={18} />
        </span>
        <input
          type="search"
          className="dp-search-input"
          placeholder={`Buscar ${subjectPlural.slice(0, -1)}…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Filter chips — horizontal scroll */}
      <div className="dp-filters">
        {FILTERS.map((f) => {
          const active = filter === f
          return (
            <button
              key={f}
              type="button"
              className={'chip dp-chip' + (active ? ' is-active' : '')}
              onClick={() => setFilter(f)}
              aria-pressed={active}
            >
              {f}
            </button>
          )
        })}
      </div>

      {/* List — empty state */}
      <div className="ph-section">
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            {q
              ? `Sin resultados para “${q}”.`
              : `Sin ${subjectPlural} todavía. Tus ${subjectPlural} aparecerán acá cuando se vinculen a tu cuenta.`}
          </p>
          {!q && onOpenDemoPatient && (
            <button
              type="button"
              className="dp-demo-link"
              onClick={onOpenDemoPatient}
            >
              Ver ficha (demo) <Icon name="chevR" size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
