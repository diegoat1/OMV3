/**
 * Tests para el módulo de hidratación
 */

import { 
  calcularAguaRecomendada, 
  formatHydrationRecommendation,
  HydrationInput 
} from '../metabolism/hydration';

describe('calcularAguaRecomendada', () => {
  it('calcula agua base para peso promedio', () => {
    const input: HydrationInput = { weight: 70 };
    const result = calcularAguaRecomendada(input);
    
    // 70kg × 35ml/kg × 1.1 (light default) = 2695ml ≈ 2.7L
    expect(result.recommendedLiters).toBeCloseTo(2.7, 1);
    expect(result.isEstimate).toBe(true); // MVP
  });

  it('calcula agua para persona sedentaria', () => {
    const input: HydrationInput = { weight: 60, activityLevel: 'sedentary' };
    const result = calcularAguaRecomendada(input);
    
    // 60kg × 35ml/kg × 1.0 = 2100ml = 2.1L
    expect(result.recommendedLiters).toBeCloseTo(2.1, 1);
  });

  it('calcula agua para persona muy activa', () => {
    const input: HydrationInput = { weight: 80, activityLevel: 'very_active' };
    const result = calcularAguaRecomendada(input);
    
    // 80kg × 35ml/kg × 1.5 = 4200ml = 4.2L
    expect(result.recommendedLiters).toBeCloseTo(4.2, 1);
  });

  it('ajusta por clima caluroso', () => {
    const inputNormal: HydrationInput = { weight: 70, activityLevel: 'moderate' };
    const inputHot: HydrationInput = { weight: 70, activityLevel: 'moderate', isHotClimate: true };
    
    const resultNormal = calcularAguaRecomendada(inputNormal);
    const resultHot = calcularAguaRecomendada(inputHot);
    
    // Con clima caluroso debe ser mayor (+15%)
    expect(resultHot.recommendedLiters).toBeGreaterThan(resultNormal.recommendedLiters);
  });

  it('ajusta para embarazo', () => {
    const inputNormal: HydrationInput = { weight: 65 };
    const inputPregnant: HydrationInput = { weight: 65, isPregnant: true };
    
    const resultNormal = calcularAguaRecomendada(inputNormal);
    const resultPregnant = calcularAguaRecomendada(inputPregnant);
    
    // Embarazo agrega 300ml
    expect(resultPregnant.recommendedMl - resultNormal.recommendedMl).toBeCloseTo(300, -1);
  });

  it('ajusta para lactancia', () => {
    const inputNormal: HydrationInput = { weight: 65 };
    const inputBreastfeeding: HydrationInput = { weight: 65, isBreastfeeding: true };
    
    const resultNormal = calcularAguaRecomendada(inputNormal);
    const resultBreastfeeding = calcularAguaRecomendada(inputBreastfeeding);
    
    // Lactancia agrega 700ml
    expect(resultBreastfeeding.recommendedMl - resultNormal.recommendedMl).toBeCloseTo(700, -1);
  });

  it('respeta límite mínimo de 1.5L', () => {
    const input: HydrationInput = { weight: 30, activityLevel: 'sedentary' }; // Peso muy bajo
    const result = calcularAguaRecomendada(input);
    
    expect(result.recommendedLiters).toBeGreaterThanOrEqual(1.5);
  });

  it('respeta límite máximo de 5L', () => {
    const input: HydrationInput = { 
      weight: 150, 
      activityLevel: 'very_active',
      isHotClimate: true 
    };
    const result = calcularAguaRecomendada(input);
    
    expect(result.recommendedLiters).toBeLessThanOrEqual(5.0);
  });

  it('incluye breakdown detallado', () => {
    const input: HydrationInput = { 
      weight: 70, 
      activityLevel: 'active',
      isHotClimate: true 
    };
    const result = calcularAguaRecomendada(input);
    
    expect(result.breakdown.baseMl).toBe(2450); // 70 × 35
    expect(result.breakdown.activityAdjustmentMl).toBeGreaterThan(0);
    expect(result.breakdown.climateAdjustmentMl).toBeGreaterThan(0);
  });
});

describe('formatHydrationRecommendation', () => {
  it('formatea recomendación baja', () => {
    expect(formatHydrationRecommendation(1.5)).toContain('Aumenta');
  });

  it('formatea recomendación adecuada', () => {
    expect(formatHydrationRecommendation(2.2)).toContain('adecuado');
  });

  it('formatea recomendación buena', () => {
    expect(formatHydrationRecommendation(3.0)).toContain('Buena');
  });

  it('formatea recomendación alta', () => {
    expect(formatHydrationRecommendation(4.0)).toContain('Alta');
  });
});
