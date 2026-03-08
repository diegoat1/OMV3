/**
 * Score de Entrenamiento
 * 
 * Sistema de puntuación para tracking de entrenamiento
 * Basado en el diseño de OMV3 (app/(patient)/training.tsx)
 */

/**
 * Tipos de entrenamiento
 */
export type TrainingType = 
  | 'strength'    // Fuerza
  | 'cardio'      // Cardio
  | 'hiit'        // HIIT
  | 'flexibility' // Flexibilidad/Movilidad
  | 'sports'      // Deportes
  | 'other';      // Otro

/**
 * Entrada de log de entrenamiento
 */
export interface TrainingLogEntry {
  date: string;              // ISO date string
  type: TrainingType;        // Tipo de entrenamiento
  duration_minutes: number;  // Duración en minutos
  rpe: number;               // Rate of Perceived Exertion (1-10)
  completed: boolean;        // ¿Completó la sesión planificada?
  notes?: string;
}

/**
 * Resultado del análisis de entrenamiento
 */
export interface TrainingScoreResult {
  score: number;              // Score 0-100
  category: TrainingCategory;
  components: {
    consistency: number;      // Consistencia semanal (0-40 puntos)
    volume: number;           // Volumen total (0-30 puntos)
    intensity: number;        // Intensidad promedio (0-20 puntos)
    variety: number;          // Variedad de tipos (0-10 puntos)
  };
  stats: {
    sessions_per_week: number;
    total_minutes: number;
    avg_duration: number;
    avg_rpe: number;
    types_used: TrainingType[];
  };
  trends: {
    improving: boolean;
    weeks_analyzed: number;
    current_streak: number;
  };
  recommendations: string[];
}

export type TrainingCategory = 
  | 'excellent'   // 85-100
  | 'good'        // 70-84
  | 'average'     // 50-69
  | 'needs_work'  // 30-49
  | 'poor';       // 0-29

/**
 * Objetivos de entrenamiento semanal
 */
export interface TrainingGoals {
  sessions_per_week: number;  // Sesiones objetivo por semana
  minutes_per_week: number;   // Minutos objetivo por semana
  target_rpe: number;         // RPE objetivo promedio
}

const DEFAULT_GOALS: TrainingGoals = {
  sessions_per_week: 4,
  minutes_per_week: 180,
  target_rpe: 7,
};

/**
 * Calcula el score de entrenamiento basado en los logs
 * 
 * Componentes del score (100 puntos total):
 * - Consistencia: 40 puntos (sesiones/semana vs objetivo)
 * - Volumen: 30 puntos (minutos/semana vs objetivo)
 * - Intensidad: 20 puntos (RPE promedio vs objetivo)
 * - Variedad: 10 puntos (tipos diferentes de entrenamiento)
 * 
 * @param logs - Array de entradas de log
 * @param weeks - Número de semanas a analizar (default 4)
 * @param goals - Objetivos personalizados (opcional)
 * @returns Resultado del análisis con score y recomendaciones
 */
export function calcularScoreEntrenamiento(
  logs: TrainingLogEntry[],
  weeks: number = 4,
  goals: TrainingGoals = DEFAULT_GOALS
): TrainingScoreResult {
  // Filtrar logs de las últimas N semanas
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
  
  const recentLogs = logs.filter(log => new Date(log.date) >= cutoffDate);
  
  if (recentLogs.length === 0) {
    return getEmptyResult(weeks);
  }

  // Estadísticas básicas
  const total_minutes = recentLogs.reduce((sum, log) => sum + log.duration_minutes, 0);
  const sessions_per_week = recentLogs.length / weeks;
  const avg_duration = total_minutes / recentLogs.length;
  const avg_rpe = recentLogs.reduce((sum, log) => sum + log.rpe, 0) / recentLogs.length;
  const types_used = [...new Set(recentLogs.map(log => log.type))];

  // Calcular componentes
  // Consistencia (40 puntos)
  const consistency_ratio = Math.min(1, sessions_per_week / goals.sessions_per_week);
  const consistency_points = Math.round(consistency_ratio * 40);

  // Volumen (30 puntos)
  const minutes_per_week = total_minutes / weeks;
  const volume_ratio = Math.min(1, minutes_per_week / goals.minutes_per_week);
  const volume_points = Math.round(volume_ratio * 30);

  // Intensidad (20 puntos) - penaliza si es muy bajo o muy alto
  const rpe_diff = Math.abs(avg_rpe - goals.target_rpe);
  const intensity_ratio = Math.max(0, 1 - rpe_diff / 5);
  const intensity_points = Math.round(intensity_ratio * 20);

  // Variedad (10 puntos)
  const variety_ratio = Math.min(1, types_used.length / 3);
  const variety_points = Math.round(variety_ratio * 10);

  // Score total
  const score = consistency_points + volume_points + intensity_points + variety_points;

  // Categoría
  const category = getCategory(score);

  // Calcular tendencia
  const trends = calcularTendencia(recentLogs, weeks);

  // Generar recomendaciones
  const recommendations = generarRecomendaciones({
    sessions_per_week,
    minutes_per_week,
    avg_rpe,
    types_used,
    goals,
  });

  return {
    score,
    category,
    components: {
      consistency: consistency_points,
      volume: volume_points,
      intensity: intensity_points,
      variety: variety_points,
    },
    stats: {
      sessions_per_week: Math.round(sessions_per_week * 10) / 10,
      total_minutes,
      avg_duration: Math.round(avg_duration),
      avg_rpe: Math.round(avg_rpe * 10) / 10,
      types_used,
    },
    trends,
    recommendations,
  };
}

function getCategory(score: number): TrainingCategory {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'average';
  if (score >= 30) return 'needs_work';
  return 'poor';
}

function getEmptyResult(weeks: number): TrainingScoreResult {
  return {
    score: 0,
    category: 'poor',
    components: {
      consistency: 0,
      volume: 0,
      intensity: 0,
      variety: 0,
    },
    stats: {
      sessions_per_week: 0,
      total_minutes: 0,
      avg_duration: 0,
      avg_rpe: 0,
      types_used: [],
    },
    trends: {
      improving: false,
      weeks_analyzed: 0,
      current_streak: 0,
    },
    recommendations: ['Comienza a registrar tus entrenamientos'],
  };
}

function calcularTendencia(logs: TrainingLogEntry[], weeks: number): {
  improving: boolean;
  weeks_analyzed: number;
  current_streak: number;
} {
  if (logs.length < 2) {
    return {
      improving: false,
      weeks_analyzed: weeks,
      current_streak: logs.length,
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

  const volumeFirst = firstHalf.reduce((s, l) => s + l.duration_minutes, 0);
  const volumeSecond = secondHalf.reduce((s, l) => s + l.duration_minutes, 0);

  // Calcular racha de días consecutivos entrenando
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = checkDate.toISOString().split('T')[0];
    const hasTraining = sorted.some(log => log.date.startsWith(dateStr));
    
    if (hasTraining) {
      streak++;
    } else if (i > 0) {
      // Permitir 1 día de descanso
      const prevDate = new Date(today.getTime() - (i - 1) * 24 * 60 * 60 * 1000);
      const prevStr = prevDate.toISOString().split('T')[0];
      if (!sorted.some(log => log.date.startsWith(prevStr))) {
        break;
      }
    }
  }

  return {
    improving: volumeSecond > volumeFirst,
    weeks_analyzed: weeks,
    current_streak: streak,
  };
}

function generarRecomendaciones(data: {
  sessions_per_week: number;
  minutes_per_week: number;
  avg_rpe: number;
  types_used: TrainingType[];
  goals: TrainingGoals;
}): string[] {
  const recs: string[] = [];

  if (data.sessions_per_week < data.goals.sessions_per_week * 0.7) {
    recs.push(`Aumenta la frecuencia a ${data.goals.sessions_per_week} sesiones/semana`);
  }

  if (data.minutes_per_week < data.goals.minutes_per_week * 0.7) {
    recs.push('Aumenta la duración de tus sesiones');
  }

  if (data.avg_rpe < 5) {
    recs.push('Aumenta la intensidad de tus entrenamientos');
  } else if (data.avg_rpe > 9) {
    recs.push('Considera reducir la intensidad para evitar sobreentrenamiento');
  }

  if (data.types_used.length < 2) {
    recs.push('Añade variedad con diferentes tipos de entrenamiento');
  }

  if (!data.types_used.includes('flexibility')) {
    recs.push('Incluye sesiones de movilidad/flexibilidad');
  }

  if (recs.length === 0) {
    recs.push('¡Excelente! Mantén esta rutina de entrenamiento');
  }

  return recs;
}

/**
 * Calcula el volumen semanal de entrenamiento
 * 
 * @param logs - Array de logs de la semana
 * @returns Volumen total en minutos
 */
export function calcularVolumenSemanal(logs: TrainingLogEntry[]): number {
  return logs.reduce((sum, log) => sum + log.duration_minutes, 0);
}

/**
 * Calcula la carga de entrenamiento (volumen × intensidad)
 * 
 * @param logs - Array de logs
 * @returns Carga total (minutos × RPE)
 */
export function calcularCargaEntrenamiento(logs: TrainingLogEntry[]): number {
  return logs.reduce((sum, log) => sum + log.duration_minutes * log.rpe, 0);
}
