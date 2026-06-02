#!/usr/bin/env python3
"""
023_load_strength_standards.py  —  P6 / siembra de estándares de fuerza en PA.

Carga src/db/seed/strength_standards_pop.sql en la clinical.db (respeta
DATABASE_DIR para PythonAnywhere). El seed es idempotente (DROP + CREATE +
INSERTs), así que correrlo de nuevo regenera la tabla.

Por qué un seed y no el extractor: extract_strength_standards.py necesita
ReferenceWeb (no viaja al repo). El seed .sql sí se commitea.

Uso:
    python migrations/023_load_strength_standards.py
    DATABASE_DIR=/home/omegamedicina/omv3-data python3 migrations/023_load_strength_standards.py
"""

import os
import sqlite3
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, 'src', 'db', 'seed', 'strength_standards_pop.sql')


def _clinical_path():
    base = os.environ.get('DATABASE_DIR', os.path.join(ROOT, 'src'))
    return os.path.join(base, 'db', 'clinical.db')


def main():
    if not os.path.exists(SEED):
        print(f'[err] no existe el seed {SEED} (corré scripts/gen_strength_seed.py)')
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
        n = conn.execute("SELECT COUNT(*) FROM strength_standards_pop").fetchone()[0]
    finally:
        conn.close()
    print(f'listo. strength_standards_pop cargada: {n} filas en {db}')


if __name__ == '__main__':
    main()
