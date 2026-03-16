"""
Migration 006: Training v2
Run: python migrations/migrate_006_training.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'db', 'clinical.db')
SQL_PATH = os.path.join(os.path.dirname(__file__), '006_training_v2.sql')

def migrate():
    print(f"DB: {os.path.abspath(DB_PATH)}")
    conn = sqlite3.connect(DB_PATH)

    # Check if already migrated
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='exercises'")
    if cursor.fetchone():
        print("Tables already exist. Checking seed data...")
        cursor.execute("SELECT COUNT(*) FROM exercises")
        count = cursor.fetchone()[0]
        print(f"  exercises: {count} rows")
        cursor.execute("SELECT COUNT(*) FROM progression_templates")
        count = cursor.fetchone()[0]
        print(f"  progression_templates: {count} rows")
        cursor.execute("SELECT COUNT(*) FROM distribution_templates")
        count = cursor.fetchone()[0]
        print(f"  distribution_templates: {count} rows")
        conn.close()
        return

    print(f"Running migration from {SQL_PATH}...")
    with open(SQL_PATH, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())

    # Verify
    cursor = conn.cursor()
    for table in ['exercises', 'progression_templates', 'distribution_templates',
                   'training_plans_v2', 'exercise_progress', 'training_sessions',
                   'session_exercises', 'session_extras']:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"  {table}: {count} rows")

    conn.close()
    print("Migration 006 complete!")

if __name__ == '__main__':
    migrate()
