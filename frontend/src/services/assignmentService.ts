import { api } from './apiClient'
import type {
  AvailableSpecialistsResponse,
  MyPatient,
  MyRequest,
  MySpecialist,
  PatientRequestPayload,
  PendingAssignment,
} from '../types/api'

export const assignmentService = {
  // Patient side
  pendingForPatient(): Promise<{ pending: PendingAssignment[] }> {
    return api.get<{ pending: PendingAssignment[] }>('/assignments/pending')
  },
  mySpecialists(): Promise<{ specialists: MySpecialist[] }> {
    return api.get<{ specialists: MySpecialist[] }>('/assignments/my-specialists')
  },
  myOutgoingRequests(): Promise<{ requests: MyRequest[] }> {
    return api.get<{ requests: MyRequest[] }>('/assignments/my-outgoing-requests')
  },

  // Specialist side
  myPatients(): Promise<{ patients: MyPatient[] }> {
    return api.get<{ patients: MyPatient[] }>('/assignments/my-patients')
  },
  myRequests(): Promise<{ requests: MyRequest[] }> {
    return api.get<{ requests: MyRequest[] }>('/assignments/my-requests')
  },

  // Either side, depending on who's accepting
  accept(assignmentId: number): Promise<{ assignment_id: number; status: string }> {
    return api.post<{ assignment_id: number; status: string }>(
      `/assignments/${assignmentId}/accept`,
    )
  },
  reject(assignmentId: number, reason?: string): Promise<{ assignment_id: number; status: string }> {
    return api.post<{ assignment_id: number; status: string }>(
      `/assignments/${assignmentId}/reject`,
      reason ? { reason } : {},
    )
  },
  cancel(assignmentId: number): Promise<{ assignment_id: number; status: string }> {
    return api.post<{ assignment_id: number; status: string }>(
      `/assignments/${assignmentId}/cancel`,
    )
  },

  // Patient: browse available specialists + request a new link
  listAvailableSpecialists(role?: string, q?: string): Promise<AvailableSpecialistsResponse> {
    const params = new URLSearchParams()
    if (role) params.set('role', role)
    if (q) params.set('q', q)
    const qs = params.toString()
    return api.get<AvailableSpecialistsResponse>(`/assignments/specialists${qs ? '?' + qs : ''}`)
  },
  patientRequest(payload: PatientRequestPayload): Promise<{ assignment_id: number; status: string }> {
    return api.post<{ assignment_id: number; status: string }>('/assignments/patient-request', payload)
  },
}
