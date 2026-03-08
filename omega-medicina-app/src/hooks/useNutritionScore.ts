/**
 * Hook para calcular score de nutricion usando el core TS
 * Sin datos mock - retorna cero hasta que haya datos reales
 */

import { useMemo } from 'react';
import {
  calcularScoreNutricion,
  type DietLogEntry,
  type NutritionScoreResult,
} from '../core/scoring';

export interface UseNutritionScoreResult {
  score: NutritionScoreResult;
  logs: DietLogEntry[];
  todayScore: number | null;
  semaphoreColor: 'green' | 'yellow' | 'red';
  isLoading: boolean;
  hasData: boolean;
}

/**
 * Hook que calcula el score de nutricion usando el core TS
 * @param days - Numero de dias a analizar (default 7)
 */
export function useNutritionScore(days: number = 7): UseNutritionScoreResult {
  // No mock data - empty until real persistence is ready
  const logs: DietLogEntry[] = [];

  const score = useMemo(() => {
    return calcularScoreNutricion(logs, days);
  }, [days]);

  return {
    score,
    logs,
    todayScore: null,
    semaphoreColor: 'red',
    isLoading: false,
    hasData: false,
  };
}

/**
 * Resetea los datos (no-op, kept for API compat)
 */
export function resetMockNutritionLogs(): void {
  // no-op
}
