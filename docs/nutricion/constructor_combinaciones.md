# ðŸ”¨ CONSTRUCTOR DE COMBINACIONES - ImplementaciÃ³n Base

## **Concepto General**

Sistema interactivo que permite al **paciente crear sus propias combinaciones** de alimentos guiado por bloques nutricionales, con validaciÃ³n en tiempo real y opciÃ³n de guardar/compartir con el nutricionista.

---

## **âœ… Backend Implementado**

### **1. API de Grupos Alimentarios**

**Endpoint**: `GET /api/grupos-alimentos`

**Query Params**:
- `macro`: P, G o C (filtra por macros fuertes - incluye alimentos balanceados)
- `momento`: desayuno, almuerzo, cena, etc.

**Nota**: Usa sistema de `macros_fuertes` (â‰¥80% del macro mÃ¡ximo) para incluir alimentos balanceados como el huevo (fuerte en P y G)

**Ejemplo de uso**:
```bash
# Obtener alimentos ricos en proteÃ­na para desayuno
GET /api/grupos-alimentos?macro=P&momento=desayuno

# Respuesta
{
  "success": true,
  "total": 8,
  "alimentos": [
    {
      "categoria": "Huevo",
      "descripcion": "Unidad",
      "porcion_gramos": 50,
      "bloques_unitarios": {
        "proteina": 0.63,
        "grasa": 0.62,
        "carbohidratos": 0.06
      },
      "gramos_100g": {
        "proteina": 12.6,
        "grasa": 12.3,
        "carbohidratos": 1.2
      },
      "macro_dominante": "P",
      "macros_fuertes": ["P", "G"],
      "momentos": ["desayuno", "almuerzo", "cena"]
    },
    ...
  ]
}
```

### **2. API de Guardado de Combinaciones**

**Endpoint**: `POST /api/plan-alimentario/bloques/constructor`

**Body**:
```json
{
  "comida": "desayuno",
  "alimentos": [
    {
      "categoria": "Huevo",
      "descripcion": "Unidad",
      "porciones": 2
    },
    {
      "categoria": "Avena",
      "descripcion": "Media taza",
      "porciones": 1
    }
  ],
  "alias": "Mi Desayuno Proteico",
  "enviar_revision": false
}
```

**Respuesta**:
```json
{
  "success": true,
  "message": "CombinaciÃ³n guardada exitosamente",
  "favorito_id": 42,
  "bloques_total": {
    "proteina": 1.5,
    "grasa": 1.4,
    "carbohidratos": 0.5
  }
}
```

**CaracterÃ­sticas**:
- âœ… Calcula bloques automÃ¡ticamente
- âœ… Guarda en `PLAN_BLOQUES_PRESETS` con `ES_FAVORITA=1`
- âœ… Aparece despuÃ©s en tab "Favoritos"
- âœ… Soporte para `enviar_revision` (pendiente implementar tabla de revisiones)

---

## **ðŸŽ¨ Frontend a Implementar (Modal Constructor)**

### **Estructura HTML**

```html
<!-- Modal Constructor de Combinaciones -->
<div class="modal fade" id="modalConstructor" tabindex="-1">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title">
          <i class="fa fa-tools"></i> Constructor de CombinaciÃ³n
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      
      <div class="modal-body">
        <!-- Selector de comida -->
        <div class="mb-3">
          <label>Comida del dÃ­a</label>
          <select class="form-select" id="constructorComida">
            <option value="desayuno">Desayuno</option>
            <option value="media_manana">Media MaÃ±ana</option>
            <option value="almuerzo">Almuerzo</option>
            <option value="merienda">Merienda</option>
            <option value="cena">Cena</option>
          </select>
        </div>
        
        <!-- Panel de objetivo -->
        <div class="card mb-3 bg-light">
          <div class="card-body">
            <h6>Objetivo de la comida</h6>
            <div class="d-flex justify-content-around">
              <div>
                <strong id="objProteina">2.0</strong>P
                <small class="text-muted">(40g)</small>
              </div>
              <div>
                <strong id="objGrasa">1.0</strong>G
                <small class="text-muted">(10g)</small>
              </div>
              <div>
                <strong id="objCarbohidratos">2.0</strong>C
                <small class="text-muted">(50g)</small>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Panel de bloques acumulados (RECALCULA EN TIEMPO REAL) -->
        <div class="card mb-3" id="panelAcumulado">
          <div class="card-body">
            <h6>Bloques Acumulados</h6>
            <div class="d-flex justify-content-around">
              <div>
                <strong id="acumProteina">0.0</strong>P
                <div class="text-success" id="difProteina">Falta: 2.0P</div>
              </div>
              <div>
                <strong id="acumGrasa">0.0</strong>G
                <div class="text-success" id="difGrasa">Falta: 1.0G</div>
              </div>
              <div>
                <strong id="acumCarbohidratos">0.0</strong>C
                <div class="text-success" id="difCarbohidratos">Falta: 2.0C</div>
              </div>
            </div>
            
            <!-- BotÃ³n de sugerencia inteligente -->
            <div class="text-center mt-3">
              <button class="btn btn-sm btn-info" onclick="completarConCarbohidratos()">
                <i class="fa fa-magic"></i> Completar con Carbohidratos
              </button>
            </div>
          </div>
        </div>
        
        <!-- Selector de alimentos -->
        <div class="mb-3">
          <label>Agregar alimento</label>
          <div class="input-group">
            <select class="form-select" id="filtroMacro">
              <option value="">Todos</option>
              <option value="P">Rico en ProteÃ­na</option>
              <option value="G">Rico en Grasa</option>
              <option value="C">Rico en Carbohidratos</option>
            </select>
            <select class="form-select" id="selectAlimento">
              <option value="">Seleccionar alimento...</option>
            </select>
            <input type="number" class="form-control" style="max-width: 100px" 
                   id="porciones" min="1" max="5" value="1" placeholder="Porciones">
            <button class="btn btn-primary" onclick="agregarAlimentoConstructor()">
              <i class="fa fa-plus"></i>
            </button>
          </div>
        </div>
        
        <!-- Lista de alimentos agregados -->
        <div class="card mb-3">
          <div class="card-header">
            <strong>Alimentos en tu combinaciÃ³n</strong>
          </div>
          <div class="list-group list-group-flush" id="listaAlimentosConstructor">
            <!-- Se puebla dinÃ¡micamente -->
            <div class="list-group-item text-muted text-center">
              AÃºn no has agregado alimentos
            </div>
          </div>
        </div>
        
        <!-- Nombre de la combinaciÃ³n -->
        <div class="mb-3">
          <label>Nombre de tu combinaciÃ³n</label>
          <input type="text" class="form-control" id="aliasConstructor" 
                 placeholder="Ej: Mi Desayuno Proteico">
        </div>
        
        <!-- Opciones de guardado -->
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="enviarRevision">
          <label class="form-check-label" for="enviarRevision">
            <i class="fa fa-paper-plane"></i> Enviar a nutricionista para revisiÃ³n
          </label>
        </div>
      </div>
      
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Cancelar
        </button>
        <button type="button" class="btn btn-success" onclick="guardarCombinacionConstructor()">
          <i class="fa fa-save"></i> Guardar CombinaciÃ³n
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## **ðŸ“œ JavaScript del Constructor**

```javascript
let alimentosConstructor = []; // [{categoria, descripcion, porciones, bloques}, ...]
let objetivoComida = {proteina: 2.0, grasa: 1.0, carbohidratos: 2.0};

// Al cambiar la comida, cargar objetivo desde el plan
$('#constructorComida').change(function() {
    const comida = $(this).val();
    cargarObjetivoComida(comida);
});

// Cargar objetivo de la comida
function cargarObjetivoComida(comida) {
    fetch('/api/plan-alimentario/info')
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                const comidaData = data.comidas[comida];
                if (comidaData) {
                    objetivoComida = {
                        proteina: comidaData.bloques.proteina,
                        grasa: comidaData.bloques.grasa,
                        carbohidratos: comidaData.bloques.carbohidratos
                    };
                    
                    $('#objProteina').text(objetivoComida.proteina.toFixed(1));
                    $('#objGrasa').text(objetivoComida.grasa.toFixed(1));
                    $('#objCarbohidratos').text(objetivoComida.carbohidratos.toFixed(1));
                    
                    recalcularAcumulado();
                }
            }
        });
}

// Al cambiar filtro, cargar alimentos
$('#filtroMacro').change(function() {
    const macro = $(this).val();
    const momento = $('#constructorComida').val();
    cargarAlimentosDisponibles(macro, momento);
});

// Cargar alimentos disponibles
function cargarAlimentosDisponibles(macro, momento) {
    let url = '/api/grupos-alimentos?';
    if (macro) url += `macro=${macro}&`;
    if (momento) url += `momento=${momento}`;
    
    fetch(url)
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                const select = $('#selectAlimento');
                select.empty();
                select.append('<option value="">Seleccionar alimento...</option>');
                
                data.alimentos.forEach(a => {
                    const bloques = `${a.bloques_unitarios.proteina.toFixed(1)}PÂ·${a.bloques_unitarios.grasa.toFixed(1)}GÂ·${a.bloques_unitarios.carbohidratos.toFixed(1)}C`;
                    select.append(
                        `<option value='${JSON.stringify(a)}'>${a.categoria} (${a.descripcion}) - ${bloques}</option>`
                    );
                });
            }
        });
}

// Agregar alimento a la combinaciÃ³n
function agregarAlimentoConstructor() {
    const alimentoJSON = $('#selectAlimento').val();
    if (!alimentoJSON) return;
    
    const alimento = JSON.parse(alimentoJSON);
    const porciones = parseInt($('#porciones').val()) || 1;
    
    // Agregar a lista
    alimentosConstructor.push({
        categoria: alimento.categoria,
        descripcion: alimento.descripcion,
        porciones: porciones,
        bloques: {
            proteina: alimento.bloques_unitarios.proteina * porciones,
            grasa: alimento.bloques_unitarios.grasa * porciones,
            carbohidratos: alimento.bloques_unitarios.carbohidratos * porciones
        },
        porcion_gramos: alimento.porcion_gramos
    });
    
    renderizarListaAlimentos();
    recalcularAcumulado(); // âœ… RECALCULO EN TIEMPO REAL
}

// Renderizar lista de alimentos
function renderizarListaAlimentos() {
    const lista = $('#listaAlimentosConstructor');
    lista.empty();
    
    if (alimentosConstructor.length === 0) {
        lista.append('<div class="list-group-item text-muted text-center">AÃºn no has agregado alimentos</div>');
        return;
    }
    
    alimentosConstructor.forEach((a, index) => {
        lista.append(`
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${a.categoria}</strong> (${a.descripcion})
                    ${a.porciones > 1 ? ` Ã— ${a.porciones}` : ''}
                    <br>
                    <small class="text-muted">
                        ${a.bloques.proteina.toFixed(1)}P Â· 
                        ${a.bloques.grasa.toFixed(1)}G Â· 
                        ${a.bloques.carbohidratos.toFixed(1)}C
                    </small>
                </div>
                <button class="btn btn-sm btn-danger" onclick="eliminarAlimentoConstructor(${index})">
                    <i class="fa fa-times"></i>
                </button>
            </div>
        `);
    });
}

// Eliminar alimento
function eliminarAlimentoConstructor(index) {
    alimentosConstructor.splice(index, 1);
    renderizarListaAlimentos();
    recalcularAcumulado();
}

// âœ… RECALCULAR ACUMULADO Y MOSTRAR FALTA/SOBRA
function recalcularAcumulado() {
    let totalP = 0, totalG = 0, totalC = 0;
    
    alimentosConstructor.forEach(a => {
        totalP += a.bloques.proteina;
        totalG += a.bloques.grasa;
        totalC += a.bloques.carbohidratos;
    });
    
    // Actualizar acumulado
    $('#acumProteina').text(totalP.toFixed(1));
    $('#acumGrasa').text(totalG.toFixed(1));
    $('#acumCarbohidratos').text(totalC.toFixed(1));
    
    // Calcular diferencias
    const diffP = objetivoComida.proteina - totalP;
    const diffG = objetivoComida.grasa - totalG;
    const diffC = objetivoComida.carbohidratos - totalC;
    
    // Mostrar falta/sobra con color
    mostrarDiferencia('#difProteina', diffP, 'P');
    mostrarDiferencia('#difGrasa', diffG, 'G');
    mostrarDiferencia('#difCarbohidratos', diffC, 'C');
    
    // Cambiar color del panel si estÃ¡ dentro del margen
    const margen = 0.3; // Â±0.3 bloques
    const dentroDe Margen = Math.abs(diffP) <= margen && 
                            Math.abs(diffG) <= margen && 
                            Math.abs(diffC) <= margen;
    
    if (dentroDeMargen) {
        $('#panelAcumulado').addClass('border-success').removeClass('border-warning border-danger');
    } else if (Math.abs(diffP) > 1 || Math.abs(diffG) > 1 || Math.abs(diffC) > 1) {
        $('#panelAcumulado').addClass('border-danger').removeClass('border-success border-warning');
    } else {
        $('#panelAcumulado').addClass('border-warning').removeClass('border-success border-danger');
    }
}

function mostrarDiferencia(selector, diff, macro) {
    const elem = $(selector);
    if (Math.abs(diff) < 0.1) {
        elem.html('<i class="fa fa-check text-success"></i> Exacto').removeClass('text-danger text-warning').addClass('text-success');
    } else if (diff > 0) {
        elem.html(`Falta: ${diff.toFixed(1)}${macro}`).removeClass('text-danger text-success').addClass('text-warning');
    } else {
        elem.html(`Sobra: ${Math.abs(diff).toFixed(1)}${macro}`).removeClass('text-warning text-success').addClass('text-danger');
    }
}

// âœ… COMPLETAR CON CARBOHIDRATOS (Sugerencia inversa)
function completarConCarbohidratos() {
    const diffC = objetivoComida.carbohidratos - alimentosConstructor.reduce((sum, a) => sum + a.bloques.carbohidratos, 0);
    
    if (diffC <= 0) {
        alert('Ya tienes suficientes carbohidratos');
        return;
    }
    
    // Obtener alimentos ricos en C que NO estÃ©n en la combinaciÃ³n
    const categoriasYaUsadas = alimentosConstructor.map(a => a.categoria);
    const momento = $('#constructorComida').val();
    
    fetch(`/api/grupos-alimentos?macro=C&momento=${momento}`)
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                // Filtrar los que NO estÃ¡n ya en la combinaciÃ³n
                const disponibles = data.alimentos.filter(a => !categoriasYaUsadas.includes(a.categoria));
                
                // Buscar el que mÃ¡s se acerque
                let mejorAlimento = null;
                let menorError = 999;
                let mejorPorciones = 1;
                
                disponibles.forEach(alimento => {
                    for (let porciones = 1; porciones <= 4; porciones++) {
                        const bloquesC = alimento.bloques_unitarios.carbohidratos * porciones;
                        const error = Math.abs(diffC - bloquesC);
                        
                        if (error < menorError) {
                            menorError = error;
                            mejorAlimento = alimento;
                            mejorPorciones = porciones;
                        }
                    }
                });
                
                if (mejorAlimento) {
                    // Agregar automÃ¡ticamente
                    alimentosConstructor.push({
                        categoria: mejorAlimento.categoria,
                        descripcion: mejorAlimento.descripcion,
                        porciones: mejorPorciones,
                        bloques: {
                            proteina: mejorAlimento.bloques_unitarios.proteina * mejorPorciones,
                            grasa: mejorAlimento.bloques_unitarios.grasa * mejorPorciones,
                            carbohidratos: mejorAlimento.bloques_unitarios.carbohidratos * mejorPorciones
                        },
                        porcion_gramos: mejorAlimento.porcion_gramos
                    });
                    
                    renderizarListaAlimentos();
                    recalcularAcumulado();
                    
                    alert(`âœ“ Agregado: ${mejorAlimento.categoria} Ã— ${mejorPorciones}`);
                }
            }
        });
}

// Guardar combinaciÃ³n
function guardarCombinacionConstructor() {
    const alias = $('#aliasConstructor').val().trim();
    if (!alias) {
        alert('Por favor ingresa un nombre para tu combinaciÃ³n');
        return;
    }
    
    if (alimentosConstructor.length === 0) {
        alert('Agrega al menos un alimento');
        return;
    }
    
    const datos = {
        comida: $('#constructorComida').val(),
        alimentos: alimentosConstructor.map(a => ({
            categoria: a.categoria,
            descripcion: a.descripcion,
            porciones: a.porciones
        })),
        alias: alias,
        enviar_revision: $('#enviarRevision').is(':checked')
    };
    
    fetch('/api/plan-alimentario/bloques/constructor', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(datos)
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            alert(`âœ“ ${data.message}\nBloques totales: ${data.bloques_total.proteina}P Â· ${data.bloques_total.grasa}G Â· ${data.bloques_total.carbohidratos}C`);
            $('#modalConstructor').modal('hide');
            cargarSugerencias(); // Recargar favoritos
        } else {
            alert('Error: ' + data.error);
        }
    });
}
```

---

## **ðŸŽ¨ IntegraciÃ³n en UI Existente**

**Agregar botÃ³n en plan_alimentario.html**:

```html
<!-- En la secciÃ³n de sugerencias de bloques -->
<div class="card-header d-flex justify-content-between align-items-center">
    <h5>Sugerencias de Bloques</h5>
    <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#modalConstructor">
        <i class="fa fa-tools"></i> Constructor
    </button>
</div>
```

---

## **ðŸ“Š Flujo Completo del Usuario**

1. **Abrir Constructor**
   - Click en botÃ³n "Constructor"
   - Modal se abre con objetivo de la comida cargado

2. **Seleccionar Comida**
   - Elegir desayuno/almuerzo/cena
   - Sistema carga objetivo automÃ¡ticamente desde plan

3. **Agregar Alimentos**
   - Filtrar por macro (P/G/C) opcional
   - Seleccionar alimento
   - Elegir porciones (1-5)
   - Click "+"
   
4. **Ver RecÃ¡lculo en Tiempo Real**
   - Panel muestra bloques acumulados
   - Indica "Falta X" o "Sobra X" por macro
   - Cambia color: verde (dentro margen), amarillo (cerca), rojo (lejos)

5. **Sugerencia Inteligente** (Opcional)
   - Click "Completar con Carbohidratos"
   - Sistema busca alimento rico en C que NO estÃ© ya
   - Lo agrega automÃ¡ticamente con porciones Ã³ptimas

6. **Guardar CombinaciÃ³n**
   - Ingresar nombre (ej: "Mi Desayuno Proteico")
   - Check "Enviar a nutricionista" (opcional)
   - Click "Guardar"
   - Aparece en tab "Favoritos" âœ“

---

## **ðŸ”® Mejoras Futuras**

### **1. Biblioteca Personal ("Mis Combinaciones")**
```sql
-- Agregar columna para diferenciar
ALTER TABLE PLAN_BLOQUES_PRESETS ADD COLUMN ES_CONSTRUCTOR INTEGER DEFAULT 0;

-- En tab Favoritos, filtrar:
WHERE ES_CONSTRUCTOR = 1 AND USER_DNI = ?
```

### **2. Sistema de RevisiÃ³n por Nutricionista**
```sql
CREATE TABLE PLAN_BLOQUES_REVISIONES (
    ID INTEGER PRIMARY KEY,
    USER_DNI TEXT,
    FAVORITO_ID INTEGER,
    ESTADO TEXT CHECK(ESTADO IN ('pendiente', 'aprobada', 'rechazada', 'modificada')),
    COMENTARIO_PROFESIONAL TEXT,
    FECHA_ENVIO DATETIME DEFAULT CURRENT_TIMESTAMP,
    FECHA_REVISION DATETIME,
    PROFESIONAL_DNI TEXT,
    FOREIGN KEY(FAVORITO_ID) REFERENCES PLAN_BLOQUES_PRESETS(ID)
);
```

**Dashboard Nutricionista**:
```html
<!-- En dashboard.html -->
<div class="card">
    <div class="card-header">
        <i class="fa fa-clipboard-check"></i> Combinaciones Pendientes de RevisiÃ³n
        <span class="badge bg-warning">3</span>
    </div>
    <div class="card-body">
        <!-- Lista de combinaciones enviadas por pacientes -->
    </div>
</div>
```

### **3. AnÃ¡lisis Nutricional Ampliado**
- Mostrar calorÃ­as totales
- Calcular densidad nutricional
- Score de variedad (penalty si repite misma categorÃ­a)
- Sugerencias de micronutrientes faltantes

### **4. Compartir Combinaciones**
- Entre pacientes (comunidad)
- Exportar PDF con receta visual
- QR code para compartir

---

## **âœ… Estado Actual**

| Componente | Estado |
|------------|--------|
| API `/api/grupos-alimentos` | âœ… FUNCIONAL |
| API `/api/.../constructor` POST | âœ… FUNCIONAL |
| CÃ¡lculo de bloques backend | âœ… FUNCIONAL |
| Guardado en DB | âœ… FUNCIONAL |
| Modal HTML | ðŸŸ¡ DISEÃ‘O LISTO (no implementado) |
| JavaScript constructor | ðŸŸ¡ CÃ“DIGO LISTO (no implementado) |
| IntegraciÃ³n UI | ðŸŸ¡ PENDIENTE |
| Sistema de revisiones | ðŸ”´ PENDIENTE |

---

**ðŸŽ‰ El backend del Constructor estÃ¡ listo. Solo falta implementar el modal JavaScript en el frontend para que los pacientes puedan crear sus combinaciones interactivamente con recÃ¡lculo en tiempo real.**

---

**Archivo**: `CONSTRUCTOR_COMBINACIONES.md`  
**Fecha**: 2025-10-04  
**VersiÃ³n**: 1.0.0

