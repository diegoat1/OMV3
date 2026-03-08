// API Configuration - Flask backend v3 (ONV2)
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getDevBaseUrl() {
  if (Platform.OS === 'web') return 'http://localhost:8000/api/v3';
  // On mobile (Expo Go), use the dev server host IP
  const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost ?? '';
  const ip = debuggerHost.split(':')[0];
  return ip ? `http://${ip}:8000/api/v3` : 'http://localhost:8000/api/v3';
}

export const API_CONFIG = {
  USE_DEMO_MODE: false,

  BASE_URL: __DEV__ ? getDevBaseUrl() : 'https://api.omegamedicina.com/api/v3',

  TIMEOUT: 10000,

  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH_TOKEN: '/auth/refresh',

    // Users
    USERS: '/users',
    USER_DETAIL: '/users/:id',
    USER_MEASUREMENTS: '/users/:id/measurements',
    USER_MEASUREMENT_DELETE: '/users/:id/measurements/:measurementId',
    USER_GOALS: '/users/:id/goals',
    USER_GOALS_AUTO: '/users/:id/goals/auto',
    USER_GOALS_ROADMAP: '/users/:id/goals/auto-roadmap',

    // Analytics
    ANALYTICS_DASHBOARD: '/analytics/dashboard',
    ANALYTICS_SUMMARY: '/analytics/summary',
    ANALYTICS_BODY_COMPOSITION: '/analytics/body-composition',
    ANALYTICS_BODY_COMPOSITION_HISTORY: '/analytics/body-composition/history',
    ANALYTICS_SCORES: '/analytics/scores',
    CALC_BMR: '/analytics/calculators/bmr',
    CALC_TDEE: '/analytics/calculators/tdee',
    CALC_BODY_FAT: '/analytics/calculators/body-fat',
    CALC_FFMI: '/analytics/calculators/ffmi',
    CALC_WEIGHT_LOSS: '/analytics/calculators/weight-loss',
    CALC_MUSCLE_GAIN: '/analytics/calculators/muscle-gain',

    // Nutrition
    NUTRITION_PLANS: '/nutrition/plans',
    NUTRITION_PLAN_DETAIL: '/nutrition/plans/:planId',
    NUTRITION_PLAN_ADJUST: '/nutrition/plans/:planId/adjust-calories',
    NUTRITION_FOODS: '/nutrition/foods',
    NUTRITION_FOOD_DETAIL: '/nutrition/foods/:foodId',
    NUTRITION_FOOD_PORTIONS: '/nutrition/foods/:foodId/portions',
    NUTRITION_FOOD_GROUPS: '/nutrition/food-groups',
    NUTRITION_RECIPES: '/nutrition/recipes',
    NUTRITION_RECIPE_DETAIL: '/nutrition/recipes/:recipeId',
    NUTRITION_RECIPE_CALCULATE: '/nutrition/recipes/:recipeId/calculate',
    NUTRITION_MEAL_PLANS: '/nutrition/meal-plans',
    NUTRITION_MEAL_BLOCKS: '/nutrition/meal-plans/blocks',
    NUTRITION_MEAL_PLAN_CALCULATE: '/nutrition/meal-plans/:planId/calculate',
    NUTRITION_MEAL_PLAN_SHOPPING: '/nutrition/meal-plans/:planId/shopping-list',
    NUTRITION_AUTO_CALCULATE: '/nutrition/plans/auto-calculate',
    NUTRITION_BLOCKS_ADJUST: '/nutrition/meal-plans/blocks/adjust',
    NUTRITION_BLOCKS_SUGGESTIONS: '/nutrition/meal-plans/blocks/suggestions',
    NUTRITION_BLOCKS_FAVORITES: '/nutrition/meal-plans/blocks/favorites',
    NUTRITION_BLOCKS_FAVORITE_DETAIL: '/nutrition/meal-plans/blocks/favorites/:favId',
    NUTRITION_BLOCKS_CONSTRUCTOR: '/nutrition/meal-plans/blocks/constructor',
    NUTRITION_LIBRARY: '/nutrition/meal-plans/library',
    NUTRITION_LIBRARY_FAVORITE: '/nutrition/meal-plans/library/:presetId/favorite',
    NUTRITION_FOOD_CATALOG: '/nutrition/food-groups/catalog',
    NUTRITION_SAVE_MEAL_CONFIG: '/nutrition/meal-plans/save-config',
    NUTRITION_CALCULATE_DAY: '/nutrition/calculate-day',
    NUTRITION_DAILY_LOG: '/nutrition/daily-log',
    NUTRITION_DAILY_LOG_HISTORY: '/nutrition/daily-log/history',

    // Training
    TRAINING_STRENGTH: '/training/strength',
    TRAINING_STRENGTH_HISTORY: '/training/strength/history',
    TRAINING_STRENGTH_DELETE: '/training/strength/:recordId',
    TRAINING_STRENGTH_STANDARDS: '/training/strength/standards',
    TRAINING_LIFTS: '/training/lifts',
    TRAINING_EXERCISES: '/training/exercises',
    TRAINING_PLANS: '/training/plans',
    TRAINING_PLAN_DETAIL: '/training/plans/:planId',
    TRAINING_PLAN_OPTIMIZE: '/training/plans/:planId/optimize',
    TRAINING_SESSION_CURRENT: '/training/sessions/current',
    TRAINING_SESSIONS: '/training/sessions',
    TRAINING_SESSION_ADVANCE: '/training/sessions/advance',
    TRAINING_SESSION_HISTORY: '/training/sessions/history',
    TRAINING_SESSION_TODAY: '/training/sessions/today',
    TRAINING_PROGRAMS: '/training/programs',
    TRAINING_PROGRAM_DETAIL: '/training/programs/:programId',
    TRAINING_STRENGTH_SUBMIT: '/training/strength/submit',
    TRAINING_STRENGTH_ADMIN: '/training/strength/admin',
    TRAINING_STRENGTH_OPTIMIZE: '/training/strength/:recordId/optimize',

    // Admin
    ADMIN_STATS: '/admin/stats',
    ADMIN_DASHBOARD_STATS: '/admin/dashboard-stats',
    ADMIN_USERS: '/admin/users',
    ADMIN_USER_DETAIL: '/admin/users/:id',
    ADMIN_USER_SEARCH: '/admin/users/search',
    ADMIN_AUTH_USERS: '/admin/auth-users',
    ADMIN_PENDING_USERS: '/admin/pending-users',
    ADMIN_APPROVE_USER: '/admin/auth-users/:id/approve',
    ADMIN_REJECT_USER: '/admin/auth-users/:id/reject',
    ADMIN_TOGGLE_ACTIVE: '/admin/auth-users/:id/toggle-active',
    ADMIN_UPDATE_ROLE: '/admin/auth-users/:id/role',
    ADMIN_DELETE_USER: '/admin/auth-users/:id',
    ADMIN_AUDIT: '/admin/audit',
    ADMIN_DB_TABLES: '/admin/database/tables',
    ADMIN_DB_TABLE_DATA: '/admin/database/tables/:tableName',
    ADMIN_DB_EXPORT: '/admin/database/export/:tableName',

    // Assignments (specialist-patient)
    ASSIGNMENT_REQUEST: '/assignments/request',
    ASSIGNMENT_MY_REQUESTS: '/assignments/my-requests',
    ASSIGNMENT_PENDING: '/assignments/pending',
    ASSIGNMENT_ACCEPT: '/assignments/:id/accept',
    ASSIGNMENT_REJECT: '/assignments/:id/reject',
    ASSIGNMENT_CANCEL: '/assignments/:id/cancel',
    ASSIGNMENT_MY_SPECIALISTS: '/assignments/my-specialists',
    ASSIGNMENT_MY_PATIENTS: '/assignments/my-patients',
    ASSIGNMENT_UNASSIGN_PATIENT: '/assignments/unassign-patient/:id',

    // Telemedicine
    TELEMED_APPOINTMENTS: '/telemedicine/appointments',
    TELEMED_APPOINTMENT_DETAIL: '/telemedicine/appointments/:id',
    TELEMED_APPOINTMENT_STATUS: '/telemedicine/appointments/:id/status',
    TELEMED_RECORDS: '/telemedicine/records',
    TELEMED_PATIENTS: '/telemedicine/patients',
    TELEMED_PATIENT_DETAIL: '/telemedicine/patients/:id',
    TELEMED_SITUATIONS: '/telemedicine/situations',
    TELEMED_SITUATION_DELETE: '/telemedicine/situations/:id',
    TELEMED_VITALS: '/telemedicine/vitals',
    TELEMED_DOCUMENTS: '/telemedicine/documents',
    TELEMED_DOCUMENT_DETAIL: '/telemedicine/documents/:id',
    TELEMED_PREVENTION: '/telemedicine/prevention',
    TELEMED_BODY_MEASUREMENTS: '/telemedicine/body-measurements',
    TELEMED_PERF_SPEED: '/telemedicine/performance/speed',
    TELEMED_PERF_FLEXIBILITY: '/telemedicine/performance/flexibility',
    TELEMED_PERF_MOBILITY: '/telemedicine/performance/mobility',
    TELEMED_PERF_ENDURANCE: '/telemedicine/performance/endurance',
    TELEMED_TEMPLATES: '/telemedicine/templates',
    TELEMED_TEMPLATE_DETAIL: '/telemedicine/templates/:id',

    // Check-in diario & Health Index
    CHECKIN_TODAY: '/checkin/today',
    CHECKIN_HISTORY: '/checkin/history',
    CHECKIN_STATS: '/checkin/stats',
    CHECKIN_SYMPTOMS: '/checkin/symptoms',
    CHECKIN_HEALTH_INDEX: '/checkin/health-index',
    CHECKIN_HEALTH_INDEX_TREND: '/checkin/health-index/trend',

    // Engagement (reminders, tasks, insights, performance)
    ENGAGE_REMINDERS: '/engagement/reminders',
    ENGAGE_REMINDER_COMPLETE: '/engagement/reminders/:id/complete',
    ENGAGE_REMINDER_DELETE: '/engagement/reminders/:id',
    ENGAGE_TASKS: '/engagement/tasks',
    ENGAGE_TASK_DETAIL: '/engagement/tasks/:id',
    ENGAGE_INSIGHTS: '/engagement/insights',
    ENGAGE_PERFORMANCE: '/engagement/performance',
  },
};

// Helper to replace path params
export const buildUrl = (endpoint: string, params: Record<string, string> = {}): string => {
  let url = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  return `${API_CONFIG.BASE_URL}${url}`;
};
