# OMV3 — Bruno API Collection

Colección Bruno para testear la REST API v3 (Flask, ~110 endpoints en 10 blueprints) que vive en `src/api/v3/`.

## Modos de uso

### 1. Bruno Desktop (interactivo)

1. Instalar Bruno desde https://www.usebruno.com/downloads
2. En Bruno: **File → Open Collection** → seleccionar esta carpeta `bruno/`
3. En la barra superior, seleccionar el environment **`local`**
4. Editar el environment `local` (icono de engranaje) y completar:
   - `testEmail` / `testPassword` — credenciales de un usuario normal
   - `adminEmail` / `adminPassword` — credenciales de un usuario admin (opcional, para endpoints `/admin/*`)
5. Levantar el backend en otra terminal:
   ```bash
   source .venv/Scripts/activate   # Windows/bash
   python src/main.py
   ```
6. Correr `00-health/health.bru` → debe devolver `200`.
7. Correr `01-auth/login.bru` → automáticamente guarda `token`, `userId` y `userDni` en el environment.
8. Cualquier request autenticado (ej: `02-users/get-me-by-id.bru`) ya funciona sin pegar token a mano.

### 2. CLI (automatizado, runeable en CI)

```bash
cd omega-medicina-app
npm install                # instala @usebruno/cli si no estaba
npm run test:api:auth      # smoke test rápido (solo blueprint auth)
npm run test:api           # corre toda la colección contra local
```

Antes de correr, el backend debe estar levantado y las credenciales de testing configuradas. Para CI, exportá las variables como env-vars o usá un environment dedicado.

## Estructura

```
bruno/
├── bruno.json                # config root (no editar a mano)
├── environments/
│   ├── local.bru             # http://localhost:8000/api/v3
│   └── production.bru        # https://api.omegamedicina.com/api/v3
├── 00-health/                # /health, /
├── 01-auth/                  # /auth/* (login con script auto-token)
├── 02-users/                 # /users/* + measurements + goals
├── 03-nutrition/             # /nutrition/* (plans, recipes, foods, solver, daily-log)
├── 04-training/              # /training/* (strength, lifts, sessions, plans, programs)
├── 05-analytics/             # /analytics/* (dashboard, body-comp, calculators)
├── 06-admin/                 # /admin/* (todos requieren admin)
├── 07-telemedicine/          # /telemedicine/*
├── 08-assignments/           # /assignments/*
├── 09-engagement/            # /engagement/*
└── 10-checkin/               # /checkin/*
```

## Cómo funciona el auth flow

`01-auth/login.bru` corre POST a `/auth/login` y, en su `script:post-response`, ejecuta:

```js
bru.setEnvVar("token", res.body.data.token);
bru.setEnvVar("userId", res.body.data.user.id);
bru.setEnvVar("userDni", res.body.data.user.dni);
```

Todos los demás `.bru` referencian:
- Header `Authorization: Bearer {{token}}`
- Path params como `{{userId}}` o `{{userDni}}`

JWT vive 24h (configurado en `src/api/v3/common/auth.py`). Cuando expire, correr login de nuevo.

## Endpoints que pueden fallar al primer intento

Algunos requests dependen de IDs que no existen en una DB recién creada (ej: `delete-measurement`, `update-recipe`, `cancel-assignment`). Antes de correrlos, asegurate de tener ese recurso creado. La suite completa (`npm run test:api`) reportará esos como fails — esperado.

## Documentación de la API

- Mapa de endpoints: ver `CLAUDE.md` (raíz del repo) sección "API v3 Architecture"
- Patrones de respuesta: `src/api/v3/common/responses.py`
- Auth + JWT: `src/api/v3/common/auth.py`
