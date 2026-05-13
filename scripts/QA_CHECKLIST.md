# QA Checklist — OMV3 frontend slices 1-8

Lista corta de cosas visuales que el script E2E (`scripts/test-e2e.mjs`) no captura. Hacela una sola vez por release o cuando cambies algo gordo del UI.

**Cómo correr:**
- En local: `cd frontend && npm run dev` → http://localhost:5173 (proxy a PA)
- En PA: directo desde https://omegamedicina.pythonanywhere.com

**Tamaños sugeridos a probar:** mobile (DevTools 375x812 iPhone) y desktop (1280+).

---

## 1 · Login (Slice 1)

- [ ] Card centrado con "Omega Medicina" logo + serif italic "Bienvenido"
- [ ] **"¿No tenés cuenta? Crear cuenta"** visible debajo del botón Ingresar
- [ ] Login con creds malas → muestra "Credenciales inválidas" en rojo
- [ ] Click "Crear cuenta" → abre pantalla Register paso 1

## 2 · Register (Slice 1)

- [ ] Progress bar arriba "Paso N / 3" cambia de color al avanzar
- [ ] Paso 1: validación inline `La contraseña debe tener al menos 8 caracteres`
- [ ] Paso 2: botones Masculino/Femenino se marcan con border + tint medic al click
- [ ] Paso 3: 4 role cards con ícono coloreado por rol. Click activa border + check
- [ ] Validación `Seleccioná al menos un rol` cuando se hace submit vacío
- [ ] Botón "← Iniciar sesión" en fineprint vuelve a Login

## 3 · AdminPending (Slice 1) — login como admin

- [ ] Sidebar admin muestra entry "Pendientes"
- [ ] Click "Pendientes" → lista con N usuarios + filtros Todos/Email OK/Sin verificar
- [ ] Click ✓ (verde) → AdminApproveSheet abre **centrado en desktop** (no bottom-sheet)
- [ ] El sheet permite editar duración + checkbox "Registrar pago" + form
- [ ] Click ✕ (rojo) → AdminRejectSheet con motivo requerido
- [ ] AdminHome stat "Pendientes" muestra el conteo real

## 4 · PatientHome — paciente con vínculos (Slices 2, 4, 7)

- [ ] **Health Index card** muestra score real (no "—") si hay check-in
- [ ] Delta vs ayer con flecha ▲/▼ y color verde/rojo
- [ ] 4 stats con barras de progreso (Sueño, Cuerpo, Activ., Ánimo)
- [ ] Si hay **objetivo propuesto** → card destacada con gradient analytic
  - [ ] Click abre AcceptGoalSheet con targets + delta + notas
  - [ ] Botón "Aceptar objetivo" verde + "Rechazar" → form motivo
- [ ] Sección "Solicitudes recibidas" con avatares + botones ✓/✕
- [ ] Sección "Mis profesionales" con avatares coloreados por rol
- [ ] Sección "Solicitudes enviadas" con botón cancelar (✕)
- [ ] CTA "Buscar profesional" si no hay ningún vínculo

## 5 · BrowseSpecialists (Slice 2)

- [ ] Tap "Buscar profesional" → lista de especialistas con filtros por rol
- [ ] Buscar por nombre filtra en vivo
- [ ] Click "Solicitar como X" → estado "Solicitud enviada" verde

## 6 · CheckIn (Slice 7)

- [ ] Mood: 5 emojis, click activa con tint medic
- [ ] Sueño: slider 0-12h con valor en color medic
- [ ] Energía: 5 segmentos rellenan progresivo
- [ ] Dolor: chips segmentados
- [ ] Submit → toast/cierre + Health Index actualizado al volver al Home

## 7 · Nutrition + Daily-log (Slice 5)

- [ ] Tira de días Lun-Dom con día actual en nutri-yellow
- [ ] Card de totales muestra `X / Y kcal` real (no `0 / Y`)
- [ ] Barras de macros progresan según consumo
- [ ] Click "Añadir alimento" en una comida → AddFoodSheet
  - [ ] Buscar > 2 chars → resultados de `/foods?q=`
  - [ ] Pick food → form gramos con preview de macros
  - [ ] Agregar → aparece en lista de "En esta comida"
  - [ ] Guardar comida → totales del home se actualizan

## 8 · TrainingPlan (Slice 6) — paciente

- [ ] Hero "Hoy" con plan + día N / total
- [ ] Lista de ejercicios numerados con avatar omega + descriptor (sets×reps, kg)
- [ ] Badge "test" amarillo en ejercicios de PR
- [ ] Botón "Registrar sesión completada" rojo → 200, muestra confirmación verde

## 9 · DoctorHome (Slice 8) — login como profesional

- [ ] Stat "Vinculados" con count real, "Pendientes" con count real
- [ ] Stat "Consultas hoy — próximamente" (placeholder)
- [ ] Lista "Solicitudes recibidas" con avatares omega si las hay
- [ ] Lista "Mis pacientes" con avatares medic + emails
- [ ] Card "Agenda de hoy" / "Alertas" con opacity 0.7 + texto "próximamente"

## 10 · DoctorPatientDetail (Slices 3, 6)

- [ ] Tabs: Resumen, Historial, Planes activos. **Labs y Archivos con badge "pronto" + disabled**
- [ ] Botón video disabled (opacity 0.4, no clickeable)
- [ ] Tab "Resumen": medidas constitucionales + última medición + objetivo + roadmap si hay
- [ ] Tab "Planes" → sub-tab toggle **Nutrición ⇄ Entreno**
  - [ ] Nutrición: macros + distribución por comida + auto-calc sheet
  - [ ] Entreno: card de test fuerza + plan activo + botón "Re-optimizar"
  - [ ] "Nuevo test" abre StrengthTestSheet con 4 lifts
- [ ] Sheets (`EditConstitutionalSheet`, `NewMeasurementSheet`, `ProposeGoalSheet`) → **centrados en desktop**, bottom-sheet en mobile

## 11 · Cross-cutting

- [ ] Logout desde topbar / user menu sheet funciona
- [ ] Mobile: bottom tab bar muestra los 4-5 íconos por rol
- [ ] Switch de rol en topbar (si user tiene múltiples) cambia el sidebar
- [ ] No hay errores en la consola del browser después de navegar por todo

---

## Cleanup post-test

Si registraste usuarios de prueba en PA con emails `qa-...@omv3test.com`, correr el SQL de [scripts/cleanup-test-users.sql](cleanup-test-users.sql) desde la consola de PA como admin.
