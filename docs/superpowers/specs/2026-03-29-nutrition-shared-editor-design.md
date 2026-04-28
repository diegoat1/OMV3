# Nutrition Shared Editor — Design Spec

> Date: 2026-03-29

## Problem

The nutrition module has a complete backend (35 endpoints) but the doctor's frontend skips critical steps: after creating a plan, there's no UI for meal distribution config (`save-config`) and no solver integration (`solve-meal`). The plan's per-meal distribution columns stay NULL, which breaks the entire downstream chain (targets, solver, patient daily log).

Additionally, doctor and patient screens duplicate ~60% of meal editing logic (add/remove foods, edit quantities, calculate macros, solve meals) with slightly different data structures.

## Solution

### Phase 1 — Backend fix + shared logic layer

Fix the backend so plans always have valid per-meal distribution. Create shared TypeScript utilities and a React hook that both screens consume, without touching the existing UI rendering.

### Phase 2 — Integrate hook into existing screens

Wire `useMealEditor` into `patient-nutrition.tsx` and `nutrition/index.tsx`. Each screen keeps its own JSX but delegates meal state management and calculations to the shared hook.

### Phase 3 — Visual component extraction (future, not in this spec)

Once logic is stable, extract `MealEditor`, `MealCard`, `FoodRow` as shared components. Not part of this implementation.

---

## Architecture

### New files

```
omega-medicina-app/src/
├── utils/
│   └── mealCalculations.ts     ← Pure functions: totals, macros, payload builders
└── hooks/
    └── useMealEditor.ts         ← Shared hook: state, CRUD, solver, save
```

### Modified files

| File | Change |
|---|---|
| `src/api/v3/nutrition/routes.py` | Default distribution on plan creation + validation in blocks/solve-meal |
| `app/(doctor)/patient-nutrition.tsx` | Use `useMealEditor(mode='doctor')` + add MealConfigPanel section + solve-meal button |
| `app/(patient)/nutrition/index.tsx` | Use `useMealEditor(mode='patient')`, replace inline meal logic |

---

## Detailed Design

### 1. Backend Fix (`routes.py`)

#### 1a. `POST /plans` — Default meal distribution

When creating a plan, if no per-meal percentages are provided, generate an equitable default distribution across 4 standard meals (desayuno, almuerzo, merienda, cena):

```python
# Default: 4 meals, equal distribution
default_meals = {
    'desayuno': 0.25,
    'almuerzo': 0.30,
    'merienda': 0.20,
    'cena': 0.25
}
# For each meal: p = g = c = same percentage
# media_manana and media_tarde default to 0 (disabled)
```

The INSERT must include all 18 distribution columns. No NULL values.

#### 1b. `GET /meal-plans/blocks` — Fallback for empty distribution

If all distribution columns are 0/NULL (legacy plans), return a computed fallback:

```python
# If comidas dict is empty after reading distributions,
# generate default equitable split and return it
# (but don't persist — just return for display)
```

#### 1c. `POST /solve-meal` — Explicit validation

If `meal_key` is provided but the corresponding targets are 0/NULL, return a clear error:

```python
error_response(
    f'No hay targets definidos para {meal_key}. Configure la distribucion de comidas primero.',
    code=ErrorCodes.VALIDATION_ERROR,
    status_code=400
)
```

### 2. Shared Types (`mealCalculations.ts`)

#### MealFood — Unified food type

```typescript
export interface MealFood {
  id: string;
  name: string;
  quantity_g: number;
  medida_casera_g?: number;
  unit?: string;
  // Per 100g (source of truth for recalculation)
  protein_100g: number;
  fat_100g: number;
  carbs_100g: number;
  // Calculated from quantity_g
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
  // Role-specific (both optional)
  eaten?: boolean;        // patient: per-food checkbox
  locked?: boolean;       // doctor: immutable recipe food
  recipeSource?: string;  // doctor: which recipe provided this food
}
```

#### MealState — Per-meal state

```typescript
export interface MealState {
  meal_key: string;
  foods: MealFood[];
  target_p: number;
  target_g: number;
  target_c: number;
  // Patient-specific
  completed?: boolean;
  // Doctor-specific
  recipeId?: number;
  recipeName?: string;
}
```

#### MealTargets — From getMealBlocks

```typescript
export interface MealTargets {
  [mealKey: string]: {
    proteina: number;
    grasa: number;
    carbohidratos: number;
  };
}
```

### 3. Pure Functions (`mealCalculations.ts`)

```typescript
// Recalculate a food's macros from quantity change
export function recalcFoodMacros(food: MealFood, newQuantityG: number): MealFood;

// Sum macros for a list of foods
// onlyEaten: if true, skip foods where eaten === false
export function sumFoodMacros(foods: MealFood[], onlyEaten?: boolean): {
  protein: number; fat: number; carbs: number; calories: number;
};

// Convert from patient's LoggedFood format to MealFood
export function fromLoggedFood(food: any): MealFood;

// Convert from doctor's PlanningFood format to MealFood
export function fromPlanningFood(food: any): MealFood;

// Build solve-meal API payload from current meal state
export function buildSolveMealPayload(
  meal: MealState,
  libertad: number
): SolveMealRequest;

// Apply solve-meal result back to meal state
export function applySolveResult(
  meal: MealState,
  result: SolveMealResponse
): MealState;

// Build DailyMealLog payload for saving
export function buildDailyLogPayload(meals: MealState[]): DailyMealLog[];

// Build meal_plans payload for saving template
export function buildMealPlanPayload(meals: MealState[]): MealPlanRequest;

// Calculate meal score (P*40% + G*30% + C*30%)
export function calculateMealScore(
  actuals: { p: number; g: number; c: number },
  targets: { p: number; g: number; c: number }
): number;
```

### 4. Shared Hook (`useMealEditor.ts`)

```typescript
interface UseMealEditorOptions {
  mode: 'doctor' | 'patient';
  // For doctor mode: patient identification
  patientName?: string;
  // Initial date
  initialDate?: string;
}

interface UseMealEditorReturn {
  // State
  meals: MealState[];
  enabledMeals: Record<string, boolean>;
  mealTargets: MealTargets;
  date: string;
  setDate: (d: string) => void;
  isSaving: boolean;
  isSolving: Record<string, boolean>;

  // CRUD operations
  addFood: (mealKey: string, food: MealFood) => void;
  removeFood: (mealKey: string, foodIndex: number) => void;
  updateFoodQuantity: (mealKey: string, foodIndex: number, newQtyG: number) => void;
  toggleFoodState: (mealKey: string, foodIndex: number) => void;
    // doctor: toggles locked; patient: toggles eaten

  // Solver
  solveMeal: (mealKey: string) => Promise<void>;
  solveAllMeals: () => Promise<void>;

  // Totals (computed)
  getMealTotals: (mealKey: string) => { protein: number; fat: number; carbs: number; calories: number };
  getDayTotals: () => { protein: number; fat: number; carbs: number; calories: number };

  // Save (role-dependent)
  saveAsExecution: () => Promise<void>;     // patient: daily_log
  saveAsProposal: () => Promise<void>;      // doctor: daily_log (completed:false) — fechado
  saveAsTemplate: () => Promise<void>;      // doctor: meal_plans

  // Patient-specific
  markMealCompleted: (mealKey: string) => void;
  markDayCompleted: () => void;

  // Doctor-specific: meal config
  mealConfig: MealConfigState | null;
  saveMealConfig: (config: MealConfigInput) => Promise<void>;
}
```

#### Internal behavior by mode

**State initialization:**
- Both modes: fetch `getMealBlocks()` for targets
- `mode=patient`: also fetch `getDailyLog(date)` for existing entries
- `mode=doctor`: also fetch `getDailyLogForPatient(patientName, date)` to see existing entries

**On food change:**
- `mode=patient`: auto-save via `saveDailyLog()` (eager persistence)
- `mode=doctor`: state-only (optimistic, save explicitly)

**Save destinations:**
- `saveAsExecution()` → `nutritionService.saveDailyLog()` — patient only
- `saveAsProposal()` → `nutritionService.saveDailyLogForPatient(completed: false)` — doctor, specific date
- `saveAsTemplate()` → `nutritionService.createMealPlan(plan_json)` — doctor, reusable

### 5. MealConfigPanel (inline section in doctor screen)

New collapsible section in `patient-nutrition.tsx` between "Plan actual" and "Planificar comidas":

**UI:**
- Row per meal: checkbox (enabled) + size selector dropdown (extra_small..extra_large)
- Training meal selector (radio/dropdown)
- "Guardar configuracion" button

**Action:** Calls `nutritionService.saveMealConfig()`, then invalidates `getMealBlocks` query.

### 6. Integration: Doctor screen

Replace the inline meal planning logic in `patient-nutrition.tsx` with:

```typescript
const editor = useMealEditor({ mode: 'doctor', patientName });
```

Keep existing JSX but wire to `editor.addFood()`, `editor.removeFood()`, `editor.solveMeal()`, etc.

Add new buttons:
- "Resolver comida" per meal card → `editor.solveMeal(mealKey)`
- "Guardar plantilla" → `editor.saveAsTemplate()`
- "Guardar propuesta del dia" → `editor.saveAsProposal()`

### 7. Integration: Patient screen

Replace inline meal logic in `nutrition/index.tsx` with:

```typescript
const editor = useMealEditor({ mode: 'patient' });
```

Keep existing JSX (calorie arc, macro bars, swipe-delete, checkmarks) but wire to editor functions.

Existing behavior preserved:
- Eager save on every change
- Per-food eaten checkboxes
- Solve per-meal and solve-all
- Score calculation

### 8. Patient sees doctor suggestions

When patient opens a day and there's no daily_log yet:
1. Check if a `meal_plan` template exists for this patient
2. If yes, pre-populate the meal editor with those foods as starting suggestions
3. Show visual indicator: "Sugerido por tu nutricionista"
4. Foods don't persist to daily_log until patient explicitly saves or marks eaten

---

## Persistence Rules

| Action | Who | Destination | Effect |
|---|---|---|---|
| Guardar plantilla | Doctor | `meal_plans` (plan_json) | Reusable template, no date |
| Guardar propuesta del dia | Doctor | `daily_log` (completed:false) | Pre-loaded for patient on that date |
| Guardar comida / marcar realizada | Patient | `daily_log` (completed:true) | Real execution, generates score |
| Guardar dia completo | Patient | `daily_log` + `daily_summary` | Full day scores |

**Principle:** `daily_log` is the source of truth for patient execution. `meal_plans` is the source of truth for doctor prescriptions. When both exist for the same date, patient's `daily_log` takes precedence in display.

---

## Scope Boundaries

### In scope (this spec)
- Backend fix: default distribution + validations
- `mealCalculations.ts`: shared pure functions
- `useMealEditor.ts`: shared hook with mode
- MealConfigPanel: inline save-config UI for doctor
- Solve-meal integration in doctor screen
- Template save for doctor
- Hook integration in both screens (keeping existing JSX)

### Out of scope (future)
- Visual component extraction (MealEditor, MealCard, FoodRow)
- Block library browsing UI
- Shopping list UI
- Food catalog browsing UI
- Adherence comparison view (plan vs reality dashboard)

---

## Testing Strategy

1. **Backend:** Manual test via curl/Postman
   - Create plan → verify distribution columns are not NULL
   - GET blocks on new plan → verify comidas is not empty
   - POST solve-meal with invalid meal_key → verify 400 error

2. **mealCalculations.ts:** Unit tests
   - `recalcFoodMacros`, `sumFoodMacros`, `buildSolveMealPayload`, `calculateMealScore`

3. **useMealEditor:** Integration test
   - Mock API calls, verify state transitions for both modes

4. **E2E:** Manual test
   - Doctor: create plan → config meals → solve meal → save template
   - Patient: open day → see suggestions → modify → save → verify score
