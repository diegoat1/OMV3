"""
Validadores reutilizables para campos de perfil constitucional y mediciones
dinámicas (Fix 15). Centraliza tipos, rangos antropométricos y formatos para
no duplicar lógica entre PUT /users, POST /measurements y PUT /measurements.
"""

import re
from datetime import date, datetime


# Rangos antropométricos razonables (cm para circunferencias, kg para peso).
# Los límites son holgados — se busca rechazar valores absurdos (peso negativo,
# altura 0, circ_cuello = 500), no imponer un perfil clínico estricto.
RANGES = {
    'altura': (50, 250),                 # cm
    'peso': (20, 300),                   # kg
    'envergadura': (50, 280),            # cm
    'circ_cuello': (15, 80),
    'circ_muneca': (8, 30),
    'circ_tobillo': (10, 40),
    'circ_abdomen': (40, 250),
    'circ_cintura': (40, 250),
    'circ_cadera': (40, 250),
    'circ_hombro': (50, 250),
    'circ_pecho': (40, 250),
    'circ_brazo': (15, 80),
    'circ_antebrazo': (10, 60),
    'circ_muslo': (20, 120),
    'circ_pantorrilla': (15, 80),
}

_PHONE_RE = re.compile(r'^[\d\+\-\s\(\)]{7,20}$')


def validate_numeric_in_range(field, value, allow_none=False):
    """Returns (ok, error_msg)."""
    if value is None or value == '':
        return (True, None) if allow_none else (False, f'{field} es requerido')
    try:
        num = float(value)
    except (TypeError, ValueError):
        return (False, f'{field} debe ser numérico')
    if num <= 0:
        return (False, f'{field} debe ser positivo')
    rng = RANGES.get(field)
    if rng:
        lo, hi = rng
        if num < lo or num > hi:
            return (False, f'{field} fuera de rango razonable ({lo}-{hi})')
    return (True, None)


def validate_sexo(value):
    if value is None or value == '':
        return (True, None)
    if str(value).strip().upper() not in ('M', 'F'):
        return (False, 'sexo debe ser "M" o "F"')
    return (True, None)


def validate_fecha_nacimiento(value):
    if not value:
        return (True, None)
    s = str(value)[:10]
    try:
        d = date.fromisoformat(s)
    except (ValueError, TypeError):
        return (False, 'fecha_nacimiento inválida (esperado YYYY-MM-DD)')
    today = date.today()
    if d >= today:
        return (False, 'fecha_nacimiento debe ser pasada')
    if (today.year - d.year) > 120:
        return (False, 'fecha_nacimiento fuera de rango razonable (>120 años)')
    return (True, None)


def validate_fecha_registro(value):
    """Acepta YYYY-MM-DD o ISO 8601 datetime. No futuro, no >5 años atrás."""
    if not value:
        return (True, None)
    s = str(value).strip()
    dt = None
    try:
        dt = datetime.fromisoformat(s.replace('Z', '+00:00'))
    except (ValueError, TypeError):
        try:
            dt = datetime.combine(date.fromisoformat(s[:10]), datetime.min.time())
        except (ValueError, TypeError):
            return (False, 'fecha_registro inválida (YYYY-MM-DD o ISO 8601)')
    now = datetime.now()
    if dt > now:
        return (False, 'fecha_registro no puede ser futura')
    if (now - dt).days > 365 * 5:
        return (False, 'fecha_registro más de 5 años atrás — verificá')
    return (True, None)


def validate_telefono(value):
    if not value:
        return (True, None)
    if not _PHONE_RE.match(str(value)):
        return (False, 'telefono inválido (7-20 chars: dígitos, +, -, espacios, paréntesis)')
    return (True, None)


def validate_email_format(value):
    if not value:
        return (True, None)
    s = str(value).strip()
    if '@' not in s or '.' not in s.split('@')[-1]:
        return (False, 'email inválido')
    return (True, None)


# Campos numéricos del perfil constitucional (estáticos)
_CONSTITUTIONAL_NUMERIC_FIELDS = (
    'altura', 'circ_cuello', 'circ_muneca', 'circ_tobillo', 'envergadura',
)

# Campos numéricos de medición (dinámicos)
_MEASUREMENT_NUMERIC_FIELDS = (
    'circ_abdomen', 'circ_cintura', 'circ_cadera', 'circ_hombro',
    'circ_pecho', 'circ_brazo', 'circ_antebrazo', 'circ_muslo',
    'circ_pantorrilla',
)


def validate_constitutional_fields(data):
    """Valida solo los campos constitucionales presentes en data.
    Returns (ok, errors_dict)."""
    errors = {}

    if 'sexo' in data:
        ok, err = validate_sexo(data['sexo'])
        if not ok:
            errors['sexo'] = err
    if 'fecha_nacimiento' in data:
        ok, err = validate_fecha_nacimiento(data['fecha_nacimiento'])
        if not ok:
            errors['fecha_nacimiento'] = err
    if 'telefono' in data:
        ok, err = validate_telefono(data['telefono'])
        if not ok:
            errors['telefono'] = err
    if 'email' in data:
        ok, err = validate_email_format(data['email'])
        if not ok:
            errors['email'] = err
    for f in _CONSTITUTIONAL_NUMERIC_FIELDS:
        if f in data:
            ok, err = validate_numeric_in_range(f, data[f], allow_none=True)
            if not ok:
                errors[f] = err
    return (len(errors) == 0, errors)


def validate_measurement_fields(data, peso_required=True):
    """Valida campos de medición. Returns (ok, errors_dict)."""
    errors = {}

    if 'peso' in data or peso_required:
        ok, err = validate_numeric_in_range('peso', data.get('peso'), allow_none=not peso_required)
        if not ok:
            errors['peso'] = err

    for f in _MEASUREMENT_NUMERIC_FIELDS:
        if f in data and data[f] not in (None, ''):
            ok, err = validate_numeric_in_range(f, data[f], allow_none=True)
            if not ok:
                errors[f] = err

    if 'fecha_registro' in data:
        ok, err = validate_fecha_registro(data['fecha_registro'])
        if not ok:
            errors['fecha_registro'] = err

    return (len(errors) == 0, errors)
