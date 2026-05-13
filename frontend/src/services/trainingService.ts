import { api } from './apiClient'
import type {
  CreateSessionPayload,
  CreateStrengthPayload,
  OptimizePlanPayload,
  OptimizePlanResponse,
  StrengthResponse,
  TodaySessionResponse,
  TrainingPlanRow,
  TrainingPlansResponse,
} from '../types/api'

/** Wraps the v3 training endpoints exposed at /api/v3/training/*.
 *
 *  Permission model:
 *  - Each GET/POST accepts an optional `patient` (display name) for
 *    specialist/admin access to someone else's data. Without it, the backend
 *    falls back to the caller's own nombre_apellido. */
export const trainingService = {
  /** GET /training/strength — most recent strength test for the patient. */
  getStrength(patient?: string): Promise<StrengthResponse> {
    const qs = patient ? `?user=${encodeURIComponent(patient)}` : ''
    return api.get<StrengthResponse>(`/training/strength${qs}`)
  },

  /** POST /training/strength — register a new 1RM test (Epley formula applied
   *  server-side). The body's `ejercicios` map can hold any number of lifts. */
  createStrength(payload: CreateStrengthPayload) {
    return api.post<{ id: number; rm_results?: Record<string, number> }>(
      '/training/strength',
      payload,
    )
  },

  /** GET /training/plans — list of plans for the patient (active + history). */
  listPlans(patient?: string): Promise<TrainingPlansResponse> {
    const qs = patient ? `?patient=${encodeURIComponent(patient)}` : ''
    return api.get<TrainingPlansResponse>(`/training/plans${qs}`)
  },

  /** GET /training/plans/<id> — full plan with plan_data. */
  getPlan(planId: number): Promise<{ plan: TrainingPlanRow }> {
    return api.get<{ plan: TrainingPlanRow }>(`/training/plans/${planId}`)
  },

  /** POST /training/plans/<id>/optimize — re-run the optimizer and persist
   *  the result as a new plan (the old one becomes inactive). */
  optimizePlan(planId: number, payload: OptimizePlanPayload = {}): Promise<OptimizePlanResponse> {
    return api.post<OptimizePlanResponse>(`/training/plans/${planId}/optimize`, payload)
  },

  /** GET /training/sessions/today — exercises for the active plan's current
   *  day, with prescription derived from the patient's progression state. */
  getTodaySession(patient?: string): Promise<TodaySessionResponse> {
    const qs = patient ? `?patient=${encodeURIComponent(patient)}` : ''
    return api.get<TodaySessionResponse>(`/training/sessions/today${qs}`)
  },

  /** POST /training/sessions — register a completed session. */
  createSession(payload: CreateSessionPayload) {
    return api.post<{ id: number; session_id?: number }>('/training/sessions', payload)
  },
}
