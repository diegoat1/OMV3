import { api } from './apiClient'
import type {
  AutoRoadmapResponse,
  Goal,
  GoalNextStepResponse,
  ProposeGoalPayload,
  SingleGoalResponse,
} from '../types/api'

/** Goals lifecycle (Fase 4 del modelo aspiracional):
 *    - GET  /users/<id>/goals?status=proposed|accepted (filter)
 *    - POST /users/<id>/goals               (propose o accept directo)
 *    - POST /users/<id>/goals/<gid>/accept
 *    - POST /users/<id>/goals/<gid>/reject
 *    - POST /users/<id>/goals/<gid>/complete
 *    - GET  /users/<id>/goals/history
 *    - GET  /users/<id>/goals/next-step     (precarga del form del profesional)
 *    - GET  /users/<id>/goals/auto-roadmap  (roadmap completo)
 *    - POST /users/<id>/goals/auto-roadmap/save (persiste el roadmap activo)
 */
export const goalService = {
  /** Goal con status='accepted' del paciente (o null si no hay). */
  getActive(userId: number | string): Promise<SingleGoalResponse> {
    return api.get<SingleGoalResponse>(`/users/${userId}/goals?status=accepted`)
  },

  /** Propuesta pendiente esperando respuesta del paciente (o null). */
  getProposed(userId: number | string): Promise<SingleGoalResponse> {
    return api.get<SingleGoalResponse>(`/users/${userId}/goals?status=proposed`)
  },

  /** Crear goal. El status default depende del rol del caller:
   *   - paciente → 'accepted'
   *   - profesional/admin → 'proposed' */
  propose(userId: number | string, payload: ProposeGoalPayload): Promise<{ user_id: string; action: 'created' | 'updated'; goal: Goal }> {
    return api.post<{ user_id: string; action: 'created' | 'updated'; goal: Goal }>(
      `/users/${userId}/goals`,
      payload,
    )
  },

  accept(userId: number | string, goalId: number): Promise<{ goal: Goal; action: 'accepted' }> {
    return api.post(`/users/${userId}/goals/${goalId}/accept`)
  },

  reject(userId: number | string, goalId: number, notas?: string): Promise<{ goal: Goal; action: 'rejected' }> {
    return api.post(`/users/${userId}/goals/${goalId}/reject`, notas ? { notas } : {})
  },

  /** Cierra la fase actual. Si hay otra propuesta pendiente, queda lista para
   *  aceptar; si no, /next-step ya sugiere la siguiente fase del roadmap. */
  complete(userId: number | string, goalId: number, notas?: string): Promise<{ goal: Goal; action: 'completed' }> {
    return api.post(`/users/${userId}/goals/${goalId}/complete`, notas ? { notas } : {})
  },

  history(userId: number | string): Promise<{ user_id: string; patient_id: number; goals: Goal[]; count: number }> {
    return api.get(`/users/${userId}/goals/history`)
  },

  nextStep(userId: number | string): Promise<GoalNextStepResponse> {
    return api.get<GoalNextStepResponse>(`/users/${userId}/goals/next-step`)
  },

  /** Auto-calculated single-shot target (e.g. genetic ceiling). */
  getAutoTargets(userId: number | string): Promise<{ goal: Goal }> {
    return api.get<{ goal: Goal }>(`/users/${userId}/goals/auto`)
  },

  /** Multi-phase roadmap (cacheado si se persistió, recalculado si no). */
  getAutoRoadmap(userId: number | string): Promise<AutoRoadmapResponse> {
    return api.get<AutoRoadmapResponse>(`/users/${userId}/goals/auto-roadmap`)
  },

  saveAutoRoadmap(userId: number | string): Promise<AutoRoadmapResponse> {
    return api.post<AutoRoadmapResponse>(`/users/${userId}/goals/auto-roadmap/save`)
  },
}
