/**
 * Cálculos de Composición Corporal
 * 
 * Fuente: src/functions.py líneas 1159-1350
 * Fuente: src/main.py líneas 96-101
 */

import {
  FFMI_RANGES_MALE,
  FFMI_RANGES_FEMALE,
  FFMI_CATEGORIES,
  FFMI_LIMITE_NATURAL_MALE,
  FFMI_LIMITE_NATURAL_FEMALE,
  BF_RANGES_MALE,
  BF_RANGES_FEMALE,
  FFMICategory,
  BFCategory,
  BiologicalSex,
} from './constants';

/**
 * Resultado del cálculo de composición corporal
 */
export interface BodyCompositionResult {
  weight_kg: number;           // Peso total
  lean_mass_kg: number;        // Masa magra (libre de grasa)
  fat_mass_kg: number;         // Masa grasa
  body_fat_percent: number;    // % de grasa corporal
  ffmi: number;                // Fat-Free Mass Index
  ffmi_category: FFMICategory; // Categoría de FFMI
  bf_category: BFCategory;     // Categoría de % grasa
  is_natural_limit: boolean;   // Si está cerca del límite natural
}

/**
 * Calcula el FFMI (Fat-Free Mass Index)
 * 
 * Fuente: src/functions.py línea 1240
 * Fórmula: FFMI = masa_magra_kg / (altura_m)²
 * 
 * @param leanMassKg - Masa magra en kilogramos
 * @param heightCm - Altura en centímetros
 * @returns FFMI redondeado a 1 decimal
 */
export function calcularFFMI(leanMassKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  const ffmi = leanMassKg / (heightM * heightM);
  return Math.round(ffmi * 10) / 10;
}

/**
 * Calcula el FFMI normalizado (ajustado a altura de 1.80m)
 * 
 * Fórmula: FFMI_norm = FFMI + 6.1 × (1.80 - altura_m)
 * 
 * @param leanMassKg - Masa magra en kilogramos
 * @param heightCm - Altura en centímetros
 * @returns FFMI normalizado
 */
export function calcularFFMINormalizado(leanMassKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  const ffmi = leanMassKg / (heightM * heightM);
  const ffmiNorm = ffmi + 6.1 * (1.80 - heightM);
  return Math.round(ffmiNorm * 10) / 10;
}

/**
 * Obtiene la categoría de FFMI según el sexo
 * 
 * Fuente: src/functions.py líneas 1159-1203
 * 
 * Categorías Hombres: [15, 17, 18.5, 20, 21.5, 23, 25, 28]
 * Categorías Mujeres: [12, 13, 14.5, 16, 17.5, 19, 21, 24]
 * 
 * @param ffmi - Valor de FFMI
 * @param sex - Sexo biológico ('M' o 'F')
 * @returns Categoría de FFMI
 */
export function getCategoriaFFMI(ffmi: number, sex: BiologicalSex): FFMICategory {
  const ranges = sex === 'M' ? FFMI_RANGES_MALE : FFMI_RANGES_FEMALE;

  for (let i = 0; i < ranges.length; i++) {
    if (ffmi < ranges[i]) {
      return FFMI_CATEGORIES[i];
    }
  }

  return 'Superior';
}

/**
 * Obtiene la categoría de % grasa corporal según el sexo
 * 
 * @param bodyFatPercent - % de grasa corporal
 * @param sex - Sexo biológico ('M' o 'F')
 * @returns Categoría de grasa corporal
 */
export function getCategoriaBF(bodyFatPercent: number, sex: BiologicalSex): BFCategory {
  const ranges = sex === 'M' ? BF_RANGES_MALE : BF_RANGES_FEMALE;

  if (bodyFatPercent < ranges.essential) return 'Essential';
  if (bodyFatPercent < ranges.elite) return 'Elite';
  if (bodyFatPercent < ranges.athletic) return 'Athletic';
  if (bodyFatPercent < ranges.fitness) return 'Fitness';
  if (bodyFatPercent < ranges.average) return 'Average';
  if (bodyFatPercent < ranges.overweight) return 'Overweight';
  return 'Obese';
}

/**
 * Calcula el % de grasa corporal usando el método Navy
 * 
 * Fuente: src/main.py líneas 96-101
 * 
 * Hombres: BF% = 495 / (1.0324 - 0.19077×log10(cintura-cuello) + 0.15456×log10(altura)) - 450
 * Mujeres: BF% = 495 / (1.29579 - 0.35004×log10(cadera+cintura-cuello) + 0.221×log10(altura)) - 450
 * 
 * @param params - Medidas antropométricas
 * @returns % de grasa corporal
 */
export function calcularBFNavy(params: {
  sex: BiologicalSex;
  heightCm: number;
  waistCm: number;      // Cintura
  neckCm: number;       // Cuello
  hipCm?: number;       // Cadera (solo mujeres)
}): number {
  const { sex, heightCm, waistCm, neckCm, hipCm } = params;

  let bf: number;

  if (sex === 'M') {
    // Fórmula para hombres
    // Fuente: src/main.py línea 97
    bf = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
  } else {
    // Fórmula para mujeres (requiere cadera)
    // Fuente: src/main.py línea 100
    const hip = hipCm || waistCm; // Fallback si no hay cadera
    bf = 495 / (1.29579 - 0.35004 * Math.log10(hip + waistCm - neckCm) + 0.221 * Math.log10(heightCm)) - 450;
  }

  // Limitar a rango válido
  bf = Math.max(3, Math.min(60, bf));

  return Math.round(bf * 10) / 10;
}

/**
 * Calcula la composición corporal completa
 * 
 * @param params - Datos del usuario
 * @returns Composición corporal completa
 */
export function calcularComposicionCorporal(params: {
  weightKg: number;
  heightCm: number;
  sex: BiologicalSex;
  bodyFatPercent?: number;
  waistCm?: number;
  neckCm?: number;
  hipCm?: number;
}): BodyCompositionResult {
  const { weightKg, heightCm, sex, bodyFatPercent, waistCm, neckCm, hipCm } = params;

  // Calcular % grasa si no se proporciona
  let bf = bodyFatPercent;
  if (bf === undefined && waistCm && neckCm) {
    bf = calcularBFNavy({ sex, heightCm, waistCm, neckCm, hipCm });
  }

  // Default si no hay datos
  if (bf === undefined) {
    bf = sex === 'M' ? 20 : 28; // Valores promedio
  }

  // Calcular masas
  const fat_mass_kg = weightKg * (bf / 100);
  const lean_mass_kg = weightKg - fat_mass_kg;

  // Calcular FFMI
  const ffmi = calcularFFMI(lean_mass_kg, heightCm);
  const ffmi_category = getCategoriaFFMI(ffmi, sex);
  const bf_category = getCategoriaBF(bf, sex);

  // Verificar si está cerca del límite natural
  const limite = sex === 'M' ? FFMI_LIMITE_NATURAL_MALE : FFMI_LIMITE_NATURAL_FEMALE;
  const is_natural_limit = ffmi >= limite * 0.95;

  return {
    weight_kg: weightKg,
    lean_mass_kg: Math.round(lean_mass_kg * 100) / 100,
    fat_mass_kg: Math.round(fat_mass_kg * 100) / 100,
    body_fat_percent: bf,
    ffmi,
    ffmi_category,
    bf_category,
    is_natural_limit,
  };
}

/**
 * Calcula el peso objetivo para un % de grasa deseado
 * 
 * @param currentLeanMassKg - Masa magra actual
 * @param targetBFPercent - % de grasa objetivo
 * @returns Peso objetivo en kg
 */
export function calcularPesoObjetivo(
  currentLeanMassKg: number,
  targetBFPercent: number
): number {
  // Peso = masa_magra / (1 - bf%)
  const peso = currentLeanMassKg / (1 - targetBFPercent / 100);
  return Math.round(peso * 10) / 10;
}

/**
 * Calcula la masa grasa a perder para llegar a un % objetivo
 * 
 * @param currentWeightKg - Peso actual
 * @param currentBFPercent - % grasa actual
 * @param targetBFPercent - % grasa objetivo
 * @returns Kg de grasa a perder
 */
export function calcularGrasaAPerder(
  currentWeightKg: number,
  currentBFPercent: number,
  targetBFPercent: number
): number {
  const currentFatKg = currentWeightKg * (currentBFPercent / 100);
  const currentLeanKg = currentWeightKg - currentFatKg;

  // Peso objetivo manteniendo masa magra
  const targetWeightKg = currentLeanKg / (1 - targetBFPercent / 100);
  const targetFatKg = targetWeightKg * (targetBFPercent / 100);

  return Math.round((currentFatKg - targetFatKg) * 10) / 10;
}
