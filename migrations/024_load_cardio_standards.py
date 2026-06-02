#!/usr/bin/env python3
"""
024_load_cardio_standards.py  —  P6 / siembra de estándares de cardio en PA.

Carga src/db/seed/cardio_standards.sql en la clinical.db (respeta DATABASE_DIR).
Idempotente (DROP + CREATE + INSERTs). Mismo motivo que 023: el extractor
necesita ReferenceWeb (no viaja al repo); el seed .sql sí.

Uso:
    python migrations/024_load_cardio_standards.py
    DATABASE_DIR=/home/omegamedicina/omv3-data python3 migrations/024_load_cardio_standards.py
"""

import os
import sqlite3
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, 'src', 'db', 'seed', 'cardio_standards.sql')


def _clinical_path():
    base = os.environ.get('DATABASE_DIR', os.path.join(ROOT, 'src'))
    return os.path.join(base, 'db', 'clinical.db')


def main():
    if not os.path.exists(SEED):
        print(f'[err] no existe el seed {SEED} (corré scripts/extract_cardio_standards.py + gen)')
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
        n = conn.execute("SELECT COUNT(*) FROM cardio_standards").fetchone()[0]
    finally:
        conn.close()
    print(f'listo. cardio_standards cargada: {n} filas en {db}')


if __name__ == '__main__':
    main()
