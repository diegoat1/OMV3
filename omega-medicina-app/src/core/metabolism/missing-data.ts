/**
 * Missing Data Module - Detección de datos faltantes para métricas
 * 
 * Proporciona funciones para identificar qué inputs faltan
 * para calcular cada métrica de salud/composición corporal
 */

// Tipos de métricas que requieren inputs específicos
export type MetricName = 
  | 'ffmi'
  | 'bf_percentage'
  | 'lean_mass'
  | 'fat_mass'
  | 'bmi'
  | 'water_recommendation'
  | 'bmr'
  | 'tdee'
  | 'body_score'
  | 'waist_trend';

// Inputs posibles del perfil de usuario
export interface UserProfileInputs {
  weight?: number;
  height?: number;
  age?: number;
  sex?: 'male' | 'female';
  waist?: number;
  hip?: number;
  neck?: number;
  activityLevel?: string;
  bodyFatPercentage?: number;
  leanMass?: number;
  // Historial para tendencias
  waistHistory?: { date: string; value: number }[];
  weightHistory?: { date: string; value: number }[];
}

// Resultado de missing data
export interface MissingDataResult {
  metric: MetricName;
  metricDisplayName: string;
  canCalculate: boolean;
  missingInputs: MissingInput[];
  availableInputs: string[];
  completeness: number; // 0-100%
}

export interface MissingInput {
  field: string;
  displayName: string;
  description: string;
  route: string; // Ruta para cargar el dato
  priority: 'required' | 'optional';
}

// Definición de requisitos por métrica
const METRIC_REQUIREMENTS: Record<MetricName, {
  displayName: string;
  required: { field: keyof UserProfileInputs; displayName: string; description: string; route: string }[];
  optional?: { field: keyof UserProfileInputs; displayName: string; description: string; route: string }[];
}> = {
  ffmi: {
    displayName: 'FFMI (Índice de Masa Libre de Grasa)',
    required: [
      { field: 'height', displayName: 'Altura', description: 'Tu altura en cm', route: '/(patient)/health' },
      { field: 'leanMass', displayName: 'Masa magra', description: 'Masa libre de grasa en kg', route: '/(patient)/health' },
    ],
  },
  bf_percentage: {
    displayName: '% Grasa Corporal',
    required: [
      { field: 'height', displayName: 'Altura', description: 'Tu altura en cm', route: '/(patient)/health' },
      { field: 'waist', displayName: 'Perímetro abdomen', description: 'Circunferencia de cintura en cm', route: '/(patient)/health' },
      { field: 'neck', displayName: 'Perímetro cuello', description: 'Circunferencia de cuello en cm', route: '/(patient)/health' },
      { field: 'sex', displayName: 'Sexo', description: 'Sexo biológico', route: '/(patient)/profile' },
    ],
    optional: [
      { field: 'hip', displayName: 'Perímetro cadera', description: 'Requerido para mujeres', route: '/(patient)/health' },
    ],
  },
  lean_mass: {
    displayName: 'Masa Magra',
    required: [
      { field: 'weight', displayName: 'Peso', description: 'Tu peso actual en kg', route: '/(patient)/health' },
      { field: 'bodyFatPercentage', displayName: '% Grasa', description: 'Porcentaje de grasa corporal', route: '/(patient)/health' },
    ],
  },
  fat_mass: {
    displayName: 'Masa Grasa',
    required: [
      { field: 'weight', displayName: 'Peso', description: 'Tu peso actual en kg', route: '/(patient)/health' },
      { field: 'bodyFatPercentage', displayName: '% Grasa', description: 'Porcentaje de grasa corporal', route: '/(patient)/health' },
    ],
  },
  bmi: {
    displayName: 'IMC (Índice de Masa Corporal)',
    required: [
      { field: 'weight', displayName: 'Peso', description: 'Tu peso actual en kg', route: '/(patient)/health' },
      { field: 'height', displayName: 'Altura', description: 'Tu altura en cm', route: '/(patient)/health' },
    ],
  },
  water_recommendation: {
    displayName: 'Agua Recomendada',
    required: [
      { field: 'weight', displayName: 'Peso', description: 'Tu peso actual en kg', route: '/(patient)/health' },
    ],
    optional: [
      { field: 'activityLevel', displayName: 'Nivel de actividad', description: 'Tu nivel de actividad física', route: '/(patient)/profile' },
    ],
  },
  bmr: {
    displayName: 'Metabolismo Basal (BMR)',
    required: [
      { field: 'weight', displayName: 'Peso', description: 'Tu peso actual en kg', route: '/(patient)/health' },
      { field: 'height', displayName: 'Altura', description: 'Tu altura en cm', route: '/(patient)/health' },
      { field: 'age', displayName: 'Edad', description: 'Tu edad en años', route: '/(patient)/profile' },
      { field: 'sex', displayName: 'Sexo', description: 'Sexo biológico', route: '/(patient)/profile' },
    ],
  },
  tdee: {
    displayName: 'Gasto Calórico Diario (TDEE)',
    required: [
      { field: 'weight', displayName: 'Peso', description: 'Tu peso actual en kg', route: '/(patient)/health' },
      { field: 'height', displayName: 'Altura', description: 'Tu altura en cm', route: '/(patient)/health' },
      { field: 'age', displayName: 'Edad', description: 'Tu edad en años', route: '/(patient)/profile' },
      { field: 'sex', displayName: 'Sexo', description: 'Sexo biológico', route: '/(patient)/profile' },
      { field: 'activityLevel', displayName: 'Nivel de actividad', description: 'Tu nivel de actividad física', route: '/(patient)/profile' },
    ],
  },
  body_score: {
    displayName: 'Puntaje Corporal',
    required: [
      { field: 'weight', displayName: 'Peso', description: 'Tu peso actual en kg', route: '/(patient)/health' },
      { field: 'height', displayName: 'Altura', description: 'Tu altura en cm', route: '/(patient)/health' },
    ],
    optional: [
      { field: 'waist', displayName: 'Perímetro abdomen', description: 'Circunferencia de cintura en cm', route: '/(patient)/health' },
      { field: 'bodyFatPercentage', displayName: '% Grasa', description: 'Porcentaje de grasa corporal', route: '/(patient)/health' },
    ],
  },
  waist_trend: {
    displayName: 'Tendencia de Perímetro Abdomen',
    required: [
      { field: 'waistHistory', displayName: 'Historial de medidas', description: 'Mínimo 2 registros de perímetro', route: '/(patient)/health' },
    ],
  },
};

/**
 * Obtiene los inputs faltantes para calcular una métrica específica
 * 
 * @param metricName - Nombre de la métrica a calcular
 * @param userProfile - Datos disponibles del usuario
 * @returns Resultado con inputs faltantes y completitud
 */
export function getMissingInputsForMetric(
  metricName: MetricName,
  userProfile: UserProfileInputs
): MissingDataResult {
  const requirements = METRIC_REQUIREMENTS[metricName];
  
  if (!requirements) {
    return {
      metric: metricName,
      metricDisplayName: metricName,
      canCalculate: false,
      missingInputs: [],
      availableInputs: [],
      completeness: 0,
    };
  }

  const missingInputs: MissingInput[] = [];
  const availableInputs: string[] = [];

  // Verificar campos requeridos
  for (const req of requirements.required) {
    const value = userProfile[req.field];
    const hasValue = value !== undefined && value !== null && 
      (Array.isArray(value) ? value.length >= 2 : true); // Para historial, necesita mín 2 puntos
    
    if (hasValue) {
      availableInputs.push(req.displayName);
    } else {
      missingInputs.push({
        field: req.field,
        displayName: req.displayName,
        description: req.description,
        route: req.route,
        priority: 'required',
      });
    }
  }

  // Verificar campos opcionales
  if (requirements.optional) {
    for (const opt of requirements.optional) {
      const value = userProfile[opt.field];
      const hasValue = value !== undefined && value !== null;
      
      if (hasValue) {
        availableInputs.push(opt.displayName);
      } else {
        missingInputs.push({
          field: opt.field,
          displayName: opt.displayName,
          description: opt.description,
          route: opt.route,
          priority: 'optional',
        });
      }
    }
  }

  // Calcular completitud (solo basado en requeridos)
  const requiredCount = requirements.required.length;
  const requiredAvailable = requirements.required.filter(
    req => {
      const value = userProfile[req.field];
      return value !== undefined && value !== null &&
        (Array.isArray(value) ? value.length >= 2 : true);
    }
  ).length;
  const completeness = requiredCount > 0 ? Math.round((requiredAvailable / requiredCount) * 100) : 0;

  // Puede calcular si tiene todos los requeridos
  const canCalculate = missingInputs.filter(m => m.priority === 'required').length === 0;

  return {
    metric: metricName,
    metricDisplayName: requirements.displayName,
    canCalculate,
    missingInputs,
    availableInputs,
    completeness,
  };
}

/**
 * Obtiene todos los datos faltantes para un perfil de usuario
 * 
 * @param userProfile - Datos disponibles del usuario
 * @returns Array de resultados por métrica
 */
export function getAllMissingData(userProfile: UserProfileInputs): MissingDataResult[] {
  const metrics: MetricName[] = [
    'bmi',
    'bf_percentage',
    'lean_mass',
    'fat_mass',
    'ffmi',
    'water_recommendation',
    'bmr',
    'tdee',
    'body_score',
    'waist_trend',
  ];

  return metrics.map(metric => getMissingInputsForMetric(metric, userProfile));
}

/**
 * Obtiene las métricas que se pueden calcular con los datos actuales
 */
export function getCalculableMetrics(userProfile: UserProfileInputs): MetricName[] {
  return getAllMissingData(userProfile)
    .filter(result => result.canCalculate)
    .map(result => result.metric);
}

/**
 * Obtiene los inputs más importantes que faltan (priorizados)
 * Útil para mostrar "Completa estos datos para desbloquear más métricas"
 */
export function getPrioritizedMissingInputs(userProfile: UserProfileInputs): MissingInput[] {
  const allMissing = getAllMissingData(userProfile);
  const missingMap = new Map<string, MissingInput>();

  // Contar cuántas métricas desbloquea cada input
  const inputUnlockCount = new Map<string, number>();

  for (const result of allMissing) {
    for (const missing of result.missingInputs) {
      if (missing.priority === 'required') {
        const count = inputUnlockCount.get(missing.field) || 0;
        inputUnlockCount.set(missing.field, count + 1);
        missingMap.set(missing.field, missing);
      }
    }
  }

  // Ordenar por cantidad de métricas que desbloquea
  return Array.from(missingMap.values())
    .sort((a, b) => {
      const countA = inputUnlockCount.get(a.field) || 0;
      const countB = inputUnlockCount.get(b.field) || 0;
      return countB - countA;
    });
}
