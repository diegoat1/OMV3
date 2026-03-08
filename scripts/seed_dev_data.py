"""
Seed script: creates development databases with test data.
Run this in Codespaces or any fresh environment.
"""
import sqlite3
import os
import bcrypt
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(BASE_DIR, 'src')
DB_DIR = os.path.join(SRC_DIR, 'db')

os.makedirs(DB_DIR, exist_ok=True)


def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def create_auth_db():
    """Create src/auth.db with test users."""
    path = os.path.join(SRC_DIR, 'auth.db')
    if os.path.exists(path):
        print(f"  [skip] {path} already exists")
        return
    conn = sqlite3.connect(path)
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'patient',
            display_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active INTEGER DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS patient_user_link (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            patient_dni TEXT NOT NULL UNIQUE,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT,
            detail TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_link_patient_dni ON patient_user_link(patient_dni);
    """)

    pw = hash_password('test1234')
    # Admin / Doctor
    c.execute("INSERT INTO users (email, password_hash, role, display_name) VALUES (?, ?, 'admin', 'Dr. Test Admin')", ('admin@test.com', pw))
    admin_id = c.lastrowid
    # Patient 1
    c.execute("INSERT INTO users (email, password_hash, role, display_name) VALUES (?, ?, 'patient', 'Paciente Test')", ('paciente@test.com', pw))
    patient_id = c.lastrowid
    c.execute("INSERT INTO patient_user_link (user_id, patient_dni) VALUES (?, ?)", (patient_id, '12345678'))
    # Patient 2
    c.execute("INSERT INTO users (email, password_hash, role, display_name) VALUES (?, ?, 'patient', 'Maria Garcia')", ('maria@test.com', pw))
    patient2_id = c.lastrowid
    c.execute("INSERT INTO patient_user_link (user_id, patient_dni) VALUES (?, ?)", (patient2_id, '87654321'))

    conn.commit()
    conn.close()
    print(f"  [ok] {path}")


def create_legacy_db():
    """Create src/Basededatos with minimal legacy tables and test data."""
    path = os.path.join(SRC_DIR, 'Basededatos')
    if os.path.exists(path):
        print(f"  [skip] {path} already exists")
        return
    conn = sqlite3.connect(path)
    c = conn.cursor()

    # Core legacy tables
    c.execute("""CREATE TABLE IF NOT EXISTS USUARIOS (
        NOMBRE_APELLIDO TEXT, DNI TEXT PRIMARY KEY, CONTRASENA TEXT,
        EMAIL TEXT, ADMIN INTEGER DEFAULT 0
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS PERFILESTATICO (
        NOMBRE_APELLIDO VARCHAR(50), DNI INTEGER PRIMARY KEY,
        NUMERO_TELEFONO INTEGER, EMAIL VARCHAR(50), SEXO VARCHAR(20),
        FECHA_NACIMIENTO DATE, ALTURA DECIMAL, CIRC_CUELLO DECIMAL,
        CIRC_MUNECA DECIMAL, CIRC_TOBILLO DECIMAL
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS PERFILDINAMICO (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        NOMBRE_APELLIDO TEXT, DNI TEXT, FECHA DATE,
        PESO REAL, CIRC_ABD REAL, CIRC_CINT REAL, CIRC_CAD REAL,
        BF REAL, IMC REAL, FFMI REAL, PESO_GRASO REAL, PESO_MAGRO REAL
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS DIETA (
        DNI TEXT PRIMARY KEY, CALORIAS REAL, PROTEINA REAL, GRASA REAL, CH REAL,
        DESAYUNO_P REAL, DESAYUNO_G REAL, DESAYUNO_C REAL,
        MEDIA_MAN_P REAL, MEDIA_MAN_G REAL, MEDIA_MAN_C REAL,
        ALMUERZO_P REAL, ALMUERZO_G REAL, ALMUERZO_C REAL,
        MERIENDA_P REAL, MERIENDA_G REAL, MERIENDA_C REAL,
        MEDIA_TAR_P REAL, MEDIA_TAR_G REAL, MEDIA_TAR_C REAL,
        CENA_P REAL, CENA_G REAL, CENA_C REAL,
        LIBERTAD INTEGER DEFAULT 5
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS ALIMENTOS (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        NOMBRE TEXT, NOMBRE_CORTO TEXT,
        PROTEINA REAL, GRASA REAL, CH REAL, FIBRA REAL,
        PORCION1_DESC TEXT, PORCION1_G REAL,
        PORCION2_DESC TEXT, PORCION2_G REAL
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS RECETAS (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        NOMBRE TEXT,
        ING_VAR1 TEXT, CANT_VAR1 REAL, ING_VAR2 TEXT, CANT_VAR2 REAL,
        ING_VAR3 TEXT, CANT_VAR3 REAL,
        ING_FIJ1 TEXT, REL1 TEXT, VAL1 REAL,
        ING_FIJ2 TEXT, REL2 TEXT, VAL2 REAL,
        ING_FIJ3 TEXT, REL3 TEXT, VAL3 REAL,
        ING_FIJ4 TEXT, REL4 TEXT, VAL4 REAL,
        ING_FIJ5 TEXT, REL5 TEXT, VAL5 REAL,
        ING_FIJ6 TEXT, REL6 TEXT, VAL6 REAL,
        ING_FIJ7 TEXT, REL7 TEXT, VAL7 REAL,
        ING_FIJ8 TEXT, REL8 TEXT, VAL8 REAL,
        ING_FIJ9 TEXT, REL9 TEXT, VAL9 REAL,
        ING_FIJ10 TEXT, REL10 TEXT, VAL10 REAL
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS GRUPOSALIMENTOS (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        CATEGORIA TEXT, DESCRIPCION TEXT, PORCION REAL DEFAULT 100,
        PROTEINA REAL DEFAULT 0, GRASAS_TOTALES REAL DEFAULT 0,
        CARBOHIDRATOS REAL DEFAULT 0, FIBRA REAL DEFAULT 0,
        CALORIAS REAL DEFAULT 0
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS FUERZA (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        USER_DNI TEXT, FECHA DATETIME, EDAD INTEGER, BODYWEIGHT REAL,
        SEXO TEXT, UNIT_SYSTEM TEXT, ROUND_TO REAL,
        TOTAL_SCORE REAL, SCORE_CLASS TEXT
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS OBJETIVO (
        DNI TEXT PRIMARY KEY, FFMI_OBJ REAL, BF_OBJ REAL
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS PLANES_ALIMENTARIOS (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        DNI TEXT, TIPO TEXT DEFAULT 'recetas', PLAN_JSON TEXT,
        ACTIVO INTEGER DEFAULT 1, TOTAL_RECETAS INTEGER,
        COMIDAS_CONFIGURADAS INTEGER
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS MATRIZ_ENTRENAMIENTO (
        ID INTEGER PRIMARY KEY AUTOINCREMENT, MATRIZ_JSON TEXT
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS PLANES_ENTRENAMIENTO (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        DNI TEXT, PLAN_JSON TEXT, TOTAL_DIAS INTEGER,
        CURRENT_DIA INTEGER DEFAULT 1, ACTIVO INTEGER DEFAULT 1
    )""")

    # --- Test data ---
    c.execute("INSERT INTO USUARIOS VALUES ('Test Admin', '00000000', ?, 'admin@test.com', 1)", (pw := hash_password('test1234'),))
    c.execute("INSERT INTO USUARIOS VALUES ('Paciente Test', '12345678', ?, 'paciente@test.com', 0)", (hash_password('test1234'),))
    c.execute("INSERT INTO USUARIOS VALUES ('Garcia, Maria', '87654321', ?, 'maria@test.com', 0)", (hash_password('test1234'),))

    c.execute("INSERT INTO PERFILESTATICO VALUES ('Paciente Test', 12345678, 1155001234, 'paciente@test.com', 'M', '1990-05-15', 175, 38, 17, 23)")
    c.execute("INSERT INTO PERFILESTATICO VALUES ('Garcia, Maria', 87654321, 1155005678, 'maria@test.com', 'F', '1995-08-20', 163, 33, 15, 21)")

    c.execute("INSERT INTO PERFILDINAMICO (NOMBRE_APELLIDO, DNI, FECHA, PESO, CIRC_ABD, CIRC_CINT, CIRC_CAD, BF, IMC, FFMI, PESO_GRASO, PESO_MAGRO) VALUES ('Paciente Test', '12345678', '2025-12-01', 80, 85, 82, 95, 18, 26.1, 21.5, 14.4, 65.6)")
    c.execute("INSERT INTO PERFILDINAMICO (NOMBRE_APELLIDO, DNI, FECHA, PESO, CIRC_ABD, CIRC_CINT, CIRC_CAD, BF, IMC, FFMI, PESO_GRASO, PESO_MAGRO) VALUES ('Garcia, Maria', '87654321', '2025-12-01', 58, 72, 68, 92, 24, 21.8, 18.2, 13.9, 44.1)")

    c.execute("INSERT INTO DIETA VALUES ('12345678', 2500, 150, 80, 310, 0.2,0.2,0.2, 0.1,0.1,0.1, 0.25,0.25,0.25, 0.15,0.15,0.15, 0.1,0.1,0.1, 0.2,0.2,0.2, 5)")
    c.execute("INSERT INTO DIETA VALUES ('87654321', 1800, 110, 55, 220, 0.2,0.2,0.2, 0.1,0.1,0.1, 0.25,0.25,0.25, 0.15,0.15,0.15, 0.1,0.1,0.1, 0.2,0.2,0.2, 5)")

    # Sample foods
    foods = [
        ('Pollo pechuga', 'Pollo', 23.1, 1.2, 0, 0, 'Unidad mediana', 150, 'Porción', 100),
        ('Arroz blanco cocido', 'Arroz', 2.7, 0.3, 28.2, 0.4, 'Taza', 158, 'Porción', 100),
        ('Huevo entero', 'Huevo', 12.6, 9.5, 0.7, 0, 'Unidad', 60, None, None),
        ('Banana', 'Banana', 1.1, 0.3, 22.8, 2.6, 'Unidad mediana', 120, None, None),
        ('Avena arrollada', 'Avena', 13.2, 6.5, 67.7, 10.1, 'Taza', 80, 'Cucharada', 15),
        ('Leche descremada', 'Leche desc', 3.4, 0.1, 5.0, 0, 'Vaso', 200, 'Taza', 250),
        ('Pan integral', 'Pan int', 9.0, 1.5, 43.0, 6.0, 'Rebanada', 30, None, None),
        ('Atun en agua', 'Atun', 26.0, 0.8, 0, 0, 'Lata', 170, 'Porción', 100),
        ('Papa cocida', 'Papa', 2.0, 0.1, 17.5, 1.8, 'Unidad mediana', 150, 'Porción', 100),
        ('Manzana', 'Manzana', 0.3, 0.2, 13.8, 2.4, 'Unidad mediana', 180, None, None),
    ]
    c.executemany("INSERT INTO ALIMENTOS (NOMBRE, NOMBRE_CORTO, PROTEINA, GRASA, CH, FIBRA, PORCION1_DESC, PORCION1_G, PORCION2_DESC, PORCION2_G) VALUES (?,?,?,?,?,?,?,?,?,?)", foods)

    # Sample recipe
    c.execute("""INSERT INTO RECETAS (NOMBRE, ING_VAR1, CANT_VAR1, ING_VAR2, CANT_VAR2, ING_VAR3, CANT_VAR3)
                 VALUES ('Pollo con arroz', 'Pollo pechuga', 150, 'Arroz blanco cocido', 200, NULL, NULL)""")

    conn.commit()
    conn.close()
    print(f"  [ok] {path}")


def create_clinical_db():
    """Create src/db/clinical.db from schema.sql + test data."""
    path = os.path.join(DB_DIR, 'clinical.db')
    if os.path.exists(path):
        print(f"  [skip] {path} already exists")
        return
    schema_path = os.path.join(DB_DIR, 'schema.sql')
    conn = sqlite3.connect(path)
    with open(schema_path, 'r') as f:
        conn.executescript(f.read())

    c = conn.cursor()
    # Patients (linked to auth users via auth_user_id)
    c.execute("INSERT INTO patients (auth_user_id, dni, nombre, email, sexo, fecha_nacimiento, altura, circ_cuello, circ_muneca, circ_tobillo) VALUES (2, '12345678', 'Paciente Test', 'paciente@test.com', 'M', '1990-05-15', 175, 38, 17, 23)")
    p1_id = c.lastrowid
    c.execute("INSERT INTO patients (auth_user_id, dni, nombre, email, sexo, fecha_nacimiento, altura, circ_cuello, circ_muneca, circ_tobillo) VALUES (3, '87654321', 'Garcia, Maria', 'maria@test.com', 'F', '1995-08-20', 163, 33, 15, 21)")
    p2_id = c.lastrowid

    # Measurements
    c.execute("INSERT INTO measurements (patient_id, fecha, peso, circ_abdomen, circ_cintura, circ_cadera, bf_percent, imc, ffmi, peso_graso, peso_magro, score_ffmi, score_bf, body_score) VALUES (?, '2025-12-01', 80, 85, 82, 95, 18, 26.1, 21.5, 14.4, 65.6, 75, 70, 72)", (p1_id,))
    c.execute("INSERT INTO measurements (patient_id, fecha, peso, circ_abdomen, circ_cintura, circ_cadera, bf_percent, imc, ffmi, peso_graso, peso_magro, score_ffmi, score_bf, body_score) VALUES (?, '2025-12-01', 58, 72, 68, 92, 24, 21.8, 18.2, 13.9, 44.1, 60, 55, 57)", (p2_id,))

    # Goals
    c.execute("INSERT INTO goals (patient_id, goal_ffmi, goal_bf, goal_peso, tipo, activo) VALUES (?, 22.5, 15, 78, 'manual', 1)", (p1_id,))

    # Nutrition plan
    c.execute("""INSERT INTO nutrition_plans (patient_id, calorias, proteina, grasa, carbohidratos,
        desayuno_p, desayuno_g, desayuno_c, media_man_p, media_man_g, media_man_c,
        almuerzo_p, almuerzo_g, almuerzo_c, merienda_p, merienda_g, merienda_c,
        media_tar_p, media_tar_g, media_tar_c, cena_p, cena_g, cena_c, activo)
        VALUES (?, 2500, 150, 80, 310, 0.2,0.2,0.2, 0.1,0.1,0.1, 0.25,0.25,0.25, 0.15,0.15,0.15, 0.1,0.1,0.1, 0.2,0.2,0.2, 1)""", (p1_id,))

    conn.commit()
    conn.close()
    print(f"  [ok] {path}")


def create_telemed_db():
    """Create src/telemedicina.db with minimal structure."""
    path = os.path.join(SRC_DIR, 'telemedicina.db')
    if os.path.exists(path):
        print(f"  [skip] {path} already exists")
        return
    conn = sqlite3.connect(path)
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS TELEMED_PACIENTES (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            DNI TEXT, NOMBRE TEXT, ESTADO TEXT DEFAULT 'activo',
            CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS TELEMED_SITUACIONES (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            PACIENTE_ID INTEGER, TIPO TEXT, DESCRIPCION TEXT,
            ESTADO TEXT DEFAULT 'abierta',
            CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()
    print(f"  [ok] {path}")


if __name__ == '__main__':
    print("Creating development databases...")
    create_auth_db()
    create_legacy_db()
    create_clinical_db()
    create_telemed_db()
    print("\nDone! Test credentials:")
    print("  Admin:    admin@test.com / test1234")
    print("  Patient:  paciente@test.com / test1234")
    print("  Patient:  maria@test.com / test1234")
