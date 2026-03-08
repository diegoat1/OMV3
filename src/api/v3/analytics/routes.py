"""
ANALYTICS Routes - Dashboard y Calculadoras
"""

from flask import request
from . import analytics_bp
from ..common.responses import success_response, error_response, ErrorCodes
from ..common.auth import require_auth, require_admin, get_current_user, is_assigned_professional
from ..common.database import get_db_connection, get_clinical_connection, resolve_user_identity, resolve_patient_id, get_patient_data_legacy
from .calculations import (
    classify_body, classify_body_matrix, calculator_fatrate, calculator_leanrate,
    compute_deltas, build_performance_clock, build_analisis_completo,
    safe_float, normalize_altura
)
import sqlite3
import math
from datetime import datetime, timedelta


def _calc_age(fecha_nacimiento):
    """Calculate age from date string YYYY-MM-DD."""
    if not fecha_nacimiento:
        return None
    try:
        born = datetime.strptime(str(fecha_nacimiento), '%Y-%m-%d')
        today = datetime.today()
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
    except Exception:
        return None


@analytics_bp.route('/dashboard', methods=['GET'])
@require_auth
def get_dashboard():
    """
    Obtiene el dashboard completo del usuario.
    Incluye: composición corporal, scores, categorías descriptivas,
    tasas de cambio, performance clock, análisis completo y diagnóstico.
    """
    user = get_current_user()
    user_param = request.args.get('user')
    direct_patient_id = request.args.get('patient_id', type=int)

    # Resolve target user via clinical.db patient_id
    if direct_patient_id:
        # Direct clinical.db patient_id — no ambiguity with auth.db
        try:
            cconn = get_clinical_connection(sqlite3.Row)
            cc = cconn.cursor()
            cc.execute("SELECT id, dni, nombre FROM patients WHERE id = ?", [direct_patient_id])
            prow = cc.fetchone()
            cconn.close()
            patient = {'patient_id': prow[0], 'dni': prow[1], 'nombre': prow[2]} if prow else None
        except Exception:
            patient = None
    elif user_param:
        patient = resolve_patient_id(user_param)
    else:
        patient = resolve_patient_id(user['nombre_apellido'])

    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)

    target_user = patient['nombre']
    patient_id = patient['patient_id']

    if target_user != user['nombre_apellido'] and not user['is_admin'] and not is_assigned_professional(user['user_id'], patient.get('dni', '')):
        return error_response(
            'No tienes permisos para ver datos de otros usuarios',
            code=ErrorCodes.FORBIDDEN,
            status_code=403
        )

    try:
        # Fetch all data from clinical.db in legacy-compatible tuple format
        data = get_patient_data_legacy(patient_id)
        estaticodata = data['estatico']
        dinamicodata = data['dinamico']
        dietadata = data['dieta']
        objetivodata = data['objetivo']
        
        if not estaticodata:
            return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
        
        perfil_estatico_row = estaticodata[0]
        sexo = perfil_estatico_row[4] if len(perfil_estatico_row) > 4 else 'M'
        altura = normalize_altura(perfil_estatico_row[6] if len(perfil_estatico_row) > 6 else 170)
        
        # --- Core composition & scores (keep backward-compat) ---
        scores = {}
        composicion = {}
        categorias = {}
        body_matrix = None
        
        # Extract neck circumference from static profile [7]=CIRC_CUELLO
        circ_cuello = perfil_estatico_row[7] if len(perfil_estatico_row) > 7 else None

        if dinamicodata:
            ultimo = dinamicodata[-1]
            peso = float(ultimo[6] or 0)
            bf = float(ultimo[7] or 0)
            imc_val = float(ultimo[8] or 0)
            ffmi = float(ultimo[9] or 0)
            peso_graso = float(ultimo[10] or 0)
            peso_magro = float(ultimo[11] or 0)
            # Column order: [3]=circ_abdomen, [4]=circ_cadera, [5]=circ_cintura
            abdomen = int(float(ultimo[3] or 0))
            cadera = int(float(ultimo[4] or 0))
            cintura = int(float(ultimo[5] or 0))
            
            composicion = {
                'peso': peso, 'bf_percent': bf, 'ffmi': ffmi,
                'peso_magro': peso_magro, 'peso_graso': peso_graso,
                'altura': altura,
                'imc': round(peso / ((altura/100) ** 2), 1) if altura > 0 else 0,
                'abdomen': abdomen,
                'circunferencia_cintura': cintura,
                'circunferencia_cadera': cadera,
                'circunferencia_cuello': circ_cuello,
            }
            
            # Scores: usar los almacenados en el registro (solver legacy, escala 0-100 continua)
            # Columnas: [24]=SCOREIMMC/score_ffmi, [25]=SCOREBF/score_bf, [26]=BODYSCORE/body_score
            stored_score_ffmi = float(ultimo[24] or 0) if len(ultimo) > 24 else 0
            stored_score_bf   = float(ultimo[25] or 0) if len(ultimo) > 25 else 0
            stored_body_score = float(ultimo[26] or 0) if len(ultimo) > 26 else 0

            if stored_score_ffmi or stored_score_bf:
                # Usar scores guardados (más precisos, calculados por el solver)
                score_ffmi  = round(stored_score_ffmi)
                score_bf    = round(stored_score_bf)
                score_total = round(stored_body_score) if stored_body_score else round((score_ffmi + score_bf) / 2)
            else:
                # Fallback: calcular on-the-fly para registros sin scores almacenados
                if sexo == 'M':
                    score_ffmi = 100 if ffmi >= 23.7 else 90 if ffmi >= 22 else 75 if ffmi >= 20 else 50 if ffmi >= 18 else 25
                    score_bf   = 100 if bf <= 6 else 90 if bf <= 10 else 75 if bf <= 15 else 50 if bf <= 20 else 25
                else:
                    score_ffmi = 100 if ffmi >= 18.9 else 90 if ffmi >= 17 else 75 if ffmi >= 15 else 50 if ffmi >= 13 else 25
                    score_bf   = 100 if bf <= 14 else 90 if bf <= 18 else 75 if bf <= 24 else 50 if bf <= 30 else 25
                score_total = round((score_ffmi + score_bf) / 2)

            scores = {
                'score_ffmi': score_ffmi, 'score_bf': score_bf, 'score_total': score_total,
                'categoria_ffmi': '', 'categoria_bf': '',
            }
            
            # Category descriptions
            categorias = classify_body(sexo, bf, ffmi, imc_val, abdomen)
            scores['categoria_ffmi'] = categorias['ffmi_categoria']
            scores['categoria_bf'] = categorias['bf_categoria']

            # Body composition matrix (11-zone IMC vs BF%)
            body_matrix = classify_body_matrix(sexo, bf, imc_val)
        
        # --- Advanced calculations ---
        agua_recomendada = round(float(dinamicodata[-1][6]) / 25, 1) if dinamicodata else 0
        
        # Deltas & historical lists
        deltas, listaimc, listaffmi, listabf = compute_deltas(dinamicodata)
        
        # Rate calculators
        tasas = {}
        if dinamicodata:
            fat_mass = float(dinamicodata[-1][10] or 0)
            lean_mass = float(dinamicodata[-1][11] or 0)
            tasas = {
                'fatrate': calculator_fatrate(fat_mass),
                'leanrate': calculator_leanrate(lean_mass),
            }
        
        # Performance clock (uses a separate connection for population query)
        perf_clock = {}
        if dinamicodata:
            conn2 = get_clinical_connection()
            cursor2 = conn2.cursor()
            try:
                perf_clock = build_performance_clock(
                    dinamicodata, tasas.get('fatrate', 0), tasas.get('leanrate', 0), cursor2
                )
            finally:
                conn2.close()
        
        # Full analysis
        analisis_completo = build_analisis_completo(
            dinamicodata, estaticodata, dietadata, objetivodata, perf_clock
        )
        
        return success_response({
            'user': target_user,
            'composicion_corporal': composicion,
            'scores': scores,
            'categorias': categorias,
            'body_matrix': body_matrix if dinamicodata else None,
            'agua_recomendada_litros': agua_recomendada,
            'deltas': deltas,
            'historial': {
                'imc': listaimc,
                'ffmi': listaffmi,
                'bf': listabf,
            },
            'tasas': tasas,
            'performance_clock': perf_clock,
            'analisis_completo': analisis_completo,
            'plan_nutricional': analisis_completo.get('plan_nutricional'),
            'objetivo': analisis_completo.get('objetivo_definido'),
            'metadata': {
                'sexo': sexo,
                'altura': altura,
                'total_registros': len(dinamicodata),
                'fecha_nacimiento': perfil_estatico_row[5] if len(perfil_estatico_row) > 5 else None,
                'edad': _calc_age(perfil_estatico_row[5]) if len(perfil_estatico_row) > 5 else None,
                'nivel_actividad': dietadata[0][30] if dietadata and len(dietadata[0]) > 30 else None,
            },
            'fecha_actualizacion': dinamicodata[-1][2] if dinamicodata else None,
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return error_response(
            f'Error obteniendo dashboard: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@analytics_bp.route('/summary', methods=['GET'])
@require_auth
def get_summary():
    """
    Obtiene un resumen rápido del usuario.
    """
    user = get_current_user()
    user_param = request.args.get('user')

    if user_param:
        patient = resolve_patient_id(user_param)
    else:
        patient = resolve_patient_id(user['nombre_apellido'])

    if patient and patient['nombre'] != user['nombre_apellido'] and not user['is_admin'] and not is_assigned_professional(user['user_id'], patient.get('dni', '')):
        return error_response(
            'No tienes permisos para ver datos de otros usuarios',
            code=ErrorCodes.FORBIDDEN,
            status_code=403
        )
    
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        medicion = None
        plan = None
        if patient:
            pid = patient['patient_id']
            cursor.execute("""
                SELECT peso AS PESO, bf_percent AS BF, ffmi AS IMMC, fecha AS FECHA_REGISTRO
                FROM measurements WHERE patient_id = ?
                ORDER BY fecha DESC LIMIT 1
            """, [pid])
            medicion = cursor.fetchone()
            
            cursor.execute("""
                SELECT calorias AS CALORIAS, proteina AS PROTEINA, grasa AS GRASA, carbohidratos AS CH
                FROM nutrition_plans WHERE patient_id = ?
                ORDER BY created_at DESC LIMIT 1
            """, [pid])
            plan = cursor.fetchone()
        
        conn.close()
        
        return success_response({
            'ultima_medicion': dict(medicion) if medicion else None,
            'plan_actual': dict(plan) if plan else None
        })
        
    except Exception as e:
        return error_response(
            f'Error obteniendo resumen: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@analytics_bp.route('/body-composition', methods=['GET'])
@require_auth
def get_body_composition():
    """
    Obtiene la composición corporal actual del usuario.
    """
    user = get_current_user()
    user_param = request.args.get('user')
    
    if user_param:
        patient = resolve_patient_id(user_param)
    else:
        patient = resolve_patient_id(user['nombre_apellido'])
    
    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
    
    if patient['nombre'] != user['nombre_apellido'] and not user['is_admin'] and not is_assigned_professional(user['user_id'], patient.get('dni', '')):
        return error_response(
            'No tienes permisos para ver datos de otros usuarios',
            code=ErrorCodes.FORBIDDEN,
            status_code=403
        )

    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT m.id AS ID, p.nombre AS NOMBRE_APELLIDO, m.fecha AS FECHA_REGISTRO,
                   m.circ_abdomen AS CIRC_ABD, m.circ_cadera AS CIRC_CAD, m.circ_cintura AS CIRC_CIN,
                   m.peso AS PESO, m.bf_percent AS BF, m.imc AS IMC, m.ffmi AS IMMC,
                   m.peso_graso AS PESO_GRASO, m.peso_magro AS PESO_MAGRO,
                   m.delta_dias AS DELTADIA, m.delta_peso AS DELTAPESO,
                   m.delta_peso_dia AS DELTADIAPESO, m.delta_graso AS DELTAPG,
                   m.delta_graso_dia AS DELTADIAPG, m.delta_magro AS DELTAPM,
                   m.delta_magro_dia AS DELTADIAPM, m.delta_peso_cat AS DELTAPESOCAT,
                   m.lbm_loss AS LBMLOSS, m.lbm_loss_cat AS LBMLOSSCAT,
                   m.fbm_gain AS FBMGAIN, m.fbm_gain_cat AS FBMGAINCAT,
                   m.score_ffmi AS SCOREIMMC, m.score_bf AS SCOREBF, m.body_score AS BODYSCORE,
                   m.solver_category AS SOLVER_CATEGORY
            FROM measurements m
            JOIN patients p ON m.patient_id = p.id
            WHERE m.patient_id = ?
            ORDER BY m.fecha DESC LIMIT 1
        """, [patient['patient_id']])
        
        medicion = cursor.fetchone()
        conn.close()
        
        if not medicion:
            return success_response({
                'body_composition': None,
                'message': 'No hay mediciones registradas'
            })
        
        return success_response({
            'body_composition': dict(medicion)
        })
        
    except Exception as e:
        return error_response(
            f'Error obteniendo composicion corporal: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@analytics_bp.route('/body-composition/history', methods=['GET'])
@require_auth
def get_body_composition_history():
    """
    Obtiene el historial de composición corporal.
    
    Query Params:
        user: auth.db ID, DNI, or nombre_apellido (optional)
        limit: Número de registros (default: 30)
        desde: Fecha desde (YYYY-MM-DD)
        hasta: Fecha hasta (YYYY-MM-DD)
    """
    user = get_current_user()
    user_param = request.args.get('user')
    direct_patient_id = request.args.get('patient_id', type=int)
    limit = request.args.get('limit', 30, type=int)
    desde = request.args.get('desde')
    hasta = request.args.get('hasta')

    if direct_patient_id:
        try:
            cconn = get_clinical_connection(sqlite3.Row)
            cc = cconn.cursor()
            cc.execute("SELECT id, dni, nombre FROM patients WHERE id = ?", [direct_patient_id])
            prow = cc.fetchone()
            cconn.close()
            patient = {'patient_id': prow[0], 'dni': prow[1], 'nombre': prow[2]} if prow else None
        except Exception:
            patient = None
    elif user_param:
        patient = resolve_patient_id(user_param)
    else:
        patient = resolve_patient_id(user['nombre_apellido'])

    if not patient:
        return error_response('Usuario no encontrado', code=ErrorCodes.NOT_FOUND, status_code=404)
    
    if patient['nombre'] != user['nombre_apellido'] and not user['is_admin'] and not is_assigned_professional(user['user_id'], patient.get('dni', '')):
        return error_response(
            'No tienes permisos para ver datos de otros usuarios',
            code=ErrorCodes.FORBIDDEN,
            status_code=403
        )

    try:
        history = []

        # Try clinical.db first
        try:
            conn = get_clinical_connection(sqlite3.Row)
            cursor = conn.cursor()
            
            query = """
                SELECT fecha AS FECHA_REGISTRO, peso AS PESO, bf_percent AS BF_PERCENT,
                       ffmi AS FFMI, peso_magro AS PESO_MAGRO, peso_graso AS PESO_GRASO,
                       circ_abdomen AS CIRC_ABDOMEN, circ_cintura AS CIRC_CINTURA,
                       circ_cadera AS CIRC_CADERA,
                       imc AS IMC, delta_peso AS DELTA_PESO,
                       delta_peso_cat AS DELTA_PESO_CAT,
                       lbm_loss_cat AS LBM_LOSS_CAT, fbm_gain_cat AS FBM_GAIN_CAT,
                       score_ffmi AS SCORE_FFMI, score_bf AS SCORE_BF,
                       body_score AS BODY_SCORE
                FROM measurements
                WHERE patient_id = ?
            """
            params = [patient['patient_id']]
            
            if desde:
                query += " AND DATE(fecha) >= DATE(?)"
                params.append(desde)
            if hasta:
                query += " AND DATE(fecha) <= DATE(?)"
                params.append(hasta)
            
            query += " ORDER BY fecha DESC LIMIT ?"
            params.append(limit)
            
            cursor.execute(query, params)
            history = [dict(row) for row in cursor.fetchall()]
            conn.close()
        except Exception:
            pass

        # Fallback: legacy Basededatos
        if not history:
            try:
                nombre = patient.get('nombre', '')
                conn = get_db_connection(sqlite3.Row)
                cursor = conn.cursor()
                
                query = """
                    SELECT FECHA_REGISTRO, PESO, BF AS BF_PERCENT,
                           IMMC AS FFMI, PESO_MAGRO, PESO_GRASO,
                           CIRC_ABD AS CIRC_ABDOMEN, CIRC_CIN AS CIRC_CINTURA,
                           CIRC_CAD AS CIRC_CADERA,
                           IMC AS IMC, DELTAPESO AS DELTA_PESO,
                           DELTAPESOCAT AS DELTA_PESO_CAT,
                           LBMLOSSCAT AS LBM_LOSS_CAT, FBMGAINCAT AS FBM_GAIN_CAT,
                           SCOREIMMC AS SCORE_FFMI, SCOREBF AS SCORE_BF,
                           BODYSCORE AS BODY_SCORE
                    FROM PERFILDINAMICO
                    WHERE NOMBRE_APELLIDO = ?
                """
                params = [nombre]
                
                if desde:
                    query += " AND DATE(FECHA_REGISTRO) >= DATE(?)"
                    params.append(desde)
                if hasta:
                    query += " AND DATE(FECHA_REGISTRO) <= DATE(?)"
                    params.append(hasta)
                
                query += " ORDER BY FECHA_REGISTRO DESC LIMIT ?"
                params.append(limit)
                
                cursor.execute(query, params)
                history = [dict(row) for row in cursor.fetchall()]
                conn.close()
            except Exception:
                pass
        
        return success_response({
            'history': history,
            'total': len(history)
        })
        
    except Exception as e:
        return error_response(
            f'Error obteniendo historial: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


@analytics_bp.route('/scores', methods=['GET'])
@require_auth
def get_scores():
    """
    Obtiene los scores del usuario (FFMI, BF, etc.).
    """
    user = get_current_user()
    user_param = request.args.get('user')

    if user_param:
        patient = resolve_patient_id(user_param)
    else:
        patient = resolve_patient_id(user['nombre_apellido'])

    if patient and patient['nombre'] != user['nombre_apellido'] and not user['is_admin'] and not is_assigned_professional(user['user_id'], patient.get('dni', '')):
        return error_response(
            'No tienes permisos para ver datos de otros usuarios',
            code=ErrorCodes.FORBIDDEN,
            status_code=403
        )
    
    try:
        conn = get_clinical_connection(sqlite3.Row)
        cursor = conn.cursor()
        
        sexo = 'M'
        if patient:
            cursor.execute("SELECT sexo FROM patients WHERE id = ?", [patient['patient_id']])
            perfil = cursor.fetchone()
            sexo = perfil[0] if perfil else 'M'
        
            cursor.execute("""
                SELECT bf_percent, ffmi FROM measurements
                WHERE patient_id = ?
                ORDER BY fecha DESC LIMIT 1
            """, [patient['patient_id']])
        else:
            conn.close()
            return success_response({'scores': None, 'message': 'Usuario no encontrado'})
        
        medicion = cursor.fetchone()
        conn.close()
        
        if not medicion:
            return success_response({
                'scores': None,
                'message': 'No hay mediciones para calcular scores'
            })
        
        bf = float(medicion[0] or 0)
        ffmi = float(medicion[1] or 0)
        
        # Calcular categorías y scores
        if sexo == 'M':
            # Categorías FFMI hombres
            if ffmi >= 23.7:
                cat_ffmi, score_ffmi = 'Superior', 100
            elif ffmi >= 22:
                cat_ffmi, score_ffmi = 'Excelente', 90
            elif ffmi >= 20:
                cat_ffmi, score_ffmi = 'Muy Bueno', 75
            elif ffmi >= 18:
                cat_ffmi, score_ffmi = 'Bueno', 60
            elif ffmi >= 17:
                cat_ffmi, score_ffmi = 'Normal', 50
            else:
                cat_ffmi, score_ffmi = 'Bajo', 25
            
            # Categorías BF hombres
            if bf <= 6:
                cat_bf, score_bf = 'Élite', 100
            elif bf <= 9:
                cat_bf, score_bf = 'Atlético', 90
            elif bf <= 12:
                cat_bf, score_bf = 'Fitness', 80
            elif bf <= 15:
                cat_bf, score_bf = 'Normal Alto', 65
            elif bf <= 20:
                cat_bf, score_bf = 'Normal', 50
            elif bf <= 26:
                cat_bf, score_bf = 'Sobrepeso', 30
            else:
                cat_bf, score_bf = 'Obesidad', 10
        else:
            # Categorías FFMI mujeres
            if ffmi >= 18.9:
                cat_ffmi, score_ffmi = 'Superior', 100
            elif ffmi >= 17:
                cat_ffmi, score_ffmi = 'Excelente', 90
            elif ffmi >= 15:
                cat_ffmi, score_ffmi = 'Muy Bueno', 75
            elif ffmi >= 14:
                cat_ffmi, score_ffmi = 'Bueno', 60
            elif ffmi >= 13:
                cat_ffmi, score_ffmi = 'Normal', 50
            else:
                cat_ffmi, score_ffmi = 'Bajo', 25
            
            # Categorías BF mujeres
            if bf <= 14:
                cat_bf, score_bf = 'Élite', 100
            elif bf <= 17:
                cat_bf, score_bf = 'Atlético', 90
            elif bf <= 20:
                cat_bf, score_bf = 'Fitness', 80
            elif bf <= 24:
                cat_bf, score_bf = 'Normal Alto', 65
            elif bf <= 28:
                cat_bf, score_bf = 'Normal', 50
            elif bf <= 32:
                cat_bf, score_bf = 'Sobrepeso', 30
            else:
                cat_bf, score_bf = 'Obesidad', 10
        
        # Also get IMC and abdomen for body classifications
        conn3 = get_clinical_connection(sqlite3.Row)
        cursor3 = conn3.cursor()
        cursor3.execute("""
            SELECT peso, imc, circ_abdomen FROM measurements
            WHERE patient_id = ? ORDER BY fecha DESC LIMIT 1
        """, [patient['patient_id']])
        extra = cursor3.fetchone()
        imc_val = float(extra[1] or 0) if extra else 0
        abdomen = int(float(extra[2] or 0)) if extra else 0
        conn3.close()

        categorias = classify_body(sexo, bf, ffmi, imc_val, abdomen)

        return success_response({
            'score_bf': score_bf,
            'score_ffmi': score_ffmi,
            'score_total': round((score_ffmi + score_bf) / 2),
            'categoria_bf': cat_bf,
            'categoria_ffmi': cat_ffmi,
            'bf_valor': bf,
            'ffmi_valor': ffmi,
            'sexo': sexo,
            'descripciones': categorias,
        })
        
    except Exception as e:
        return error_response(
            f'Error calculando scores: {str(e)}',
            code=ErrorCodes.INTERNAL_ERROR,
            status_code=500
        )


# ============================================
# CALCULADORAS
# ============================================

@analytics_bp.route('/calculators/bmr', methods=['POST'])
def calculate_bmr():
    """
    Calcula la Tasa Metabólica Basal (BMR).
    
    Request Body:
        {
            "peso": 75,
            "altura": 175,
            "edad": 30,
            "sexo": "M",
            "formula": "katch_mcardle",  // o "mifflin_st_jeor", "harris_benedict"
            "peso_magro": 60  // requerido para katch_mcardle
        }
    """
    data = request.get_json() or {}
    
    peso = float(data.get('peso', 0))
    altura = float(data.get('altura', 0))
    edad = int(data.get('edad', 0))
    sexo = data.get('sexo', 'M').upper()
    formula = data.get('formula', 'katch_mcardle')
    peso_magro = float(data.get('peso_magro', 0))
    
    if not peso or not altura:
        return error_response(
            'Peso y altura son requeridos',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    bmr = 0
    formula_usada = formula
    
    if formula == 'katch_mcardle' and peso_magro > 0:
        # Katch-McArdle: BMR = 370 + (9.8 × peso_magro_lbs)
        peso_magro_lbs = peso_magro * 2.20462
        bmr = 370 + (9.8 * peso_magro_lbs)
    elif formula == 'mifflin_st_jeor':
        # Mifflin-St Jeor
        if sexo == 'M':
            bmr = (10 * peso) + (6.25 * altura) - (5 * edad) + 5
        else:
            bmr = (10 * peso) + (6.25 * altura) - (5 * edad) - 161
    else:
        # Harris-Benedict (default si no hay peso magro)
        formula_usada = 'harris_benedict'
        if sexo == 'M':
            bmr = 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * edad)
        else:
            bmr = 447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * edad)
    
    return success_response({
        'bmr': round(bmr, 0),
        'formula': formula_usada,
        'inputs': {
            'peso': peso,
            'altura': altura,
            'edad': edad,
            'sexo': sexo,
            'peso_magro': peso_magro
        }
    })


@analytics_bp.route('/calculators/tdee', methods=['POST'])
def calculate_tdee():
    """
    Calcula el Gasto Energético Total Diario (TDEE).
    
    Request Body:
        {
            "bmr": 1800,  // o calcular desde peso/altura/edad
            "factor_actividad": 1.55,
            // Alternativamente:
            "peso": 75,
            "altura": 175,
            "edad": 30,
            "sexo": "M",
            "peso_magro": 60
        }
    """
    data = request.get_json() or {}
    
    bmr = float(data.get('bmr', 0))
    factor = float(data.get('factor_actividad', 1.55))
    
    # Si no se proporciona BMR, calcularlo
    if not bmr:
        peso = float(data.get('peso', 0))
        altura = float(data.get('altura', 0))
        edad = int(data.get('edad', 30))
        sexo = data.get('sexo', 'M').upper()
        peso_magro = float(data.get('peso_magro', 0))
        
        if peso_magro > 0:
            peso_magro_lbs = peso_magro * 2.20462
            bmr = 370 + (9.8 * peso_magro_lbs)
        elif peso > 0 and altura > 0:
            if sexo == 'M':
                bmr = 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * edad)
            else:
                bmr = 447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * edad)
    
    if not bmr:
        return error_response(
            'Se requiere BMR o datos para calcularlo',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    tdee = bmr * factor
    
    # Factores de actividad de referencia
    factores = {
        1.2: 'Sedentario (poco o nada de ejercicio)',
        1.375: 'Ligeramente activo (1-3 días/semana)',
        1.55: 'Moderadamente activo (3-5 días/semana)',
        1.725: 'Muy activo (6-7 días/semana)',
        1.9: 'Extremadamente activo (atleta)'
    }
    
    return success_response({
        'tdee': round(tdee, 0),
        'bmr': round(bmr, 0),
        'factor_actividad': factor,
        'factores_referencia': factores
    })


@analytics_bp.route('/calculators/body-fat', methods=['POST'])
def calculate_body_fat():
    """
    Calcula el porcentaje de grasa corporal (método Navy).
    
    Request Body:
        {
            "sexo": "M",
            "altura": 175,
            "circ_abdomen": 85,  // hombres
            "circ_cuello": 38,   // hombres
            "circ_cintura": 75,  // mujeres
            "circ_cadera": 95    // mujeres
        }
    """
    data = request.get_json() or {}
    
    sexo = data.get('sexo', 'M').upper()
    altura = float(data.get('altura', 0))
    
    if not altura:
        return error_response(
            'La altura es requerida',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    bf_percent = 0
    
    if sexo == 'M':
        abdomen = float(data.get('circ_abdomen', 0))
        cuello = float(data.get('circ_cuello', 0))
        
        if abdomen > 0:
            if cuello > 0:
                # Fórmula Navy completa
                bf_percent = 495 / (1.0324 - 0.19077 * math.log10(abdomen - cuello) + 0.15456 * math.log10(altura)) - 450
            else:
                # Fórmula simplificada
                bf_percent = 495 / (1.0324 - 0.19077 * math.log10(abdomen) + 0.15456 * math.log10(altura)) - 450
    else:
        cintura = float(data.get('circ_cintura', 0))
        cadera = float(data.get('circ_cadera', 0))
        cuello = float(data.get('circ_cuello', 0))
        
        if cintura > 0 and cadera > 0:
            if cuello > 0:
                bf_percent = 495 / (1.29579 - 0.35004 * math.log10(cintura + cadera - cuello) + 0.22100 * math.log10(altura)) - 450
            else:
                bf_percent = 495 / (1.29579 - 0.35004 * math.log10(cintura + cadera) + 0.22100 * math.log10(altura)) - 450
    
    bf_percent = max(0, min(60, bf_percent))
    
    return success_response({
        'bf_percent': round(bf_percent, 1),
        'metodo': 'Navy',
        'inputs': data
    })


@analytics_bp.route('/calculators/ffmi', methods=['POST'])
def calculate_ffmi():
    """
    Calcula el Índice de Masa Libre de Grasa (FFMI).
    
    Request Body:
        {
            "peso": 75,
            "altura": 175,
            "bf_percent": 15
        }
        // O directamente:
        {
            "peso_magro": 63.75,
            "altura": 175
        }
    """
    data = request.get_json() or {}
    
    altura = float(data.get('altura', 0))
    peso_magro = float(data.get('peso_magro', 0))
    
    if not altura:
        return error_response(
            'La altura es requerida',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    # Calcular peso magro si no se proporciona
    if not peso_magro:
        peso = float(data.get('peso', 0))
        bf = float(data.get('bf_percent', 0))
        
        if peso > 0 and bf >= 0:
            peso_magro = peso * (1 - bf / 100)
        else:
            return error_response(
                'Se requiere peso_magro o (peso + bf_percent)',
                code=ErrorCodes.VALIDATION_ERROR,
                status_code=400
            )
    
    altura_m = altura / 100
    
    # FFMI = peso_magro / altura² + 6.1 × (1.8 - altura)
    ffmi = peso_magro / (altura_m ** 2) + 6.1 * (1.8 - altura_m)
    
    # FFMI normalizado (ajustado a 1.80m)
    ffmi_normalizado = peso_magro / (altura_m ** 2)
    
    return success_response({
        'ffmi': round(ffmi, 2),
        'ffmi_normalizado': round(ffmi_normalizado, 2),
        'peso_magro': round(peso_magro, 2),
        'altura': altura
    })


@analytics_bp.route('/calculators/weight-loss', methods=['POST'])
def calculate_weight_loss():
    """
    Calcula plan de pérdida de peso.
    
    Request Body:
        {
            "peso_actual": 80,
            "peso_objetivo": 70,
            "tdee": 2200,
            "velocidad": 0.5  // kg por semana (0.25-1.0)
        }
    """
    data = request.get_json() or {}
    
    peso_actual = float(data.get('peso_actual', 0))
    peso_objetivo = float(data.get('peso_objetivo', 0))
    tdee = float(data.get('tdee', 0))
    velocidad = float(data.get('velocidad', 0.5))
    
    if not all([peso_actual, peso_objetivo, tdee]):
        return error_response(
            'peso_actual, peso_objetivo y tdee son requeridos',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    # Limitar velocidad
    velocidad = max(0.25, min(1.0, velocidad))
    
    # Calcular déficit necesario (1kg grasa ≈ 7700 kcal)
    deficit_diario = (velocidad * 7700) / 7
    calorias_diarias = tdee - deficit_diario
    
    # Tiempo estimado
    peso_a_perder = peso_actual - peso_objetivo
    semanas = peso_a_perder / velocidad
    
    return success_response({
        'plan': {
            'calorias_diarias': round(calorias_diarias, 0),
            'deficit_diario': round(deficit_diario, 0),
            'velocidad_semanal': velocidad,
            'peso_a_perder': round(peso_a_perder, 1),
            'semanas_estimadas': round(semanas, 0),
            'meses_estimados': round(semanas / 4.33, 1)
        },
        'inputs': {
            'peso_actual': peso_actual,
            'peso_objetivo': peso_objetivo,
            'tdee': tdee
        }
    })


@analytics_bp.route('/calculators/muscle-gain', methods=['POST'])
def calculate_muscle_gain():
    """
    Calcula plan de ganancia muscular.
    
    Request Body:
        {
            "peso_actual": 70,
            "peso_objetivo": 75,
            "tdee": 2200,
            "velocidad": 0.25  // kg por semana (0.1-0.5)
        }
    """
    data = request.get_json() or {}
    
    peso_actual = float(data.get('peso_actual', 0))
    peso_objetivo = float(data.get('peso_objetivo', 0))
    tdee = float(data.get('tdee', 0))
    velocidad = float(data.get('velocidad', 0.25))
    
    if not all([peso_actual, peso_objetivo, tdee]):
        return error_response(
            'peso_actual, peso_objetivo y tdee son requeridos',
            code=ErrorCodes.VALIDATION_ERROR,
            status_code=400
        )
    
    # Limitar velocidad
    velocidad = max(0.1, min(0.5, velocidad))
    
    # Calcular superávit necesario
    superavit_diario = (velocidad * 7700) / 7
    calorias_diarias = tdee + superavit_diario
    
    # Tiempo estimado
    peso_a_ganar = peso_objetivo - peso_actual
    semanas = peso_a_ganar / velocidad
    
    return success_response({
        'plan': {
            'calorias_diarias': round(calorias_diarias, 0),
            'superavit_diario': round(superavit_diario, 0),
            'velocidad_semanal': velocidad,
            'peso_a_ganar': round(peso_a_ganar, 1),
            'semanas_estimadas': round(semanas, 0),
            'meses_estimados': round(semanas / 4.33, 1)
        },
        'inputs': {
            'peso_actual': peso_actual,
            'peso_objetivo': peso_objetivo,
            'tdee': tdee
        }
    })
