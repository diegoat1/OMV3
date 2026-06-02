#!/usr/bin/env python3
"""
021_prevention_profile_flags.py

P1 / Prevención (USPSTF): persistir en clinical.db.patients los datos clínicos
que el proxy de prevención necesita y que hasta ahora eran solo toggles runtime
en la pantalla (se perdían al recargar):

    es_fumador, activo_sexualmente, embarazo   (INTEGER 0/1, NULL = sin definir)

Así el profesional (o el propio paciente) los setea una vez y quedan. Idempotente.

Uso:
    python migrations/021_prevention_profile_flags.py
    # PA:
    DATABASE_DIR=/home/omegamedicina/omv3-data python3 migrations/021_prevention_profile_flags.py
"""

import os
import sqlite3
import sys


def _db_dir():
    return os.environ.get(
        'DATABASE_DIR',
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'),
    )


COLUMNS = ('es_fumador', 'activo_sexualmente', 'embarazo')


def main():
    clin_path = os.path.join(_db_dir(), 'db', 'clinical.db')
    if not os.path.exists(clin_path):
        print(f'[err] no existe {clin_path}')
        sys.exit(1)

    conn = sqlite3.connect(clin_path)
    try:
        cols = [r[1] for r in conn.execute("PRAGMA table_info(patients)").fetchall()]
        for c in COLUMNS:
            if c in cols:
                print(f'  ~ patients.{c} ya existe')
            else:
                conn.execute(f"ALTER TABLE patients ADD COLUMN {c} INTEGER")
                print(f'  + patients.{c} agregada')
        conn.commit()
    finally:
        conn.close()
    print('listo.')


if __name__ == '__main__':
    main()
