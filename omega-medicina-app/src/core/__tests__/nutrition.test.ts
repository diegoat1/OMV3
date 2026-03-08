/**
 * Tests Unitarios - Módulo de Nutrición
 * 
 * Golden tests basados en valores de ONV2
 * Fuente: docs/cambios/correccion_bloques_decimales.md
 */

import {
  redondearAMedioBloque,
  calcularBloques,
  calcularMacroBlocks,
  getSemaphoreColor,
  calcularEnergia,
  calcularMacrosFuertes,
  getMacroDominante,
  dentroDeTolerancia,
  calcularToleranciaDinamica,
  calcularErrorBloques,
  gramosABloques,
  BLOQUE_PROTEINA,
  BLOQUE_GRASA,
  BLOQUE_CARBOHIDRATOS,
  TOLERANCIA_GENERADOR,
  TOLERANCIA_MINIMA,
} from '../nutrition';

describe('Nutrition Core - Bloques', () => {
  describe('redondearAMedioBloque', () => {
    // Fuente: docs/nutricion/implementacion_bloques_energia.md líneas 320-332
    it('redondea 0.3 a 0.5', () => {
      expect(redondearAMedioBloque(0.3)).toBe(0.5);
    });

    it('redondea 0.7 a 0.5', () => {
      expect(redondearAMedioBloque(0.7)).toBe(0.5);
    });

    it('redondea 1.2 a 1.0', () => {
      expect(redondearAMedioBloque(1.2)).toBe(1.0);
    });

    it('redondea 1.8 a 2.0', () => {
      expect(redondearAMedioBloque(1.8)).toBe(2.0);
    });

    it('redondea 2.3 a 2.5', () => {
      expect(redondearAMedioBloque(2.3)).toBe(2.5);
    });

    it('redondea 2.7 a 2.5', () => {
      // 2.7 * 2 = 5.4 → round(5.4) = 5 → 5/2 = 2.5
      expect(redondearAMedioBloque(2.7)).toBe(2.5);
    });

    it('redondea 2.8 a 3.0', () => {
      // 2.8 * 2 = 5.6 → round(5.6) = 6 → 6/2 = 3.0
      expect(redondearAMedioBloque(2.8)).toBe(3.0);
    });

    it('mantiene 0 como 0', () => {
      expect(redondearAMedioBloque(0)).toBe(0);
    });

    it('mantiene valores exactos', () => {
      expect(redondearAMedioBloque(1.5)).toBe(1.5);
      expect(redondearAMedioBloque(2.0)).toBe(2.0);
    });
  });

  describe('calcularBloques', () => {
    // Golden test: Caso Diego - Desayuno
    // Fuente: docs/cambios/correccion_bloques_decimales.md líneas 141-148
    it('calcula bloques de proteína correctamente (caso Diego)', () => {
      const result = calcularBloques(33.2, BLOQUE_PROTEINA);
      expect(result.bloques_decimal).toBe(1.66);
      expect(result.bloques).toBe(2); // Entero para UI
      expect(result.gramos_objetivo).toBe(33.2);
    });

    it('calcula bloques de grasa correctamente (caso Diego)', () => {
      const result = calcularBloques(19.9, BLOQUE_GRASA);
      expect(result.bloques_decimal).toBe(1.99);
      expect(result.bloques).toBe(2);
    });

    it('calcula bloques de carbohidratos correctamente (caso Diego)', () => {
      const result = calcularBloques(26.6, BLOQUE_CARBOHIDRATOS);
      expect(result.bloques_decimal).toBe(1.06);
      expect(result.bloques).toBe(1);
    });

    it('maneja 0 gramos correctamente', () => {
      const result = calcularBloques(0, BLOQUE_PROTEINA);
      expect(result.bloques).toBe(0);
      expect(result.bloques_decimal).toBe(0);
    });

    it('garantiza mínimo 1 bloque para valores pequeños', () => {
      const result = calcularBloques(5, BLOQUE_PROTEINA); // 5g = 0.25 bloques
      expect(result.bloques).toBe(1); // Mínimo 1 para UI
      expect(result.bloques_decimal).toBe(0.25);
    });
  });

  describe('calcularMacroBlocks', () => {
    it('genera resumen correcto', () => {
      const result = calcularMacroBlocks(33.2, 19.9, 26.6);
      expect(result.resumen).toBe('1.7P · 2.0G · 1.1C');
    });
  });

  describe('getSemaphoreColor', () => {
    // Fuente: docs/cambios/correccion_bloques_decimales.md líneas 154-161
    it('retorna verde dentro de tolerancia 0.2', () => {
      expect(getSemaphoreColor(1.7, 1.66)).toBe('green');
      expect(getSemaphoreColor(1.5, 1.66)).toBe('green');
    });

    it('retorna amarillo entre 0.2 y 0.5', () => {
      expect(getSemaphoreColor(2.0, 1.5)).toBe('yellow');
      expect(getSemaphoreColor(1.0, 1.4)).toBe('yellow');
    });

    it('retorna rojo fuera de 0.5', () => {
      expect(getSemaphoreColor(2.5, 1.5)).toBe('red');
      expect(getSemaphoreColor(0.5, 1.5)).toBe('red');
    });
  });
});

describe('Nutrition Core - Energía', () => {
  describe('calcularEnergia', () => {
    // Fuente: docs/nutricion/implementacion_bloques_energia.md líneas 339-356
    it('calcula energía total correctamente', () => {
      // Ejemplo: 40g P, 20g G, 50g C
      // kcal = (40*4) + (20*9) + (50*4) = 160 + 180 + 200 = 540
      const result = calcularEnergia(40, 20, 50);
      expect(result.kcal_total).toBe(540);
      expect(result.bloques_total).toBe(5.5); // 540/100 = 5.4 → 5.5
    });

    it('calcula energía G+C correctamente', () => {
      // kcal_gc = (20*9) + (50*4) = 180 + 200 = 380
      const result = calcularEnergia(40, 20, 50);
      expect(result.kcal_gc).toBe(380);
      expect(result.bloques_gc).toBe(4.0); // 380/100 = 3.8 → 4.0
    });

    it('maneja valores cero', () => {
      const result = calcularEnergia(0, 0, 0);
      expect(result.kcal_total).toBe(0);
      expect(result.bloques_total).toBe(0);
    });
  });
});

describe('Nutrition Core - Macros Fuertes', () => {
  describe('calcularMacrosFuertes', () => {
    // Fuente: docs/cambios/correccion_macros_fuertes.md líneas 39-60
    it('clasifica huevo con P y G fuertes', () => {
      // Huevo: P=12.6, G=12.3, C=1.2
      // Máximo: 12.6, Umbral 80%: 10.08
      // P >= 10.08 ✓, G >= 10.08 ✓, C < 10.08 ✗
      const result = calcularMacrosFuertes({ P: 12.6, G: 12.3, C: 1.2 });
      expect(result).toContain('P');
      expect(result).toContain('G');
      expect(result).not.toContain('C');
    });

    it('clasifica queso solo con G fuerte', () => {
      // Queso: P=19.9, G=26.2, C=4.5
      // Máximo: 26.2, Umbral 80%: 20.96
      // P < 20.96 ✗, G >= 20.96 ✓, C < 20.96 ✗
      const result = calcularMacrosFuertes({ P: 19.9, G: 26.2, C: 4.5 });
      expect(result).toEqual(['G']);
    });

    it('clasifica avena solo con C fuerte', () => {
      // Avena: P=2.3, G=2.0, C=12.1
      const result = calcularMacrosFuertes({ P: 2.3, G: 2.0, C: 12.1 });
      expect(result).toEqual(['C']);
    });

    it('maneja valores cero', () => {
      const result = calcularMacrosFuertes({ P: 0, G: 0, C: 0 });
      expect(result).toEqual([]);
    });
  });

  describe('getMacroDominante', () => {
    it('identifica proteína como dominante', () => {
      expect(getMacroDominante({ P: 25, G: 10, C: 5 })).toBe('P');
    });

    it('identifica grasa como dominante', () => {
      expect(getMacroDominante({ P: 10, G: 25, C: 5 })).toBe('G');
    });

    it('identifica carbohidratos como dominante', () => {
      expect(getMacroDominante({ P: 5, G: 10, C: 25 })).toBe('C');
    });

    it('prioriza P en empate P-G', () => {
      expect(getMacroDominante({ P: 10, G: 10, C: 5 })).toBe('P');
    });
  });
});

describe('Nutrition Core - Tolerancias y Validación', () => {
  // Fuente: src/functions.py líneas 4745-4753, 4662-4667
  describe('dentroDeTolerancia', () => {
    it('retorna true cuando está dentro de tolerancia', () => {
      const actual = { proteina: 1.5, grasa: 2.0, carbohidratos: 1.0 };
      const objetivo = { proteina: 1.5, grasa: 2.0, carbohidratos: 1.0 };
      expect(dentroDeTolerancia(actual, objetivo)).toBe(true);
    });

    it('retorna true con diferencia menor a tolerancia', () => {
      const actual = { proteina: 1.7, grasa: 2.3, carbohidratos: 1.2 };
      const objetivo = { proteina: 1.5, grasa: 2.0, carbohidratos: 1.0 };
      // diff: P=0.2, G=0.3, C=0.2 - todos <= 0.5
      expect(dentroDeTolerancia(actual, objetivo)).toBe(true);
    });

    it('retorna false cuando proteína excede tolerancia', () => {
      const actual = { proteina: 2.5, grasa: 2.0, carbohidratos: 1.0 };
      const objetivo = { proteina: 1.5, grasa: 2.0, carbohidratos: 1.0 };
      // diff P = 1.0 > 0.5
      expect(dentroDeTolerancia(actual, objetivo)).toBe(false);
    });

    it('retorna false cuando grasa excede tolerancia', () => {
      const actual = { proteina: 1.5, grasa: 3.0, carbohidratos: 1.0 };
      const objetivo = { proteina: 1.5, grasa: 2.0, carbohidratos: 1.0 };
      // diff G = 1.0 > 0.5
      expect(dentroDeTolerancia(actual, objetivo)).toBe(false);
    });

    it('acepta tolerancia personalizada', () => {
      const actual = { proteina: 2.0, grasa: 2.5, carbohidratos: 1.5 };
      const objetivo = { proteina: 1.5, grasa: 2.0, carbohidratos: 1.0 };
      const toleranciaAmplia = { proteina: 1.0, grasa: 1.0, carbohidratos: 1.0 };
      expect(dentroDeTolerancia(actual, objetivo, toleranciaAmplia)).toBe(true);
    });
  });

  describe('calcularToleranciaDinamica', () => {
    // Fuente: docs/cambios/correccion_validacion_bloques.md líneas 111-122
    it('calcula tolerancia con libertad 5%', () => {
      const objetivo = { proteina: 1.1, grasa: 1.5, carbohidratos: 1.0 };
      const tolerancia = calcularToleranciaDinamica(objetivo, 5);
      
      // delta_p = max(0.25, 1.1 * 0.05 + 0.10) = max(0.25, 0.155) = 0.25
      expect(tolerancia.proteina).toBe(0.25);
      // delta_g = max(0.25, 1.5 * 0.05 + 0.10) = max(0.25, 0.175) = 0.25
      expect(tolerancia.grasa).toBe(0.25);
      // delta_c = max(0.25, 1.0 * 0.05 + 0.15) = max(0.25, 0.20) = 0.25
      expect(tolerancia.carbohidratos).toBe(0.25);
    });

    it('calcula tolerancia con libertad 10% y objetivos altos', () => {
      const objetivo = { proteina: 4.0, grasa: 2.0, carbohidratos: 3.0 };
      const tolerancia = calcularToleranciaDinamica(objetivo, 10);
      
      // delta_p = max(0.25, 4.0 * 0.10 + 0.10) = max(0.25, 0.50) = 0.50
      expect(tolerancia.proteina).toBeCloseTo(0.5, 2);
      // delta_g = max(0.25, 2.0 * 0.10 + 0.10) = max(0.25, 0.30) = 0.30
      expect(tolerancia.grasa).toBeCloseTo(0.3, 2);
      // delta_c = max(0.25, 3.0 * 0.10 + 0.15) = max(0.25, 0.45) = 0.45
      expect(tolerancia.carbohidratos).toBeCloseTo(0.45, 2);
    });

    it('respeta tolerancia mínima de 0.25', () => {
      const objetivo = { proteina: 0.5, grasa: 0.5, carbohidratos: 0.5 };
      const tolerancia = calcularToleranciaDinamica(objetivo, 5);
      
      expect(tolerancia.proteina).toBeGreaterThanOrEqual(TOLERANCIA_MINIMA);
      expect(tolerancia.grasa).toBeGreaterThanOrEqual(TOLERANCIA_MINIMA);
      expect(tolerancia.carbohidratos).toBeGreaterThanOrEqual(TOLERANCIA_MINIMA);
    });
  });

  describe('calcularErrorBloques', () => {
    // Fuente: src/functions.py líneas 4790-4795
    it('calcula error cero para valores iguales', () => {
      const objetivo = { proteina: 1.5, grasa: 2.0, carbohidratos: 1.0 };
      const resultado = { proteina: 1.5, grasa: 2.0, carbohidratos: 1.0 };
      expect(calcularErrorBloques(objetivo, resultado)).toBe(0);
    });

    it('calcula error como suma de diferencias absolutas', () => {
      const objetivo = { proteina: 1.5, grasa: 2.0, carbohidratos: 1.0 };
      const resultado = { proteina: 1.7, grasa: 1.8, carbohidratos: 1.3 };
      // error = |1.5-1.7| + |2.0-1.8| + |1.0-1.3| = 0.2 + 0.2 + 0.3 = 0.7
      expect(calcularErrorBloques(objetivo, resultado)).toBeCloseTo(0.7, 2);
    });

    it('maneja diferencias negativas correctamente', () => {
      const objetivo = { proteina: 2.0, grasa: 2.0, carbohidratos: 2.0 };
      const resultado = { proteina: 1.0, grasa: 1.0, carbohidratos: 1.0 };
      // error = 1.0 + 1.0 + 1.0 = 3.0
      expect(calcularErrorBloques(objetivo, resultado)).toBe(3.0);
    });
  });

  describe('gramosABloques', () => {
    // Fuente: src/functions.py líneas 4536-4538
    it('convierte gramos de proteína a bloques con redondeo', () => {
      // 33.2g / 20 = 1.66 → redondea a 1.5
      expect(gramosABloques(33.2, 'P')).toBe(1.5);
    });

    it('convierte gramos de grasa a bloques con redondeo', () => {
      // 19.9g / 10 = 1.99 → redondea a 2.0
      expect(gramosABloques(19.9, 'G')).toBe(2.0);
    });

    it('convierte gramos de carbohidratos a bloques con redondeo', () => {
      // 26.6g / 25 = 1.064 → redondea a 1.0
      expect(gramosABloques(26.6, 'C')).toBe(1.0);
    });

    it('maneja valores pequeños', () => {
      // 5g / 20 = 0.25 → redondea a 0.5
      expect(gramosABloques(5, 'P')).toBe(0.5);
    });
  });

  describe('Casos Borde', () => {
    it('redondeo en punto medio exacto 0.25', () => {
      // 0.25 * 2 = 0.5 → round(0.5) = 1 (banker's rounding) → 1/2 = 0.5
      expect(redondearAMedioBloque(0.25)).toBe(0.5);
    });

    it('redondeo en punto medio exacto 0.75', () => {
      // 0.75 * 2 = 1.5 → round(1.5) = 2 → 2/2 = 1.0
      expect(redondearAMedioBloque(0.75)).toBe(1.0);
    });

    it('valores muy pequeños redondean a 0', () => {
      expect(redondearAMedioBloque(0.01)).toBe(0);
      expect(redondearAMedioBloque(0.24)).toBe(0);
    });

    it('tolerancia generador tiene valores correctos', () => {
      expect(TOLERANCIA_GENERADOR.proteina).toBe(0.5);
      expect(TOLERANCIA_GENERADOR.grasa).toBe(0.5);
      expect(TOLERANCIA_GENERADOR.carbohidratos).toBe(0.5);
    });
  });
});
