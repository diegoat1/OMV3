/**
 * Health Score General
 * 
 * Combina scores de nutrición, entrenamiento y datos de salud
 */

import { NutritionScoreResult, NutritionCategory } from './nutrition-score';
import { TrainingScoreResult, TrainingCategory } from './training-score';

/**
 * Datos de salud para el score
 */
export interface HealthData {
  // Completitud de datos (0-30 puntos)
  has_weight: boolean;
  has_measurements: boolean;
  has_body_composition: boolean;
  
  // Métricas en rango (0-25 puntos)
  bf_in_range: boolean;        // % grasa en rango saludable
  ffmi_in_range: boolean;      // FFMI en rango normal+
  weight_stable: boolean;      // Peso estable (sin fluctuaciones extremas)
}

/**
 * Resultado del Health Score
 */
export interface HealthScoreResult {
  score: number;              // Score 0-100
  category: HealthCategory;
  components: {
    data_completeness: number;  // 0-30 puntos
    nutrition: number;          // 0-25 puntos
    training: number;           // 0-25 puntos
    metrics_in_range: number;   // 0-20 puntos
  };
  breakdown: {
    nutrition_score: number;
    training_score: number;
    data_score: number;
    metrics_score: number;
  };
  status: HealthStatus;
  recommendations: string[];
}

export type HealthCategory = 
  | 'excellent'   // 85-100
  | 'good'        // 70-84
  | 'average'     // 50-69
  | 'needs_work'  // 30-49
  | 'poor';       // 0-29

export type HealthStatus = 
  | 'optimal'
  | 'on_track'
  | 'needs_attention'
  | 'at_risk';

/**
 * Calcula el Health Score combinando todos los componentes
 * 
 * Componentes del score (100 puntos total):
 * - Completitud de datos: 30 puntos
 * - Score de nutrición: 25 puntos
 * - Score de entrenamiento: 25 puntos
 * - Métricas en rango: 20 puntos
 * 
 * @param nutritionScore - Resultado del score de nutrición
 * @param trainingScore - Resultado del score de entrenamiento
 * @param healthData - Datos de salud adicionales
 * @returns Health Score combinado
 */
export function calcularHealthScore(
  nutritionScore: NutritionScoreResult | null,
  trainingScore: TrainingScoreResult | null,
  healthData: HealthData
): HealthScoreResult {
  // Completitud de datos (30 puntos)
  let data_completeness = 0;
  if (healthData.has_weight) data_completeness += 10;
  if (healthData.has_measurements) data_completeness += 10;
  if (healthData.has_body_composition) data_completeness += 10;

  // Score de nutrición (25 puntos)
  const nutrition_raw = nutritionScore?.score ?? 0;
  const nutrition_points = Math.round((nutrition_raw / 100) * 25);

  // Score de entrenamiento (25 puntos)
  const training_raw = trainingScore?.score ?? 0;
  const training_points = Math.round((training_raw / 100) * 25);

  // Métricas en rango (20 puntos)
  let metrics_in_range = 0;
  if (healthData.bf_in_range) metrics_in_range += 8;
  if (healthData.ffmi_in_range) metrics_in_range += 7;
  if (healthData.weight_stable) metrics_in_range += 5;

  // Score total
  const score = data_completeness + nutrition_points + training_points + metrics_in_range;

  // Categoría
  const category = getCategory(score);

  // Status
  const status = getStatus(score, healthData);

  // Recomendaciones
  const recommendations = generarRecomendaciones(
    nutritionScore,
    trainingScore,
    healthData,
    score
  );

  return {
    score,
    category,
    components: {
      data_completeness,
      nutrition: nutrition_points,
      training: training_points,
      metrics_in_range,
    },
    breakdown: {
      nutrition_score: nutrition_raw,
      training_score: training_raw,
      data_score: Math.round((data_completeness / 30) * 100),
      metrics_score: Math.round((metrics_in_range / 20) * 100),
    },
    status,
    recommendations,
  };
}

function getCategory(score: number): HealthCategory {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'average';
  if (score >= 30) return 'needs_work';
  return 'poor';
}

function getStatus(score: number, healthData: HealthData): HealthStatus {
  if (score >= 80 && healthData.bf_in_range && healthData.ffmi_in_range) {
    return 'optimal';
  }
  if (score >= 60) {
    return 'on_track';
  }
  if (score >= 40) {
    return 'needs_attention';
  }
  return 'at_risk';
}

function generarRecomendaciones(
  nutritionScore: NutritionScoreResult | null,
  trainingScore: TrainingScoreResult | null,
  healthData: HealthData,
  totalScore: number
): string[] {
  const recs: string[] = [];

  // Priorizar completitud de datos
  if (!healthData.has_weight) {
    recs.push('Registra tu peso regularmente');
  }
  if (!healthData.has_measurements) {
    recs.push('Actualiza tus medidas corporales');
  }
  if (!healthData.has_body_composition) {
    recs.push('Realiza un análisis de composición corporal');
  }

  // Agregar recomendaciones de nutrición si el score es bajo
  if (nutritionScore && nutritionScore.score < 60) {
    recs.push(...nutritionScore.recommendations.slice(0, 2));
  }

  // Agregar recomendaciones de entrenamiento si el score es bajo
  if (trainingScore && trainingScore.score < 60) {
    recs.push(...trainingScore.recommendations.slice(0, 2));
  }

  // Métricas fuera de rango
  if (!healthData.bf_in_range) {
    recs.push('Tu % de grasa corporal está fuera del rango óptimo');
  }
  if (!healthData.weight_stable) {
    recs.push('Estabiliza tu peso con hábitos consistentes');
  }

  // Limitar a 5 recomendaciones
  if (recs.length > 5) {
    return recs.slice(0, 5);
  }

  if (recs.length === 0) {
    recs.push('¡Excelente! Mantén estos buenos hábitos de salud');
  }

  return recs;
}

/**
 * Obtiene el color del semáforo para el Health Score
 * 
 * @param score - Health Score (0-100)
 * @returns Color del semáforo
 */
export function getHealthScoreColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 70) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

/**
 * Formatea el Health Score para mostrar
 * 
 * @param score - Health Score (0-100)
 * @returns String formateado
 */
export function formatHealthScore(score: number): string {
  if (score >= 85) return `${score} - Excelente`;
  if (score >= 70) return `${score} - Bueno`;
  if (score >= 50) return `${score} - Regular`;
  if (score >= 30) return `${score} - Necesita mejoras`;
  return `${score} - Bajo`;
}
