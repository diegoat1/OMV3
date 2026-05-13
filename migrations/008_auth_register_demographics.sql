-- ============================================
-- Migration 008: Auth register demographics
-- DB target: src/auth.db (NOT Basededatos)
-- Apply with: sqlite3 src/auth.db ".read migrations/008_auth_register_demographics.sql"
--
-- Adds sexo and fecha_nacimiento to auth.db.users so the registration
-- endpoint can persist demographics captured by the frontend wizard
-- (frontend/src/screens/Register.tsx) before a DNI is provided.
-- ============================================

ALTER TABLE users ADD COLUMN sexo TEXT CHECK(sexo IN ('M','F') OR sexo IS NULL);
ALTER TABLE users ADD COLUMN fecha_nacimiento DATE;
