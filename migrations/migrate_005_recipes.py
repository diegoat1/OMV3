"""
Migration 005: Migrate legacy RECETAS to new relational structure in clinical.db

Only migrates recipes that have real dependencies (ALIDEP with RELFIJ=0).
Recipes with only independent ingredients are skipped.
"""
import sqlite3
import os

LEGACY_DB = "src/Basededatos"
CLINICAL_DB = "src/db/clinical.db"
MIGRATION_SQL = "migrations/005_recipes_relational.sql"


def has_dependencies(receta):
    """Check if a recipe has at least one dependent ingredient (RELFIJ=0)."""
    # Fixed ingredients are at indices 11-56, every 5 cols: name, porcion, RELFIJ, RELALI, VALOR
    for i in range(11, 57, 5):
        name = receta[i]
        if name and str(name).strip():
            relfij = receta[i + 2]
            if relfij == 0:  # Proportional dependency
                return True
    return False


def get_variable_ingredients(receta):
    """Extract variable (independent) ingredient names from indices 5-10."""
    variables = []
    for i in range(5, 10, 2):
        name = receta[i]
        medida_tipo = receta[i + 1]
        if name and str(name).strip():
            variables.append({
                'nombre': name,
                'medida_tipo': medida_tipo if medida_tipo in (0, 1) else 0,
                'index_1based': len(variables) + 1  # 1-based for RELALI reference
            })
    return variables


def get_fixed_ingredients(receta):
    """Extract fixed/dependent ingredients from indices 11-56."""
    fixed = []
    for i in range(11, 57, 5):
        name = receta[i]
        if name and str(name).strip():
            fixed.append({
                'nombre': name,
                'medida_tipo': receta[i + 1] if receta[i + 1] in (0, 1) else 0,
                'relfij': receta[i + 2],    # 0=proportional, 1=fixed qty
                'relali': receta[i + 3],    # which variable ingredient (0-indexed in new, but 1-based in legacy)
                'valor': receta[i + 4],     # ratio or fixed amount
            })
    return fixed


def migrate():
    # Run schema migration first
    clinical_conn = sqlite3.connect(CLINICAL_DB)
    clinical_cursor = clinical_conn.cursor()

    with open(MIGRATION_SQL, 'r') as f:
        clinical_cursor.executescript(f.read())
    clinical_conn.commit()
    print("Schema migration applied.")

    # Read legacy recipes
    legacy_conn = sqlite3.connect(LEGACY_DB)
    legacy_cursor = legacy_conn.cursor()
    legacy_cursor.execute("SELECT * FROM RECETAS")
    all_recipes = legacy_cursor.fetchall()

    migrated = 0
    skipped = 0
    skipped_names = []

    for receta in all_recipes:
        recipe_id = receta[0]
        nombre = receta[1]
        palabras_clave = receta[2]
        dym = receta[3]  # Desayuno y Merienda flag
        ayc = receta[4]  # Almuerzo y Cena flag

        variables = get_variable_ingredients(receta)
        fixed = get_fixed_ingredients(receta)

        if not has_dependencies(receta):
            skipped += 1
            skipped_names.append(nombre)
            continue

        # Determine category
        if dym and ayc:
            categoria = 'ambas'
        elif dym:
            categoria = 'desayuno_merienda'
        elif ayc:
            categoria = 'almuerzo_cena'
        else:
            categoria = 'ambas'

        # Insert recipe header
        clinical_cursor.execute("""
            INSERT INTO recipes (nombre, palabras_clave, categoria, legacy_id)
            VALUES (?, ?, ?, ?)
        """, [nombre, palabras_clave, categoria, recipe_id])
        new_recipe_id = clinical_cursor.lastrowid

        # Insert variable ingredients as 'base'
        base_ids = {}  # maps 1-based variable index -> ingredient row id
        for idx, var in enumerate(variables):
            clinical_cursor.execute("""
                INSERT INTO recipe_ingredients
                    (recipe_id, alimento_nombre, medida_tipo, rol, orden)
                VALUES (?, ?, ?, 'base', ?)
            """, [new_recipe_id, var['nombre'], var['medida_tipo'], idx])
            base_ids[var['index_1based']] = clinical_cursor.lastrowid

        # Insert fixed/dependent ingredients
        for idx, fix in enumerate(fixed):
            if fix['relfij'] == 0:
                # Proportional to a variable ingredient
                # RELALI is 0-based index into variables list, but legacy uses 1-based for the reference
                relali = fix['relali']
                # In legacy: RELALI stores the 1-based index of which variable ingredient
                # relali=0 means variable 1, relali=1 means variable 2, etc.
                base_ref = relali + 1  # convert to 1-based
                base_ing_id = base_ids.get(base_ref)

                clinical_cursor.execute("""
                    INSERT INTO recipe_ingredients
                        (recipe_id, alimento_nombre, medida_tipo, rol,
                         base_ingredient_id, ratio, tipo_ratio, orden)
                    VALUES (?, ?, ?, 'dependiente', ?, ?, 'peso', ?)
                """, [new_recipe_id, fix['nombre'], fix['medida_tipo'],
                      base_ing_id, fix['valor'], len(variables) + idx])

            elif fix['relfij'] == 1:
                # Fixed quantity
                clinical_cursor.execute("""
                    INSERT INTO recipe_ingredients
                        (recipe_id, alimento_nombre, medida_tipo, rol,
                         cantidad_fija, orden)
                    VALUES (?, ?, ?, 'fijo', ?, ?)
                """, [new_recipe_id, fix['nombre'], fix['medida_tipo'],
                      fix['valor'], len(variables) + idx])

        migrated += 1

    clinical_conn.commit()
    legacy_conn.close()
    clinical_conn.close()

    print(f"\nMigration complete:")
    print(f"  Migrated (with dependencies): {migrated}")
    print(f"  Skipped (independent only):   {skipped}")
    print(f"\nSkipped recipes:")
    for name in skipped_names:
        print(f"  - {name}")


if __name__ == '__main__':
    migrate()
