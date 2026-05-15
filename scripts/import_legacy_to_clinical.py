#!/usr/bin/env python3
"""
import_legacy_to_clinical.py

Import incremental de src/Basededatos (PERFILESTATICO/PERFILDINAMICO/DIETA/
OBJETIVO/FUERZA) hacia src/db/clinical.db. Idempotente:
  - patients: nombre como match key. Si no existe, crea con datos legacy.
  - measurements: (patient_id, fecha) como match. INSERT si falta.
  - goals: deja vivos los goals nuevos (status accepted activo); solo
    inserta legacy si el paciente NO tiene ningún goal todavía.
  - nutrition_plans (DIETA): matchea por patient_id + created_at.
  - strength_tests (FUERZA): matchea por patient_id + fecha_analisis.

Uso:
    cd ~/OMV3
    python3 scripts/import_legacy_to_clinical.py [--dry-run]
"""

import argparse
import os
import sqlite3
import sys
from datetime import datetime


def _db_dir():
    return os.environ.get(
        'DATABASE_DIR',
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'),
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true',
                        help='No escribe, solo cuenta lo que insertaría.')
    args = parser.parse_args()

    legacy_path = os.path.join(_db_dir(), 'Basededatos')
    clin_path = os.path.join(_db_dir(), 'db', 'clinical.db')

    if not os.path.exists(legacy_path):
        print(f'[err] no existe {legacy_path}'); sys.exit(1)
    if not os.path.exists(clin_path):
        print(f'[err] no existe {clin_path}'); sys.exit(1)

    print(f'legacy:   {legacy_path}')
    print(f'clinical: {clin_path}')
    print(f'dry-run:  {args.dry_run}')
    print()

    lg = sqlite3.connect(legacy_path)
    lg.row_factory = sqlite3.Row
    cl = sqlite3.connect(clin_path)
    cl.row_factory = sqlite3.Row
    cur = cl.cursor()

    # 1) PATIENTS
    print('=== patients ===')
    cl_existing_names = {
        r['nombre']: r['id']
        for r in cur.execute("SELECT id, nombre FROM patients").fetchall()
    }
    legacy_patients = lg.execute("""
        SELECT NOMBRE_APELLIDO, DNI, NUMERO_TELEFONO, EMAIL, SEXO,
               FECHA_NACIMIENTO, ALTURA, CIRC_CUELLO, CIRC_MUNECA, CIRC_TOBILLO
        FROM PERFILESTATICO
    """).fetchall()
    created_patients = 0
    name_to_clin_id = dict(cl_existing_names)
    for p in legacy_patients:
        name = p['NOMBRE_APELLIDO']
        if name in name_to_clin_id:
            continue
        print(f'  + {name!r} (DNI {p["DNI"]})')
        if not args.dry_run:
            cur.execute("""
                INSERT INTO patients
                (nombre, email, telefono, sexo, fecha_nacimiento, altura,
                 circ_cuello, circ_muneca, circ_tobillo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                name, p['EMAIL'], p['NUMERO_TELEFONO'], p['SEXO'],
                p['FECHA_NACIMIENTO'], p['ALTURA'],
                p['CIRC_CUELLO'], p['CIRC_MUNECA'], p['CIRC_TOBILLO'],
            ])
            name_to_clin_id[name] = cur.lastrowid
            created_patients += 1
    cl.commit()
    print(f'  → {created_patients} pacientes creados')

    # 2) MEASUREMENTS
    print()
    print('=== measurements ===')
    legacy_meas = lg.execute("""
        SELECT NOMBRE_APELLIDO, FECHA_REGISTRO, PESO, BF, IMC, IMMC,
               PESO_GRASO, PESO_MAGRO, CIRC_ABD, CIRC_CIN, CIRC_CAD
        FROM PERFILDINAMICO
    """).fetchall()
    # Existing (patient_id, fecha) en clinical.db
    cl_existing_meas = set(
        (r['patient_id'], str(r['fecha'])[:10])
        for r in cur.execute("SELECT patient_id, fecha FROM measurements").fetchall()
    )
    created_meas = 0
    for m in legacy_meas:
        name = m['NOMBRE_APELLIDO']
        pid = name_to_clin_id.get(name)
        if not pid:
            continue  # patient no existe ni se creó
        fecha = str(m['FECHA_REGISTRO'])[:10]
        key = (pid, fecha)
        if key in cl_existing_meas:
            continue
        if not args.dry_run:
            cur.execute("""
                INSERT INTO measurements
                (patient_id, fecha, peso, bf_percent, imc, ffmi, peso_graso, peso_magro,
                 circ_abdomen, circ_cintura, circ_cadera)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                pid, fecha, m['PESO'], m['BF'], m['IMC'], m['IMMC'],
                m['PESO_GRASO'], m['PESO_MAGRO'],
                m['CIRC_ABD'], m['CIRC_CIN'], m['CIRC_CAD'],
            ])
        cl_existing_meas.add(key)
        created_meas += 1
    cl.commit()
    print(f'  → {created_meas} mediciones creadas')

    # 3) GOALS — solo para pacientes que NO tienen goal todavía
    print()
    print('=== goals ===')
    patients_with_goals = set(
        r['patient_id'] for r in
        cur.execute("SELECT DISTINCT patient_id FROM goals").fetchall()
    )
    legacy_goals = lg.execute(
        "SELECT NOMBRE_APELLIDO, GOALIMMC, GOALBF FROM OBJETIVO"
    ).fetchall()
    created_goals = 0
    for g in legacy_goals:
        name = g['NOMBRE_APELLIDO']
        pid = name_to_clin_id.get(name)
        if not pid:
            continue
        if pid in patients_with_goals:
            continue  # ya tiene goals — no pisar
        if not args.dry_run:
            cur.execute("""
                INSERT INTO goals (patient_id, goal_ffmi, goal_bf,
                                   tipo, source, status, activo)
                VALUES (?, ?, ?, 'manual', 'manual', 'accepted', 1)
            """, [pid, g['GOALIMMC'], g['GOALBF']])
        created_goals += 1
    cl.commit()
    print(f'  → {created_goals} goals creados')

    # 4) NUTRITION_PLANS (DIETA)
    print()
    print('=== nutrition_plans ===')
    cl_plan_cols = [r[1] for r in cur.execute(
        "PRAGMA table_info(nutrition_plans)"
    ).fetchall()]
    legacy_diets = lg.execute("""
        SELECT NOMBRE_APELLIDO, CALORIAS, PROTEINA, GRASA, CH,
               DP, DG, DC, MMP, MMG, MMC, AP, AG, AC, MP, MG, MC,
               MTP, MTG, MTC, CP, CG, CC, LIBERTAD, FECHA_CREACION,
               ESTRATEGIA, VELOCIDAD_CAMBIO, DEFICIT_CALORICO,
               DISPONIBILIDAD_ENERGETICA, FACTOR_ACTIVIDAD
        FROM DIETA
    """).fetchall()
    cl_existing_plans = set(
        (r['patient_id'], str(r['created_at'])[:10])
        for r in cur.execute("SELECT patient_id, created_at FROM nutrition_plans").fetchall()
    )
    created_plans = 0
    for d in legacy_diets:
        name = d['NOMBRE_APELLIDO']
        pid = name_to_clin_id.get(name)
        if not pid:
            continue
        fecha = str(d['FECHA_CREACION'])[:10] if d['FECHA_CREACION'] else None
        key = (pid, fecha)
        if fecha and key in cl_existing_plans:
            continue
        if not args.dry_run:
            cur.execute("""
                INSERT INTO nutrition_plans
                (patient_id, calorias, proteina, grasa, carbohidratos,
                 desayuno_p, desayuno_g, desayuno_c,
                 media_man_p, media_man_g, media_man_c,
                 almuerzo_p, almuerzo_g, almuerzo_c,
                 merienda_p, merienda_g, merienda_c,
                 media_tar_p, media_tar_g, media_tar_c,
                 cena_p, cena_g, cena_c,
                 libertad, created_at, estrategia, velocidad_cambio,
                 deficit_calorico, disponibilidad_energetica, factor_actividad)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        if fecha:
            cl_existing_plans.add(key)
        created_plans += 1
    cl.commit()
    print(f'  → {created_plans} planes creados')

    # 5) STRENGTH_TESTS (FUERZA)
    print()
    print('=== strength_tests ===')
    has_strength = cur.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='strength_tests'"
    ).fetchone() is not None
    if not has_strength:
        print('  ~ tabla strength_tests no existe en clinical.db — salteo')
    else:
        cl_str_cols = [r[1] for r in cur.execute(
            "PRAGMA table_info(strength_tests)"
        ).fetchall()]
        cl_existing_str = set(
            (r['patient_id'], str(r['fecha'])[:10])
            for r in cur.execute("SELECT patient_id, fecha FROM strength_tests").fetchall()
        )
        legacy_fuerza = lg.execute("SELECT * FROM FUERZA").fetchall()
        created_str = 0
        for f in legacy_fuerza:
            fkeys = f.keys()
            name = f['NOMBRE_APELLIDO'] if 'NOMBRE_APELLIDO' in fkeys else None
            if not name:
                continue
            pid = name_to_clin_id.get(name)
            if not pid:
                continue
            fecha = (str(f['FECHA_ANALISIS'])[:10]
                     if 'FECHA_ANALISIS' in fkeys and f['FECHA_ANALISIS']
                     else datetime.now().strftime('%Y-%m-%d'))
            key = (pid, fecha)
            if key in cl_existing_str:
                continue
            created_str += 1
            cl_existing_str.add(key)
        print(f'  → {created_str} tests detectados '
              f'(insert omitido: schema fuerza vario entre versiones — '
              f'usar /strength API en su lugar)')

    cl.close()
    lg.close()
    print()
    print('resumen ↑ ' + ('(dry-run, no se persistió)' if args.dry_run else 'aplicado'))


if __name__ == '__main__':
    main()
