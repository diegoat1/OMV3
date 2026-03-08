/**
 * Cálculo de Energía (Sistema E)
 * 
 * Fuente: docs/nutricion/implementacion_bloques_energia.md líneas 306-332
 * Fuente: src/functions.py líneas 4566-4573
 */

import {
  BLOQUE_ENERGIA,
  KCAL_POR_GRAMO_PROTEINA,
  KCAL_POR_GRAMO_GRASA,
  KCAL_POR_GRAMO_CARBOHIDRATO,
} from './constants';
import { redondearAMedioBloque } from './blocks';

/**
 * Resultado del cálculo de energía
 */
export interface EnergyResult {
  kcal_total: number;           // Energía total (P+G+C)
  kcal_gc: number;              // Energía solo de G+C (para modo Proteína)
  bloques_total: number;        // Bloques E redondeados a 0.5
  bloques_gc: number;           // Bloques E de G+C redondeados a 0.5
  bloques_total_decimal: number; // Bloques E exactos
  bloques_gc_decimal: number;    // Bloques E de G+C exactos
  bloque_kcal: number;          // Constante: 100 kcal por bloque
}

/**
 * Calcula la energía total y bloques de energía
 * 
 * Fuente: docs/nutricion/implementacion_bloques_energia.md líneas 306-320
 * 
 * Fórmulas:
 * - kcal_total = (P_gramos × 4) + (G_gramos × 9) + (C_gramos × 4)
 * - kcal_gc = (G_gramos × 9) + (C_gramos × 4)
 * - bloques_E = kcal / 100
 * 
 * @param proteina_g - Gramos de proteína
 * @param grasa_g - Gramos de grasa
 * @param carbohidratos_g - Gramos de carbohidratos
 * @returns Objeto con kcal y bloques de energía
 */
export function calcularEnergia(
  proteina_g: number,
  grasa_g: number,
  carbohidratos_g: number
): EnergyResult {
  // Calcular kcal totales
  // Fuente: docs/nutricion/implementacion_bloques_energia.md líneas 309-311
  const kcal_total = 
    (proteina_g * KCAL_POR_GRAMO_PROTEINA) +
    (grasa_g * KCAL_POR_GRAMO_GRASA) +
    (carbohidratos_g * KCAL_POR_GRAMO_CARBOHIDRATO);

  // Calcular kcal solo de G+C (para modo Proteína)
  const kcal_gc = 
    (grasa_g * KCAL_POR_GRAMO_GRASA) +
    (carbohidratos_g * KCAL_POR_GRAMO_CARBOHIDRATO);

  // Calcular bloques de energía
  // Fuente: docs/nutricion/implementacion_bloques_energia.md líneas 315-318
  const bloques_total_decimal = kcal_total / BLOQUE_ENERGIA;
  const bloques_gc_decimal = kcal_gc / BLOQUE_ENERGIA;

  // Redondear a pasos de 0.5
  // Fuente: docs/nutricion/implementacion_bloques_energia.md líneas 320-332
  const bloques_total = redondearAMedioBloque(bloques_total_decimal);
  const bloques_gc = redondearAMedioBloque(bloques_gc_decimal);

  return {
    kcal_total: Math.round(kcal_total * 10) / 10,
    kcal_gc: Math.round(kcal_gc * 10) / 10,
    bloques_total,
    bloques_gc,
    bloques_total_decimal: Math.round(bloques_total_decimal * 100) / 100,
    bloques_gc_decimal: Math.round(bloques_gc_decimal * 100) / 100,
    bloque_kcal: BLOQUE_ENERGIA,
  };
}

/**
 * Calcula kcal a partir de macros en gramos
 * 
 * @param proteina_g - Gramos de proteína
 * @param grasa_g - Gramos de grasa
 * @param carbohidratos_g - Gramos de carbohidratos
 * @returns Total de kcal
 */
export function calcularKcal(
  proteina_g: number,
  grasa_g: number,
  carbohidratos_g: number
): number {
  return (
    (proteina_g * KCAL_POR_GRAMO_PROTEINA) +
    (grasa_g * KCAL_POR_GRAMO_GRASA) +
    (carbohidratos_g * KCAL_POR_GRAMO_CARBOHIDRATO)
  );
}

/**
 * Calcula kcal de alcohol (si hay diferencia entre energía reportada y calculada)
 * 
 * Fuente: src/functions.py líneas 4540-4544
 * 
 * @param energia_reportada - Energía reportada en la etiqueta
 * @param proteina_g - Gramos de proteína
 * @param grasa_g - Gramos de grasa
 * @param carbohidratos_g - Gramos de carbohidratos
 * @returns Objeto con kcal de alcohol y gramos estimados
 */
export function detectarAlcohol(
  energia_reportada: number,
  proteina_g: number,
  grasa_g: number,
  carbohidratos_g: number
): { kcal_alcohol: number; gramos_alcohol: number } | null {
  const kcal_macros = calcularKcal(proteina_g, grasa_g, carbohidratos_g);
  const kcal_alcohol = Math.max(0, energia_reportada - kcal_macros);

  if (kcal_alcohol < 0.1) {
    return null;
  }

  // 1g alcohol = 7 kcal
  const gramos_alcohol = kcal_alcohol / 7;

  return {
    kcal_alcohol: Math.round(kcal_alcohol * 10) / 10,
    gramos_alcohol: Math.round(gramos_alcohol * 10) / 10,
  };
}

/**
 * Convierte bloques de energía a kcal
 * 
 * @param bloques - Cantidad de bloques E
 * @returns kcal equivalentes
 */
export function bloquesEAKcal(bloques: number): number {
  return bloques * BLOQUE_ENERGIA;
}

/**
 * Convierte kcal a bloques de energía (redondeado a 0.5)
 * 
 * @param kcal - Cantidad de kcal
 * @returns Bloques E redondeados
 */
export function kcalABloquesE(kcal: number): number {
  return redondearAMedioBloque(kcal / BLOQUE_ENERGIA);
}

/**
 * Formatea energía según el modo de complejidad
 * 
 * Fuente: docs/nutricion/implementacion_bloques_energia.md líneas 339-356
 * 
 * @param proteina_bloques - Bloques de proteína
 * @param grasa_bloques - Bloques de grasa
 * @param carbohidratos_bloques - Bloques de carbohidratos
 * @param modo - Modo de visualización ('completo' | 'proteina' | 'calorias')
 * @returns String formateado según el modo
 */
export function formatearSegunModo(
  proteina_bloques: number,
  grasa_bloques: number,
  carbohidratos_bloques: number,
  modo: 'completo' | 'proteina' | 'calorias'
): string {
  // Calcular energía desde bloques (aproximado)
  const proteina_g = proteina_bloques * 20;
  const grasa_g = grasa_bloques * 10;
  const carbohidratos_g = carbohidratos_bloques * 25;
  const energia = calcularEnergia(proteina_g, grasa_g, carbohidratos_g);

  switch (modo) {
    case 'completo':
      // Modo Completo: "2P · 2G · 1C"
      return `${proteina_bloques.toFixed(1)}P · ${grasa_bloques.toFixed(1)}G · ${carbohidratos_bloques.toFixed(1)}C`;

    case 'proteina':
      // Modo Proteína: "2P · 3.8E"
      return `${proteina_bloques.toFixed(1)}P · ${energia.bloques_gc.toFixed(1)}E`;

    case 'calorias':
      // Modo Calorías: "5.4E"
      return `${energia.bloques_total.toFixed(1)}E`;

    default:
      return `${proteina_bloques.toFixed(1)}P · ${grasa_bloques.toFixed(1)}G · ${carbohidratos_bloques.toFixed(1)}C`;
  }
}
