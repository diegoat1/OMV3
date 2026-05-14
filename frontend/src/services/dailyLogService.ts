import { api } from './apiClient'
import type {
  DailyLogResponse,
  FoodsListResponse,
  SaveDailyLogPayload,
  SaveDailyLogResponse,
} from '../types/api'

/** Daily nutrition log: per-meal foods + macros for a given fecha.
 *  Backend storage: clinical.db `nutrition_daily_logs` (one row per
 *  patient×fecha×meal_key). The summary row is recomputed by the backend on
 *  every save — no need to upsert it from the client. */
export const dailyLogService = {
  /** GET /nutrition/daily-log?fecha=YYYY-MM-DD (auth: own logs by default).
   *  Pass `patient` (display name) when the caller is a specialist viewing
   *  someone else's log. */
  get(fecha: string, patient?: string): Promise<DailyLogResponse> {
    const params = new URLSearchParams({ fecha })
    if (patient) params.set('nombre_apellido', patient)
    return api.get<DailyLogResponse>(`/nutrition/daily-log?${params.toString()}`)
  },

  /** POST /nutrition/daily-log — upsert one or more meals for a fecha.
   *  Backend recomputes the summary and per-meal score. */
  save(payload: SaveDailyLogPayload): Promise<SaveDailyLogResponse> {
    return api.post<SaveDailyLogResponse>('/nutrition/daily-log', payload)
  },

  /** GET /nutrition/foods?q=… — search the ALIMENTOS catalog. */
  searchFoods(q: string, perPage = 30): Promise<FoodsListResponse> {
    const params = new URLSearchParams({ per_page: String(perPage) })
    if (q) params.set('q', q)
    return api.get<FoodsListResponse>(`/nutrition/foods?${params.toString()}`)
  },

  /** GET /nutrition/daily-log/history?days=N — daily summaries for the last N days. */
  history(days = 14, patient?: string): Promise<{ history: Array<{ fecha: string; total_cal: number; meals_completed: number; meals_total: number; daily_score: number }> }> {
    const params = new URLSearchParams({ days: String(days) })
    if (patient) params.set('nombre_apellido', patient)
    return api.get(`/nutrition/daily-log/history?${params.toString()}`)
  },
}
