"""
NUTRITION Routes - Endpoints de nutrición y planes alimentarios
"""

from flask import request
from . import nutrition_bp
from ..common.responses import success_response, error_response, paginated_response, ErrorCodes
from ..common.auth import require_auth, require_admin, require_owner_or_admin, get_current_user
from ..common.database import get_db_connection, get_clinical_connection, resolve_patient_id
import sqlite3
import json
from datetime import datetime, date, timedelta


# ============================================
# PLANES NUTRICIONALES
# ============================================

@nutrition_bp.route('/plans', methods=['GET'])
@require_auth
def list_plans():
    """
    Lista los planes nutricionales del usuario autenticado.
    Admin puede ver todos con ?all=true
    """
    user = get_current_user()
    show_all = request.args.get('all', 'false').lower() == 'true'
    patient = resolve_patient_id(user['nombre_apellido'])
    
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        if show_all and user['is_admin']:
            cursor.execute("""
                SELECT np.*, p.nombre AS NOMBRE_APELLIDO FROM nutrition_plans np
                JOIN patients p ON np.patient_id = p.id
                ORDER BY np.created_at DESC
            """)
        elif patient:
            cursor.execute("""
                SELECT np.*, p.nombre AS NOMBRE_APELLIDO FROM nutrition_plans np
                JOIN patients p ON np.patient_id = p.id
                WHERE np.patient_id = ?
                ORDER BY np.created_at DESC
            """, [patient['patient_id']])
        else:
            conn.close()
            return success_response({'plans': [], 'total': 0})
        
        plans = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return success_response({
            'plans': plans,
            'total': len(plans)
        })
        
    except Exception as e:
        return error_response(
            f'Error listando planes: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/plans/<int:plan_id>', methods=['GET'])
@require_auth
def get_plan(plan_id):
    """
    Obtiene un plan nutricional específico.
    """
    user = get_current_user()
    
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT np.*, p.nombre AS NOMBRE_APELLIDO FROM nutrition_plans np
            JOIN patients p ON np.patient_id = p.id
            WHERE np.id = ?
        """, [plan_id])
        plan = cursor.fetchone()
        
        if not plan:
            conn.close()
            return error_response(
                'Plan no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        plan_dict = dict(plan)
        
        # Verificar permisos
        if not user['is_admin'] and plan_dict.get('NOMBRE_APELLIDO') != user['nombre_apellido']:
            conn.close()
            return error_response(
                'No tienes permisos para ver este plan',
                code=ErrorCodes.FORBIDDEN,
                status_code=403
            )
        
        conn.close()
        
        return success_response({'plan': plan_dict})
        
    except Exception as e:
        return error_response(
            f'Error obteniendo plan: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/plans', methods=['POST'])
@require_auth
def create_plan():
    """
    Crea un nuevo plan nutricional.
    
    Request Body:
        {
            "nombre_apellido": "Usuario" (opcional, usa el autenticado),
            "calorias": 2000,
            "proteina": 150,
            "grasa": 60,
            "ch": 200,
            "factor_actividad": 1.55,
            "velocidad_cambio": 0.5,
            "deficit_calorico": 500
        }
    """
    user = get_current_user()
    data = request.get_json() or {}
    
    # Si no es admin, solo puede crear para si mismo
    nombre_apellido = data.get('nombre_apellido', user['nombre_apellido'])
    if not user['is_admin'] and nombre_apellido != user['nombre_apellido']:
        return error_response(
            'No puedes crear planes para otros usuarios',
            code=ErrorCodes.FORBIDDEN,
            status_code=403
        )
    
    patient = resolve_patient_id(nombre_apellido)
    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
    
    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO nutrition_plans 
            (patient_id, calorias, proteina, grasa, carbohidratos, 
             factor_actividad, velocidad_cambio, deficit_calorico,
             disponibilidad_energetica, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        """, [
            patient['patient_id'],
            data.get('calorias', 2000),
            data.get('proteina', 150),
            data.get('grasa', 60),
            data.get('ch', 200),
            data.get('factor_actividad', 1.55),
            data.get('velocidad_cambio', 0),
            data.get('deficit_calorico', 0),
            data.get('disponibilidad_energetica')
        ])
        
        plan_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return success_response(
            {'id': plan_id, 'nombre_apellido': nombre_apellido},
            message='Plan nutricional creado exitosamente'
        )
        
    except Exception as e:
        return error_response(
            f'Error creando plan: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/plans/<int:plan_id>', methods=['PUT'])
@require_auth
def update_plan(plan_id):
    """
    Actualiza un plan nutricional.
    """
    user = get_current_user()
    data = request.get_json() or {}
    
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        # Verificar que existe y permisos
        cursor.execute("""
            SELECT np.patient_id, p.nombre FROM nutrition_plans np
            JOIN patients p ON np.patient_id = p.id
            WHERE np.id = ?
        """, [plan_id])
        plan = cursor.fetchone()
        
        if not plan:
            conn.close()
            return error_response(
                'Plan no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        if not user['is_admin'] and plan[1] != user['nombre_apellido']:
            conn.close()
            return error_response(
                'No tienes permisos para editar este plan',
                code=ErrorCodes.FORBIDDEN,
                status_code=403
            )
        
        # Campos actualizables (clinical.db snake_case names)
        allowed_fields = {
            'calorias': 'calorias', 'proteina': 'proteina', 'grasa': 'grasa',
            'ch': 'carbohidratos', 'carbohidratos': 'carbohidratos',
            'factor_actividad': 'factor_actividad',
            'velocidad_cambio': 'velocidad_cambio', 'deficit_calorico': 'deficit_calorico',
            'disponibilidad_energetica': 'disponibilidad_energetica',
            'dp': 'desayuno_p', 'dg': 'desayuno_g', 'dc': 'desayuno_c',
            'mmp': 'media_man_p', 'mmg': 'media_man_g', 'mmc': 'media_man_c',
            'ap': 'almuerzo_p', 'ag': 'almuerzo_g', 'ac': 'almuerzo_c',
            'mp': 'merienda_p', 'mg': 'merienda_g', 'mc': 'merienda_c',
            'mtp': 'media_tar_p', 'mtg': 'media_tar_g', 'mtc': 'media_tar_c',
            'cp': 'cena_p', 'cg': 'cena_g', 'cc': 'cena_c',
            'libertad': 'libertad',
        }
        
        updates = []
        values = []
        
        for key, col in allowed_fields.items():
            if key in data:
                updates.append(f"{col} = ?")
                values.append(data[key])
        
        if not updates:
            conn.close()
            return error_response(
                'No hay campos para actualizar',
                code=ErrorCodes.VALIDATION_ERROR,
                status_code=400
            )
        
        values.append(plan_id)
        
        cursor.execute(f"""
            UPDATE nutrition_plans 
            SET {', '.join(updates)}
            WHERE id = ?
        """, values)
        
        conn.commit()
        conn.close()
        
        return success_response(
            {'id': plan_id, 'updated_fields': list(data.keys())},
            message='Plan actualizado exitosamente'
        )
        
    except Exception as e:
        return error_response(
            f'Error actualizando plan: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/plans/<int:plan_id>', methods=['DELETE'])
@require_auth
def delete_plan(plan_id):
    """
    Elimina un plan nutricional.
    """
    user = get_current_user()
    
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        # Verificar permisos
        cursor.execute("""
            SELECT p.nombre FROM nutrition_plans np
            JOIN patients p ON np.patient_id = p.id
            WHERE np.id = ?
        """, [plan_id])
        plan = cursor.fetchone()
        
        if not plan:
            conn.close()
            return error_response(
                'Plan no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        if not user['is_admin'] and plan[0] != user['nombre_apellido']:
            conn.close()
            return error_response(
                'No tienes permisos para eliminar este plan',
                code=ErrorCodes.FORBIDDEN,
                status_code=403
            )
        
        cursor.execute("DELETE FROM nutrition_plans WHERE id = ?", [plan_id])
        conn.commit()
        conn.close()
        
        return success_response(
            {'id': plan_id, 'deleted': True},
            message='Plan eliminado exitosamente'
        )
        
    except Exception as e:
        return error_response(
            f'Error eliminando plan: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/plans/<int:plan_id>/adjust-calories', methods=['POST'])
@require_auth
def adjust_calories(plan_id):
    """
    Ajusta las calorías de un plan y recalcula macros.
    
    Request Body:
        {
            "ajuste": 100  // Positivo para aumentar, negativo para reducir
        }
    """
    user = get_current_user()
    data = request.get_json() or {}
    
    ajuste = data.get('ajuste', 0)
    if not ajuste:
        return error_response(
            'El ajuste de calorías es requerido',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        # Obtener plan actual
        cursor.execute("""
            SELECT np.id, p.nombre, np.calorias, np.proteina, np.grasa, np.carbohidratos,
                   np.deficit_calorico, np.patient_id
            FROM nutrition_plans np
            JOIN patients p ON np.patient_id = p.id
            WHERE np.id = ?
        """, [plan_id])
        plan = cursor.fetchone()
        
        if not plan:
            conn.close()
            return error_response(
                'Plan no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        plan_dict = dict(plan)
        
        # Verificar permisos
        if not user['is_admin'] and plan_dict['nombre'] != user['nombre_apellido']:
            conn.close()
            return error_response(
                'No tienes permisos para modificar este plan',
                code=ErrorCodes.FORBIDDEN,
                status_code=403
            )
        
        # Obtener peso magro para recalcular macros
        cursor.execute("""
            SELECT peso_magro FROM measurements
            WHERE patient_id = ?
            ORDER BY fecha DESC LIMIT 1
        """, [plan_dict['patient_id']])
        
        pm_row = cursor.fetchone()
        pm = float(pm_row[0]) if pm_row and pm_row[0] else 60  # Default 60kg
        
        # Calcular nuevos valores
        calorias_nuevas = float(plan_dict['calorias']) + ajuste
        proteina_nueva = 2.513244 * pm
        grasa_nueva = (calorias_nuevas * 0.3) / 9
        ch_nuevo = (calorias_nuevas - (proteina_nueva * 4) - (grasa_nueva * 9)) / 4
        
        # Actualizar plan
        cursor.execute("""
            UPDATE nutrition_plans 
            SET calorias = ?, proteina = ?, grasa = ?, carbohidratos = ?,
                created_at = datetime('now', 'localtime')
            WHERE id = ?
        """, [
            round(calorias_nuevas, 0),
            round(proteina_nueva, 1),
            round(grasa_nueva, 1),
            round(ch_nuevo, 1),
            plan_id
        ])
        
        conn.commit()
        conn.close()
        
        return success_response({
            'id': plan_id,
            'ajuste_aplicado': ajuste,
            'datos_nuevos': {
                'calorias': round(calorias_nuevas, 0),
                'proteina': round(proteina_nueva, 1),
                'grasa': round(grasa_nueva, 1),
                'carbohidratos': round(ch_nuevo, 1)
            }
        }, message=f'Plan ajustado: {ajuste:+d} kcal')
        
    except Exception as e:
        return error_response(
            f'Error ajustando calorías: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


# ============================================
# ALIMENTOS
# ============================================

@nutrition_bp.route('/foods', methods=['GET'])
@require_auth
def list_foods():
    """
    Lista todos los alimentos.
    
    Query Params:
        q: Búsqueda por nombre
        page: Página
        per_page: Items por página
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    search = request.args.get('q', '').strip()
    
    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        query = "SELECT * FROM ALIMENTOS WHERE 1=1"
        params = []
        
        if search:
            query += " AND (Largadescripcion LIKE ? OR Cortadescripcion LIKE ?)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param])
        
        # Contar total
        count_query = query.replace("SELECT *", "SELECT COUNT(*)")
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        # Paginación
        query += " ORDER BY Largadescripcion ASC LIMIT ? OFFSET ?"
        params.extend([per_page, (page - 1) * per_page])
        
        cursor.execute(query, params)
        foods = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return paginated_response(foods, page, per_page, total)
        
    except Exception as e:
        return error_response(
            f'Error listando alimentos: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/foods/<int:food_id>', methods=['GET'])
@require_auth
def get_food(food_id):
    """
    Obtiene un alimento específico.
    """
    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM ALIMENTOS WHERE ID = ?", [food_id])
        food = cursor.fetchone()
        conn.close()
        
        if not food:
            return error_response(
                'Alimento no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        return success_response({'food': dict(food)})
        
    except Exception as e:
        return error_response(
            f'Error obteniendo alimento: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/foods/<int:food_id>/portions', methods=['GET'])
@require_auth
def get_food_portions(food_id):
    """
    Obtiene las porciones disponibles de un alimento.
    """
    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT Largadescripcion, Medidacasera1, Medidacasera2, 
                   Gramosmedida1, Gramosmedida2
            FROM ALIMENTOS WHERE ID = ?
        """, [food_id])
        food = cursor.fetchone()
        conn.close()
        
        if not food:
            return error_response(
                'Alimento no encontrado',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        portions = []
        if food[1]:
            portions.append({
                'nombre': food[1],
                'gramos': food[3] if food[3] else None
            })
        if food[2]:
            portions.append({
                'nombre': food[2],
                'gramos': food[4] if food[4] else None
            })
        
        return success_response({
            'food_name': food[0],
            'portions': portions
        })
        
    except Exception as e:
        return error_response(
            f'Error obteniendo porciones: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/food-groups', methods=['GET'])
@require_auth
def list_food_groups():
    """
    Lista los grupos de alimentos con información de bloques.
    
    Query Params:
        macro: P, G o C - filtrar por macro dominante
    """
    macro_filter = request.args.get('macro', '').upper()
    
    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM GRUPOSALIMENTOS ORDER BY CATEGORIA, DESCRIPCION")
        groups = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # Calcular bloques para cada alimento
        BLOQUE_P = 20
        BLOQUE_G = 10
        BLOQUE_C = 25
        
        result = []
        for g in groups:
            proteina = float(g.get('PROTEINA', 0) or 0)
            grasa = float(g.get('GRASA', 0) or 0)
            carbos = float(g.get('CARBOHIDRATOS', 0) or 0)
            porcion = float(g.get('PORCION', 100) or 100)
            
            # Calcular bloques por porción
            bloques_p = (proteina * porcion / 100) / BLOQUE_P
            bloques_g = (grasa * porcion / 100) / BLOQUE_G
            bloques_c = (carbos * porcion / 100) / BLOQUE_C
            
            # Determinar macro dominante
            max_bloque = max(bloques_p, bloques_g, bloques_c)
            if max_bloque == bloques_p:
                macro_dom = 'P'
            elif max_bloque == bloques_g:
                macro_dom = 'G'
            else:
                macro_dom = 'C'
            
            # Filtrar si se especificó
            if macro_filter and macro_dom != macro_filter:
                continue
            
            result.append({
                'id': g.get('ID'),
                'categoria': g.get('CATEGORIA'),
                'descripcion': g.get('DESCRIPCION'),
                'porcion_gramos': porcion,
                'macros_100g': {
                    'proteina': proteina,
                    'grasa': grasa,
                    'carbohidratos': carbos
                },
                'bloques_porcion': {
                    'proteina': round(bloques_p, 2),
                    'grasa': round(bloques_g, 2),
                    'carbohidratos': round(bloques_c, 2)
                },
                'macro_dominante': macro_dom
            })
        
        return success_response({
            'food_groups': result,
            'total': len(result),
            'bloques_config': {
                'proteina': BLOQUE_P,
                'grasa': BLOQUE_G,
                'carbohidratos': BLOQUE_C
            }
        })
        
    except Exception as e:
        return error_response(
            f'Error listando grupos: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


# ============================================
# RECETAS
# ============================================

@nutrition_bp.route('/recipes', methods=['GET'])
@require_auth
def list_recipes():
    """
    Lista todas las recetas.
    
    Query Params:
        q: Búsqueda por nombre
        page: Página
        per_page: Items por página
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    search = request.args.get('q', '').strip()
    
    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        query = "SELECT ID, NOMBRERECETA FROM RECETAS WHERE 1=1"
        params = []
        
        if search:
            query += " AND NOMBRERECETA LIKE ?"
            params.append(f"%{search}%")
        
        # Contar total
        count_query = query.replace("SELECT ID, NOMBRERECETA", "SELECT COUNT(*)")
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        # Paginación
        query += " ORDER BY NOMBRERECETA ASC LIMIT ? OFFSET ?"
        params.extend([per_page, (page - 1) * per_page])
        
        cursor.execute(query, params)
        recipes = [{'id': row[0], 'nombre': row[1]} for row in cursor.fetchall()]
        conn.close()
        
        return paginated_response(recipes, page, per_page, total)
        
    except Exception as e:
        return error_response(
            f'Error listando recetas: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/recipes/<int:recipe_id>', methods=['GET'])
@require_auth
def get_recipe(recipe_id):
    """
    Obtiene una receta específica con todos sus ingredientes.
    """
    try:
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM RECETAS WHERE ID = ?", [recipe_id])
        recipe = cursor.fetchone()
        conn.close()
        
        if not recipe:
            return error_response(
                'Receta no encontrada',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        return success_response({'recipe': dict(recipe)})
        
    except Exception as e:
        return error_response(
            f'Error obteniendo receta: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/recipes/<int:recipe_id>/calculate', methods=['POST'])
@require_auth
def calculate_recipe(recipe_id):
    """
    Calcula las porciones de una receta para objetivos específicos.
    
    Request Body:
        {
            "proteina": 30,
            "grasa": 15,
            "carbohidratos": 40,
            "libertad": 10
        }
    """
    user = get_current_user()
    data = request.get_json() or {}
    
    try:
        # Get recipe name from legacy DB (recipes still used by calculate_recipe_portions)
        conn_legacy = get_db_connection(sqlite3.Row)
        cursor_legacy = conn_legacy.cursor()
        
        cursor_legacy.execute("SELECT NOMBRERECETA FROM RECETAS WHERE ID = ?", [recipe_id])
        recipe = cursor_legacy.fetchone()
        conn_legacy.close()
        
        if not recipe:
            return error_response(
                'Receta no encontrada',
                code=ErrorCodes.NOT_FOUND,
                status_code=404
            )
        
        nombre_receta = recipe[0]
        
        # Si no se proporcionan macros, obtener del plan del usuario en clinical.db
        if not data.get('proteina'):
            patient = resolve_patient_id(user['nombre_apellido'])
            if patient:
                conn_cl = get_clinical_connection()
                cursor_cl = conn_cl.cursor()
                cursor_cl.execute("""
                    SELECT proteina, grasa, carbohidratos, libertad 
                    FROM nutrition_plans WHERE patient_id = ?
                    ORDER BY created_at DESC LIMIT 1
                """, [patient['patient_id']])
                dieta = cursor_cl.fetchone()
                conn_cl.close()
                if dieta:
                    data['proteina'] = dieta[0]
                    data['grasa'] = dieta[1]
                    data['carbohidratos'] = dieta[2]
                    data['libertad'] = dieta[3] or 0
        
        # Importar función de cálculo del sistema legacy
        import sys
        sys.path.insert(0, 'src')
        try:
            import functions
            resultado = functions.calculate_recipe_portions(
                nombrereceta=nombre_receta,
                p0=float(data.get('proteina', 30)),
                g0=float(data.get('grasa', 15)),
                ch0=float(data.get('carbohidratos', 40)),
                libertad=float(data.get('libertad', 0))
            )
            
            return success_response({
                'recipe_id': recipe_id,
                'recipe_name': nombre_receta,
                'calculation': resultado
            })
        except Exception as calc_error:
            return success_response({
                'recipe_id': recipe_id,
                'recipe_name': nombre_receta,
                'calculation': {
                    'status': 'pending',
                    'message': 'Cálculo simplificado - usar sistema legacy para cálculo completo',
                    'macros_objetivo': data
                }
            })
        
    except Exception as e:
        return error_response(
            f'Error calculando receta: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/calculate-day', methods=['POST'])
@require_auth
def calculate_day():
    """
    Calcula recetas para una comida o todas las comidas del dia.
    Usa el solver legacy (PuLP) con los macro targets del plan nutricional activo.

    Request Body:
        {
            "comida": "almuerzo",           // optional - if omitted, calculates ALL meals
            "recetas": {                     // recipe IDs per meal
                "desayuno": [1, 5],
                "almuerzo": [12],
                "cena": [3, 7]
            }
        }

    Response:
        {
            "resultados": {
                "almuerzo": {
                    "macros_objetivo": { "proteina": 30, "grasa": 15, "carbohidratos": 40 },
                    "recetas": [
                        { "recipe_id": 12, "recipe_name": "...", "calculation": { ... } }
                    ]
                }
            }
        }
    """
    user = get_current_user()
    patient = resolve_patient_id(user['nombre_apellido'])
    data = request.get_json() or {}

    comida_filter = data.get('comida')  # None = all meals
    recetas_map = data.get('recetas', {})

    if not recetas_map:
        return error_response(
            'Debes indicar al menos una receta por comida en "recetas"',
            code=ErrorCodes.VALIDATION_ERROR, status_code=400
        )

    try:
        # Get nutrition plan for macro targets
        if not patient:
            return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        conn = get_clinical_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT proteina, grasa, carbohidratos,
                   desayuno_p, desayuno_g, desayuno_c,
                   media_man_p, media_man_g, media_man_c,
                   almuerzo_p, almuerzo_g, almuerzo_c,
                   merienda_p, merienda_g, merienda_c,
                   media_tar_p, media_tar_g, media_tar_c,
                   cena_p, cena_g, cena_c, libertad
            FROM nutrition_plans WHERE patient_id = ?
            ORDER BY created_at DESC LIMIT 1
        """, [patient['patient_id']])
        dieta = cursor.fetchone()
        conn.close()

        if not dieta:
            return error_response(
                'No hay plan nutricional activo para calcular',
                code=ErrorCodes.NOT_FOUND, status_code=404
            )

        prot_total = float(dieta[0] or 0)
        grasa_total = float(dieta[1] or 0)
        ch_total = float(dieta[2] or 0)
        libertad = float(dieta[21] or 0)

        meal_macro_indices = {
            'desayuno':     (3, 4, 5),
            'media_manana': (6, 7, 8),
            'almuerzo':     (9, 10, 11),
            'merienda':     (12, 13, 14),
            'media_tarde':  (15, 16, 17),
            'cena':         (18, 19, 20),
        }

        # Get recipe names from legacy DB
        conn_legacy = get_db_connection(sqlite3.Row)
        cursor_legacy = conn_legacy.cursor()

        import sys
        sys.path.insert(0, 'src')
        import functions

        resultados = {}

        meals_to_calc = [comida_filter] if comida_filter else list(recetas_map.keys())

        for comida_name in meals_to_calc:
            recipe_ids = recetas_map.get(comida_name, [])
            if not recipe_ids:
                continue

            indices = meal_macro_indices.get(comida_name)
            if not indices:
                continue

            dp = float(dieta[indices[0]] or 0)
            dg = float(dieta[indices[1]] or 0)
            dc = float(dieta[indices[2]] or 0)

            p_meal = prot_total * dp
            g_meal = grasa_total * dg
            c_meal = ch_total * dc

            n_recipes = len(recipe_ids)
            p_per = p_meal / n_recipes if n_recipes else 0
            g_per = g_meal / n_recipes if n_recipes else 0
            c_per = c_meal / n_recipes if n_recipes else 0

            meal_results = []
            for rid in recipe_ids:
                cursor_legacy.execute("SELECT NOMBRERECETA FROM RECETAS WHERE ID = ?", [int(rid)])
                row = cursor_legacy.fetchone()
                nombre = row[0] if row else None

                if not nombre:
                    meal_results.append({
                        'recipe_id': rid,
                        'recipe_name': None,
                        'calculation': {'status': 'error', 'message': 'Receta no encontrada'}
                    })
                    continue

                try:
                    calc = functions.calculate_recipe_portions(
                        nombrereceta=nombre,
                        p0=p_per, g0=g_per, ch0=c_per, libertad=libertad
                    )
                    meal_results.append({
                        'recipe_id': rid,
                        'recipe_name': nombre,
                        'calculation': calc
                    })
                except Exception as calc_err:
                    meal_results.append({
                        'recipe_id': rid,
                        'recipe_name': nombre,
                        'calculation': {
                            'status': 'error',
                            'message': str(calc_err)
                        }
                    })

            resultados[comida_name] = {
                'macros_objetivo': {
                    'proteina': round(p_meal, 1),
                    'grasa': round(g_meal, 1),
                    'carbohidratos': round(c_meal, 1),
                },
                'recetas': meal_results,
            }

        conn_legacy.close()

        return success_response({'resultados': resultados})

    except Exception as e:
        return error_response(
            f'Error calculando dia: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


# ============================================
# MEAL PLANS (Planes Alimentarios)
# ============================================

@nutrition_bp.route('/meal-plans', methods=['GET'])
@require_auth
def list_meal_plans():
    """
    Lista los planes alimentarios del usuario.
    """
    user = get_current_user()
    patient = resolve_patient_id(user['nombre_apellido'])
    
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        if patient:
            cursor.execute("""
                SELECT * FROM meal_plans 
                WHERE patient_id = ? AND activo = 1
                ORDER BY created_at DESC
            """, [patient['patient_id']])
        else:
            conn.close()
            return success_response({'meal_plans': [], 'total': 0})
        
        plans = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # Parsear JSON de cada plan
        for plan in plans:
            if plan.get('plan_json'):
                try:
                    plan['plan_data'] = json.loads(plan['plan_json'])
                except:
                    plan['plan_data'] = None
        
        return success_response({
            'meal_plans': plans,
            'total': len(plans)
        })
        
    except Exception as e:
        return error_response(
            f'Error listando planes alimentarios: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/meal-plans', methods=['POST'])
@require_auth
def create_meal_plan():
    """
    Crea un nuevo plan alimentario.
    
    Request Body:
        {
            "tipo": "recetas",
            "comidas": {
                "desayuno": [1, 2, 3],
                "almuerzo": [4, 5],
                ...
            }
        }
    """
    user = get_current_user()
    data = request.get_json() or {}
    patient = resolve_patient_id(user['nombre_apellido'])
    
    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
    
    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()
        
        # Desactivar planes anteriores del mismo tipo
        cursor.execute("""
            UPDATE meal_plans 
            SET activo = 0 
            WHERE patient_id = ? AND tipo = ?
        """, [patient['patient_id'], data.get('tipo', 'recetas')])
        
        # Contar recetas
        total_recetas = 0
        comidas_configuradas = 0
        for comida, recetas in data.get('comidas', {}).items():
            if recetas:
                comidas_configuradas += 1
                total_recetas += len(recetas)
        
        # Insertar nuevo plan
        cursor.execute("""
            INSERT INTO meal_plans 
            (patient_id, tipo, plan_json, activo,
             total_recetas, comidas_configuradas)
            VALUES (?, ?, ?, 1, ?, ?)
        """, [
            patient['patient_id'],
            data.get('tipo', 'recetas'),
            json.dumps(data, ensure_ascii=False),
            total_recetas,
            comidas_configuradas
        ])
        
        plan_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return success_response({
            'id': plan_id,
            'total_recetas': total_recetas,
            'comidas_configuradas': comidas_configuradas
        }, message='Plan alimentario guardado exitosamente')
        
    except Exception as e:
        return error_response(
            f'Error creando plan alimentario: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/meal-plans/blocks', methods=['GET'])
@require_auth
def get_meal_blocks():
    """
    Obtiene la distribución de macros por comida desde nutrition_plans.
    Returns per-meal macro percentages and calculated grams.
    """
    user = get_current_user()
    patient = resolve_patient_id(user['nombre_apellido'])

    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()

        if not patient:
            conn.close()
            return success_response({'blocks': None, 'message': 'Usuario no encontrado'})

        cursor.execute("""
            SELECT calorias, proteina, grasa, carbohidratos,
                   desayuno_p, desayuno_g, desayuno_c,
                   media_man_p, media_man_g, media_man_c,
                   almuerzo_p, almuerzo_g, almuerzo_c,
                   merienda_p, merienda_g, merienda_c,
                   media_tar_p, media_tar_g, media_tar_c,
                   cena_p, cena_g, cena_c,
                   libertad
            FROM nutrition_plans WHERE patient_id = ?
            ORDER BY created_at DESC LIMIT 1
        """, [patient['patient_id']])

        row = cursor.fetchone()
        conn.close()

        if not row:
            return success_response({'blocks': None, 'message': 'No hay plan nutricional activo'})

        calorias = float(row[0] or 0)
        proteina_total = float(row[1] or 0)
        grasa_total = float(row[2] or 0)
        ch_total = float(row[3] or 0)

        meals_map = [
            ('desayuno',      row[4],  row[5],  row[6]),
            ('media_manana',  row[7],  row[8],  row[9]),
            ('almuerzo',      row[10], row[11], row[12]),
            ('merienda',      row[13], row[14], row[15]),
            ('media_tarde',   row[16], row[17], row[18]),
            ('cena',          row[19], row[20], row[21]),
        ]

        comidas = {}
        for name, dp, dg, dc in meals_map:
            dp_v = float(dp or 0)
            dg_v = float(dg or 0)
            dc_v = float(dc or 0)
            if dp_v == 0 and dg_v == 0 and dc_v == 0:
                continue
            comidas[name] = {
                'porcentajes': {'proteina': dp_v, 'grasa': dg_v, 'carbohidratos': dc_v},
                'gramos': {
                    'proteina': round(proteina_total * dp_v, 1),
                    'grasa': round(grasa_total * dg_v, 1),
                    'carbohidratos': round(ch_total * dc_v, 1),
                },
            }

        return success_response({
            'blocks': {
                'calorias': calorias,
                'proteina_total': proteina_total,
                'grasa_total': grasa_total,
                'ch_total': ch_total,
                'libertad': int(float(row[22] or 0)),
                'comidas': comidas,
            }
        })

    except Exception as e:
        return error_response(
            f'Error obteniendo bloques: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/meal-plans/save-config', methods=['POST'])
@require_auth
def save_meal_config():
    """
    Guarda configuración de comidas y recalcula distribución de macros.
    Body: {
        "comidas": { "desayuno": { "enabled": true, "size": "medium" }, ... },
        "entreno": "almuerzo" | null   // Comida después de la cual se entrena
    }
    Sizes: extra_small (0.5x), small (0.75x), medium (1x), large (1.33x), extra_large (2x)

    Training logic (from legacy):
    - Training meal + next meal: carbs multiplied by 2
    - All other meals: fats multiplied by 2
    - Proteins: unaffected by training timing
    - Then normalize each macro independently so proportions sum to 1.0
    """
    SIZE_COEFF = {
        'extra_small': 0.5, 'small': 0.75, 'medium': 1.0,
        'large': 1.33, 'extra_large': 2.0
    }
    MEAL_COLS = {
        'desayuno':     ('desayuno_p', 'desayuno_g', 'desayuno_c'),
        'media_manana': ('media_man_p', 'media_man_g', 'media_man_c'),
        'almuerzo':     ('almuerzo_p', 'almuerzo_g', 'almuerzo_c'),
        'merienda':     ('merienda_p', 'merienda_g', 'merienda_c'),
        'media_tarde':  ('media_tar_p', 'media_tar_g', 'media_tar_c'),
        'cena':         ('cena_p', 'cena_g', 'cena_c'),
    }
    MEAL_ORDER = ['desayuno', 'media_manana', 'almuerzo', 'merienda', 'media_tarde', 'cena']

    user = get_current_user()
    data = request.get_json() or {}
    comidas_config = data.get('comidas', {})
    entreno = data.get('entreno', None)  # meal key after which training happens

    if not comidas_config:
        return error_response('Se requiere el campo "comidas"', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    patient = resolve_patient_id(user['nombre_apellido'])
    if not patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()

        # Get current plan
        cursor.execute("""
            SELECT id, proteina, grasa, carbohidratos
            FROM nutrition_plans WHERE patient_id = ?
            ORDER BY created_at DESC LIMIT 1
        """, [patient['patient_id']])
        plan = cursor.fetchone()

        if not plan:
            conn.close()
            return error_response('No hay plan nutricional activo', code=ErrorCodes.NOT_FOUND, status_code=404)

        plan_id = plan[0]
        proteina_total = float(plan[1] or 0)
        grasa_total = float(plan[2] or 0)
        ch_total = float(plan[3] or 0)

        # Build list of enabled meals with their size coefficients (in order)
        enabled_meals = []
        for meal_name in MEAL_ORDER:
            cfg = comidas_config.get(meal_name, {})
            if cfg.get('enabled', False):
                size = cfg.get('size', 'medium')
                coeff = SIZE_COEFF.get(size, 1.0)
                enabled_meals.append((meal_name, coeff))

        if not enabled_meals:
            conn.close()
            return error_response('Al menos una comida debe estar habilitada', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

        # Step 1: Apply size coefficients → per-meal multipliers for P, G, C
        # Start with equal base multiplier = size coeff for each macro
        meal_multipliers = {}
        for meal_name, coeff in enabled_meals:
            meal_multipliers[meal_name] = {
                'p': coeff,   # protein multiplier
                'g': coeff,   # fat multiplier
                'c': coeff,   # carb multiplier
            }

        # Step 2: Apply training distribution (legacy algorithm)
        # Training meal + next meal: carbs x2, all others: fats x2
        if entreno and entreno in [m[0] for m in enabled_meals]:
            enabled_keys = [m[0] for m in enabled_meals]
            entreno_idx = enabled_keys.index(entreno)
            next_idx = entreno_idx + 1 if entreno_idx + 1 < len(enabled_keys) else None

            for i, meal_name in enumerate(enabled_keys):
                if i == entreno_idx or i == next_idx:
                    # Near training: double carbs
                    meal_multipliers[meal_name]['c'] *= 2
                else:
                    # Away from training: double fats
                    meal_multipliers[meal_name]['g'] *= 2

        # Step 3: Normalize each macro independently (sum to 1.0)
        total_p = sum(m['p'] for m in meal_multipliers.values())
        total_g = sum(m['g'] for m in meal_multipliers.values())
        total_c = sum(m['c'] for m in meal_multipliers.values())

        # Build SQL update and response
        update_parts = []
        update_vals = []
        result_comidas = {}
        for meal_name, cols in MEAL_COLS.items():
            if meal_name in meal_multipliers:
                pct_p = round(meal_multipliers[meal_name]['p'] / total_p, 4) if total_p > 0 else 0
                pct_g = round(meal_multipliers[meal_name]['g'] / total_g, 4) if total_g > 0 else 0
                pct_c = round(meal_multipliers[meal_name]['c'] / total_c, 4) if total_c > 0 else 0
                update_parts.extend([f"{cols[0]}=?", f"{cols[1]}=?", f"{cols[2]}=?"])
                update_vals.extend([pct_p, pct_g, pct_c])
                result_comidas[meal_name] = {
                    'porcentajes': {'proteina': pct_p, 'grasa': pct_g, 'carbohidratos': pct_c},
                    'gramos': {
                        'proteina': round(proteina_total * pct_p, 1),
                        'grasa': round(grasa_total * pct_g, 1),
                        'carbohidratos': round(ch_total * pct_c, 1),
                    },
                }
            else:
                # Disabled meal → zero
                update_parts.extend([f"{cols[0]}=0", f"{cols[1]}=0", f"{cols[2]}=0"])

        sql = f"UPDATE nutrition_plans SET {', '.join(update_parts)} WHERE id = ?"
        update_vals.append(plan_id)
        cursor.execute(sql, update_vals)
        conn.commit()
        conn.close()

        return success_response({
            'message': 'Configuración guardada',
            'entreno': entreno,
            'blocks': {
                'calorias': proteina_total * 4 + grasa_total * 9 + ch_total * 4,
                'proteina_total': proteina_total,
                'grasa_total': grasa_total,
                'ch_total': ch_total,
                'comidas': result_comidas,
            }
        })

    except Exception as e:
        return error_response(
            f'Error guardando configuración: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/meal-plans/<int:plan_id>/calculate', methods=['GET'])
@require_auth
def calculate_meal_plan(plan_id):
    """
    Auto-calcula todas las recetas de un plan alimentario guardado.
    Returns per-meal recipe calculations using the legacy recipe calculator.
    """
    user = get_current_user()
    patient = resolve_patient_id(user['nombre_apellido'])

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        if not patient:
            conn.close()
            return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        cursor.execute("""
            SELECT * FROM meal_plans WHERE id = ? AND patient_id = ?
        """, [plan_id, patient['patient_id']])
        plan_row = cursor.fetchone()

        if not plan_row:
            conn.close()
            return error_response('Plan alimentario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        plan_dict = dict(plan_row)
        plan_data = json.loads(plan_dict.get('plan_json', '{}'))
        comidas = plan_data.get('comidas', {})

        # Get per-meal macros from nutrition_plans
        cursor.execute("""
            SELECT proteina, grasa, carbohidratos,
                   desayuno_p, desayuno_g, desayuno_c,
                   media_man_p, media_man_g, media_man_c,
                   almuerzo_p, almuerzo_g, almuerzo_c,
                   merienda_p, merienda_g, merienda_c,
                   media_tar_p, media_tar_g, media_tar_c,
                   cena_p, cena_g, cena_c, libertad
            FROM nutrition_plans WHERE patient_id = ?
            ORDER BY created_at DESC LIMIT 1
        """, [patient['patient_id']])
        dieta = cursor.fetchone()
        conn.close()

        if not dieta:
            return success_response({
                'plan_id': plan_id,
                'calculations': None,
                'message': 'No hay plan nutricional para calcular'
            })

        prot_total = float(dieta[0] or 0)
        grasa_total = float(dieta[1] or 0)
        ch_total = float(dieta[2] or 0)

        meal_macro_indices = {
            'desayuno':     (3, 4, 5),
            'media_manana': (6, 7, 8),
            'almuerzo':     (9, 10, 11),
            'merienda':     (12, 13, 14),
            'media_tarde':  (15, 16, 17),
            'cena':         (18, 19, 20),
        }

        libertad = float(dieta[21] or 0)
        resultados = {}

        import sys
        sys.path.insert(0, 'src')

        for comida_name, recipe_ids in comidas.items():
            if not recipe_ids:
                continue
            indices = meal_macro_indices.get(comida_name)
            if not indices:
                continue

            dp, dg, dc = float(dieta[indices[0]] or 0), float(dieta[indices[1]] or 0), float(dieta[indices[2]] or 0)
            p_meal = prot_total * dp
            g_meal = grasa_total * dg
            c_meal = ch_total * dc
            n_recipes = len(recipe_ids)

            p_per = p_meal / n_recipes if n_recipes else 0
            g_per = g_meal / n_recipes if n_recipes else 0
            c_per = c_meal / n_recipes if n_recipes else 0

            meal_results = []
            for rid in recipe_ids:
                try:
                    import functions
                    calc = functions.calculate_recipe_portions(
                        nombrereceta=None, recipe_id=int(rid),
                        p0=p_per, g0=g_per, ch0=c_per, libertad=libertad
                    )
                    meal_results.append({'recipe_id': rid, 'calculation': calc})
                except Exception:
                    meal_results.append({
                        'recipe_id': rid,
                        'calculation': {
                            'status': 'fallback',
                            'macros_objetivo': {
                                'proteina': round(p_per, 1),
                                'grasa': round(g_per, 1),
                                'carbohidratos': round(c_per, 1)
                            }
                        }
                    })

            resultados[comida_name] = {
                'macros_comida': {
                    'proteina': round(p_meal, 1),
                    'grasa': round(g_meal, 1),
                    'carbohidratos': round(c_meal, 1)
                },
                'recetas': meal_results,
            }

        return success_response({
            'plan_id': plan_id,
            'calculations': resultados,
        })

    except Exception as e:
        return error_response(
            f'Error calculando plan: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@nutrition_bp.route('/meal-plans/<int:plan_id>/shopping-list', methods=['GET'])
@require_auth
def get_shopping_list(plan_id):
    """
    Genera una lista de compras a partir de un plan alimentario.
    Aggregates ingredients from all selected recipes.
    """
    user = get_current_user()
    patient = resolve_patient_id(user['nombre_apellido'])

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        if not patient:
            conn.close()
            return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        cursor.execute("""
            SELECT plan_json FROM meal_plans
            WHERE id = ? AND patient_id = ?
        """, [plan_id, patient['patient_id']])
        plan_row = cursor.fetchone()

        if not plan_row:
            conn.close()
            return error_response('Plan no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        plan_data = json.loads(plan_row[0] or '{}')
        comidas = plan_data.get('comidas', {})

        # Collect all unique recipe IDs
        all_recipe_ids = set()
        for recipe_ids in comidas.values():
            if recipe_ids:
                all_recipe_ids.update(recipe_ids)

        if not all_recipe_ids:
            conn.close()
            return success_response({'shopping_list': [], 'message': 'Plan sin recetas'})

        # Get ingredients from each recipe (use legacy DB for recipe details)
        conn.close()
        conn = get_db_connection(sqlite3.Row)
        cursor = conn.cursor()
        ingredients_agg = {}
        for rid in all_recipe_ids:
            cursor.execute("SELECT * FROM RECETAS WHERE ID = ?", [int(rid)])
            recipe = cursor.fetchone()
            if not recipe:
                continue
            recipe_dict = dict(recipe)
            nombre_receta = recipe_dict.get('NOMBRERECETA', '')

            # Parse ingredient columns - RECETAS stores ingredients as individual columns
            for key, val in recipe_dict.items():
                if key in ('ID', 'NOMBRERECETA') or not val:
                    continue
                # Ingredient columns are food names with gram values
                ingredient_name = key
                try:
                    amount = float(val)
                except (ValueError, TypeError):
                    continue
                if amount <= 0:
                    continue

                if ingredient_name in ingredients_agg:
                    ingredients_agg[ingredient_name]['total_g'] += amount
                    ingredients_agg[ingredient_name]['recetas'].add(nombre_receta)
                else:
                    ingredients_agg[ingredient_name] = {
                        'total_g': amount,
                        'recetas': {nombre_receta}
                    }

        conn.close()

        shopping_list = []
        for name, data in sorted(ingredients_agg.items()):
            shopping_list.append({
                'ingrediente': name,
                'cantidad_g': round(data['total_g'], 1),
                'en_recetas': list(data['recetas']),
            })

        return success_response({
            'shopping_list': shopping_list,
            'total_ingredientes': len(shopping_list),
            'total_recetas': len(all_recipe_ids),
        })

    except Exception as e:
        return error_response(
            f'Error generando lista de compras: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


# ============================================
# PLAN NUTRICIONAL AUTOMÁTICO
# ============================================

@nutrition_bp.route('/plans/auto-calculate', methods=['POST'])
@require_auth
def auto_calculate_plan():
    """
    Calcula un plan nutricional automático basado en datos actuales y objetivo.
    Migrado desde functions.calcular_plan_nutricional_automatico().
    Body: {
        factor_actividad?: float (default 1.55),
        nombre_apellido?: str  -- admin/doctor puede calcular para otro paciente
    }
    """
    user = get_current_user()
    data = request.get_json() or {}
    factor_actividad = float(data.get('factor_actividad', 1.55))

    # Admin/doctor puede especificar otro paciente
    nombre_objetivo = data.get('nombre_apellido')
    if nombre_objetivo and user['is_admin']:
        patient = resolve_patient_id(nombre_objetivo)
    else:
        patient = resolve_patient_id(user['nombre_apellido'])

    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        # 1. Datos actuales del usuario
        cursor.execute("""
            SELECT m.peso, m.peso_magro, m.peso_graso, m.bf_percent, m.ffmi,
                   p.sexo, p.fecha_nacimiento, p.altura
            FROM measurements m
            JOIN patients p ON m.patient_id = p.id
            WHERE m.patient_id = ?
            ORDER BY m.fecha DESC LIMIT 1
        """, [patient['patient_id']])

        datos = cursor.fetchone()
        if not datos:
            conn.close()
            return error_response('No se encontraron datos del usuario', code=ErrorCodes.NOT_FOUND, status_code=404)

        peso_actual = float(datos[0])
        peso_magro = float(datos[1])
        peso_graso = float(datos[2])
        bf_actual = float(datos[3])
        ffmi_actual = float(datos[4])
        sexo = datos[5]
        fecha_nacimiento = datos[6]
        altura = float(datos[7]) if datos[7] else 170

        # Calcular edad
        edad = 30
        if fecha_nacimiento:
            try:
                fecha_nac = datetime.strptime(str(fecha_nacimiento)[:10], '%Y-%m-%d')
                edad = (datetime.now() - fecha_nac).days // 365
            except:
                pass

        # 2. Objetivo definido
        cursor.execute("SELECT goal_ffmi, goal_bf FROM goals WHERE patient_id = ? AND activo = 1", [patient['patient_id']])
        objetivo = cursor.fetchone()
        if not objetivo:
            conn.close()
            return error_response(
                'No se encontro un objetivo definido. Defini uno primero.',
                code=ErrorCodes.NOT_FOUND, status_code=404
            )

        ffmi_objetivo = float(objetivo[0])
        bf_objetivo = float(objetivo[1])

        conn.close()

        # 3. Calcular peso objetivo
        altura_m = altura / 100
        peso_magro_objetivo = ffmi_objetivo * (altura_m ** 2)
        peso_graso_objetivo = peso_magro_objetivo * (bf_objetivo / (100 - bf_objetivo))
        peso_objetivo = peso_magro_objetivo + peso_graso_objetivo

        # 4. TMB y TDEE (Katch-McArdle)
        peso_magro_lbs = peso_magro * 2.20462
        tmb = 370 + (9.8 * peso_magro_lbs)
        tdee_mantenimiento = round(tmb * factor_actividad)

        # 5. Tipo de objetivo
        cambio_peso = peso_objetivo - peso_actual
        cambio_grasa = peso_graso_objetivo - peso_graso
        cambio_musculo = peso_magro_objetivo - peso_magro

        if abs(cambio_peso) < 1:
            tipo_objetivo = "mantenimiento"
        elif cambio_peso < 0:
            tipo_objetivo = "perdida"
        else:
            tipo_objetivo = "ganancia"

        # 6. Opciones de velocidad
        opciones_velocidad = []
        peso_kg = peso_actual

        if tipo_objetivo == "perdida":
            ea_limite = 25 if sexo == "F" else 20
            ingesta_minima_ea = (ea_limite * peso_magro) + 300

            for nombre, pct, riesgo, desc in [
                ("Conservadora", 0.0025, "Muy bajo", "Pérdida lenta y sostenible. Máxima preservación muscular."),
                ("Moderada", 0.005, "Bajo", "Equilibrio óptimo entre velocidad y preservación muscular."),
                ("Agresiva", 0.0075, "Moderado-Alto", "Pérdida rápida. Mayor riesgo de perder masa magra."),
            ]:
                vel_kg = peso_kg * pct
                deficit_ideal = vel_kg * 7700 / 7
                calorias_ideales = tdee_mantenimiento - deficit_ideal

                if calorias_ideales < ingesta_minima_ea:
                    calorias_real = round(ingesta_minima_ea)
                    deficit_real = tdee_mantenimiento - calorias_real
                    vel_kg_real = (deficit_real * 7) / 7700
                    pct_real = f"{round((vel_kg_real / peso_kg) * 100, 2)}%"
                else:
                    calorias_real = round(calorias_ideales)
                    vel_kg_real = vel_kg
                    pct_real = f"{pct * 100}%"

                opciones_velocidad.append({
                    "nombre": nombre,
                    "velocidad_semanal_kg": round(vel_kg_real, 3),
                    "porcentaje_peso": pct_real,
                    "calorias": calorias_real,
                    "deficit_diario": round(tdee_mantenimiento - calorias_real),
                    "semanas_estimadas": round(abs(cambio_peso) / vel_kg_real) if vel_kg_real > 0 else 0,
                    "riesgo_masa_magra": riesgo,
                    "descripcion": desc,
                })

        elif tipo_objetivo == "ganancia":
            for nombre, pct, desc in [
                ("Conservadora", 0.0025, "Ganancia muscular limpia. Mínima acumulación de grasa."),
                ("Moderada", 0.005, "Ganancia más rápida. Mayor acumulación de grasa."),
            ]:
                vel_kg = peso_kg * pct
                superavit = vel_kg * 7700 / 7
                opciones_velocidad.append({
                    "nombre": nombre,
                    "velocidad_semanal_kg": round(vel_kg, 3),
                    "porcentaje_peso": f"{pct * 100}%",
                    "calorias": round(tdee_mantenimiento + superavit),
                    "superavit_diario": round(superavit),
                    "semanas_estimadas": round(abs(cambio_peso) / vel_kg) if vel_kg > 0 else 0,
                    "descripcion": desc,
                })
        else:
            opciones_velocidad = [{
                "nombre": "Mantenimiento",
                "velocidad_semanal_kg": 0,
                "porcentaje_peso": "0%",
                "calorias": tdee_mantenimiento,
                "deficit_diario": 0,
                "semanas_estimadas": 0,
                "descripcion": "Mantener peso y composición corporal actual.",
            }]

        # 7. Macros para cada opción
        for opcion in opciones_velocidad:
            calorias = opcion["calorias"]
            proteina_g = round(2.513244 * peso_magro, 2)
            proteina_kcal = proteina_g * 4
            grasa_30pct = (calorias * 0.3) / 9
            grasa_minima = peso_actual * 0.6
            grasa_g = round(max(grasa_30pct, grasa_minima), 2)
            grasa_kcal = grasa_g * 9
            ch_kcal = calorias - proteina_kcal - grasa_kcal
            ch_g = round(ch_kcal / 4, 2) if ch_kcal > 0 else 0

            gasto_ejercicio_estimado = 300
            ea = round((calorias - gasto_ejercicio_estimado) / peso_magro, 1)

            if sexo == "F":
                ea_status = "Óptima" if ea >= 45 else "Adecuada" if ea >= 30 else "Límite bajo" if ea >= 25 else "Muy baja - Riesgo RED-S"
            else:
                ea_status = "Óptima" if ea >= 35 else "Adecuada" if ea >= 25 else "Límite bajo" if ea >= 20 else "Muy baja - Riesgo LEA"

            opcion["macros"] = {
                "proteina_g": proteina_g,
                "grasa_g": grasa_g,
                "carbohidratos_g": ch_g,
                "proteina_porcentaje": round((proteina_kcal / calorias) * 100, 1) if calorias > 0 else 0,
                "grasa_porcentaje": 30.0,
                "carbohidratos_porcentaje": round((ch_kcal / calorias) * 100, 1) if ch_kcal > 0 and calorias > 0 else 0,
            }
            opcion["disponibilidad_energetica"] = {
                "ea_valor": ea,
                "ea_status": ea_status,
            }

        return success_response({
            "datos_actuales": {
                "peso": peso_actual, "peso_magro": peso_magro, "peso_graso": peso_graso,
                "bf": bf_actual, "ffmi": ffmi_actual,
            },
            "objetivo": {
                "peso": round(peso_objetivo, 2), "peso_magro": round(peso_magro_objetivo, 2),
                "peso_graso": round(peso_graso_objetivo, 2), "bf": bf_objetivo, "ffmi": ffmi_objetivo,
            },
            "cambios_necesarios": {
                "peso": round(cambio_peso, 2), "grasa": round(cambio_grasa, 2), "musculo": round(cambio_musculo, 2),
            },
            "tipo_objetivo": tipo_objetivo,
            "tdee_mantenimiento": tdee_mantenimiento,
            "tmb": round(tmb),
            "factor_actividad": factor_actividad,
            "opciones_velocidad": opciones_velocidad,
            "metadata": {
                "sexo": sexo, "edad": edad, "altura": altura,
                "fecha_calculo": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            },
        })

    except Exception as e:
        return error_response(
            f'Error calculando plan automático: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


# ============================================
# PLAN ALIMENTARIO - BLOQUES AJUSTABLES
# ============================================

BLOQUE_PROTEINA = 20
BLOQUE_GRASA = 10
BLOQUE_CARBOHIDRATOS = 25

COMIDAS_INDICES = {
    'desayuno': {'p': 6, 'g': 7, 'c': 8, 'nombre': 'Desayuno'},
    'media_manana': {'p': 9, 'g': 10, 'c': 11, 'nombre': 'Media Mañana'},
    'almuerzo': {'p': 12, 'g': 13, 'c': 14, 'nombre': 'Almuerzo'},
    'merienda': {'p': 15, 'g': 16, 'c': 17, 'nombre': 'Merienda'},
    'media_tarde': {'p': 18, 'g': 19, 'c': 20, 'nombre': 'Media Tarde'},
    'cena': {'p': 21, 'g': 22, 'c': 23, 'nombre': 'Cena'},
}


def _get_plan_data(cursor, patient_id):
    """Helper: fetch nutrition_plans row for the patient from clinical.db."""
    cursor.execute("""
        SELECT * FROM nutrition_plans WHERE patient_id = ?
        ORDER BY created_at DESC LIMIT 1
    """, [patient_id])
    return cursor.fetchone()


def _get_user_dni(user):
    """Helper: resolve DNI from auth user dict."""
    return user.get('dni') or user.get('documento')


@nutrition_bp.route('/meal-plans/blocks/adjust', methods=['POST'])
@require_auth
def adjust_blocks():
    """
    Ajusta bloques de una comida específica y recalcula.
    Body: { comida: string, ajustes: { proteina?: int, grasa?: int, carbohidratos?: int } }
    """
    user = get_current_user()
    data = request.get_json() or {}

    if not data.get('comida') or not data.get('ajustes'):
        return error_response('Faltan campos: comida, ajustes', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    comida_id = data['comida']
    ajustes = data['ajustes']

    if comida_id not in COMIDAS_INDICES:
        return error_response('Comida no válida', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    patient = resolve_patient_id(user['nombre_apellido'])
    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()
        plan_data = _get_plan_data(cursor, patient['patient_id'])

        if not plan_data:
            conn.close()
            return error_response('No hay plan nutricional configurado', code=ErrorCodes.NOT_FOUND, status_code=404)

        proteina_total = float(plan_data[3]) if plan_data[3] else 0
        grasa_total = float(plan_data[4]) if plan_data[4] else 0
        ch_total = float(plan_data[5]) if plan_data[5] else 0
        libertad = int(plan_data[24]) if len(plan_data) > 24 and plan_data[24] else 0

        indices = COMIDAS_INDICES[comida_id]
        pct_p = float(plan_data[indices['p']]) if plan_data[indices['p']] else 0
        pct_g = float(plan_data[indices['g']]) if plan_data[indices['g']] else 0
        pct_c = float(plan_data[indices['c']]) if plan_data[indices['c']] else 0

        gramos_p = proteina_total * pct_p
        gramos_g = grasa_total * pct_g
        gramos_c = ch_total * pct_c

        if 'proteina' in ajustes:
            gramos_p += ajustes['proteina'] * BLOQUE_PROTEINA
        if 'grasa' in ajustes:
            gramos_g += ajustes['grasa'] * BLOQUE_GRASA
        if 'carbohidratos' in ajustes:
            gramos_c += ajustes['carbohidratos'] * BLOQUE_CARBOHIDRATOS

        gramos_p = max(0, gramos_p)
        gramos_g = max(0, gramos_g)
        gramos_c = max(0, gramos_c)

        bloques_p = round(gramos_p / BLOQUE_PROTEINA) if gramos_p > 0 else 0
        bloques_g = round(gramos_g / BLOQUE_GRASA) if gramos_g > 0 else 0
        bloques_c = round(gramos_c / BLOQUE_CARBOHIDRATOS) if gramos_c > 0 else 0

        nuevo_pct_p = gramos_p / proteina_total if proteina_total > 0 else 0
        nuevo_pct_g = gramos_g / grasa_total if grasa_total > 0 else 0
        nuevo_pct_c = gramos_c / ch_total if ch_total > 0 else 0

        margen = 1 + (libertad / 100)
        if nuevo_pct_p > margen or nuevo_pct_g > margen or nuevo_pct_c > margen:
            conn.close()
            return error_response(
                f'El ajuste excede el margen de libertad ({libertad}%).',
                code=ErrorCodes.VALIDATION_ERROR, status_code=400
            )

        # Log the adjustment
        for tipo_ajuste, valor in ajustes.items():
            if valor != 0:
                try:
                    cursor.execute('''
                        INSERT INTO block_adjustments_log
                        (patient_id, comida, campo, valor_anterior, valor_nuevo)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (
                        patient['patient_id'], comida_id, tipo_ajuste,
                        0, valor
                    ))
                except Exception:
                    pass  # Table may not exist yet

        conn.commit()
        conn.close()

        return success_response({
            'comida': comida_id,
            'ajuste_aplicado': ajustes,
            'resultado': {
                'bloques': {
                    'proteina': bloques_p, 'grasa': bloques_g, 'carbohidratos': bloques_c,
                    'resumen': f"{bloques_p}P · {bloques_g}G · {bloques_c}C",
                },
                'gramos': {
                    'proteina': round(gramos_p, 2), 'grasa': round(gramos_g, 2), 'carbohidratos': round(gramos_c, 2),
                },
                'porcentajes': {
                    'proteina': round(nuevo_pct_p, 4), 'grasa': round(nuevo_pct_g, 4), 'carbohidratos': round(nuevo_pct_c, 4),
                },
            },
        })

    except Exception as e:
        return error_response(f'Error ajustando bloques: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================
# SUGERENCIAS DE BLOQUES (presets + favoritos + recientes)
# ============================================

@nutrition_bp.route('/meal-plans/blocks/suggestions', methods=['GET'])
@require_auth
def get_block_suggestions():
    """
    Obtiene sugerencias de bloques: presets globales + favoritos del usuario + ajustes recientes.
    Query: ?comida=desayuno (optional filter)
    """
    user = get_current_user()
    patient = resolve_patient_id(user['nombre_apellido'])
    comida_param = request.args.get('comida')

    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()

        plan_data = _get_plan_data(cursor, patient['patient_id'])
        if not plan_data:
            conn.close()
            return error_response('No hay plan nutricional configurado', code=ErrorCodes.NOT_FOUND, status_code=404)

        libertad = int(plan_data[24]) if len(plan_data) > 24 and plan_data[24] else 0

        sugerencias = {
            'presets_globales': [],
            'favoritos_usuario': [],
            'ajustes_recientes': [],
        }

        # 1. Global presets from block_presets
        q = 'SELECT id, comida, proteina_pct, grasa_pct, carbohidratos_pct, nombre_preset, descripcion FROM block_presets WHERE 1=1'
        params = []
        if comida_param:
            q += ' AND comida = ?'
            params.append(comida_param)
        q += ' ORDER BY nombre_preset ASC'
        try:
            cursor.execute(q, params)
            for row in cursor.fetchall():
                sugerencias['presets_globales'].append({
                    'id': row[0], 'comida': row[1],
                    'porcentajes': {'proteina': row[2], 'grasa': row[3], 'carbohidratos': row[4]},
                    'alias': row[5], 'descripcion': row[6], 'tipo': 'preset_global',
                })
        except Exception:
            pass

        # 2. User favorites from block_favorites
        q2 = 'SELECT id, comida, proteina_pct, grasa_pct, carbohidratos_pct, nombre FROM block_favorites WHERE patient_id = ?'
        params2 = [patient['patient_id']]
        if comida_param:
            q2 += ' AND comida = ?'
            params2.append(comida_param)
        q2 += ' ORDER BY created_at DESC'
        try:
            cursor.execute(q2, params2)
            for row in cursor.fetchall():
                sugerencias['favoritos_usuario'].append({
                    'id': row[0], 'comida': row[1],
                    'porcentajes': {'proteina': row[2], 'grasa': row[3], 'carbohidratos': row[4]},
                    'alias': row[5], 'tipo': 'favorito',
                })
        except Exception:
            pass

        # 3. Recent adjustments (last 7 days) from block_adjustments_log
        try:
            cursor.execute('''
                SELECT comida, campo, valor_nuevo, created_at
                FROM block_adjustments_log
                WHERE patient_id = ? AND created_at >= datetime('now', '-7 days')
                ORDER BY created_at DESC LIMIT 10
            ''', (patient['patient_id'],))
            for a in cursor.fetchall():
                sugerencias['ajustes_recientes'].append({
                    'comida': a[0], 'campo': a[1], 'valor': a[2],
                    'timestamp': a[3], 'tipo': 'reciente',
                })
        except Exception:
            pass

        conn.close()

        return success_response({
            'sugerencias': sugerencias,
            'libertad': libertad,
            'bloques_config': {
                'proteina': BLOQUE_PROTEINA, 'grasa': BLOQUE_GRASA, 'carbohidratos': BLOQUE_CARBOHIDRATOS,
            },
        })

    except Exception as e:
        return error_response(f'Error obteniendo sugerencias: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================
# FAVORITOS CRUD
# ============================================

@nutrition_bp.route('/meal-plans/blocks/favorites', methods=['POST'])
@require_auth
def create_block_favorite():
    """
    Guarda una combinación de bloques como favorita.
    Body: { comida, proteina, grasa, carbohidratos, alias?, descripcion? }
    """
    user = get_current_user()
    patient = resolve_patient_id(user['nombre_apellido'])
    data = request.get_json() or {}

    required = ['comida', 'proteina', 'grasa', 'carbohidratos']
    if not all(k in data for k in required):
        return error_response('Faltan campos requeridos', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()

        alias = data.get('alias', f"{data['proteina']}P {data['grasa']}G {data['carbohidratos']}C")

        cursor.execute('''
            INSERT INTO block_favorites
            (patient_id, comida, nombre, proteina_pct, grasa_pct, carbohidratos_pct)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            patient['patient_id'], data['comida'], alias,
            data['proteina'], data['grasa'], data['carbohidratos'],
        ))

        fav_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return success_response({
            'favorito_id': fav_id,
            'favorito': {
                'id': fav_id, 'comida': data['comida'],
                'bloques': {
                    'proteina': data['proteina'], 'grasa': data['grasa'], 'carbohidratos': data['carbohidratos'],
                    'resumen': f"{data['proteina']}P {data['grasa']}G {data['carbohidratos']}C",
                },
                'alias': alias,
            },
        }, status_code=201)

    except Exception as e:
        return error_response(f'Error guardando favorito: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@nutrition_bp.route('/meal-plans/blocks/favorites/<int:fav_id>', methods=['PATCH'])
@require_auth
def update_block_favorite(fav_id):
    """
    Actualiza alias/descripción o marca como usada.
    Body: { alias?, descripcion?, es_favorita?: bool, marcar_usada?: bool }
    """
    user = get_current_user()
    patient = resolve_patient_id(user['nombre_apellido'])
    data = request.get_json() or {}

    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT id FROM block_favorites WHERE id = ? AND patient_id = ?', (fav_id, patient['patient_id']))
        if not cursor.fetchone():
            conn.close()
            return error_response('Favorito no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        sets = []
        vals = []
        if 'alias' in data:
            sets.append('nombre = ?'); vals.append(data['alias'])

        if not sets:
            conn.close()
            return error_response('No hay campos para actualizar', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

        vals.append(fav_id)
        cursor.execute(f"UPDATE block_favorites SET {', '.join(sets)} WHERE id = ?", vals)
        conn.commit()
        conn.close()

        return success_response({'message': 'Favorito actualizado'})

    except Exception as e:
        return error_response(f'Error actualizando favorito: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@nutrition_bp.route('/meal-plans/blocks/favorites/<int:fav_id>', methods=['DELETE'])
@require_auth
def delete_block_favorite(fav_id):
    """Elimina un favorito del usuario (no presets globales)."""
    user = get_current_user()
    patient = resolve_patient_id(user['nombre_apellido'])

    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()

        cursor.execute(
            'SELECT id FROM block_favorites WHERE id = ? AND patient_id = ?',
            (fav_id, patient['patient_id'])
        )
        if not cursor.fetchone():
            conn.close()
            return error_response('Favorito no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

        cursor.execute('DELETE FROM block_favorites WHERE id = ?', (fav_id,))
        conn.commit()
        conn.close()

        return success_response({'message': 'Favorito eliminado'})

    except Exception as e:
        return error_response(f'Error eliminando favorito: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================
# CONSTRUCTOR DE COMBINACIONES
# ============================================

@nutrition_bp.route('/meal-plans/blocks/constructor', methods=['POST'])
@require_auth
def save_block_constructor():
    """
    Guarda una combinación creada por el usuario con detalles de alimentos.
    Body: { comida, alimentos: [{categoria, descripcion, porciones}], alias, es_publica?: bool }
    """
    import sys
    sys.path.insert(0, 'src')
    try:
        import functions
    except ImportError:
        return error_response('Módulo functions no disponible', code=ErrorCodes.INTERNAL_ERROR, status_code=500)

    user = get_current_user()
    patient = resolve_patient_id(user['nombre_apellido'])
    data = request.get_json() or {}

    comida = data.get('comida')
    alimentos = data.get('alimentos', [])
    alias = data.get('alias')

    if not comida or not alimentos or not alias:
        return error_response('Faltan campos: comida, alimentos, alias', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        catalogo = functions.obtener_catalogo_alimentos_bloques()

        bt_p = bt_g = bt_c = 0.0
        gt_p = gt_g = gt_c = 0.0
        alimentos_detalle = []

        for item in alimentos:
            found = next((a for a in catalogo if a['categoria'] == item['categoria'] and a['descripcion'] == item['descripcion']), None)
            if found:
                porciones = item.get('porciones', 1)
                bt_p += found['bloques']['proteina'] * porciones
                bt_g += found['bloques']['grasa'] * porciones
                bt_c += found['bloques']['carbohidratos'] * porciones
                gt_p += found['proteina'] * porciones
                gt_g += found['grasa'] * porciones
                gt_c += found['carbohidratos'] * porciones
                alimentos_detalle.append({
                    'categoria': item['categoria'], 'descripcion': item['descripcion'],
                    'porciones': porciones, 'porcion_gramos': found['porcion'],
                    'bloques': found['bloques'],
                })

        conn = get_clinical_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO block_favorites
            (patient_id, comida, nombre, proteina_pct, grasa_pct, carbohidratos_pct)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            patient['patient_id'], comida, alias,
            round(bt_p, 1), round(bt_g, 1), round(bt_c, 1),
        ))

        fav_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return success_response({
            'favorito_id': fav_id,
            'bloques_total': {
                'proteina': round(bt_p, 1), 'grasa': round(bt_g, 1), 'carbohidratos': round(bt_c, 1),
            },
            'alimentos_detalle': alimentos_detalle,
        }, status_code=201)

    except Exception as e:
        return error_response(f'Error guardando combinación: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================
# BIBLIOTECA DE COMBINACIONES PÚBLICAS
# ============================================

@nutrition_bp.route('/meal-plans/library', methods=['GET'])
@require_auth
def get_library():
    """
    Devuelve combinaciones públicas de la biblioteca, ordenadas por popularidad.
    """
    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, comida, nombre_preset, descripcion,
                   proteina_pct, grasa_pct, carbohidratos_pct
            FROM block_presets
            ORDER BY nombre_preset ASC
        """)
        rows = cursor.fetchall()
        conn.close()

        items = []
        for r in rows:
            items.append({
                'id': r[0], 'comida': r[1], 'alias': r[2], 'descripcion': r[3],
                'porcentajes': {
                    'proteina': r[4], 'grasa': r[5], 'carbohidratos': r[6],
                },
                'tipo': 'biblioteca',
            })

        return success_response({'biblioteca': items, 'total': len(items)})

    except Exception as e:
        return error_response(f'Error obteniendo biblioteca: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@nutrition_bp.route('/meal-plans/library/<int:preset_id>/favorite', methods=['POST', 'DELETE'])
@require_auth
def toggle_library_favorite(preset_id):
    """
    POST: Agrega preset a favoritos del usuario.
    DELETE: Quita preset de favoritos del usuario.
    """
    user = get_current_user()
    patient = resolve_patient_id(user['nombre_apellido'])

    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    try:
        conn = get_clinical_connection()
        cursor = conn.cursor()

        if request.method == 'POST':
            # Copy preset to user's block_favorites
            cursor.execute("SELECT comida, nombre_preset, proteina_pct, grasa_pct, carbohidratos_pct FROM block_presets WHERE id = ?", (preset_id,))
            preset = cursor.fetchone()
            if preset:
                cursor.execute('''
                    INSERT INTO block_favorites (patient_id, comida, nombre, proteina_pct, grasa_pct, carbohidratos_pct)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (patient['patient_id'], preset[0], preset[1], preset[2], preset[3], preset[4]))
        else:
            # Remove from favorites by preset name match
            cursor.execute("SELECT nombre_preset FROM block_presets WHERE id = ?", (preset_id,))
            preset = cursor.fetchone()
            if preset:
                cursor.execute(
                    "DELETE FROM block_favorites WHERE patient_id = ? AND nombre = ?",
                    (patient['patient_id'], preset[0])
                )

        conn.commit()
        conn.close()

        return success_response({
            'action': 'added' if request.method == 'POST' else 'removed',
        })

    except Exception as e:
        return error_response(f'Error toggling favorito: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================
# CATÁLOGO DE ALIMENTOS POR BLOQUES
# ============================================

@nutrition_bp.route('/food-groups/catalog', methods=['GET'])
@require_auth
def get_food_groups_catalog():
    """
    Retorna alimentos de GRUPOSALIMENTOS con bloques nutricionales calculados.
    Query: ?macro=P|G|C (optional), ?momento=desayuno|almuerzo|... (optional)
    """
    import sys
    sys.path.insert(0, 'src')
    try:
        import functions
    except ImportError:
        return error_response('Módulo functions no disponible', code=ErrorCodes.INTERNAL_ERROR, status_code=500)

    macro_filtro = request.args.get('macro')
    momento_filtro = request.args.get('momento')

    try:
        catalogo = functions.obtener_catalogo_alimentos_bloques()

        if macro_filtro:
            catalogo = [a for a in catalogo if macro_filtro.upper() in a.get('macros_fuertes', [a['macro_dominante']])]
        if momento_filtro:
            catalogo = [a for a in catalogo if momento_filtro in a.get('momentos', [])]

        items = []
        for a in catalogo:
            items.append({
                'categoria': a['categoria'],
                'descripcion': a['descripcion'],
                'porcion_gramos': a['porcion'],
                'bloques_unitarios': a['bloques'],
                'gramos_porcion': {
                    'proteina': round(a['proteina'], 2),
                    'grasa': round(a['grasa'], 2),
                    'carbohidratos': round(a['carbohidratos'], 2),
                },
                'macro_dominante': a['macro_dominante'],
                'macros_fuertes': a.get('macros_fuertes', [a['macro_dominante']]),
                'momentos': a.get('momentos', []),
            })

        return success_response({'alimentos': items, 'total': len(items)})

    except Exception as e:
        return error_response(f'Error obteniendo catálogo: {str(e)}', code=ErrorCodes.INTERNAL_ERROR, status_code=500)


# ============================================
# DAILY LOG - Registro diario de nutrición
# ============================================

def _ensure_daily_log_tables(conn):
    """Create daily log tables if they don't exist."""
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS nutrition_daily_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            fecha DATE NOT NULL,
            meal_key TEXT NOT NULL,
            recipe_id INTEGER, recipe_name TEXT, foods_json TEXT,
            completed BOOLEAN DEFAULT 0,
            total_p REAL, total_g REAL, total_c REAL, total_cal REAL,
            target_p REAL, target_g REAL, target_c REAL,
            meal_score REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(patient_id, fecha, meal_key)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS nutrition_daily_summary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            fecha DATE NOT NULL,
            meals_completed INTEGER, meals_total INTEGER,
            total_p REAL, total_g REAL, total_c REAL, total_cal REAL,
            target_p REAL, target_g REAL, target_c REAL, target_cal REAL,
            daily_score REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(patient_id, fecha)
        )
    """)
    conn.commit()


def _calc_coverage(actual, target):
    """Coverage score: 100 if on target, penalize under/over."""
    if not target or target <= 0:
        return 100 if not actual or actual <= 0 else 50
    ratio = actual / target
    if ratio <= 1:
        return ratio * 100
    # Soft penalty for excess: lose 0.5 points for each 1% over
    excess = (ratio - 1) * 100
    return max(0, 100 - excess * 0.5)


def _calc_meal_score(total_p, total_g, total_c, target_p, target_g, target_c):
    """Weighted macro coverage: P 40%, G 30%, C 30%."""
    cov_p = _calc_coverage(total_p or 0, target_p or 0)
    cov_g = _calc_coverage(total_g or 0, target_g or 0)
    cov_c = _calc_coverage(total_c or 0, target_c or 0)
    return round(cov_p * 0.4 + cov_g * 0.3 + cov_c * 0.3, 1)


def _compute_and_upsert_summary(conn, patient_id, fecha):
    """Compute daily summary from individual meal logs and upsert."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT meal_key, completed, total_p, total_g, total_c, total_cal,
               target_p, target_g, target_c, meal_score
        FROM nutrition_daily_logs WHERE patient_id = ? AND fecha = ?
    """, [patient_id, fecha])
    rows = cursor.fetchall()

    if not rows:
        cursor.execute("DELETE FROM nutrition_daily_summary WHERE patient_id = ? AND fecha = ?", [patient_id, fecha])
        conn.commit()
        return None

    meals_total = len(rows)
    meals_completed = sum(1 for r in rows if r['completed'])
    sum_p = sum(r['total_p'] or 0 for r in rows if r['completed'])
    sum_g = sum(r['total_g'] or 0 for r in rows if r['completed'])
    sum_c = sum(r['total_c'] or 0 for r in rows if r['completed'])
    sum_cal = sum(r['total_cal'] or 0 for r in rows if r['completed'])
    tgt_p = sum(r['target_p'] or 0 for r in rows)
    tgt_g = sum(r['target_g'] or 0 for r in rows)
    tgt_c = sum(r['target_c'] or 0 for r in rows)
    tgt_cal = tgt_p * 4 + tgt_c * 4 + tgt_g * 9

    # Daily score: weighted average of meal scores by target calories
    total_weight = 0
    weighted_score = 0
    for r in rows:
        if r['completed']:
            meal_cal = (r['target_p'] or 0) * 4 + (r['target_c'] or 0) * 4 + (r['target_g'] or 0) * 9
            weight = max(meal_cal, 1)
            weighted_score += (r['meal_score'] or 0) * weight
            total_weight += weight
    daily_score = round(weighted_score / total_weight, 1) if total_weight > 0 else 0

    cursor.execute("""
        INSERT INTO nutrition_daily_summary
            (patient_id, fecha, meals_completed, meals_total, total_p, total_g, total_c, total_cal,
             target_p, target_g, target_c, target_cal, daily_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(patient_id, fecha) DO UPDATE SET
            meals_completed=excluded.meals_completed, meals_total=excluded.meals_total,
            total_p=excluded.total_p, total_g=excluded.total_g, total_c=excluded.total_c, total_cal=excluded.total_cal,
            target_p=excluded.target_p, target_g=excluded.target_g, target_c=excluded.target_c, target_cal=excluded.target_cal,
            daily_score=excluded.daily_score
    """, [patient_id, fecha, meals_completed, meals_total,
          round(sum_p, 1), round(sum_g, 1), round(sum_c, 1), round(sum_cal, 1),
          round(tgt_p, 1), round(tgt_g, 1), round(tgt_c, 1), round(tgt_cal, 1),
          daily_score])
    conn.commit()

    return {
        'fecha': fecha,
        'meals_completed': meals_completed,
        'meals_total': meals_total,
        'total_p': round(sum_p, 1), 'total_g': round(sum_g, 1),
        'total_c': round(sum_c, 1), 'total_cal': round(sum_cal, 1),
        'target_p': round(tgt_p, 1), 'target_g': round(tgt_g, 1),
        'target_c': round(tgt_c, 1), 'target_cal': round(tgt_cal, 1),
        'daily_score': daily_score,
    }


@nutrition_bp.route('/daily-log', methods=['POST'])
@require_auth
def save_daily_log():
    """
    Save/update daily nutrition log.
    Body: { fecha, meals: [...], nombre_apellido? (admin/doctor only) }
    """
    user = get_current_user()
    data = request.get_json()

    # Admin/doctor can save for a specific patient
    target_name = data.get('nombre_apellido') if data else None
    if target_name and user.get('is_admin'):
        patient = resolve_patient_id(target_name)
    else:
        patient = resolve_patient_id(user['nombre_apellido'])
    if not patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    if not data or 'meals' not in data:
        return error_response('Se requiere meals', code=ErrorCodes.VALIDATION_ERROR, status_code=400)

    fecha = data.get('fecha', date.today().isoformat())
    meals = data['meals']

    try:
        conn = get_clinical_connection(sqlite3.Row)
        _ensure_daily_log_tables(conn)
        cursor = conn.cursor()

        saved_meals = []
        for meal in meals:
            meal_key = meal.get('meal_key')
            if not meal_key:
                continue

            completed = meal.get('completed', False)
            total_p = meal.get('total_p', 0) or 0
            total_g = meal.get('total_g', 0) or 0
            total_c = meal.get('total_c', 0) or 0
            total_cal = meal.get('total_cal', 0) or 0
            target_p = meal.get('target_p', 0) or 0
            target_g = meal.get('target_g', 0) or 0
            target_c = meal.get('target_c', 0) or 0

            meal_score = _calc_meal_score(total_p, total_g, total_c, target_p, target_g, target_c) if completed else 0

            foods_json = meal.get('foods_json')
            if foods_json is not None and not isinstance(foods_json, str):
                foods_json = json.dumps(foods_json)

            cursor.execute("""
                INSERT INTO nutrition_daily_logs
                    (patient_id, fecha, meal_key, recipe_id, recipe_name, foods_json, completed,
                     total_p, total_g, total_c, total_cal, target_p, target_g, target_c, meal_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(patient_id, fecha, meal_key) DO UPDATE SET
                    recipe_id=excluded.recipe_id, recipe_name=excluded.recipe_name,
                    foods_json=excluded.foods_json, completed=excluded.completed,
                    total_p=excluded.total_p, total_g=excluded.total_g,
                    total_c=excluded.total_c, total_cal=excluded.total_cal,
                    target_p=excluded.target_p, target_g=excluded.target_g, target_c=excluded.target_c,
                    meal_score=excluded.meal_score
            """, [patient['patient_id'], fecha, meal_key,
                  meal.get('recipe_id'), meal.get('recipe_name'), foods_json,
                  1 if completed else 0,
                  round(total_p, 1), round(total_g, 1), round(total_c, 1), round(total_cal, 1),
                  round(target_p, 1), round(target_g, 1), round(target_c, 1),
                  meal_score])

            saved_meals.append({
                'meal_key': meal_key, 'completed': completed, 'meal_score': meal_score,
            })

        conn.commit()
        summary = _compute_and_upsert_summary(conn, patient['patient_id'], fecha)
        conn.close()

        return success_response({
            'fecha': fecha,
            'meals_saved': len(saved_meals),
            'meals': saved_meals,
            'summary': summary,
        }, message='Log diario guardado')

    except Exception as e:
        import traceback, sys
        traceback.print_exc()
        print(f"DAILY_LOG_ERROR: {type(e).__name__}: {e}", file=sys.stderr, flush=True)
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@nutrition_bp.route('/daily-log', methods=['GET'])
@require_auth
def get_daily_log():
    """
    Get daily nutrition log for a date.
    Query: ?fecha=YYYY-MM-DD&nombre_apellido=X (admin/doctor)
    """
    user = get_current_user()
    target_name = request.args.get('nombre_apellido')
    if target_name and user.get('is_admin'):
        patient = resolve_patient_id(target_name)
    else:
        patient = resolve_patient_id(user['nombre_apellido'])
    if not patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    fecha = request.args.get('fecha', date.today().isoformat())

    try:
        conn = get_clinical_connection(sqlite3.Row)
        _ensure_daily_log_tables(conn)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM nutrition_daily_logs
            WHERE patient_id = ? AND fecha = ?
            ORDER BY meal_key
        """, [patient['patient_id'], fecha])
        rows = cursor.fetchall()

        meals = []
        for r in rows:
            foods = None
            if r['foods_json']:
                try:
                    foods = json.loads(r['foods_json'])
                except (json.JSONDecodeError, TypeError):
                    foods = r['foods_json']

            meals.append({
                'meal_key': r['meal_key'],
                'recipe_id': r['recipe_id'],
                'recipe_name': r['recipe_name'],
                'foods_json': foods,
                'completed': bool(r['completed']),
                'total_p': r['total_p'], 'total_g': r['total_g'],
                'total_c': r['total_c'], 'total_cal': r['total_cal'],
                'target_p': r['target_p'], 'target_g': r['target_g'], 'target_c': r['target_c'],
                'meal_score': r['meal_score'],
            })

        # Summary
        cursor.execute("""
            SELECT * FROM nutrition_daily_summary
            WHERE patient_id = ? AND fecha = ?
        """, [patient['patient_id'], fecha])
        summary_row = cursor.fetchone()
        summary = None
        if summary_row:
            summary = {
                'meals_completed': summary_row['meals_completed'],
                'meals_total': summary_row['meals_total'],
                'total_p': summary_row['total_p'], 'total_g': summary_row['total_g'],
                'total_c': summary_row['total_c'], 'total_cal': summary_row['total_cal'],
                'target_p': summary_row['target_p'], 'target_g': summary_row['target_g'],
                'target_c': summary_row['target_c'], 'target_cal': summary_row['target_cal'],
                'daily_score': summary_row['daily_score'],
            }

        conn.close()
        return success_response({'fecha': fecha, 'meals': meals, 'summary': summary})

    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)


@nutrition_bp.route('/daily-log/history', methods=['GET'])
@require_auth
def get_daily_log_history():
    """
    Get daily nutrition log summaries for the last N days.
    Query: ?days=30&nombre_apellido=X (admin/doctor)
    """
    user = get_current_user()
    target_name = request.args.get('nombre_apellido')
    if target_name and user.get('is_admin'):
        patient = resolve_patient_id(target_name)
    else:
        patient = resolve_patient_id(user['nombre_apellido'])
    if not patient:
        return error_response('Paciente no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    days = int(request.args.get('days', 30))
    start_date = (date.today() - timedelta(days=days)).isoformat()

    try:
        conn = get_clinical_connection(sqlite3.Row)
        _ensure_daily_log_tables(conn)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM nutrition_daily_summary
            WHERE patient_id = ? AND fecha >= ?
            ORDER BY fecha DESC
        """, [patient['patient_id'], start_date])
        rows = cursor.fetchall()

        summaries = []
        total_score = 0
        streak = 0
        counting_streak = True

        for r in rows:
            s = {
                'fecha': r['fecha'],
                'meals_completed': r['meals_completed'],
                'meals_total': r['meals_total'],
                'total_p': r['total_p'], 'total_g': r['total_g'],
                'total_c': r['total_c'], 'total_cal': r['total_cal'],
                'target_p': r['target_p'], 'target_g': r['target_g'],
                'target_c': r['target_c'], 'target_cal': r['target_cal'],
                'daily_score': r['daily_score'],
            }
            summaries.append(s)
            total_score += r['daily_score'] or 0

            if counting_streak:
                if r['meals_completed'] and r['meals_completed'] > 0:
                    streak += 1
                else:
                    counting_streak = False

        avg_score = round(total_score / len(summaries), 1) if summaries else 0
        conn.close()

        return success_response({
            'summaries': summaries,
            'total_days': len(summaries),
            'average_score': avg_score,
            'streak': streak,
        })

    except Exception as e:
        return error_response(str(e), code=ErrorCodes.INTERNAL_ERROR, status_code=500)
