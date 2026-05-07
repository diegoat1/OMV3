import { api } from './apiClient'
import type {
  AutoRoadmapResponse,
  Goal,
  GoalStatus,
  GoalsResponse,
  NextStepResponse,
  ProposeGoalPayload,
  SavedRoadmap,
  SingleGoalResponse,
} from '../types/api'

export const goalService = {
  /** GET /users/<id>/goals?status=...
   *  - With a specific status, the backend returns a single `goal` (or null).
   *  - With status='all' or omitted, returns `goals[]`. */
  getActive(userId: number | string): Promise<SingleGoalResponse> {
    return api.get<SingleGoalResponse>(`/users/${userId}/goals?status=active`)
  },
  getProposed(userId: number | string): Promise<SingleGoalResponse> {
    return api.get<SingleGoalResponse>(`/users/${userId}/goals?status=proposed`)
  },
  list(userId: number | string, status?: GoalStatus | 'all'): Promise<GoalsResponse> {
    const qs = status ? `?status=${status}` : ''
    return api.get<GoalsResponse>(`/users/${userId}/goals${qs}`)
  },
  history(userId: number | string): Promise<GoalsResponse> {
    return api.get<GoalsResponse>(`/users/${userId}/goals/history`)
  },

  /** Propose a new goal. The backend decides status based on the caller:
   *  owner/admin → active; specialist → proposed (awaits patient accept). */
  propose(userId: number | string, payload: ProposeGoalPayload): Promise<{ goal: Goal; message: string }> {
    return api.post<{ goal: Goal; message: string }>(`/users/${userId}/goals`, payload)
  },

  accept(userId: number | string, goalId: number): Promise<{ goal_id: number; status: string }> {
    return api.post<{ goal_id: number; status: string }>(`/users/${userId}/goals/${goalId}/accept`)
  },
  reject(userId: number | string, goalId: number, reason?: string): Promise<{ goal_id: number; status: string }> {
    return api.post<{ goal_id: number; status: string }>(
      `/users/${userId}/goals/${goalId}/reject`,
      reason ? { reason } : {},
    )
  },
  complete(userId: number | string, goalId: number): Promise<{ goal_id: number; status: string }> {
    return api.post<{ goal_id: number; status: string }>(`/users/${userId}/goals/${goalId}/complete`)
  },

  /** Calcula (en memoria, no persiste) el roadmap multi-fase desde el estado
   *  actual del paciente hasta el límite genético. */
  getAutoRoadmap(userId: number | string): Promise<AutoRoadmapResponse> {
    return api.get<AutoRoadmapResponse>(`/users/${userId}/goals/auto-roadmap`)
  },

  /** Persiste el roadmap calculado (archiva los anteriores activos del paciente). */
  saveAutoRoadmap(
    userId: number | string,
    payload: AutoRoadmapResponse,
  ): Promise<{ roadmap_id: number; total_phases: number; active: boolean; patient_id: number }> {
    return api.post<{ roadmap_id: number; total_phases: number; active: boolean; patient_id: number }>(
      `/users/${userId}/goals/auto-roadmap/save`,
      payload,
    )
  },

  /** Roadmap activo persistido del paciente (con sus fases). */
  getActiveRoadmap(userId: number | string): Promise<{ roadmap: SavedRoadmap | null }> {
    return api.get<{ roadmap: SavedRoadmap | null }>(`/users/${userId}/goals/roadmap`)
  },

  /** Próxima fase pendiente del roadmap activo. */
  getNextStep(userId: number | string): Promise<NextStepResponse> {
    return api.get<NextStepResponse>(`/users/${userId}/goals/next-step`)
  },
}
