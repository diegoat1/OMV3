"""
Solver de nutrición v3 — implementación NATIVA (OMV-52, deuda saldada).

Antes era un wrapper sobre `functions.solve_meal` (legacy). Esta versión porta
la lógica completa (cascada PuLP: Completo → Proteínas → Calorías) acá, sin
depender de `src/functions.py` en runtime. La firma se mantiene estable, así que
`routes.py` no cambia.

Soporta:
  - alimentos independientes (variables libres),
  - dependientes (ratio peso / medida_casera respecto de un base),
  - fijos (cantidad constante),
  - flag `is_not_divisible` por alimento (porciones enteras, ej: 1 huevo).
"""

from pulp import (
    LpProblem, LpVariable, lpSum, LpMinimize, PULP_CBC_CMD, LpStatus, value,
)


def solve_meal(alimentos, objetivo, libertad=5, dependencias=None):
    """
    Solver genérico para una comida: ajusta cantidades de alimentos para alcanzar macros objetivo.

    Args:
        alimentos: lista de dicts con:
            - id: identificador del alimento
            - nombre: nombre del alimento
            - proteina_100g, grasa_100g, carbohidratos_100g: macros por 100g
            - medida_casera_g: gramos por unidad de medida casera
            - medida_desc: descripción de la medida casera (ej: "unidad", "taza")
            - is_not_divisible (opcional): si True, la porción es entera (>=1).
        objetivo: dict con {proteina, grasa, carbohidratos} en gramos
        libertad: % de tolerancia (ej: 10 = ±10%)
        dependencias: lista de grupos de dependencia:
            [{ "base_id": "id_del_base",
               "dependientes": [{"id": "id_dep", "ratio": 0.6, "tipo_ratio": "peso"|"medida_casera"}],
               "fijos": [{"id": "id_fijo", "cantidad_fija": 1}]
            }]

    Returns:
        dict con status, metodo, calidad, alimentos (con cantidades optimizadas), totales
    """
    try:
        if not alimentos:
            return {'status': 'error', 'message': 'No hay alimentos para optimizar'}

        p0 = float(objetivo.get('proteina', 0))
        g0 = float(objetivo.get('grasa', 0))
        ch0 = float(objetivo.get('carbohidratos', 0))
        libertad = float(libertad)

        if p0 + g0 + ch0 <= 0:
            return {'status': 'error', 'message': 'Macros objetivo deben ser > 0'}

        # Build lookup by id
        ali_by_id = {str(a['id']): a for a in alimentos}

        # Identify which alimentos are bases (free variables) vs dependent
        dep_map = {}  # id -> {base_id, ratio, tipo_ratio}
        fijo_map = {}  # id -> cantidad_fija
        if dependencias:
            for grupo in dependencias:
                base_id = str(grupo['base_id'])
                for dep in grupo.get('dependientes', []):
                    dep_id = str(dep['id'])
                    dep_map[dep_id] = {
                        'base_id': base_id,
                        'ratio': float(dep.get('ratio', 1)),
                        'tipo_ratio': dep.get('tipo_ratio', 'peso'),
                    }
                for fij in grupo.get('fijos', []):
                    fij_id = str(fij['id'])
                    fijo_map[fij_id] = float(fij.get('cantidad_fija', 1))

        # Free variables = all alimentos NOT in dep_map and NOT in fijo_map
        free_ids = [str(a['id']) for a in alimentos if str(a['id']) not in dep_map and str(a['id']) not in fijo_map]

        if not free_ids:
            return {'status': 'error', 'message': 'Todos los alimentos son dependientes, necesita al menos uno libre'}

        # Build PuLP data structures
        proteina = {}
        grasa = {}
        carbos = {}
        medida_casera = {}
        medida_desc_map = {}

        for a in alimentos:
            aid = str(a['id'])
            proteina[aid] = float(a.get('proteina_100g', 0))
            grasa[aid] = float(a.get('grasa_100g', 0))
            carbos[aid] = float(a.get('carbohidratos_100g', 0))
            medida_casera[aid] = float(a.get('medida_casera_g', 100))
            medida_desc_map[aid] = a.get('medida_desc', 'g')

        # Create LP variables (porciones in units of medida_casera).
        # Minimum 0.1 portions so no food gets eliminated. Los alimentos con
        # flag is_not_divisible (ej: 1 huevo) usan variable ENTERA (>=1 unidad)
        # — Fitia: estos no se fraccionan. (P4 / flags de optimizador)
        indivisibles = {str(a['id']) for a in alimentos if a.get('is_not_divisible')}
        porciones = {}
        for i in free_ids:
            if i in indivisibles:
                porciones[i] = LpVariable(f"P_{i}", lowBound=1, cat='Integer')
            else:
                porciones[i] = LpVariable(f"P_{i}", lowBound=0.1)

        # Build expressions for dependent alimentos
        porcionesnovar = {}
        for dep_id, dep_info in dep_map.items():
            base_id = dep_info['base_id']
            ratio = dep_info['ratio']
            if base_id in porciones:
                if dep_info['tipo_ratio'] == 'medida_casera':
                    porcionesnovar[dep_id] = porciones[base_id] * ratio
                else:  # peso
                    base_mc = medida_casera[base_id]
                    dep_mc = medida_casera[dep_id]
                    if dep_mc > 0:
                        porcionesnovar[dep_id] = porciones[base_id] * (base_mc * ratio / dep_mc)
                    else:
                        porcionesnovar[dep_id] = porciones[base_id] * ratio

        # Fixed quantity alimentos
        for fij_id, cant in fijo_map.items():
            porcionesnovar[fij_id] = cant

        dep_ids = list(dep_map.keys())
        fijo_ids = list(fijo_map.keys())
        novar_ids = dep_ids + fijo_ids

        # Helper: macro sum expression
        def macro_sum(macro_dict):
            expr = lpSum([medida_casera[i] * porciones[i] * macro_dict[i] / 100 for i in free_ids])
            expr += lpSum([medida_casera[i] * porcionesnovar[i] * macro_dict[i] / 100 for i in novar_ids if i in porcionesnovar])
            return expr

        def cal_sum():
            return macro_sum(proteina) * 4 + macro_sum(carbos) * 4 + macro_sum(grasa) * 9

        cal_objetivo = p0 * 4 + g0 * 9 + ch0 * 4
        met = 0
        metodo_usado = None

        # Slack variables for minimizing deviation (shared across methods)
        sp_o = LpVariable("sp_o", 0)  # protein over
        sp_u = LpVariable("sp_u", 0)  # protein under
        sg_o = LpVariable("sg_o", 0)  # fat over
        sg_u = LpVariable("sg_u", 0)  # fat under
        sc_o = LpVariable("sc_o", 0)  # carbs over
        sc_u = LpVariable("sc_u", 0)  # carbs under

        # Macro expressions (reused across methods)
        p_expr = lpSum([medida_casera[i]*porciones[i]*proteina[i]/100 for i in free_ids]) + \
                 lpSum([medida_casera[i]*porcionesnovar[i]*proteina[i]/100 for i in novar_ids if i in porcionesnovar])
        g_expr = lpSum([medida_casera[i]*porciones[i]*grasa[i]/100 for i in free_ids]) + \
                 lpSum([medida_casera[i]*porcionesnovar[i]*grasa[i]/100 for i in novar_ids if i in porcionesnovar])
        c_expr = lpSum([medida_casera[i]*porciones[i]*carbos[i]/100 for i in free_ids]) + \
                 lpSum([medida_casera[i]*porcionesnovar[i]*carbos[i]/100 for i in novar_ids if i in porcionesnovar])

        # Objective: minimize weighted deviation from all macro targets
        # Protein weighted 2x (most important macro)
        deviation_obj = 2*(sp_o + sp_u) + (sg_o + sg_u) + (sc_o + sc_u)

        # Method 1: Full constraints (P, G, CH within ±libertad%)
        m1 = LpProblem("metodo1", LpMinimize)
        m1 += deviation_obj
        m1 += p_expr == p0 + sp_o - sp_u
        m1 += g_expr == g0 + sg_o - sg_u
        m1 += c_expr == ch0 + sc_o - sc_u
        m1 += p_expr <= p0 * (1 + libertad/100)
        m1 += p_expr >= p0 * (1 - libertad/100)
        m1 += g_expr <= g0 * (1 + libertad/100)
        m1 += g_expr >= g0 * (1 - libertad/100)
        m1 += c_expr <= ch0 * (1 + libertad/100)
        m1 += c_expr >= ch0 * (1 - libertad/100)

        m1.solve(PULP_CBC_CMD(msg=0))

        if LpStatus[m1.status] == "Optimal":
            met = 1
            metodo_usado = m1
        else:
            # Method 2: Only protein constraint, still minimize deviation from all
            m2 = LpProblem("metodo2", LpMinimize)
            m2 += deviation_obj
            m2 += p_expr == p0 + sp_o - sp_u
            m2 += g_expr == g0 + sg_o - sg_u
            m2 += c_expr == ch0 + sc_o - sc_u
            m2 += p_expr >= p0 * (1 - libertad/100)
            m2.solve(PULP_CBC_CMD(msg=0))

            if LpStatus[m2.status] == "Optimal":
                met = 2
                metodo_usado = m2
            else:
                # Method 3: Only calories constraint, minimize deviation from all
                m3 = LpProblem("metodo3", LpMinimize)
                m3 += deviation_obj
                m3 += p_expr == p0 + sp_o - sp_u
                m3 += g_expr == g0 + sg_o - sg_u
                m3 += c_expr == ch0 + sc_o - sc_u
                total_cal_expr3 = p_expr * 4 + c_expr * 4 + g_expr * 9
                m3 += total_cal_expr3 <= cal_objetivo
                m3.solve(PULP_CBC_CMD(msg=0))
                met = 3
                metodo_usado = m3

        # Build result
        metodo_nombres = ['Sin resolver', 'Completo', 'Proteínas', 'Calorías']
        resultado = {
            'status': 'success',
            'metodo': metodo_nombres[met],
            'calorias_totales': 0,
            'alimentos': [],
        }

        if met > 0:
            totales = {'proteina_g': 0, 'grasa_g': 0, 'carbohidratos_g': 0, 'calorias': 0}

            # Free variables — always include all foods
            for aid in free_ids:
                val = porciones[aid].varValue or 0
                mc = medida_casera[aid]
                p_g = round(val * mc * proteina[aid] / 100, 1)
                g_g = round(val * mc * grasa[aid] / 100, 1)
                c_g = round(val * mc * carbos[aid] / 100, 1)
                cal = round(p_g * 4 + c_g * 4 + g_g * 9, 1)
                resultado['alimentos'].append({
                    'id': ali_by_id[aid].get('id'),
                    'nombre': ali_by_id[aid].get('nombre', aid),
                    'porciones': round(val, 2),
                    'total_gramos': round(val * mc, 2),
                    'medida_casera_g': mc,
                    'medida_desc': medida_desc_map[aid],
                    'proteina_g': p_g,
                    'grasa_g': g_g,
                    'carbohidratos_g': c_g,
                    'calorias': cal,
                    'rol': 'base',
                })
                totales['proteina_g'] += p_g
                totales['grasa_g'] += g_g
                totales['carbohidratos_g'] += c_g
                totales['calorias'] += cal

            # Dependent + fixed variables — always include all
            for aid in novar_ids:
                if aid not in porcionesnovar:
                    continue
                val = value(porcionesnovar[aid]) or 0
                mc = medida_casera[aid]
                p_g = round(val * mc * proteina[aid] / 100, 1)
                g_g = round(val * mc * grasa[aid] / 100, 1)
                c_g = round(val * mc * carbos[aid] / 100, 1)
                cal = round(p_g * 4 + c_g * 4 + g_g * 9, 1)
                rol = 'dependiente' if aid in dep_map else 'fijo'
                resultado['alimentos'].append({
                    'id': ali_by_id[aid].get('id'),
                    'nombre': ali_by_id[aid].get('nombre', aid),
                    'porciones': round(val, 2),
                    'total_gramos': round(val * mc, 2),
                    'medida_casera_g': mc,
                    'medida_desc': medida_desc_map[aid],
                    'proteina_g': p_g,
                    'grasa_g': g_g,
                    'carbohidratos_g': c_g,
                    'calorias': cal,
                    'rol': rol,
                })
                totales['proteina_g'] += p_g
                totales['grasa_g'] += g_g
                totales['carbohidratos_g'] += c_g
                totales['calorias'] += cal

            resultado['totales'] = {k: round(v, 1) for k, v in totales.items()}
            resultado['calorias_totales'] = round(totales['calorias'], 2)

            # Quality score
            objetivo_cal = resultado['calorias_totales']
            if objetivo_cal > 0 and cal_objetivo > 0:
                prot_ratio_real = totales['proteina_g'] / objetivo_cal
                prot_ratio_target = p0 / cal_objetivo
                if prot_ratio_target > 0:
                    calidad = round((prot_ratio_real / prot_ratio_target) * 10, 2)
                    calidad = max(0, min(10, calidad))
                    resultado['calidad'] = calidad

        return resultado

    except Exception as e:
        return {'status': 'error', 'message': str(e)}
