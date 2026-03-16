-- ============================================
-- clinical.db — Schema v1.0
-- OMV3 Relational Database
-- ============================================
-- Todas las tablas usan patients.id como FK universal
-- Columnas en snake_case, nombres legibles
-- ============================================

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- ============================================
-- TABLA CENTRAL: patients
-- Reemplaza: PERFILESTATICO
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    auth_user_id    INTEGER,            -- FK → auth.db users.id
    dni             TEXT UNIQUE NOT NULL,
    nombre          TEXT NOT NULL,       -- Nombre completo (Apellido, Nombre)
    email           TEXT,
    telefono        TEXT,
    sexo            TEXT CHECK(sexo IN ('M','F')),
    fecha_nacimiento DATE,
    altura          REAL,
    circ_cuello     REAL,
    circ_muneca     REAL,
    circ_tobillo    REAL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_patients_dni ON patients(dni);
CREATE INDEX IF NOT EXISTS idx_patients_auth ON patients(auth_user_id);

-- ============================================
-- MEDICIONES CORPORALES
-- Reemplaza: PERFILDINAMICO
-- ============================================
CREATE TABLE IF NOT EXISTS measurements (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL,
    peso            REAL,
    circ_abdomen    REAL,
    circ_cintura    REAL,
    circ_cadera     REAL,
    -- Calculados automáticamente
    bf_percent      REAL,
    imc             REAL,
    ffmi            REAL,
    peso_graso      REAL,
    peso_magro      REAL,
    -- Deltas (vs medición anterior)
    delta_dias      INTEGER,
    delta_peso      REAL,
    delta_peso_dia  REAL,
    delta_graso     REAL,
    delta_graso_dia REAL,
    delta_magro     REAL,
    delta_magro_dia REAL,
    delta_peso_cat  TEXT,
    -- Ratios
    lbm_loss        REAL,
    lbm_loss_cat    TEXT,
    fbm_gain        REAL,
    fbm_gain_cat    TEXT,
    -- Circunferencias de seguimiento
    circ_hombro     REAL,
    circ_pecho      REAL,
    circ_brazo      REAL,
    circ_antebrazo  REAL,
    circ_muslo      REAL,
    circ_pantorrilla REAL,
    -- Scores
    score_ffmi      REAL,
    score_bf        REAL,
    body_score      REAL,
    -- Forecast
    inc_days        INTEGER,
    dec_days        INTEGER,
    total_days      INTEGER,
    pf              REAL,
    pmf             REAL,
    pgf             REAL,
    abdf            REAL,
    cinf            REAL,
    cadf            REAL,
    solver_category TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_measurements_patient ON measurements(patient_id);
CREATE INDEX IF NOT EXISTS idx_measurements_fecha ON measurements(patient_id, fecha);

-- ============================================
-- OBJETIVOS
-- Reemplaza: OBJETIVO
-- ============================================
CREATE TABLE IF NOT EXISTS goals (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    goal_ffmi       REAL,
    goal_bf         REAL,
    goal_peso       REAL,
    goal_abdomen    REAL,
    goal_cintura    REAL,
    goal_cadera     REAL,
    notas           TEXT,
    tipo            TEXT CHECK(tipo IN ('manual','auto')) DEFAULT 'manual',
    activo          BOOLEAN DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_goals_patient ON goals(patient_id);

-- ============================================
-- PLANES NUTRICIONALES
-- Reemplaza: DIETA
-- ============================================
CREATE TABLE IF NOT EXISTS nutrition_plans (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    calorias        REAL,
    proteina        REAL,
    grasa           REAL,
    carbohidratos   REAL,
    -- Distribución por comida (porcentajes 0.0-1.0)
    desayuno_p      REAL, desayuno_g      REAL, desayuno_c      REAL,
    media_man_p     REAL, media_man_g     REAL, media_man_c     REAL,
    almuerzo_p      REAL, almuerzo_g      REAL, almuerzo_c      REAL,
    merienda_p      REAL, merienda_g      REAL, merienda_c      REAL,
    media_tar_p     REAL, media_tar_g     REAL, media_tar_c     REAL,
    cena_p          REAL, cena_g          REAL, cena_c          REAL,
    libertad        INTEGER DEFAULT 5,
    estrategia      TEXT,
    factor_actividad REAL,
    velocidad_cambio REAL,
    deficit_calorico REAL,
    disponibilidad_energetica REAL,
    activo          BOOLEAN DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_patient ON nutrition_plans(patient_id);

-- ============================================
-- PLANES ALIMENTARIOS (recetas seleccionadas)
-- Reemplaza: PLANES_ALIMENTARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS meal_plans (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    tipo            TEXT DEFAULT 'recetas',
    plan_json       TEXT,
    activo          BOOLEAN DEFAULT 1,
    total_recetas   INTEGER,
    comidas_configuradas INTEGER,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_meal_plans_patient ON meal_plans(patient_id);

-- ============================================
-- TESTS DE FUERZA
-- Reemplaza: FUERZA
-- ============================================
CREATE TABLE IF NOT EXISTS strength_tests (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    fecha           DATETIME DEFAULT CURRENT_TIMESTAMP,
    edad            INTEGER,
    bodyweight      REAL,
    sexo            TEXT,
    unit_system     TEXT,
    round_to        REAL,
    -- Resultados
    total_score     REAL,
    score_class     TEXT,
    symmetry_score  REAL,
    wilks           REAL,
    powerlifting_total REAL,
    strongest_lift  TEXT,
    weakest_lift    TEXT,
    strongest_muscles TEXT,  -- JSON array
    weakest_muscles TEXT,    -- JSON array
    -- JSON detallado
    lift_inputs_json TEXT,
    lifts_results_json TEXT,
    categories_results_json TEXT,
    muscle_groups_json TEXT,
    standards_json  TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_strength_patient ON strength_tests(patient_id);

-- ============================================
-- PLANES DE ENTRENAMIENTO
-- Reemplaza: PLANES_ENTRENAMIENTO
-- ============================================
CREATE TABLE IF NOT EXISTS training_plans (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    plan_json       TEXT,
    total_dias      INTEGER,
    current_dia     INTEGER DEFAULT 1,
    activo          BOOLEAN DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_training_plans_patient ON training_plans(patient_id);

-- ============================================
-- ESTADO DE EJERCICIOS
-- Reemplaza: ESTADO_EJERCICIO_USUARIO
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_state (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    ejercicio       TEXT NOT NULL,
    columna         INTEGER,
    sesion          INTEGER,
    peso            REAL,
    lastre          REAL DEFAULT 0,
    fila_matriz     INTEGER DEFAULT 0,
    last_test_reps  INTEGER,
    last_test_date  DATETIME,
    UNIQUE(patient_id, ejercicio)
);
CREATE INDEX IF NOT EXISTS idx_exercise_state_patient ON exercise_state(patient_id);

-- ============================================
-- CATÁLOGOS (datos compartidos, no por paciente)
-- ============================================

-- Reemplaza: ALIMENTOS
CREATE TABLE IF NOT EXISTS foods (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre          TEXT NOT NULL,
    nombre_corto    TEXT,
    proteina        REAL DEFAULT 0,
    grasa           REAL DEFAULT 0,
    carbohidratos   REAL DEFAULT 0,
    fibra           REAL DEFAULT 0,
    porcion1_desc   TEXT,
    porcion1_g      REAL,
    porcion2_desc   TEXT,
    porcion2_g      REAL
);

-- Reemplaza: RECETAS (nueva estructura relacional)
CREATE TABLE IF NOT EXISTS recipes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre          TEXT NOT NULL,
    palabras_clave  TEXT,
    categoria       TEXT CHECK(categoria IN ('desayuno_merienda', 'almuerzo_cena', 'ambas')),
    created_by      INTEGER,
    legacy_id       INTEGER,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recipes_nombre ON recipes(nombre);
CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON recipes(created_by);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id           INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    alimento_nombre     TEXT NOT NULL,
    alimento_id         INTEGER,
    medida_tipo         INTEGER DEFAULT 0,
    rol                 TEXT NOT NULL CHECK(rol IN ('base', 'dependiente', 'fijo')),
    base_ingredient_id  INTEGER REFERENCES recipe_ingredients(id),
    ratio               REAL,
    tipo_ratio          TEXT CHECK(tipo_ratio IN ('peso', 'medida_casera')),
    cantidad_fija       REAL,
    orden               INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

-- Reemplaza: GRUPOSALIMENTOS
CREATE TABLE IF NOT EXISTS food_groups (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria       TEXT,
    descripcion     TEXT,
    porcion         REAL DEFAULT 100,
    proteina        REAL DEFAULT 0,
    grasas_totales  REAL DEFAULT 0,
    carbohidratos   REAL DEFAULT 0,
    fibra           REAL DEFAULT 0,
    calcio          REAL DEFAULT 0,
    hierro          REAL DEFAULT 0,
    magnesio        REAL DEFAULT 0,
    fosforo         REAL DEFAULT 0,
    potasio         REAL DEFAULT 0,
    sodio           REAL DEFAULT 0,
    zinc            REAL DEFAULT 0,
    cobre           REAL DEFAULT 0,
    manganeso       REAL DEFAULT 0,
    selenio         REAL DEFAULT 0,
    vit_c           REAL DEFAULT 0,
    tiamina         REAL DEFAULT 0,
    riboflavina     REAL DEFAULT 0,
    niacina         REAL DEFAULT 0,
    ac_pantotenico  REAL DEFAULT 0,
    vit_b6          REAL DEFAULT 0,
    folatos         REAL DEFAULT 0,
    colina          REAL DEFAULT 0,
    vit_b12         REAL DEFAULT 0,
    vit_a_rae       REAL DEFAULT 0,
    retinol         REAL DEFAULT 0,
    betacaroteno    REAL DEFAULT 0,
    vit_e           REAL DEFAULT 0,
    vit_d           REAL DEFAULT 0,
    vit_k           REAL DEFAULT 0,
    grasas_sat      REAL DEFAULT 0,
    grasas_mono     REAL DEFAULT 0,
    grasas_poli     REAL DEFAULT 0,
    grasas_trans    REAL DEFAULT 0,
    colesterol      REAL DEFAULT 0,
    omega3_epa      REAL DEFAULT 0,
    omega3_dha      REAL DEFAULT 0,
    omega3_ala      REAL DEFAULT 0,
    omega6_la       REAL DEFAULT 0,
    omega6_aa       REAL DEFAULT 0,
    calorias        REAL DEFAULT 0,
    agua            REAL DEFAULT 0,
    cenizas         REAL DEFAULT 0,
    alcohol         REAL DEFAULT 0
);

-- Reemplaza: MATRIZ_ENTRENAMIENTO
CREATE TABLE IF NOT EXISTS training_matrix (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    matriz_json     TEXT
);

-- Reemplaza: PLAN_BLOQUES_PRESETS
CREATE TABLE IF NOT EXISTS block_presets (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    comida          TEXT,
    tipo_preset     TEXT,
    nombre_preset   TEXT,
    proteina_pct    REAL,
    grasa_pct       REAL,
    carbohidratos_pct REAL,
    descripcion     TEXT
);

-- Reemplaza: PLAN_BLOQUES_FAVORITOS
CREATE TABLE IF NOT EXISTS block_favorites (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    comida          TEXT,
    nombre          TEXT,
    proteina_pct    REAL,
    grasa_pct       REAL,
    carbohidratos_pct REAL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reemplaza: PLAN_BLOQUES_AJUSTES_LOG
CREATE TABLE IF NOT EXISTS block_adjustments_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    comida          TEXT,
    campo           TEXT,
    valor_anterior  REAL,
    valor_nuevo     REAL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CHECK-IN DIARIO (respuestas base)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_checkins (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL,
    -- Hábitos / recuperación
    fumo            BOOLEAN DEFAULT 0,
    alcohol         TEXT CHECK(alcohol IN ('no','poco','moderado','mucho')) DEFAULT 'no',
    actividad_fisica BOOLEAN DEFAULT 0,
    actividad_tipo  TEXT,
    actividad_minutos INTEGER,
    horas_sueno     REAL,
    calidad_sueno   INTEGER CHECK(calidad_sueno BETWEEN 0 AND 10),
    estres          INTEGER CHECK(estres BETWEEN 0 AND 10),
    energia         INTEGER CHECK(energia BETWEEN 0 AND 10),
    animo           INTEGER CHECK(animo BETWEEN 0 AND 10),
    -- Digestivo
    deposicion      BOOLEAN,
    deposicion_veces INTEGER,
    bristol         INTEGER CHECK(bristol BETWEEN 1 AND 7),
    dolor_abdominal BOOLEAN DEFAULT 0,
    sangre_moco     BOOLEAN DEFAULT 0,
    -- Autocuidado
    hidratacion_litros REAL,
    hambre_ansiedad INTEGER CHECK(hambre_ansiedad BETWEEN 0 AND 10),
    tomo_medicacion BOOLEAN DEFAULT 0,
    medicacion_detalle TEXT,
    -- Metadata
    completado      BOOLEAN DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, fecha)
);
CREATE INDEX IF NOT EXISTS idx_checkins_patient_fecha ON daily_checkins(patient_id, fecha);

-- ============================================
-- EVENTOS DE SÍNTOMAS POR SISTEMA
-- ============================================
CREATE TABLE IF NOT EXISTS symptom_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    checkin_id      INTEGER REFERENCES daily_checkins(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL,
    sistema         TEXT NOT NULL CHECK(sistema IN (
        'respiratorio','orl','cardiologico','genitourinario',
        'musculoesqueletico','neurologico','piel','temperatura'
    )),
    descripcion     TEXT,
    intensidad      INTEGER CHECK(intensidad BETWEEN 0 AND 10),
    detalle_json    TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_symptoms_patient_fecha ON symptom_events(patient_id, fecha);

-- ============================================
-- HISTORIAL DE HEALTH INDEX (1 registro/día)
-- ============================================
CREATE TABLE IF NOT EXISTS health_index_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL,
    score           REAL NOT NULL,
    comp_corporal   REAL,
    comp_cintura    REAL,
    comp_actividad  REAL,
    comp_sueno      REAL,
    comp_recuperacion REAL,
    comp_digestivo  REAL,
    comp_habitos    REAL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, fecha)
);
CREATE INDEX IF NOT EXISTS idx_health_index_patient_fecha ON health_index_history(patient_id, fecha);

-- ============================================
-- LOGS DIARIOS DE NUTRICION
-- ============================================
CREATE TABLE IF NOT EXISTS nutrition_daily_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL,
    meal_key        TEXT NOT NULL,
    recipe_id       INTEGER,
    recipe_name     TEXT,
    foods_json      TEXT,
    completed       BOOLEAN DEFAULT 0,
    total_p         REAL,
    total_g         REAL,
    total_c         REAL,
    total_cal       REAL,
    target_p        REAL,
    target_g        REAL,
    target_c        REAL,
    meal_score      REAL DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, fecha, meal_key)
);
CREATE INDEX IF NOT EXISTS idx_daily_logs_patient_fecha ON nutrition_daily_logs(patient_id, fecha);

CREATE TABLE IF NOT EXISTS nutrition_daily_summary (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL,
    meals_completed INTEGER,
    meals_total     INTEGER,
    total_p         REAL,
    total_g         REAL,
    total_c         REAL,
    total_cal       REAL,
    target_p        REAL,
    target_g        REAL,
    target_c        REAL,
    target_cal      REAL,
    daily_score     REAL DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, fecha)
);
CREATE INDEX IF NOT EXISTS idx_daily_summary_patient_fecha ON nutrition_daily_summary(patient_id, fecha);

-- ============================================
-- TABLA DE MAPEO (para migración)
-- ============================================
CREATE TABLE IF NOT EXISTS _migration_map (
    legacy_nombre_apellido TEXT,
    legacy_dni             TEXT,
    new_patient_id         INTEGER REFERENCES patients(id),
    migrated_at            DATETIME DEFAULT CURRENT_TIMESTAMP
);
