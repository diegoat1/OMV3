"""
Conexiones a base de datos para API v3
"""

import sqlite3
import os

# Rutas de bases de datos
# Si DATABASE_DIR está definido (ej: PythonAnywhere), las DBs se buscan ahí
_DB_DIR = os.environ.get('DATABASE_DIR', '')

if _DB_DIR:
    DATABASE_PATH = os.path.join(_DB_DIR, 'Basededatos')
    TELEMED_DATABASE_PATH = os.path.join(_DB_DIR, 'telemedicina.db')
    AUTH_DATABASE_PATH = os.path.join(_DB_DIR, 'auth.db')
    CLINICAL_DATABASE_PATH = os.path.join(_DB_DIR, 'db', 'clinical.db')
else:
    DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'Basededatos')
    TELEMED_DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'telemedicina.db')
    AUTH_DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'auth.db')
    CLINICAL_DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'db', 'clinical.db')

    # Rutas alternativas (para compatibilidad local)
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


def resolve_patient_id(user_id_or_name, auto_create=False):
    """
    Resuelve cualquier identificador (auth user_id numérico o nombre_apellido)
    a un dict con `{patient_id, nombre, dni}`.

    NOTA: la columna `dni` se mantiene devuelta por compat con callers todavía
    no migrados, pero la resolución NO la usa como criterio de búsqueda. El
    anchor activo es `auth_user_id` (numérico) o `nombre` (texto).

    Lookup order:
        1. Si el uid es numérico: patients WHERE auth_user_id = ?
        2. patients WHERE nombre = ? (NOMBRE_APELLIDO)
        3. patients WHERE id = ? (cuando ya recibimos patient_id)
        4. Fallback legacy: PERFILESTATICO + auto-create si auto_create=True.
        5. Auto-provisión: crear la fila clínica si el auth-user existe pero
           no la tiene todavía.
    """
    if not user_id_or_name:
        return None

    uid = str(user_id_or_name).strip()
    auth_display_name = None
    is_auth_user = False  # uid corresponde a un auth.users.id válido

    def _pack(row):
        # `dni` queda en el dict para no romper callers viejos, pero ya no se
        # usa como criterio en ningún lookup.
        return {'patient_id': row['id'], 'dni': row['dni'], 'nombre': row['nombre']}

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        # 1) auth_user_id (camino primario desde JWT)
        if uid.isdigit():
            cursor.execute(
                "SELECT id, dni, nombre FROM patients WHERE auth_user_id = ?",
                [int(uid)],
            )
            row = cursor.fetchone()
            if row:
                conn.close()
                return _pack(row)

            # Probar si uid existe como auth user. Si sí, NO podemos fall-through
            # a un lookup por patient_id (colisión: user_id=N != patient_id=N).
            try:
                auth_conn = get_auth_connection(sqlite3.Row)
                acur = auth_conn.cursor()
                acur.execute("SELECT display_name FROM users WHERE id = ?", [int(uid)])
                au = acur.fetchone()
                auth_conn.close()
                if au:
                    is_auth_user = True
                    auth_display_name = au[0]
            except Exception:
                pass

        # 2) Por nombre completo (dashboards / endpoints que pasan NOMBRE)
        cursor.execute("SELECT id, dni, nombre FROM patients WHERE nombre = ?", [uid])
        row = cursor.fetchone()
        if row:
            conn.close()
            return _pack(row)

        # 3) patient_id directo — solo si uid NO es un auth user_id válido
        #    (callers internos que ya tienen el patient_id real).
        if uid.isdigit() and not is_auth_user:
            cursor.execute("SELECT id, dni, nombre FROM patients WHERE id = ?", [int(uid)])
            row = cursor.fetchone()
            if row:
                conn.close()
                return _pack(row)

        conn.close()
    except Exception:
        pass

    # 4) Legacy fallback
    legacy = _resolve_patient_legacy(uid)
    if legacy:
        return legacy

    # 5) Auto-provisión
    if auto_create and uid.isdigit():
        ensured = _ensure_patient_link(uid, display_name=auth_display_name)
        if ensured:
            return {
                'patient_id': ensured['patient_id'],
                'dni': ensured['dni'],
                'nombre': ensured['nombre_apellido'],
            }

    return None


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


def _ensure_patient_link(auth_user_id, display_name=None, email=None):
    """
    OMV-89bis: Garantiza que el auth_user_id tenga su trio completo:
        - row en auth.db.patient_user_link (con DNI sintético "u<id>" si no
          venía con uno real)
        - row en clinical.db.patients

    Returns:
        dict {dni, nombre_apellido, patient_id} o None si la creación falló.

    Idempotente: si las filas ya existen, las devuelve sin tocar nada.
    """
    uid = str(auth_user_id).strip()
    if not uid:
        return None

    # 1) Traer todo lo que sabemos del auth user. No tocamos patient_user_link
    #    (la bridge queda deprecada — la resolución activa va por auth_user_id).
    sexo = None
    fecha_nacimiento = None
    telefono = None
    try:
        auth_conn = get_auth_connection(sqlite3.Row)
        auth_cursor = auth_conn.cursor()
        auth_cursor.execute(
            "SELECT id, display_name, email, sexo, fecha_nacimiento, telefono "
            "FROM users WHERE id = ?",
            [uid],
        )
        row = auth_cursor.fetchone()
        auth_conn.close()
        if not row:
            return None  # auth user no existe
        d = dict(row)
        if display_name is None:
            display_name = d.get('display_name') or f'Usuario {uid}'
        if email is None:
            email = d.get('email')
        sexo = d.get('sexo')
        fecha_nacimiento = d.get('fecha_nacimiento')
        telefono = d.get('telefono')
    except Exception:
        return None

    # `dni` se mantiene como columna NOT NULL UNIQUE en el schema legacy;
    # generamos un valor sintético opaco para satisfacer la constraint, pero
    # ya no se usa como anchor en ningún lookup.
    synthetic_dni = f'u{uid}'

    # 2) ¿Hay fila clínica ya? Buscamos primero por auth_user_id; si no, por
    #    el sintético (cubre filas creadas antes del backfill que todavía no
    #    tienen auth_user_id seteado).
    try:
        clin_conn = get_clinical_connection(sqlite3.Row)
        ccur = clin_conn.cursor()
        ccur.execute(
            "SELECT id, dni, nombre, sexo, fecha_nacimiento, telefono, auth_user_id "
            "FROM patients WHERE auth_user_id = ?",
            [int(uid)] if uid.isdigit() else [-1],
        )
        prow = ccur.fetchone()
        if not prow:
            ccur.execute(
                "SELECT id, dni, nombre, sexo, fecha_nacimiento, telefono, auth_user_id "
                "FROM patients WHERE dni = ?",
                [synthetic_dni],
            )
            prow = ccur.fetchone()

        if prow:
            sets = []
            vals = []
            if uid.isdigit() and not prow['auth_user_id']:
                sets.append('auth_user_id = ?')
                vals.append(int(uid))
            if sexo and not prow['sexo']:
                sets.append('sexo = ?'); vals.append(sexo)
            if fecha_nacimiento and not prow['fecha_nacimiento']:
                sets.append('fecha_nacimiento = ?'); vals.append(fecha_nacimiento)
            if telefono and not prow['telefono']:
                sets.append('telefono = ?'); vals.append(telefono)
            if sets:
                vals.append(prow['id'])
                try:
                    ccur.execute(
                        f"UPDATE patients SET {', '.join(sets)}, "
                        f"updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        vals,
                    )
                    clin_conn.commit()
                except Exception:
                    pass
            clin_conn.close()
            return {
                'dni': prow['dni'],
                'nombre_apellido': prow['nombre'],
                'patient_id': prow['id'],
            }

        # No existe → crear con auth_user_id como anchor primario
        try:
            ccur.execute(
                "INSERT INTO patients (auth_user_id, dni, nombre, email, sexo, "
                "                      fecha_nacimiento, telefono) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                [int(uid) if uid.isdigit() else None, synthetic_dni,
                 display_name, email, sexo, fecha_nacimiento, telefono],
            )
        except sqlite3.OperationalError:
            ccur.execute(
                "INSERT INTO patients (dni, nombre, email, sexo, "
                "                      fecha_nacimiento, telefono) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                [synthetic_dni, display_name, email, sexo,
                 fecha_nacimiento, telefono],
            )
        clin_conn.commit()
        new_id = ccur.lastrowid
        clin_conn.close()
        return {
            'dni': synthetic_dni,
            'nombre_apellido': display_name,
            'patient_id': new_id,
        }
    except Exception:
        return None


def resolve_user_identity(user_id_or_name):
    """
    Resuelve cualquier identificador a un dict con `{dni, nombre_apellido}`.

    Lookup order (auth_user_id como anchor primario; DNI ya no se usa como
    criterio de búsqueda activo, solo se devuelve por compat de respuesta):
        1. clinical.db.patients WHERE auth_user_id = ? (cuando uid es numérico)
        2. clinical.db.patients WHERE nombre = ? (búsqueda por NOMBRE)
        3. Legacy PERFILESTATICO por NOMBRE_APELLIDO (compat con datos pre-v3)
        4. Auto-provisión: si el uid es un auth user_id sin fila clínica, la
           creamos vía _ensure_patient_link.
    """
    if not user_id_or_name:
        return None

    uid = str(user_id_or_name).strip()
    display_name_hint = None

    # 1) Clinical por auth_user_id
    try:
        clin_conn = get_clinical_connection(sqlite3.Row)
        ccur = clin_conn.cursor()
        if uid.isdigit():
            ccur.execute(
                "SELECT dni, nombre FROM patients WHERE auth_user_id = ?",
                [int(uid)],
            )
            row = ccur.fetchone()
            if row:
                clin_conn.close()
                return {'dni': row[0], 'nombre_apellido': row[1]}

        # 2) Clinical por nombre completo
        ccur.execute("SELECT dni, nombre FROM patients WHERE nombre = ?", [uid])
        row = ccur.fetchone()
        clin_conn.close()
        if row:
            return {'dni': row[0], 'nombre_apellido': row[1]}
    except Exception:
        pass

    # Display name del auth user (para naming en auto-provisión)
    if uid.isdigit():
        try:
            auth_conn = get_auth_connection(sqlite3.Row)
            ac = auth_conn.cursor()
            ac.execute("SELECT display_name FROM users WHERE id = ?", [int(uid)])
            r = ac.fetchone()
            auth_conn.close()
            if r:
                display_name_hint = r[0]
        except Exception:
            pass

    # 3) Legacy fallback por NOMBRE_APELLIDO
    try:
        conn = get_db_connection(sqlite3.Row)
        cur = conn.cursor()
        cur.execute(
            "SELECT DNI, NOMBRE_APELLIDO FROM PERFILESTATICO WHERE NOMBRE_APELLIDO = ?",
            [uid],
        )
        row = cur.fetchone()
        conn.close()
        if row:
            return {'dni': row[0], 'nombre_apellido': row[1]}
    except Exception:
        pass

    # 4) Auto-provisión para auth user_id sin fila clínica
    if uid.isdigit():
        ensured = _ensure_patient_link(uid, display_name=display_name_hint)
        if ensured:
            return {
                'dni': ensured['dni'],
                'nombre_apellido': ensured['nombre_apellido'],
            }

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
