-- ============================================
-- Migration 016 — Daily log tables → migration formal (Fix OMV-71)
-- Target: src/db/clinical.db
-- ============================================
-- Mueve `_ensure_daily_log_tables(conn)` (que corría una vez por request en
-- nutrition/routes.py) a una migration declarativa. La función seguirá viva
-- como fallback idempotente pero deja de ser el "owner" del DDL.
-- ============================================

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS nutrition_daily_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL,
    meal_key        TEXT NOT NULL,
    recipe_id       INTEGER,
    recipe_name     TEXT,
    foods_json      TEXT,
    completed       BOOLEAN DEFAULT 0,
    total_p         REAL, total_g REAL, total_c REAL, total_cal REAL,
    target_p        REAL, target_g REAL, target_c REAL,
    meal_score      REAL DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, fecha, meal_key)
);
CREATE INDEX IF NOT EXISTS idx_nutrition_daily_logs_patient
    ON nutrition_daily_logs(patient_id, fecha DESC);

CREATE TABLE IF NOT EXISTS nutrition_daily_summary (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL,
    meals_completed INTEGER, meals_total INTEGER,
    total_p         REAL, total_g REAL, total_c REAL, total_cal REAL,
    target_p        REAL, target_g REAL, target_c REAL, target_cal REAL,
    daily_score     REAL DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, fecha)
);
CREATE INDEX IF NOT EXISTS idx_nutrition_daily_summary_patient
    ON nutrition_daily_summary(patient_id, fecha DESC);

COMMIT;
