import sqlite3

# Conectar a la base de datos
basededatos = sqlite3.connect("src/Basededatos")
cursor = basededatos.cursor()

# Ver la estructura de la tabla
print("=" * 80)
print("ESTRUCTURA DE LA TABLA ALIMENTOS")
print("=" * 80)
cursor.execute("PRAGMA table_info(ALIMENTOS)")
columns = cursor.fetchall()
for col in columns:
    print(f"{col[0]}: {col[1]} - {col[2]} (Nullable: {not col[3]})")

print("\n" + "=" * 80)
print("PRIMEROS 5 ALIMENTOS (Ejemplo)")
print("=" * 80)

# Ver algunos ejemplos de datos
cursor.execute("SELECT * FROM ALIMENTOS LIMIT 5")
alimentos = cursor.fetchall()

for alimento in alimentos:
    print(f"\nAlimento: {alimento}")

print("\n" + "=" * 80)
print("COLUMNAS ESPECÍFICAS DE ALGUNOS ALIMENTOS")
print("=" * 80)

# Ver columnas específicas de manera más legible
cursor.execute("""
    SELECT Largadescripcion, P, G, CH, 
           Medidacasera1, Gramo1, 
           Medidacasera2, Gramo2 
    FROM ALIMENTOS 
    LIMIT 10
""")

resultados = cursor.fetchall()
for r in resultados:
    print(f"\n[*] {r[0]}")
    print(f"   Macros (por 100g): P={r[1]}g | G={r[2]}g | CH={r[3]}g")
    print(f"   Medida 1: {r[4]} = {r[5]}g")
    print(f"   Medida 2: {r[6]} = {r[7]}g")

print("\n" + "=" * 80)
print("TOTAL DE ALIMENTOS EN LA BASE DE DATOS")
print("=" * 80)
cursor.execute("SELECT COUNT(*) FROM ALIMENTOS")
total = cursor.fetchone()[0]
print(f"Total de alimentos: {total}")

basededatos.close()
