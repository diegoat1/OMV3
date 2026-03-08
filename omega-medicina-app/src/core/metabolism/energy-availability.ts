/**
 * Disponibilidad Energética (EA) y Reglas LEA/RED-S
 * 
 * Fuente: docs/nutricion/planner_automatico_implementacion.md líneas 39-60
 * 
 * EA = (ingesta_kcal - gasto_ejercicio) / kg_FFM
 * 
 * RED-S: Relative Energy Deficiency in Sport (principalmente mujeres)
 * LEA: Low Energy Availability (principalmente hombres)
 */

import {
  EA_THRESHOLDS_FEMALE,
  EA_THRESHOLDS_MALE,
  EACategory,
  BiologicalSex,
  WEIGHT_LOSS_RATES,
  WEIGHT_GAIN_RATES,
  PROTEIN_MULTIPLIER_FFM,
} from './constants';

/**
 * Resultado del cálculo de EA
 */
export interface EAResult {
  ea: number;                    // EA en kcal/kg FFM/día
  category: EACategory;          // Categoría de EA
  status: string;                // Descripción del estado
  isRisk: boolean;               // Si hay riesgo de LEA/RED-S
  riskType: 'none' | 'LEA' | 'RED-S';  // Tipo de riesgo
  recommendation: string;        // Recomendación
  minIntakeKcal: number;         // Ingesta mínima recomendada
}

/**
 * Calcula la Disponibilidad Energética (EA)
 * 
 * Fuente: docs/nutricion/planner_automatico_implementacion.md línea 42
 * Fórmula: EA = (ingesta_kcal - gasto_ejercicio) / kg_FFM
 * 
 * @param intakeKcal - Ingesta calórica diaria
 * @param exerciseKcal - Gasto calórico por ejercicio
 * @param leanMassKg - Masa magra en kg
 * @returns EA en kcal/kg FFM/día
 */
export function calcularEA(
  intakeKcal: number,
  exerciseKcal: number,
  leanMassKg: number
): number {
  if (leanMassKg <= 0) return 0;
  const ea = (intakeKcal - exerciseKcal) / leanMassKg;
  return Math.round(ea * 10) / 10;
}

/**
 * Obtiene la categoría de EA según el sexo
 * 
 * Fuente: docs/nutricion/planner_automatico_implementacion.md líneas 44-56
 * 
 * Mujeres:
 * - Óptima: ≥45 kcal/kg FFM/día
 * - Adecuada: 30-45 kcal/kg FFM/día
 * - Límite bajo: 25-30 kcal/kg FFM/día
 * - Riesgo RED-S: <25 kcal/kg FFM/día
 * 
 * Hombres:
 * - Óptima: ≥35 kcal/kg FFM/día
 * - Adecuada: 25-35 kcal/kg FFM/día
 * - Límite bajo: 20-25 kcal/kg FFM/día
 * - Riesgo LEA: <20 kcal/kg FFM/día
 * 
 * @param ea - Disponibilidad energética
 * @param sex - Sexo biológico
 * @returns Categoría de EA
 */
export function getCategoriaEA(ea: number, sex: BiologicalSex): EACategory {
  const thresholds = sex === 'F' ? EA_THRESHOLDS_FEMALE : EA_THRESHOLDS_MALE;

  if (ea >= thresholds.optimal) return 'optimal';
  if (ea >= thresholds.adequate) return 'adequate';
  if (ea >= thresholds.low) return 'low';
  return 'risk';
}

/**
 * Evalúa el riesgo de LEA/RED-S
 * 
 * Fuente: docs/nutricion/planner_automatico_implementacion.md líneas 58-60
 * - Mujeres: <30 kcal/kg FFM/día → RED-S
 * - Hombres: ~20-30 kcal/kg FFM/día → LEA
 * 
 * @param ea - Disponibilidad energética
 * @param sex - Sexo biológico
 * @returns Tipo de riesgo
 */
export function evaluarRiesgoEA(
  ea: number,
  sex: BiologicalSex
): 'none' | 'LEA' | 'RED-S' {
  if (sex === 'F') {
    // Mujeres: <25 es riesgo RED-S
    if (ea < EA_THRESHOLDS_FEMALE.reds) return 'RED-S';
  } else {
    // Hombres: <20 es riesgo LEA
    if (ea < EA_THRESHOLDS_MALE.lea) return 'LEA';
  }
  return 'none';
}

/**
 * Calcula la ingesta mínima para evitar riesgo de LEA/RED-S
 * 
 * @param leanMassKg - Masa magra en kg
 * @param exerciseKcal - Gasto por ejercicio
 * @param sex - Sexo biológico
 * @returns Ingesta mínima en kcal
 */
export function calcularIngestaMinimaSegura(
  leanMassKg: number,
  exerciseKcal: number,
  sex: BiologicalSex
): number {
  // Usar umbral de EA adecuada (no óptima) como mínimo
  const minEA = sex === 'F' ? EA_THRESHOLDS_FEMALE.adequate : EA_THRESHOLDS_MALE.adequate;
  
  // ingesta = EA × FFM + ejercicio
  const minIntake = minEA * leanMassKg + exerciseKcal;
  return Math.round(minIntake);
}

/**
 * Análisis completo de Disponibilidad Energética
 * 
 * @param params - Parámetros del análisis
 * @returns Resultado completo con categoría, riesgo y recomendaciones
 */
export function analizarEA(params: {
  intakeKcal: number;
  exerciseKcal: number;
  leanMassKg: number;
  sex: BiologicalSex;
}): EAResult {
  const { intakeKcal, exerciseKcal, leanMassKg, sex } = params;

  const ea = calcularEA(intakeKcal, exerciseKcal, leanMassKg);
  const category = getCategoriaEA(ea, sex);
  const riskType = evaluarRiesgoEA(ea, sex);
  const isRisk = riskType !== 'none';
  const minIntakeKcal = calcularIngestaMinimaSegura(leanMassKg, exerciseKcal, sex);

  // Generar status y recomendación según categoría
  let status: string;
  let recommendation: string;

  switch (category) {
    case 'optimal':
      status = 'Disponibilidad energética óptima';
      recommendation = 'Mantener ingesta actual. Condiciones ideales para rendimiento y salud.';
      break;
    case 'adequate':
      status = 'Disponibilidad energética adecuada';
      recommendation = 'Monitorear síntomas de fatiga. Considerar aumentar ingesta si hay entrenamiento intenso.';
      break;
    case 'low':
      status = 'Disponibilidad energética baja - PRECAUCIÓN';
      recommendation = `Aumentar ingesta a mínimo ${minIntakeKcal} kcal/día. Riesgo de afectar rendimiento y salud hormonal.`;
      break;
    case 'risk':
      if (riskType === 'RED-S') {
        status = 'RIESGO RED-S - Deficiencia Energética Relativa';
        recommendation = `URGENTE: Aumentar ingesta a mínimo ${minIntakeKcal} kcal/día. Consultar profesional de salud. Riesgo de amenorrea, osteoporosis, disfunción inmune.`;
      } else {
        status = 'RIESGO LEA - Baja Disponibilidad Energética';
        recommendation = `URGENTE: Aumentar ingesta a mínimo ${minIntakeKcal} kcal/día. Consultar profesional de salud. Riesgo de disfunción hormonal y pérdida muscular.`;
      }
      break;
  }

  return {
    ea,
    category,
    status,
    isRisk,
    riskType,
    recommendation,
    minIntakeKcal,
  };
}

/**
 * Calcula el déficit calórico máximo seguro
 * 
 * Fuente: docs/nutricion/planner_automatico_implementacion.md líneas 24-37
 * Velocidad ≤0.5% del peso/semana preserva mejor la masa magra
 * 
 * @param weightKg - Peso actual en kg
 * @param rate - Velocidad de pérdida ('conservative' | 'moderate' | 'aggressive')
 * @returns Déficit diario máximo en kcal
 */
export function calcularDeficitMaximoSeguro(
  weightKg: number,
  rate: keyof typeof WEIGHT_LOSS_RATES = 'moderate'
): number {
  // Pérdida semanal en kg
  const weeklyLossKg = weightKg * (WEIGHT_LOSS_RATES[rate] / 100);
  
  // 1 kg grasa ≈ 7700 kcal
  const weeklyDeficitKcal = weeklyLossKg * 7700;
  
  // Déficit diario
  return Math.round(weeklyDeficitKcal / 7);
}

/**
 * Calcula el superávit calórico para ganancia muscular
 * 
 * @param weightKg - Peso actual en kg
 * @param rate - Velocidad de ganancia ('conservative' | 'moderate')
 * @returns Superávit diario en kcal
 */
export function calcularSuperavitGanancia(
  weightKg: number,
  rate: keyof typeof WEIGHT_GAIN_RATES = 'conservative'
): number {
  // Ganancia semanal en kg
  const weeklyGainKg = weightKg * (WEIGHT_GAIN_RATES[rate] / 100);
  
  // Aproximadamente 3500-5000 kcal por kg de peso ganado (incluye músculo + algo de grasa)
  // NECESITA DEFINICIÓN: El valor exacto depende de la proporción músculo/grasa esperada
  const kcalPerKgGain = 4000; // Valor intermedio
  
  const weeklySurplusKcal = weeklyGainKg * kcalPerKgGain;
  
  return Math.round(weeklySurplusKcal / 7);
}

/**
 * Calcula la proteína recomendada según FFM
 * 
 * Fuente: docs/nutricion/planner_automatico_implementacion.md línea 83
 * Fórmula: Proteína = 2.513244 × FFM_kg
 * 
 * @param leanMassKg - Masa magra en kg
 * @returns Proteína recomendada en gramos
 */
export function calcularProteinaRecomendada(leanMassKg: number): number {
  return Math.round(PROTEIN_MULTIPLIER_FFM * leanMassKg);
}

/**
 * Valida si un plan calórico es seguro
 * 
 * @param params - Parámetros del plan
 * @returns Objeto con validación y advertencias
 */
export function validarPlanCalorico(params: {
  intakeKcal: number;
  tdee: number;
  leanMassKg: number;
  sex: BiologicalSex;
  exerciseKcal?: number;
}): {
  isValid: boolean;
  warnings: string[];
  eaAnalysis: EAResult;
} {
  const { intakeKcal, tdee, leanMassKg, sex, exerciseKcal = 0 } = params;

  const warnings: string[] = [];
  const eaAnalysis = analizarEA({ intakeKcal, exerciseKcal, leanMassKg, sex });

  // Verificar EA
  if (eaAnalysis.isRisk) {
    warnings.push(`⚠️ ${eaAnalysis.status}`);
  } else if (eaAnalysis.category === 'low') {
    warnings.push(`⚠️ EA baja: ${eaAnalysis.ea} kcal/kg FFM`);
  }

  // Verificar déficit extremo
  const deficit = tdee - intakeKcal;
  if (deficit > 1000) {
    warnings.push('⚠️ Déficit mayor a 1000 kcal/día - riesgo de pérdida muscular');
  }

  // Verificar ingesta mínima absoluta
  const minAbsolute = sex === 'F' ? 1200 : 1500;
  if (intakeKcal < minAbsolute) {
    warnings.push(`⚠️ Ingesta menor a ${minAbsolute} kcal - no recomendado sin supervisión médica`);
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    eaAnalysis,
  };
}
