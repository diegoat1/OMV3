import { api } from './apiClient'
import type {
  ApprovePayload,
  ApproveResponse,
  PendingUsersResponse,
  RejectPayload,
} from '../types/api'

export const adminService = {
  listPendingUsers(): Promise<PendingUsersResponse> {
    return api.get<PendingUsersResponse>('/admin/pending-users')
  },
  approveUser(userId: number, payload: ApprovePayload = {}): Promise<ApproveResponse> {
    return api.post<ApproveResponse>(`/admin/auth-users/${userId}/approve`, payload)
  },
  rejectUser(userId: number, payload: RejectPayload): Promise<{ user_id: number; status: string }> {
    return api.post<{ user_id: number; status: string }>(`/admin/auth-users/${userId}/reject`, payload)
  },
}
