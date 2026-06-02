#!/usr/bin/env python3
"""
025_load_exercise_catalog.py  —  P6 / siembra del catálogo EXRX en PA.

Carga src/db/seed/exercise_catalog.sql en clinical.db (respeta DATABASE_DIR).
Idempotente (DROP + CREATE + INSERTs). El extractor (extract_exrx_exercises.py)
necesita ReferenceWeb (no viaja al repo); el seed .sql sí.

Uso:
    python migrations/025_load_exercise_catalog.py
    DATABASE_DIR=/home/omegamedicina/omv3-data python3 migrations/025_load_exercise_catalog.py
"""

import os
import sqlite3
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, 'src', 'db', 'seed', 'exercise_catalog.sql')


def _clinical_path():
    base = os.environ.get('DATABASE_DIR', os.path.join(ROOT, 'src'))
    return os.path.join(base, 'db', 'clinical.db')


def main():
    if not os.path.exists(SEED):
        print(f'[err] no existe el seed {SEED}')
        sys.exit(1)
    db = _clinical_path()
    if not os.path.exists(db):
        print(f'[err] no existe {db}')
        sys.exit(1)
    with open(SEED, encoding='utf-8') as f:
        script = f.read()
    conn = sqlite3.connect(db)
    try:
        conn.executescript(script)
        conn.commit()
        n = conn.execute("SELECT COUNT(*) FROM exercise_catalog").fetchone()[0]
    finally:
        conn.close()
    print(f'listo. exercise_catalog cargada: {n} filas en {db}')


if __name__ == '__main__':
    main()
