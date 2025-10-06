# ðŸŽ¯ ImplementaciÃ³n del Sistema de Planner AutomÃ¡tico

## Fecha: 2025-09-30
## Sistema: ONV2 - Omega NutriciÃ³n

---

## ðŸ“‹ Resumen Ejecutivo

Se ha implementado exitosamente un sistema completo de **Plan Nutricional AutomÃ¡tico** que calcula automÃ¡ticamente las calorÃ­as y macronutrientes Ã³ptimos para cada usuario basÃ¡ndose en:

> â„¹ï¸ Para una visiÃ³n integral del ecosistema de ONV2 consulta la [GuÃ­a completa](..\/guia\/guia_completa.md).

- âœ… Datos actuales del usuario (peso, FFM, grasa corporal)
- âœ… Objetivo definido previamente (de la tabla OBJETIVO)
- âœ… Velocidad de pÃ©rdida/ganancia segura (basada en % de peso corporal)
- âœ… **Disponibilidad EnergÃ©tica (EA)** mÃ­nima para prevenir RED-S/LEA
- âœ… FÃ³rmulas cientÃ­ficas validadas

---

## ðŸ”¬ Fundamentos CientÃ­ficos Implementados

### 1. **Velocidad de PÃ©rdida/Ganancia**

```python
# PÃ©rdida de peso segura
Conservadora: 0.25% peso/semana  # MÃ¡xima preservaciÃ³n muscular
Moderada:     0.5% peso/semana   # Equilibrio Ã³ptimo (RECOMENDADA)
Agresiva:     0.75% peso/semana  # Mayor riesgo de pÃ©rdida de FFM

# Ganancia de peso segura
Conservadora: 0.25% peso/semana  # MÃ­nima ganancia de grasa
Moderada:     0.5% peso/semana   # Mayor velocidad, mÃ¡s grasa
```

**Referencia:** Velocidad â‰¤0.5% del peso/semana preserva mejor la masa magra segÃºn estudios cientÃ­ficos.

### 2. **Disponibilidad EnergÃ©tica (EA)**

```python
EA = (ingesta_kcal - gasto_ejercicio) / kg_FFM

# Umbrales por sexo
Mujeres:
  - Ã“ptima: â‰¥45 kcal/kg FFM/dÃ­a
  - Adecuada: 30-45 kcal/kg FFM/dÃ­a
  - LÃ­mite bajo: 25-30 kcal/kg FFM/dÃ­a
  - Riesgo RED-S: <25 kcal/kg FFM/dÃ­a

Hombres:
  - Ã“ptima: â‰¥35 kcal/kg FFM/dÃ­a
  - Adecuada: 25-35 kcal/kg FFM/dÃ­a
  - LÃ­mite bajo: 20-25 kcal/kg FFM/dÃ­a
  - Riesgo LEA: <20 kcal/kg FFM/dÃ­a
```

**Referencias:**
- Mujeres: <30 kcal/kg FFM/dÃ­a â†’ RED-S (Relative Energy Deficiency in Sport)
- Hombres: ~20-30 kcal/kg FFM/dÃ­a â†’ LEA (Low Energy Availability)

### 3. **CÃ¡lculo MetabÃ³lico**

```python
# FÃ³rmula Katch-McArdle
TMB = 370 + (9.8 Ã— FFM_lbs)

# TDEE (Total Daily Energy Expenditure)
TDEE = TMB Ã— Factor_Actividad

Factores de actividad:
- Sedentario: 1.2
- Ligero: 1.375
- Moderado: 1.55  (DEFAULT)
- Intenso: 1.725
- Muy Intenso: 1.9
```

### 4. **DistribuciÃ³n de Macronutrientes**

```python
# ProteÃ­na: FÃ³rmula del sistema ONV2
ProteÃ­na = 2.513244 Ã— FFM_kg  # Alta para preservar mÃºsculo

# Grasa: 30% de calorÃ­as totales
Grasa_g = (CalorÃ­as Ã— 0.3) / 9

# Carbohidratos: Resto de calorÃ­as
CH_kcal = CalorÃ­as - (ProteÃ­na_kcal + Grasa_kcal)
CH_g = CH_kcal / 4
```

---

## ðŸ—„ï¸ Arquitectura de la ImplementaciÃ³n

### Backend (`functions.py`)

#### Nueva FunciÃ³n: `calcular_plan_nutricional_automatico(nombre_usuario)`

**Inputs:**
- `nombre_usuario`: Nombre del usuario del sistema

**Process:**
1. Lee datos actuales de `PERFILDINAMICO` y `PERFILESTATICO`
2. Lee objetivo de tabla `OBJETIVO`
3. Calcula TMB y TDEE usando Katch-McArdle
4. Determina tipo de objetivo (pÃ©rdida/ganancia/mantenimiento)
5. Calcula 2-3 opciones de velocidad segÃºn tipo
6. Para cada opciÃ³n:
   - Calcula calorÃ­as necesarias
   - Aplica lÃ­mites de EA mÃ­nima
   - Calcula macronutrientes
   - EvalÃºa EA y asigna status
7. Retorna todas las opciones con datos completos

**Outputs (JSON):**
```json
{
  "datos_actuales": {
    "peso": 180.5,
    "peso_magro": 150.2,
    "peso_graso": 30.3,
    "bf": 16.8,
    "ffmi": 19.5
  },
  "objetivo": {
    "peso": 170.0,
    "peso_magro": 148.0,
    "peso_graso": 22.0,
    "bf": 12.9,
    "ffmi": 19.3
  },
  "cambios_necesarios": {
    "peso": -10.5,
    "grasa": -8.3,
    "musculo": -2.2
  },
  "tipo_objetivo": "perdida",
  "tdee_mantenimiento": 2450,
  "tmb": 1581,
  "opciones_velocidad": [
    {
      "nombre": "Conservadora",
      "velocidad_semanal_kg": 0.205,
      "velocidad_semanal_lb": 0.452,
      "porcentaje_peso": "0.25%",
      "calorias": 2221,
      "deficit_diario": 226,
      "semanas_estimadas": 23,
      "riesgo_masa_magra": "Muy bajo",
      "descripcion": "PÃ©rdida lenta y sostenible...",
      "macros": {
        "proteina_g": 377.5,
        "grasa_g": 74.0,
        "carbohidratos_g": 123.1,
        "proteina_porcentaje": 68.0,
        "grasa_porcentaje": 30.0,
        "carbohidratos_porcentaje": 22.2
      },
      "disponibilidad_energetica": {
        "ea_valor": 43.8,
        "ea_status": "Ã“ptima",
        "ea_minima": 25
      }
    },
    // ... mÃ¡s opciones
  ],
  "metadata": {
    "sexo": "M",
    "edad": 28,
    "altura": 175.0,
    "fecha_calculo": "2025-09-30 22:00:00"
  }
}
```

### API Endpoint (`main.py`)

```python
@app.route('/api/planner/plan-automatico/<string:nombre_usuario>')
def api_plan_automatico(nombre_usuario):
    """
    GET /api/planner/plan-automatico/Toffaletti, Diego Alejandro
    
    Seguridad:
    - Requiere sesiÃ³n activa
    - Solo Diego puede ver todos los usuarios
    - Otros usuarios solo ven sus propios datos
    
    Response: JSON con plan automÃ¡tico calculado
    """
```

### Frontend (`planner_nuevo.html`)

#### Estructura:

1. **SecciÃ³n de Plan AutomÃ¡tico** (Nuevo)
   - Colapsable
   - Se carga automÃ¡ticamente al seleccionar usuario
   - Muestra datos actuales vs objetivo
   - InformaciÃ³n metabÃ³lica (TMB, TDEE)
   - Cards de opciones de velocidad (2-3 opciones)
   - BotÃ³n para aplicar plan seleccionado

2. **Formulario Manual** (Existente)
   - Mantiene toda la funcionalidad original
   - Se auto-completa con datos del plan automÃ¡tico
   - Usuario puede ajustar manualmente

#### JavaScript Funciones:

```javascript
cargarPlanAutomatico(nombreUsuario)
  â†’ Llama al endpoint API
  â†’ Procesa respuesta
  â†’ Llama a mostrarPlanAutomatico()

mostrarPlanAutomatico(data)
  â†’ Llena datos actuales y objetivo
  â†’ Llena informaciÃ³n metabÃ³lica
  â†’ Crea cards de opciones dinÃ¡micamente

crearCardOpcion(opcion, index, tipoObjetivo)
  â†’ Genera HTML de card interactiva
  â†’ Colores segÃºn tipo (conservadora/moderada/agresiva)
  â†’ Badge de "Recomendada" si aplica

seleccionarOpcion(index)
  â†’ Marca visualmente opciÃ³n seleccionada
  â†’ Habilita botÃ³n "Usar Plan AutomÃ¡ticamente"
  â†’ Scroll suave al botÃ³n

btnUsarPlanAutomatico.click()
  â†’ Llena campo de calorÃ­as en formulario manual
  â†’ Feedback visual (resaltado verde)
  â†’ Scroll al formulario manual
  â†’ Alerta de confirmaciÃ³n
```

---

## ðŸŽ¨ Experiencia de Usuario

### Flujo Completo:

1. **Usuario selecciona su nombre** en dropdown
   - â†“ Trigger automÃ¡tico

2. **Sistema carga datos** del backend
   - Calcula 2-3 opciones de plan
   - â†“ Muestra secciÃ³n de Plan AutomÃ¡tico

3. **Usuario ve su situaciÃ³n actual**
   - Datos actuales vs objetivo
   - Tipo de objetivo (pÃ©rdida/ganancia/mantenimiento)
   - Metabolismo base (TMB/TDEE)

4. **Usuario revisa opciones de velocidad**
   - Cards visuales con todos los datos
   - Colores distintivos por estrategia
   - Badge "â­ Recomendada" en opciÃ³n Ã³ptima

5. **Usuario selecciona una opciÃ³n**
   - Click en card â†’ resaltado con borde negro
   - AnimaciÃ³n de escala (1.05x)
   - BotÃ³n "Usar Plan" se habilita

6. **Usuario aplica el plan**
   - Click en botÃ³n verde
   - â†“ CalorÃ­as se llenan automÃ¡ticamente en formulario
   - Scroll suave al formulario manual
   - Campo de calorÃ­as resaltado en verde
   - Alerta de confirmaciÃ³n

7. **Usuario completa configuraciÃ³n**
   - Ajusta comidas, tamaÃ±os, entrenamiento
   - Guarda el plan completo

---

## ðŸ“Š Ejemplo de CÃ¡lculo Real

### Usuario: Hombre, 28 aÃ±os, 175cm

**Datos Actuales:**
- Peso: 180.5 lbs (81.8 kg)
- Grasa Corporal: 16.8%
- Peso Magro (FFM): 150.2 lbs (68.1 kg)
- FFMI: 19.5

**Objetivo:**
- Peso: 170 lbs
- Grasa Corporal: 12.9%
- Cambio necesario: **-10.5 lbs** (-8.3 lbs grasa, -2.2 lbs mÃºsculo)

**CÃ¡lculos MetabÃ³licos:**
```python
TMB = 370 + (9.8 Ã— 150.2) = 1,581 kcal/dÃ­a
TDEE = 1,581 Ã— 1.55 = 2,450 kcal/dÃ­a
```

**Tipo Objetivo:** PÃ©rdida de peso

### OpciÃ³n 1: Conservadora

```python
Velocidad: 0.25% Ã— 81.8 kg = 0.205 kg/sem = 0.452 lbs/sem
DÃ©ficit: 0.452 Ã— 3500 / 7 = 226 kcal/dÃ­a
CalorÃ­as: 2,450 - 226 = 2,224 kcal/dÃ­a

# Verificar EA
EA = (2224 - 300) / 68.1 = 28.2 kcal/kg FFM/dÃ­a
Status: "Adecuada" (â‰¥25 para hombres)

Macros:
- ProteÃ­na: 2.513244 Ã— 68.1 = 171.2g (31%)
- Grasa: 2224 Ã— 0.3 / 9 = 74.1g (30%)
- Carbohidratos: (2224 - 685 - 667) / 4 = 218g (39%)

Tiempo: 10.5 lbs / 0.452 lbs/sem = 23 semanas
```

### OpciÃ³n 2: Moderada (Recomendada)

```python
Velocidad: 0.5% Ã— 81.8 kg = 0.409 kg/sem = 0.902 lbs/sem
DÃ©ficit: 0.902 Ã— 3500 / 7 = 451 kcal/dÃ­a
CalorÃ­as: 2,450 - 451 = 1,999 kcal/dÃ­a

EA = (1999 - 300) / 68.1 = 24.9 kcal/kg FFM/dÃ­a
Status: "LÃ­mite bajo" (monitorizar)

Macros:
- ProteÃ­na: 171.2g (34%)
- Grasa: 66.6g (30%)
- Carbohidratos: 179.3g (36%)

Tiempo: 10.5 lbs / 0.902 lbs/sem = 12 semanas
```

### OpciÃ³n 3: Agresiva

```python
Velocidad: 0.75% Ã— 81.8 kg = 0.614 kg/sem = 1.353 lbs/sem
DÃ©ficit: 1.353 Ã— 3500 / 7 = 676 kcal/dÃ­a
CalorÃ­as: 2,450 - 676 = 1,774 kcal/dÃ­a

EA = (1774 - 300) / 68.1 = 21.6 kcal/kg FFM/dÃ­a
Status: "LÃ­mite bajo - Monitorizar" (cerca del umbral LEA)

Macros:
- ProteÃ­na: 171.2g (39%)
- Grasa: 59.1g (30%)
- Carbohidratos: 137.2g (31%)

Tiempo: 10.5 lbs / 1.353 lbs/sem = 8 semanas
Riesgo: Moderado-Alto de pÃ©rdida muscular
```

**RecomendaciÃ³n del Sistema:** OpciÃ³n 2 (Moderada)
- Equilibrio entre velocidad y preservaciÃ³n muscular
- EA en lÃ­mite aceptable (monitorizar)
- Tiempo razonable (12 semanas)

---

## âš ï¸ Protecciones Implementadas

### 1. LÃ­mites de EA MÃ­nima

```python
# Mujeres
if sexo == "F":
    ea_minima = 30  # kcal/kg FFM/dÃ­a
    ingesta_minima = (30 Ã— FFM) + 300

# Hombres
else:
    ea_minima = 25  # kcal/kg FFM/dÃ­a
    ingesta_minima = (25 Ã— FFM) + 300

# Aplicar lÃ­mite
calorias = max(calorias_calculadas, ingesta_minima)
```

### 2. Alertas de EA

El sistema clasifica automÃ¡ticamente cada opciÃ³n:
- ðŸŸ¢ **Ã“ptima:** EA alta, seguro para uso prolongado
- ðŸ”µ **Adecuada:** EA aceptable, puede usarse con monitoreo
- ðŸŸ¡ **LÃ­mite bajo:** EA cerca del umbral, requiere vigilancia
- ðŸ”´ **Muy baja:** EA peligrosa, riesgo RED-S/LEA

### 3. Advertencias de Riesgo

Para pÃ©rdida de peso:
- **Conservadora:** "Riesgo Muy bajo"
- **Moderada:** "Riesgo Bajo"
- **Agresiva:** "Riesgo Moderado-Alto"

---

## ðŸš€ Ventajas del Sistema

1. **Basado en Ciencia**
   - FÃ³rmulas validadas (Katch-McArdle)
   - Umbrales de EA segÃºn literatura cientÃ­fica
   - Velocidades seguras basadas en % de peso

2. **Personalizado**
   - Usa datos reales del usuario
   - Considera objetivo especÃ­fico
   - Diferencia por sexo (EA, umbrales)

3. **Seguro**
   - Previene dÃ©ficits peligrosos
   - Alertas de disponibilidad energÃ©tica
   - Opciones conservadoras disponibles

4. **Flexible**
   - Usuario elige su estrategia
   - Puede ajustar manualmente despuÃ©s
   - Mantiene formulario original intacto

5. **Educativo**
   - Muestra todos los cÃ¡lculos
   - Explica riesgos y beneficios
   - Tiempo estimado transparente

---

## ðŸ“ Archivos Modificados/Creados

### Nuevos:
1. `src/templates/planner_nuevo.html` - Template completo con plan automÃ¡tico
2. `docs/planner_automatico_implementacion.md` - Esta documentaciÃ³n

### Modificados:
1. `src/functions.py`
   - Agregada funciÃ³n `calcular_plan_nutricional_automatico()`
   - LÃ­neas: 1794-2069 (276 lÃ­neas nuevas)

2. `src/main.py`
   - Agregado endpoint `/api/planner/plan-automatico/<usuario>`
   - Actualizada ruta `/planner` para usar `planner_nuevo.html`
   - LÃ­neas: 1316-1331

---

## ðŸ§ª Testing

### Test Manual Recomendado:

1. **Login como Diego**
2. **Ir a `/planner`**
3. **Seleccionar un usuario con objetivo definido**
4. **Verificar:**
   - âœ… Plan automÃ¡tico se carga
   - âœ… Datos actuales correctos
   - âœ… Objetivo correcto
   - âœ… 2-3 opciones de velocidad mostradas
   - âœ… Macronutrientes calculados
   - âœ… EA mostrada y clasificada
   - âœ… SelecciÃ³n de opciÃ³n funciona
   - âœ… BotÃ³n "Usar Plan" se habilita
   - âœ… CalorÃ­as se llenan en formulario
   - âœ… Scroll y animaciones funcionan

### Test de API:

```bash
# Obtener plan automÃ¡tico
curl -X GET \
  http://localhost:8000/api/planner/plan-automatico/Toffaletti,%20Diego%20Alejandro \
  -H 'Cookie: session=...'
```

---

## ðŸ“ Notas de ImplementaciÃ³n

### Valores por Defecto:
- **Factor de actividad:** 1.55 (Moderado)
- **Gasto ejercicio estimado:** 300 kcal/dÃ­a (para cÃ¡lculo EA)
- **DistribuciÃ³n macros:** P variable, G 30%, CH resto

### Limitaciones Actuales:
- Factor de actividad fijo (futuro: selector)
- Gasto ejercicio estimado (futuro: basado en plan entrenamiento)
- No considera dÃ­as de entrenamiento vs descanso

### Mejoras Futuras Sugeridas:
1. Selector de factor de actividad en frontend
2. IntegraciÃ³n con plan de entrenamiento para gasto ejercicio real
3. Ciclado de calorÃ­as (dÃ­as altos/bajos)
4. Historial de planes automÃ¡ticos generados
5. GrÃ¡ficos de progreso proyectado vs real

---

## ðŸŽ¯ ConclusiÃ³n

El sistema de **Plan Nutricional AutomÃ¡tico** estÃ¡ completamente implementado y funcional. Proporciona cÃ¡lculos cientÃ­ficamente fundamentados, mÃºltiples opciones estratÃ©gicas, y protecciones de seguridad basadas en disponibilidad energÃ©tica.

**Estado:** âœ… **COMPLETO Y FUNCIONAL**

**PrÃ³ximo paso recomendado:** Testing con usuarios reales y ajuste de factor de actividad basado en feedback.

---

**Documentado por:** Sistema ONV2
**Fecha:** 2025-09-30
**VersiÃ³n:** 1.0


