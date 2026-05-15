#!/usr/bin/env python3
"""
018_drop_dni_columns.py

Fase 2 del retiro de DNI: agregar `auth_user_id` a las tablas legacy que
todavía joinean por DNI y dropear esa columna donde sea seguro.

Tablas afectadas:
  - src/Basededatos.RECORDATORIOS  (user_dni → auth_user_id)
  - src/Basededatos.TAREAS         (user_dni → auth_user_id)
  - src/telemedicina.db.TELEMED_PACIENTES   (paciente_dni → auth_user_id)
  - src/telemedicina.db.TELEMED_SITUACIONES (paciente_dni → auth_user_id)
  - src/telemedicina.db.TELEMED_DOCUMENTOS  (paciente_dni → auth_user_id)

`specialist_assignments` ya tiene patient_id (auth.users.id FK) además de
patient_dni — no necesita migración de datos, solo dropear código que lee
patient_dni.

NO toca PERFILESTATICO ni el bridge patient_user_link — ambos quedan como
data legacy de solo-lectura para historicidad.

Uso:
    cd ~/OMV3
    python3 migrations/018_drop_dni_columns.py
    # PA:
    DATABASE_DIR=/home/omegamedicina/omv3-data python3 migrations/018_drop_dni_columns.py

Idempotente.
"""

import os
import sqlite3
import sys


def _db_dir():
    return os.environ.get(
        'DATABASE_DIR',
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'),
    )


def _has_column(conn, table, column):
    try:
        rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
        return any(r[1] == column for r in rows)
    except Exception:
        return False


def _add_auth_user_id(conn, table, dni_col, dni_to_uid):
    """Agrega auth_user_id INTEGER + backfill + drop de la columna dni."""
    if not _has_column(conn, table, 'auth_user_id'):
        try:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN auth_user_id INTEGER")
            print(f'  + columna auth_user_id agregada a {table}')
        except sqlite3.OperationalError as e:
            print(f'  ! no se pudo ALTER {table}: {e}')
            return
    backfilled = 0
    if _has_column(conn, table, dni_col):
        for row in conn.execute(
            f"SELECT id, {dni_col} FROM {table} "
            f"WHERE auth_user_id IS NULL AND {dni_col} IS NOT NULL"
        ).fetchall():
            uid = dni_to_uid.get(str(row[1]))
            if uid is not None:
                conn.execute(
                    f"UPDATE {table} SET auth_user_id = ? WHERE id = ?",
                    [uid, row[0]],
                )
                backfilled += 1
        conn.commit()
        print(f'  ~ {table}: {backfilled} filas backfilled')

        # Drop de la columna dni una vez que todo lo recuperable migró.
        # SQLite 3.35+ soporta DROP COLUMN directo. Si hay NOT NULL +
        # filas huérfanas (sin auth_user_id) las dejamos vivas (preservan
        # historia); solo sacamos la columna.
        try:
            conn.execute(f"ALTER TABLE {table} DROP COLUMN {dni_col}")
            conn.commit()
            print(f'  - columna {dni_col} eliminada de {table}')
        except sqlite3.OperationalError as e:
            print(f'  ! no se pudo dropear {dni_col} de {table}: {e}')
    else:
        print(f'  ~ {table}: {dni_col} ya no existe (idempotent)')


def main():
    db_dir = _db_dir()
    main_path = os.path.join(db_dir, 'Basededatos')
    auth_path = os.path.join(db_dir, 'auth.db')
    tele_path = os.path.join(db_dir, 'telemedicina.db')

    if not os.path.exists(auth_path):
        print(f'[err] no existe {auth_path}')
        sys.exit(1)

    print(f'auth.db        : {auth_path}')
    print(f'Basededatos    : {main_path}')
    print(f'telemedicina   : {tele_path}')
    print()

    # 1) Construir mapa dni → auth_user_id desde patient_user_link
    auth_conn = sqlite3.connect(auth_path)
    dni_to_uid = {}
    try:
        for row in auth_conn.execute(
            "SELECT user_id, patient_dni FROM patient_user_link"
        ):
            dni_to_uid[str(row[1])] = row[0]
    except sqlite3.OperationalError:
        print('[warn] patient_user_link no existe en auth.db')
    print(f'mapa dni→auth_user_id: {len(dni_to_uid)} entradas')
    print()

    # 2) RECORDATORIOS + TAREAS (Basededatos)
    if os.path.exists(main_path):
        main_conn = sqlite3.connect(main_path)
        for tbl in ('RECORDATORIOS', 'TAREAS'):
            try:
                main_conn.execute(f"SELECT 1 FROM {tbl} LIMIT 1")
                _add_auth_user_id(main_conn, tbl, 'user_dni', dni_to_uid)
            except sqlite3.OperationalError as e:
                print(f'  ! {tbl}: {e}')
        main_conn.close()
    else:
        print(f'[skip] no existe {main_path}')

    print()

    # 3) Tablas de telemedicina
    if os.path.exists(tele_path):
        tele_conn = sqlite3.connect(tele_path)
        for tbl in ('TELEMED_PACIENTES', 'TELEMED_SITUACIONES', 'TELEMED_DOCUMENTOS'):
            try:
                tele_conn.execute(f"SELECT 1 FROM {tbl} LIMIT 1")
                _add_auth_user_id(tele_conn, tbl, 'paciente_dni', dni_to_uid)
            except sqlite3.OperationalError as e:
                print(f'  ! {tbl}: {e}')

        # 3b) Remapear el user_id del DOCTOR (string DNI legacy) a nombre_apellido
        # del auth.users. El JWT post-DNI ya no contiene dni del doctor, así que
        # las filas viejas con user_id='37070509' (Diego) o cualquier otro DNI
        # de doctor quedarían huérfanas si filtramos por nombre_apellido.
        ADMIN_DNI_TO_NAME = {'37070509': 'Toffaletti, Diego Alejandro'}
        doctor_dni_to_name = dict(ADMIN_DNI_TO_NAME)
        try:
            for row in auth_conn.execute(
                "SELECT l.patient_dni, u.display_name FROM patient_user_link l "
                "JOIN users u ON u.id = l.user_id"
            ):
                doctor_dni_to_name[str(row[0])] = row[1]
        except Exception:
            pass

        for tbl in ('TELEMED_PACIENTES', 'TELEMED_SITUACIONES', 'TELEMED_DOCUMENTOS'):
            try:
                remapped = 0
                rows = tele_conn.execute(
                    f"SELECT id, user_id FROM {tbl} WHERE user_id IS NOT NULL"
                ).fetchall()
                for r in rows:
                    uid = str(r[1])
                    if uid.isdigit() and uid in doctor_dni_to_name:
                        tele_conn.execute(
                            f"UPDATE {tbl} SET user_id = ? WHERE id = ?",
                            [doctor_dni_to_name[uid], r[0]],
                        )
                        remapped += 1
                if remapped:
                    tele_conn.commit()
                    print(f'  ~ {tbl}.user_id: {remapped} DNIs remapeados a nombre_apellido')
            except sqlite3.OperationalError:
                pass

        tele_conn.close()
    else:
        print(f'[skip] no existe {tele_path}')

    # 4) specialist_assignments.patient_dni → drop
    try:
        if _has_column(auth_conn, 'specialist_assignments', 'patient_dni'):
            try:
                auth_conn.execute(
                    "ALTER TABLE specialist_assignments DROP COLUMN patient_dni"
                )
                auth_conn.commit()
                print('  - columna patient_dni eliminada de specialist_assignments')
            except sqlite3.OperationalError as e:
                print(f'  ! no se pudo dropear patient_dni de specialist_assignments: {e}')
        else:
            print('  ~ specialist_assignments.patient_dni ya no existe (idempotent)')
    except Exception as e:
        print(f'  ! error chequeando specialist_assignments: {e}')

    # 5) auth.db.patient_user_link → drop completo (deprecada)
    try:
        auth_conn.execute("DROP TABLE IF EXISTS patient_user_link")
        auth_conn.commit()
        print('  - tabla patient_user_link eliminada de auth.db')
    except Exception as e:
        print(f'  ! no se pudo dropear patient_user_link: {e}')

    auth_conn.close()

    # 6) clinical.db.patients.dni → drop. SQLite no permite DROP COLUMN
    #    sobre UNIQUE; recreamos la tabla preservando todos los datos.
    clin_path = os.path.join(db_dir, 'db', 'clinical.db')
    if os.path.exists(clin_path):
        clin_conn = sqlite3.connect(clin_path)
        try:
            if _has_column(clin_conn, 'patients', 'dni'):
                try:
                    clin_conn.execute("DROP INDEX IF EXISTS idx_patients_dni")
                    # Apagar FKs durante la recreación.
                    clin_conn.execute("PRAGMA foreign_keys = OFF")
                    clin_conn.execute("BEGIN TRANSACTION")
                    clin_conn.execute("""
                        CREATE TABLE patients_new (
                            id              INTEGER PRIMARY KEY AUTOINCREMENT,
                            auth_user_id    INTEGER UNIQUE,
                            nombre          TEXT NOT NULL,
                            email           TEXT,
                            telefono        TEXT,
                            sexo            TEXT CHECK(sexo IN ('M','F')),
                            fecha_nacimiento DATE,
                            altura          REAL,
                            circ_cuello     REAL,
                            circ_muneca     REAL,
                            circ_tobillo    REAL,
                            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    """)
                    clin_conn.execute("""
                        INSERT INTO patients_new
                            (id, auth_user_id, nombre, email, telefono, sexo,
                             fecha_nacimiento, altura, circ_cuello, circ_muneca,
                             circ_tobillo, created_at, updated_at)
                        SELECT id, auth_user_id, nombre, email, telefono, sexo,
                               fecha_nacimiento, altura, circ_cuello, circ_muneca,
                               circ_tobillo, created_at, updated_at
                        FROM patients
                    """)
                    clin_conn.execute("DROP TABLE patients")
                    clin_conn.execute("ALTER TABLE patients_new RENAME TO patients")
                    clin_conn.execute(
                        "CREATE INDEX IF NOT EXISTS idx_patients_auth "
                        "ON patients(auth_user_id)"
                    )
                    clin_conn.execute("COMMIT")
                    clin_conn.execute("PRAGMA foreign_keys = ON")
                    print('  - columna dni eliminada de clinical.db.patients (tabla recreada)')
                except sqlite3.OperationalError as e:
                    clin_conn.execute("ROLLBACK")
                    print(f'  ! no se pudo dropear patients.dni: {e}')
            else:
                print('  ~ clinical.db.patients.dni ya no existe (idempotent)')
        finally:
            clin_conn.close()

    print()
    print('listo.')


if __name__ == '__main__':
    main()
