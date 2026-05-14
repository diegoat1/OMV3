import { api } from './apiClient'
import type {
  AutoRoadmapResponse,
  Goal,
  ProposeGoalPayload,
  SingleGoalResponse,
} from '../types/api'

/** Goals endpoints — aligned strictly with what /api/v3/users/<id>/goals
 *  actually exposes today:
 *    - GET    /users/<id>/goals
 *    - POST   /users/<id>/goals
 *    - GET    /users/<id>/goals/auto
 *    - GET    /users/<id>/goals/auto-roadmap
 *
 *  The legacy lifecycle (status=proposed/accept/reject/complete/roadmap
 *  persistence/next-step) was removed because the backend has no schema for
 *  it (single `activo` boolean) and no endpoints. Callers should treat any
 *  returned goal as the patient's currently-active goal.
 */
export const goalService = {
  /** Fetch the patient's active goal (or null if none). */
  getActive(userId: number | string): Promise<SingleGoalResponse> {
    return api.get<SingleGoalResponse>(`/users/${userId}/goals`)
  },

  /** Propose (= create-or-update) a goal. Owner/admin/professional all hit
   *  the same endpoint; whichever role calls it becomes the active goal. */
  propose(userId: number | string, payload: ProposeGoalPayload): Promise<{ user_id: string; action: 'created' | 'updated' }> {
    return api.post<{ user_id: string; action: 'created' | 'updated' }>(
      `/users/${userId}/goals`,
      payload,
    )
  },

  /** Auto-calculated single-shot target (e.g. genetic ceiling). */
  getAutoTargets(userId: number | string): Promise<{ goal: Goal }> {
    return api.get<{ goal: Goal }>(`/users/${userId}/goals/auto`)
  },

  /** Multi-phase roadmap calculated on the fly (not persisted server-side). */
  getAutoRoadmap(userId: number | string): Promise<AutoRoadmapResponse> {
    return api.get<AutoRoadmapResponse>(`/users/${userId}/goals/auto-roadmap`)
  },
}
