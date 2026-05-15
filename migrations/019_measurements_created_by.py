#!/usr/bin/env python3
"""
019_measurements_created_by.py

Fase 3 / OMV-31: agregar `created_by_user_id` a clinical.db.measurements
para registrar qué profesional cargó cada medición. Idempotente.

Uso:
    cd ~/OMV3
    python3 migrations/019_measurements_created_by.py
    # PA:
    DATABASE_DIR=/home/omegamedicina/omv3-data python3 migrations/019_measurements_created_by.py
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
    clin_path = os.path.join(_db_dir(), 'db', 'clinical.db')
    if not os.path.exists(clin_path):
        print(f'[err] no existe {clin_path}')
        sys.exit(1)

    conn = sqlite3.connect(clin_path)
    try:
        cols = [r[1] for r in conn.execute("PRAGMA table_info(measurements)").fetchall()]
        if 'created_by_user_id' in cols:
            print('  ~ measurements.created_by_user_id ya existe')
        else:
            conn.execute(
                "ALTER TABLE measurements ADD COLUMN created_by_user_id INTEGER"
            )
            conn.commit()
            print('  + measurements.created_by_user_id agregada')
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_measurements_created_by "
            "ON measurements(created_by_user_id)"
        )
        conn.commit()
    finally:
        conn.close()
    print('listo.')


if __name__ == '__main__':
    main()
