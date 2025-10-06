# 🚨 RECUPERACIÓN URGENTE - Tabla PLAN_BLOQUES_PRESETS

## **Problema**
La migración anterior eliminó columnas críticas (`USER_DNI`, `ALIAS`, `ULTIMA_VEZ_USADA`, `VECES_USADA`) causando errores en todos los endpoints que usan esta tabla.

**Síntomas**:
- ❌ No cargan favoritos
- ❌ No cargan sugerencias inteligentes
- ❌ Constructor no funciona
- ❌ Error en consola Flask: `no such column: ALIAS` o similar

---

## **🔧 SOLUCIÓN RÁPIDA**

### **Opción 1: Script PowerShell Automatizado** ⭐ RECOMENDADO

```powershell
cd "c:\Users\diego\Documents\Compartidos\Proyectos - Dev\ONV2"
.\migrations\ejecutar_migracion_004.ps1
```

**Qué hace**:
- ✅ Crea backup automático con timestamp
- ✅ Ejecuta migración corregida
- ✅ Verifica columnas resultantes
- ✅ Muestra estadísticas de datos migrados
- ✅ Restaura backup si hay error

---

### **Opción 2: Comando SQL Directo**

Si prefieres ejecutar manualmente desde PowerShell:

```powershell
sqlite3 src\Basededatos "
PRAGMA foreign_keys = OFF;

CREATE TABLE PLAN_BLOQUES_PRESETS_NEW (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_DNI TEXT,
    COMIDA TEXT NOT NULL,
    ALIAS TEXT,
    DESCRIPCION TEXT,
    PROTEINA REAL DEFAULT 0,
    GRASA REAL DEFAULT 0,
    CARBOHIDRATOS REAL DEFAULT 0,
    PROTEINA_GRAMOS REAL DEFAULT 0,
    GRASA_GRAMOS REAL DEFAULT 0,
    CARBOHIDRATOS_GRAMOS REAL DEFAULT 0,
    ES_FAVORITA INTEGER DEFAULT 0,
    ES_PRESET_GLOBAL INTEGER DEFAULT 0,
    ULTIMA_VEZ_USADA DATETIME,
    VECES_USADA INTEGER DEFAULT 0,
    FECHA_CREACION DATETIME DEFAULT CURRENT_TIMESTAMP,
    FECHA_ACTUALIZACION DATETIME DEFAULT CURRENT_TIMESTAMP,
    ES_PUBLICA INTEGER DEFAULT 0,
    CREADOR_USERNAME TEXT,
    DETALLE_JSON TEXT,
    FAVORITOS_TOTAL INTEGER DEFAULT 0
);

INSERT INTO PLAN_BLOQUES_PRESETS_NEW
SELECT * FROM PLAN_BLOQUES_PRESETS;

DROP TABLE PLAN_BLOQUES_PRESETS;
ALTER TABLE PLAN_BLOQUES_PRESETS_NEW RENAME TO PLAN_BLOQUES_PRESETS;

CREATE INDEX idx_presets_user ON PLAN_BLOQUES_PRESETS(USER_DNI);
CREATE INDEX idx_presets_comida ON PLAN_BLOQUES_PRESETS(COMIDA);
CREATE INDEX idx_presets_global ON PLAN_BLOQUES_PRESETS(ES_PRESET_GLOBAL);

PRAGMA foreign_keys = ON;
"
```

---

### **Opción 3: Restaurar Backup Manual**

Si tienes un backup previo a la migración:

```powershell
# Listar backups disponibles
ls src\Basededatos*

# Restaurar desde backup específico
copy src\Basededatos_backup_YYYYMMDD src\Basededatos -Force
```

---

## **✅ VERIFICACIÓN POST-RECUPERACIÓN**

### **1. Verificar Estructura de Tabla**

```powershell
sqlite3 src\Basededatos "PRAGMA table_info(PLAN_BLOQUES_PRESETS);"
```

**Debes ver estas columnas**:
```
0|ID|INTEGER|0||1
1|USER_DNI|TEXT|0||0
2|COMIDA|TEXT|1||0
3|ALIAS|TEXT|0||0
4|DESCRIPCION|TEXT|0||0
5|PROTEINA|REAL|0|0|0
6|GRASA|REAL|0|0|0
7|CARBOHIDRATOS|REAL|0|0|0
8|PROTEINA_GRAMOS|REAL|0|0|0
9|GRASA_GRAMOS|REAL|0|0|0
10|CARBOHIDRATOS_GRAMOS|REAL|0|0|0
11|ES_FAVORITA|INTEGER|0|0|0
12|ES_PRESET_GLOBAL|INTEGER|0|0|0
13|ULTIMA_VEZ_USADA|DATETIME|0||0
14|VECES_USADA|INTEGER|0|0|0
15|FECHA_CREACION|DATETIME|0|CURRENT_TIMESTAMP|0
16|FECHA_ACTUALIZACION|DATETIME|0|CURRENT_TIMESTAMP|0
17|ES_PUBLICA|INTEGER|0|0|0
18|CREADOR_USERNAME|TEXT|0||0
19|DETALLE_JSON|TEXT|0||0
20|FAVORITOS_TOTAL|INTEGER|0|0|0
```

✅ **Columnas críticas presentes**: `USER_DNI`, `ALIAS`, `ULTIMA_VEZ_USADA`, `VECES_USADA`  
✅ **Columnas nuevas añadidas**: `ES_PUBLICA`, `CREADOR_USERNAME`, `DETALLE_JSON`, `FAVORITOS_TOTAL`

---

### **2. Verificar Datos Migrados**

```powershell
sqlite3 src\Basededatos "SELECT COUNT(*) as total FROM PLAN_BLOQUES_PRESETS;"
```

Debe mostrar el número de registros que tenías antes (probablemente 8-12 presets globales).

---

### **3. Reiniciar Sistema**

```powershell
# 1. Limpiar caché
python limpiar_cache.py

# 2. Reiniciar Flask (Ctrl+C primero)
python src/main.py
```

---

### **4. Probar en Navegador**

1. Ir a **Plan Alimentario → Plan Simplificado**
2. Click **"Ver Sugerencias Inteligentes"**
3. Verificar que cargan tabs:
   - ✅ Favoritos
   - ✅ Inteligente
   - ✅ Recomendadas
4. Click **"Abrir Constructor"**
5. Verificar que carga sin errores

---

## **📊 DIFERENCIAS ENTRE MIGRACIONES**

| Aspecto | Migración Original (ROTA) | Migración Corregida |
|---------|---------------------------|---------------------|
| **Columnas preservadas** | ❌ Solo 10 columnas | ✅ Todas las 21 columnas |
| **USER_DNI** | ❌ Eliminada | ✅ Preservada |
| **ALIAS** | ❌ Eliminada (usaba NOMBRE) | ✅ Preservada |
| **ULTIMA_VEZ_USADA** | ❌ Eliminada | ✅ Preservada |
| **VECES_USADA** | ❌ Eliminada | ✅ Preservada |
| **Tipos de datos** | ✅ INTEGER → REAL | ✅ INTEGER → REAL |
| **Columnas nuevas** | ✅ Añadidas | ✅ Añadidas |
| **Compatibilidad código** | ❌ Rompió backend | ✅ Compatible 100% |

---

## **🔍 DIAGNÓSTICO DE ERRORES**

### **Error en Console Flask**

```python
sqlite3.OperationalError: no such column: ALIAS
sqlite3.OperationalError: no such column: USER_DNI
sqlite3.OperationalError: table PLAN_BLOQUES_PRESETS has no column named ULTIMA_VEZ_USADA
```

**Causa**: Migración anterior eliminó columnas que el código sigue usando.  
**Solución**: Ejecutar migración corregida (Opción 1 o 2 arriba).

---

### **Error en Browser Console**

```javascript
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
/api/plan-alimentario/bloques/sugerencias
```

**Causa**: Backend no puede consultar PLAN_BLOQUES_PRESETS por columnas faltantes.  
**Solución**: Ejecutar migración corregida + reiniciar servidor.

---

### **Página en Blanco / Tabs Vacíos**

**Causa**: Fetch falla antes de renderizar por error 500 del backend.  
**Solución**: Ejecutar migración corregida + limpiar caché del navegador (Ctrl+Shift+R).

---

## **📝 PREVENCIÓN FUTURA**

### **Antes de Cualquier Migración**

```powershell
# SIEMPRE crear backup con timestamp
copy src\Basededatos "src\Basededatos_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Verificar estructura actual
sqlite3 src\Basededatos ".schema PLAN_BLOQUES_PRESETS"

# Contar registros actuales
sqlite3 src\Basededatos "SELECT COUNT(*) FROM PLAN_BLOQUES_PRESETS;"
```

---

### **Después de Migración**

```powershell
# Verificar columnas
sqlite3 src\Basededatos "PRAGMA table_info(PLAN_BLOQUES_PRESETS);" | wc -l
# Debe ser >= 20 líneas (columnas)

# Verificar datos
sqlite3 src\Basededatos "SELECT COUNT(*) FROM PLAN_BLOQUES_PRESETS;"
# Debe coincidir con el número antes de migrar

# Test de integración
python src/main.py
# Navegar a Plan Alimentario y verificar que carga sin errores
```

---

## **🆘 SOPORTE ADICIONAL**

Si después de ejecutar la migración corregida siguen los errores:

1. **Verifica logs del servidor**:
   ```powershell
   # En la terminal donde corre Flask, busca:
   sqlite3.OperationalError
   ```

2. **Verifica columnas realmente presentes**:
   ```powershell
   sqlite3 src\Basededatos "PRAGMA table_info(PLAN_BLOQUES_PRESETS);" > columnas.txt
   type columnas.txt
   ```

3. **Verifica integridad de la base**:
   ```powershell
   sqlite3 src\Basededatos "PRAGMA integrity_check;"
   # Debe mostrar: ok
   ```

4. **Última opción - Recrear desde cero**:
   ```powershell
   # Backup completo primero
   copy src\Basededatos src\Basededatos_rescue
   
   # Recrear tabla (perderás datos)
   sqlite3 src\Basededatos < migrations/004_biblioteca_favoritos_FIXED.sql
   ```

---

## **✅ CHECKLIST FINAL**

- [ ] Backup creado antes de migración
- [ ] Migración ejecutada sin errores
- [ ] Columnas verificadas (21 columnas presentes)
- [ ] Datos migrados correctamente (COUNT coincide)
- [ ] Servidor reiniciado
- [ ] Caché limpiado
- [ ] Constructor funciona
- [ ] Sugerencias inteligentes cargan
- [ ] Favoritos se muestran

---

**Estado**: Documentación de recuperación completa  
**Fecha**: 2025-10-06  
**Archivos**:
- `migrations/004_biblioteca_favoritos_FIXED.sql` - Script SQL corregido
- `migrations/ejecutar_migracion_004.ps1` - Script automatizado
- `migrations/RECUPERACION_URGENTE.md` - Esta documentación
