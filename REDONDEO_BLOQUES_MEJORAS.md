# 🔧 Redondeo de Bloques a 0.5 + Mejoras UX

## **Implementación Completa**

Se implementó un sistema de **redondeo unificado a pasos de 0.5** en bloques nutricionales, asegurando consistencia entre tabla de referencia, constructor y generador de combinaciones.

---

## **🎯 Problema Resuelto**

### **Antes**
- Bloques con decimales arbitrarios: `0.39P`, `0.76G`, `1.06C`
- Difícil de recordar y calcular mentalmente
- Inconsistencia entre UI y cálculos internos
- Constructor usaba valores diferentes a la tabla

### **Ahora**
- Bloques en pasos de 0.5: `0.5P`, `0.5G`, `1.0C`
- Fácil de memorizar y calcular
- ✅ **Consistencia total**: Backend → API → Tabla → Constructor
- Valores exactos disponibles para usuarios avanzados

---

## **📊 Función de Redondeo**

**Ubicación**: `src/functions.py:4296-4301`

```python
def redondear_a_medio_bloque(valor):
    """
    Redondea bloques a pasos de 0.5 para UI consistente.
    Ejemplos: 0.3 → 0.5, 0.7 → 0.5, 1.2 → 1.0, 1.8 → 2.0
    """
    return round(valor * 2) / 2
```

### **Lógica**
```python
round(0.39 * 2) / 2  # 0.78 → round → 1 → 1/2 = 0.5 ✅
round(0.76 * 2) / 2  # 1.52 → round → 2 → 2/2 = 1.0 ✅
round(1.06 * 2) / 2  # 2.12 → round → 2 → 2/2 = 1.0 ✅
round(1.66 * 2) / 2  # 3.32 → round → 3 → 3/2 = 1.5 ✅
```

---

## **🔄 Integración en Backend**

**Ubicación**: `src/functions.py:4371-4414`

### **Cálculo Actualizado**

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
        'proteina': 0.5,  # ✅ Redondeado a 0.5 (UI, tabla, constructor)
        'grasa': 1.0,
        'carbohidratos': 0.5
    },
    'bloques_exactos': {  # ⚙️ Valores exactos (cálculos internos, tooltips)
        'proteina': 0.39,
        'grasa': 0.76,
        'carbohidratos': 0.48
    }
}
```

---

## **✨ Mejoras UX Implementadas**

### **1. Filtros por Macro** 🎛️

**Ubicación**: `plan_alimentario.html:188-201`

Botones en header de tabla:
- **Todos**: Muestra catálogo completo
- **P** (🥩): Solo alimentos proteicos
- **G** (🧀): Solo alimentos grasos
- **C** (🍞): Solo alimentos con carbohidratos

**Implementación**:
```javascript
function filterFoodBlocks(filter) {
    let filtered = allFoodBlocks;
    if (filter !== 'all') {
        filtered = allFoodBlocks.filter(item => item.macros_fuertes.includes(filter));
    }
    renderFoodBlocksTable(filtered);
}
```

### **2. Badges de Macro Dominante** 🏷️

Cada alimento muestra un badge de color:
- **Huevo** → Badge rojo "P" (proteico)
- **Aceite** → Badge amarillo "G" (graso)
- **Arroz** → Badge azul "C" (carbohidrato)

**Implementación**:
```javascript
const macroBadge = {
    'P': '<span class="badge bg-danger badge-sm ms-2">P</span>',
    'G': '<span class="badge bg-warning badge-sm ms-2">G</span>',
    'C': '<span class="badge bg-primary badge-sm ms-2">C</span>'
}[item.macro_dominante] || '';
```

### **3. Tooltips con Valores Exactos** 💡

Hover sobre badges muestra valor exacto:
- Redondeado: **0.5P** → Tooltip: "Exacto: 0.39"
- Redondeado: **1.0G** → Tooltip: "Exacto: 0.76"

**Implementación**:
```javascript
const tooltipP = item.blocks_exact 
    ? `title="Exacto: ${item.blocks_exact.P.toFixed(2)}" data-bs-toggle="tooltip"` 
    : '';
```

### **4. Footer Informativo** 📝

Explica el sistema de redondeo:
> **Tip:** Usa esta tabla para armar tus comidas mentalmente.  
> Ejemplo: Desayuno de 2P·1G·1C = Huevo (0.5P·0.5G) × 2 + Leche (0.5P·0.5C)  
> ℹ️ Bloques redondeados a pasos de 0.5

---

## **🔗 Sincronización Completa**

### **Flujo de Datos**

```
GRUPOSALIMENTOS (DB)
  ↓ (SELECT con macros por 100g)
obtener_catalogo_alimentos_bloques()
  ↓ (ajusta a porción real)
Bloques exactos: 0.39P · 0.76G · 0.48C
  ↓ (redondear_a_medio_bloque)
Bloques redondeados: 0.5P · 1.0G · 0.5C
  ↓ (cachea resultado)
GET /api/grupos-alimentos
  ↓ (JSON response)
Frontend: loadFoodBlocks()
  ↓ (renderiza)
Tabla de Referencia + Constructor + Generador
```

### **Consumidores Sincronizados**

| Componente | Usa Bloques Redondeados | Ubicación |
|------------|------------------------|-----------|
| **Tabla de Referencia** | ✅ Sí (pasos de 0.5) | `plan_alimentario.html:795` |
| **Constructor de Combos** | ✅ Sí (desde API) | `plan_alimentario.html:2023` |
| **Generador Sugerencias** | ✅ Sí (desde catálogo) | `main.py:4315` |
| **Cálculos Backend** | ⚙️ Puede usar exactos | `functions.py:4410-4414` |

---

## **📊 Ejemplos Reales**

### **Leche Descremada (246g)**

| Componente | Antes | Ahora |
|------------|-------|-------|
| **Proteína exacta** | 7.87g | 7.87g |
| **Bloques exactos** | 0.39P | 0.39P |
| **Bloques UI** | 0.4P | **0.5P** ✅ |
| **Tooltip** | - | "Exacto: 0.39" |

### **Huevo (50g)**

| Componente | Antes | Ahora |
|------------|-------|-------|
| **Proteína exacta** | 6.3g | 6.3g |
| **Bloques exactos** | 0.32P | 0.32P |
| **Bloques UI** | 0.3P | **0.5P** ✅ |
| **Badge dominante** | - | 🔴 P |
| **Macros fuertes** | P | **P, G** ✅ |

### **Arroz Cocido (100g)**

| Componente | Antes | Ahora |
|------------|-------|-------|
| **Carbohidratos exactos** | 28.2g | 28.2g |
| **Bloques exactos** | 1.13C | 1.13C |
| **Bloques UI** | 1.1C | **1.0C** ✅ |
| **Badge dominante** | - | 🔵 C |

---

## **🧪 Testing Recomendado**

### **Test 1: Verificar Redondeo en API**

```bash
curl -s "http://localhost:8000/api/grupos-alimentos" | jq '.alimentos[0].bloques_unitarios'

# Esperado:
{
  "proteina": 0.5,      # ✅ Redondeado
  "grasa": 1.0,
  "carbohidratos": 0.5
}

curl -s "http://localhost:8000/api/grupos-alimentos" | jq '.alimentos[0].bloques_exactos'

# Esperado:
{
  "proteina": 0.39,     # ✅ Valor exacto disponible
  "grasa": 0.76,
  "carbohidratos": 0.48
}
```

### **Test 2: Verificar Filtros en Tabla**

1. Abrir Plan Alimentario → Plan Simplificado
2. Click "Ver Tabla de Referencia"
3. Click filtro **"P"** → Solo alimentos proteicos
4. Click filtro **"G"** → Solo alimentos grasos
5. Click filtro **"C"** → Solo carbohidratos
6. Click **"Todos"** → Catálogo completo

### **Test 3: Verificar Tooltips**

1. Hover sobre badge **0.5P** → Tooltip "Exacto: 0.39"
2. Hover sobre badge **1.0G** → Tooltip "Exacto: 0.76"
3. Hover sobre badge **0.5C** → Tooltip "Exacto: 0.48"

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
| 0.0 | 0.0 | `round(0.0*2)/2` | ✅ 0.0 |
| 0.1 | 0.0 | `round(0.2)/2` | ✅ 0.0 |
| 0.3 | 0.5 | `round(0.6)/2` | ✅ 0.5 |
| 0.7 | 0.5 | `round(1.4)/2` | ✅ 0.5 |
| 0.75 | 1.0 | `round(1.5)/2` | ✅ 1.0 |
| 1.2 | 1.0 | `round(2.4)/2` | ✅ 1.0 |
| 1.3 | 1.5 | `round(2.6)/2` | ✅ 1.5 |
| 2.9 | 3.0 | `round(5.8)/2` | ✅ 3.0 |

---

## **🔄 Caché y Actualización**

### **Limpiar Caché**

Después de cambios en `GRUPOSALIMENTOS`:

```python
# Opción 1: Reiniciar servidor Flask
# Ctrl+C y python src/main.py

# Opción 2: Script manual
python limpiar_cache.py

# Opción 3: En código
from functions import limpiar_cache_alimentos
limpiar_cache_alimentos()
```

### **Verificar Caché Activo**

```python
import functions
if hasattr(functions.obtener_catalogo_alimentos_bloques, '_cache'):
    print(f"✓ Caché activo con {len(functions.obtener_catalogo_alimentos_bloques._cache)} alimentos")
else:
    print("ℹ️ Sin caché (se cargará en próximo request)")
```

---

## **📁 Archivos Modificados**

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `src/functions.py` | 4296-4301 | Función `redondear_a_medio_bloque()` |
| `src/functions.py` | 4371-4414 | Redondeo en `obtener_catalogo_alimentos_bloques()` |
| `plan_alimentario.html` | 188-201 | Botones filtro P/G/C |
| `plan_alimentario.html` | 718-775 | `loadFoodBlocks()` con `blocks_exact` |
| `plan_alimentario.html` | 777-792 | Función `filterFoodBlocks()` |
| `plan_alimentario.html` | 795-861 | `renderFoodBlocksTable()` con tooltips y badges |
| `plan_alimentario.html` | 863-873 | Event listeners para filtros |

---

## **🚀 Próximos Pasos Sugeridos**

### **1. Validar Generador de Combinaciones**

Verificar que usa bloques redondeados:

```python
# En generar_combinaciones_alimentos()
objetivo_bloques = {
    'proteina': 2.0,  # ✅ Debe usar valores en pasos de 0.5
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
    
    // Si caché < 1 hora, usar
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

### **4. Búsqueda en Vivo** (Opcional)

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

## **✅ Beneficios Implementados**

1. ✅ **Consistencia Total**: Backend, API, tabla, constructor usan mismo redondeo
2. ✅ **Fácil de Recordar**: Bloques en pasos de 0.5 (0, 0.5, 1, 1.5, 2, ...)
3. ✅ **Transparencia**: Valores exactos disponibles en tooltips
4. ✅ **UX Mejorada**: Filtros, badges, tooltips, footer informativo
5. ✅ **Performance**: Caché en backend, posible localStorage en frontend
6. ✅ **Mantenibilidad**: Función única de redondeo (`redondear_a_medio_bloque`)
7. ✅ **Escalabilidad**: Fácil agregar nuevos filtros o búsquedas

---

**Archivo**: `REDONDEO_BLOQUES_MEJORAS.md`  
**Fecha**: 2025-10-06  
**Versión**: 1.0.0  
**Estado**: ✅ IMPLEMENTACIÓN COMPLETA - PENDIENTE TESTING
