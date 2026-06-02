#!/usr/bin/env python3
"""
022_food_optimizer_flags.py

P4 / Nutrición (Fitia): flags de optimizador en el catálogo de alimentos
(ALIMENTOS, en src/Basededatos), validados por Fitia:

    is_not_divisible    INTEGER  -- la porción no se fracciona (ej: 1 huevo)
    is_not_optimizable  INTEGER  -- cantidad fija, el solver no la ajusta
    is_legume           INTEGER  -- legumbre (manejo nutricional específico)

`is_not_divisible` se honra en solve_meal (variable entera). El resto se
persiste/expone para uso futuro. Idempotente.

Uso:
    python migrations/022_food_optimizer_flags.py
    DATABASE_DIR=/home/omegamedicina/omv3-data python3 migrations/022_food_optimizer_flags.py
"""

import os
import sqlite3
import sys


def _db_dir():
    return os.environ.get(
        'DATABASE_DIR',
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'),
    )


COLUMNS = ('is_not_divisible', 'is_not_optimizable', 'is_legume')


def main():
    db_path = os.path.join(_db_dir(), 'Basededatos')
    if not os.path.exists(db_path):
        print(f'[err] no existe {db_path}')
        sys.exit(1)

    conn = sqlite3.connect(db_path)
    try:
        cols = [r[1] for r in conn.execute("PRAGMA table_info(ALIMENTOS)").fetchall()]
        for c in COLUMNS:
            if c in cols:
                print(f'  ~ ALIMENTOS.{c} ya existe')
            else:
                conn.execute(f"ALTER TABLE ALIMENTOS ADD COLUMN {c} INTEGER DEFAULT 0")
                print(f'  + ALIMENTOS.{c} agregada')
        conn.commit()
    finally:
        conn.close()
    print('listo.')


if __name__ == '__main__':
    main()
