# OMV3 API Design - RESTful API para Omega Medicina

## Resumen Ejecutivo

Este documento define la estructura de la nueva API RESTful para OMV3, basada en el análisis exhaustivo del sistema legacy Flask (`main.py` - 6521 líneas, `functions.py` - 4864 líneas).

### Tecnologías Actuales (Legacy)
- **Backend**: Flask + SQLite
- **Bases de Datos**: 
  - `src/Basededatos` (usuarios, nutrición, entrenamiento)
  - `src/telemedicina.db` (gestión clínica)
- **Autenticación**: Session-based (DNI + Email)
- **Admin**: Usuario hardcodeado ('Toffaletti, Diego Alejandro')

### Tecnologías Objetivo
- **Backend**: Flask API con Blueprints organizados por módulo
- **Autenticación**: JWT tokens (ya implementado en `/api/v2/`)
- **Base de Datos**: Firebase (migración en progreso) + SQLite legacy
- **Frontend**: React Native (Expo) - ya en desarrollo

---

## Módulos Identificados

### 1. 🔐 AUTH - Autenticación y Autorización
### 2. 👤 USERS - Gestión de Usuarios y Perfiles
### 3. 🍎 NUTRITION - Nutrición y Planes Alimentarios
### 4. 💪 TRAINING - Entrenamiento y Fuerza
### 5. 🏥 TELEMEDICINE - Telemedicina y Salud
### 6. 📊 ANALYTICS - Análisis y Dashboard
### 7. ⚙️ ADMIN - Administración

---

## 1. 🔐 AUTH Module

### Endpoints Existentes (Legacy)
| Método | Ruta Legacy | Descripción |
|--------|-------------|-------------|
| GET/POST | `/login` | Login con email + DNI |
| GET | `/logout` | Cerrar sesión |

### Endpoints API v3 Propuestos
```
POST   /api/v3/auth/login              # Login con JWT
POST   /api/v3/auth/logout             # Invalidar token
POST   /api/v3/auth/refresh            # Refrescar token
GET    /api/v3/auth/validate           # Validar token actual
POST   /api/v3/auth/password/reset     # Solicitar reset
POST   /api/v3/auth/password/change    # Cambiar contraseña
```

### Esquema de Respuesta
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_856ad758d96a",
    "dni": "37070509",
    "email": "datoffaletti@gmail.com",
    "nombre_apellido": "Toffaletti, Diego Alejandro",
    "rol": "admin",
    "is_admin": true
  }
}
```

---

## 2. 👤 USERS Module

### Endpoints Existentes (Legacy)
| Método | Ruta Legacy | Descripción |
|--------|-------------|-------------|
| GET/POST | `/create` | Crear perfil estático |
| GET/POST | `/editperfilest/<DNI>` | Editar perfil estático |
| GET | `/delperfilest/<DNI>` | Eliminar perfil estático |
| GET/POST | `/update` | Actualizar perfil dinámico |
| GET/POST | `/editperfildin/<ID>` | Editar perfil dinámico |
| GET | `/delperfildin/<ID>` | Eliminar perfil dinámico |

### Endpoints API v3 Propuestos
```
# Perfil Estático (datos fijos: DNI, nombre, sexo, altura, etc.)
GET    /api/v3/users                          # Lista usuarios (admin)
GET    /api/v3/users/:id                      # Obtener usuario
POST   /api/v3/users                          # Crear usuario
PUT    /api/v3/users/:id                      # Actualizar usuario
DELETE /api/v3/users/:id                      # Eliminar usuario

# Perfil Dinámico (mediciones: peso, circunferencias, composición corporal)
GET    /api/v3/users/:id/measurements         # Historial de mediciones
POST   /api/v3/users/:id/measurements         # Nueva medición
GET    /api/v3/users/:id/measurements/:mid    # Medición específica
PUT    /api/v3/users/:id/measurements/:mid    # Actualizar medición
DELETE /api/v3/users/:id/measurements/:mid    # Eliminar medición

# Objetivos
GET    /api/v3/users/:id/goals                # Objetivos del usuario
POST   /api/v3/users/:id/goals                # Crear objetivo
PUT    /api/v3/users/:id/goals/:gid           # Actualizar objetivo
DELETE /api/v3/users/:id/goals/:gid           # Eliminar objetivo
GET    /api/v3/users/:id/goals/auto           # Objetivos automáticos calculados
```

### Tablas SQLite Relacionadas
- `PERFILESTATICO`: DNI, NOMBRE_APELLIDO, SEXO, ALTURA, EMAIL, TELEFONO, FECHA_NACIMIENTO
- `PERFILDINAMICO`: ID, NOMBRE_APELLIDO, FECHA_REGISTRO, PESO, CIRC_ABDOMEN, CIRC_CINTURA, CIRC_CADERA, BF%, FFMI, PESO_MAGRO, PESO_GRASO
- `OBJETIVO`: NOMBRE_APELLIDO, PESO_OBJETIVO, BF_OBJETIVO, FFMI_OBJETIVO, etc.

---

## 3. 🍎 NUTRITION Module

### Endpoints Existentes (Legacy)
| Método | Ruta Legacy | Descripción |
|--------|-------------|-------------|
| GET/POST | `/planner` | Planificador nutricional |
| GET | `/api/planner/plan-automatico/<nombre>` | Plan automático |
| GET/POST | `/editplan/<ID>` | Editar plan |
| GET | `/delplan/<ID>` | Eliminar plan |
| GET/POST | `/createfood` | Crear alimento |
| GET/POST | `/editfood/<ID>` | Editar alimento |
| GET | `/deletefood/<ID>` | Eliminar alimento |
| GET/POST | `/recipecreator` | Crear receta |
| GET | `/deleterecipe/<ID>` | Eliminar receta |
| GET | `/size/<food>` | Tamaños de porción |
| GET/POST | `/recipe` | Calcular receta |
| GET/POST | `/diet` | Procesar dieta |
| GET | `/plan-alimentario` | Plan alimentario |
| GET | `/api/plan-alimentario/info` | Info del plan |
| GET | `/api/plan-alimentario/recetas` | Lista recetas |
| POST | `/api/plan-alimentario/guardar` | Guardar plan |
| GET | `/api/plan-alimentario/plan-guardado` | Plan guardado |
| POST | `/api/plan-alimentario/lista-compras` | Lista de compras |
| POST | `/api/plan-alimentario/bloques/ajustar` | Ajustar bloques |
| GET | `/api/plan-alimentario/bloques/sugerencias` | Sugerencias bloques |
| POST | `/api/plan-nutricional/ajustar-calorias` | Ajustar calorías |
| GET | `/api/grupos-alimentos` | Grupos de alimentos |

### Endpoints API v3 Propuestos
```
# Planes Nutricionales
GET    /api/v3/nutrition/plans                     # Lista planes del usuario
POST   /api/v3/nutrition/plans                     # Crear plan
GET    /api/v3/nutrition/plans/:id                 # Obtener plan
PUT    /api/v3/nutrition/plans/:id                 # Actualizar plan
DELETE /api/v3/nutrition/plans/:id                 # Eliminar plan
GET    /api/v3/nutrition/plans/auto/:userId        # Generar plan automático
POST   /api/v3/nutrition/plans/:id/adjust-calories # Ajustar calorías

# Alimentos
GET    /api/v3/nutrition/foods                     # Lista alimentos
POST   /api/v3/nutrition/foods                     # Crear alimento
GET    /api/v3/nutrition/foods/:id                 # Obtener alimento
PUT    /api/v3/nutrition/foods/:id                 # Actualizar alimento
DELETE /api/v3/nutrition/foods/:id                 # Eliminar alimento
GET    /api/v3/nutrition/foods/:id/portions        # Tamaños de porción
GET    /api/v3/nutrition/food-groups               # Grupos de alimentos

# Recetas
GET    /api/v3/nutrition/recipes                   # Lista recetas
POST   /api/v3/nutrition/recipes                   # Crear receta
GET    /api/v3/nutrition/recipes/:id               # Obtener receta
PUT    /api/v3/nutrition/recipes/:id               # Actualizar receta
DELETE /api/v3/nutrition/recipes/:id               # Eliminar receta
POST   /api/v3/nutrition/recipes/:id/calculate     # Calcular porciones

# Plan Alimentario (Meal Planning)
GET    /api/v3/nutrition/meal-plans                # Planes alimentarios
POST   /api/v3/nutrition/meal-plans                # Crear plan alimentario
GET    /api/v3/nutrition/meal-plans/:id            # Obtener plan
PUT    /api/v3/nutrition/meal-plans/:id            # Actualizar plan
DELETE /api/v3/nutrition/meal-plans/:id            # Eliminar plan
POST   /api/v3/nutrition/meal-plans/:id/shopping   # Generar lista compras

# Bloques Nutricionales (Sistema de Bloques)
GET    /api/v3/nutrition/blocks/suggestions        # Sugerencias de bloques
POST   /api/v3/nutrition/blocks/adjust             # Ajustar bloques
GET    /api/v3/nutrition/blocks/presets            # Presets globales
POST   /api/v3/nutrition/blocks/favorites          # Guardar favorito
DELETE /api/v3/nutrition/blocks/favorites/:id      # Eliminar favorito
```

### Tablas SQLite Relacionadas
- `DIETA`: Plan nutricional con macros y distribución por comidas
- `ALIMENTOS`: Base de datos de alimentos
- `GRUPOSALIMENTOS`: Grupos de alimentos con bloques
- `RECETAS`: Recetas con ingredientes
- `PLANES_ALIMENTARIOS`: Planes alimentarios guardados
- `PLAN_BLOQUES_PRESETS`: Presets de bloques
- `PLAN_BLOQUES_FAVORITOS`: Favoritos del usuario

---

## 4. 💪 TRAINING Module

### Endpoints Existentes (Legacy)
| Método | Ruta Legacy | Descripción |
|--------|-------------|-------------|
| GET | `/strengthstandard` | Estándares de fuerza |
| GET | `/api/user-exercises/<user>` | Ejercicios del usuario |
| GET | `/api/lifts` | Levantamientos |
| GET | `/api/lifts/<username>` | Levantamientos por usuario |
| POST | `/api/lifts` | Guardar levantamiento |
| GET | `/api/past_lifts` | Historial de levantamientos |
| GET | `/api/past_lifts/<username>` | Historial por usuario |
| POST | `/api/submit-strength-results` | Enviar resultados |
| GET | `/strengthdata` | Datos de fuerza |
| GET | `/historial-fuerza` | Historial de fuerza |
| GET | `/eliminar_registro_fuerza/<id>` | Eliminar registro |
| GET | `/optimizar_entrenamiento/<id>` | Optimizar entrenamiento |
| GET/POST | `/trainingplanner` | Planificador entrenamiento |
| GET | `/entrenamiento_actual` | Entrenamiento actual |
| POST | `/registrar_sesion` | Registrar sesión |
| POST | `/avanzar_dia` | Avanzar día |
| GET | `/plan_entrenamiento` | Plan de entrenamiento |
| GET | `/programas-entrenamientos` | Programas gratuitos |
| GET | `/programa/<id>` | Detalle de programa |

### Endpoints API v3 Propuestos
```
# Análisis de Fuerza
GET    /api/v3/training/strength                   # Datos de fuerza del usuario
POST   /api/v3/training/strength                   # Registrar test de fuerza
GET    /api/v3/training/strength/history           # Historial de fuerza
DELETE /api/v3/training/strength/:id               # Eliminar registro
GET    /api/v3/training/strength/standards         # Estándares de fuerza

# Levantamientos
GET    /api/v3/training/lifts                      # Levantamientos actuales
POST   /api/v3/training/lifts                      # Registrar levantamiento
GET    /api/v3/training/lifts/history              # Historial de levantamientos
GET    /api/v3/training/exercises                  # Lista de ejercicios

# Planes de Entrenamiento
GET    /api/v3/training/plans                      # Planes del usuario
POST   /api/v3/training/plans                      # Crear plan
GET    /api/v3/training/plans/:id                  # Obtener plan
PUT    /api/v3/training/plans/:id                  # Actualizar plan
DELETE /api/v3/training/plans/:id                  # Eliminar plan
POST   /api/v3/training/plans/:id/optimize         # Optimizar con PuLP
GET    /api/v3/training/plans/:id/predictions      # Predicciones

# Sesiones de Entrenamiento
GET    /api/v3/training/sessions/current           # Sesión actual
POST   /api/v3/training/sessions                   # Registrar sesión
POST   /api/v3/training/sessions/advance           # Avanzar día

# Programas Gratuitos
GET    /api/v3/training/programs                   # Lista de programas
GET    /api/v3/training/programs/:id               # Detalle de programa
```

### Tablas SQLite Relacionadas
- `FUERZA`: Registros de tests de fuerza
- `PLANES_ENTRENAMIENTO`: Planes de entrenamiento generados
- `MATRIZ_ENTRENAMIENTO`: Matriz de ejercicios
- `ESTADO_EJERCICIO_USUARIO`: Estado actual de cada ejercicio

---

## 5. 🏥 TELEMEDICINE Module

### Endpoints Existentes (Legacy)
| Método | Ruta Legacy | Descripción |
|--------|-------------|-------------|
| GET | `/telemedicina` | Panel telemedicina |
| GET | `/telemedicina/pacientes` | Lista pacientes |
| GET | `/telemedicina/situacion` | Situación clínica |
| GET | `/telemedicina/documentos` | Documentos |
| GET/POST | `/api/telemed/pacientes` | CRUD pacientes |
| GET/POST/DELETE | `/api/telemed/situacion` | CRUD situaciones |
| GET/POST/PUT/DELETE | `/api/telemed/documentos` | CRUD documentos |
| POST | `/api/telemed/documentos/upload` | Subir a Drive |
| GET/POST | `/api/historia-medica` | Historia médica |
| GET/POST | `/api/signos-vitales` | Signos vitales |
| GET/POST | `/api/citas-medicas` | Citas médicas |
| GET/POST | `/api/programas-prevencion` | Programas prevención |

### Endpoints API v3 Propuestos
```
# Pacientes
GET    /api/v3/telemedicine/patients               # Lista pacientes
POST   /api/v3/telemedicine/patients               # Crear paciente
GET    /api/v3/telemedicine/patients/:id           # Obtener paciente
PUT    /api/v3/telemedicine/patients/:id           # Actualizar paciente
DELETE /api/v3/telemedicine/patients/:id           # Eliminar paciente

# Situaciones Clínicas
GET    /api/v3/telemedicine/situations             # Lista situaciones
POST   /api/v3/telemedicine/situations             # Crear situación
GET    /api/v3/telemedicine/situations/:id         # Obtener situación
PUT    /api/v3/telemedicine/situations/:id         # Actualizar situación
DELETE /api/v3/telemedicine/situations/:id         # Eliminar situación

# Documentos Clínicos
GET    /api/v3/telemedicine/documents              # Lista documentos
POST   /api/v3/telemedicine/documents              # Crear documento
GET    /api/v3/telemedicine/documents/:id          # Obtener documento
PUT    /api/v3/telemedicine/documents/:id          # Actualizar documento
DELETE /api/v3/telemedicine/documents/:id          # Eliminar documento
POST   /api/v3/telemedicine/documents/upload       # Subir archivo a Drive

# Historia Médica
GET    /api/v3/telemedicine/medical-history/:patientId    # Historia del paciente
POST   /api/v3/telemedicine/medical-history               # Agregar registro

# Signos Vitales
GET    /api/v3/telemedicine/vital-signs/:patientId        # Signos del paciente
POST   /api/v3/telemedicine/vital-signs                   # Registrar signos

# Citas Médicas
GET    /api/v3/telemedicine/appointments                  # Lista citas
POST   /api/v3/telemedicine/appointments                  # Crear cita
PUT    /api/v3/telemedicine/appointments/:id              # Actualizar cita
DELETE /api/v3/telemedicine/appointments/:id              # Cancelar cita

# Programas de Prevención
GET    /api/v3/telemedicine/prevention-programs           # Lista programas
POST   /api/v3/telemedicine/prevention-programs           # Crear programa
```

### Tablas SQLite Relacionadas (telemedicina.db)
- `TELEMED_PACIENTES`: Fichas de pacientes
- `TELEMED_SITUACIONES`: Situaciones clínicas
- `TELEMED_DOCUMENTOS`: Documentos con enlaces a Drive
- `HISTORIA_MEDICA`: Historia médica
- `SIGNOS_VITALES`: Registros de signos vitales
- `CITAS_MEDICAS`: Citas médicas
- `PROGRAMAS_PREVENCION`: Programas de prevención

---

## 6. 📊 ANALYTICS Module

### Endpoints Existentes (Legacy)
| Método | Ruta Legacy | Descripción |
|--------|-------------|-------------|
| GET | `/dashboard` | Dashboard principal |
| GET | `/resume` | Resumen del usuario |
| GET | `/caloriescal` | Calculadora de calorías |

### Endpoints API v3 Propuestos
```
# Dashboard
GET    /api/v3/analytics/dashboard                 # Dashboard completo
GET    /api/v3/analytics/summary                   # Resumen rápido

# Métricas de Composición Corporal
GET    /api/v3/analytics/body-composition          # Composición actual
GET    /api/v3/analytics/body-composition/history  # Historial
GET    /api/v3/analytics/body-composition/trends   # Tendencias

# Performance Clock (Sistema de Progreso)
GET    /api/v3/analytics/performance-clock         # Reloj de rendimiento
GET    /api/v3/analytics/scores                    # Scores (FFMI, BF, etc.)

# Calculadoras
POST   /api/v3/analytics/calculators/bmr           # Tasa metabólica basal
POST   /api/v3/analytics/calculators/tdee          # Gasto energético total
POST   /api/v3/analytics/calculators/body-fat      # Grasa corporal (Navy)
POST   /api/v3/analytics/calculators/ffmi          # FFMI
POST   /api/v3/analytics/calculators/weight-loss   # Pérdida de peso
POST   /api/v3/analytics/calculators/muscle-gain   # Ganancia muscular
```

### Datos Calculados
- **BMR**: Katch-McArdle (370 + 9.8 × Peso_Magro_lbs)
- **TDEE**: BMR × Factor_Actividad
- **BF%**: Método Navy (circunferencias)
- **FFMI**: Peso_Magro / Altura² + 6.1 × (1.8 - Altura)
- **Scores**: Categorización por percentiles

---

## 7. ⚙️ ADMIN Module

### Endpoints Existentes (Legacy)
| Método | Ruta Legacy | Descripción |
|--------|-------------|-------------|
| GET | `/databasemanager` | Gestor de BD |
| GET | `/databasemanager-beta` | Gestor BD beta |
| POST | `/api/database/update-cell` | Actualizar celda |
| GET | `/admin/api/buscar_usuarios` | Buscar usuarios |
| GET | `/api/v2/admin/stats` | Estadísticas |
| GET | `/api/v2/admin/users` | Lista usuarios |

### Endpoints API v3 Propuestos
```
# Gestión de Usuarios
GET    /api/v3/admin/users                         # Lista usuarios
GET    /api/v3/admin/users/:id                     # Detalle usuario
PUT    /api/v3/admin/users/:id/role                # Cambiar rol
DELETE /api/v3/admin/users/:id                     # Eliminar usuario

# Estadísticas
GET    /api/v3/admin/stats                         # Estadísticas generales
GET    /api/v3/admin/stats/users                   # Stats de usuarios
GET    /api/v3/admin/stats/nutrition               # Stats de nutrición
GET    /api/v3/admin/stats/training                # Stats de entrenamiento

# Base de Datos
GET    /api/v3/admin/database/tables               # Lista tablas
GET    /api/v3/admin/database/tables/:name         # Datos de tabla
PUT    /api/v3/admin/database/tables/:name/:id     # Actualizar registro
POST   /api/v3/admin/database/export/:table        # Exportar tabla

# Auditoría
GET    /api/v3/admin/audit-logs                    # Logs de auditoría
```

---

## Estructura de Archivos Propuesta

```
src/
├── api/
│   └── v3/
│       ├── __init__.py              # Blueprint principal
│       ├── auth/
│       │   ├── __init__.py
│       │   ├── routes.py            # Endpoints de auth
│       │   └── services.py          # Lógica de autenticación
│       ├── users/
│       │   ├── __init__.py
│       │   ├── routes.py            # Endpoints de usuarios
│       │   ├── services.py          # Lógica de usuarios
│       │   └── schemas.py           # Validación de datos
│       ├── nutrition/
│       │   ├── __init__.py
│       │   ├── routes.py            # Endpoints de nutrición
│       │   ├── services.py          # Lógica de nutrición
│       │   ├── calculators.py       # Calculadoras (macros, bloques)
│       │   └── schemas.py
│       ├── training/
│       │   ├── __init__.py
│       │   ├── routes.py            # Endpoints de entrenamiento
│       │   ├── services.py          # Lógica de entrenamiento
│       │   ├── optimizer.py         # Integración con PuLP
│       │   └── schemas.py
│       ├── telemedicine/
│       │   ├── __init__.py
│       │   ├── routes.py            # Endpoints de telemedicina
│       │   ├── services.py          # Lógica de telemedicina
│       │   ├── drive.py             # Integración Google Drive
│       │   └── schemas.py
│       ├── analytics/
│       │   ├── __init__.py
│       │   ├── routes.py            # Endpoints de analytics
│       │   ├── services.py          # Lógica de analytics
│       │   └── calculators.py       # BMR, TDEE, BF%, FFMI
│       ├── admin/
│       │   ├── __init__.py
│       │   ├── routes.py            # Endpoints de admin
│       │   └── services.py          # Lógica de admin
│       └── common/
│           ├── __init__.py
│           ├── auth.py              # Decoradores de autenticación
│           ├── database.py          # Conexiones a BD
│           ├── responses.py         # Formatos de respuesta
│           └── validators.py        # Validadores comunes
```

---

## Formato de Respuestas Estándar

### Éxito
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-13T10:30:00Z",
    "version": "v3"
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo 'peso' es requerido",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2025-01-13T10:30:00Z",
    "version": "v3"
  }
}
```

### Paginación
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

---

## Autenticación y Autorización

### Headers Requeridos
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Roles
- **admin**: Acceso completo (Diego Toffaletti)
- **user**: Acceso a sus propios datos
- **guest**: Solo endpoints públicos

### Decoradores
```python
@require_auth          # Requiere token válido
@require_admin         # Requiere rol admin
@require_owner_or_admin # Requiere ser dueño del recurso o admin
```

---

## Plan de Migración

### Fase 1: Infraestructura (Semana 1-2)
- [ ] Crear estructura de carpetas `/api/v3/`
- [ ] Implementar sistema de autenticación JWT
- [ ] Crear decoradores de autorización
- [ ] Configurar manejo de errores estándar

### Fase 2: Módulos Core (Semana 3-4)
- [ ] Migrar AUTH module
- [ ] Migrar USERS module
- [ ] Migrar ANALYTICS module (calculadoras)

### Fase 3: Módulos de Negocio (Semana 5-6)
- [ ] Migrar NUTRITION module
- [ ] Migrar TRAINING module

### Fase 4: Módulos Especializados (Semana 7-8)
- [ ] Migrar TELEMEDICINE module
- [ ] Migrar ADMIN module

### Fase 5: Testing y Documentación (Semana 9-10)
- [ ] Tests unitarios por módulo
- [ ] Tests de integración
- [ ] Documentación OpenAPI/Swagger
- [ ] Guía de migración para frontend

---

## Compatibilidad con Frontend Expo

El frontend React Native (Expo) ya tiene implementado:
- `ApiService.js` con métodos para llamar a la API
- `AuthContext.js` con manejo de tokens JWT
- Pantallas: Login, Dashboard, Profile, Admin

### Integración Requerida
1. Actualizar `API_CONFIG.ENDPOINTS` con nuevas rutas v3
2. Mantener compatibilidad con endpoints v2 existentes
3. Implementar manejo de errores consistente
4. Agregar interceptores para refresh de tokens

---

## Notas Técnicas

### Optimización con PuLP
El sistema de optimización de entrenamiento usa PuLP para resolver problemas de programación lineal. Este componente debe mantenerse en el backend Flask y exponerse vía API.

### Google Drive Integration
La integración con Google Drive para documentos de telemedicina requiere:
- Service Account o OAuth2
- Variables de entorno configuradas
- Manejo de errores de cuota

### Cálculos Nutricionales
Los cálculos de bloques nutricionales (P, G, C, E) siguen el sistema:
- 1P = 20g proteína
- 1G = 10g grasa
- 1C = 25g carbohidratos
- 1E = 100 kcal

---

*Documento generado: 2025-01-13*
*Basado en análisis de: main.py (6521 líneas), functions.py (4864 líneas)*
