"""
Migración de Basededatos (legacy) -> clinical.db (nueva estructura relacional)

Ejecutar desde la raíz del proyecto:
    python src/db/migrate_to_clinical.py

El script:
1. Crea clinical.db con el schema nuevo
2. Migra PERFILESTATICO -> patients
3. Vincula con auth.db (auth_user_id)
4. Migra PERFILDINAMICO -> measurements
5. Migra OBJETIVO -> goals
6. Migra DIETA -> nutrition_plans
7. Migra PLANES_ALIMENTARIOS -> meal_plans
8. Migra FUERZA -> strength_tests
9. Migra PLANES_ENTRENAMIENTO -> training_plans
10. Migra ESTADO_EJERCICIO_USUARIO -> exercise_state
11. Migra catálogos: ALIMENTOS, RECETAS, GRUPOSALIMENTOS
12. Migra MATRIZ_ENTRENAMIENTO, PLAN_BLOQUES_PRESETS, PLAN_BLOQUES_FAVORITOS
13. Genera tabla de mapeo _migration_map
"""

import sqlite3
import os
import sys
import json
from datetime import datetime

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.dirname(SCRIPT_DIR)
LEGACY_DB = os.path.join(SRC_DIR, 'Basededatos')
AUTH_DB = os.path.join(SRC_DIR, 'auth.db')
CLINICAL_DB = os.path.join(SCRIPT_DIR, 'clinical.db')
SCHEMA_SQL = os.path.join(SCRIPT_DIR, 'schema.sql')


def log(msg):
    print(f"  [{datetime.now().strftime('%H:%M:%S')}] {msg}")


def create_clinical_db():
    """Crea clinical.db aplicando schema.sql"""
    if os.path.exists(CLINICAL_DB):
        backup = CLINICAL_DB + f'.bak.{datetime.now().strftime("%Y%m%d_%H%M%S")}'
        os.rename(CLINICAL_DB, backup)
        log(f"Backup anterior: {backup}")

    with open(SCHEMA_SQL, 'r', encoding='utf-8') as f:
        schema = f.read()

    conn = sqlite3.connect(CLINICAL_DB)
    conn.executescript(schema)
    conn.close()
    log("clinical.db creada con schema")


def get_legacy_conn():
    conn = sqlite3.connect(LEGACY_DB)
    conn.row_factory = sqlite3.Row
    return conn


def get_auth_conn():
    if not os.path.exists(AUTH_DB):
        return None
    conn = sqlite3.connect(AUTH_DB)
    conn.row_factory = sqlite3.Row
    return conn


def get_clinical_conn():
    conn = sqlite3.connect(CLINICAL_DB)
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def migrate_patients():
    """PERFILESTATICO -> patients + vinculación con auth.db"""
    log("Migrando patients...")
    legacy = get_legacy_conn()
    clinical = get_clinical_conn()
    auth = get_auth_conn()

    # Build auth lookup: DNI -> auth user_id
    auth_map = {}
    if auth:
        try:
            for row in auth.execute("SELECT id, patient_dni FROM patient_user_link"):
                auth_map[str(row[1])] = row[0]
        except Exception:
            # Try direct users table
            try:
                for row in auth.execute("SELECT id, patient_dni FROM users WHERE patient_dni IS NOT NULL"):
                    auth_map[str(row[1])] = row[0]
            except Exception:
                pass
        auth.close()

    rows = legacy.execute("SELECT * FROM PERFILESTATICO").fetchall()
    cols = [desc[0] for desc in legacy.execute("SELECT * FROM PERFILESTATICO LIMIT 1").description]

    count = 0
    mapping = {}  # NOMBRE_APELLIDO -> patient_id

    for row in rows:
        data = dict(zip(cols, row))
        nombre = data.get('NOMBRE_APELLIDO', '')
        dni = str(data.get('DNI', ''))
        auth_user_id = auth_map.get(dni)

        clinical.execute("""
            INSERT INTO patients (auth_user_id, dni, nombre, email, telefono, sexo,
                                  fecha_nacimiento, altura, circ_cuello, circ_muneca, circ_tobillo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            auth_user_id,
            dni,
            nombre,
            data.get('EMAIL'),
            str(data.get('NUMERO_TELEFONO', '')) if data.get('NUMERO_TELEFONO') else None,
            data.get('SEXO'),
            data.get('FECHA_NACIMIENTO'),
            data.get('ALTURA'),
            data.get('CIRC_CUELLO'),
            data.get('CIRC_MUNECA'),
            data.get('CIRC_TOBILLO'),
        ])
        patient_id = clinical.execute("SELECT last_insert_rowid()").fetchone()[0]
        mapping[nombre] = patient_id

        # Migration map
        clinical.execute("""
            INSERT INTO _migration_map (legacy_nombre_apellido, legacy_dni, new_patient_id)
            VALUES (?, ?, ?)
        """, [nombre, dni, patient_id])

        count += 1

    clinical.commit()
    clinical.close()
    legacy.close()
    log(f"  -> {count} patients migrados")
    return mapping


def migrate_measurements(mapping):
    """PERFILDINAMICO -> measurements"""
    log("Migrando measurements...")
    legacy = get_legacy_conn()
    clinical = get_clinical_conn()

    rows = legacy.execute("SELECT * FROM PERFILDINAMICO ORDER BY FECHA_REGISTRO ASC").fetchall()
    cols = [desc[0] for desc in legacy.execute("SELECT * FROM PERFILDINAMICO LIMIT 1").description]

    count = 0
    skipped = 0

    for row in rows:
        data = dict(zip(cols, row))
        nombre = data.get('NOMBRE_APELLIDO', '')
        patient_id = mapping.get(nombre)

        if not patient_id:
            skipped += 1
            continue

        clinical.execute("""
            INSERT INTO measurements (
                patient_id, fecha, peso, circ_abdomen, circ_cintura, circ_cadera,
                bf_percent, imc, ffmi, peso_graso, peso_magro,
                delta_dias, delta_peso, delta_peso_dia,
                delta_graso, delta_graso_dia, delta_magro, delta_magro_dia,
                delta_peso_cat,
                lbm_loss, lbm_loss_cat, fbm_gain, fbm_gain_cat,
                score_ffmi, score_bf, body_score,
                inc_days, dec_days, total_days,
                pf, pmf, pgf, abdf, cinf, cadf, solver_category
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            patient_id,
            data.get('FECHA_REGISTRO'),
            data.get('PESO'),
            data.get('CIRC_ABD'),
            data.get('CIRC_CIN'),
            data.get('CIRC_CAD'),
            data.get('BF'),
            data.get('IMC'),
            data.get('IMMC'),
            data.get('PESO_GRASO'),
            data.get('PESO_MAGRO'),
            data.get('DELTADIA'),
            data.get('DELTAPESO'),
            data.get('DELTADIAPESO'),
            data.get('DELTAPG'),
            data.get('DELTADIAPG'),
            data.get('DELTAPM'),
            data.get('DELTADIAPM'),
            data.get('DELTAPESOCAT'),
            data.get('LBMLOSS'),
            data.get('LBMLOSSCAT'),
            data.get('FBMGAIN'),
            data.get('FBMGAINCAT'),
            data.get('SCOREIMMC'),
            data.get('SCOREBF'),
            data.get('BODYSCORE'),
            data.get('INCDAYS'),
            data.get('DECDAYS'),
            data.get('DAYS'),
            data.get('PF'),
            data.get('PMF'),
            data.get('PGF'),
            data.get('ABDF'),
            data.get('CINF'),
            data.get('CADF'),
            data.get('SOLVER_CATEGORY'),
        ])
        count += 1

    clinical.commit()
    clinical.close()
    legacy.close()
    log(f"  -> {count} measurements migrados ({skipped} skipped)")


def migrate_goals(mapping):
    """OBJETIVO -> goals"""
    log("Migrando goals...")
    legacy = get_legacy_conn()
    clinical = get_clinical_conn()

    rows = legacy.execute("SELECT * FROM OBJETIVO").fetchall()
    cols = [desc[0] for desc in legacy.execute("SELECT * FROM OBJETIVO LIMIT 1").description]

    count = 0
    skipped = 0

    for row in rows:
        data = dict(zip(cols, row))
        nombre = data.get('NOMBRE_APELLIDO', '')
        patient_id = mapping.get(nombre)

        if not patient_id:
            skipped += 1
            continue

        clinical.execute("""
            INSERT INTO goals (patient_id, goal_ffmi, goal_bf, tipo, activo)
            VALUES (?, ?, ?, 'manual', 1)
        """, [
            patient_id,
            data.get('GOALIMMC'),
            data.get('GOALBF'),
        ])
        count += 1

    clinical.commit()
    clinical.close()
    legacy.close()
    log(f"  -> {count} goals migrados ({skipped} skipped)")


def migrate_nutrition_plans(mapping):
    """DIETA -> nutrition_plans"""
    log("Migrando nutrition_plans...")
    legacy = get_legacy_conn()
    clinical = get_clinical_conn()

    rows = legacy.execute("SELECT * FROM DIETA").fetchall()
    cols = [desc[0] for desc in legacy.execute("SELECT * FROM DIETA LIMIT 1").description]

    count = 0
    skipped = 0

    for row in rows:
        data = dict(zip(cols, row))
        nombre = data.get('NOMBRE_APELLIDO', '')
        patient_id = mapping.get(nombre)

        if not patient_id:
            skipped += 1
            continue

        clinical.execute("""
            INSERT INTO nutrition_plans (
                patient_id, calorias, proteina, grasa, carbohidratos,
                desayuno_p, desayuno_g, desayuno_c,
                media_man_p, media_man_g, media_man_c,
                almuerzo_p, almuerzo_g, almuerzo_c,
                merienda_p, merienda_g, merienda_c,
                media_tar_p, media_tar_g, media_tar_c,
                cena_p, cena_g, cena_c,
                libertad, estrategia, factor_actividad,
                velocidad_cambio, deficit_calorico, disponibilidad_energetica,
                activo, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        """, [
            patient_id,
            data.get('CALORIAS'),
            data.get('PROTEINA'),
            data.get('GRASA'),
            data.get('CH'),
            data.get('DP'), data.get('DG'), data.get('DC'),
            data.get('MMP'), data.get('MMG'), data.get('MMC'),
            data.get('AP'), data.get('AG'), data.get('AC'),
            data.get('MP'), data.get('MG'), data.get('MC'),
            data.get('MTP'), data.get('MTG'), data.get('MTC'),
            data.get('CP'), data.get('CG'), data.get('CC'),
            data.get('LIBERTAD'),
            data.get('ESTRATEGIA'),
            data.get('FACTOR_ACTIVIDAD'),
            data.get('VELOCIDAD_CAMBIO'),
            data.get('DEFICIT_CALORICO'),
            data.get('DISPONIBILIDAD_ENERGETICA'),
            data.get('FECHA_CREACION'),
        ])
        count += 1

    clinical.commit()
    clinical.close()
    legacy.close()
    log(f"  -> {count} nutrition_plans migrados ({skipped} skipped)")


def migrate_meal_plans(mapping):
    """PLANES_ALIMENTARIOS -> meal_plans"""
    log("Migrando meal_plans...")
    legacy = get_legacy_conn()
    clinical = get_clinical_conn()

    try:
        rows = legacy.execute("SELECT * FROM PLANES_ALIMENTARIOS").fetchall()
        cols = [desc[0] for desc in legacy.execute("SELECT * FROM PLANES_ALIMENTARIOS LIMIT 1").description]
    except Exception:
        legacy.close()
        clinical.close()
        log("  -> Tabla PLANES_ALIMENTARIOS no encontrada, skipping")
        return

    count = 0
    skipped = 0

    for row in rows:
        data = dict(zip(cols, row))
        nombre = data.get('NOMBRE_APELLIDO', '')
        patient_id = mapping.get(nombre)

        if not patient_id:
            skipped += 1
            continue

        clinical.execute("""
            INSERT INTO meal_plans (patient_id, tipo, plan_json, activo, total_recetas, comidas_configuradas, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [
            patient_id,
            data.get('TIPO_PLAN', 'recetas'),
            data.get('PLAN_JSON'),
            data.get('ACTIVO', 1),
            data.get('TOTAL_RECETAS'),
            data.get('COMIDAS_CONFIGURADAS'),
            data.get('FECHA_CREACION'),
        ])
        count += 1

    clinical.commit()
    clinical.close()
    legacy.close()
    log(f"  -> {count} meal_plans migrados ({skipped} skipped)")


def build_dni_mapping(mapping):
    """Builds DNI -> patient_id mapping from PERFILESTATICO"""
    legacy = get_legacy_conn()
    rows = legacy.execute("SELECT NOMBRE_APELLIDO, DNI FROM PERFILESTATICO").fetchall()
    legacy.close()

    dni_map = {}
    for row in rows:
        nombre = row[0]
        dni = str(row[1])
        patient_id = mapping.get(nombre)
        if patient_id:
            dni_map[dni] = patient_id
    return dni_map


def migrate_strength(mapping):
    """FUERZA -> strength_tests (uses user_id=DNI)"""
    log("Migrando strength_tests...")
    legacy = get_legacy_conn()
    clinical = get_clinical_conn()

    dni_map = build_dni_mapping(mapping)

    try:
        rows = legacy.execute("SELECT * FROM FUERZA").fetchall()
        cols = [desc[0] for desc in legacy.execute("SELECT * FROM FUERZA LIMIT 1").description]
    except Exception:
        legacy.close()
        clinical.close()
        log("  -> Tabla FUERZA no encontrada, skipping")
        return

    count = 0
    skipped = 0

    for row in rows:
        data = dict(zip(cols, row))
        user_id_dni = str(data.get('user_id', ''))
        patient_id = dni_map.get(user_id_dni)

        if not patient_id:
            skipped += 1
            continue

        clinical.execute("""
            INSERT INTO strength_tests (
                patient_id, fecha, edad, bodyweight, sexo, unit_system, round_to,
                total_score, score_class, symmetry_score, wilks, powerlifting_total,
                strongest_lift, weakest_lift, strongest_muscles, weakest_muscles,
                lift_inputs_json, lifts_results_json, categories_results_json,
                muscle_groups_json, standards_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            patient_id,
            data.get('fecha_analisis'),
            data.get('age'),
            data.get('bodyweight'),
            data.get('sex'),
            data.get('unit_system'),
            data.get('round_calculations_to'),
            data.get('total_score'),
            data.get('score_class'),
            data.get('symmetry_score'),
            data.get('powerlifting_wilks'),
            data.get('powerlifting_total'),
            data.get('strongest_lift_name'),
            data.get('weakest_lift_name'),
            data.get('strongest_muscle_groups_names'),
            data.get('weakest_muscle_groups_names'),
            data.get('lift_fields_json'),
            data.get('lifts_results_json'),
            data.get('categories_results_json'),
            data.get('muscle_groups_results_json'),
            data.get('standards_results_json'),
        ])
        count += 1

    clinical.commit()
    clinical.close()
    legacy.close()
    log(f"  -> {count} strength_tests migrados ({skipped} skipped)")


def migrate_training_plans(mapping):
    """PLANES_ENTRENAMIENTO -> training_plans (uses user_id=DNI)"""
    log("Migrando training_plans...")
    legacy = get_legacy_conn()
    clinical = get_clinical_conn()

    dni_map = build_dni_mapping(mapping)

    try:
        rows = legacy.execute("SELECT * FROM PLANES_ENTRENAMIENTO").fetchall()
        cols = [desc[0] for desc in legacy.execute("SELECT * FROM PLANES_ENTRENAMIENTO LIMIT 1").description]
    except Exception:
        legacy.close()
        clinical.close()
        log("  -> Tabla PLANES_ENTRENAMIENTO no encontrada, skipping")
        return

    count = 0
    skipped = 0

    for row in rows:
        data = dict(zip(cols, row))
        user_id_dni = str(data.get('user_id', ''))
        patient_id = dni_map.get(user_id_dni)

        if not patient_id:
            skipped += 1
            continue

        clinical.execute("""
            INSERT INTO training_plans (patient_id, plan_json, total_dias, current_dia, activo, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, [
            patient_id,
            data.get('plan_json'),
            data.get('total_dias'),
            data.get('current_dia'),
            data.get('active', 1),
            data.get('created_date'),
        ])
        count += 1

    clinical.commit()
    clinical.close()
    legacy.close()
    log(f"  -> {count} training_plans migrados ({skipped} skipped)")


def migrate_exercise_state(mapping):
    """ESTADO_EJERCICIO_USUARIO -> exercise_state (uses user_id=DNI)"""
    log("Migrando exercise_state...")
    legacy = get_legacy_conn()
    clinical = get_clinical_conn()

    dni_map = build_dni_mapping(mapping)

    try:
        rows = legacy.execute("SELECT * FROM ESTADO_EJERCICIO_USUARIO").fetchall()
        cols = [desc[0] for desc in legacy.execute("SELECT * FROM ESTADO_EJERCICIO_USUARIO LIMIT 1").description]
    except Exception:
        legacy.close()
        clinical.close()
        log("  -> Tabla ESTADO_EJERCICIO_USUARIO no encontrada, skipping")
        return

    count = 0
    skipped = 0

    for row in rows:
        data = dict(zip(cols, row))
        user_id_dni = str(data.get('user_id', ''))
        patient_id = dni_map.get(user_id_dni)

        if not patient_id:
            skipped += 1
            continue

        clinical.execute("""
            INSERT INTO exercise_state (patient_id, ejercicio, columna, sesion, peso, lastre, last_test_reps, last_test_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            patient_id,
            data.get('ejercicio_nombre'),
            data.get('current_columna'),
            data.get('current_sesion'),
            data.get('current_peso'),
            data.get('lastre_adicional', 0),
            data.get('last_test_reps'),
            data.get('last_test_date'),
        ])
        count += 1

    clinical.commit()
    clinical.close()
    legacy.close()
    log(f"  -> {count} exercise_state migrados ({skipped} skipped)")


def migrate_foods():
    """ALIMENTOS -> foods"""
    log("Migrando foods...")
    legacy = get_legacy_conn()
    clinical = get_clinical_conn()

    rows = legacy.execute("SELECT * FROM ALIMENTOS").fetchall()
    cols = [desc[0] for desc in legacy.execute("SELECT * FROM ALIMENTOS LIMIT 1").description]

    count = 0
    for row in rows:
        data = dict(zip(cols, row))
        clinical.execute("""
            INSERT INTO foods (nombre, nombre_corto, proteina, grasa, carbohidratos, fibra,
                               porcion1_desc, porcion1_g, porcion2_desc, porcion2_g)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            data.get('Largadescripcion'),
            data.get('Cortadescripcion') if 'Cortadescripcion' in data else data.get('Largadescripcion'),
            data.get('P', 0),
            data.get('G', 0),
            data.get('CH', 0),
            data.get('F', 0),
            data.get('Medidacasera1'),
            data.get('Gramo1') if 'Gramo1' in data else data.get('Gramosmedida1'),
            data.get('Medidacasera2'),
            data.get('Gramo2') if 'Gramo2' in data else data.get('Gramosmedida2'),
        ])
        count += 1

    clinical.commit()
    clinical.close()
    legacy.close()
    log(f"  -> {count} foods migrados")


def migrate_recipes():
    """RECETAS -> recipes"""
    log("Migrando recipes...")
    legacy = get_legacy_conn()
    clinical = get_clinical_conn()

    rows = legacy.execute("SELECT * FROM RECETAS").fetchall()
    cols = [desc[0] for desc in legacy.execute("SELECT * FROM RECETAS LIMIT 1").description]

    count = 0
    for row in rows:
        data = dict(zip(cols, row))

        # RECETAS tiene columnas: ID, NOMBRERECETA, ALIIND1, ALIIND2, ALIIND3, ALIDEP1..ALIDEP10
        # Buscar columnas de ingredientes dinámicamente
        var_cols = sorted([c for c in cols if c.startswith('ALIIND')])
        dep_cols = sorted([c for c in cols if c.startswith('ALIDEP')])

        vars_list = [data.get(c) for c in var_cols[:3]]
        deps_list = [data.get(c) for c in dep_cols[:10]]

        # Pad to expected length
        while len(vars_list) < 3:
            vars_list.append(None)
        while len(deps_list) < 10:
            deps_list.append(None)

        clinical.execute("""
            INSERT INTO recipes (nombre, ingrediente_var1, ingrediente_var2, ingrediente_var3,
                                 ingrediente_dep1, ingrediente_dep2, ingrediente_dep3, ingrediente_dep4,
                                 ingrediente_dep5, ingrediente_dep6, ingrediente_dep7, ingrediente_dep8,
                                 ingrediente_dep9, ingrediente_dep10)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [data.get('NOMBRERECETA')] + vars_list + deps_list)
        count += 1

    clinical.commit()
    clinical.close()
    legacy.close()
    log(f"  -> {count} recipes migrados")


def migrate_food_groups():
    """GRUPOSALIMENTOS -> food_groups"""
    log("Migrando food_groups...")
    legacy = get_legacy_conn()
    clinical = get_clinical_conn()

    rows = legacy.execute("SELECT * FROM GRUPOSALIMENTOS").fetchall()
    cols = [desc[0] for desc in legacy.execute("SELECT * FROM GRUPOSALIMENTOS LIMIT 1").description]

    count = 0
    for row in rows:
        data = dict(zip(cols, row))

        clinical.execute("""
            INSERT INTO food_groups (
                categoria, descripcion, porcion, proteina, grasas_totales, carbohidratos,
                fibra, calcio, hierro, magnesio, fosforo, potasio, sodio, zinc,
                cobre, manganeso, selenio, vit_c, tiamina, riboflavina, niacina,
                ac_pantotenico, vit_b6, folatos, colina, vit_b12, vit_a_rae, retinol,
                betacaroteno, vit_e, vit_d, vit_k, grasas_sat, grasas_mono, grasas_poli,
                grasas_trans, colesterol, omega3_epa, omega3_dha, omega3_ala,
                omega6_la, omega6_aa, calorias, agua, cenizas, alcohol
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            data.get('CATEGORIA'),
            data.get('DESCRIPCION'),
            data.get('PORCION', 100),
            data.get('PROTEINA', 0),
            data.get('GRASAS_TOTALES', 0),
            data.get('CARBOHIDRATOS', 0),
            data.get('FIBRA', 0),
            data.get('CALCIO', 0),
            data.get('HIERRO', 0),
            data.get('MAGNESIO', 0),
            data.get('FOSFORO', 0),
            data.get('POTASIO', 0),
            data.get('SODIO', 0),
            data.get('ZINC', 0),
            data.get('COBRE', 0),
            data.get('MANGANESO', 0),
            data.get('SELENIO', 0),
            data.get('VIT_C', 0),
            data.get('TIAMINA', 0),
            data.get('RIBOFLAVINA', 0),
            data.get('NIACINA', 0),
            data.get('AC_PANTOTENICO', 0),
            data.get('VIT_B6', 0),
            data.get('FOLATOS', 0),
            data.get('COLINA', 0),
            data.get('VIT_B12', 0),
            data.get('VIT_A_RAE', 0),
            data.get('RETINOL', 0),
            data.get('BETACAROTENO', 0),
            data.get('VIT_E', 0),
            data.get('VIT_D', 0),
            data.get('VIT_K', 0),
            data.get('GRASAS_SAT', 0),
            data.get('GRASAS_MONO', 0),
            data.get('GRASAS_POLI', 0),
            data.get('GRASAS_TRANS', 0),
            data.get('COLESTEROL', 0),
            data.get('OMEGA3_EPA', 0),
            data.get('OMEGA3_DHA', 0),
            data.get('OMEGA3_ALA', 0),
            data.get('OMEGA6_LA', 0),
            data.get('OMEGA6_AA', 0),
            data.get('CALORIAS', 0),
            data.get('AGUA', 0),
            data.get('CENIZAS', 0),
            data.get('ALCOHOL', 0),
        ])
        count += 1

    clinical.commit()
    clinical.close()
    legacy.close()
    log(f"  -> {count} food_groups migrados")


def migrate_training_matrix():
    """MATRIZ_ENTRENAMIENTO -> training_matrix"""
    log("Migrando training_matrix...")
    legacy = get_legacy_conn()
    clinical = get_clinical_conn()

    try:
        rows = legacy.execute("SELECT * FROM MATRIZ_ENTRENAMIENTO").fetchall()
        cols = [desc[0] for desc in legacy.execute("SELECT * FROM MATRIZ_ENTRENAMIENTO LIMIT 1").description]
    except Exception:
        legacy.close()
        clinical.close()
        log("  -> Tabla MATRIZ_ENTRENAMIENTO no encontrada, skipping")
        return

    count = 0
    for row in rows:
        data = dict(zip(cols, row))
        clinical.execute("""
            INSERT INTO training_matrix (matriz_json)
            VALUES (?)
        """, [data.get('matriz_json')])
        count += 1

    clinical.commit()
    clinical.close()
    legacy.close()
    log(f"  -> {count} training_matrix migrados")


def migrate_block_presets():
    """PLAN_BLOQUES_PRESETS -> block_presets"""
    log("Migrando block_presets...")
    legacy = get_legacy_conn()
    clinical = get_clinical_conn()

    try:
        rows = legacy.execute("SELECT * FROM PLAN_BLOQUES_PRESETS").fetchall()
        cols = [desc[0] for desc in legacy.execute("SELECT * FROM PLAN_BLOQUES_PRESETS LIMIT 1").description]
    except Exception:
        legacy.close()
        clinical.close()
        log("  -> Tabla PLAN_BLOQUES_PRESETS no encontrada, skipping")
        return

    count = 0
    for row in rows:
        data = dict(zip(cols, row))
        clinical.execute("""
            INSERT INTO block_presets (comida, tipo_preset, nombre_preset, proteina_pct, grasa_pct, carbohidratos_pct, descripcion)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [
            data.get('comida'),
            data.get('tipo_preset'),
            data.get('nombre_preset'),
            data.get('proteina_pct'),
            data.get('grasa_pct'),
            data.get('carbohidratos_pct'),
            data.get('descripcion'),
        ])
        count += 1

    clinical.commit()
    clinical.close()
    legacy.close()
    log(f"  -> {count} block_presets migrados")


def migrate_block_favorites(mapping):
    """PLAN_BLOQUES_FAVORITOS -> block_favorites"""
    log("Migrando block_favorites...")
    legacy = get_legacy_conn()
    clinical = get_clinical_conn()

    dni_map = build_dni_mapping(mapping)

    try:
        rows = legacy.execute("SELECT * FROM PLAN_BLOQUES_FAVORITOS").fetchall()
        cols = [desc[0] for desc in legacy.execute("SELECT * FROM PLAN_BLOQUES_FAVORITOS LIMIT 1").description]
    except Exception:
        legacy.close()
        clinical.close()
        log("  -> Tabla PLAN_BLOQUES_FAVORITOS no encontrada, skipping")
        return

    count = 0
    skipped = 0
    for row in rows:
        data = dict(zip(cols, row))
        # Try to resolve patient - might use user_dni or nombre_apellido
        patient_id = None
        if data.get('user_dni'):
            patient_id = dni_map.get(str(data.get('user_dni')))
        if not patient_id and data.get('NOMBRE_APELLIDO'):
            patient_id = mapping.get(data.get('NOMBRE_APELLIDO'))

        if not patient_id:
            skipped += 1
            continue

        clinical.execute("""
            INSERT INTO block_favorites (patient_id, comida, nombre, proteina_pct, grasa_pct, carbohidratos_pct)
            VALUES (?, ?, ?, ?, ?, ?)
        """, [
            patient_id,
            data.get('comida'),
            data.get('nombre'),
            data.get('proteina_pct'),
            data.get('grasa_pct'),
            data.get('carbohidratos_pct'),
        ])
        count += 1

    clinical.commit()
    clinical.close()
    legacy.close()
    log(f"  -> {count} block_favorites migrados ({skipped} skipped)")


def verify_migration():
    """Verifica que la migración fue exitosa comparando conteos"""
    log("Verificando migración...")
    legacy = get_legacy_conn()
    clinical = get_clinical_conn()

    checks = [
        ("PERFILESTATICO", "patients"),
        ("PERFILDINAMICO", "measurements"),
        ("OBJETIVO", "goals"),
        ("DIETA", "nutrition_plans"),
        ("ALIMENTOS", "foods"),
        ("RECETAS", "recipes"),
        ("GRUPOSALIMENTOS", "food_groups"),
    ]

    all_ok = True
    for legacy_table, new_table in checks:
        try:
            legacy_count = legacy.execute(f"SELECT COUNT(*) FROM {legacy_table}").fetchone()[0]
            new_count = clinical.execute(f"SELECT COUNT(*) FROM {new_table}").fetchone()[0]
            status = "OK" if legacy_count == new_count else "WARN"
            if legacy_count != new_count:
                all_ok = False
            log(f"  [{status}] {legacy_table}({legacy_count}) -> {new_table}({new_count})")
        except Exception as e:
            log(f"  [ERR] {legacy_table} -> {new_table}: {e}")
            all_ok = False

    # Check tables with DNI-based keys
    dni_checks = [
        ("FUERZA", "strength_tests"),
        ("PLANES_ENTRENAMIENTO", "training_plans"),
        ("ESTADO_EJERCICIO_USUARIO", "exercise_state"),
    ]

    for legacy_table, new_table in dni_checks:
        try:
            legacy_count = legacy.execute(f"SELECT COUNT(*) FROM {legacy_table}").fetchone()[0]
            new_count = clinical.execute(f"SELECT COUNT(*) FROM {new_table}").fetchone()[0]
            status = "OK" if legacy_count == new_count else "WARN"
            if legacy_count != new_count:
                all_ok = False
            log(f"  [{status}] {legacy_table}({legacy_count}) -> {new_table}({new_count})")
        except Exception as e:
            log(f"  [~] {legacy_table} -> {new_table}: {e}")

    # Optional tables
    optional_checks = [
        ("PLANES_ALIMENTARIOS", "meal_plans"),
        ("MATRIZ_ENTRENAMIENTO", "training_matrix"),
    ]

    for legacy_table, new_table in optional_checks:
        try:
            legacy_count = legacy.execute(f"SELECT COUNT(*) FROM {legacy_table}").fetchone()[0]
            new_count = clinical.execute(f"SELECT COUNT(*) FROM {new_table}").fetchone()[0]
            status = "OK" if legacy_count == new_count else "WARN"
            log(f"  [{status}] {legacy_table}({legacy_count}) -> {new_table}({new_count})")
        except Exception as e:
            log(f"  [~] {legacy_table} -> {new_table}: {e}")

    legacy.close()
    clinical.close()

    return all_ok


def main():
    print("=" * 60)
    print("MIGRACION: Basededatos -> clinical.db")
    print("=" * 60)

    # Verify legacy DB exists
    if not os.path.exists(LEGACY_DB):
        print(f"ERROR: No se encontró {LEGACY_DB}")
        sys.exit(1)

    log(f"Legacy DB: {LEGACY_DB}")
    log(f"Auth DB: {AUTH_DB} ({'existe' if os.path.exists(AUTH_DB) else 'NO existe'})")
    log(f"Clinical DB: {CLINICAL_DB}")
    print()

    # Phase 1: Create new DB
    create_clinical_db()
    print()

    # Phase 2: Migrate patient data
    mapping = migrate_patients()
    print()

    # Phase 3: Migrate dependent tables
    migrate_measurements(mapping)
    migrate_goals(mapping)
    migrate_nutrition_plans(mapping)
    migrate_meal_plans(mapping)
    print()

    # Phase 4: Migrate training data (DNI-based)
    migrate_strength(mapping)
    migrate_training_plans(mapping)
    migrate_exercise_state(mapping)
    print()

    # Phase 5: Migrate catalogs
    migrate_foods()
    migrate_recipes()
    migrate_food_groups()
    migrate_training_matrix()
    migrate_block_presets()
    migrate_block_favorites(mapping)
    print()

    # Phase 6: Verify
    print("-" * 60)
    ok = verify_migration()
    print("-" * 60)

    if ok:
        print("\n[OK] MIGRACION COMPLETADA EXITOSAMENTE")
    else:
        print("\n[WARN] MIGRACION COMPLETADA CON DIFERENCIAS (revisar arriba)")

    print(f"\nArchivo generado: {CLINICAL_DB}")
    print(f"Tamaño: {os.path.getsize(CLINICAL_DB) / 1024:.1f} KB")


if __name__ == '__main__':
    main()
