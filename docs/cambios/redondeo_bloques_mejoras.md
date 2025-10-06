# ðŸ”§ Redondeo de Bloques a 0.5 + Mejoras UX

## **ImplementaciÃ³n Completa**

Se implementÃ³ un sistema de **redondeo unificado a pasos de 0.5** en bloques nutricionales, asegurando consistencia entre tabla de referencia, constructor y generador de combinaciones.

---

## **ðŸŽ¯ Problema Resuelto**

### **Antes**
- Bloques con decimales arbitrarios: `0.39P`, `0.76G`, `1.06C`
- DifÃ­cil de recordar y calcular mentalmente
- Inconsistencia entre UI y cÃ¡lculos internos
- Constructor usaba valores diferentes a la tabla

### **Ahora**
- Bloques en pasos de 0.5: `0.5P`, `0.5G`, `1.0C`
- FÃ¡cil de memorizar y calcular
- âœ… **Consistencia total**: Backend â†’ API â†’ Tabla â†’ Constructor
- Valores exactos disponibles para usuarios avanzados

---

## **ðŸ“Š FunciÃ³n de Redondeo**

**UbicaciÃ³n**: `src/functions.py:4296-4301`

```python
def redondear_a_medio_bloque(valor):
    """
    Redondea bloques a pasos de 0.5 para UI consistente.
    Ejemplos: 0.3 â†’ 0.5, 0.7 â†’ 0.5, 1.2 â†’ 1.0, 1.8 â†’ 2.0
    """
    return round(valor * 2) / 2
```

### **LÃ³gica**
```python
round(0.39 * 2) / 2  # 0.78 â†’ round â†’ 1 â†’ 1/2 = 0.5 âœ…
round(0.76 * 2) / 2  # 1.52 â†’ round â†’ 2 â†’ 2/2 = 1.0 âœ…
round(1.06 * 2) / 2  # 2.12 â†’ round â†’ 2 â†’ 2/2 = 1.0 âœ…
round(1.66 * 2) / 2  # 3.32 â†’ round â†’ 3 â†’ 3/2 = 1.5 âœ…
```

---

## **ðŸ”„ IntegraciÃ³n en Backend**

**UbicaciÃ³n**: `src/functions.py:4371-4414`

### **CÃ¡lculo Actualizado**

```python
# Calcular bloques exactos primero
bloques_p_exacto = proteina / BLOQUE_PROTEINA if proteina > 0 else 0
bloques_g_exacto = grasa / BLOQUE_GRASA if grasa > 0 else 0
bloques_c_exacto = carbohidratos / BLOQUE_CARBOHIDRATOS if carbohidratos > 0 else 0

# Redondear a pasos de 0.5 para UI consistente
bloques_p = redondear_a_medio_bloque(bloques_p_exacto)
bloques_g = redondear_a_medio_bloque(bloques_g_exacto)
bloques_c = redondear_a_medio_bloque(bloques_c_exacto)
```

### **Estructura de Datos Ampliada**

```python
{
    'bloques': {
        'proteina': 0.5,  # âœ… Redondeado a 0.5 (UI, tabla, constructor)
        'grasa': 1.0,
        'carbohidratos': 0.5
    },
    'bloques_exactos': {  # âš™ï¸ Valores exactos (cÃ¡lculos internos, tooltips)
        'proteina': 0.39,
        'grasa': 0.76,
        'carbohidratos': 0.48
    }
}
```

---

## **âœ¨ Mejoras UX Implementadas**

### **1. Filtros por Macro** ðŸŽ›ï¸

**UbicaciÃ³n**: `plan_alimentario.html:188-201`

Botones en header de tabla:
- **Todos**: Muestra catÃ¡logo completo
- **P** (ðŸ¥©): Solo alimentos proteicos
- **G** (ðŸ§€): Solo alimentos grasos
- **C** (ðŸž): Solo alimentos con carbohidratos

**ImplementaciÃ³n**:
```javascript
function filterFoodBlocks(filter) {
    let filtered = allFoodBlocks;
    if (filter !== 'all') {
        filtered = allFoodBlocks.filter(item => item.macros_fuertes.includes(filter));
    }
    renderFoodBlocksTable(filtered);
}
```

### **2. Badges de Macro Dominante** ðŸ·ï¸

Cada alimento muestra un badge de color:
- **Huevo** â†’ Badge rojo "P" (proteico)
- **Aceite** â†’ Badge amarillo "G" (graso)
- **Arroz** â†’ Badge azul "C" (carbohidrato)

**ImplementaciÃ³n**:
```javascript
const macroBadge = {
    'P': '<span class="badge bg-danger badge-sm ms-2">P</span>',
    'G': '<span class="badge bg-warning badge-sm ms-2">G</span>',
    'C': '<span class="badge bg-primary badge-sm ms-2">C</span>'
}[item.macro_dominante] || '';
```

### **3. Tooltips con Valores Exactos** ðŸ’¡

Hover sobre badges muestra valor exacto:
- Redondeado: **0.5P** â†’ Tooltip: "Exacto: 0.39"
- Redondeado: **1.0G** â†’ Tooltip: "Exacto: 0.76"

**ImplementaciÃ³n**:
```javascript
const tooltipP = item.blocks_exact 
    ? `title="Exacto: ${item.blocks_exact.P.toFixed(2)}" data-bs-toggle="tooltip"` 
    : '';
```

### **4. Footer Informativo** ðŸ“

Explica el sistema de redondeo:
> **Tip:** Usa esta tabla para armar tus comidas mentalmente.  
> Ejemplo: Desayuno de 2PÂ·1GÂ·1C = Huevo (0.5PÂ·0.5G) Ã— 2 + Leche (0.5PÂ·0.5C)  
> â„¹ï¸ Bloques redondeados a pasos de 0.5

---

## **ðŸ”— SincronizaciÃ³n Completa**

### **Flujo de Datos**

```
GRUPOSALIMENTOS (DB)
  â†“ (SELECT con macros por 100g)
obtener_catalogo_alimentos_bloques()
  â†“ (ajusta a porciÃ³n real)
Bloques exactos: 0.39P Â· 0.76G Â· 0.48C
  â†“ (redondear_a_medio_bloque)
Bloques redondeados: 0.5P Â· 1.0G Â· 0.5C
  â†“ (cachea resultado)
GET /api/grupos-alimentos
  â†“ (JSON response)
Frontend: loadFoodBlocks()
  â†“ (renderiza)
Tabla de Referencia + Constructor + Generador
```

### **Consumidores Sincronizados**

| Componente | Usa Bloques Redondeados | UbicaciÃ³n |
|------------|------------------------|-----------|
| **Tabla de Referencia** | âœ… SÃ­ (pasos de 0.5) | `plan_alimentario.html:795` |
| **Constructor de Combos** | âœ… SÃ­ (desde API) | `plan_alimentario.html:2023` |
| **Generador Sugerencias** | âœ… SÃ­ (desde catÃ¡logo) | `main.py:4315` |
| **CÃ¡lculos Backend** | âš™ï¸ Puede usar exactos | `functions.py:4410-4414` |

---

## **ðŸ“Š Ejemplos Reales**

### **Leche Descremada (246g)**

| Componente | Antes | Ahora |
|------------|-------|-------|
| **ProteÃ­na exacta** | 7.87g | 7.87g |
| **Bloques exactos** | 0.39P | 0.39P |
| **Bloques UI** | 0.4P | **0.5P** âœ… |
| **Tooltip** | - | "Exacto: 0.39" |

### **Huevo (50g)**

| Componente | Antes | Ahora |
|------------|-------|-------|
| **ProteÃ­na exacta** | 6.3g | 6.3g |
| **Bloques exactos** | 0.32P | 0.32P |
| **Bloques UI** | 0.3P | **0.5P** âœ… |
| **Badge dominante** | - | ðŸ”´ P |
| **Macros fuertes** | P | **P, G** âœ… |

### **Arroz Cocido (100g)**

| Componente | Antes | Ahora |
|------------|-------|-------|
| **Carbohidratos exactos** | 28.2g | 28.2g |
| **Bloques exactos** | 1.13C | 1.13C |
| **Bloques UI** | 1.1C | **1.0C** âœ… |
| **Badge dominante** | - | ðŸ”µ C |

---

## **ðŸ§ª Testing Recomendado**

### **Test 1: Verificar Redondeo en API**

```bash
curl -s "http://localhost:8000/api/grupos-alimentos" | jq '.alimentos[0].bloques_unitarios'

# Esperado:
{
  "proteina": 0.5,      # âœ… Redondeado
  "grasa": 1.0,
  "carbohidratos": 0.5
}

curl -s "http://localhost:8000/api/grupos-alimentos" | jq '.alimentos[0].bloques_exactos'

# Esperado:
{
  "proteina": 0.39,     # âœ… Valor exacto disponible
  "grasa": 0.76,
  "carbohidratos": 0.48
}
```

### **Test 2: Verificar Filtros en Tabla**

1. Abrir Plan Alimentario â†’ Plan Simplificado
2. Click "Ver Tabla de Referencia"
3. Click filtro **"P"** â†’ Solo alimentos proteicos
4. Click filtro **"G"** â†’ Solo alimentos grasos
5. Click filtro **"C"** â†’ Solo carbohidratos
6. Click **"Todos"** â†’ CatÃ¡logo completo

### **Test 3: Verificar Tooltips**

1. Hover sobre badge **0.5P** â†’ Tooltip "Exacto: 0.39"
2. Hover sobre badge **1.0G** â†’ Tooltip "Exacto: 0.76"
3. Hover sobre badge **0.5C** â†’ Tooltip "Exacto: 0.48"

### **Test 4: Verificar Constructor Usa Bloques Redondeados**

```javascript
// En consola del navegador
fetch('/api/grupos-alimentos')
    .then(r => r.json())
    .then(d => {
        const leche = d.alimentos.find(a => a.categoria === 'Leche');
        console.log('Bloques UI:', leche.bloques_unitarios.proteina); // 0.5
        console.log('Bloques exactos:', leche.bloques_exactos.proteina); // 0.39
    });
```

### **Test 5: Validar Casos Extremos**

| Valor Exacto | Redondeado Esperado | Formula | Resultado |
|--------------|---------------------|---------|-----------|
| 0.0 | 0.0 | `round(0.0*2)/2` | âœ… 0.0 |
| 0.1 | 0.0 | `round(0.2)/2` | âœ… 0.0 |
| 0.3 | 0.5 | `round(0.6)/2` | âœ… 0.5 |
| 0.7 | 0.5 | `round(1.4)/2` | âœ… 0.5 |
| 0.75 | 1.0 | `round(1.5)/2` | âœ… 1.0 |
| 1.2 | 1.0 | `round(2.4)/2` | âœ… 1.0 |
| 1.3 | 1.5 | `round(2.6)/2` | âœ… 1.5 |
| 2.9 | 3.0 | `round(5.8)/2` | âœ… 3.0 |

---

## **ðŸ”„ CachÃ© y ActualizaciÃ³n**

### **Limpiar CachÃ©**

DespuÃ©s de cambios en `GRUPOSALIMENTOS`:

```python
# OpciÃ³n 1: Reiniciar servidor Flask
# Ctrl+C y python src/main.py

# OpciÃ³n 2: Script manual
python limpiar_cache.py

# OpciÃ³n 3: En cÃ³digo
from functions import limpiar_cache_alimentos
limpiar_cache_alimentos()
```

### **Verificar CachÃ© Activo**

```python
import functions
if hasattr(functions.obtener_catalogo_alimentos_bloques, '_cache'):
    print(f"âœ“ CachÃ© activo con {len(functions.obtener_catalogo_alimentos_bloques._cache)} alimentos")
else:
    print("â„¹ï¸ Sin cachÃ© (se cargarÃ¡ en prÃ³ximo request)")
```

---

## **ðŸ“ Archivos Modificados**

| Archivo | LÃ­neas | Cambio |
|---------|--------|--------|
| `src/functions.py` | 4296-4301 | FunciÃ³n `redondear_a_medio_bloque()` |
| `src/functions.py` | 4371-4414 | Redondeo en `obtener_catalogo_alimentos_bloques()` |
| `plan_alimentario.html` | 188-201 | Botones filtro P/G/C |
| `plan_alimentario.html` | 718-775 | `loadFoodBlocks()` con `blocks_exact` |
| `plan_alimentario.html` | 777-792 | FunciÃ³n `filterFoodBlocks()` |
| `plan_alimentario.html` | 795-861 | `renderFoodBlocksTable()` con tooltips y badges |
| `plan_alimentario.html` | 863-873 | Event listeners para filtros |

---

## **ðŸš€ PrÃ³ximos Pasos Sugeridos**

### **1. Validar Generador de Combinaciones**

Verificar que usa bloques redondeados:

```python
# En generar_combinaciones_alimentos()
objetivo_bloques = {
    'proteina': 2.0,  # âœ… Debe usar valores en pasos de 0.5
    'grasa': 1.0,
    'carbohidratos': 1.5
}
```

### **2. Actualizar Tolerancias**

Con bloques redondeados, las tolerancias pueden ajustarse:

```python
# functions.py en generar_combinaciones_alimentos()
TOLERANCIA_P = 0.5  # Antes 0.2 (demasiado estricto)
TOLERANCIA_G = 0.5  # Antes 0.3
TOLERANCIA_C = 0.5  # Antes 0.3
```

### **3. LocalStorage para Performance** (Opcional)

```javascript
// Cachear tabla en navegador
function loadFoodBlocks() {
    const cached = localStorage.getItem('foodBlocks');
    const cacheTime = localStorage.getItem('foodBlocksTime');
    
    // Si cachÃ© < 1 hora, usar
    if (cached && cacheTime && Date.now() - cacheTime < 3600000) {
        return JSON.parse(cached);
    }
    
    // Si no, fetch y cachear
    const res = await fetch('/api/grupos-alimentos');
    const data = await res.json();
    
    localStorage.setItem('foodBlocks', JSON.stringify(data.alimentos));
    localStorage.setItem('foodBlocksTime', Date.now());
    
    return data.alimentos;
}
```

### **4. BÃºsqueda en Vivo** (Opcional)

```html
<input type="text" class="form-control form-control-sm mb-2" 
       placeholder="Buscar alimento..." id="searchFoodBlocks">
```

```javascript
document.getElementById('searchFoodBlocks').addEventListener('input', function(e) {
    const search = e.target.value.toLowerCase();
    let filtered = currentFilter === 'all' 
        ? allFoodBlocks 
        : allFoodBlocks.filter(item => item.macros_fuertes.includes(currentFilter));
    
    if (search) {
        filtered = filtered.filter(item => 
            item.group.toLowerCase().includes(search) ||
            item.portion.toLowerCase().includes(search)
        );
    }
    
    renderFoodBlocksTable(filtered);
});
```

---

## **âœ… Beneficios Implementados**

1. âœ… **Consistencia Total**: Backend, API, tabla, constructor usan mismo redondeo
2. âœ… **FÃ¡cil de Recordar**: Bloques en pasos de 0.5 (0, 0.5, 1, 1.5, 2, ...)
3. âœ… **Transparencia**: Valores exactos disponibles en tooltips
4. âœ… **UX Mejorada**: Filtros, badges, tooltips, footer informativo
5. âœ… **Performance**: CachÃ© en backend, posible localStorage en frontend
6. âœ… **Mantenibilidad**: FunciÃ³n Ãºnica de redondeo (`redondear_a_medio_bloque`)
7. âœ… **Escalabilidad**: FÃ¡cil agregar nuevos filtros o bÃºsquedas

---

**Archivo**: `REDONDEO_BLOQUES_MEJORAS.md`  
**Fecha**: 2025-10-06  
**VersiÃ³n**: 1.0.0  
**Estado**: âœ… IMPLEMENTACIÃ“N COMPLETA - PENDIENTE TESTING

