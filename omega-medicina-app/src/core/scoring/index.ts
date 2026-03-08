/**
 * Core Scoring Module
 * 
 * Sistema de puntuación para tracking de salud, nutrición y entrenamiento
 */

// Score de Nutrición
export {
  calcularScoreNutricion,
  calcularScoreDia,
  type DietLogEntry,
  type NutritionScoreResult,
  type NutritionCategory,
} from './nutrition-score';

// Score de Entrenamiento
export {
  calcularScoreEntrenamiento,
  calcularVolumenSemanal,
  calcularCargaEntrenamiento,
  type TrainingLogEntry,
  type TrainingScoreResult,
  type TrainingCategory,
  type TrainingType,
  type TrainingGoals,
} from './training-score';

// Health Score
export {
  calcularHealthScore,
  getHealthScoreColor,
  formatHealthScore,
  type HealthData,
  type HealthScoreResult,
  type HealthCategory,
  type HealthStatus,
} from './health-score';
