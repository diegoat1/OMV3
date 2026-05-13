import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { dailyLogService } from '../services/dailyLogService'
import { ApiError } from '../services/apiClient'
import type { Food, LoggedFood, MealKey } from '../types/api'

interface Props {
  /** Meal being edited (e.g. 'desayuno'). */
  mealKey: MealKey
  /** Pretty label shown in the header. */
  mealLabel: string
  /** Foods already logged for this meal — new entries are appended. */
  existing: LoggedFood[]
  onClose: () => void
  /** Called with the updated foods array (full replacement). The parent
   *  is responsible for sending the POST. */
  onSave: (next: LoggedFood[]) => Promise<void>
}

const MIN_QUERY = 2  // chars before searching

function macrosForGrams(food: Food, gramos: number): Omit<LoggedFood, 'food_id' | 'nombre' | 'gramos'> {
  const factor = gramos / 100
  const proteina_g = (food.P || 0) * factor
  const grasa_g = (food.G || 0) * factor
  const carbohidratos_g = (food.CH || 0) * factor
  const calorias = proteina_g * 4 + grasa_g * 9 + carbohidratos_g * 4
  return {
    proteina_g: round1(proteina_g),
    grasa_g: round1(grasa_g),
    carbohidratos_g: round1(carbohidratos_g),
    calorias: round1(calorias),
  }
}
function round1(n: number): number { return Math.round(n * 10) / 10 }

export function AddFoodSheet({ mealKey: _mealKey, mealLabel, existing, onClose, onSave }: Props) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Food[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [picking, setPicking] = useState<Food | null>(null)
  const [gramos, setGramos] = useState('100')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [foods, setFoods] = useState<LoggedFood[]>(existing)

  // Debounced search
  useEffect(() => {
    if (q.trim().length < MIN_QUERY) {
      setResults([])
      setSearchError(null)
      return
    }
    let cancelled = false
    const handle = setTimeout(() => {
      setSearching(true)
      setSearchError(null)
      dailyLogService.searchFoods(q.trim(), 30)
        .then((r) => { if (!cancelled) setResults(r.data) })
        .catch((e) => {
          if (cancelled) return
          setSearchError(e instanceof ApiError ? e.message : 'Error buscando alimentos')
        })
        .finally(() => { if (!cancelled) setSearching(false) })
    }, 250)
    return () => { cancelled = true; clearTimeout(handle) }
  }, [q])

  const handleAdd = () => {
    if (!picking) return
    const g = parseFloat(gramos)
    if (!Number.isFinite(g) || g <= 0) {
      setError('Cantidad inválida.')
      return
    }
    const macros = macrosForGrams(picking, g)
    const entry: LoggedFood = {
      food_id: picking.ID,
      nombre: picking.Largadescripcion,
      gramos: round1(g),
      ...macros,
    }
    setFoods((prev) => [...prev, entry])
    setPicking(null)
    setGramos('100')
    setQ('')
    setResults([])
    setError(null)
  }

  const handleRemove = (idx: number) => {
    setFoods((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(foods)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos guardar el log.')
      setSaving(false)
    }
  }

  // Live totals over the current foods array
  const totals = foods.reduce(
    (acc, f) => ({
      p: acc.p + f.proteina_g,
      g: acc.g + f.grasa_g,
      c: acc.c + f.carbohidratos_g,
      kcal: acc.kcal + f.calorias,
    }),
    { p: 0, g: 0, c: 0, kcal: 0 },
  )

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet adm-sheet" role="dialog" aria-label={`Alimentos · ${mealLabel}`}>
        <div className="sheet-handle" />
        <div className="adm-sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="adm-sheet-name">{mealLabel}</div>
            <div className="adm-sheet-meta">
              {foods.length} alimento{foods.length === 1 ? '' : 's'} · {Math.round(totals.kcal)} kcal
            </div>
          </div>
          <button type="button" className="adm-sheet-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Logged foods list */}
        {foods.length > 0 && (
          <>
            <div className="sheet-section-label">En esta comida</div>
            <div className="card" style={{ padding: 0 }}>
              {foods.map((f, i) => (
                <div
                  key={`${f.food_id}-${i}`}
                  className="ph-link-row"
                  style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ph-link-name">{f.nombre}</div>
                    <div className="ph-link-meta">
                      {f.gramos} g · <span style={{ color: 'var(--nutri)' }}>{Math.round(f.calorias)} kcal</span>
                      {' · '}{Math.round(f.proteina_g)} P · {Math.round(f.carbohidratos_g)} C · {Math.round(f.grasa_g)} G
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ph-link-btn ph-link-reject"
                    onClick={() => handleRemove(i)}
                    aria-label="Quitar"
                    title="Quitar"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div
              className="mono"
              style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right' }}
            >
              total · {Math.round(totals.kcal)} kcal · {Math.round(totals.p)} P / {Math.round(totals.c)} C / {Math.round(totals.g)} G
            </div>
          </>
        )}

        {/* Search + pick + grams */}
        <div className="sheet-section-label">Agregar alimento</div>
        {!picking && (
          <>
            <div className="adm-field">
              <label className="adm-field-label">Buscar</label>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Pollo, arroz, palta…"
                className="adm-input"
                autoFocus
              />
            </div>
            {q.trim().length >= MIN_QUERY && (
              <div className="card" style={{ padding: 0, maxHeight: 260, overflowY: 'auto' }}>
                {searching && (
                  <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, padding: 12 }}>Buscando…</p>
                )}
                {!searching && searchError && (
                  <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0, padding: 12 }}>{searchError}</p>
                )}
                {!searching && !searchError && results.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, padding: 12 }}>
                    Sin resultados para "{q}".
                  </p>
                )}
                {!searching && results.map((food, i) => (
                  <button
                    key={food.ID}
                    type="button"
                    className="ph-link-row"
                    onClick={() => setPicking(food)}
                    style={{
                      border: 0,
                      borderTop: i === 0 ? 0 : '1px solid var(--line)',
                      width: '100%',
                      background: 'transparent',
                      color: 'var(--text-1)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ph-link-name">{food.Largadescripcion}</div>
                      <div className="ph-link-meta">
                        por 100g: <span style={{ color: 'var(--nutri)' }}>
                          {Math.round((food.P || 0) * 4 + (food.G || 0) * 9 + (food.CH || 0) * 4)} kcal
                        </span>
                        {' · '}P {Math.round(food.P || 0)} · C {Math.round(food.CH || 0)} · G {Math.round(food.G || 0)}
                      </div>
                    </div>
                    <Icon name="chevR" size={14} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {picking && (
          <>
            <div className="card" style={{ borderColor: 'var(--medic)' }}>
              <div className="row-between">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ph-link-name">{picking.Largadescripcion}</div>
                  <div className="ph-link-meta">
                    P {picking.P || 0} · C {picking.CH || 0} · G {picking.G || 0} (por 100g)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setPicking(null); setGramos('100') }}
                  style={{
                    background: 'transparent', border: 0, color: 'var(--text-3)',
                    cursor: 'pointer', fontSize: 12,
                  }}
                >
                  cambiar
                </button>
              </div>
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Cantidad (g)</label>
              <input
                type="number"
                inputMode="decimal"
                step="1"
                min={1}
                max={5000}
                value={gramos}
                onChange={(e) => setGramos(e.target.value)}
                className="adm-input"
                autoFocus
              />
            </div>
            {(() => {
              const g = parseFloat(gramos)
              if (!Number.isFinite(g) || g <= 0) return null
              const m = macrosForGrams(picking, g)
              return (
                <div
                  className="mono"
                  style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}
                >
                  {Math.round(m.calorias)} kcal · {Math.round(m.proteina_g)} P / {Math.round(m.carbohidratos_g)} C / {Math.round(m.grasa_g)} G
                </div>
              )
            })()}
            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={handleAdd}
              style={{ background: 'var(--nutri)', color: '#1a1304', fontWeight: 600 }}
            >
              <Icon name="plus" size={14} /> Agregar a la comida
            </button>
          </>
        )}

        {error && <div className="adm-error">{error}</div>}

        <button
          type="button"
          className="btn btn-primary btn-full adm-submit"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Guardando…' : 'Guardar comida'}
        </button>
      </div>
    </>
  )
}
