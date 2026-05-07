import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { nutritionService } from '../../services/nutritionService'
import { ApiError } from '../../services/apiClient'
import type {
  AutoCalculateResponse,
  ComidaConfig,
  EntrenoIntensidad,
  MealKey,
  MealSize,
  NutritionPlan,
  OpcionVelocidad,
  ParametrosMacros,
  SaveConfigPayload,
  SolveMealAlimento,
  SolveMealResponse,
  UpdatePlanMacrosPayload,
} from '../../types/api'

interface Props {
  patientId: number
  patientName: string
}

const MEAL_LABEL: Record<MealKey, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media Mañana',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  media_tarde: 'Media Tarde',
  cena: 'Cena',
}
const MEAL_ORDER: MealKey[] = ['desayuno', 'media_manana', 'almuerzo', 'merienda', 'media_tarde', 'cena']

const SIZE_LABEL: Record<MealSize, string> = {
  extra_small: 'XS',
  small: 'S',
  medium: 'M',
  large: 'L',
  extra_large: 'XL',
}
const SIZE_ORDER: MealSize[] = ['extra_small', 'small', 'medium', 'large', 'extra_large']

const INTENSITY_LABEL: Record<EntrenoIntensidad, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
}

const PARAMETROS_DEFAULT: Required<ParametrosMacros> = {
  proteina_g_per_kg_lm: 2.513244,
  grasa_pct_kcal_min: 0.30,
  grasa_g_per_kg_min: 0.6,
}

// ─────────────────────────────────────────────────────────────────────────────

export function PatientNutritionPlan({ patientId: _patientId, patientName }: Props) {
  const [plan, setPlan] = useState<NutritionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const [showAutoCalc, setShowAutoCalc] = useState(false)
  const [showMacrosEdit, setShowMacrosEdit] = useState(false)
  const [showMealsConfig, setShowMealsConfig] = useState(false)
  const [solverFor, setSolverFor] = useState<MealKey | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await nutritionService.listPlans(patientName)
      setPlan(r.plans[0] ?? null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando plan')
    } finally {
      setLoading(false)
    }
  }, [patientName])

  useEffect(() => { reload() }, [reload])

  const handleAccepted = (newPlanId: number) => {
    setShowAutoCalc(false)
    setInfo(`Plan #${newPlanId} creado. Ajustá la distribución por comida abajo.`)
    reload()
  }

  const handleMacrosSaved = () => {
    setShowMacrosEdit(false)
    setInfo('Macros actualizados.')
    reload()
  }

  const handleConfigSaved = () => {
    setShowMealsConfig(false)
    setInfo('Distribución por comida guardada.')
    reload()
  }

  return (
    <div>
      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)', marginBottom: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}
      {info && (
        <div className="card" style={{ borderColor: 'rgba(46,184,124,0.3)', marginBottom: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--ok)', margin: 0 }}>{info}</p>
        </div>
      )}

      {loading && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Cargando plan…</p>
        </div>
      )}

      {!loading && !plan && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 12px' }}>
            Sin plan nutricional asignado. Calculalo a partir de las mediciones y el objetivo activos.
          </p>
          <button
            type="button"
            className="btn btn-full"
            onClick={() => setShowAutoCalc(true)}
            style={{ background: 'var(--nutri)', color: '#0a1a0a', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Icon name="target" size={14} /> Auto-calcular plan
          </button>
        </div>
      )}

      {!loading && plan && (
        <>
          <div className="ph-section">
            <div className="row-between" style={{ marginBottom: 10 }}>
              <div className="section-label">Macros diarios</div>
              <button
                type="button"
                className="dpd-edit-btn"
                onClick={() => setShowMacrosEdit(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
              >
                <Icon name="edit" size={12} /> Editar
              </button>
            </div>
            <div className="card">
              <MacrosSummary plan={plan} />
              <p className="mono" style={{ fontSize: 11, color: 'var(--text-3)', margin: '8px 0 0' }}>
                Plan #{plan.id} · libertad {plan.libertad ?? 5}%
                {plan.factor_actividad ? ` · FA ${plan.factor_actividad}` : ''}
              </p>
              <button
                type="button"
                className="btn btn-full"
                onClick={() => setShowAutoCalc(true)}
                style={{ marginTop: 10, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Icon name="target" size={12} /> Recalcular automáticamente
              </button>
            </div>
          </div>

          <div className="ph-section">
            <div className="row-between" style={{ marginBottom: 10 }}>
              <div className="section-label">Distribución por comida</div>
              <button
                type="button"
                className="dpd-edit-btn"
                onClick={() => setShowMealsConfig(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
              >
                <Icon name="edit" size={12} /> Configurar
              </button>
            </div>
            <MealRows plan={plan} onSolve={(mk) => setSolverFor(mk)} />
          </div>
        </>
      )}

      {showAutoCalc && (
        <AutoCalculateSheet
          patientName={patientName}
          onClose={() => setShowAutoCalc(false)}
          onAccepted={handleAccepted}
        />
      )}
      {showMacrosEdit && plan && (
        <MacrosEditSheet
          plan={plan}
          onClose={() => setShowMacrosEdit(false)}
          onSaved={handleMacrosSaved}
        />
      )}
      {showMealsConfig && plan && (
        <MealsConfigSheet
          plan={plan}
          patientName={patientName}
          onClose={() => setShowMealsConfig(false)}
          onSaved={handleConfigSaved}
        />
      )}
      {solverFor && (
        <SolveMealSheet
          mealKey={solverFor}
          onClose={() => setSolverFor(null)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function MacrosSummary({ plan }: { plan: NutritionPlan }) {
  const items = [
    { k: 'kcal', v: plan.calorias, c: 'var(--nutri)' },
    { k: 'P', v: plan.proteina, c: '#E8A93A', u: 'g' },
    { k: 'G', v: plan.grasa, c: '#F16B57', u: 'g' },
    { k: 'C', v: plan.carbohidratos, c: '#F2D35F', u: 'g' },
  ]
  return (
    <div className="dpd-latest-grid">
      {items.map((it) => (
        <div key={it.k}>
          <div className="dpd-stat-k">{it.k}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 500, color: it.c }}>
              {it.v != null ? Math.round(it.v) : '—'}
            </span>
            {it.u && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{it.u}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function MealRows({ plan, onSolve }: { plan: NutritionPlan; onSolve: (mk: MealKey) => void }) {
  const P = plan.proteina ?? 0
  const G = plan.grasa ?? 0
  const C = plan.carbohidratos ?? 0
  const cells: Record<MealKey, { p: number; g: number; c: number }> = {
    desayuno: { p: plan.desayuno_p ?? 0, g: plan.desayuno_g ?? 0, c: plan.desayuno_c ?? 0 },
    media_manana: { p: plan.media_man_p ?? 0, g: plan.media_man_g ?? 0, c: plan.media_man_c ?? 0 },
    almuerzo: { p: plan.almuerzo_p ?? 0, g: plan.almuerzo_g ?? 0, c: plan.almuerzo_c ?? 0 },
    merienda: { p: plan.merienda_p ?? 0, g: plan.merienda_g ?? 0, c: plan.merienda_c ?? 0 },
    media_tarde: { p: plan.media_tar_p ?? 0, g: plan.media_tar_g ?? 0, c: plan.media_tar_c ?? 0 },
    cena: { p: plan.cena_p ?? 0, g: plan.cena_g ?? 0, c: plan.cena_c ?? 0 },
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {MEAL_ORDER.map((mk) => {
        const f = cells[mk]
        const p = P * f.p
        const g = G * f.g
        const c = C * f.c
        const kcal = Math.round(p * 4 + g * 9 + c * 4)
        const enabled = kcal > 0
        return (
          <div key={mk} className="card" style={{ opacity: enabled ? 1 : 0.5 }}>
            <div className="row-between">
              <div>
                <div className="nu-meal-name">{MEAL_LABEL[mk]}</div>
                <div className="nu-meal-macros">
                  <span style={{ color: 'var(--nutri)' }}>{kcal} kcal</span>
                  {' · '}{Math.round(p)} P · {Math.round(c)} C · {Math.round(g)} G
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSolve(mk)}
                disabled={!enabled}
                className="btn"
                style={{ fontSize: 12, padding: '6px 10px' }}
              >
                <Icon name="target" size={12} /> Resolver
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-calculate sheet — Fix 18 — OMV-46, OMV-47
// ─────────────────────────────────────────────────────────────────────────────

interface AutoCalcProps {
  patientName: string
  onClose: () => void
  onAccepted: (planId: number) => void
}

function AutoCalculateSheet({ patientName, onClose, onAccepted }: AutoCalcProps) {
  const [factorActividad, setFactorActividad] = useState(1.55)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [params, setParams] = useState<Required<ParametrosMacros>>(PARAMETROS_DEFAULT)
  const [calculating, setCalculating] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [result, setResult] = useState<AutoCalculateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const calculate = async () => {
    setCalculating(true)
    setError(null)
    try {
      const isCustom = JSON.stringify(params) !== JSON.stringify(PARAMETROS_DEFAULT)
      const r = await nutritionService.autoCalculate({
        nombre_apellido: patientName,
        factor_actividad: factorActividad,
        parametros_macros: isCustom ? params : undefined,
      })
      setResult(r)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error calculando')
    } finally {
      setCalculating(false)
    }
  }

  const accept = async (opcion: OpcionVelocidad) => {
    setAccepting(true)
    setError(null)
    try {
      const r = await nutritionService.acceptAutoCalculate({
        nombre_apellido: patientName,
        opcion,
        factor_actividad: factorActividad,
        parametros_macros: result?.parametros_macros_usados,
      })
      onAccepted(r.plan_id)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error persistiendo plan')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <SheetWrapper title="Auto-calcular plan" onClose={onClose}>
      {!result && (
        <>
          <Field label="Factor de actividad">
            <input
              type="number"
              step={0.05}
              min={1}
              max={2.5}
              value={factorActividad}
              onChange={(e) => setFactorActividad(Number(e.target.value))}
              className="adm-input"
            />
          </Field>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ background: 'transparent', border: 0, color: 'var(--text-2)', fontSize: 12, padding: '8px 0', cursor: 'pointer', textAlign: 'left' }}
          >
            {showAdvanced ? '− Ocultar' : '+ Parámetros avanzados'}
          </button>

          {showAdvanced && (
            <>
              <Field label="Proteína (g/kg masa magra)">
                <input
                  type="number"
                  step={0.01}
                  value={params.proteina_g_per_kg_lm}
                  onChange={(e) => setParams({ ...params, proteina_g_per_kg_lm: Number(e.target.value) })}
                  className="adm-input"
                />
              </Field>
              <Field label="Grasa mín (% kcal)">
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  max={1}
                  value={params.grasa_pct_kcal_min}
                  onChange={(e) => setParams({ ...params, grasa_pct_kcal_min: Number(e.target.value) })}
                  className="adm-input"
                />
              </Field>
              <Field label="Grasa mín (g/kg peso)">
                <input
                  type="number"
                  step={0.05}
                  value={params.grasa_g_per_kg_min}
                  onChange={(e) => setParams({ ...params, grasa_g_per_kg_min: Number(e.target.value) })}
                  className="adm-input"
                />
              </Field>
            </>
          )}

          <button
            type="button"
            className="btn btn-full"
            onClick={calculate}
            disabled={calculating}
            style={{ marginTop: 12, background: 'var(--nutri)', color: '#0a1a0a', fontWeight: 600 }}
          >
            {calculating ? 'Calculando…' : 'Calcular opciones'}
          </button>
        </>
      )}

      {result && (
        <>
          <p className="mono" style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 10px' }}>
            TDEE {result.tdee_mantenimiento} kcal · {result.tipo_objetivo} · {result.opciones_velocidad.length} opciones
          </p>
          {result.opciones_velocidad.map((o) => (
            <div key={o.nombre} className="card" style={{ marginBottom: 8 }}>
              <div className="row-between" style={{ marginBottom: 4 }}>
                <strong style={{ fontSize: 14 }}>{o.nombre}</strong>
                <span className="mono" style={{ color: 'var(--text-3)', fontSize: 11 }}>
                  {o.porcentaje_peso}/sem
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 6px' }}>{o.descripcion}</p>
              <div className="dpd-latest-grid">
                <Cell k="kcal" v={o.calorias} c="var(--nutri)" />
                <Cell k="P" v={o.macros.proteina_g} u="g" c="#E8A93A" />
                <Cell k="G" v={o.macros.grasa_g} u="g" c="#F16B57" />
                <Cell k="C" v={o.macros.carbohidratos_g} u="g" c="#F2D35F" />
              </div>
              <p className="mono" style={{ fontSize: 11, color: 'var(--text-3)', margin: '6px 0 8px' }}>
                EA {o.disponibilidad_energetica.ea_valor} ({o.disponibilidad_energetica.ea_status})
                {o.semanas_estimadas > 0 ? ` · ~${o.semanas_estimadas} semanas` : ''}
              </p>
              <button
                type="button"
                className="btn btn-full"
                onClick={() => accept(o)}
                disabled={accepting}
                style={{ background: 'var(--nutri)', color: '#0a1a0a', fontWeight: 600, fontSize: 12 }}
              >
                {accepting ? 'Guardando…' : `Aceptar ${o.nombre}`}
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setResult(null)}
            style={{ background: 'transparent', border: 0, color: 'var(--text-2)', fontSize: 12, padding: '8px 0', cursor: 'pointer' }}
          >
            ← Recalcular con otros parámetros
          </button>
        </>
      )}

      {error && (
        <p style={{ fontSize: 12, color: 'var(--omega)', margin: '8px 0 0' }}>{error}</p>
      )}
    </SheetWrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Macros edit sheet — PUT /plans/<id>/macros
// ─────────────────────────────────────────────────────────────────────────────

function MacrosEditSheet({ plan, onClose, onSaved }: { plan: NutritionPlan; onClose: () => void; onSaved: () => void }) {
  const [calorias, setCalorias] = useState(plan.calorias ?? 0)
  const [proteina, setProteina] = useState(plan.proteina ?? 0)
  const [grasa, setGrasa] = useState(plan.grasa ?? 0)
  const [ch, setCh] = useState(plan.carbohidratos ?? 0)
  const [factor, setFactor] = useState(plan.factor_actividad ?? 1.55)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload: UpdatePlanMacrosPayload = {
        calorias,
        proteina,
        grasa,
        ch,
        factor_actividad: factor,
      }
      await nutritionService.updatePlanMacros(plan.id, payload)
      onSaved()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error guardando macros')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SheetWrapper title="Editar macros" onClose={onClose}>
      <Field label="Calorías"><input type="number" value={calorias} onChange={(e) => setCalorias(Number(e.target.value))} className="adm-input" /></Field>
      <Field label="Proteína (g)"><input type="number" value={proteina} onChange={(e) => setProteina(Number(e.target.value))} className="adm-input" /></Field>
      <Field label="Grasa (g)"><input type="number" value={grasa} onChange={(e) => setGrasa(Number(e.target.value))} className="adm-input" /></Field>
      <Field label="Carbohidratos (g)"><input type="number" value={ch} onChange={(e) => setCh(Number(e.target.value))} className="adm-input" /></Field>
      <Field label="Factor de actividad"><input type="number" step={0.05} value={factor} onChange={(e) => setFactor(Number(e.target.value))} className="adm-input" /></Field>
      <button
        type="button"
        className="btn btn-full"
        onClick={save}
        disabled={saving}
        style={{ marginTop: 12, background: 'var(--nutri)', color: '#0a1a0a', fontWeight: 600 }}
      >
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
      {error && <p style={{ fontSize: 12, color: 'var(--omega)', margin: '8px 0 0' }}>{error}</p>}
    </SheetWrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Meals config sheet — POST /meal-plans/save-config (Fix 18 — OMV-48,49,50)
// ─────────────────────────────────────────────────────────────────────────────

interface MealsConfigSheetProps {
  plan: NutritionPlan
  patientName: string
  onClose: () => void
  onSaved: () => void
}

function parseComidasConfig(plan: NutritionPlan): Record<MealKey, ComidaConfig> {
  // Prefer the persisted JSON snapshot from save-config.
  if (plan.comidas_config_json) {
    try {
      const parsed = JSON.parse(plan.comidas_config_json) as Record<string, ComidaConfig>
      const result = {} as Record<MealKey, ComidaConfig>
      for (const k of MEAL_ORDER) {
        result[k] = parsed[k] ?? { enabled: false, size: 'medium' }
      }
      return result
    } catch {
      /* fall through to derived state */
    }
  }
  // Fall back: derive enabled from per-meal % distribution.
  const cells: Record<MealKey, [number | null, number | null, number | null]> = {
    desayuno: [plan.desayuno_p, plan.desayuno_g, plan.desayuno_c],
    media_manana: [plan.media_man_p, plan.media_man_g, plan.media_man_c],
    almuerzo: [plan.almuerzo_p, plan.almuerzo_g, plan.almuerzo_c],
    merienda: [plan.merienda_p, plan.merienda_g, plan.merienda_c],
    media_tarde: [plan.media_tar_p, plan.media_tar_g, plan.media_tar_c],
    cena: [plan.cena_p, plan.cena_g, plan.cena_c],
  }
  const result = {} as Record<MealKey, ComidaConfig>
  for (const k of MEAL_ORDER) {
    const [p, g, c] = cells[k]
    const sum = (p ?? 0) + (g ?? 0) + (c ?? 0)
    result[k] = { enabled: sum > 0, size: 'medium' }
  }
  return result
}

function parseEntrenoMealKeys(plan: NutritionPlan): MealKey[] {
  if (plan.entreno_meal_keys_json) {
    try {
      const arr = JSON.parse(plan.entreno_meal_keys_json) as MealKey[]
      if (Array.isArray(arr)) return arr
    } catch { /* ignore */ }
  }
  return plan.entreno_meal_key ? [plan.entreno_meal_key] : []
}

function MealsConfigSheet({ plan, patientName, onClose, onSaved }: MealsConfigSheetProps) {
  const [comidas, setComidas] = useState<Record<MealKey, ComidaConfig>>(() => parseComidasConfig(plan))
  const [entrenoMeals, setEntrenoMeals] = useState<MealKey[]>(() => parseEntrenoMealKeys(plan))
  const [intensidad, setIntensidad] = useState<EntrenoIntensidad>(plan.entreno_intensidad ?? 'media')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleEnabled = (k: MealKey) => {
    setComidas((prev) => ({ ...prev, [k]: { ...prev[k], enabled: !prev[k].enabled } }))
  }
  const setSize = (k: MealKey, size: MealSize) => {
    setComidas((prev) => ({ ...prev, [k]: { ...prev[k], size } }))
  }
  const toggleEntreno = (k: MealKey) => {
    setEntrenoMeals((prev) => prev.includes(k) ? prev.filter((m) => m !== k) : [...prev, k])
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload: SaveConfigPayload = {
        comidas,
        entreno_meal_keys: entrenoMeals,
        entreno_intensidad: intensidad,
        plan_id: plan.id,
        nombre_apellido: patientName,
      }
      await nutritionService.saveConfig(payload)
      onSaved()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error guardando configuración')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SheetWrapper title="Configurar comidas" onClose={onClose}>
      <p className="mono" style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 10px' }}>
        Habilitá las comidas, elegí el tamaño relativo y marcá las cercanas a entreno para mover carbos.
      </p>
      {MEAL_ORDER.map((k) => {
        const c = comidas[k]
        return (
          <div key={k} className="card" style={{ marginBottom: 6 }}>
            <div className="row-between" style={{ marginBottom: c.enabled ? 8 : 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={c.enabled}
                  onChange={() => toggleEnabled(k)}
                />
                <span style={{ fontSize: 14 }}>{MEAL_LABEL[k]}</span>
              </label>
              {c.enabled && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={entrenoMeals.includes(k)}
                    onChange={() => toggleEntreno(k)}
                  />
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)' }}>entreno</span>
                </label>
              )}
            </div>
            {c.enabled && (
              <div style={{ display: 'flex', gap: 4 }}>
                {SIZE_ORDER.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(k, s)}
                    className="btn"
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      fontSize: 11,
                      background: c.size === s ? 'var(--nutri)' : 'transparent',
                      color: c.size === s ? '#0a1a0a' : 'var(--text-2)',
                      fontWeight: c.size === s ? 600 : 400,
                    }}
                  >
                    {SIZE_LABEL[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {entrenoMeals.length > 0 && (
        <div className="card" style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Intensidad de entreno</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['baja', 'media', 'alta'] as const).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIntensidad(i)}
                className="btn"
                style={{
                  flex: 1,
                  padding: '6px 0',
                  fontSize: 12,
                  background: intensidad === i ? 'var(--nutri)' : 'transparent',
                  color: intensidad === i ? '#0a1a0a' : 'var(--text-2)',
                  fontWeight: intensidad === i ? 600 : 400,
                }}
              >
                {INTENSITY_LABEL[i]}
              </button>
            ))}
          </div>
          <p className="mono" style={{ fontSize: 11, color: 'var(--text-3)', margin: '6px 0 0' }}>
            baja=1.5×, media=2×, alta=3× sobre carbos del entreno.
          </p>
        </div>
      )}

      <button
        type="button"
        className="btn btn-full"
        onClick={save}
        disabled={saving}
        style={{ marginTop: 12, background: 'var(--nutri)', color: '#0a1a0a', fontWeight: 600 }}
      >
        {saving ? 'Guardando…' : 'Guardar configuración'}
      </button>
      {error && <p style={{ fontSize: 12, color: 'var(--omega)', margin: '8px 0 0' }}>{error}</p>}
    </SheetWrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Solve-meal sheet — POST /solve-meal (Fix 18 — OMV-52)
// ─────────────────────────────────────────────────────────────────────────────

interface SolveMealSheetProps { mealKey: MealKey; onClose: () => void }

interface AlimentoRow extends SolveMealAlimento {
  uid: string
}

const newRow = (): AlimentoRow => ({
  uid: Math.random().toString(36).slice(2, 9),
  id: Math.random().toString(36).slice(2, 9),
  nombre: '',
  proteina_100g: 0,
  grasa_100g: 0,
  carbohidratos_100g: 0,
  medida_casera_g: 100,
  medida_desc: 'porción',
})

function SolveMealSheet({ mealKey, onClose }: SolveMealSheetProps) {
  const [rows, setRows] = useState<AlimentoRow[]>([newRow(), newRow()])
  const [libertad, setLibertad] = useState(5)
  const [solving, setSolving] = useState(false)
  const [result, setResult] = useState<SolveMealResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addRow = () => setRows((prev) => [...prev, newRow()])
  const removeRow = (uid: string) => setRows((prev) => prev.filter((r) => r.uid !== uid))
  const updateRow = (uid: string, patch: Partial<AlimentoRow>) => {
    setRows((prev) => prev.map((r) => r.uid === uid ? { ...r, ...patch } : r))
  }

  const solve = async () => {
    const valid = rows
      .filter((r) => r.nombre.trim().length > 0)
      .map(({ uid: _uid, ...rest }) => rest as SolveMealAlimento)
    if (valid.length === 0) {
      setError('Agregá al menos un alimento con nombre.')
      return
    }
    setSolving(true)
    setError(null)
    try {
      const r = await nutritionService.solveMeal({
        meal_key: mealKey,
        libertad,
        alimentos: valid,
      })
      setResult(r)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error resolviendo')
    } finally {
      setSolving(false)
    }
  }

  return (
    <SheetWrapper title={`Resolver — ${MEAL_LABEL[mealKey]}`} onClose={onClose}>
      <p className="mono" style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 10px' }}>
        El solver toma los macros de esta comida del plan activo y reparte gramos entre los alimentos.
      </p>

      {!result && (
        <>
          {rows.map((r) => (
            <div key={r.uid} className="card" style={{ marginBottom: 6, padding: 10 }}>
              <input
                type="text"
                placeholder="Nombre del alimento"
                value={r.nombre}
                onChange={(e) => updateRow(r.uid, { nombre: e.target.value })}
                className="adm-input"
                style={{ marginBottom: 6 }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                <FieldSmall label="P/100g">
                  <input type="number" step={0.1} value={r.proteina_100g} onChange={(e) => updateRow(r.uid, { proteina_100g: Number(e.target.value) })} className="adm-input" />
                </FieldSmall>
                <FieldSmall label="G/100g">
                  <input type="number" step={0.1} value={r.grasa_100g} onChange={(e) => updateRow(r.uid, { grasa_100g: Number(e.target.value) })} className="adm-input" />
                </FieldSmall>
                <FieldSmall label="C/100g">
                  <input type="number" step={0.1} value={r.carbohidratos_100g} onChange={(e) => updateRow(r.uid, { carbohidratos_100g: Number(e.target.value) })} className="adm-input" />
                </FieldSmall>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 4, marginTop: 4 }}>
                <FieldSmall label="Medida (g)">
                  <input type="number" value={r.medida_casera_g ?? 100} onChange={(e) => updateRow(r.uid, { medida_casera_g: Number(e.target.value) })} className="adm-input" />
                </FieldSmall>
                <FieldSmall label="Descripción">
                  <input type="text" value={r.medida_desc ?? ''} onChange={(e) => updateRow(r.uid, { medida_desc: e.target.value })} className="adm-input" />
                </FieldSmall>
                <button
                  type="button"
                  onClick={() => removeRow(r.uid)}
                  disabled={rows.length <= 1}
                  className="btn"
                  style={{ alignSelf: 'end', padding: '6px 8px', fontSize: 11 }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            className="btn btn-full"
            style={{ fontSize: 12, marginBottom: 8 }}
          >
            + Agregar alimento
          </button>

          <Field label={`Libertad (${libertad}%)`}>
            <input
              type="range"
              min={0}
              max={25}
              value={libertad}
              onChange={(e) => setLibertad(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </Field>

          <button
            type="button"
            className="btn btn-full"
            onClick={solve}
            disabled={solving}
            style={{ marginTop: 8, background: 'var(--nutri)', color: '#0a1a0a', fontWeight: 600 }}
          >
            {solving ? 'Resolviendo…' : 'Resolver'}
          </button>
        </>
      )}

      {result && (
        <>
          {result.alimentos && result.alimentos.length > 0 ? (
            result.alimentos.map((a, i) => (
              <div key={i} className="card" style={{ marginBottom: 6 }}>
                <div className="row-between">
                  <strong style={{ fontSize: 13 }}>{a.nombre}</strong>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--nutri)' }}>
                    {a.total_gramos != null ? `${Math.round(a.total_gramos)} g` : ''}
                    {a.porciones != null ? ` (${a.porciones.toFixed(2)} ${a.medida_desc ?? 'porc'})` : ''}
                  </span>
                </div>
                {(a.proteina_g != null || a.grasa_g != null || a.carbohidratos_g != null) && (
                  <p className="mono" style={{ fontSize: 11, color: 'var(--text-3)', margin: '4px 0 0' }}>
                    {a.proteina_g?.toFixed(1)} P · {a.carbohidratos_g?.toFixed(1)} C · {a.grasa_g?.toFixed(1)} G
                    {a.calorias != null ? ` · ${Math.round(a.calorias)} kcal` : ''}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
              {result.mensaje || 'El solver no devolvió alimentos.'}
            </p>
          )}
          {result.totales && (
            <div className="card" style={{ marginTop: 6 }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
                Totales{result.calorias_totales != null ? ` · ${Math.round(result.calorias_totales)} kcal` : ''}
              </div>
              <div className="dpd-latest-grid">
                <Cell k="P" v={result.totales.proteina_g} u="g" c="#E8A93A" />
                <Cell k="G" v={result.totales.grasa_g} u="g" c="#F16B57" />
                <Cell k="C" v={result.totales.carbohidratos_g} u="g" c="#F2D35F" />
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setResult(null)}
            style={{ background: 'transparent', border: 0, color: 'var(--text-2)', fontSize: 12, padding: '8px 0', cursor: 'pointer' }}
          >
            ← Volver a editar alimentos
          </button>
        </>
      )}
      {error && <p style={{ fontSize: 12, color: 'var(--omega)', margin: '8px 0 0' }}>{error}</p>}
    </SheetWrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared layout primitives
// ─────────────────────────────────────────────────────────────────────────────

function SheetWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet adm-sheet" role="dialog">
        <div className="sheet-handle" />
        <div className="adm-sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="adm-sheet-name">{title}</div>
          </div>
          <button type="button" className="adm-sheet-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>
        {children}
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="adm-field">
      <label className="adm-field-label">{label}</label>
      {children}
    </div>
  )
}

function FieldSmall({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="adm-field" style={{ marginBottom: 0 }}>
      <label className="adm-field-label" style={{ fontSize: 10 }}>{label}</label>
      {children}
    </div>
  )
}

function Cell({ k, v, u, c }: { k: string; v: number | null; u?: string; c: string }) {
  return (
    <div>
      <div className="dpd-stat-k">{k}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: c }}>
          {v != null ? Math.round(v) : '—'}
        </span>
        {u && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{u}</span>}
      </div>
    </div>
  )
}
