# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

OMV3 is a health, nutrition, and training platform **in active migration** from a legacy Flask/Jinja web app to an Expo React Native mobile app. The Jinja web templates are legacy — consult them only to understand business logic that needs to be migrated. The active development targets are:

- **`src/api/v3/`** — Flask REST API (the only Flask code being actively developed)
- **`omega-medicina-app/`** — Expo React Native app (primary frontend)

## Running the Application

### Backend (Flask API, port 8000)
```bash
source .venv/Scripts/activate   # Windows/bash
python src/main.py
```

### Mobile App (Expo, port 8081)
```bash
cd omega-medicina-app
npx expo start --web --port 8081
# or via dev.bat (Windows) — option 5 for frontend only, 4 for backend only
```

## Mobile App Commands (run from `omega-medicina-app/`)

```bash
npm run lint              # ESLint on src/
npm run lint:fix
npm run typecheck         # tsc --noEmit

npm test                  # All Jest tests
npm run test:unit         # Unit tests (src/services)
npm run test:integration  # Integration tests (src/components)
npm run test:coverage
npm run test:watch
npm run test:quick        # Unit + integration, no E2E
```

There are no automated tests for the Python backend. Ad-hoc scripts exist in `scripts/` for manual verification.

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

## Mobile App Structure (`omega-medicina-app/`)

- `app/` — Expo Router file-based routing; role-based groups: `(admin)`, `(auth)`, `(doctor)`, `(patient)`, `(public)`
- `src/services/` — API client layer (calls `/api/v3/`)
- `src/components/` — Reusable React Native components
- `src/contexts/` — React contexts (auth, etc.)
- `src/hooks/` — Custom hooks
- `src/models/` — TypeScript types/interfaces
- `src/core/mock-data/` — Faker.js test data generators

Tech stack: TypeScript, Expo Router, React Query (`@tanstack/react-query`), Zod, React Hook Form.

### API client pattern

All HTTP calls go through `src/services/api/apiClient.ts` (exported singleton `apiClient`). Token is stored in SecureStore (iOS/Android) or AsyncStorage (web). Domain services wrap the client:

```typescript
// src/services/api/someService.ts
import { apiClient } from './apiClient'
import { ENDPOINTS } from './config'

export const someService = {
  async getResource(id: string) {
    return apiClient.get<ResourceType>(ENDPOINTS.RESOURCE, { id })
  },
  async createResource(payload: CreatePayload) {
    return apiClient.post<ResourceType>(ENDPOINTS.CREATE_RESOURCE, payload)
  }
}
```

API base URL: `http://localhost:8000/api/v3` in dev (`__DEV__ === true`), `https://api.omegamedicina.com/api/v3` in production.

All endpoints are mapped in `src/services/api/config.ts` (`ENDPOINTS` object).

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
