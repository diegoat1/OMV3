import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { nutritionService } from '../../services/nutritionService'
import { ApiError } from '../../services/apiClient'
import type { NutritionPlan } from '../../types/api'

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const
const EMPTY_MEAL_NAMES = ['Desayuno', 'Media Mañana', 'Almuerzo', 'Merienda', 'Media Tarde', 'Cena']

interface MealCard { name: string; kcal: number; p: number; c: number; g: number }

function weekFromMonday(): Date[] {
  const today = new Date()
  const dow = today.getDay()
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

function localIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildMealCards(plan: NutritionPlan | null): MealCard[] {
  if (!plan) return EMPTY_MEAL_NAMES.map((name) => ({ name, kcal: 0, p: 0, c: 0, g: 0 }))
  const P = plan.proteina ?? 0
  const G = plan.grasa ?? 0
  const C = plan.carbohidratos ?? 0
  const rows = [
    { name: 'Desayuno', pp: plan.desayuno_p, gg: plan.desayuno_g, cc: plan.desayuno_c },
    { name: 'Media Mañana', pp: plan.media_man_p, gg: plan.media_man_g, cc: plan.media_man_c },
    { name: 'Almuerzo', pp: plan.almuerzo_p, gg: plan.almuerzo_g, cc: plan.almuerzo_c },
    { name: 'Merienda', pp: plan.merienda_p, gg: plan.merienda_g, cc: plan.merienda_c },
    { name: 'Media Tarde', pp: plan.media_tar_p, gg: plan.media_tar_g, cc: plan.media_tar_c },
    { name: 'Cena', pp: plan.cena_p, gg: plan.cena_g, cc: plan.cena_c },
  ]
  const cards = rows.map((r) => {
    const p = P * (r.pp ?? 0)
    const g = G * (r.gg ?? 0)
    const c = C * (r.cc ?? 0)
    return {
      name: r.name,
      kcal: Math.round(p * 4 + g * 9 + c * 4),
      p: Math.round(p),
      c: Math.round(c),
      g: Math.round(g),
    }
  })
  // Hide disabled meals (zero distribution); fall back to all when nothing configured.
  const enabled = cards.filter((m) => m.kcal > 0)
  return enabled.length > 0 ? enabled : cards
}

export function Nutrition() {
  const week = weekFromMonday()
  const todayIso = localIso(new Date())
  const [selectedIso, setSelectedIso] = useState(todayIso)
  const [plan, setPlan] = useState<NutritionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingLibertad, setSavingLibertad] = useState(false)

  useEffect(() => {
    let cancelled = false
    nutritionService.listPlans()
      .then((r) => { if (!cancelled) setPlan(r.plans[0] ?? null) })
      .catch((e) => { if (!cancelled) setError(e instanceof ApiError ? e.message : 'Error cargando plan') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const meals = buildMealCards(plan)
  const kcal = plan?.calorias ?? 0
  const protMax = plan?.proteina ?? 0
  const carbMax = plan?.carbohidratos ?? 0
  const fatMax = plan?.grasa ?? 0

  // Patient is allowed to edit libertad through the /structure endpoint
  // (Fix 18 — OMV-45). The slider commits on release.
  const handleLibertadChange = async (newVal: number) => {
    if (!plan) return
    setSavingLibertad(true)
    setError(null)
    try {
      await nutritionService.updatePlanStructure(plan.id, { libertad: newVal })
      setPlan({ ...plan, libertad: newVal })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error guardando margen')
    } finally {
      setSavingLibertad(false)
    }
  }

  return (
    <div className="nu-screen" data-mod="nutrition">
      <div className="row-between">
        <div className="module-pill">Nutrición</div>
        <button type="button" className="nu-search-btn" aria-label="Buscar alimento">
          <Icon name="search" size={20} />
        </button>
      </div>

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

      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}

      {loading && !plan && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Cargando plan…</p>
        </div>
      )}

      {!loading && !plan && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Tu plan alimentario aparecerá acá cuando tu nutricionista lo asigne.
          </p>
        </div>
      )}

      {plan && (
        <div className="card nu-totals">
          <div className="nu-totals-num">
            <span style={{ color: 'var(--nutri)' }}>0</span>
            <span style={{ color: 'var(--text-3)' }}> / {Math.round(kcal)}</span>
          </div>
          <div className="mono nu-totals-unit">kcal</div>
          <div className="nu-totals-bar">
            <span className="nu-totals-fill" style={{ width: '0%' }} />
          </div>
          <div className="nu-totals-range">
            <span>0</span><span>{Math.round(kcal)}</span>
          </div>

          <div className="nu-macros">
            {[
              { name: 'Proteína', value: 0, max: Math.round(protMax), color: '#E8A93A' },
              { name: 'Carbos', value: 0, max: Math.round(carbMax), color: '#F2D35F' },
              { name: 'Grasas', value: 0, max: Math.round(fatMax), color: '#F16B57' },
            ].map((m) => (
              <div key={m.name}>
                <div className="nu-macro-label">{m.name}</div>
                <div className="nu-macro-num">{m.value} / {m.max} g</div>
                <div className="bar nu-macro-bar">
                  <span style={{ width: '0%', background: m.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan && meals.length > 0 && (
        <div className="nu-meals">
          {meals.map((m) => (
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
      )}

      {plan && (
        <div className="card" style={{ marginTop: 8 }}>
          <div className="row-between" style={{ marginBottom: 6 }}>
            <div className="nu-meal-name">Margen del solver</div>
            <span className="mono" style={{ color: 'var(--text-3)', fontSize: 12 }}>
              {plan.libertad ?? 5}%
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 8px' }}>
            Cuánto puede desviarse el cálculo de cantidades de los gramos exactos.
            Ajustalo a tu preferencia — es una opción tuya, no afecta los macros.
          </p>
          <input
            type="range"
            min={0}
            max={25}
            step={1}
            value={plan.libertad ?? 5}
            onChange={(e) => setPlan({ ...plan, libertad: Number(e.target.value) })}
            onMouseUp={(e) => handleLibertadChange(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => handleLibertadChange(Number((e.target as HTMLInputElement).value))}
            disabled={savingLibertad}
            style={{ width: '100%' }}
          />
          {savingLibertad && (
            <p className="mono" style={{ fontSize: 11, color: 'var(--text-3)', margin: '4px 0 0' }}>
              Guardando…
            </p>
          )}
        </div>
      )}
    </div>
  )
}
