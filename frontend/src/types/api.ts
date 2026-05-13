/** UI role used by the frontend (drives sidebar nav, color scheme, etc). */
export type Role = 'patient' | 'doctor' | 'nutritionist' | 'trainer' | 'admin'

export interface ApiSuccess<T> {
  success: true
  data: T
  meta: { timestamp: string; version: string }
}

export interface ApiError {
  success: false
  error: { code: string; message: string; details?: unknown }
  meta: { timestamp: string; version: string }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

/** Shape returned by the v3 backend. `rol` may be a comma-separated string. */
export interface AuthUser {
  id: string
  dni?: string | null
  email: string
  nombre_apellido?: string | null
  rol: string
  is_admin: boolean
  sexo?: string | null
  altura?: number | null
  telefono?: string | null
  fecha_nacimiento?: string | null
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

/** POST /auth/register payload. The backend is being aligned to this contract:
 *  - no `documento` (DNI) required
 *  - `sexo` strictly 'M' | 'F'
 *  - `desired_roles` as array (excluding 'admin')
 */
export interface RegisterPayload {
  nombre: string
  email: string
  password: string
  sexo: 'M' | 'F'
  fecha_nacimiento: string  // YYYY-MM-DD
  telefono?: string
  desired_roles: Array<'patient' | 'nutritionist' | 'trainer' | 'doctor'>
}

export interface RegisterResponse {
  user_id: number
  patient_id?: number | null
  status: string  // typically 'pending_verification'
  email_verified: boolean
  email_verification_required: boolean
}

/** GET /admin/pending-users response.
 * `email_verified` and `breakdown` were added in the post-Fix-9 backend; they
 * may be absent on older deployments. The client treats absence as
 * "unknown / assume verified" so older deploys still render correctly. */
export interface PendingUser {
  id: number
  email: string
  display_name: string
  role: string
  telefono: string
  desired_role: string
  patient_dni: string
  created_at: string
  email_verified?: boolean
}

export interface PendingUsersResponse {
  users: PendingUser[]
  total: number
  breakdown?: {
    email_verified_awaiting_admin: number
    awaiting_email_verification: number
  }
}

/** POST /admin/auth-users/{id}/approve body */
export interface ApprovePayload {
  payment?: {
    amount?: number
    currency?: string
    payment_method?: string
    transaction_ref?: string
    notes?: string
  }
  membership_period_days?: number
  membership_expires_at?: string  // ISO 8601
  force_email_verification?: boolean
}

export interface ApproveResponse {
  user_id: number
  status: string
  membership_expires_at?: string
  payment_id?: number | null
  email_queued_id?: number | null
}

/** POST /admin/auth-users/{id}/reject body */
export interface RejectPayload {
  reason: string
}

/* ────────────── Assignments (specialist ↔ patient links) ────────────── */

/** Status set used by /assignments/*. The lifecycle:
 *  - 'pending_patient'    → specialist requested; patient must accept/reject
 *  - 'pending_specialist' → patient requested; specialist must accept/reject
 *  - 'accepted'           → mutual link active
 *  - 'rejected' | 'cancelled' → terminal, hidden from active lists */
export type AssignmentStatus =
  | 'pending_patient'
  | 'pending_specialist'
  | 'accepted'
  | 'rejected'
  | 'cancelled'

/** Pending request the patient sees on PatientHome. */
export interface PendingAssignment {
  id: number
  specialist_id: number
  specialist_name: string
  specialist_role: string  // 'doctor' | 'nutricionista' | 'entrenador'
  patient_id: number
  patient_name: string
  patient_dni?: string | null
  status: AssignmentStatus
  created_at: string
}

/** Accepted specialist linked to a patient (GET /my-specialists). */
export interface MySpecialist {
  id: number  // assignment id
  specialist_id: number
  specialist_name: string
  specialist_role: string
  created_at: string
  updated_at: string
}

/** Accepted patient linked to a specialist (GET /my-patients). */
export interface MyPatient {
  id: number
  patient_id: number
  patient_name: string
  patient_dni?: string | null
  patient_email?: string | null
  patient_active?: number
  status: AssignmentStatus
  created_at: string
  updated_at: string
}

/** Outgoing request sent by a specialist (GET /my-requests). */
export interface MyRequest {
  id: number
  specialist_id: number
  specialist_name: string
  specialist_role: string
  patient_id: number
  patient_name: string
  patient_dni?: string | null
  status: AssignmentStatus
  created_at: string
  updated_at: string
}

/** GET /assignments/specialists — available specialists a patient can request. */
export interface AvailableSpecialist {
  id: number  // auth.db user id
  display_name: string
  email: string
  roles: string[]  // subset of ['doctor', 'nutricionista', 'entrenador']
}

export interface AvailableSpecialistsResponse {
  specialists: AvailableSpecialist[]
  total: number
}

/** POST /assignments/patient-request body */
export interface PatientRequestPayload {
  specialist_id: number
  specialist_role?: string  // 'doctor' | 'nutricionista' | 'entrenador'
}

/* ────────────── Static profile + measurements (Paso 3) ────────────── */

/** GET /api/v3/users/<id>/static-profile.
 *  `perfil_completo` = sexo + altura + circ_cuello están todos seteados
 *  (prerrequisito para registrar mediciones). */
export interface StaticProfile {
  user_id: string
  patient_id: number
  auth_user_id: number | null
  dni: string | null
  nombre: string
  email: string | null
  sexo: 'M' | 'F' | null
  altura: number | null         // cm
  envergadura: number | null    // cm
  fecha_nacimiento: string | null
  telefono: string | null
  circ_cuello: number | null
  circ_muneca: number | null
  circ_tobillo: number | null
  created_at: string
  updated_at: string
  perfil_completo: boolean
}

/** PUT /api/v3/users/<id> body — fields a doctor can update on the patient's
 *  static profile. All optional (partial update). */
export interface UpdateUserPayload {
  sexo?: 'M' | 'F'
  fecha_nacimiento?: string
  telefono?: string
  altura?: number | null
  envergadura?: number | null
  circ_cuello?: number | null
  circ_muneca?: number | null
  circ_tobillo?: number | null
}

/** Single measurement row from GET /measurements. */
export interface Measurement {
  id: number
  patient_id: number
  fecha: string                   // ISO datetime
  peso: number | null             // kg
  circ_abdomen: number | null
  circ_cintura: number | null
  circ_cadera: number | null
  circ_hombro: number | null
  circ_pecho: number | null
  circ_brazo: number | null
  circ_antebrazo: number | null
  circ_muslo: number | null
  circ_pantorrilla: number | null
  bf_percent: number | null       // calculated (Navy)
  peso_magro: number | null       // calculated
  peso_graso: number | null       // calculated
  ffmi: number | null             // calculated
  created_by_user_id?: number | null
  created_by_role?: string | null
  updated_by_user_id?: number | null
  updated_at?: string | null
}

export interface MeasurementsResponse {
  user_id: string
  nombre_apellido: string
  measurements: Measurement[]
  total: number
}

/* ────────────── Goals (Paso 4 — Definición de objetivo) ────────────── */

export type GoalStatus = 'active' | 'proposed' | 'completed' | 'rejected' | 'archived'
export type GoalSource = 'manual' | 'auto'

/** Goal row from GET /users/<id>/goals.
 *  - status='proposed' = waiting for patient acceptance
 *  - status='active'   = current goal being worked toward
 *  - terminal: completed | rejected | archived */
export interface Goal {
  id: number
  patient_id: number
  status: GoalStatus
  source: GoalSource | null
  // Targets — body composition
  peso_objetivo: number | null
  bf_objetivo: number | null
  ffmi_objetivo: number | null
  // Targets — circumferences (optional)
  circ_abdomen_objetivo: number | null
  circ_cintura_objetivo: number | null
  circ_cadera_objetivo: number | null
  circ_hombro_objetivo: number | null
  circ_pecho_objetivo: number | null
  circ_brazo_objetivo: number | null
  circ_antebrazo_objetivo: number | null
  circ_muslo_objetivo: number | null
  circ_pantorrilla_objetivo: number | null
  // Time horizon
  fecha_objetivo: string | null     // YYYY-MM-DD
  meses_estimados: number | null
  // Free-form
  notas: string | null
  tipo: string | null               // origen del registro: 'manual' | 'auto'
  categoria: string | null          // tipo de objetivo: 'recomposicion'|'volumen'|'definicion'|'mantenimiento'
  // Audit / lineage
  created_by_user_id: number | null
  accepted_by_user_id: number | null
  previous_goal_id: number | null
  source_roadmap_id: number | null
  source_phase_index: number | null
  created_at: string
  updated_at: string | null
  completed_at: string | null
  archived_at: string | null
}

/** Single-goal envelope when ?status filter is applied (returns the row directly). */
export interface SingleGoalResponse {
  user_id: string
  goal: Goal | null
  status_filter?: string
}

/** Multi-goal envelope when no status filter (returns array). */
export interface GoalsResponse {
  user_id: string
  goals: Goal[]
  total: number
  breakdown?: Record<GoalStatus, number>
}

export interface ProposeGoalPayload {
  peso_objetivo?: number | null
  bf_objetivo?: number | null
  ffmi_objetivo?: number | null
  circ_abdomen_objetivo?: number | null
  circ_cintura_objetivo?: number | null
  circ_cadera_objetivo?: number | null
  fecha_objetivo?: string            // YYYY-MM-DD
  meses_estimados?: number
  notas?: string
  categoria?: string                 // 'recomposicion'|'volumen'|'definicion'|'mantenimiento'
  source?: string                    // 'manual' | 'auto-roadmap' | 'auto-genetic'
  source_roadmap_id?: number
  source_phase_index?: number
}

/** Una fase del roadmap auto-calculado. */
export interface RoadmapPhase {
  tipo: 'definicion' | 'volumen'
  bf_objetivo: number
  ffmi_objetivo: number
  ffmi_categoria?: string
  peso_objetivo: number
  cambio_peso: number
  cambio_musculo: number
  cambio_grasa: number
  descripcion: string
  categoria: string                  // 'Obesidad' | 'Alto' | 'Fitness/Promedio' | 'Base Fitness' | 'Construcción Muscular' | etc.
  fase: string                       // descriptor textual del modo (corte/volumen)
  tiempo_meses: number
  medida_abdomen?: number            // varones
  medida_cintura_cadera?: { cintura: number; cadera: number } // mujeres
}

/** Respuesta de GET /users/<id>/goals/auto-roadmap (cálculo en memoria, sin persistir). */
export interface AutoRoadmapResponse {
  datos_actuales: {
    peso: number
    bf: number
    ffmi: number
    peso_magro: number
    peso_graso: number
    circ_abdomen?: number | null
    circ_cintura?: number | null
    circ_cadera?: number | null
  }
  objetivos_geneticos: {
    ffmi_limite: number
    bf_esencial: number
    peso_objetivo: number
    peso_magro_objetivo: number
    peso_graso_objetivo: number
    circ_abdomen_objetivo?: number | null
    circ_cintura_objetivo?: number | null
    circ_cadera_objetivo?: number | null
  }
  cambios_necesarios: {
    peso: number
    peso_magro: number
    peso_graso: number
    abdomen: number
    cintura: number
    cadera: number
  }
  tiempo_estimado: { meses: number; años: number }
  objetivos_parciales: RoadmapPhase[]
  metadata: { sexo: 'M' | 'F'; edad?: number | null; altura: number; fecha_ultimo_registro?: string }
}

/** Roadmap persistido que retorna GET /users/<id>/goals/roadmap. */
export interface SavedRoadmap {
  id: number
  patient_id: number
  calculated_at: string
  source_measurement_id: number | null
  peso_actual: number | null
  bf_actual: number | null
  ffmi_actual: number | null
  peso_objetivo: number | null
  bf_objetivo: number | null
  ffmi_objetivo: number | null
  tiempo_meses: number | null
  fases: RoadmapPhase[]
  metadata?: AutoRoadmapResponse['metadata']
  active: number
  created_by_user_id: number | null
}

/** Respuesta de GET /users/<id>/goals/next-step. */
export interface NextStepResponse {
  roadmap_id: number
  next_phase_index?: number
  next_phase?: RoadmapPhase
  total_phases?: number
  completed_phases?: number
  completed?: boolean
  message?: string
}

/** POST /measurements body — only dynamic fields (static fields rejected). */
export interface NewMeasurementPayload {
  peso: number                    // required
  circ_abdomen?: number           // required for Navy (M and F)
  circ_cintura?: number           // required for F
  circ_cadera?: number            // required for F
  circ_hombro?: number
  circ_pecho?: number
  circ_brazo?: number
  circ_antebrazo?: number
  circ_muslo?: number
  circ_pantorrilla?: number
  fecha_registro?: string         // ISO 8601 or YYYY-MM-DD; default = now server-side
}

/* ────────────── Nutrition (Paso 5 — Plan nutricional) ────────────── */

/** Backend canonical meal keys for solve-meal and save-config. */
export type MealKey = 'desayuno' | 'media_manana' | 'almuerzo' | 'merienda' | 'media_tarde' | 'cena'

/** Sizes accepted by save-config per meal. */
export type MealSize = 'extra_small' | 'small' | 'medium' | 'large' | 'extra_large'

/** Training intensity (Fix 18 — OMV-49). Affects how strongly carbs shift toward
 *  training meals: baja=1.5x, media=2x, alta=3x. */
export type EntrenoIntensidad = 'baja' | 'media' | 'alta'

/** A row from `nutrition_plans`. Daily macros are stored as totals; per-meal
 *  fields (`*_p`, `*_g`, `*_c`) are normalized PERCENTAGES (0..1) of each
 *  macro that go to that meal. */
export interface NutritionPlan {
  id: number
  patient_id: number
  NOMBRE_APELLIDO?: string

  // Daily totals (macros — admin/specialist only via /macros)
  calorias: number | null
  proteina: number | null
  grasa: number | null
  carbohidratos: number | null
  factor_actividad: number | null
  velocidad_cambio: number | null
  deficit_calorico: number | null
  disponibilidad_energetica: number | null
  parametros_macros_json?: string | null

  // Per-meal distribution (structure — patient OK via /structure)
  desayuno_p: number | null; desayuno_g: number | null; desayuno_c: number | null
  media_man_p: number | null; media_man_g: number | null; media_man_c: number | null
  almuerzo_p: number | null; almuerzo_g: number | null; almuerzo_c: number | null
  merienda_p: number | null; merienda_g: number | null; merienda_c: number | null
  media_tar_p: number | null; media_tar_g: number | null; media_tar_c: number | null
  cena_p: number | null; cena_g: number | null; cena_c: number | null

  libertad: number | null
  entreno_meal_key: MealKey | null
  entreno_meal_keys_json?: string | null
  entreno_intensidad: EntrenoIntensidad | null
  comidas_config_json?: string | null

  created_at: string
  updated_at?: string | null
  updated_by_user_id?: number | null
}

export interface ListPlansResponse { plans: NutritionPlan[]; total: number }
export interface GetPlanResponse { plan: NutritionPlan }

export interface CreatePlanPayload {
  nombre_apellido?: string
  calorias?: number
  proteina?: number
  grasa?: number
  ch?: number
  factor_actividad?: number
  velocidad_cambio?: number
  deficit_calorico?: number
  disponibilidad_energetica?: number | null
  libertad?: number
}

export interface CreatePlanResponse {
  id: number
  nombre_apellido: string
  calorias: number
  proteina: number
  grasa: number
  carbohidratos: number
}

/** PUT /plans/<id>/macros — admin/specialist only (Fix 18 — OMV-45). */
export interface UpdatePlanMacrosPayload {
  calorias?: number
  proteina?: number
  grasa?: number
  ch?: number
  carbohidratos?: number
  factor_actividad?: number
  velocidad_cambio?: number
  deficit_calorico?: number
  disponibilidad_energetica?: number | null
}

/** PUT /plans/<id>/structure — patient OK (Fix 18 — OMV-45). The short keys
 *  (dp/dg/dc, mmp/mmg/mmc, ap/ag/ac, mp/mg/mc, mtp/mtg/mtc, cp/cg/cc) are
 *  what the backend's _PLAN_STRUCTURE_FIELDS map expects. */
export interface UpdatePlanStructurePayload {
  libertad?: number
  /** Alias accepted by the backend (Fix 18 — OMV-51); maps to the same column
   *  as `libertad`. New clients should prefer this name for clarity. */
  libertad_pct?: number
  dp?: number; dg?: number; dc?: number
  mmp?: number; mmg?: number; mmc?: number
  ap?: number; ag?: number; ac?: number
  mp?: number; mg?: number; mc?: number
  mtp?: number; mtg?: number; mtc?: number
  cp?: number; cg?: number; cc?: number
  entreno_meal_key?: MealKey | null
  entreno_intensidad?: EntrenoIntensidad
}

export interface UpdatePlanResponse {
  id: number
  updated_fields?: string[]
  updated_macros?: string[]
  updated_structure?: string[]
}

/** Fix 18 — OMV-47: configurable formula parameters for auto-calculate. */
export interface ParametrosMacros {
  proteina_g_per_kg_lm?: number   // default 2.513244
  grasa_pct_kcal_min?: number     // default 0.30
  grasa_g_per_kg_min?: number     // default 0.6
}

export interface AutoCalculatePayload {
  factor_actividad?: number
  nombre_apellido?: string
  parametros_macros?: ParametrosMacros
}

export interface OpcionVelocidadMacros {
  proteina_g: number
  grasa_g: number
  carbohidratos_g: number
  proteina_porcentaje: number
  grasa_porcentaje: number
  carbohidratos_porcentaje: number
}

/** A single speed option produced by auto-calculate. The fields available
 *  depend on `tipo_objetivo`: `deficit_diario` for loss/maintenance,
 *  `superavit_diario` for gain. */
export interface OpcionVelocidad {
  nombre: string                  // 'Conservadora' | 'Moderada' | 'Agresiva' | 'Mantenimiento'
  velocidad_semanal_kg: number
  porcentaje_peso: string
  calorias: number
  deficit_diario?: number
  superavit_diario?: number
  semanas_estimadas: number
  riesgo_masa_magra?: string
  descripcion: string
  macros: OpcionVelocidadMacros
  disponibilidad_energetica: { ea_valor: number; ea_status: string }
}

export interface AutoCalculateResponse {
  datos_actuales: { peso: number; peso_magro: number; peso_graso: number; bf: number; ffmi: number }
  objetivo: { peso: number; peso_magro: number; peso_graso: number; bf: number; ffmi: number }
  cambios_necesarios: { peso: number; grasa: number; musculo: number }
  tipo_objetivo: 'mantenimiento' | 'perdida' | 'ganancia'
  tdee_mantenimiento: number
  tmb: number
  factor_actividad: number
  opciones_velocidad: OpcionVelocidad[]
  parametros_macros_usados: Required<ParametrosMacros>
  metadata: { sexo: 'M' | 'F'; edad: number; altura: number; fecha_calculo: string }
}

/** POST /plans/auto-calculate/accept — persists the chosen option as a new
 *  plan (Fix 18 — OMV-46). */
export interface AcceptOptionPayload {
  nombre_apellido?: string
  opcion: OpcionVelocidad
  factor_actividad?: number
  parametros_macros?: ParametrosMacros
  libertad?: number
}

export interface AcceptOptionResponse {
  plan_id: number
  calorias: number
  macros: { proteina_g: number; grasa_g: number; carbohidratos_g: number }
  velocidad_cambio: number
  persisted: true
}

/** save-config (Fix 18 — OMV-48,49,50). */
export interface ComidaConfig { enabled: boolean; size?: MealSize }

export interface SaveConfigPayload {
  comidas: Partial<Record<MealKey, ComidaConfig>>
  /** Multi-training meals (preferred). Empty = no training timing. */
  entreno_meal_keys?: MealKey[]
  /** Single-meal compat (legacy). Ignored if `entreno_meal_keys` is set. */
  entreno?: MealKey
  entreno_intensidad?: EntrenoIntensidad
  /** Explicit plan to configure; falls back to the patient's most recent. */
  plan_id?: number
  nombre_apellido?: string
}

export interface SaveConfigBlockComida {
  porcentajes: { proteina: number; grasa: number; carbohidratos: number }
  gramos: { proteina: number; grasa: number; carbohidratos: number }
}

export interface SaveConfigResponse {
  message: string
  plan_id: number
  entreno_meal_keys: MealKey[]
  entreno_intensidad: EntrenoIntensidad
  factor_aplicado: number
  blocks: {
    calorias: number
    proteina_total: number
    grasa_total: number
    ch_total: number
    comidas: Partial<Record<MealKey, SaveConfigBlockComida>>
  }
}

/** Solver — Fix 18 — OMV-52. */
export interface SolveMealAlimento {
  id: string | number
  nombre: string
  proteina_100g: number
  grasa_100g: number
  carbohidratos_100g: number
  medida_casera_g?: number
  medida_desc?: string
}

export interface SolveMealPayload {
  /** Either `objetivo` OR a `meal_key` (the backend resolves macros from the
   *  caller's most recent plan when only meal_key is provided). */
  objetivo?: { proteina: number; grasa: number; carbohidratos: number }
  meal_key?: MealKey
  libertad?: number
  alimentos?: SolveMealAlimento[]
  recetas?: { recipe_id: number }[]
}

/** Solver response per-food row. Field names match the v3 backend solver
 *  (`total_gramos`, `porciones`, `*_g`). */
export interface SolveMealAlimentoResultado {
  id: string | number
  nombre: string
  total_gramos?: number
  porciones?: number
  medida_casera_g?: number
  medida_desc?: string
  proteina_g?: number
  grasa_g?: number
  carbohidratos_g?: number
  calorias?: number
  rol?: string
}

export interface SolveMealResponse {
  status?: string
  alimentos?: SolveMealAlimentoResultado[]
  totales?: { proteina_g: number; grasa_g: number; carbohidratos_g: number; calorias?: number }
  calorias_totales?: number
  calidad?: number
  metodo?: string
  mensaje?: string
  [k: string]: unknown
}

/** POST /plans/<id>/adjust-calories — bumps calorias and recomputes macros. */
export interface AdjustCaloriesPayload { ajuste: number }
export interface AdjustCaloriesResponse {
  id: number
  ajuste_aplicado: number
  datos_nuevos: { calorias: number; proteina: number; grasa: number; carbohidratos: number }
}

/* ─────────────────── Food catalog (ALIMENTOS legacy table) ─────────────────── */

/** Row from `GET /nutrition/foods` (legacy ALIMENTOS table). The macros are
 *  expressed per 100 g of food. `Medidacasera*` are optional household measure
 *  hints (e.g. "1 cucharada" + 15 grams). */
export interface Food {
  ID: number
  Largadescripcion: string
  P: number          // proteína / 100g
  G: number          // grasa / 100g
  CH: number         // carbohidratos / 100g
  F: number          // fibra / 100g
  Gramo1?: number | null
  Medidacasera1?: string | number | null
  Gramo2?: number | null
  Medidacasera2?: string | number | null
}

export interface FoodsListResponse {
  data: Food[]
  pagination: {
    page: number
    per_page: number
    total: number
    has_next: boolean
    has_prev: boolean
  }
}

/* ─────────────────── Daily nutrition log ─────────────────── */

/** A single food entry inside a meal's foods_json array. Free-form on the
 *  backend; this is what we send/receive from the frontend. */
export interface LoggedFood {
  food_id: number
  nombre: string
  gramos: number
  // Snapshot of macros at the time of logging — per 100g multiplied by gramos/100
  proteina_g: number
  grasa_g: number
  carbohidratos_g: number
  calorias: number
}

/** One meal row in the daily log (one per meal_key per fecha per patient). */
export interface DailyLogMeal {
  meal_key: MealKey
  recipe_id: number | null
  recipe_name: string | null
  foods_json: LoggedFood[] | null
  completed: boolean
  total_p: number
  total_g: number
  total_c: number
  total_cal: number
  target_p: number
  target_g: number
  target_c: number
  meal_score: number
}

/** Aggregated daily totals from the `nutrition_daily_summary` table. */
export interface DailyLogSummary {
  meals_completed: number
  meals_total: number
  total_p: number
  total_g: number
  total_c: number
  total_cal: number
  target_p: number
  target_g: number
  target_c: number
  target_cal: number
  daily_score: number
}

/** GET /nutrition/daily-log?fecha=YYYY-MM-DD */
export interface DailyLogResponse {
  fecha: string
  meals: DailyLogMeal[]
  summary: DailyLogSummary | null
}

/** POST /nutrition/daily-log body — only the meals you want to upsert.
 *  Backend recomputes the summary row from the persisted state. */
export interface SaveDailyLogPayload {
  fecha?: string
  meals: Array<{
    meal_key: MealKey
    recipe_id?: number | null
    recipe_name?: string | null
    foods_json?: LoggedFood[] | string | null
    completed?: boolean
    total_p?: number
    total_g?: number
    total_c?: number
    total_cal?: number
    target_p?: number
    target_g?: number
    target_c?: number
  }>
  nombre_apellido?: string
}

export interface SaveDailyLogResponse {
  fecha: string
  meals_saved: number
  meals: Array<{ meal_key: MealKey; completed: boolean; meal_score: number }>
  summary: DailyLogSummary | null
}

/* ────────────── Training (Fase 6) ────────────── */

/** Strength test entry — a 1RM snapshot per exercise.
 *  Shape returned by GET /training/strength. Loose because the backend stores
 *  the per-lift detail in several JSON columns. */
export interface StrengthTest {
  id: number
  patient_id: number
  fecha: string
  peso_corporal: number | null
  /** `{ squat: { peso, reps, rm }, bench: {...}, deadlift: {...}, ... }` */
  lift_inputs_json?: Record<string, { peso?: number; reps?: number; rm?: number }> | null
  lifts_results_json?: Record<string, unknown> | null
  categories_results_json?: Record<string, unknown> | null
  muscle_groups_json?: Record<string, unknown> | null
  standards_json?: Record<string, unknown> | null
}

export interface StrengthResponse {
  user: string
  strength_data: StrengthTest | null
  message?: string
}

/** POST /training/strength body */
export interface CreateStrengthPayload {
  ejercicios: Record<string, { peso: number; reps: number }>
  peso_corporal?: number
  nombre_apellido?: string
  patient?: string
}

/** Lightweight plan list row from GET /training/plans. */
export interface TrainingPlanRow {
  id: number
  patient_id?: number
  name?: string | null
  active?: boolean
  current_dia?: number
  total_dias?: number
  total_days?: number  // alias used in some endpoints
  cycle_week?: number | null
  created_at?: string
  updated_at?: string
  source?: string | null
  /** May be present in /plans/<id> but typically absent in list. */
  plan_data?: unknown
}

export interface TrainingPlansResponse {
  plans: TrainingPlanRow[]
  total: number
}

/** GET /training/sessions/today — the day's exercises with prescription. */
export interface TodayExercise {
  exercise_key: string
  ejercicio?: string
  prescription?: string | null
  current_session?: number | null
  current_level?: string | null
  current_weight?: number | null
  extra_load?: number | null
  is_test?: boolean
  sets?: Array<{ reps?: number; weight?: number; rir?: number }> | null
}

export interface TodaySession {
  plan_id: number
  plan_nombre: string
  dia_actual: number
  total_dias: number
  cycle_week: number
  ejercicios: TodayExercise[]
  already_done: boolean
}

export interface TodaySessionResponse {
  today: TodaySession | null
  message?: string
}

/** POST /training/plans/<id>/optimize body — all fields optional. */
export interface OptimizePlanPayload {
  numeroDias?: number
  numeroEjercicios?: number
  runningConfig?: unknown
  source_strength_id?: number
}

export interface OptimizePlanResponse {
  plan_id: number
  previous_plan_id: number
  source_strength_id?: number
  relativeData: unknown
  optimizationResults: unknown
}

/** POST /training/sessions body — register a completed session. */
export interface CreateSessionPayload {
  plan_id?: number
  day_number?: number
  duracion_minutos?: number
  notas?: string
  ejercicios_completados?: Array<{
    exercise_key?: string
    ejercicio?: string
    sets?: unknown
    rpe?: number
    notes?: string
  }>
  completed?: boolean
  nombre_apellido?: string
}

/** Map the backend's `rol` string (which can be 'user', 'doctor', 'admin' or
 * comma-separated combinations) to one of the UI role buckets. */
export function backendRoleToUIRole(rol: string, isAdmin: boolean): Role {
  const parts = (rol || '').split(',').map((r) => r.trim().toLowerCase())
  if (isAdmin || parts.includes('admin')) return 'admin'
  if (parts.includes('doctor') || parts.includes('medico') || parts.includes('médico')) return 'doctor'
  if (parts.includes('nutritionist') || parts.includes('nutricionista')) return 'nutritionist'
  if (parts.includes('trainer') || parts.includes('entrenador')) return 'trainer'
  return 'patient'
}
