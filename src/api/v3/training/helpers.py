"""
Training v3 helpers — port de las funciones legacy de functions.py / main.py / training.py
sobre clinical.db (training_plans_v2, exercise_progress, training_sessions, etc.)

Cubre OMV-53 (optimize real), OMV-55 (plans en clinical.db), OMV-56 (sin imports legacy),
OMV-61 (periodizacion / progresion automatica).
"""

import json
import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from ..common.database import (
    get_clinical_connection,
    get_db_connection,
    resolve_patient_id,
)


# ============================================================================
# 1RM ESTIMATION (Fitbod-style prescription) — formulas citables
# ============================================================================
# Refs (rep-max -> 1RM):
#   Epley (1985):    1RM = w*(1 + r/30)
#   Brzycki (1993):  1RM = w*36/(37 - r)
#   Lombardi (1989): 1RM = w*r^0.10
#   O'Conner (1989): 1RM = w*(1 + r/40)
ONE_RM_FORMULAS = ('epley', 'brzycki', 'lombardi', 'oconner')


def one_rm_estimate(weight, reps, formula='epley'):
    """Estima el 1RM a partir de un peso levantado por `reps` repeticiones.

    Devuelve None si los inputs no son validos. Para reps == 1 devuelve el peso.
    Brzycki no es valido para reps >= 37 (denominador <= 0) -> None.
    """
    try:
        w = float(weight)
        r = int(reps)
    except (TypeError, ValueError):
        return None
    if w <= 0 or r <= 0:
        return None
    if r == 1:
        return round(w, 2)
    f = (formula or 'epley').lower()
    if f == 'epley':
        rm = w * (1 + r / 30.0)
    elif f == 'brzycki':
        if r >= 37:
            return None
        rm = w * 36.0 / (37.0 - r)
    elif f == 'lombardi':
        rm = w * (r ** 0.10)
    elif f == 'oconner':
        rm = w * (1 + r / 40.0)
    else:
        return None
    return round(rm, 2)


def one_rm_all(weight, reps):
    """1RM por todas las formulas soportadas + promedio de las validas."""
    out = {f: one_rm_estimate(weight, reps, f) for f in ONE_RM_FORMULAS}
    valid = [v for v in out.values() if v is not None]
    out['average'] = round(sum(valid) / len(valid), 2) if valid else None
    return out


def pct_1rm_by_reps(reps):
    """% del 1RM que representa un peso levantado por `reps` (Brzycki).

    pct = (37 - reps)/36 * 100. peso_objetivo = 1RM * pct/100.
    """
    try:
        r = int(reps)
    except (TypeError, ValueError):
        return None
    if r < 1 or r >= 37:
        return None
    return round((37.0 - r) / 36.0 * 100.0, 1)


def weight_for_reps(one_rm, reps):
    """Peso prescrito para `reps` repeticiones dado un 1RM (Brzycki inverso)."""
    try:
        rm = float(one_rm)
    except (TypeError, ValueError):
        return None
    pct = pct_1rm_by_reps(reps)
    if rm is None or rm <= 0 or pct is None:
        return None
    return round(rm * pct / 100.0, 2)


# ============================================================================
# STRENGTH TEST PERSISTENCE (OMV-56: replaces functions.guardar_historia_levantamiento_completa)
# ============================================================================

def save_strength_test_complete(calculated_data: dict, raw_data: dict, patient_id: int) -> Optional[int]:
    """
    Persiste un test de fuerza completo en clinical.db.strength_tests.
    Reemplaza functions.guardar_historia_levantamiento_completa.
    """
    if not raw_data or not calculated_data or not patient_id:
        return None

    age = raw_data.get('age')
    bodyweight = raw_data.get('bodyweight')
    sex = raw_data.get('sex')
    unit_system = raw_data.get('unitSystem')
    round_to = raw_data.get('roundTo')

    lift_fields = raw_data.get('liftFields') or {}
    active_lifts = {}
    if isinstance(lift_fields, dict):
        for key, val in lift_fields.items():
            if isinstance(val, dict) and val.get('checked'):
                active_lifts[key] = {'weight': val.get('weight'), 'reps': val.get('reps')}

    strongest_mg = calculated_data.get('strongestMuscleGroups')
    weakest_mg = calculated_data.get('weakestMuscleGroups')

    sql = """
        INSERT INTO strength_tests (
            patient_id, fecha, edad, bodyweight, sexo, unit_system, round_to,
            total_score, score_class, symmetry_score, wilks, powerlifting_total,
            strongest_lift, weakest_lift, strongest_muscles, weakest_muscles,
            lift_inputs_json, lifts_results_json, categories_results_json,
            muscle_groups_json, standards_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    fecha = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    params = (
        patient_id, fecha, age, bodyweight, sex, unit_system, round_to,
        calculated_data.get('totalScore'),
        calculated_data.get('scoreClass'),
        calculated_data.get('symmetryScore'),
        calculated_data.get('powerliftingWilks'),
        calculated_data.get('powerliftingTotal'),
        calculated_data.get('strongestLift'),
        calculated_data.get('weakestLift'),
        json.dumps(strongest_mg.split(', ')) if isinstance(strongest_mg, str) and strongest_mg else None,
        json.dumps(weakest_mg.split(', ')) if isinstance(weakest_mg, str) and weakest_mg else None,
        json.dumps(active_lifts) if active_lifts else None,
        json.dumps(calculated_data.get('lifts', [])),
        json.dumps(calculated_data.get('categories', [])),
        json.dumps(calculated_data.get('muscleGroups', [])),
        json.dumps(calculated_data.get('standards', {})),
    )

    conn = get_clinical_connection()
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        new_id = cur.lastrowid
        conn.commit()
        return new_id
    finally:
        conn.close()


# ============================================================================
# STRENGTH ADMIN VIEW (OMV-56: replaces functions.get_all_strength_data_admin)
# ============================================================================

def _decode(raw):
    if raw is None:
        return None
    if isinstance(raw, (dict, list)):
        return raw
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            return None
    return None


def get_all_strength_admin() -> List[dict]:
    """
    Lista todos los strength_tests cruzados con patients.
    Reemplaza functions.get_all_strength_data_admin (que leía FUERZA legacy).
    """
    conn = get_clinical_connection(sqlite3.Row)
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT s.*, p.nombre AS username, p.auth_user_id
            FROM strength_tests s
            JOIN patients p ON s.patient_id = p.id
            ORDER BY s.fecha DESC
        """)
        rows = [dict(r) for r in cur.fetchall()]

        for item in rows:
            for k in ('lift_inputs_json', 'lifts_results_json', 'categories_results_json',
                      'muscle_groups_json', 'standards_json',
                      'strongest_muscles', 'weakest_muscles'):
                if item.get(k):
                    item[k] = _decode(item[k])

            # Adjuntar estado actual del running (si existe)
            running_state = None
            try:
                cur.execute("""
                    SELECT current_weight, last_reps, current_level
                    FROM exercise_progress
                    WHERE patient_id = ? AND LOWER(exercise_key) = 'running'
                """, [item['patient_id']])
                run_row = cur.fetchone()
                if run_row:
                    base_reps = run_row['last_reps'] or run_row['current_level'] or 1
                    running_state = {
                        'speed': float(run_row['current_weight'] or 0),
                        'minutes': max(0.5, min(5.0, base_reps * 0.5)),
                        'reps': int(base_reps),
                        'days': [],
                    }

                    cur.execute("""
                        SELECT plan_json FROM training_plans_v2
                        WHERE patient_id = ? AND active = 1
                        ORDER BY id DESC LIMIT 1
                    """, [item['patient_id']])
                    pr = cur.fetchone()
                    if pr and pr['plan_json']:
                        try:
                            plan_data = json.loads(pr['plan_json'])
                            running_days = []
                            for dia_info in plan_data.get('dias', []):
                                num = dia_info.get('dia')
                                ejs = dia_info.get('ejercicios', [])
                                norm = []
                                for e in ejs:
                                    if isinstance(e, dict):
                                        norm.append(str(e.get('exercise_key', '')))
                                    else:
                                        norm.append(str(e))
                                if num and any(en.lower() == 'running' for en in norm):
                                    running_days.append(int(num))
                            running_state['days'] = running_days
                        except (ValueError, TypeError, json.JSONDecodeError):
                            pass
            except sqlite3.Error:
                running_state = None

            item['running_training_state'] = running_state

        return rows
    finally:
        conn.close()


# ============================================================================
# RUNNING STATE (OMV-56: replaces functions.actualizar_estado_running)
# ============================================================================

def update_running_state(patient_id: int, speed: Optional[float], minutes: Optional[float]) -> None:
    """
    Upserta el estado de running en clinical.db.exercise_progress.
    Reemplaza functions.actualizar_estado_running.
    """
    if not patient_id or speed is None or minutes is None:
        return

    try:
        speed_val = float(speed)
        minutes_val = float(minutes)
    except (TypeError, ValueError):
        return

    reps = max(1, int(round(minutes_val / 0.5)))

    conn = get_clinical_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO exercise_progress
                (patient_id, exercise_key, progression_key, current_level, current_session,
                 current_weight, last_reps, extra_load, updated_at)
            VALUES (?, 'running', 'matrix_3x9', ?, 1, ?, ?, 0, datetime('now', 'localtime'))
            ON CONFLICT(patient_id, exercise_key) DO UPDATE SET
                current_weight = excluded.current_weight,
                current_level  = excluded.current_level,
                last_reps      = excluded.last_reps,
                updated_at     = excluded.updated_at
        """, [patient_id, min(reps, 9), speed_val, reps])
        conn.commit()
    finally:
        conn.close()


# ============================================================================
# OPTIMIZED PLAN PERSISTENCE (OMV-55, OMV-56: replaces main.guardar_plan_optimizado)
# ============================================================================

_BODYWEIGHT_KEYS = {'dip', 'chinup', 'pullup'}


def save_optimized_plan(
    patient_id: int,
    plan_dias: List[dict],
    datos_fuerza: Dict[str, dict],
    *,
    name: Optional[str] = None,
    distribution_key: Optional[str] = None,
    progression_key: str = 'matrix_3x9',
    source_strength_id: Optional[int] = None,
    config: Optional[dict] = None,
) -> int:
    """
    Persiste un plan optimizado en clinical.db.training_plans_v2 y siembra
    exercise_progress para cada ejercicio del plan.

    Reemplaza main.guardar_plan_optimizado (que escribía a PLANES_ENTRENAMIENTO legacy).

    Args:
        patient_id: id de clinical.db.patients
        plan_dias: [{'dia': 1, 'ejercicios': ['backSquat', ...]}]
        datos_fuerza: {ejercicio: {'weight': 100, 'reps': 5, 'minutes': 3, 'bodyweight': 75}}
    """
    if not patient_id:
        raise ValueError('patient_id requerido')
    if not plan_dias:
        raise ValueError('plan_dias requerido')

    plan_data = {'dias': plan_dias}
    plan_json = json.dumps(plan_data, ensure_ascii=False)
    total_days = len(plan_dias)

    conn = get_clinical_connection()
    try:
        cur = conn.cursor()

        # Desactivar planes anteriores del paciente
        cur.execute(
            "UPDATE training_plans_v2 SET active = 0 WHERE patient_id = ?",
            [patient_id],
        )

        cur.execute("""
            INSERT INTO training_plans_v2
                (patient_id, name, distribution_key, progression_key,
                 total_days, current_day, active, plan_json,
                 source_strength_id, config_json, cycle_week, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?, 1,
                    datetime('now', 'localtime'),
                    datetime('now', 'localtime'))
        """, [
            patient_id, name, distribution_key, progression_key,
            total_days, plan_json, source_strength_id,
            json.dumps(config) if config else None,
        ])
        plan_id = cur.lastrowid

        # Sembrar exercise_progress (sin pisar progresion ya existente)
        ejercicios_set = set()
        for dia in plan_dias:
            for ej in dia.get('ejercicios', []):
                if isinstance(ej, dict):
                    ejercicios_set.add(str(ej.get('exercise_key') or '').strip())
                else:
                    ejercicios_set.add(str(ej).strip())
        ejercicios_set.discard('')

        for ex_key in ejercicios_set:
            cur.execute(
                "SELECT id FROM exercise_progress WHERE patient_id = ? AND exercise_key = ?",
                [patient_id, ex_key],
            )
            if cur.fetchone():
                continue  # respetar progresion existente

            es_running = ex_key.lower() == 'running'
            es_bodyweight = ex_key.lower() in _BODYWEIGHT_KEYS
            data = datos_fuerza.get(ex_key) or {}

            peso = float(data.get('weight') or 60)
            reps = int(data.get('reps') or 1)
            minutos = data.get('minutes')

            if es_running and minutos is not None:
                try:
                    minutos = float(minutos)
                    reps = max(1, int(round(minutos / 0.5)))
                except (TypeError, ValueError):
                    pass

            reps = max(1, min(10, reps))
            level = min(reps, 9)

            extra_load = 0.0
            current_weight = peso
            if es_bodyweight:
                bodyweight = float(data.get('bodyweight') or peso)
                extra_load = max(0.0, peso - bodyweight)
                current_weight = bodyweight

            cur.execute("""
                INSERT INTO exercise_progress
                    (patient_id, exercise_key, progression_key, current_level,
                     current_session, current_weight, last_reps, extra_load, updated_at)
                VALUES (?, ?, ?, ?, 1, ?, ?, ?, datetime('now', 'localtime'))
            """, [
                patient_id, ex_key, progression_key, level,
                current_weight, reps, extra_load,
            ])

        conn.commit()
        return plan_id
    finally:
        conn.close()


# ============================================================================
# OPTIMIZER (OMV-53: real /plans/<id>/optimize backed by PuLP)
# ============================================================================

CATEGORY_EXERCISES = {
    'squat':           ['backSquat', 'frontSquat'],
    'floorPull':       ['deadlift', 'sumoDeadlift', 'powerClean'],
    'horizontalPress': ['benchPress', 'inclineBenchPress', 'dip'],
    'verticalPress':   ['overheadPress', 'snatchPress', 'pushPress'],
    'pullup':          ['pullup', 'chinup', 'pendlayRow'],
}
CATEGORY_KEYS = list(CATEGORY_EXERCISES.keys())


def _ratio_distribution(scores: List[float], total: int) -> List[int]:
    """Reparte `total` entre items en `scores` (mas debiles → mas sesiones)."""
    nz = [s for s in scores if s > 0]
    if not nz or total <= 0:
        return [0] * len(scores)
    max_score = max(nz)
    ratios = [(max_score / s if s > 0 else 0) for s in scores]
    suma = sum(ratios)
    if suma <= 0:
        return [0] * len(scores)
    mult = total / suma
    return [round(r * mult) if r > 0 else 0 for r in ratios]


def _balance(distribution: Dict[str, int], target_total: int, scores: Dict[str, float]) -> None:
    """Ajusta distribucion para que sumen exactamente target_total."""
    if not distribution:
        return
    diff = target_total - sum(distribution.values())
    if diff > 0:
        weakest = min(distribution.keys(), key=lambda k: scores.get(k, 100))
        distribution[weakest] += diff
    elif diff < 0:
        strongest = max(distribution.keys(), key=lambda k: scores.get(k, 0))
        distribution[strongest] = max(0, distribution[strongest] + diff)


def optimize_plan_for_patient(
    patient_id: int,
    *,
    numero_dias: int = 3,
    numero_ejercicios: int = 3,
    running_config: Optional[dict] = None,
    source_strength_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Optimiza distribucion de entrenamiento para un paciente.

    Lee el strength_test mas reciente (o el indicado por source_strength_id),
    distribuye sesiones priorizando debilidades, llama PuLP para minimizar conflictos
    de musculos, y persiste el plan en training_plans_v2.

    Returns:
        {
            'relativeData': {...},
            'optimizationResults': {...},
            'plan_id': int | None,
        }
    """
    running_config = running_config or {}
    incluir_correr = bool(running_config.get('enabled') or running_config.get('included'))
    dias_correr = running_config.get('days') or []
    velocidad_inicial = float(running_config.get('initialSpeed') or running_config.get('speed') or 0)
    minutos_iniciales = float(running_config.get('initialMinutes') or running_config.get('minutes') or 0)

    total_sesiones = numero_dias * numero_ejercicios

    # 1) Cargar strength_test
    conn = get_clinical_connection(sqlite3.Row)
    try:
        cur = conn.cursor()
        if source_strength_id:
            cur.execute("""
                SELECT id, patient_id, lift_inputs_json, lifts_results_json, categories_results_json
                FROM strength_tests WHERE id = ? AND patient_id = ?
            """, [source_strength_id, patient_id])
        else:
            cur.execute("""
                SELECT id, patient_id, lift_inputs_json, lifts_results_json, categories_results_json
                FROM strength_tests
                WHERE patient_id = ?
                ORDER BY fecha DESC , id DESC LIMIT 1
            """, [patient_id])
        row = cur.fetchone()
    finally:
        conn.close()

    if not row:
        raise ValueError('No hay strength_test para el paciente')

    used_strength_id = row['id']
    categories_results = _decode(row['categories_results_json']) or {}
    lifts_results = _decode(row['lifts_results_json']) or {}
    lift_inputs = _decode(row['lift_inputs_json']) or {}

    has_categories = isinstance(categories_results, dict) and any(
        float(categories_results.get(k, 0) or 0) > 0 for k in CATEGORY_KEYS
    )
    has_lifts = isinstance(lifts_results, dict) and any(
        isinstance(v, dict) and v.get('userScore') is not None
        for v in lifts_results.values()
    )
    if not has_categories and not has_lifts:
        raise ValueError(
            'strength_test sin datos de categorias/ejercicios; no se puede optimizar'
        )

    # 2) Running state (si aplica)
    if incluir_correr and (velocidad_inicial > 0 or minutos_iniciales > 0):
        update_running_state(patient_id, velocidad_inicial, minutos_iniciales)

    # 3) Distribucion por categoria
    relative_categories: Dict[str, dict] = {}
    cat_scores = [float(categories_results.get(k, 0) or 0) for k in CATEGORY_KEYS]
    sesiones_por_cat_list = _ratio_distribution(cat_scores, total_sesiones)
    sesiones_por_cat = dict(zip(CATEGORY_KEYS, sesiones_por_cat_list))

    for i, k in enumerate(CATEGORY_KEYS):
        relative_categories[k] = {'value': cat_scores[i], 'type': 'neutral'}

    # 4) Distribucion por ejercicio dentro de cada categoria
    exercise_percentages: Dict[str, dict] = {}
    exercise_distribution: Dict[str, int] = {}
    scores_ej: Dict[str, float] = {}

    if isinstance(lifts_results, dict):
        for ex_name, ex_data in lifts_results.items():
            if isinstance(ex_data, dict) and ex_data.get('userScore') is not None:
                try:
                    user_score = float(ex_data['userScore'])
                except (TypeError, ValueError):
                    continue
                scores_ej[ex_name] = user_score
                exercise_percentages[ex_name] = {
                    'value': user_score,
                    'type': 'fortaleza' if user_score > 60 else 'debilidad',
                }

        for cat, ejs in CATEGORY_EXERCISES.items():
            disponibles = [e for e in ejs if e in scores_ej]
            if not disponibles:
                continue
            dist = _ratio_distribution([scores_ej[e] for e in disponibles], sesiones_por_cat[cat])
            for ej, n in zip(disponibles, dist):
                exercise_distribution[ej] = n

        _balance(exercise_distribution, total_sesiones, scores_ej)

    # 5) PuLP optimizer (best-effort)
    plan_dias: List[dict] = []
    penalty: Optional[float] = None
    plan_entrenamiento: Dict[str, list] = {}

    if exercise_distribution:
        try:
            try:
                from workout_optimizer import optimize_split  # legacy module
            except ImportError:
                # fallback to absolute path import
                import importlib.util
                import os
                spec_path = os.path.join(
                    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                    'workout_optimizer.py',
                )
                spec = importlib.util.spec_from_file_location('workout_optimizer', spec_path)
                if spec and spec.loader:
                    mod = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(mod)  # type: ignore
                    optimize_split = mod.optimize_split  # type: ignore
                else:
                    raise

            sessions_dict = {ej: s for ej, s in exercise_distribution.items() if s > 0}
            if sessions_dict:
                grid, penalty = optimize_split(sessions_dict, days=numero_dias, ex_per_day=numero_ejercicios)

                if incluir_correr:
                    valid_days = [int(d) for d in dias_correr if 1 <= int(d) <= numero_dias] \
                                 or list(range(1, numero_dias + 1))
                    for dia in valid_days:
                        idx = dia - 1
                        if idx in grid and 'running' not in grid[idx]:
                            grid[idx].append('running')

                for d in sorted(grid.keys()):
                    plan_entrenamiento[f'dia_{d + 1}'] = grid[d]
                    plan_dias.append({'dia': d + 1, 'ejercicios': grid[d]})
        except Exception as e:
            # Optimizador opcional; si falla devolvemos solo la distribucion
            plan_dias = []

    # 6) Persistir plan
    plan_id: Optional[int] = None
    if plan_dias:
        datos_fuerza: Dict[str, dict] = {}
        for ej, d in (lift_inputs or {}).items():
            if isinstance(d, dict):
                datos_fuerza[ej] = {
                    'weight': d.get('weight', 50),
                    'reps': d.get('reps', 1),
                }

        if incluir_correr:
            datos_fuerza['running'] = {
                'weight': velocidad_inicial if velocidad_inicial > 0 else 8,
                'minutes': minutos_iniciales if minutos_iniciales > 0 else 3,
                'reps': max(1, int(round((minutos_iniciales or 3) / 0.5))),
            }

        try:
            plan_id = save_optimized_plan(
                patient_id, plan_dias, datos_fuerza,
                distribution_key='weakness_priority',
                progression_key='matrix_3x9',
                source_strength_id=used_strength_id,
                config={
                    'numeroDias': numero_dias,
                    'numeroEjercicios': numero_ejercicios,
                    'runningConfig': running_config,
                },
            )
        except Exception:
            plan_id = None

    return {
        'relativeData': {
            'categories': relative_categories,
            'exercises': exercise_percentages,
        },
        'optimizationResults': {
            'categorias': sesiones_por_cat,
            'ejercicios': exercise_distribution,
            'parametros': {
                'numeroDias': numero_dias,
                'numeroEjercicios': numero_ejercicios,
                'totalSesiones': total_sesiones,
                'penalty': penalty,
            },
            'planEntrenamiento': plan_entrenamiento,
        },
        'plan_id': plan_id,
        'source_strength_id': used_strength_id,
    }


# ============================================================================
# PLAN HELPERS (OMV-55)
# ============================================================================

def _normalize_plan_row(row: sqlite3.Row) -> dict:
    """Convierte una fila de training_plans_v2 a dict con alias backward-compatible."""
    d = dict(row)
    # Aliases legacy (PLANES_ENTRENAMIENTO):
    d.setdefault('user_id', d.get('patient_id'))
    d.setdefault('current_dia', d.get('current_day'))
    d.setdefault('total_dias', d.get('total_days'))
    d.setdefault('created_date', d.get('created_at'))
    if d.get('plan_json'):
        try:
            d['plan_data'] = json.loads(d['plan_json'])
        except (TypeError, ValueError, json.JSONDecodeError):
            pass
    return d


def list_plans_for_patient(patient_id: int) -> List[dict]:
    conn = get_clinical_connection(sqlite3.Row)
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM training_plans_v2
            WHERE patient_id = ?
            ORDER BY created_at DESC
        """, [patient_id])
        return [_normalize_plan_row(r) for r in cur.fetchall()]
    finally:
        conn.close()


def get_plan_by_id(plan_id: int) -> Optional[dict]:
    conn = get_clinical_connection(sqlite3.Row)
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM training_plans_v2 WHERE id = ?", [plan_id])
        r = cur.fetchone()
        return _normalize_plan_row(r) if r else None
    finally:
        conn.close()


def get_active_plan(patient_id: int) -> Optional[dict]:
    conn = get_clinical_connection(sqlite3.Row)
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM training_plans_v2
            WHERE patient_id = ? AND active = 1
            ORDER BY created_at DESC , id DESC LIMIT 1
        """, [patient_id])
        r = cur.fetchone()
        return _normalize_plan_row(r) if r else None
    finally:
        conn.close()


def create_manual_plan(
    patient_id: int,
    plan_data: Any,
    total_days: int,
    *,
    name: Optional[str] = None,
    distribution_key: Optional[str] = None,
    progression_key: Optional[str] = None,
) -> int:
    """Crea un plan manual (sin optimizador) y desactiva los previos."""
    if isinstance(plan_data, str):
        plan_json = plan_data
    else:
        plan_json = json.dumps(plan_data, ensure_ascii=False)

    conn = get_clinical_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE training_plans_v2 SET active = 0 WHERE patient_id = ?",
            [patient_id],
        )
        cur.execute("""
            INSERT INTO training_plans_v2
                (patient_id, name, distribution_key, progression_key,
                 total_days, current_day, active, plan_json, cycle_week,
                 created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, 1, ?, 1,
                    datetime('now', 'localtime'),
                    datetime('now', 'localtime'))
        """, [patient_id, name, distribution_key, progression_key, total_days, plan_json])
        plan_id = cur.lastrowid
        conn.commit()
        return plan_id
    finally:
        conn.close()


def advance_plan_day(patient_id: int) -> Optional[dict]:
    """
    Avanza al siguiente dia del plan activo. Si pasamos por todos los dias del ciclo,
    incrementa cycle_week y marca last_advanced_at (OMV-61).
    """
    conn = get_clinical_connection(sqlite3.Row)
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, current_day, total_days, cycle_week
            FROM training_plans_v2
            WHERE patient_id = ? AND active = 1
            ORDER BY created_at DESC , id DESC LIMIT 1
        """, [patient_id])
        plan = cur.fetchone()
        if not plan:
            return None

        plan_id = plan['id']
        current = plan['current_day'] or 1
        total = plan['total_days'] or 1
        cycle_week = plan['cycle_week'] or 1

        new_day = current + 1
        wrapped = False
        if new_day > total:
            new_day = 1
            cycle_week += 1
            wrapped = True

        cur.execute("""
            UPDATE training_plans_v2
            SET current_day = ?, cycle_week = ?,
                last_advanced_at = datetime('now', 'localtime'),
                updated_at = datetime('now', 'localtime')
            WHERE id = ?
        """, [new_day, cycle_week, plan_id])
        conn.commit()

        return {
            'plan_id': plan_id,
            'dia_actual': new_day,
            'current_day': new_day,
            'total_dias': total,
            'cycle_week': cycle_week,
            'cycle_completed': wrapped,
        }
    finally:
        conn.close()


def _extract_day_exercises(plan_data, dia):
    """Ejercicios crudos de un día del plan (soporta dias como lista o dict).
    Misma lógica que el endpoint /sessions/today."""
    if not isinstance(plan_data, dict):
        return []
    dias = plan_data.get('dias', [])
    if isinstance(dias, list):
        for d in dias:
            if isinstance(d, dict) and d.get('dia') == dia:
                return d.get('ejercicios', []) or []
    elif isinstance(dias, dict):
        day_data = dias.get(str(dia)) or dias.get(f'dia_{dia}')
        if day_data:
            return day_data if isinstance(day_data, list) else day_data.get('ejercicios', []) or []
    return []


def predict_next_workouts(patient_id, num_predictions=5):
    """Previsualiza las próximas N sesiones del plan activo (port v3 de
    functions.predict_next_workouts, OMV).

    Recorre los días del plan desde current_day (con wraparound al completar el
    ciclo) y, para cada ejercicio, adjunta su prescripción VIGENTE
    (exercise_progress + matriz de progresión). Es un preview: no simula el
    avance de nivel entre las sesiones futuras (eso ocurre al registrar cada
    sesión real vía advance_progression_after_session).
    """
    plan = get_active_plan(patient_id)
    if not plan:
        return []
    plan_data = plan.get('plan_data')
    total = plan.get('total_dias', 1) or 1
    dia = plan.get('current_dia', 1) or 1

    out = []
    guard = 0
    max_iter = num_predictions * (total + 1) + total
    while len(out) < num_predictions and guard < max_iter:
        guard += 1
        if dia > total:
            dia = 1
        raw = _extract_day_exercises(plan_data, dia)
        if raw:
            ejercicios = []
            for ex in raw:
                if isinstance(ex, dict):
                    key = str(ex.get('exercise_key') or ex.get('ejercicio') or '').strip()
                    base = dict(ex)
                else:
                    key = str(ex).strip()
                    base = {'exercise_key': key}
                if not key:
                    continue
                try:
                    presc = get_progression_prescription(patient_id, key)
                    if presc:
                        base.setdefault('prescription', presc.get('prescription'))
                        base.setdefault('current_session', presc.get('current_session'))
                        base.setdefault('current_level', presc.get('current_level'))
                        base.setdefault('current_weight', presc.get('current_weight'))
                        base.setdefault('is_test', presc.get('is_test'))
                        base.setdefault('sets', presc.get('sets'))
                except Exception:
                    pass
                ejercicios.append(base)
            out.append({'orden': len(out) + 1, 'dia': dia, 'ejercicios': ejercicios})
        dia += 1
    return out


# ============================================================================
# MUSCLE RECOVERY + EXERCISE ALTERNATIVES (Fitbod-style, P3)
# ============================================================================

# Ventana de recuperación (días) según rol del músculo en el ejercicio.
_RECOVERY_WINDOW_DAYS = {'primary': 3.0, 'secondary': 2.0}


def _load_exercise_muscle_map(cur):
    """exercise_key -> (primary[], secondary[]) desde clinical.db.exercises."""
    ex_map = {}
    for r in cur.execute("SELECT key, muscle_groups, secondary_muscles FROM exercises"):
        try:
            prim = json.loads(r['muscle_groups']) if r['muscle_groups'] else []
        except (TypeError, ValueError, json.JSONDecodeError):
            prim = []
        try:
            sec = json.loads(r['secondary_muscles']) if r['secondary_muscles'] else []
        except (TypeError, ValueError, json.JSONDecodeError):
            sec = []
        ex_map[r['key']] = (prim or [], sec or [])
    return ex_map


def compute_muscle_recovery(patient_id, lookback_days=10):
    """Recuperación por grupo muscular a partir del historial real de sesiones.

    Para cada músculo entrenado en `lookback_days`, el % de recuperación es
    min(100, días_desde / ventana * 100), donde la ventana depende de si el
    músculo fue primario (3d) o secundario (2d) en el ejercicio. Se toma el
    estímulo MÁS exigente (menor %). Músculos no entrenados recientemente = 100.
    """
    conn = get_clinical_connection(sqlite3.Row)
    try:
        cur = conn.cursor()
        ex_map = _load_exercise_muscle_map(cur)
        cur.execute(
            """SELECT s.fecha AS fecha, se.exercise_key AS exercise_key
               FROM training_sessions s
               JOIN session_exercises se ON se.session_id = s.id
               WHERE s.patient_id = ? AND s.fecha >= date('now', ?)""",
            [patient_id, f'-{int(lookback_days)} days'],
        )
        today = datetime.now().date()
        rec, last_trained = {}, {}
        for row in cur.fetchall():
            try:
                d = datetime.strptime(str(row['fecha'])[:10], '%Y-%m-%d').date()
            except (TypeError, ValueError):
                continue
            days_ago = max(0, (today - d).days)
            prim, sec = ex_map.get(row['exercise_key'], ([], []))
            for role, muscles in (('primary', prim), ('secondary', sec)):
                window = _RECOVERY_WINDOW_DAYS[role]
                pct = min(100.0, days_ago / window * 100.0)
                for m in muscles:
                    if m not in rec or pct < rec[m]:
                        rec[m] = pct
                    if m not in last_trained or d > last_trained[m]:
                        last_trained[m] = d
        out = []
        for m, pct in sorted(rec.items(), key=lambda kv: kv[1]):
            p = round(pct)
            out.append({
                'muscle': m,
                'recovery_pct': p,
                'status': 'fresh' if p >= 90 else ('recovering' if p >= 50 else 'fatigued'),
                'last_trained': last_trained[m].isoformat() if m in last_trained else None,
                'days_ago': (today - last_trained[m]).days if m in last_trained else None,
            })
        return out
    finally:
        conn.close()


def get_exercise_alternatives(exercise_key, limit=8):
    """Ejercicios alternativos que comparten grupo muscular primario.

    El "exercise replacement" de Fitbod: dado un ejercicio, devuelve otros que
    trabajan los mismos músculos primarios (rankeados por solapamiento y misma
    categoría), para que el paciente elija un reemplazo equivalente.
    """
    conn = get_clinical_connection(sqlite3.Row)
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM exercises WHERE key = ?", [exercise_key])
        base = cur.fetchone()
        if not base:
            return None
        try:
            prim = set(json.loads(base['muscle_groups']) if base['muscle_groups'] else [])
        except (TypeError, ValueError, json.JSONDecodeError):
            prim = set()
        base_cat = base['category']
        ranked = []
        for r in cur.execute(
            "SELECT key, name_es, name_en, muscle_groups, secondary_muscles, "
            "equipment, category, modality, is_compound FROM exercises WHERE key != ?",
            [exercise_key],
        ):
            try:
                mg = set(json.loads(r['muscle_groups']) if r['muscle_groups'] else [])
            except (TypeError, ValueError, json.JSONDecodeError):
                mg = set()
            overlap = len(prim & mg)
            if overlap > 0:
                ranked.append((overlap, 0 if r['category'] == base_cat else 1, dict(r)))
        ranked.sort(key=lambda t: (-t[0], t[1]))
        return {
            'base': {'key': base['key'], 'name_es': base['name_es'],
                     'muscle_groups': list(prim)},
            'alternatives': [t[2] for t in ranked[:limit]],
        }
    finally:
        conn.close()


# ============================================================================
# STRENGTH STANDARDS / PERCENTILE (P6 — datos de Strength Level)
# ============================================================================

_LB_PER_KG = 2.2046226218
# Nivel -> percentil aproximado (convención Strength Level).
_TIERS = [('beginner', 5), ('novice', 20), ('intermediate', 50), ('advanced', 80), ('elite', 95)]
_LEVEL_LABEL = {
    'untrained': 'Sin entrenar', 'beginner': 'Principiante', 'novice': 'Novato',
    'intermediate': 'Intermedio', 'advanced': 'Avanzado', 'elite': 'Élite',
}


def _interp_percentile(lift_lb, xs, ys):
    if lift_lb <= xs[0]:
        return round(max(0.0, lift_lb / xs[0] * ys[0]), 1) if xs[0] > 0 else 0.0
    if lift_lb >= xs[-1]:
        return round(min(99.0, ys[-1] + (lift_lb - xs[-1]) / xs[-1] * (100 - ys[-1])), 1)
    for i in range(len(xs) - 1):
        if xs[i] <= lift_lb <= xs[i + 1]:
            frac = (lift_lb - xs[i]) / (xs[i + 1] - xs[i]) if xs[i + 1] > xs[i] else 0
            return round(ys[i] + frac * (ys[i + 1] - ys[i]), 1)
    return None


def classify_strength(exercise_slug, sex, bodyweight, lift, unit='kg'):
    """Clasifica un levantamiento contra los estándares poblacionales.

    Devuelve nivel (untrained..elite), percentil estimado y los umbrales por
    nivel al peso corporal más cercano. None si no hay estándares.
    """
    conn = get_clinical_connection(sqlite3.Row)
    try:
        cur = conn.cursor()
        bw_lb = bodyweight * _LB_PER_KG if unit == 'kg' else bodyweight
        lift_lb = lift * _LB_PER_KG if unit == 'kg' else lift
        cur.execute(
            """SELECT * FROM strength_standards_pop
               WHERE exercise_slug = ? AND sex = ? AND metric = 'bodyweight'
               ORDER BY ABS(bin - ?) ASC LIMIT 1""",
            [exercise_slug, sex.upper(), bw_lb],
        )
        row = cur.fetchone()
        if not row:
            return None
        tiers = {k: row[k] for k, _ in _TIERS}
        xs = [tiers[k] for k, _ in _TIERS]
        ys = [p for _, p in _TIERS]
        pct = _interp_percentile(lift_lb, xs, ys)
        level = 'untrained'
        for k, _ in _TIERS:
            if lift_lb >= tiers[k]:
                level = k
            else:
                break

        def to_unit(v):
            return round(v / _LB_PER_KG, 1) if unit == 'kg' else round(v, 1)

        return {
            'exercise_slug': exercise_slug,
            'exercise_name': row['exercise_name'],
            'sex': sex.upper(),
            'bodyweight_bin_lb': row['bin'],
            'unit': unit,
            'lift': round(lift, 1),
            'level': level,
            'level_label': _LEVEL_LABEL.get(level, level),
            'percentile': pct,
            'thresholds': {k: to_unit(tiers[k]) for k, _ in _TIERS},
        }
    finally:
        conn.close()


# Cardio: nivel -> percentil (más rápido = mejor; tiempos ascendentes elite..beginner)
_CARDIO_TIERS = [('elite', 95), ('advanced', 80), ('intermediate', 50), ('novice', 20), ('beginner', 5)]


def _fmt_secs(s):
    if s is None:
        return None
    s = int(round(s))
    h, r = divmod(s, 3600)
    m, sec = divmod(r, 60)
    return f'{h}:{m:02d}:{sec:02d}' if h else f'{m}:{sec:02d}'


def classify_cardio(sport, distance, sex, age, time_seconds):
    """Clasifica un tiempo de carrera contra cardio_standards (Running Level).

    Menor tiempo = mejor. Devuelve nivel, percentil estimado y los umbrales por
    nivel a la edad más cercana. None si no hay estándares.
    """
    conn = get_clinical_connection(sqlite3.Row)
    try:
        cur = conn.cursor()
        cur.execute(
            """SELECT * FROM cardio_standards
               WHERE sport = ? AND distance = ? AND sex = ?
               ORDER BY ABS(age - ?) ASC LIMIT 1""",
            [sport, distance, sex.upper(), age],
        )
        row = cur.fetchone()
        if not row:
            return None
        tiers = {k: row[k] for k, _ in _CARDIO_TIERS}
        t = float(time_seconds)
        level = 'untrained'
        for k, _ in _CARDIO_TIERS:  # elite -> beginner (tiempos crecientes)
            if tiers[k] is not None and t <= tiers[k]:
                level = k
                break
        xs = [tiers[k] for k, _ in _CARDIO_TIERS]
        ys = [p for _, p in _CARDIO_TIERS]
        if None in xs:
            pct = None
        elif t <= xs[0]:
            pct = round(min(99.0, ys[0] + (xs[0] - t) / xs[0] * (99 - ys[0])), 1)
        elif t >= xs[-1]:
            pct = round(max(0.0, ys[-1] * (xs[-1] / t)), 1)
        else:
            pct = None
            for i in range(len(xs) - 1):
                if xs[i] <= t <= xs[i + 1]:
                    frac = (t - xs[i]) / (xs[i + 1] - xs[i]) if xs[i + 1] > xs[i] else 0
                    pct = round(ys[i] + frac * (ys[i + 1] - ys[i]), 1)
                    break
        return {
            'sport': sport, 'distance': distance, 'sex': sex.upper(),
            'age_bin': row['age'], 'time_seconds': round(t, 1), 'time': _fmt_secs(t),
            'level': level, 'level_label': _LEVEL_LABEL.get(level, level), 'percentile': pct,
            'thresholds': {k: _fmt_secs(tiers[k]) for k, _ in _CARDIO_TIERS},
            'world_record': _fmt_secs(row['world_record']),
        }
    finally:
        conn.close()


# ============================================================================
# PERIODIZATION / PROGRESION (OMV-61)
# ============================================================================

# Matriz de progresion estandar 3x9 (mismas filas que training.py legacy)
DEFAULT_MATRIX = [
    ["1.1.1.1.1", "1.1.1.1.1", "2.1.1.1.1", "2.2.2.1.1", "3.2.2.2.1",
     "4.3.3.2.2", "4.4.3.2.2", "5.4.4.3.3", "6.5.4.3.3"],
    ["1.1.1.1.1", "1.1.1.1.1", "2.2.1.1.1", "3.2.2.2.1", "3.3.2.2.2",
     "4.4.3.3.2", "5.4.4.3.2", "6.5.4.4.3", "7.6.5.4.3"],
    ["1.1.1.1.1", "1.1.1.1.1", "2.2.2.1.1", "3.3.2.2.2", "4.3.3.2.2",
     "5.4.4.3.3", "6.5.4.4.3", "7.6.5.4.4", "8.7.6.5.4"],
]
TEST_SESSION_NUMBER = 4


def get_progression_prescription(
    patient_id: int,
    exercise_key: str,
) -> Optional[dict]:
    """
    Devuelve la prescripcion del dia para un ejercicio segun su exercise_progress.
    Usa la matriz de la progression_template asociada (default matrix_3x9).
    Replica la logica de training.obtener_entrenamiento_del_dia (sin formatear texto).
    """
    conn = get_clinical_connection(sqlite3.Row)
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT current_level, current_session, current_weight, last_reps,
                   extra_load, progression_key
            FROM exercise_progress
            WHERE patient_id = ? AND exercise_key = ?
        """, [patient_id, exercise_key])
        state = cur.fetchone()
        if not state:
            return None

        # Cargar matriz desde progression_templates (si la hay) o usar default
        matrix = DEFAULT_MATRIX
        prog_key = state['progression_key'] or 'matrix_3x9'
        cur.execute("SELECT config_json FROM progression_templates WHERE key = ?", [prog_key])
        tpl = cur.fetchone()
        if tpl and tpl['config_json']:
            try:
                cfg = json.loads(tpl['config_json'])
                if isinstance(cfg.get('levels'), list) and cfg['levels']:
                    matrix = cfg['levels']
            except (TypeError, ValueError, json.JSONDecodeError):
                pass

        sesion = state['current_session'] or 1
        level = state['current_level'] or 1
        peso = state['current_weight'] or 0
        lastre = state['extra_load'] or 0

        is_test = sesion == TEST_SESSION_NUMBER
        result = {
            'exercise_key': exercise_key,
            'current_session': sesion,
            'current_level': level,
            'current_weight': peso,
            'extra_load': lastre,
            'is_test': is_test,
            'last_reps': state['last_reps'],
        }

        if is_test:
            result['prescription'] = 'TEST: 1 serie al fallo'
            return result

        fila_idx = max(0, min(len(matrix) - 1, sesion - 1))
        col_idx = max(0, min(len(matrix[fila_idx]) - 1, level - 1))
        prescripcion = matrix[fila_idx][col_idx]
        result['prescription'] = prescripcion
        result['sets'] = prescripcion.split('.')
        result['num_sets'] = len(result['sets'])
        return result
    finally:
        conn.close()


def advance_progression_after_session(
    patient_id: int,
    exercises: List[dict],
) -> Dict[str, str]:
    """
    Avanza exercise_progress despues de una sesion (OMV-61).

    exercises: lista de items con:
        - exercise_key (str)
        - completed (bool, default True)
        - test_reps (int, opcional, para sesiones TEST)
        - test_minutes (float, opcional, para running TEST)
        - weight_increment (float, opcional, kg si reps==10)

    Reglas (replica simplificada de training.registrar_sesion_completada):
        - Si era TEST (current_session==4):
            * registrar last_reps, ajustar level
            * si reps==10 y weight_increment>0 → subir peso, level=1
            * resetear current_session=1
        - Si era sesion normal:
            * completed=True  → current_session += 1
            * completed=False → current_session -= 1 (y si llega a 0, va a TEST)

    Returns: {exercise_key: mensaje} con resultado por ejercicio.
    """
    if not patient_id or not exercises:
        return {}

    conn = get_clinical_connection(sqlite3.Row)
    bodyweight_keys = {'dip', 'chinup', 'pullup'}
    results: Dict[str, str] = {}
    try:
        cur = conn.cursor()
        for ex in exercises:
            if not isinstance(ex, dict):
                continue
            ex_key = (ex.get('exercise_key') or ex.get('ejercicio') or '').strip()
            if not ex_key:
                continue

            cur.execute("""
                SELECT id, current_level, current_session, current_weight, last_reps, extra_load
                FROM exercise_progress
                WHERE patient_id = ? AND exercise_key = ?
            """, [patient_id, ex_key])
            row = cur.fetchone()
            if not row:
                results[ex_key] = 'No state'
                continue

            state = dict(row)
            new_level = state['current_level'] or 1
            new_session = state['current_session'] or 1
            new_weight = state['current_weight'] or 0
            new_lastre = state['extra_load'] or 0
            mensaje = ''

            completed = ex.get('completed', True)
            converted_test = bool(ex.get('converted_to_test'))
            es_running = ex_key.lower() == 'running'
            es_bodyweight = ex_key.lower() in bodyweight_keys

            if new_session == TEST_SESSION_NUMBER or converted_test:
                if es_running:
                    minutos = ex.get('test_minutes', 0)
                    try:
                        minutos = float(minutos)
                    except (TypeError, ValueError):
                        minutos = 0
                    velocidad = ex.get('test_speed') or new_weight
                    incremento_velocidad = float(ex.get('speed_increment') or 0)
                    minutos = max(0.5, min(5.0, minutos or 0.5))
                    reps_eq = max(1, min(10, int(round(minutos / 0.5))))
                    new_session = 1
                    new_level = min(reps_eq, 9)
                    if minutos >= 5.0 and incremento_velocidad > 0:
                        new_weight = max(0, float(velocidad)) + incremento_velocidad
                        new_level = 1
                        mensaje = f'Velocidad +{incremento_velocidad:.1f} → {new_weight:.1f} km/h. Reset.'
                    else:
                        new_weight = float(velocidad) if velocidad else new_weight
                        mensaje = f'Tiempo: {minutos:.1f} min @ {new_weight:.1f} km/h. Reset.'
                    cur.execute(
                        "UPDATE exercise_progress SET last_reps = ? WHERE id = ?",
                        [reps_eq, state['id']],
                    )
                else:
                    test_reps = ex.get('test_reps')
                    if test_reps is not None:
                        try:
                            test_reps = int(test_reps)
                        except (TypeError, ValueError):
                            test_reps = 1
                        test_reps = max(1, min(10, test_reps))
                        new_level = min(test_reps, 9)
                        new_session = 1

                        increment = 0.0
                        if test_reps == 10:
                            try:
                                increment = float(ex.get('weight_increment') or 0)
                            except (TypeError, ValueError):
                                increment = 0.0

                        cur.execute(
                            "UPDATE exercise_progress SET last_reps = ? WHERE id = ?",
                            [test_reps, state['id']],
                        )

                        if test_reps == 10 and increment > 0:
                            if es_bodyweight:
                                new_lastre = (new_lastre or 0) + increment
                            else:
                                new_weight = (new_weight or 0) + increment
                            new_level = 1
                            mensaje = f'Test 10 reps + incremento {increment} kg. Reset.'
                        else:
                            mensaje = f'Test registrado: {test_reps} reps. Reset.'
                    else:
                        new_session = 1
                        mensaje = 'Test sin datos especificos. Reset.'
            else:
                if completed:
                    new_session += 1
                    mensaje = f'Sesion completada → siguiente sesion {new_session}.'
                else:
                    new_session -= 1
                    mensaje = 'Sesion no completada. Regresando.'
                    if new_session <= 0:
                        new_session = TEST_SESSION_NUMBER
                        try:
                            decremento = abs(float(ex.get('weight_increment') or 0))
                        except (TypeError, ValueError):
                            decremento = 0
                        if decremento > 0:
                            if es_bodyweight:
                                new_lastre = max(0, (new_lastre or 0) - decremento)
                            else:
                                new_weight = max(0, (new_weight or 0) - decremento)
                            mensaje = f'Peso/lastre disminuido {decremento} kg. Test pendiente.'
                        else:
                            mensaje = 'Ciclo no completado. Test pendiente.'

            cur.execute("""
                UPDATE exercise_progress
                SET current_level = ?, current_session = ?, current_weight = ?,
                    extra_load = ?, updated_at = datetime('now', 'localtime')
                WHERE id = ?
            """, [new_level, new_session, new_weight, new_lastre, state['id']])
            results[ex_key] = mensaje

        conn.commit()
        return results
    finally:
        conn.close()


# ============================================================================
# RESOLVER HELPERS
# ============================================================================

def resolve_target_patient_id(user, target_name=None):
    """Resuelve el patient_id objetivo: target_name si admin/specialist, else el del user."""
    from ..common.auth import check_patient_access  # local to avoid circular
    if target_name:
        if not check_patient_access(user, target_name):
            return None, 'forbidden'
        target = resolve_patient_id(target_name)
    else:
        target = resolve_patient_id(user.get('nombre_apellido') or str(user.get('user_id') or ''))
    if not target:
        return None, 'not_found'
    return target, None
