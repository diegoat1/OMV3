"""
Conexiones a base de datos para API v3
"""

import sqlite3
import os

# Rutas de bases de datos
DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'Basededatos')
TELEMED_DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'telemedicina.db')
AUTH_DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'auth.db')
CLINICAL_DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'db', 'clinical.db')

# Rutas alternativas (para compatibilidad)
if not os.path.exists(DATABASE_PATH):
    DATABASE_PATH = 'src/Basededatos'
if not os.path.exists(TELEMED_DATABASE_PATH):
    TELEMED_DATABASE_PATH = 'src/telemedicina.db'
if not os.path.exists(AUTH_DATABASE_PATH):
    AUTH_DATABASE_PATH = 'src/auth.db'
if not os.path.exists(CLINICAL_DATABASE_PATH):
    CLINICAL_DATABASE_PATH = 'src/db/clinical.db'


def get_db_connection(row_factory=None):
    """
    Obtiene una conexión a la base de datos principal.
    
    Args:
        row_factory: Factory para filas (ej: sqlite3.Row para dict-like)
    
    Returns:
        Conexión SQLite
    """
    conn = sqlite3.connect(DATABASE_PATH)
    if row_factory is not None:
        conn.row_factory = row_factory
    return conn


def get_telemed_connection(row_factory=None):
    """
    Obtiene una conexión a la base de datos de telemedicina.
    
    Args:
        row_factory: Factory para filas (ej: sqlite3.Row para dict-like)
    
    Returns:
        Conexión SQLite
    """
    conn = sqlite3.connect(TELEMED_DATABASE_PATH)
    if row_factory is not None:
        conn.row_factory = row_factory
    return conn


def get_auth_connection(row_factory=None):
    """
    Obtiene una conexión a la base de datos de autenticación (auth.db).
    
    Args:
        row_factory: Factory para filas (ej: sqlite3.Row para dict-like)
    
    Returns:
        Conexión SQLite
    """
    conn = sqlite3.connect(AUTH_DATABASE_PATH)
    if row_factory is not None:
        conn.row_factory = row_factory
    return conn


def get_clinical_connection(row_factory=None):
    """
    Obtiene una conexion a la base de datos clinical.db (nueva estructura relacional).
    Todas las tablas usan patients.id como FK.
    """
    conn = sqlite3.connect(CLINICAL_DATABASE_PATH)
    conn.execute("PRAGMA foreign_keys=ON")
    if row_factory is not None:
        conn.row_factory = row_factory
    return conn


def _clinical_has_patients():
    """Check if clinical.db has a patients table with data."""
    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM patients")
        count = cursor.fetchone()[0]
        conn.close()
        return count > 0
    except Exception:
        return False


def resolve_patient_id(user_id_or_name):
    """
    Resolves any user identifier (auth.db numeric ID, DNI, nombre_apellido)
    into a dict with {patient_id, dni, nombre}.

    Lookup order — safest first to avoid ID collisions between auth.db and patients:
    1. Try auth.db: user_id -> patient_dni -> clinical.db (most common path from JWT)
    2. Try clinical.db: nombre (NOMBRE_APELLIDO)
    3. Try clinical.db: DNI
    4. Try clinical.db: direct patient_id (last resort — IDs may collide with auth.db)
    5. FALLBACK: legacy Basededatos (safety net)

    Returns dict {patient_id, dni, nombre} or None.
    """
    if not user_id_or_name:
        return None

    uid = str(user_id_or_name).strip()
    resolved_dni = None

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        # 1. Via auth.db user_id -> DNI -> clinical.db (most reliable for logged-in users)
        try:
            auth_conn = get_auth_connection(sqlite3.Row)
            auth_cursor = auth_conn.cursor()
            auth_cursor.execute("SELECT patient_dni FROM patient_user_link WHERE user_id = ?", [uid])
            link = auth_cursor.fetchone()
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
                return {'patient_id': row[0], 'dni': row[1], 'nombre': row[2]}

        # 2. Try as nombre (NOMBRE_APELLIDO) — used by dashboard endpoint
        cursor.execute("SELECT id, dni, nombre FROM patients WHERE nombre = ?", [uid])
        row = cursor.fetchone()
        if row:
            conn.close()
            return {'patient_id': row[0], 'dni': row[1], 'nombre': row[2]}

        # 3. Try as DNI
        cursor.execute("SELECT id, dni, nombre FROM patients WHERE dni = ?", [uid])
        row = cursor.fetchone()
        if row:
            conn.close()
            return {'patient_id': row[0], 'dni': row[1], 'nombre': row[2]}

        # 4. Direct patient_id (last — avoids auth.db ID collision)
        cursor.execute("SELECT id, dni, nombre FROM patients WHERE id = ?", [uid])
        row = cursor.fetchone()
        conn.close()
        if row:
            return {'patient_id': row[0], 'dni': row[1], 'nombre': row[2]}

    except Exception:
        pass

    # 5. FALLBACK: legacy Basededatos (safety net if clinical.db is somehow empty)
    return _resolve_patient_legacy(uid, resolved_dni)


def _ensure_clinical_patient(dni, nombre):
    """
    Ensure a patient exists in clinical.db. If not, create from legacy PERFILESTATICO.
    Returns the numeric patient_id or None on failure.
    """
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        # Check if already exists
        cursor.execute("SELECT id FROM patients WHERE dni = ?", [str(dni)])
        row = cursor.fetchone()
        if row:
            conn.close()
            return row[0]

        # Read extra fields from legacy
        sexo = None
        altura = None
        fecha_nacimiento = None
        email = None
        telefono = None
        circ_cuello = None
        circ_muneca = None
        circ_tobillo = None
        try:
            legacy_conn = get_db_connection(sqlite3.Row)
            legacy_cursor = legacy_conn.cursor()
            legacy_cursor.execute(
                "SELECT SEXO, ALTURA, FECHA_NACIMIENTO, EMAIL, NUMERO_TELEFONO, "
                "CIRC_CUELLO, CIRC_MUNECA, CIRC_TOBILLO "
                "FROM PERFILESTATICO WHERE DNI = ?", [str(dni)]
            )
            lrow = legacy_cursor.fetchone()
            legacy_conn.close()
            if lrow:
                sexo = lrow['SEXO']
                altura = lrow['ALTURA']
                fecha_nacimiento = lrow['FECHA_NACIMIENTO']
                email = lrow['EMAIL']
                telefono = lrow['NUMERO_TELEFONO']
                circ_cuello = lrow['CIRC_CUELLO']
                circ_muneca = lrow['CIRC_MUNECA']
                circ_tobillo = lrow['CIRC_TOBILLO']
        except Exception:
            pass

        # Insert into clinical.db
        cursor.execute(
            "INSERT INTO patients (dni, nombre, sexo, altura, fecha_nacimiento, email, telefono, "
            "circ_cuello, circ_muneca, circ_tobillo) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [str(dni), nombre, sexo, altura, fecha_nacimiento, email, telefono,
             circ_cuello, circ_muneca, circ_tobillo]
        )
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return new_id

    except Exception:
        return None


def _resolve_patient_legacy(uid, resolved_dni=None):
    """Fallback: resolve patient from legacy Basededatos when clinical.db is empty."""
    try:
        # If we already resolved a DNI via auth.db, try that first
        search_dni = resolved_dni or uid

        # Also try resolving via auth.db if not already done
        if not resolved_dni:
            try:
                auth_conn = get_auth_connection(sqlite3.Row)
                auth_cursor = auth_conn.cursor()
                auth_cursor.execute("SELECT patient_dni FROM patient_user_link WHERE user_id = ?", [uid])
                link = auth_cursor.fetchone()
                auth_conn.close()
                if link:
                    search_dni = str(link[0])
            except Exception:
                pass

        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()

        # Try by DNI
        cursor.execute("SELECT DNI, NOMBRE_APELLIDO FROM PERFILESTATICO WHERE DNI = ?", [search_dni])
        row = cursor.fetchone()
        if not row:
            # Try by NOMBRE_APELLIDO
            cursor.execute("SELECT DNI, NOMBRE_APELLIDO FROM PERFILESTATICO WHERE NOMBRE_APELLIDO = ?", [uid])
            row = cursor.fetchone()
        conn.close()

        if row:
            dni = row['DNI']
            nombre = row['NOMBRE_APELLIDO']
            # Auto-create in clinical.db to get a real numeric patient_id
            patient_id = _ensure_clinical_patient(dni, nombre)
            if patient_id:
                return {'patient_id': patient_id, 'dni': dni, 'nombre': nombre}
            # Fallback: return DNI as patient_id (legacy behavior)
            return {'patient_id': dni, 'dni': dni, 'nombre': nombre}

    except Exception:
        pass

    return None


def resolve_user_identity(user_id_or_name):
    """
    Resolves any user identifier (auth.db numeric ID, DNI, or nombre_apellido)
    into a dict with {dni, nombre_apellido}.

    Lookup order:
    1. Try auth.db: user_id -> patient_dni
    2. Try legacy DB: DNI -> NOMBRE_APELLIDO
    3. Try legacy DB: NOMBRE_APELLIDO directly

    Returns dict {dni, nombre_apellido} or None if not found.
    """
    if not user_id_or_name:
        return None

    uid = str(user_id_or_name).strip()

    # Step 1: If it looks like a numeric auth.db ID, resolve via patient_user_link
    try:
        auth_conn = get_auth_connection(sqlite3.Row)
        auth_cursor = auth_conn.cursor()
        auth_cursor.execute(
            "SELECT l.patient_dni FROM patient_user_link l WHERE l.user_id = ?",
            [uid]
        )
        link = auth_cursor.fetchone()
        auth_conn.close()
        if link:
            uid = link[0]  # Now uid = DNI
    except Exception:
        pass

    # Step 2: Try as DNI in legacy DB
    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT DNI, NOMBRE_APELLIDO FROM PERFILESTATICO WHERE DNI = ?",
            [uid]
        )
        row = cursor.fetchone()
        if row:
            conn.close()
            return {'dni': row[0], 'nombre_apellido': row[1]}

        # Step 3: Try as nombre_apellido
        cursor.execute(
            "SELECT DNI, NOMBRE_APELLIDO FROM PERFILESTATICO WHERE NOMBRE_APELLIDO = ?",
            [uid]
        )
        row = cursor.fetchone()
        conn.close()
        if row:
            return {'dni': row[0], 'nombre_apellido': row[1]}
    except Exception:
        pass

    return None


def dict_factory(cursor, row):
    """
    Factory para convertir filas a diccionarios.
    
    Usage:
        conn = get_db_connection()
        conn.row_factory = dict_factory
    """
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}


def execute_query(query, params=None, fetch_one=False, fetch_all=True, commit=False):
    """
    Ejecuta una query en la base de datos principal.
    
    Args:
        query: SQL query
        params: Parámetros para la query
        fetch_one: Si True, retorna solo una fila
        fetch_all: Si True, retorna todas las filas
        commit: Si True, hace commit después de ejecutar
    
    Returns:
        Resultado de la query o None
    """
    conn = None
    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        if commit:
            conn.commit()
            return cursor.lastrowid
        
        if fetch_one:
            row = cursor.fetchone()
            return dict(row) if row else None
        
        if fetch_all:
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        
        return None
        
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()


def execute_clinical_query(query, params=None, fetch_one=False, fetch_all=True, commit=False):
    """
    Ejecuta una query en clinical.db.
    """
    conn = None
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)

        if commit:
            conn.commit()
            return cursor.lastrowid

        if fetch_one:
            row = cursor.fetchone()
            return dict(row) if row else None

        if fetch_all:
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

        return None

    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()


# ---------------------------------------------------------------------------
# Legacy-compatible queries from clinical.db
# These return plain tuples in the EXACT column order that calculations.py
# expects via positional indices (e.g. row[6]=peso, row[7]=bf, etc.)
# ---------------------------------------------------------------------------

# PERFILDINAMICO legacy column order (37 columns):
# [0]ID [1]NOMBRE_APELLIDO [2]FECHA_REGISTRO [3]CIRC_ABD [4]CIRC_CAD [5]CIRC_CIN
# [6]PESO [7]BF [8]IMC [9]IMMC [10]PESO_GRASO [11]PESO_MAGRO
# [12]DELTADIA [13]DELTAPESO [14]DELTADIAPESO [15]DELTAPG [16]DELTADIAPG
# [17]DELTAPM [18]DELTADIAPM [19]DELTAPESOCAT [20]LBMLOSS [21]LBMLOSSCAT
# [22]FBMGAIN [23]FBMGAINCAT [24]SCOREIMMC [25]SCOREBF [26]BODYSCORE
# [27]INCDAYS [28]DECDAYS [29]DAYS [30]PF [31]PMF [32]PGF
# [33]ABDF [34]CINF [35]CADF [36]SOLVER_CATEGORY

_MEASUREMENTS_LEGACY_SELECT = """
    SELECT
        m.id,
        p.nombre,
        m.fecha,
        m.circ_abdomen,
        m.circ_cadera,
        m.circ_cintura,
        m.peso,
        m.bf_percent,
        m.imc,
        m.ffmi,
        m.peso_graso,
        m.peso_magro,
        m.delta_dias,
        m.delta_peso,
        m.delta_peso_dia,
        m.delta_graso,
        m.delta_graso_dia,
        m.delta_magro,
        m.delta_magro_dia,
        m.delta_peso_cat,
        m.lbm_loss,
        m.lbm_loss_cat,
        m.fbm_gain,
        m.fbm_gain_cat,
        m.score_ffmi,
        m.score_bf,
        m.body_score,
        m.inc_days,
        m.dec_days,
        m.total_days,
        m.pf,
        m.pmf,
        m.pgf,
        m.abdf,
        m.cinf,
        m.cadf,
        m.solver_category
    FROM measurements m
    JOIN patients p ON m.patient_id = p.id
"""

# PERFILESTATICO legacy column order (10 columns):
# [0]NOMBRE_APELLIDO [1]DNI [2]NUMERO_TELEFONO [3]EMAIL [4]SEXO
# [5]FECHA_NACIMIENTO [6]ALTURA [7]CIRC_CUELLO [8]CIRC_MUNECA [9]CIRC_TOBILLO

_PATIENTS_LEGACY_SELECT = """
    SELECT
        p.nombre,
        p.dni,
        p.telefono,
        p.email,
        p.sexo,
        p.fecha_nacimiento,
        p.altura,
        p.circ_cuello,
        p.circ_muneca,
        p.circ_tobillo
    FROM patients p
"""

# DIETA legacy column order (31 columns):
# [0]ID [1]NOMBRE_APELLIDO [2]CALORIAS [3]PROTEINA [4]GRASA [5]CH
# [6]DP [7]DG [8]DC [9]MMP [10]MMG [11]MMC [12]AP [13]AG [14]AC
# [15]MP [16]MG [17]MC [18]MTP [19]MTG [20]MTC [21]CP [22]CG [23]CC
# [24]LIBERTAD [25]FECHA_CREACION [26]ESTRATEGIA [27]VELOCIDAD_CAMBIO
# [28]DEFICIT_CALORICO [29]DISPONIBILIDAD_ENERGETICA [30]FACTOR_ACTIVIDAD

_NUTRITION_PLANS_LEGACY_SELECT = """
    SELECT
        np.id,
        p.nombre,
        np.calorias,
        np.proteina,
        np.grasa,
        np.carbohidratos,
        np.desayuno_p,
        np.desayuno_g,
        np.desayuno_c,
        np.media_man_p,
        np.media_man_g,
        np.media_man_c,
        np.almuerzo_p,
        np.almuerzo_g,
        np.almuerzo_c,
        np.merienda_p,
        np.merienda_g,
        np.merienda_c,
        np.media_tar_p,
        np.media_tar_g,
        np.media_tar_c,
        np.cena_p,
        np.cena_g,
        np.cena_c,
        np.libertad,
        np.created_at,
        np.estrategia,
        np.velocidad_cambio,
        np.deficit_calorico,
        np.disponibilidad_energetica,
        np.factor_actividad
    FROM nutrition_plans np
    JOIN patients p ON np.patient_id = p.id
"""

# OBJETIVO legacy column order (3 columns):
# [0]NOMBRE_APELLIDO [1]GOALIMMC [2]GOALBF

_GOALS_LEGACY_SELECT = """
    SELECT
        p.nombre,
        g.goal_ffmi,
        g.goal_bf
    FROM goals g
    JOIN patients p ON g.patient_id = p.id
"""


def get_patient_data_legacy(patient_id):
    """
    Fetch all data for a patient, returning tuples
    in legacy-compatible column order for calculations.py.

    Tries clinical.db first, then falls back to legacy Basededatos.

    Returns dict with keys:
        estatico: list of tuples (PERFILESTATICO format)
        dinamico: list of tuples (PERFILDINAMICO format, ASC by fecha)
        dieta: list of tuples (DIETA format, latest first)
        objetivo: list of tuples (OBJETIVO format)
    """
    # Try clinical.db first
    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()

        cursor.execute(_PATIENTS_LEGACY_SELECT + " WHERE p.id = ?", [patient_id])
        estatico = cursor.fetchall()

        if estatico:
            cursor.execute(
                _MEASUREMENTS_LEGACY_SELECT + " WHERE m.patient_id = ? ORDER BY m.fecha ASC",
                [patient_id]
            )
            dinamico = cursor.fetchall()

            cursor.execute(
                _NUTRITION_PLANS_LEGACY_SELECT + " WHERE np.patient_id = ? ORDER BY np.created_at DESC LIMIT 1",
                [patient_id]
            )
            dieta = cursor.fetchall()

            cursor.execute(
                _GOALS_LEGACY_SELECT + " WHERE g.patient_id = ? AND g.activo = 1",
                [patient_id]
            )
            objetivo = cursor.fetchall()

            conn.close()
            return {
                'estatico': estatico,
                'dinamico': dinamico,
                'dieta': dieta,
                'objetivo': objetivo,
            }
        conn.close()
    except Exception:
        pass

    # FALLBACK: legacy Basededatos
    return _get_patient_data_from_legacy_db(patient_id)


def _get_patient_data_from_legacy_db(patient_id_or_dni):
    """
    Read patient data directly from legacy Basededatos (PERFILESTATICO, PERFILDINAMICO, etc.)
    patient_id_or_dni can be a DNI string.
    Returns data in the same tuple format expected by calculations.py.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        dni = str(patient_id_or_dni)

        # Resolve nombre from DNI
        cursor.execute("SELECT NOMBRE_APELLIDO FROM PERFILESTATICO WHERE DNI = ?", [dni])
        name_row = cursor.fetchone()
        if not name_row:
            conn.close()
            return {'estatico': [], 'dinamico': [], 'dieta': [], 'objetivo': []}
        nombre = name_row[0]

        # PERFILESTATICO: 10 columns in exact legacy order
        cursor.execute("""
            SELECT NOMBRE_APELLIDO, DNI, NUMERO_TELEFONO, EMAIL, SEXO,
                   FECHA_NACIMIENTO, ALTURA, CIRC_CUELLO, CIRC_MUNECA, CIRC_TOBILLO
            FROM PERFILESTATICO WHERE DNI = ?
        """, [dni])
        estatico = cursor.fetchall()

        # PERFILDINAMICO: 37 columns — reordered to match _MEASUREMENTS_LEGACY_SELECT
        # Expected: [3]=abdomen, [4]=cadera, [5]=cintura
        # Legacy DB has: [3]=CIRC_CIN, [4]=CIRC_CAD, [5]=CIRC_ABD (different order!)
        cursor.execute("""
            SELECT ID, NOMBRE_APELLIDO, FECHA_REGISTRO,
                   CIRC_ABD, CIRC_CAD, CIRC_CIN,
                   PESO, BF, IMC, IMMC, PESO_GRASO, PESO_MAGRO,
                   DELTADIA, DELTAPESO, DELTADIAPESO, DELTAPG, DELTADIAPG,
                   DELTAPM, DELTADIAPM, DELTAPESOCAT, LBMLOSS, LBMLOSSCAT,
                   FBMGAIN, FBMGAINCAT, SCOREIMMC, SCOREBF, BODYSCORE,
                   INCDAYS, DECDAYS, DAYS, PF, PMF, PGF,
                   ABDF, CINF, CADF, SOLVER_CATEGORY
            FROM PERFILDINAMICO WHERE NOMBRE_APELLIDO = ?
            ORDER BY FECHA_REGISTRO ASC
        """, [nombre])
        dinamico = cursor.fetchall()

        # DIETA (nutrition plan) - may not exist in legacy
        dieta = []
        try:
            cursor.execute("""
                SELECT * FROM DIETA WHERE NOMBRE_APELLIDO = ?
                ORDER BY FECHA_CREACION DESC LIMIT 1
            """, [nombre])
            dieta = cursor.fetchall()
        except Exception:
            pass

        # OBJETIVO (goals) - may not exist in legacy
        objetivo = []
        try:
            cursor.execute("""
                SELECT NOMBRE_APELLIDO, GOALIMMC, GOALBF FROM OBJETIVO
                WHERE NOMBRE_APELLIDO = ?
            """, [nombre])
            objetivo = cursor.fetchall()
        except Exception:
            pass

        conn.close()
        return {
            'estatico': estatico,
            'dinamico': dinamico,
            'dieta': dieta,
            'objetivo': objetivo,
        }
    except Exception:
        return {'estatico': [], 'dinamico': [], 'dieta': [], 'objetivo': []}


def execute_telemed_query(query, params=None, fetch_one=False, fetch_all=True, commit=False):
    """
    Ejecuta una query en la base de datos de telemedicina.
    
    Args:
        query: SQL query
        params: Parámetros para la query
        fetch_one: Si True, retorna solo una fila
        fetch_all: Si True, retorna todas las filas
        commit: Si True, hace commit después de ejecutar
    
    Returns:
        Resultado de la query o None
    """
    conn = None
    try:
        conn = get_telemed_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        if commit:
            conn.commit()
            return cursor.lastrowid
        
        if fetch_one:
            row = cursor.fetchone()
            return dict(row) if row else None
        
        if fetch_all:
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        
        return None
        
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()
