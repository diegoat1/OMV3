/**
 * Tests Unitarios - Módulo de Scoring
 * 
 * Tests para scores de nutrición, entrenamiento y health score general
 */

import {
  calcularScoreNutricion,
  calcularScoreDia,
  calcularScoreEntrenamiento,
  calcularVolumenSemanal,
  calcularCargaEntrenamiento,
  calcularHealthScore,
  getHealthScoreColor,
  formatHealthScore,
  type DietLogEntry,
  type TrainingLogEntry,
  type HealthData,
} from '../scoring';

// Helper para crear fechas relativas
function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

describe('Scoring Core - Nutrición', () => {
  describe('calcularScoreDia', () => {
    it('calcula score máximo para día perfecto', () => {
      const log: DietLogEntry = {
        date: daysAgo(0),
        quality: 5,
        protein_adequate: true,
        vegetables: true,
        ultra_processed: false,
        water_liters: 2.5,
      };
      
      const score = calcularScoreDia(log);
      // 40 (quality) + 20 (protein) + 20 (vegetables) + 10 (no processed) + 10 (water) = 100
      expect(score).toBe(100);
    });

    it('calcula score mínimo para día pobre', () => {
      const log: DietLogEntry = {
        date: daysAgo(0),
        quality: 1,
        protein_adequate: false,
        vegetables: false,
        ultra_processed: true,
        water_liters: 0,
      };
      
      const score = calcularScoreDia(log);
      // 8 (quality 1/5 * 40) + 0 + 0 + 0 + 0 = 8
      expect(score).toBe(8);
    });

    it('calcula score intermedio correctamente', () => {
      const log: DietLogEntry = {
        date: daysAgo(0),
        quality: 3,
        protein_adequate: true,
        vegetables: false,
        ultra_processed: false,
        water_liters: 1.5,
      };
      
      const score = calcularScoreDia(log);
      // 24 (quality 3/5 * 40) + 20 (protein) + 0 + 10 (no processed) + 7.5 (water) = 61.5 → 62
      expect(score).toBeGreaterThanOrEqual(60);
      expect(score).toBeLessThanOrEqual(65);
    });
  });

  describe('calcularScoreNutricion', () => {
    it('retorna resultado vacío sin logs', () => {
      const result = calcularScoreNutricion([], 7);
      
      expect(result.score).toBe(0);
      expect(result.category).toBe('poor');
      expect(result.trends.days_analyzed).toBe(0);
      expect(result.recommendations).toContain('Comienza a registrar tu alimentación diaria');
    });

    it('calcula score alto para logs buenos', () => {
      const logs: DietLogEntry[] = Array.from({ length: 7 }, (_, i) => ({
        date: daysAgo(i),
        quality: 4 as const,
        protein_adequate: true,
        vegetables: true,
        ultra_processed: false,
        water_liters: 2,
      }));
      
      const result = calcularScoreNutricion(logs, 7);
      
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.category).toBe('excellent');
      expect(result.components.protein_pct).toBe(25); // 100% días
      expect(result.components.vegetables_pct).toBe(25); // 100% días
      expect(result.trends.days_analyzed).toBe(7);
    });

    it('calcula score bajo para logs pobres', () => {
      const logs: DietLogEntry[] = Array.from({ length: 7 }, (_, i) => ({
        date: daysAgo(i),
        quality: 2 as const,
        protein_adequate: false,
        vegetables: false,
        ultra_processed: true,
        water_liters: 0.5,
      }));
      
      const result = calcularScoreNutricion(logs, 7);
      
      expect(result.score).toBeLessThan(30);
      expect(result.category).toBe('poor');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('detecta tendencia de mejora', () => {
      const logs: DietLogEntry[] = [
        // Primeros días malos
        { date: daysAgo(6), quality: 2 as const, protein_adequate: false, vegetables: false, ultra_processed: true, water_liters: 1 },
        { date: daysAgo(5), quality: 2 as const, protein_adequate: false, vegetables: false, ultra_processed: true, water_liters: 1 },
        { date: daysAgo(4), quality: 3 as const, protein_adequate: false, vegetables: true, ultra_processed: true, water_liters: 1.5 },
        // Últimos días buenos
        { date: daysAgo(3), quality: 4 as const, protein_adequate: true, vegetables: true, ultra_processed: false, water_liters: 2 },
        { date: daysAgo(2), quality: 4 as const, protein_adequate: true, vegetables: true, ultra_processed: false, water_liters: 2 },
        { date: daysAgo(1), quality: 5 as const, protein_adequate: true, vegetables: true, ultra_processed: false, water_liters: 2.5 },
        { date: daysAgo(0), quality: 5 as const, protein_adequate: true, vegetables: true, ultra_processed: false, water_liters: 2.5 },
      ];
      
      const result = calcularScoreNutricion(logs, 7);
      
      expect(result.trends.improving).toBe(true);
      expect(result.trends.streak_good_days).toBeGreaterThanOrEqual(4);
    });

    it('devuelve breakdown transparente de componentes', () => {
      const logs: DietLogEntry[] = [
        { date: daysAgo(0), quality: 4 as const, protein_adequate: true, vegetables: true, ultra_processed: false, water_liters: 2 },
        { date: daysAgo(1), quality: 4 as const, protein_adequate: true, vegetables: false, ultra_processed: false, water_liters: 2 },
      ];
      
      const result = calcularScoreNutricion(logs, 7);
      
      // Verificar que todos los componentes están presentes
      expect(result.components).toHaveProperty('quality_avg');
      expect(result.components).toHaveProperty('protein_pct');
      expect(result.components).toHaveProperty('vegetables_pct');
      expect(result.components).toHaveProperty('processed_pct');
      expect(result.components).toHaveProperty('water_avg');
      
      // Verificar que la suma de componentes ≈ score total
      const sumComponents = 
        result.components.quality_avg +
        result.components.protein_pct +
        result.components.vegetables_pct +
        result.components.processed_pct +
        result.components.water_avg;
      
      expect(Math.abs(sumComponents - result.score)).toBeLessThanOrEqual(1);
    });
  });
});

describe('Scoring Core - Entrenamiento', () => {
  describe('calcularVolumenSemanal', () => {
    it('suma minutos correctamente', () => {
      const logs: TrainingLogEntry[] = [
        { date: daysAgo(0), type: 'strength', duration_minutes: 60, rpe: 7, completed: true },
        { date: daysAgo(1), type: 'cardio', duration_minutes: 30, rpe: 6, completed: true },
        { date: daysAgo(2), type: 'hiit', duration_minutes: 20, rpe: 9, completed: true },
      ];
      
      expect(calcularVolumenSemanal(logs)).toBe(110);
    });
  });

  describe('calcularCargaEntrenamiento', () => {
    it('calcula carga como volumen × RPE', () => {
      const logs: TrainingLogEntry[] = [
        { date: daysAgo(0), type: 'strength', duration_minutes: 60, rpe: 8, completed: true },
        { date: daysAgo(1), type: 'cardio', duration_minutes: 30, rpe: 6, completed: true },
      ];
      
      // (60 × 8) + (30 × 6) = 480 + 180 = 660
      expect(calcularCargaEntrenamiento(logs)).toBe(660);
    });
  });

  describe('calcularScoreEntrenamiento', () => {
    it('retorna resultado vacío sin logs', () => {
      const result = calcularScoreEntrenamiento([], 4);
      
      expect(result.score).toBe(0);
      expect(result.category).toBe('poor');
      expect(result.stats.sessions_per_week).toBe(0);
      expect(result.recommendations).toContain('Comienza a registrar tus entrenamientos');
    });

    it('calcula score alto para entrenamiento consistente', () => {
      const logs: TrainingLogEntry[] = [];
      
      // 4 sesiones por semana durante 4 semanas
      for (let week = 0; week < 4; week++) {
        for (let session = 0; session < 4; session++) {
          logs.push({
            date: daysAgo(week * 7 + session),
            type: session % 2 === 0 ? 'strength' : 'cardio',
            duration_minutes: 45,
            rpe: 7,
            completed: true,
          });
        }
      }
      
      const result = calcularScoreEntrenamiento(logs, 4);
      
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.stats.sessions_per_week).toBe(4);
      expect(result.stats.types_used).toContain('strength');
      expect(result.stats.types_used).toContain('cardio');
    });

    it('penaliza falta de consistencia', () => {
      const logs: TrainingLogEntry[] = [
        { date: daysAgo(0), type: 'strength', duration_minutes: 60, rpe: 7, completed: true },
        { date: daysAgo(14), type: 'strength', duration_minutes: 60, rpe: 7, completed: true },
      ];
      
      const result = calcularScoreEntrenamiento(logs, 4);
      
      // Solo 0.5 sesiones/semana vs objetivo de 4
      expect(result.score).toBeLessThan(50);
      expect(result.components.consistency).toBeLessThan(20);
    });

    it('penaliza RPE muy bajo o muy alto', () => {
      const logsLowRPE: TrainingLogEntry[] = Array.from({ length: 16 }, (_, i) => ({
        date: daysAgo(i % 28),
        type: 'strength' as const,
        duration_minutes: 45,
        rpe: 3, // Muy bajo
        completed: true,
      }));
      
      const logsHighRPE: TrainingLogEntry[] = Array.from({ length: 16 }, (_, i) => ({
        date: daysAgo(i % 28),
        type: 'strength' as const,
        duration_minutes: 45,
        rpe: 10, // Muy alto
        completed: true,
      }));
      
      const resultLow = calcularScoreEntrenamiento(logsLowRPE, 4);
      const resultHigh = calcularScoreEntrenamiento(logsHighRPE, 4);
      
      // Ambos deberían tener penalización en intensidad
      expect(resultLow.components.intensity).toBeLessThan(15);
      expect(resultHigh.components.intensity).toBeLessThan(15);
    });

    it('devuelve breakdown transparente', () => {
      const logs: TrainingLogEntry[] = [
        { date: daysAgo(0), type: 'strength', duration_minutes: 60, rpe: 7, completed: true },
        { date: daysAgo(2), type: 'cardio', duration_minutes: 30, rpe: 6, completed: true },
        { date: daysAgo(4), type: 'flexibility', duration_minutes: 20, rpe: 4, completed: true },
      ];
      
      const result = calcularScoreEntrenamiento(logs, 1);
      
      // Verificar componentes
      expect(result.components).toHaveProperty('consistency');
      expect(result.components).toHaveProperty('volume');
      expect(result.components).toHaveProperty('intensity');
      expect(result.components).toHaveProperty('variety');
      
      // Verificar stats
      expect(result.stats).toHaveProperty('sessions_per_week');
      expect(result.stats).toHaveProperty('total_minutes');
      expect(result.stats).toHaveProperty('avg_duration');
      expect(result.stats).toHaveProperty('avg_rpe');
      expect(result.stats).toHaveProperty('types_used');
      
      // Suma de componentes = score
      const sumComponents = 
        result.components.consistency +
        result.components.volume +
        result.components.intensity +
        result.components.variety;
      
      expect(sumComponents).toBe(result.score);
    });
  });
});

describe('Scoring Core - Health Score', () => {
  const goodNutritionScore = {
    score: 85,
    category: 'excellent' as const,
    components: { quality_avg: 20, protein_pct: 25, vegetables_pct: 25, processed_pct: 10, water_avg: 5 },
    trends: { improving: true, days_analyzed: 7, streak_good_days: 5 },
    recommendations: [],
  };

  const goodTrainingScore = {
    score: 80,
    category: 'good' as const,
    components: { consistency: 35, volume: 25, intensity: 15, variety: 5 },
    stats: { sessions_per_week: 4, total_minutes: 180, avg_duration: 45, avg_rpe: 7, types_used: ['strength' as const, 'cardio' as const] },
    trends: { improving: true, weeks_analyzed: 4, current_streak: 3 },
    recommendations: [],
  };

  const completeHealthData: HealthData = {
    has_weight: true,
    has_measurements: true,
    has_body_composition: true,
    bf_in_range: true,
    ffmi_in_range: true,
    weight_stable: true,
  };

  describe('calcularHealthScore', () => {
    it('calcula score máximo con todos los datos completos', () => {
      const result = calcularHealthScore(
        goodNutritionScore,
        goodTrainingScore,
        completeHealthData
      );
      
      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.category).toBe('excellent');
      expect(result.status).toBe('optimal');
    });

    it('penaliza falta de datos', () => {
      const incompleteData: HealthData = {
        has_weight: false,
        has_measurements: false,
        has_body_composition: false,
        bf_in_range: true,
        ffmi_in_range: true,
        weight_stable: true,
      };
      
      const result = calcularHealthScore(
        goodNutritionScore,
        goodTrainingScore,
        incompleteData
      );
      
      // Sin los 30 puntos de completitud
      expect(result.components.data_completeness).toBe(0);
      expect(result.score).toBeLessThan(75);
    });

    it('maneja scores nulos', () => {
      const result = calcularHealthScore(
        null,
        null,
        completeHealthData
      );
      
      // Solo puntos de completitud (30) + métricas (20) = 50
      expect(result.score).toBe(50);
      expect(result.components.nutrition).toBe(0);
      expect(result.components.training).toBe(0);
    });

    it('devuelve breakdown transparente', () => {
      const result = calcularHealthScore(
        goodNutritionScore,
        goodTrainingScore,
        completeHealthData
      );
      
      // Verificar componentes
      expect(result.components).toHaveProperty('data_completeness');
      expect(result.components).toHaveProperty('nutrition');
      expect(result.components).toHaveProperty('training');
      expect(result.components).toHaveProperty('metrics_in_range');
      
      // Verificar breakdown
      expect(result.breakdown).toHaveProperty('nutrition_score');
      expect(result.breakdown).toHaveProperty('training_score');
      expect(result.breakdown).toHaveProperty('data_score');
      expect(result.breakdown).toHaveProperty('metrics_score');
      
      // Suma de componentes = score
      const sumComponents = 
        result.components.data_completeness +
        result.components.nutrition +
        result.components.training +
        result.components.metrics_in_range;
      
      expect(sumComponents).toBe(result.score);
    });

    it('genera recomendaciones apropiadas', () => {
      const poorData: HealthData = {
        has_weight: false,
        has_measurements: false,
        has_body_composition: false,
        bf_in_range: false,
        ffmi_in_range: false,
        weight_stable: false,
      };
      
      const result = calcularHealthScore(null, null, poorData);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('peso'))).toBe(true);
    });
  });

  describe('getHealthScoreColor', () => {
    it('retorna verde para score alto', () => {
      expect(getHealthScoreColor(85)).toBe('green');
      expect(getHealthScoreColor(70)).toBe('green');
    });

    it('retorna amarillo para score medio', () => {
      expect(getHealthScoreColor(60)).toBe('yellow');
      expect(getHealthScoreColor(40)).toBe('yellow');
    });

    it('retorna rojo para score bajo', () => {
      expect(getHealthScoreColor(30)).toBe('red');
      expect(getHealthScoreColor(0)).toBe('red');
    });
  });

  describe('formatHealthScore', () => {
    it('formatea score excelente', () => {
      expect(formatHealthScore(90)).toContain('Excelente');
    });

    it('formatea score bueno', () => {
      expect(formatHealthScore(75)).toContain('Bueno');
    });

    it('formatea score regular', () => {
      expect(formatHealthScore(55)).toContain('Regular');
    });

    it('formatea score bajo', () => {
      expect(formatHealthScore(20)).toContain('Bajo');
    });
  });
});

describe('Scoring Core - Categorías', () => {
  it('categoriza correctamente nutrición', () => {
    const excellent: DietLogEntry[] = Array.from({ length: 7 }, (_, i) => ({
      date: daysAgo(i),
      quality: 5 as const,
      protein_adequate: true,
      vegetables: true,
      ultra_processed: false,
      water_liters: 2.5,
    }));
    
    const result = calcularScoreNutricion(excellent, 7);
    expect(result.category).toBe('excellent');
  });

  it('categoriza correctamente entrenamiento', () => {
    // 4 sesiones/semana × 4 semanas = 16 sesiones
    const logs: TrainingLogEntry[] = Array.from({ length: 16 }, (_, i) => ({
      date: daysAgo(i * 2),
      type: 'strength' as const,
      duration_minutes: 50,
      rpe: 7,
      completed: true,
    }));
    
    const result = calcularScoreEntrenamiento(logs, 4);
    expect(['excellent', 'good']).toContain(result.category);
  });
});
