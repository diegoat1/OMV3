# Legacy Migration Auditor - Agent Memory

## Full Audit Completed: 2026-03-03
All 12 tracked legacy views audited. See `full-audit-2026-03-03.md` for per-view details.

## Architecture Key Facts
- Legacy auth: session-based, password = user DNI. New: JWT in auth.db.
- Legacy FK: `USER_DNI` (NOMBRE_APELLIDO string). New: `patient_id` (integer FK to clinical.db patients).
- DB bridge: `patient_user_link` in auth.db maps auth user_id ↔ DNI.
- `get_patient_data_legacy()` in database.py provides backward-compat tuple format from clinical.db.

## Views Audited & Migration Completeness
1. Vista Principal / Dashboard — ~75% (API full, Expo screen exists but missing plan_alimentario links)
2. Administrador — ~70% (API full, Expo admin screen exists; missing inline DB edit)
3. Recetas — ~80% (API + Expo exist; missing portion calculator and recipe creator in mobile)
4. Dieta (food habits) — ~30% (API has food-groups catalog; NO dedicated Expo screen for weekly diet form)
5. Plan Alimentario — ~70% (API is comprehensive; Expo plan.tsx is display-only, no meal block editor)
6. Plan de Entrenamiento — ~75% (API GET /training/plans + predictions; Expo plan.tsx shows but no prediction detail)
7. Entrenamiento Actual — ~65% (API sessions/current + advance; Expo training.tsx simplified; missing TEST flow, warmup generator, timer)
8. Historial de Fuerza — ~70% (API GET /training/strength/history; Expo missing dedicated screen)
9. Actualizar Perfil — ~85% (API POST /users/:id/measurements; Expo health.tsx has form; missing circ_cuello field)
10. Definir Objetivo — ~60% (API /users/:id/goals + /auto; Expo missing dedicated goal-setting screen with genetic limit wizard)
11. Plan Nutricional (Planner) — ~65% (API /nutrition/plans/auto-calculate + /plans; Expo nutrition.tsx is display-only; no planner form)
12. Análisis de Fuerza — ~55% (API /training/strength + /submit + /strength/:id/optimize; Expo missing dedicated strength analysis screen)

## Critical Business Rules to Preserve
- BF% Navy formula differs by sex: M uses abdomen-neck, F uses waist+hip-neck.
- `calculator_fatrate(fat_mass)`: maxloss = fat*31, rate = maxloss*7/3500.
- `calculator_leanrate(lean_mass)`: rate = lean/268.
- `bodyscore` uses a 3x3 factor matrix (BF category 0/1/2) x (FFMI category 0/1/2) → bodycat index 0-8.
- Training advance logic is in `src/training.py` `avanzar_dia_plan()`.
- Planner auto-calculates from TDEE: strategy (deficit/surplus/maintenance) + activity factor.
- Plan Alimentario supports two plan types: "recetas" (recipes) and "bloques" (macro blocks).
- Strength optimizer uses PuLP linear programming (columna system, TEST sessions).

## Common Patterns in Legacy Code
- All legacy queries use `NOMBRE_APELLIDO` string as the user key (not DNI).
- Admin check: `username == 'Toffaletti, Diego Alejandro'` (hardcoded).
- Diet form processes food groups (GRUPOSALIMENTOS) with weekly portions + nutrient toggles.
- Plan Alimentario bloques system: presets stored in PLAN_BLOQUES_PRESETS, favorites in PLAN_BLOQUES_FAVORITOS.
