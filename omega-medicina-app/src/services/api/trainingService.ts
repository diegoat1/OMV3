// Training Service - Strength, lifts, plans, sessions, programs

import { apiClient } from './apiClient';
import { API_CONFIG } from './config';

const { ENDPOINTS } = API_CONFIG;

export interface StrengthData {
  id: number;
  user_id: number;
  fecha: string;
  total_score?: number;
  score_class?: string;
  bodyweight?: number;
  lifts_results_json?: string;
  categories_results_json?: string;
}

export interface Lift {
  ejercicio_nombre: string;
  last_test_reps?: number;
  current_columna?: number;
  current_peso?: number;
  lastre_adicional?: number;
}

export interface TrainingPlan {
  id: number;
  user_id: number;
  nombre?: string;
  tipo?: string;
  dias_entrenamiento?: number;
  fecha_creacion?: string;
  activo?: boolean;
}

export interface TrainingSession {
  titulo: string;
  ejercicios: string[];
  ultimo_test_info?: Record<string, any>;
}

export interface FreeProgram {
  id: string;
  nombre: string;
  descripcion?: string;
  duracion?: string;
  nivel?: string;
  disponible?: boolean;
}

export interface TodaySession {
  plan_id: number;
  plan_nombre: string;
  dia_actual: number;
  semana_actual: number;
  ejercicios: any[];
  already_done: boolean;
}

export const trainingService = {
  // Strength
  async getStrengthData(userId?: string) {
    const endpoint = userId
      ? `${ENDPOINTS.TRAINING_STRENGTH}?user=${userId}`
      : ENDPOINTS.TRAINING_STRENGTH;
    return apiClient.get<StrengthData>(endpoint);
  },

  async createStrengthRecord(data: any) {
    return apiClient.post<StrengthData>(ENDPOINTS.TRAINING_STRENGTH, data);
  },

  async getStrengthHistory(userId?: string, limit?: number) {
    let endpoint = ENDPOINTS.TRAINING_STRENGTH_HISTORY;
    const params: string[] = [];
    if (userId) params.push(`user=${userId}`);
    if (limit) params.push(`limit=${limit}`);
    if (params.length) endpoint += `?${params.join('&')}`;
    return apiClient.get<StrengthData[]>(endpoint);
  },

  async deleteStrengthRecord(recordId: number) {
    return apiClient.delete<any>(ENDPOINTS.TRAINING_STRENGTH_DELETE, { recordId: String(recordId) });
  },

  async getStrengthStandards() {
    return apiClient.get<any>(ENDPOINTS.TRAINING_STRENGTH_STANDARDS);
  },

  // Lifts
  async getLifts(userId?: string) {
    const endpoint = userId
      ? `${ENDPOINTS.TRAINING_LIFTS}?user=${userId}`
      : ENDPOINTS.TRAINING_LIFTS;
    return apiClient.get<Lift[]>(endpoint);
  },

  async saveLift(data: { ejercicio_nombre: string; peso?: number; reps?: number }) {
    return apiClient.post<Lift>(ENDPOINTS.TRAINING_LIFTS, data);
  },

  async getExercises() {
    return apiClient.get<string[]>(ENDPOINTS.TRAINING_EXERCISES);
  },

  // Training Plans
  async getPlans(userId?: string) {
    const endpoint = userId
      ? `${ENDPOINTS.TRAINING_PLANS}?user=${userId}`
      : ENDPOINTS.TRAINING_PLANS;
    return apiClient.get<TrainingPlan[]>(endpoint);
  },

  async getPlan(planId: number) {
    return apiClient.get<TrainingPlan>(ENDPOINTS.TRAINING_PLAN_DETAIL, { planId: String(planId) });
  },

  async optimizePlan(planId: number, data?: any) {
    return apiClient.post<any>(ENDPOINTS.TRAINING_PLAN_OPTIMIZE, data || {}, { planId: String(planId) });
  },

  // Sessions
  async getCurrentSession() {
    return apiClient.get<TrainingSession>(ENDPOINTS.TRAINING_SESSION_CURRENT);
  },

  async registerSession(data: { ejercicios: string[]; datosTest?: Record<string, any> }) {
    return apiClient.post<any>(ENDPOINTS.TRAINING_SESSIONS, data);
  },

  async advanceDay() {
    return apiClient.post<any>(ENDPOINTS.TRAINING_SESSION_ADVANCE, {});
  },

  async getSessionHistory(limit?: number) {
    const endpoint = limit
      ? `${ENDPOINTS.TRAINING_SESSION_HISTORY}?limit=${limit}`
      : ENDPOINTS.TRAINING_SESSION_HISTORY;
    return apiClient.get<any[]>(endpoint);
  },

  async getTodaySession() {
    return apiClient.get<TodaySession>(ENDPOINTS.TRAINING_SESSION_TODAY);
  },

  // Free Programs
  async getPrograms() {
    return apiClient.get<FreeProgram[]>(ENDPOINTS.TRAINING_PROGRAMS);
  },

  async getProgram(programId: string) {
    return apiClient.get<any>(ENDPOINTS.TRAINING_PROGRAM_DETAIL, { programId });
  },

  // Strength Submit (full analysis)
  async submitStrengthResults(data: {
    rawData: Record<string, any>;
    calculatedData: Record<string, any>;
    bodySvg?: string;
    selectedPatient?: string;
    customAnalysisDate?: string;
  }) {
    return apiClient.post<{ message: string; usuario: string }>(ENDPOINTS.TRAINING_STRENGTH_SUBMIT, data);
  },

  // Strength Admin (all users)
  async getAllStrengthAdmin() {
    return apiClient.get<{ registros: any[]; total: number }>(ENDPOINTS.TRAINING_STRENGTH_ADMIN);
  },

  // Training Optimizer (PuLP)
  async optimizeTraining(recordId: number, config: {
    numeroDias?: number;
    numeroEjercicios?: number;
    runningConfig?: {
      enabled: boolean;
      days?: number[];
      initialSpeed?: number;
      initialMinutes?: number;
    };
  }) {
    return apiClient.post<{
      relativeData: { categories: Record<string, any>; exercises: Record<string, any> };
      optimizationResults: {
        categorias: Record<string, number>;
        ejercicios: Record<string, number>;
        parametros: { numeroDias: number; numeroEjercicios: number; totalSesiones: number };
        planEntrenamiento: Record<string, string[]>;
      };
    }>(ENDPOINTS.TRAINING_STRENGTH_OPTIMIZE, config, { recordId: String(recordId) });
  },
};
