-- Migración 004: Sistema de Biblioteca y Favoritos
-- Fecha: 2025-10-06
-- Descripción: Añade soporte para biblioteca pública de combinaciones y sistema de favoritos

-- ============================================================================
-- 1. MIGRAR PLAN_BLOQUES_PRESETS: Cambiar INTEGER a REAL y añadir columnas
-- ============================================================================

-- SQLite no soporta ALTER COLUMN, así que recreamos la tabla

-- Crear tabla temporal con nueva estructura
CREATE TABLE PLAN_BLOQUES_PRESETS_NEW (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    COMIDA TEXT NOT NULL,
    NOMBRE TEXT NOT NULL,
    DESCRIPCION TEXT,
    
    -- Bloques redondeados (REAL para soportar 0.5, 1.5, etc.)
    PROTEINA REAL DEFAULT 0,
    GRASA REAL DEFAULT 0,
    CARBOHIDRATOS REAL DEFAULT 0,
    
    -- Gramos exactos (REAL)
    PROTEINA_GRAMOS REAL DEFAULT 0,
    GRASA_GRAMOS REAL DEFAULT 0,
    CARBOHIDRATOS_GRAMOS REAL DEFAULT 0,
    
    -- Flags
    ES_PRESET_GLOBAL INTEGER DEFAULT 0,
    ES_FAVORITA INTEGER DEFAULT 0,
    ES_PUBLICA INTEGER DEFAULT 0,  -- Nueva: si está en biblioteca pública
    
    -- Nuevos campos para biblioteca
    CREADOR_USERNAME TEXT,  -- Quien creó la combinación
    DETALLE_JSON TEXT,  -- JSON con [{categoria, descripcion, porciones, bloques}]
    FAVORITOS_TOTAL INTEGER DEFAULT 0,  -- Contador de favoritos
    
    -- Timestamps
    CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copiar datos existentes
INSERT INTO PLAN_BLOQUES_PRESETS_NEW (
    ID, COMIDA, NOMBRE, DESCRIPCION,
    PROTEINA, GRASA, CARBOHIDRATOS,
    PROTEINA_GRAMOS, GRASA_GRAMOS, CARBOHIDRATOS_GRAMOS,
    ES_PRESET_GLOBAL, ES_FAVORITA,
    CREATED_AT
)
SELECT 
    ID, COMIDA, NOMBRE, DESCRIPCION,
    CAST(PROTEINA AS REAL), CAST(GRASA AS REAL), CAST(CARBOHIDRATOS AS REAL),
    CAST(PROTEINA_GRAMOS AS REAL), CAST(GRASA_GRAMOS AS REAL), CAST(CARBOHIDRATOS_GRAMOS AS REAL),
    ES_PRESET_GLOBAL, ES_FAVORITA,
    CREATED_AT
FROM PLAN_BLOQUES_PRESETS;

-- Eliminar tabla antigua
DROP TABLE PLAN_BLOQUES_PRESETS;

-- Renombrar tabla nueva
ALTER TABLE PLAN_BLOQUES_PRESETS_NEW RENAME TO PLAN_BLOQUES_PRESETS;

-- Recrear índices
CREATE INDEX idx_presets_comida ON PLAN_BLOQUES_PRESETS(COMIDA);
CREATE INDEX idx_presets_global ON PLAN_BLOQUES_PRESETS(ES_PRESET_GLOBAL);
CREATE INDEX idx_presets_publica ON PLAN_BLOQUES_PRESETS(ES_PUBLICA);
CREATE INDEX idx_presets_creador ON PLAN_BLOQUES_PRESETS(CREADOR_USERNAME);

-- ============================================================================
-- 2. CREAR TABLA PUENTE PLAN_BLOQUES_FAVORITOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS PLAN_BLOQUES_FAVORITOS (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    PRESET_ID INTEGER NOT NULL,  -- FK a PLAN_BLOQUES_PRESETS
    USER_DNI TEXT NOT NULL,
    CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint de unicidad: un usuario solo puede marcar como favorito una vez
    UNIQUE(PRESET_ID, USER_DNI),
    
    -- Foreign key
    FOREIGN KEY (PRESET_ID) REFERENCES PLAN_BLOQUES_PRESETS(ID) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_favoritos_preset ON PLAN_BLOQUES_FAVORITOS(PRESET_ID);
CREATE INDEX idx_favoritos_user ON PLAN_BLOQUES_FAVORITOS(USER_DNI);

-- ============================================================================
-- 3. TRIGGERS PARA MANTENER FAVORITOS_TOTAL ACTUALIZADO
-- ============================================================================

-- Trigger: Incrementar contador al agregar favorito
CREATE TRIGGER trg_favorito_insert
AFTER INSERT ON PLAN_BLOQUES_FAVORITOS
BEGIN
    UPDATE PLAN_BLOQUES_PRESETS
    SET FAVORITOS_TOTAL = FAVORITOS_TOTAL + 1,
        UPDATED_AT = CURRENT_TIMESTAMP
    WHERE ID = NEW.PRESET_ID;
END;

-- Trigger: Decrementar contador al eliminar favorito
CREATE TRIGGER trg_favorito_delete
AFTER DELETE ON PLAN_BLOQUES_FAVORITOS
BEGIN
    UPDATE PLAN_BLOQUES_PRESETS
    SET FAVORITOS_TOTAL = FAVORITOS_TOTAL - 1,
        UPDATED_AT = CURRENT_TIMESTAMP
    WHERE ID = OLD.PRESET_ID;
END;

-- ============================================================================
-- 4. VIEW PARA CONSULTAS OPTIMIZADAS DE BIBLIOTECA
-- ============================================================================

CREATE VIEW IF NOT EXISTS v_biblioteca_combinaciones AS
SELECT 
    p.ID,
    p.COMIDA,
    p.NOMBRE,
    p.DESCRIPCION,
    p.PROTEINA,
    p.GRASA,
    p.CARBOHIDRATOS,
    p.PROTEINA_GRAMOS,
    p.GRASA_GRAMOS,
    p.CARBOHIDRATOS_GRAMOS,
    p.CREADOR_USERNAME,
    p.DETALLE_JSON,
    p.FAVORITOS_TOTAL,
    p.ES_PUBLICA,
    p.CREATED_AT,
    p.UPDATED_AT,
    -- Verificar si el usuario actual lo tiene como favorito (se pasa USER_DNI como parámetro en query)
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM PLAN_BLOQUES_FAVORITOS f 
            WHERE f.PRESET_ID = p.ID
        ) THEN 1 
        ELSE 0 
    END as TIENE_FAVORITOS
FROM PLAN_BLOQUES_PRESETS p
WHERE p.ES_PUBLICA = 1
ORDER BY p.FAVORITOS_TOTAL DESC, p.CREATED_AT DESC;

-- ============================================================================
-- 5. DATOS INICIALES: Actualizar presets globales existentes
-- ============================================================================

-- Marcar presets globales existentes con creador y hacerlos públicos
UPDATE PLAN_BLOQUES_PRESETS
SET CREADOR_USERNAME = 'Sistema',
    ES_PUBLICA = 1,
    DETALLE_JSON = '[]'  -- Vacío para presets genéricos
WHERE ES_PRESET_GLOBAL = 1 AND CREADOR_USERNAME IS NULL;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar estructura de PLAN_BLOQUES_PRESETS
SELECT sql FROM sqlite_master WHERE type='table' AND name='PLAN_BLOQUES_PRESETS';

-- Verificar estructura de PLAN_BLOQUES_FAVORITOS
SELECT sql FROM sqlite_master WHERE type='table' AND name='PLAN_BLOQUES_FAVORITOS';

-- Verificar triggers
SELECT name, sql FROM sqlite_master WHERE type='trigger' AND tbl_name IN ('PLAN_BLOQUES_FAVORITOS', 'PLAN_BLOQUES_PRESETS');

-- Contar registros migrados
SELECT 
    COUNT(*) as total_presets,
    SUM(CASE WHEN ES_PRESET_GLOBAL = 1 THEN 1 ELSE 0 END) as presets_globales,
    SUM(CASE WHEN ES_PUBLICA = 1 THEN 1 ELSE 0 END) as publicos,
    SUM(CASE WHEN ES_FAVORITA = 1 THEN 1 ELSE 0 END) as favoritas
FROM PLAN_BLOQUES_PRESETS;

-- ============================================================================
-- ROLLBACK (en caso de error)
-- ============================================================================

-- Para revertir (ejecutar manualmente si es necesario):
/*
DROP TRIGGER IF EXISTS trg_favorito_insert;
DROP TRIGGER IF EXISTS trg_favorito_delete;
DROP VIEW IF EXISTS v_biblioteca_combinaciones;
DROP TABLE IF EXISTS PLAN_BLOQUES_FAVORITOS;
-- Restaurar backup de PLAN_BLOQUES_PRESETS si existe
*/
