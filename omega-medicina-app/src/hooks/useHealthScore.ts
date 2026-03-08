/**
 * Hook para obtener el Health Index del backend (checkin API)
 * Fallback al cálculo local si el backend no responde
 */

import { useMemo, useState, useEffect } from 'react';
import {
  calcularHealthScore,
  getHealthScoreColor,
  type HealthData,
  type HealthScoreResult,
} from '../core/scoring';
import { useNutritionScore } from './useNutritionScore';
import { useTrainingScore } from './useTrainingScore';
import { checkinService } from '../services/api';

export interface UseHealthScoreResult {
  score: HealthScoreResult;
  semaphoreColor: 'green' | 'yellow' | 'red';
  isLoading: boolean;
  nutritionScore: number;
  trainingScore: number;
  hasData: boolean;
  /** Backend Health Index 0-100 (null if not yet fetched) */
  healthIndex: number | null;
}

/**
 * Hook que obtiene el Health Index del backend y hace fallback al cálculo local
 */
export function useHealthScore(): UseHealthScoreResult {
  const { score: nutritionResult, hasData: hasNutrition } = useNutritionScore(7);
  const { score: trainingResult, hasData: hasTraining } = useTrainingScore(4);
  const [healthIndex, setHealthIndex] = useState<number | null>(null);
  const [backendLoading, setBackendLoading] = useState(true);

  // Fetch Health Index from backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await checkinService.getHealthIndex();
        if (!cancelled && res.data) {
          setHealthIndex((res.data as any).score ?? null);
        }
      } catch {
        // Backend unavailable — will use local fallback
      } finally {
        if (!cancelled) setBackendLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Local fallback calculation
  const healthData: HealthData = useMemo(() => ({
    has_weight: false,
    has_measurements: false,
    has_body_composition: false,
    bf_in_range: false,
    ffmi_in_range: false,
    weight_stable: false,
  }), []);

  const localScore = useMemo(() => {
    return calcularHealthScore(nutritionResult, trainingResult, healthData);
  }, [nutritionResult, trainingResult, healthData]);

  // Use backend Health Index as the score if available
  const finalScore: HealthScoreResult = useMemo(() => {
    if (healthIndex !== null) {
      return {
        ...localScore,
        score: healthIndex,
      };
    }
    return localScore;
  }, [localScore, healthIndex]);

  const semaphoreColor = useMemo(() => {
    return getHealthScoreColor(finalScore.score);
  }, [finalScore.score]);

  return {
    score: finalScore,
    semaphoreColor,
    isLoading: backendLoading,
    nutritionScore: nutritionResult.score,
    trainingScore: trainingResult.score,
    hasData: hasNutrition || hasTraining || healthIndex !== null,
    healthIndex,
  };
}
