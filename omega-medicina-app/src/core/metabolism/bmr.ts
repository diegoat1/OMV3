/**
 * Cálculo de Tasa Metabólica Basal (BMR)
 * 
 * Fuente: src/templates/caloriescal.html líneas 488-491
 */

/**
 * Resultado del cálculo de BMR
 */
export interface BMRResult {
  bmr: number;              // BMR en kcal/día
  formula: string;          // Fórmula utilizada
  lean_mass_kg: number;     // Masa magra usada en el cálculo
}

/**
 * Calcula el BMR usando la fórmula de Katch-McArdle
 * 
 * Esta fórmula es más precisa que Harris-Benedict porque usa
 * la masa magra (libre de grasa) en lugar del peso total.
 * 
 * Fuente: src/templates/caloriescal.html líneas 488-491
 * Fórmula: BMR = 370 + (9.8 × masa_magra_lbs)
 *          BMR = 370 + (21.6 × masa_magra_kg)
 * 
 * @param leanMassKg - Masa magra en kilogramos
 * @returns Objeto con BMR y detalles del cálculo
 */
export function katchMcArdle(leanMassKg: number): BMRResult {
  // Convertir a libras para la fórmula original
  const leanMassLbs = leanMassKg * 2.20462;

  // Fórmula Katch-McArdle
  // Fuente: src/templates/caloriescal.html línea 491
  const bmr = 370 + (9.8 * leanMassLbs);

  return {
    bmr: Math.round(bmr),
    formula: 'Katch-McArdle',
    lean_mass_kg: leanMassKg,
  };
}

/**
 * Calcula el BMR usando la fórmula de Katch-McArdle (versión métrica)
 * 
 * Fórmula equivalente en sistema métrico:
 * BMR = 370 + (21.6 × masa_magra_kg)
 * 
 * @param leanMassKg - Masa magra en kilogramos
 * @returns BMR en kcal/día
 */
export function katchMcArdleMetric(leanMassKg: number): number {
  return Math.round(370 + (21.6 * leanMassKg));
}

/**
 * Calcula el BMR usando la fórmula de Mifflin-St Jeor
 * 
 * Alternativa cuando no se conoce la composición corporal.
 * 
 * Hombres: BMR = (10 × peso_kg) + (6.25 × altura_cm) - (5 × edad) + 5
 * Mujeres: BMR = (10 × peso_kg) + (6.25 × altura_cm) - (5 × edad) - 161
 * 
 * @param weightKg - Peso en kilogramos
 * @param heightCm - Altura en centímetros
 * @param age - Edad en años
 * @param sex - Sexo biológico ('M' o 'F')
 * @returns Objeto con BMR y detalles del cálculo
 */
export function mifflinStJeor(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'M' | 'F'
): BMRResult {
  let bmr: number;

  if (sex === 'M') {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  } else {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  }

  return {
    bmr: Math.round(bmr),
    formula: 'Mifflin-St Jeor',
    lean_mass_kg: 0, // No aplica para esta fórmula
  };
}

/**
 * Calcula el BMR usando la fórmula de Harris-Benedict (revisada)
 * 
 * Fórmula clásica, menos precisa que Katch-McArdle.
 * 
 * Hombres: BMR = 88.362 + (13.397 × peso_kg) + (4.799 × altura_cm) - (5.677 × edad)
 * Mujeres: BMR = 447.593 + (9.247 × peso_kg) + (3.098 × altura_cm) - (4.330 × edad)
 * 
 * @param weightKg - Peso en kilogramos
 * @param heightCm - Altura en centímetros
 * @param age - Edad en años
 * @param sex - Sexo biológico ('M' o 'F')
 * @returns Objeto con BMR y detalles del cálculo
 */
export function harrisBenedict(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'M' | 'F'
): BMRResult {
  let bmr: number;

  if (sex === 'M') {
    bmr = 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age);
  }

  return {
    bmr: Math.round(bmr),
    formula: 'Harris-Benedict',
    lean_mass_kg: 0, // No aplica para esta fórmula
  };
}

/**
 * Calcula el BMR usando la mejor fórmula disponible según los datos
 * 
 * Si se conoce la masa magra, usa Katch-McArdle (más precisa).
 * Si no, usa Mifflin-St Jeor.
 * 
 * @param params - Parámetros del usuario
 * @returns Objeto con BMR y detalles del cálculo
 */
export function calcularBMR(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: 'M' | 'F';
  leanMassKg?: number;
  bodyFatPercent?: number;
}): BMRResult {
  const { weightKg, heightCm, age, sex, leanMassKg, bodyFatPercent } = params;

  // Si tenemos masa magra directamente, usar Katch-McArdle
  if (leanMassKg && leanMassKg > 0) {
    return katchMcArdle(leanMassKg);
  }

  // Si tenemos % grasa, calcular masa magra y usar Katch-McArdle
  if (bodyFatPercent !== undefined && bodyFatPercent >= 0 && bodyFatPercent < 100) {
    const calculatedLeanMass = weightKg * (1 - bodyFatPercent / 100);
    return katchMcArdle(calculatedLeanMass);
  }

  // Si no tenemos composición corporal, usar Mifflin-St Jeor
  return mifflinStJeor(weightKg, heightCm, age, sex);
}
