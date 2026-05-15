"""
Helper compartido para serializar el usuario al shape canónico.

Antes existían 3 shapes distintos en auth (login / validate / me) — uno con
todos los campos del perfil, otro solo con los del JWT, y un tercero que
envolvía en `{user, perfil_estatico, perfil_dinamico}`. Cualquier feature
nueva tenía que recordar tocar los 3. Este helper unifica todo.
"""

from .database import get_clinical_connection
import sqlite3


CANONICAL_USER_FIELDS = [
    'id', 'email', 'nombre_apellido',
    'sexo', 'altura', 'telefono', 'fecha_nacimiento',
    'rol', 'is_admin',
]

# Campos que el helper enriquece desde clinical.db.patients si vienen vacíos
# en el source (None o empty string). El query es indexed por auth_user_id.
_DB_ENRICHED_FIELDS = ('sexo', 'altura', 'telefono', 'fecha_nacimiento', 'nombre', 'email')


def serialize_user(source, enrich_from_db=True):
    """
    Devuelve el shape canónico de usuario.

    Args:
        source: dict — puede ser un JWT payload (con `user_id`), un row de
                       auth.db.users (con `id`), o cualquier dict con los
                       campos canónicos. Lo que ya esté presente y no vacío
                       en source NO se sobrescribe (excepto en pop de user_id).
        enrich_from_db: bool — si True, consulta clinical.db.patients para
                       completar los campos vacíos. Default True. Pasar False
                       solo si tenés certeza de que ya tenés todos los campos.

    Returns:
        dict con exactamente las keys de CANONICAL_USER_FIELDS, con None en
        las que no se pudieron resolver.
    """
    if source is None:
        return {k: None for k in CANONICAL_USER_FIELDS}

    u = dict(source)

    # Normalizar id (JWT usa 'user_id', frontend espera 'id' en string)
    if 'user_id' in u and 'id' not in u:
        u['id'] = u.pop('user_id')
    if u.get('id') is not None:
        u['id'] = str(u['id'])

    # Defaults razonables
    if not u.get('rol'):
        u['rol'] = 'patient'
    u.setdefault('is_admin', False)

    # Enriquecer desde clinical.db.patients si hace falta
    if enrich_from_db and u.get('id'):
        try:
            conn = get_clinical_connection(sqlite3.Row)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT sexo, altura, telefono, fecha_nacimiento, nombre, email
                FROM patients WHERE auth_user_id = ?
            """, [int(u['id'])])
            row = cursor.fetchone()
            conn.close()
            if row:
                p = dict(row)
                if not u.get('sexo'):
                    u['sexo'] = p.get('sexo')
                if not u.get('altura'):
                    u['altura'] = p.get('altura')
                if not u.get('telefono'):
                    u['telefono'] = p.get('telefono')
                if not u.get('fecha_nacimiento'):
                    u['fecha_nacimiento'] = p.get('fecha_nacimiento')
                if not u.get('nombre_apellido'):
                    u['nombre_apellido'] = p.get('nombre') or ''
                if not u.get('email'):
                    u['email'] = p.get('email') or ''
        except Exception:
            pass

    # Garantizar exactamente las keys canónicas (con None para los que faltan)
    return {k: u.get(k) for k in CANONICAL_USER_FIELDS}
