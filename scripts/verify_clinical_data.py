import sqlite3

conn = sqlite3.connect('src/db/clinical.db')
c = conn.cursor()

# Check Diego in patients
print("=== Diego in patients ===")
c.execute("SELECT id, dni, nombre, sexo, altura, circ_cuello, fecha_nacimiento FROM patients WHERE dni = '37070509' OR nombre LIKE '%Toffaletti%'")
rows = c.fetchall()
for row in rows:
    print(f"  id={row[0]}, dni={row[1]}, nombre={row[2]}, sexo={row[3]}, altura={row[4]}, cuello={row[5]}, fnac={row[6]}")

if rows:
    pid = rows[0][0]
    
    # Check measurements for Diego
    c.execute("SELECT COUNT(*) FROM measurements WHERE patient_id = ?", [pid])
    print(f"\n=== Measurements for patient_id={pid}: {c.fetchone()[0]} ===")
    
    c.execute("SELECT id, fecha, peso, circ_abdomen, circ_cintura, bf_percent, ffmi FROM measurements WHERE patient_id = ? ORDER BY fecha DESC LIMIT 3", [pid])
    for row in c.fetchall():
        print(f"  id={row[0]}, fecha={row[1]}, peso={row[2]}, abd={row[3]}, cin={row[4]}, bf={row[5]}, ffmi={row[6]}")
    
    # Check nutrition_plans
    c.execute("SELECT COUNT(*) FROM nutrition_plans WHERE patient_id = ?", [pid])
    print(f"\n=== Nutrition plans for patient_id={pid}: {c.fetchone()[0]} ===")
    
    # Check goals
    c.execute("SELECT COUNT(*) FROM goals WHERE patient_id = ?", [pid])
    print(f"\n=== Goals for patient_id={pid}: {c.fetchone()[0]} ===")
else:
    print("  NOT FOUND!")

# Check resolve_patient_id logic
print("\n=== Checking resolve_patient_id path ===")
c.execute("SELECT id, dni, nombre FROM patients WHERE nombre = 'Toffaletti, Diego Alejandro'")
row = c.fetchone()
print(f"  By nombre exact match: {row}")

c.execute("SELECT id, dni, nombre FROM patients WHERE dni = '37070509'")
row = c.fetchone()
print(f"  By DNI: {row}")

conn.close()
