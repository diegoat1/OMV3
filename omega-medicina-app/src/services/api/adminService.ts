// Admin Service - Dashboard stats, user management, audit logs

import { apiClient } from './apiClient';
import { API_CONFIG } from './config';

const { ENDPOINTS } = API_CONFIG;

export interface DashboardStats {
  total_users: number;
  active_users: number;
  doctors: number;
  admins: number;
  nutricionistas: number;
  entrenadores: number;
  pending_verification: number;
}

export interface AdminUser {
  id: number;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
  status: string;
  telefono: string;
  desired_role: string;
  patient_dni: string;
  created_at: string;
}

export interface AuditEntry {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export const adminService = {
  // Dashboard
  async getDashboardStats() {
    return apiClient.get<{ success: boolean; data: DashboardStats }>(ENDPOINTS.ADMIN_DASHBOARD_STATS);
  },

  // Users
  async getAuthUsers() {
    return apiClient.get<{ success: boolean; data: { users: AdminUser[] } }>(ENDPOINTS.ADMIN_AUTH_USERS);
  },

  async getPendingUsers() {
    return apiClient.get<{ success: boolean; data: { users: AdminUser[] } }>(ENDPOINTS.ADMIN_PENDING_USERS);
  },

  async approveUser(userId: number) {
    return apiClient.post<any>(ENDPOINTS.ADMIN_APPROVE_USER, {}, { id: String(userId) });
  },

  async rejectUser(userId: number) {
    return apiClient.post<any>(ENDPOINTS.ADMIN_REJECT_USER, {}, { id: String(userId) });
  },

  async toggleActive(userId: number) {
    return apiClient.post<any>(ENDPOINTS.ADMIN_TOGGLE_ACTIVE, {}, { id: String(userId) });
  },

  async updateRole(userId: number, role: string) {
    return apiClient.post<any>(ENDPOINTS.ADMIN_UPDATE_ROLE, { role }, { id: String(userId) });
  },

  async deleteUser(userId: number) {
    return apiClient.delete<any>(ENDPOINTS.ADMIN_DELETE_USER, { id: String(userId) });
  },

  // Audit
  async getAuditLog(limit: number = 100) {
    return apiClient.get<{ success: boolean; data: { entries: AuditEntry[] } }>(
      `${ENDPOINTS.ADMIN_AUDIT}?limit=${limit}`
    );
  },
};
