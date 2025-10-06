# 🧪 PLAN DE TESTING - Constructor de Combinaciones

## **✅ IMPLEMENTACIÓN COMPLETADA**

### **Frontend Completo**
- ✅ Modal con todos los componentes visuales
- ✅ Sistema de recálculo en tiempo real
- ✅ Integración con APIs backend
- ✅ Sugerencias inteligentes ("Completar con...")
- ✅ Guardado como favorito
- ✅ Validación de datos

### **Backend Completo**
- ✅ API `/api/grupos-alimentos` con filtros
- ✅ API `/api/plan-alimentario/bloques/constructor` POST
- ✅ Sistema de macros_fuertes (alimentos balanceados)
- ✅ Guardado en `PLAN_BLOQUES_PRESETS`

---

## **🔍 CASOS DE PRUEBA**

### **Test 1: Flujo Básico del Constructor**

**Objetivo**: Verificar que el constructor funciona de principio a fin

**Pasos**:
1. Ir a Plan Alimentario → Plan Simplificado
2. Click en botón "Constructor" (esquina superior derecha del carrusel)
3. Seleccionar "Desayuno" en el selector de comida
4. **Verificar**: Panel de objetivo muestra los bloques del desayuno (ej: 2.0P · 1.5G · 1.0C)
5. Seleccionar "Huevo (Unidad)" del selector de alimentos
6. Cambiar porciones a "2"
7. Click "Agregar"
8. **Verificar**: 
   - Huevo aparece en lista "Alimentos en tu combinación"
   - Panel acumulado muestra ~1.3P · 1.2G · 0.1C
   - Diferencias indican "Falta: 0.7P", "Falta: 0.3G", "Falta: 0.9C"
9. Agregar "Avena (Media taza)" × 1 porción
10. **Verificar**: Bloques acumulados se actualizan en tiempo real
11. Ingresar nombre: "Mi Desayuno Proteico"
12. Click "Guardar Combinación"
13. **Verificar**: 
    - Mensaje de éxito con bloques totales
    - Modal se cierra
    - Nueva combinación aparece en tab "Favoritos"

**Resultado Esperado**: ✅ Combinación guardada y visible en favoritos

---

### **Test 2: Filtrado por Macro**

**Objetivo**: Verificar que el filtro de macros funciona correctamente

**Pasos**:
1. Abrir constructor, seleccionar "Almuerzo"
2. Cambiar filtro a "Rico en Proteína"
3. **Verificar**: Selector muestra solo alimentos con P fuerte (Vaca, Pollo, Pescado, Milanesa, Huevo)
4. Cambiar filtro a "Rico en Carbohidratos"
5. **Verificar**: Selector muestra solo alimentos con C fuerte (Arroz, Fideo, Avena, Frutas)
6. Cambiar filtro a "Rico en Grasa"
7. **Verificar**: Selector muestra alimentos con G fuerte (Queso, Frutos Secos, Aceite, **Huevo**)

**Resultado Esperado**: ✅ Huevo aparece en filtros de P y G (macros_fuertes funcionando)

---

### **Test 3: Sugerencia Inteligente "Completar con Carbohidratos"**

**Objetivo**: Verificar que la función de completar automáticamente funciona

**Pasos**:
1. Abrir constructor, seleccionar "Desayuno"
2. Agregar "Huevo" × 2
3. **Verificar**: Aparece botón "Completar con Carbohidratos" (porque falta C)
4. Click en botón "Completar con Carbohidratos"
5. **Verificar**:
   - Sistema agrega automáticamente un alimento rico en C apropiado (ej: Avena, Frutas)
   - Bloques acumulados se aproximan al objetivo
   - Mensaje indica qué se agregó
6. Guardar combinación

**Resultado Esperado**: ✅ Sistema completa inteligentemente con carbohidratos

---

### **Test 4: Validación de Libertad (5% vs 15%)**

**Escenario A: Libertad 5% (estricta)**

**Usuario de prueba**: Vega, Luana (o cualquiera con libertad 5%)

**Pasos**:
1. Crear combinación en constructor: Huevo × 2 + Avena × 1
2. Guardar como "Desayuno Test 5%"
3. Ir a tab "Favoritos"
4. Click "Aplicar" en la combinación
5. **Verificar**: 
   - Si bloques están dentro de ±0.25 → Se aplica ✅
   - Si bloques exceden ±0.25 → Muestra error con diferencia exacta

**Escenario B: Libertad 15% (flexible)**

**Usuario de prueba**: Otro paciente con libertad 15%

**Pasos**:
1. Misma combinación
2. **Verificar**: Se aplica sin problemas (mayor tolerancia)

**Resultado Esperado**: 
- ✅ Libertad 5%: Solo combinaciones muy precisas
- ✅ Libertad 15%: Acepta más variaciones

---

### **Test 5: Momento del Día (Filtrado Contextual)**

**Objetivo**: Verificar que solo se muestran alimentos apropiados para cada comida

**Pasos**:
1. Abrir constructor, seleccionar "Desayuno"
2. **Verificar**: Selector incluye:
   - ✅ Huevo, Avena, Leche, Yogur, Frutas
   - ❌ NO incluye: Vaca, Arroz, Fideo, Milanesa
3. Cambiar a "Almuerzo"
4. **Verificar**: Selector incluye:
   - ✅ Vaca, Pollo, Pescado, Arroz, Fideo, Vegetales
   - ❌ NO incluye: Avena, Panes (típicos de desayuno)

**Resultado Esperado**: ✅ Filtrado por momento funciona (no sugiere milanesa para desayuno)

---

### **Test 6: Colores del Panel Acumulado**

**Objetivo**: Verificar feedback visual de precisión

**Configuración**:
- Verde: Error ≤ 0.3 bloques en todos los macros
- Amarillo: Error entre 0.3 y 1.0 bloques
- Rojo: Error > 1.0 bloques en algún macro

**Pasos**:
1. Objetivo desayuno: 2.0P · 1.0G · 2.0C
2. Agregar Huevo × 2: Acumulado ~1.3P · 1.2G · 0.1C
   - **Verificar**: Panel ROJO (falta mucho carbohidrato)
3. Agregar Avena × 2: Acumulado ~1.5P · 1.4G · 1.9C
   - **Verificar**: Panel AMARILLO (cerca pero no exacto)
4. Ajustar porciones hasta ~2.0P · 1.0G · 2.0C
   - **Verificar**: Panel VERDE (dentro de tolerancia)

**Resultado Esperado**: ✅ Colores cambian según precisión

---

### **Test 7: Guardado con "Enviar a Nutricionista"**

**Objetivo**: Verificar flag de revisión (preparado para futuro sistema)

**Pasos**:
1. Crear combinación completa
2. Marcar checkbox "Enviar a nutricionista para revisión"
3. Guardar
4. **Verificar en base de datos**:
   ```sql
   SELECT * FROM PLAN_BLOQUES_PRESETS 
   WHERE ALIAS = 'Tu combinación'
   AND ES_FAVORITA = 1;
   
   -- Debería estar guardado (enviar_revision no genera tabla aún, solo se prepara)
   ```

**Resultado Esperado**: ✅ Guardado correcto (sistema de revisiones pendiente)

---

### **Test 8: Manejo de Errores**

**Objetivo**: Verificar validaciones

**Casos**:

**A. Sin seleccionar comida**
- Intentar agregar alimento sin seleccionar comida
- **Esperado**: Selector de alimentos deshabilitado con mensaje

**B. Sin agregar alimentos**
- Intentar guardar sin alimentos
- **Esperado**: Alert "Agrega al menos un alimento"

**C. Sin nombre**
- Intentar guardar sin nombre
- **Esperado**: Alert "Por favor ingresa un nombre para tu combinación"

**D. Porciones fuera de rango**
- Intentar poner 0 o >5 porciones
- **Esperado**: Input limitado a 1-5

**Resultado Esperado**: ✅ Todas las validaciones funcionan

---

### **Test 9: Eliminar Alimento**

**Objetivo**: Verificar que se puede quitar un alimento

**Pasos**:
1. Agregar 3 alimentos diferentes
2. Click en botón "X" del segundo alimento
3. **Verificar**:
   - Alimento desaparece de la lista
   - Bloques acumulados se recalculan
   - Diferencias se actualizan
   - Colores del panel cambian si corresponde

**Resultado Esperado**: ✅ Eliminación funciona con recálculo automático

---

### **Test 10: Limpieza al Cerrar Modal**

**Objetivo**: Verificar que el modal se resetea

**Pasos**:
1. Crear combinación parcial (agregar 2 alimentos)
2. NO guardar, cerrar modal con X
3. Reabrir constructor
4. **Verificar**: 
   - Todo está vacío
   - Selectors reseteados
   - Lista de alimentos vacía

**Resultado Esperado**: ✅ Modal limpio al reabrir

---

## **🎯 TESTING POR ESCENARIOS REALES**

### **Escenario 1: Paciente Activo (Libertad 15%)**

**Perfil**: Juan Pérez, objetivo 2500 kcal/día, libertad 15%

**Desayuno Objetivo**: 2.5P · 1.5G · 3.0C

**Caso de uso**:
1. Abrir constructor
2. Seleccionar "Desayuno"
3. Agregar: Huevo × 2, Avena × 2, Leche × 1
4. **Verificar acumulado**: ~2.3P · 1.6G · 2.8C
5. Diferencia vs objetivo: -0.2P / +0.1G / -0.2C
6. **Esperado**: Panel VERDE (dentro 15% de libertad)
7. Guardar como "Desayuno Completo"
8. Aplicar desde favoritos → ✅ Debe aceptarse

---

### **Escenario 2: Paciente Definición (Libertad 5%)**

**Perfil**: Vega, Luana, objetivo 1800 kcal/día, libertad 5%

**Desayuno Objetivo**: 1.1P · 1.5G · 1.0C

**Caso de uso**:
1. Abrir constructor
2. Seleccionar "Desayuno"
3. Intentar: Huevo × 2 + Avena × 1
4. **Acumulado**: 1.3P · 1.2G · 0.6C
5. **Diferencia**: +0.2P / -0.3G / -0.4C
6. **Esperado**: Panel AMARILLO (fuera de 5% en G y C)
7. Ajustar a: Huevo × 1 + Queso × 1 + Fruta × 1
8. **Nuevo acumulado**: 1.2P · 1.4G · 1.1C
9. **Diferencia**: +0.1P / -0.1G / +0.1C
10. **Esperado**: Panel VERDE (dentro 5%)
11. Guardar → Aplicar → ✅ Debe aceptarse

---

### **Escenario 3: Almuerzo Alto en Proteína**

**Objetivo**: 4.0P · 2.0G · 3.0C

**Caso de uso**:
1. Abrir constructor, seleccionar "Almuerzo"
2. Filtrar por "Rico en Proteína"
3. Agregar: Pollo × 3 porciones
4. Ver diferencia en G y C
5. Click "Completar con Carbohidratos"
6. **Esperado**: Sistema agrega Arroz o Vegetales automáticamente
7. Ajustar manualmente si necesario
8. Guardar como "Almuerzo Proteico"

---

## **📊 CHECKLIST DE VALIDACIÓN**

### **Funcionalidad Core**
- [ ] Modal se abre correctamente
- [ ] Objetivo se carga al seleccionar comida
- [ ] Alimentos se cargan filtrados por momento
- [ ] Filtro por macro funciona
- [ ] Agregar alimento suma bloques correctamente
- [ ] Eliminar alimento recalcula bloques
- [ ] Diferencias (Falta/Sobra) se muestran correctamente
- [ ] Colores del panel cambian según precisión
- [ ] Botón "Completar con..." aparece cuando corresponde
- [ ] Función "Completar con..." agrega alimento inteligentemente
- [ ] Guardado persiste en base de datos
- [ ] Combinación aparece en tab Favoritos
- [ ] Aplicar desde favoritos funciona

### **Validaciones**
- [ ] No permite guardar sin nombre
- [ ] No permite guardar sin alimentos
- [ ] Valida porciones (1-5)
- [ ] Valida comida seleccionada

### **Integración**
- [ ] Backend `/api/grupos-alimentos` responde correctamente
- [ ] Backend `/api/plan-alimentario/bloques/constructor` guarda correctamente
- [ ] Sistema de macros_fuertes incluye alimentos balanceados
- [ ] Filtrado por momento excluye alimentos inapropiados

### **UX/UI**
- [ ] Responsive (funciona en móvil)
- [ ] Feedback visual claro
- [ ] Mensajes de error comprensibles
- [ ] Flujo intuitivo
- [ ] Modal se resetea al cerrar

---

## **🐛 BUGS CONOCIDOS A VERIFICAR**

### **Potenciales Problemas**

**1. Huevo no aparece en filtro "Rico en Grasa"**
- **Causa**: Sistema anterior usaba solo macro_dominante
- **Solución**: Implementado macros_fuertes ✅
- **Test**: Filtrar por G en desayuno → Debe incluir Huevo

**2. Milanesa sugerida para desayuno**
- **Causa**: Sin filtrado por momento
- **Solución**: Implementado momentos_por_categoria ✅
- **Test**: Desayuno no debe mostrar Milanesa/Arroz/Fideo

**3. Libertad 5% rechaza todo**
- **Causa**: Validación con % del total diario en lugar de bloques directos
- **Solución**: Corregido a validación por bloques con tolerancia 0.25 ✅
- **Test**: Combinaciones con error <0.25 bloques deben aceptarse

**4. Modal no se resetea**
- **Causa**: Variables globales no limpiadas
- **Solución**: Limpieza completa al guardar exitoso ✅
- **Test**: Cerrar y reabrir modal debe estar vacío

---

## **📝 COMANDOS DE TESTING RÁPIDO**

### **Test API Grupos Alimentos**
```bash
# Ver todos los alimentos para desayuno
curl "http://localhost:8000/api/grupos-alimentos?momento=desayuno" | jq '.total'

# Ver alimentos ricos en grasa para desayuno (debe incluir huevo)
curl "http://localhost:8000/api/grupos-alimentos?macro=G&momento=desayuno" | jq '.alimentos[].categoria'
# Esperado: ["Queso", "Fiambres", "Huevo", ...]
```

### **Test Guardado Constructor**
```bash
curl -X POST http://localhost:8000/api/plan-alimentario/bloques/constructor \
  -H "Content-Type: application/json" \
  -d '{
    "comida": "desayuno",
    "alimentos": [
      {"categoria": "Huevo", "descripcion": "Unidad", "porciones": 2},
      {"categoria": "Avena", "descripcion": "Media taza", "porciones": 1}
    ],
    "alias": "Test Desayuno",
    "enviar_revision": false
  }'
```

### **Verificación en Base de Datos**
```sql
-- Ver últimas combinaciones guardadas
SELECT ALIAS, DESCRIPCION, PROTEINA, GRASA, CARBOHIDRATOS, 
       PROTEINA_GRAMOS, GRASA_GRAMOS, CARBOHIDRATOS_GRAMOS
FROM PLAN_BLOQUES_PRESETS
WHERE ES_FAVORITA = 1
ORDER BY ID DESC
LIMIT 5;

-- Contar combinaciones por usuario
SELECT USER_DNI, COUNT(*) as total_combinaciones
FROM PLAN_BLOQUES_PRESETS
WHERE ES_FAVORITA = 1
GROUP BY USER_DNI;
```

---

## **✅ CRITERIOS DE ACEPTACIÓN**

### **Sistema Completo Funcional Si**:
1. ✅ Modal se abre y muestra objetivo correctamente
2. ✅ Alimentos se filtran por momento del día
3. ✅ Macros_fuertes incluye huevo en filtro de grasa
4. ✅ Recálculo en tiempo real funciona correctamente
5. ✅ Colores del panel reflejan precisión
6. ✅ Sugerencia inteligente completa carbohidratos
7. ✅ Guardado persiste en PLAN_BLOQUES_PRESETS
8. ✅ Combinación aparece en favoritos
9. ✅ Aplicar desde favoritos respeta libertad (5% vs 15%)
10. ✅ Validaciones previenen errores de usuario

---

## **🚀 PRÓXIMOS PASOS OPCIONALES**

### **Refinamientos Futuros**

**1. Sistema de Revisiones por Nutricionista**
- Tabla `PLAN_BLOQUES_REVISIONES`
- Dashboard para nutricionista con combinaciones pendientes
- Estados: pendiente / aprobada / rechazada / modificada

**2. Biblioteca Personal "Mis Combinaciones"**
- Tab adicional con combinaciones propias
- Filtrar por comida
- Buscar por nombre
- Estadísticas de uso

**3. Análisis Nutricional Ampliado**
- Mostrar calorías totales
- Calcular densidad nutricional
- Score de variedad
- Micronutrientes estimados

**4. Compartir Combinaciones**
- Entre pacientes (comunidad)
- Exportar PDF con receta visual
- QR code para compartir
- Sistema de "me gusta" / ratings

**5. Historial de Uso**
- Registrar cada vez que se aplica una combinación
- Gráficos de combinaciones más usadas
- Sugerencias basadas en historial

---

**🎉 El constructor está LISTO para testing inmediato. Sigue el checklist y valida cada caso de uso para asegurar que todo funciona según especificaciones.**

---

**Archivo**: `TESTING_CONSTRUCTOR.md`  
**Fecha**: 2025-10-04  
**Versión**: 1.0.0
