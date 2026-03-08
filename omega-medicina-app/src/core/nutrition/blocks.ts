/**
 * Cálculo de Bloques Nutricionales
 * 
 * Fuente: src/functions.py líneas 4453-4458, 4531-4538
 * Documentación: docs/cambios/correccion_bloques_decimales.md
 */

import {
  BLOQUE_PROTEINA,
  BLOQUE_GRASA,
  BLOQUE_CARBOHIDRATOS,
  TOLERANCIA_BLOQUES_VERDE,
  TOLERANCIA_BLOQUES_AMARILLO,
  MacroType,
} from './constants';

/**
 * Resultado del cálculo de bloques
 */
export interface BlockResult {
  bloques: number;          // Entero redondeado (para UI)
  bloques_decimal: number;  // Decimal con 2 decimales (para cálculos/generador)
  gramos_objetivo: number;  // Gramos originales
  gramos_originales: number;
}

/**
 * Resultado de bloques para los 3 macros
 */
export interface MacroBlocks {
  proteina: BlockResult;
  grasa: BlockResult;
  carbohidratos: BlockResult;
  resumen: string; // Ej: "1.7P · 2.0G · 1.1C"
}

/**
 * Color del semáforo para feedback visual
 */
export type SemaphoreColor = 'green' | 'yellow' | 'red';

/**
 * Redondea un valor a pasos de 0.5
 * 
 * Fuente: src/functions.py líneas 4453-4458
 * Ejemplos: 0.3 → 0.5, 0.7 → 0.5, 1.2 → 1.0, 1.8 → 2.0, 2.3 → 2.5
 * 
 * @param valor - Valor a redondear
 * @returns Valor redondeado a 0.5
 */
export function redondearAMedioBloque(valor: number): number {
  return Math.round(valor * 2) / 2;
}

/**
 * Calcula bloques a partir de gramos
 * 
 * Fuente: src/functions.py líneas 4531-4538
 * Documentación: docs/cambios/correccion_bloques_decimales.md líneas 44-54
 * 
 * @param gramos - Cantidad en gramos
 * @param gramosPorBloque - Gramos por bloque (20 para P, 10 para G, 25 para C)
 * @returns Objeto con bloques enteros, decimales y gramos
 */
export function calcularBloques(gramos: number, gramosPorBloque: number): BlockResult {
  if (gramos === 0 || gramosPorBloque === 0) {
    return {
      bloques: 0,
      bloques_decimal: 0,
      gramos_objetivo: 0,
      gramos_originales: 0,
    };
  }

  // Bloques con decimales (precisión para generador)
  // Fuente: docs/cambios/correccion_bloques_decimales.md línea 45
  const bloques_decimal = Math.round((gramos / gramosPorBloque) * 100) / 100;

  // Bloques enteros (visualización)
  // Fuente: docs/cambios/correccion_bloques_decimales.md línea 47
  const bloques_entero = Math.max(1, Math.round(bloques_decimal));

  return {
    bloques: bloques_entero,
    bloques_decimal,
    gramos_objetivo: gramos,
    gramos_originales: gramos,
  };
}

/**
 * Calcula bloques para proteína
 */
export function calcularBloquesProteina(gramos: number): BlockResult {
  return calcularBloques(gramos, BLOQUE_PROTEINA);
}

/**
 * Calcula bloques para grasa
 */
export function calcularBloquesGrasa(gramos: number): BlockResult {
  return calcularBloques(gramos, BLOQUE_GRASA);
}

/**
 * Calcula bloques para carbohidratos
 */
export function calcularBloquesCarbohidratos(gramos: number): BlockResult {
  return calcularBloques(gramos, BLOQUE_CARBOHIDRATOS);
}

/**
 * Calcula bloques para los 3 macronutrientes
 * 
 * @param proteina_g - Gramos de proteína
 * @param grasa_g - Gramos de grasa
 * @param carbohidratos_g - Gramos de carbohidratos
 * @returns Objeto con bloques de cada macro y resumen
 */
export function calcularMacroBlocks(
  proteina_g: number,
  grasa_g: number,
  carbohidratos_g: number
): MacroBlocks {
  const proteina = calcularBloquesProteina(proteina_g);
  const grasa = calcularBloquesGrasa(grasa_g);
  const carbohidratos = calcularBloquesCarbohidratos(carbohidratos_g);

  // Formato de resumen: "1.7P · 2.0G · 1.1C"
  const resumen = `${proteina.bloques_decimal.toFixed(1)}P · ${grasa.bloques_decimal.toFixed(1)}G · ${carbohidratos.bloques_decimal.toFixed(1)}C`;

  return {
    proteina,
    grasa,
    carbohidratos,
    resumen,
  };
}

/**
 * Obtiene el color del semáforo según la diferencia con el objetivo
 * 
 * Fuente: docs/cambios/correccion_bloques_decimales.md líneas 154-161
 * 
 * @param actual - Valor actual de bloques
 * @param objetivo - Valor objetivo de bloques
 * @param toleranciaVerde - Tolerancia para verde (default 0.2)
 * @param toleranciaAmarillo - Tolerancia para amarillo (default 0.5)
 * @returns Color del semáforo
 */
export function getSemaphoreColor(
  actual: number,
  objetivo: number,
  toleranciaVerde: number = TOLERANCIA_BLOQUES_VERDE,
  toleranciaAmarillo: number = TOLERANCIA_BLOQUES_AMARILLO
): SemaphoreColor {
  const diferencia = Math.abs(actual - objetivo);

  if (diferencia <= toleranciaVerde) {
    return 'green';
  }
  if (diferencia <= toleranciaAmarillo) {
    return 'yellow';
  }
  return 'red';
}

/**
 * Calcula la diferencia entre bloques actuales y objetivo
 * 
 * @param actual - Bloques actuales
 * @param objetivo - Bloques objetivo
 * @returns Objeto con diferencia, texto descriptivo y color
 */
export function calcularDiferenciaBloques(
  actual: number,
  objetivo: number
): {
  diferencia: number;
  texto: string;
  color: SemaphoreColor;
} {
  const diferencia = actual - objetivo;
  const color = getSemaphoreColor(actual, objetivo);

  let texto: string;
  if (Math.abs(diferencia) <= TOLERANCIA_BLOQUES_VERDE) {
    texto = '✓ OK';
  } else if (diferencia > 0) {
    texto = `+${diferencia.toFixed(1)} (exceso)`;
  } else {
    texto = `${diferencia.toFixed(1)} (falta)`;
  }

  return { diferencia, texto, color };
}

/**
 * Convierte bloques a gramos
 * 
 * @param bloques - Cantidad de bloques
 * @param macro - Tipo de macro ('P', 'G', 'C')
 * @returns Gramos equivalentes
 */
export function bloquesAGramos(bloques: number, macro: MacroType): number {
  const gramosPorBloque: Record<MacroType, number> = {
    P: BLOQUE_PROTEINA,
    G: BLOQUE_GRASA,
    C: BLOQUE_CARBOHIDRATOS,
  };

  return bloques * gramosPorBloque[macro];
}

/**
 * Convierte gramos a bloques (con redondeo a 0.5)
 * 
 * @param gramos - Cantidad en gramos
 * @param macro - Tipo de macro ('P', 'G', 'C')
 * @returns Bloques redondeados a 0.5
 */
export function gramosABloques(gramos: number, macro: MacroType): number {
  const gramosPorBloque: Record<MacroType, number> = {
    P: BLOQUE_PROTEINA,
    G: BLOQUE_GRASA,
    C: BLOQUE_CARBOHIDRATOS,
  };

  return redondearAMedioBloque(gramos / gramosPorBloque[macro]);
}

/**
 * Tolerancias para el generador de combinaciones
 * Fuente: src/functions.py líneas 4662-4667
 */
export interface ToleranciasBloques {
  proteina: number;
  grasa: number;
  carbohidratos: number;
}

/**
 * Tolerancias por defecto del generador (±0.5 bloques)
 * Fuente: src/functions.py líneas 4662-4667
 */
export const TOLERANCIA_GENERADOR: ToleranciasBloques = {
  proteina: 0.5,      // ±0.5 bloques = ±10g
  grasa: 0.5,         // ±0.5 bloques = ±5g
  carbohidratos: 0.5, // ±0.5 bloques = ±12.5g
};

/**
 * Tolerancia mínima para validación dinámica
 * Fuente: docs/cambios/correccion_validacion_bloques.md línea 109
 */
export const TOLERANCIA_MINIMA = 0.25;

/**
 * Verifica si los bloques están dentro de la tolerancia
 * Fuente: src/functions.py líneas 4745-4753
 * 
 * @param actual - Bloques actuales {proteina, grasa, carbohidratos}
 * @param objetivo - Bloques objetivo
 * @param tolerancia - Tolerancias por macro (default: TOLERANCIA_GENERADOR)
 * @returns true si está dentro de tolerancia
 */
export function dentroDeTolerancia(
  actual: { proteina: number; grasa: number; carbohidratos: number },
  objetivo: { proteina: number; grasa: number; carbohidratos: number },
  tolerancia: ToleranciasBloques = TOLERANCIA_GENERADOR
): boolean {
  const diff_p = Math.abs(actual.proteina - objetivo.proteina);
  const diff_g = Math.abs(actual.grasa - objetivo.grasa);
  const diff_c = Math.abs(actual.carbohidratos - objetivo.carbohidratos);

  return (
    diff_p <= tolerancia.proteina &&
    diff_g <= tolerancia.grasa &&
    diff_c <= tolerancia.carbohidratos
  );
}

/**
 * Calcula tolerancia dinámica basada en libertad del plan
 * Fuente: docs/cambios/correccion_validacion_bloques.md líneas 111-122
 * 
 * Fórmula:
 * - delta_p = max(0.25, bloques_objetivo × (libertad/100) + 0.10)
 * - delta_g = max(0.25, bloques_objetivo × (libertad/100) + 0.10)
 * - delta_c = max(0.25, bloques_objetivo × (libertad/100) + 0.15) // Más permisivo
 * 
 * @param objetivo - Bloques objetivo
 * @param libertadPorcentaje - Libertad del plan (ej: 5 para 5%)
 * @returns Tolerancias calculadas
 */
export function calcularToleranciaDinamica(
  objetivo: { proteina: number; grasa: number; carbohidratos: number },
  libertadPorcentaje: number
): ToleranciasBloques {
  const libertad = libertadPorcentaje / 100;

  return {
    proteina: Math.max(TOLERANCIA_MINIMA, objetivo.proteina * libertad + 0.10),
    grasa: Math.max(TOLERANCIA_MINIMA, objetivo.grasa * libertad + 0.10),
    carbohidratos: Math.max(TOLERANCIA_MINIMA, objetivo.carbohidratos * libertad + 0.15),
  };
}

/**
 * Calcula el error total entre objetivo y resultado
 * Fuente: src/functions.py líneas 4790-4795
 * 
 * @param objetivo - Bloques objetivo
 * @param resultado - Bloques resultado
 * @returns Error total (suma de diferencias absolutas)
 */
export function calcularErrorBloques(
  objetivo: { proteina: number; grasa: number; carbohidratos: number },
  resultado: { proteina: number; grasa: number; carbohidratos: number }
): number {
  const error_p = Math.abs(objetivo.proteina - resultado.proteina);
  const error_g = Math.abs(objetivo.grasa - resultado.grasa);
  const error_c = Math.abs(objetivo.carbohidratos - resultado.carbohidratos);
  return error_p + error_g + error_c;
}
