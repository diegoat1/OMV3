/**
 * Sistema de Macros Fuertes
 * 
 * Fuente: docs/cambios/correccion_macros_fuertes.md
 * Fuente: src/functions.py líneas 4356-4383
 */

import { UMBRAL_MACRO_FUERTE, MacroType } from './constants';

/**
 * Valores de macronutrientes en gramos
 */
export interface MacroValues {
  P: number; // Proteína en gramos
  G: number; // Grasa en gramos
  C: number; // Carbohidratos en gramos
}

/**
 * Resultado del análisis de macros
 */
export interface MacroAnalysis {
  macro_dominante: MacroType;      // Macro con mayor valor
  macros_fuertes: MacroType[];     // Macros que superan el umbral 80%
  valores: MacroValues;            // Valores originales
  valor_maximo: number;            // Valor máximo entre los 3 macros
  umbral: number;                  // Umbral calculado (80% del máximo)
}

/**
 * Calcula el macro dominante (el de mayor valor)
 * 
 * @param macros - Objeto con valores de P, G, C en gramos
 * @returns El macro con mayor valor ('P', 'G', o 'C')
 */
export function getMacroDominante(macros: MacroValues): MacroType {
  const { P, G, C } = macros;

  if (P >= G && P >= C) return 'P';
  if (G >= P && G >= C) return 'G';
  return 'C';
}

/**
 * Calcula los macros "fuertes" de un alimento
 * 
 * Un macro es "fuerte" si su valor es ≥ 80% del valor máximo.
 * Esto permite clasificar alimentos balanceados (como el huevo)
 * en múltiples categorías.
 * 
 * Fuente: docs/cambios/correccion_macros_fuertes.md líneas 39-60
 * 
 * Ejemplo (Huevo):
 * - P: 12.6g, G: 12.3g, C: 1.2g
 * - Máximo: 12.6
 * - Umbral (80%): 10.08
 * - Macros fuertes: ['P', 'G'] (ambos ≥ 10.08)
 * 
 * @param macros - Objeto con valores de P, G, C en gramos
 * @param umbral - Porcentaje del máximo para considerar "fuerte" (default 0.80)
 * @returns Array de macros que superan el umbral
 */
export function calcularMacrosFuertes(
  macros: MacroValues,
  umbral: number = UMBRAL_MACRO_FUERTE
): MacroType[] {
  const { P, G, C } = macros;

  // 1. Identificar el máximo
  const valor_maximo = Math.max(P, G, C);

  // Si todos son 0, retornar array vacío
  if (valor_maximo === 0) {
    return [];
  }

  // 2. Calcular umbral (80% del máximo)
  const umbral_valor = valor_maximo * umbral;

  // 3. Incluir todas las macros que superen el umbral
  const macros_fuertes: MacroType[] = [];

  if (P >= umbral_valor) macros_fuertes.push('P');
  if (G >= umbral_valor) macros_fuertes.push('G');
  if (C >= umbral_valor) macros_fuertes.push('C');

  return macros_fuertes;
}

/**
 * Analiza completamente los macros de un alimento
 * 
 * @param macros - Objeto con valores de P, G, C en gramos
 * @returns Análisis completo con dominante, fuertes, valores y umbrales
 */
export function analizarMacros(macros: MacroValues): MacroAnalysis {
  const valor_maximo = Math.max(macros.P, macros.G, macros.C);
  const umbral = valor_maximo * UMBRAL_MACRO_FUERTE;

  return {
    macro_dominante: getMacroDominante(macros),
    macros_fuertes: calcularMacrosFuertes(macros),
    valores: macros,
    valor_maximo,
    umbral,
  };
}

/**
 * Verifica si un alimento es "fuerte" en un macro específico
 * 
 * @param macros - Objeto con valores de P, G, C en gramos
 * @param macro - Macro a verificar ('P', 'G', o 'C')
 * @returns true si el alimento es fuerte en ese macro
 */
export function esFuerteEn(macros: MacroValues, macro: MacroType): boolean {
  const macros_fuertes = calcularMacrosFuertes(macros);
  return macros_fuertes.includes(macro);
}

/**
 * Filtra alimentos por macro fuerte
 * 
 * Fuente: docs/cambios/correccion_macros_fuertes.md líneas 96-103
 * 
 * @param alimentos - Array de alimentos con sus macros
 * @param macro - Macro por el cual filtrar
 * @returns Alimentos que son fuertes en ese macro
 */
export function filtrarPorMacroFuerte<T extends { macros: MacroValues }>(
  alimentos: T[],
  macro: MacroType
): T[] {
  return alimentos.filter((alimento) => esFuerteEn(alimento.macros, macro));
}

/**
 * Calcula el balance de macros (proporción relativa)
 * 
 * @param macros - Objeto con valores de P, G, C en gramos
 * @returns Objeto con porcentajes de cada macro
 */
export function calcularBalanceMacros(macros: MacroValues): {
  P_pct: number;
  G_pct: number;
  C_pct: number;
} {
  const total = macros.P + macros.G + macros.C;

  if (total === 0) {
    return { P_pct: 0, G_pct: 0, C_pct: 0 };
  }

  return {
    P_pct: Math.round((macros.P / total) * 100),
    G_pct: Math.round((macros.G / total) * 100),
    C_pct: Math.round((macros.C / total) * 100),
  };
}

/**
 * Calcula el balance calórico de macros (por kcal, no por gramos)
 * 
 * @param macros - Objeto con valores de P, G, C en gramos
 * @returns Objeto con porcentajes calóricos de cada macro
 */
export function calcularBalanceCalorico(macros: MacroValues): {
  P_pct: number;
  G_pct: number;
  C_pct: number;
} {
  const kcal_P = macros.P * 4;
  const kcal_G = macros.G * 9;
  const kcal_C = macros.C * 4;
  const total_kcal = kcal_P + kcal_G + kcal_C;

  if (total_kcal === 0) {
    return { P_pct: 0, G_pct: 0, C_pct: 0 };
  }

  return {
    P_pct: Math.round((kcal_P / total_kcal) * 100),
    G_pct: Math.round((kcal_G / total_kcal) * 100),
    C_pct: Math.round((kcal_C / total_kcal) * 100),
  };
}
