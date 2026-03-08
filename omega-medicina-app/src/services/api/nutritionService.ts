// Nutrition Service - Plans, foods, recipes, meal plans

import { apiClient } from './apiClient';
import { API_CONFIG } from './config';

const { ENDPOINTS } = API_CONFIG;

export interface NutritionPlan {
  id: number;
  nombre_apellido: string;
  calorias: number;
  proteina: number;
  grasa: number;
  carbohidratos: number;
  factor_actividad?: number;
  fecha_creacion?: string;
  comidas?: Record<string, { proteina: number; grasa: number; carbohidratos: number }>;
}

export interface Food {
  id: number;
  nombre: string;
  proteina: number;
  grasa: number;
  carbohidratos: number;
  fibra?: number;
  grupo1?: string;
  porcion1?: number;
  grupo2?: string;
  porcion2?: number;
}

export interface FoodPortion {
  nombre: string;
  gramos: number;
}

export interface Recipe {
  id: number;
  nombre: string;
  ingredientes?: string;
  preparacion?: string;
  proteina?: number;
  grasa?: number;
  carbohidratos?: number;
}

export interface MealPlan {
  id: number;
  user_dni: number;
  tipo_plan: string;
  plan_json: string;
  activo: boolean;
  calorias_totales?: number;
  comidas_activas?: number;
  total_recetas?: number;
  fecha_creacion?: string;
}

export interface MealMacros {
  proteina: number;
  grasa: number;
  carbohidratos: number;
}

export interface MealBlocks {
  calorias: number;
  proteina_total: number;
  grasa_total: number;
  ch_total: number;
  libertad: number;
  comidas: Record<string, {
    porcentajes: MealMacros;
    gramos: MealMacros;
  }>;
}

export interface MealPlanCalculation {
  plan_id: number;
  calculations: Record<string, {
    macros_comida: MealMacros;
    recetas: Array<{ recipe_id: number; calculation: any }>;
  }>;
}

export interface ShoppingListItem {
  ingrediente: string;
  cantidad_g: number;
  en_recetas: string[];
}

export interface ShoppingList {
  shopping_list: ShoppingListItem[];
  total_ingredientes: number;
  total_recetas: number;
}

// ---- Plan Alimentario: Bloques Types ----

export interface MacroBlocks {
  proteina: number;
  grasa: number;
  carbohidratos: number;
  resumen?: string;
}

export interface BlockPreset {
  id: number;
  comida: string;
  bloques: MacroBlocks;
  gramos?: { proteina: number; grasa: number; carbohidratos: number };
  alias: string;
  descripcion?: string;
  tipo?: string;
  timestamp?: string;
  tipo_ajuste?: string;
  valor_ajuste?: number;
}

export interface BlockAdjustResult {
  comida: string;
  ajuste_aplicado: Record<string, number>;
  resultado: {
    bloques: MacroBlocks;
    gramos: { proteina: number; grasa: number; carbohidratos: number };
    porcentajes: { proteina: number; grasa: number; carbohidratos: number };
  };
}

export interface BlockSuggestionsResult {
  sugerencias: {
    presets_globales: BlockPreset[];
    favoritos_usuario: BlockPreset[];
    ajustes_recientes: BlockPreset[];
  };
  libertad: number;
  bloques_config: { proteina: number; grasa: number; carbohidratos: number };
}

export interface LibraryItem {
  id: number;
  comida: string;
  alias: string;
  descripcion: string;
  bloques: MacroBlocks;
  gramos: { proteina: number; grasa: number; carbohidratos: number };
  creador_username: string;
  favoritos_total: number;
  detalle_json?: string;
  fecha_creacion?: string;
  tipo: string;
}

export interface FoodCatalogItem {
  categoria: string;
  descripcion: string;
  porcion_gramos: number;
  bloques_unitarios: MacroBlocks;
  gramos_porcion: { proteina: number; grasa: number; carbohidratos: number };
  macro_dominante: string;
  macros_fuertes: string[];
  momentos: string[];
}

export interface AutoPlanVelocityOption {
  nombre: string;
  velocidad_semanal_kg: number;
  porcentaje_peso: string;
  calorias: number;
  deficit_diario?: number;
  superavit_diario?: number;
  semanas_estimadas: number;
  riesgo_masa_magra?: string;
  descripcion: string;
  macros: {
    proteina_g: number;
    grasa_g: number;
    carbohidratos_g: number;
    proteina_porcentaje: number;
    grasa_porcentaje: number;
    carbohidratos_porcentaje: number;
  };
  disponibilidad_energetica: {
    ea_valor: number;
    ea_status: string;
  };
}

export interface AutoPlanResult {
  datos_actuales: { peso: number; peso_magro: number; peso_graso: number; bf: number; ffmi: number };
  objetivo: { peso: number; peso_magro: number; peso_graso: number; bf: number; ffmi: number };
  cambios_necesarios: { peso: number; grasa: number; musculo: number };
  tipo_objetivo: 'perdida' | 'ganancia' | 'mantenimiento';
  tdee_mantenimiento: number;
  tmb: number;
  factor_actividad: number;
  opciones_velocidad: AutoPlanVelocityOption[];
  metadata: { sexo: string; edad: number; altura: number; fecha_calculo: string };
}

// ---- Daily Log Types ----

export interface DailyMealLog {
  meal_key: string;
  recipe_id?: number | null;
  recipe_name?: string | null;
  foods_json?: any;
  completed: boolean;
  total_p: number;
  total_g: number;
  total_c: number;
  total_cal: number;
  target_p: number;
  target_g: number;
  target_c: number;
  meal_score?: number;
}

export interface DailySummary {
  fecha?: string;
  meals_completed: number;
  meals_total: number;
  total_p: number;
  total_g: number;
  total_c: number;
  total_cal: number;
  target_p: number;
  target_g: number;
  target_c: number;
  target_cal: number;
  daily_score: number;
}

export interface DailyLogResponse {
  fecha: string;
  meals: DailyMealLog[];
  summary: DailySummary | null;
}

export interface DailyLogHistoryResponse {
  summaries: (DailySummary & { fecha: string })[];
  total_days: number;
  average_score: number;
  streak: number;
}

export const nutritionService = {
  // Plans
  async getPlans(userId?: string) {
    const endpoint = userId
      ? `${ENDPOINTS.NUTRITION_PLANS}?user=${userId}`
      : ENDPOINTS.NUTRITION_PLANS;
    return apiClient.get<NutritionPlan[]>(endpoint);
  },

  async getPlan(planId: number) {
    return apiClient.get<NutritionPlan>(ENDPOINTS.NUTRITION_PLAN_DETAIL, { planId: String(planId) });
  },

  async createPlan(data: Partial<NutritionPlan>) {
    return apiClient.post<NutritionPlan>(ENDPOINTS.NUTRITION_PLANS, data);
  },

  async updatePlan(planId: number, data: Partial<NutritionPlan>) {
    return apiClient.put<NutritionPlan>(ENDPOINTS.NUTRITION_PLAN_DETAIL, data, { planId: String(planId) });
  },

  async deletePlan(planId: number) {
    return apiClient.delete<any>(ENDPOINTS.NUTRITION_PLAN_DETAIL, { planId: String(planId) });
  },

  async adjustCalories(planId: number, data: { calorias: number }) {
    return apiClient.post<NutritionPlan>(ENDPOINTS.NUTRITION_PLAN_ADJUST, data, { planId: String(planId) });
  },

  // Foods
  async getFoods(search?: string, perPage: number = 200) {
    let endpoint = `${ENDPOINTS.NUTRITION_FOODS}?per_page=${perPage}`;
    if (search) endpoint += `&q=${encodeURIComponent(search)}`;
    return apiClient.get<Food[]>(endpoint);
  },

  async getFood(foodId: number) {
    return apiClient.get<Food>(ENDPOINTS.NUTRITION_FOOD_DETAIL, { foodId: String(foodId) });
  },

  async getFoodPortions(foodId: number) {
    return apiClient.get<FoodPortion[]>(ENDPOINTS.NUTRITION_FOOD_PORTIONS, { foodId: String(foodId) });
  },

  async getFoodGroups() {
    return apiClient.get<any[]>(ENDPOINTS.NUTRITION_FOOD_GROUPS);
  },

  // Recipes
  async getRecipes(search?: string) {
    const endpoint = search
      ? `${ENDPOINTS.NUTRITION_RECIPES}?q=${encodeURIComponent(search)}`
      : ENDPOINTS.NUTRITION_RECIPES;
    return apiClient.get<Recipe[]>(endpoint);
  },

  async getRecipe(recipeId: number) {
    return apiClient.get<Recipe>(ENDPOINTS.NUTRITION_RECIPE_DETAIL, { recipeId: String(recipeId) });
  },

  async calculateRecipe(recipeId: number, data: { usuario?: string; comida?: string; proteina?: number; grasa?: number; carbohidratos?: number; libertad?: number }) {
    return apiClient.post<any>(ENDPOINTS.NUTRITION_RECIPE_CALCULATE, data, { recipeId: String(recipeId) });
  },

  // Calculate day - solve recipes for one or all meals
  async calculateDay(recetas: Record<string, number[]>, comida?: string) {
    return apiClient.post<any>(ENDPOINTS.NUTRITION_CALCULATE_DAY, { recetas, comida });
  },

  // Meal Plans
  async getMealPlans(userId?: string) {
    const endpoint = userId
      ? `${ENDPOINTS.NUTRITION_MEAL_PLANS}?user=${userId}`
      : ENDPOINTS.NUTRITION_MEAL_PLANS;
    return apiClient.get<MealPlan[]>(endpoint);
  },

  async createMealPlan(data: Partial<MealPlan>) {
    return apiClient.post<MealPlan>(ENDPOINTS.NUTRITION_MEAL_PLANS, data);
  },

  // Meal Blocks - per-meal macro distribution from DIETA
  async getMealBlocks() {
    return apiClient.get<MealBlocks>(ENDPOINTS.NUTRITION_MEAL_BLOCKS);
  },

  // Auto-calculate all recipes in a meal plan
  async calculateMealPlan(planId: number) {
    return apiClient.get<MealPlanCalculation>(ENDPOINTS.NUTRITION_MEAL_PLAN_CALCULATE, { planId: String(planId) });
  },

  // Shopping list from a meal plan
  async getShoppingList(planId: number) {
    return apiClient.get<ShoppingList>(ENDPOINTS.NUTRITION_MEAL_PLAN_SHOPPING, { planId: String(planId) });
  },

  // Auto-calculate nutritional plan based on current data + goals (for self)
  async autoCalculatePlan(factorActividad?: number) {
    return apiClient.post<AutoPlanResult>(ENDPOINTS.NUTRITION_AUTO_CALCULATE, {
      factor_actividad: factorActividad || 1.55,
    });
  },

  // Auto-calculate nutritional plan for a patient (admin/doctor)
  async autoCalculateForPatient(nombreApellido: string, factorActividad?: number) {
    return apiClient.post<AutoPlanResult>(ENDPOINTS.NUTRITION_AUTO_CALCULATE, {
      factor_actividad: factorActividad || 1.55,
      nombre_apellido: nombreApellido,
    });
  },

  // ---- Plan Alimentario: Bloques ----

  async adjustBlocks(comida: string, ajustes: { proteina?: number; grasa?: number; carbohidratos?: number }) {
    return apiClient.post<BlockAdjustResult>(ENDPOINTS.NUTRITION_BLOCKS_ADJUST, { comida, ajustes });
  },

  async getBlockSuggestions(comida?: string) {
    const endpoint = comida
      ? `${ENDPOINTS.NUTRITION_BLOCKS_SUGGESTIONS}?comida=${comida}`
      : ENDPOINTS.NUTRITION_BLOCKS_SUGGESTIONS;
    return apiClient.get<BlockSuggestionsResult>(endpoint);
  },

  async createBlockFavorite(data: { comida: string; proteina: number; grasa: number; carbohidratos: number; alias?: string; descripcion?: string }) {
    return apiClient.post<{ favorito_id: number; favorito: BlockPreset }>(ENDPOINTS.NUTRITION_BLOCKS_FAVORITES, data);
  },

  async updateBlockFavorite(favId: number, data: { alias?: string; descripcion?: string; es_favorita?: boolean; marcar_usada?: boolean }) {
    return apiClient.patch<{ message: string }>(ENDPOINTS.NUTRITION_BLOCKS_FAVORITE_DETAIL, data, { favId: String(favId) });
  },

  async deleteBlockFavorite(favId: number) {
    return apiClient.delete<{ message: string }>(ENDPOINTS.NUTRITION_BLOCKS_FAVORITE_DETAIL, { favId: String(favId) });
  },

  async saveBlockConstructor(data: {
    comida: string;
    alimentos: Array<{ categoria: string; descripcion: string; porciones: number }>;
    alias: string;
    es_publica?: boolean;
  }) {
    return apiClient.post<{ favorito_id: number; bloques_total: MacroBlocks; alimentos_detalle: any[] }>(
      ENDPOINTS.NUTRITION_BLOCKS_CONSTRUCTOR, data
    );
  },

  // ---- Biblioteca ----

  async getLibrary() {
    return apiClient.get<{ biblioteca: LibraryItem[]; total: number }>(ENDPOINTS.NUTRITION_LIBRARY);
  },

  async toggleLibraryFavorite(presetId: number, add: boolean) {
    if (add) {
      return apiClient.post<{ favoritos_total: number; action: string }>(
        ENDPOINTS.NUTRITION_LIBRARY_FAVORITE, {}, { presetId: String(presetId) }
      );
    }
    return apiClient.delete<{ favoritos_total: number; action: string }>(
      ENDPOINTS.NUTRITION_LIBRARY_FAVORITE, { presetId: String(presetId) }
    );
  },

  // ---- Catálogo de alimentos por bloques ----

  async saveMealConfig(comidas: Record<string, { enabled: boolean; size: string }>, entreno?: string | null) {
    return apiClient.post<any>(ENDPOINTS.NUTRITION_SAVE_MEAL_CONFIG, { comidas, entreno: entreno || null });
  },

  async getFoodCatalog(macro?: string, momento?: string) {
    let endpoint = ENDPOINTS.NUTRITION_FOOD_CATALOG;
    const params: string[] = [];
    if (macro) params.push(`macro=${macro}`);
    if (momento) params.push(`momento=${momento}`);
    if (params.length) endpoint += `?${params.join('&')}`;
    return apiClient.get<{ alimentos: FoodCatalogItem[]; total: number }>(endpoint);
  },

  // ---- Daily Log ----

  async saveDailyLog(fecha: string, meals: DailyMealLog[]) {
    return apiClient.post<{ fecha: string; meals_saved: number; meals: any[]; summary: DailySummary }>(
      ENDPOINTS.NUTRITION_DAILY_LOG, { fecha, meals }
    );
  },

  async getDailyLog(fecha?: string) {
    const endpoint = fecha
      ? `${ENDPOINTS.NUTRITION_DAILY_LOG}?fecha=${fecha}`
      : ENDPOINTS.NUTRITION_DAILY_LOG;
    return apiClient.get<DailyLogResponse>(endpoint);
  },

  async getDailyLogHistory(days?: number) {
    const endpoint = days
      ? `${ENDPOINTS.NUTRITION_DAILY_LOG_HISTORY}?days=${days}`
      : ENDPOINTS.NUTRITION_DAILY_LOG_HISTORY;
    return apiClient.get<DailyLogHistoryResponse>(endpoint);
  },

  // ---- Doctor/Admin: patient daily logs ----

  async getDailyLogForPatient(nombreApellido: string, fecha?: string) {
    let endpoint = `${ENDPOINTS.NUTRITION_DAILY_LOG}?nombre_apellido=${encodeURIComponent(nombreApellido)}`;
    if (fecha) endpoint += `&fecha=${fecha}`;
    return apiClient.get<DailyLogResponse>(endpoint);
  },

  async getDailyLogHistoryForPatient(nombreApellido: string, days?: number) {
    let endpoint = `${ENDPOINTS.NUTRITION_DAILY_LOG_HISTORY}?nombre_apellido=${encodeURIComponent(nombreApellido)}`;
    if (days) endpoint += `&days=${days}`;
    return apiClient.get<DailyLogHistoryResponse>(endpoint);
  },

  async saveDailyLogForPatient(nombreApellido: string, fecha: string, meals: DailyMealLog[]) {
    return apiClient.post<{ fecha: string; meals_saved: number; meals: any[]; summary: DailySummary }>(
      ENDPOINTS.NUTRITION_DAILY_LOG, { fecha, meals, nombre_apellido: nombreApellido }
    );
  },
};
