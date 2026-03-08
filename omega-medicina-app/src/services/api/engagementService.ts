// Engagement Service - Reminders, Tasks, Insights, Performance

import { apiClient } from './apiClient';
import { API_CONFIG } from './config';

const { ENDPOINTS } = API_CONFIG;

export interface Reminder {
  id: number;
  user_dni: string;
  titulo: string;
  descripcion?: string;
  tipo?: string;
  prioridad?: string;
  fecha_vencimiento?: string;
  completado: boolean;
  fecha_creacion?: string;
  fecha_completado?: string;
}

export interface Task {
  id: number;
  user_dni: string;
  titulo: string;
  descripcion?: string;
  categoria?: string;
  estado: 'pending' | 'in_progress' | 'completed';
  progreso: number;
  fecha_limite?: string;
  fecha_creacion?: string;
  fecha_completado?: string;
  metadata?: Record<string, any>;
}

export interface Insight {
  id: string;
  tipo: string;
  icono: string;
  titulo: string;
  mensaje: string;
  prioridad: 'positive' | 'warning' | 'info' | 'tip';
}

export interface PerformanceData {
  period: string;
  days: number;
  engagement_score: number;
  training: { sessions: number; total_minutes: number };
  tasks: { completed: number; total: number };
  reminders_completed: number;
  measurements: number;
  strength_tests: number;
}

export const engagementService = {
  // Reminders
  async getReminders(status?: string) {
    const endpoint = status
      ? `${ENDPOINTS.ENGAGE_REMINDERS}?status=${status}`
      : ENDPOINTS.ENGAGE_REMINDERS;
    return apiClient.get<Reminder[]>(endpoint);
  },

  async createReminder(data: Partial<Reminder>) {
    return apiClient.post<Reminder>(ENDPOINTS.ENGAGE_REMINDERS, data);
  },

  async completeReminder(id: number) {
    return apiClient.patch<any>(ENDPOINTS.ENGAGE_REMINDER_COMPLETE, {}, { id: String(id) });
  },

  async deleteReminder(id: number) {
    return apiClient.delete<any>(ENDPOINTS.ENGAGE_REMINDER_DELETE, { id: String(id) });
  },

  // Tasks
  async getTasks(status?: string, category?: string) {
    const params: string[] = [];
    if (status) params.push(`status=${status}`);
    if (category) params.push(`category=${category}`);
    const endpoint = params.length
      ? `${ENDPOINTS.ENGAGE_TASKS}?${params.join('&')}`
      : ENDPOINTS.ENGAGE_TASKS;
    return apiClient.get<Task[]>(endpoint);
  },

  async createTask(data: Partial<Task>) {
    return apiClient.post<Task>(ENDPOINTS.ENGAGE_TASKS, data);
  },

  async updateTask(id: number, data: Partial<Task>) {
    return apiClient.patch<Task>(ENDPOINTS.ENGAGE_TASK_DETAIL, data, { id: String(id) });
  },

  async deleteTask(id: number) {
    return apiClient.delete<any>(ENDPOINTS.ENGAGE_TASK_DETAIL, { id: String(id) });
  },

  // Insights
  async getInsights() {
    return apiClient.get<Insight[]>(ENDPOINTS.ENGAGE_INSIGHTS);
  },

  // Performance
  async getPerformance(period?: 'week' | 'month' | 'quarter') {
    const endpoint = period
      ? `${ENDPOINTS.ENGAGE_PERFORMANCE}?period=${period}`
      : ENDPOINTS.ENGAGE_PERFORMANCE;
    return apiClient.get<PerformanceData>(endpoint);
  },
};
