# OMV3 API v3 — Referencia Completa

## Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Auth](#1-auth-apiv3auth)
3. [Users](#2-users-apiv3users)
4. [Nutrition](#3-nutrition-apiv3nutrition)
5. [Training](#4-training-apiv3training)
6. [Analytics](#5-analytics-apiv3analytics)
7. [Admin](#6-admin-apiv3admin)
8. [Assignments](#7-assignments-apiv3assignments)
9. [Telemedicine](#8-telemedicine-apiv3telemedicine)
10. [Engagement](#9-engagement-apiv3engagement)
11. [Check-in](#10-checkin-apiv3checkin)
12. [Mapa de Dependencias](#mapa-de-dependencias)

---

## Arquitectura General

### Bases de Datos

| DB | Archivo | Contenido |
|---|---|---|
| **Basededatos** | `src/Basededatos` | Legacy: ALIMENTOS, GRUPOSALIMENTOS, PERFILESTATICO, PERFILDINAMICO, DIETA, FUERZA, PLANES_ENTRENAMIENTO, SESIONES_ENTRENAMIENTO, RECORDATORIOS, TAREAS |
| **auth.db** | `src/auth.db` | Auth: users, patient_user_link, specialist_assignments, audit_log |
| **clinical.db** | `src/db/clinical.db` | v3: patients, measurements, goals, nutrition_plans, recipes, recipe_ingredients, meal_plans, block_presets, block_favorites, nutrition_daily_logs, nutrition_daily_summary, strength_tests, daily_checkins, symptom_events, health_index_history |
| **telemedicina.db** | `src/telemedicina.db` | Telemedicina: CITAS_MEDICAS, HISTORIA_MEDICA, TELEMED_PACIENTES, TELEMED_SITUACIONES, SIGNOS_VITALES, TELEMED_DOCUMENTOS, PROGRAMAS_PREVENCION, PLANTILLAS |

### Flujo de Identidad

```
email (login)
  → auth.db:users.id
    → auth.db:patient_user_link.patient_dni
      → clinical.db:patients.id (patient_id)
        → measurements, goals, nutrition_plans, etc.
```

Funciones clave: `resolve_patient_id(user_id_or_name)` y `resolve_user_identity(user_id_or_name)` en `common/database.py`.

### Formato de Respuesta (todas las rutas)

```json
// Success
{"success": true, "data": {...}, "meta": {"timestamp": "...", "version": "v3"}}

// Error
{"success": false, "error": {"code": "ERROR_CODE", "message": "..."}, "meta": {...}}

// Paginado
{"success": true, "data": [...], "pagination": {"page": 1, "per_page": 20, "total": 100, "has_next": true, "has_prev": false}, "meta": {...}}
```

### Codigos de Error

| Codigo | HTTP | Uso |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Campos faltantes o invalidos |
| `UNAUTHORIZED` | 401 | Sin autenticacion |
| `TOKEN_INVALID` | 401 | JWT expirado o invalido |
| `FORBIDDEN` | 403 | Sin permisos |
| `NOT_FOUND` | 404 | Recurso no existe |
| `CONFLICT` | 409 | Duplicado (ej: DNI ya existe) |
| `INTERNAL_ERROR` | 500 | Error del servidor |

### Decoradores de Autenticacion

| Decorador | Descripcion |
|---|---|
| `@require_auth` | Requiere JWT valido |
| `@require_admin` | Requiere rol admin |
| `@require_owner_or_admin` | Dueno del recurso o admin |

---

## 1. AUTH (`/api/v3/auth/`)

Maneja autenticacion JWT y perfiles de usuario.

### Flujo de trabajo

```
Register → (pending_verification) → Admin Approve → Login → JWT Token → /me, /refresh, /validate
```

### Endpoints

#### POST `/auth/login`
Autentica usuario con email y password (el password inicial es el DNI).

- **Auth:** Ninguna
- **Body:** `{email, password}`
- **DB Lee:** `auth.db` (users, patient_user_link) + `Basededatos` (PERFILESTATICO)
- **DB Escribe:** `auth.db` (audit_log)
- **Respuesta:**
  ```json
  {
    "token": "eyJ...",
    "user": {
      "id": "41", "dni": "37070509", "email": "...",
      "nombre_apellido": "...", "sexo": "M", "altura": 170,
      "telefono": "...", "fecha_nacimiento": "1992-09-14",
      "rol": "admin,doctor,nutricionista", "is_admin": true
    }
  }
  ```
- **Errores:** 400 (campos faltantes), 401 (credenciales invalidas, cuenta inactiva), 403 (pending_verification)

#### POST `/auth/register`
Crea cuenta nueva en estado `pending_verification`.

- **Auth:** Ninguna
- **Body:** `{nombre, email, documento, telefono?, desired_role?}`
- **DB Escribe:** `auth.db` (users, patient_user_link, audit_log)
- **Logica:** Password = documento (hasheado con bcrypt). desired_role='professional' → role='doctor'
- **Respuesta:** `{user_id, status: "pending_verification"}`
- **Errores:** 409 si email o DNI ya existen

#### POST `/auth/logout`
Logout (stateless, el cliente borra el token).

- **Auth:** `@require_auth`
- **Respuesta:** `{logged_out: true}`

#### GET `/auth/validate`
Valida un JWT sin acceder a la DB.

- **Auth:** Manual (lee header Authorization)
- **Respuesta:** `{valid: true, user: {id, dni, email, nombre_apellido, rol, is_admin}}`

#### POST `/auth/refresh`
Genera un nuevo JWT con expiracion renovada.

- **Auth:** `@require_auth`
- **Respuesta:** `{token: "eyJ...", user: {...}}`

#### GET `/auth/me`
Perfil completo del usuario autenticado.

- **Auth:** `@require_auth`
- **DB Lee:** `Basededatos` (PERFILESTATICO, PERFILDINAMICO ultimo)
- **Respuesta:**
  ```json
  {
    "user": {id, dni, email, nombre_apellido, rol, is_admin, sexo, altura, telefono, fecha_nacimiento},
    "perfil_estatico": {DNI, NOMBRE_APELLIDO, EMAIL, SEXO, ALTURA, ...},
    "perfil_dinamico": {PESO, BF, IMMC, BODYSCORE, SOLVER_CATEGORY, ...}
  }
  ```

### Relacion con otros modulos

| Modulo | Relacion |
|---|---|
| **Todos** | Usan el JWT generado por `/login` para autenticarse |
| **Admin** | Aprueba/rechaza usuarios creados por `/register` |
| **Assignments** | Usa `users.id` como specialist_id/patient_id |

---

## 2. USERS (`/api/v3/users/`)

CRUD de pacientes, mediciones antropometricas y objetivos fisicos. Usa `clinical.db` como store principal.

### Flujo de trabajo

```
Crear paciente → Registrar mediciones periodicas → Definir objetivos → Calcular roadmap
                        ↓                              ↓
              Calcula BF%, FFMI, IMC           Auto-goals (limites geneticos)
              Deltas vs medicion anterior      Roadmap de fases (corte/volumen)
```

### Endpoints

#### GET `/users`
Lista paginada de pacientes. Solo admin.

- **Auth:** `@require_admin`
- **Params:** `page`, `per_page`, `q` (busca nombre/email/DNI)
- **DB Lee:** `clinical.db` (patients)

#### GET `/users/<user_id>`
Perfil completo con ultima medicion y objetivo activo.

- **Auth:** `@require_owner_or_admin`
- **DB Lee:** `clinical.db` (patients, measurements, goals)
- **Respuesta:** `{user, perfil_dinamico, objetivo}`

#### POST `/users`
Crea paciente (perfil estatico). Solo admin.

- **Auth:** `@require_admin`
- **Body:** `{dni, nombre_apellido, email, sexo, altura, telefono?, fecha_nacimiento?}`
- **DB Escribe:** `clinical.db` (patients)
- **Error:** 409 si DNI ya existe

#### PUT `/users/<user_id>`
Actualiza perfil estatico.

- **Auth:** `@require_owner_or_admin`
- **Body:** `{nombre_apellido?, email?, sexo?, altura?, telefono?, fecha_nacimiento?}`
- **DB Escribe:** `clinical.db` (patients)

#### DELETE `/users/<user_id>`
Elimina paciente y todos sus datos (cascade). Solo admin.

- **Auth:** `@require_admin`
- **DB Escribe:** `clinical.db` (patients, measurements, goals, nutrition_plans)

---

#### GET `/users/<user_id>/measurements`
Historial de mediciones.

- **Auth:** `@require_owner_or_admin`
- **Params:** `limit` (default 50, max 500)
- **DB Lee:** `clinical.db` (measurements)

#### POST `/users/<user_id>/measurements`
Registra nueva medicion. Calcula BF% (Navy), FFMI, peso magro/graso automaticamente.

- **Auth:** `@require_owner_or_admin`
- **Body:**
  ```json
  {
    "peso": 68.0,
    "circ_abdomen": 83.5,
    "circ_cintura": 0, "circ_cadera": 0,
    "altura": 170, "circ_cuello": 35,
    "circ_muneca": 15, "circ_tobillo": 22,
    "fecha_registro": "2025-10-06"
  }
  ```
- **Campos requeridos:** `peso` + `circ_abdomen` (hombres), + `circ_cintura` + `circ_cadera` (mujeres)
- **Calculos:**
  - BF% Navy: `495 / (1.0324 - 0.19077*log10(abd) + 0.15456*log10(alt)) - 450` (M)
  - FFMI: `peso_magro / alt_m² + 6.1*(1.8 - alt_m)`
- **DB Escribe:** `clinical.db` (measurements + patients si campos estaticos cambian)
- **Respuesta:** `{id, peso, bf_percent, peso_magro, peso_graso, ffmi, static_updated}`

#### DELETE `/users/<user_id>/measurements/<measurement_id>`
Elimina una medicion.

- **Auth:** `@require_owner_or_admin`
- **DB Escribe:** `clinical.db` (measurements)

---

#### GET `/users/<user_id>/goals`
Objetivo activo del paciente.

- **Auth:** `@require_owner_or_admin`
- **DB Lee:** `clinical.db` (goals WHERE activo=1)
- **Respuesta:** `{goal: {goal_peso, goal_bf, goal_ffmi, goal_abdomen, goal_cintura, goal_cadera, notas, tipo}}`

#### POST `/users/<user_id>/goals`
Crea o actualiza objetivo (UPSERT).

- **Auth:** `@require_owner_or_admin`
- **Body:** `{peso_objetivo?, bf_objetivo?, ffmi_objetivo?, circ_abdomen_objetivo?, circ_cintura_objetivo?, circ_cadera_objetivo?, notas?, tipo?}`
- **DB Escribe:** `clinical.db` (goals — UPDATE si existe activo, INSERT si no)

#### GET `/users/<user_id>/goals/auto`
Calcula objetivos ideales basados en limites geneticos (no guarda).

- **Auth:** `@require_owner_or_admin`
- **DB Lee:** `clinical.db` (patients, measurements)
- **Logica:** FFMI limite = 23.7 (M) / 18.9 (F), BF esencial = 6% (M) / 14% (F)
- **Respuesta:** `{datos_actuales, objetivos_geneticos, cambios_necesarios, tiempo_estimado}`

#### GET `/users/<user_id>/goals/auto-roadmap`
Genera roadmap multi-fase de corte/volumen hasta el limite genetico.

- **Auth:** `@require_auth` (owner, admin, o profesional asignado)
- **DB Lee:** `clinical.db` (patients, measurements)
- **Fases:**
  1. Cortes iniciales (75% grasa / 25% musculo)
  2. Ciclos volumen/corte (50/50 gain, 75/25 loss)
  3. Corte elite (si FFMI >= 95% del limite)
- **Respuesta:** `{datos_actuales, objetivos_geneticos, cambios_necesarios, tiempo_estimado, objetivos_parciales: [{tipo, bf_objetivo, ffmi_objetivo, peso_objetivo, fase, tiempo_meses}]}`

### Relacion con otros modulos

| Modulo | Relacion |
|---|---|
| **Analytics** | Usa measurements para dashboard y scores |
| **Nutrition** | `nutrition_plans` asociados al patient_id |
| **Check-in** | Health Index usa measurements y patients |
| **Assignments** | `@require_owner_or_admin` verifica relacion especialista-paciente |

---

## 3. NUTRITION (`/api/v3/nutrition/`)

El modulo mas grande (3233 lineas). Maneja planes nutricionales, alimentos, recetas, solver PuLP, bloques, y registro diario.

### Flujo de trabajo principal

```
Auto-calculate plan → Guardar plan → Configurar comidas (save-config)
       ↓                    ↓                    ↓
  TDEE - deficit     calorias, P/G/CH      distribucion %
       ↓                    ↓                    ↓
  Opciones velocidad   Plan activo         Bloques por comida
                            ↓                    ↓
                     Solve-meal (PuLP)    Ajustar bloques
                            ↓
                   Porciones optimizadas
                            ↓
                    Daily Log (registro)
```

### Seccion 1: Planes Nutricionales

#### GET `/nutrition/plans`
Plan(es) nutricional(es) del usuario.

- **Auth:** `@require_auth`
- **Params:** `all=true` (admin: todos los planes)
- **DB Lee:** `clinical.db` (nutrition_plans + patients)
- **Respuesta:** `{plans: [{calorias, proteina, grasa, carbohidratos, libertad, estrategia, desayuno_p/g/c, almuerzo_p/g/c, ...}], total}`

#### POST `/nutrition/plans`
Crea plan nutricional.

- **Auth:** `@require_auth`
- **Body:** `{calorias, proteina, grasa, ch, factor_actividad, velocidad_cambio, deficit_calorico, nombre_apellido? (admin)}`
- **DB Escribe:** `clinical.db` (nutrition_plans)

#### PUT `/nutrition/plans/<plan_id>`
Actualiza plan (macros, distribucion por comida, libertad).

- **Auth:** `@require_auth`
- **Body:** Campos actualizables: `calorias`, `proteina`, `grasa`, `ch`, `libertad`, `dp/dg/dc`, `mmp/mmg/mmc`, etc.
- **DB Escribe:** `clinical.db` (nutrition_plans)

#### DELETE `/nutrition/plans/<plan_id>`
Elimina plan.

- **Auth:** `@require_auth`
- **DB Escribe:** `clinical.db` (nutrition_plans)

#### POST `/nutrition/plans/<plan_id>/adjust-calories`
Ajusta calorias y recalcula macros manteniendo proporciones.

- **Auth:** `@require_auth`
- **Body:** `{ajuste: +100 o -200}` (kcal)
- **Logica:** Proteina = 2.513244 * peso_magro, Grasa = 30% nuevas cal / 9, CH = resto
- **DB Lee:** `clinical.db` (measurements para peso actual)
- **DB Escribe:** `clinical.db` (nutrition_plans)
- **Respuesta:** `{ajuste_aplicado, datos_nuevos: {calorias, proteina, grasa, carbohidratos}}`

#### POST `/nutrition/plans/auto-calculate`
Calcula plan automatico basado en composicion corporal y objetivos.

- **Auth:** `@require_auth`
- **Body:** `{factor_actividad? (default 1.55), nombre_apellido? (admin/doctor)}`
- **DB Lee:** `clinical.db` (measurements, patients, goals)
- **Calculos:**
  - TMB Katch-McArdle: `370 + (9.8 * peso_magro_lbs)`
  - TDEE = TMB * factor
  - 3 opciones de velocidad (conservadora, moderada, agresiva) con deficit/superavit
  - Macros: P = 2.513244 * PM, G = 30%, CH = resto
  - Disponibilidad Energetica (EA) por sexo
- **Respuesta:**
  ```json
  {
    "datos_actuales": {peso, peso_magro, bf, ffmi},
    "objetivo": {peso, bf, ffmi},
    "tipo_objetivo": "perdida|ganancia|mantenimiento",
    "tdee_mantenimiento": 2100,
    "opciones_velocidad": [
      {
        "nombre": "Moderada",
        "calorias": 1744,
        "deficit_diario": 368,
        "macros": {P_g: 135, G_g: 58, C_g: 170},
        "disponibilidad_energetica": {ea_valor: 26.8, ea_status: "..."}
      }
    ]
  }
  ```

---

### Seccion 2: Alimentos

#### GET `/nutrition/foods`
Busca alimentos en el catalogo legacy.

- **Auth:** `@require_auth`
- **Params:** `q` (busqueda por nombre), `page`, `per_page` (default 50)
- **DB Lee:** `Basededatos` (ALIMENTOS)
- **Respuesta:** Array con `{ID, Largadescripcion, P, G, CH, F, Gramo1, Gramo2, Medidacasera1, Medidacasera2}`

#### GET `/nutrition/foods/<food_id>`
Detalle de un alimento.

- **DB Lee:** `Basededatos` (ALIMENTOS)

#### GET `/nutrition/foods/<food_id>/portions`
Porciones disponibles (medida casera 1 y 2 con gramos).

- **DB Lee:** `Basededatos` (ALIMENTOS)
- **Respuesta:** `{food_name, portions: [{nombre, gramos}]}`

#### GET `/nutrition/food-groups`
Grupos de alimentos con bloques calculados.

- **Params:** `macro=P|G|C` (filtro opcional)
- **DB Lee:** `Basededatos` (GRUPOSALIMENTOS)
- **Logica:** Bloques: P=20g, G=10g, C=25g
- **Respuesta:** `{food_groups: [{categoria, descripcion, porcion_gramos, macros_100g, bloques_porcion, macro_dominante}]}`

#### GET `/nutrition/food-groups/catalog`
Catalogo completo de alimentos para el constructor de bloques.

- **Params:** `macro=P|G|C`, `momento=desayuno|almuerzo|...`
- **Logica:** Llama a `functions.obtener_catalogo_alimentos_bloques()`
- **Respuesta:** `{alimentos: [{categoria, descripcion, porcion_gramos, bloques_unitarios, macro_dominante, momentos}]}`

---

### Seccion 3: Recetas (Modelo Relacional)

Recetas con ingredientes que tienen roles: `base` (variable libre), `dependiente` (ratio respecto a base), `fijo` (cantidad fija).

#### GET `/nutrition/recipes`
Lista recetas con busqueda.

- **Params:** `q`, `categoria`, `page`, `per_page`
- **DB Lee:** `clinical.db` (recipes, recipe_ingredients COUNT)

#### GET `/nutrition/recipes/<recipe_id>`
Detalle con ingredientes enriquecidos (macros de ALIMENTOS).

- **DB Lee:** `clinical.db` (recipes, recipe_ingredients) + `Basededatos` (ALIMENTOS)
- **Respuesta:**
  ```json
  {
    "recipe": {
      "id": 1, "nombre": "Avena con Huevo",
      "ingredientes": [
        {
          "alimento_nombre": "Avena", "alimento_id": 5,
          "rol": "base", "medida_tipo": 0,
          "proteina_100g": 12.5, "grasa_100g": 6.9, "carbohidratos_100g": 66.3
        },
        {
          "alimento_nombre": "Huevo", "alimento_id": 10,
          "rol": "dependiente", "base_ingredient_id": 1,
          "ratio": 0.5, "tipo_ratio": "peso"
        }
      ]
    }
  }
  ```

#### POST `/nutrition/recipes/<recipe_id>/calculate`
Calcula porciones optimas usando el solver PuLP.

- **Body:** `{proteina?, grasa?, carbohidratos?, libertad?}` (si vacio, usa plan del paciente)
- **DB Lee:** `clinical.db` (recipes, recipe_ingredients, nutrition_plans) + `Basededatos` (ALIMENTOS)
- **Logica:** Llama a `functions.solve_meal()`
- **Respuesta:** `{recipe_id, recipe_name, calculation: {status, metodo, calidad, alimentos, totales}}`

#### POST `/nutrition/recipes`
Crea receta con ingredientes.

- **Body:** `{nombre, categoria?, palabras_clave?, ingredientes: [{alimento_nombre, alimento_id, rol, medida_tipo, base_index?, ratio?, tipo_ratio?, cantidad_fija?}]}`
- **Validacion:** Minimo 2 ingredientes
- **DB Escribe:** `clinical.db` (recipes, recipe_ingredients — insert en dos pasadas para dependencias)

#### PUT `/nutrition/recipes/<recipe_id>`
Actualiza receta (reemplaza ingredientes si se envian).

- **DB Escribe:** `clinical.db` (recipes + DELETE/INSERT recipe_ingredients)

#### DELETE `/nutrition/recipes/<recipe_id>`
Elimina receta (cascade elimina ingredientes).

- **DB Escribe:** `clinical.db` (recipes)

---

### Seccion 4: Solve Meal (Optimizador Generico)

#### POST `/nutrition/solve-meal`
Optimiza porciones de alimentos y/o recetas para cumplir macros objetivo.

- **Body:**
  ```json
  {
    "objetivo": {"proteina": 44.2, "grasa": 12.7, "carbohidratos": 73.2},
    "libertad": 5,
    "meal_key": "almuerzo",
    "alimentos": [
      {"id": "183", "nombre": "Aceite de coco", "proteina_100g": 0, "grasa_100g": 100, "carbohidratos_100g": 0}
    ],
    "recetas": [{"recipe_id": 5}]
  }
  ```
- **Logica:**
  1. Si no hay `objetivo`, usa el plan del paciente (global o per-meal via `meal_key`)
  2. Expande recetas en ingredientes individuales con dependencias
  3. Llama a `functions.solve_meal()` — cascada PuLP: Completo → Proteinas → Calorias
- **DB Lee:** `clinical.db` (nutrition_plans, recipes, recipe_ingredients) + `Basededatos` (ALIMENTOS)
- **Respuesta:**
  ```json
  {
    "status": "optimo",
    "metodo": "Completo",
    "calidad": 95.2,
    "alimentos": [
      {"id": "5", "nombre": "Avena", "porciones": 1.5, "total_gramos": 150, "P": 18.7, "G": 10.3, "CH": 99.5, "rol": "base"}
    ],
    "totales": {"proteina": 44.0, "grasa": 12.8, "carbohidratos": 72.9, "calorias": 583}
  }
  ```

---

### Seccion 5: Meal Plans y Bloques

#### GET `/nutrition/meal-plans`
Planes alimentarios activos del usuario.

- **DB Lee:** `clinical.db` (meal_plans WHERE activo=1)

#### POST `/nutrition/meal-plans`
Crea plan alimentario (desactiva anteriores).

- **Body:** `{tipo: "recetas", comidas: {desayuno: [recipe_id, ...], almuerzo: [...]}}`
- **DB Escribe:** `clinical.db` (meal_plans)

#### GET `/nutrition/meal-plans/blocks`
Distribucion de macros por comida (porcentajes y gramos).

- **DB Lee:** `clinical.db` (nutrition_plans)
- **Respuesta:**
  ```json
  {
    "blocks": {
      "calorias": 1744, "proteina_total": 135.6,
      "comidas": {
        "desayuno": {"porcentajes": {"P": 0.245, "G": 0.329, "C": 0.162}, "gramos": {"P": 33.2, "G": 19.1, "C": 27.5}},
        "almuerzo": {"porcentajes": {...}, "gramos": {...}}
      }
    }
  }
  ```

#### POST `/nutrition/meal-plans/save-config`
Configura tamano de comidas y distribucion basada en entrenamiento.

- **Body:**
  ```json
  {
    "comidas": {
      "desayuno": {"enabled": true, "size": "medium"},
      "media_manana": {"enabled": false},
      "almuerzo": {"enabled": true, "size": "large"}
    },
    "entreno": "almuerzo"
  }
  ```
- **Coeficientes de tamano:** extra_small=0.5, small=0.75, medium=1.0, large=1.33, extra_large=2.0
- **Logica de entrenamiento:**
  - Comida de entreno + siguiente: CH x2
  - Resto: G x2
  - Normaliza cada macro para que sumen 1.0
- **DB Escribe:** `clinical.db` (nutrition_plans — 18 columnas de distribucion)

#### GET `/nutrition/meal-plans/<plan_id>/calculate`
Calcula todas las recetas del plan con el solver.

- **DB Lee:** `clinical.db` (meal_plans, nutrition_plans, recipe_ingredients) + `Basededatos` (ALIMENTOS)
- **Respuesta:** `{plan_id, calculations: {desayuno: {macros_comida, recetas: [{recipe_id, calculation}]}}}`

#### GET `/nutrition/meal-plans/<plan_id>/shopping-list`
Lista de compras agregada de todas las recetas.

- **Respuesta:** `{shopping_list: [{ingrediente, cantidad_g, en_recetas}]}`

---

#### POST `/nutrition/meal-plans/blocks/adjust`
Ajusta bloques de una comida dentro del margen de libertad.

- **Body:** `{comida: "almuerzo", ajustes: {proteina: +1, grasa: -1, carbohidratos: 0}}` (bloques: P=20g, G=10g, C=25g)
- **DB Escribe:** `clinical.db` (nutrition_plans, block_adjustments_log)

#### GET `/nutrition/meal-plans/blocks/suggestions`
Sugerencias: presets globales, favoritos del usuario, ajustes recientes.

- **Params:** `comida=desayuno` (opcional)
- **DB Lee:** `clinical.db` (block_presets, block_favorites, block_adjustments_log)

#### POST/PATCH/DELETE `/nutrition/meal-plans/blocks/favorites[/<fav_id>]`
CRUD de combinaciones favoritas de bloques.

- **DB:** `clinical.db` (block_favorites)

#### POST `/nutrition/meal-plans/blocks/constructor`
Construye combinacion desde catalogo y guarda como favorito.

- **Body:** `{comida, alimentos: [{categoria, descripcion, porciones}], alias}`
- **DB Escribe:** `clinical.db` (block_favorites)

#### GET `/nutrition/meal-plans/library`
Biblioteca de presets de bloques.

- **DB Lee:** `clinical.db` (block_presets)

#### POST/DELETE `/nutrition/meal-plans/library/<preset_id>/favorite`
Copia preset a favoritos / elimina.

---

### Seccion 6: Daily Log (Registro Diario)

#### POST `/nutrition/daily-log`
Guarda registro diario de comidas. UPSERT por (patient_id, fecha, meal_key).

- **Body:**
  ```json
  {
    "fecha": "2025-10-06",
    "meals": [
      {
        "meal_key": "almuerzo",
        "foods_json": [{"nombre": "Arroz", "gramos": 200, "P": 5.2, "G": 0.4, "CH": 56}],
        "completed": true,
        "total_p": 44.2, "total_g": 12.7, "total_c": 73.2, "total_cal": 584,
        "target_p": 44.0, "target_g": 13.0, "target_c": 73.0
      }
    ]
  }
  ```
- **Calculo:** meal_score = ponderado P:40% + G:30% + C:30% (cobertura vs target)
- **DB Escribe:** `clinical.db` (nutrition_daily_logs UPSERT, nutrition_daily_summary computed)
- **Respuesta:** `{fecha, meals_saved, meals: [{meal_key, completed, meal_score}], summary}`

#### GET `/nutrition/daily-log`
Lee registro de un dia.

- **Params:** `fecha=YYYY-MM-DD` (default hoy), `nombre_apellido?` (admin)
- **DB Lee:** `clinical.db` (nutrition_daily_logs, nutrition_daily_summary)

#### GET `/nutrition/daily-log/history`
Historial de resumenes diarios.

- **Params:** `days=30` (lookback)
- **Respuesta:** `{summaries: [...], total_days, average_score, streak}`

### Relacion con otros modulos

| Modulo | Relacion |
|---|---|
| **Users** | `nutrition_plans` ligados a `patients.id` |
| **Analytics** | Dashboard muestra plan_nutricional activo |
| **Check-in** | Health Index no usa nutricion directamente (futuro) |
| **Training** | El solver no depende de training, pero `save-config` usa `entreno` para redistribuir CH |

---

## 4. TRAINING (`/api/v3/training/`)

Tests de fuerza, levantamientos, planes de entrenamiento, sesiones, y optimizador PuLP.

### Flujo de trabajo

```
Strength Test → 1RM (Epley) → Standards comparison
       ↓
Training Optimizer (PuLP) → Plan por dias → Sesiones diarias
       ↓                                         ↓
  Prioriza debilidades                   Advance dia / Log session
```

### Endpoints

#### GET/POST `/training/strength`
Lee ultimo test o crea nuevo.

- **POST Body:** `{ejercicios: {squat: {peso, reps}, bench: {peso, reps}, ...}, peso_corporal}`
- **Calculo 1RM:** Epley: `1RM = peso * (1 + reps/30)`
- **DB:** `clinical.db` (strength_tests)

#### GET `/training/strength/history`
Historial de tests. Params: `limit` (default 20), `user` (admin).

#### DELETE `/training/strength/<record_id>`
Elimina test. Solo admin.

#### GET `/training/strength/standards`
Estandares por ejercicio y nivel (beginner → elite). Publico, sin auth.

- **Respuesta:** `{standards: {squat: {beginner: 0.75, ..., elite: 2.5}, bench: {...}, ...}}`

---

#### GET/POST `/training/lifts`
Estado actual de ejercicios del usuario. POST = UPSERT.

- **POST Body:** `{ejercicio, peso, reps, rpe}`
- **DB:** `Basededatos` (ESTADO_EJERCICIO_USUARIO)

#### GET `/training/exercises`
Lista hardcoded de 14 ejercicios con categorias. Sin DB.

---

#### GET `/training/plans`
Planes de entrenamiento del usuario.

- **DB Lee:** `Basededatos` (PLANES_ENTRENAMIENTO)

#### GET `/training/plans/<plan_id>`
Detalle de plan.

#### POST `/training/plans/<plan_id>/optimize`
Placeholder — redirige al sistema legacy.

---

#### GET `/training/sessions/current`
Sesion actual (dia actual del plan activo).

- **DB Lee:** `Basededatos` (PLANES_ENTRENAMIENTO WHERE active=1)

#### POST `/training/sessions`
Registra sesion completada.

- **Body:** `{plan_id, ejercicios_completados, duracion_minutos, notas}`
- **DB Escribe:** `Basededatos` (SESIONES_ENTRENAMIENTO)

#### POST `/training/sessions/advance`
Avanza al siguiente dia del plan (ciclico).

- **DB Escribe:** `Basededatos` (PLANES_ENTRENAMIENTO UPDATE current_dia)

#### GET `/training/sessions/history`
Historial de sesiones. Params: `limit` (default 20).

#### GET `/training/sessions/today`
Ejercicios de hoy + flag si ya se registro sesion.

---

#### GET `/training/programs`
Programas gratuitos predefinidos (8 programas). Publico.

#### GET `/training/programs/<program_id>`
Detalle de programa. Solo `30-dias-principiantes` esta implementado completo.

---

#### POST `/training/strength/submit`
Guarda analisis de fuerza completo. Llama a `functions.guardar_historia_levantamiento_completa()`.

- **Body:** `{rawData, calculatedData, bodySvg?, selectedPatient? (admin), customAnalysisDate?}`
- **DB Escribe:** via functions.py

#### GET `/training/strength/admin`
Todos los registros de fuerza de todos los usuarios. Solo admin.

#### POST `/training/strength/<record_id>/optimize`
Optimizador PuLP para distribucion de entrenamiento.

- **Body:** `{numeroDias, numeroEjercicios, runningConfig?}`
- **Logica:**
  1. Lee scores por categoria (squat, floorPull, horizontalPress, verticalPress, pullup)
  2. Distribucion inversamente proporcional a debilidad
  3. PuLP optimiza split por dias
- **DB Lee:** `Basededatos` (FUERZA)
- **Respuesta:** `{relativeData, optimizationResults: {categorias, ejercicios, planEntrenamiento: {dia_1: [...], dia_2: [...]}}}`

### Relacion con otros modulos

| Modulo | Relacion |
|---|---|
| **Engagement** | Lee SESIONES_ENTRENAMIENTO y FUERZA para insights y performance |
| **Nutrition** | `save-config` usa campo `entreno` para redistribuir CH post-entrenamiento |
| **Analytics** | No usa training directamente |

---

## 5. ANALYTICS (`/api/v3/analytics/`)

Dashboard, resumenes, historial de composicion corporal, y calculadoras de salud.

### Flujo de trabajo

```
measurements (Users) → Dashboard (scores, deltas, historial, categorias)
                     → Body Matrix (cuadrante FFMI vs BF)
                     → Performance Clock (tasas de cambio por periodo)
                     → Analisis Completo (comparacion periodos)
```

### Endpoints con Auth

#### GET `/analytics/dashboard`
Dashboard completo del paciente. **Endpoint mas rico del sistema.**

- **Params:** `user` (ID/DNI/nombre), `patient_id` (clinical.db ID directo)
- **DB Lee:** `clinical.db` (patients, measurements, nutrition_plans, goals) via `get_patient_data_legacy()`
- **Respuesta:**
  ```json
  {
    "user": "Toffaletti, Diego Alejandro",
    "composicion_corporal": {peso, bf_percent, ffmi, peso_magro, peso_graso, imc, abdomen, ...},
    "scores": {score_ffmi: 39, score_bf: 34, score_total: 36, categoria_ffmi, categoria_bf},
    "categorias": {bf_categoria, abdomen_riesgo, ...},
    "body_matrix": {bf_band, ffmi_band, categoria, ...},
    "agua_recomendada_litros": 2.7,
    "deltas": {deltapeso_g, deltabf_pct, deltaffmi_pct, ...},
    "historial": {imc: [...], ffmi: [...], bf: [...]},
    "tasas": {fatrate, leanrate},
    "performance_clock": {all, month, quarter, ...},
    "analisis_completo": {comparacion_periodos, evaluacion, ...},
    "plan_nutricional": {calorias, proteina, grasa, ch, ...},
    "objetivo": {bf_objetivo, ffmi_objetivo, peso_objetivo, ...},
    "metadata": {sexo, edad, altura, total_registros, nivel_actividad}
  }
  ```
- **Acceso:** Owner, admin, o profesional asignado

#### GET `/analytics/summary`
Resumen rapido: ultima medicion + plan actual.

- **Respuesta:** `{ultima_medicion: {PESO, BF, IMMC, FECHA_REGISTRO}, plan_actual: {CALORIAS, PROTEINA, GRASA, CH}}`

#### GET `/analytics/body-composition`
Ultima medicion con todos los campos.

#### GET `/analytics/body-composition/history`
Historial paginado con filtro de fechas.

- **Params:** `limit` (30), `desde`, `hasta`, `patient_id`
- **Fallback:** `Basededatos` PERFILDINAMICO si clinical.db no tiene datos

#### GET `/analytics/scores`
Scores FFMI y BF con categorias descriptivas.

- **Respuesta:** `{score_bf, score_ffmi, score_total, categoria_bf, categoria_ffmi, descripciones}`

### Calculadoras (Publicas, sin Auth)

| Endpoint | Metodo | Descripcion | Formula |
|---|---|---|---|
| `/analytics/calculators/bmr` | POST | Tasa metabolica basal | Katch-McArdle, Mifflin-St Jeor, Harris-Benedict |
| `/analytics/calculators/tdee` | POST | Gasto energetico total | BMR * factor_actividad |
| `/analytics/calculators/body-fat` | POST | % grasa corporal | Navy Method |
| `/analytics/calculators/ffmi` | POST | Indice de masa libre de grasa | peso_magro / alt_m² + 6.1*(1.8-alt_m) |
| `/analytics/calculators/weight-loss` | POST | Plan de perdida de peso | deficit = velocidad * 7700 / 7 |
| `/analytics/calculators/muscle-gain` | POST | Plan de ganancia muscular | superavit = velocidad * 7700 / 7 |

### Relacion con otros modulos

| Modulo | Relacion |
|---|---|
| **Users** | Usa measurements y patients como fuente de datos |
| **Nutrition** | Muestra plan_nutricional en dashboard |
| **Check-in** | Health Index usa scores de measurements |
| **Engagement** | Performance compara con datos de composicion |

---

## 6. ADMIN (`/api/v3/admin/`)

Administracion del sistema. **Todos los endpoints requieren `@require_admin`.**

### Endpoints

#### Estadisticas
| Endpoint | Descripcion | DB |
|---|---|---|
| `GET /admin/stats` | KPIs del sistema (pacientes, planes, recetas) | clinical.db, telemedicina.db |
| `GET /admin/dashboard-stats` | Conteo de usuarios por rol/estado | auth.db |

#### Gestion de Usuarios Auth
| Endpoint | Descripcion | DB |
|---|---|---|
| `GET /admin/auth-users` | Lista usuarios auth con roles. Params: `q`, `status` | auth.db |
| `GET /admin/pending-users` | Usuarios pendientes de aprobacion | auth.db |
| `POST /admin/auth-users/<id>/approve` | Aprueba usuario pending | auth.db + audit_log |
| `POST /admin/auth-users/<id>/reject` | Rechaza usuario | auth.db + audit_log |
| `POST /admin/auth-users/<id>/toggle-active` | Activa/desactiva usuario | auth.db + audit_log |
| `POST /admin/auth-users/<id>/role` | Toggle rol. Body: `{role}` | auth.db + audit_log |
| `DELETE /admin/auth-users/<id>` | Elimina usuario y links | auth.db |

#### Gestion de Pacientes
| Endpoint | Descripcion | DB |
|---|---|---|
| `GET /admin/users` | Lista pacientes. Params: `q`, `page`, `order_by` | clinical.db |
| `GET /admin/users/<id>` | Detalle con mediciones, plan, objetivo | clinical.db |
| `GET /admin/users/search` | Busqueda rapida. Params: `q`, `limit` | clinical.db |

#### Base de Datos
| Endpoint | Descripcion | DB |
|---|---|---|
| `GET /admin/database/tables` | Lista tablas con row counts | Todas |
| `GET /admin/database/tables/<name>` | Datos paginados. Params: `database` | Todas |
| `PUT /admin/database/tables/<name>/<id>` | Edita celda. Body: `{column, value}` | Todas |
| `GET /admin/database/export/<name>` | Export JSON completo | Todas |

#### Auditoria
| Endpoint | Descripcion |
|---|---|
| `GET /admin/audit` | Ultimas entradas de audit_log. Params: `limit` |

### Relacion con otros modulos

Admin es el unico modulo que lee/escribe en TODAS las bases de datos. No tiene dependencias de otros modulos pero es consumido por el flujo de registro (`auth/register` → admin aprueba).

---

## 7. ASSIGNMENTS (`/api/v3/assignments/`)

Relaciones especialista-paciente.

### Flujo de trabajo

```
Especialista POST /request {patient_dni}
  → status: pending_patient
    → Paciente GET /pending
      → POST /<id>/accept   → status: accepted  → Especialista ve en /my-patients
      → POST /<id>/reject   → status: rejected
  → Especialista POST /<id>/cancel  → status: cancelled
```

### Endpoints

| Endpoint | Metodo | Actor | Descripcion |
|---|---|---|---|
| `/assignments/request` | POST | Especialista | Solicita asignacion por DNI |
| `/assignments/my-requests` | GET | Especialista | Mis solicitudes enviadas |
| `/assignments/pending` | GET | Paciente | Solicitudes pendientes de aceptar |
| `/assignments/<id>/accept` | POST | Paciente | Acepta especialista |
| `/assignments/<id>/reject` | POST | Paciente | Rechaza especialista |
| `/assignments/my-specialists` | GET | Paciente | Mis especialistas aceptados |
| `/assignments/my-patients` | GET | Especialista | Mis pacientes aceptados |
| `/assignments/<id>/cancel` | POST | Especialista/Admin | Cancela asignacion |
| `/assignments/unassign-patient/<patient_id>` | POST | Especialista | Desasigna paciente completo |

- **DB:** `auth.db` (specialist_assignments, users, patient_user_link, audit_log)
- **Roles requeridos:** doctor, nutricionista, o entrenador para crear solicitudes
- **`/my-patients`** hace GROUP BY patient_id y JOIN con users para email/active

### Relacion con otros modulos

| Modulo | Relacion |
|---|---|
| **Auth** | Usa users.id y patient_user_link para resolver identidades |
| **Users, Analytics, Nutrition** | `is_assigned_professional()` permite a doctores ver datos de sus pacientes sin ser admin |

---

## 8. TELEMEDICINE (`/api/v3/telemedicine/`)

Gestion clinica: citas, historia medica, signos vitales, documentos, situaciones clinicas.

### Endpoints por recurso

#### Citas (CITAS_MEDICAS)
| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/telemedicine/appointments` | GET | Lista citas. Params: `status`, `from_date`, `to_date` |
| `/telemedicine/appointments` | POST | Crea cita |
| `/telemedicine/appointments/<id>` | GET | Detalle de cita |
| `/telemedicine/appointments/<id>/status` | PATCH | Cambia estado (programada/confirmada/realizada/cancelada) |

#### Historia Medica (HISTORIA_MEDICA)
| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/telemedicine/records` | GET | Lista registros. Params: `tipo` |
| `/telemedicine/records` | POST | Crea registro medico |

#### Fichas de Paciente (TELEMED_PACIENTES)
| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/telemedicine/patients` | GET | Lista fichas. Admin ve todas |
| `/telemedicine/patients` | POST | Crea o actualiza ficha (si tiene `id` = update) |
| `/telemedicine/patients/<id>` | GET | Detalle de ficha |

#### Situaciones Clinicas (TELEMED_SITUACIONES)
| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/telemedicine/situations` | GET | Lista. Params: `paciente`, `fecha_desde/hasta`, `cie10` |
| `/telemedicine/situations` | POST | Crea/actualiza. Soporta diagnosticos CIE-10 |
| `/telemedicine/situations/<id>` | DELETE | Elimina |

#### Signos Vitales (SIGNOS_VITALES)
| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/telemedicine/vitals` | GET | Historial. Params: `limit` |
| `/telemedicine/vitals` | POST | Registra signos (PA, FC, FR, temp, SpO2, glucosa, dolor, fatiga, estres, sueno) |

#### Documentos (TELEMED_DOCUMENTOS)
| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/telemedicine/documents` | GET | Lista con busqueda full-text |
| `/telemedicine/documents` | POST | Registra documento (Google Drive metadata) |
| `/telemedicine/documents/<id>` | PUT | Actualiza metadata |
| `/telemedicine/documents/<id>` | DELETE | Elimina |

#### Prevencion y Performance
| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/telemedicine/prevention` | GET/POST | Programas de prevencion |
| `/telemedicine/body-measurements` | GET/POST | Medidas corporales |
| `/telemedicine/performance/speed` | GET/POST | Tests de velocidad |
| `/telemedicine/performance/flexibility` | GET/POST | Tests de flexibilidad |
| `/telemedicine/performance/mobility` | GET/POST | Tests de movilidad |
| `/telemedicine/performance/endurance` | GET/POST | Tests de resistencia |

#### Templates (PLANTILLAS)
| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/telemedicine/templates` | GET/POST | CRUD de plantillas del doctor |
| `/telemedicine/templates/<id>` | PUT/DELETE | Actualizar/eliminar plantilla |

- **DB:** Exclusivamente `telemedicina.db`
- **No depende de otros modulos** (aislado)

---

## 9. ENGAGEMENT (`/api/v3/engagement/`)

Gamificacion: recordatorios, tareas, insights automaticos, score de engagement.

### Endpoints

#### Recordatorios (RECORDATORIOS)
| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/engagement/reminders` | GET | Lista. Params: `status` (pending/completed/all) |
| `/engagement/reminders` | POST | Crea recordatorio |
| `/engagement/reminders/<id>/complete` | PATCH | Marca completado |
| `/engagement/reminders/<id>` | DELETE | Elimina |

#### Tareas (TAREAS)
| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/engagement/tasks` | GET | Lista. Params: `status`, `category` |
| `/engagement/tasks` | POST | Crea tarea |
| `/engagement/tasks/<id>` | PATCH | Actualiza (estado, progreso) |
| `/engagement/tasks/<id>` | DELETE | Elimina |

#### GET `/engagement/insights`
Genera insights personalizados automaticos analizando:

1. **Composicion corporal** (PERFILDINAMICO): detecta perdida de grasa, ganancia muscular
2. **Edad del plan nutricional** (DIETA): sugiere actualizar si >60 dias
3. **Actividad de entrenamiento** (SESIONES_ENTRENAMIENTO): premia consistencia ultimos 7 dias
4. **Hidratacion:** recomendacion 35ml/kg
5. **Recordatorios pendientes**

- **DB Lee:** `Basededatos` (PERFILDINAMICO, DIETA, SESIONES_ENTRENAMIENTO, RECORDATORIOS)
- **Respuesta:** `{insights: [{tipo, icono, titulo, mensaje, prioridad}]}`

#### GET `/engagement/performance`
Score de engagement semanal/mensual/trimestral.

- **Params:** `period` (week/month/quarter)
- **Componentes del score (0-100):**
  - Training sessions: min(sessions * 10, 40)
  - Tasks completadas: min(completed * 5, 20)
  - Reminders completados: min(completed * 5, 15)
  - Mediciones: count * 10
  - Strength tests: count * 5
- **DB Lee:** `Basededatos` (SESIONES_ENTRENAMIENTO, TAREAS, RECORDATORIOS, PERFILDINAMICO, FUERZA)

### Relacion con otros modulos

| Modulo | Relacion |
|---|---|
| **Training** | Lee SESIONES_ENTRENAMIENTO y FUERZA |
| **Nutrition** | Lee DIETA para insight de edad del plan |
| **Users** | Lee PERFILDINAMICO para insights de composicion |

---

## 10. CHECKIN (`/api/v3/checkin/`)

Check-in diario de salud + Health Index compuesto.

### Flujo de trabajo

```
POST /checkin/today (diario)
  → daily_checkins (UPSERT)
  → Auto-recalcula Health Index
       ↓
  health_index_history
       ↓
  GET /checkin/health-index (score 0-100)
  GET /checkin/health-index/trend (evolucion)
```

### Endpoints

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/checkin/today` | GET | Check-in de hoy (o null) |
| `/checkin/today` | POST | Crea/actualiza check-in de hoy |
| `/checkin/history` | GET | Historial. Params: `limit` (14), `desde` |
| `/checkin/stats` | GET | Promedios de 7 dias |
| `/checkin/symptoms` | POST | Registra sintoma por sistema |
| `/checkin/symptoms` | GET | Sintomas recientes. Params: `days` (7) |
| `/checkin/health-index` | GET | Score de hoy |
| `/checkin/health-index/trend` | GET | Tendencia. Params: `days` (30) |

### Campos del Check-in

```json
{
  "fumo": bool, "alcohol": "no|poco|moderado|mucho",
  "actividad_fisica": bool, "actividad_tipo": str, "actividad_minutos": int,
  "horas_sueno": float, "calidad_sueno": 1-10, "estres": 1-10,
  "energia": 1-10, "animo": 1-10,
  "deposicion": bool, "deposicion_veces": int, "bristol": 1-7,
  "dolor_abdominal": bool, "sangre_moco": bool,
  "hidratacion_litros": float, "hambre_ansiedad": bool,
  "tomo_medicacion": bool, "medicacion_detalle": str
}
```

### Sistemas de Sintomas

Validos: `respiratorio`, `orl`, `cardiologico`, `genitourinario`, `musculoesqueletico`, `neurologico`, `piel`, `temperatura`

### Health Index — Algoritmo (0-100)

| Componente | Peso | Fuente | Calculo |
|---|---|---|---|
| Composicion corporal | 35% | measurements (score_ffmi, score_bf) | Promedio de ambos scores |
| Perimetro cintura | 20% | measurements (circ_cintura o circ_abdomen) | WHO: M<94cm=100, F<80cm=100, decay lineal |
| Actividad fisica | 15% | daily_checkins (ultimos 7 dias) | % dias activos * 100 |
| Sueno | 10% | daily_checkins (calidad_sueno) | avg * 10 (cap 100) |
| Recuperacion mental | 10% | daily_checkins (estres, energia, animo) | (10-estres + energia + animo) / 30 * 100 |
| Digestivo | 5% | daily_checkins | 100 - (red_flags * 30). Flags: sangre_moco(+2), dolor_abd(+1), bristol extremo(+1) |
| Habitos | 5% | daily_checkins | 100 - fumo(50) - alcohol(10-50) |

- **DB:** `clinical.db` (daily_checkins, symptom_events, health_index_history, measurements, patients)

### Relacion con otros modulos

| Modulo | Relacion |
|---|---|
| **Users** | Usa measurements para scores de composicion corporal y perimetro cintura |
| **Auth** | `resolve_patient_id()` para identidad |

---

## Mapa de Dependencias

### Por Base de Datos

```
src/Basededatos (legacy)
  ├── Auth (/me lee PERFILESTATICO, PERFILDINAMICO)
  ├── Nutrition (ALIMENTOS, GRUPOSALIMENTOS)
  ├── Training (PLANES_ENTRENAMIENTO, SESIONES_ENTRENAMIENTO, FUERZA, ESTADO_EJERCICIO_USUARIO)
  ├── Analytics (fallback PERFILDINAMICO)
  ├── Engagement (PERFILDINAMICO, DIETA, SESIONES_ENTRENAMIENTO, FUERZA, RECORDATORIOS, TAREAS)
  └── Admin (lectura completa)

auth.db
  ├── Auth (users, patient_user_link, audit_log)
  ├── Assignments (specialist_assignments)
  └── Admin (gestion de usuarios)

clinical.db (v3)
  ├── Users (patients, measurements, goals)
  ├── Nutrition (nutrition_plans, recipes, recipe_ingredients, meal_plans, block_*, nutrition_daily_*)
  ├── Training (strength_tests)
  ├── Analytics (patients, measurements, goals, nutrition_plans)
  ├── Checkin (daily_checkins, symptom_events, health_index_history)
  └── Admin (lectura completa)

telemedicina.db
  ├── Telemedicine (CITAS_MEDICAS, HISTORIA_MEDICA, TELEMED_*, SIGNOS_VITALES, PROGRAMAS_PREVENCION, PLANTILLAS)
  └── Admin (stats)
```

### Por Modulo

```
Auth ──────→ Todos los modulos (JWT)
             Admin (approve/reject)

Users ─────→ Analytics (measurements → dashboard)
             Nutrition (patients → plans)
             Checkin (measurements → health index)

Nutrition ──→ Analytics (plan en dashboard)
              solve_meal() ← functions.py

Training ───→ Engagement (sessions, fuerza → insights, performance)
              optimize() ← workout_optimizer.py, functions.py

Assignments → Users, Analytics, Nutrition (is_assigned_professional check)

Telemedicine → (aislado, sin dependencias cruzadas)

Engagement ──→ Training, Nutrition, Users (lee datos para insights)

Checkin ─────→ Users (measurements para health index)
```

### Funciones Externas Clave

| Funcion | Archivo | Usada por |
|---|---|---|
| `solve_meal()` | `src/functions.py` | Nutrition (solve-meal, recipe/calculate, meal-plan/calculate) |
| `obtener_catalogo_alimentos_bloques()` | `src/functions.py` | Nutrition (food-groups/catalog, blocks/constructor) |
| `guardar_historia_levantamiento_completa()` | `src/functions.py` | Training (strength/submit) |
| `get_all_strength_data_admin()` | `src/functions.py` | Training (strength/admin) |
| `optimize_split()` | `src/workout_optimizer.py` | Training (strength/optimize) |
| `classify_body()` | `src/api/v3/analytics/calculations.py` | Analytics (dashboard, scores) |
| `build_performance_clock()` | `src/api/v3/analytics/calculations.py` | Analytics (dashboard) |
| `build_analisis_completo()` | `src/api/v3/analytics/calculations.py` | Analytics (dashboard) |

---

## Conteo Total de Endpoints

| Modulo | Endpoints | Lineas |
|---|---|---|
| Auth | 6 | ~300 |
| Users | 12 | ~700 |
| Nutrition | 36 | ~3200 |
| Training | 21 | ~1300 |
| Analytics | 11 | ~900 |
| Admin | 15 | ~800 |
| Assignments | 9 | ~450 |
| Telemedicine | ~25 | ~1200 |
| Engagement | 8 | ~500 |
| Checkin | 8 | ~600 |
| **Total** | **~151** | **~10000** |
