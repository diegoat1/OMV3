import { api } from './apiClient'
import type {
  CreateSessionPayload,
  CreateStrengthPayload,
  ExercisesResponse,
  LiftsResponse,
  OptimizePlanPayload,
  OptimizePlanResponse,
  StrengthResponse,
  StrengthStandardsResponse,
  StrengthTest,
  TodaySessionResponse,
  TrainingPlanRow,
  TrainingPlansResponse,
  TrainingProgram,
  TrainingProgramsResponse,
  V2Distribution,
  V2Exercise,
  V2Plan,
  V2PlansResponse,
  V2Progression,
  V2ProgressResponse,
  V2ProgressRow,
  V2Session,
  V2SessionsHistoryResponse,
  V2Stats,
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

  /** POST /training/plans — manual plan creation (specialist). */
  createPlan(payload: { patient?: string; nombre_apellido?: string; plan_data?: unknown; name?: string }): Promise<{ plan_id: number }> {
    return api.post<{ plan_id: number }>('/training/plans', payload)
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

  /** POST /training/sessions/complete — marks the session done AND advances
   *  progression server-side (OMV-61). Returns the new current_day + week.
   *  Body schema:
   *    ejercicios: [{ exercise_key|ejercicio, completed?, weight_increment?, … }]
   *    advance_day?: boolean (default true)
   *    nombre_apellido | patient: optional, for specialist on behalf of a patient. */
  completeSession(payload: {
    ejercicios: Array<{
      exercise_key?: string
      ejercicio?: string
      completed?: boolean
      weight_increment?: number
      test_reps?: number
      test_minutes?: number
      test_speed?: number
      speed_increment?: number
      converted_to_test?: boolean
    }>
    advance_day?: boolean
    nombre_apellido?: string
    patient?: string
  }): Promise<{ current_day?: number; cycle_week?: number; advanced?: boolean; total_days?: number }> {
    return api.post('/training/sessions/complete', payload)
  },

  /** POST /training/sessions/advance — advance to the next day without
   *  completing any session (used when a day is skipped). */
  advanceDay(payload: { nombre_apellido?: string; patient?: string } = {}) {
    return api.post<{ current_day: number; cycle_week: number; advanced: boolean }>(
      '/training/sessions/advance',
      payload,
    )
  },

  /* ──────────────── Strength / lifts catalog ──────────────── */

  /** GET /training/strength/history — every recorded test (not just the latest). */
  strengthHistory(patient?: string): Promise<{ tests: StrengthTest[] }> {
    return api.get<{ tests: StrengthTest[] }>(`/training/strength/history${qs({ user: patient })}`)
  },
  /** DELETE /training/strength/<id> — admin/specialist only. */
  deleteStrength(recordId: number) {
    return api.delete<{ id: number }>(`/training/strength/${recordId}`)
  },
  /** GET /training/strength/standards — reference 1RM categories. */
  strengthStandards(opts: { sexo?: 'M' | 'F'; categoria?: string } = {}): Promise<StrengthStandardsResponse> {
    return api.get<StrengthStandardsResponse>(`/training/strength/standards${qs(opts)}`)
  },
  /** POST /training/strength/submit — alias accepted by the backend for the
   *  patient-side submit path (legacy compat). */
  submitStrength(payload: CreateStrengthPayload) {
    return api.post<{ id: number; rm_results?: Record<string, number> }>('/training/strength/submit', payload)
  },
  /** POST /training/strength/<id>/optimize — re-runs the plan optimizer using
   *  this strength snapshot as the source. */
  optimizeFromStrength(recordId: number, payload: OptimizePlanPayload = {}) {
    return api.post<OptimizePlanResponse>(`/training/strength/${recordId}/optimize`, payload)
  },
  /** GET /training/strength/admin — all strength tests across patients. */
  strengthAdmin() {
    return api.get<StrengthResponse[]>('/training/strength/admin')
  },

  /** GET /training/lifts — raw lift logs (per set / per session). */
  listLifts(opts: { patient?: string; limit?: number } = {}): Promise<LiftsResponse> {
    return api.get<LiftsResponse>(`/training/lifts${qs({ user: opts.patient, limit: opts.limit })}`)
  },
  createLift(payload: { ejercicio: string; peso: number; reps: number; fecha?: string; patient?: string }) {
    return api.post<{ id: number }>('/training/lifts', payload)
  },

  /** GET /training/exercises — exercise catalog with metadata. */
  listExercises(): Promise<ExercisesResponse> {
    return api.get<ExercisesResponse>('/training/exercises')
  },

  /* ──────────────── Programs (preset templates) ──────────────── */

  listPrograms(): Promise<TrainingProgramsResponse> {
    return api.get<TrainingProgramsResponse>('/training/programs')
  },
  getProgram(programId: string): Promise<TrainingProgram> {
    return api.get<TrainingProgram>(`/training/programs/${programId}`)
  },

  /* ──────────────── Sessions — extras ──────────────── */

  /** GET /training/sessions/current — current in-progress session if any. */
  currentSession(patient?: string) {
    return api.get<{ session: V2Session | null }>(`/training/sessions/current${qs({ user: patient })}`)
  },
  /** GET /training/sessions/history?user= — past sessions paginated. */
  sessionsHistory(opts: { patient?: string; limit?: number } = {}) {
    return api.get<V2SessionsHistoryResponse>(`/training/sessions/history${qs({ user: opts.patient, limit: opts.limit })}`)
  },

  /* ──────────────── v2 — modern training engine ──────────────── */

  v2: {
    listExercises(): Promise<{ exercises: V2Exercise[] }> {
      return api.get<{ exercises: V2Exercise[] }>('/training/v2/exercises')
    },
    getExercise(exerciseKey: string): Promise<V2Exercise> {
      return api.get<V2Exercise>(`/training/v2/exercises/${exerciseKey}`)
    },
    listProgressions(): Promise<{ progressions: V2Progression[] }> {
      return api.get<{ progressions: V2Progression[] }>('/training/v2/progressions')
    },
    getProgression(progressionKey: string): Promise<V2Progression> {
      return api.get<V2Progression>(`/training/v2/progressions/${progressionKey}`)
    },
    listDistributions(): Promise<{ distributions: V2Distribution[] }> {
      return api.get<{ distributions: V2Distribution[] }>('/training/v2/distributions')
    },

    listPlans(patient?: string): Promise<V2PlansResponse> {
      return api.get<V2PlansResponse>(`/training/v2/plans${qs({ user: patient })}`)
    },
    createPlan(payload: {
      distribution_key: string
      progression_key: string
      patient?: string
      total_days?: number
    }): Promise<V2Plan> {
      return api.post<V2Plan>('/training/v2/plans', payload)
    },
    getPlan(planId: number): Promise<V2Plan> {
      return api.get<V2Plan>(`/training/v2/plans/${planId}`)
    },
    advancePlan(planId: number): Promise<V2Plan> {
      return api.post<V2Plan>(`/training/v2/plans/${planId}/advance`)
    },

    progress(patient?: string): Promise<V2ProgressResponse> {
      return api.get<V2ProgressResponse>(`/training/v2/progress${qs({ user: patient })}`)
    },
    updateProgress(exerciseKey: string, payload: Partial<V2ProgressRow>) {
      return api.put<V2ProgressRow>(`/training/v2/progress/${exerciseKey}`, payload)
    },

    createSession(payload: {
      plan_id: number
      ejercicios?: V2Session['ejercicios']
      duracion_minutos?: number
      notas?: string
    }): Promise<V2Session> {
      return api.post<V2Session>('/training/v2/sessions', payload)
    },
    getSession(sessionId: number): Promise<V2Session> {
      return api.get<V2Session>(`/training/v2/sessions/${sessionId}`)
    },
    updateSession(sessionId: number, payload: Partial<V2Session>): Promise<V2Session> {
      return api.put<V2Session>(`/training/v2/sessions/${sessionId}`, payload)
    },
    sessionsHistory(opts: { limit?: number } = {}): Promise<V2SessionsHistoryResponse> {
      return api.get<V2SessionsHistoryResponse>(`/training/v2/sessions/history${qs(opts)}`)
    },
    updateSessionExercise(sessionId: number, exerciseId: number, payload: unknown) {
      return api.put(`/training/v2/sessions/${sessionId}/exercises/${exerciseId}`, payload)
    },
    stats(patient?: string): Promise<V2Stats> {
      return api.get<V2Stats>(`/training/v2/stats${qs({ user: patient })}`)
    },
  },
}
