-- ============================================
-- Migration 013 — Goals lifecycle (Paso 4)
-- Cierra: OMV-35, OMV-36, OMV-37, OMV-38, OMV-39, OMV-40, OMV-41, OMV-42
-- Bitácora: Fix 13
-- ============================================
-- Strategy: only ADD COLUMN (SQLite-safe) + create roadmaps table.
-- Existing CHECK constraint on `tipo` ('manual','auto') stays as-is;
-- new `source` column carries the richer enum ('manual','auto-accepted','auto-modified').
-- ============================================

PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- ---------- 1) roadmaps (created first so FK on goals.source_roadmap_id resolves) ----------
CREATE TABLE IF NOT EXISTS roadmaps (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    fases_json      TEXT NOT NULL,
    total_meses     REAL,
    ffmi_limite     REAL,
    bf_esencial     REAL,
    sexo            TEXT,
    altura          REAL,
    peso_inicial    REAL,
    bf_inicial      REAL,
    activo          BOOLEAN DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_roadmaps_patient ON roadmaps(patient_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_active  ON roadmaps(patient_id, activo);

-- ---------- 2) goals — extend ----------
-- OMV-35: status lifecycle
ALTER TABLE goals ADD COLUMN status              TEXT DEFAULT 'accepted';
-- OMV-37: trazabilidad de origen
ALTER TABLE goals ADD COLUMN source              TEXT DEFAULT 'manual';
-- OMV-41: trazabilidad al roadmap origen
ALTER TABLE goals ADD COLUMN source_roadmap_id   INTEGER REFERENCES roadmaps(id);
ALTER TABLE goals ADD COLUMN source_phase_index  INTEGER;
-- OMV-38: plazo
ALTER TABLE goals ADD COLUMN tiempo_estimado_meses REAL;
ALTER TABLE goals ADD COLUMN fecha_objetivo      DATE;
-- OMV-42: circunferencias adicionales
ALTER TABLE goals ADD COLUMN goal_hombro         REAL;
ALTER TABLE goals ADD COLUMN goal_pecho          REAL;
ALTER TABLE goals ADD COLUMN goal_brazo          REAL;
ALTER TABLE goals ADD COLUMN goal_antebrazo      REAL;
ALTER TABLE goals ADD COLUMN goal_muslo          REAL;
ALTER TABLE goals ADD COLUMN goal_pantorrilla    REAL;
-- OMV-35 / OMV-39: trazabilidad y encadenamiento
ALTER TABLE goals ADD COLUMN created_by_user_id  INTEGER;
ALTER TABLE goals ADD COLUMN accepted_by_user_id INTEGER;
ALTER TABLE goals ADD COLUMN previous_goal_id    INTEGER REFERENCES goals(id);
ALTER TABLE goals ADD COLUMN completed_at        DATETIME;
ALTER TABLE goals ADD COLUMN archived_at         DATETIME;

-- ---------- 3) Inicializar filas existentes ----------
-- Toda fila con activo=1 → status='accepted'; activo=0 → 'archived' con archived_at
UPDATE goals SET status='accepted'
    WHERE activo = 1 AND (status IS NULL OR status = 'accepted');
UPDATE goals SET status='archived', archived_at=COALESCE(archived_at, updated_at, created_at)
    WHERE activo = 0 AND (status IS NULL OR status = 'accepted');
-- Mapear tipo legacy a source
UPDATE goals SET source = 'auto-accepted' WHERE tipo = 'auto' AND (source IS NULL OR source = 'manual');
UPDATE goals SET source = 'manual'        WHERE tipo = 'manual' AND source IS NULL;

-- ---------- 4) Índices ----------
CREATE INDEX IF NOT EXISTS idx_goals_status     ON goals(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(patient_id, created_at DESC);

COMMIT;
