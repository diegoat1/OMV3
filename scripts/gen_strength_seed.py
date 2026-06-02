#!/usr/bin/env python3
"""
gen_strength_seed.py  —  genera un seed SQL portable de strength_standards_pop.

La data de fuerza se extrae de ReferenceWeb (scripts/extract_strength_standards.py),
que NO viaja al repo. Para poder sembrar la tabla en PythonAnywhere (donde las
DBs viven en DATABASE_DIR y ReferenceWeb no está), volcamos la tabla a un .sql
portable que sí se commitea y se carga con migrations/023_load_strength_standards.py.

Uso (local, después de correr extract_strength_standards.py):
    python scripts/gen_strength_seed.py
Salida: src/db/seed/strength_standards_pop.sql
"""

import os
import sqlite3

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DB = os.path.join(ROOT, 'src', 'db', 'clinical.db')
OUT = os.path.join(ROOT, 'src', 'db', 'seed', 'strength_standards_pop.sql')

COLS = ['exercise_slug', 'exercise_name', 'sex', 'metric', 'bin',
        'beginner', 'novice', 'intermediate', 'advanced', 'elite', 'unit']


def _sql_val(v):
    if v is None:
        return 'NULL'
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def main():
    conn = sqlite3.connect(SRC_DB)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(f"SELECT {', '.join(COLS)} FROM strength_standards_pop").fetchall()
    conn.close()

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write("-- Seed portable de strength_standards_pop (Strength Level).\n")
        f.write("-- Generado por scripts/gen_strength_seed.py. Idempotente.\n")
        f.write("DROP TABLE IF EXISTS strength_standards_pop;\n")
        f.write("""CREATE TABLE strength_standards_pop (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_slug TEXT NOT NULL,
    exercise_name TEXT,
    sex TEXT NOT NULL,
    metric TEXT NOT NULL,
    bin REAL NOT NULL,
    beginner REAL, novice REAL, intermediate REAL, advanced REAL, elite REAL,
    unit TEXT DEFAULT 'lb'
);\n""")
        f.write("BEGIN TRANSACTION;\n")
        batch = []
        for r in rows:
            vals = '(' + ','.join(_sql_val(r[c]) for c in COLS) + ')'
            batch.append(vals)
            if len(batch) >= 400:
                f.write(f"INSERT INTO strength_standards_pop ({','.join(COLS)}) VALUES\n"
                        + ',\n'.join(batch) + ';\n')
                batch = []
        if batch:
            f.write(f"INSERT INTO strength_standards_pop ({','.join(COLS)}) VALUES\n"
                    + ',\n'.join(batch) + ';\n')
        f.write("COMMIT;\n")
        f.write("CREATE INDEX IF NOT EXISTS idx_ssp_lookup "
                "ON strength_standards_pop(exercise_slug, sex, metric);\n")
    size = os.path.getsize(OUT)
    print(f'listo. {len(rows)} filas -> {OUT} ({size // 1024} KB)')


if __name__ == '__main__':
    main()
