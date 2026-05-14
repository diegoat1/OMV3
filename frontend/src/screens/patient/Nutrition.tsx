import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { AddFoodSheet } from '../../components/AddFoodSheet'
import { DietSurveySheet } from '../../components/DietSurveySheet'
import { nutritionService } from '../../services/nutritionService'
import { dailyLogService } from '../../services/dailyLogService'
import { ApiError } from '../../services/apiClient'
import type { DailyLogMeal, LoggedFood, MealKey, NutritionPlan } from '../../types/api'

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const

const MEAL_DEFS: { key: MealKey; name: string }[] = [
  { key: 'desayuno', name: 'Desayuno' },
  { key: 'media_manana', name: 'Media Mañana' },
  { key: 'almuerzo', name: 'Almuerzo' },
  { key: 'merienda', name: 'Merienda' },
  { key: 'media_tarde', name: 'Media Tarde' },
  { key: 'cena', name: 'Cena' },
]

interface MealCard {
  key: MealKey
  name: string
  // Targets from plan distribution
  target_kcal: number
  target_p: number
  target_c: number
  target_g: number
  // Consumed totals from daily-log
  total_kcal: number
  total_p: number
  total_c: number
  total_g: number
  // Foods array (for editing in the sheet)
  foods: LoggedFood[]
  // Is this meal enabled by the plan distribution?
  enabled: boolean
}

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

function planTargets(plan: NutritionPlan | null, mealKey: MealKey): { p: number; g: number; c: number } {
  if (!plan) return { p: 0, g: 0, c: 0 }
  const P = plan.proteina ?? 0
  const G = plan.grasa ?? 0
  const C = plan.carbohidratos ?? 0
  const pct: Record<MealKey, { pp: number | null; gg: number | null; cc: number | null }> = {
    desayuno: { pp: plan.desayuno_p, gg: plan.desayuno_g, cc: plan.desayuno_c },
    media_manana: { pp: plan.media_man_p, gg: plan.media_man_g, cc: plan.media_man_c },
    almuerzo: { pp: plan.almuerzo_p, gg: plan.almuerzo_g, cc: plan.almuerzo_c },
    merienda: { pp: plan.merienda_p, gg: plan.merienda_g, cc: plan.merienda_c },
    media_tarde: { pp: plan.media_tar_p, gg: plan.media_tar_g, cc: plan.media_tar_c },
    cena: { pp: plan.cena_p, gg: plan.cena_g, cc: plan.cena_c },
  }
  const r = pct[mealKey]
  return {
    p: P * (r.pp ?? 0),
    g: G * (r.gg ?? 0),
    c: C * (r.cc ?? 0),
  }
}

function kcalFromMacros(p: number, c: number, g: number): number {
  return p * 4 + c * 4 + g * 9
}

export function Nutrition() {
  const week = weekFromMonday()
  const todayIso = localIso(new Date())
  const [selectedIso, setSelectedIso] = useState(todayIso)
  const [plan, setPlan] = useState<NutritionPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(true)
  const [logMeals, setLogMeals] = useState<DailyLogMeal[]>([])
  const [logLoading, setLogLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [surveyOpen, setSurveyOpen] = useState(false)
  const [savingLibertad, setSavingLibertad] = useState(false)
  const [editingMeal, setEditingMeal] = useState<MealKey | null>(null)

  useEffect(() => {
    let cancelled = false
    nutritionService.listPlans()
      .then((r) => { if (!cancelled) setPlan(r.plans[0] ?? null) })
      .catch((e) => { if (!cancelled) setError(e instanceof ApiError ? e.message : 'Error cargando plan') })
      .finally(() => { if (!cancelled) setPlanLoading(false) })
    return () => { cancelled = true }
  }, [])

  const reloadLog = useCallback(async () => {
    setLogLoading(true)
    try {
      const r = await dailyLogService.get(selectedIso)
      setLogMeals(r.meals)
    } catch (e) {
      // Treat as empty if unauthorized / 404
      if (e instanceof ApiError && (e.status === 401 || e.status === 404)) {
        setLogMeals([])
      } else {
        setError(e instanceof ApiError ? e.message : 'Error cargando log')
      }
    } finally {
      setLogLoading(false)
    }
  }, [selectedIso])

  useEffect(() => { reloadLog() }, [reloadLog])

  // Build meal cards by combining plan targets + logged consumption
  const mealCards: MealCard[] = MEAL_DEFS.map(({ key, name }) => {
    const t = planTargets(plan, key)
    const target_kcal = kcalFromMacros(t.p, t.c, t.g)
    const logged = logMeals.find((m) => m.meal_key === key)
    return {
      key,
      name,
      target_kcal,
      target_p: t.p,
      target_c: t.c,
      target_g: t.g,
      total_kcal: logged?.total_cal ?? 0,
      total_p: logged?.total_p ?? 0,
      total_c: logged?.total_c ?? 0,
      total_g: logged?.total_g ?? 0,
      foods: (logged?.foods_json && Array.isArray(logged.foods_json) ? logged.foods_json : []) as LoggedFood[],
      enabled: target_kcal > 0,
    }
  })

  const enabledCards = mealCards.filter((m) => m.enabled)
  const visibleCards = enabledCards.length > 0 ? enabledCards : mealCards

  // Daily totals
  const dayTotals = visibleCards.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.total_kcal,
      p: acc.p + m.total_p,
      c: acc.c + m.total_c,
      g: acc.g + m.total_g,
    }),
    { kcal: 0, p: 0, c: 0, g: 0 },
  )

  const planKcal = plan?.calorias ?? 0
  const planP = plan?.proteina ?? 0
  const planC = plan?.carbohidratos ?? 0
  const planG = plan?.grasa ?? 0

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

  const handleSaveMeal = async (mealKey: MealKey, foods: LoggedFood[]) => {
    const target = mealCards.find((m) => m.key === mealKey)
    if (!target) return
    const totals = foods.reduce(
      (acc, f) => ({
        p: acc.p + f.proteina_g,
        c: acc.c + f.carbohidratos_g,
        g: acc.g + f.grasa_g,
        kcal: acc.kcal + f.calorias,
      }),
      { p: 0, c: 0, g: 0, kcal: 0 },
    )
    await dailyLogService.save({
      fecha: selectedIso,
      meals: [{
        meal_key: mealKey,
        foods_json: foods,
        completed: foods.length > 0,
        total_p: totals.p,
        total_g: totals.g,
        total_c: totals.c,
        total_cal: totals.kcal,
        target_p: target.target_p,
        target_g: target.target_g,
        target_c: target.target_c,
      }],
    })
    setEditingMeal(null)
    await reloadLog()
  }

  const editing = editingMeal ? mealCards.find((m) => m.key === editingMeal) : null

  return (
    <div className="nu-screen" data-mod="nutrition">
      <div className="row-between">
        <div className="module-pill">Nutrición</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '4px 10px', fontSize: 11 }}
            onClick={() => setSurveyOpen(true)}
          >
            Hábitos semanales
          </button>
          <button type="button" className="nu-search-btn" aria-label="Buscar alimento">
            <Icon name="search" size={20} />
          </button>
        </div>
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

      {planLoading && !plan && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Cargando plan…</p>
        </div>
      )}

      {!planLoading && !plan && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Tu plan alimentario aparecerá acá cuando tu nutricionista lo asigne.
          </p>
        </div>
      )}

      {plan && (
        <div className="card nu-totals">
          <div className="nu-totals-num">
            <span style={{ color: 'var(--nutri)' }}>{Math.round(dayTotals.kcal)}</span>
            <span style={{ color: 'var(--text-3)' }}> / {Math.round(planKcal)}</span>
          </div>
          <div className="mono nu-totals-unit">kcal</div>
          <div className="nu-totals-bar">
            <span
              className="nu-totals-fill"
              style={{ width: `${planKcal > 0 ? Math.min(100, (dayTotals.kcal / planKcal) * 100) : 0}%` }}
            />
          </div>
          <div className="nu-totals-range">
            <span>0</span><span>{Math.round(planKcal)}</span>
          </div>

          <div className="nu-macros">
            {[
              { name: 'Proteína', value: dayTotals.p, max: planP, color: '#E8A93A' },
              { name: 'Carbos', value: dayTotals.c, max: planC, color: '#F2D35F' },
              { name: 'Grasas', value: dayTotals.g, max: planG, color: '#F16B57' },
            ].map((m) => (
              <div key={m.name}>
                <div className="nu-macro-label">{m.name}</div>
                <div className="nu-macro-num">{Math.round(m.value)} / {Math.round(m.max)} g</div>
                <div className="bar nu-macro-bar">
                  <span
                    style={{
                      width: `${m.max > 0 ? Math.min(100, (m.value / m.max) * 100) : 0}%`,
                      background: m.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan && visibleCards.length > 0 && (
        <div className="nu-meals">
          {visibleCards.map((m) => {
            const hasFoods = m.foods.length > 0
            return (
              <div key={m.key} className="card nu-meal">
                <div className="row-between">
                  <div>
                    <div className="nu-meal-name">{m.name}</div>
                    <div className="nu-meal-macros">
                      <span style={{ color: 'var(--nutri)' }}>
                        {Math.round(m.total_kcal)} / {Math.round(m.target_kcal)} kcal
                      </span>
                      {hasFoods && (
                        <>
                          {' · '}
                          {Math.round(m.total_p)} P · {Math.round(m.total_c)} C · {Math.round(m.total_g)} G
                        </>
                      )}
                    </div>
                  </div>
                  <Icon name="more" size={18} />
                </div>
                {hasFoods && (
                  <div
                    className="mono"
                    style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}
                  >
                    {m.foods.length} alimento{m.foods.length === 1 ? '' : 's'} · {m.foods.map((f) => f.nombre).slice(0, 3).join(' · ')}
                    {m.foods.length > 3 ? '…' : ''}
                  </div>
                )}
                <button
                  type="button"
                  className="nu-meal-add"
                  onClick={() => setEditingMeal(m.key)}
                >
                  <Icon name="plus" size={14} />
                  {hasFoods ? 'Editar comida' : 'Añadir alimento'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {logLoading && plan && (
        <p className="mono" style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', margin: 0 }}>
          Cargando registro del día…
        </p>
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

      {editing && (
        <AddFoodSheet
          mealKey={editing.key}
          mealLabel={editing.name}
          existing={editing.foods}
          onClose={() => setEditingMeal(null)}
          onSave={(next) => handleSaveMeal(editing.key, next)}
        />
      )}

      {surveyOpen && (
        <DietSurveySheet
          onClose={() => setSurveyOpen(false)}
          onSaved={() => setSurveyOpen(false)}
        />
      )}
    </div>
  )
}
