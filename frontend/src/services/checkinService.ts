import { api } from './apiClient'
import type {
  CheckinPayload,
  CheckinRow,
  HealthIndex,
  HealthIndexTrendResponse,
  SubmitCheckinResponse,
} from '../types/api'

/** Daily check-in + Health Index endpoints (/api/v3/checkin/*).
 *  All endpoints are owner-only (no specialist param) — they resolve the
 *  authenticated user via `nombre_apellido`. */
export const checkinService = {
  /** GET /checkin/today — today's row (or null if not filled yet). */
  getToday(): Promise<CheckinRow | null> {
    return api.get<CheckinRow | null>('/checkin/today')
  },

  /** POST /checkin/today — upsert today's fields. Returns the saved row +
   *  the recomputed Health Index. */
  submitToday(payload: CheckinPayload): Promise<SubmitCheckinResponse> {
    return api.post<SubmitCheckinResponse>('/checkin/today', payload)
  },

  /** GET /checkin/health-index — today's Health Index (calculated on the fly
   *  if missing from history). */
  getHealthIndex(): Promise<HealthIndex> {
    return api.get<HealthIndex>('/checkin/health-index')
  },

  /** GET /checkin/health-index/trend?days=N — daily scores over the last N days. */
  getHealthIndexTrend(days = 30): Promise<HealthIndexTrendResponse> {
    return api.get<HealthIndexTrendResponse>(`/checkin/health-index/trend?days=${days}`)
  },
}
