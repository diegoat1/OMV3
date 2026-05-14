-- ============================================
-- Migration 014 — Auth hardening (Fix 11 + Fix 12)
-- Target: src/auth.db
-- Cierra: OMV-1, OMV-15, OMV-16, OMV-17, OMV-19, OMV-20, OMV-21, OMV-74,
--         OMV-75, OMV-76, OMV-77, OMV-78, OMV-80, OMV-81, OMV-82, OMV-83,
--         OMV-84, OMV-85, OMV-86
-- ============================================

BEGIN TRANSACTION;

-- ---------- 1) Columnas nuevas en users ----------
-- OMV-16: verificación de email
ALTER TABLE users ADD COLUMN email_verified         INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN email_verification_token TEXT;
ALTER TABLE users ADD COLUMN email_verification_sent_at DATETIME;
-- OMV-20 / OMV-83: vencimiento de membresía
ALTER TABLE users ADD COLUMN membership_expires_at DATETIME;
-- OMV-19: registro del último pago aceptado
ALTER TABLE users ADD COLUMN last_payment_id       INTEGER;
-- OMV-77: contadores agregados (los detalles van en audit_log + login_attempts)
ALTER TABLE users ADD COLUMN last_login_at         DATETIME;
ALTER TABLE users ADD COLUMN failed_login_count    INTEGER DEFAULT 0;

-- ---------- 2) login_attempts (OMV-76, OMV-77, OMV-86) ----------
CREATE TABLE IF NOT EXISTS login_attempts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    email        TEXT NOT NULL,
    ip_address   TEXT,
    success      INTEGER NOT NULL DEFAULT 0,
    reason       TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email
    ON login_attempts(email, created_at DESC);

-- ---------- 3) revoked_tokens (OMV-75, OMV-80) ----------
CREATE TABLE IF NOT EXISTS revoked_tokens (
    jti          TEXT PRIMARY KEY,         -- JWT ID claim
    user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
    revoked_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at   DATETIME,                  -- garbage-collect después de exp
    reason       TEXT
);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_user
    ON revoked_tokens(user_id, revoked_at DESC);

-- ---------- 4) password_reset_tokens (OMV-78) ----------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token        TEXT PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at   DATETIME NOT NULL,
    used_at      DATETIME
);
CREATE INDEX IF NOT EXISTS idx_password_reset_user
    ON password_reset_tokens(user_id);

-- ---------- 5) email_outbox (OMV-21, OMV-78) ----------
-- Cola in-DB. Un worker / cron real enviaría; por ahora queda persistido
-- para que el admin pueda inspeccionar qué se "habría enviado".
CREATE TABLE IF NOT EXISTS email_outbox (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    to_email     TEXT NOT NULL,
    subject      TEXT NOT NULL,
    body         TEXT NOT NULL,
    template     TEXT,
    status       TEXT NOT NULL DEFAULT 'queued',   -- queued | sent | failed
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at      DATETIME,
    error        TEXT
);
CREATE INDEX IF NOT EXISTS idx_email_outbox_status
    ON email_outbox(status, created_at DESC);

-- ---------- 6) payments (OMV-19) ----------
CREATE TABLE IF NOT EXISTS payments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount          REAL,
    currency        TEXT DEFAULT 'ARS',
    payment_method  TEXT,                 -- transferencia | efectivo | mp | tarjeta
    transaction_ref TEXT,
    period_days     INTEGER,              -- duración de la membresía aplicada
    notes           TEXT,
    created_by      INTEGER REFERENCES users(id),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payments_user
    ON payments(user_id, created_at DESC);

COMMIT;
