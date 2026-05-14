-- ============================================
-- Migration 015 — Clinical alerts (Fix 6 — OMV-63)
-- Target: src/db/clinical.db
-- ============================================
-- Detección de signos rojos clínicos a partir del check-in diario y otros
-- inputs. Una alerta queda persistida con severity, source y resolved_at;
-- el profesional asignado la marca resuelta desde el frontend.
-- ============================================

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS clinical_alerts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id   INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    -- Identificador estable de la regla (sangre_moco, dolor_severo, bristol_extremo, etc.)
    rule         TEXT NOT NULL,
    -- 'low' | 'medium' | 'high' — high = signos rojos críticos
    severity     TEXT NOT NULL DEFAULT 'medium',
    -- Mensaje legible para mostrar al profesional
    message      TEXT NOT NULL,
    -- Origen: 'checkin', 'measurement', 'manual', etc.
    source       TEXT NOT NULL DEFAULT 'checkin',
    -- Referencia al row que originó la alerta (id de daily_checkins, etc.)
    source_id    INTEGER,
    -- Snapshot de los valores que dispararon la regla (JSON libre)
    payload_json TEXT,
    -- Auditoría
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at  DATETIME,
    resolved_by  INTEGER,            -- auth.db user_id del que la resolvió
    notes        TEXT
);
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_patient_active
    ON clinical_alerts(patient_id, resolved_at);
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_severity
    ON clinical_alerts(severity, created_at DESC);

COMMIT;
