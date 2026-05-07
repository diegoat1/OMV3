"""
Migration 007: Training Step 6
Run: python migrations/migrate_007_step6.py

- Creates strength_standards (OMV-57)
- Creates training_programs (OMV-59)
- Extends training_plans_v2 with periodization fields (OMV-61):
    - source_strength_id (already exists in v6 schema, kept for safety)
    - cycle_week INTEGER DEFAULT 1
    - last_advanced_at DATETIME
"""
import os
import sqlite3
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'db', 'clinical.db')
SQL_PATH = os.path.join(os.path.dirname(__file__), '007_training_step6.sql')


def _ensure_columns(conn, table, columns):
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({table})")
    existing = {row[1] for row in cur.fetchall()}
    for name, decl in columns:
        if name not in existing:
            try:
                cur.execute(f"ALTER TABLE {table} ADD COLUMN {name} {decl}")
                print(f"  + {table}.{name}")
            except sqlite3.OperationalError as e:
                print(f"  ! {table}.{name}: {e}")


def migrate():
    print(f"DB: {os.path.abspath(DB_PATH)}")
    if not os.path.exists(DB_PATH):
        print(f"!! DB no existe en {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys=ON")
    cur = conn.cursor()

    # 1) Run SQL script (CREATE TABLE + seeds)
    with open(SQL_PATH, encoding='utf-8') as f:
        script = f.read()
    print("Running 007_training_step6.sql ...")
    cur.executescript(script)

    # 2) Periodization columns on training_plans_v2 (idempotent)
    print("Ensuring periodization columns on training_plans_v2 ...")
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='training_plans_v2'")
    if cur.fetchone():
        _ensure_columns(conn, 'training_plans_v2', [
            ('cycle_week', 'INTEGER DEFAULT 1'),
            ('last_advanced_at', 'DATETIME'),
        ])
    else:
        print("  ! training_plans_v2 no existe; saltando.")

    # 3) Counts
    cur.execute("SELECT COUNT(*) FROM strength_standards")
    print(f"  strength_standards: {cur.fetchone()[0]} filas")
    cur.execute("SELECT COUNT(*) FROM training_programs")
    print(f"  training_programs:  {cur.fetchone()[0]} filas")

    conn.commit()
    conn.close()
    print("OK")


if __name__ == '__main__':
    migrate()
