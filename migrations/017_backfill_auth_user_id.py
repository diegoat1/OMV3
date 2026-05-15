#!/usr/bin/env python3
"""
017_backfill_auth_user_id.py

Fase 1 del retiro de DNI: para cada fila de clinical.db.patients con
auth_user_id NULL, intentamos resolver el auth.users.id correspondiente vía
auth.db.patient_user_link.patient_dni y lo grabamos.

Uso:
    cd ~/OMV3
    python3 migrations/017_backfill_auth_user_id.py
    # en PA:
    DATABASE_DIR=/home/omegamedicina/omv3-data python3 migrations/017_backfill_auth_user_id.py

Idempotente: no toca filas que ya tienen auth_user_id.
"""

import os
import sqlite3
import sys


def _db_dir():
    return os.environ.get(
        'DATABASE_DIR',
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'),
    )


def main():
    db_dir = _db_dir()
    auth_path = os.path.join(db_dir, 'auth.db')
    clin_path = os.path.join(db_dir, 'db', 'clinical.db')

    if not os.path.exists(auth_path):
        print(f'[err] no existe {auth_path}')
        sys.exit(1)
    if not os.path.exists(clin_path):
        print(f'[err] no existe {clin_path}')
        sys.exit(1)

    print(f'auth.db     : {auth_path}')
    print(f'clinical.db : {clin_path}')

    auth_conn = sqlite3.connect(auth_path)
    auth_conn.row_factory = sqlite3.Row
    clin_conn = sqlite3.connect(clin_path)
    clin_conn.row_factory = sqlite3.Row

    # 1) Snapshot del bridge patient_user_link → mapa dni → user_id
    bridge = {}
    try:
        for row in auth_conn.execute(
            "SELECT user_id, patient_dni FROM patient_user_link"
        ):
            bridge[row['patient_dni']] = row['user_id']
    except sqlite3.OperationalError as e:
        print(f'[warn] patient_user_link no existe en auth.db ({e}); '
              f'no hay bridge para resolver — saliendo')
        return
    print(f'patient_user_link rows: {len(bridge)}')

    # 2) Filas de patients sin auth_user_id
    pending = list(clin_conn.execute(
        "SELECT id, dni, nombre FROM patients WHERE auth_user_id IS NULL"
    ))
    print(f'patients sin auth_user_id: {len(pending)}')

    updated = 0
    unmatched = []
    for p in pending:
        uid = bridge.get(p['dni'])
        if uid is None:
            unmatched.append({'id': p['id'], 'dni': p['dni'], 'nombre': p['nombre']})
            continue
        clin_conn.execute(
            "UPDATE patients SET auth_user_id = ?, "
            "updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [uid, p['id']],
        )
        updated += 1

    clin_conn.commit()
    clin_conn.close()
    auth_conn.close()

    print()
    print('-' * 50)
    print(f'patients backfilled : {updated}')
    print(f'patients sin match  : {len(unmatched)}')
    if unmatched:
        print('  (filas legacy sin link a auth.db — se mantienen vivas '
              'con dni como anchor)')
        for u in unmatched[:10]:
            print(f'    id={u["id"]} dni={u["dni"]} nombre={u["nombre"]!r}')
        if len(unmatched) > 10:
            print(f'    ... y {len(unmatched) - 10} más')


if __name__ == '__main__':
    main()
