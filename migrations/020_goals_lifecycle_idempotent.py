#!/usr/bin/env python3
"""
020_goals_lifecycle_idempotent.py

Aplica el schema de Fase 4 (goals lifecycle + roadmaps) a clinical.db de
forma idempotente. Reemplaza a 013_goals_lifecycle.sql (que NO era
idempotente: ALTER TABLE ADD COLUMN explota si la columna ya existe).

Cubre OMV-35/36/37/38/39/40/41/42.

Uso:
    cd ~/OMV3
    python3 migrations/020_goals_lifecycle_idempotent.py
    # PA:
    DATABASE_DIR=/home/omegamedicina/omv3-data python3 migrations/020_goals_lifecycle_idempotent.py
"""

import os
import sqlite3
import sys


def _db_dir():
    return os.environ.get(
        'DATABASE_DIR',
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'),
    )


_GOAL_COLUMNS = [
    # (column, ddl)
    ('status',                'TEXT DEFAULT \'accepted\''),
    ('source',                'TEXT DEFAULT \'manual\''),
    ('source_roadmap_id',     'INTEGER REFERENCES roadmaps(id)'),
    ('source_phase_index',    'INTEGER'),
    ('tiempo_estimado_meses', 'REAL'),
    ('fecha_objetivo',        'DATE'),
    ('goal_hombro',           'REAL'),
    ('goal_pecho',            'REAL'),
    ('goal_brazo',            'REAL'),
    ('goal_antebrazo',        'REAL'),
    ('goal_muslo',            'REAL'),
    ('goal_pantorrilla',      'REAL'),
    ('created_by_user_id',    'INTEGER'),
    ('accepted_by_user_id',   'INTEGER'),
    ('previous_goal_id',      'INTEGER REFERENCES goals(id)'),
    ('completed_at',          'DATETIME'),
    ('archived_at',           'DATETIME'),
]


def _has_column(conn, table, column):
    rows = conn.execute(f'PRAGMA table_info({table})').fetchall()
    return any(r[1] == column for r in rows)


def _table_exists(conn, table):
    r = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
        [table],
    ).fetchone()
    return r is not None


def main():
    clin_path = os.path.join(_db_dir(), 'db', 'clinical.db')
    if not os.path.exists(clin_path):
        print(f'[err] no existe {clin_path}')
        sys.exit(1)

    conn = sqlite3.connect(clin_path)
    try:
        conn.execute('PRAGMA foreign_keys=ON')

        # 1) roadmaps (FK target de goals.source_roadmap_id)
        if not _table_exists(conn, 'roadmaps'):
            conn.execute("""
                CREATE TABLE roadmaps (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
                    fases_json      TEXT NOT NULL,
                    total_meses     REAL,
                    ffmi_limite     REAL,
                    bf_esencial     REAL,
                    sexo            TEXT,
                    altura          REAL,
                    peso_inicial    REAL,
                    bf_inicial      REAL,
                    activo          BOOLEAN DEFAULT 1,
                    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.execute("CREATE INDEX idx_roadmaps_patient ON roadmaps(patient_id)")
            conn.execute("CREATE INDEX idx_roadmaps_active  ON roadmaps(patient_id, activo)")
            print('  + roadmaps creada')
        else:
            print('  ~ roadmaps ya existe')

        # 2) goals — columnas faltantes
        added = []
        for col, ddl in _GOAL_COLUMNS:
            if _has_column(conn, 'goals', col):
                continue
            try:
                conn.execute(f'ALTER TABLE goals ADD COLUMN {col} {ddl}')
                added.append(col)
            except sqlite3.OperationalError as e:
                print(f'  ! no se pudo agregar {col}: {e}')
        if added:
            print(f'  + columnas agregadas a goals: {", ".join(added)}')
        else:
            print('  ~ goals ya tenía todas las columnas')

        # 3) Backfill values iniciales para filas existentes
        conn.execute(
            "UPDATE goals SET status='accepted' "
            "WHERE activo = 1 AND (status IS NULL OR status = '')"
        )
        conn.execute(
            "UPDATE goals SET status='archived', "
            "archived_at = COALESCE(archived_at, updated_at, created_at) "
            "WHERE activo = 0 AND (status IS NULL OR status = '')"
        )
        conn.execute(
            "UPDATE goals SET source = 'auto-accepted' "
            "WHERE tipo = 'auto' AND (source IS NULL OR source = '' OR source = 'manual')"
        )
        conn.execute(
            "UPDATE goals SET source = 'manual' "
            "WHERE tipo = 'manual' AND (source IS NULL OR source = '')"
        )

        # 4) Índices
        conn.execute("CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(patient_id, status)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(patient_id, created_at DESC)")

        conn.commit()
    finally:
        conn.close()
    print('listo.')


if __name__ == '__main__':
    main()
