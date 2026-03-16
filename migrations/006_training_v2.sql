-- ============================================
-- Migration 006: Training Module v2
-- Comprehensive training system with exercise catalog,
-- progressions, distributions, plans, and session logging
-- ============================================

PRAGMA foreign_keys=ON;

-- ============================================
-- 1. EXERCISE CATALOG
-- Master list of exercises with full metadata
-- ============================================
CREATE TABLE IF NOT EXISTS exercises (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    key             TEXT UNIQUE NOT NULL,          -- e.g. 'backSquat' (matches strength analysis)
    name_en         TEXT NOT NULL,
    name_es         TEXT NOT NULL,
    category        TEXT NOT NULL,                 -- squat, floorPull, horizontalPress, verticalPress, pullup
    modality        TEXT NOT NULL DEFAULT 'bilateral', -- bilateral, unilateral
    equipment       TEXT NOT NULL DEFAULT 'barbell',   -- barbell, dumbbell, cable, machine, bodyweight, band, kettlebell, none
    metric_type     TEXT NOT NULL DEFAULT 'reps',      -- reps, time (seconds)
    load_type       TEXT NOT NULL DEFAULT 'loaded',    -- loaded, bodyweight, assisted
    is_compound     INTEGER NOT NULL DEFAULT 1,
    is_analysis_lift INTEGER NOT NULL DEFAULT 0,       -- used in strength analysis
    muscle_groups   TEXT,                               -- JSON array of primary muscle groups
    secondary_muscles TEXT,                             -- JSON array of secondary muscles
    instructions_es TEXT,                               -- brief execution cues
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. PROGRESSION TEMPLATES
-- Different progression schemes
-- ============================================
CREATE TABLE IF NOT EXISTS progression_templates (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    key             TEXT UNIQUE NOT NULL,
    name_es         TEXT NOT NULL,
    description_es  TEXT,
    type            TEXT NOT NULL,     -- matrix, linear, double, wave, deload
    config_json     TEXT NOT NULL,     -- full progression data
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. DISTRIBUTION TEMPLATES
-- How to split exercises across training days
-- ============================================
CREATE TABLE IF NOT EXISTS distribution_templates (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    key             TEXT UNIQUE NOT NULL,
    name_es         TEXT NOT NULL,
    description_es  TEXT,
    type            TEXT NOT NULL,     -- weakness_priority, push_pull_legs, upper_lower, full_body, custom
    min_days        INTEGER NOT NULL DEFAULT 3,
    max_days        INTEGER NOT NULL DEFAULT 6,
    config_json     TEXT,              -- optional rules/constraints
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. TRAINING PLANS v2
-- Generated plans linking patient + distribution + progression
-- ============================================
CREATE TABLE IF NOT EXISTS training_plans_v2 (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id          INTEGER NOT NULL,
    name                TEXT,
    distribution_key    TEXT,
    progression_key     TEXT,
    total_days          INTEGER NOT NULL,
    current_day         INTEGER NOT NULL DEFAULT 1,
    active              INTEGER NOT NULL DEFAULT 1,
    plan_json           TEXT NOT NULL,     -- full plan: [{dia, ejercicios: [{exercise_key, prescribed_sets, prescribed_reps, prescribed_weight, rest_seconds}]}]
    source_strength_id  INTEGER,           -- strength_tests.id used to generate
    config_json         TEXT,              -- generation params (num_exercises, running, etc.)
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- ============================================
-- 5. EXERCISE PROGRESS
-- Per-patient per-exercise progression state
-- Replaces ESTADO_EJERCICIO_USUARIO
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_progress (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL,
    exercise_key    TEXT NOT NULL,
    progression_key TEXT,                  -- which progression template
    current_level   INTEGER NOT NULL DEFAULT 0,  -- position in progression matrix/scheme
    current_session INTEGER NOT NULL DEFAULT 1,
    current_weight  REAL NOT NULL DEFAULT 0,
    last_reps       INTEGER,
    extra_load      REAL NOT NULL DEFAULT 0,      -- for bodyweight exercises (weighted pullups, dips)
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    UNIQUE(patient_id, exercise_key)
);

-- ============================================
-- 6. TRAINING SESSIONS
-- A logged workout
-- ============================================
CREATE TABLE IF NOT EXISTS training_sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL,
    plan_id         INTEGER,              -- training_plans_v2.id (null = ad-hoc session)
    day_number      INTEGER,              -- which day of the plan
    fecha           DATE NOT NULL,
    started_at      DATETIME,
    finished_at     DATETIME,
    duration_minutes INTEGER,
    overall_difficulty INTEGER CHECK(overall_difficulty BETWEEN 1 AND 10),
    notes           TEXT,
    completed       INTEGER NOT NULL DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (plan_id) REFERENCES training_plans_v2(id)
);

-- ============================================
-- 7. SESSION EXERCISES
-- Each exercise logged within a session
-- ============================================
CREATE TABLE IF NOT EXISTS session_exercises (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      INTEGER NOT NULL,
    exercise_key    TEXT NOT NULL,
    order_index     INTEGER NOT NULL DEFAULT 0,
    -- Prescribed (from plan)
    prescribed_sets     INTEGER,
    prescribed_reps     INTEGER,
    prescribed_weight   REAL,
    -- Actual performance
    sets_json       TEXT,  -- [{set_num, reps_or_time, weight, rpe, completed, is_warmup}]
    difficulty      INTEGER CHECK(difficulty BETWEEN 1 AND 10),
    -- Superset config
    is_superset     INTEGER NOT NULL DEFAULT 0,
    superset_group  INTEGER,              -- exercises with same group run together
    notes           TEXT,
    FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE
);

-- ============================================
-- 8. SESSION EXTRAS
-- Cardio, stretching, mobility, warmup
-- ============================================
CREATE TABLE IF NOT EXISTS session_extras (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      INTEGER NOT NULL,
    type            TEXT NOT NULL,         -- warmup, cardio, stretching, mobility
    description     TEXT,
    duration_minutes INTEGER,
    intensity       TEXT,                  -- low, moderate, high
    details_json    TEXT,                  -- flexible: {speed, distance, incline} for cardio, {exercises: [...]} for mobility
    notes           TEXT,
    FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE
);

-- ============================================
-- SEED: Exercises (14 strength analysis + extras)
-- ============================================
INSERT OR IGNORE INTO exercises (key, name_en, name_es, category, modality, equipment, metric_type, load_type, is_compound, is_analysis_lift, muscle_groups, secondary_muscles) VALUES
-- Squat category
('backSquat',         'Back Squat',           'Sentadilla Trasera',      'squat',           'bilateral', 'barbell',    'reps', 'loaded',    1, 1, '["quads","glutes"]',           '["hamstrings","core","hipAdductors"]'),
('frontSquat',        'Front Squat',          'Sentadilla Frontal',      'squat',           'bilateral', 'barbell',    'reps', 'loaded',    1, 1, '["quads","glutes"]',           '["core","upperBack"]'),
-- Floor Pull category
('deadlift',          'Deadlift',             'Peso Muerto',             'floorPull',       'bilateral', 'barbell',    'reps', 'loaded',    1, 1, '["hamstrings","glutes","lowerBack"]', '["quads","forearms","traps"]'),
('sumoDeadlift',      'Sumo Deadlift',        'Peso Muerto Sumo',       'floorPull',       'bilateral', 'barbell',    'reps', 'loaded',    1, 1, '["glutes","hipAdductors","hamstrings"]', '["quads","lowerBack"]'),
('powerClean',        'Power Clean',          'Cargada de Potencia',     'floorPull',       'bilateral', 'barbell',    'reps', 'loaded',    1, 1, '["hamstrings","glutes","traps"]', '["quads","frontDelts","core"]'),
-- Horizontal Press category
('benchPress',        'Bench Press',          'Press de Banca',          'horizontalPress', 'bilateral', 'barbell',    'reps', 'loaded',    1, 1, '["pecs","triceps"]',            '["frontDelts"]'),
('inclineBenchPress', 'Incline Bench Press',  'Press Inclinado',         'horizontalPress', 'bilateral', 'barbell',    'reps', 'loaded',    1, 1, '["pecs","frontDelts"]',         '["triceps"]'),
('dip',               'Dip',                  'Fondos',                  'horizontalPress', 'bilateral', 'bodyweight', 'reps', 'bodyweight', 1, 1, '["pecs","triceps"]',            '["frontDelts"]'),
-- Vertical Press category
('overheadPress',     'Overhead Press',       'Press Militar',           'verticalPress',   'bilateral', 'barbell',    'reps', 'loaded',    1, 1, '["frontDelts","triceps"]',      '["lateralDelts","traps","core"]'),
('pushPress',         'Push Press',           'Push Press',              'verticalPress',   'bilateral', 'barbell',    'reps', 'loaded',    1, 1, '["frontDelts","triceps","quads"]', '["core","traps"]'),
('snatchPress',       'Snatch Press',         'Press de Arranque',       'verticalPress',   'bilateral', 'barbell',    'reps', 'loaded',    1, 1, '["frontDelts","lateralDelts"]',  '["triceps","traps","core"]'),
-- Pullup category
('pullup',            'Pull-up',              'Dominadas',               'pullup',          'bilateral', 'bodyweight', 'reps', 'bodyweight', 1, 1, '["lats","biceps"]',             '["forearms","rearDelts","core"]'),
('chinup',            'Chin-up',              'Dominadas Supinas',       'pullup',          'bilateral', 'bodyweight', 'reps', 'bodyweight', 1, 1, '["lats","biceps"]',             '["forearms","rearDelts"]'),
('pendlayRow',        'Pendlay Row',          'Remo Pendlay',            'pullup',          'bilateral', 'barbell',    'reps', 'loaded',    1, 1, '["lats","rearDelts","traps"]',  '["biceps","forearms","lowerBack"]'),
-- Extra exercises (not in analysis but useful for training)
('bulgarianSplit',    'Bulgarian Split Squat','Sentadilla Bulgara',      'squat',           'unilateral','dumbbell',   'reps', 'loaded',    1, 0, '["quads","glutes"]',            '["hamstrings","core"]'),
('romanianDeadlift',  'Romanian Deadlift',    'Peso Muerto Rumano',      'floorPull',       'bilateral', 'barbell',    'reps', 'loaded',    1, 0, '["hamstrings","glutes"]',       '["lowerBack"]'),
('dbRow',             'Dumbbell Row',         'Remo con Mancuerna',      'pullup',          'unilateral','dumbbell',   'reps', 'loaded',    1, 0, '["lats","rearDelts"]',          '["biceps","forearms"]'),
('dbShoulderPress',   'DB Shoulder Press',    'Press Hombro Mancuerna',  'verticalPress',   'bilateral', 'dumbbell',   'reps', 'loaded',    1, 0, '["frontDelts","triceps"]',      '["lateralDelts"]'),
('dbBenchPress',      'DB Bench Press',       'Press Banca Mancuerna',   'horizontalPress', 'bilateral', 'dumbbell',   'reps', 'loaded',    1, 0, '["pecs","triceps"]',            '["frontDelts"]'),
('hipThrust',         'Hip Thrust',           'Empuje de Cadera',        'floorPull',       'bilateral', 'barbell',    'reps', 'loaded',    1, 0, '["glutes","hamstrings"]',       '["core"]'),
('latPulldown',       'Lat Pulldown',         'Jalon al Pecho',          'pullup',          'bilateral', 'cable',      'reps', 'loaded',    1, 0, '["lats","biceps"]',             '["rearDelts"]'),
('facePull',          'Face Pull',            'Face Pull',               'pullup',          'bilateral', 'cable',      'reps', 'loaded',    0, 0, '["rearDelts","traps"]',         '["biceps"]'),
('lateralRaise',      'Lateral Raise',        'Elevacion Lateral',       'verticalPress',   'bilateral', 'dumbbell',   'reps', 'loaded',    0, 0, '["lateralDelts"]',              '[]'),
('plank',             'Plank',                'Plancha',                 'core',            'bilateral', 'none',       'time', 'bodyweight', 0, 0, '["core"]',                      '["glutes","shoulders"]'),
('hangingLegRaise',   'Hanging Leg Raise',    'Elevacion Piernas Colgado','core',           'bilateral', 'bodyweight', 'reps', 'bodyweight', 0, 0, '["core","hipFlexors"]',         '["forearms"]');

-- ============================================
-- SEED: Progression Templates
-- ============================================
INSERT OR IGNORE INTO progression_templates (key, name_es, description_es, type, config_json) VALUES
('matrix_3x9', 'Matriz Estandar 3x9',
 'Progresion por matriz de 3 rangos de repeticiones y 9 niveles. Cada nivel aumenta volumen progresivamente.',
 'matrix',
 '{"ranges": [{"min_reps": 4, "max_reps": 6}, {"min_reps": 6, "max_reps": 8}, {"min_reps": 8, "max_reps": 10}], "levels": [["1.1.1.1.1","1.1.1.1.1","2.1.1.1.1","2.2.2.1.1","3.2.2.2.1","4.3.3.2.2","4.4.3.2.2","5.4.4.3.3","6.5.4.3.3"], ["1.1.1.1.1","1.1.1.1.1","2.2.1.1.1","3.2.2.2.1","3.3.2.2.2","4.4.3.3.2","5.4.4.3.2","6.5.4.4.3","7.6.5.4.3"], ["1.1.1.1.1","1.1.1.1.1","2.2.2.1.1","3.3.2.2.2","4.3.3.2.2","5.4.4.3.3","6.5.4.4.3","7.6.5.4.4","8.7.6.5.4"]], "sessions_per_level": 4, "deload_every": 9, "notes": "Cada patron es sets.reps codificado. Al completar sessions_per_level sesiones, avanza de nivel."}'
),
('linear_simple', 'Progresion Lineal Simple',
 'Agrega peso cada sesion exitosa. Si fallas, repite. Despues de 3 fallos consecutivos, deload 10%.',
 'linear',
 '{"increment_kg": {"loaded": 2.5, "bodyweight": 1.0}, "deload_percent": 10, "max_consecutive_fails": 3, "sets": 3, "target_reps": 5, "notes": "Ideal para principiantes. Progresion sesion a sesion."}'
),
('double_progression', 'Doble Progresion',
 'Primero aumenta reps dentro del rango, luego sube peso y vuelve al minimo de reps.',
 'double',
 '{"rep_range": [8, 12], "sets": 3, "increment_kg": {"loaded": 2.5, "bodyweight": 1.0}, "notes": "Cuando logras 3x12, sube peso y empieza en 3x8."}'
),
('wave_531', 'Ondulacion 5/3/1',
 'Ciclo de 4 semanas: semana 1 (3x5), semana 2 (3x3), semana 3 (5/3/1), semana 4 (deload).',
 'wave',
 '{"cycle_weeks": 4, "weeks": [{"name": "5s", "sets": [{"reps": 5, "percent_1rm": 65}, {"reps": 5, "percent_1rm": 75}, {"reps": 5, "percent_1rm": 85}]}, {"name": "3s", "sets": [{"reps": 3, "percent_1rm": 70}, {"reps": 3, "percent_1rm": 80}, {"reps": 3, "percent_1rm": 90}]}, {"name": "531", "sets": [{"reps": 5, "percent_1rm": 75}, {"reps": 3, "percent_1rm": 85}, {"reps": 1, "percent_1rm": 95}]}, {"name": "deload", "sets": [{"reps": 5, "percent_1rm": 40}, {"reps": 5, "percent_1rm": 50}, {"reps": 5, "percent_1rm": 60}]}], "increment_per_cycle_kg": {"upper": 2.5, "lower": 5.0}, "notes": "Basado en Wendler 5/3/1. La ultima serie de cada semana es AMRAP (tantas como puedas)."}'
);

-- ============================================
-- SEED: Distribution Templates
-- ============================================
INSERT OR IGNORE INTO distribution_templates (key, name_es, description_es, type, min_days, max_days, config_json) VALUES
('weakness_priority', 'Prioridad por Debilidades',
 'Distribuye mas volumen a los grupos musculares mas debiles segun el analisis de fuerza. Usa optimizador PuLP.',
 'weakness_priority', 3, 6,
 '{"requires_strength_test": true, "optimizer": "pulp", "notes": "El sistema actual. Requiere un test de fuerza previo para calcular debilidades."}'
),
('push_pull_legs', 'Push / Pull / Piernas',
 'Divide ejercicios en empuje, tiron y piernas. 3-6 dias con repeticion de cada patron.',
 'push_pull_legs', 3, 6,
 '{"split": {"push": ["horizontalPress", "verticalPress"], "pull": ["pullup", "floorPull"], "legs": ["squat"]}, "days_config": {"3": ["push","pull","legs"], "4": ["push","pull","legs","push"], "5": ["push","pull","legs","push","pull"], "6": ["push","pull","legs","push","pull","legs"]}}'
),
('upper_lower', 'Tren Superior / Inferior',
 'Alterna entre tren superior e inferior. Ideal para 4 dias.',
 'upper_lower', 2, 6,
 '{"split": {"upper": ["horizontalPress", "verticalPress", "pullup"], "lower": ["squat", "floorPull"]}, "days_config": {"2": ["upper","lower"], "3": ["upper","lower","upper"], "4": ["upper","lower","upper","lower"], "5": ["upper","lower","upper","lower","upper"], "6": ["upper","lower","upper","lower","upper","lower"]}}'
),
('full_body', 'Cuerpo Completo',
 'Cada sesion trabaja todos los patrones de movimiento. Ideal para 2-3 dias.',
 'full_body', 2, 4,
 '{"required_categories_per_day": ["squat", "floorPull", "horizontalPress", "verticalPress", "pullup"], "exercises_per_day": 5, "notes": "Selecciona 1 ejercicio por categoria cada dia, rotando variantes."}'
);
