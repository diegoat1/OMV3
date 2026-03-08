/**
 * Hydration Module - Cálculo de agua recomendada diaria
 * 
 * MVP: Fórmula base 35 ml/kg/día con ajustes por actividad
 * TODO: Buscar fórmula más precisa en literatura científica si existe en legacy
 */

// Niveles de actividad física para ajuste de hidratación
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

// Factores de ajuste por actividad (multiplicadores sobre la base)
const ACTIVITY_HYDRATION_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.0,      // Sin ajuste
  light: 1.1,          // +10%
  moderate: 1.2,       // +20%
  active: 1.35,        // +35%
  very_active: 1.5,    // +50%
};

// Constantes MVP
const BASE_ML_PER_KG = 35; // ml por kg de peso corporal por día
const MIN_WATER_LITERS = 1.5; // Mínimo absoluto
const MAX_WATER_LITERS = 5.0; // Máximo razonable

export interface HydrationInput {
  weight: number;           // kg
  activityLevel?: ActivityLevel;
  isHotClimate?: boolean;   // Ajuste +15% si hace calor
  isPregnant?: boolean;     // Ajuste +300ml
  isBreastfeeding?: boolean; // Ajuste +700ml
}

export interface HydrationResult {
  recommendedLiters: number;
  recommendedMl: number;
  minLiters: number;
  maxLiters: number;
  breakdown: {
    baseMl: number;
    activityAdjustmentMl: number;
    climateAdjustmentMl: number;
    specialAdjustmentMl: number;
  };
  formula: string;
  isEstimate: boolean; // true = MVP, false = fórmula validada
}

/**
 * Calcula la cantidad de agua recomendada diaria
 * 
 * Fórmula MVP: 35 ml/kg/día × factor_actividad × ajustes
 * 
 * @param input - Datos del usuario
 * @returns Resultado con litros recomendados y breakdown
 */
export function calcularAguaRecomendada(input: HydrationInput): HydrationResult {
  const { 
    weight, 
    activityLevel = 'light', 
    isHotClimate = false,
    isPregnant = false,
    isBreastfeeding = false
  } = input;

  // Base: 35 ml/kg
  const baseMl = weight * BASE_ML_PER_KG;

  // Ajuste por actividad
  const activityFactor = ACTIVITY_HYDRATION_FACTORS[activityLevel];
  const activityAdjustmentMl = baseMl * (activityFactor - 1);

  // Ajuste por clima caluroso (+15%)
  const climateAdjustmentMl = isHotClimate ? baseMl * 0.15 : 0;

  // Ajustes especiales
  let specialAdjustmentMl = 0;
  if (isPregnant) specialAdjustmentMl += 300;
  if (isBreastfeeding) specialAdjustmentMl += 700;

  // Total
  const totalMl = baseMl + activityAdjustmentMl + climateAdjustmentMl + specialAdjustmentMl;
  
  // Convertir a litros y aplicar límites
  let recommendedLiters = totalMl / 1000;
  recommendedLiters = Math.max(MIN_WATER_LITERS, Math.min(MAX_WATER_LITERS, recommendedLiters));

  // Redondear a 1 decimal
  recommendedLiters = Math.round(recommendedLiters * 10) / 10;

  return {
    recommendedLiters,
    recommendedMl: Math.round(recommendedLiters * 1000),
    minLiters: MIN_WATER_LITERS,
    maxLiters: MAX_WATER_LITERS,
    breakdown: {
      baseMl: Math.round(baseMl),
      activityAdjustmentMl: Math.round(activityAdjustmentMl),
      climateAdjustmentMl: Math.round(climateAdjustmentMl),
      specialAdjustmentMl: Math.round(specialAdjustmentMl),
    },
    formula: `${BASE_ML_PER_KG} ml/kg × ${weight}kg × ${activityFactor} = ${Math.round(totalMl)} ml`,
    isEstimate: true, // MVP - marcar como estimación
  };
}

/**
 * Obtiene descripción del nivel de actividad
 */
export function getActivityLevelDescription(level: ActivityLevel): string {
  switch (level) {
    case 'sedentary': return 'Sedentario (poco o nada de ejercicio)';
    case 'light': return 'Ligero (ejercicio 1-3 días/semana)';
    case 'moderate': return 'Moderado (ejercicio 3-5 días/semana)';
    case 'active': return 'Activo (ejercicio 6-7 días/semana)';
    case 'very_active': return 'Muy activo (ejercicio intenso diario)';
  }
}

/**
 * Formatea la recomendación de agua para mostrar
 */
export function formatHydrationRecommendation(liters: number): string {
  if (liters < 2) return `${liters.toFixed(1)}L - Aumenta tu ingesta`;
  if (liters < 2.5) return `${liters.toFixed(1)}L - Nivel adecuado`;
  if (liters < 3.5) return `${liters.toFixed(1)}L - Buena hidratación`;
  return `${liters.toFixed(1)}L - Alta demanda`;
}
