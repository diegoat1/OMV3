# Nutrition Shared Editor Implementation Plan (v2 — Corrected)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix backend so plans always have valid per-meal distribution, create shared meal editing logic (hook + utils), integrate into both doctor and patient screens, and add meal config UI + solve-meal to doctor screen.

**Architecture:** Backend fix ensures no NULL distribution columns. Shared `mealCalculations.ts` provides pure functions with a meal-key mapping layer (frontend `media_manana` ↔ backend `media_man`). Shared `useMealEditor` hook manages meal state with mode-dependent persistence (doctor=optimistic/template, patient=debounced/daily-log). Both screens keep their existing JSX but delegate state to the hook.

**Tech Stack:** Python/Flask (backend), TypeScript/React Native (frontend), React Query, PuLP solver (backend)

**Key corrections from review:**
1. `useEffect` for initialization (not `useMemo`)
2. Single meal-key mapping layer for frontend↔backend naming
3. `save-config` uses `{comidas: {key: {enabled, size}}, entreno}` — confirmed
4. `solve-meal` returns `{success: true, data: {status: "Optimal"}}` — not `"success"`
5. `MealState.recipes` is `Array<{id, name?}>` — supports multiple per meal
6. `saveAsProposal` = daily_log(completed:false) — only for dated proposals
7. Patient auto-save uses 800ms debounce
8. `buildMealPlanPayload` limitation noted for food-only meals

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/api/v3/nutrition/routes.py` | Modify | Default distribution on POST /plans, fallback in GET /blocks, validation in POST /solve-meal |
| `omega-medicina-app/src/utils/mealCalculations.ts` | Create | Pure functions: types, meal-key mapping, recalc, totals, payload builders, converters |
| `omega-medicina-app/src/utils/__tests__/mealCalculations.test.ts` | Create | Unit tests for all pure functions |
| `omega-medicina-app/src/hooks/useMealEditor.ts` | Create | Shared hook: state, CRUD, solver, debounced save by mode |
| `omega-medicina-app/app/(doctor)/patient-nutrition.tsx` | Modify | Wire useMealEditor, add MealConfigPanel section, add solve-meal buttons |
| `omega-medicina-app/app/(patient)/nutrition/index.tsx` | Modify | Wire useMealEditor, replace inline meal logic |

---

### Task 1: Backend — Default meal distribution on plan creation

**Files:**
- Modify: `src/api/v3/nutrition/routes.py:124-194`

- [ ] **Step 1: Replace the INSERT in `create_plan()` to include all 18 distribution columns**

Current INSERT (lines 162-167) omits distribution columns. Replace the full function body with:

```python
@nutrition_bp.route('/plans', methods=['POST'])
@require_auth
def create_plan():
    user = get_current_user()
    data = request.get_json() or {}

    nombre_apellido = data.get('nombre_apellido', user.get('nombre_apellido', ''))
    patient = resolve_patient_id(nombre_apellido)
    if not patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    calorias = float(data.get('calorias', 2000))
    proteina = float(data.get('proteina', 150))
    grasa = float(data.get('grasa', 60))
    ch = float(data.get('ch', data.get('carbohidratos', 200)))
    factor_actividad = float(data.get('factor_actividad', 1.55))
    velocidad_cambio = float(data.get('velocidad_cambio', 0))
    deficit_calorico = float(data.get('deficit_calorico', 0))
    disponibilidad_energetica = data.get('disponibilidad_energetica')
    libertad = int(data.get('libertad', 5))

    # Default 4-meal equitable distribution (media_man and media_tar disabled)
    default_pct = {
        'desayuno': 0.25, 'media_man': 0.0, 'almuerzo': 0.30,
        'merienda': 0.20, 'media_tar': 0.0, 'cena': 0.25,
    }
    dist = {}
    for meal in ['desayuno', 'media_man', 'almuerzo', 'merienda', 'media_tar', 'cena']:
        pct = default_pct.get(meal, 0)
        for macro in ['p', 'g', 'c']:
            key = f'{meal}_{macro}'
            dist[key] = float(data.get(key, pct))

    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO nutrition_plans
            (patient_id, calorias, proteina, grasa, carbohidratos,
             desayuno_p, desayuno_g, desayuno_c,
             media_man_p, media_man_g, media_man_c,
             almuerzo_p, almuerzo_g, almuerzo_c,
             merienda_p, merienda_g, merienda_c,
             media_tar_p, media_tar_g, media_tar_c,
             cena_p, cena_g, cena_c,
             libertad, factor_actividad, velocidad_cambio,
             deficit_calorico, disponibilidad_energetica, created_at)
            VALUES (?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        """, [
            patient['patient_id'], calorias, proteina, grasa, ch,
            dist['desayuno_p'], dist['desayuno_g'], dist['desayuno_c'],
            dist['media_man_p'], dist['media_man_g'], dist['media_man_c'],
            dist['almuerzo_p'], dist['almuerzo_g'], dist['almuerzo_c'],
            dist['merienda_p'], dist['merienda_g'], dist['merienda_c'],
            dist['media_tar_p'], dist['media_tar_g'], dist['media_tar_c'],
            dist['cena_p'], dist['cena_g'], dist['cena_c'],
            libertad, factor_actividad, velocidad_cambio,
            deficit_calorico, disponibilidad_energetica,
        ])
        plan_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return success_response({
            'id': plan_id,
            'calorias': calorias, 'proteina': proteina,
            'grasa': grasa, 'carbohidratos': ch,
        }, message='Plan creado exitosamente')
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)
```

- [ ] **Step 2: Test manually**

```bash
sqlite3 src/db/clinical.db "SELECT desayuno_p, almuerzo_p, merienda_p, cena_p FROM nutrition_plans ORDER BY id DESC LIMIT 1"
```
Expected: `0.25|0.3|0.2|0.25` (not NULL)

- [ ] **Step 3: Commit**

```bash
git add src/api/v3/nutrition/routes.py
git commit -m "fix: add default meal distribution when creating nutrition plan"
```

---

### Task 2: Backend — Fallback in GET /blocks + validation in POST /solve-meal

**Files:**
- Modify: `src/api/v3/nutrition/routes.py` (~lines 1570 and ~1020)

- [ ] **Step 1: Add fallback in GET /meal-plans/blocks after the for-loop (around line 1570)**

```python
        # After the for loop building comidas dict:
        if not comidas:
            default_pcts = {
                'desayuno': 0.25, 'almuerzo': 0.30,
                'merienda': 0.20, 'cena': 0.25,
            }
            for name, pct in default_pcts.items():
                comidas[name] = {
                    'porcentajes': {'proteina': pct, 'grasa': pct, 'carbohidratos': pct},
                    'gramos': {
                        'proteina': round(proteina_total * pct, 1),
                        'grasa': round(grasa_total * pct, 1),
                        'carbohidratos': round(ch_total * pct, 1),
                    },
                }
```

- [ ] **Step 2: Add validation in POST /solve-meal after meal_key target resolution (~line 1020)**

After the line `objetivo = { 'proteina': ..., 'grasa': ..., 'carbohidratos': ... }`, add:

```python
                    # Validate non-zero targets
                    if objetivo['proteina'] == 0 and objetivo['grasa'] == 0 and objetivo['carbohidratos'] == 0:
                        conn_cl.close()
                        return error_response(
                            f'No hay targets definidos para {meal_key}. Configure la distribucion de comidas primero.',
                            code=ErrorCodes.VALIDATION_ERROR,
                            status_code=400
                        )
```

- [ ] **Step 3: Test manually**

```bash
# Test blocks fallback
curl http://localhost:8000/api/v3/nutrition/meal-plans/blocks -H "Authorization: Bearer <token>"
# Expected: comidas dict always non-empty

# Test solve-meal validation for disabled meal
curl -X POST http://localhost:8000/api/v3/nutrition/solve-meal \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"meal_key": "media_manana", "alimentos": [{"id":"1","nombre":"Pollo","proteina_100g":21,"grasa_100g":3,"carbohidratos_100g":0,"medida_casera_g":100}]}'
# Expected: 400 with "No hay targets definidos para media_manana"
```

- [ ] **Step 4: Commit**

```bash
git add src/api/v3/nutrition/routes.py
git commit -m "fix: add fallback in GET /blocks and validation in POST /solve-meal"
```

---

### Task 3: Create mealCalculations.ts — Types, mapping, and pure functions

**Files:**
- Create: `omega-medicina-app/src/utils/mealCalculations.ts`
- Create: `omega-medicina-app/src/utils/__tests__/mealCalculations.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// omega-medicina-app/src/utils/__tests__/mealCalculations.test.ts
import {
  MealFood,
  MealState,
  recalcFoodMacros,
  sumFoodMacros,
  fromLoggedFood,
  fromPlanningFood,
  buildSolveMealPayload,
  applySolveResult,
  buildDailyLogPayload,
  calculateMealScore,
  MEAL_ORDER,
  MEAL_LABELS,
  MEAL_EMOJIS,
  MEAL_KEY_TO_DB,
  dbKeyToFrontend,
} from '../mealCalculations';

const chicken: MealFood = {
  id: '42', name: 'Pechuga de pollo', quantity_g: 200,
  medida_casera_g: 100, unit: 'gramo',
  protein_100g: 21, fat_100g: 3, carbs_100g: 0,
  protein: 42, fat: 6, carbs: 0, calories: 216,
};

const rice: MealFood = {
  id: '88', name: 'Arroz blanco', quantity_g: 150,
  medida_casera_g: 60, unit: 'taza',
  protein_100g: 2.7, fat_100g: 0.3, carbs_100g: 28.2,
  protein: 4.1, fat: 0.5, carbs: 42.3, calories: 190,
};

describe('mealCalculations', () => {
  describe('MEAL_KEY_TO_DB mapping', () => {
    it('maps frontend keys to backend abbreviated keys', () => {
      expect(MEAL_KEY_TO_DB.media_manana).toBe('media_man');
      expect(MEAL_KEY_TO_DB.media_tarde).toBe('media_tar');
      expect(MEAL_KEY_TO_DB.desayuno).toBe('desayuno');
    });

    it('dbKeyToFrontend reverses the mapping', () => {
      expect(dbKeyToFrontend('media_man')).toBe('media_manana');
      expect(dbKeyToFrontend('media_tar')).toBe('media_tarde');
      expect(dbKeyToFrontend('almuerzo')).toBe('almuerzo');
    });
  });

  describe('recalcFoodMacros', () => {
    it('recalculates macros from new quantity', () => {
      const result = recalcFoodMacros(chicken, 300);
      expect(result.quantity_g).toBe(300);
      expect(result.protein).toBeCloseTo(63, 0);
      expect(result.fat).toBeCloseTo(9, 0);
      expect(result.carbs).toBe(0);
      expect(result.calories).toBeCloseTo(324, -1);
    });

    it('handles zero quantity', () => {
      const result = recalcFoodMacros(chicken, 0);
      expect(result.protein).toBe(0);
      expect(result.calories).toBe(0);
    });
  });

  describe('sumFoodMacros', () => {
    it('sums all foods by default', () => {
      const result = sumFoodMacros([chicken, rice]);
      expect(result.protein).toBeCloseTo(46.1, 0);
    });

    it('skips uneaten foods when onlyEaten=true', () => {
      const result = sumFoodMacros([chicken, { ...rice, eaten: false }], true);
      expect(result.protein).toBeCloseTo(42, 0);
      expect(result.carbs).toBe(0);
    });
  });

  describe('fromLoggedFood', () => {
    it('converts LoggedFood format to MealFood', () => {
      const result = fromLoggedFood({
        id: '42', name: 'Pollo', quantity_g: 200, unit: 'gramo',
        medida_casera_g: 100, calories: 216, protein: 42, fat: 6, carbs: 0,
        protein_100g: 21, fat_100g: 3, carbs_100g: 0, eaten: true,
      });
      expect(result.id).toBe('42');
      expect(result.protein_100g).toBe(21);
      expect(result.eaten).toBe(true);
    });
  });

  describe('fromPlanningFood', () => {
    it('converts PlanningFood format to MealFood', () => {
      const result = fromPlanningFood({
        nombre: 'Pollo', total_gramos: 200, porciones: 2, medida_casera_g: 100,
        medida_desc: 'porcion', proteina_g: 42, grasa_g: 6, carbohidratos_g: 0,
        calorias: 216, proteina_100g: 21, grasa_100g: 3, carbohidratos_100g: 0,
        locked: true, recipeSource: 'Receta1',
      });
      expect(result.name).toBe('Pollo');
      expect(result.locked).toBe(true);
    });
  });

  describe('buildSolveMealPayload', () => {
    it('builds payload with alimentos and meal_key', () => {
      const meal: MealState = {
        meal_key: 'almuerzo', foods: [chicken, rice],
        target_p: 55, target_g: 14, target_c: 70,
      };
      const result = buildSolveMealPayload(meal, 10);
      expect(result.meal_key).toBe('almuerzo');
      expect(result.libertad).toBe(10);
      expect(result.alimentos).toHaveLength(2);
    });

    it('separates recipe foods into recetas array', () => {
      const recipeFood = { ...chicken, id: 'r_5_pollo' };
      const meal: MealState = {
        meal_key: 'almuerzo', foods: [recipeFood, rice],
        target_p: 55, target_g: 14, target_c: 70,
        recipes: [{ id: 5, name: 'Pollo con arroz' }],
      };
      const result = buildSolveMealPayload(meal, 10);
      expect(result.alimentos).toHaveLength(1);
      expect(result.recetas).toEqual([{ recipe_id: 5 }]);
    });
  });

  describe('applySolveResult', () => {
    it('handles Optimal response format', () => {
      const meal: MealState = {
        meal_key: 'almuerzo', foods: [chicken],
        target_p: 55, target_g: 14, target_c: 70,
      };
      const solveData = {
        status: 'Optimal',
        alimentos: [{
          id: '42', nombre: 'Pechuga de pollo',
          total_gramos: 260, proteina_g: 54.6, grasa_g: 7.8,
          carbohidratos_g: 0, calorias: 286,
        }],
      };
      const result = applySolveResult(meal, solveData);
      expect(result.foods).toHaveLength(1);
      expect(result.foods[0].quantity_g).toBe(260);
      expect(result.foods[0].protein).toBeCloseTo(54.6, 0);
    });
  });

  describe('calculateMealScore', () => {
    it('returns 100 for perfect match', () => {
      expect(calculateMealScore({ p: 50, g: 20, c: 70 }, { p: 50, g: 20, c: 70 })).toBe(100);
    });
    it('returns 50 for half match', () => {
      expect(calculateMealScore({ p: 25, g: 10, c: 35 }, { p: 50, g: 20, c: 70 })).toBe(50);
    });
    it('caps at 100 for excess', () => {
      expect(calculateMealScore({ p: 100, g: 40, c: 140 }, { p: 50, g: 20, c: 70 })).toBe(100);
    });
  });

  describe('constants', () => {
    it('MEAL_ORDER has 6 meals', () => {
      expect(MEAL_ORDER).toHaveLength(6);
    });
    it('all keys in MEAL_LABELS', () => {
      for (const key of MEAL_ORDER) expect(MEAL_LABELS[key]).toBeDefined();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd omega-medicina-app && npx jest src/utils/__tests__/mealCalculations.test.ts --no-cache
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement mealCalculations.ts**

```typescript
// omega-medicina-app/src/utils/mealCalculations.ts

// ── Constants ──────────────────────────────────────────────

export const MEAL_ORDER = ['desayuno', 'media_manana', 'almuerzo', 'merienda', 'media_tarde', 'cena'] as const;
export type MealKey = (typeof MEAL_ORDER)[number];

export const MEAL_LABELS: Record<string, string> = {
  desayuno: 'Desayuno', media_manana: 'Media Mañana', almuerzo: 'Almuerzo',
  merienda: 'Merienda', media_tarde: 'Media Tarde', cena: 'Cena',
};

export const MEAL_EMOJIS: Record<string, string> = {
  desayuno: '🌅', media_manana: '🍎', almuerzo: '🍽️',
  merienda: '🥤', media_tarde: '🫐', cena: '🌙',
};

// ── Meal Key Mapping (frontend ↔ backend) ──────────────────
// Frontend uses full names; backend SQL uses abbreviated column prefixes.

export const MEAL_KEY_TO_DB: Record<string, string> = {
  desayuno: 'desayuno',
  media_manana: 'media_man',
  almuerzo: 'almuerzo',
  merienda: 'merienda',
  media_tarde: 'media_tar',
  cena: 'cena',
};

const DB_KEY_TO_FRONTEND: Record<string, string> = {};
for (const [fe, db] of Object.entries(MEAL_KEY_TO_DB)) {
  DB_KEY_TO_FRONTEND[db] = fe;
}

/** Convert a backend key (media_man) to frontend key (media_manana). Passthrough if no mapping. */
export function dbKeyToFrontend(dbKey: string): string {
  return DB_KEY_TO_FRONTEND[dbKey] || dbKey;
}

/** Convert a frontend key (media_manana) to backend key (media_man). Passthrough if no mapping. */
export function frontendKeyToDb(feKey: string): string {
  return MEAL_KEY_TO_DB[feKey] || feKey;
}

// ── Types ──────────────────────────────────────────────────

export interface MealFood {
  id: string;
  name: string;
  quantity_g: number;
  medida_casera_g?: number;
  unit?: string;
  protein_100g: number;
  fat_100g: number;
  carbs_100g: number;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
  eaten?: boolean;
  locked?: boolean;
  recipeSource?: string;
}

export interface MealState {
  meal_key: string;
  foods: MealFood[];
  target_p: number;
  target_g: number;
  target_c: number;
  completed?: boolean;
  recipes?: Array<{ id: number; name?: string }>;
}

export interface MealTargets {
  [mealKey: string]: { proteina: number; grasa: number; carbohidratos: number };
}

export interface MacroTotals {
  protein: number; fat: number; carbs: number; calories: number;
}

// ── Helpers ────────────────────────────────────────────────

const rd = (n: number, d = 1): number => Math.round(n * (10 ** d)) / (10 ** d);

// ── Pure Functions ─────────────────────────────────────────

export function recalcFoodMacros(food: MealFood, newQuantityG: number): MealFood {
  const q = newQuantityG;
  return {
    ...food,
    quantity_g: q,
    protein: rd(q * food.protein_100g / 100),
    fat: rd(q * food.fat_100g / 100),
    carbs: rd(q * food.carbs_100g / 100),
    calories: Math.round(q * (food.protein_100g * 4 + food.carbs_100g * 4 + food.fat_100g * 9) / 100),
  };
}

export function sumFoodMacros(foods: MealFood[], onlyEaten?: boolean): MacroTotals {
  let protein = 0, fat = 0, carbs = 0, calories = 0;
  for (const f of foods) {
    if (onlyEaten && f.eaten === false) continue;
    protein += f.protein; fat += f.fat; carbs += f.carbs; calories += f.calories;
  }
  return { protein: rd(protein), fat: rd(fat), carbs: rd(carbs), calories: Math.round(calories) };
}

export function fromLoggedFood(food: any): MealFood {
  const q = food.quantity_g || 100;
  return {
    id: String(food.id), name: food.name || '', quantity_g: q,
    medida_casera_g: food.medida_casera_g, unit: food.unit,
    protein_100g: food.protein_100g ?? (q > 0 ? rd(food.protein * 100 / q) : 0),
    fat_100g: food.fat_100g ?? (q > 0 ? rd(food.fat * 100 / q) : 0),
    carbs_100g: food.carbs_100g ?? (q > 0 ? rd(food.carbs * 100 / q) : 0),
    protein: food.protein || 0, fat: food.fat || 0,
    carbs: food.carbs || 0, calories: food.calories || 0,
    eaten: food.eaten,
  };
}

export function fromPlanningFood(food: any): MealFood {
  return {
    id: food.id || `pf_${food.nombre}`, name: food.nombre || '',
    quantity_g: food.total_gramos || 0, medida_casera_g: food.medida_casera_g,
    unit: food.medida_desc,
    protein_100g: food.proteina_100g || 0, fat_100g: food.grasa_100g || 0,
    carbs_100g: food.carbohidratos_100g || 0,
    protein: food.proteina_g || 0, fat: food.grasa_g || 0,
    carbs: food.carbohidratos_g || 0, calories: food.calorias || 0,
    locked: food.locked, recipeSource: food.recipeSource,
  };
}

export function buildSolveMealPayload(meal: MealState, libertad: number) {
  const alimentos: any[] = [];
  const recipeIds: number[] = (meal.recipes || []).map(r => r.id);

  for (const f of meal.foods) {
    // Recipe foods (prefixed r_) are solved server-side via recipe_id
    if (f.id.startsWith('r_')) continue;
    alimentos.push({
      id: f.id, nombre: f.name,
      proteina_100g: f.protein_100g, grasa_100g: f.fat_100g,
      carbohidratos_100g: f.carbs_100g,
      medida_casera_g: f.medida_casera_g || f.quantity_g || 100,
      medida_desc: f.unit || 'porción',
    });
  }

  return {
    meal_key: meal.meal_key,
    libertad,
    alimentos,
    recetas: recipeIds.map(id => ({ recipe_id: id })),
  };
}

/**
 * Applies solver result to meal. Handles the real backend response shape:
 * { status: "Optimal", alimentos: [{id, nombre, total_gramos, proteina_g, grasa_g, carbohidratos_g, calorias}] }
 */
export function applySolveResult(meal: MealState, solveData: any): MealState {
  if (!solveData?.alimentos?.length) return meal;

  const originalMap = new Map(meal.foods.map(f => [f.id, f]));
  const newFoods: MealFood[] = solveData.alimentos.map((a: any) => {
    const orig = originalMap.get(String(a.id));
    const qty = a.total_gramos || a.cantidad_g || 100;
    return {
      id: String(a.id), name: a.nombre || 'Sin nombre', quantity_g: qty,
      unit: orig?.unit || a.medida_desc || undefined,
      medida_casera_g: orig?.medida_casera_g || a.medida_casera_g || qty,
      protein_100g: orig?.protein_100g ?? (qty > 0 ? rd(a.proteina_g * 100 / qty) : 0),
      fat_100g: orig?.fat_100g ?? (qty > 0 ? rd(a.grasa_g * 100 / qty) : 0),
      carbs_100g: orig?.carbs_100g ?? (qty > 0 ? rd(a.carbohidratos_g * 100 / qty) : 0),
      protein: a.proteina_g || 0, fat: a.grasa_g || 0,
      carbs: a.carbohidratos_g || 0, calories: a.calorias || 0,
      eaten: orig?.eaten ?? false,
      locked: orig?.locked, recipeSource: orig?.recipeSource,
    };
  });
  return { ...meal, foods: newFoods };
}

export function buildDailyLogPayload(meals: MealState[], onlyEaten = false) {
  return meals.filter(m => m.foods.length > 0).map(m => {
    const t = sumFoodMacros(m.foods, onlyEaten);
    return {
      meal_key: m.meal_key,
      recipe_id: m.recipes?.[0]?.id ?? null,
      recipe_name: m.recipes?.[0]?.name ?? null,
      foods_json: m.foods,
      completed: m.completed ?? false,
      total_p: t.protein, total_g: t.fat, total_c: t.carbs, total_cal: t.calories,
      target_p: m.target_p, target_g: m.target_g, target_c: m.target_c,
    };
  });
}

/**
 * Builds meal_plans payload from current meals.
 * NOTE: Only includes meals with recipes. Food-only meals are not persisted as templates.
 * This is a known limitation — food-only meal templates require a different data model.
 */
export function buildMealPlanPayload(meals: MealState[]) {
  const comidas: Record<string, number[]> = {};
  for (const m of meals) {
    const ids = (m.recipes || []).map(r => r.id);
    if (ids.length > 0) comidas[m.meal_key] = ids;
  }
  return { plan_json: { comidas } };
}

export function calculateMealScore(
  actuals: { p: number; g: number; c: number },
  targets: { p: number; g: number; c: number },
): number {
  const cov = (actual: number, target: number) =>
    target > 0 ? Math.min(actual / target, 1) * 100 : 100;
  return Math.round(cov(actuals.p, targets.p) * 0.4 + cov(actuals.g, targets.g) * 0.3 + cov(actuals.c, targets.c) * 0.3);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd omega-medicina-app && npx jest src/utils/__tests__/mealCalculations.test.ts --no-cache
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
cd omega-medicina-app && git add src/utils/mealCalculations.ts src/utils/__tests__/mealCalculations.test.ts
git commit -m "feat: add shared mealCalculations with types, key mapping, and pure functions"
```

---

### Task 4: Create useMealEditor hook

**Files:**
- Create: `omega-medicina-app/src/hooks/useMealEditor.ts`

- [ ] **Step 1: Implement the hook**

```typescript
// omega-medicina-app/src/hooks/useMealEditor.ts
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionService } from '../services/api';
import {
  MealFood, MealState, MealTargets, MacroTotals, MEAL_ORDER,
  recalcFoodMacros, sumFoodMacros, fromLoggedFood,
  buildSolveMealPayload, applySolveResult,
  buildDailyLogPayload, buildMealPlanPayload,
} from '../utils/mealCalculations';

export interface MealConfigInput {
  comidas: Record<string, { enabled: boolean; size: string }>;
  entreno: string | null;
}

export interface UseMealEditorOptions {
  mode: 'doctor' | 'patient';
  patientName?: string;
  initialDate?: string;
}

const DEBOUNCE_MS = 800;

export function useMealEditor({ mode, patientName, initialDate }: UseMealEditorOptions) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(initialDate || today);
  const [meals, setMeals] = useState<MealState[]>([]);
  const [solving, setSolving] = useState<Record<string, boolean>>({});
  const [initialized, setInitialized] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Targets from getMealBlocks ──────────────────────────
  const blocksQuery = useQuery({
    queryKey: ['mealBlocks', mode, patientName],
    queryFn: () => nutritionService.getMealBlocks(),
    select: (res: any) => {
      const d = res?.data || res;
      return d?.blocks || d;
    },
    staleTime: 5 * 60 * 1000,
  });

  const blocksData = blocksQuery.data;
  const libertad = blocksData?.libertad || 5;

  const mealTargets: MealTargets = useMemo(() => {
    const comidas = blocksData?.comidas || {};
    const targets: MealTargets = {};
    for (const key of MEAL_ORDER) {
      const g = comidas[key]?.gramos;
      if (g) targets[key] = g;
    }
    return targets;
  }, [blocksData]);

  const enabledMeals: Record<string, boolean> = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const key of MEAL_ORDER) result[key] = !!mealTargets[key];
    return result;
  }, [mealTargets]);

  // ── Load existing daily log ─────────────────────────────
  const logQuery = useQuery({
    queryKey: ['dailyLog', date, patientName],
    queryFn: () =>
      mode === 'doctor' && patientName
        ? nutritionService.getDailyLogForPatient(patientName, date)
        : nutritionService.getDailyLog(date),
    select: (res: any) => res?.data || res,
  });

  // ── Initialize meals from blocks + log (useEffect, NOT useMemo) ──
  useEffect(() => {
    if (!blocksData) return;
    const logMeals = logQuery.data?.meals || [];
    const bc = blocksData?.comidas || {};

    const newMeals: MealState[] = MEAL_ORDER
      .filter(key => enabledMeals[key])
      .map(key => {
        const logged = logMeals.find((m: any) => m.meal_key === key);
        const tgt = bc[key]?.gramos || { proteina: 0, grasa: 0, carbohidratos: 0 };
        let foods: MealFood[] = [];
        if (logged?.foods_json) {
          const raw = typeof logged.foods_json === 'string'
            ? JSON.parse(logged.foods_json) : logged.foods_json;
          foods = (raw || []).map(fromLoggedFood);
        }
        const recipes: Array<{ id: number; name?: string }> = [];
        if (logged?.recipe_id) recipes.push({ id: logged.recipe_id, name: logged.recipe_name });
        return {
          meal_key: key, foods,
          target_p: tgt.proteina || logged?.target_p || 0,
          target_g: tgt.grasa || logged?.target_g || 0,
          target_c: tgt.carbohidratos || logged?.target_c || 0,
          completed: logged?.completed ?? false,
          recipes,
        };
      });

    setMeals(newMeals);
    setInitialized(true);
  }, [blocksData, logQuery.data, enabledMeals]);

  // ── Save mutations ──────────────────────────────────────
  const saveDailyLogMut = useMutation({
    mutationFn: (payload: any[]) =>
      mode === 'doctor' && patientName
        ? nutritionService.saveDailyLogForPatient(patientName, date, payload)
        : nutritionService.saveDailyLog(date, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLog', date, patientName] });
    },
  });

  const saveMealPlanMut = useMutation({
    mutationFn: (payload: any) => nutritionService.createMealPlan(payload),
    onSuccess: () => Alert.alert('Plantilla guardada', 'Plan alimentario guardado como plantilla.'),
  });

  const saveMealConfigMut = useMutation({
    mutationFn: (config: MealConfigInput) =>
      nutritionService.saveMealConfig(config.comidas, config.entreno),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealBlocks'] });
      Alert.alert('Configuracion guardada', 'Distribucion de comidas actualizada.');
    },
  });

  // ── Debounced auto-save for patient mode ────────────────
  const debouncedSave = useCallback((updatedMeals: MealState[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveDailyLogMut.mutate(buildDailyLogPayload(updatedMeals, true));
    }, DEBOUNCE_MS);
  }, [saveDailyLogMut]);

  const persistMeals = useCallback((updatedMeals: MealState[]) => {
    setMeals(updatedMeals);
    if (mode === 'patient') debouncedSave(updatedMeals);
  }, [mode, debouncedSave]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  // ── CRUD Operations ─────────────────────────────────────
  const addFood = useCallback((mealKey: string, food: MealFood) => {
    const updated = meals.map(m =>
      m.meal_key === mealKey ? { ...m, foods: [...m.foods, food] } : m
    );
    persistMeals(updated);
  }, [meals, persistMeals]);

  const removeFood = useCallback((mealKey: string, foodIndex: number) => {
    const updated = meals.map(m =>
      m.meal_key === mealKey ? { ...m, foods: m.foods.filter((_, i) => i !== foodIndex) } : m
    );
    persistMeals(updated);
  }, [meals, persistMeals]);

  const updateFoodQuantity = useCallback((mealKey: string, foodIndex: number, newQtyG: number) => {
    const updated = meals.map(m => {
      if (m.meal_key !== mealKey) return m;
      return { ...m, foods: m.foods.map((f, i) => i === foodIndex ? recalcFoodMacros(f, newQtyG) : f) };
    });
    persistMeals(updated);
  }, [meals, persistMeals]);

  const toggleFoodState = useCallback((mealKey: string, foodIndex: number) => {
    const updated = meals.map(m => {
      if (m.meal_key !== mealKey) return m;
      return { ...m, foods: m.foods.map((f, i) => {
        if (i !== foodIndex) return f;
        return mode === 'patient' ? { ...f, eaten: !f.eaten } : { ...f, locked: !f.locked };
      })};
    });
    persistMeals(updated);
  }, [meals, mode, persistMeals]);

  // ── Solver ──────────────────────────────────────────────
  // Response shape: { success: true, data: { status: "Optimal", alimentos: [...] } }
  const solveMeal = useCallback(async (mealKey: string) => {
    const meal = meals.find(m => m.meal_key === mealKey);
    if (!meal || meal.foods.length === 0) {
      Alert.alert('Sin alimentos', 'Agrega alimentos a esta comida primero.');
      return;
    }
    setSolving(prev => ({ ...prev, [mealKey]: true }));
    try {
      const payload = buildSolveMealPayload(meal, libertad);
      const result = await nutritionService.solveMeal(payload);
      // apiClient wraps: { success, data }. data contains solver output with status: "Optimal"
      const envelope = (result as any);
      const solverOutput = envelope?.data || envelope;
      const isOptimal = solverOutput?.status === 'Optimal' || solverOutput?.status === 'Feasible';
      if (isOptimal && solverOutput?.alimentos?.length) {
        const updatedMeal = applySolveResult(meal, solverOutput);
        persistMeals(meals.map(m => m.meal_key === mealKey ? updatedMeal : m));
      } else {
        Alert.alert('Sin resultados', solverOutput?.message || `Solver: ${solverOutput?.status || 'sin respuesta'}`);
      }
    } catch {
      Alert.alert('Error', 'No se pudo calcular la comida.');
    } finally {
      setSolving(prev => ({ ...prev, [mealKey]: false }));
    }
  }, [meals, libertad, persistMeals]);

  const solveAllMeals = useCallback(async () => {
    const mealsWithFoods = meals.filter(m => m.foods.length > 0);
    if (mealsWithFoods.length === 0) return;
    const solvingAll: Record<string, boolean> = {};
    mealsWithFoods.forEach(m => { solvingAll[m.meal_key] = true; });
    setSolving(solvingAll);
    try {
      const results = await Promise.all(
        mealsWithFoods.map(async meal => {
          try {
            const payload = buildSolveMealPayload(meal, libertad);
            const result = await nutritionService.solveMeal(payload);
            const solverOutput = (result as any)?.data || result;
            const isOk = solverOutput?.status === 'Optimal' || solverOutput?.status === 'Feasible';
            return isOk ? applySolveResult(meal, solverOutput) : meal;
          } catch { return meal; }
        })
      );
      const updated = meals.map(m => results.find(r => r.meal_key === m.meal_key) || m);
      persistMeals(updated);
    } finally { setSolving({}); }
  }, [meals, libertad, persistMeals]);

  // ── Totals ──────────────────────────────────────────────
  const getMealTotals = useCallback((mealKey: string): MacroTotals => {
    const meal = meals.find(m => m.meal_key === mealKey);
    if (!meal) return { protein: 0, fat: 0, carbs: 0, calories: 0 };
    return sumFoodMacros(meal.foods, mode === 'patient');
  }, [meals, mode]);

  const dayTotals = useMemo(() => {
    let protein = 0, fat = 0, carbs = 0, calories = 0, tgt_p = 0, tgt_g = 0, tgt_c = 0;
    for (const m of meals) {
      const t = sumFoodMacros(m.foods, mode === 'patient');
      protein += t.protein; fat += t.fat; carbs += t.carbs; calories += t.calories;
      tgt_p += m.target_p; tgt_g += m.target_g; tgt_c += m.target_c;
    }
    return {
      protein: Math.round(protein), fat: Math.round(fat), carbs: Math.round(carbs), calories: Math.round(calories),
      tgt_p: Math.round(tgt_p), tgt_g: Math.round(tgt_g), tgt_c: Math.round(tgt_c),
      tgt_cal: Math.round(tgt_p * 4 + tgt_c * 4 + tgt_g * 9),
    };
  }, [meals, mode]);

  // ── Save actions (explicit semantics per role) ──────────
  /** Patient: save execution (daily_log with actual consumption) */
  const saveAsExecution = useCallback(() => {
    const payload = buildDailyLogPayload(meals, true);
    if (payload.length === 0) { Alert.alert('Sin datos', 'No hay comidas para guardar.'); return; }
    saveDailyLogMut.mutate(payload);
  }, [meals, saveDailyLogMut]);

  /** Doctor: save dated proposal (daily_log with completed:false — patient sees as suggestion) */
  const saveAsProposal = useCallback(() => {
    if (mode !== 'doctor' || !patientName) return;
    const payload = buildDailyLogPayload(meals, false).map(m => ({ ...m, completed: false }));
    if (payload.length === 0) { Alert.alert('Sin datos', 'Calcula al menos una comida.'); return; }
    saveDailyLogMut.mutate(payload);
  }, [meals, mode, patientName, saveDailyLogMut]);

  /** Doctor: save as reusable template (meal_plans — not date-bound) */
  const saveAsTemplate = useCallback(() => {
    if (mode !== 'doctor') return;
    const payload = buildMealPlanPayload(meals);
    if (Object.keys(payload.plan_json.comidas).length === 0) {
      Alert.alert('Sin recetas', 'Agrega recetas a las comidas para guardar una plantilla.');
      return;
    }
    saveMealPlanMut.mutate(payload);
  }, [meals, mode, saveMealPlanMut]);

  // ── Patient: toggle meal completed ──────────────────────
  const markMealCompleted = useCallback((mealKey: string) => {
    const updated = meals.map(m => m.meal_key === mealKey ? { ...m, completed: !m.completed } : m);
    persistMeals(updated);
  }, [meals, persistMeals]);

  // ── Doctor: meal config ─────────────────────────────────
  const saveMealConfig = useCallback((config: MealConfigInput) => {
    saveMealConfigMut.mutate(config);
  }, [saveMealConfigMut]);

  return {
    meals, setMeals, enabledMeals, mealTargets, date, setDate,
    initialized, isSaving: saveDailyLogMut.isPending || saveMealPlanMut.isPending,
    isSolving: solving, isLoading: blocksQuery.isLoading || logQuery.isLoading, libertad,
    addFood, removeFood, updateFoodQuantity, toggleFoodState,
    solveMeal, solveAllMeals, getMealTotals, dayTotals,
    saveAsExecution, saveAsProposal, saveAsTemplate,
    markMealCompleted, saveMealConfig, isSavingConfig: saveMealConfigMut.isPending,
    blocksData, refetchBlocks: blocksQuery.refetch,
  };
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd omega-medicina-app && npx tsc --noEmit src/hooks/useMealEditor.ts 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd omega-medicina-app && git add src/hooks/useMealEditor.ts
git commit -m "feat: add useMealEditor hook with debounce, correct response parsing, multi-recipe support"
```

---

### Task 5: Add MealConfigPanel to doctor screen

**Files:**
- Modify: `omega-medicina-app/app/(doctor)/patient-nutrition.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { useMealEditor, MealConfigInput } from '../../src/hooks/useMealEditor';
import { MealFood, MEAL_ORDER, MEAL_LABELS, MEAL_EMOJIS } from '../../src/utils/mealCalculations';
```

- [ ] **Step 2: Initialize hook and config state**

```typescript
const editor = useMealEditor({ mode: 'doctor', patientName, initialDate: planDate });

const [configExpanded, setConfigExpanded] = useState(false);
const [mealSizes, setMealSizes] = useState<Record<string, string>>(() => {
  const s: Record<string, string> = {};
  MEAL_ORDER.forEach(k => { s[k] = 'medium'; });
  return s;
});
const [mealEnabled, setMealEnabled] = useState<Record<string, boolean>>(() => {
  const e: Record<string, boolean> = {};
  MEAL_ORDER.forEach(k => { e[k] = k !== 'media_manana' && k !== 'media_tarde'; });
  return e;
});
const [trainingMeal, setTrainingMeal] = useState<string | null>(null);

const handleSaveConfig = () => {
  const config: MealConfigInput = { comidas: {} as any, entreno: trainingMeal };
  MEAL_ORDER.forEach(k => { config.comidas[k] = { enabled: mealEnabled[k], size: mealSizes[k] }; });
  editor.saveMealConfig(config);
};
```

- [ ] **Step 3: Add config panel JSX**

Add between "Plan actual" and "Planificar comidas" sections, using the same collapsible card pattern:

```tsx
{/* ── Configuracion de comidas ── */}
<Pressable onPress={() => setConfigExpanded(!configExpanded)}
  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
           backgroundColor: '#1a1a2e', borderRadius: 12 * s, padding: 14 * s, marginBottom: 10 * s }}>
  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 * s }}>Configuracion de comidas</Text>
  <Text style={{ color: '#888', fontSize: 18 * s }}>{configExpanded ? '▲' : '▼'}</Text>
</Pressable>
{configExpanded && (
  <View style={{ backgroundColor: '#1a1a2e', borderRadius: 12 * s, padding: 14 * s,
                  marginBottom: 10 * s, marginTop: -6 * s }}>
    {MEAL_ORDER.map(key => (
      <View key={key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 * s, gap: 8 * s }}>
        <Pressable onPress={() => setMealEnabled(prev => ({ ...prev, [key]: !prev[key] }))}
          style={{ width: 28 * s, height: 28 * s, borderRadius: 6, borderWidth: 1,
                   borderColor: mealEnabled[key] ? '#4ade80' : '#555',
                   backgroundColor: mealEnabled[key] ? '#4ade8020' : 'transparent',
                   justifyContent: 'center', alignItems: 'center' }}>
          {mealEnabled[key] && <Text style={{ color: '#4ade80', fontSize: 14 * s }}>✓</Text>}
        </Pressable>
        <Text style={{ color: '#fff', fontSize: 13 * s, flex: 1 }}>
          {MEAL_EMOJIS[key]} {MEAL_LABELS[key]}
        </Text>
        {mealEnabled[key] && (
          <View style={{ flexDirection: 'row', gap: 4 * s }}>
            {['small', 'medium', 'large'].map(sz => (
              <Pressable key={sz}
                onPress={() => setMealSizes(prev => ({ ...prev, [key]: sz }))}
                style={{ paddingHorizontal: 8 * s, paddingVertical: 4 * s, borderRadius: 6,
                         backgroundColor: mealSizes[key] === sz ? '#6366f1' : '#333' }}>
                <Text style={{ color: mealSizes[key] === sz ? '#fff' : '#888', fontSize: 11 * s }}>
                  {sz === 'small' ? 'S' : sz === 'medium' ? 'M' : 'L'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {mealEnabled[key] && (
          <Pressable onPress={() => setTrainingMeal(trainingMeal === key ? null : key)}
            style={{ paddingHorizontal: 6 * s, paddingVertical: 4 * s, borderRadius: 6,
                     backgroundColor: trainingMeal === key ? '#f59e0b' : '#333' }}>
            <Text style={{ fontSize: 11 * s, color: trainingMeal === key ? '#000' : '#888' }}>
              {'\u{1F3CB}\u{FE0F}'}
            </Text>
          </Pressable>
        )}
      </View>
    ))}
    <Pressable onPress={handleSaveConfig}
      style={{ backgroundColor: '#6366f1', borderRadius: 8, paddingVertical: 10 * s,
               alignItems: 'center', marginTop: 8 * s }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 * s }}>
        {editor.isSavingConfig ? 'Guardando...' : 'Guardar configuracion'}
      </Text>
    </Pressable>
  </View>
)}
```

- [ ] **Step 4: Add solve-meal and template save buttons**

In "Planificar comidas" section, add per-meal "Resolver" button:
```tsx
<Pressable onPress={() => editor.solveMeal(mealKey)}
  style={{ backgroundColor: '#10b981', borderRadius: 8, paddingHorizontal: 10 * s, paddingVertical: 6 * s }}>
  <Text style={{ color: '#fff', fontSize: 12 * s, fontWeight: '600' }}>
    {editor.isSolving[mealKey] ? 'Calculando...' : 'Resolver'}
  </Text>
</Pressable>
```

Add template save button next to existing "Guardar planificacion":
```tsx
<Pressable onPress={() => editor.saveAsTemplate()}
  style={{ backgroundColor: '#8b5cf6', borderRadius: 8, paddingVertical: 10 * s,
           alignItems: 'center', marginTop: 6 * s }}>
  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 * s }}>
    {editor.isSaving ? 'Guardando...' : 'Guardar como plantilla'}
  </Text>
</Pressable>
```

- [ ] **Step 5: Commit**

```bash
git add omega-medicina-app/app/\(doctor\)/patient-nutrition.tsx
git commit -m "feat: add meal config panel and solve-meal to doctor nutrition screen"
```

---

### Task 6: Wire useMealEditor into doctor meal planning logic

**Files:**
- Modify: `omega-medicina-app/app/(doctor)/patient-nutrition.tsx`

- [ ] **Step 1: Replace inline food operations with hook calls**

Replace `addPlanExtraFood`:
```typescript
const handleAddFoodToMeal = (mealKey: string, food: any) => {
  const gramos = food.Gramo1 || food.porcion1 || 100;
  const p100 = food.P ?? food.proteina ?? 0;
  const g100 = food.G ?? food.grasa ?? 0;
  const c100 = food.CH ?? food.carbohidratos ?? 0;
  const rd = (n: number) => Math.round(n * 10) / 10;
  const mealFood: MealFood = {
    id: String(food.ID || food.id || `f_${Date.now()}`),
    name: food.Largadescripcion || food.Cortadescripcion || food.nombre || '',
    quantity_g: gramos, medida_casera_g: gramos,
    unit: food.Medidacasera1 || '1 porcion',
    protein_100g: p100, fat_100g: g100, carbs_100g: c100,
    protein: rd(gramos * p100 / 100), fat: rd(gramos * g100 / 100),
    carbs: rd(gramos * c100 / 100),
    calories: Math.round(gramos * (p100 * 4 + c100 * 4 + g100 * 9) / 100),
  };
  editor.addFood(mealKey, mealFood);
  setShowPlanFoodSearch(null);
  setPlanFoodSearch('');
};
```

Replace `removePlanFood(key, idx)` → `editor.removeFood(key, idx)`
Replace `updatePlanFood(key, idx, ...)` → `editor.updateFoodQuantity(key, idx, newGramos)`
Replace `togglePlanFoodLock(key, idx)` → `editor.toggleFoodState(key, idx)`
Replace `sumFoods(ms.foods)` → `editor.getMealTotals(key)`
Replace `savePlanningMut` onPress → `editor.saveAsProposal()`

- [ ] **Step 2: Remove now-unused local state and functions**

Remove: `planMeals` state, `sumFoods`, `recalcFood`, local `MEAL_ORDER`/`MEAL_LABELS`/`MEAL_EMOJIS`, `savePlanningMut`, `getPlanMealMacros` (replaced by hook targets).

Keep: `calculatePlanRecipe` (recipe solver uses different endpoint — may wire later).

- [ ] **Step 3: Test doctor flow end-to-end**

1. Create plan → verify getMealBlocks returns non-null targets
2. Config comidas → save → verify blocks update
3. Add recipe → add food → Resolver → verify solver works
4. "Guardar planificacion" → "Guardar como plantilla" → both work
5. Adherence section still loads

- [ ] **Step 4: Commit**

```bash
git add omega-medicina-app/app/\(doctor\)/patient-nutrition.tsx
git commit -m "feat: wire useMealEditor into doctor meal planning, remove duplicated logic"
```

---

### Task 7: Wire useMealEditor into patient screen

**Files:**
- Modify: `omega-medicina-app/app/(patient)/nutrition/index.tsx`

- [ ] **Step 1: Import and initialize**

```typescript
import { useMealEditor } from '../../../src/hooks/useMealEditor';
import { MealFood, MealState, fromLoggedFood, MEAL_ORDER, MEAL_LABELS, MEAL_EMOJIS } from '../../../src/utils/mealCalculations';

const editor = useMealEditor({ mode: 'patient', initialDate: dateStr });
```

- [ ] **Step 2: Replace inline logic with hook calls**

| Before | After |
|---|---|
| `meals` (useMemo from logData+blocks) | `editor.meals` |
| `mealTotals(m.foods)` | `editor.getMealTotals(m.meal_key)` |
| `dailyTotals` | `editor.dayTotals` |
| `handleRecalculate(key)` | `editor.solveMeal(key)` |
| `handleCalculateAll()` | `editor.solveAllMeals()` |
| `handleRemoveFood(key, idx)` | `editor.removeFood(key, idx)` |
| `handleEditQtySave(qty)` | `editor.updateFoodQuantity(key, idx, qty)` |
| `handleToggleEaten(key, idx)` | `editor.toggleFoodState(key, idx)` |
| `buildMealPayload() + saveMut` | automatic (debounced in patient mode) |
| `handleToggleMealComplete(key)` | `editor.markMealCompleted(key)` |

Keep all JSX: calorie arc, macro bars, swipe-delete, checkmarks. Only change data source and callbacks.

- [ ] **Step 3: Remove now-unused code**

Remove: `LoggedFood` interface, `mealTotals()`, `buildMealPayload()`, `buildSolveMealPayload()`, `applySolveResult()`, `handleRecalculate()`, `saveMut`, `blocksData` query, `meals` useMemo, local `MEAL_ORDER`/`MEAL_LABELS`/`MEAL_EMOJIS`.

Keep `MealData` as type alias if JSX still references it: `type MealData = MealState;`

- [ ] **Step 4: Test patient flow end-to-end**

1. Targets display correctly
2. Add food via food-search → appears in meal
3. Edit quantity → macros recalculate
4. Toggle eaten → totals update
5. "Calcular" per meal → solver runs
6. "Calcular todo" → all meals solve
7. Navigate away and back → data persisted (debounce completed)

- [ ] **Step 5: Run tests**

```bash
cd omega-medicina-app && npm run test:quick && npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add omega-medicina-app/app/\(patient\)/nutrition/index.tsx
git commit -m "feat: wire useMealEditor into patient nutrition, remove duplicated logic"
```

---

### Task 8: Deduplicate constants and final cleanup

**Files:**
- Modify: `omega-medicina-app/app/(doctor)/patient-nutrition.tsx`
- Modify: `omega-medicina-app/app/(patient)/nutrition/index.tsx`

- [ ] **Step 1: Verify no duplicated MEAL_ORDER/MEAL_LABELS/MEAL_EMOJIS remain in either file**

```bash
cd omega-medicina-app && grep -n "MEAL_ORDER\|MEAL_LABELS\|MEAL_EMOJIS" app/\(doctor\)/patient-nutrition.tsx app/\(patient\)/nutrition/index.tsx
```
Expected: Only import lines, no local const declarations.

- [ ] **Step 2: Remove any remaining `rd()` duplicates**

The `rd()` helper may still exist locally. Check if it's used elsewhere in the file — if only for the food conversion function (now using hook), remove it.

- [ ] **Step 3: Run full test suite**

```bash
cd omega-medicina-app && npm run test:quick && npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: deduplicate meal constants and helpers into shared utils"
```
