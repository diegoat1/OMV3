# GuÃ­a completa de ONV2

## Objetivo general
ONV2 centraliza la gestiÃ³n clÃ­nica y deportiva: captura perfiles estÃ¡tico/dinÃ¡mico, calcula diagnÃ³sticos corporales, genera planes nutricionales y de entrenamiento personalizados y mantiene un historial integral de progreso.

## Ãndice rÃ¡pido
- Flujos de usuario clave
  - Inicio y recursos pÃºblicos
  - AutenticaciÃ³n y sesiÃ³n
  - Dashboard clÃ­nico
  - Generadores de planes (nutriciÃ³n y entrenamiento)
  - AdministraciÃ³n de datos
- Funciones de soporte en `src/functions.py`
- MÃ³dulo de entrenamiento (`src/training.py`)
- Optimizador de rutinas (`src/workout_optimizer.py`)
- Mapa de datos y dependencias

---

## Flujos de usuario clave
Los flujos estÃ¡n orquestados desde `src/main.py` y renderizan plantillas dentro de `src/templates/`, apoyÃ¡ndose en WTForms (`src/forms.py`).

### Inicio y recursos pÃºblicos
- `/` (`home`): muestra `home.html` y, si la sesiÃ³n estÃ¡ activa, redirige a `dashboard`.
- `/caloriescal`: expone `caloriescal.html` (calculadora de calorÃ­as).
- `/resume`: genera un resumen analÃ­tico en `resume.html` (usuarios autenticados).
- `/mantenimiento`: retorna `mantenimiento.html` para indicar tareas en curso.

### AutenticaciÃ³n y sesiÃ³n
- `/login`: `forms.LoginForm` + `login.html`; valida correo contra `PERFILESTATICO` y establece `session['DNI']`/`session['username']`.
- `/logout`: limpia credenciales y redirige a login.
- `@app.before_request`: restringe acceso a rutas protegidas y redirige segÃºn rol.

### Dashboard clÃ­nico
- `/dashboard`: renderiza `dashboard.html` consolidando `PERFILESTATICO`, `PERFILDINAMICO`, `DIETA`, `OBJETIVO` y mÃ©tricas de progreso. Permite seleccionar pacientes.
- `/resume`: complementa el dashboard con simulaciones de recomposiciÃ³n corporal.

### Generadores de planes
- Plan nutricional manual (`/planner`): `forms.PlannerForm` + `planner_nuevo.html`; procesa con `functions.plannutricional`.
- Plan nutricional automÃ¡tico (`/api/planner/plan-automatico/<usuario>`): usa `functions.calcular_plan_nutricional_automatico`.
- Plan de entrenamiento (`/trainingplanner`): `forms.TplannerForm` + `trainingplanner.html` (mÃ³dulo heredado `trainfunction.planentrenamientopaso1`).
- Plan diario (`/entrenamiento_actual`): consulta `training.obtener_entrenamiento_del_dia` y muestra `entrenamiento_actual.html`.
- Seguimiento: `/registrar_sesion` y `/avanzar_dia` reciben JSON y usan utilidades en `training.py`.
- `/plan_entrenamiento`: combina `functions.get_training_plan` y `predict_next_workouts` para `plan_entrenamiento.html`.

### AdministraciÃ³n de datos
- `/databasemanager` y `/databasemanager-beta`: panel de datos (recetas, alimentos, dietas, perfiles, objetivos).
- Perfiles: `/create`, `/editperfilest/<DNI>`, `/update`, `/editperfildin/<ID>`.
- Recetario y alimentos: `/createfood`, `/editfood/<ID>`, `/recipecreator`.
- Objetivos: `/goal` y `/api/goal/objetivos-automaticos/<usuario>`.

---

## Funciones de soporte (`src/functions.py`)
- CÃ¡lculos de plan nutricional y bloques (P/G/C) y helpers de catÃ¡logos (`GRUPOSALIMENTOS`).
- GeneraciÃ³n de combinaciones inteligentes y favoritos/biblioteca.
- Limpieza de cachÃ©s y utilidades generales.

## MÃ³dulo de entrenamiento (`src/training.py`)
- Genera y avanza planes, registra sesiones y test de fuerza.

## Optimizador de rutinas (`src/workout_optimizer.py`)
- `optimize_split(...)` formula un problema de PL entera para distribuir ejercicios por dÃ­as minimizando penalizaciones por repeticiones de grupo muscular y dÃ­as consecutivos.
- `explain_penalty(...)` detalla el aporte de cada grupo muscular a la penalizaciÃ³n total.

## Mapa de datos y dependencias
- Base de datos: `src/Basededatos` (SQLite). Tablas: `PERFILESTATICO`, `PERFILDINAMICO`, `OBJETIVO`, `DIETA`, `PLANES_ALIMENTARIOS`, `ALIMENTOS`, `RECETAS`, `GRUPOSALIMENTOS`, `FUERZA`, `PLANES_ENTRENAMIENTO`, `ESTADO_EJERCICIO_USUARIO`, `MATRIZ_ENTRENAMIENTO`.
- JSON: `MATRIZ_ENTRENAMIENTO.matriz_json`, `PLANES_ENTRENAMIENTO.plan_json`, histÃ³ricos de fuerza; caches en derivadas.
- Dependencias: Flask/Flask-WTF, SQLite3, NumPy, PuLP, `math`, `statistics`, `datetime`, `json`.

â€”

Esta guÃ­a es punto de partida para nuevos desarrolladores y debe mantenerse sincronizada con la lÃ³gica de negocio.


