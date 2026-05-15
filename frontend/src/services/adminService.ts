import { api } from './apiClient'
import type {
  AdminAuditResponse,
  AdminAuthUsersResponse,
  AdminDashboardStats,
  AdminDatabaseName,
  AdminModuleStats,
  AdminTableDataResponse,
  AdminTableExport,
  AdminTablesResponse,
  ApprovePayload,
  ApproveResponse,
  PendingUsersResponse,
  RejectPayload,
} from '../types/api'

export const adminService = {
  /** Aggregated counters for the admin dashboard. */
  dashboardStats(): Promise<AdminDashboardStats> {
    return api.get<AdminDashboardStats>('/admin/dashboard-stats')
  },

  /** Module-level counters (nutrition catalog, training plans, telemed). */
  moduleStats(): Promise<AdminModuleStats> {
    return api.get<AdminModuleStats>('/admin/stats')
  },

  /** Pending email-verified + admin-approval queue. */
  listPendingUsers(): Promise<PendingUsersResponse> {
    return api.get<PendingUsersResponse>('/admin/pending-users')
  },

  /** Full auth.db user list. Supports search and status filter. */
  listAuthUsers(opts: { q?: string; status?: string } = {}): Promise<AdminAuthUsersResponse> {
    const params = new URLSearchParams()
    if (opts.q) params.set('q', opts.q)
    if (opts.status) params.set('status', opts.status)
    const qs = params.toString()
    return api.get<AdminAuthUsersResponse>(`/admin/auth-users${qs ? '?' + qs : ''}`)
  },

  /** Paginated patient roster from clinical.db (distinct from auth-users
   *  which lists every login). */
  listPatients(opts: { page?: number; per_page?: number } = {}): Promise<unknown> {
    const params = new URLSearchParams()
    if (opts.page) params.set('page', String(opts.page))
    if (opts.per_page) params.set('per_page', String(opts.per_page))
    const qs = params.toString()
    return api.get<unknown>(`/admin/users${qs ? '?' + qs : ''}`)
  },
  /** Detail for a single clinical.db patient. */
  getPatient(patientId: string | number): Promise<unknown> {
    return api.get<unknown>(`/admin/users/${patientId}`)
  },
  /** Free-text search of clinical.db patients (name/email). */
  searchPatients(q: string, limit: number = 20): Promise<unknown> {
    return api.get<unknown>(`/admin/users/search?q=${encodeURIComponent(q)}&limit=${limit}`)
  },

  approveUser(userId: number, payload: ApprovePayload = {}): Promise<ApproveResponse> {
    return api.post<ApproveResponse>(`/admin/auth-users/${userId}/approve`, payload)
  },
  rejectUser(userId: number, payload: RejectPayload): Promise<{ user_id: number; status: string }> {
    return api.post<{ user_id: number; status: string }>(`/admin/auth-users/${userId}/reject`, payload)
  },
  toggleActive(userId: number): Promise<{ user_id: number; is_active: boolean }> {
    return api.post<{ user_id: number; is_active: boolean }>(`/admin/auth-users/${userId}/toggle-active`)
  },
  /** Toggle a single role for the user. Server returns the new CSV string. */
  toggleRole(userId: number, role: 'doctor' | 'admin' | 'nutricionista' | 'entrenador' | 'user'): Promise<{ user_id: number; roles: string }> {
    return api.post<{ user_id: number; roles: string }>(`/admin/auth-users/${userId}/role`, { role })
  },
  deleteUser(userId: number): Promise<{ user_id: number }> {
    return api.delete<{ user_id: number }>(`/admin/auth-users/${userId}`)
  },

  /** Audit log entries (last N actions). */
  audit(limit: number = 50): Promise<AdminAuditResponse> {
    return api.get<AdminAuditResponse>(`/admin/audit?limit=${limit}`)
  },

  /* ──────────────── Database viewer ──────────────── */

  listTables(): Promise<AdminTablesResponse> {
    return api.get<AdminTablesResponse>('/admin/database/tables')
  },
  getTable(tableName: string, opts: { database?: AdminDatabaseName; page?: number; per_page?: number } = {}): Promise<AdminTableDataResponse> {
    const params = new URLSearchParams()
    if (opts.database) params.set('database', opts.database)
    if (opts.page) params.set('page', String(opts.page))
    if (opts.per_page) params.set('per_page', String(opts.per_page))
    const qs = params.toString()
    return api.get<AdminTableDataResponse>(`/admin/database/tables/${tableName}${qs ? '?' + qs : ''}`)
  },
  updateTableRow(
    tableName: string,
    rowId: string | number,
    payload: { column: string; value: unknown },
    database: AdminDatabaseName = 'main',
  ) {
    return api.put<{ table: string; row_id: string; column: string; new_value: unknown }>(
      `/admin/database/tables/${tableName}/${rowId}?database=${database}`,
      payload,
    )
  },
  exportTable(tableName: string, database: AdminDatabaseName = 'main'): Promise<AdminTableExport> {
    return api.get<AdminTableExport>(`/admin/database/export/${tableName}?database=${database}`)
  },
}
