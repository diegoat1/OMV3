"""
Solver de nutrición — wrapper sobre `functions.solve_meal` legacy (Fix 18 — OMV-52).

Centraliza el import a un solo módulo para que cuando se elimine el legacy,
solo haya que tocar este archivo. Antes los call-sites en `routes.py` hacían
`import functions` directo, lo que dispersaba la dependencia.

Cuando se migre la lógica del solver a v3 nativo:
  1. Implementar `solve_meal(...)` localmente en este archivo.
  2. Eliminar el `_legacy_solve_meal` y el fallback.
  3. El resto del código no tiene que tocar nada (sigue importando de acá).
"""

import os
import sys

# El legacy `functions.py` está en src/. Asegurar que sys.path lo encuentre
# (ya lo hace routes.py pero lo dejamos defensivo).
_src_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if _src_dir not in sys.path:
    sys.path.insert(0, _src_dir)


def _legacy_solve_meal(*args, **kwargs):
    """Importa lazily para evitar circulares y dejar la dependencia explícita."""
    try:
        import functions as _legacy
    except ImportError as e:
        raise RuntimeError(
            'functions.solve_meal no disponible. Si se eliminó el legacy, '
            'migrar la lógica del solver a src/api/v3/nutrition/solver.py.'
        ) from e
    return _legacy.solve_meal(*args, **kwargs)


def solve_meal(alimentos, objetivo, libertad=5, dependencias=None):
    """
    Resuelve la asignación de gramos por alimento para alcanzar un objetivo
    de macros con una tolerancia (`libertad`).

    Args:
        alimentos (list): cada item con shape
            { id, proteina_100g, grasa_100g, carbohidratos_100g, medida_casera_g, medida_desc, ... }
        objetivo (dict): { proteina, grasa, carbohidratos } (gramos target)
        libertad (int): margen permitido sobre el objetivo. Default 5.
        dependencias (list, opcional): grupos de alimentos con base/dependiente/fijo.

    Returns:
        dict con la asignación de gramos por alimento + status del solver.

    TODO (Fix 18 — OMV-52): migrar la implementación a v3 nativo cuando
    se decida eliminar `src/functions.py`. La firma queda estable.
    """
    return _legacy_solve_meal(
        alimentos=alimentos,
        objetivo=objetivo,
        libertad=libertad,
        dependencias=dependencias,
    )
