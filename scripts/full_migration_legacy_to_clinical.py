#!/usr/bin/env python3
"""
full_migration_legacy_to_clinical.py

Migración COMPLETA de src/Basededatos (schema legacy) → src/db/clinical.db
(schema v3 snake_case).

Vacía las tablas clínicas y vuelca todo desde cero — útil para tomar un
Basededatos exportado del sistema legacy y reproducir el estado clínico
sobre el schema nuevo, sin que la app v3 tenga que seguir leyendo legacy.

Mapeo:
  PERFILESTATICO  → patients         (link auth_user_id por email match)
  PERFILDINAMICO  → measurements     (37 columnas → snake_case)
  DIETA           → nutrition_plans  (30 columnas)
  OBJETIVO        → goals            (tipo='manual', source='manual', status='accepted')
  FUERZA          → strength_tests   (mapeo de columnas snake_case)

NO toca:
  - auth.db (usuarios + assignments quedan intactos)
  - patients_user_link (ya no existe en mi schema)
  - tablas catalog de clinical.db (recipes, foods, recipe_ingredients, etc.)

Uso:
    cd ~/OMV3
    python3 scripts/full_migration_legacy_to_clinical.py [--dry-run]
"""

import argparse
import os
import sqlite3
import sys


def _db_dir():
    return os.environ.get(
        'DATABASE_DIR',
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'),
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    legacy_path = os.path.join(_db_dir(), 'Basededatos')
    auth_path = os.path.join(_db_dir(), 'auth.db')
    clin_path = os.path.join(_db_dir(), 'db', 'clinical.db')

    for p in (legacy_path, auth_path, clin_path):
        if not os.path.exists(p):
            print(f'[err] no existe {p}'); sys.exit(1)

    print(f'legacy:   {legacy_path}')
    print(f'auth:     {auth_path}')
    print(f'clinical: {clin_path}')
    print(f'dry-run:  {args.dry_run}')
    print()

    lg = sqlite3.connect(legacy_path); lg.row_factory = sqlite3.Row
    au = sqlite3.connect(auth_path);   au.row_factory = sqlite3.Row
    cl = sqlite3.connect(clin_path);   cl.row_factory = sqlite3.Row
    cur = cl.cursor()

    # ───────────────── 0) email → auth_user_id ─────────────────
    email_to_uid = {}
    for r in au.execute("SELECT id, email FROM users").fetchall():
        if r['email']:
            email_to_uid[r['email'].strip().lower()] = r['id']
    print(f'auth users: {len(email_to_uid)} con email')

    # ───────────────── 1) Vaciar tablas clínicas ─────────────────
    # Solo las tablas que van a recargarse íntegramente.
    print()
    print('=== vaciando tablas clínicas ===')
    tabs_to_clear = [
        'goals', 'measurements', 'nutrition_plans',
        'strength_tests', 'patients',
    ]
    # roadmaps si existe
    has_roadmaps = cur.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='roadmaps'"
    ).fetchone() is not None
    if has_roadmaps:
        tabs_to_clear.insert(0, 'roadmaps')
    for tbl in tabs_to_clear:
        try:
            n = cur.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0]
            if not args.dry_run:
                cur.execute(f"DELETE FROM {tbl}")
            print(f'  ~ {tbl}: vaciada ({n} filas borradas)')
        except sqlite3.OperationalError as e:
            print(f'  ! {tbl}: {e}')
    if not args.dry_run:
        cl.commit()

    # ───────────────── 2) PERFILESTATICO → patients ─────────────────
    print()
    print('=== patients ===')
    # Detectar si patients aún tiene la columna `dni` (PA pre-migración 018).
    patient_cols = [r[1] for r in cur.execute("PRAGMA table_info(patients)").fetchall()]
    has_dni_col = 'dni' in patient_cols
    if has_dni_col:
        print('  (schema legacy: patients.dni presente — incluyo DNI en el insert)')

    name_to_pid = {}
    legacy_patients = lg.execute("""
        SELECT NOMBRE_APELLIDO, DNI, NUMERO_TELEFONO, EMAIL, SEXO,
               FECHA_NACIMIENTO, ALTURA, CIRC_CUELLO, CIRC_MUNECA, CIRC_TOBILLO
        FROM PERFILESTATICO
    """).fetchall()
    linked_count = 0
    # `patients.auth_user_id` es UNIQUE. Si dos PERFILESTATICO comparten
    # email contra el mismo auth user (raro pero pasa), solo el primero se
    # linkea; el resto queda con auth_user_id NULL.
    used_uids = set()
    used_dnis = set()
    for p in legacy_patients:
        email = (p['EMAIL'] or '').strip().lower()
        auth_uid = email_to_uid.get(email)
        if auth_uid is not None and auth_uid in used_uids:
            print(f'  ! email duplicado {email!r} ya linkeado a auth user {auth_uid}: '
                  f'{p["NOMBRE_APELLIDO"]!r} queda sin link')
            auth_uid = None
        sexo = p['SEXO']
        if sexo and sexo.upper().startswith('MASC'):
            sexo = 'M'
        elif sexo and sexo.upper().startswith('FEM'):
            sexo = 'F'
        elif sexo and sexo.upper() not in ('M', 'F'):
            sexo = None

        # Calcular DNI value para el insert solo si la columna existe.
        # PERFILESTATICO.DNI viene como INTEGER; lo casteamos a string para
        # mantener el patrón que ya usaba el legacy. UNIQUE en patients.dni
        # también es real en el schema PA — deduplicar con un sufijo si dos
        # PERFILESTATICO comparten DNI.
        dni_value = None
        if has_dni_col:
            dni_str = str(p['DNI']) if p['DNI'] is not None else None
            if not dni_str:
                dni_str = f'no-dni-{p["NOMBRE_APELLIDO"]}'
            if dni_str in used_dnis:
                # raro pero defensivo
                suffix = 2
                while f'{dni_str}-{suffix}' in used_dnis:
                    suffix += 1
                dni_str = f'{dni_str}-{suffix}'
            used_dnis.add(dni_str)
            dni_value = dni_str

        if not args.dry_run:
            if has_dni_col:
                cur.execute("""
                    INSERT INTO patients
                    (auth_user_id, dni, nombre, email, telefono, sexo,
                     fecha_nacimiento, altura,
                     circ_cuello, circ_muneca, circ_tobillo)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, [
                    auth_uid, dni_value,
                    p['NOMBRE_APELLIDO'], p['EMAIL'], p['NUMERO_TELEFONO'],
                    sexo, p['FECHA_NACIMIENTO'], p['ALTURA'],
                    p['CIRC_CUELLO'], p['CIRC_MUNECA'], p['CIRC_TOBILLO'],
                ])
            else:
                cur.execute("""
                    INSERT INTO patients
                    (auth_user_id, nombre, email, telefono, sexo,
                     fecha_nacimiento, altura,
                     circ_cuello, circ_muneca, circ_tobillo)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, [
                    auth_uid, p['NOMBRE_APELLIDO'], p['EMAIL'], p['NUMERO_TELEFONO'],
                    sexo, p['FECHA_NACIMIENTO'], p['ALTURA'],
                    p['CIRC_CUELLO'], p['CIRC_MUNECA'], p['CIRC_TOBILLO'],
                ])
            name_to_pid[p['NOMBRE_APELLIDO']] = cur.lastrowid
        if auth_uid:
            linked_count += 1
            used_uids.add(auth_uid)
    cl.commit()
    print(f'  → {len(legacy_patients)} pacientes migrados '
          f'({linked_count} linkeados con auth_user_id por email)')

    if args.dry_run:
        # En dry-run necesitamos un map fake para los siguientes pasos
        for i, p in enumerate(legacy_patients):
            name_to_pid[p['NOMBRE_APELLIDO']] = i + 1

    # ───────────────── 3) PERFILDINAMICO → measurements ─────────────────
    print()
    print('=== measurements ===')
    legacy_meas = lg.execute("SELECT * FROM PERFILDINAMICO").fetchall()
    inserted_m = 0
    skipped_m = 0
    for m in legacy_meas:
        pid = name_to_pid.get(m['NOMBRE_APELLIDO'])
        if not pid:
            skipped_m += 1
            continue
        fecha = str(m['FECHA_REGISTRO'])[:10] if m['FECHA_REGISTRO'] else None
        if not fecha:
            skipped_m += 1
            continue
        if not args.dry_run:
            cur.execute("""
                INSERT INTO measurements (
                    patient_id, fecha,
                    peso, circ_abdomen, circ_cintura, circ_cadera,
                    bf_percent, imc, ffmi, peso_graso, peso_magro,
                    delta_dias, delta_peso, delta_peso_dia,
                    delta_graso, delta_graso_dia, delta_magro, delta_magro_dia,
                    delta_peso_cat, lbm_loss, lbm_loss_cat,
                    fbm_gain, fbm_gain_cat,
                    score_ffmi, score_bf, body_score,
                    inc_days, dec_days, total_days,
                    pf, pmf, pgf, abdf, cinf, cadf, solver_category
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                pid, fecha,
                m['PESO'], m['CIRC_ABD'], m['CIRC_CIN'], m['CIRC_CAD'],
                m['BF'], m['IMC'], m['IMMC'], m['PESO_GRASO'], m['PESO_MAGRO'],
                m['DELTADIA'], m['DELTAPESO'], m['DELTADIAPESO'],
                m['DELTAPG'], m['DELTADIAPG'], m['DELTAPM'], m['DELTADIAPM'],
                m['DELTAPESOCAT'], m['LBMLOSS'], m['LBMLOSSCAT'],
                m['FBMGAIN'], m['FBMGAINCAT'],
                m['SCOREIMMC'], m['SCOREBF'], m['BODYSCORE'],
                m['INCDAYS'], m['DECDAYS'], m['DAYS'],
                m['PF'], m['PMF'], m['PGF'], m['ABDF'], m['CINF'], m['CADF'],
                m['SOLVER_CATEGORY'],
            ])
        inserted_m += 1
    cl.commit()
    print(f'  → {inserted_m} mediciones migradas (skipped {skipped_m} sin paciente/fecha)')

    # ───────────────── 4) DIETA → nutrition_plans ─────────────────
    print()
    print('=== nutrition_plans ===')
    legacy_dietas = lg.execute("SELECT * FROM DIETA").fetchall()
    inserted_d = 0
    skipped_d = 0
    for d in legacy_dietas:
        pid = name_to_pid.get(d['NOMBRE_APELLIDO'])
        if not pid:
            skipped_d += 1
            continue
        if not args.dry_run:
            cur.execute("""
                INSERT INTO nutrition_plans (
                    patient_id, calorias, proteina, grasa, carbohidratos,
                    desayuno_p, desayuno_g, desayuno_c,
                    media_man_p, media_man_g, media_man_c,
                    almuerzo_p, almuerzo_g, almuerzo_c,
                    merienda_p, merienda_g, merienda_c,
                    media_tar_p, media_tar_g, media_tar_c,
                    cena_p, cena_g, cena_c,
                    libertad, created_at, estrategia, velocidad_cambio,
                    deficit_calorico, disponibilidad_energetica, factor_actividad
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                pid, d['CALORIAS'], d['PROTEINA'], d['GRASA'], d['CH'],
                d['DP'], d['DG'], d['DC'],
                d['MMP'], d['MMG'], d['MMC'],
                d['AP'], d['AG'], d['AC'],
                d['MP'], d['MG'], d['MC'],
                d['MTP'], d['MTG'], d['MTC'],
                d['CP'], d['CG'], d['CC'],
                d['LIBERTAD'], d['FECHA_CREACION'], d['ESTRATEGIA'],
                d['VELOCIDAD_CAMBIO'], d['DEFICIT_CALORICO'],
                d['DISPONIBILIDAD_ENERGETICA'], d['FACTOR_ACTIVIDAD'],
            ])
        inserted_d += 1
    cl.commit()
    print(f'  → {inserted_d} planes migrados (skipped {skipped_d})')

    # ───────────────── 5) OBJETIVO → goals ─────────────────
    print()
    print('=== goals ===')
    legacy_obj = lg.execute("SELECT * FROM OBJETIVO").fetchall()
    inserted_g = 0
    for o in legacy_obj:
        pid = name_to_pid.get(o['NOMBRE_APELLIDO'])
        if not pid:
            continue
        if not args.dry_run:
            cur.execute("""
                INSERT INTO goals
                (patient_id, goal_ffmi, goal_bf, tipo, source, status, activo)
                VALUES (?, ?, ?, 'manual', 'manual', 'accepted', 1)
            """, [pid, o['GOALIMMC'], o['GOALBF']])
        inserted_g += 1
    cl.commit()
    print(f'  → {inserted_g} goals migrados')

    # ───────────────── 6) FUERZA → strength_tests ─────────────────
    print()
    print('=== strength_tests ===')
    legacy_fuerza = lg.execute("SELECT * FROM FUERZA").fetchall()
    # user_id en FUERZA es legacy (DNI o nombre); intentamos resolver por nombre
    # via PERFILESTATICO.DNI = FUERZA.user_id.
    dni_to_name = {
        str(r['DNI']): r['NOMBRE_APELLIDO']
        for r in lg.execute("SELECT DNI, NOMBRE_APELLIDO FROM PERFILESTATICO").fetchall()
    }
    inserted_f = 0
    skipped_f = 0
    for f in legacy_fuerza:
        # buscar nombre por DNI (user_id en legacy)
        user_ref = str(f['user_id']) if f['user_id'] is not None else ''
        nombre = dni_to_name.get(user_ref)
        pid = name_to_pid.get(nombre) if nombre else None
        if not pid:
            skipped_f += 1
            continue
        if not args.dry_run:
            cur.execute("""
                INSERT INTO strength_tests (
                    patient_id, fecha, edad, bodyweight, sexo, unit_system, round_to,
                    total_score, score_class, symmetry_score, wilks, powerlifting_total,
                    strongest_lift, weakest_lift, strongest_muscles, weakest_muscles,
                    lift_inputs_json, lifts_results_json, categories_results_json,
                    muscle_groups_json, standards_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                pid, f['fecha_analisis'], f['age'], f['bodyweight'], f['sex'],
                f['unit_system'], f['round_calculations_to'],
                f['total_score'], f['score_class'], f['symmetry_score'],
                f['powerlifting_wilks'], f['powerlifting_total'],
                f['strongest_lift_name'], f['weakest_lift_name'],
                f['strongest_muscle_groups_names'], f['weakest_muscle_groups_names'],
                f['lift_fields_json'], f['lifts_results_json'],
                f['categories_results_json'], f['muscle_groups_results_json'],
                f['standards_results_json'],
            ])
        inserted_f += 1
    cl.commit()
    print(f'  → {inserted_f} strength_tests migrados (skipped {skipped_f})')

    au.close(); lg.close(); cl.close()
    print()
    print('listo.' + (' [dry-run, no se persistió]' if args.dry_run else ''))


if __name__ == '__main__':
    main()
