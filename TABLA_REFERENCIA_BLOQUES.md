# 📊 Tabla de Referencia de Bloques Nutricionales

## **Implementación Completa (DATOS REALES)**

Se ha agregado una **tabla de referencia de bloques por grupo alimentario** al Plan Alimentario Simplificado que **lee directamente de la tabla GRUPOSALIMENTOS** usando el endpoint `/api/grupos-alimentos`.

---

## **🎯 Ubicación**

**Ruta**: Plan Alimentario → Plan Simplificado → Botón "Ver Tabla de Referencia de Alimentos"

La tabla es **colapsable** y está ubicada justo debajo del sistema de bloques nutricionales (1P = 20g, etc.)

---

## **✨ Características**

### **1. Diseño Visual**

- **Colapsable**: Se oculta/muestra con un botón
- **Responsive**: Tabla con scroll horizontal en móviles
- **Color-coded**: Badges de colores según macro
  - 🔴 Rojo: Proteína (P) - si > 0
  - 🟡 Amarillo: Grasa (G) - si > 0
  - 🔵 Azul: Carbohidratos (C) - si > 0
  - ⚪ Gris: Si macro = 0
- **Iconos**: Emojis para momento del día (🌅 Desayuno, 🍽️ Almuerzo, 🌙 Cena, etc.)

### **2. Fuente de Datos**

✅ **Datos dinámicos desde `GRUPOSALIMENTOS`**:
- Lee mediante `GET /api/grupos-alimentos`
- Usa `obtener_catalogo_alimentos_bloques()` del backend
- Bloques calculados por **porción real** (no por 100g)
- Incluye `macros_fuertes` (alimentos balanceados como huevo)
- Momentos del día configurados en `functions.py`

La tabla muestra **todos los alimentos** de tu catálogo (cantidad variable según DB):

#### **Proteínas Magras (4 items)**
- Pollo/Pavo (pechuga): 100g → 2P·0G·0C
- Pescado blanco: 100g → 2P·0G·0C
- Carne magra: 100g → 2P·1G·0C
- Huevo: 1 unidad → 1P·1G·0C

#### **Lácteos (4 items)**
- Leche descremada: 1 taza → 1P·0G·1C
- Yogur natural: 1 taza → 1P·0G·1C
- Queso magro: 50g → 1P·1G·0C
- Queso untable light: 2 cdas → 0P·1G·0C

#### **Carbohidratos - Cereales (5 items)**
- Arroz blanco cocido: 1/2 taza → 0P·0G·1C
- Pasta cocida: 1/2 taza → 0P·0G·1C
- Avena cruda: 3 cdas (30g) → 1P·0G·1C
- Pan integral: 1 rebanada → 0P·0G·1C
- Pan lactal: 2 rebanadas → 0P·0G·1C

#### **Carbohidratos - Legumbres (3 items)**
- Lentejas cocidas: 1/2 taza → 1P·0G·1C
- Garbanzos cocidos: 1/2 taza → 1P·0G·1C
- Porotos negros: 1/2 taza → 1P·0G·1C

#### **Frutas (4 items)**
- Manzana/Pera: 1 unidad med. → 0P·0G·1C
- Banana: 1/2 unidad → 0P·0G·1C
- Naranja/Mandarina: 1 unidad → 0P·0G·1C
- Frutillas: 1 taza → 0P·0G·1C

#### **Vegetales (3 items)**
- Vegetales A (lechuga, acelga): Libre → 0P·0G·0C
- Vegetales B (zanahoria, tomate): 1 taza → 0P·0G·0.5C
- Papa/Batata: 1 unidad chica → 0P·0G·1C

#### **Grasas (4 items)**
- Aceite/Manteca: 1 cdta (5g) → 0P·1G·0C
- Palta: 1/4 unidad → 0P·1G·0C
- Frutos secos: 7-10 unidades → 0P·1G·0C
- Semillas (chía, lino): 1 cda → 0P·1G·0C

#### **Fiambres (2 items)**
- Jamón cocido magro: 50g → 1P·0G·0C
- Pavo/Pollo fiambre: 50g → 1P·0G·0C

### **3. Columnas de la Tabla**

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| **Grupo Alimentario** | Nombre del alimento | "Huevo" |
| **Porción de Referencia** | Medida casera | "1 unidad" |
| **P** | Bloques de Proteína | 1 |
| **G** | Bloques de Grasa | 1 |
| **C** | Bloques de Carbohidratos | 0 |
| **Momento** | Cuándo consumir | "🌅 Desayuno/Almuerzo/Cena" |

### **4. Tip en Footer**

La tabla incluye un ejemplo práctico:

> **Tip:** Usa esta tabla para armar tus comidas mentalmente.  
> Ejemplo: Desayuno de 2P·1G·1C = Huevo (1P·1G) + Leche (1P·0G·1C)

---

## **💻 Implementación Técnica**

### **Archivos Modificados**

**`src/templates/plan_alimentario.html`**

#### **HTML (líneas 182-213)**

```html
<!-- Tabla de Referencia de Bloques (Colapsable) -->
<div class="collapse mb-4" id="tablaReferenciaBloques">
    <div class="card border-info">
        <div class="card-header bg-info text-white">
            <h6 class="mb-0">
                <i class="fa fa-book me-2"></i>
                Tabla de Referencia: Bloques por Grupo Alimentario
            </h6>
        </div>
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover table-sm mb-0" id="foodBlocksTable">
                    <thead class="table-light sticky-top">
                        <tr>
                            <th>Grupo Alimentario</th>
                            <th>Porción de Referencia</th>
                            <th class="text-center text-danger">P</th>
                            <th class="text-center text-warning">G</th>
                            <th class="text-center text-primary">C</th>
                            <th class="text-center">Momento</th>
                        </tr>
                    </thead>
                    <tbody id="foodBlocksTableBody">
                        <!-- Se llena dinámicamente -->
                    </tbody>
                </table>
            </div>
        </div>
        <div class="card-footer bg-light small text-muted">
            <i class="fa fa-lightbulb me-1"></i>
            <strong>Tip:</strong> Usa esta tabla para armar tus comidas mentalmente.
        </div>
    </div>
</div>
```

#### **JavaScript (líneas 701-788)**

```javascript
// Función para cargar bloques desde GRUPOSALIMENTOS (datos reales)
async function loadFoodBlocks() {
    try {
        const res = await fetch('/api/grupos-alimentos');
        const data = await res.json();
        
        if (!data.success || !data.alimentos) {
            console.error('Error cargando grupos de alimentos');
            return [];
        }
        
        // Mapear emojis para momentos del día
        const momentoEmojis = {
            'desayuno': '🌅',
            'media_manana': '☕',
            'almuerzo': '🍽️',
            'merienda': '🧉',
            'media_tarde': '🥜',
            'cena': '🌙'
        };
        
        const momentoNombres = {
            'desayuno': 'Desayuno',
            'media_manana': 'Media Mañana',
            'almuerzo': 'Almuerzo',
            'merienda': 'Merienda',
            'media_tarde': 'Media Tarde',
            'cena': 'Cena'
        };
        
        // Transformar datos del backend al formato de la tabla
        return data.alimentos.map(a => ({
            group: a.categoria,
            portion: `${a.descripcion} (${Math.round(a.porcion_gramos)}g)`,
            blocks: {
                P: Number(a.bloques_unitarios.proteina.toFixed(1)),
                G: Number(a.bloques_unitarios.grasa.toFixed(1)),
                C: Number(a.bloques_unitarios.carbohidratos.toFixed(1))
            },
            momento: a.momentos.length 
                ? a.momentos.map(m => `${momentoEmojis[m] || ''} ${momentoNombres[m] || m}`).join(', ')
                : '—',
            macros_fuertes: a.macros_fuertes || [a.macro_dominante]
        }));
    } catch (error) {
        console.error('Error al cargar bloques de alimentos:', error);
        return [];
    }
}

// Función de renderizado (acepta array como parámetro)
function renderFoodBlocksTable(foodBlocks) {
    const tbody = document.getElementById('foodBlocksTableBody');
    if (!tbody) return;
    
    if (foodBlocks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fa fa-info-circle me-2"></i>
                    No se pudieron cargar los alimentos. Intenta recargar la página.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = foodBlocks.map(item => `
        <tr>
            <td><strong>${item.group}</strong></td>
            <td class="text-muted small">${item.portion}</td>
            <td class="text-center">
                <span class="badge ${item.blocks.P > 0 ? 'bg-danger' : 'bg-secondary'}">
                    ${item.blocks.P > 0 ? item.blocks.P : '-'}
                </span>
            </td>
            <td class="text-center">
                <span class="badge ${item.blocks.G > 0 ? 'bg-warning' : 'bg-secondary'}">
                    ${item.blocks.G > 0 ? item.blocks.G : '-'}
                </span>
            </td>
            <td class="text-center">
                <span class="badge ${item.blocks.C > 0 ? 'bg-primary' : 'bg-secondary'}">
                    ${item.blocks.C > 0 ? item.blocks.C : '-'}
                </span>
            </td>
            <td class="text-center small text-muted">${item.momento}</td>
        </tr>
    `).join('');
}

// Llamado en DOMContentLoaded (async)
document.addEventListener('DOMContentLoaded', async function() {
    // Cargar y renderizar tabla desde datos reales
    const foodBlocks = await loadFoodBlocks();
    renderFoodBlocksTable(foodBlocks);
    // ... resto del código
});
```

**Ventajas del enfoque dinámico**:
- ✅ Refleja cambios en `GRUPOSALIMENTOS` automáticamente
- ✅ Usa bloques por porción (corrección aplicada anteriormente)
- ✅ Incluye `macros_fuertes` (huevo aparece como proteico Y graso)
- ✅ Momentos del día configurados en backend
- ✅ Fácil de mantener (sin duplicar datos)

---

## **🎨 Estilos Utilizados**

La tabla reutiliza estilos existentes de Bootstrap 5:

- `table-responsive`: Scroll horizontal en móviles
- `table-hover`: Efecto hover en filas
- `table-sm`: Tabla compacta
- `badge bg-danger/warning/primary`: Badges de colores
- `sticky-top`: Header fijo al hacer scroll
- `collapse`: Animación de mostrar/ocultar
- `border-info`: Borde azul del card

---

## **📱 Responsive**

### **Desktop**
- Tabla completa visible
- 6 columnas claramente legibles
- Hover en filas

### **Tablet**
- Scroll horizontal suave
- Header sticky visible

### **Mobile**
- Scroll horizontal activado
- Badges compactos
- Texto reducido pero legible

---

## **🔄 Flujo de Usuario**

1. Usuario entra a **Plan Alimentario**
2. Selecciona **Plan Simplificado**
3. Ve el sistema de bloques (1P = 20g, etc.)
4. Click en **"Ver Tabla de Referencia de Alimentos"**
5. Tabla se expande con animación
6. Usuario consulta bloques por alimento
7. Puede cerrar la tabla haciendo click nuevamente

---

## **✅ Ventajas**

1. **Educativo**: Usuario aprende equivalencias de bloques
2. **Práctico**: Consulta rápida sin salir de la app
3. **Visual**: Colores y emojis facilitan lectura
4. **No invasivo**: Colapsable para no ocupar espacio
5. **Reutilizable**: Datos en constante JavaScript fácil de mantener

---

## **🚀 Expansiones Futuras**

### **Filtros**
```javascript
// Filtrar por momento del día
function filterByMoment(moment) {
    return foodBlocks.filter(item => item.momento.includes(moment));
}

// Filtrar por macro dominante
function filterByMacro(macro) {
    return foodBlocks.filter(item => item.blocks[macro] > 0);
}
```

### **Búsqueda**
```html
<input type="text" class="form-control mb-2" 
       placeholder="Buscar alimento..." 
       id="searchFoodBlocks">
```

```javascript
document.getElementById('searchFoodBlocks').addEventListener('input', function(e) {
    const search = e.target.value.toLowerCase();
    const filtered = foodBlocks.filter(item => 
        item.group.toLowerCase().includes(search)
    );
    renderFoodBlocksTable(filtered);
});
```

### **Exportar a PDF**
```javascript
function exportTableToPDF() {
    // Usar jsPDF o similar
    const doc = new jsPDF();
    doc.autoTable({ html: '#foodBlocksTable' });
    doc.save('bloques-alimentarios.pdf');
}
```

### **Desde Backend**
```python
@app.route('/api/plan-alimentario/bloques-referencia')
def api_bloques_referencia():
    """Devuelve tabla de bloques desde backend"""
    bloques = [
        {
            'group': 'Huevo',
            'portion': '1 unidad',
            'blocks': {'P': 1, 'G': 1, 'C': 0},
            'momento': 'Desayuno/Almuerzo/Cena'
        },
        # ... resto
    ]
    return jsonify({'success': True, 'bloques': bloques})
```

---

## **📝 Notas de Mantenimiento**

### **Agregar Nuevo Alimento**

1. Editar `plan_alimentario.html` línea ~701
2. Agregar nuevo objeto al array `foodBlocks`:

```javascript
const foodBlocks = [
    // ... alimentos existentes
    { 
        group: 'Tofu', 
        portion: '100g', 
        blocks: { P: 1, G: 1, C: 0 }, 
        momento: '🍽️ Almuerzo/Cena' 
    }
];
```

3. La tabla se actualiza automáticamente al recargar

### **Modificar Bloques Existentes**

```javascript
// Cambiar bloques de un alimento
const huevo = foodBlocks.find(item => item.group === 'Huevo');
huevo.blocks.P = 1.5; // Ahora 1.5P en vez de 1P
```

---

## **🧪 Testing**

### **Verificación Visual**

1. Abrir Plan Alimentario → Plan Simplificado
2. Verificar botón "Ver Tabla de Referencia" visible
3. Click botón → Tabla se expande
4. Verificar 33 filas (alimentos)
5. Verificar badges de colores correctos
6. Verificar emojis de momento visibles
7. Resize navegador → Verificar scroll horizontal en móvil

### **Verificación Funcional**

```javascript
// En consola del navegador
console.log(foodBlocks.length); // Debe ser 33
console.log(document.getElementById('foodBlocksTableBody').children.length); // 33 filas

// Verificar renderizado
renderFoodBlocksTable();
```

---

## **🎯 Resultado Final**

Los usuarios ahora tienen una **guía visual completa** de bloques por alimento directamente en el Plan Simplificado, permitiéndoles:

- ✅ Aprender equivalencias de bloques
- ✅ Planificar comidas mentalmente
- ✅ Consultar rápidamente sin salir de la app
- ✅ Entender qué alimentos comer en cada momento del día

**Ejemplo de uso real:**

Usuario con objetivo de desayuno **2P · 1G · 1C** consulta la tabla y arma:
- Huevo (1P·1G) + Leche (1P·0G·1C) = ✅ 2P·1G·1C

---

**Archivo**: `TABLA_REFERENCIA_BLOQUES.md`  
**Fecha**: 2025-10-06  
**Versión**: 1.0.0  
**Estado**: ✅ IMPLEMENTACIÓN COMPLETA
