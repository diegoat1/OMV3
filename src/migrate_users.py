"""
Migración de pacientes legacy → auth.db (users + patient_user_link)

Lee PERFILESTATICO del Basededatos legacy y crea:
- Tabla users con email, password_hash (bcrypt del DNI), role
- Tabla patient_user_link vinculando user_id con DNI del paciente

Ejecutar: python src/migrate_users.py
"""

import sqlite3
import bcrypt
import os
import sys
from datetime import datetime

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LEGACY_DB_PATH = os.path.join(BASE_DIR, 'Basededatos')
AUTH_DB_PATH = os.path.join(BASE_DIR, 'auth.db')

# Admin hardcodeado (legacy)
ADMIN_DNI = '37070509'


def create_auth_db():
    """Crea auth.db con las tablas users y patient_user_link."""
    conn = sqlite3.connect(AUTH_DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'patient',
            display_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active INTEGER DEFAULT 1
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patient_user_link (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            patient_dni TEXT NOT NULL UNIQUE,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Índices
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_link_user_id ON patient_user_link(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_link_patient_dni ON patient_user_link(patient_dni)")

    conn.commit()
    conn.close()
    print(f"[OK] auth.db creada en: {AUTH_DB_PATH}")


def migrate_patients():
    """Lee PERFILESTATICO y crea usuarios en auth.db."""
    
    # Verificar que existe la BD legacy
    if not os.path.exists(LEGACY_DB_PATH):
        print(f"[ERROR] No se encontro la BD legacy en: {LEGACY_DB_PATH}")
        return

    # Leer pacientes de PERFILESTATICO
    legacy_conn = sqlite3.connect(LEGACY_DB_PATH)
    legacy_conn.row_factory = sqlite3.Row
    legacy_cursor = legacy_conn.cursor()

    try:
        legacy_cursor.execute("""
            SELECT DNI, NOMBRE_APELLIDO, EMAIL
            FROM PERFILESTATICO
            WHERE EMAIL IS NOT NULL AND EMAIL != ''
        """)
        patients = legacy_cursor.fetchall()
    except sqlite3.OperationalError as e:
        print(f"[ERROR] Error leyendo PERFILESTATICO: {e}")
        legacy_conn.close()
        return

    legacy_conn.close()

    if not patients:
        print("[WARN] No se encontraron pacientes con email en PERFILESTATICO")
        return

    print(f"[INFO] Encontrados {len(patients)} pacientes para migrar")

    # Conectar a auth.db
    auth_conn = sqlite3.connect(AUTH_DB_PATH)
    auth_cursor = auth_conn.cursor()

    migrated = 0
    skipped = 0
    errors = 0

    for p in patients:
        dni = str(p['DNI']).strip()
        email = str(p['EMAIL']).strip().lower()
        nombre = str(p['NOMBRE_APELLIDO']).strip() if p['NOMBRE_APELLIDO'] else ''

        if not email or not dni:
            skipped += 1
            continue

        # Verificar si ya existe
        auth_cursor.execute("SELECT id FROM users WHERE email = ?", [email])
        if auth_cursor.fetchone():
            skipped += 1
            continue

        try:
            # Hash del DNI como contraseña inicial
            password_hash = bcrypt.hashpw(
                dni.encode('utf-8'),
                bcrypt.gensalt(rounds=12)
            ).decode('utf-8')

            # Determinar rol
            role = 'admin' if dni == ADMIN_DNI else 'patient'

            # Insertar usuario
            auth_cursor.execute("""
                INSERT INTO users (email, password_hash, role, display_name, created_at, is_active)
                VALUES (?, ?, ?, ?, ?, 1)
            """, [email, password_hash, role, nombre, datetime.now().isoformat()])

            user_id = auth_cursor.lastrowid

            # Crear vínculo paciente
            auth_cursor.execute("""
                INSERT INTO patient_user_link (user_id, patient_dni)
                VALUES (?, ?)
            """, [user_id, dni])

            migrated += 1
            role_tag = " [ADMIN]" if role == 'admin' else ""
            print(f"  [OK] {nombre} ({email}) -> user_id={user_id}{role_tag}")

        except Exception as e:
            errors += 1
            print(f"  [ERROR] Error con {email}: {e}")

    auth_conn.commit()
    auth_conn.close()

    print(f"\n{'='*50}")
    print(f"Resultado de migracion:")
    print(f"  [OK] Migrados: {migrated}")
    print(f"  [SKIP] Omitidos: {skipped}")
    print(f"  [ERROR] Errores: {errors}")
    print(f"  [DB] auth.db: {AUTH_DB_PATH}")


def verify_migration():
    """Verifica el estado de auth.db después de la migración."""
    if not os.path.exists(AUTH_DB_PATH):
        print("[ERROR] auth.db no existe")
        return

    conn = sqlite3.connect(AUTH_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM users")
    total = cursor.fetchone()['total']

    cursor.execute("SELECT COUNT(*) as admins FROM users WHERE role = 'admin'")
    admins = cursor.fetchone()['admins']

    cursor.execute("SELECT COUNT(*) as patients FROM users WHERE role = 'patient'")
    patients = cursor.fetchone()['patients']

    cursor.execute("SELECT COUNT(*) as links FROM patient_user_link")
    links = cursor.fetchone()['links']

    print(f"\nEstado de auth.db:")
    print(f"  Total usuarios: {total}")
    print(f"  Admins: {admins}")
    print(f"  Pacientes: {patients}")
    print(f"  Vinculos: {links}")

    # Mostrar admin
    cursor.execute("""
        SELECT u.id, u.email, u.role, u.display_name, l.patient_dni
        FROM users u
        LEFT JOIN patient_user_link l ON u.id = l.user_id
        WHERE u.role = 'admin'
    """)
    for admin in cursor.fetchall():
        print(f"\n  [ADMIN] {admin['display_name']} ({admin['email']}) DNI={admin['patient_dni']}")

    conn.close()


if __name__ == '__main__':
    print("Migracion de usuarios legacy -> auth.db\n")
    
    # Paso 1: Crear DB
    create_auth_db()
    
    # Paso 2: Migrar pacientes
    migrate_patients()
    
    # Paso 3: Verificar
    verify_migration()
