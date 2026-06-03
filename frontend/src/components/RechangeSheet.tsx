import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { nutritionService } from '../services/nutritionService'
import { ApiError } from '../services/apiClient'
import type { LoggedFood, RechangeEquivalent } from '../types/api'

interface Props {
  /** Alimento a reemplazar (el del log). */
  food: LoggedFood
  onClose: () => void
  /** Devuelve el alimento equivalente elegido (para reemplazar en la comida). */
  onReplace: (next: LoggedFood) => void
}

function kcalOf(e: RechangeEquivalent): number {
  const m = e.macros ?? { proteina: 0, grasa: 0, carbohidratos: 0 }
  return Math.round((m.proteina || 0) * 4 + (m.grasa || 0) * 9 + (m.carbohidratos || 0) * 4)
}

/** Fitia "Rechange": dado un alimento de la comida, sugiere equivalentes que
 *  mantienen los macros (matcheados por calorías, rankeados por cercanía).
 *  Al elegir uno, reemplaza el alimento en la comida. */
export function RechangeSheet({ food, onClose, onReplace }: Props) {
  const [equivalents, setEquivalents] = useState<RechangeEquivalent[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    nutritionService.rechange({ food_id: food.food_id, grams: food.gramos, limit: 12 })
      .then((r) => { if (alive) setEquivalents(Array.isArray(r.equivalents) ? r.equivalents : []) })
      .catch((e) => { if (alive) setError(e instanceof ApiError ? e.message : 'Error buscando equivalentes') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [food.food_id, food.gramos])

  const pick = (e: RechangeEquivalent) => {
    onReplace({
      food_id: e.food_id,
      nombre: e.nombre,
      gramos: e.suggested_grams,
      proteina_g: e.macros.proteina,
      grasa_g: e.macros.grasa,
      carbohidratos_g: e.macros.carbohidratos,
      calorias: kcalOf(e),
    })
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet adm-sheet" role="dialog" aria-label={`Equivalentes · ${food.nombre}`} data-mod="nutrition">
        <div className="sheet-handle" />
        <div className="adm-sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="adm-sheet-name">Reemplazar alimento</div>
            <div className="adm-sheet-meta">
              {food.nombre} · {food.gramos} g · {Math.round(food.calorias)} kcal
            </div>
          </div>
          <button type="button" className="adm-sheet-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 10px' }}>
          Equivalentes que mantienen los macros. La cantidad sugerida iguala las
          calorías; elegí uno para reemplazarlo en la comida.
        </p>

        {loading && <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Buscando equivalentes…</p>}
        {error && <div className="adm-error">{error}</div>}
        {!loading && !error && (!equivalents || equivalents.length === 0) && (
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Sin equivalentes en el catálogo.</p>
        )}
        {!loading && !error && equivalents && equivalents.length > 0 && (
          <div className="card" style={{ padding: 0, maxHeight: 360, overflowY: 'auto' }}>
            {equivalents.map((e, i) => (
              <button
                key={e.food_id}
                type="button"
                className="ph-link-row"
                onClick={() => pick(e)}
                style={{
                  border: 0, borderTop: i === 0 ? 0 : '1px solid var(--line)',
                  width: '100%', background: 'transparent', color: 'var(--text-1)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ph-link-name">{e.nombre}</div>
                  <div className="ph-link-meta">
                    {e.suggested_grams} g · <span style={{ color: 'var(--nutri)' }}>{kcalOf(e)} kcal</span>
                    {' · '}P {Math.round(e.macros?.proteina ?? 0)} · C {Math.round(e.macros?.carbohidratos ?? 0)} · G {Math.round(e.macros?.grasa ?? 0)}
                  </div>
                </div>
                <Icon name="chevR" size={14} />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
