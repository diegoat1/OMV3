# Analisis Frontend vs Backend - OMV3

> Generado: 2026-04-20  
> Backend: 158 endpoints en 11 blueprints  
> Frontend: 49 pantallas, 9 servicios API, 13 componentes, 6 hooks, 2 contexts

---

## Resumen Ejecutivo

| Modulo | Endpoints Backend | Cobertura Frontend | Estado |
|--------|:-:|:-:|:-:|
| Auth | 6 | 5/6 (83%) | Casi completo |
| Users | 13 | 9/13 (69%) | Parcial |
| Nutrition | 22 | 20/22 (91%) | Casi completo |
| Training v1 | 15 | 12/15 (80%) | Bueno |
| Training v2 | 22 | 0/22 (0%) | Sin implementar |
| Telemedicine | 36 | 24/36 (67%) | Parcial |
| Analytics | 10 | 9/10 (90%) | Casi completo |
| Admin | 15 | 9/15 (60%) | Parcial |
| Assignments | 9 | 9/9 (100%) | Completo |
| Engagement | 12 | 8/12 (67%) | Parcial |
| Checkin | 8 | 8/8 (100%) | Completo |
| **TOTAL** | **168** | **113/168 (67%)** | **Parcial** |

---

## 1. AUTH (`/api/v3/auth/`)

### Lo que tiene el frontend

| Endpoint | Servicio | Pantalla | Estado |
|----------|----------|----------|--------|
| `POST /login` | `apiClient` (login en AuthContext) | `login.tsx`, `(public)/login.tsx`, `(auth)/login.tsx` | OK |
| `POST /logout` | `apiClient` (logout en AuthContext) | Via menu/perfil | OK |
| `GET /validate` | Implicitamente en AuthContext | - | OK |
| `POST /refresh` | `config.ts` → `/auth/refresh` | AuthContext auto-refresh | OK |
| `GET /me` | `config.ts` → `/auth/me` | AuthContext init | OK |

### Lo que falta

| Endpoint | Prioridad | Que se necesita |
|----------|:-:|------------|
| `POST /register` | **ALTA** | Pantalla `(public)/register.tsx` existe pero **no hay `registerService`** en los servicios API. Verificar que el servicio conecte correctamente al endpoint. |

### Pantallas existentes sin uso claro

- `role-selector.tsx` (root) — Selector de rol post-login. Funcional via RoleContext.
- 3 pantallas de login duplicadas (root, public, auth) — Considerar consolidar.

---

## 2. USERS (`/api/v3/users/`)

### Lo que tiene el frontend

| Endpoint | Servicio | Pantalla |
|----------|----------|----------|
| `GET /profile` | `userService.getUser()` | `(patient)/profile.tsx`, `(doctor)/profile.tsx` |
| `POST /measurements` | `userService.addMeasurement()` | `(doctor)/patient-measures.tsx` |
| `GET /measurements` | `userService.getMeasurements()` | `(doctor)/patient-measures.tsx` |
| `DELETE /measurements/<id>` | `userService.deleteMeasurement()` | `(doctor)/patient-measures.tsx` |
| `GET /goals` | `userService.getGoals()` | `(patient)/goals.tsx`, `(doctor)/patient-goals.tsx` |
| `POST /goals` | `userService.saveGoal()` | `(patient)/goals.tsx`, `(doctor)/patient-goals.tsx` |
| `GET /body-composition` | `analyticsService.getBodyComposition()` | Dashboard, analytics |

### Lo que falta

| Endpoint | Prioridad | Que se necesita |
|----------|:-:|------------|
| `GET /measurements/<id>` | BAJA | Detalle individual de medicion. No critico si el listado ya muestra datos. |
| `PUT /measurements/<id>` | **MEDIA** | Edicion de mediciones existentes. Agregar boton "editar" en lista de mediciones. |
| `GET /goals/<id>` | BAJA | Detalle individual de objetivo. |
| `PUT /goals/<id>` | **MEDIA** | Edicion de objetivos existentes. El frontend solo crea, no edita. |
| `DELETE /goals/<id>` | **MEDIA** | Eliminar objetivos. Agregar accion en la lista de goals. |
| `GET /progress` | **ALTA** | Tendencias de composicion corporal. Pantalla dedicada o seccion en dashboard del paciente. No existe pantalla de progreso temporal. |

---

## 3. NUTRITION (`/api/v3/nutrition/`)

### Lo que tiene el frontend

| Endpoint | Servicio | Pantalla |
|----------|----------|----------|
| `GET /plans` | `nutritionService.getPlans()` | `(patient)/nutrition/index.tsx` |
| `GET /plans/<id>` | `nutritionService.getPlan()` | Plan detail |
| `POST /plans` | `nutritionService.createPlan()` | Doctor: patient-nutrition |
| `PUT /plans/<id>` | `nutritionService.updatePlan()` | Doctor: patient-nutrition |
| `DELETE /plans/<id>` | `nutritionService.deletePlan()` | Doctor: patient-nutrition |
| `POST /plans/<id>/adjust-calories` | `nutritionService.adjustCalories()` | Ajuste calorico |
| `GET /foods` | `nutritionService.getFoods()` | `food-search.tsx` |
| `GET /foods/<id>` | `nutritionService.getFood()` | Detalle alimento |
| `GET /foods/<id>/portions` | `nutritionService.getFoodPortions()` | Porciones |
| `GET /food-groups` | `nutritionService.getFoodGroups()` | Catalogo |
| `GET /recipes` | `nutritionService.getRecipes()` | `my-recipes.tsx` |
| `GET /recipes/<id>` | `nutritionService.getRecipe()` | Detalle receta |
| `POST /recipes/<id>/calculate` | `nutritionService.calculateRecipe()` | Solver |
| `POST /recipes` | `nutritionService.createRecipe()` | Crear receta |
| `PUT /recipes/<id>` | `nutritionService.updateRecipe()` | Editar receta |
| `DELETE /recipes/<id>` | `nutritionService.deleteRecipe()` | Eliminar receta |
| `POST /solve-meal` | `nutritionService.solveMeal()` | useMealEditor hook |
| `GET /meal-plans` | `nutritionService.getMealPlans()` | Plan de comidas |
| `POST /meal-plans` | `nutritionService.createMealPlan()` | Crear plan |
| `POST /meal-plans/save-config` | `nutritionService.saveMealConfig()` | Configuracion |

### Lo que falta

| Endpoint | Prioridad | Que se necesita |
|----------|:-:|------------|
| `GET /meal-plans/blocks` | **MEDIA** | Distribucion de macros por comida. El servicio `getMealBlocks()` existe pero verificar pantalla que lo muestre. |
| `GET /meal-plans/<id>/calculate` | **MEDIA** | Auto-calculo del plan completo. El servicio `calculateMealPlan()` existe pero verificar integracion UI. |

### Funcionalidad extra en frontend (sin endpoint directo)

El `nutritionService` tiene funciones adicionales que mapean a endpoints compuestos o locales:
- `getShoppingList` — Lista de compras (puede no tener endpoint backend dedicado)
- `getDailyLog` / `saveDailyLog` — Registro diario de alimentacion
- `getLibrary` / `toggleLibraryFavorite` — Biblioteca de alimentos favoritos
- `getBlockSuggestions` / `saveBlockConstructor` — Constructor de bloques

> **Nota:** El modulo de nutricion es el mas completo del frontend. El hook `useMealEditor` es sofisticado y maneja estado complejo de planificacion.

---

## 4. TRAINING (`/api/v3/training/`)

### Lo que tiene el frontend (v1)

| Endpoint | Servicio | Pantalla |
|----------|----------|----------|
| `GET /exercises` | `trainingService.getExercises()` | Catalogo ejercicios |
| `POST /strength-test` | `trainingService.createStrengthRecord()` | Test de fuerza |
| `GET /strength-test` | `trainingService.getStrengthData()` | Historial fuerza |
| `GET /strength-standards` | `trainingService.getStrengthStandards()` | Estandares |
| `GET /1rm-estimate` | Implicitamente via standards | Estimacion |
| `POST /lifts` | `trainingService.saveLift()` | Registro |
| `GET /lifts` | `trainingService.getLifts()` | Historial |
| `POST /training-plan` | Parcial via `optimizePlan` | Plan |
| `GET /training-plan` | `trainingService.getPlans()` | Plan activo |
| `POST /session` | `trainingService.registerSession()` | Sesion |
| `GET /sessions` | `trainingService.getSessionHistory()` | Historial |

### Lo que falta (v1)

| Endpoint | Prioridad | Que se necesita |
|----------|:-:|------------|
| `GET /exercises/<id>` | BAJA | Detalle individual de ejercicio |
| `PUT /training-plan` | **MEDIA** | Editar plan existente |
| `POST /body-metrics` | **MEDIA** | Registro de metricas corporales durante entrenamiento |
| `GET /body-metrics` | **MEDIA** | Historial de metricas corporales |

### Lo que falta (v2) — COMPLETAMENTE SIN IMPLEMENTAR

| Endpoint | Prioridad | Que se necesita |
|----------|:-:|------------|
| `POST /v2/exercises` | **ALTA** | Crear ejercicios custom |
| `GET /v2/exercises` | **ALTA** | Listar ejercicios con progresiones |
| `GET /v2/exercises/<id>` | MEDIA | Detalle con datos de progresion |
| `PUT /v2/exercises/<id>` | MEDIA | Editar ejercicio |
| `DELETE /v2/exercises/<id>` | MEDIA | Eliminar ejercicio custom |
| `GET /v2/exercise-progressions` | **ALTA** | Templates de progresion |
| `POST /v2/distribution-templates` | **ALTA** | Crear template de distribucion |
| `GET /v2/distribution-templates` | **ALTA** | Listar templates |
| `GET /v2/distribution-templates/<id>` | MEDIA | Detalle template |
| `PUT /v2/distribution-templates/<id>` | MEDIA | Editar template |
| `DELETE /v2/distribution-templates/<id>` | BAJA | Eliminar template |
| `POST /v2/plans` | **ALTA** | Crear plan con distribuciones custom |
| `GET /v2/plans` | **ALTA** | Listar planes v2 |
| `GET /v2/plans/<id>` | **ALTA** | Detalle plan v2 |
| `PUT /v2/plans/<id>` | MEDIA | Editar plan v2 |
| `DELETE /v2/plans/<id>` | MEDIA | Eliminar plan v2 |
| `POST /v2/sessions` | **ALTA** | Registrar sesion con sets/reps por ejercicio |
| `GET /v2/sessions` | **ALTA** | Historial sesiones v2 |
| `GET /v2/sessions/<id>` | MEDIA | Detalle sesion v2 |
| `POST /v2/exercise-progress` | **ALTA** | Trackear progreso de ejercicios |
| `GET /v2/exercise-progress` | **ALTA** | Ver progresion |
| `GET /v2/stats` | **ALTA** | Estadisticas con rachas |

> **Accion requerida:** Training v2 es un modulo completo del backend que no tiene NINGUNA representacion en el frontend. Necesita:
> - `trainingV2Service.ts` — Nuevo servicio API
> - Pantallas: lista de planes, detalle plan, crear/editar plan, sesion activa, historial, progresion de ejercicios, estadisticas
> - Modelos TypeScript para todos los tipos v2

---

## 5. TELEMEDICINE (`/api/v3/telemedicine/`)

### Lo que tiene el frontend

| Endpoint | Servicio | Pantalla |
|----------|----------|----------|
| `POST /appointments` | `telemedicineService.createAppointment()` | `(doctor)/appointments.tsx` |
| `GET /appointments` | `telemedicineService.getAppointments()` | `(doctor)/appointments.tsx` |
| `GET /appointments/<id>` | `telemedicineService.getAppointment()` | Detalle |
| `PUT /appointments/<id>` | `telemedicineService.updateAppointmentStatus()` | Cambiar estado |
| `POST /medical-records` | `telemedicineService.createRecord()` | `(doctor)/records.tsx` |
| `GET /medical-records` | `telemedicineService.getRecords()` | `(doctor)/records.tsx` |
| `POST /clinical-situations` | `telemedicineService.createSituation()` | `(patient)/situation.tsx` |
| `GET /clinical-situations` | `telemedicineService.getSituations()` | `(patient)/situation.tsx` |
| `PUT /clinical-situations/<id>` | `telemedicineService.updateSituation()` | Editar situacion |
| `DELETE /clinical-situations/<id>` | `telemedicineService.deleteSituation()` | Eliminar |
| `POST /performance-tests/*` | `telemedicineService.createPerformanceTest()` | Tests |
| `GET /performance-tests` | `telemedicineService.getPerformanceTests()` | Listado |
| `POST /documents` | `telemedicineService.createDocument()` | Documentos |
| `GET /documents` | `telemedicineService.getDocuments()` | Listado |
| `PUT /documents/<id>` | `telemedicineService.updateDocument()` | Editar |
| `DELETE /documents/<id>` | `telemedicineService.deleteDocument()` | Eliminar |
| `POST /prevention-programs` | `telemedicineService.createPreventionProgram()` | Programas |
| `GET /prevention-programs` | `telemedicineService.getPreventionPrograms()` | Listado |
| `POST /templates` | `telemedicineService.createTemplate()` | `(doctor)/templates.tsx` |
| `GET /templates` | `telemedicineService.getTemplates()` | `(doctor)/templates.tsx` |
| `PUT /templates/<id>` | `telemedicineService.updateTemplate()` | Editar |
| `DELETE /templates/<id>` | `telemedicineService.deleteTemplate()` | Eliminar |
| Body measurements | `telemedicineService.createBodyMeasurement()` | Mediciones |
| Vital signs | `telemedicineService.createVitalSign()` | Signos vitales |

### Lo que falta

| Endpoint | Prioridad | Que se necesita |
|----------|:-:|------------|
| `DELETE /appointments/<id>` | **MEDIA** | Cancelar cita. Agregar boton cancelar en detalle de cita. |
| `POST /appointments/<id>/join` | **ALTA** | Unirse a videollamada. Necesita integracion con servicio de video (WebRTC/Zoom/etc). Pantalla de videoconsulta. |
| `GET /medical-records/<id>` | BAJA | Detalle individual de registro medico |
| `PUT /medical-records/<id>` | **MEDIA** | Editar registro medico existente |
| `POST /patient-files` | **ALTA** | Subir archivos del paciente (labs, imagenes). Necesita componente de upload. |
| `GET /patient-files` | **ALTA** | Listar archivos del paciente |
| `GET /patient-files/<id>` | MEDIA | Ver/descargar archivo |
| `DELETE /patient-files/<id>` | MEDIA | Eliminar archivo |
| `GET /clinical-situations/<id>` | BAJA | Detalle individual |
| `GET /performance-tests/<id>` | BAJA | Detalle individual de test |
| `GET /prevention-programs/<id>` | BAJA | Detalle individual de programa |
| `GET /documents/<id>` | BAJA | Ver documento individual |

> **Pantallas faltantes criticas:**
> 1. **Videoconsulta** — `POST /appointments/<id>/join` no tiene UI
> 2. **Archivos del paciente** — CRUD completo sin pantalla ni componente de upload

---

## 6. ANALYTICS (`/api/v3/analytics/`)

### Lo que tiene el frontend

| Endpoint | Servicio | Pantalla |
|----------|----------|----------|
| `GET /dashboard` | `analyticsService.getDashboard()` | `(patient)/dashboard.tsx`, `(doctor)/patient-analytics.tsx` |
| `GET /body-composition-analysis` | `analyticsService.getBodyComposition()` | Composicion corporal |
| `GET /calculators/bmr` | `analyticsService.calculateBMR()` | Calculadoras |
| `GET /calculators/tdee` | `analyticsService.calculateTDEE()` | Calculadoras |
| `GET /calculators/body-fat-pct` | `analyticsService.calculateBodyFat()` | Calculadoras |
| `GET /calculators/ffmi` | `analyticsService.calculateFFMI()` | Calculadoras |
| `GET /calculators/weight-loss-gain` | `analyticsService.calculateWeightLoss()` | Proyecciones |
| `GET /trends/measurements` | Via dashboard | Tendencias |
| `GET /trends/strength` | Via dashboard | Tendencias fuerza |

### Lo que falta

| Endpoint | Prioridad | Que se necesita |
|----------|:-:|------------|
| `GET /performance-clock` | **ALTA** | Visualizacion de radar/clock de rendimiento. Necesita componente de grafico radar (chart library). Pantalla o seccion dedicada. |

> **Nota:** Las calculadoras existen en el servicio pero no hay evidencia de una pantalla dedicada "Calculadoras" para el paciente. Podria ser una pantalla util.

---

## 7. ADMIN (`/api/v3/admin/`)

### Lo que tiene el frontend

| Endpoint | Servicio | Pantalla |
|----------|----------|----------|
| `GET /pending-users` | `adminService.getPendingUsers()` | `(admin)/users.tsx` |
| `POST /approve-user/<id>` | `adminService.approveUser()` | `(admin)/users.tsx` |
| `POST /reject-user/<id>` | `adminService.rejectUser()` | `(admin)/users.tsx` |
| `GET /users` | `adminService.getAuthUsers()` | `(admin)/users.tsx` |
| `POST /users/<id>/role` | `adminService.updateRole()` | `(admin)/users.tsx` |
| `POST /users/<id>/status` | `adminService.toggleActive()` | `(admin)/users.tsx` |
| `DELETE /users/<id>` | `adminService.deleteUser()` | `(admin)/users.tsx` |
| `GET /audit-log` | `adminService.getAuditLog()` | `(admin)/audit.tsx` |
| `GET /stats` | `adminService.getDashboardStats()` | `(admin)/dashboard.tsx` |

### Lo que falta

| Endpoint | Prioridad | Que se necesita |
|----------|:-:|------------|
| `GET /db/tables` | BAJA | Inspeccion de BD. Herramienta avanzada de admin. |
| `GET /db/tables/<name>` | BAJA | Estructura de tabla |
| `GET /db/inspect/<table>` | BAJA | Inspeccion de datos |
| `POST /db/export/<table>` | **MEDIA** | Exportar datos a CSV/JSON. Util para reportes. |
| `POST /db/backup` | **MEDIA** | Crear backup desde la app. Boton en dashboard admin. |
| `POST /cleanup` | BAJA | Limpieza de datos temporales. Operacion de mantenimiento. |

> **Pantalla existente sin endpoint:** `(admin)/permissions.tsx` y `(admin)/import-legacy.tsx` — Verificar si tienen endpoints correspondientes o son funcionalidad local.

---

## 8. ASSIGNMENTS (`/api/v3/assignments/`)

### Estado: COMPLETO

Todos los endpoints estan cubiertos por `assignmentService.ts`. El flujo completo especialista-paciente esta implementado.

---

## 9. ENGAGEMENT (`/api/v3/engagement/`)

### Lo que tiene el frontend

| Endpoint | Servicio | Pantalla |
|----------|----------|----------|
| `POST /reminders` | `engagementService.createReminder()` | `(patient)/reminders.tsx` |
| `GET /reminders` | `engagementService.getReminders()` | `(patient)/reminders.tsx` |
| `DELETE /reminders/<id>` | `engagementService.deleteReminder()` | Eliminar |
| `POST /tasks` | `engagementService.createTask()` | Tareas |
| `GET /tasks` | `engagementService.getTasks()` | Tareas |
| `PUT /tasks/<id>` | `engagementService.updateTask()` | Actualizar |
| `DELETE /tasks/<id>` | `engagementService.deleteTask()` | Eliminar |
| `GET /insights` | `engagementService.getInsights()` | Insights |

### Lo que falta

| Endpoint | Prioridad | Que se necesita |
|----------|:-:|------------|
| `PUT /reminders/<id>` | **MEDIA** | Editar recordatorio existente. Solo se puede crear y eliminar, no editar. |
| `GET /engagement-score` | **ALTA** | Score de engagement del usuario. Componente para mostrar en dashboard. |
| `POST /performance-summary` | **MEDIA** | Generar resumen de rendimiento |
| `GET /performance-summary` | **MEDIA** | Ver resumen generado. El servicio tiene `getPerformance()` pero verificar si consume estos endpoints. |

---

## 10. CHECKIN (`/api/v3/checkin/`)

### Estado: COMPLETO

Todos los endpoints cubiertos por `checkinService.ts`:
- Daily check-in (get/submit)
- History
- Stats semanales
- Sintomas (submit/get)
- Health Index + trend

Integrado con el hook `useHealthScore.ts`.

---

## 11. Componentes UI — Analisis de Cobertura

### Componentes existentes (13)

| Componente | Uso |
|------------|-----|
| `Button.tsx` | General |
| `Input.tsx` | General |
| `Card.tsx` | General |
| `HealthScoreCard.tsx` | Dashboard paciente |
| `ScoreCard.tsx` | Scores genericos |
| `TaskItem.tsx` | Lista de tareas |
| `ReminderCard.tsx` | Recordatorios |
| `MiniChart.tsx` | Mini graficos |
| `BuildBanner.tsx` | Info de build |
| `ReadOnlyBanner.tsx` | Modo solo lectura |
| `RoleHeader.tsx` | Cabecera de rol |

### Componentes faltantes recomendados

| Componente | Prioridad | Justificacion |
|------------|:-:|------------|
| `RadarChart.tsx` | **ALTA** | Para `GET /performance-clock`. Grafico de radar de rendimiento. |
| `FileUpload.tsx` | **ALTA** | Para `POST /patient-files`. Selector de archivos con preview. |
| `MeasurementForm.tsx` | MEDIA | Form reutilizable para mediciones corporales |
| `GoalCard.tsx` | MEDIA | Card para mostrar objetivos con progreso |
| `ProgressChart.tsx` | **ALTA** | Grafico de progreso temporal (peso, medidas, fuerza) |
| `ExerciseCard.tsx` | **ALTA** | Card para ejercicios (necesario para Training v2) |
| `SessionTimer.tsx` | **ALTA** | Timer para sesiones de entrenamiento activas |
| `SetLogger.tsx` | **ALTA** | Componente para registrar sets/reps en sesion (Training v2) |
| `VideoCall.tsx` | **ALTA** | Componente de videollamada para telemedicina |
| `DateRangePicker.tsx` | MEDIA | Selector de rango para historiales y reportes |
| `EmptyState.tsx` | MEDIA | Estado vacio generico para listas sin datos |
| `LoadingSkeleton.tsx` | BAJA | Placeholder de carga para mejor UX |
| `EngagementScore.tsx` | MEDIA | Visualizacion del score de engagement |
| `NutritionSummary.tsx` | MEDIA | Resumen visual de macros diarios |

---

## 12. Hooks Faltantes

| Hook | Prioridad | Justificacion |
|------|:-:|------------|
| `useTrainingV2.ts` | **ALTA** | Estado y operaciones para el modulo de training v2 |
| `useProgress.ts` | **ALTA** | Datos de progreso corporal (`GET /users/progress`) |
| `useEngagementScore.ts` | MEDIA | Score de engagement con polling |
| `useVideoCall.ts` | **ALTA** | Estado de videollamada para telemedicina |
| `useFileUpload.ts` | **ALTA** | Logica de upload de archivos del paciente |
| `useCalculators.ts` | MEDIA | Wrapper para las calculadoras de analytics |

---

## 13. Pantallas Faltantes (por prioridad)

### Prioridad ALTA

| Pantalla | Ruta sugerida | Modulo |
|----------|---------------|--------|
| Training v2 - Lista de planes | `(patient)/training/plans.tsx` | Training |
| Training v2 - Detalle plan | `(patient)/training/plan-detail.tsx` | Training |
| Training v2 - Sesion activa | `(patient)/training/active-session.tsx` | Training |
| Training v2 - Progresion | `(patient)/training/progression.tsx` | Training |
| Training v2 - Estadisticas | `(patient)/training/stats.tsx` | Training |
| Videoconsulta | `(patient)/telemedicine/video.tsx` | Telemedicine |
| Archivos del paciente | `(doctor)/patient-files.tsx` | Telemedicine |
| Progreso corporal | `(patient)/progress.tsx` | Users |
| Performance Clock | `(patient)/performance.tsx` | Analytics |

### Prioridad MEDIA

| Pantalla | Ruta sugerida | Modulo |
|----------|---------------|--------|
| Calculadoras (standalone) | `(patient)/calculators.tsx` | Analytics |
| Engagement Score | Seccion en `(patient)/dashboard.tsx` | Engagement |
| Editar mediciones | Modal en `patient-measures.tsx` | Users |
| Editar objetivos | Modal en `goals.tsx` | Users |
| Backup DB (admin) | Seccion en `(admin)/dashboard.tsx` | Admin |
| Export datos (admin) | `(admin)/export.tsx` | Admin |

---

## 14. Servicios API Faltantes

| Servicio | Archivo sugerido | Endpoints que cubre |
|----------|-----------------|---------------------|
| `trainingV2Service.ts` | `src/services/api/trainingV2Service.ts` | 22 endpoints de `/training/v2/*` |
| `patientFilesService.ts` | `src/services/api/patientFilesService.ts` | 4 endpoints de `/telemedicine/patient-files/*` |

---

## 15. Modelos TypeScript Faltantes

```typescript
// Training v2
interface ExerciseV2 { id, name, muscle_group, progression_type, custom, user_id }
interface ExerciseProgression { id, exercise_id, date, weight, reps, estimated_1rm }
interface DistributionTemplate { id, name, days_per_week, distribution }
interface TrainingPlanV2 { id, name, template_id, exercises_per_day, active }
interface TrainingSessionV2 { id, plan_id, date, exercises: SessionExercise[] }
interface SessionExercise { exercise_id, sets: { weight, reps, rpe }[] }
interface TrainingStats { total_sessions, current_streak, best_streak, volume_trend }

// Patient Files
interface PatientFile { id, patient_id, filename, type, size, uploaded_at, url }

// Performance Clock
interface PerformanceClock { categories: { name, score, max }[] }

// Engagement Score
interface EngagementScore { score, breakdown: { category, value, weight }[] }
```

---

## 16. Contextos Faltantes

| Contexto | Justificacion |
|----------|------------|
| `TrainingContext` | Estado global del modulo de entrenamiento (plan activo, sesion en curso). Similar a como AuthContext maneja auth. |
| `NotificationContext` | Para push notifications de citas, recordatorios, y tareas. Necesario para engagement. |

---

## 17. Plan de Implementacion Sugerido

### Fase 1 — Critico (Training v2 + Archivos)
1. Crear `trainingV2Service.ts` con todos los endpoints
2. Crear modelos TypeScript para Training v2
3. Implementar pantallas de Training v2 (5 pantallas)
4. Crear `patientFilesService.ts`
5. Implementar pantalla de archivos del paciente

### Fase 2 — Importante (Completar modulos existentes)
1. Pantalla de progreso corporal (`GET /users/progress`)
2. Performance Clock con grafico radar
3. Edicion de mediciones y objetivos (PUT/DELETE)
4. Engagement score en dashboard
5. Edicion de recordatorios

### Fase 3 — Mejoras (UX y funcionalidad avanzada)
1. Videoconsulta (requiere servicio externo)
2. Calculadoras como pantalla standalone
3. Admin: backup y export
4. Componentes UI adicionales (EmptyState, Skeletons, DateRangePicker)
5. Consolidar pantallas de login duplicadas

---

## 18. Resumen de Gaps Criticos

| # | Gap | Impacto |
|:-:|-----|---------|
| 1 | **Training v2 completamente ausente** (22 endpoints) | Modulo completo del backend sin uso. Progresion de ejercicios, distribuciones custom, y estadisticas no disponibles para usuarios. |
| 2 | **Archivos del paciente sin UI** (4 endpoints) | Doctores no pueden subir/ver labs, imagenes, o documentos de pacientes. |
| 3 | **Videoconsulta sin implementar** (1 endpoint) | Feature core de telemedicina sin pantalla. |
| 4 | **Progreso corporal sin pantalla** (1 endpoint) | Pacientes no pueden ver tendencias de su composicion corporal en el tiempo. |
| 5 | **Performance Clock sin visualizacion** (1 endpoint) | Radar de rendimiento no disponible. |
| 6 | **Engagement Score no mostrado** (2 endpoints) | Metrica de engagement calculada pero no visible. |
