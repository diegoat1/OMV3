/**
 * Core Nutrition Module
 * 
 * Sistema de bloques nutricionales migrado de ONV2
 */

// Constantes
export * from './constants';

// Cálculo de bloques
export {
  redondearAMedioBloque,
  calcularBloques,
  calcularBloquesProteina,
  calcularBloquesGrasa,
  calcularBloquesCarbohidratos,
  calcularMacroBlocks,
  getSemaphoreColor,
  calcularDiferenciaBloques,
  bloquesAGramos,
  gramosABloques,
  dentroDeTolerancia,
  calcularToleranciaDinamica,
  calcularErrorBloques,
  TOLERANCIA_GENERADOR,
  TOLERANCIA_MINIMA,
  type BlockResult,
  type MacroBlocks,
  type SemaphoreColor,
  type ToleranciasBloques,
} from './blocks';

// Cálculo de energía
export {
  calcularEnergia,
  calcularKcal,
  detectarAlcohol,
  bloquesEAKcal,
  kcalABloquesE,
  formatearSegunModo,
  type EnergyResult,
} from './energy';

// Sistema de macros fuertes
export {
  getMacroDominante,
  calcularMacrosFuertes,
  analizarMacros,
  esFuerteEn,
  filtrarPorMacroFuerte,
  calcularBalanceMacros,
  calcularBalanceCalorico,
  type MacroValues,
  type MacroAnalysis,
} from './macros';
