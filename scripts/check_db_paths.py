import os
import sqlite3

# Simulate what database.py does
db_file = os.path.join(os.path.dirname('src/api/v3/common/database.py'), '..', '..', '..', 'db', 'clinical.db')
resolved = os.path.abspath(db_file)
print(f"Primary path resolves to: {resolved}")
print(f"  exists: {os.path.exists(resolved)}")

# The fallback
fallback = 'src/db/clinical.db'
fallback_abs = os.path.abspath(fallback)
print(f"\nFallback path: {fallback_abs}")
print(f"  exists: {os.path.exists(fallback_abs)}")

# What about from __file__ context?
# When main.py runs from src/, __file__ for database.py would be:
fake_file = os.path.abspath('src/api/v3/common/database.py')
primary = os.path.join(os.path.dirname(fake_file), '..', '..', '..', 'db', 'clinical.db')
primary_abs = os.path.abspath(primary)
print(f"\nFrom __file__ context: {primary_abs}")
print(f"  exists: {os.path.exists(primary_abs)}")

# Try to open it and check if it has data
if os.path.exists(primary_abs):
    conn = sqlite3.connect(primary_abs)
    c = conn.cursor()
    try:
        c.execute("SELECT COUNT(*) FROM patients")
        print(f"  patients count: {c.fetchone()[0]}")
    except Exception as e:
        print(f"  Error: {e}")
    conn.close()

# Also check src/clinical.db (the old wrong path from the previous session)
old_path = os.path.abspath('src/clinical.db')
print(f"\nOld path src/clinical.db: {old_path}")
print(f"  exists: {os.path.exists(old_path)}")
if os.path.exists(old_path):
    conn = sqlite3.connect(old_path)
    c = conn.cursor()
    try:
        tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        print(f"  tables: {tables}")
    except Exception as e:
        print(f"  Error: {e}")
    conn.close()
