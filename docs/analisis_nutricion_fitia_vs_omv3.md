# Nutrición: OMV3 vs Fitia — análisis a tres bandas (legacy · OMV3 · Fitia)

> **Objetivo:** que el módulo de **nutrición** de OMV3 se sienta tan completo como
> **Fitia**, aprovechando lo reutilizable del **legacy**, pero **respetando la
> separación de roles** que OMV3 ya tiene: el **nutricionista prescribe**, el
> **paciente ejecuta**. En Fitia el paciente hace TODO solo; en OMV3 mantenemos la
> división.
>
> Generado 2026-05-31 · basado en inventario verificado contra código real
> (`src/api/v3/nutrition`, `frontend/src`, `src/functions.py`, `src/Basededatos`).

---

## 1. El marco: Fitia self-service vs OMV3 con roles

Fitia es **self-service de consumidor**: el mismo usuario se hace el onboarding,
genera su plan, busca/escanea comida, registra el día y ve su progreso.

OMV3 es **plataforma profesional↔paciente**. La clave para "parecerse a Fitia sin
romper los roles" es repartir cada feature de Fitia en su carril:

| Carril | Quién | Qué hace (en nutrición) |
|---|---|---|
| **Prescripción** | Nutricionista | Define objetivo y fases, calcula/ajusta el plan (macros, nº comidas), arma bloques/recetas, fija restricciones y alimentos permitidos, supervisa adherencia |
| **Ejecución** | Paciente | Registra lo que come (busca/escanea/crea alimentos), ve consumido vs prescrito, agua, racha, fotos de progreso, registra peso/medidas |
| **Compartido** | Ambos | Catálogo de alimentos, recetas, calculadoras, lista de compra, solver de porciones |

**Regla de oro:** toda feature "de planificación" de Fitia → lado **nutricionista**;
toda feature "de registro/seguimiento diario" → lado **paciente**. El catálogo y los
motores de cálculo son infraestructura compartida.

---

## 2. Tabla maestra a tres bandas (ejes de nutrición de Fitia)

Estado OMV3: ✅ completo · 🟡 parcial · ❌ ausente.

| Eje Fitia | Activo legacy reutilizable | OMV3 hoy | Carril de rol | Acción para parecerse a Fitia (respetando roles) |
|---|---|---|---|---|
| **Onboarding → plan automático** (objetivo, datos, actividad, dieta, alergias, nº comidas) | ✅ `calcular_plan_nutricional_automatico()` (functions.py:1848) + fórmulas | 🟡 `/plans/auto-calculate` existe pero lo dispara el profesional; falta tipo de dieta y alergias estructuradas | **Nutricionista** (prescribe) + el paciente aporta datos | Mantener el cálculo del lado nutri, pero agregar un **wizard de "datos de entrada" del paciente** (actividad, tipo de dieta, alergias/exclusiones, nº comidas) que alimente el cálculo. El nutri revisa y aprueba. |
| **Registro diario de comidas** (consumido vs objetivo) | 🟡 catálogo + cálculo (el flujo de log es nuevo) | ✅ `/daily-log`, `Nutrition.tsx`, arco calorías + macros | **Paciente** (ejecuta) | Ya es el corazón Fitia. Pulir UX para que se sienta tan fluido como Fitia (registro rápido por comida). |
| **Búsqueda de alimentos por texto** | ✅ **`ALIMENTOS` 187** + **`GRUPOSALIMENTOS` 64/~50 micros** | ✅ `/foods`, `AddFoodSheet.tsx` | **Compartido** | Enriquecer la búsqueda del paciente con los micronutrientes de `GRUPOSALIMENTOS` (diferencial sobre Fitia). |
| **Escaneo de código de barras** | ❌ | ❌ (Open Food Facts existía en la app Expo archivada, no en v3) | **Paciente** (ejecuta) | **Construir** escaneo de barras en el registro del paciente (Capacitor Barcode / Open Food Facts). Alta prioridad: es central en Fitia. |
| **Foto-IA / etiqueta / text-to-food** | ❌ | ❌ | **Paciente** (ejecuta) | Diferencial moderno de Fitia. Construir desde cero (LLM/visión). Prioridad media (costo/complejidad). |
| **Crear alimento propio** | ✅ `creadordealimento()` (functions.py:2142) | ✅ `/foods` CRUD | **Compartido** (nutri cura el catálogo; paciente crea los suyos) | Permitir al paciente crear alimentos "personales" sin ensuciar el catálogo oficial que cura el nutri. |
| **Recetas** | ✅ **`RECETAS` 137** (92 con dependencias) ya migradas | ✅ recetas relacionales (roles base/dep/fijo), `RecipeWizardSheet.tsx` | **Compartido** | El nutri arma/cura recetas; el paciente las usa para registrar. Más potente que Fitia (dependencias). |
| **Registro de agua** | ❌ | ❌ (solo recomendación textual) | **Paciente** (ejecuta) | Construir tracking de agua simple (tabla + endpoint + widget en el día del paciente). Bajo costo, alto "feel Fitia". |
| **Lista de compra desde el plan** | ✅ `/lista-compras` (main.py:4052) | ✅ `/meal-plans/<id>/shopping-list` (lado doctor) | **Compartido** | Exponerla también al **paciente** (hoy es solo doctor): generar lista desde su plan prescrito. |
| **Ciclado de calorías/macros** | 🟡 `calcular_objetivos_parciales()` (ciclos volumen↔definición) | ❌ (plan por comida, no por día) | **Nutricionista** (prescribe) | El nutri define targets distintos por día de la semana; el paciente los ve. Prioridad media. |
| **Calculadoras (TDEE/BMR/macros)** | ✅ fórmulas (Navy BF, Katch-McArdle TMB, macros, EA) | ✅ suite `/calculators/*` | **Compartido** (nutri las usa para prescribir) | Ya superior a Fitia. Mantener del lado nutri como herramienta de prescripción. |
| **Solver/optimizador de porciones** | ✅ `solve_meal()` (functions.py:2452, PuLP) | ✅ `/solve-meal` | **Compartido** | Diferencial fuerte (Fitia no optimiza). Nutri lo usa al armar; el paciente puede usarlo para "cuadrar" una comida dentro de su plan. |
| **Fases del plan / objetivo en el tiempo** | ✅ `calcular_objetivos_parciales/automaticos()` | ✅ goals lifecycle + roadmap por fases | **Nutricionista** (prescribe) | Diferencial sobre el "objetivo único" de Fitia. El paciente ve su fase actual y progreso. |
| **Racha / gamificación de adherencia** | ❌ | 🟡 streak calculado y mostrado, sin badges | **Paciente** (ejecuta) | Reforzar gamificación de adherencia (racha, logros) del lado paciente — engancha como Fitia. |
| **Recordatorios (comida/agua/peso)** | ❌ | 🟡 recordatorios in-app (sin push real) | **Paciente** (ejecuta) | Agregar **push real** (Capacitor/FCM) para recordatorios — Fitia los usa fuerte. |
| **Bloques de comida pre-armados** | ✅ **`PLAN_BLOQUES_PRESETS` 1083 filas** | ✅ sistema de bloques + presets | **Nutricionista** (prescribe) | Biblioteca de combos lista; el nutri arma planes rápido, el paciente los ejecuta. |

---

## 3. Activos del legacy que SÍ o SÍ conviene aprovechar (nutrición)

Estos ya existen — no reinventarlos:

1. **`GRUPOSALIMENTOS`** — 64 filas / 32 categorías con **~50 columnas de
   micronutrientes** (vitaminas A–K, B12, minerales, ácidos grasos, colesterol,
   cafeína…). Un mini-USDA en español. **Fitia no muestra este nivel de micros →
   diferencial.** Ubicación: `src/Basededatos`.
2. **`ALIMENTOS`** — 187 alimentos con macros + fibra + 2 medidas caseras. Catálogo
   base buscable, ya consumido por `/foods`.
3. **`RECETAS`** — 137 recetas (92 con ratios de dependencia), **ya migradas** a
   `clinical.db`. Sistema base/dependiente/fijo único.
4. **Motor de cálculo nutricional** — `functions.py:1848` + fórmulas: BF (Navy),
   TMB (Katch-McArdle), proteína `2.51 g × magro`, grasa `max(30% kcal, 0.6 g/kg)`,
   Disponibilidad Energética (RED-S/LEA), FFMI con límites genéticos.
5. **Solver PuLP** — `solve_meal()` genérico, ya en v3 (`/solve-meal`).
6. **`PLAN_BLOQUES_PRESETS`** — 1083 combos pre-armados de comida.
7. **`PERFILDINAMICO`** — 693 registros históricos de composición corporal
   (BF, IMC, peso graso/magro, deltas, calidad de pérdida).
8. **Motor de fases** — `calcular_objetivos_parciales()`: roadmap
   corte→volumen→definición con FFMI/BF por fase.

---

## 4. Roadmap priorizado — "nutrición OMV3 que se sienta como Fitia, con roles"

Orden por impacto/costo, manteniendo nutri=prescribe / paciente=ejecuta:

**Quick wins (paciente ejecuta, bajo costo, mucho "feel Fitia"):**
1. **Escaneo de código de barras** en el registro del paciente (Open Food Facts / Capacitor). *(Gap #1 de Fitia.)*
2. **Tracking de agua** — tabla + endpoint + widget en el día del paciente.
3. **Lista de compra para el paciente** (reusar `/shopping-list`, hoy solo doctor).
4. **Gamificación de racha** del lado paciente (badges sobre el streak que ya existe).

**Medianos (mejoran prescripción del nutri o ejecución del paciente):**
5. **Wizard de datos del paciente** (actividad, tipo de dieta, alergias/exclusiones,
   nº comidas) que alimenta el `auto-calculate` del nutri → completa el eje "onboarding"
   de Fitia sin sacarle la prescripción al profesional.
6. **Tipo de dieta + alergias estructuradas** (no existen ni en legacy ni en v3) →
   el nutri prescribe con esas restricciones; el solver/catálogo las respeta.
7. **Micronutrientes de `GRUPOSALIMENTOS`** visibles en el detalle de alimento del
   paciente → diferencial sobre Fitia.
8. **Push notifications reales** (Capacitor/FCM) para recordatorios de comida/agua/peso.

**Grandes (diferenciadores modernos, mayor costo):**
9. **Foto-IA / text-to-food** (LLM/visión) del lado paciente.
10. **Ciclado de calorías por día** (nutri prescribe targets distintos por día).

---

## 5. Lo que queda fuera del foco nutrición (o a definir)

- **Social/comunidad/chat, plan familiar, referidos, paywall self-service** — son ejes
  de Fitia que NO son nutrición pura y/o chocan con el modelo profesional de OMV3.
  Quedan planteados, no priorizados.
- **Wearables/Health Connect** (pasos, ejercicio) — más del lado training que nutrición.
- **Coach IA**: en Fitia es un bot; en OMV3 el "coach" es el nutricionista humano.
  Un asistente IA podría sumarse como **apoyo** al paciente sin reemplazar al profesional
  (a definir).
- **Onboarding 100% self-service**: en OMV3 NO replicamos que el paciente genere y
  apruebe su propio plan sin nutricionista — eso rompería el modelo de roles. El paciente
  aporta datos; el nutri prescribe.
