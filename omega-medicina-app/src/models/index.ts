// Omega Medicina - TypeScript Models & Types

// ============================================
// USER & AUTH TYPES
// ============================================

export type UserRole = 'patient' | 'doctor' | 'admin' | 'nutritionist' | 'trainer';

// Active role that the user is currently using (can be different from their base role)
export type ActiveRole = 'patient' | 'doctor' | 'admin' | 'nutritionist' | 'trainer';

// Professional role type (excludes patient and admin)
export type ProfessionalRole = 'doctor' | 'nutritionist' | 'trainer';

// Module permissions that can be assigned per patient
export type ModulePermission = 'medical' | 'nutrition' | 'training';

// Permissions that a user can have
export interface UserPermissions {
  canBePatient: boolean;
  canBeDoctor: boolean;
  canBeAdmin: boolean;
  canBeNutritionist: boolean;
  canBeTrainer: boolean;
}

// Permission assignment for a professional on a specific patient
export interface PatientProfessionalPermission {
  patientId: string;
  professionalId: string;
  professionalRole: ProfessionalRole;
  professionalName: string;
  modules: {
    medical: boolean;    // Can edit medical/clinical data
    nutrition: boolean;  // Can edit nutrition plans
    training: boolean;   // Can edit training plans
  };
  assignedAt: string;
  assignedBy: string; // Admin who assigned
}

// Summary of all permissions for a patient
export interface PatientPermissionsSummary {
  patientId: string;
  patientName: string;
  professionals: PatientProfessionalPermission[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole; // Base role
  permissions: UserPermissions; // What roles this user can assume
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth: string;
  sex: 'male' | 'female';
  height: number; // cm
  phoneNumber?: string;
  emergencyContact?: string;
  doctorId?: string;
  onboardingCompleted: boolean;
  preferences: PatientPreferences;
}

export interface Doctor extends User {
  role: 'doctor';
  specialty: string;
  licenseNumber: string;
  clinicName?: string;
  phoneNumber?: string;
}

export interface PatientPreferences {
  units: 'metric' | 'imperial';
  notifications: boolean;
  reminderTime: string; // HH:mm format
  goals: PatientGoals;
}

export interface PatientGoals {
  targetWeight?: number;
  dailyCalories?: number;
  dailyWater?: number; // liters
  weeklyExerciseDays?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================
// HEALTH & MEASUREMENTS
// ============================================

export interface Measurement {
  id: string;
  patientId: string;
  date: string;
  type: MeasurementType;
  value: number;
  unit: string;
  notes?: string;
  createdAt: string;
}

export type MeasurementType = 
  | 'weight'
  | 'waist'
  | 'hip'
  | 'neck'
  | 'chest'
  | 'arm'
  | 'thigh'
  | 'bloodPressureSystolic'
  | 'bloodPressureDiastolic'
  | 'heartRate'
  | 'bloodGlucose'
  | 'bodyFat';

export interface HealthScore {
  score: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  lastUpdated: string;
  breakdown: HealthScoreBreakdown;
}

export interface HealthScoreBreakdown {
  dataCompleteness: number; // 0-30 points
  taskAdherence: number; // 0-30 points
  metricsInRange: number; // 0-25 points
  consistency: number; // 0-15 points
}

export interface HealthMetricsSummary {
  currentWeight?: number;
  weightChange7d?: number;
  weightChange30d?: number;
  currentWaist?: number;
  currentHip?: number;
  waistHipRatio?: number;
  bmi?: number;
  lastBloodPressure?: { systolic: number; diastolic: number };
  lastHeartRate?: number;
  lastBloodGlucose?: number;
}

// Composición corporal completa para pantalla Situación Actual
export interface BodyComposition {
  // Datos básicos
  weight: number; // kg
  height: number; // cm
  age: number;
  sex: 'male' | 'female';
  
  // Composición
  bodyFatPercentage?: number; // BF%
  leanMass?: number; // Masa magra en kg
  fatMass?: number; // Masa grasa en kg
  ffmi?: number; // Fat-Free Mass Index
  ffmiNormalized?: number; // FFMI normalizado a 1.80m
  
  // Circunferencias
  waist?: number; // Perímetro abdomen/cintura
  hip?: number;
  neck?: number;
  
  // Puntaje y tendencia
  bodyScore?: number; // 0-100
  bodyScoreTrend?: 'up' | 'down' | 'stable';
  bodyScoreChange7d?: number;
  
  // Hidratación
  waterTarget?: number; // Litros recomendados por día
  
  // Fecha del último registro
  lastUpdated?: string;
}

// ============================================
// PUNTAJE CORPORAL POR CATEGORÍAS
// ============================================

export type ScoreCategoryId = 
  | 'body_composition'   // Composición corporal
  | 'nutrition'          // Nutrición
  | 'training'           // Entrenamiento
  | 'mobility'           // Movilidad/Flexibilidad
  | 'recovery'           // Sueño/Recuperación
  | 'prevention';        // Prevención/Screening

export type ScoreColor = 'green' | 'yellow' | 'red';

export interface ScoreCategoryBreakdown {
  label: string;
  value: number;
  maxValue: number;
  description?: string;
}

export interface ScoreCategory {
  id: ScoreCategoryId | string;
  name: string;
  emoji: string;
  score: number;           // 0-100
  color: ScoreColor;
  completeness?: number;   // % de datos completos (0-100)
  adherence?: number;      // % de adherencia (0-100)
  improvement?: string;    // Qué mejora sube el score
  breakdown?: ScoreCategoryBreakdown[];
}

export interface BodyScorePanel {
  totalScore: number;
  totalColor: ScoreColor;
  trend: 'up' | 'down' | 'stable';
  trendChange: number;     // Cambio semanal
  categories: ScoreCategory[];
  lastUpdated: string;
}

// ============================================
// PLAN NUTRICIONAL Y CONFIGURACIÓN DE COMIDAS
// ============================================

export type NutritionStrategy = 
  | 'standard'        // Estándar (3-4 comidas)
  | 'intermittent'    // Ayuno intermitente
  | 'simplified'      // Simplificada (2-3 comidas)
  | 'frequent'        // Frecuente (5-6 comidas)
  | 'custom';         // Personalizada

export type MealSize = 'extra_small' | 'small' | 'medium' | 'large' | 'extra_large';

export type MealMoment = 
  | 'breakfast'       // Desayuno
  | 'mid_morning'     // Media mañana
  | 'lunch'           // Almuerzo
  | 'snack'           // Merienda
  | 'dinner'          // Cena
  | 'late_snack'      // Colación nocturna
  | 'desayuno'        // API v3 Spanish keys
  | 'media_manana'
  | 'almuerzo'
  | 'merienda'
  | 'media_tarde'
  | 'cena';

export interface MealConfig {
  moment: MealMoment;
  label: string;
  name?: string;
  emoji?: string;
  enabled: boolean;
  size: MealSize;
  percentage?: number;  // % del total de macros
  timeRange?: string;   // ej: "07:00-09:00"
}

export interface NutritionPlanConfig {
  id: string;
  name: string;
  strategy: NutritionStrategy;
  
  // Macros objetivo diarios
  targetCalories: number;
  targetProtein: number;   // gramos
  targetFat: number;       // gramos
  targetCarbs: number;     // gramos
  
  // Configuración de comidas
  mealsPerDay: number;     // 2-6
  meals: MealConfig[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Objetivo del paciente
export interface PatientObjective {
  id: string;
  type: 'weight_loss' | 'muscle_gain' | 'recomposition' | 'maintenance' | 'custom';
  isAutoGenerated: boolean;
  isAccepted: boolean;
  
  // Valores objetivo
  targetWeight?: number;
  targetBodyFat?: number;
  targetLeanMass?: number;
  targetWaist?: number;
  
  // Tiempo estimado
  estimatedWeeks?: number;
  
  // Descripción
  title: string;
  description: string;
  
  createdAt: string;
  acceptedAt?: string;
}

// ============================================
// TASKS & REMINDERS
// ============================================

export interface DailyTask {
  id: string;
  patientId: string;
  title: string;
  description?: string;
  type: TaskType;
  completed: boolean;
  completedAt?: string;
  scheduledFor: string; // date
  recurrence: RecurrenceType;
  order: number;
}

export type TaskType = 
  | 'weight'
  | 'measurement'
  | 'exercise'
  | 'mobility'
  | 'water'
  | 'medication'
  | 'nutrition'
  | 'custom';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'once';

export interface Reminder {
  id: string;
  patientId: string;
  title: string;
  description?: string;
  category: ReminderCategory;
  dueDate: string;
  frequency: ReminderFrequency;
  status: 'pending' | 'completed' | 'overdue';
  completedAt?: string;
  nextDueDate?: string;
  notificationId?: string;
  notes?: string;
  createdBy: string; // doctor or patient id
  createdAt: string;
}

export type ReminderCategory = 
  | 'screening'
  | 'laboratory'
  | 'anthropometric'
  | 'consultation'
  | 'vaccination'
  | 'medication'
  | 'custom';

export type ReminderFrequency = 
  | 'once'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'biannual'
  | 'annual';

// ============================================
// NUTRITION
// ============================================

export interface NutritionPlan {
  id: string;
  patientId: string;
  name: string;
  dailyCalories: number;
  macros: MacroDistribution;
  meals: MealPlan[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface MacroDistribution {
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
}

export interface MealPlan {
  id: string;
  name: string;
  time: string; // HH:mm
  targetCalories: number;
  suggestions: string[];
  notes?: string;
}

export interface NutritionLog {
  id: string;
  patientId: string;
  date: string;
  meals: MealLog[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  waterIntake: number; // liters
  notes?: string;
}

export interface MealLog {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  calories?: number;
  time: string;
}

// ============================================
// TRAINING & EXERCISE
// ============================================

export interface TrainingPlan {
  id: string;
  patientId: string;
  name: string;
  type: TrainingType;
  weeklyFrequency: number;
  sessions: TrainingSession[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type TrainingType = 'strength' | 'calisthenics' | 'cardio' | 'mixed';

export interface TrainingSession {
  id: string;
  name: string;
  dayOfWeek?: number; // 0-6
  exercises: Exercise[];
  duration?: number; // minutes
  notes?: string;
}

export interface Exercise {
  id: string;
  name: string;
  type: 'strength' | 'cardio' | 'mobility';
  sets?: number;
  reps?: string; // "8-12" or "10"
  weight?: number;
  duration?: number; // minutes for cardio
  rpe?: number; // 1-10
  notes?: string;
}

export interface ExerciseLog {
  id: string;
  patientId: string;
  exerciseId: string;
  exerciseName: string;
  date: string;
  sets: SetLog[];
  notes?: string;
  createdAt: string;
}

export interface SetLog {
  setNumber: number;
  reps: number;
  weight?: number;
  rpe?: number;
  completed: boolean;
}

// ============================================
// MOBILITY
// ============================================

export interface MobilityRoutine {
  id: string;
  name: string;
  duration: number; // minutes
  exercises: MobilityExercise[];
  targetAreas: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface MobilityExercise {
  id: string;
  name: string;
  duration: number; // seconds
  instructions: string;
  videoUrl?: string;
  imageUrl?: string;
}

// ============================================
// DOCTOR - APPOINTMENTS & CONSULTATIONS
// ============================================

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  duration: number; // minutes
  reason: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: string;
}

export interface Consultation {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentId?: string;
  date: string;
  reason: string;
  anamnesis: string;
  examination: string;
  impressions: string;
  plan: string;
  nextSteps: string;
  attachedPlanIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PDF REPORTS
// ============================================

export interface PdfReport {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  type: ReportType;
  title: string;
  content: ReportContent;
  generatedAt: string;
  sharedAt?: string;
  fileUri?: string;
}

export type ReportType = 'consultation' | 'progress' | 'plan' | 'summary';

export interface ReportContent {
  patientInfo: {
    name: string;
    age: number;
    sex: string;
  };
  healthScore?: HealthScore;
  metrics?: HealthMetricsSummary;
  consultation?: Partial<Consultation>;
  nutritionPlan?: Partial<NutritionPlan>;
  trainingPlan?: Partial<TrainingPlan>;
  reminders?: Reminder[];
  doctorSignature?: string;
  notes?: string;
}

// ============================================
// TEMPLATES (Doctor)
// ============================================

export interface Template {
  id: string;
  doctorId: string;
  name: string;
  type: 'nutrition' | 'training' | 'reminder' | 'consultation';
  content: any; // Flexible content based on type
  createdAt: string;
  updatedAt: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// INSIGHTS & RECOMMENDATIONS
// ============================================

export interface Insight {
  id: string;
  type: 'info' | 'warning' | 'success' | 'action';
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  priority: number;
  createdAt: string;
}

// ============================================
// CHANGELOG / UPDATES
// ============================================

export interface ChangelogEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'fix' | 'announcement';
  version?: string;
}

// ============================================
// TRAINING TRACKER (Patient)
// ============================================

export type TrainingSessionType = 'strength' | 'calisthenics' | 'running' | 'mobility' | 'other';

export interface TrainingLogEntry {
  id: string;
  patientId: string;
  date: string;
  sessionType: TrainingSessionType;
  duration: number; // minutes
  rpe: number; // 1-10
  notes?: string;
  completed: boolean;
  createdAt: string;
}

export interface TrainingAnalysis {
  weeklyVolume: number; // total minutes
  sessionsThisWeek: number;
  consistency: number; // days active / 7
  balance: Record<TrainingSessionType, number>; // count per type
  recommendations: string[];
}

// ============================================
// DIET TRACKER (Patient)
// ============================================

export interface DietLogEntry {
  id: string;
  patientId: string;
  date: string;
  qualityScore: 1 | 2 | 3 | 4 | 5;
  proteinSufficient: boolean;
  vegetablesFruits: boolean;
  ultraprocessedLevel: 'low' | 'medium' | 'high';
  waterSufficient: boolean;
  notes?: string;
  whatIAte?: string;
  createdAt: string;
}

export interface DietAnalysis {
  nutritionScore: number; // 0-100
  trend7Days: number[]; // last 7 scores
  averageQuality: number;
  proteinDays: number; // days with sufficient protein
  vegetableDays: number;
  improvements: string[];
}

// ============================================
// MEDICAL RECORDS (Doctor)
// ============================================

export interface MedicalEvolution {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  reason: string;
  evolution: string;
  diagnosis?: string;
  plan?: string;
  nextControl?: string;
  createdAt: string;
  updatedAt: string;
}

export type StudyType = 'laboratory' | 'imaging' | 'specialist_report';
export type StudyStatus = 'requested' | 'received' | 'reviewed';

export interface MedicalStudy {
  id: string;
  patientId: string;
  evolutionId?: string;
  type: StudyType;
  name: string;
  date: string;
  result?: string;
  fileUri?: string;
  status: StudyStatus;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ADMIN - AUDIT
// ============================================

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: 'role_change' | 'record_created' | 'record_updated' | 'login' | 'logout';
  details: string;
  timestamp: string;
}
