# Flujo Nutricionista - Paciente: Documentacion Completa

> Ultima actualizacion: 2026-03-29

---

## Conclusion ejecutiva

El backend del modulo de nutricion esta completo. El frontend del paciente cubre correctamente la capa de ejecucion y registro real (daily log, recetas, busqueda, scores). El unico cuello de botella relevante esta en el frontend del doctor, especificamente en `patient-nutrition.tsx`, donde el flujo de planificacion asistida no completa la secuencia `plan → distribucion por comida → solver → persistencia reutilizable`. Como resultado, la pantalla del doctor funciona como editor manual de comidas, no como planificador nutricional inteligente completo.

**Diagnostico:**
- **Backend:** completo (35 endpoints, solver, auto-calculate).
- **Paciente:** completo como capa de ejecucion (daily log, recetas, busqueda, solver, scores).
- **Doctor:** funcional para carga y planificacion manual, pero incompleto para planificacion asistida.

**Cuello de botella:** El flujo del doctor no ejecuta la secuencia completa `mediciones → objetivo → plan → distribucion por comida → solver → persistencia reutilizable`. Hoy se queda en `mediciones → objetivo → plan → carga manual de comidas`.

**Riesgo tecnico principal:** El solver puede recibir targets vacios o nulos porque el flujo del doctor no garantiza que exista distribucion por comida antes de resolver. Esto explica los fallos silenciosos.

---

## Indice

1. [Vision general del flujo](#1-vision-general-del-flujo)
2. [Paso 1: Datos del paciente](#2-paso-1-datos-del-paciente)
3. [Paso 2: Definir objetivo](#3-paso-2-definir-objetivo)
4. [Paso 3: Plan nutricional](#4-paso-3-plan-nutricional)
5. [Paso 4: Distribucion de comidas](#5-paso-4-distribucion-de-comidas)
6. [Paso 5: Recetas y Solver](#6-paso-5-recetas-y-solver)
7. [Paso 6: Registro diario del paciente](#7-paso-6-registro-diario-del-paciente)
8. [Esquema de base de datos](#8-esquema-de-base-de-datos)
9. [Algoritmos clave](#9-algoritmos-clave)
10. [Plan prescripto vs ejecucion real](#10-plan-prescripto-vs-ejecucion-real)
11. [Precondiciones del solver](#11-precondiciones-del-solver)
12. [Plan de implementacion integrado](#12-plan-de-implementacion-integrado)

---

## 1. Vision general del flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                FLUJO NUTRICIONISTA → PACIENTE                   │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │ 1. DATOS     │───→│ 2. OBJETIVO  │───→│ 3. PLAN           │  │
│  │ Mediciones   │    │ Manual/Auto  │    │ NUTRICIONAL       │  │
│  │ Composicion  │    │ FFMI, BF%    │    │ Calorias + Macros │  │
│  └──────────────┘    └──────────────┘    └────────┬──────────┘  │
│                                                    │             │
│  ┌──────────────┐    ┌──────────────┐    ┌────────▼──────────┐  │
│  │ 6. REGISTRO  │◀───│ 5. RECETAS   │◀───│ 4. DISTRIBUCION   │  │
│  │ Daily log    │    │ + SOLVER     │    │ DE COMIDAS        │  │
│  │ Score/adher. │    │ Optimizacion │    │ Tamaños + timing  │  │
│  └──────────────┘    └──────────────┘    └───────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Roles involucrados:**
- **Nutricionista (doctor):** Pasos 1-5 (carga datos, define objetivo, crea plan, arma recetas)
- **Paciente:** Paso 6 (ejecuta el plan y registra su ingesta diaria)

---

## 2. Paso 1: Datos del paciente

El nutricionista necesita mediciones corporales actualizadas para poder calcular cualquier plan.

### Endpoints

#### `GET /api/v3/analytics/body-composition`
Devuelve la composicion corporal actual del paciente.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "peso": 85.0,
    "bf_percent": 22.5,
    "ffmi": 20.1,
    "peso_magro": 65.9,
    "peso_graso": 19.1,
    "imc": 27.3
  }
}
```

#### `GET /api/v3/analytics/body-composition/history`
Historial de mediciones con deltas entre cada una.

**Query params:** `?limit=50`

**Response:** Array de mediciones ordenadas por fecha DESC, cada una con `delta_peso`, `delta_graso`, `delta_magro`, `delta_peso_dia`, etc.

#### `POST /api/v3/users/measurements`
Cargar nueva medicion corporal.

**Body:**
```json
{
  "peso": 84.5,
  "circ_abdomen": 88.0,
  "circ_cintura": 82.0,
  "circ_cadera": 100.0,
  "nombre_apellido": "Apellido, Nombre"  // solo si admin/doctor
}
```

**Campos automaticos calculados al guardar:** `bf_percent`, `imc`, `ffmi`, `peso_graso`, `peso_magro`, `score_ffmi`, `score_bf`, `body_score`, todos los deltas vs medicion anterior.

### Pantallas

| Rol | Pantalla | Archivo | Estado |
|---|---|---|---|
| Doctor | Mediciones del paciente | `app/(doctor)/patient-measures.tsx` | Implementada |
| Doctor | Analytics del paciente | `app/(doctor)/patient-analytics.tsx` | Implementada |
| Paciente | Salud (ver mediciones) | `app/(patient)/health.tsx` | Implementada |

---

## 3. Paso 2: Definir objetivo

El objetivo define hacia donde va el paciente: que composicion corporal se busca alcanzar.

### Endpoints

#### `GET /api/v3/users/goals`
Ver objetivo activo del paciente.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "goal_ffmi": 22.0,
    "goal_bf": 15.0,
    "goal_peso": 78.0,
    "goal_abdomen": 82.0,
    "goal_cintura": 78.0,
    "goal_cadera": 96.0,
    "notas": "Fase de reduccion inicial",
    "tipo": "manual",
    "activo": true
  }
}
```

#### `POST /api/v3/users/goals`
Definir objetivo manual.

**Body:**
```json
{
  "goal_ffmi": 22.0,
  "goal_bf": 15.0,
  "goal_peso": 78.0,
  "goal_abdomen": 82.0,
  "goal_cintura": 78.0,
  "goal_cadera": 96.0,
  "notas": "Objetivo definido por nutricionista",
  "nombre_apellido": "Apellido, Nombre"  // solo admin/doctor
}
```

#### `GET /api/v3/users/goals/auto`
Calculo automatico de objetivos progresivos.

**Response:** Genera una hoja de ruta con fases:

```json
{
  "success": true,
  "data": {
    "fases": [
      {
        "fase": 1,
        "tipo": "reduccion",
        "bf_inicio": 22.5,
        "bf_objetivo": 17.0,
        "ffmi_objetivo": 20.5,
        "peso_objetivo": 78.3,
        "descripcion": "Reduccion a fitness (75% grasa / 25% musculo)"
      },
      {
        "fase": 2,
        "tipo": "volumen",
        "bf_inicio": 17.0,
        "bf_objetivo": 20.0,
        "ffmi_objetivo": 22.0,
        "peso_objetivo": 82.5,
        "descripcion": "Volumen controlado (50% grasa / 50% musculo)"
      }
    ],
    "limite_genetico": {
      "ffmi_max": 25.0,
      "nota": "Limite natural masculino"
    }
  }
}
```

**Logica del auto-calculo (3 fases):**

| Fase | Ratio cambio | Descripcion |
|---|---|---|
| Fase 1: Reduccion inicial | 75% grasa / 25% musculo | Desde BF actual hasta base fitness (12% H / 20% M) |
| Fase 2: Volumen/Corte | 50/50 vol, 75/25 corte | Ciclos hasta alcanzar limite genetico FFMI |
| Fase 3: Corte elite | 75% grasa / 25% musculo | Solo si ya en limite genetico: a 6% H / 14% M |

**Limites geneticos naturales:** FFMI max 25.0 (hombres) / 21.0 (mujeres)

### Pantallas

| Rol | Pantalla | Archivo | Estado |
|---|---|---|---|
| Doctor | Objetivos del paciente | `app/(doctor)/patient-goals.tsx` | Implementada |
| Paciente | Ver objetivos | `app/(patient)/goals.tsx` | Implementada |

---

## 4. Paso 3: Plan nutricional

Con los datos y el objetivo definido, se genera el plan de calorias y macronutrientes diarios.

### Endpoints

#### `POST /api/v3/nutrition/plans/auto-calculate`
Calcula automaticamente opciones de plan basadas en mediciones + objetivo.

**Body:**
```json
{
  "factor_actividad": 1.55,
  "nombre_apellido": "Apellido, Nombre"  // solo admin/doctor
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "datos_actuales": {
      "peso": 85.0,
      "peso_magro": 65.9,
      "bf_percent": 22.5,
      "ffmi": 20.1
    },
    "objetivo": {
      "goal_ffmi": 22.0,
      "goal_bf": 15.0,
      "peso_objetivo": 78.3
    },
    "tipo_objetivo": "perdida",
    "tdee_mantenimiento": 2650,
    "cambios_necesarios": {
      "delta_peso": -6.7,
      "delta_grasa": -5.8,
      "delta_musculo": -0.9
    },
    "opciones_velocidad": [
      {
        "nombre": "Conservadora",
        "velocidad_semanal_pct": 0.25,
        "velocidad_semanal_kg": 0.21,
        "calorias": 2381,
        "deficit": 269,
        "proteina": 165.6,
        "grasa": 79.4,
        "carbohidratos": 234.8,
        "semanas_estimadas": 32,
        "disponibilidad_energetica": {
          "valor": 36.1,
          "estado": "Optima",
          "minimo_seguro": 25
        }
      },
      {
        "nombre": "Moderada",
        "velocidad_semanal_pct": 0.50,
        "calorias": 2112,
        "deficit": 538,
        "proteina": 165.6,
        "grasa": 70.3,
        "carbohidratos": 175.2,
        "semanas_estimadas": 16,
        "disponibilidad_energetica": {
          "valor": 32.0,
          "estado": "Adecuada"
        }
      },
      {
        "nombre": "Agresiva",
        "velocidad_semanal_pct": 0.75,
        "calorias": 1843,
        "deficit": 807,
        "proteina": 165.6,
        "grasa": 61.4,
        "carbohidratos": 115.6,
        "semanas_estimadas": 11,
        "disponibilidad_energetica": {
          "valor": 27.9,
          "estado": "Limite bajo"
        }
      }
    ]
  }
}
```

**Formulas clave:**
- TMB (Katch-McArdle): `370 + (9.8 x peso_magro_lbs)`
- TDEE: `TMB x factor_actividad`
- Proteina: `2.513244 x peso_magro` (constante)
- Grasa: `max(30% calorias / 9, 0.6 x peso_actual)`
- Carbohidratos: `(calorias - P*4 - G*9) / 4`
- EA: `(calorias - gasto_ejercicio) / peso_magro`

#### `POST /api/v3/nutrition/plans`
Crear plan (tras seleccionar opcion de velocidad o manual).

**Body:**
```json
{
  "calorias": 2112,
  "proteina": 165.6,
  "grasa": 70.3,
  "carbohidratos": 175.2,
  "libertad": 10,
  "factor_actividad": 1.55,
  "estrategia": "Moderada",
  "velocidad_cambio": 0.50,
  "deficit_calorico": 538,
  "disponibilidad_energetica": 32.0,
  "nombre_apellido": "Apellido, Nombre"
}
```

#### `GET /api/v3/nutrition/plans`
Listar planes del paciente. Admin puede usar `?all=true`.

#### `PUT /api/v3/nutrition/plans/<id>`
Actualizar macros o distribucion de un plan existente.

#### `POST /api/v3/nutrition/plans/<id>/adjust-calories`
Recalcular macros proporcionalmente al cambiar calorias.

**Body:**
```json
{
  "calorias": 2200
}
```

### Pantallas

| Rol | Pantalla | Archivo | Estado |
|---|---|---|---|
| Doctor | Nutricion del paciente | `app/(doctor)/patient-nutrition.tsx` | Parcial (auto-calculate + crear plan funcionan) |
| Paciente | Ver plan | `app/(patient)/plan.tsx` | Implementada |

---

## 5. Paso 4: Distribucion de comidas

Con el plan creado (calorias + macros diarios), se distribuyen entre las comidas del dia.

### Comidas disponibles

| meal_key | Nombre | Coeficiente tamaño |
|---|---|---|
| `desayuno` | Desayuno | extra_small (0.5x) a extra_large (2x) |
| `media_manana` | Media manana | idem |
| `almuerzo` | Almuerzo | idem |
| `merienda` | Merienda | idem |
| `media_tarde` | Media tarde | idem |
| `cena` | Cena | idem |

### Endpoints

#### `POST /api/v3/nutrition/meal-plans/save-config`
Configura tamaños de comida y timing de entrenamiento.

**Body:**
```json
{
  "comidas": {
    "desayuno": "medium",
    "almuerzo": "large",
    "merienda": "small",
    "cena": "medium"
  },
  "comida_entrenamiento": "almuerzo"
}
```

**Algoritmo de distribucion:**
1. Aplica coeficientes de tamaño: `extra_small=0.5, small=0.75, medium=1.0, large=1.33, extra_large=2.0`
2. Ajusta por entrenamiento:
   - Comida de entrenamiento: carbohidratos x2
   - Comida siguiente al entrenamiento: carbohidratos x2
   - Resto de comidas: grasas x2
   - Proteinas: sin cambio
3. Normaliza cada macro independientemente (suma = 1.0)
4. Guarda en `nutrition_plans` los campos `desayuno_p`, `desayuno_g`, `desayuno_c`, etc.

#### `GET /api/v3/nutrition/meal-plans/blocks`
Obtener distribucion actual de macros por comida (en gramos).

**Response:**
```json
{
  "success": true,
  "data": {
    "plan_id": 5,
    "calorias": 2112,
    "proteina": 165.6,
    "grasa": 70.3,
    "carbohidratos": 175.2,
    "comidas": {
      "desayuno": { "p": 33.1, "g": 17.6, "c": 26.3 },
      "almuerzo": { "p": 55.2, "g": 14.1, "c": 70.1 },
      "merienda": { "p": 24.8, "g": 14.1, "c": 17.5 },
      "cena": { "p": 52.5, "g": 24.5, "c": 61.3 }
    }
  }
}
```

#### `POST /api/v3/nutrition/meal-plans/blocks/adjust`
Ajustar manualmente una comida por bloques.

**Body:**
```json
{
  "comida": "almuerzo",
  "ajustes": {
    "proteina": 1,
    "grasa": -1,
    "carbohidratos": 0
  }
}
```

**Bloques:** Proteina=20g, Grasa=10g, Carbohidrato=25g. Valida contra margen de libertad.

### Endpoints adicionales (presets y favoritos)

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/meal-plans/blocks/suggestions` | GET | Presets + favoritos + recientes por comida |
| `/meal-plans/blocks/favorites` | POST | Guardar combinacion como favorito |
| `/meal-plans/blocks/favorites/<id>` | PATCH/DELETE | Editar/borrar favorito |
| `/meal-plans/blocks/constructor` | POST | Construir y guardar combinacion custom |
| `/meal-plans/library` | GET | Biblioteca global de presets |
| `/meal-plans/library/<id>/favorite` | POST/DELETE | Toggle favorito en biblioteca |

### Pantallas

| Rol | Pantalla | Archivo | Estado |
|---|---|---|---|
| Doctor | Config comidas | `app/(doctor)/patient-nutrition.tsx` | **NO IMPLEMENTADA** (endpoint existe, sin UI) |
| Paciente | Ver bloques | `app/(patient)/nutrition/index.tsx` | Usa los targets del plan |

---

## 6. Paso 5: Recetas y Solver

### Modelo de recetas (relacional, en clinical.db)

Cada receta tiene ingredientes con roles:
- **base**: variable libre — el solver decide la cantidad
- **dependiente**: escala proporcionalmente con el ingrediente base (ratio peso o medida casera)
- **fijo**: cantidad fija sin importar el resultado del solver

### Endpoints de recetas

#### `GET /api/v3/nutrition/recipes`
Listar recetas (paginado, busqueda).

**Query:** `?search=pollo&page=1&per_page=20`

#### `GET /api/v3/nutrition/recipes/<id>`
Detalle de receta con ingredientes y datos nutricionales.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "nombre": "Pollo con arroz y verduras",
    "categoria": "almuerzo_cena",
    "ingredientes": [
      {
        "id": 101,
        "alimento_nombre": "Pechuga de pollo",
        "alimento_id": 42,
        "rol": "base",
        "medida_tipo": 0,
        "proteina_100g": 21.0,
        "grasa_100g": 3.0,
        "carbohidratos_100g": 0.0,
        "porcion1_desc": "unidad",
        "porcion1_g": 150
      },
      {
        "id": 102,
        "alimento_nombre": "Arroz blanco",
        "alimento_id": 88,
        "rol": "dependiente",
        "base_ingredient_id": 101,
        "ratio": 0.8,
        "tipo_ratio": "peso",
        "proteina_100g": 2.7,
        "grasa_100g": 0.3,
        "carbohidratos_100g": 28.2
      },
      {
        "id": 103,
        "alimento_nombre": "Aceite de oliva",
        "alimento_id": 5,
        "rol": "fijo",
        "cantidad_fija": 1.0,
        "proteina_100g": 0.0,
        "grasa_100g": 100.0,
        "carbohidratos_100g": 0.0,
        "porcion1_desc": "cucharada",
        "porcion1_g": 10
      }
    ]
  }
}
```

#### `POST /api/v3/nutrition/recipes`
Crear receta nueva.

**Body:**
```json
{
  "nombre": "Pollo con arroz",
  "categoria": "almuerzo_cena",
  "palabras_clave": "pollo,arroz,proteina",
  "ingredientes": [
    {
      "alimento_nombre": "Pechuga de pollo",
      "alimento_id": 42,
      "medida_tipo": 0,
      "rol": "base",
      "orden": 1
    },
    {
      "alimento_nombre": "Arroz blanco",
      "alimento_id": 88,
      "medida_tipo": 0,
      "rol": "dependiente",
      "base_ingredient_id": 0,
      "ratio": 0.8,
      "tipo_ratio": "peso",
      "orden": 2
    }
  ]
}
```

#### `PUT /api/v3/nutrition/recipes/<id>` / `DELETE /api/v3/nutrition/recipes/<id>`
Actualizar o eliminar receta (cascade en ingredientes).

### Solver

#### `POST /api/v3/nutrition/solve-meal`
Resuelve la combinacion optima de porciones para alcanzar macros objetivo.

**Body:**
```json
{
  "objetivo": {
    "proteina": 55,
    "grasa": 14,
    "carbohidratos": 70
  },
  "libertad": 10,
  "alimentos": [
    {
      "id": "42",
      "nombre": "Pechuga de pollo",
      "proteina_100g": 21.0,
      "grasa_100g": 3.0,
      "carbohidratos_100g": 0.0,
      "medida_casera_g": 150,
      "medida_desc": "unidad"
    },
    {
      "id": "88",
      "nombre": "Arroz blanco",
      "proteina_100g": 2.7,
      "grasa_100g": 0.3,
      "carbohidratos_100g": 28.2,
      "medida_casera_g": 60,
      "medida_desc": "taza"
    }
  ],
  "recetas": [
    { "recipe_id": 15 }
  ],
  "meal_key": "almuerzo"
}
```

**Notas:**
- Si no se envia `objetivo`, lo toma del plan nutricional activo del paciente
- Si se envia `meal_key`, usa los macros de esa comida especifica del plan
- Puede recibir mezcla de alimentos sueltos + recetas

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "Optimal",
    "metodo": "Completo",
    "calidad": "buena",
    "alimentos": [
      {
        "id": "42",
        "nombre": "Pechuga de pollo",
        "porciones": 1.8,
        "total_gramos": 270,
        "proteina": 56.7,
        "grasa": 8.1,
        "carbohidratos": 0.0,
        "rol": "base"
      },
      {
        "id": "88",
        "nombre": "Arroz blanco",
        "porciones": 3.6,
        "total_gramos": 216,
        "proteina": 5.8,
        "grasa": 0.6,
        "carbohidratos": 60.9,
        "rol": "dependiente"
      }
    ],
    "totales": {
      "proteina": 62.5,
      "grasa": 8.7,
      "carbohidratos": 60.9,
      "calorias": 575
    },
    "objetivo": {
      "proteina": 55,
      "grasa": 14,
      "carbohidratos": 70
    }
  }
}
```

**Metodos del solver (cascada PuLP):**

| Metodo | Restricciones | Cuando se usa |
|---|---|---|
| **Completo** | Todos los macros dentro de +-libertad% | Primer intento (ideal) |
| **Proteinas** | Solo proteina >= target - libertad% | Si Completo es infactible |
| **Calorias** | Solo calorias <= target total | Fallback final |

**Funcion objetivo:** `Minimizar 2*|delta_P| + |delta_G| + |delta_C|` (proteina pesa el doble)

#### `POST /api/v3/nutrition/recipes/<id>/calculate`
Resolver una receta especifica contra macros objetivo. Internamente llama a `solve_meal()` con los ingredientes de la receta.

### Meal Plans (planes alimentarios con recetas asignadas)

#### `POST /api/v3/nutrition/meal-plans`
Crear plan alimentario asignando recetas a comidas.

**Body:**
```json
{
  "plan_json": {
    "comidas": {
      "desayuno": [3, 7],
      "almuerzo": [15],
      "merienda": [3],
      "cena": [22, 15]
    }
  }
}
```

#### `GET /api/v3/nutrition/meal-plans/<id>/calculate`
Auto-resolver todas las recetas del plan contra los macros por comida.

#### `GET /api/v3/nutrition/meal-plans/<id>/shopping-list`
Generar lista de compras agregando ingredientes de todas las recetas.

### Endpoints de alimentos

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/foods` | GET | Buscar alimentos (`?search=pollo&per_page=20`) |
| `/foods/<id>` | GET | Detalle de un alimento |
| `/foods/<id>/portions` | GET | Porciones disponibles (medida casera, unidad, etc.) |
| `/food-groups` | GET | Grupos de alimentos con calculo de bloques |
| `/food-groups/catalog` | GET | Catalogo filtrado por macro/momento del dia |

### Pantallas

| Rol | Pantalla | Archivo | Estado |
|---|---|---|---|
| Doctor | Armar comidas (manual) | `app/(doctor)/patient-nutrition.tsx` | Parcial (agrega recetas/alimentos, NO usa solve-meal) |
| Paciente | Mis recetas (CRUD) | `app/(patient)/my-recipes.tsx` | Implementada |
| Paciente | Buscar alimentos | `app/(patient)/nutrition/food-search.tsx` | Implementada |
| Paciente | Mis alimentos | `app/(patient)/my-foods.tsx` | Implementada |
| Paciente | Daily log (usa solver) | `app/(patient)/nutrition/index.tsx` | Implementada |

---

## 7. Paso 6: Registro diario del paciente

### Endpoints

#### `POST /api/v3/nutrition/daily-log`
Guardar registro diario por comida. UPSERT en `(patient_id, fecha, meal_key)`.

**Body:**
```json
{
  "fecha": "2026-03-29",
  "meals": [
    {
      "meal_key": "desayuno",
      "recipe_id": 3,
      "recipe_name": "Avena con frutas",
      "foods_json": [
        {
          "id": 12,
          "nombre": "Avena",
          "cantidad_g": 60,
          "proteina": 7.8,
          "grasa": 4.2,
          "carbohidratos": 40.2,
          "calorias": 228
        }
      ],
      "completed": true,
      "total_p": 22.5,
      "total_g": 8.3,
      "total_c": 45.1,
      "total_cal": 345,
      "target_p": 33.1,
      "target_g": 17.6,
      "target_c": 26.3
    }
  ]
}
```

**Nota:** El frontend envia TODAS las comidas habilitadas en cada save.

#### `GET /api/v3/nutrition/daily-log`
Obtener log del dia.

**Query:** `?fecha=2026-03-29&nombre_apellido=Apellido, Nombre` (doctor)

#### `GET /api/v3/nutrition/daily-log/history`
Historial con scores, streaks, y promedios.

**Query:** `?days=14&nombre_apellido=Apellido, Nombre` (doctor)

### Calculo de scores

**Score por comida:**
```
cobertura_P = min(actual_P / target_P, 1.0) * 100
cobertura_G = min(actual_G / target_G, 1.0) * 100
cobertura_C = min(actual_C / target_C, 1.0) * 100

meal_score = P * 0.40 + G * 0.30 + C * 0.30
```
(Penalizacion suave por exceso: si actual > target, la cobertura se limita a 100)

**Score diario:** Promedio ponderado de meal_scores por calorias target de cada comida.

### Pantallas

| Rol | Pantalla | Archivo | Estado |
|---|---|---|---|
| Doctor | Ver adherencia | `app/(doctor)/patient-nutrition.tsx` | Implementada (14 dias, expandible) |
| Paciente | Log diario | `app/(patient)/nutrition/index.tsx` | Implementada |
| Paciente | Analisis nutricion | `app/(patient)/nutrition/nutrition-analysis.tsx` | Implementada |

---

## 8. Esquema de base de datos

### Tablas en `clinical.db` (nutricion)

```sql
-- Plan de macros diarios
nutrition_plans (
    id, patient_id,
    calorias, proteina, grasa, carbohidratos,
    -- Distribucion por comida (% de 0.0 a 1.0)
    desayuno_p, desayuno_g, desayuno_c,
    media_man_p, media_man_g, media_man_c,
    almuerzo_p, almuerzo_g, almuerzo_c,
    merienda_p, merienda_g, merienda_c,
    media_tar_p, media_tar_g, media_tar_c,
    cena_p, cena_g, cena_c,
    libertad, estrategia, factor_actividad,
    velocidad_cambio, deficit_calorico, disponibilidad_energetica,
    activo, created_at
)
```

> **Nota de naming:** En base de datos algunos campos de distribucion usan abreviaturas (`media_man_p`, `media_man_g`, `media_man_c`, `media_tar_p`, etc.) aunque en frontend y API se exponen como `media_manana` y `media_tarde`.

```sql
-- Recetas asignadas a comidas
meal_plans (
    id, patient_id, tipo, plan_json, activo,
    total_recetas, comidas_configuradas,
    created_at, updated_at
)

-- Registro diario por comida (UPSERT en patient_id+fecha+meal_key)
nutrition_daily_logs (
    id, patient_id, fecha, meal_key,
    recipe_id, recipe_name, foods_json,
    completed,
    total_p, total_g, total_c, total_cal,
    target_p, target_g, target_c,
    meal_score, created_at
)

-- Resumen diario (UPSERT en patient_id+fecha)
nutrition_daily_summary (
    id, patient_id, fecha,
    meals_completed, meals_total,
    total_p, total_g, total_c, total_cal,
    target_p, target_g, target_c, target_cal,
    daily_score, created_at
)

-- Cabecera de receta
recipes (
    id, nombre, palabras_clave, categoria,
    created_by, legacy_id, created_at, updated_at
)

-- Ingredientes de receta con roles
recipe_ingredients (
    id, recipe_id, alimento_nombre, alimento_id,
    medida_tipo, rol,
    base_ingredient_id, ratio, tipo_ratio,
    cantidad_fija, orden
)

-- Presets de distribucion
block_presets (id, comida, tipo_preset, nombre_preset, proteina_pct, grasa_pct, carbohidratos_pct, descripcion)
block_favorites (id, patient_id, comida, nombre, proteina_pct, grasa_pct, carbohidratos_pct, created_at)
block_adjustments_log (id, patient_id, comida, campo, valor_anterior, valor_nuevo, created_at)
```

### Tablas en `src/Basededatos` (legacy, solo lectura)

```sql
-- Catalogo de alimentos (fuente de datos nutricionales)
ALIMENTOS (ID, NOMBRE, NOMBRE_CORTO, PROTEINA, GRASA, CARBOHIDRATOS, FIBRA,
           PORCION1_DESC, PORCION1_G, PORCION2_DESC, PORCION2_G)

-- Grupos de alimentos con micronutrientes
GRUPOSALIMENTOS (ID, CATEGORIA, DESCRIPCION, ...)
```

### Resolucion de identidad

```
auth.db: users.id (login)
    → patient_user_link.patient_dni
        → clinical.db: patients.dni → patients.id
            → measurements, goals, nutrition_plans, etc.
```

---

## 9. Algoritmos clave

### A. TMB y TDEE (Katch-McArdle)

```
peso_magro_lbs = peso_magro_kg * 2.20462
TMB = 370 + (9.8 * peso_magro_lbs)
TDEE = TMB * factor_actividad
```

| Factor actividad | Nivel |
|---|---|
| 1.2 | Sedentario |
| 1.375 | Ligera (1-3 dias/sem) |
| 1.55 | Moderada (3-5 dias/sem) |
| 1.725 | Intensa (6-7 dias/sem) |
| 1.9 | Muy intensa (2x/dia) |

### B. Macros desde calorias

```
proteina_g = 2.513244 * peso_magro_kg    (constante, prioridad maxima)
grasa_g = max((calorias * 0.30) / 9, peso_actual * 0.6)
carbohidratos_g = (calorias - proteina_g*4 - grasa_g*9) / 4
```

### C. Velocidad de cambio de peso

| Velocidad | %/semana | Deficit tipico (85kg) |
|---|---|---|
| Conservadora | 0.25% | ~269 kcal |
| Moderada | 0.50% | ~538 kcal |
| Agresiva | 0.75% | ~807 kcal |

```
deficit_diario = (peso * velocidad_pct / 100) * 7700 / 7
calorias = TDEE - deficit_diario
```

### D. Disponibilidad Energetica (EA)

```
EA = (calorias_ingeridas - gasto_ejercicio_estimado) / peso_magro
```

| Categoria | Mujeres | Hombres |
|---|---|---|
| Optima | >= 45 | >= 35 |
| Adecuada | >= 30 | >= 25 |
| Limite bajo | >= 25 | >= 20 |
| RED-S / LEA | < 25 | < 20 |

### E. Solver de porciones (PuLP)

El solver usa programacion lineal para encontrar las porciones optimas:

**Variables de decision:** `x_i` = porciones del alimento i (>= 0)

**Funcion objetivo:**
```
Minimizar: 2*|P_total - P_target| + |G_total - G_target| + |C_total - C_target|
```

**Restricciones (metodo Completo):**
```
P_target * (1 - libertad/100) <= sum(x_i * P_i) <= P_target * (1 + libertad/100)
G_target * (1 - libertad/100) <= sum(x_i * G_i) <= G_target * (1 + libertad/100)
C_target * (1 - libertad/100) <= sum(x_i * C_i) <= C_target * (1 + libertad/100)
```

**Dependencias:**
- `dependiente`: `x_dep = x_base * ratio` (si tipo_ratio = peso) o ajustado por medida casera
- `fijo`: `x_fijo = cantidad_fija` (no variable)

---

## 10. Plan prescripto vs ejecucion real

### Dualidad del modulo

El modulo de nutricion tiene dos funciones simultaneas que deben mantenerse diferenciadas:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  CAPA A: PRESCRIPCION                CAPA B: EJECUCION         │
│  (Profesional)                       (Paciente)                 │
│                                                                 │
│  "Que deberia comer                  "Que comio realmente       │
│   idealmente el paciente"             el paciente"              │
│                                                                 │
│  ┌─────────────────────┐             ┌─────────────────────┐    │
│  │ nutrition_plans      │             │ nutrition_daily_logs │    │
│  │ meal_plans           │             │ nutrition_daily_     │    │
│  │ save-config          │      vs     │   summary           │    │
│  │ recipes (sugeridas)  │             │ foods_json           │    │
│  │ bloques/distribucion │             │ completed            │    │
│  └─────────────────────┘             │ meal_score           │    │
│                                      └─────────────────────┘    │
│                                                                 │
│  Intencion terapeutica               Adherencia real            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Lo que hace el profesional (prescripcion)

El profesional **no controla cada comida exacta del paciente**. Lo que hace es:

1. **Definir estructura:** targets diarios de calorias y macros
2. **Distribuir:** tamaños de comida, comidas activas, timing de entrenamiento
3. **Proponer ejemplos:** recetas y combinaciones sugeridas por comida
4. **Acotar el margen:** libertad porcentual para desviaciones aceptables
5. **Facilitar decisiones:** plantillas reutilizables, presets de bloques

Esto se persiste como:
- `nutrition_plans` — calorias, macros, distribucion por comida
- `meal_plans` — recetas asignadas a cada comida (plan_json)
- `recipes` — opciones sugeridas
- `block_presets` / `block_favorites` — combinaciones predefinidas

### Lo que hace el paciente (ejecucion)

Para cada comida del dia, el paciente elige entre 3 caminos:

| Opcion | Descripcion | Que se registra |
|---|---|---|
| **A. Seguir el plan** | Marca la comida planificada como realizada | `completed: true`, foods_json del plan original |
| **B. Modificar dentro del marco** | Cambia alimentos/recetas, usa solver para ajustar al target | `completed: true`, foods_json alternativo, score calculado |
| **C. Comer otra cosa** | Carga lo que realmente comio, aunque no coincida | `completed: true`, foods_json libre, score refleja desviacion |

El paciente no se limita a confirmar o rechazar la comida sugerida: tambien puede construir una comida alternativa, calcularla contra los targets del plan mediante el solver (`POST /solve-meal`) y luego guardar esa ejecucion real en el daily log.

En todos los casos, el daily log registra la **ejecucion real**, no el plan.

Esto se persiste como:
- `nutrition_daily_logs` — por comida: foods_json, totales reales, targets, score
- `nutrition_daily_summary` — por dia: totales, score diario, meals_completed

### Principio fundamental

> Una comida alternativa del paciente **nunca sobreescribe el plan del profesional**.

El plan original queda intacto en `nutrition_plans` + `meal_plans`. El daily log es una capa separada que registra lo que realmente paso. Esto permite comparar:

| Metrica | Fuente plan | Fuente ejecucion | Comparacion |
|---|---|---|---|
| Adherencia estructural | comidas configuradas en plan | meals_completed en summary | % comidas realizadas |
| Adherencia calorica | calorias del plan | total_cal del log | % desviacion |
| Adherencia de macros | P/G/C del plan por comida | total_p/g/c del log | score por comida |
| Frecuencia de reemplazos | recetas del meal_plan | recipe_id/foods_json del log | % comidas sustituidas |
| Comidas conflictivas | targets per-meal | meal_scores historicos | comidas con score bajo recurrente |

### Fuente de verdad por capa

| Capa | Fuente de verdad | Tabla |
|---|---|---|
| Medicion corporal | Ultima medicion registrada | `measurements` |
| Objetivo corporal | Goal activo | `goals` |
| Prescripcion nutricional | Plan activo del profesional | `nutrition_plans` |
| Plan alimentario sugerido | Recetas asignadas a comidas | `meal_plans` |
| Ejecucion real del paciente | Lo que comio cada dia | `nutrition_daily_logs` |
| Resumen de adherencia | Totales y score diario | `nutrition_daily_summary` |

### Vision del sistema

El sistema modela explicitamente dos realidades distintas: la prescripcion del profesional y la ejecucion real del paciente. La primera define la intencion terapeutica (`nutrition_plans` + `meal_plans`); la segunda constituye la fuente de verdad para adherencia, seguimiento y analisis (`nutrition_daily_logs` + `nutrition_daily_summary`). El profesional define estructura, objetivos, distribuciones y opciones sugeridas. El paciente ejecuta con flexibilidad: puede confirmar, modificar o reemplazar, y en todos los casos el sistema registra lo que realmente paso sin alterar la prescripcion original.

---

## 11. Precondiciones del solver

Para que `POST /api/v3/nutrition/solve-meal` funcione correctamente, **todas** estas condiciones deben cumplirse:

| # | Precondicion | Que pasa si falta |
|---|---|---|
| 1 | Debe existir una **medicion activa** del paciente | `auto-calculate` falla, no hay peso_magro para macros |
| 2 | Debe existir un **goal activo** | `auto-calculate` no puede calcular peso objetivo |
| 3 | Debe existir un **plan nutricional activo** | Si no se envia `objetivo` en el body, el solver no tiene targets |
| 4 | Debe existir **distribucion por comida** guardada (`save-config`) | Si se usa `meal_key`, los targets per-meal son NULL/0 |
| 5 | La comida a resolver debe tener **targets de P/G/C > 0** | El solver genera solucion trivial (0 porciones) |
| 6 | Debe haber al menos **1 ingrediente con rol `base`** | Sin variables libres, PuLP no puede optimizar |
| 7 | Los alimentos deben tener **datos nutricionales validos** por 100g | Division por cero o resultados absurdos |

**Cadena de dependencias:**
```
medicion → goal → auto-calculate → plan → save-config → targets per-meal → solve-meal
```

Si cualquier eslabon se rompe, el solver falla silenciosamente o devuelve resultados sin sentido. El flujo actual del frontend del doctor no garantiza esta cadena completa.

---

## 12. Plan de implementacion integrado

### Principio de diseno

El modulo no tiene "pantalla del doctor" y "pantalla del paciente" como cosas separadas. Tiene un **mismo editor de comidas con dos modos**:

| | `mode: doctor` | `mode: patient` |
|---|---|---|
| Ver targets por comida | Si | Si |
| Agregar alimentos | Si | Si |
| Agregar recetas | Si | Si |
| Correr solver | Si | Si |
| Editar porciones | Si | Si |
| Configurar distribucion | **Solo doctor** | — |
| Guardar propuesta/plantilla | **Solo doctor** | — |
| Marcar realizada/no realizada | — | **Solo paciente** |
| Guardar ejecucion real | — | **Solo paciente** |
| Generar adherencia y score | — | **Solo paciente** |

> Ambos usan el mismo editor de comidas, pero con distinta intencion de guardado y distinta fuente de verdad.

### Persistencia por rol

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  DOCTOR guarda → PRESCRIPCION              PACIENTE guarda → EJECUCION │
│                                                              │
│  nutrition_plans   (estructura)             nutrition_daily_logs (real) │
│  meal_plans        (propuesta/plantilla)    nutrition_daily_summary     │
│  save-config       (distribucion)                            │
│                                                              │
│  No debe:                                  No debe:          │
│  - marcar completed                        - modificar plan  │
│  - generar daily_score                     - alterar config   │
│  - escribir adherencia real                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Una misma meal card puede pasar de "sugerida" a "ejecutada", sin mezclar tablas ni significado.

---

### Paso 0 — Fix critico de backend: distribucion por defecto

**Objetivo:** Que ningun plan nazca sin targets por comida.

**Que hacer en `POST /nutrition/plans` (`src/api/v3/nutrition/routes.py`):**
- Si no llegan porcentajes por comida, generar distribucion default equitativa
- Guardar `desayuno_p/g/c`, `almuerzo_p/g/c`, etc. con valores validos
- Evitar NULL en todos los campos per-meal

**Ademas, blindar:**
- `GET /meal-plans/blocks`: si no hay distribucion, fallback o error claro
- `POST /solve-meal`: si `meal_key` no tiene target valido, devolver error explicito

**Resultado:** Desde que existe el plan, `getMealBlocks()` siempre devuelve algo usable.

---

### Paso 1 — Editor compartido: misma UI, distinto modo

**Objetivo:** Crear logica compartida de editor de comidas con `mode: doctor | patient`.

**Ambos modos pueden:**
- Ver targets por comida
- Agregar alimentos y recetas
- Correr solver
- Editar porciones
- Reemplazar comidas

**Solo doctor puede:**
- Configurar distribucion
- Guardar propuesta
- Guardar plantilla
- Editar la estructura terapeutica

**Solo paciente puede:**
- Marcar realizada / no realizada
- Guardar ejecucion real
- Generar adherencia y score

**Resultado:** Se reutiliza casi toda la UI y la logica del solver, pero no se mezclan semanticas.

---

### Paso 2 — Separar "propuesta" de "ejecucion" en persistencia

**Objetivo:** Que la misma comida visual pueda existir como sugerencia o como consumo real, sin confusion.

**Regla:**
- Propuesta / prescripcion → la guarda el profesional → `meal_plans`
- Ejecucion real → la guarda el paciente → `nutrition_daily_logs`

**El doctor puede dejar:**
- Desayuno sugerido, almuerzo sugerido, merienda sugerida, cena sugerida

**El paciente despues:**
- Acepta esa comida, la modifica, la reemplaza, la resuelve de nuevo
- Y recien ahi la guarda como real

**Resultado:** El boton final y la tabla destino cambian segun el rol, aunque la pantalla se vea igual.

---

### Paso 3 — UI de configuracion de comidas (modo doctor)

**Objetivo:** Completar el paso que hoy falta entre plan y solver.

**Agregar en `patient-nutrition.tsx` seccion "Configuracion de comidas":**
- Comidas activas (checkboxes)
- Tamaño de cada comida (extra_small / small / medium / large / extra_large)
- Comida de entrenamiento (selector)

**Accion:** Llama a `nutritionService.saveMealConfig()` (ya existe, nunca se usa)

**Despues de guardar, refrescar:**
- `getMealBlocks()` — targets por comida en pantalla
- Targets quedan disponibles para solver y paciente

**Resultado:** El doctor deja preparado el terreno para que propuesta y solver funcionen con targets reales.

---

### Paso 4 — Integrar solve-meal en el editor compartido

**Objetivo:** Que tanto doctor como paciente puedan resolver una comida desde la misma base UI.

**Agregar boton "Resolver comida" por cada meal card.**

**Comportamiento:** El editor arma payload con:
- `meal_key`
- alimentos actuales
- recetas seleccionadas
- libertad del plan
- objetivo per-meal (de `getMealBlocks()`)

**Segun el rol:**
- **Doctor:** resuelve para dejar una propuesta mejor ajustada
- **Paciente:** resuelve para adaptar lo que realmente quiere comer sin perder de vista el target

**Referencia:** El paciente ya hace exactamente esto en `nutrition/index.tsx` lineas 512-576. Se reutiliza la misma logica.

**Resultado:** El solver deja de ser una capacidad escondida y pasa a ser parte natural del flujo de ambos.

---

### Paso 5 — Guardado con semantica distinta segun rol

**Objetivo:** Mantener la misma experiencia visual, pero con persistencia correcta.

**Si guarda el doctor:**

| Opcion | Destino | Efecto |
|---|---|---|
| Guardar propuesta del dia | `meal_plans` o daily log con `completed: false` | Paciente la ve como sugerencia |
| Guardar como plantilla | `meal_plans` (plan_json) | Reutilizable para otros dias |

No debe: marcar `completed`, generar `daily_score`, escribir adherencia real.

**Si guarda el paciente:**

| Opcion | Destino | Efecto |
|---|---|---|
| Guardar comida | `nutrition_daily_logs` | Registra ejecucion real |
| Marcar realizada | `nutrition_daily_logs` (`completed: true`) | Cuenta para score |
| Guardar dia | `nutrition_daily_summary` | Totales + score diario |

**Resultado:** Una misma meal card puede pasar de "sugerida" a "ejecutada", sin mezclar tablas.

---

### Paso 6 — Mostrar al paciente la propuesta del doctor como punto de partida

**Objetivo:** Que el paciente no arranque desde vacio.

**En `nutrition/index.tsx`, cuando el paciente abre el dia:**
1. Cargar targets del plan (`getMealBlocks()`)
2. Buscar si existe propuesta/sugerencia del profesional (daily log con `completed: false` o `meal_plans`)
3. Mostrarla precargada en la UI
4. Permitir aceptar, editar o reemplazar

**Importante:** La propuesta no entra automaticamente en `daily_log`. Solo pasa a ejecucion real cuando el paciente guarda o marca realizada.

**Resultado:** Mejora UX sin romper la diferencia entre plan y realidad.

---

### Orden de implementacion

| Fase | Pasos | Descripcion |
|---|---|---|
| **1. Backend** | Paso 0 | Distribucion por defecto + validaciones en blocks y solve-meal |
| **2. Arquitectura frontend** | Pasos 1 + 2 | Mismo editor con dos modos + separar guardado propuesta vs ejecucion |
| **3. Doctor** | Paso 3 | UI de configuracion de comidas |
| **4. Doctor + Paciente** | Paso 4 | Integrar solver en el editor compartido |
| **5. Persistencia** | Paso 5 | Botones de guardado distintos por rol |
| **6. Paciente** | Paso 6 | Cargar sugerencias del doctor como punto de partida |

---

### Que funciona hoy vs que falta

| Capacidad | Doctor | Paciente | Estado |
|---|---|---|---|
| Ver plan actual | Si | Si | Funciona |
| Crear plan (auto/manual) | Si | — | Funciona |
| Config comidas (save-config) | — | — | **Falta UI** |
| Ver targets per-meal | Si (getMealBlocks) | Si (getMealBlocks) | Funciona si hay distribucion |
| Agregar recetas | Si (calculateRecipe) | Si (food-search) | Funciona |
| Agregar alimentos | Si (manual) | Si (food-search) | Funciona |
| Solver (solve-meal) | — | Si | **Falta en doctor** |
| Guardar propuesta | — | — | **Falta** |
| Guardar plantilla | — | — | **Falta** |
| Guardar ejecucion real | — | Si (daily log) | Funciona |
| Ver adherencia | Si (history) | Si (analysis) | Funciona |
| Ver sugerencias del doctor | — | — | **Falta** |

---

> **En una frase:** El modulo pasa a ser un editor compartido de comidas con dos modos: el profesional construye y guarda prescripcion; el paciente parte de esa misma base, la adapta si quiere y guarda unicamente la ejecucion real.

---

## Archivos de referencia

| Archivo | Descripcion |
|---|---|
| `src/api/v3/nutrition/routes.py` | Todos los endpoints de nutricion (3,229 lineas) |
| `src/functions.py` | Logica de negocio: solver, TDEE, objetivos auto |
| `src/db/schema.sql` | Esquema completo de clinical.db |
| `omega-medicina-app/app/(doctor)/patient-nutrition.tsx` | Pantalla principal nutricion del doctor (1,299 lineas) |
| `omega-medicina-app/app/(doctor)/patient-goals.tsx` | Pantalla de objetivos del paciente |
| `omega-medicina-app/app/(doctor)/patient-measures.tsx` | Pantalla de mediciones del paciente |
| `omega-medicina-app/app/(patient)/nutrition/index.tsx` | Daily log del paciente |
| `omega-medicina-app/app/(patient)/my-recipes.tsx` | CRUD de recetas del paciente |
| `omega-medicina-app/src/services/api/nutritionService.ts` | 40 metodos del servicio de nutricion |
| `omega-medicina-app/src/services/api/config.ts` | 27 endpoints mapeados |
