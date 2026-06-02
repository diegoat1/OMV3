import { api } from './apiClient'
import type { RechangePayload, RechangeResponse } from '../types/api'
import type {
  AcceptOptionPayload,
  AcceptOptionResponse,
  AdjustCaloriesPayload,
  AdjustCaloriesResponse,
  AutoCalculatePayload,
  AutoCalculateResponse,
  CreatePlanPayload,
  CreatePlanResponse,
  Food,
  FoodGroup,
  FoodPortion,
  FoodsListResponse,
  GetPlanResponse,
  ListPlansResponse,
  MealKey,
  MealPlanBlocksResponse,
  MealPlanLibraryResponse,
  NutritionPlan,
  Recipe,
  RecipesResponse,
  SaveConfigPayload,
  SaveConfigResponse,
  ShoppingListResponse,
  SolveMealPayload,
  SolveMealResponse,
  UpdatePlanMacrosPayload,
  UpdatePlanResponse,
  UpdatePlanStructurePayload,
} from '../types/api'

function qs(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    usp.set(k, String(v))
  }
  const s = usp.toString()
  return s ? `?${s}` : ''
}

/** Wraps the v3 nutrition endpoints exposed at /api/v3/nutrition/*.
 *
 *  Permission model (Fix 18 — OMV-45):
 *  - `updatePlanMacros` requires admin or assigned specialist.
 *  - `updatePlanStructure` is open to the patient owner too.
 *  - The general `updatePlan` rejects with 403 when a patient tries to touch
 *    macros — split your edit into the two specific endpoints when the caller
 *    is a patient. */
export const nutritionService = {
  /** GET /nutrition/plans — caller's own plans, or `?patient=<name>` for
   *  admin/specialist. Returns most-recent first. */
  listPlans(patient?: string): Promise<ListPlansResponse> {
    const qs = patient ? `?patient=${encodeURIComponent(patient)}` : ''
    return api.get<ListPlansResponse>(`/nutrition/plans${qs}`)
  },

  getPlan(planId: number): Promise<GetPlanResponse> {
    return api.get<GetPlanResponse>(`/nutrition/plans/${planId}`)
  },

  createPlan(payload: CreatePlanPayload): Promise<CreatePlanResponse> {
    return api.post<CreatePlanResponse>('/nutrition/plans', payload)
  },

  /** General update — accepts both macros and structure fields, but rejects
   *  with 403 if the caller is a patient and the body contains macros. Prefer
   *  `updatePlanMacros` / `updatePlanStructure` to express intent explicitly. */
  updatePlan(
    planId: number,
    payload: UpdatePlanMacrosPayload & UpdatePlanStructurePayload,
  ): Promise<UpdatePlanResponse> {
    return api.put<UpdatePlanResponse>(`/nutrition/plans/${planId}`, payload)
  },

  /** PUT /plans/<id>/macros — admin/specialist only. */
  updatePlanMacros(planId: number, payload: UpdatePlanMacrosPayload): Promise<UpdatePlanResponse> {
    return api.put<UpdatePlanResponse>(`/nutrition/plans/${planId}/macros`, payload)
  },

  /** PUT /plans/<id>/structure — patient owner OK. */
  updatePlanStructure(planId: number, payload: UpdatePlanStructurePayload): Promise<UpdatePlanResponse> {
    return api.put<UpdatePlanResponse>(`/nutrition/plans/${planId}/structure`, payload)
  },

  deletePlan(planId: number): Promise<{ id: number; deleted: true }> {
    return api.delete<{ id: number; deleted: true }>(`/nutrition/plans/${planId}`)
  },

  /** Auto-calculate macros from current measurements + active goal. Pure
   *  computation, does NOT persist — call `acceptAutoCalculate` to commit. */
  autoCalculate(payload: AutoCalculatePayload = {}): Promise<AutoCalculateResponse> {
    return api.post<AutoCalculateResponse>('/nutrition/plans/auto-calculate', payload)
  },

  /** Persist a chosen `OpcionVelocidad` from `autoCalculate` as a new plan. */
  acceptAutoCalculate(payload: AcceptOptionPayload): Promise<AcceptOptionResponse> {
    return api.post<AcceptOptionResponse>('/nutrition/plans/auto-calculate/accept', payload)
  },

  /** Configure meal sizes + multi-training timing/intensity. Persists
   *  `entreno_meal_keys_json`, `entreno_intensidad`, `comidas_config_json`
   *  on the plan so the config survives across calls. */
  saveConfig(payload: SaveConfigPayload): Promise<SaveConfigResponse> {
    return api.post<SaveConfigResponse>('/nutrition/meal-plans/save-config', payload)
  },

  /** Solver: optimize quantities to hit macro targets. Pass `meal_key` to use
   *  per-meal targets from the patient's plan, or `objetivo` to specify
   *  targets directly. */
  solveMeal(payload: SolveMealPayload): Promise<SolveMealResponse> {
    return api.post<SolveMealResponse>('/nutrition/solve-meal', payload)
  },

  /** Bumps daily calories on a plan and recomputes proteina/grasa/ch
   *  proportionally using lean-mass-aware defaults. */
  adjustCalories(planId: number, payload: AdjustCaloriesPayload): Promise<AdjustCaloriesResponse> {
    return api.post<AdjustCaloriesResponse>(`/nutrition/plans/${planId}/adjust-calories`, payload)
  },

  /* ──────────────── Food catalog (legacy ALIMENTOS table) ──────────────── */

  /** GET /nutrition/foods?q=…&page=&per_page=&group_id= — paginated catalog. */
  listFoods(opts: { q?: string; page?: number; per_page?: number; group_id?: number } = {}): Promise<FoodsListResponse> {
    return api.get<FoodsListResponse>(`/nutrition/foods${qs(opts)}`)
  },
  getFood(foodId: number): Promise<Food> {
    return api.get<Food>(`/nutrition/foods/${foodId}`)
  },
  /** Create a new food. Admin or specialist. */
  createFood(payload: Partial<Food> & { Largadescripcion: string }): Promise<{ food: Food }> {
    return api.post<{ food: Food }>('/nutrition/foods', payload)
  },
  /** Update an existing food. Admin or specialist. */
  updateFood(foodId: number, payload: Partial<Food>): Promise<{ food: Food }> {
    return api.put<{ food: Food }>(`/nutrition/foods/${foodId}`, payload)
  },
  /** Delete a food. Admin only. */
  deleteFood(foodId: number): Promise<{ id: number }> {
    return api.delete<{ id: number }>(`/nutrition/foods/${foodId}`)
  },
  getFoodPortions(foodId: number): Promise<{ portions: FoodPortion[] }> {
    return api.get<{ portions: FoodPortion[] }>(`/nutrition/foods/${foodId}/portions`)
  },
  /** POST /nutrition/foods/rechange — alimentos equivalentes por macros (Fitia). */
  rechange(payload: RechangePayload): Promise<RechangeResponse> {
    return api.post<RechangeResponse>('/nutrition/foods/rechange', payload)
  },
  listFoodGroups(): Promise<{ groups: FoodGroup[] }> {
    return api.get<{ groups: FoodGroup[] }>('/nutrition/food-groups')
  },
  /** Catalog with `foods` grouped by `group_id`. Larger response than
   *  `listFoodGroups`; use when you need both lists in one round-trip. */
  foodGroupsCatalog(): Promise<{ groups: Array<FoodGroup & { foods: Food[] }> }> {
    return api.get<{ groups: Array<FoodGroup & { foods: Food[] }> }>('/nutrition/food-groups/catalog')
  },

  /* ──────────────── Recipes (CRUD) ──────────────── */

  listRecipes(opts: { q?: string; meal_key?: MealKey; is_public?: 0 | 1 } = {}): Promise<RecipesResponse> {
    return api.get<RecipesResponse>(`/nutrition/recipes${qs(opts)}`)
  },
  getRecipe(recipeId: number): Promise<Recipe> {
    return api.get<Recipe>(`/nutrition/recipes/${recipeId}`)
  },
  createRecipe(payload: Partial<Recipe> & { nombre: string }): Promise<Recipe> {
    return api.post<Recipe>('/nutrition/recipes', payload)
  },
  updateRecipe(recipeId: number, payload: Partial<Recipe>): Promise<Recipe> {
    return api.put<Recipe>(`/nutrition/recipes/${recipeId}`, payload)
  },
  deleteRecipe(recipeId: number): Promise<{ id: number }> {
    return api.delete<{ id: number }>(`/nutrition/recipes/${recipeId}`)
  },
  /** Computes the recipe's macros from its `ingredientes_json` (per the
   *  current ALIMENTOS rows). Useful after editing an ingredient list. */
  calculateRecipe(recipeId: number): Promise<{ proteina: number; grasa: number; carbohidratos: number; calorias: number }> {
    return api.post<{ proteina: number; grasa: number; carbohidratos: number; calorias: number }>(
      `/nutrition/recipes/${recipeId}/calculate`,
    )
  },

  /* ──────────────── Meal-plan block presets ──────────────── */

  /** Catalog of block presets (per meal_key + size). */
  listBlocks(opts: { meal_key?: MealKey; size?: string } = {}): Promise<MealPlanBlocksResponse> {
    return api.get<MealPlanBlocksResponse>(`/nutrition/meal-plans/blocks${qs(opts)}`)
  },
  /** Suggested blocks for a target macro profile. */
  blockSuggestions(opts: { meal_key?: MealKey; size?: string; plan_id?: number } = {}): Promise<MealPlanBlocksResponse> {
    return api.get<MealPlanBlocksResponse>(`/nutrition/meal-plans/blocks/suggestions${qs(opts)}`)
  },
  /** Scale a block's ingredients to fit a new macro target. */
  adjustBlock(payload: { block_id: number; target?: { proteina?: number; grasa?: number; carbohidratos?: number } }) {
    return api.post('/nutrition/meal-plans/blocks/adjust', payload)
  },
  saveFavoriteBlock(payload: { nombre: string; meal_key: MealKey; size?: string; alimentos: unknown }) {
    return api.post<{ id: number }>('/nutrition/meal-plans/blocks/favorites', payload)
  },
  updateFavoriteBlock(favId: number, payload: Partial<{ nombre: string; size: string; alimentos: unknown }>) {
    return api.patch<{ id: number }>(`/nutrition/meal-plans/blocks/favorites/${favId}`, payload)
  },
  deleteFavoriteBlock(favId: number) {
    return api.delete<{ id: number }>(`/nutrition/meal-plans/blocks/favorites/${favId}`)
  },
  /** Free-form constructor — composes a block from a list of foods + targets. */
  constructorBlock(payload: { meal_key: MealKey; alimentos: unknown[]; target: { proteina: number; grasa: number; carbohidratos: number } }) {
    return api.post('/nutrition/meal-plans/blocks/constructor', payload)
  },

  /* ──────────────── Library / shopping list / calculation ──────────────── */

  library(opts: { q?: string; only_favorites?: 0 | 1 } = {}): Promise<MealPlanLibraryResponse> {
    return api.get<MealPlanLibraryResponse>(`/nutrition/meal-plans/library${qs(opts)}`)
  },
  toggleLibraryFavorite(presetId: number, favorite: boolean) {
    return favorite
      ? api.post<{ id: number; is_favorite: true }>(`/nutrition/meal-plans/library/${presetId}/favorite`)
      : api.delete<{ id: number; is_favorite: false }>(`/nutrition/meal-plans/library/${presetId}/favorite`)
  },
  /** Recompute per-meal block details from the persisted plan config. */
  calculatePlan(planId: number) {
    return api.get<SaveConfigResponse['blocks']>(`/nutrition/meal-plans/${planId}/calculate`)
  },
  shoppingList(planId: number): Promise<ShoppingListResponse> {
    return api.get<ShoppingListResponse>(`/nutrition/meal-plans/${planId}/shopping-list`)
  },
  /** GET /nutrition/meal-plans — legacy meal-plan list endpoint (kept for
   *  compat alongside the newer `/plans`). */
  listMealPlans(opts: { patient?: string } = {}): Promise<{ plans: NutritionPlan[]; total: number }> {
    return api.get<{ plans: NutritionPlan[]; total: number }>(`/nutrition/meal-plans${qs({ patient: opts.patient })}`)
  },
  /** POST /nutrition/meal-plans — create a legacy meal plan shell. */
  createMealPlan(payload: Partial<NutritionPlan> & { nombre_apellido?: string }) {
    return api.post<{ id: number }>('/nutrition/meal-plans', payload)
  },

  /* ──────────────── Weekly diet survey ──────────────── */

  submitDietSurvey(payload: {
    groups: Record<string, { porciones_semana?: number; tipo?: string }>
    notas?: string
    patient?: string
  }) {
    return api.post<{
      id: number; patient_id: number; fecha: string;
      groups: Record<string, unknown>; notas?: string
    }>('/nutrition/diet-survey', payload)
  },
  getDietSurveys(opts: { patient?: string; limit?: number } = {}) {
    return api.get<{
      surveys: Array<{
        id: number; patient_id: number; fecha: string;
        groups: Record<string, { porciones_semana?: number; tipo?: string }>;
        notas?: string; created_at: string
      }>
      total: number
    }>(`/nutrition/diet-survey${qs({ patient: opts.patient, limit: opts.limit })}`)
  },
}
