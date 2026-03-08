/**
 * Score de Nutrición
 * 
 * Sistema de puntuación para tracking nutricional diario
 * Basado en el diseño de OMV3 (app/(patient)/nutrition.tsx)
 */

/**
 * Entrada de log diario de nutrición
 */
export interface DietLogEntry {
  date: string;              // ISO date string
  quality: 1 | 2 | 3 | 4 | 5; // Calidad general 1-5
  protein_adequate: boolean;  // ¿Suficiente proteína?
  vegetables: boolean;        // ¿Comió verduras?
  ultra_processed: boolean;   // ¿Comió ultraprocesados?
  water_liters: number;       // Litros de agua
  notes?: string;
}

/**
 * Resultado del análisis de nutrición
 */
export interface NutritionScoreResult {
  score: number;              // Score 0-100
  category: NutritionCategory;
  components: {
    quality_avg: number;      // Promedio de calidad (0-25 puntos)
    protein_pct: number;      // % días con proteína adecuada (0-25 puntos)
    vegetables_pct: number;   // % días con verduras (0-25 puntos)
    processed_pct: number;    // % días SIN ultraprocesados (0-15 puntos)
    water_avg: number;        // Promedio de agua (0-10 puntos)
  };
  trends: {
    improving: boolean;
    days_analyzed: number;
    streak_good_days: number;
  };
  recommendations: string[];
}

export type NutritionCategory = 
  | 'excellent'   // 85-100
  | 'good'        // 70-84
  | 'average'     // 50-69
  | 'needs_work'  // 30-49
  | 'poor';       // 0-29

/**
 * Calcula el score de nutrición basado en los logs diarios
 * 
 * Componentes del score (100 puntos total):
 * - Calidad promedio: 25 puntos (quality 1-5 → 0-25)
 * - Proteína adecuada: 25 puntos (% días)
 * - Verduras: 25 puntos (% días)
 * - Sin ultraprocesados: 15 puntos (% días)
 * - Agua: 10 puntos (promedio >= 2L = 10 puntos)
 * 
 * @param logs - Array de entradas de log diario
 * @param days - Número de días a analizar (default 7)
 * @returns Resultado del análisis con score y recomendaciones
 */
export function calcularScoreNutricion(
  logs: DietLogEntry[],
  days: number = 7
): NutritionScoreResult {
  // Filtrar logs de los últimos N días
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const recentLogs = logs.filter(log => new Date(log.date) >= cutoffDate);
  
  if (recentLogs.length === 0) {
    return getEmptyResult(days);
  }

  // Calcular componentes
  const quality_sum = recentLogs.reduce((sum, log) => sum + log.quality, 0);
  const quality_avg = quality_sum / recentLogs.length;
  const quality_points = (quality_avg / 5) * 25;

  const protein_days = recentLogs.filter(log => log.protein_adequate).length;
  const protein_pct = (protein_days / recentLogs.length) * 100;
  const protein_points = (protein_pct / 100) * 25;

  const vegetables_days = recentLogs.filter(log => log.vegetables).length;
  const vegetables_pct = (vegetables_days / recentLogs.length) * 100;
  const vegetables_points = (vegetables_pct / 100) * 25;

  const no_processed_days = recentLogs.filter(log => !log.ultra_processed).length;
  const processed_pct = (no_processed_days / recentLogs.length) * 100;
  const processed_points = (processed_pct / 100) * 15;

  const water_sum = recentLogs.reduce((sum, log) => sum + log.water_liters, 0);
  const water_avg = water_sum / recentLogs.length;
  const water_points = Math.min(10, (water_avg / 2) * 10);

  // Score total
  const score = Math.round(
    quality_points + protein_points + vegetables_points + processed_points + water_points
  );

  // Categoría
  const category = getCategory(score);

  // Calcular tendencia
  const trends = calcularTendencia(recentLogs);

  // Generar recomendaciones
  const recommendations = generarRecomendaciones({
    quality_avg,
    protein_pct,
    vegetables_pct,
    processed_pct,
    water_avg,
  });

  return {
    score,
    category,
    components: {
      quality_avg: Math.round(quality_points),
      protein_pct: Math.round(protein_points),
      vegetables_pct: Math.round(vegetables_points),
      processed_pct: Math.round(processed_points),
      water_avg: Math.round(water_points),
    },
    trends,
    recommendations,
  };
}

function getCategory(score: number): NutritionCategory {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'average';
  if (score >= 30) return 'needs_work';
  return 'poor';
}

function getEmptyResult(days: number): NutritionScoreResult {
  return {
    score: 0,
    category: 'poor',
    components: {
      quality_avg: 0,
      protein_pct: 0,
      vegetables_pct: 0,
      processed_pct: 0,
      water_avg: 0,
    },
    trends: {
      improving: false,
      days_analyzed: 0,
      streak_good_days: 0,
    },
    recommendations: ['Comienza a registrar tu alimentación diaria'],
  };
}

function calcularTendencia(logs: DietLogEntry[]): {
  improving: boolean;
  days_analyzed: number;
  streak_good_days: number;
} {
  if (logs.length < 2) {
    return {
      improving: false,
      days_analyzed: logs.length,
      streak_good_days: logs.length > 0 && logs[0].quality >= 4 ? 1 : 0,
    };
  }

  // Ordenar por fecha
  const sorted = [...logs].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Comparar primera mitad con segunda mitad
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const avgFirst = firstHalf.reduce((s, l) => s + l.quality, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, l) => s + l.quality, 0) / secondHalf.length;

  // Calcular racha de días buenos (quality >= 4)
  let streak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].quality >= 4) {
      streak++;
    } else {
      break;
    }
  }

  return {
    improving: avgSecond > avgFirst,
    days_analyzed: logs.length,
    streak_good_days: streak,
  };
}

function generarRecomendaciones(components: {
  quality_avg: number;
  protein_pct: number;
  vegetables_pct: number;
  processed_pct: number;
  water_avg: number;
}): string[] {
  const recs: string[] = [];

  if (components.protein_pct < 70) {
    recs.push('Aumenta tu consumo de proteína en cada comida');
  }

  if (components.vegetables_pct < 70) {
    recs.push('Incluye verduras en al menos 2 comidas al día');
  }

  if (components.processed_pct < 70) {
    recs.push('Reduce el consumo de alimentos ultraprocesados');
  }

  if (components.water_avg < 1.5) {
    recs.push('Aumenta tu consumo de agua a 2 litros diarios');
  }

  if (components.quality_avg < 3) {
    recs.push('Planifica tus comidas con anticipación');
  }

  if (recs.length === 0) {
    recs.push('¡Excelente! Mantén estos buenos hábitos');
  }

  return recs;
}

/**
 * Calcula el score de un día individual
 * 
 * @param log - Entrada de log del día
 * @returns Score del día (0-100)
 */
export function calcularScoreDia(log: DietLogEntry): number {
  let score = 0;

  // Calidad (0-40 puntos)
  score += (log.quality / 5) * 40;

  // Proteína (0-20 puntos)
  if (log.protein_adequate) score += 20;

  // Verduras (0-20 puntos)
  if (log.vegetables) score += 20;

  // Sin ultraprocesados (0-10 puntos)
  if (!log.ultra_processed) score += 10;

  // Agua (0-10 puntos)
  score += Math.min(10, (log.water_liters / 2) * 10);

  return Math.round(score);
}
