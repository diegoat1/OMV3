import sqlite3

conn = sqlite3.connect('src/db/clinical.db')
c = conn.cursor()

tables_to_check = ['patients', 'measurements', 'nutrition_plans', 'goals', 'meal_plans']

for table in tables_to_check:
    print(f"\n=== {table} ===")
    c.execute(f"PRAGMA table_info({table})")
    cols = c.fetchall()
    for col in cols:
        # cid, name, type, notnull, dflt_value, pk
        pk = " PK" if col[5] else ""
        nn = " NOT NULL" if col[3] else ""
        dflt = f" DEFAULT {col[4]}" if col[4] is not None else ""
        print(f"  {col[1]:30s} {col[2]:15s}{pk}{nn}{dflt}")
    
    c.execute(f"SELECT COUNT(*) FROM {table}")
    print(f"  Rows: {c.fetchone()[0]}")

conn.close()
