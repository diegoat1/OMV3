import { api } from './apiClient'
import type {
  CheckinHistoryResponse,
  CheckinPayload,
  CheckinRow,
  CheckinStats,
  CreateSymptomPayload,
  HealthIndex,
  HealthIndexTrendResponse,
  SubmitCheckinResponse,
  SymptomRow,
  SymptomsResponse,
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

  /** GET /checkin/history?days=N — full check-in rows for the last N days. */
  getHistory(days = 30): Promise<CheckinHistoryResponse> {
    return api.get<CheckinHistoryResponse>(`/checkin/history${qs({ days })}`)
  },

  /** GET /checkin/stats — adherence + averages. */
  getStats(opts: { days?: number } = {}): Promise<CheckinStats> {
    return api.get<CheckinStats>(`/checkin/stats${qs(opts)}`)
  },

  /** GET /checkin/symptoms — patient-reported symptoms list. */
  listSymptoms(opts: { tipo?: string; days?: number } = {}): Promise<SymptomsResponse> {
    return api.get<SymptomsResponse>(`/checkin/symptoms${qs(opts)}`)
  },

  /** POST /checkin/symptoms — log a new symptom. */
  reportSymptom(payload: CreateSymptomPayload): Promise<SymptomRow> {
    return api.post<SymptomRow>('/checkin/symptoms', payload)
  },
}
