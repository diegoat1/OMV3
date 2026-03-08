"""
Migration: Create specialist_assignments table in auth.db
Run once to add the table for specialist-patient assignment requests.
"""

import sqlite3
import os

AUTH_DB = os.path.join(os.path.dirname(__file__), 'auth.db')

def migrate():
    conn = sqlite3.connect(AUTH_DB)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS specialist_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            specialist_id INTEGER NOT NULL,
            specialist_name TEXT NOT NULL,
            specialist_role TEXT NOT NULL,
            patient_id INTEGER NOT NULL,
            patient_name TEXT NOT NULL,
            patient_dni TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending_patient',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (specialist_id) REFERENCES users(id),
            FOREIGN KEY (patient_id) REFERENCES users(id)
        )
    """)

    # Index for fast lookups
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_assignments_specialist
        ON specialist_assignments(specialist_id, status)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_assignments_patient
        ON specialist_assignments(patient_id, status)
    """)

    conn.commit()
    conn.close()
    print("specialist_assignments table created successfully in auth.db")


if __name__ == '__main__':
    migrate()
