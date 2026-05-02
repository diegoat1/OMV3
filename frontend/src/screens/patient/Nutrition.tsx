import { useState } from 'react'
import { Icon } from '../../components/Icon'

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const

interface Meal {
  name: string
  kcal: number
  p: number
  c: number
  g: number
}

const MEALS: Meal[] = [
  { name: 'Desayuno', kcal: 0, p: 0, c: 0, g: 0 },
  { name: 'Media Mañana', kcal: 0, p: 0, c: 0, g: 0 },
  { name: 'Almuerzo', kcal: 0, p: 0, c: 0, g: 0 },
  { name: 'Merienda', kcal: 0, p: 0, c: 0, g: 0 },
  { name: 'Cena', kcal: 0, p: 0, c: 0, g: 0 },
]

// Compute the 7 days of the current week starting on Monday.
function weekFromMonday(): Date[] {
  const today = new Date()
  const dow = today.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const offsetToMonday = (dow + 6) % 7
  const monday = new Date(today)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(today.getDate() - offsetToMonday)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

// Local-time YYYY-MM-DD (avoid toISOString which returns UTC and can flip
// the date when the local clock is in a positive offset and the UTC day has
// already advanced).
function localIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function Nutrition() {
  const week = weekFromMonday()
  const todayIso = localIso(new Date())
  const [selectedIso, setSelectedIso] = useState(todayIso)

  return (
    <div className="nu-screen" data-mod="nutrition">
      {/* Top row — Nutrición pill (left) + search icon (right) */}
      <div className="row-between">
        <div className="module-pill">Nutrición</div>
        <button
          type="button"
          className="nu-search-btn"
          aria-label="Buscar alimento"
        >
          <Icon name="search" size={20} />
        </button>
      </div>

      {/* Day selector — current week, today highlighted */}
      <div className="nu-week">
        {week.map((d, i) => {
          const iso = localIso(d)
          const active = selectedIso === iso
          return (
            <button
              key={iso}
              type="button"
              className={'nu-day' + (active ? ' is-active' : '')}
              onClick={() => setSelectedIso(iso)}
              aria-pressed={active}
            >
              <span className="nu-day-letter">{DAY_LETTERS[i]}</span>
              <span className="nu-day-num">{d.getDate()}</span>
            </button>
          )
        })}
      </div>

      {/* Totals — empty state */}
      <div className="card nu-totals">
        <div className="nu-totals-num">
          <span style={{ color: 'var(--nutri)' }}>0</span>
          <span style={{ color: 'var(--text-3)' }}> / —</span>
        </div>
        <div className="mono nu-totals-unit">kcal</div>
        <div className="nu-totals-bar">
          <span className="nu-totals-fill" style={{ width: '0%' }} />
        </div>
        <div className="nu-totals-range">
          <span>—</span><span>—</span>
        </div>

        <div className="nu-macros">
          {[
            { name: 'Proteína', value: 0, max: 0, color: '#E8A93A' },
            { name: 'Carbos', value: 0, max: 0, color: '#F2D35F' },
            { name: 'Grasas', value: 0, max: 0, color: '#F16B57' },
          ].map((m) => (
            <div key={m.name}>
              <div className="nu-macro-label">{m.name}</div>
              <div className="nu-macro-num">{m.value} / — g</div>
              <div className="bar nu-macro-bar">
                <span style={{ width: '0%', background: m.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meals list — 5 cards in empty state */}
      <div className="nu-meals">
        {MEALS.map((m) => (
          <div key={m.name} className="card nu-meal">
            <div className="row-between">
              <div>
                <div className="nu-meal-name">{m.name}</div>
                <div className="nu-meal-macros">
                  <span style={{ color: 'var(--nutri)' }}>{m.kcal} kcal</span>
                  {' · '}{m.p} P · {m.c} C · {m.g} G
                </div>
              </div>
              <Icon name="more" size={18} />
            </div>
            <button type="button" className="nu-meal-add">
              <Icon name="plus" size={14} /> Añadir alimento
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
