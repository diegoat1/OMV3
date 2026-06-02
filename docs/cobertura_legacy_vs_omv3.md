# Cobertura Legacy → OMV3

> **Objetivo:** OMV3 (API v3 + frontend React) debe cubrir como mínimo todas las
> funciones de la app legacy Flask/Jinja en `src/`, respetando el flujo de usuario
> y la estética actuales. Lo que no se adapta queda planteado abajo para decisión.
>
> Generado: 2026-05-31 · Basado en análisis estático del código real
> (`src/main.py`, `src/functions.py`, `src/training.py`, `src/templates/`) vs
> `src/api/v3/**`, `frontend/src/services/**` y `frontend/src/screens/**`.
> El catálogo `docs/LEGACY_ENDPOINTS_CATALOG.md` está **STALE** (no usar como fuente).

## Resumen ejecutivo

**Paridad global ≈ 72% end-to-end.** El backend v3 está prácticamente al 100% en
casi todos los módulos. **El cuello de botella es el frontend**: faltan pantallas
que consuman endpoints que ya existen.

| Módulo | Backend v3 | Frontend | Estado |
|---|---|---|---|
| Auth / registro | ✅ 100% | ✅ | Cubierto |
| Usuarios / perfil (estático + dinámico) | ✅ 100% | ✅ | Cubierto |
| Objetivos (goals) | ✅ 100% | ✅ | Cubierto |
| Nutrición (planes / alimentos / bloques / recetas) | ✅ 100% | ✅ | Cubierto |
| Entrenamiento (planes / sesiones / programas) | ✅ 100% | ✅ | Cubierto |
| Analytics / calculadoras | ✅ 100% | ✅ | Cubierto |
| Admin (RBAC / auditoría) | ✅ 100% | ✅ | Cubierto |
| **Rendimiento físico** (velocidad/flexibilidad/movilidad/resistencia) | ✅ existe | ❌ sin service ni pantalla | **Gap** |
| **Fuerza — vista admin/profesional** | ✅ existe | ✅ `AdminStrength.tsx` (2026-05-31) | Cubierto |
| **Telemedicina → Prevención (USPSTF)** | ✅ proxy nuevo | ✅ `patient/Prevention.tsx` (2026-05-31) | Cubierto · verificado e2e |
| **Telemedicina / clínico (resto)** | ✅ ~casi completo | ❌ faltan pantallas (situaciones/docs/historia/vitales) | Gap — ver nota de enfoque |

## Gaps priorizados (lo que falta para paridad mínima)

### 1. Telemedicina — REENFOCADA A PREVENCIÓN ✅ (núcleo entregado)
**Decisión de producto (2026-05-31):** el módulo de telemedicina se centra en
**prevención** (qué estudios/screenings recomendarse), no en replicar todo el
módulo clínico legacy.

**Entregado y verificado e2e:**
- Servicio externo `prevention-task-force-api` (USPSTF, 142 recomendaciones) en
  `C:\My Web Sites\prevention-task-force-api`. Corre en `:5000` en dev.
- **Proxy OMV3:** `POST /api/v3/telemedicine/prevention/recommendations`
  (`src/api/v3/telemedicine/routes.py`). Arma edad/sexo/altura/peso desde
  `clinical.db`, acepta overrides (`tobacco`, `sexuallyActive`, `pregnant`,
  `keywords`, `grades`), scoping por paciente para profesional/admin.
  Config: env `PREVENTION_API_URL` (default `http://127.0.0.1:5000`).
- **Frontend:** `preventionService.ts` + tipos en `api.ts` + pantalla
  `frontend/src/screens/patient/Prevention.tsx` (nav paciente → "Prevención").
- **Verificado:** login paciente → 55 screenings priorizados por grado. Typecheck
  EXIT=0; backend compila; API externa responde en vivo.

**Pendiente (cuando se quiera):**
- ⚠️ **Deploy de la prevention-api** a un origen accesible desde PythonAnywhere y
  setear `PREVENTION_API_URL` en prod (hoy solo corre local).
- Lado doctor: exponer Prevención dentro de la ficha del paciente (pestaña Labs),
  pasando `patient` al endpoint (ya soportado por el proxy).
- Capturar `tobacco`/`pregnant`/`sexuallyActive` en el perfil para no depender de
  toggles manuales.

**Resto del módulo clínico legacy** (situaciones, documentos, historia médica,
signos vitales, plantillas) — backend + services existen; sin pantallas. Quedan
como gap de menor prioridad dado el reenfoque a prevención. Para construirlas,
llenan las pestañas **Labs/Archivos** (hoy deshabilitadas) de `DoctorPatientDetail`.
**Bloqueante para el lado doctor:** los GET clínicos (`/records`, `/situations`,
`/vitals`, `/documents`) hoy scopean solo al usuario autenticado — para que el
doctor vea a un paciente puntual hay que agregarles parámetro `patient` +
`resolve_patient_id`.

### 2. Rendimiento físico — PRIORIDAD MEDIA
Velocidad, flexibilidad, movilidad, resistencia. Endpoints v3 existen pero sin
service frontend ni pantalla.

→ Acción: crear service primero, luego `react-screen-builder`.

### 3. Fuerza — vista admin/profesional — PRIORIDAD MEDIA
El service ya existe; falta la pantalla que lo exponga del lado profesional.

→ Acción: `react-screen-builder`.

### 4. Diet-survey — PRIORIDAD BAJA
Sin service. Requiere service + pantalla.

## Features nuevas en v3 (sin equivalente legacy)
No son gaps — son mejoras del modelo actual que el legacy no tenía:
- Registro + verificación de email
- Daily-log de nutrición (registro diario del paciente)
- Ciclo de vida de objetivos (goals lifecycle)
- Assignments (asignación paciente↔profesional)
- Engagement / check-in
- RBAC y auditoría en admin

## ⚠️ NO ADAPTABLES / A DEFINIR (requieren tu decisión)

Estas funciones del legacy no encajan limpio en el modelo/flujo actual.
Necesitan una decisión antes de migrarlas:

1. **Ficha "paciente telemed"** — el legacy tiene una entidad "paciente" de
   telemedicina propia. ¿Se unifica con `assignments` + `users`, o se mantiene
   como entidad clínica separada?
2. **"Medidas corporales completas"** — el legacy tiene un set de medidas que se
   solapa con `measurements` y `body-composition` del v3. Definir cuál es la
   fuente de verdad y si se fusionan.
3. **Borrado físico vs máquinas de estado** — el legacy borra registros
   físicamente; el v3 usa estados (activo/inactivo, etc.). Definir política para
   las entidades migradas.
4. **`/cooking`** — funcionalidad legacy sin equivalente claro en el flujo actual.
   ¿Se migra, se rediseña o se descarta?
5. **Upload a Google Drive** — el legacy sube documentos a Google Drive. ¿Se
   mantiene esa integración o se migra a storage propio?
6. **(Revisar)** entidades clínicas con identidad ambigua entre legacy y v3.
7. **(Revisar)** flujos del profesional que el legacy resolvía en una sola vista
   Jinja y que en el modelo actual se reparten en varias pantallas.

## Próximos pasos sugeridos
1. Decidir sobre los 7 puntos "A DEFINIR" (al menos los 1–5).
2. Atacar el gap de **telemedicina** (mayor impacto en paridad) → construir pantallas.
3. Completar **rendimiento físico** y **fuerza admin**.
4. Validar end-to-end los módulos marcados "Cubierto" con `user-flow-auditor`.
