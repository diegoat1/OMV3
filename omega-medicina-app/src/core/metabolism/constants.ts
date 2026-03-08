/**
 * Constantes del Sistema Metabólico
 * 
 * Fuente: src/templates/caloriescal.html líneas 493-499
 * Fuente: src/functions.py líneas 1159-1232
 */

// Factores de actividad para TDEE
// Fuente: src/templates/caloriescal.html líneas 493-499
export const ACTIVITY_FACTORS = {
  sedentary: 1.2,      // Poco o ningún ejercicio
  light: 1.375,        // Ejercicio ligero 1-3 días/semana
  moderate: 1.55,      // Ejercicio moderado 3-5 días/semana
  intense: 1.725,      // Ejercicio intenso 6-7 días/semana
  very_intense: 1.9,   // Ejercicio muy intenso, trabajo físico
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_FACTORS;

export const ACTIVITY_LEVEL_NAMES: Record<ActivityLevel, string> = {
  sedentary: 'Sedentario',
  light: 'Ligero',
  moderate: 'Moderado',
  intense: 'Intenso',
  very_intense: 'Muy Intenso',
};

export const ACTIVITY_LEVEL_DESCRIPTIONS: Record<ActivityLevel, string> = {
  sedentary: 'Poco o ningún ejercicio, trabajo de escritorio',
  light: 'Ejercicio ligero 1-3 días/semana',
  moderate: 'Ejercicio moderado 3-5 días/semana',
  intense: 'Ejercicio intenso 6-7 días/semana',
  very_intense: 'Ejercicio muy intenso o trabajo físico demandante',
};

// Rangos de FFMI por sexo
// Fuente: src/functions.py líneas 1164-1203
export const FFMI_RANGES_MALE = [15, 17, 18.5, 20, 21.5, 23, 25, 28] as const;
export const FFMI_RANGES_FEMALE = [12, 13, 14.5, 16, 17.5, 19, 21, 24] as const;

export const FFMI_CATEGORIES = [
  'Muy Pobre',
  'Pobre',
  'Bajo',
  'Casi Normal',
  'Normal',
  'Bueno',
  'Muy Bueno',
  'Excelente',
  'Superior',
] as const;

export type FFMICategory = typeof FFMI_CATEGORIES[number];

// Límites FFMI naturales (sin esteroides)
// Fuente: src/functions.py líneas 1224, 1232
export const FFMI_LIMITE_NATURAL_MALE = 25.0;
export const FFMI_LIMITE_NATURAL_FEMALE = 21.0;

// Rangos de % grasa corporal por sexo
// Fuente: src/functions.py líneas 1218-1233
export const BF_RANGES_MALE = {
  essential: 3,
  elite: 6,
  athletic: 10,
  fitness: 15,
  average: 20,
  overweight: 25,
  obese: 30,
} as const;

export const BF_RANGES_FEMALE = {
  essential: 12,
  elite: 14,
  athletic: 18,
  fitness: 22,
  average: 30,
  overweight: 35,
  obese: 40,
} as const;

export type BFCategory = 
  | 'Essential'
  | 'Elite'
  | 'Athletic'
  | 'Fitness'
  | 'Average'
  | 'Overweight'
  | 'Obese';

// Sexo biológico para cálculos
export type BiologicalSex = 'M' | 'F';

// Constantes para cálculo de tasa de pérdida/ganancia
// Fuente: src/main.py líneas 103-122
export const MAX_KCAL_DEFICIT_PER_KG_FAT = 31; // kcal/día por kg de grasa
export const LEAN_GAIN_DIVISOR = 268; // kg magro / 268 = kg/semana máximo

/**
 * Umbrales de Disponibilidad Energética (EA) por sexo
 * Fuente: docs/nutricion/planner_automatico_implementacion.md líneas 39-60
 * 
 * EA = (ingesta_kcal - gasto_ejercicio) / kg_FFM
 */
export const EA_THRESHOLDS_FEMALE = {
  optimal: 45,      // ≥45 kcal/kg FFM/día - Óptima
  adequate: 30,     // 30-45 kcal/kg FFM/día - Adecuada
  low: 25,          // 25-30 kcal/kg FFM/día - Límite bajo
  reds: 25,         // <25 kcal/kg FFM/día - Riesgo RED-S
} as const;

export const EA_THRESHOLDS_MALE = {
  optimal: 35,      // ≥35 kcal/kg FFM/día - Óptima
  adequate: 25,     // 25-35 kcal/kg FFM/día - Adecuada
  low: 20,          // 20-25 kcal/kg FFM/día - Límite bajo
  lea: 20,          // <20 kcal/kg FFM/día - Riesgo LEA
} as const;

/**
 * Categorías de EA
 */
export type EACategory = 
  | 'optimal'       // Óptima - sin restricciones
  | 'adequate'      // Adecuada - monitorear
  | 'low'           // Baja - precaución
  | 'risk';         // Riesgo RED-S/LEA - intervención necesaria

/**
 * Velocidades de pérdida de peso seguras (% peso corporal/semana)
 * Fuente: docs/nutricion/planner_automatico_implementacion.md líneas 24-37
 */
export const WEIGHT_LOSS_RATES = {
  conservative: 0.25,  // Máxima preservación muscular
  moderate: 0.50,      // Equilibrio óptimo (RECOMENDADA)
  aggressive: 0.75,    // Mayor riesgo de pérdida de FFM
} as const;

export const WEIGHT_GAIN_RATES = {
  conservative: 0.25,  // Mínima ganancia de grasa
  moderate: 0.50,      // Mayor velocidad, más grasa
} as const;

/**
 * Fórmula de proteína del sistema ONV2
 * Fuente: docs/nutricion/planner_automatico_implementacion.md línea 83
 */
export const PROTEIN_MULTIPLIER_FFM = 2.513244; // g proteína por kg FFM
