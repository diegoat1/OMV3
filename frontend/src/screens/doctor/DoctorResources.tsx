import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { RecipeWizardSheet } from '../../components/RecipeWizardSheet'
import { nutritionService } from '../../services/nutritionService'
import { ApiError } from '../../services/apiClient'
import type {
  Food,
  FoodGroup,
  MealKey,
  MealPlanBlock,
  MealPlanLibraryItem,
  Recipe,
} from '../../types/api'

const MEAL_LABEL: Record<MealKey, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media mañana',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  media_tarde: 'Media tarde',
  cena: 'Cena',
}

type TabKey = 'recipes' | 'blocks' | 'library' | 'catalog'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'recipes', label: 'Recetas', icon: 'nutrition' },
  { key: 'blocks', label: 'Bloques', icon: 'data' },
  { key: 'library', label: 'Biblioteca', icon: 'film' },
  { key: 'catalog', label: 'Alimentos', icon: 'apple' },
]

export function DoctorResources() {
  const [tab, setTab] = useState<TabKey>('recipes')

  return (
    <div className="dp-screen" data-mod="nutrition">
      <div className="ah-title-block">
        <div className="module-pill">Nutrición</div>
        <div className="display ah-title">
          <em>Recursos</em>
        </div>
        <div className="ah-subtitle">Catálogo, recetas, bloques y biblioteca</div>
      </div>

      <div className="dp-filters">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={'chip dp-chip' + (tab === t.key ? ' is-active' : '')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'recipes' && <RecipesTab />}
      {tab === 'blocks' && <BlocksTab />}
      {tab === 'library' && <LibraryTab />}
      {tab === 'catalog' && <CatalogTab />}
    </div>
  )
}

/* ───────────────── Recipes ───────────────── */

function RecipesTab() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [actingId, setActingId] = useState<number | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await nutritionService.listRecipes({ q: q.trim() || undefined })
      setRecipes(res.recipes)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando recetas')
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => {
    const id = setTimeout(reload, 250)
    return () => clearTimeout(id)
  }, [reload])

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta receta?')) return
    setActingId(id)
    try {
      await nutritionService.deleteRecipe(id)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos eliminar')
    } finally {
      setActingId(null)
    }
  }

  const handleRecalc = async (id: number) => {
    setActingId(id)
    try {
      await nutritionService.calculateRecipe(id)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos recalcular')
    } finally {
      setActingId(null)
    }
  }

  return (
    <>
      <div className="dp-search">
        <span className="dp-search-icon"><Icon name="search" size={18} /></span>
        <input
          type="search"
          className="dp-search-input"
          placeholder="Buscar receta…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <button
        type="button"
        className="btn btn-primary btn-full"
        onClick={() => setWizardOpen(true)}
        style={{ marginBottom: 10 }}
      >
        <Icon name="plus" size={14} /> Nueva receta (wizard)
      </button>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Recetas</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>
            {loading ? '…' : `${recipes.length}`}
          </div>
        </div>
        {!loading && recipes.length === 0 && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              Sin recetas todavía.
            </p>
          </div>
        )}
        {recipes.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {recipes.map((r, i) => (
              <div
                key={r.id}
                style={{
                  borderTop: i === 0 ? 0 : '1px solid var(--line)',
                  padding: '12px 14px',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ph-link-name">{r.nombre}</div>
                  {r.descripcion && (
                    <div className="ph-link-meta">{r.descripcion}</div>
                  )}
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                    {r.calorias != null ? `${Math.round(r.calorias)} kcal · ` : ''}
                    P {r.proteina ?? '—'} · G {r.grasa ?? '—'} · CH {r.carbohidratos ?? '—'}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 11 }}
                  onClick={() => handleRecalc(r.id)}
                  disabled={actingId === r.id}
                >
                  Recalcular
                </button>
                <button
                  type="button"
                  className="btn btn-ghost dp-action-danger"
                  style={{ padding: '4px 8px', fontSize: 11 }}
                  onClick={() => handleDelete(r.id)}
                  disabled={actingId === r.id}
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {wizardOpen && (
        <RecipeWizardSheet
          onClose={() => setWizardOpen(false)}
          onSaved={() => { setWizardOpen(false); reload() }}
        />
      )}
    </>
  )
}

/* ───────────────── Meal-plan blocks ───────────────── */

function BlocksTab() {
  const [blocks, setBlocks] = useState<MealPlanBlock[]>([])
  const [suggestions, setSuggestions] = useState<MealPlanBlock[]>([])
  const [mealKey, setMealKey] = useState<MealKey>('almuerzo')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favActingId, setFavActingId] = useState<number | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [allRes, sugRes] = await Promise.all([
        nutritionService.listBlocks({ meal_key: mealKey }).catch(() => ({ blocks: [], total: 0 })),
        nutritionService.blockSuggestions({ meal_key: mealKey }).catch(() => ({ blocks: [], total: 0 })),
      ])
      setBlocks(allRes.blocks)
      setSuggestions(sugRes.blocks)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando bloques')
    } finally {
      setLoading(false)
    }
  }, [mealKey])

  useEffect(() => { reload() }, [reload])

  const handleFav = async (block: MealPlanBlock) => {
    setFavActingId(block.id)
    try {
      await nutritionService.saveFavoriteBlock({
        nombre: block.nombre,
        meal_key: mealKey,
        size: block.size,
        alimentos: block.alimentos_json ? JSON.parse(block.alimentos_json) : [],
      })
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos guardar el favorito')
    } finally {
      setFavActingId(null)
    }
  }

  return (
    <>
      <div className="dp-filters">
        {(Object.keys(MEAL_LABEL) as MealKey[]).map((mk) => (
          <button
            key={mk}
            type="button"
            className={'chip dp-chip' + (mealKey === mk ? ' is-active' : '')}
            onClick={() => setMealKey(mk)}
          >
            {MEAL_LABEL[mk]}
          </button>
        ))}
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="ph-section">
        <div className="section-label">Sugeridos</div>
        {!loading && suggestions.length === 0 && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Sin sugerencias.</p>
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {suggestions.slice(0, 5).map((b, i) => (
              <BlockRow
                key={`s-${b.id}`}
                block={b}
                first={i === 0}
                onFav={() => handleFav(b)}
                favLoading={favActingId === b.id}
              />
            ))}
          </div>
        )}
      </div>

      <div className="ph-section">
        <div className="section-label">Todos los bloques</div>
        {loading && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Cargando…</p>
          </div>
        )}
        {!loading && blocks.length === 0 && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              Sin bloques registrados para esta comida.
            </p>
          </div>
        )}
        {blocks.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {blocks.map((b, i) => (
              <BlockRow
                key={b.id}
                block={b}
                first={i === 0}
                onFav={() => handleFav(b)}
                favLoading={favActingId === b.id}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function BlockRow({
  block,
  first,
  onFav,
  favLoading,
}: {
  block: MealPlanBlock
  first: boolean
  onFav: () => void
  favLoading: boolean
}) {
  return (
    <div
      style={{
        borderTop: first ? 0 : '1px solid var(--line)',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ph-link-name">{block.nombre}</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
          {block.size ? `${block.size} · ` : ''}
          {block.calorias != null ? `${Math.round(block.calorias)} kcal` : '—'}
        </div>
      </div>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ padding: '4px 8px', fontSize: 11 }}
        onClick={onFav}
        disabled={favLoading}
      >
        <Icon name="heart" size={12} /> Favorito
      </button>
    </div>
  )
}

/* ───────────────── Library ───────────────── */

function LibraryTab() {
  const [items, setItems] = useState<MealPlanLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [onlyFav, setOnlyFav] = useState(false)
  const [actingId, setActingId] = useState<number | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await nutritionService.library({ only_favorites: onlyFav ? 1 : 0 })
      setItems(res.presets)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando biblioteca')
    } finally {
      setLoading(false)
    }
  }, [onlyFav])

  useEffect(() => { reload() }, [reload])

  const handleToggleFav = async (item: MealPlanLibraryItem) => {
    setActingId(item.id)
    try {
      await nutritionService.toggleLibraryFavorite(item.id, !item.is_favorite)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos actualizar el favorito')
    } finally {
      setActingId(null)
    }
  }

  return (
    <>
      <div className="dp-filters">
        <button
          type="button"
          className={'chip dp-chip' + (!onlyFav ? ' is-active' : '')}
          onClick={() => setOnlyFav(false)}
        >Todos</button>
        <button
          type="button"
          className={'chip dp-chip' + (onlyFav ? ' is-active' : '')}
          onClick={() => setOnlyFav(true)}
        >Favoritos</button>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="ph-section">
        {loading && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Cargando…</p>
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              Sin presets en la biblioteca.
            </p>
          </div>
        )}
        {items.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {items.map((p, i) => (
              <div
                key={p.id}
                style={{
                  borderTop: i === 0 ? 0 : '1px solid var(--line)',
                  padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ph-link-name">{p.nombre}</div>
                  {p.descripcion && (
                    <div className="ph-link-meta">{p.descripcion}</div>
                  )}
                  {p.calorias != null && (
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                      {Math.round(p.calorias)} kcal
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 11, color: p.is_favorite ? 'var(--warn)' : 'var(--text-3)' }}
                  onClick={() => handleToggleFav(p)}
                  disabled={actingId === p.id}
                >
                  <Icon name="heart" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/* ───────────────── Food catalog ───────────────── */

function CatalogTab() {
  const [foods, setFoods] = useState<Food[]>([])
  const [groups, setGroups] = useState<FoodGroup[]>([])
  const [groupId, setGroupId] = useState<number | undefined>(undefined)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editor, setEditor] = useState<{ kind: 'new' } | { kind: 'edit'; food: Food } | null>(null)
  const [actingId, setActingId] = useState<number | null>(null)

  // Load groups once
  useEffect(() => {
    nutritionService.listFoodGroups()
      .then((r) => setGroups(r.groups))
      .catch(() => setGroups([]))
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await nutritionService.listFoods({
        q: q.trim() || undefined,
        page,
        per_page: 25,
        group_id: groupId,
      })
      setFoods(res.data)
      setTotal(res.pagination.total)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando alimentos')
    } finally {
      setLoading(false)
    }
  }, [q, page, groupId])

  useEffect(() => {
    const id = setTimeout(reload, 250)
    return () => clearTimeout(id)
  }, [reload])

  const handleDelete = async (food: Food) => {
    if (!confirm(`¿Eliminar "${food.Largadescripcion}" del catálogo?`)) return
    setActingId(food.ID)
    try {
      await nutritionService.deleteFood(food.ID)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos eliminar')
    } finally {
      setActingId(null)
    }
  }

  return (
    <>
      <div className="dp-search">
        <span className="dp-search-icon"><Icon name="search" size={18} /></span>
        <input
          type="search"
          className="dp-search-input"
          placeholder="Buscar alimento…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
        />
      </div>

      <button
        type="button"
        className="btn btn-primary btn-full"
        onClick={() => setEditor({ kind: 'new' })}
        style={{ marginBottom: 10 }}
      >
        <Icon name="plus" size={14} /> Nuevo alimento
      </button>

      {groups.length > 0 && (
        <div className="dp-filters">
          <button
            type="button"
            className={'chip dp-chip' + (groupId === undefined ? ' is-active' : '')}
            onClick={() => { setGroupId(undefined); setPage(1) }}
          >Todos</button>
          {groups.slice(0, 10).map((g) => (
            <button
              key={g.id}
              type="button"
              className={'chip dp-chip' + (groupId === g.id ? ' is-active' : '')}
              onClick={() => { setGroupId(g.id); setPage(1) }}
            >
              {g.nombre}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Catálogo</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>
            {loading ? '…' : `${total} alimentos`}
          </div>
        </div>
        {!loading && foods.length === 0 && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              Sin alimentos para este filtro.
            </p>
          </div>
        )}
        {foods.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {foods.map((f, i) => (
              <div
                key={f.ID}
                style={{
                  borderTop: i === 0 ? 0 : '1px solid var(--line)',
                  padding: '8px 14px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ph-link-name" style={{ fontSize: 13 }}>{f.Largadescripcion}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    P {f.P} · G {f.G} · CH {f.CH} · F {f.F} /100g
                    {f.Gramo1 != null && f.Medidacasera1 != null && ` · ${f.Gramo1}g ${String(f.Medidacasera1)}`}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 11 }}
                  onClick={() => setEditor({ kind: 'edit', food: f })}
                  disabled={actingId === f.ID}
                  aria-label="Editar"
                >
                  <Icon name="edit" size={12} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 11, color: 'var(--omega)' }}
                  onClick={() => handleDelete(f)}
                  disabled={actingId === f.ID}
                  aria-label="Eliminar"
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {foods.length > 0 && (
          <div className="row-between" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            ><Icon name="chevL" size={14} /> Ant</button>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
              Pág {page} · {total} totales
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || foods.length < 25}
            >Sig <Icon name="chevR" size={14} /></button>
          </div>
        )}
      </div>

      {editor && (
        <FoodEditorSheet
          initial={editor.kind === 'edit' ? editor.food : null}
          onClose={() => setEditor(null)}
          onSaved={() => { setEditor(null); reload() }}
        />
      )}
    </>
  )
}

/** Create/edit a food row. Wraps `nutritionService.createFood` / `updateFood`. */
function FoodEditorSheet({
  initial,
  onClose,
  onSaved,
}: {
  initial: Food | null
  onClose: () => void
  onSaved: () => void
}) {
  const [nombre, setNombre] = useState(initial?.Largadescripcion ?? '')
  const [P, setP] = useState<number>(initial?.P ?? 0)
  const [G, setG] = useState<number>(initial?.G ?? 0)
  const [CH, setCH] = useState<number>(initial?.CH ?? 0)
  const [F, setF] = useState<number>(initial?.F ?? 0)
  const [gramo1, setGramo1] = useState<number>(Number(initial?.Gramo1 ?? 0))
  const [medida1, setMedida1] = useState<string>(String(initial?.Medidacasera1 ?? ''))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        Largadescripcion: nombre.trim(),
        P, G, CH, F,
        Gramo1: gramo1,
        Medidacasera1: medida1 ? Number(medida1) : 0,
      }
      if (initial) await nutritionService.updateFood(initial.ID, payload)
      else await nutritionService.createFood(payload)
      onSaved()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos guardar el alimento.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet adm-sheet" role="dialog" aria-label={initial ? 'Editar alimento' : 'Nuevo alimento'}>
        <div className="sheet-handle" />
        <div className="adm-sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="adm-sheet-name">{initial ? 'Editar alimento' : 'Nuevo alimento'}</div>
            <div className="adm-sheet-meta">Valores por cada 100g.</div>
          </div>
          <button type="button" className="adm-sheet-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="adm-field">
          <label className="adm-field-label">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="adm-input"
            autoFocus
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div className="adm-field"><label className="adm-field-label">Proteína (g)</label>
            <input type="number" step={0.1} value={P} onChange={(e) => setP(Number(e.target.value))} className="adm-input" />
          </div>
          <div className="adm-field"><label className="adm-field-label">Grasa (g)</label>
            <input type="number" step={0.1} value={G} onChange={(e) => setG(Number(e.target.value))} className="adm-input" />
          </div>
          <div className="adm-field"><label className="adm-field-label">Carbohidratos (g)</label>
            <input type="number" step={0.1} value={CH} onChange={(e) => setCH(Number(e.target.value))} className="adm-input" />
          </div>
          <div className="adm-field"><label className="adm-field-label">Fibra (g)</label>
            <input type="number" step={0.1} value={F} onChange={(e) => setF(Number(e.target.value))} className="adm-input" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div className="adm-field"><label className="adm-field-label">Medida casera (g)</label>
            <input type="number" step={1} value={gramo1} onChange={(e) => setGramo1(Number(e.target.value))} className="adm-input" />
          </div>
          <div className="adm-field"><label className="adm-field-label">Descripción medida</label>
            <input type="text" value={medida1} onChange={(e) => setMedida1(e.target.value)} className="adm-input" placeholder="1 unidad" />
          </div>
        </div>

        {error && <div className="adm-error">{error}</div>}

        <button
          type="button"
          className="btn btn-primary btn-full adm-submit"
          onClick={submit}
          disabled={submitting}
        >
          <Icon name="check" size={14} />
          {submitting ? ' Guardando…' : initial ? ' Actualizar' : ' Crear'}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-full"
          onClick={onClose}
          disabled={submitting}
          style={{ marginTop: 8 }}
        >
          Cancelar
        </button>
      </div>
    </>
  )
}
