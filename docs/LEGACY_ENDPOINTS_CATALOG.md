# Catálogo Completo de Endpoints Legacy - OMV3

## Resumen de Análisis

| Archivo | Líneas | Endpoints | Funciones |
|---------|--------|-----------|-----------|
| `main.py` | 6521 | 85+ | 50+ |
| `functions.py` | 4864 | 0 | 60+ |
| **Total** | **11385** | **85+** | **110+** |

---

## Endpoints por Categoría

### 🔐 AUTENTICACIÓN (2 endpoints)

| # | Método | Ruta | Línea | Descripción | Migrar a |
|---|--------|------|-------|-------------|----------|
| 1 | GET/POST | `/login` | ~2650 | Login con email + DNI | `/api/v3/auth/login` |
| 2 | GET | `/logout` | ~2700 | Cerrar sesión | `/api/v3/auth/logout` |

---

### 👤 PERFILES DE USUARIO (6 endpoints)

| # | Método | Ruta | Línea | Descripción | Migrar a |
|---|--------|------|-------|-------------|----------|
| 3 | GET/POST | `/create` | ~1880 | Crear perfil estático | `/api/v3/users` POST |
| 4 | GET/POST | `/editperfilest/<DNI>` | ~1920 | Editar perfil estático | `/api/v3/users/:id` PUT |
| 5 | GET | `/delperfilest/<DNI>` | ~1960 | Eliminar perfil estático | `/api/v3/users/:id` DELETE |
| 6 | GET/POST | `/update` | ~1980 | Actualizar perfil dinámico | `/api/v3/users/:id/measurements` POST |
| 7 | GET/POST | `/editperfildin/<ID>` | ~2020 | Editar perfil dinámico | `/api/v3/users/:id/measurements/:mid` PUT |
| 8 | GET | `/delperfildin/<ID>` | ~2060 | Eliminar perfil dinámico | `/api/v3/users/:id/measurements/:mid` DELETE |

---

### 🎯 OBJETIVOS (4 endpoints)

| # | Método | Ruta | Línea | Descripción | Migrar a |
|---|--------|------|-------|-------------|----------|
| 9 | GET/POST | `/goal` | ~2100 | Gestión de objetivos | `/api/v3/users/:id/goals` |
| 10 | GET | `/api/goal/objetivos-automaticos/<nombre>` | ~2140 | Objetivos automáticos | `/api/v3/users/:id/goals/auto` |
| 11 | GET | `/delgoal/<NombreApellido>` | ~2180 | Eliminar objetivo | `/api/v3/users/:id/goals/:gid` DELETE |

---

### 🍎 NUTRICIÓN - PLANES (8 endpoints)

| # | Método | Ruta | Línea | Descripción | Migrar a |
|---|--------|------|-------|-------------|----------|
| 12 | GET/POST | `/planner` | ~2040 | Planificador nutricional | `/api/v3/nutrition/plans` |
| 13 | GET | `/api/planner/plan-automatico/<nombre>` | ~2080 | Plan automático | `/api/v3/nutrition/plans/auto/:userId` |
| 14 | GET/POST | `/editplan/<ID>` | ~2100 | Editar plan | `/api/v3/nutrition/plans/:id` PUT |
| 15 | GET | `/delplan/<ID>` | ~2120 | Eliminar plan | `/api/v3/nutrition/plans/:id` DELETE |
| 16 | GET/POST | `/diet` | ~2600 | Procesar dieta | `/api/v3/nutrition/plans` POST |
| 17 | POST | `/api/plan-nutricional/ajustar-calorias` | ~2850 | Ajustar calorías | `/api/v3/nutrition/plans/:id/adjust-calories` |

---

### 🍎 NUTRICIÓN - ALIMENTOS (5 endpoints)

| # | Método | Ruta | Línea | Descripción | Migrar a |
|---|--------|------|-------|-------------|----------|
| 18 | GET/POST | `/createfood` | ~2200 | Crear alimento | `/api/v3/nutrition/foods` POST |
| 19 | GET/POST | `/editfood/<ID>` | ~2240 | Editar alimento | `/api/v3/nutrition/foods/:id` PUT |
| 20 | GET | `/deletefood/<ID>` | ~2280 | Eliminar alimento | `/api/v3/nutrition/foods/:id` DELETE |
| 21 | GET | `/size/<food>` | ~2300 | Tamaños de porción | `/api/v3/nutrition/foods/:id/portions` |
| 22 | GET | `/api/grupos-alimentos` | ~4738 | Grupos de alimentos | `/api/v3/nutrition/food-groups` |

---

### 🍎 NUTRICIÓN - RECETAS (4 endpoints)

| # | Método | Ruta | Línea | Descripción | Migrar a |
|---|--------|------|-------|-------------|----------|
| 23 | GET/POST | `/recipecreator` | ~2320 | Crear receta | `/api/v3/nutrition/recipes` POST |
| 24 | GET | `/deleterecipe/<ID>` | ~2360 | Eliminar receta | `/api/v3/nutrition/recipes/:id` DELETE |
| 25 | GET/POST | `/recipe` | ~2380 | Calcular receta | `/api/v3/nutrition/recipes/:id/calculate` |
| 26 | GET/POST | `/cooking` | ~2620 | Recetas personalizadas | `/api/v3/nutrition/recipes/cooking` |

---

### 🍎 NUTRICIÓN - PLAN ALIMENTARIO (12 endpoints)

| # | Método | Ruta | Línea | Descripción | Migrar a |
|---|--------|------|-------|-------------|----------|
| 27 | GET | `/plan-alimentario` | ~3307 | Página plan alimentario | `/api/v3/nutrition/meal-plans` |
| 28 | GET | `/api/plan-alimentario/info` | ~3338 | Info del plan | `/api/v3/nutrition/meal-plans/info` |
| 29 | GET | `/api/plan-alimentario/recetas` | ~3678 | Lista recetas | `/api/v3/nutrition/recipes` |
| 30 | POST | `/api/plan-alimentario/guardar` | ~3710 | Guardar plan | `/api/v3/nutrition/meal-plans` POST |
| 31 | GET | `/api/plan-alimentario/plan-guardado` | ~3871 | Plan guardado | `/api/v3/nutrition/meal-plans/:id` |
| 32 | POST | `/api/plan-alimentario/lista-compras` | ~4046 | Lista de compras | `/api/v3/nutrition/meal-plans/:id/shopping` |
| 33 | POST | `/api/plan-alimentario/bloques/ajustar` | ~4116 | Ajustar bloques | `/api/v3/nutrition/blocks/adjust` |
| 34 | GET | `/api/plan-alimentario/bloques/sugerencias` | ~4259 | Sugerencias bloques | `/api/v3/nutrition/blocks/suggestions` |
| 35 | POST | `/api/plan-alimentario/bloques/sugerencias` | ~4562 | Guardar favorito | `/api/v3/nutrition/blocks/favorites` POST |
| 36 | PATCH | `/api/plan-alimentario/bloques/sugerencias/<id>` | ~4633 | Actualizar favorito | `/api/v3/nutrition/blocks/favorites/:id` PATCH |
| 37 | DELETE | `/api/plan-alimentario/bloques/sugerencias/<id>` | ~4699 | Eliminar favorito | `/api/v3/nutrition/blocks/favorites/:id` DELETE |
| 38 | POST | `/api/plan-alimentario/bloques/constructor` | ~4802 | Guardar constructor | `/api/v3/nutrition/blocks/constructor` |
| 39 | GET | `/api/plan-alimentario/biblioteca` | ~4918 | Biblioteca combinaciones | `/api/v3/nutrition/blocks/library` |
| 40 | POST/DELETE | `/api/plan-alimentario/favoritos/<id>` | ~4978 | Toggle favorito | `/api/v3/nutrition/blocks/favorites/:id/toggle` |

---

### 💪 ENTRENAMIENTO - FUERZA (12 endpoints)

| # | Método | Ruta | Línea | Descripción | Migrar a |
|---|--------|------|-------|-------------|----------|
| 41 | GET | `/strengthstandard` | ~800 | Estándares de fuerza | `/api/v3/training/strength/standards` |
| 42 | GET | `/api/user-exercises/<user>` | ~850 | Ejercicios del usuario | `/api/v3/training/exercises` |
| 43 | GET | `/api/lifts` | ~900 | Levantamientos | `/api/v3/training/lifts` |
| 44 | GET | `/api/lifts/<username>` | ~950 | Levantamientos por usuario | `/api/v3/training/lifts?user=:id` |
| 45 | POST | `/api/lifts` | ~1000 | Guardar levantamiento | `/api/v3/training/lifts` POST |
| 46 | GET | `/api/past_lifts` | ~1050 | Historial levantamientos | `/api/v3/training/lifts/history` |
| 47 | GET | `/api/past_lifts/<username>` | ~1100 | Historial por usuario | `/api/v3/training/lifts/history?user=:id` |
| 48 | POST | `/api/submit-strength-results` | ~1150 | Enviar resultados | `/api/v3/training/strength` POST |
| 49 | GET | `/strengthdata` | ~1200 | Datos de fuerza | `/api/v3/training/strength` |
| 50 | GET | `/historial-fuerza` | ~1250 | Historial de fuerza | `/api/v3/training/strength/history` |
| 51 | GET | `/eliminar_registro_fuerza/<id>` | ~2350 | Eliminar registro | `/api/v3/training/strength/:id` DELETE |
| 52 | GET | `/optimizar_entrenamiento/<id>` | ~2380 | Optimizar con PuLP | `/api/v3/training/plans/:id/optimize` |

---

### 💪 ENTRENAMIENTO - PLANES (6 endpoints)

| # | Método | Ruta | Línea | Descripción | Migrar a |
|---|--------|------|-------|-------------|----------|
| 53 | GET/POST | `/trainingplanner` | ~1300 | Planificador | `/api/v3/training/plans` |
| 54 | GET | `/entrenamiento_actual` | ~1350 | Entrenamiento actual | `/api/v3/training/sessions/current` |
| 55 | POST | `/registrar_sesion` | ~1400 | Registrar sesión | `/api/v3/training/sessions` POST |
| 56 | POST | `/avanzar_dia` | ~1450 | Avanzar día | `/api/v3/training/sessions/advance` |
| 57 | GET | `/plan_entrenamiento` | ~2720 | Plan de entrenamiento | `/api/v3/training/plans/:id` |

---

### 💪 ENTRENAMIENTO - PROGRAMAS (2 endpoints)

| # | Método | Ruta | Línea | Descripción | Migrar a |
|---|--------|------|-------|-------------|----------|
| 58 | GET | `/programas-entrenamientos` | ~3169 | Lista programas | `/api/v3/training/programs` |
| 59 | GET | `/programa/<id>` | ~3251 | Detalle programa | `/api/v3/training/programs/:id` |

---

### 🏥 TELEMEDICINA (15 endpoints)

| # | Método | Ruta | Línea | Descripción | Migrar a |
|---|--------|------|-------|-------------|----------|
| 60 | GET | `/telemedicina` | ~5510 | Redirect a pacientes | `/api/v3/telemedicine` |
| 61 | GET | `/telemedicina/pacientes` | ~5515 | Lista pacientes | `/api/v3/telemedicine/patients` |
| 62 | GET | `/telemedicina/situacion` | ~5520 | Situación clínica | `/api/v3/telemedicine/situations` |
| 63 | GET | `/telemedicina/documentos` | ~5525 | Documentos | `/api/v3/telemedicine/documents` |
| 64 | GET/POST | `/api/telemed/pacientes` | ~5674 | CRUD pacientes | `/api/v3/telemedicine/patients` |
| 65 | GET/POST/DELETE | `/api/telemed/situacion` | ~5890 | CRUD situaciones | `/api/v3/telemedicine/situations` |
| 66 | GET/POST/PUT/DELETE | `/api/telemed/documentos` | ~6135 | CRUD documentos | `/api/v3/telemedicine/documents` |
| 67 | POST | `/api/telemed/documentos/upload` | ~6349 | Subir a Drive | `/api/v3/telemedicine/documents/upload` |
| 68 | GET | `/historia-medica` | ~5529 | Historia médica | `/api/v3/telemedicine/medical-history` |
| 69 | GET/POST | `/api/historia-medica` | ~5537 | API historia | `/api/v3/telemedicine/medical-history` |
| 70 | GET | `/signos-vitales` | ~5616 | Signos vitales | `/api/v3/telemedicine/vital-signs` |
| 71 | GET/POST | `/api/signos-vitales` | ~5624 | API signos | `/api/v3/telemedicine/vital-signs` |
| 72 | GET | `/citas-medicas` | ~5590 | Citas médicas | `/api/v3/telemedicine/appointments` |
| 73 | GET/POST | `/api/citas-medicas` | ~5598 | API citas | `/api/v3/telemedicine/appointments` |
| 74 | GET | `/programas-prevencion` | ~6450 | Programas prevención | `/api/v3/telemedicine/prevention-programs` |
| 75 | GET/POST | `/api/programas-prevencion` | ~6458 | API programas | `/api/v3/telemedicine/prevention-programs` |

---

### 📊 DASHBOARD Y ANALYTICS (4 endpoints)

| # | Método | Ruta | Línea | Descripción | Migrar a |
|---|--------|------|-------|-------------|----------|
| 76 | GET | `/dashboard` | ~300 | Dashboard principal | `/api/v3/analytics/dashboard` |
| 77 | GET | `/resume` | ~200 | Resumen usuario | `/api/v3/analytics/summary` |
| 78 | GET | `/caloriescal` | ~250 | Calculadora calorías | `/api/v3/analytics/calculators` |

---

### 📊 RENDIMIENTO FÍSICO (8 endpoints)

| # | Método | Ruta | Línea | Descripción | Migrar a |
|---|--------|------|-------|-------------|----------|
| 79 | GET | `/medidas-corporales` | ~5039 | Medidas corporales | `/api/v3/analytics/body-measurements` |
| 80 | GET/POST | `/api/medidas-corporales` | ~5047 | API medidas | `/api/v3/analytics/body-measurements` |
| 81 | GET | `/rendimiento-velocidad` | ~5108 | Velocidad | `/api/v3/analytics/performance/speed` |
| 82 | GET/POST | `/api/rendimiento-velocidad` | ~5116 | API velocidad | `/api/v3/analytics/performance/speed` |
| 83 | GET | `/rendimiento-flexibilidad` | ~5169 | Flexibilidad | `/api/v3/analytics/performance/flexibility` |
| 84 | GET/POST | `/api/rendimiento-flexibilidad` | ~5177 | API flexibilidad | `/api/v3/analytics/performance/flexibility` |
| 85 | GET | `/rendimiento-movilidad` | ~5230 | Movilidad | `/api/v3/analytics/performance/mobility` |
| 86 | GET/POST | `/api/rendimiento-movilidad` | ~5238 | API movilidad | `/api/v3/analytics/performance/mobility` |
| 87 | GET | `/rendimiento-resistencia` | ~5291 | Resistencia | `/api/v3/analytics/performance/endurance` |
| 88 | GET/POST | `/api/rendimiento-resistencia` | ~5299 | API resistencia | `/api/v3/analytics/performance/endurance` |

---

### ⚙️ ADMINISTRACIÓN (5 endpoints)

| # | Método | Ruta | Línea | Descripción | Migrar a |
|---|--------|------|-------|-------------|----------|
| 89 | GET | `/databasemanager` | ~2750 | Gestor BD | `/api/v3/admin/database` |
| 90 | GET | `/databasemanager-beta` | ~2800 | Gestor BD beta | `/api/v3/admin/database` |
| 91 | POST | `/api/database/update-cell` | ~3059 | Actualizar celda | `/api/v3/admin/database/tables/:name/:id` PUT |
| 92 | GET | `/admin/api/buscar_usuarios` | ~750 | Buscar usuarios | `/api/v3/admin/users/search` |
| 93 | GET | `/api/v2/admin/stats` | (v2) | Estadísticas | `/api/v3/admin/stats` |
| 94 | GET | `/api/v2/admin/users` | (v2) | Lista usuarios | `/api/v3/admin/users` |

---

### 🌐 PÁGINAS PÚBLICAS (6 endpoints)

| # | Método | Ruta | Línea | Descripción | Migrar a |
|---|--------|------|-------|-------------|----------|
| 95 | GET | `/` | ~150 | Home | Frontend |
| 96 | GET | `/sobre-nosotros` | ~160 | Sobre nosotros | Frontend |
| 97 | GET | `/blog` | ~170 | Blog | Frontend |
| 98 | GET | `/faqs` | ~180 | FAQs | Frontend |
| 99 | GET | `/terminos-condiciones` | ~185 | Términos | Frontend |
| 100 | GET | `/politica-privacidad` | ~190 | Privacidad | Frontend |
| 101 | GET | `/mantenimiento` | ~195 | Mantenimiento | Frontend |

---

## Funciones Principales en functions.py

### Gestión de Perfiles
| Función | Línea | Descripción |
|---------|-------|-------------|
| `creadordeperfil()` | 100 | Crear perfil estático |
| `actualizarperfilest()` | 122 | Actualizar perfil estático |
| `actualizarperfil()` | 140 | Actualizar perfil dinámico |
| `actualizarperfildin()` | 513 | Editar perfil dinámico |
| `creadordelista()` | 1126 | Lista de usuarios |

### Objetivos
| Función | Línea | Descripción |
|---------|-------|-------------|
| `goal()` | 1139 | Guardar objetivo |
| `obtener_categoria_ffmi()` | 1159 | Categorizar FFMI |
| `calcular_objetivos_parciales()` | 1205 | Objetivos progresivos |
| `calcular_objetivos_automaticos()` | 1429 | Objetivos automáticos |

### Nutrición
| Función | Línea | Descripción |
|---------|-------|-------------|
| `plannutricional()` | 1652 | Crear plan nutricional |
| `calcular_plan_nutricional_automatico()` | 1843 | Plan automático |
| `creadordealimento()` | 2137 | Crear alimento |
| `editfood()` | 2155 | Editar alimento |
| `listadereceta()` | 2173 | Lista de recetas |
| `listadealimentos()` | 2185 | Lista de alimentos |
| `listadeporciones()` | 2197 | Porciones de alimento |
| `recetario()` | 2219 | Obtener receta |
| `recipe()` | 2227 | Calcular receta (solver) |
| `calculate_recipe_portions()` | 2447 | Calcular porciones |
| `process_diet()` | 2888 | Procesar dieta |

### Entrenamiento
| Función | Línea | Descripción |
|---------|-------|-------------|
| `crear_tabla_analisis_fuerza_detallado()` | 813 | Crear tabla FUERZA |
| `guardar_historia_levantamiento_completa()` | 857 | Guardar levantamiento |
| `get_all_strength_data_admin()` | 970 | Datos fuerza (admin) |
| `get_user_strength_history()` | 1078 | Historial fuerza usuario |
| `get_training_plan()` | 2624 | Obtener plan entrenamiento |
| `predict_next_workouts()` | 2638 | Predecir entrenamientos |
| `actualizar_estado_running()` | 19 | Estado de running |

### Telemedicina
| Función | Línea | Descripción |
|---------|-------|-------------|
| `get_telemed_connection()` | 82 | Conexión BD telemedicina |
| `crear_tablas_telemedicina()` | 3711 | Crear tablas telemedicina |

### Utilidades
| Función | Línea | Descripción |
|---------|-------|-------------|
| `decode_json_data()` | 10 | Decodificar JSON |
| `crear_tablas_medidas_corporales()` | 3535 | Crear tablas medidas |
| `crear_tablas_rendimiento_fisico()` | 3611 | Crear tablas rendimiento |
| `crear_tabla_planes_alimentarios()` | 3997 | Crear tabla planes |
| `obtener_plan_alimentario_activo()` | 4029 | Obtener plan activo |
| `calcular_porciones_receta_plan()` | 4059 | Calcular porciones |
| `recipe_simple_calculation()` | 4106 | Cálculo simplificado |
| `obtener_analisis_completo_usuario()` | 4166 | Análisis completo |

---

## Tablas de Base de Datos

### src/Basededatos (SQLite)
| Tabla | Descripción |
|-------|-------------|
| `USUARIOS` | Usuarios del sistema |
| `PERFILESTATICO` | Datos fijos (DNI, nombre, sexo, altura) |
| `PERFILDINAMICO` | Mediciones (peso, circunferencias, BF%, FFMI) |
| `OBJETIVO` | Objetivos del usuario |
| `ALIMENTOS` | Base de datos de alimentos |
| `GRUPOSALIMENTOS` | Grupos de alimentos con bloques |
| `DIETA` | Planes nutricionales |
| `RECETAS` | Recetas con ingredientes |
| `PLANES_ALIMENTARIOS` | Planes alimentarios guardados |
| `PLAN_BLOQUES_PRESETS` | Presets de bloques |
| `PLAN_BLOQUES_FAVORITOS` | Favoritos del usuario |
| `FUERZA` | Registros de tests de fuerza |
| `PLANES_ENTRENAMIENTO` | Planes de entrenamiento |
| `MATRIZ_ENTRENAMIENTO` | Matriz de ejercicios |
| `ESTADO_EJERCICIO_USUARIO` | Estado de ejercicios |
| `MEDIDAS_CORPORALES` | Medidas corporales completas |
| `RENDIMIENTO_VELOCIDAD` | Pruebas de velocidad |
| `RENDIMIENTO_FLEXIBILIDAD` | Pruebas de flexibilidad |
| `RENDIMIENTO_MOVILIDAD` | Evaluaciones de movilidad |

### src/telemedicina.db (SQLite)
| Tabla | Descripción |
|-------|-------------|
| `TELEMED_PACIENTES` | Fichas de pacientes |
| `TELEMED_SITUACIONES` | Situaciones clínicas |
| `TELEMED_DOCUMENTOS` | Documentos con enlaces a Drive |
| `HISTORIA_MEDICA` | Historia médica |
| `SIGNOS_VITALES` | Registros de signos vitales |
| `CITAS_MEDICAS` | Citas médicas |
| `PROGRAMAS_PREVENCION` | Programas de prevención |
| `DOCUMENTOS_MEDICOS` | Documentos médicos |

---

## Prioridad de Migración

### Alta Prioridad (Core)
1. ✅ Auth (login/logout)
2. ✅ Users (perfiles estático/dinámico)
3. ✅ Dashboard/Analytics

### Media Prioridad (Negocio)
4. 🔄 Nutrition (planes, alimentos, recetas)
5. 🔄 Training (fuerza, planes, programas)

### Baja Prioridad (Especializado)
6. ⏳ Telemedicine
7. ⏳ Admin

---

*Documento generado: 2025-01-13*
*Total endpoints identificados: 101*
*Total funciones identificadas: 60+*
