# Deploy a PythonAnywhere — checklist (cuenta `omegamedicina`)

> Generado por el pre-deploy. **El push y el reload los ejecutás vos.** PA está
> hoy LIVE y healthy. Arquitectura clave: `wsgi.py` sirve la SPA (`frontend/dist/`)
> + la API; las DBs de PA viven en **`DATABASE_DIR=/home/omegamedicina/omv3-data`**
> (separadas del repo) → los cambios de schema se aplican corriendo migraciones EN PA.

## 0) Estado pre-deploy (verificado local)
- ✅ Backend compila · `scripts/test_p1p2*` 19/19 · `scripts/test_p3p4*` 10/10
- ✅ `npm run build` verde · `frontend/dist/` regenerado con toda la UI (P1–P4)
- ✅ Migraciones 021/022/023 + seed de fuerza verificados local
- ✅ Prevención **in-process** (no requiere servicio externo `:5000`)

## 1) Archivos NUEVOS que deben commitearse (críticos)
**Backend:** `src/api/v3/telemedicine/prevention_engine.py`, `src/api/v3/telemedicine/uspstf_data.json` (2.9 MB — sin esto, prevención 500), `migrations/021_prevention_profile_flags.py`, `migrations/022_food_optimizer_flags.py`, `migrations/023_load_strength_standards.py`, `src/db/seed/strength_standards_pop.sql` (1.9 MB).
**Frontend (fuente):** `frontend/src/components/{MuscleRecoveryCard,ExerciseAlternativesSheet,RechangeSheet}.tsx`, `frontend/src/screens/patient/{MobilityTest,Prevention}.tsx`, `frontend/src/screens/admin/AdminStrength.tsx`, `frontend/src/services/preventionService.ts`.
**Build:** `frontend/dist/` (¡incluye assets con hash NUEVOS! usar `git add -A frontend/dist`).
**Scripts/docs:** `scripts/extract_strength_standards.py`, `scripts/gen_strength_seed.py`, `scripts/qa_helpers.py`, `scripts/test_p*.py`, `docs/*.md`.
**Modificados:** backend routes/helpers/functions, `src/db/schema.sql`, frontend services/types/screens.

> Nota: las DBs del repo (`clinical.db`, `Basededatos`, etc.) aparecen modificadas pero **PA no las usa** (lee de `DATABASE_DIR`). Commitearlas es opcional e inocuo; la actualización real de datos en PA es vía las migraciones de abajo.

## 2) Commit + push (LOCAL — lo corrés vos)
```bash
git add -A
git commit -m "feat: paridad roadmap P1-P4 + percentiles fuerza + UI (prevención in-process, movilidad, recuperación, rechange)"
git push origin master
```
(Si preferís no commitear los blobs de DB locales: `git restore --staged src/Basededatos src/auth.db src/db/clinical.db src/telemedicina.db` antes del commit.)

## 3) En PythonAnywhere (consola Bash — lo corrés vos)
```bash
cd ~/OMV3
git pull

# Backup de las DBs de PA antes de migrar (seguridad)
cp -r /home/omegamedicina/omv3-data /home/omegamedicina/omv3-data.bak_$(date +%Y%m%d_%H%M%S)

# Aplicar cambios de schema/datos a las DBs de PA
export DATABASE_DIR=/home/omegamedicina/omv3-data
python3 migrations/021_prevention_profile_flags.py    # clinical.db: flags de prevención en patients
python3 migrations/022_food_optimizer_flags.py         # Basededatos: flags de optimizador en ALIMENTOS
python3 migrations/023_load_strength_standards.py       # clinical.db: seed strength_standards_pop (20.874 filas)
python3 migrations/024_load_cardio_standards.py          # clinical.db: seed cardio_standards (340 filas)
python3 migrations/025_load_exercise_catalog.py          # clinical.db: seed exercise_catalog EXRX (1328 filas)
python3 migrations/026_load_darebee_catalog.py           # clinical.db: seed darebee_catalog (2678 filas)
```

## 4) Env vars (Web tab → WSGI / Environment)
- `DATABASE_DIR=/home/omegamedicina/omv3-data` (ya seteado)
- `JWT_SECRET=<secreto real>` (si hoy usa el default, conviene setear uno real)
- `PREVENTION_API_URL` → **dejar SIN setear** (usa el motor in-process; all-in-one)

## 5) Reload del web app
- Web tab → botón **Reload** (recomendado), o `touch` al wsgi gestionado por PA.

## 6) Verificación post-deploy
```bash
curl https://omegamedicina.pythonanywhere.com/api/v3/health
```
Y en el browser (SPA): login → paciente: Movilidad, Entrenamiento (recuperación + "cambiar"), Nutrición (swap/Rechange), Prevención; profesional: ficha → Labs (Prevención/Movilidad). Endpoints nuevos para smoke: `/api/v3/training/strength/standards-lookup`, `/training/recovery`, `/analytics/calculators/race-time`, `/nutrition/foods/rechange`, `/telemedicine/prevention/recommendations`.

## Riesgos / notas
- El **build del frontend** solo corre en la máquina que genera `dist/` (acá, ya reparado: faltaban deps nativas — `npm install` agregó shim `tsc` + binding rolldown win32). PA NO rebuildea: sirve el `dist/` commiteado.
- Si `git pull` en PA reporta conflicto por las DBs trackeadas, priorizar las de `DATABASE_DIR` (las del repo no se usan): `git checkout -- src/Basededatos src/db/clinical.db ...` y volver a pull.
- `extract_strength_standards.py` NO corre en PA (ReferenceWeb no está allá) — por eso se usa el seed `023`.
