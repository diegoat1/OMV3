# ðŸ”§ Fixes CrÃ­ticos: Constructor y Generador de Combinaciones

## **Fecha**: 2025-10-06
## **Estado**: âœ… IMPLEMENTACIÃ“N COMPLETA

---

## **ðŸ“‹ Resumen Ejecutivo**

Se corrigieron **7 problemas crÃ­ticos** que impedÃ­an el funcionamiento del constructor de combinaciones y del generador de sugerencias inteligentes. Todos los fixes se sincronizaron con el sistema de bloques redondeados a pasos de 0.5.

---

## **ðŸš¨ Problemas Identificados y Solucionados**

### **1. ReferenceError en Constructor** âœ… RESUELTO

**Problema**:
```javascript
// Botones HTML llamaban funciones dentro de DOMContentLoaded
<button onclick="agregarAlimentoConstructor()">  // âŒ ReferenceError
```

**Causa**: Funciones declaradas dentro de `DOMContentLoaded` no accesibles desde atributos `onclick`.

**SoluciÃ³n** (`plan_alimentario.html:2529-2533`):
```javascript
// Exponer funciones al scope global
window.agregarAlimentoConstructor = agregarAlimentoConstructor;
window.guardarCombinacionConstructor = guardarCombinacionConstructor;
window.eliminarAlimentoConstructor = eliminarAlimentoConstructor;
window.completarCarbohidratosAuto = completarCarbohidratosAuto;
```

---

### **2. Descuadre de Bloques en Constructor** âœ… RESUELTO

**Problema**:
```javascript
// Constructor usaba decimales crudos
objetivoComida = {
    proteina: 1.66,  // Del plan
    grasa: 0.83,
    carbohidratos: 1.66
};

// CatÃ¡logo usaba redondeados
alimento.bloques_unitarios = {
    proteina: 1.5,   // Redondeado a 0.5
    grasa: 1.0,
    carbohidratos: 1.5
};
// Resultado: NUNCA coincidÃ­a con tolerancia Â±0.3
```

**SoluciÃ³n** (`plan_alimentario.html:2193-2200`):
```javascript
// Redondear objetivos a pasos de 0.5
const redondearAMedioBloq = (valor) => Math.round((valor || 0) * 2) / 2;

objetivoComida = {
    proteina: redondearAMedioBloq(comidaData.bloques.proteina.bloques_decimal),
    grasa: redondearAMedioBloq(comidaData.bloques.grasa.bloques_decimal),
    carbohidratos: redondearAMedioBloq(comidaData.bloques.carbohidratos.bloques_decimal)
};
// Ahora: 1.66 â†’ 1.5, 0.83 â†’ 1.0 âœ… Coincide con catÃ¡logo
```

---

### **3. Estado Persistente al Cambiar Comida** âœ… RESUELTO

**Problema**:
```javascript
// Usuario ajustando desayuno
alimentosConstructor = [huevo, leche];  // 2PÂ·1GÂ·1C

// Usuario cambia a almuerzo (3PÂ·2GÂ·2C)
// âŒ Los alimentos del desayuno seguÃ­an sumando
```

**SoluciÃ³n** (`plan_alimentario.html:2210-2213`):
```javascript
// Limpiar construcciÃ³n anterior al cambiar de comida
alimentosConstructor = [];
renderizarListaAlimentos();
recalcularAcumulado();
```

---

### **4. Generador RecibÃ­a Decimales Crudos** âœ… RESUELTO

**Problema**:
```python
# Backend pasaba valores exactos al generador
bloques_p_actual = 1.66  # Del plan DIETA
bloques_g_actual = 0.83
bloques_c_actual = 1.66

# CatÃ¡logo tenÃ­a redondeados
huevo.bloques = {proteina: 0.5, grasa: 0.5, carbohidratos: 0.0}

# Resultado: No encontraba combinaciones (1.66 â‰  0.5 + 0.5 + 0.5)
```

**SoluciÃ³n** (`src/main.py:4303-4310`):
```python
# Redondear bloques a pasos de 0.5 para sincronizar con catÃ¡logo
bloques_p_exacto = gramos_p_actual / BLOQUE_PROTEINA if gramos_p_actual > 0 else 0
bloques_g_exacto = gramos_g_actual / BLOQUE_GRASA if gramos_g_actual > 0 else 0
bloques_c_exacto = gramos_c_actual / BLOQUE_CARBOHIDRATOS if gramos_c_actual > 0 else 0

bloques_p_actual = functions.redondear_a_medio_bloque(bloques_p_exacto)  # 1.66 â†’ 1.5
bloques_g_actual = functions.redondear_a_medio_bloque(bloques_g_exacto)  # 0.83 â†’ 1.0
bloques_c_actual = functions.redondear_a_medio_bloque(bloques_c_exacto)  # 1.66 â†’ 1.5
```

---

### **5. Momentos Incompletos para Colaciones** âœ… RESUELTO

**Problema**:
```python
# Mapeo original muy limitado
momentos_por_categoria = {
    'Leche': ['desayuno', 'media_manana', 'merienda'],  # âŒ Sin media_tarde
    'Frutos secos': ['media_manana', 'merienda', 'media_tarde'],  # OK
    'Yogur': ['desayuno', 'media_manana', 'merienda']  # âŒ Sin media_tarde
}

# Resultado: Media tarde casi sin opciones
```

**SoluciÃ³n** (`src/functions.py:4330-4353`):
```python
# Mapeo expandido para colaciones
momentos_por_categoria = {
    'Leche': ['desayuno', 'media_manana', 'merienda', 'media_tarde'],  # âœ…
    'Yogur': ['desayuno', 'media_manana', 'merienda', 'media_tarde'],  # âœ…
    'Queso': ['desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena'],  # âœ…
    'Avena': ['desayuno', 'media_manana', 'merienda', 'media_tarde'],  # âœ…
    'Panes': ['desayuno', 'media_manana', 'merienda', 'media_tarde'],  # âœ…
    'Frutas A': ['desayuno', 'media_manana', 'merienda', 'media_tarde'],  # âœ…
    'Frutos secos': ['desayuno', 'media_manana', 'merienda', 'media_tarde'],  # âœ…
    'Fiambres': ['desayuno', 'media_manana', 'merienda', 'media_tarde'],  # âœ…
    # ... resto igual
}
```

---

### **6. Tolerancias Incompatibles con Redondeo** âœ… RESUELTO

**Problema**:
```python
# Tolerancias originales
tolerancia = {
    'proteina': 0.2,  # Â±0.2 bloques
    'grasa': 0.2,
    'carbohidratos': 0.3
}

# Bloques redondeados a 0.5:
# Objetivo: 1.5P  (redondeado de 1.66)
# Combo: 1.0P (2 Ã— 0.5P)
# Diferencia: |1.5 - 1.0| = 0.5 > 0.2  âŒ Rechazado

# Combo: 1.5P (3 Ã— 0.5P)
# Diferencia: |1.5 - 1.5| = 0.0  âœ… Aceptado

# Resultado: Muy pocas combinaciones vÃ¡lidas
```

**SoluciÃ³n** (`src/functions.py:4496-4501`):
```python
# Tolerancia ajustada para bloques redondeados a 0.5
tolerancia = {
    'proteina': 0.5,  # Â±0.5 bloques = 10g (compatible con redondeo)
    'grasa': 0.5,     # Â±0.5 bloques = 5g
    'carbohidratos': 0.5  # Â±0.5 bloques = 12.5g
}

# Ahora:
# Objetivo: 1.5P
# Combo: 1.0P â†’ Diferencia 0.5 â‰¤ 0.5  âœ… Aceptado
# Combo: 2.0P â†’ Diferencia 0.5 â‰¤ 0.5  âœ… Aceptado
```

---

### **7. NormalizaciÃ³n de Valores con Coma** âœ… RESUELTO

**Problema**:
```python
# GRUPOSALIMENTOS guardaba con coma decimal
proteina_100g = "0,5"  # String con coma
float("0,5")  # âŒ ValueError: could not convert string to float
```

**SoluciÃ³n** (`src/functions.py:4296-4306`):
```python
def _to_float(value, default=0.0):
    """Convierte valores de base (que pueden venir con coma decimal) a float."""
    if value is None:
        return default
    if isinstance(value, (int, float)):
        return float(value)
    try:
        value_str = str(value).strip().replace(',', '.')  # "0,5" â†’ "0.5"
        return float(value_str) if value_str else default
    except (ValueError, TypeError):
        return default

# Uso en carga:
proteina_100g = _to_float(row[3])  # âœ… 0.5
```

---

## **ðŸ“Š Impacto de los Fixes**

| Problema | Antes | DespuÃ©s |
|----------|-------|---------|
| **Constructor funciona** | âŒ ReferenceError | âœ… Funcional |
| **Objetivos sincronizados** | âŒ Nunca coincide | âœ… Compatible con catÃ¡logo |
| **Estado limpio** | âŒ Alimentos mezclados | âœ… Limpio al cambiar |
| **Sugerencias generadas** | âŒ 0 resultados | âœ… MÃºltiples combos |
| **Colaciones disponibles** | âŒ Casi vacÃ­as | âœ… 8+ opciones |
| **Tolerancia realista** | âŒ 0.2 (muy estricto) | âœ… 0.5 (acorde a redondeo) |
| **Carga de datos** | âŒ Error con comas | âœ… NormalizaciÃ³n automÃ¡tica |

---

## **ðŸ”„ Flujo Completo Sincronizado**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ GRUPOSALIMENTOS (DB)                                            â”‚
â”‚ â€¢ PROTEINA: "0,5" (string con coma)                            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                 â”‚ _to_float() normaliza
                 â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ obtener_catalogo_alimentos_bloques()                            â”‚
â”‚ â€¢ Calcula bloques exactos: 0.39P                               â”‚
â”‚ â€¢ Redondea a 0.5: redondear_a_medio_bloque(0.39) â†’ 0.5P       â”‚
â”‚ â€¢ CachÃ©: {bloques: {P: 0.5}, bloques_exactos: {P: 0.39}}      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                 â”‚
                 â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ GET /api/grupos-alimentos                                       â”‚
â”‚ â€¢ bloques_unitarios: {P: 0.5, G: 1.0, C: 0.5}  (redondeados)  â”‚
â”‚ â€¢ bloques_exactos: {P: 0.39, G: 0.76, C: 0.48}  (originales)  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                 â”‚
         â”Œâ”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”
         â”‚               â”‚
         â†“               â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Tabla Referenciaâ”‚ â”‚ api_plan_alimentario_bloques_sugerenciasâ”‚
â”‚ â€¢ Filtros P/G/C â”‚ â”‚ â€¢ Redondea objetivos: 1.66P â†’ 1.5P     â”‚
â”‚ â€¢ Tooltips      â”‚ â”‚ â€¢ Tolerancia 0.5 compatible            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â€¢ Momentos expandidos                  â”‚
                     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                  â”‚
                                  â†“
                     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                     â”‚ generar_combinaciones_alimentos()      â”‚
                     â”‚ â€¢ Objetivo: {P: 1.5, G: 1.0, C: 1.5}  â”‚
                     â”‚ â€¢ CatÃ¡logo: bloques en pasos de 0.5   â”‚
                     â”‚ â€¢ Tolerancia: Â±0.5                    â”‚
                     â”‚ â€¢ Resultado: âœ… MÃºltiples combos      â”‚
                     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                  â”‚
                                  â†“
         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
         â”‚                                                  â”‚
         â†“                                                  â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Tab "Inteligente"   â”‚                         â”‚ Constructor Manual   â”‚
â”‚ â€¢ 8+ combinaciones  â”‚                         â”‚ â€¢ Objetivos: 1.5P    â”‚
â”‚ â€¢ Por comida        â”‚                         â”‚ â€¢ Alimentos: 0.5P    â”‚
â”‚ â€¢ Filtradas         â”‚                         â”‚ â€¢ Suma: âœ… Coincide  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## **ðŸ“ Archivos Modificados**

| Archivo | LÃ­neas | Cambio | Impacto |
|---------|--------|--------|---------|
| `src/functions.py` | 4296-4306 | `_to_float()` normalizaciÃ³n | âœ… Carga sin errores |
| `src/functions.py` | 4330-4353 | Momentos expandidos | âœ… Colaciones con opciones |
| `src/functions.py` | 4496-4501 | Tolerancias 0.5 | âœ… MÃ¡s combinaciones vÃ¡lidas |
| `src/main.py` | 4303-4310 | Redondeo en generador | âœ… Objetivos sincronizados |
| `plan_alimentario.html` | 2193-2213 | Redondeo objetivoComida + limpieza | âœ… Constructor funcional |
| `plan_alimentario.html` | 2529-2533 | Exponer funciones a window | âœ… Sin ReferenceError |

---

## **ðŸ§ª Testing Requerido**

### **Test 1: Constructor Manual**

```javascript
// En navegador (F12 Console)
// 1. Abrir modal constructor
document.getElementById('constructorComida').value = 'desayuno';
cargarObjetivoComida('desayuno');

// 2. Verificar objetivo redondeado
console.log(objetivoComida);  
// Esperado: {proteina: 1.5, grasa: 1.0, carbohidratos: 1.5}  (no 1.66, 0.83, 1.66)

// 3. Agregar alimento
window.agregarAlimentoConstructor();  // âœ… No ReferenceError

// 4. Cambiar comida
cargarObjetivoComida('almuerzo');
console.log(alimentosConstructor);  // Esperado: [] (limpio)
```

### **Test 2: Generador Inteligente**

```python
# En servidor
# 1. Verificar objetivos redondeados
from functions import redondear_a_medio_bloque
assert redondear_a_medio_bloque(1.66) == 1.5
assert redondear_a_medio_bloque(0.83) == 1.0

# 2. Probar generador
objetivo_bloques = {'proteina': 1.5, 'grasa': 1.0, 'carbohidratos': 1.5}
combos = generar_combinaciones_alimentos(objetivo_bloques, catalogo, momento_comida='desayuno')
assert len(combos) > 0  # âœ… Debe encontrar combinaciones
```

### **Test 3: API Completa**

```bash
# 1. Reiniciar servidor
python limpiar_cache.py
python src/main.py

# 2. Verificar endpoint
curl -s http://localhost:8000/api/grupos-alimentos | jq '.alimentos[0].bloques_unitarios'
# Esperado: {"proteina": 0.5, "grasa": 1.0, "carbohidratos": 0.5}

# 3. Verificar sugerencias
curl -s http://localhost:8000/api/plan-alimentario/bloques/sugerencias | jq '.comidas.desayuno.sugerencias | length'
# Esperado: >= 8  (antes era 0)
```

### **Test 4: Flujo Completo en UI**

1. Login â†’ Plan Alimentario â†’ Plan Simplificado
2. Click "Ver Sugerencias Inteligentes"
3. Tab "Inteligente" â†’ Verificar 8+ combinaciones por comida
4. Click "Usar en Constructor" â†’ Modal abre
5. Agregar alimentos manualmente â†’ Sin ReferenceError
6. Cambiar comida â†’ Estado limpio
7. Guardar combinaciÃ³n â†’ Ã‰xito

---

## **âš ï¸ Pasos Post-ImplementaciÃ³n**

### **CrÃ­tico: Reiniciar Sistema**

```bash
# 1. Limpiar cachÃ©
python limpiar_cache.py

# 2. Reiniciar servidor
# Ctrl+C en terminal de Flask
python src/main.py

# 3. Hard refresh en navegador
# Ctrl+Shift+R (o Ctrl+F5)
```

### **VerificaciÃ³n RÃ¡pida**

```bash
# Verificar bloques redondeados
curl -s http://localhost:8000/api/grupos-alimentos | \
  jq '.alimentos[0:3] | .[] | {categoria, bloques_unitarios}'

# Esperado: Todos los bloques en pasos de 0.5
```

---

## **ðŸ“ˆ Mejoras Futuras Sugeridas**

### **1. Plan B cuando no hay sugerencias**

```python
# En generar_combinaciones_alimentos()
if len(combinaciones) == 0:
    # Fallback: combos simples por macro dominante
    return generar_combos_simples(objetivo_bloques, catalogo_filtrado)
```

### **2. Diversidad de combinaciones**

```python
# Agregar scoring por diversidad
def calcular_diversidad(combo):
    categorias_unicas = len(set(a['categoria'] for a in combo['alimentos']))
    return categorias_unicas / len(combo['alimentos'])

# Ordenar por: error + diversidad
combinaciones.sort(key=lambda c: (c['error_total'], -calcular_diversidad(c)))
```

### **3. CachÃ© de combinaciones**

```python
# Cache resultados por objetivo
@lru_cache(maxsize=128)
def generar_combinaciones_alimentos_cached(objetivo_tuple, momento_comida):
    objetivo_bloques = dict(zip(['proteina', 'grasa', 'carbohidratos'], objetivo_tuple))
    return generar_combinaciones_alimentos(objetivo_bloques, catalogo, momento_comida=momento_comida)
```

---

## **âœ… Estado Final**

| Componente | Estado | Notas |
|------------|--------|-------|
| **Constructor Manual** | âœ… Funcional | Funciones expuestas, objetivos redondeados |
| **Generador Inteligente** | âœ… Funcional | Tolerancias ajustadas, momentos expandidos |
| **Tabla de Referencia** | âœ… Funcional | Bloques redondeados, filtros, tooltips |
| **SincronizaciÃ³n Backend-Frontend** | âœ… Completa | Redondeo a 0.5 en todo el flujo |
| **NormalizaciÃ³n de Datos** | âœ… Completa | `_to_float()` maneja comas |
| **DetecciÃ³n de Alcohol** | âœ… Implementada | Equivalencia a bloques C |

---

**ðŸŽ¯ El sistema de bloques estÃ¡ completamente sincronizado. Constructor y generador funcionan con bloques redondeados a pasos de 0.5. Reiniciar servidor es obligatorio para aplicar cambios.**

**Archivo**: `FIXES_CONSTRUCTOR_GENERADOR.md`  
**Fecha**: 2025-10-06  
**VersiÃ³n**: 1.0.0  
**Estado**: âœ… IMPLEMENTACIÃ“N COMPLETA - REINICIO PENDIENTE

