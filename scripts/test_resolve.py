"""Test resolve_patient_id directly against clinical.db"""
import sqlite3
import os

CLINICAL_DB = os.path.abspath('src/db/clinical.db')
AUTH_DB = os.path.abspath('src/auth.db')

def test_resolve(uid):
    """Simulate resolve_patient_id using clinical.db only"""
    conn = sqlite3.connect(CLINICAL_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Direct patient_id
    cursor.execute("SELECT id, dni, nombre FROM patients WHERE id = ?", [uid])
    row = cursor.fetchone()
    if row:
        conn.close()
        return f"Found by patient_id: id={row[0]}, dni={row[1]}, nombre={row[2]}"

    # 2. Via auth.db user_id -> DNI
    resolved_dni = None
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
            return f"Found by auth->DNI: id={row[0]}, dni={row[1]}, nombre={row[2]}"

    # 3. Try as DNI
    cursor.execute("SELECT id, dni, nombre FROM patients WHERE dni = ?", [uid])
    row = cursor.fetchone()
    if row:
        conn.close()
        return f"Found by DNI: id={row[0]}, dni={row[1]}, nombre={row[2]}"

    # 4. Try as nombre
    cursor.execute("SELECT id, dni, nombre FROM patients WHERE nombre = ?", [uid])
    row = cursor.fetchone()
    conn.close()
    if row:
        return f"Found by nombre: id={row[0]}, dni={row[1]}, nombre={row[2]}"

    return "NOT FOUND"

# Test with different identifiers
print("=== Testing resolve_patient_id against clinical.db ===\n")

# Get Diego's auth user_id
auth_conn = sqlite3.connect(AUTH_DB)
ac = auth_conn.cursor()
ac.execute("SELECT id, display_name FROM users WHERE email = 'datoffaletti@gmail.com'")
auth_user = ac.fetchone()
print(f"Diego's auth user_id: {auth_user[0]}, display_name: {auth_user[1]}")
ac.execute("SELECT patient_dni FROM patient_user_link WHERE user_id = ?", [auth_user[0]])
link = ac.fetchone()
print(f"Diego's patient_dni from link: {link[0] if link else 'NO LINK'}")
auth_conn.close()

print()
tests = [
    ("By auth user_id", str(auth_user[0])),
    ("By DNI", "37070509"),
    ("By nombre_apellido", "Toffaletti, Diego Alejandro"),
    ("By patient_id 42", "42"),
]

for label, uid in tests:
    result = test_resolve(uid)
    print(f"  {label:30s} -> {result}")
