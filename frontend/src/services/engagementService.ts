import { api } from './apiClient'
import type {
  CreateReminderPayload,
  CreateTaskPayload,
  InsightsResponse,
  Reminder,
  RemindersResponse,
  TaskStatus,
  TasksResponse,
  UserTask,
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

/** /api/v3/engagement — reminders, tasks, insights, performance for the
 *  authenticated patient. All endpoints are owner-only. */
export const engagementService = {
  /* ──────────── Reminders ──────────── */
  listReminders(opts: { status?: 'pending' | 'completed' | 'all'; limit?: number } = {}): Promise<RemindersResponse> {
    return api.get<RemindersResponse>(`/engagement/reminders${qs(opts)}`)
  },
  createReminder(payload: CreateReminderPayload): Promise<Reminder> {
    return api.post<Reminder>('/engagement/reminders', payload)
  },
  completeReminder(reminderId: number): Promise<{ id: number; status: 'completed' }> {
    return api.patch<{ id: number; status: 'completed' }>(`/engagement/reminders/${reminderId}/complete`)
  },
  deleteReminder(reminderId: number): Promise<{ id: number }> {
    return api.delete<{ id: number }>(`/engagement/reminders/${reminderId}`)
  },

  /* ──────────── Tasks ──────────── */
  listTasks(opts: { status?: TaskStatus | 'all'; category?: string; limit?: number } = {}): Promise<TasksResponse> {
    return api.get<TasksResponse>(`/engagement/tasks${qs(opts)}`)
  },
  createTask(payload: CreateTaskPayload): Promise<UserTask> {
    return api.post<UserTask>('/engagement/tasks', payload)
  },
  updateTask(taskId: number, patch: Partial<UserTask>): Promise<UserTask> {
    return api.patch<UserTask>(`/engagement/tasks/${taskId}`, patch)
  },
  deleteTask(taskId: number): Promise<{ id: number }> {
    return api.delete<{ id: number }>(`/engagement/tasks/${taskId}`)
  },

  /* ──────────── Insights & performance ──────────── */
  insights(): Promise<InsightsResponse> {
    return api.get<InsightsResponse>('/engagement/insights')
  },
  performance(period: 'week' | 'month' | 'year' = 'week'): Promise<{ period: string; data: Record<string, unknown> }> {
    return api.get<{ period: string; data: Record<string, unknown> }>(`/engagement/performance?period=${period}`)
  },
}
