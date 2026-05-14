import { api } from './apiClient'
import type {
  Measurement,
  MeasurementsResponse,
  NewMeasurementPayload,
} from '../types/api'

export const measurementService = {
  list(userId: number | string, limit = 50): Promise<MeasurementsResponse> {
    return api.get<MeasurementsResponse>(`/users/${userId}/measurements?limit=${limit}`)
  },
  create(userId: number | string, payload: NewMeasurementPayload): Promise<Measurement> {
    return api.post<Measurement>(`/users/${userId}/measurements`, payload)
  },
  /** Delete one measurement row (specialist/admin or owner).
   *  Backend exposes DELETE only — there is no PUT/PATCH for individual
   *  measurements; create a new one if values changed. */
  delete(userId: number | string, measurementId: number): Promise<{ id: number }> {
    return api.delete<{ id: number }>(`/users/${userId}/measurements/${measurementId}`)
  },
}
