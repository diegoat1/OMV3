-- ============================================
-- Migration 005: Restructure recipes to relational model
-- Replaces columnar recipes table with recipes + recipe_ingredients
-- ============================================

-- Drop old simplified recipes table (had no real data, just stub columns)
DROP TABLE IF EXISTS recipes;

-- ============================================
-- NEW: recipes (header only)
-- ============================================
CREATE TABLE IF NOT EXISTS recipes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre          TEXT NOT NULL,
    palabras_clave  TEXT,
    categoria       TEXT CHECK(categoria IN ('desayuno_merienda', 'almuerzo_cena', 'ambas')),
    created_by      INTEGER,    -- auth user_id of creator
    legacy_id       INTEGER,    -- original RECETAS.ID for traceability
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recipes_nombre ON recipes(nombre);
CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON recipes(created_by);

-- ============================================
-- NEW: recipe_ingredients (relational)
-- ============================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id           INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    alimento_nombre     TEXT NOT NULL,       -- name from ALIMENTOS table
    alimento_id         INTEGER,             -- optional FK to foods/ALIMENTOS
    medida_tipo         INTEGER DEFAULT 0,   -- 0=Medidacasera1, 1=Medidacasera2
    rol                 TEXT NOT NULL CHECK(rol IN ('base', 'dependiente', 'fijo')),
    base_ingredient_id  INTEGER REFERENCES recipe_ingredients(id),  -- which base this depends on
    ratio               REAL,               -- multiplier relative to base
    tipo_ratio          TEXT CHECK(tipo_ratio IN ('peso', 'medida_casera')),
    cantidad_fija       REAL,               -- for rol='fijo', fixed portion count
    orden               INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
