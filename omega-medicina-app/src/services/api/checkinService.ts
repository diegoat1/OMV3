// Check-in diario & Health Index service

import { apiClient } from './apiClient';
import { API_CONFIG } from './config';

const EP = API_CONFIG.ENDPOINTS;

// ============================================
// TYPES
// ============================================

export type AlcoholLevel = 'no' | 'poco' | 'moderado' | 'mucho';

export type SystemaType =
  | 'respiratorio' | 'orl' | 'cardiologico' | 'genitourinario'
  | 'musculoesqueletico' | 'neurologico' | 'piel' | 'temperatura';

export interface DailyCheckin {
  id: number;
  patient_id: number;
  fecha: string;
  // Hábitos
  fumo: boolean;
  alcohol: AlcoholLevel;
  actividad_fisica: boolean;
  actividad_tipo?: string;
  actividad_minutos?: number;
  horas_sueno?: number;
  calidad_sueno?: number;
  estres?: number;
  energia?: number;
  animo?: number;
  // Digestivo
  deposicion?: boolean;
  deposicion_veces?: number;
  bristol?: number;
  dolor_abdominal: boolean;
  sangre_moco: boolean;
  // Autocuidado
  hidratacion_litros?: number;
  hambre_ansiedad?: number;
  tomo_medicacion: boolean;
  medicacion_detalle?: string;
  // Meta
  completado: boolean;
  created_at: string;
}

export interface SymptomEvent {
  id: number;
  patient_id: number;
  checkin_id?: number;
  fecha: string;
  sistema: SystemaType;
  descripcion?: string;
  intensidad?: number;
  detalle_json?: string;
  detalle?: Record<string, any>;
  created_at: string;
}

export interface HealthIndexResult {
  patient_id: number;
  fecha: string;
  score: number;
  comp_corporal: number;
  comp_cintura: number;
  comp_actividad: number;
  comp_sueno: number;
  comp_recuperacion: number;
  comp_digestivo: number;
  comp_habitos: number;
}

export interface CheckinStats {
  periodo: string;
  dias_completados: number;
  adherencia_pct: number;
  avg_sueno: number;
  avg_horas_sueno: number;
  avg_estres: number;
  avg_energia: number;
  avg_animo: number;
  avg_hidratacion: number;
}

export interface HealthIndexTrend {
  trend: Array<{
    fecha: string;
    score: number;
    comp_corporal: number;
    comp_cintura: number;
    comp_actividad: number;
    comp_sueno: number;
    comp_recuperacion: number;
    comp_digestivo: number;
    comp_habitos: number;
  }>;
  total: number;
}

// ============================================
// SERVICE
// ============================================

export const checkinService = {
  // Check-in de hoy
  async getToday() {
    return apiClient.get<DailyCheckin | null>(EP.CHECKIN_TODAY);
  },

  async submitToday(data: Partial<DailyCheckin>) {
    return apiClient.post<{ checkin: DailyCheckin; health_index: HealthIndexResult }>(EP.CHECKIN_TODAY, data);
  },

  // Historial
  async getHistory(limit = 14, desde?: string) {
    const params: string[] = [`limit=${limit}`];
    if (desde) params.push(`desde=${desde}`);
    return apiClient.get<DailyCheckin[]>(`${EP.CHECKIN_HISTORY}?${params.join('&')}`);
  },

  // Stats semanales
  async getStats() {
    return apiClient.get<CheckinStats>(EP.CHECKIN_STATS);
  },

  // Síntomas
  async submitSymptom(data: {
    sistema: SystemaType;
    descripcion?: string;
    intensidad?: number;
    detalle?: Record<string, any>;
  }) {
    return apiClient.post<SymptomEvent>(EP.CHECKIN_SYMPTOMS, data);
  },

  async getSymptoms(days = 7) {
    return apiClient.get<SymptomEvent[]>(`${EP.CHECKIN_SYMPTOMS}?days=${days}`);
  },

  // Health Index
  async getHealthIndex() {
    return apiClient.get<HealthIndexResult>(EP.CHECKIN_HEALTH_INDEX);
  },

  async getHealthIndexTrend(days = 30) {
    return apiClient.get<HealthIndexTrend>(`${EP.CHECKIN_HEALTH_INDEX_TREND}?days=${days}`);
  },
};
