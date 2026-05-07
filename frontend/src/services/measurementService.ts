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
  update(
    userId: number | string,
    measurementId: number,
    payload: Partial<NewMeasurementPayload>,
  ): Promise<Measurement> {
    return api.put<Measurement>(`/users/${userId}/measurements/${measurementId}`, payload)
  },
}
