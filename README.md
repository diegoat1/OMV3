# OMV3 — Plataforma de Salud, Nutrición y Entrenamiento

Plataforma de planificación nutricional por bloques (P/G/C), seguimiento de salud, entrenamiento de fuerza y telemedicina.

> **Estado:** migración activa desde la web Flask/Jinja original hacia un frontend SPA (Vite + React + TypeScript) que se sirve en escritorio, web móvil y Android nativo (vía Capacitor), consumiendo una API REST `v3`.

## Arquitectura

```
┌──────────────────────────┐        ┌──────────────────────────┐
│  frontend/  (Vite + React)│ ─────▶ │  src/api/v3/  (Flask API) │ ─────▶ SQLite (×4)
│  desktop · web móvil      │  /api  │  JWT · CORS · v3 envelope │
│  Android (Capacitor)      │        └──────────────────────────┘
└──────────────────────────┘
                                     ┌─ src/main.py + templates/  (legacy Jinja, solo lectura)
```

- **Backend activo:** `src/api/v3/` — API REST con JWT, CORS y envelope estándar `{ success, data, meta }`.
- **Frontend activo:** `frontend/` — Vite + React 19 + TypeScript. Capacitor para empaquetar Android.
- **Legacy (referencia):** `src/main.py`, `src/functions.py`, `src/templates/`, `src/static/` — la web Jinja original. Se consulta para entender la lógica de negocio que se está migrando, **no se extiende**.

## Puesta en marcha

### Backend (Flask, puerto 8000)

```bash
python -m venv .venv
source .venv/bin/activate            # macOS/Linux
# .\.venv\Scripts\activate           # Windows

pip install -r requirements.txt
python src/main.py                   # http://127.0.0.1:8000
```

Health check: `GET http://127.0.0.1:8000/api/v3/health`.

### Frontend (Vite, puerto 5173)

```bash
cd frontend
npm install                          # primera vez
npm run dev                          # http://localhost:5173 (proxy /api → :8000)
```

Otros comandos en `frontend/`:

| Comando | Uso |
|---|---|
| `npm run build` | Build de producción a `frontend/dist/` |
| `npm run preview` | Servir el build localmente |
| `npx tsc --noEmit` | Type-check |
| `npm run lint` | ESLint |

### Android (Capacitor)

El proyecto Android vive en `frontend/android/`. Tras un `npm run build`:

```bash
cd frontend
npx cap sync android
npx cap open android                 # abre Android Studio
```

## API v3

Montada en `/api/v3/*`. Todos los endpoints usan helpers de `src/api/v3/common/` y devuelven el envelope estándar.

| Blueprint | Prefijo | Contenido |
|---|---|---|
| `auth/` | `/api/v3/auth/` | Login, registro, validación JWT |
| `users/` | `/api/v3/users/` | Perfiles |
| `nutrition/` | `/api/v3/nutrition/` | Planes alimentarios, bloques, biblioteca |
| `training/` | `/api/v3/training/` | Sesiones, fuerza |
| `telemedicine/` | `/api/v3/telemedicine/` | Gestión clínica |
| `analytics/` | `/api/v3/analytics/` | Dashboards, calculadoras |
| `admin/` | `/api/v3/admin/` | Administración |
| `assignments/` | `/api/v3/assignments/` | Asignaciones paciente↔profesional |
| `engagement/` | `/api/v3/engagement/` | Tracking de adherencia |
| `checkin/` | `/api/v3/checkin/` | Flujos de check-in |

**Formato de respuesta:**

```json
// Éxito
{ "success": true, "data": { ... }, "meta": { "timestamp": "...", "version": "v3" } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." }, "meta": { ... } }
```

**Decoradores de auth:** `@require_auth`, `@require_admin`, `@require_owner_or_admin`. CSRF está desactivado para todas las rutas bajo `/api/`.

## Base de datos

Cuatro SQLite conviven mientras dura la migración:

| Archivo | Propósito |
|---|---|
| `src/Basededatos` | Base principal legacy (usuarios, nutrición, entrenamiento) |
| `src/auth.db` | Autenticación v3 (`users`, `patient_user_link`, `audit_log`) |
| `src/telemedicina.db` | Datos clínicos legacy |
| `src/db/clinical.db` | Esquema clínico nuevo (snake_case, `patient_id` como FK) — `src/db/schema.sql` |

Helpers en `src/api/v3/common/database.py`: `get_db_connection()`, `get_auth_connection()`, `get_telemed_connection()`, `get_clinical_connection()`, más `resolve_patient_id()` y `resolve_user_identity()` para puentear DNI ↔ user_id.

```bash
# Backup rápido
cp src/Basededatos src/Basededatos_backup

# Ejecutar una migración
sqlite3 src/Basededatos ".read migrations/NNN_script.sql"
```

## Estructura del repositorio

```
src/
├── api/v3/              # API REST activa
│   ├── common/          # auth.py, responses.py, database.py
│   └── <blueprint>/     # routes.py por módulo
├── db/                  # Esquema nuevo (clinical.db)
├── main.py              # App Flask + rutas legacy (Jinja)
├── functions.py         # Lógica legacy (referencia para migración)
├── templates/           # Vistas Jinja (legacy)
├── static/              # CSS/JS legacy
├── Basededatos          # SQLite principal
└── auth.db, telemedicina.db

frontend/
├── src/
│   ├── components/      # Sidebar, Topbar, Icon, atoms.tsx
│   ├── screens/         # Login, PatientHome, Placeholder
│   ├── services/        # apiClient.ts (token + envelope), authService.ts
│   ├── types/           # api.ts (Role, AuthUser, ApiResponse<T>)
│   └── styles/          # desktop.css, responsive.css
├── _design-reference/   # Mockups originales (no se compilan)
├── android/             # Proyecto Android (Capacitor)
└── public/

migrations/              # Scripts SQL de migración
docs/                    # Documentación funcional y guías
scripts/                 # Utilidades ad-hoc
```

## Variables de entorno

| Variable | Usada en | Default |
|---|---|---|
| `JWT_SECRET` | `src/api/v3/common/auth.py` | `omega_medicina_secret_key_2025` |
| `VITE_API_URL` | `frontend/` (build de producción) | `""` (mismo origen) |

En desarrollo el frontend deja `VITE_API_URL` vacío y Vite proxea `/api/*` al backend (ver `frontend/vite.config.ts`).

## Despliegue

PythonAnywhere (cuenta `omegamedicina`): `wsgi.py` sirve la API y el SPA buildeado desde el mismo origen, así que `VITE_API_URL` no necesita override en producción.

## Documentación

- Arquitectura: [`docs/arquitectura.md`](docs/arquitectura.md)
- Modelo de datos: [`docs/modelo_datos.md`](docs/modelo_datos.md)
- Bloques nutricionales: [`docs/nutricion/`](docs/nutricion/)
- Migraciones: [`docs/migraciones/`](docs/migraciones/)
- Guías por módulo: [`docs/modulo_nutricion.md`](docs/modulo_nutricion.md), [`docs/modulo_entrenamiento.md`](docs/modulo_entrenamiento.md), [`docs/modulo_salud.md`](docs/modulo_salud.md)
- Cambios: [`CHANGELOG.md`](CHANGELOG.md)

## Tests

Aún no hay tests automatizados ni en backend ni en frontend. Para verificación manual: pasos en `docs/testing/` y scripts ad-hoc en `scripts/`.

## Convenciones

- **Nuevos endpoints** van siempre en `src/api/v3/<blueprint>/routes.py` y devuelven `success_response` / `error_response`.
- **No extender** `src/main.py`, `src/functions.py` ni `src/templates/` — son legacy.
- **Frontend:** todas las llamadas HTTP pasan por `frontend/src/services/apiClient.ts`. El token se guarda en `localStorage` bajo `omd.token`.
