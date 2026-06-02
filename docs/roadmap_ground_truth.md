# OMV3 — Verdad-de-terreno del roadmap de paridad

> Generado verificando **cada checkbox** del roadmap de Notion contra el código real
> (no contra las afirmaciones del roadmap). Fuente: mapeo paralelo 6 dominios (2026-06-02).
> Roadmap origen: https://www.notion.so/3736d4d5f6e481da93d5c1b3052345b3

## TL;DR
- **Frontend + deploy ya están production-ready.** `src/wsgi.py` sirve la SPA same-origin desde `frontend/dist/` (commiteado), routing por roles, apiClient, design-tokens y build (`tsc -b && vite build`) completos. El "all-in-one en PythonAnywhere" es **config**, no construcción.
- **Varias deudas ya están saldadas:** BMR Mifflin/Harris/Katch (`analytics/routes.py:730`), US Navy BF (`:855`), 1RM Epley (`training/routes.py:124`), `solve_meal` vía wrapper (`nutrition/solver.py`), service de rendimiento físico (`telemedicineService.ts:120`).
- **El grueso restante es frontend** (pantallas que consumen endpoints que ya existen) + **porteos legacy** + **extracción de datos de referencia**.

## Estado por dominio (✅ done · 🟡 partial · 🟥 missing)

### 🩺 Telemedicina → Prevención (P1)
| Item | Estado | Nota |
|---|---|---|
| Proxy `/prevention/recommendations` + service + `Prevention.tsx` + types | ✅ | verificado |
| Backend ya acepta `patient` (specialist/admin) | ✅ | `routes.py:1082` |
| Lado médico (pestaña Labs en ficha) | 🟥 | tab deshabilitado en `DoctorPatientDetail.tsx:26,31`; `Prevention` ya acepta prop `patient` → solo habilitar+render |
| Persistir tobacco/pregnant/sexuallyActive en `clinical.db.patients` | 🟥 | hoy son toggles runtime; faltan columnas + UI |
| `PREVENTION_API_URL` en prod | 🟡 | env leído (`routes.py:1046`, default 127.0.0.1:5000); falta deploy del API externo + setear var |
| GETs records/vitals scoping | ✅ | correctamente restringidos al user; situations/documents aceptan filtro `paciente` |

### 🧘 Rendimiento físico / Movilidad (P2 — GoWOD)
| Item | Estado | Nota |
|---|---|---|
| Backend endpoints speed/flex/mobility/endurance | ✅ | `telemedicine/routes.py:1260-1324` |
| Service frontend | ✅ | `telemedicineService.ts:120-127` (el roadmap decía que no existía) |
| 🐞 `RENDIMIENTO_RESISTENCIA` apuntaba a telemed.db (no existe) | ✅ **FIXED** | ahora `'legacy'` (Basededatos); verificado e2e |
| Pantalla test de movilidad (paciente) | 🟥 | falta `patient/MobilityTest.tsx` |
| Vista profesional de movilidad | 🟥 | falta en doctor |
| Cardio Riegel (predictor de tiempos) | 🟥 | fórmula en `ReferenceWeb/RunReps`, no implementada |
| Catálogo movilidad/correctivos | 🟥 | requiere extracción EXRX/MuscleWiki |

### 🏋️ Entrenamiento (P3 — Fitbod)
| Item | Estado | Nota |
|---|---|---|
| 1RM Epley | ✅ | `training/routes.py:124` |
| 1RM Brzycki + endpoint comparador | 🟡 | falta Brzycki |
| Sesión del día (paciente) | 🟡 | `TrainingPlan.tsx` existe; `ActiveTrainingSession` mínimo |
| Recuperación muscular por grupo | 🟥 | falta tabla + endpoints + UI |
| Strength score por percentil edad/sexo | 🟡 | hay 5 niveles por bw_multiplier; falta cohorte edad/sexo (necesita datos) |
| Catálogo ejercicios con músculos | 🟡 | tabla `exercises` (25 filas) + `/v2/exercises`; frontend usa lista hardcodeada |
| `predict_next_workouts` → v3 | 🟥 | legacy `functions.py:2946`, no portado |
| Exercise replacement / alternativas | 🟥 | sin mecanismo |

### 🥗 Nutrición (P4 — Fitia)
| Item | Estado | Nota |
|---|---|---|
| BMR Mifflin/Harris/Katch | ✅ | `analytics/routes.py:730` con param `formula` |
| US Navy BF | ✅ | `analytics/routes.py:855` |
| `solve_meal` en `nutrition/solver.py` | 🟡 | wrapper sobre legacy; falta reimpl nativa (OMV-52) |
| Rechange (swap manteniendo macros) | 🟥 | sin endpoint ni UI |
| Flags optimizador (is_not_divisible/optimizable/legume) | 🟥 | faltan columnas en foods + uso en solver |
| Medidas caseras por alimento (servings[]) | 🟡 | hoy 2 porciones hardcodeadas |
| Optimizador de día (`process_diet`) | 🟥 | legacy `functions.py:3196`, no portado |
| Sugerencias por bloques (`generar_combinaciones`) | 🟡 | `/blocks/suggestions` por presets, no combinatorio |
| Catálogo ampliado (Yazio 2763) | 🟥 | requiere extracción |
| `recipe_simple_calculation` | 🟡 | `/recipes/<id>/calculate` cubre el caso |

### 📊 Datos de referencia (P6) — todos los extractores faltan
Strength Level (874 HTML), EXRX (1545 HTML), Darebee (JSON), Yazio (2763 HTML), cardio standards (Running/Swim/Row/Cycle). Scripts reproducibles en `scripts/extract_*.py` → `clinical.db`.

## Plan de ejecución por olas
- **Ola 1 (quick wins backend, verificables):** ✅ endurance fix · 1RM Brzycki+endpoint · Riegel · PREVENTION_API_URL graceful.
- **Ola 2 (P1/P2 frontend, alto valor):** doctor Prevention (Labs) · persistir flags de prevención · `MobilityTest.tsx` + vista doctor.
- **Ola 3 (nutrición Fitia):** flags optimizador (migración) · Rechange · servings[].
- **Ola 4 (porteos legacy):** `solve_meal` nativo · `predict_next_workouts` · optimizador de día.
- **Ola 5 (datos):** extractores → strength standards, ejercicios, cardio, foods. Habilita percentiles + catálogos.
- **Ola 6 (Fitbod feel + movilidad data-dependent):** recuperación muscular · exercise replacement · catálogo movilidad.
- **Capstone:** tests por feature (scripts/ live-requests), `tsc --noEmit`, build prod, checklist deploy PA.

## Progreso en vivo (se actualiza a medida que avanza el maratón)
**Hecho + verificado:**
- ✅ P1 Prevención COMPLETO: lado médico (pestaña Labs en `DoctorPatientDetail`), persistencia de flags (`migración 021` + columnas `es_fumador/activo_sexualmente/embarazo` en patients), y **motor in-process** (`prevention_engine.py` + `uspstf_data.json`) que elimina la dependencia del servicio externo `:5000` (all-in-one). `PREVENTION_API_URL` queda como override opcional.
- ✅ 🐞 endurance fix (RENDIMIENTO_RESISTENCIA → legacy DB).
- ✅ 1RM (`GET /training/strength/1rm`) Epley/Brzycki/Lombardi/O'Conner + prescripción.
- ✅ Riegel (`POST /analytics/calculators/race-time`).
- ✅ Performance GET/POST aceptan `?user=`/`patient` con `check_patient_access` → habilita vista del profesional y registro por especialista (antes solo self).
- ✅ P2 movilidad COMPLETO: pantalla `patient/MobilityTest.tsx` (autoevaluación por zona estilo GoWOD → score global + focuses + historial), nav en Sidebar (`p-mobility`, icono activity), ruta en App.tsx, tipos en api.ts, service tipado. Vista del profesional: toggle Prevención/Movilidad en la pestaña Labs de `DoctorPatientDetail`. Backend: mobility POST permite auto-reporte del paciente (antes solo clinical writer).
- ✅ P5 (1er porteo): `predict_next_workouts` → v3. Helper `training/helpers.py:predict_next_workouts` (preview de próximas N sesiones del plan activo, usando `get_active_plan` + `get_progression_prescription` + matriz) y endpoint `GET /training/sessions/predict?num=&user=`. Verificado con plan+exercise_progress sembrados (3 preds con wraparound + prescripción). No simula level-up mid-horizonte (eso pasa en `advance_progression_after_session`).
- ✅ P3 backend (Fitbod): recuperación muscular computada del historial (`GET /training/recovery`), alternativas de ejercicio por solapamiento muscular (`GET /training/exercises/<key>/alternatives`), 1RM, predict. Pendiente: widget de recuperación + UI de replacement + tracking de sesión (frontend).
- ✅ P4 backend (Fitia): flags de optimizador (`migración 022` en ALIMENTOS: is_not_divisible/is_not_optimizable/is_legume), `is_not_divisible` honrado en `solve_meal` (variable entera), expuestos en food CRUD; **Rechange** (`POST /nutrition/foods/rechange`, equivalencias por macros). Pendiente: `is_not_optimizable`/`is_legume` en el solver, servings[] por alimento (refactor L), UI de Rechange/flags (frontend).
- ✅ P3/P4 UI: `MuscleRecoveryCard` (barras de recuperación por músculo) embebido en `patient/TrainingPlan`; `ExerciseAlternativesSheet` (botón "cambiar" por ejercicio → equivalentes); `RechangeSheet` (botón swap por alimento en `AddFoodSheet` → reemplaza por equivalente manteniendo macros). Services tipados (`trainingService.getMuscleRecovery/getExerciseAlternatives/predictSessions`, `nutritionService.rechange`) + tipos en api.ts.
- ✅ **Build pipeline reparado**: faltaban deps nativas (`npm install` agregó el shim `.bin/tsc` + `@rolldown/binding-win32-x64-msvc`). `npm run build` ahora corre y `dist/` quedó refrescado con toda la UI nueva (P1–P4). Pendiente UI menor: toggles de flags en un editor de catálogo, aplicar swap de ejercicio al plan (necesita endpoint), servings[].
- ✅ P6 (1er extractor): `scripts/extract_strength_standards.py` mina Strength Level (290 ejercicios, 20.874 filas) → `clinical.db.strength_standards_pop` (por sexo + bodyweight/age). Endpoint `GET /training/strength/standards-lookup` clasifica un levantamiento → nivel + percentil estimado + umbrales (kg/lb). **Desbloquea "Strength Score por percentil" (P3)**. Patrón reproducible = plantilla para los demás extractores.
  - ✅ P6 (2º extractor): `scripts/extract_cardio_standards.py` mina Running Level (10 distancias, 340 filas) → `clinical.db.cardio_standards` (sport/distance/sex/age → tiempos por nivel, en segundos). Seed `cardio_standards.sql` + loader `024`. Complementa Riegel.
  - ✅ P5 (OMV-52): `nutrition/solver.py` **nativo** (port verbatim de `solve_meal`, sin dependencia runtime de `functions.py`). Verificado native==legacy en 3 casos (independientes/dependencia/indivisible).
  - ✅ P6 (3er/4to extractor): `extract_exrx_exercises.py` → `exercise_catalog` (1328 ej. con target/sinergistas/estabilizadores + Utility/Mechanics/Force) + endpoint `/training/exercise-catalog`; `extract_darebee_catalog.py` → `darebee_catalog` (2678 items: workouts/exercises/recipes/programs/challenges) + endpoint `/training/darebee-catalog`. Seeds + loaders 025/026.
  - ✅ P6: lookup de cardio `GET /training/cardio-standards` (clasifica tiempo → nivel + percentil).
  - **Diferido con fundamento (no se hace a medias):**
    - **Yazio** (2763 alimentos): el mirror estático renderiza los valores client-side como `data-value` por-porción dependientes del orden de spans → mapeo frágil; riesgo de cargar nutrición mal mapeada. Requiere validación per-page cuidadosa.
    - **P5 optimizador de día (`process_diet`) + `generar_combinaciones`**: fuertemente acoplados al legacy (WTForms `diet_form`, tablas `DIETA`/`GRUPOSALIMENTOS` de 50 nutrientes, **scipy.optimize**). Porteo grande que necesita diseño dedicado (contrato JSON + reimpl optimizador + mapeo de schema), no copia apurada. El núcleo de P5 (`solve_meal` nativo, OMV-52) ya está.
- Tests: `scripts/test_p1p2_prevention_performance.py` (19/19) + `scripts/test_p3p4_training_nutrition.py` (10/10, incluye percentil de fuerza). Helper `scripts/qa_helpers.py` (mint_token). Frontend: `npm run build` verde.

**Pendiente P2 (menor / data-dependiente):** UI de predictor de cardio (Riegel ya existe como endpoint); catálogo de ejercicios correctivos de movilidad → cae en P6 (extracción EXRX/MuscleWiki).

**Siguiente:** P3 Fitbod (recuperación muscular por grupo, exercise replacement, sesión del día con tracking), P4 nutrición (flags optimizador `is_not_divisible/optimizable/legume` + Rechange + servings[]), P5 porteos (predict_next_workouts, solve_meal nativo, optimizador de día), P6 extractores de datos.

## Cómo verifico (harness)
- Server vivo: `python src/main.py` (:8000). Token sin password: `scripts/qa_helpers.py` (`mint_token`) usa el mismo `JWT_SECRET`.
- Endpoints: `requests` contra `:8000` (patrón de `scripts/test_fix*.py`).
- Frontend: `node frontend/node_modules/typescript/bin/tsc --noEmit` (baseline verde) + `npm run build`.
