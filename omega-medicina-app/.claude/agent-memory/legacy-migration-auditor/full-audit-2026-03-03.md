# Full Audit Record - 2026-03-03

## Files Read During This Audit
- src/templates/dashboard.html, diet.html, plan_alimentario.html, plan_entrenamiento.html
- src/templates/entrenamiento_actual.html, historial_fuerza.html, update.html, goal.html
- src/templates/strength.html (Análisis de Fuerza), recipe.html
- src/main.py (full: 4984 lines - all routes read)
- src/api/v3/analytics/routes.py (full)
- src/api/v3/training/routes.py (full - 1130+ lines)
- src/api/v3/nutrition/routes.py (full - 2056+ lines)
- src/api/v3/users/routes.py (full - 814 lines)
- src/api/v3/admin/routes.py (route list only)
- omega-medicina-app/app/(patient)/dashboard.tsx, training.tsx, nutrition.tsx, plan.tsx, profile.tsx, health.tsx, my-recipes.tsx
- omega-medicina-app/app/(admin)/dashboard.tsx (partial)
- omega-medicina-app/src/services/api/trainingService.ts, nutritionService.ts, config.ts

## Key Findings

### API Routes Confirmed in v3
- GET/POST/PUT/DELETE /api/v3/users/:id (clinical.db patients table)
- POST /api/v3/users/:id/measurements (creates measurement, computes BF%, FFMI)
- GET/POST /api/v3/users/:id/goals + /auto
- GET /api/v3/analytics/dashboard (comprehensive - covers all dashboard logic)
- GET /api/v3/analytics/body-composition(/history)
- GET /api/v3/analytics/scores
- POST /api/v3/analytics/calculators/bmr, /tdee, /body-fat, /ffmi, /weight-loss, /muscle-gain
- GET /api/v3/nutrition/plans (list), /plans/:id, POST (create), PUT (update), DELETE
- POST /api/v3/nutrition/plans/auto-calculate (TDEE-based auto plan)
- POST /api/v3/nutrition/plans/:id/adjust-calories
- GET /api/v3/nutrition/foods, /foods/:id, /foods/:id/portions
- GET /api/v3/nutrition/food-groups, /food-groups/catalog
- GET/POST /api/v3/nutrition/recipes, /recipes/:id, POST /recipes/:id/calculate
- GET/POST /api/v3/nutrition/meal-plans, /meal-plans/blocks, /meal-plans/:id/calculate, /shopping-list
- GET/POST /api/v3/nutrition/meal-plans/blocks/adjust, /suggestions, /favorites, /constructor, /library
- GET/POST /api/v3/training/strength, /history, DELETE /:id, GET /standards
- GET/POST /api/v3/training/lifts, GET /exercises
- GET/POST/DELETE /api/v3/training/plans, /plans/:id, POST /plans/:id/optimize
- GET /api/v3/training/sessions/current, POST /sessions, POST /sessions/advance
- GET /api/v3/training/sessions/history, GET /sessions/today
- GET /api/v3/training/programs, /programs/:id
- POST /api/v3/training/strength/submit (full strength analysis with JSON + SVG)
- GET /api/v3/training/strength/admin
- POST /api/v3/training/strength/:id/optimize (PuLP optimizer)
- Full admin + telemedicine + assignments + engagement + checkin blueprints

### Expo Screens Confirmed
- app/(patient)/dashboard.tsx - calls analyticsService.getDashboard()
- app/(patient)/health.tsx - body composition with measurement form (peso/abdomen/cintura/cadera)
- app/(patient)/training.tsx - simplified session log + todaySession display
- app/(patient)/nutrition.tsx - displays meal blocks, simplified log modal
- app/(patient)/plan.tsx - shows nutrition plan + training plan + programs
- app/(patient)/my-recipes.tsx - recipe list only
- app/(patient)/profile.tsx - read-only profile display
- app/(admin)/dashboard.tsx - stats + user approve/reject

### Missing Expo Screens (to create)
- strength-analysis.tsx (use GET /training/lifts + exercises, POST /training/strength/submit, POST /training/strength/:id/optimize)
- strength-history.tsx (use GET /training/strength/history, DELETE /training/strength/:id)
- goals.tsx (use GET/POST /users/:id/goals, GET /users/:id/goals/auto)
- nutrition-planner.tsx (use POST /nutrition/plans/auto-calculate, POST /nutrition/meal-plans)

### API Gaps to Fix
1. GET /users/:id/goals/auto is missing: objetivos_parciales, circ_abdomen_objetivo (M), circ_cintura_objetivo + circ_cadera_objetivo (F)
   - Fix in src/api/v3/users/routes.py line 698
   - Reference logic: src/main.py line 2073 + functions.calcular_limite_genetico()

2. POST /users/:id/measurements does not accept circ_cuello
   - Affects male BF% accuracy (Navy formula uses neck)
   - Fix in src/api/v3/users/routes.py line 389

3. Training predictions (multi-session lookahead) missing from API
   - Legacy: plan_entrenamiento.html shows predictions with projected weights
   - No v3 equivalent endpoint exists
   - Would need new GET /training/plans/:id/predictions endpoint

4. Diet habit form (weekly servings per food group) has no v3 endpoint
   - Legacy: DIETA table has PORCION_* columns per food group
   - Closest: GET /nutrition/food-groups/catalog, but no save endpoint
   - Need POST /nutrition/diet-habits or extend meal-plans

## Legacy Business Logic Not Yet Ported to API
- functions.calcular_limite_genetico() - genetic limit with progressive partial objectives
- training.py warmup generation logic
- Diet habit → DIETA table save with food group weekly portions
