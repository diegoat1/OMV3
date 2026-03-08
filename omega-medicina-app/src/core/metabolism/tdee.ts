/**
 * Cálculo de TDEE (Total Daily Energy Expenditure)
 * 
 * Fuente: src/templates/caloriescal.html líneas 493-501
 */

import { ACTIVITY_FACTORS, ActivityLevel } from './constants';
import { calcularBMR, BMRResult } from './bmr';

/**
 * Resultado del cálculo de TDEE
 */
export interface TDEEResult {
  tdee: number;                    // TDEE en kcal/día
  bmr: number;                     // BMR base
  activity_factor: number;         // Factor de actividad usado
  activity_level: ActivityLevel;   // Nivel de actividad
}

/**
 * Calcula el TDEE (gasto energético total diario)
 * 
 * Fuente: src/templates/caloriescal.html línea 501
 * Fórmula: TDEE = BMR × factor_actividad
 * 
 * @param bmr - Tasa metabólica basal en kcal/día
 * @param activityLevel - Nivel de actividad física
 * @returns Objeto con TDEE y detalles del cálculo
 */
export function calcularTDEE(bmr: number, activityLevel: ActivityLevel): TDEEResult {
  const factor = ACTIVITY_FACTORS[activityLevel];
  const tdee = bmr * factor;

  return {
    tdee: Math.round(tdee),
    bmr,
    activity_factor: factor,
    activity_level: activityLevel,
  };
}

/**
 * Calcula TDEE completo desde datos del usuario
 * 
 * @param params - Parámetros del usuario
 * @returns Objeto con TDEE, BMR y detalles
 */
export function calcularTDEECompleto(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: 'M' | 'F';
  activityLevel: ActivityLevel;
  leanMassKg?: number;
  bodyFatPercent?: number;
}): TDEEResult & { bmr_result: BMRResult } {
  const { activityLevel, ...bmrParams } = params;

  // Calcular BMR
  const bmrResult = calcularBMR(bmrParams);

  // Calcular TDEE
  const tdeeResult = calcularTDEE(bmrResult.bmr, activityLevel);

  return {
    ...tdeeResult,
    bmr_result: bmrResult,
  };
}

/**
 * Calcula las calorías objetivo según el objetivo del usuario
 * 
 * @param tdee - TDEE calculado
 * @param objetivo - Tipo de objetivo ('deficit', 'mantenimiento', 'superavit')
 * @param porcentaje - Porcentaje de ajuste (ej: 20 para -20% en déficit)
 * @returns Calorías objetivo
 */
export function calcularCaloriasObjetivo(
  tdee: number,
  objetivo: 'deficit' | 'mantenimiento' | 'superavit',
  porcentaje: number = 20
): {
  calorias: number;
  diferencia: number;
  porcentaje_ajuste: number;
} {
  let calorias: number;
  let diferencia: number;

  switch (objetivo) {
    case 'deficit':
      diferencia = -Math.round(tdee * (porcentaje / 100));
      calorias = tdee + diferencia;
      break;
    case 'superavit':
      diferencia = Math.round(tdee * (porcentaje / 100));
      calorias = tdee + diferencia;
      break;
    case 'mantenimiento':
    default:
      diferencia = 0;
      calorias = tdee;
      break;
  }

  return {
    calorias,
    diferencia,
    porcentaje_ajuste: objetivo === 'mantenimiento' ? 0 : porcentaje,
  };
}

/**
 * Estima el cambio de peso semanal basado en el déficit/superávit calórico
 * 
 * Regla: 7700 kcal ≈ 1 kg de peso corporal
 * 
 * @param diferenciaDiaria - Diferencia calórica diaria (negativo = déficit)
 * @returns Cambio de peso estimado en kg/semana
 */
export function estimarCambioPesoSemanal(diferenciaDiaria: number): number {
  const diferenciaSemanal = diferenciaDiaria * 7;
  const cambioPeso = diferenciaSemanal / 7700;
  return Math.round(cambioPeso * 100) / 100;
}

/**
 * Calcula el déficit máximo seguro basado en la masa grasa
 * 
 * Fuente: src/main.py líneas 103-112
 * Regla: Máximo 31 kcal/día por kg de grasa corporal
 * 
 * @param fatMassKg - Masa grasa en kilogramos
 * @returns Déficit máximo seguro en kcal/día
 */
export function calcularDeficitMaximoSeguro(fatMassKg: number): number {
  // Máximo 31 kcal/día por kg de grasa
  // Fuente: src/main.py línea 104
  return Math.round(fatMassKg * 31);
}

/**
 * Calcula la tasa máxima de ganancia muscular
 * 
 * Fuente: src/main.py líneas 117-122
 * Regla: masa_magra / 268 = kg/semana máximo
 * 
 * @param leanMassKg - Masa magra en kilogramos
 * @param sex - Sexo biológico ('M' o 'F')
 * @returns Ganancia máxima en kg/semana
 */
export function calcularGananciaMaximaMuscular(
  leanMassKg: number,
  sex: 'M' | 'F'
): number {
  // Fuente: src/main.py líneas 117-122
  const tasaBase = leanMassKg / 268;

  // Las mujeres tienen aproximadamente la mitad de potencial de ganancia
  if (sex === 'F') {
    return Math.round(tasaBase * 0.5 * 100) / 100;
  }

  return Math.round(tasaBase * 100) / 100;
}
