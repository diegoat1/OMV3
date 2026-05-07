import { api } from './apiClient'
import type {
  AcceptOptionPayload,
  AcceptOptionResponse,
  AdjustCaloriesPayload,
  AdjustCaloriesResponse,
  AutoCalculatePayload,
  AutoCalculateResponse,
  CreatePlanPayload,
  CreatePlanResponse,
  GetPlanResponse,
  ListPlansResponse,
  SaveConfigPayload,
  SaveConfigResponse,
  SolveMealPayload,
  SolveMealResponse,
  UpdatePlanMacrosPayload,
  UpdatePlanResponse,
  UpdatePlanStructurePayload,
} from '../types/api'

/** Wraps the v3 nutrition endpoints exposed at /api/v3/nutrition/*.
 *
 *  Permission model (Fix 18 — OMV-45):
 *  - `updatePlanMacros` requires admin or assigned specialist.
 *  - `updatePlanStructure` is open to the patient owner too.
 *  - The general `updatePlan` rejects with 403 when a patient tries to touch
 *    macros — split your edit into the two specific endpoints when the caller
 *    is a patient. */
export const nutritionService = {
  /** GET /nutrition/plans — caller's own plans, or `?patient=<name>` for
   *  admin/specialist. Returns most-recent first. */
  listPlans(patient?: string): Promise<ListPlansResponse> {
    const qs = patient ? `?patient=${encodeURIComponent(patient)}` : ''
    return api.get<ListPlansResponse>(`/nutrition/plans${qs}`)
  },

  getPlan(planId: number): Promise<GetPlanResponse> {
    return api.get<GetPlanResponse>(`/nutrition/plans/${planId}`)
  },

  createPlan(payload: CreatePlanPayload): Promise<CreatePlanResponse> {
    return api.post<CreatePlanResponse>('/nutrition/plans', payload)
  },

  /** General update — accepts both macros and structure fields, but rejects
   *  with 403 if the caller is a patient and the body contains macros. Prefer
   *  `updatePlanMacros` / `updatePlanStructure` to express intent explicitly. */
  updatePlan(
    planId: number,
    payload: UpdatePlanMacrosPayload & UpdatePlanStructurePayload,
  ): Promise<UpdatePlanResponse> {
    return api.put<UpdatePlanResponse>(`/nutrition/plans/${planId}`, payload)
  },

  /** PUT /plans/<id>/macros — admin/specialist only. */
  updatePlanMacros(planId: number, payload: UpdatePlanMacrosPayload): Promise<UpdatePlanResponse> {
    return api.put<UpdatePlanResponse>(`/nutrition/plans/${planId}/macros`, payload)
  },

  /** PUT /plans/<id>/structure — patient owner OK. */
  updatePlanStructure(planId: number, payload: UpdatePlanStructurePayload): Promise<UpdatePlanResponse> {
    return api.put<UpdatePlanResponse>(`/nutrition/plans/${planId}/structure`, payload)
  },

  deletePlan(planId: number): Promise<{ id: number; deleted: true }> {
    return api.delete<{ id: number; deleted: true }>(`/nutrition/plans/${planId}`)
  },

  /** Auto-calculate macros from current measurements + active goal. Pure
   *  computation, does NOT persist — call `acceptAutoCalculate` to commit. */
  autoCalculate(payload: AutoCalculatePayload = {}): Promise<AutoCalculateResponse> {
    return api.post<AutoCalculateResponse>('/nutrition/plans/auto-calculate', payload)
  },

  /** Persist a chosen `OpcionVelocidad` from `autoCalculate` as a new plan. */
  acceptAutoCalculate(payload: AcceptOptionPayload): Promise<AcceptOptionResponse> {
    return api.post<AcceptOptionResponse>('/nutrition/plans/auto-calculate/accept', payload)
  },

  /** Configure meal sizes + multi-training timing/intensity. Persists
   *  `entreno_meal_keys_json`, `entreno_intensidad`, `comidas_config_json`
   *  on the plan so the config survives across calls. */
  saveConfig(payload: SaveConfigPayload): Promise<SaveConfigResponse> {
    return api.post<SaveConfigResponse>('/nutrition/meal-plans/save-config', payload)
  },

  /** Solver: optimize quantities to hit macro targets. Pass `meal_key` to use
   *  per-meal targets from the patient's plan, or `objetivo` to specify
   *  targets directly. */
  solveMeal(payload: SolveMealPayload): Promise<SolveMealResponse> {
    return api.post<SolveMealResponse>('/nutrition/solve-meal', payload)
  },

  /** Bumps daily calories on a plan and recomputes proteina/grasa/ch
   *  proportionally using lean-mass-aware defaults. */
  adjustCalories(planId: number, payload: AdjustCaloriesPayload): Promise<AdjustCaloriesResponse> {
    return api.post<AdjustCaloriesResponse>(`/nutrition/plans/${planId}/adjust-calories`, payload)
  },
}
