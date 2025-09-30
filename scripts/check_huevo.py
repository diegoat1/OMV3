import sqlite3

basededatos = sqlite3.connect("src/Basededatos")
cursor = basededatos.cursor()

print("Buscando HUEVO en la base de datos...")
cursor.execute("""
    SELECT Largadescripcion, P, G, CH, 
           Gramo1, Medidacasera1, 
           Gramo2, Medidacasera2 
    FROM ALIMENTOS 
    WHERE Largadescripcion LIKE '%huevo%' OR Largadescripcion LIKE '%Huevo%'
""")

resultados = cursor.fetchall()
for r in resultados:
    print(f"\n[*] {r[0]}")
    print(f"   Macros (por 100g): P={r[1]}g | G={r[2]}g | CH={r[3]}g")
    print(f"   Medida 1: {r[5]} = {r[4]}g")
    print(f"   Medida 2: {r[7]} = {r[6]}g")

basededatos.close()
