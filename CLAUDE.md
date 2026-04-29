# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

OMV3 is a health, nutrition, and training platform **in active migration** from a legacy Flask/Jinja web app to a responsive web frontend (Vite + React) that targets desktop, mobile web, and native (Android/iOS via Capacitor). The Jinja web templates are legacy — consult them only to understand business logic that needs to be migrated. The active development targets are:

- **`src/api/v3/`** — Flask REST API (the only Flask code being actively developed)
- **`frontend/`** — Vite + React + TypeScript app (primary frontend, intended to wrap with Capacitor for native)

## Running the Application

### Backend (Flask API, port 8000)
```bash
source .venv/Scripts/activate   # Windows/bash
python src/main.py
```

### Frontend (Vite, port 5173)
```bash
cd frontend
npm install   # first time only
npm run dev   # starts Vite dev server with /api proxy to localhost:8000
```

## Frontend Commands (run from `frontend/`)

```bash
npm run dev        # Vite dev server (port 5173, /api proxied to backend)
npm run build      # Production build → dist/
npm run preview    # Preview the production build locally
npx tsc --noEmit   # TypeScript typecheck
```

There are no automated tests yet for the frontend, nor for the Python backend. Ad-hoc scripts exist in `scripts/` for manual verification.

## API v3 Architecture (`src/api/v3/`)

Mounted at `/api/v3/*`, CORS enabled for all origins. Each sub-blueprint is a directory:

| Blueprint | Prefix | Description |
|---|---|---|
| `auth/` | `/api/v3/auth/` | JWT authentication |
| `users/` | `/api/v3/users/` | User profiles |
| `nutrition/` | `/api/v3/nutrition/` | Meal plans, food blocks |
| `training/` | `/api/v3/training/` | Sessions, strength data |
| `telemedicine/` | `/api/v3/telemedicine/` | Clinical management |
| `analytics/` | `/api/v3/analytics/` | Dashboards, calculators |
| `admin/` | `/api/v3/admin/` | Administration |
| `assignments/` | `/api/v3/assignments/` | Patient-professional assignments |
| `engagement/` | `/api/v3/engagement/` | Engagement tracking |
| `checkin/` | `/api/v3/checkin/` | Check-in flows |

Health check: `GET /api/v3/health`

CSRF is disabled for all `/api/` routes (enforced in `main.py`'s `before_request`).

### Shared utilities (`src/api/v3/common/`)

- `auth.py` — JWT generation/validation and auth decorators
- `responses.py` — Standardized response helpers
- `database.py` — DB connection helpers and query utilities

### Standard endpoint pattern

```python
from ..common.auth import require_auth, get_current_user
from ..common.responses import success_response, error_response, ErrorCodes
from ..common.database import get_db_connection
import sqlite3

@blueprint_bp.route('/resource', methods=['GET'])
@require_auth
def get_resource():
    user = get_current_user()  # {'user_id', 'dni', 'email', 'rol', 'is_admin'}
    try:
        conn = get_db_connection(sqlite3.Row)
        # ... logic ...
        return success_response({'key': value})
    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)
```

**Auth decorators:** `@require_auth`, `@require_admin`, `@require_owner_or_admin`

**Response format** (all endpoints must use these helpers):
```python
# Success: {"success": true, "data": {...}, "meta": {"timestamp": ..., "version": "v3"}}
success_response(data, message=None, status_code=200)

# Error: {"success": false, "error": {"code": "...", "message": "..."}, "meta": {...}}
error_response(message, code=ErrorCodes.INTERNAL_ERROR, status_code=500, details=None)

# Paginated: adds "pagination" key with page/per_page/total/has_next/has_prev
paginated_response(data, total, page, per_page)
```

**Error codes:** `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `CONFLICT` (409), `TOKEN_INVALID` (401), `INTERNAL_ERROR` (500).

### Other backend files (legacy — do not extend)
- `src/main.py` — Flask app + legacy web routes
- `src/functions.py` — Business logic (nutrition, food catalog) — **read to understand domain logic for migration**
- `src/training.py` — Training module logic
- `src/templates/` — Jinja templates (legacy reference only)

## Databases (SQLite)

| File | Contents |
|---|---|
| `src/Basededatos` | Main DB (no extension): users, nutrition, training — legacy schema |
| `src/telemedicina.db` | Legacy clinical data |
| `src/auth.db` | Auth users (`users`), `patient_user_link` (auth↔DNI bridge), `audit_log` |
| `src/db/clinical.db` | New v3 clinical schema (snake_case) |
| `src/db/schema.sql` | Schema definition for `clinical.db` |

Legacy tables use `USER_DNI` as FK. New v3 schema in `clinical.db` uses `patient_id`. Key legacy table groups in `src/Basededatos`:
- **Users**: `USUARIOS`, `PERFILESTATICO`, `PERFILDINAMICO`
- **Nutrition**: `ALIMENTOS`, `GRUPOSALIMENTOS`, `DIETA`, `PLANES_ALIMENTARIOS`, `PLAN_BLOQUES_PRESETS`, `PLAN_BLOQUES_FAVORITOS`
- **Training**: `FUERZA`, `PLANES_ENTRENAMIENTO`, `MATRIZ_ENTRENAMIENTO`

**DB connection helpers** (from `common/database.py`):
```python
get_db_connection()        # src/Basededatos (legacy main)
get_auth_connection()      # src/auth.db
get_telemed_connection()   # src/telemedicina.db
get_clinical_connection()  # src/db/clinical.db

# Identity resolution
resolve_patient_id(user_id_or_name)    # Returns {patient_id, dni, nombre}
resolve_user_identity(user_id_or_name) # Returns {dni, nombre_apellido}
```

```bash
# DB backup
cp src/Basededatos src/Basededatos_backup

# Run SQL migration
sqlite3 src/Basededatos ".read migrations/NNN_script.sql"
```

## Frontend Structure (`frontend/`)

Vite + React 19 + TypeScript. State-based routing (no router lib yet — single `screen` state in `App.tsx`).

- `src/components/` — Reusable UI: `Sidebar`, `Topbar`, `Icon`, `atoms.tsx` (KPI, Avatar, Chip, Progress)
- `src/screens/` — Page-level components (`Login`, `PatientHome`, `Placeholder`)
- `src/services/` — API layer: `apiClient.ts` (fetch wrapper + token store), `authService.ts`
- `src/types/` — TypeScript types (`api.ts` with `Role`, `AuthUser`, `ApiResponse<T>`)
- `src/styles/` — `desktop.css` (design system from Claude Design mockups), `responsive.css` (tablet + mobile breakpoints)
- `_design-reference/` — Original Claude Design mockup HTML/JSX/CSS files (NOT imported by build, reference only)
- `public/assets/` — Logos and static images

### API client pattern

All HTTP calls go through `src/services/apiClient.ts`. Token stored in `localStorage` under key `omd.token`. Domain services wrap the client:

```typescript
// src/services/someService.ts
import { api } from './apiClient'

export const someService = {
  getResource: (id: string) => api.get<ResourceType>(`/resource/${id}`),
  createResource: (payload: Payload) => api.post<ResourceType>('/resource', payload),
}
```

API base URL:
- **Dev:** empty string — Vite proxies `/api/*` to `http://localhost:8000` (configured in `vite.config.ts`)
- **Prod:** `VITE_API_URL` env var (empty string by default → same-origin). PA deploy is at `https://megamedicina.pythonanywhere.com` and serves the built frontend itself, so no override is needed there.

All API responses follow the v3 envelope (`{ success, data, meta }` or `{ success: false, error, meta }`); the client unwraps `data` on success and throws `ApiError` on failure.

### Future: Capacitor

The frontend is structured to wrap with Capacitor (`npx cap init`, `npx cap add android`, `npx cap add ios`) for native Android/iOS apps that share the same codebase as the web build.

## Migration Notes

When migrating features from the legacy web app to the mobile app:
1. Read the relevant Jinja template (`src/templates/`) to understand UX and flow
2. Read `src/functions.py` or `src/main.py` to understand the underlying business logic
3. Implement the logic in a new `src/api/v3/<module>/` endpoint
4. Consume from the mobile app via `omega-medicina-app/src/services/`

## Environment Variables

| Variable | Used in | Default |
|---|---|---|
| `JWT_SECRET` | `src/api/v3/common/auth.py` | `omega_medicina_secret_key_2025` |

No `.env.example` exists. Set `JWT_SECRET` in a `.env` file for non-default deployments.

## Documentation
- `docs/arquitectura.md` — System architecture
- `docs/modelo_datos.md` — DB schema and relations
- `docs/nutricion/` — Nutrition block system details
- `migrations/` — SQL migration scripts
