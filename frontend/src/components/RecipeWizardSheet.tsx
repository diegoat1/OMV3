import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { nutritionService } from '../services/nutritionService'
import { ApiError } from '../services/apiClient'
import type { Food } from '../types/api'

interface Props {
  onClose: () => void
  onSaved: () => void
}

interface Ingredient {
  uid: string
  food_id: number
  nombre: string
  gramos: number
  p_per_100: number
  g_per_100: number
  ch_per_100: number
}

const newIngredient = (): Ingredient => ({
  uid: Math.random().toString(36).slice(2, 9),
  food_id: 0,
  nombre: '',
  gramos: 0,
  p_per_100: 0,
  g_per_100: 0,
  ch_per_100: 0,
})

function totals(ings: Ingredient[]) {
  let p = 0, g = 0, ch = 0
  for (const i of ings) {
    const factor = i.gramos / 100
    p += i.p_per_100 * factor
    g += i.g_per_100 * factor
    ch += i.ch_per_100 * factor
  }
  const kcal = p * 4 + ch * 4 + g * 9
  return { p, g, ch, kcal }
}

/** Multi-step recipe creation wizard (legacy `recipecreator.html` flow):
 *  1. Datos básicos (nombre, descripción, porciones)
 *  2. Ingredientes con autocomplete del catálogo
 *  3. Revisión + guardar
 */
export function RecipeWizardSheet({ onClose, onSaved }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  // Step 1
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [porciones, setPorciones] = useState('1')
  const [preparacion, setPreparacion] = useState('')
  // Step 2
  const [ingredients, setIngredients] = useState<Ingredient[]>([newIngredient()])
  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canNext1 = nombre.trim().length > 0 && Number(porciones) > 0
  const canNext2 = ingredients.some((i) => i.food_id > 0 && i.gramos > 0)

  const updateIng = (uid: string, patch: Partial<Ingredient>) => {
    setIngredients((prev) => prev.map((i) => i.uid === uid ? { ...i, ...patch } : i))
  }

  const addIng = () => setIngredients((p) => [...p, newIngredient()])
  const removeIng = (uid: string) => setIngredients((p) => p.filter((i) => i.uid !== uid))

  const submit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const validIngredients = ingredients.filter((i) => i.food_id > 0 && i.gramos > 0)
      const t = totals(validIngredients)
      const portions_n = Math.max(1, Number(porciones) || 1)
      await nutritionService.createRecipe({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        preparacion: preparacion.trim() || undefined,
        porciones: portions_n,
        proteina: Math.round(t.p / portions_n * 10) / 10,
        grasa: Math.round(t.g / portions_n * 10) / 10,
        carbohidratos: Math.round(t.ch / portions_n * 10) / 10,
        calorias: Math.round(t.kcal / portions_n),
        ingredientes_json: JSON.stringify(validIngredients.map((i) => ({
          food_id: i.food_id, nombre: i.nombre, gramos: i.gramos,
        }))),
      })
      onSaved()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos crear la receta.')
      setSubmitting(false)
    }
  }

  const t = totals(ingredients.filter((i) => i.food_id > 0 && i.gramos > 0))

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet adm-sheet" role="dialog" aria-label="Crear receta">
        <div className="sheet-handle" />
        <div className="adm-sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="adm-sheet-name">
              Nueva receta · Paso {step}/3
            </div>
            <div className="adm-sheet-meta">
              {step === 1 ? 'Datos básicos' : step === 2 ? 'Ingredientes' : 'Revisar y guardar'}
            </div>
          </div>
          <button type="button" className="adm-sheet-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                flex: 1, height: 3, borderRadius: 2,
                background: step >= s ? 'var(--nutri)' : 'var(--line)',
              }}
            />
          ))}
        </div>

        {step === 1 && (
          <>
            <div className="adm-field">
              <label className="adm-field-label">Nombre</label>
              <input
                type="text"
                className="adm-input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoFocus
                placeholder="Ej: Pollo con arroz integral"
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Descripción (opcional)</label>
              <input
                type="text"
                className="adm-input"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve descripción"
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Porciones que rinde</label>
              <input
                type="number"
                min={1}
                step={1}
                className="adm-input"
                value={porciones}
                onChange={(e) => setPorciones(e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-field-label">Preparación (opcional)</label>
              <textarea
                rows={4}
                className="adm-input"
                value={preparacion}
                onChange={(e) => setPreparacion(e.target.value)}
                placeholder="Paso a paso"
              />
            </div>
            <button
              type="button"
              className="btn btn-primary btn-full adm-submit"
              onClick={() => setStep(2)}
              disabled={!canNext1}
            >
              Continuar <Icon name="chevR" size={14} />
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="mono" style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 4px' }}>
              Buscá cada alimento del catálogo. Las macros se calculan automáticamente.
            </p>
            {ingredients.map((ing) => (
              <IngredientRow
                key={ing.uid}
                ingredient={ing}
                onChange={(patch) => updateIng(ing.uid, patch)}
                onRemove={() => removeIng(ing.uid)}
                canRemove={ingredients.length > 1}
              />
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-full"
              onClick={addIng}
            >
              <Icon name="plus" size={14} /> Agregar ingrediente
            </button>

            <div className="card" style={{ padding: 10, marginTop: 8 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>
                TOTAL DE LA RECETA
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
                <span><b>{Math.round(t.kcal)}</b> kcal</span>
                <span>P <b>{t.p.toFixed(1)}</b>g</span>
                <span>G <b>{t.g.toFixed(1)}</b>g</span>
                <span>CH <b>{t.ch.toFixed(1)}</b>g</span>
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6 }}>
                Por porción ({porciones}): <b>{Math.round(t.kcal / Math.max(1, Number(porciones)))}</b> kcal
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>
                <Icon name="chevL" size={14} /> Atrás
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep(3)}
                disabled={!canNext2}
                style={{ flex: 2 }}
              >
                Revisar <Icon name="chevR" size={14} />
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="card" style={{ padding: 12 }}>
              <div className="adm-sheet-name">{nombre}</div>
              {descripcion && (
                <div className="adm-sheet-meta">{descripcion}</div>
              )}
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', margin: '10px 0 4px' }}>
                INGREDIENTES
              </div>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13 }}>
                {ingredients.filter((i) => i.food_id > 0).map((i) => (
                  <li key={i.uid}>
                    {i.gramos}g de {i.nombre}
                  </li>
                ))}
              </ul>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', margin: '10px 0 4px' }}>
                MACROS POR PORCIÓN
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 14 }}>
                <span><b>{Math.round(t.kcal / Math.max(1, Number(porciones)))}</b> kcal</span>
                <span>P <b>{(t.p / Math.max(1, Number(porciones))).toFixed(1)}</b>g</span>
                <span>G <b>{(t.g / Math.max(1, Number(porciones))).toFixed(1)}</b>g</span>
                <span>CH <b>{(t.ch / Math.max(1, Number(porciones))).toFixed(1)}</b>g</span>
              </div>
            </div>

            {error && <div className="adm-error">{error}</div>}

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(2)} style={{ flex: 1 }}>
                <Icon name="chevL" size={14} /> Editar
              </button>
              <button
                type="button"
                className="btn btn-primary adm-submit"
                onClick={submit}
                disabled={submitting}
                style={{ flex: 2 }}
              >
                <Icon name="check" size={14} />
                {submitting ? ' Guardando…' : ' Guardar receta'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function IngredientRow({
  ingredient,
  onChange,
  onRemove,
  canRemove,
}: {
  ingredient: Ingredient
  onChange: (patch: Partial<Ingredient>) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const [query, setQuery] = useState(ingredient.nombre)
  const [suggestions, setSuggestions] = useState<Food[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query || query.length < 2 || query === ingredient.nombre) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await nutritionService.listFoods({ q: query, per_page: 6 })
        setSuggestions(res.data)
      } catch {
        setSuggestions([])
      }
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, ingredient.nombre])

  const pick = (f: Food) => {
    onChange({
      food_id: f.ID,
      nombre: f.Largadescripcion,
      p_per_100: f.P,
      g_per_100: f.G,
      ch_per_100: f.CH,
    })
    setQuery(f.Largadescripcion)
    setOpen(false)
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 4 }}>
      <div style={{ position: 'relative', marginBottom: 6 }}>
        <input
          type="text"
          className="adm-input"
          placeholder="Buscar alimento…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); onChange({ nombre: e.target.value, food_id: 0 }) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--bg-2)', border: '1px solid var(--line-strong)',
              borderRadius: 8, marginTop: 4, maxHeight: 200, overflowY: 'auto',
              zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            {suggestions.map((f) => (
              <button
                key={f.ID}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(f)}
                style={{
                  width: '100%', background: 'transparent', border: 0,
                  borderTop: '1px solid var(--line)', padding: '8px 10px',
                  textAlign: 'left', color: 'var(--text-1)', cursor: 'pointer', fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 500 }}>{f.Largadescripcion}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  P {f.P} · G {f.G} · CH {f.CH} (/100g)
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }}>
        <div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--text-3)', marginBottom: 2 }}>GRAMOS</div>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={5}
            value={ingredient.gramos || ''}
            onChange={(e) => onChange({ gramos: Number(e.target.value) })}
            className="adm-input"
            style={{ padding: '6px 8px', fontSize: 13 }}
          />
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ alignSelf: 'end', padding: '6px 8px', fontSize: 11 }}
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Quitar ingrediente"
        >
          <Icon name="x" size={12} />
        </button>
      </div>
    </div>
  )
}
