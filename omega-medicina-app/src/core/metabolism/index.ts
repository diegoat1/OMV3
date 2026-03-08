/**
 * Core Metabolism Module
 * 
 * Cálculos metabólicos y de composición corporal migrados de ONV2
 */

// Constantes
export * from './constants';

// Cálculo de BMR
export {
  katchMcArdle,
  katchMcArdleMetric,
  mifflinStJeor,
  harrisBenedict,
  calcularBMR,
  type BMRResult,
} from './bmr';

// Cálculo de TDEE
export {
  calcularTDEE,
  calcularTDEECompleto,
  calcularCaloriasObjetivo,
  estimarCambioPesoSemanal,
  calcularDeficitMaximoSeguro,
  calcularGananciaMaximaMuscular,
  type TDEEResult,
} from './tdee';

// Composición corporal
export {
  calcularFFMI,
  calcularFFMINormalizado,
  getCategoriaFFMI,
  getCategoriaBF,
  calcularBFNavy,
  calcularComposicionCorporal,
  calcularPesoObjetivo,
  calcularGrasaAPerder,
  type BodyCompositionResult,
} from './composition';

// Disponibilidad Energética (EA) y reglas LEA/RED-S
export {
  calcularEA,
  getCategoriaEA,
  evaluarRiesgoEA,
  calcularIngestaMinimaSegura,
  analizarEA,
  calcularDeficitMaximoSeguro as calcularDeficitSeguro,
  calcularSuperavitGanancia,
  calcularProteinaRecomendada,
  validarPlanCalorico,
  type EAResult,
} from './energy-availability';

// Hidratación - Cálculo de agua recomendada
export {
  calcularAguaRecomendada,
  getActivityLevelDescription,
  formatHydrationRecommendation,
  type ActivityLevel,
  type HydrationInput,
  type HydrationResult,
} from './hydration';

// Missing Data - Detección de datos faltantes
export {
  getMissingInputsForMetric,
  getAllMissingData,
  getCalculableMetrics,
  getPrioritizedMissingInputs,
  type MetricName,
  type UserProfileInputs,
  type MissingDataResult,
  type MissingInput,
} from './missing-data';
