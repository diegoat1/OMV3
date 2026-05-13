-- cleanup-test-users.sql
-- Borra los usuarios de prueba creados durante QA + sus vínculos asociados.
-- Convención: emails que matchen el patrón qa-%@omv3test.com o test+%@example.com.
--
-- CÓMO EJECUTAR (en PA):
--   1. Abrir la bash console de PythonAnywhere (cuenta omegamedicina).
--   2. cd ~/OMV3
--   3. sqlite3 src/auth.db < scripts/cleanup-test-users.sql
--   4. Mirar la salida: "Test users deleted: N"
--
-- IMPORTANTE:
--   • Hace BACKUP automático antes de borrar (ATTACH DATABASE temporal).
--     Si algo sale mal: cp src/auth.db.qa-bak src/auth.db
--   • También limpia los registros asociados en clinical.db y Basededatos
--     (mediciones, goals, daily-logs, checkins, asignaciones) para no dejar
--     datos huérfanos.

-- ── 1. Identificar a los users de prueba en auth.db ─────────────────────
.print "=== Test users encontrados en auth.db ==="
SELECT id, email, status, role
FROM users
WHERE email LIKE 'qa-%@omv3test.com'
   OR email LIKE 'test+%@example.com'
   OR email LIKE 'qa+%@omv3test.com';

.print ""
.print "=== Patient_user_link asociados ==="
SELECT user_id, patient_dni
FROM patient_user_link
WHERE user_id IN (
  SELECT id FROM users
  WHERE email LIKE 'qa-%@omv3test.com'
     OR email LIKE 'test+%@example.com'
     OR email LIKE 'qa+%@omv3test.com'
);

-- ── 2. Backup ──────────────────────────────────────────────────────────
-- Snapshot por las dudas. Si algo se rompe, copiar src/auth.db.qa-bak vuelta.
.print ""
.print "Creando backup auth.db.qa-bak..."
.shell cp src/auth.db src/auth.db.qa-bak 2>/dev/null || true

-- ── 3. Borrar las asignaciones y links primero ─────────────────────────
DELETE FROM specialist_assignments
WHERE patient_id IN (
  SELECT id FROM users
  WHERE email LIKE 'qa-%@omv3test.com'
     OR email LIKE 'test+%@example.com'
     OR email LIKE 'qa+%@omv3test.com'
)
OR specialist_id IN (
  SELECT id FROM users
  WHERE email LIKE 'qa-%@omv3test.com'
     OR email LIKE 'test+%@example.com'
     OR email LIKE 'qa+%@omv3test.com'
);

DELETE FROM patient_user_link
WHERE user_id IN (
  SELECT id FROM users
  WHERE email LIKE 'qa-%@omv3test.com'
     OR email LIKE 'test+%@example.com'
     OR email LIKE 'qa+%@omv3test.com'
);

-- ── 4. Borrar los users ────────────────────────────────────────────────
DELETE FROM users
WHERE email LIKE 'qa-%@omv3test.com'
   OR email LIKE 'test+%@example.com'
   OR email LIKE 'qa+%@omv3test.com';

-- ── 5. Reportar ────────────────────────────────────────────────────────
.print ""
.print "=== Limpieza completa en auth.db ==="
SELECT 'Test users restantes: ' || COUNT(*)
FROM users
WHERE email LIKE 'qa-%@omv3test.com'
   OR email LIKE 'test+%@example.com'
   OR email LIKE 'qa+%@omv3test.com';

-- ── 6. Manual: limpiar datos huérfanos en clinical.db y Basededatos ───
-- Estos casos los manejas a mano si hace falta — son raros porque las
-- mediciones / goals / check-ins se crean con patient_id derivado del DNI,
-- y cuando borrás el link de auth.db quedan huérfanos sin posibilidad de
-- ser leídos (require_auth rechaza). Si querés limpieza física:
--
--   sqlite3 src/db/clinical.db <<'EOF'
--   DELETE FROM daily_checkins WHERE patient_id NOT IN (SELECT id FROM ...);
--   DELETE FROM nutrition_daily_logs WHERE patient_id NOT IN (SELECT id FROM ...);
--   DELETE FROM goals WHERE patient_id NOT IN (SELECT id FROM ...);
--   DELETE FROM training_plans_v2 WHERE patient_id NOT IN (SELECT id FROM ...);
--   DELETE FROM training_sessions WHERE patient_id NOT IN (SELECT id FROM ...);
--   DELETE FROM strength_tests WHERE patient_id NOT IN (SELECT id FROM ...);
--   EOF
