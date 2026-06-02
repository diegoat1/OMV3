import { api } from './apiClient'
import type { PreventionRequest, PreventionResponse } from '../types/api'

/** Wraps the OMV3 proxy to the USPSTF Prevention Task Force API.
 *
 *  The backend assembles the patient's age/sex/height/weight from clinical.db;
 *  the caller only passes the clinical overrides OMV3 doesn't store
 *  (tobacco, sexuallyActive, pregnant) and optional filters. */
export const preventionService = {
  /** POST /telemedicine/prevention/recommendations — recommended screenings
   *  for the authenticated patient (or `payload.patient` for a specialist). */
  getRecommendations(payload: PreventionRequest = {}): Promise<PreventionResponse> {
    return api.post<PreventionResponse>('/telemedicine/prevention/recommendations', payload)
  },
}
