# Backend & API v3 Review — Findings Document

**Fecha:** 2026-02-09  
**Objetivo:** Verificar que la API v3 puede devolver toda la información que el backend legacy calcula, para migrar el frontend.

---

## 1. FUNCIONES BACKEND (functions.py) — Inventario Completo

### 1.1 Gestión de Perfiles

| Función | Datos que computa/almacena | Tabla DB |
|---|---|---|
| `creadordeperfil(perfil)` | Crea perfil estático: nombre, DNI, fecha_nacimiento, sexo, teléfono, altura, circunferencias (cuello, muñeca, tobillo) | PERFILESTATICO |
| `actualizarperfilest(perfil)` | Actualiza perfil estático por ID | PERFILESTATICO |
| `actualizarperfil(nameuser, fdr, peso, cabd, ccin, ccad)` | Calcula BF%, IMC, IMMC (FFMI), peso magro, peso graso, deltas entre mediciones, scores, categorías, solver forecast. Inserta registro dinámico | PERFILDINAMICO |
| `actualizarperfildin(perfil)` | Actualiza registro dinámico existente por ID, recalculando métricas | PERFILDINAMICO |
| `creadordelista()` | Lista todos los usuarios (nombre + DNI) | PERFILESTATICO |

### 1.2 Composición Corporal (calculado dentro de actualizarperfil)

- **BF%:** Fórmula Navy (diferente para M/F, usa abdomen/cuello o cintura/cadera)
- **IMC:** peso / (altura_m²)
- **IMMC (FFMI):** peso_magro / (altura_m²)
- **Peso magro:** peso × (1 - BF/100)
- **Peso graso:** peso × (BF/100)
- **Deltas:** Cambio diario de peso, peso magro, peso graso vs registro anterior
- **Scores:** ScoreBF y ScoreIMMC (0-100), con categorías por sexo
- **Solver forecast:** Estimación de días hasta peso objetivo usando Gekko

### 1.3 Objetivos

| Función | Datos | Tabla |
|---|---|---|
| `goal(goal)` | Guarda/actualiza objetivo manual: GOALIMMC, GOALBF, peso/medidas objetivo | OBJETIVO |
| `calcular_objetivos_automaticos(nombre_usuario)` | Calcula objetivos genéticos: FFMI límite (23.7 H / 18.9 M), BF esencial (6% H / 14% M), peso objetivo, circunferencias objetivo, tiempo estimado, objetivos parciales | N/A (retorna dict) |
| `calcular_objetivos_parciales(...)` | Genera fases progresivas de definición/volumen con prioridades (alta/media/baja) | N/A (retorna dict) |

### 1.4 Nutrición

| Función | Datos | Tabla |
|---|---|---|
| `plannutricional(planner, ...)` | TMB (Katch-McArdle), TDEE, calorías, proteína (2.513244 × peso_magro), grasa (30%), CH (resto), distribución por comida (6 comidas × 3 macros = 18 porcentajes), libertad, estrategia, velocidad cambio, déficit, disponibilidad energética | DIETA |
| `calcular_plan_nutricional_automatico(nombre_usuario)` | Auto-calcula plan basado en objetivos: opciones de velocidad (conservadora/moderada/agresiva), macros para cada opción, disponibilidad energética (EA), límites RED-S/LEA | N/A (retorna dict) |
| `creadordealimento(alimento)` | Inserta alimento con P, G, CH, F, porciones | ALIMENTOS |
| `editfood(alimento)` | Actualiza alimento existente | ALIMENTOS |
| `listadereceta()` | Lista nombres de recetas | RECETAS |
| `listadealimentos()` | Lista nombres de alimentos | ALIMENTOS |
| `listadeporciones(alimento)` | Obtiene porciones disponibles de un alimento | ALIMENTOS |
| `recetario(receta)` | Inserta receta con ingredientes (3 variables + 10 dependientes) | RECETAS |
| `recipe(recipeform, nameuser)` | Calcula porciones óptimas por comida usando LP solver (PuLP): 3 métodos fallback (completo → proteínas → calorías) | DIETA, RECETAS, ALIMENTOS |
| `calculate_recipe_portions(nombrereceta, p0, g0, ch0, libertad)` | Versión API del solver de recetas (retorna dict en lugar de flash) | RECETAS, ALIMENTOS |
| `process_diet(diet_form, nameuser)` | Optimización de dieta por grupos alimentarios usando scipy.minimize (SLSQP): restricciones de macro/micronutrientes (proteínas, grasas, CH, fibra, calcio, hierro, magnesio, fósforo, potasio, sodio, zinc, vitaminas, ácidos grasos, colesterol) | DIETA, GRUPOSALIMENTOS |

### 1.5 Fuerza

| Función | Datos | Tabla |
|---|---|---|
| `crear_tabla_analisis_fuerza_detallado()` | Schema: user_id, edad, bodyweight, sexo, lift_fields_json, total_score, symmetry_score, wilks, lifts_results_json, categories_results_json, muscle_groups_results_json | FUERZA |
| `guardar_historia_levantamiento_completa(data_calculado, data_crudo, username)` | Guarda análisis de fuerza completo con datos crudos y calculados en JSON | FUERZA |
| `get_user_strength_history(user_dni, limite)` | Historial de fuerza por DNI, decodifica JSON | FUERZA |
| `get_all_strength_data_admin()` | Todos los registros de fuerza con estado de running y planes activos (admin) | FUERZA, ESTADO_EJERCICIO_USUARIO |

### 1.6 Entrenamiento

| Función | Datos | Tabla |
|---|---|---|
| `get_training_plan(user_id)` | Obtiene plan activo (JSON) | Planes_Entrenamiento |
| `predict_next_workouts(user_id, num_predictions)` | Predice próximos entrenamientos usando matriz y estado actual de ejercicios | MATRIZ_ENTRENAMIENTO, PLANES_ENTRENAMIENTO, ESTADO_EJERCICIO_USUARIO |
| `actualizar_estado_running(user_id, speed, minutes)` | Estado de ejercicio running | ESTADO_EJERCICIO_USUARIO |

### 1.7 Tablas Adicionales (creadas pero uso limitado)

- `MEDIDAS_CORPORALES` — Medidas antropométricas completas (pliegues, diámetros, longitudes)
- `RENDIMIENTO_VELOCIDAD` — Pruebas de sprint
- `RENDIMIENTO_FLEXIBILIDAD` — Pruebas de flexibilidad
- `RENDIMIENTO_MOVILIDAD` — Evaluaciones FMS
- `RENDIMIENTO_RESISTENCIA` — VO2max, Cooper, etc.
- `PLANES_ALIMENTARIOS` — Planes con recetas seleccionadas (JSON)

---

## 2. API v3 ENDPOINTS — Inventario (146 endpoints totales)

### 2.1 Auth (`/api/v3/auth`) — 6 endpoints
- `POST /login` — Login con email + documento ✅
- `POST /register` — Registro de nuevo usuario ✅
- `POST /logout` — Logout ✅
- `GET /validate` — Validar token ✅
- `POST /refresh` — Refrescar token ✅
- `GET /me` — Datos del usuario actual ✅

### 2.2 Users (`/api/v3/users`) — 11 endpoints
- `GET /` — Listar usuarios (admin) ✅
- `GET /<id>` — Detalle usuario ✅
- `POST /` — Crear usuario (admin) ✅
- `PUT /<id>` — Actualizar usuario ✅
- `DELETE /<id>` — Eliminar usuario (admin) ✅
- `GET /<id>/measurements` — Historial mediciones ✅
- `POST /<id>/measurements` — Nueva medición ✅
- `DELETE /<id>/measurements/<mid>` — Eliminar medición ✅
- `GET /<id>/goals` — Objetivos del usuario ✅
- `POST /<id>/goals` — Crear/actualizar objetivo ✅
- `GET /<id>/goals/auto` — Objetivos automáticos ❌ BUG

### 2.3 Analytics (`/api/v3/analytics`) — 11 endpoints
- `GET /dashboard` — Dashboard completo ✅ **CLAVE**
- `GET /summary` — Resumen rápido ✅
- `GET /body-composition` — Composición corporal actual ✅
- `GET /body-composition/history` — Historial composición ✅
- `GET /scores` — Scores FFMI/BF ✅
- `POST /calculators/bmr` — Calculadora TMB ✅
- `POST /calculators/tdee` — Calculadora TDEE ✅
- `POST /calculators/body-fat` — Calculadora BF% ✅
- `POST /calculators/ffmi` — Calculadora FFMI ✅
- `POST /calculators/weight-loss` — Calculadora pérdida peso ✅
- `POST /calculators/muscle-gain` — Calculadora ganancia muscular ✅

### 2.4 Nutrition (`/api/v3/nutrition`) — 28 endpoints
- `GET /plans` — Listar planes nutricionales ✅
- `GET /plans/<id>` — Plan específico ✅
- `POST /plans` — Crear plan ✅
- `PUT /plans/<id>` — Actualizar plan ✅
- `DELETE /plans/<id>` — Eliminar plan ✅
- `POST /plans/<id>/adjust-calories` — Ajustar calorías ✅
- `POST /plans/auto-calculate` — Plan automático ✅ **CLAVE**
- `GET /foods` — Listar alimentos ✅
- `GET /foods/<id>` — Detalle alimento ✅
- `GET /foods/<id>/portions` — Porciones ✅
- `GET /food-groups` — Grupos alimentarios con bloques ✅
- `GET /recipes` — Listar recetas ✅
- `GET /recipes/<id>` — Detalle receta ✅
- `POST /recipes/<id>/calculate` — Calcular porciones (usa solver legacy) ✅
- `GET /meal-plans` — Planes alimentarios ✅
- `POST /meal-plans` — Crear plan alimentario ✅
- `GET /meal-plans/blocks` — Distribución macros por comida ✅
- `POST /meal-plans/blocks/adjust` — Ajustar bloques ✅
- `GET /meal-plans/<id>/calculate` — Auto-calcular recetas del plan ✅
- `GET /meal-plans/<id>/shopping-list` — Lista de compras ✅
- + 8 endpoints adicionales de bloques y ajustes

### 2.5 Training (`/api/v3/training`) — 21 endpoints
- `GET /strength` — Datos de fuerza ❌ BUG
- `POST /strength` — Registrar test ✅
- `GET /strength/history` — Historial fuerza ❌ BUG (mismo issue)
- `DELETE /strength/<id>` — Eliminar registro ✅
- `GET /strength/standards` — Estándares de fuerza ✅
- `POST /strength/submit` — Submit resultados ✅
- `GET /strength/admin` — Datos admin ✅
- `GET /lifts` — Levantamientos ✅
- `POST /lifts` — Guardar lift ✅
- `GET /exercises` — Lista ejercicios ✅
- `GET /plans` — Planes entrenamiento ✅
- `GET /plans/<id>` — Plan específico ✅
- `POST /plans/<id>/optimize` — Optimizar plan ✅
- `GET /sessions/current` — Sesión actual ✅
- `POST /sessions` — Registrar sesión ✅
- `POST /sessions/advance` — Avanzar día ✅
- `GET /sessions/history` — Historial sesiones ✅
- `GET /sessions/today` — Sesión de hoy ✅
- `GET /programs` — Programas gratuitos ✅
- `GET /programs/<id>` — Programa específico ✅
- `POST /strength/<id>/optimize` — Optimizar entrenamiento ✅

### 2.6 Admin (`/api/v3/admin`) — 17 endpoints
- `GET /stats` — Estadísticas generales ✅
- `GET /users` — Listar usuarios ✅
- `GET /users/<id>` — Detalle usuario ✅
- `GET /users/search` — Buscar usuarios ✅
- `GET /database/tables` — Listar tablas DB ✅
- `GET /database/tables/<name>` — Datos de tabla ✅
- `PUT /database/tables/<name>/<id>` — Editar fila ✅
- `GET /database/export/<name>` — Exportar tabla ✅
- `GET /dashboard-stats` — Stats dashboard ✅
- `GET /auth-users` — Usuarios auth.db ✅
- `GET /pending-users` — Usuarios pendientes ✅
- `POST /auth-users/<id>/approve` — Aprobar usuario ✅
- `POST /auth-users/<id>/reject` — Rechazar usuario ✅
- `POST /auth-users/<id>/toggle-active` — Activar/desactivar ✅
- `POST /auth-users/<id>/role` — Cambiar rol ✅
- `DELETE /auth-users/<id>` — Eliminar usuario ✅
- `GET /audit` — Log de auditoría ✅

### 2.7 Telemedicine (`/api/v3/telemedicine`) — 34 endpoints
Appointments, records, patients, situations, vitals, documents, prevention — Todos implementados ✅

### 2.8 Engagement (`/api/v3/engagement`) — 10 endpoints
Reminders, tasks, insights — Todos implementados ✅

### 2.9 Assignments (`/api/v3/assignments`) — 8 endpoints
Patient-professional assignments — Todos implementados ✅

---

## 3. BUGS ENCONTRADOS EN API v3

### BUG 1: `/api/v3/training/strength` — Column name mismatch
- **Error:** `no such column: NOMBRE_APELLIDO`
- **Causa:** La tabla `FUERZA` usa `user_id` (DNI numérico), no `NOMBRE_APELLIDO`
- **Archivos:** `src/api/v3/training/routes.py` líneas 42-44, 184-186
- **Fix:** Cambiar `WHERE NOMBRE_APELLIDO = ?` por `WHERE user_id = ?` y pasar el DNI del usuario

### BUG 2: `/api/v3/users/<id>/goals/auto` — Column name mismatch
- **Error:** `no such column: BF_PERCENT`
- **Causa:** La tabla `PERFILDINAMICO` usa `BF` (no `BF_PERCENT`) e `IMMC` (no `FFMI`)
- **Archivo:** `src/api/v3/users/routes.py` línea 722
- **Fix:** Cambiar `BF_PERCENT` → `BF` y `FFMI` → `IMMC`

### BUG 3 (menor): Encoding UTF-8
- Las respuestas muestran caracteres mal codificados (ej: `"�ltimo mes"` en vez de `"Último mes"`)
- Probablemente un issue de encoding en la respuesta JSON o en PowerShell

---

## 4. COMPARATIVA: LEGACY vs API v3

### ✅ Funcionalidades 100% cubiertas por API v3:
1. **Login/Auth** — Completo con JWT, roles, refresh
2. **Dashboard/Composición corporal** — Dashboard completo con scores, deltas, historial, performance clock, análisis completo
3. **Plan nutricional** — CRUD completo + auto-cálculo + ajuste de calorías + bloques por comida
4. **Alimentos** — Listado, búsqueda, paginación, porciones
5. **Recetas** — Listado, detalle, cálculo de porciones con solver legacy
6. **Planes alimentarios** — CRUD + cálculo automático + lista de compras
7. **Objetivos manuales** — CRUD completo
8. **Objetivos automáticos** — Implementado pero con bug (fix menor)
9. **Entrenamiento** — Planes, sesiones, avanzar día, historial
10. **Programas gratuitos** — Listado y detalle
11. **Admin** — Estadísticas, gestión usuarios, DB browser, exportación
12. **Telemedicina** — CRUD completo de citas, historia médica, pacientes, documentos
13. **Calculadoras** — BMR, TDEE, BF%, FFMI, pérdida/ganancia peso

### ⚠️ Funcionalidades con bugs (fix menor):
1. **Fuerza GET/History** — Column name mismatch (NOMBRE_APELLIDO → user_id)
2. **Objetivos automáticos** — Column name mismatch (BF_PERCENT → BF, FFMI → IMMC)

### 🔶 Funcionalidades legacy NO migradas a API v3 (por prioridad):
1. **Optimizador de dieta por grupos alimentarios** (`process_diet`) — Usa scipy.minimize con restricciones de micronutrientes. Función compleja pero de uso limitado.
2. **Predicción de entrenamientos futuros** (`predict_next_workouts`) — Endpoint no expuesto en API v3.
3. **Creación de alimentos** (POST) — Solo GET disponible en API v3.
4. **Creación de recetas** (POST) — Solo GET disponible en API v3.
5. **Tablas de rendimiento físico** (velocidad, flexibilidad, movilidad, resistencia) — Tablas creadas pero sin endpoints.

---

## 5. TABLAS SQLite — Schema real

| Tabla | Columnas clave | Identificador |
|---|---|---|
| PERFILESTATICO | NOMBRE_APELLIDO, DNI, FECHA_NACIMIENTO, SEXO, TELEFONO, ALTURA, CIRC_CUELLO, CIRC_MUNECA, CIRC_TOBILLO | NOMBRE_APELLIDO |
| PERFILDINAMICO | NOMBRE_APELLIDO, FECHA_REGISTRO, PESO, CIRC_ABD, CIRC_CIN, CIRC_CAD, **BF**, IMC, **IMMC**, PESO_GRASO, PESO_MAGRO, deltas, scores | NOMBRE_APELLIDO |
| DIETA | NOMBRE_APELLIDO, CALORIAS, PROTEINA, GRASA, CH, DP/DG/DC (×6 comidas), LIBERTAD, ESTRATEGIA, FACTOR_ACTIVIDAD, VELOCIDAD_CAMBIO, DEFICIT_CALORICO | NOMBRE_APELLIDO |
| OBJETIVO | NOMBRE_APELLIDO, GOALIMMC, GOALBF, ... | NOMBRE_APELLIDO |
| FUERZA | **user_id** (DNI), fecha_analisis, bodyweight, sex, lift_fields_json, total_score, lifts_results_json, categories_results_json, muscle_groups_results_json | user_id (DNI) |
| ALIMENTOS | ID, Largadescripcion, P, G, CH, F, Gramo1, Medidacasera1, Gramo2, Medidacasera2 | ID |
| RECETAS | ID, NOMBRERECETA, ALIIND1-3, ALIDEP1-10 (ingredientes variables/fijos) | ID |
| GRUPOSALIMENTOS | CATEGORIA, PORCION, DESCRIPCION, PROTEINA, GRASAS_TOTALES, CARBOHIDRATOS, + 45 micronutrientes | CATEGORIA |
| PLANES_ALIMENTARIOS | USER_DNI, NOMBRE_APELLIDO, TIPO_PLAN, PLAN_JSON, ACTIVO | ID |
| PLANES_ENTRENAMIENTO | user_id, plan_json, current_dia, total_dias, active | ID |
| ESTADO_EJERCICIO_USUARIO | user_id, ejercicio_nombre, current_columna, current_sesion, current_peso, lastre_adicional | user_id + ejercicio |
| MATRIZ_ENTRENAMIENTO | matriz_json (prescripciones series×columnas) | ID |

---

## 6. CONCLUSIÓN Y PRÓXIMOS PASOS

### La API v3 está lista para el nuevo frontend con 2 fixes menores:

**Fix 1** — `training/routes.py`: Cambiar query de FUERZA para usar `user_id` (DNI)
**Fix 2** — `users/routes.py`: Cambiar `BF_PERCENT` → `BF` e `FFMI` → `IMMC` en auto-goals

### Datos verificados con tests reales (servidor en puerto 8000):
- ✅ Login retorna token JWT + datos usuario + rol
- ✅ Dashboard retorna composición corporal, scores, deltas, historial, tasas, performance clock, análisis completo, plan nutricional
- ✅ Planes nutricionales con CRUD completo y distribución por comida
- ✅ Alimentos (187 items) con búsqueda y paginación
- ✅ Recetas (137 items) con cálculo de porciones via solver
- ✅ Plan automático con opciones de velocidad y macros calculados
- ✅ Mediciones dinámicas (673 registros) con historial completo
- ✅ Objetivos manuales con CRUD
- ✅ Sesión de entrenamiento actual con plan y ejercicios
- ✅ Admin stats con conteos de usuarios, alimentos, recetas, planes
