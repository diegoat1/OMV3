# 🔄 MIGRACIÓN ONV2 → OMV3 - SPRINT 1

**Fecha**: 2025-01-28  
**Objetivo**: Implementar núcleo nutricional y metabólico en TypeScript con equivalencia científica

---

## 📋 MAPA DE EXTRACCIÓN

### A) NÚCLEO NUTRICIONAL - Sistema de Bloques

| Funcionalidad | Archivo Fuente (Legacy) | Líneas | Regla/Fórmula | Prioridad |
|---------------|------------------------|--------|---------------|-----------|
| **Constantes de Bloques** | `src/functions.py` | 4470-4473 | `BLOQUE_PROTEINA=20g`, `BLOQUE_GRASA=10g`, `BLOQUE_CARBOHIDRATOS=25g`, `BLOQUE_ENERGIA=100kcal` | P0 |
| **Redondeo a 0.5** | `src/functions.py` | 4453-4458 | `round(valor * 2) / 2` | P0 |
| **Cálculo bloques exactos** | `src/functions.py` | 4531-4538 | `bloques_p = proteina / BLOQUE_PROTEINA` | P0 |
| **Bloques decimales (no enteros)** | `docs/cambios/correccion_bloques_decimales.md` | 44-54 | Usar `bloques_decimal` para generador, `bloques` entero solo para UI | P0 |
| **Sistema Energía (E)** | `docs/nutricion/implementacion_bloques_energia.md` | 306-332 | `kcal_total = (P*4) + (G*9) + (C*4)`, `1E = 100kcal` | P1 |
| **Macros Fuertes (umbral 80%)** | `docs/cambios/correccion_macros_fuertes.md` | 39-60 | `umbral = valor_maximo * 0.8`, incluir macros ≥ umbral | P1 |
| **Cálculo macros_fuertes** | `src/functions.py` | 4356-4383 | Clasificar alimentos con múltiples macros dominantes | P1 |

**Referencia clave**: `docs/cambios/correccion_bloques_decimales.md` líneas 141-148:
```
| Macro | Gramos | Fórmula |
| Proteína | 33.2g | 33.2/20 = 1.66P |
| Grasa | 19.9g | 19.9/10 = 1.99G |
| Carbohidratos | 26.6g | 26.6/25 = 1.06C |
```

---

### B) CÁLCULOS METABÓLICOS Y COMPOSICIÓN CORPORAL

| Funcionalidad | Archivo Fuente | Líneas | Fórmula | Prioridad |
|---------------|----------------|--------|---------|-----------|
| **Katch-McArdle (BMR)** | `src/templates/caloriescal.html` | 488-491 | `BMR = 370 + (9.8 * leanBodyMassLbs)` | P0 |
| **TDEE** | `src/templates/caloriescal.html` | 501 | `TDEE = BMR * activityMultiplier` | P0 |
| **Factores de Actividad** | `src/templates/caloriescal.html` | 493-499 | Sedentario=1.2, Ligero=1.375, Moderado=1.55, Intenso=1.725, Muy Intenso=1.9 | P0 |
| **FFMI** | `src/functions.py` | 1240 | `FFMI = LM / (altura_m ** 2)` | P1 |
| **Categorías FFMI Hombres** | `src/functions.py` | 1159-1183 | Rangos: [15,17,18.5,20,21.5,23,25,28] → Muy Pobre a Superior | P1 |
| **Categorías FFMI Mujeres** | `src/functions.py` | 1185-1203 | Rangos: [12,13,14.5,16,17.5,19,21,24] → Muy Pobre a Superior | P1 |
| **% Grasa Corporal (Navy)** | `src/main.py` | 96-101 | Hombres: `495/(1.0324-0.19077*log10(abd-cuello)+0.15456*log10(altura))-450` | P1 |
| **Límite FFMI Natural** | `src/functions.py` | 1224-1232 | Hombres: 25.0, Mujeres: 21.0 | P2 |

---

### C) TRACKING Y SCORES

| Funcionalidad | Archivo Fuente | Líneas | Regla | Prioridad |
|---------------|----------------|--------|-------|-----------|
| **Tasa pérdida grasa máxima** | `src/main.py` | 103-112 | `maxloss = fat * 31` (kcal/día por kg grasa) | P1 |
| **Tasa ganancia muscular** | `src/main.py` | 117-122 | `leanrate = lean / 268` (kg/semana) | P1 |
| **Score Nutrición (MVP)** | Por definir | - | Calidad diaria 1-5 + indicadores binarios | P1 |
| **Score Entrenamiento (MVP)** | Por definir | - | Consistencia + RPE + volumen semanal | P1 |

**Nota**: Los scores de nutrición y entrenamiento ya están parcialmente implementados en OMV3 (`app/(patient)/nutrition.tsx` y `training.tsx`). Se debe formalizar la lógica en el core.

---

### D) MODELO DE DATOS - Tablas Legacy a Migrar

| Tabla Legacy | Campos Clave | Modelo TS Propuesto | Prioridad |
|--------------|--------------|---------------------|-----------|
| **USUARIOS** | DNI, nombre, password | `User` (ya existe en OMV3) | P0 |
| **PERFILESTATICO** | altura, sexo, edad, fecha_nacimiento | `StaticProfile` | P0 |
| **PERFILDINAMICO** | peso, cabd, ccin, ccad, bf, ffmi, lean, fat | `DynamicProfile` | P0 |
| **GRUPOSALIMENTOS** | categoria, porcion, proteina, grasa, carbohidratos, energia | `FoodItem` | P0 |
| **DIETA** | DP, DG, DC, AP, AG, AC, CP, CG, CC (macros por comida) | `DietPlan` | P1 |
| **PLAN_BLOQUES_PRESETS** | comida, alimentos_json, bloques_totales | `BlockPreset` | P2 |

**Referencia**: `docs/modelo_datos.md`

---

## 🏗️ PLAN DE MÓDULOS TypeScript

### Estructura Propuesta

```
omega-medicina-app/src/core/
├── nutrition/
│   ├── constants.ts          # BLOQUE_*, umbrales
│   ├── blocks.ts             # calcularBloques(), redondearAMedioBloque()
│   ├── energy.ts             # calcularEnergia(), kcalTotal, kcalGC
│   ├── macros.ts             # calcularMacrosFuertes(), getMacroDominante()
│   └── index.ts              # exports
├── metabolism/
│   ├── bmr.ts                # katchMcArdle(), harrisBenedict()
│   ├── tdee.ts               # calcularTDEE(), ACTIVITY_FACTORS
│   ├── composition.ts        # calcularFFMI(), calcularBF(), categoriaFFMI()
│   ├── energy-availability.ts # calcularEA(), detectarLEA()
│   └── index.ts
├── scoring/
│   ├── nutrition-score.ts    # calcularScoreNutricion()
│   ├── training-score.ts     # calcularScoreEntrenamiento()
│   ├── health-score.ts       # calcularHealthScore()
│   └── index.ts
├── validation/
│   ├── ranges.ts             # rangos saludables por métrica
│   ├── alerts.ts             # generarAlertas(), semáforos
│   └── index.ts
└── models/
    ├── nutrition.ts          # FoodItem, Block, DietPlan
    ├── profile.ts            # StaticProfile, DynamicProfile
    ├── tracking.ts           # TrainingLog, DietLog
    └── index.ts
```

---

## 🧪 PLAN DE TESTS

### Tests Unitarios por Módulo

| Módulo | Test | Valores de Referencia (Golden) |
|--------|------|-------------------------------|
| `blocks.ts` | `redondearAMedioBloque(0.3)` | `0.5` |
| `blocks.ts` | `redondearAMedioBloque(1.2)` | `1.0` |
| `blocks.ts` | `redondearAMedioBloque(2.7)` | `3.0` |
| `blocks.ts` | `calcularBloques(33.2, 20)` | `{ bloques: 2, bloques_decimal: 1.66 }` |
| `energy.ts` | `calcularEnergia(40, 20, 50)` | `{ kcal_total: 540, bloques_total: 5.5 }` |
| `macros.ts` | `calcularMacrosFuertes({P:12.6, G:12.3, C:1.2})` | `['P', 'G']` (huevo) |
| `bmr.ts` | `katchMcArdle(70)` (70kg lean mass) | `~1710 kcal` |
| `composition.ts` | `calcularFFMI(70, 1.80)` | `21.6` |
| `composition.ts` | `categoriaFFMI(21.6, 'M')` | `'Normal'` |

### Golden Tests (comparación con ONV2)

```typescript
// Caso real: Diego - Desayuno
const desayunoDiego = {
  proteina_gramos: 33.2,
  grasa_gramos: 19.9,
  carbohidratos_gramos: 26.6
};

// Esperado (de docs/cambios/correccion_bloques_decimales.md líneas 141-148)
expect(calcularBloques(desayunoDiego.proteina_gramos, 20).bloques_decimal).toBe(1.66);
expect(calcularBloques(desayunoDiego.grasa_gramos, 10).bloques_decimal).toBe(1.99);
expect(calcularBloques(desayunoDiego.carbohidratos_gramos, 25).bloques_decimal).toBe(1.06);
```

---

## 📊 FEEDBACK POR COLORES (Semáforo)

**Referencia**: `docs/cambios/correccion_bloques_decimales.md` líneas 154-161

| Color | Condición | Uso |
|-------|-----------|-----|
| 🟢 Verde | Dentro de tolerancia (±0.2 bloques) | Objetivo cumplido |
| 🟡 Amarillo | Desviación 0.2-0.5 bloques | Aceptable, mejorable |
| 🔴 Rojo | Desviación >0.5 bloques | Fuera de rango |

**Implementación en TS**:
```typescript
type SemaphoreColor = 'green' | 'yellow' | 'red';

function getSemaphoreColor(actual: number, target: number, tolerance = 0.2): SemaphoreColor {
  const diff = Math.abs(actual - target);
  if (diff <= tolerance) return 'green';
  if (diff <= 0.5) return 'yellow';
  return 'red';
}
```

---

## 🔧 DECISIÓN: PuLP/Optimización

### Contexto
ONV2 usa PuLP para optimización de:
1. **Generador de combinaciones de alimentos** (`functions.py` líneas 4428+)
2. **Optimizador de rutinas de entrenamiento** (`workout_optimizer.py`)

### Opciones

| Opción | Pros | Contras | Esfuerzo |
|--------|------|---------|----------|
| **(A) Backend Flask para solver** | Reutiliza código existente, precisión garantizada | Requiere servidor, latencia | Bajo |
| **(B) Portar a TS con solver JS** | Offline-first, sin dependencias | Librerías JS menos maduras (glpk.js, highs-js) | Alto |

### **Decisión MVP**: Opción A (Backend)
- Mantener endpoints Flask para generación de combinaciones
- OMV3 consume via API
- Fase 2: Evaluar migración a WASM (highs-wasm) si se requiere offline

---

## 📅 ORDEN DE IMPLEMENTACIÓN

### Sprint 1 - Semana 1-2

1. **[P0] Core Nutrition - Bloques**
   - `constants.ts` - Constantes de bloques
   - `blocks.ts` - Cálculo y redondeo
   - Tests unitarios

2. **[P0] Core Metabolism - BMR/TDEE**
   - `bmr.ts` - Katch-McArdle
   - `tdee.ts` - Factores de actividad
   - Tests unitarios

3. **[P0] Models**
   - Tipos TypeScript para FoodItem, Profile, etc.
   - Mapeo desde modelos legacy

### Sprint 1 - Semana 3-4

4. **[P1] Core Nutrition - Energía y Macros Fuertes**
   - `energy.ts` - Sistema E
   - `macros.ts` - Clasificación 80%
   - Tests unitarios

5. **[P1] Core Metabolism - Composición**
   - `composition.ts` - FFMI, BF%
   - `energy-availability.ts` - EA básico
   - Tests unitarios

6. **[P1] Scoring MVP**
   - Formalizar scores existentes en OMV3
   - Integrar con UI

### Sprint 2 (Futuro)

7. **[P2] Validation y Alertas**
8. **[P2] Integración con backend Flask para optimización**
9. **[P2] Persistencia local (AsyncStorage/SQLite)

---

## ✅ CHECKLIST DE ENTREGABLES

### Documentación
- [x] `/docs/MIGRACION_OMV3_SPRINT1.md` (este documento)

### Core Nutrition
- [x] `/omega-medicina-app/src/core/nutrition/constants.ts` - Constantes de bloques
- [x] `/omega-medicina-app/src/core/nutrition/blocks.ts` - Cálculo y redondeo de bloques
- [x] `/omega-medicina-app/src/core/nutrition/energy.ts` - Sistema E (1E=100kcal)
- [x] `/omega-medicina-app/src/core/nutrition/macros.ts` - Macros fuertes (umbral 80%)
- [x] `/omega-medicina-app/src/core/nutrition/index.ts` - Exports

### Core Metabolism
- [x] `/omega-medicina-app/src/core/metabolism/constants.ts` - Factores actividad, rangos FFMI
- [x] `/omega-medicina-app/src/core/metabolism/bmr.ts` - Katch-McArdle, Mifflin-St Jeor
- [x] `/omega-medicina-app/src/core/metabolism/tdee.ts` - TDEE, déficit/superávit
- [x] `/omega-medicina-app/src/core/metabolism/composition.ts` - FFMI, BF%, Navy method
- [x] `/omega-medicina-app/src/core/metabolism/index.ts` - Exports

### Core Scoring
- [x] `/omega-medicina-app/src/core/scoring/nutrition-score.ts` - Score nutrición 0-100
- [x] `/omega-medicina-app/src/core/scoring/training-score.ts` - Score entrenamiento 0-100
- [x] `/omega-medicina-app/src/core/scoring/health-score.ts` - Health Score combinado
- [x] `/omega-medicina-app/src/core/scoring/index.ts` - Exports

### Core Index
- [x] `/omega-medicina-app/src/core/index.ts` - Export principal

### Tests Unitarios
- [x] `/omega-medicina-app/src/core/__tests__/nutrition.test.ts` - Tests bloques, energía, macros
- [x] `/omega-medicina-app/src/core/__tests__/metabolism.test.ts` - Tests BMR, TDEE, composición

### Pendiente
- [ ] Instalar Jest: `npm i --save-dev jest @types/jest ts-jest`
- [ ] Configurar Jest en `jest.config.js`
- [ ] Integración mínima en UI existente

---

## 📚 REFERENCIAS DE ARCHIVOS

### Documentación Crítica
| Archivo | Contenido |
|---------|-----------|
| `docs/cambios/correccion_bloques_decimales.md` | Sistema de bloques decimales, tolerancias |
| `docs/cambios/correccion_macros_fuertes.md` | Umbral 80%, clasificación multi-macro |
| `docs/nutricion/implementacion_bloques_energia.md` | Sistema E, modos de complejidad |
| `docs/nutricion/tabla_referencia_bloques.md` | Tabla de alimentos y bloques |
| `docs/modelo_datos.md` | Estructura de tablas SQLite |

### Código Legacy
| Archivo | Contenido |
|---------|-----------|
| `src/functions.py` líneas 4450-4620 | Catálogo de alimentos, cálculo de bloques |
| `src/functions.py` líneas 1159-1350 | FFMI, objetivos automáticos |
| `src/main.py` líneas 86-150 | Cálculos de composición corporal |
| `src/templates/caloriescal.html` líneas 488-502 | Katch-McArdle, TDEE |

---

**Documento**: `MIGRACION_OMV3_SPRINT1.md`  
**Versión**: 1.0.0  
**Estado**: ✅ MAPA DE EXTRACCIÓN COMPLETO - LISTO PARA IMPLEMENTACIÓN
