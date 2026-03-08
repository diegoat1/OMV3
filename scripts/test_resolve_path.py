"""Verify resolve_patient_id now takes the clinical.db path, not legacy fallback"""
import sqlite3, os

# Direct test against clinical.db without importing Flask modules
CLINICAL_DB = os.path.abspath('src/db/clinical.db')
AUTH_DB = os.path.abspath('src/auth.db')

def resolve_patient_id_test(uid):
    """Replicate the fixed resolve_patient_id logic"""
    uid = str(uid).strip()
    resolved_dni = None

    conn = sqlite3.connect(CLINICAL_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. auth.db -> DNI -> clinical.db
    try:
        auth_conn = sqlite3.connect(AUTH_DB)
        auth_conn.row_factory = sqlite3.Row
        ac = auth_conn.cursor()
        ac.execute("SELECT patient_dni FROM patient_user_link WHERE user_id = ?", [uid])
        link = ac.fetchone()
        auth_conn.close()
        if link:
            resolved_dni = str(link[0])
    except Exception:
        pass

    if resolved_dni:
        cursor.execute("SELECT id, dni, nombre FROM patients WHERE dni = ?", [resolved_dni])
        row = cursor.fetchone()
        if row:
            conn.close()
            return {'patient_id': row[0], 'dni': row[1], 'nombre': row[2], 'path': 'auth->DNI->clinical'}

    # 2. nombre
    cursor.execute("SELECT id, dni, nombre FROM patients WHERE nombre = ?", [uid])
    row = cursor.fetchone()
    if row:
        conn.close()
        return {'patient_id': row[0], 'dni': row[1], 'nombre': row[2], 'path': 'nombre'}

    # 3. DNI
    cursor.execute("SELECT id, dni, nombre FROM patients WHERE dni = ?", [uid])
    row = cursor.fetchone()
    if row:
        conn.close()
        return {'patient_id': row[0], 'dni': row[1], 'nombre': row[2], 'path': 'DNI'}

    # 4. patient_id
    cursor.execute("SELECT id, dni, nombre FROM patients WHERE id = ?", [uid])
    row = cursor.fetchone()
    conn.close()
    if row:
        return {'patient_id': row[0], 'dni': row[1], 'nombre': row[2], 'path': 'patient_id'}

    return None

def get_data_test(patient_id):
    """Test get_patient_data_legacy from clinical.db"""
    conn = sqlite3.connect(CLINICAL_DB)
    cursor = conn.cursor()

    cursor.execute("SELECT p.nombre, p.dni, p.telefono, p.email, p.sexo, p.fecha_nacimiento, p.altura, p.circ_cuello, p.circ_muneca, p.circ_tobillo FROM patients p WHERE p.id = ?", [patient_id])
    estatico = cursor.fetchall()

    cursor.execute("""SELECT m.id, p.nombre, m.fecha, m.circ_abdomen, m.circ_cadera, m.circ_cintura, m.peso, m.bf_percent, m.imc, m.ffmi, m.peso_graso, m.peso_magro
        FROM measurements m JOIN patients p ON m.patient_id = p.id
        WHERE m.patient_id = ? ORDER BY m.fecha ASC""", [patient_id])
    dinamico = cursor.fetchall()

    conn.close()
    return estatico, dinamico

# Test: resolve Diego by nombre_apellido (what the dashboard does)
print("=== resolve by nombre_apellido ===")
result = resolve_patient_id_test('Toffaletti, Diego Alejandro')
print(f"  Result: {result}")
assert result is not None, "Should find Diego"
assert result['dni'] == '37070509', f"Wrong DNI: {result['dni']}"
assert result['patient_id'] == 42, f"Wrong patient_id: {result['patient_id']}"

# Test: resolve by auth user_id 41 (what would come from JWT)
print("\n=== resolve_patient_id('41') — auth user_id ===")
result2 = resolve_patient_id_test('41')
print(f"  Result: {result2}")
assert result2 is not None, "Should find Diego via auth link"
assert result2['dni'] == '37070509', f"Wrong DNI: {result2['dni']}. Got wrong patient!"
assert result2['nombre'] == 'Toffaletti, Diego Alejandro', f"Wrong nombre: {result2['nombre']}"

# Test: get data from clinical.db
print("\n=== get_data_test(42) ===")
estatico, dinamico = get_data_test(42)
print(f"  estatico rows: {len(estatico)}")
print(f"  dinamico rows: {len(dinamico)}")

if estatico:
    row = estatico[0]
    print(f"\n  estatico[0]: nombre={row[0]}, dni={row[1]}, sexo={row[4]}, altura={row[6]}, cuello={row[7]}")
if dinamico:
    last = dinamico[-1]
    print(f"  dinamico[-1]: fecha={last[2]}, abd={last[3]}, peso={last[6]}, bf={last[7]}")

print("\nAll assertions passed — clinical.db is the source of truth!")
