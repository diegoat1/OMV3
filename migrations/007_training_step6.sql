-- ============================================
-- Migration 007: Training Module Step 6
-- - strength_standards (OMV-57): standards before hardcoded
-- - training_programs (OMV-59): canned programs before hardcoded
-- - extends training_plans_v2 with periodization fields (OMV-61)
-- ============================================

PRAGMA foreign_keys=ON;

-- ============================================
-- 1. STRENGTH STANDARDS (OMV-57)
-- Bodyweight multiples per (lift x level x sex)
-- ============================================
CREATE TABLE IF NOT EXISTS strength_standards (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    lift_key        TEXT NOT NULL,         -- e.g. 'squat', 'bench', 'deadlift', 'overhead_press', 'row'
    level           TEXT NOT NULL,         -- 'beginner', 'novice', 'intermediate', 'advanced', 'elite'
    sex             TEXT NOT NULL DEFAULT 'M' CHECK(sex IN ('M', 'F', 'A')),
    bw_multiplier   REAL NOT NULL,
    UNIQUE(lift_key, level, sex)
);
CREATE INDEX IF NOT EXISTS idx_strength_standards_lift ON strength_standards(lift_key);

-- Seed: male standards (legacy hardcoded values from routes.py)
INSERT OR IGNORE INTO strength_standards (lift_key, level, sex, bw_multiplier) VALUES
    ('squat',          'beginner',     'M', 0.75),
    ('squat',          'novice',       'M', 1.00),
    ('squat',          'intermediate', 'M', 1.50),
    ('squat',          'advanced',     'M', 2.00),
    ('squat',          'elite',        'M', 2.50),
    ('bench',          'beginner',     'M', 0.50),
    ('bench',          'novice',       'M', 0.75),
    ('bench',          'intermediate', 'M', 1.00),
    ('bench',          'advanced',     'M', 1.50),
    ('bench',          'elite',        'M', 2.00),
    ('deadlift',       'beginner',     'M', 1.00),
    ('deadlift',       'novice',       'M', 1.25),
    ('deadlift',       'intermediate', 'M', 1.75),
    ('deadlift',       'advanced',     'M', 2.50),
    ('deadlift',       'elite',        'M', 3.00),
    ('overhead_press', 'beginner',     'M', 0.35),
    ('overhead_press', 'novice',       'M', 0.55),
    ('overhead_press', 'intermediate', 'M', 0.75),
    ('overhead_press', 'advanced',     'M', 1.00),
    ('overhead_press', 'elite',        'M', 1.25),
    ('row',            'beginner',     'M', 0.50),
    ('row',            'novice',       'M', 0.75),
    ('row',            'intermediate', 'M', 1.00),
    ('row',            'advanced',     'M', 1.25),
    ('row',            'elite',        'M', 1.50);

-- Seed: female standards (~0.7 x male, common rule of thumb for upper, ~0.8 lower)
INSERT OR IGNORE INTO strength_standards (lift_key, level, sex, bw_multiplier) VALUES
    ('squat',          'beginner',     'F', 0.55),
    ('squat',          'novice',       'F', 0.75),
    ('squat',          'intermediate', 'F', 1.10),
    ('squat',          'advanced',     'F', 1.50),
    ('squat',          'elite',        'F', 1.90),
    ('bench',          'beginner',     'F', 0.30),
    ('bench',          'novice',       'F', 0.45),
    ('bench',          'intermediate', 'F', 0.65),
    ('bench',          'advanced',     'F', 0.95),
    ('bench',          'elite',        'F', 1.30),
    ('deadlift',       'beginner',     'F', 0.75),
    ('deadlift',       'novice',       'F', 1.00),
    ('deadlift',       'intermediate', 'F', 1.40),
    ('deadlift',       'advanced',     'F', 1.90),
    ('deadlift',       'elite',        'F', 2.40),
    ('overhead_press', 'beginner',     'F', 0.20),
    ('overhead_press', 'novice',       'F', 0.35),
    ('overhead_press', 'intermediate', 'F', 0.50),
    ('overhead_press', 'advanced',     'F', 0.70),
    ('overhead_press', 'elite',        'F', 0.90),
    ('row',            'beginner',     'F', 0.30),
    ('row',            'novice',       'F', 0.50),
    ('row',            'intermediate', 'F', 0.70),
    ('row',            'advanced',     'F', 0.90),
    ('row',            'elite',        'F', 1.10);


-- ============================================
-- 2. TRAINING PROGRAMS (OMV-59)
-- Catalog of canned programs (was hardcoded in /programs)
-- ============================================
CREATE TABLE IF NOT EXISTS training_programs (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    program_key         TEXT UNIQUE NOT NULL,
    titulo              TEXT NOT NULL,
    descripcion         TEXT,
    descripcion_completa TEXT,
    duracion            TEXT,
    duracion_dias       INTEGER,
    nivel               TEXT,
    equipamiento        TEXT,
    frecuencia          TEXT,
    duracion_sesion     TEXT,
    template            TEXT,
    activo              INTEGER NOT NULL DEFAULT 1,
    orden               INTEGER NOT NULL DEFAULT 0,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_training_programs_activo ON training_programs(activo, orden);

INSERT OR IGNORE INTO training_programs
    (program_key, titulo, descripcion, descripcion_completa, duracion, duracion_dias, nivel, equipamiento, frecuencia, duracion_sesion, template, orden) VALUES
('30-dias-principiantes',
 'Programa de 30 Días para Principiantes',
 'Programa de bajo impacto perfecto para quienes comienzan su viaje fitness.',
 'Este programa de bajo impacto es perfecto para quienes comienzan su viaje fitness, adultos mayores, personas con obesidad, o cualquiera con problemas de rodillas o espalda.',
 '30 días', 30, 'Principiante', 'Sin equipamiento (opcional: mancuernas ligeras)', '5-6 días por semana', '20-30 minutos',
 'programa_30_dias_principiantes.html', 1),
('30-dias-forma',
 'Desafío de 30 Días para Ponerse en Forma',
 'Programa intermedio que combina cardio, kickboxing y fuerza.',
 'Programa intermedio que combina cardio, kickboxing y fuerza para quienes ya tienen una base mínima.',
 '30 días', 30, 'Principiante a Intermedio', 'Mancuernas ligeras', '5 días por semana', '30-40 minutos',
 'programa_30_dias_forma.html', 2),
('warrior-90',
 'Rutina de Entrenamiento Guerrero 90 Días',
 'Programa avanzado de 90 días con 30 rutinas diferentes.',
 'Programa avanzado de 90 días con 30 rutinas diferentes para quienes buscan un desafío real.',
 '90 días', 90, 'Intermedio a Avanzado', 'Mancuernas', '6 días por semana', '45-60 minutos',
 'programa_warrior_90.html', 3),
('hero-90',
 'Hero 90 - Programa de Alta Intensidad',
 'El programa más desafiante con 55+ rutinas de alta intensidad.',
 'El programa más desafiante de la plataforma con más de 55 rutinas de alta intensidad.',
 '90 días', 90, 'Avanzado', 'Mancuernas', '6 días por semana', '60+ minutos',
 'programa_hero_90.html', 4),
('30-abdominales',
 '30 Días para Abdominales Marcados',
 'Programa intensivo especializado en abdominales.',
 'Programa intensivo especializado en abdominales para definir el core en 30 días.',
 '30 días', 30, 'Intermedio', 'Sin equipamiento', '6 días por semana', '15-25 minutos',
 'programa_30_abdominales.html', 5),
('30-dias-adolescentes',
 '30 Días Pérdida de Peso para Adolescentes',
 'Programa especializado para jóvenes de 13 a 19 años.',
 'Programa especializado para jóvenes de 13 a 19 años con foco en pérdida saludable de peso.',
 '30 días', 30, 'Principiante a Intermedio', 'Sin equipamiento', '5 días por semana', '20-30 minutos',
 'programa_30_dias_adolescentes.html', 6),
('90-dias-musculo',
 '90 Días Construcción de Músculo',
 'Programa intensivo para maximizar el crecimiento muscular.',
 'Programa intensivo de 90 días para maximizar el crecimiento muscular en intermedios y avanzados.',
 '90 días', 90, 'Intermedio a Avanzado', 'Mancuernas y gimnasio', '5-6 días por semana', '60 minutos',
 'programa_90_dias_musculo.html', 7);


-- ============================================
-- 3. EXTEND training_plans_v2 (OMV-61: periodization tracking)
-- Idempotent ALTER TABLE (sqlite3 ignores existing columns silently in v3 driver,
-- so we wrap each in a benign re-creation guard handled by migrate_007.py).
-- ============================================
-- Note: we add nothing here directly; columns are added by the python migrator
-- so it can detect existing columns idempotently. See migrate_007_step6.py.


-- ============================================
-- 4. RUNNING STATE (OMV-56 helper) — moved from legacy ESTADO_EJERCICIO_USUARIO
-- exercise_progress already covers this; we just ensure the row pattern.
-- ============================================
-- (no-op DDL; helpers will UPSERT into exercise_progress with exercise_key='running')

-- End of migration 007
