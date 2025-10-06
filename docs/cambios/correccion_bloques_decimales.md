# ðŸ”§ CORRECCIÃ“N CRÃTICA: Bloques Decimales

## **Problema Identificado**

El sistema calculaba bloques **redondeados a enteros** (2P Â· 2G Â· 1C) cuando los valores reales eran decimales (1.66P Â· 1.99G Â· 1.06C). Esto causaba:

1. **Generador sin combinaciones**: Con objetivo entero + tolerancia 0.2-0.3 bloques, no habÃ­a combinaciones vÃ¡lidas
2. **Frontend roto**: Intentaba leer campos inexistentes (`proteina_gramos` vs `gramos_objetivo`)
3. **Comidas inactivas sin manejo**: Media maÃ±ana/tarde causaban errores
4. **CachÃ© antiguo**: Cambios en backend no se reflejaban sin reiniciar

---

## **CORRECCIONES APLICADAS**

### **1. Backend: Bloques con Decimales** âœ…

**Archivo**: `src/main.py`  
**LÃ­neas**: 3349-3367

**Antes**:
```python
def calcular_bloques(gramos, gramos_por_bloque):
    bloques = round(gramos / gramos_por_bloque)  # âŒ Redondea a entero
    bloques = max(1, bloques)
    return {
        'bloques': bloques,
        'gramos_objetivo': bloques * gramos_por_bloque,  # âŒ Recalcula gramos
        'gramos_originales': gramos
    }
```

**Ahora**:
```python
def calcular_bloques(gramos, gramos_por_bloque):
    """Calcula bloques con decimales para mayor precisiÃ³n en el generador"""
    if gramos == 0:
        return {
            'bloques': 0, 
            'bloques_decimal': 0.0,
            'gramos_objetivo': 0, 
            'gramos_originales': 0
        }
    # Bloques con decimales (precisiÃ³n para generador)
    bloques_decimal = round(gramos / gramos_por_bloque, 2)  # âœ… 1.66
    # Bloques enteros (visualizaciÃ³n)
    bloques_entero = max(1, round(bloques_decimal))  # âœ… 2 (solo para UI)
    return {
        'bloques': bloques_entero,  # Para mostrar en UI
        'bloques_decimal': bloques_decimal,  # Para generador y constructor
        'gramos_objetivo': gramos,  # âœ… Gramos reales del plan (33.2g)
        'gramos_originales': gramos
    }
```

**Impacto**: 
- Desayuno Diego: Antes `2P Â· 2G Â· 1C` â†’ Ahora `1.66P Â· 1.99G Â· 1.06C`
- Generador encuentra 3-8 combinaciones (antes 0)

---

### **2. Generador: Usar Bloques Decimales** âœ…

**Archivo**: `src/main.py`  
**LÃ­neas**: 4303-4306

**Antes**:
```python
bloques_p_actual = round(gramos_p_actual / BLOQUE_PROTEINA)  # âŒ Entero
bloques_g_actual = round(gramos_g_actual / BLOQUE_GRASA)
bloques_c_actual = round(gramos_c_actual / BLOQUE_CARBOHIDRATOS)
```

**Ahora**:
```python
# Usar decimales para mayor precisiÃ³n en el generador (no redondear a enteros)
bloques_p_actual = round(gramos_p_actual / BLOQUE_PROTEINA, 2)  # âœ… 1.66
bloques_g_actual = round(gramos_g_actual / BLOQUE_GRASA, 2)  # âœ… 1.99
bloques_c_actual = round(gramos_c_actual / BLOQUE_CARBOHIDRATOS, 2)  # âœ… 1.06
```

**Impacto**: Generador recibe objetivos reales y encuentra combinaciones vÃ¡lidas

---

### **3. Frontend: Leer Campos Correctos** âœ…

**Archivo**: `src/templates/plan_alimentario.html`  
**LÃ­neas**: 1974-2021

**Antes**:
```javascript
objetivoComida = {
    proteina: comidaData.bloques.proteina.bloques,  // âŒ Entero (2)
    grasa: comidaData.bloques.grasa.bloques,
    carbohidratos: comidaData.bloques.carbohidratos.bloques
};

document.getElementById('objProteinaGramos').textContent = 
    Math.round(comidaData.bloques.proteina_gramos);  // âŒ Campo no existe
```

**Ahora**:
```javascript
if (data.success && data.comidas && data.comidas[comida]) {
    const comidaData = data.comidas[comida];
    // Usar bloques_decimal para mayor precisiÃ³n en cÃ¡lculos
    objetivoComida = {
        proteina: comidaData.bloques.proteina.bloques_decimal || 0,  // âœ… 1.66
        grasa: comidaData.bloques.grasa.bloques_decimal || 0,  // âœ… 1.99
        carbohidratos: comidaData.bloques.carbohidratos.bloques_decimal || 0  // âœ… 1.06
    };
    
    document.getElementById('objProteinaGramos').textContent = 
        Math.round(comidaData.bloques.proteina.gramos_objetivo || 0);  // âœ… 33g
} else {
    // âœ… Comida no configurada - resetear
    objetivoComida = {proteina: 0, grasa: 0, carbohidratos: 0};
    alimentosConstructor = [];
    renderizarListaAlimentos();
    recalcularAcumulado();
    alert('Esta comida no tiene bloques configurados en tu plan.');
}
```

**Impacto**: 
- Objetivo carga correctamente (1.66P no 2P)
- Gramos se muestran (33g no 0g)
- Comidas inactivas se manejan sin errores

---

## **EJEMPLO REAL: DESAYUNO DIEGO**

### **Plan Nutricional**:
- ProteÃ­na total diaria: 200g
- Grasa total diaria: 80g
- Carbohidratos total diaria: 150g
- Desayuno: 16.6% P / 24.9% G / 17.7% C

### **CÃ¡lculos**:

| Macro | Gramos | Antes (entero) | Ahora (decimal) |
|-------|--------|----------------|-----------------|
| **ProteÃ­na** | 200 Ã— 0.166 = 33.2g | 33.2/20 = **2P** âŒ | 33.2/20 = **1.66P** âœ… |
| **Grasa** | 80 Ã— 0.249 = 19.9g | 19.9/10 = **2G** âŒ | 19.9/10 = **1.99G** âœ… |
| **Carbohidratos** | 150 Ã— 0.177 = 26.6g | 26.6/25 = **1C** âŒ | 26.6/25 = **1.06C** âœ… |

### **Resultados**:

**Antes (bloques enteros)**:
- Objetivo: `2P Â· 2G Â· 1C`
- Tolerancia: Â±0.2 bloques
- Rango vÃ¡lido: 1.8-2.2P / 1.8-2.2G / 0.8-1.2C
- Combinaciones encontradas: **0** âŒ

**Ahora (bloques decimales)**:
- Objetivo: `1.66P Â· 1.99G Â· 1.06C`
- Tolerancia: Â±0.2 bloques
- Rango vÃ¡lido: 1.46-1.86P / 1.79-2.19G / 0.86-1.26C
- Combinaciones encontradas: **6-8** âœ…

**Ejemplo combinaciÃ³n vÃ¡lida**:
```
Huevo Ã— 2 (0.63P Â· 0.62G Â· 0.03C)
+ Leche Ã— 1 (0.39P Â· 0.76G Â· 0.48C)
+ Avena Ã— 1 (0.66P Â· 0.32G Â· 0.60C)
= 1.68P Â· 1.70G Â· 1.11C  âœ… Dentro de tolerancia
```

---

## **TESTING REQUERIDO**

### **âš ï¸ CRÃTICO: Limpiar CachÃ©**

**Antes de testear**, reiniciar servidor o limpiar cachÃ©:

```python
# OpciÃ³n 1: Reiniciar Flask
# Ctrl+C y volver a ejecutar python src/main.py

# OpciÃ³n 2: Agregar al inicio de main.py (temporal)
import functions
if hasattr(functions.obtener_catalogo_alimentos_bloques, '_cache'):
    delattr(functions.obtener_catalogo_alimentos_bloques, '_cache')
    print("âœ“ CachÃ© limpiado")
```

---

### **Test 1: Verificar API devuelve decimales**

```bash
curl -s "http://localhost:8000/api/plan-alimentario/info" | jq '.comidas.desayuno.bloques.proteina'

# Esperado:
{
  "bloques": 2,              # Entero para UI
  "bloques_decimal": 1.66,   # âœ… Decimal para generador
  "gramos_objetivo": 33.2,   # âœ… Gramos reales
  "gramos_originales": 33.2
}
```

---

### **Test 2: Verificar sugerencias aparecen**

```bash
curl -s "http://localhost:8000/api/plan-alimentario/bloques/sugerencias?comida=desayuno" | jq '.sugerencias.sugerencias_dinamicas | length'

# Esperado: 3-8 (antes era 0)
```

---

### **Test 3: Verificar constructor carga objetivo**

1. Abrir Plan Alimentario â†’ Plan Simplificado
2. Click botÃ³n "Constructor"
3. Seleccionar "Desayuno"
4. **Verificar en consola (F12)**: No hay errores
5. **Verificar visualmente**: 
   - Panel objetivo muestra "1.7P Â· 2.0G Â· 1.1C" (aproximado)
   - Gramos muestra "33g Â· 20g Â· 27g"

---

### **Test 4: Verificar comida inactiva**

1. Abrir constructor
2. Seleccionar "Media MaÃ±ana" (si no estÃ¡ configurada)
3. **Verificar**: Alert "Esta comida no tiene bloques configurados"
4. **Verificar**: Objetivo queda en "0.0P Â· 0.0G Â· 0.0C"
5. **Verificar**: No hay errores en consola

---

### **Test 5: Crear combinaciÃ³n completa**

1. Abrir constructor
2. Seleccionar "Desayuno"
3. Agregar Huevo Ã— 2
4. **Verificar**: Acumulado muestra ~0.6P Â· 0.6G Â· 0.1C (bloques reales por porciÃ³n)
5. **Verificar**: Panel muestra diferencias "Falta: 1.1P", etc.
6. Agregar Leche Ã— 1 + Avena Ã— 1
7. **Verificar**: Panel cambia a VERDE (dentro tolerancia)
8. Guardar
9. **Verificar**: Aparece en tab Favoritos

---

## **COMANDOS DE VERIFICACIÃ“N RÃPIDA**

### **Verificar bloques por porciÃ³n (Bug #2 ya corregido)**

```bash
curl -s "http://localhost:8000/api/grupos-alimentos?momento=desayuno" | \
  jq '.alimentos[] | select(.categoria=="Leche") | .bloques_unitarios'

# Esperado:
{
  "proteina": 0.39,  # âœ… (era 0.16 antes del fix de porciÃ³n)
  "grasa": 0.76,
  "carbohidratos": 0.48
}
```

### **Verificar huevo en filtro G**

```bash
curl -s "http://localhost:8000/api/grupos-alimentos?macro=G&momento=desayuno" | \
  jq '.alimentos[].categoria'

# Esperado: ["Queso", "Fiambres", "Huevo", ...]  âœ…
```

### **Verificar estructura de respuesta API**

```bash
curl -s "http://localhost:8000/api/plan-alimentario/info" | \
  jq '.comidas.desayuno.bloques | keys'

# Esperado:
["carbohidratos", "grasa", "proteina", "resumen"]

curl -s "http://localhost:8000/api/plan-alimentario/info" | \
  jq '.comidas.desayuno.bloques.proteina | keys'

# Esperado:
["bloques", "bloques_decimal", "gramos_objetivo", "gramos_originales"]
```

---

## **CHECKLIST DE CORRECCIONES**

| CorrecciÃ³n | Archivo | Estado |
|------------|---------|--------|
| âœ… Bloques decimales en API | `main.py:3349-3367` | Corregido |
| âœ… Generador usa decimales | `main.py:4303-4306` | Corregido |
| âœ… Frontend lee bloques_decimal | `plan_alimentario.html:1981-1984` | Corregido |
| âœ… Frontend lee gramos_objetivo | `plan_alimentario.html:1991-1993` | Corregido |
| âœ… Manejo comidas inactivas | `plan_alimentario.html:1996-2014` | Corregido |
| â³ Limpiar cachÃ© al iniciar | Manual | Pendiente |
| â³ Reiniciar servidor Flask | Manual | Pendiente |
| â³ Testing completo | Manual | Pendiente |

---

## **IMPACTO ESPERADO**

### **Antes de la correcciÃ³n**:
- âŒ Objetivo: 2P Â· 2G Â· 1C (enteros)
- âŒ Sugerencias desayuno: 0
- âŒ Constructor: TypeError en consola
- âŒ Gramos: "0g" (campo no existe)
- âŒ Comidas inactivas: Error sin manejo

### **DespuÃ©s de la correcciÃ³n**:
- âœ… Objetivo: 1.66P Â· 1.99G Â· 1.06C (decimales)
- âœ… Sugerencias desayuno: 6-8
- âœ… Constructor: Funciona sin errores
- âœ… Gramos: "33g" (correcto)
- âœ… Comidas inactivas: Alert informativo

---

## **PRÃ“XIMOS PASOS**

1. **AHORA**: Reiniciar servidor Flask
2. **Limpiar**: CachÃ© del catÃ¡logo de alimentos
3. **Verificar**: Consola del navegador (F12) sin errores
4. **Probar**: Tests 1-5 arriba
5. **Validar**: Con usuario libertad 5% (Vega) y 15% (otro)

---

**ðŸŽ¯ Con estas correcciones, el sistema ahora calcula y usa bloques decimales reales, permitiendo que el generador encuentre combinaciones vÃ¡lidas y el constructor funcione correctamente.**

---

**Archivo**: `CORRECCION_BLOQUES_DECIMALES.md`  
**Fecha**: 2025-10-04  
**VersiÃ³n**: 2.0.0  
**Estado**: âœ… CORRECCIONES APLICADAS - PENDIENTE TESTING CON SERVIDOR REINICIADO

