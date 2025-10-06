-- Migración 004 CORREGIDA: Sistema de Biblioteca y Favoritos
-- Fecha: 2025-10-06
-- Descripción: Añade soporte para biblioteca pública PRESERVANDO columnas existentes

-- ============================================================================
-- IMPORTANTE: Esta migración preserva TODAS las columnas existentes
-- ============================================================================

PRAGMA foreign_keys = OFF;

-- ============================================================================
-- 1. RECREAR PLAN_BLOQUES_PRESETS con esquema completo
-- ============================================================================

CREATE TABLE PLAN_BLOQUES_PRESETS_NEW (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Columnas ORIGINALES (preservadas)
    USER_DNI TEXT,
    COMIDA TEXT NOT NULL,
    ALIAS TEXT,  -- Nombre de la combinación (antes era NOMBRE)
    DESCRIPCION TEXT,
    
    -- Bloques ACTUALIZADOS: INTEGER → REAL (soporta 0.5, 1.5, etc.)
    PROTEINA REAL DEFAULT 0,
    GRASA REAL DEFAULT 0,
    CARBOHIDRATOS REAL DEFAULT 0,
    
    -- Gramos ACTUALIZADOS: INTEGER → REAL
    PROTEINA_GRAMOS REAL DEFAULT 0,
    GRASA_GRAMOS REAL DEFAULT 0,
    CARBOHIDRATOS_GRAMOS REAL DEFAULT 0,
    
    -- Flags ORIGINALES (preservados)
    ES_FAVORITA INTEGER DEFAULT 0,
    ES_PRESET_GLOBAL INTEGER DEFAULT 0,
    
    -- Estadísticas ORIGINALES (preservadas)
    ULTIMA_VEZ_USADA DATETIME,
    VECES_USADA INTEGER DEFAULT 0,
    
    -- Timestamps ORIGINALES (preservados)
    FECHA_CREACION DATETIME DEFAULT CURRENT_TIMESTAMP,
    FECHA_ACTUALIZACION DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- ========================================
    -- Columnas NUEVAS para biblioteca
    -- ========================================
    ES_PUBLICA INTEGER DEFAULT 0,  -- Si está en biblioteca pública
    CREADOR_USERNAME TEXT,  -- Quien creó la combinación
    DETALLE_JSON TEXT,  -- JSON [{categoria, descripcion, porciones, bloques}]
    FAVORITOS_TOTAL INTEGER DEFAULT 0  -- Contador de favoritos
);

-- ============================================================================
-- 2. MIGRAR DATOS EXISTENTES
-- ============================================================================

INSERT INTO PLAN_BLOQUES_PRESETS_NEW (
    ID,
    USER_DNI,
    COMIDA,
    ALIAS,
    DESCRIPCION,
    PROTEINA,
    GRASA,
    CARBOHIDRATOS,
    PROTEINA_GRAMOS,
    GRASA_GRAMOS,
    CARBOHIDRATOS_GRAMOS,
    ES_FAVORITA,
    ES_PRESET_GLOBAL,
    ULTIMA_VEZ_USADA,
    VECES_USADA,
    FECHA_CREACION,
    FECHA_ACTUALIZACION,
    -- Nuevas columnas con valores por defecto
    ES_PUBLICA,
    CREADOR_USERNAME,
    DETALLE_JSON,
    FAVORITOS_TOTAL
)
SELECT
    p.ID,
    p.USER_DNI,
    p.COMIDA,
    COALESCE(p.ALIAS, p.NOMBRE) as ALIAS,  -- Preservar ALIAS o usar NOMBRE si existe
    p.DESCRIPCION,
    CAST(p.PROTEINA AS REAL) as PROTEINA,
    CAST(p.GRASA AS REAL) as GRASA,
    CAST(p.CARBOHIDRATOS AS REAL) as CARBOHIDRATOS,
    CAST(COALESCE(p.PROTEINA_GRAMOS, 0) AS REAL) as PROTEINA_GRAMOS,
    CAST(COALESCE(p.GRASA_GRAMOS, 0) AS REAL) as GRASA_GRAMOS,
    CAST(COALESCE(p.CARBOHIDRATOS_GRAMOS, 0) AS REAL) as CARBOHIDRATOS_GRAMOS,
    COALESCE(p.ES_FAVORITA, 0) as ES_FAVORITA,
    COALESCE(p.ES_PRESET_GLOBAL, 0) as ES_PRESET_GLOBAL,
    p.ULTIMA_VEZ_USADA,
    COALESCE(p.VECES_USADA, 0) as VECES_USADA,
    COALESCE(p.FECHA_CREACION, p.CREATED_AT, CURRENT_TIMESTAMP) as FECHA_CREACION,
    COALESCE(p.FECHA_ACTUALIZACION, p.UPDATED_AT, CURRENT_TIMESTAMP) as FECHA_ACTUALIZACION,
    -- Valores por defecto para nuevas columnas
    CASE WHEN p.ES_PRESET_GLOBAL = 1 THEN 1 ELSE 0 END as ES_PUBLICA,  -- Presets globales son públicos
    CASE WHEN p.ES_PRESET_GLOBAL = 1 THEN 'Sistema' ELSE NULL END as CREADOR_USERNAME,
    COALESCE(p.DETALLE_JSON, '[]') as DETALLE_JSON,
    0 as FAVORITOS_TOTAL
FROM PLAN_BLOQUES_PRESETS p;

-- ============================================================================
-- 3. REEMPLAZAR TABLA
-- ============================================================================

DROP TABLE PLAN_BLOQUES_PRESETS;
ALTER TABLE PLAN_BLOQUES_PRESETS_NEW RENAME TO PLAN_BLOQUES_PRESETS;

-- ============================================================================
-- 4. RECREAR ÍNDICES
-- ============================================================================

CREATE INDEX idx_presets_user ON PLAN_BLOQUES_PRESETS(USER_DNI);
CREATE INDEX idx_presets_comida ON PLAN_BLOQUES_PRESETS(COMIDA);
CREATE INDEX idx_presets_global ON PLAN_BLOQUES_PRESETS(ES_PRESET_GLOBAL);
CREATE INDEX idx_presets_favorita ON PLAN_BLOQUES_PRESETS(ES_FAVORITA);
CREATE INDEX idx_presets_publica ON PLAN_BLOQUES_PRESETS(ES_PUBLICA);
CREATE INDEX idx_presets_creador ON PLAN_BLOQUES_PRESETS(CREADOR_USERNAME);

-- ============================================================================
-- 5. CREAR TABLA PUENTE PLAN_BLOQUES_FAVORITOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS PLAN_BLOQUES_FAVORITOS (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    PRESET_ID INTEGER NOT NULL,
    USER_DNI TEXT NOT NULL,
    CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(PRESET_ID, USER_DNI),
    FOREIGN KEY (PRESET_ID) REFERENCES PLAN_BLOQUES_PRESETS(ID) ON DELETE CASCADE
);

CREATE INDEX idx_favoritos_preset ON PLAN_BLOQUES_FAVORITOS(PRESET_ID);
CREATE INDEX idx_favoritos_user ON PLAN_BLOQUES_FAVORITOS(USER_DNI);

-- ============================================================================
-- 6. TRIGGERS PARA CONTADOR DE FAVORITOS
-- ============================================================================

CREATE TRIGGER trg_favorito_insert
AFTER INSERT ON PLAN_BLOQUES_FAVORITOS
BEGIN
    UPDATE PLAN_BLOQUES_PRESETS
    SET FAVORITOS_TOTAL = FAVORITOS_TOTAL + 1,
        FECHA_ACTUALIZACION = CURRENT_TIMESTAMP
    WHERE ID = NEW.PRESET_ID;
END;

CREATE TRIGGER trg_favorito_delete
AFTER DELETE ON PLAN_BLOQUES_FAVORITOS
BEGIN
    UPDATE PLAN_BLOQUES_PRESETS
    SET FAVORITOS_TOTAL = FAVORITOS_TOTAL - 1,
        FECHA_ACTUALIZACION = CURRENT_TIMESTAMP
    WHERE ID = OLD.PRESET_ID;
END;

PRAGMA foreign_keys = ON;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver estructura completa
.schema PLAN_BLOQUES_PRESETS

-- Ver columnas detalladas
PRAGMA table_info(PLAN_BLOQUES_PRESETS);

-- Contar registros migrados
SELECT 
    COUNT(*) as total_presets,
    SUM(CASE WHEN ES_PRESET_GLOBAL = 1 THEN 1 ELSE 0 END) as presets_globales,
    SUM(CASE WHEN ES_PUBLICA = 1 THEN 1 ELSE 0 END) as publicas,
    SUM(CASE WHEN ES_FAVORITA = 1 THEN 1 ELSE 0 END) as favoritas,
    SUM(CASE WHEN USER_DNI IS NOT NULL THEN 1 ELSE 0 END) as con_usuario
FROM PLAN_BLOQUES_PRESETS;

-- Ver primeros registros
SELECT ID, COMIDA, ALIAS, ES_PRESET_GLOBAL, ES_PUBLICA, CREADOR_USERNAME, FAVORITOS_TOTAL
FROM PLAN_BLOQUES_PRESETS
LIMIT 5;
