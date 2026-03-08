import sqlite3

# Check clinical.db tables
print("=== clinical.db tables ===")
conn = sqlite3.connect('src/clinical.db')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in c.fetchall()]
print(tables)

for t in tables:
    c.execute(f"PRAGMA table_info({t})")
    cols = [r[1] for r in c.fetchall()]
    print(f"  {t}: {cols}")
conn.close()

# Check PERFILESTATICO for Diego
print("\n=== Diego in PERFILESTATICO ===")
conn = sqlite3.connect('src/Basededatos')
c = conn.cursor()
c.execute("SELECT * FROM PERFILESTATICO WHERE DNI = '37070509'")
row = c.fetchone()
c.execute("PRAGMA table_info(PERFILESTATICO)")
cols = [r[1] for r in c.fetchall()]
if row:
    for col, val in zip(cols, row):
        print(f"  {col}: {val}")

# Check PERFILDINAMICO for Diego (last record)
print("\n=== Diego in PERFILDINAMICO (last) ===")
c.execute("PRAGMA table_info(PERFILDINAMICO)")
dyn_cols = [r[1] for r in c.fetchall()]
print(f"  Columns: {dyn_cols}")
c.execute("SELECT * FROM PERFILDINAMICO WHERE NOMBRE_APELLIDO = 'Toffaletti, Diego Alejandro' ORDER BY FECHA_REGISTRO DESC LIMIT 1")
row = c.fetchone()
if row:
    for col, val in zip(dyn_cols, row):
        print(f"  {col}: {val}")

# Count records
c.execute("SELECT COUNT(*) FROM PERFILDINAMICO WHERE NOMBRE_APELLIDO = 'Toffaletti, Diego Alejandro'")
print(f"\n  Total PERFILDINAMICO records: {c.fetchone()[0]}")

conn.close()

# Check clinical.db patients for Diego
print("\n=== clinical.db patients for Diego ===")
conn = sqlite3.connect('src/clinical.db')
c = conn.cursor()
if 'patients' in tables:
    c.execute("SELECT * FROM patients WHERE nombre LIKE '%Toffaletti%' OR dni = '37070509'")
    rows = c.fetchall()
    c.execute("PRAGMA table_info(patients)")
    p_cols = [r[1] for r in c.fetchall()]
    for row in rows:
        print(dict(zip(p_cols, row)))
else:
    print("  No patients table!")

# Check measurements
if 'measurements' in tables:
    c.execute("SELECT * FROM measurements ORDER BY id DESC LIMIT 5")
    rows = c.fetchall()
    c.execute("PRAGMA table_info(measurements)")
    m_cols = [r[1] for r in c.fetchall()]
    print(f"\n=== Last 5 measurements ===")
    print(f"  Columns: {m_cols}")
    for row in rows:
        print(f"  {dict(zip(m_cols, row))}")

conn.close()
