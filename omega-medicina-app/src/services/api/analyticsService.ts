// Analytics Service - Dashboard, body composition, scores, calculators

import { apiClient } from './apiClient';
import { API_CONFIG } from './config';

const { ENDPOINTS } = API_CONFIG;

export interface DashboardData {
  user: string;
  composicion_corporal: {
    peso: number;
    bf_percent: number;
    ffmi: number;
    peso_magro: number;
    peso_graso: number;
    altura: number;
    imc: number;
    abdomen: number;
  };
  scores: {
    score_bf: number;
    score_ffmi: number;
    score_total: number;
    categoria_bf: string;
    categoria_ffmi: string;
  };
  categorias: {
    bf_categoria: string;
    ffmi_categoria: string;
    imc_categoria: string;
    abdomen_riesgo: string;
    tipo_corporal: string;
    factor: number;
  };
  agua_recomendada_litros: number;
  deltas: {
    deltapeso_g: number;
    deltapg_g: number;
    deltapm_g: number;
    deltaimc_pct: number;
    deltaffmi_pct: number;
    deltabf_pct: number;
  };
  historial: {
    imc: number[];
    ffmi: number[];
    bf: number[];
  };
  tasas: {
    fatrate: number;
    leanrate: number;
  };
  performance_clock: any;
  analisis_completo: {
    tiene_datos: boolean;
    estado_actual: any;
    objetivo_definido: any;
    plan_nutricional: any;
    diferencias: any;
    tasas_esperadas: any;
    tasas_actuales: any;
    comparacion_periodos: any;
    diagnostico: any;
  };
  plan_nutricional?: any;
  objetivo?: any;
  metadata: {
    sexo: string;
    altura: number;
    total_registros: number;
  };
  fecha_actualizacion: string;
}

export interface BodyComposition {
  peso: number;
  imc: number;
  bf_percentage: number;
  ffmi: number;
  peso_magro: number;
  peso_graso: number;
}

export interface ScoreData {
  score_bf: number;
  score_ffmi: number;
  score_total: number;
  categoria_bf: string;
  categoria_ffmi: string;
}

export const analyticsService = {
  async getDashboard(userId?: string, { dni }: { dni?: string } = {}) {
    const endpoint = dni
      ? `${ENDPOINTS.ANALYTICS_DASHBOARD}?user=${dni}`
      : userId
        ? `${ENDPOINTS.ANALYTICS_DASHBOARD}?user=${userId}`
        : ENDPOINTS.ANALYTICS_DASHBOARD;
    return apiClient.get<DashboardData>(endpoint);
  },

  async getSummary() {
    return apiClient.get<any>(ENDPOINTS.ANALYTICS_SUMMARY);
  },

  async getBodyComposition(userId?: string) {
    const endpoint = userId
      ? `${ENDPOINTS.ANALYTICS_BODY_COMPOSITION}?user=${userId}`
      : ENDPOINTS.ANALYTICS_BODY_COMPOSITION;
    return apiClient.get<BodyComposition>(endpoint);
  },

  async getBodyCompositionHistory(userId?: string, limit?: number, { dni }: { dni?: string } = {}) {
    let endpoint = ENDPOINTS.ANALYTICS_BODY_COMPOSITION_HISTORY;
    const params: string[] = [];
    if (dni) params.push(`user=${dni}`);
    else if (userId) params.push(`user=${userId}`);
    if (limit) params.push(`limit=${limit}`);
    if (params.length) endpoint += `?${params.join('&')}`;
    return apiClient.get<BodyComposition[]>(endpoint);
  },

  async getScores(userId?: string) {
    const endpoint = userId
      ? `${ENDPOINTS.ANALYTICS_SCORES}?user=${userId}`
      : ENDPOINTS.ANALYTICS_SCORES;
    return apiClient.get<ScoreData>(endpoint);
  },

  async calculateBMR(data: { weight: number; height: number; age: number; sex: string; formula?: string }) {
    return apiClient.post<any>(ENDPOINTS.CALC_BMR, data);
  },

  async calculateTDEE(data: { weight: number; height: number; age: number; sex: string; activity_level: number }) {
    return apiClient.post<any>(ENDPOINTS.CALC_TDEE, data);
  },

  async calculateBodyFat(data: { sex: string; waist: number; neck: number; height: number; hip?: number }) {
    return apiClient.post<any>(ENDPOINTS.CALC_BODY_FAT, data);
  },

  async calculateFFMI(data: { weight: number; height: number; body_fat: number }) {
    return apiClient.post<any>(ENDPOINTS.CALC_FFMI, data);
  },

  async calculateWeightLoss(data: { current_weight: number; target_weight: number; tdee: number; rate?: number }) {
    return apiClient.post<any>(ENDPOINTS.CALC_WEIGHT_LOSS, data);
  },

  async calculateMuscleGain(data: { current_weight: number; target_weight: number; tdee: number; experience?: string }) {
    return apiClient.post<any>(ENDPOINTS.CALC_MUSCLE_GAIN, data);
  },
};
