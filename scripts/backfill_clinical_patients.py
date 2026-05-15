#!/usr/bin/env python3
"""
Backfill OMV-89bis: para cada auth.db.users que NO tenga patient_user_link y
NO tenga fila en clinical.db.patients, crea ambos con DNI sintético "u<id>".

Uso:
    cd ~/OMV3
    python3 scripts/backfill_clinical_patients.py

Idempotente: rows existentes se respetan. Solo crea lo que falta.
Imprime un resumen al final.
"""

import os
import sqlite3
import sys


def _db_dir():
    return os.environ.get('DATABASE_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'))


def main():
    # Alinear con src/api/v3/common/database.py:
    #   auth.db     -> <DATABASE_DIR>/auth.db
    #   clinical.db -> <DATABASE_DIR>/db/clinical.db
    db_dir = _db_dir()
    auth_path = os.path.join(db_dir, 'auth.db')
    clin_path = os.path.join(db_dir, 'db', 'clinical.db')

    if not os.path.exists(auth_path):
        print(f'[err] no encuentro {auth_path}')
        sys.exit(1)
    if not os.path.exists(clin_path):
        print(f'[err] no encuentro {clin_path}')
        sys.exit(1)

    print(f'auth.db     : {auth_path}')
    print(f'clinical.db : {clin_path}')
    print()

    auth_conn = sqlite3.connect(auth_path)
    auth_conn.row_factory = sqlite3.Row
    clin_conn = sqlite3.connect(clin_path)
    clin_conn.row_factory = sqlite3.Row

    auth_cur = auth_conn.cursor()
    clin_cur = clin_conn.cursor()

    auth_cur.execute("""
        SELECT u.id, u.email, u.display_name, u.sexo, u.fecha_nacimiento,
               u.telefono, l.patient_dni
        FROM users u LEFT JOIN patient_user_link l ON u.id = l.user_id
        WHERE u.status = 'active'
        ORDER BY u.id
    """)
    users = [dict(r) for r in auth_cur.fetchall()]
    print(f'auth.users activos: {len(users)}')

    created_links = 0
    created_patients = 0
    backfilled = 0
    skipped = 0
    issues = []

    for u in users:
        uid = u['id']
        synthetic_dni = u['patient_dni'] or f'u{uid}'
        display = u['display_name'] or f'Usuario {uid}'
        email = u['email']
        sexo = u.get('sexo')
        fecha_nac = u.get('fecha_nacimiento')
        telefono = u.get('telefono')

        # 1) Asegurar patient_user_link
        if not u['patient_dni']:
            try:
                auth_cur.execute(
                    "INSERT OR IGNORE INTO patient_user_link (user_id, patient_dni) VALUES (?, ?)",
                    [uid, synthetic_dni],
                )
                if auth_cur.rowcount > 0:
                    created_links += 1
            except Exception as e:
                issues.append(f'user {uid} link insert: {e}')

        # 2) Asegurar clinical.db.patients
        try:
            clin_cur.execute(
                "SELECT id, sexo, fecha_nacimiento, telefono FROM patients WHERE dni = ?",
                [synthetic_dni],
            )
            existing = clin_cur.fetchone()
            if existing:
                # Backfill de campos vacíos desde auth.db
                sets = []
                vals = []
                if sexo and not existing['sexo']:
                    sets.append('sexo = ?'); vals.append(sexo)
                if fecha_nac and not existing['fecha_nacimiento']:
                    sets.append('fecha_nacimiento = ?'); vals.append(fecha_nac)
                if telefono and not existing['telefono']:
                    sets.append('telefono = ?'); vals.append(telefono)
                if sets:
                    vals.append(existing['id'])
                    clin_cur.execute(
                        f"UPDATE patients SET {', '.join(sets)}, "
                        f"updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        vals,
                    )
                    backfilled += 1
                    print(f'  ~ backfill patient_id={existing["id"]} dni={synthetic_dni} '
                          f'campos={[s.split("=")[0].strip() for s in sets]}')
                else:
                    skipped += 1
                continue
            try:
                clin_cur.execute(
                    "INSERT INTO patients (auth_user_id, dni, nombre, email, sexo, "
                    "                      fecha_nacimiento, telefono) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [uid, synthetic_dni, display, email, sexo, fecha_nac, telefono],
                )
            except sqlite3.OperationalError:
                clin_cur.execute(
                    "INSERT INTO patients (dni, nombre, email, sexo, "
                    "                      fecha_nacimiento, telefono) "
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    [synthetic_dni, display, email, sexo, fecha_nac, telefono],
                )
            created_patients += 1
            print(f'  + creado patient_id={clin_cur.lastrowid} dni={synthetic_dni} nombre={display!r}')
        except Exception as e:
            issues.append(f'user {uid} patient insert: {e}')

    auth_conn.commit()
    clin_conn.commit()
    auth_conn.close()
    clin_conn.close()

    print()
    print('-' * 50)
    print(f'patient_user_link creados      : {created_links}')
    print(f'clinical.patients creados      : {created_patients}')
    print(f'clinical.patients backfill     : {backfilled}')
    print(f'clinical.patients ya completos : {skipped}')
    if issues:
        print('issues:')
        for i in issues:
            print(f'  ! {i}')
    else:
        print('sin errores')


if __name__ == '__main__':
    main()
