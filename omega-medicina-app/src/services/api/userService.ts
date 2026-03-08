// User Service - Profile, measurements, goals

import { apiClient } from './apiClient';
import { API_CONFIG, buildUrl } from './config';

const { ENDPOINTS } = API_CONFIG;

export interface UserProfile {
  dni: number;
  nombre_apellido: string;
  email?: string;
  sexo: string;
  fecha_nacimiento?: string;
  altura?: number;
  telefono?: string;
}

export interface Measurement {
  id: number;
  fecha: string;
  peso: number;
  circ_abdomen?: number;
  circ_cintura?: number;
  circ_cadera?: number;
  circ_hombro?: number;
  circ_pecho?: number;
  circ_brazo?: number;
  circ_antebrazo?: number;
  circ_muslo?: number;
  circ_pantorrilla?: number;
  bf_percent?: number;
  ffmi?: number;
  imc?: number;
  peso_magro?: number;
  peso_graso?: number;
}

export interface Goal {
  nombre_apellido?: string;
  peso_objetivo?: number;
  bf_objetivo?: number;
  ffmi_objetivo?: number;
  circ_abdomen_objetivo?: number;
  circ_cintura_objetivo?: number;
  circ_cadera_objetivo?: number;
  notas?: string;
  tipo?: 'manual' | 'auto';
  // DB column names (read)
  goal_peso?: number;
  goal_bf?: number;
  goal_ffmi?: number;
  goal_abdomen?: number;
  goal_cintura?: number;
  goal_cadera?: number;
}

export interface AutoGoal {
  datos_actuales: Record<string, number>;
  objetivos_geneticos: Record<string, number>;
  cambios_necesarios: Record<string, number>;
  tiempo_estimado: { meses: number; años: number };
  objetivos_parciales?: any[];
  metadata: { sexo: string; edad: number; altura: number };
}

export const userService = {
  async getUser(userId: string) {
    return apiClient.get<UserProfile>(ENDPOINTS.USER_DETAIL, { id: userId });
  },

  async updateUser(userId: string, data: Partial<UserProfile>) {
    return apiClient.put<UserProfile>(ENDPOINTS.USER_DETAIL, data, { id: userId });
  },

  async getMeasurements(userId: string, limit?: number) {
    const endpoint = limit
      ? `${ENDPOINTS.USER_MEASUREMENTS}?limit=${limit}`
      : ENDPOINTS.USER_MEASUREMENTS;
    return apiClient.get<Measurement[]>(endpoint, { id: userId });
  },

  async addMeasurement(userId: string, data: Partial<Measurement>) {
    return apiClient.post<Measurement>(ENDPOINTS.USER_MEASUREMENTS, data, { id: userId });
  },

  async deleteMeasurement(userId: string, measurementId: number) {
    return apiClient.delete<any>(ENDPOINTS.USER_MEASUREMENT_DELETE, {
      id: userId,
      measurementId: String(measurementId),
    });
  },

  async getGoals(userId: string) {
    return apiClient.get<Goal>(ENDPOINTS.USER_GOALS, { id: userId });
  },

  async saveGoal(userId: string, data: Partial<Goal>) {
    return apiClient.post<Goal>(ENDPOINTS.USER_GOALS, data, { id: userId });
  },

  async getAutoGoals(userId: string) {
    return apiClient.get<AutoGoal>(ENDPOINTS.USER_GOALS_AUTO, { id: userId });
  },

  async getGoalsRoadmap(userId: string) {
    return apiClient.get<AutoGoal>(ENDPOINTS.USER_GOALS_ROADMAP, { id: userId });
  },
};
