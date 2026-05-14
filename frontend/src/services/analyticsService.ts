import { api } from './apiClient'
import type {
  AnalyticsDashboard,
  AnalyticsScores,
  AnalyticsSummary,
  BodyComposition,
  BodyCompositionHistoryResponse,
  GoalProjection,
} from '../types/api'

function qs(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    usp.set(k, String(v))
  }
  const s = usp.toString()
  return s ? `?${s}` : ''
}

/** /api/v3/analytics — all GETs accept `?user=<display_name>` or
 *  `?patient_id=<int>` to target someone else's data when the caller is the
 *  patient's assigned professional. */
export const analyticsService = {
  dashboard(opts: { user?: string; patient_id?: number } = {}): Promise<AnalyticsDashboard> {
    return api.get<AnalyticsDashboard>(`/analytics/dashboard${qs(opts)}`)
  },
  summary(opts: { user?: string } = {}): Promise<AnalyticsSummary> {
    return api.get<AnalyticsSummary>(`/analytics/summary${qs(opts)}`)
  },
  bodyComposition(opts: { user?: string } = {}): Promise<BodyComposition> {
    return api.get<BodyComposition>(`/analytics/body-composition${qs(opts)}`)
  },
  bodyCompositionHistory(opts: {
    user?: string
    patient_id?: number
    limit?: number
    desde?: string
    hasta?: string
  } = {}): Promise<BodyCompositionHistoryResponse> {
    return api.get<BodyCompositionHistoryResponse>(`/analytics/body-composition/history${qs(opts)}`)
  },
  scores(opts: { user?: string } = {}): Promise<AnalyticsScores> {
    return api.get<AnalyticsScores>(`/analytics/scores${qs(opts)}`)
  },
  /** Goal projection: rates + days-to-goal + motivational score (0–100). */
  projection(opts: { user?: string; patient_id?: number } = {}): Promise<GoalProjection> {
    return api.get<GoalProjection>(`/analytics/projection${qs(opts)}`)
  },

  /* ──────────────── On-demand calculators ──────────────── */
  /** Basal Metabolic Rate. */
  bmr(payload: { peso: number; altura: number; edad: number; sexo: 'M' | 'F' }): Promise<{ bmr: number; formula: string }> {
    return api.post<{ bmr: number; formula: string }>('/analytics/calculators/bmr', payload)
  },
  /** Total Daily Energy Expenditure. */
  tdee(payload: { bmr?: number; factor_actividad: number; peso?: number; altura?: number; edad?: number; sexo?: 'M' | 'F' }): Promise<{ tdee: number; bmr: number }> {
    return api.post<{ tdee: number; bmr: number }>('/analytics/calculators/tdee', payload)
  },
  /** Navy-method body-fat. */
  bodyFat(payload: { sexo: 'M' | 'F'; altura: number; circ_cuello: number; circ_abdomen?: number; circ_cintura?: number; circ_cadera?: number }): Promise<{ bf: number; metodo: string }> {
    return api.post<{ bf: number; metodo: string }>('/analytics/calculators/body-fat', payload)
  },
  /** Fat-Free Mass Index. */
  ffmi(payload: { peso: number; altura: number; bf: number }): Promise<{ ffmi: number; ffmi_normalizado: number }> {
    return api.post<{ ffmi: number; ffmi_normalizado: number }>('/analytics/calculators/ffmi', payload)
  },
  /** Weight-loss projection given current intake + target. */
  weightLoss(payload: { peso_actual: number; peso_objetivo: number; deficit_diario: number }): Promise<{ semanas: number; perdida_semanal: number }> {
    return api.post<{ semanas: number; perdida_semanal: number }>('/analytics/calculators/weight-loss', payload)
  },
  /** Muscle-gain projection given training level + surplus. */
  muscleGain(payload: { peso_actual: number; ffmi_actual: number; ffmi_objetivo: number; nivel?: string }): Promise<{ meses: number; ganancia_mensual: number }> {
    return api.post<{ meses: number; ganancia_mensual: number }>('/analytics/calculators/muscle-gain', payload)
  },
}
