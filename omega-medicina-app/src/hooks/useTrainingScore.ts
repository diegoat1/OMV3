/**
 * Hook para calcular score de entrenamiento usando el core TS
 * Sin datos mock - retorna cero hasta que haya datos reales
 */

import { useMemo } from 'react';
import {
  calcularScoreEntrenamiento,
  type TrainingLogEntry,
  type TrainingScoreResult,
} from '../core/scoring';

export interface UseTrainingScoreResult {
  score: TrainingScoreResult;
  logs: TrainingLogEntry[];
  weeklyVolume: number;
  semaphoreColor: 'green' | 'yellow' | 'red';
  isLoading: boolean;
  hasData: boolean;
}

/**
 * Hook que calcula el score de entrenamiento usando el core TS
 * @param weeks - Numero de semanas a analizar (default 4)
 */
export function useTrainingScore(weeks: number = 4): UseTrainingScoreResult {
  // No mock data - empty until real persistence is ready
  const logs: TrainingLogEntry[] = [];

  const score = useMemo(() => {
    return calcularScoreEntrenamiento(logs, weeks);
  }, [weeks]);

  return {
    score,
    logs,
    weeklyVolume: 0,
    semaphoreColor: 'red',
    isLoading: false,
    hasData: false,
  };
}

/**
 * Resetea los datos (no-op, kept for API compat)
 */
export function resetMockTrainingLogs(): void {
  // no-op
}
