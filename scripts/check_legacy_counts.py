import sqlite3

conn = sqlite3.connect('src/Basededatos')
c = conn.cursor()

print("=== Legacy DB table counts ===")
c.execute("SELECT COUNT(*) FROM PERFILESTATICO")
print(f"PERFILESTATICO: {c.fetchone()[0]}")

c.execute("SELECT COUNT(*) FROM PERFILDINAMICO")
print(f"PERFILDINAMICO: {c.fetchone()[0]}")

c.execute("SELECT COUNT(*) FROM DIETA")
print(f"DIETA: {c.fetchone()[0]}")

# Check if OBJETIVO exists
tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print(f"\nAll tables: {tables}")

if 'OBJETIVO' in tables:
    c.execute("SELECT COUNT(*) FROM OBJETIVO")
    print(f"OBJETIVO: {c.fetchone()[0]}")
    c.execute("PRAGMA table_info(OBJETIVO)")
    cols = c.fetchall()
    print(f"OBJETIVO columns: {[col[1] for col in cols]}")
else:
    print("OBJETIVO: table does not exist")

# Check DIETA columns
print("\n=== DIETA columns ===")
c.execute("PRAGMA table_info(DIETA)")
cols = c.fetchall()
for i, col in enumerate(cols):
    print(f"  [{i}] {col[1]} ({col[2]})")

# Check distinct patients in PERFILDINAMICO
c.execute("SELECT COUNT(DISTINCT NOMBRE_APELLIDO) FROM PERFILDINAMICO")
print(f"\nDistinct patients in PERFILDINAMICO: {c.fetchone()[0]}")

conn.close()

# Check clinical.db current state
print("\n=== clinical.db ===")
conn2 = sqlite3.connect('src/db/clinical.db')
c2 = conn2.cursor()
tables2 = [r[0] for r in c2.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print(f"Tables: {tables2}")
conn2.close()
