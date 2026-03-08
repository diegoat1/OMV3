"""
Create daily_checkins, symptom_events, and health_index_history tables in clinical.db
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'db', 'clinical.db')
DB_PATH = os.path.abspath(DB_PATH)

DDL = """
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS daily_checkins (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL,
    fumo            BOOLEAN DEFAULT 0,
    alcohol         TEXT CHECK(alcohol IN ('no','poco','moderado','mucho')) DEFAULT 'no',
    actividad_fisica BOOLEAN DEFAULT 0,
    actividad_tipo  TEXT,
    actividad_minutos INTEGER,
    horas_sueno     REAL,
    calidad_sueno   INTEGER CHECK(calidad_sueno BETWEEN 0 AND 10),
    estres          INTEGER CHECK(estres BETWEEN 0 AND 10),
    energia         INTEGER CHECK(energia BETWEEN 0 AND 10),
    animo           INTEGER CHECK(animo BETWEEN 0 AND 10),
    deposicion      BOOLEAN,
    deposicion_veces INTEGER,
    bristol         INTEGER CHECK(bristol BETWEEN 1 AND 7),
    dolor_abdominal BOOLEAN DEFAULT 0,
    sangre_moco     BOOLEAN DEFAULT 0,
    hidratacion_litros REAL,
    hambre_ansiedad INTEGER CHECK(hambre_ansiedad BETWEEN 0 AND 10),
    tomo_medicacion BOOLEAN DEFAULT 0,
    medicacion_detalle TEXT,
    completado      BOOLEAN DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, fecha)
);
CREATE INDEX IF NOT EXISTS idx_checkins_patient_fecha ON daily_checkins(patient_id, fecha);

CREATE TABLE IF NOT EXISTS symptom_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    checkin_id      INTEGER REFERENCES daily_checkins(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL,
    sistema         TEXT NOT NULL CHECK(sistema IN (
        'respiratorio','orl','cardiologico','genitourinario',
        'musculoesqueletico','neurologico','piel','temperatura'
    )),
    descripcion     TEXT,
    intensidad      INTEGER CHECK(intensidad BETWEEN 0 AND 10),
    detalle_json    TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_symptoms_patient_fecha ON symptom_events(patient_id, fecha);

CREATE TABLE IF NOT EXISTS health_index_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL,
    score           REAL NOT NULL,
    comp_corporal   REAL,
    comp_cintura    REAL,
    comp_actividad  REAL,
    comp_sueno      REAL,
    comp_recuperacion REAL,
    comp_digestivo  REAL,
    comp_habitos    REAL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, fecha)
);
CREATE INDEX IF NOT EXISTS idx_health_index_patient_fecha ON health_index_history(patient_id, fecha);
"""

def main():
    print(f"Database: {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("ERROR: clinical.db not found!")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.executescript(DDL)
    conn.close()

    # Verify
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    for table in ['daily_checkins', 'symptom_events', 'health_index_history']:
        c.execute(f"SELECT COUNT(*) FROM {table}")
        print(f"  {table}: OK ({c.fetchone()[0]} rows)")
    conn.close()
    print("Migration complete!")

if __name__ == '__main__':
    main()
