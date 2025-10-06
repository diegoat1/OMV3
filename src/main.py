from flask import Flask, render_template, request, make_response, session, redirect, url_for, flash, jsonify
from flask_wtf import CSRFProtect
import sqlite3
import math
from datetime import datetime, timedelta
import statistics
import json
import forms
import functions
from functions import decode_json_data
from training import (crear_tablas, inicializar_matriz_entrenamiento,
                      obtener_entrenamiento_del_dia, registrar_sesion_completada,
                      avanzar_dia_plan, guardar_plan_optimizado, obtener_conexion_db)

app = Flask(__name__)
app.secret_key = 'my_secret_key'
csrf = CSRFProtect(app)

# Inicializar la base de datos y la matriz de entrenamiento del módulo training
crear_tablas()
inicializar_matriz_entrenamiento()

### FUNCIÓN DE CHEQUEO PREVIO AL INGRESO DE CADA PÁGINA ###

@app.before_request
def before_request():
    if 'username' in session:
        username = session['username']
    else:
        pass
    if 'username' in session and username != 'Toffaletti, Diego Alejandro' and request.endpoint in ['create', 'editperfilest', 'delperfilest', 'login', 'update', 'editperfildin', 'delperfildin', 'planner', 'delplan', 'editplan', 'goal', 'delgoal', 'recipecreator', "databasemanager", "databasemanager_beta", "update_database_cell", 'createfood', 'editfood', 'delfood', 'deleterecipe', 'strengthstandard', 'trainingplanner', 'strengthdata_admin_view']:
        return redirect(url_for('dashboard'))
    if 'username' not in session and request.endpoint in ['create', 'editperfilest', 'delperfilest', 'update', 'editperfildin', 'delperfildin', 'planner', 'delplan', 'editplan', 'goal', 'delgoal', 'recipecreator', "databasemanager", 'createfood', 'editfood', 'delfood', 'deleterecipe', 'recipe', 'strengthstandard', 'trainingplanner']:
        return redirect(url_for('login'))

### PÁGINA EN MANTENIMIENTO ###

@app.route('/')
def home():
    if 'username' in session:
        username = session['username']
        return redirect(url_for('dashboard'))
    return render_template('home.html', title='Página principal')
    #return redirect("https://linktr.ee/omegamedicina", code=302)

@app.route('/resume')
def resume():
    username = session['username']
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    cursor.execute('SELECT * FROM DIETA WHERE NOMBRE_APELLIDO=?', [username])
    dietadata=cursor.fetchall()
    cursor.execute('SELECT * FROM PERFILDINAMICO WHERE NOMBRE_APELLIDO=? ORDER BY FECHA_REGISTRO DESC', [username])
    dinamicodata=cursor.fetchall()
    cursor.execute('SELECT * FROM PERFILESTATICO WHERE NOMBRE_APELLIDO=?', [username])
    estaticodata=cursor.fetchall()
    cursor.execute('SELECT * FROM OBJETIVO WHERE NOMBRE_APELLIDO=?', [username])
    objetivodata=cursor.fetchall()
    cursor.execute("SELECT ALTURA FROM PERFILESTATICO WHERE NOMBRE_APELLIDO=?", [username])
    altura=cursor.fetchone()[0]
    cursor.execute("SELECT CIRC_CUELLO FROM PERFILESTATICO WHERE NOMBRE_APELLIDO=?", [username])
    ccu=cursor.fetchone()[0]

    sexo=estaticodata[0][4]
    fat=dinamicodata[0][10]
    lean=dinamicodata[0][11]
    peso=dinamicodata[0][6]
    ccin=dinamicodata[0][3]
    ccad=dinamicodata[0][4]
    cabd=dinamicodata[0][5]
    
    #Calculo de porcentaje de grasa corporal
    if sexo=="M":
        bf=495/(1.0324-0.19077*math.log((cabd-1)-ccu,10)+0.15456*math.log(altura,10))-450
        fatfinal=lean/((100-bf)/100)*bf/100
    elif sexo=="F":
        bf=495/(1.29579-0.35004*math.log((ccad+ccin-2)-ccu,10)+0.221*math.log(altura,10))-450
        fatfinal=lean/((100-bf)/100)*bf/100
    
    def calculator(fat):
        maxloss=fat*31
        mapace = maxloss*7/3500
        remain1 = mapace%100
        mint = round(mapace)
        remain1 = mapace-mint
        suff1 = round(remain1*100)
        mapace = mint + suff1/100
        return(mapace)
    fatrate=calculator(fat)

    deltafat=fat-fatfinal
    dias=deltafat/fatrate*7

    leanrate=lean/268
    if sexo=="M":
        deltalean=0.5
    elif sexo=="F":
        deltalean=0.25
    dias2=deltalean/leanrate*7

    
    if sexo=="M":
        datos=(["Disminución de peso", "Deberías bajar en 1 semana, aproximadamente " + str(round(fatrate,2)) + " kg. Y para el próximo control bajar 1 cm. de abdomen.", round(dias)],["Aumento de peso", "Deberías subir en 1 semana, aproximadamente " + str(round(leanrate,2)) + " kg. Y para el próximo control 500 gramos de músculo.", round(dias2) ])
    elif sexo=="F":
        datos=(["Disminución de peso", "Deberías bajar en 1 semana, aproximadamente " + str(round(fatrate,2)) + " kg. Y para el próximo control bajar 1 cm. de cintura y otro de cadera.", round(dias)],["Aumento de peso", "Deberías subir en 1 semana, aproximadamente " + str(round(leanrate,2)) + " kg. Y para el próximo control 250 gramos de músculo.", round(dias2) ])

    ffmi=dinamicodata[-1][9]
    bf=dinamicodata[-1][7]

    fatdays=(fat-dinamicodata[0][32])/fatrate*7
    leandays=(dinamicodata[0][31]-lean)/leanrate*7
    if fatdays<0:
        fatdays=0
    else:
        pass
    if leandays<0:
        leandays=0
    else:
        pass

    idealdays=leandays+fatdays
    try:
        star=round(idealdays/dinamicodata[0][29]*5)
    except:
        star=0

    return render_template('resume.html', title='Resumen', username=session['username'], datos=datos, ffmi=ffmi, bf=bf, peso=peso, dinamicodata=dinamicodata, star=star)

@app.route('/caloriescal', methods=['GET', 'POST'])
def caloriescal():
    if 'username' in session:
        username = session['username']
    else:
        username = None
    return render_template('caloriescal.html', title='Calculadora de calorías', username=username)

@app.route('/dashboard')
def dashboard():
    if 'DNI' not in session:
        return redirect(url_for('login'))

    user_dni = session['DNI']
    username = session['username']
    
    # Detectar si el usuario es administrador
    is_admin = (username == 'Toffaletti, Diego Alejandro')
    
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    
    # Si es admin, puede ver otros pacientes vía query param
    paciente_seleccionado = None
    lista_pacientes = []
    
    if is_admin:
        # Obtener lista de todos los pacientes para el selector
        cursor.execute("SELECT DISTINCT NOMBRE_APELLIDO FROM PERFILESTATICO ORDER BY NOMBRE_APELLIDO")
        lista_pacientes = [row[0] for row in cursor.fetchall()]
        
        # Permitir selección de paciente (por defecto, el propio admin)
        paciente_seleccionado = request.args.get('paciente', username)
        
        # Usar el paciente seleccionado para cargar los datos
        username_to_load = paciente_seleccionado
        
        # Obtener DNI del paciente seleccionado
        cursor.execute("SELECT DNI FROM PERFILESTATICO WHERE NOMBRE_APELLIDO=?", [username_to_load])
        dni_result = cursor.fetchone()
        user_dni_to_load = dni_result[0] if dni_result else user_dni
    else:
        # Usuario normal solo ve su propia información
        username_to_load = username
        user_dni_to_load = user_dni
    
    cursor.execute('SELECT * FROM DIETA WHERE NOMBRE_APELLIDO=?', [username_to_load])
    dietadata=cursor.fetchall()
    cursor.execute('SELECT * FROM PERFILDINAMICO WHERE NOMBRE_APELLIDO=? ORDER BY FECHA_REGISTRO ASC', [username_to_load])
    dinamicodata=cursor.fetchall()
    cursor.execute('SELECT * FROM PERFILESTATICO WHERE NOMBRE_APELLIDO=?', [username_to_load])
    estaticodata=cursor.fetchall()
    cursor.execute('SELECT * FROM OBJETIVO WHERE NOMBRE_APELLIDO=?', [username_to_load])
    objetivodata=cursor.fetchall()
    # NO cerrar aún - se necesita para leer plan alimentario más adelante
    # basededatos.close()

    if not dinamicodata or not estaticodata:
        flash("No se encontraron datos de perfil. Por favor, actualice su perfil.")
        return redirect(url_for('update'))

    # CALCULOS EXTRAS PARA MOSTRAR
    agua=round(dinamicodata[-1][6]/25,1)
    sexo=estaticodata[0][4]
    abdomen=int(dinamicodata[-1][5])
    
    bodycat=["Graso", "Sobrepeso", "Robusto", "Inactivo", "Balanceado", "Balanceado muscular", "Delgado", "Balanceado delgado", "Delgado muscular"]
    bodyscore= dinamicodata[-1][26]
    
    ffmi=dinamicodata[-1][9]
    bf=dinamicodata[-1][7]
    imc=dinamicodata[-1][8]
    
    if sexo == "M":
        if abdomen > 102:
            diff = abdomen - 102
            abdcatrisk = 'Riesgo muy elevado de evento cardiovascular, deberías disminuir ' + str(diff) + ' cm.'
        elif abdomen > 95:
            diff = abdomen - 95
            abdcatrisk = 'Riesgo elevado de evento cardiovascular, deberías disminuir ' + str(diff) + ' cm.'
        else:
            abdcatrisk = 'Te encuentras en un rango normal'
        if bf>24:
            factor=0
        elif bf<17:
            factor=2
        else:
            factor=1
        if ffmi>21.5:
            factor=2+factor*3
        elif ffmi<19:
            factor=factor*3
        else:
            factor=1+factor*3
        if bf>20:
            bfcat="Promedio: No es un abdomen plano; se beneficiará de la pérdida de grasa."
        elif bf>15:
            bfcat="Fit/Saludable: Sin barriga; bien moldeado en la mayoría de la ropa."
        elif bf>10:
            bfcat="Atlético: Abs visible con la flexión y una buena iluminación."
        else:
            bfcat="Módelo: Abdominales visibles sin flexión"
        if ffmi>25:
            immccat="Uso de esteroides: Posible pero muy poco probable sin esteroides."
        elif ffmi>24:
            immccat="Límite Constitución muscular superior a la media."
        elif ffmi>22.5:
            immccat="Excelente: Constitución muscular superior a la media."
        elif ffmi>21:
            immccat="Muy buena: Constitución muscular promedio."
        elif ffmi>20:
            immccat="Buena: Constitución muscular promedio."
        elif ffmi>19:
            immccat="Normal: Constitución muscular promedio."
        elif ffmi>18:
            immccat="Casi normal: Complexión débil y constitución muscular baja."
        else:
            immccat="Pobre: Complexión dñebil y constitución muscular baja."
        if imc>40:
            imccat="Obesidad morbida - Riesgo cardiovascular: Extremadamente alto."
        elif imc>35:
            imccat="Obesidad severa - Riesgo cardiovascular: Muy alto."
        elif imc>30:
            imccat="Obesidad - Riesgo cardiovascular: Alto"
        elif imc>25:
            imccat="Sobrepeso - Riesgo cardiovascular: Incrementado"
        elif imc>18.5:
            imccat="Normal - Riesgo cardiovascular: Mínimo"
        else:
            imccat="Bajo peso - Riesgo cardiovascular: Mínimo"
    elif sexo == "F":
        if abdomen > 88:
            diff = abdomen - 88
            abdcatrisk = 'Riesgo muy elevado de evento cardiovascular, deberías disminuir ' + str(diff) + ' cm.'
        elif abdomen > 82:
            diff = abdomen - 82
            abdcatrisk = 'Riesgo elevado de evento cardiovascular, deberías disminuir ' + str(diff) + ' cm.'
        else:
            abdcatrisk = 'Te encuentras en un rango normal'
        if bf>32:
            factor=0
        elif bf<25:
            factor=2
        else:
            factor=1
        if ffmi>19:
            factor=2+factor*3
        elif ffmi<16.25:
            factor=factor*3
        else:
            factor=1+factor*3
        if bf>30:
            bfcat="Promedio: No es un abdomen plano; se beneficiará de la pérdida de grasa."
        elif bf>22:
            bfcat="Fit/Saludable: Sin barriga; bien moldeado en la mayoría de la ropa."
        elif bf>18:
            bfcat="Atlético: Abs visible con la flexión y una buena iluminación."
        else:
            bfcat="Módelo: Abdominales visibles sin flexión"
        if ffmi>22:
            immccat="Uso de esteroides: Posible pero muy poco probable sin esteroides."
        elif ffmi>20.5:
            immccat="Límite Constitución muscular superior a la media."
        elif ffmi>18.5:
            immccat="Excelente: Constitución muscular superior a la media."
        elif ffmi>17:
            immccat="Muy buena: Constitución muscular promedio."
        elif ffmi>16:
            immccat="Buena: Constitución muscular promedio."
        elif ffmi>14.5:
            immccat="Normal: Constitución muscular promedio."
        elif ffmi>13.5:
            immccat="Casi normal: Complexión dñebil y constitución muscular baja."
        else:
            immccat="Pobre: Complexión dñebil y constitución muscular baja."
        if imc>40:
            imccat="Obesidad morbida - Riesgo cardiovascular: Extremadamente alto."
        elif imc>35:
            imccat="Obesidad severa - Riesgo cardiovascular: Muy alto."
        elif imc>30:
            imccat="Obesidad - Riesgo cardiovascular: Alto"
        elif imc>25:
            imccat="Sobrepeso - Riesgo cardiovascular: Incrementado"
        elif imc>18.5:
            imccat="Normal - Riesgo cardiovascular: Mínimo"
        else:
            imccat="Bajo peso - Riesgo cardiovascular: Mínimo"

    categoria=bodycat[factor]

    fat=dinamicodata[-1][10]
    lean=dinamicodata[-1][11]
    def calculator(fat):
        maxloss=fat*31
        mapace = maxloss*7/3500
        remain1 = mapace%100
        mint = round(mapace)
        remain1 = mapace-mint
        suff1 = round(remain1*100)
        mapace = mint + suff1/100
        return(mapace)

    fatrate=calculator(fat)
    leanrate=lean/268

    fatweeks=(fat-dinamicodata[-1][32])/fatrate
    fatdays=fatweeks*7
    leanweeks=(dinamicodata[-1][31]-lean)/leanrate
    leandays=leanweeks*7
    if fatdays<0:
        fatdays=0
    else:
        pass
    if leandays<0:
        leandays=0
    else:
        pass
    
    idealdays=leandays+fatdays
    
    solver_category=dinamicodata[-1][36]
    habitperformance=idealdays/dinamicodata[-1][29]*100
    if habitperformance>=100:
            habitperformance=100
    else:
        pass
    try:
        if solver_category =="General":
            habitperformance=round(habitperformance/3)
        elif solver_category =="Positivo":
            habitperformance=round(100/3+(habitperformance)/3)
        elif solver_category =="Completo":
            habitperformance=round(200/3+habitperformance/3)
    except:
        habitperformance=0

    fatrate_target = fatrate
    leanrate_target = leanrate

    def safe_float(value):
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def parse_date_safe(value):
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value)
            except ValueError:
                for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y"):
                    try:
                        return datetime.strptime(value, fmt)
                    except ValueError:
                        continue
        return None

    user_entries = []
    for row in dinamicodata:
        entry_date = parse_date_safe(row[2])
        user_entries.append({
            "date": entry_date,
            "fat_mass": safe_float(row[10]),
            "lean_mass": safe_float(row[11]),
            "weight": safe_float(row[6]),
            "lbm_category": row[21],
            "fbm_category": row[23]
        })

    user_entries = [entry for entry in user_entries if entry["date"] is not None]
    user_entries.sort(key=lambda item: item["date"])

    latest_entry_date = user_entries[-1]["date"] if user_entries else datetime.today()

    positive_lbmloss = {"Excelente", "Correcto", "Impresionante"}
    positive_fbmgain = {"Excelente", "Correcto"}

    def is_positive_entry(entry):
        return (entry.get("lbm_category") in positive_lbmloss) or (entry.get("fbm_category") in positive_fbmgain)

    def build_metrics(filtered_entries, baseline_entry, label, scenario_name):
        def summarize_entry(entry):
            if not entry:
                return "Sin datos"
            date_value = entry.get("date")
            if isinstance(date_value, datetime):
                date_str = date_value.strftime("%Y-%m-%d")
            else:
                date_str = str(date_value) if date_value is not None else "s/d"
            fat_value = entry.get("fat_mass")
            lean_value = entry.get("lean_mass")
            weight_value = entry.get("weight")
            fat_str = f"{fat_value:.4f}" if isinstance(fat_value, (int, float)) else "n/d"
            lean_str = f"{lean_value:.4f}" if isinstance(lean_value, (int, float)) else "n/d"
            weight_str = f"{weight_value:.2f}" if isinstance(weight_value, (int, float)) else "n/d"
            return f"{date_str} | grasa={fat_str} | magra={lean_str} | peso={weight_str}"

        metrics = {
            "label": label,
            "fat_rate": None,
            "lean_rate": None,
            "fat_diff": None,
            "lean_diff": None,
            "confidence": {
                "count": len(filtered_entries),
                "cv": None
            }
        }

        if filtered_entries:
            preview_entries = ", ".join(summarize_entry(entry) for entry in filtered_entries[:3])
            if len(filtered_entries) > 3:
                preview_entries += ", ..."

        weights = [entry["weight"] for entry in filtered_entries if entry["weight"] is not None]
        if len(weights) > 1:
            mean_weight = sum(weights) / len(weights)
            if mean_weight:
                metrics["confidence"]["cv"] = statistics.pstdev(weights) / mean_weight
        elif len(weights) == 1:
            metrics["confidence"]["cv"] = None

        comparison_entries = []
        if baseline_entry:
            comparison_entries.append(baseline_entry)
        comparison_entries.extend(filtered_entries)
        comparison_entries = [
            entry for entry in comparison_entries
            if entry["date"] and entry["fat_mass"] is not None and entry["lean_mass"] is not None
        ]

        if len(comparison_entries) >= 2:
            first_entry = comparison_entries[0]
            last_entry = comparison_entries[-1]
            delta_days = (last_entry["date"] - first_entry["date"]).days
            if delta_days > 0:
                fat_rate = (last_entry["fat_mass"] - first_entry["fat_mass"]) / delta_days * 7
                lean_rate = (last_entry["lean_mass"] - first_entry["lean_mass"]) / delta_days * 7
                metrics["fat_rate"] = fat_rate
                metrics["lean_rate"] = lean_rate
                if fatrate_target is not None:
                    expected_fat_rate = -fatrate_target
                    metrics["fat_diff"] = expected_fat_rate - fat_rate
                if leanrate_target is not None:
                    metrics["lean_diff"] = lean_rate - leanrate_target

        return metrics

    def prepare_entries(days, positive_only=False):
        start_date = latest_entry_date - timedelta(days=days)
        filtered = []
        for entry in user_entries:
            if entry["date"] >= start_date:
                if positive_only and not is_positive_entry(entry):
                    continue
                filtered.append(entry)
        baseline = None
        if filtered:
            for entry in reversed(user_entries):
                if entry["date"] < filtered[0]["date"]:
                    if positive_only and not is_positive_entry(entry):
                        continue
                    baseline = entry
                    break
        return filtered, baseline

    performance_clock = {
        "all": {
            "label": "Todos los datos",
            "timeframes": {}
        },
        "positive": {
            "label": "Solo positivos (días adherentes)",
            "timeframes": {}
        },
        "population": {
            "label": "Promedio de la población (solver)",
            "timeframes": {}
        }
    }

    timeframes = [
        ("week", 7, "Última semana"),
        ("month", 30, "Último mes"),
        ("year", 365, "Último año")
    ]

    population_connection = sqlite3.connect('src/Basededatos')
    population_cursor = population_connection.cursor()

    try:
        for key, days, label in timeframes:
            filtered_all, baseline_all = prepare_entries(days, positive_only=False)
            metrics_all = build_metrics(filtered_all, baseline_all, label, "Todos los datos")
            performance_clock["all"]["timeframes"][key] = metrics_all

            filtered_positive, baseline_positive = prepare_entries(days, positive_only=True)
            metrics_positive = build_metrics(filtered_positive, baseline_positive, label, "Solo positivos")
            performance_clock["positive"]["timeframes"][key] = metrics_positive

            start_date = (latest_entry_date - timedelta(days=days)).strftime('%Y-%m-%d')
            end_date = latest_entry_date.strftime('%Y-%m-%d')
            population_cursor.execute(
                """
                SELECT FECHA_REGISTRO, PESO, PESO_GRASO, PESO_MAGRO, DELTAPG, DELTAPM, DELTADIA
                FROM PERFILDINAMICO
                WHERE FECHA_REGISTRO IS NOT NULL
                  AND DATE(FECHA_REGISTRO) BETWEEN ? AND ?
                  AND DELTADIA IS NOT NULL
                """,
                (start_date, end_date)
            )
            population_rows = population_cursor.fetchall()

            if population_rows:
                sample_population = []
                for row in population_rows[:3]:
                    fecha_registro = row[0]
                    fecha_str = fecha_registro if isinstance(fecha_registro, str) else str(fecha_registro)
                    sample_population.append(
                        {
                            "fecha": fecha_str,
                            "delta_fat": row[4],
                            "delta_lean": row[5],
                            "delta_dias": row[6]
                        }
                    )

            population_metrics = {
                "label": label,
                "fat_rate": None,
                "lean_rate": None,
                "fat_diff": None,
                "lean_diff": None,
                "confidence": {
                    "count": len(population_rows),
                    "cv": None
                }
            }

            population_weights = [safe_float(row[1]) for row in population_rows if safe_float(row[1]) is not None]
            if len(population_weights) > 1:
                mean_weight = sum(population_weights) / len(population_weights)
                if mean_weight:
                    population_metrics["confidence"]["cv"] = statistics.pstdev(population_weights) / mean_weight
            elif len(population_weights) == 1:
                population_metrics["confidence"]["cv"] = None

            total_days = 0
            total_fat_change = 0
            total_lean_change = 0
            for _, _, _, _, delta_fat, delta_lean, delta_days in population_rows:
                if delta_days and delta_days > 0 and delta_fat is not None and delta_lean is not None:
                    total_days += delta_days
                    total_fat_change += delta_fat
                    total_lean_change += delta_lean


            if total_days > 0:
                fat_rate_population = (total_fat_change / total_days) * 7
                lean_rate_population = (total_lean_change / total_days) * 7
                population_metrics["fat_rate"] = fat_rate_population
                population_metrics["lean_rate"] = lean_rate_population
                if fatrate_target is not None:
                    expected_fat_rate = -fatrate_target
                    population_metrics["fat_diff"] = expected_fat_rate - fat_rate_population
                if leanrate_target is not None:
                    population_metrics["lean_diff"] = lean_rate_population - leanrate_target

            performance_clock["population"]["timeframes"][key] = population_metrics
    finally:
        population_connection.close()

    deltapeso=round(dinamicodata[-1][13]*1000)
    deltapg=round(dinamicodata[-1][15]*1000)
    deltapm=round(dinamicodata[-1][17]*1000)

    if len(dinamicodata)>1:
        deltaimc=round((dinamicodata[-1][8]-dinamicodata[-2][8])*100/dinamicodata[-2][8],1)
        deltaffmi=round((dinamicodata[-1][9]-dinamicodata[-2][9])*100/dinamicodata[-2][9],1)
        deltabf=round((dinamicodata[-1][7]-dinamicodata[-2][7])*100/dinamicodata[-2][7],1)
    else:
        deltaimc=0
        deltaffmi=0
        deltabf=0   

    listaimc=[]
    if len(dinamicodata)<14:
        lendata=len(dinamicodata)
    else:
        lendata=14
    
    for i in range(lendata):
        listaimc.append(dinamicodata[-lendata+i][8])

    listaffmi=[]
    for i in range(lendata):
        listaffmi.append(dinamicodata[-lendata+i][9])

    listabf=[]
    for i in range(lendata):
        listabf.append(dinamicodata[-lendata+i][7])

    # Obtener el plan de entrenamiento
    training_plan = functions.get_training_plan(user_dni)

    # ============================================================================
    # ANÁLISIS COMPLETO DEL RELOJ DE RENDIMIENTO
    # ============================================================================
    
    analisis_completo = {
        "tiene_datos": False,
        "estado_actual": {},
        "objetivo_definido": {},
        "plan_nutricional": {},
        "plan_alimentario": {},
        "diferencias": {},
        "tasas_esperadas": {},
        "tasas_actuales": {},
        "comparacion_periodos": {},
        "diagnostico": {}
    }
    
    # 1. ESTADO ACTUAL DEL USUARIO
    if dinamicodata:
        ultimo_registro = dinamicodata[-1]
        primer_registro = dinamicodata[0]
        
        analisis_completo["estado_actual"] = {
            "peso": round(float(ultimo_registro[6]), 2),
            "peso_magro": round(float(ultimo_registro[11]), 2),
            "peso_graso": round(float(ultimo_registro[10]), 2),
            "bf_porcentaje": round(float(ultimo_registro[7]), 1),
            "ffmi": round(float(ultimo_registro[9]), 2),
            "imc": round(float(ultimo_registro[8]), 2),
            "fecha_ultimo_registro": ultimo_registro[2],
            "fecha_primer_registro": primer_registro[2],
            "total_registros": len(dinamicodata),
            "dias_monitoreados": (latest_entry_date - parse_date_safe(primer_registro[2])).days if parse_date_safe(primer_registro[2]) else 0
        }
    
    # 2. OBJETIVO DEFINIDO (leer desde dinamicodata que tiene los objetivos guardados)
    if dinamicodata and len(ultimo_registro) > 32:
        # Los objetivos están en dinamicodata en las columnas 30, 31, 32
        peso_objetivo = float(ultimo_registro[30]) if ultimo_registro[30] else None
        peso_magro_objetivo = float(ultimo_registro[31]) if ultimo_registro[31] else None
        peso_graso_objetivo = float(ultimo_registro[32]) if ultimo_registro[32] else None
        
        if peso_objetivo and peso_magro_objetivo and peso_graso_objetivo:
            # Calcular BF% y FFMI objetivo
            bf_objetivo = (peso_graso_objetivo / peso_objetivo) * 100
            
            # Obtener altura correctamente - COLUMNA 6 (NO 7)
            if estaticodata and len(estaticodata[0]) > 6 and estaticodata[0][6]:
                altura_raw = estaticodata[0][6]
                try:
                    altura = float(altura_raw)
                except:
                    altura = 170.0
            else:
                altura = 170.0  # Altura por defecto
            
            # Normalizar altura a centímetros según el rango
            if altura < 3:  # Si está en metros (ej: 1.70 o 0.35)
                altura = altura * 100
            elif altura < 50:  # Si está en decímetros o error (ej: 17 o 35)
                # Asumiendo que es un error, usar 170 cm por defecto
                altura = 170.0
            # Si está entre 50-250 cm, es válido
            elif altura > 250:  # Demasiado alto, posible error
                altura = 170.0
            
            altura_m = altura / 100.0
            
            # Validar que altura_m sea razonable (1.0m - 2.5m)
            if altura_m < 1.0 or altura_m > 2.5:
                altura_m = 1.70
            
            ffmi_objetivo = peso_magro_objetivo / (altura_m ** 2)
            
            analisis_completo["objetivo_definido"] = {
                "ffmi_objetivo": round(ffmi_objetivo, 2),
                "bf_objetivo": round(bf_objetivo, 1),
                "peso_objetivo": round(peso_objetivo, 2),
                "peso_magro_objetivo": round(peso_magro_objetivo, 2),
                "peso_graso_objetivo": round(peso_graso_objetivo, 2),
                "tiene_objetivo": True
            }
        else:
            analisis_completo["objetivo_definido"]["tiene_objetivo"] = False
    else:
        analisis_completo["objetivo_definido"]["tiene_objetivo"] = False
    
    # Si hay objetivo definido, continuar con los cálculos
    if analisis_completo["objetivo_definido"].get("tiene_objetivo"):
        objetivo_ffmi = analisis_completo["objetivo_definido"]["ffmi_objetivo"]
        objetivo_bf = analisis_completo["objetivo_definido"]["bf_objetivo"]
        peso_objetivo = analisis_completo["objetivo_definido"]["peso_objetivo"]
        peso_magro_objetivo = analisis_completo["objetivo_definido"]["peso_magro_objetivo"]
        peso_graso_objetivo = analisis_completo["objetivo_definido"]["peso_graso_objetivo"]
        
        # Calcular diferencias
        analisis_completo["diferencias"] = {
            "peso": round(peso_objetivo - float(ultimo_registro[6]), 2),
            "peso_magro": round(peso_magro_objetivo - float(ultimo_registro[11]), 2),
            "peso_graso": round(peso_graso_objetivo - float(ultimo_registro[10]), 2),
            "bf": round(objetivo_bf - float(ultimo_registro[7]), 1),
            "ffmi": round(objetivo_ffmi - float(ultimo_registro[9]), 2)
        }
        
        # Determinar fase
        if abs(analisis_completo["diferencias"]["bf"]) < 2 and abs(analisis_completo["diferencias"]["ffmi"]) < 0.5:
            fase_actual = "Mantenimiento"
        elif analisis_completo["diferencias"]["bf"] < -2:
            fase_actual = "Definición (Pérdida de grasa)"
        elif analisis_completo["diferencias"]["ffmi"] > 0.5:
            fase_actual = "Volumen (Ganancia muscular)"
        else:
            fase_actual = "Transición"
        
        analisis_completo["diferencias"]["fase"] = fase_actual
    
    # 3. PLAN NUTRICIONAL ACTUAL (DIETA)
    if dietadata:
        plan = dietadata[0]
        # Estructura: 0-23 (datos base), 24 (libertad), 25 (fecha), 26 (estrategia), 27 (velocidad), 28 (deficit), 29 (EA)
        fecha_plan = plan[25] if len(plan) > 25 and plan[25] else None
        estrategia = plan[26] if len(plan) > 26 and plan[26] else None
        velocidad_cambio = plan[27] if len(plan) > 27 and plan[27] else None
        deficit_calorico = plan[28] if len(plan) > 28 and plan[28] else None
        disponibilidad_energetica = plan[29] if len(plan) > 29 and plan[29] else None
        
        # Calcular días desde creación
        dias_desde_creacion = None
        if fecha_plan:
            try:
                # Intentar parsear la fecha
                if isinstance(fecha_plan, str):
                    fecha_obj = datetime.fromisoformat(fecha_plan.replace(' ', 'T'))
                else:
                    fecha_obj = fecha_plan
                dias_desde_creacion = (datetime.now() - fecha_obj).days
            except:
                dias_desde_creacion = None
        
        analisis_completo["plan_nutricional"] = {
            "tiene_plan": True,
            "calorias_totales": int(plan[2]) if plan[2] else 0,
            "proteina_total": round(float(plan[3]), 1) if plan[3] else 0,
            "grasa_total": round(float(plan[4]), 1) if plan[4] else 0,
            "carbohidratos_total": round(float(plan[5]), 1) if plan[5] else 0,
            "libertad_porcentaje": int(plan[24]) if len(plan) > 24 and plan[24] else 0,
            "fecha_creacion": fecha_plan,
            "dias_desde_creacion": dias_desde_creacion,
            # Nueva información de estrategia
            "estrategia": estrategia,
            "velocidad_cambio": float(velocidad_cambio) if velocidad_cambio else None,
            "deficit_calorico": float(deficit_calorico) if deficit_calorico else None,
            "disponibilidad_energetica": float(disponibilidad_energetica) if disponibilidad_energetica else None,
            "distribucion_comidas": {
                "desayuno": {
                    "proteina": round(float(plan[6]) * 100, 1) if plan[6] else 0,
                    "grasa": round(float(plan[7]) * 100, 1) if plan[7] else 0,
                    "carbohidratos": round(float(plan[8]) * 100, 1) if plan[8] else 0
                },
                "media_manana": {
                    "proteina": round(float(plan[9]) * 100, 1) if plan[9] else 0,
                    "grasa": round(float(plan[10]) * 100, 1) if plan[10] else 0,
                    "carbohidratos": round(float(plan[11]) * 100, 1) if plan[11] else 0
                },
                "almuerzo": {
                    "proteina": round(float(plan[12]) * 100, 1) if plan[12] else 0,
                    "grasa": round(float(plan[13]) * 100, 1) if plan[13] else 0,
                    "carbohidratos": round(float(plan[14]) * 100, 1) if plan[14] else 0
                },
                "merienda": {
                    "proteina": round(float(plan[15]) * 100, 1) if plan[15] else 0,
                    "grasa": round(float(plan[16]) * 100, 1) if plan[16] else 0,
                    "carbohidratos": round(float(plan[17]) * 100, 1) if plan[17] else 0
                },
                "media_tarde": {
                    "proteina": round(float(plan[18]) * 100, 1) if plan[18] else 0,
                    "grasa": round(float(plan[19]) * 100, 1) if plan[19] else 0,
                    "carbohidratos": round(float(plan[20]) * 100, 1) if plan[20] else 0
                },
                "cena": {
                    "proteina": round(float(plan[21]) * 100, 1) if plan[21] else 0,
                    "grasa": round(float(plan[22]) * 100, 1) if plan[22] else 0,
                    "carbohidratos": round(float(plan[23]) * 100, 1) if plan[23] else 0
                }
            }
        }
        
        # Calcular macros en gramos por comida
        if plan[2]:  # Si hay calorías definidas
            proteina_total = float(plan[3])
            grasa_total = float(plan[4])
            ch_total = float(plan[5])
            
            analisis_completo["plan_nutricional"]["macros_gramos"] = {
                "desayuno": {
                    "proteina": round(proteina_total * float(plan[6]), 1) if plan[6] else 0,
                    "grasa": round(grasa_total * float(plan[7]), 1) if plan[7] else 0,
                    "carbohidratos": round(ch_total * float(plan[8]), 1) if plan[8] else 0
                },
                "almuerzo": {
                    "proteina": round(proteina_total * float(plan[12]), 1) if plan[12] else 0,
                    "grasa": round(grasa_total * float(plan[13]), 1) if plan[13] else 0,
                    "carbohidratos": round(ch_total * float(plan[14]), 1) if plan[14] else 0
                },
                "cena": {
                    "proteina": round(proteina_total * float(plan[21]), 1) if plan[21] else 0,
                    "grasa": round(grasa_total * float(plan[22]), 1) if plan[22] else 0,
                    "carbohidratos": round(ch_total * float(plan[23]), 1) if plan[23] else 0
                }
            }
    else:
        analisis_completo["plan_nutricional"]["tiene_plan"] = False
    
    # 4. PLAN ALIMENTARIO (PLANES_ALIMENTARIOS - recetas específicas)
    try:
        cursor = basededatos.cursor()
        
        # Buscar por DNI o NOMBRE_APELLIDO para compatibilidad
        cursor.execute("""
            SELECT ID, FECHA_CREACION, FECHA_ACTUALIZACION, TIPO_PLAN, 
                   TOTAL_RECETAS, COMIDAS_CONFIGURADAS, CALORIAS_TOTALES
            FROM PLANES_ALIMENTARIOS
            WHERE (USER_DNI = ? OR NOMBRE_APELLIDO = ?) AND ACTIVO = 1
            ORDER BY FECHA_CREACION DESC LIMIT 1
        """, [user_dni_to_load, username_to_load])
        
        plan_alimentario = cursor.fetchone()
        
        if plan_alimentario:
            # Parsear fecha de inicio
            fecha_inicio = plan_alimentario[1]
            dias_desde_inicio = 0
            if fecha_inicio:
                try:
                    if isinstance(fecha_inicio, str):
                        fecha_obj = datetime.fromisoformat(fecha_inicio.replace(' ', 'T'))
                    else:
                        fecha_obj = fecha_inicio
                    dias_desde_inicio = (datetime.now() - fecha_obj).days
                except:
                    dias_desde_inicio = 0
            
            analisis_completo["plan_alimentario"] = {
                "tiene_plan": True,
                "fecha_inicio": fecha_inicio,
                "fecha_actualizacion": plan_alimentario[2],
                "tipo_plan": plan_alimentario[3],
                "total_recetas": plan_alimentario[4] if plan_alimentario[4] else 0,
                "comidas_configuradas": plan_alimentario[5] if plan_alimentario[5] else 0,
                "calorias_del_plan": plan_alimentario[6] if plan_alimentario[6] else None,
                "dias_desde_inicio": dias_desde_inicio
            }
        else:
            analisis_completo["plan_alimentario"]["tiene_plan"] = False
    except Exception as e:
        analisis_completo["plan_alimentario"]["tiene_plan"] = False
        analisis_completo["plan_alimentario"]["error"] = str(e)
        print(f"Error al leer plan alimentario: {e}")
    
    # 5. TASAS ESPERADAS (priorizar datos del plan nutricional si existen)
    if dinamicodata and analisis_completo["objetivo_definido"].get("tiene_objetivo"):
        peso_actual = float(ultimo_registro[6])
        peso_graso_actual = float(ultimo_registro[10])
        peso_magro_actual = float(ultimo_registro[11])
        sexo = estaticodata[0][4] if estaticodata else "M"
        
        # Verificar si hay estrategia guardada del planner
        velocidad_guardada = analisis_completo["plan_nutricional"].get("velocidad_cambio") if analisis_completo["plan_nutricional"].get("tiene_plan") else None
        
        # Fórmula del planner para fatrate (pérdida de grasa)
        def calculator_fatrate(fat):
            maxloss = fat * 31
            mapace = maxloss * 7 / 3500
            return mapace
        
        fatrate_planner = calculator_fatrate(peso_graso_actual)
        
        # Fórmula del planner para leanrate (ganancia de músculo)
        leanrate_planner = peso_magro_actual / 268
        
        # Determinar tasas según la fase
        fase_actual = analisis_completo["diferencias"]["fase"]
        
        if fase_actual == "Definición (Pérdida de grasa)":
            # Si hay velocidad guardada del planner, usarla (kg/sem, ya es negativa)
            if velocidad_guardada and velocidad_guardada > 0:
                # La velocidad está en gramos/semana, convertir a kg/sem
                velocidad_kg_sem = velocidad_guardada / 1000
                tasa_peso_semanal = -velocidad_kg_sem  # Negativa porque es pérdida
                # Estimar: 75% de pérdida es grasa, 25% músculo (si no ideal)
                tasa_grasa_semanal = tasa_peso_semanal * 0.75
                tasa_musculo_semanal = tasa_peso_semanal * 0.25
            else:
                # En definición: pérdida de grasa según fórmula, conservar músculo
                tasa_grasa_semanal = -fatrate_planner  # Negativo porque es pérdida
                tasa_musculo_semanal = 0.0  # Idealmente conservar músculo
                tasa_peso_semanal = tasa_grasa_semanal + tasa_musculo_semanal
            
            # Rango: ±10% de variación aceptable
            analisis_completo["tasas_esperadas"] = {
                "peso_min_semanal": round(tasa_peso_semanal * 0.9, 3),
                "peso_max_semanal": round(tasa_peso_semanal * 1.1, 3),
                "grasa_semanal": round(tasa_grasa_semanal, 3),
                "musculo_semanal": round(tasa_musculo_semanal, 3),
                "porcentaje_peso_min": f"{round((tasa_peso_semanal * 0.9 / peso_actual) * 100, 2)}%",
                "porcentaje_peso_max": f"{round((tasa_peso_semanal * 1.1 / peso_actual) * 100, 2)}%",
                "fase": "definicion",
                "fatrate_planner": round(fatrate_planner, 3),
                "dias_estimados": round((peso_graso_actual - peso_graso_objetivo) / fatrate_planner * 7, 0) if peso_graso_objetivo else None
            }
            
        elif fase_actual == "Volumen (Ganancia muscular)":
            # En volumen: ganancia de músculo según fórmula
            tasa_musculo_semanal = leanrate_planner
            # Aumento conservador de grasa (máximo 50% de la ganancia muscular)
            tasa_grasa_semanal = leanrate_planner * 0.5
            tasa_peso_semanal = tasa_musculo_semanal + tasa_grasa_semanal
            
            # Ajuste según sexo (las mujeres ganan músculo más lento)
            if sexo == "F":
                tasa_musculo_semanal = tasa_musculo_semanal * 0.5
                tasa_peso_semanal = tasa_musculo_semanal + tasa_grasa_semanal
            
            analisis_completo["tasas_esperadas"] = {
                "peso_min_semanal": round(tasa_peso_semanal * 0.8, 3),
                "peso_max_semanal": round(tasa_peso_semanal * 1.2, 3),
                "grasa_semanal": round(tasa_grasa_semanal, 3),
                "musculo_semanal": round(tasa_musculo_semanal, 3),
                "porcentaje_peso_min": f"{round((tasa_peso_semanal * 0.8 / peso_actual) * 100, 2)}%",
                "porcentaje_peso_max": f"{round((tasa_peso_semanal * 1.2 / peso_actual) * 100, 2)}%",
                "fase": "volumen",
                "leanrate_planner": round(leanrate_planner, 3),
                "dias_estimados": round((peso_magro_objetivo - peso_magro_actual) / leanrate_planner * 7, 0) if peso_magro_objetivo else None
            }
            
        else:
            # Mantenimiento o Transición
            analisis_completo["tasas_esperadas"] = {
                "peso_min_semanal": -0.1,
                "peso_max_semanal": 0.1,
                "grasa_semanal": 0.0,
                "musculo_semanal": 0.0,
                "porcentaje_peso_min": "-0.1%",
                "porcentaje_peso_max": "0.1%",
                "fase": "mantenimiento",
                "fatrate_planner": round(fatrate_planner, 3),
                "leanrate_planner": round(leanrate_planner, 3)
            }
    
    # 6. TASAS ACTUALES (DESDE LA FECHA DEL PLAN NUTRICIONAL)
    # El Plan Nutricional es el punto de referencia fijo (macros/estrategia)
    # El Plan Alimentario (recetas) es mutable y puede cambiar sin afectar las tasas
    if analisis_completo["plan_nutricional"].get("fecha_creacion") and analisis_completo["plan_nutricional"].get("dias_desde_creacion") is not None:
        fecha_plan = analisis_completo["plan_nutricional"]["fecha_creacion"]
        dias_desde_plan = analisis_completo["plan_nutricional"]["dias_desde_creacion"]
        
        # Filtrar registros desde la fecha del plan
        try:
            fecha_plan_obj = datetime.fromisoformat(fecha_plan.replace(' ', 'T'))
        except:
            fecha_plan_obj = None
        
        if fecha_plan_obj and dinamicodata:
            # 1. Encontrar registro baseline (más cercano ANTES o IGUAL a fecha del plan)
            baseline_registro = None
            registros_posteriores = []
            
            for row in dinamicodata:
                try:
                    fecha_registro_str = row[2]  # Columna FECHA_REGISTRO
                    if isinstance(fecha_registro_str, str):
                        fecha_registro = datetime.fromisoformat(fecha_registro_str.replace(' ', 'T'))
                    else:
                        fecha_registro = fecha_registro_str
                    
                    registro_data = {
                        "date": fecha_registro,
                        "fat_mass": float(row[10]) if row[10] else None,
                        "lean_mass": float(row[11]) if row[11] else None,
                        "weight": float(row[6]) if row[6] else None
                    }
                    
                    # Baseline: el más cercano antes o igual a fecha_plan
                    if fecha_registro <= fecha_plan_obj:
                        if baseline_registro is None or fecha_registro > baseline_registro["date"]:
                            baseline_registro = registro_data
                    
                    # Registros posteriores al plan (para contar pesajes)
                    if fecha_registro > fecha_plan_obj:
                        registros_posteriores.append(registro_data)
                        
                except:
                    continue
            
            # Calcular tasas si hay baseline + al menos 1 registro posterior
            if baseline_registro and len(registros_posteriores) >= 1:
                # Comparar: último registro posterior vs baseline
                last_entry = registros_posteriores[-1]
                delta_days = (last_entry["date"] - baseline_registro["date"]).days
                
                if delta_days > 0:
                    fat_rate_plan = (last_entry["fat_mass"] - baseline_registro["fat_mass"]) / delta_days * 7
                    lean_rate_plan = (last_entry["lean_mass"] - baseline_registro["lean_mass"]) / delta_days * 7
                    peso_rate_plan = (last_entry["weight"] - baseline_registro["weight"]) / delta_days * 7
                    
                    # Determinar confiabilidad: 7+ días Y 3+ registros posteriores (sin contar baseline)
                    total_pesajes = len(registros_posteriores) + 1  # +1 por el baseline
                    datos_suficientes = delta_days >= 7 and len(registros_posteriores) >= 3
                    
                    # Preparar lista de pesajes para mostrar en el frontend
                    pesajes_detallados = []
                    
                    # Agregar baseline
                    pesajes_detallados.append({
                        "fecha": baseline_registro["date"].strftime("%Y-%m-%d"),
                        "peso": round(baseline_registro["weight"], 2),
                        "masa_grasa": round(baseline_registro["fat_mass"], 2),
                        "masa_magra": round(baseline_registro["lean_mass"], 2),
                        "tipo": "baseline",
                        "es_baseline": True
                    })
                    
                    # Agregar posteriores
                    for reg in registros_posteriores:
                        pesajes_detallados.append({
                            "fecha": reg["date"].strftime("%Y-%m-%d"),
                            "peso": round(reg["weight"], 2),
                            "masa_grasa": round(reg["fat_mass"], 2),
                            "masa_magra": round(reg["lean_mass"], 2),
                            "tipo": "posterior",
                            "es_ultimo": (reg == last_entry)
                        })
                    
                    analisis_completo["tasas_actuales"] = {
                        "desde_plan": {
                            "fat_rate": round(fat_rate_plan, 3),
                            "lean_rate": round(lean_rate_plan, 3),
                            "peso_rate": round(peso_rate_plan, 3),
                            "pesajes": total_pesajes,
                            "dias_transcurridos": delta_days,
                            "datos_suficientes": datos_suficientes,
                            "mensaje": "Datos confiables" if datos_suficientes else f"PRELIMINAR - Faltan {max(0, 7 - delta_days)} días y {max(0, 3 - len(registros_posteriores))} pesajes más",
                            "extrapolado": not datos_suficientes,
                            "cv": None,
                            "fecha_baseline": baseline_registro["date"].strftime("%Y-%m-%d"),
                            "fecha_ultimo": last_entry["date"].strftime("%Y-%m-%d"),
                            "pesajes_detallados": pesajes_detallados
                        }
                    }
                else:
                    analisis_completo["tasas_actuales"] = {
                        "desde_plan": {
                            "fat_rate": None,
                            "lean_rate": None,
                            "peso_rate": None,
                            "pesajes": len(registros_posteriores) + 1,
                            "datos_suficientes": False,
                            "mensaje": "El baseline y el último pesaje son del mismo día",
                            "cv": None
                        }
                    }
            else:
                # No hay baseline o no hay registros posteriores
                total = (1 if baseline_registro else 0) + len(registros_posteriores)
                analisis_completo["tasas_actuales"] = {
                    "desde_plan": {
                        "fat_rate": None,
                        "lean_rate": None,
                        "peso_rate": None,
                        "pesajes": total,
                        "datos_suficientes": False,
                        "mensaje": f"Necesitas baseline + al menos 1 pesaje posterior. Tienes: baseline={'Sí' if baseline_registro else 'No'}, posteriores={len(registros_posteriores)}",
                        "cv": None
                    }
                }
        else:
            analisis_completo["tasas_actuales"] = {"desde_plan": {"datos_suficientes": False, "mensaje": "Error procesando fechas", "cv": None}}
    else:
        # Fallback: usar métricas del performance clock
        metricas_mes = performance_clock["all"]["timeframes"]["month"]
        
        analisis_completo["tasas_actuales"] = {
            "desde_plan": {
                "fat_rate": metricas_mes.get("fat_rate"),
                "lean_rate": metricas_mes.get("lean_rate"),
                "peso_rate": (metricas_mes.get("fat_rate", 0) or 0) + (metricas_mes.get("lean_rate", 0) or 0),
                "pesajes": metricas_mes["confidence"]["count"],
                "datos_suficientes": metricas_mes["confidence"]["count"] >= 4,
                "mensaje": "Sin fecha de plan - usando último mes",
                "cv": metricas_mes["confidence"]["cv"]
            }
        }
    
    # 7. COMPARACIÓN CON OBJETIVOS (usar datos desde el plan)
    if dinamicodata and objetivodata:
        metricas_confiables = analisis_completo["tasas_actuales"].get("desde_plan", {})
        
        if metricas_confiables.get("fat_rate") is not None and metricas_confiables.get("lean_rate") is not None:
            analisis_completo["comparacion_periodos"] = {
                "periodo_usado": "desde_plan",
                "pesajes_periodo": metricas_confiables.get("pesajes", 0),
                "dias_transcurridos": metricas_confiables.get("dias_transcurridos", 0),
                "fat_rate_actual": round(metricas_confiables["fat_rate"], 3),
                "lean_rate_actual": round(metricas_confiables["lean_rate"], 3),
                "peso_rate_actual": round(metricas_confiables["peso_rate"], 3),
                "tiene_datos_suficientes": metricas_confiables.get("datos_suficientes", False),
                "extrapolado": metricas_confiables.get("extrapolado", False),
                "mensaje_confiabilidad": metricas_confiables.get("mensaje", "")
            }
            
            # Comparar con expectativas
            if "tasas_esperadas" in analisis_completo and analisis_completo["tasas_esperadas"]:
                esperadas = analisis_completo["tasas_esperadas"]
                actuales = metricas_confiables
                
                # Determinar si está dentro del rango esperado
                peso_en_rango = (esperadas["peso_min_semanal"] <= actuales["peso_rate"] <= esperadas["peso_max_semanal"])
                
                analisis_completo["comparacion_periodos"]["evaluacion"] = {
                    "peso_en_rango": peso_en_rango,
                    "diferencia_peso_vs_ideal": round(actuales["peso_rate"] - ((esperadas["peso_min_semanal"] + esperadas["peso_max_semanal"]) / 2), 3),
                    "diferencia_grasa_vs_ideal": round(actuales["fat_rate"] - esperadas["grasa_semanal"], 3),
                    "diferencia_musculo_vs_ideal": round(actuales["lean_rate"] - esperadas["musculo_semanal"], 3)
                }
        else:
            analisis_completo["comparacion_periodos"]["tiene_datos_suficientes"] = False
    
    # 8. DIAGNÓSTICO PRELIMINAR
    if "comparacion_periodos" in analisis_completo and analisis_completo["comparacion_periodos"].get("tiene_datos_suficientes"):
        comp = analisis_completo["comparacion_periodos"]
        
        diagnostico = {
            "alertas": [],
            "estado_general": "normal"
        }
        
        # En definición (se espera pérdida de peso negativa)
        if analisis_completo.get("tasas_esperadas", {}).get("fase") == "definicion":
            peso_esperado_min = analisis_completo["tasas_esperadas"]["peso_min_semanal"]  # Ej: -0.882
            peso_esperado_max = analisis_completo["tasas_esperadas"]["peso_max_semanal"]  # Ej: -0.721
            
            # Si está ganando peso cuando debería perder
            if comp["peso_rate_actual"] > 0:
                diagnostico["alertas"].append("⚠️ GANANDO PESO - Deberías estar perdiendo. Reducir calorías")
                diagnostico["estado_general"] = "alerta_alta"
            # Si pierde muy poco (cercano a 0)
            elif comp["peso_rate_actual"] > peso_esperado_max * 0.5:  # Ej: > -0.36
                diagnostico["alertas"].append("Pérdida de peso muy lenta - Reducir calorías un 10-15%")
                diagnostico["estado_general"] = "alerta_media"
            # Si pierde demasiado rápido
            elif comp["peso_rate_actual"] < peso_esperado_min * 1.3:  # Ej: < -1.15
                diagnostico["alertas"].append("Pérdida de peso excesiva - Riesgo de pérdida muscular. Aumentar calorías")
                diagnostico["estado_general"] = "alerta_alta"
            
            # Pérdida de masa magra
            if comp["lean_rate_actual"] < -0.1:
                diagnostico["alertas"].append("CRÍTICO: Pérdida de masa magra detectada (-0.1 kg/sem). Aumentar proteína y calorías")
                diagnostico["estado_general"] = "alerta_alta"
            
            # Ganancia de grasa en definición
            if comp["fat_rate_actual"] > 0:
                diagnostico["alertas"].append("Ganando grasa en definición - Reducir calorías inmediatamente")
                diagnostico["estado_general"] = "alerta_alta"
        
        # En volumen
        elif analisis_completo.get("tasas_esperadas", {}).get("fase") == "volumen":
            peso_esperado_min = analisis_completo["tasas_esperadas"]["peso_min_semanal"]
            peso_esperado_max = analisis_completo["tasas_esperadas"]["peso_max_semanal"]
            
            # Si está PERDIENDO peso cuando debería ganar
            if comp["peso_rate_actual"] < 0:
                diagnostico["alertas"].append("⚠️ PERDIENDO PESO - Deberías estar ganando. Aumentar calorías")
                diagnostico["estado_general"] = "alerta_alta"
            # Si gana muy poco (cercano a 0)
            elif comp["peso_rate_actual"] < peso_esperado_min * 0.5:
                diagnostico["alertas"].append("Ganancia muscular lenta - Considerar aumentar calorías")
                diagnostico["estado_general"] = "alerta_media"
            # Si gana demasiado rápido (superávit excesivo)
            elif comp["peso_rate_actual"] > peso_esperado_max * 1.3:
                diagnostico["alertas"].append("Ganancia de peso excesiva - Riesgo de acumulación de grasa. Reducir calorías")
                diagnostico["estado_general"] = "alerta_alta"
            
            # Pérdida de masa magra en volumen (CRÍTICO)
            if comp["lean_rate_actual"] < 0:
                diagnostico["alertas"].append("CRÍTICO: Perdiendo masa magra en volumen. Aumentar calorías y proteína")
                diagnostico["estado_general"] = "alerta_alta"
            
            # Ganancia de grasa excede ganancia muscular
            if comp["fat_rate_actual"] > comp["lean_rate_actual"]:
                diagnostico["alertas"].append("Ganancia de grasa excede ganancia muscular")
                diagnostico["estado_general"] = "alerta_media"
        
        if not diagnostico["alertas"]:
            diagnostico["alertas"].append("Progreso dentro del rango esperado")
            diagnostico["estado_general"] = "optimo"
        
        analisis_completo["diagnostico"] = diagnostico
    
    analisis_completo["tiene_datos"] = True
    
    # Cerrar la base de datos después de leer todo
    basededatos.close()

    return render_template('dashboard.html', dieta=dietadata, dinamico=dinamicodata, estatico=estaticodata, objetivo=objetivodata, title='Vista Principal', username=session['username'], agua=agua, abdomen=abdomen, abdcatrisk=abdcatrisk, bodyscore=bodyscore, categoria=categoria, habitperformance=habitperformance, deltapeso=deltapeso, deltapg=deltapg, deltapm=deltapm, ffmi=ffmi, imc=imc, bf=bf, deltaimc=deltaimc, listaimc=listaimc, deltaffmi=deltaffmi, listaffmi=listaffmi, deltabf=deltabf, listabf=listabf, bfcat=bfcat, immccat=immccat, imccat=imccat, solver_category=solver_category, training_plan=training_plan, performance_clock=performance_clock, fatrate_target=fatrate_target, leanrate_target=leanrate_target, analisis_completo=analisis_completo, is_admin=is_admin, lista_pacientes=lista_pacientes, paciente_seleccionado=paciente_seleccionado)

### FUNCIÓN DE MANTENIMIENTO ###

@app.route('/mantenimiento')
def mantenimiento():
    return render_template('mantenimiento.html', title='Mantenimiento')

### FUNCIÓN DEL ESTANDAR DE FUERZA ###

@app.route('/strengthstandard')
def strengthstandard():
    update_form = forms.UpdateForm(request.form)
    return render_template('strength.html', title='Strength Standard', form=update_form, username=session['username'], value=0)

# Endpoint API para obtener ejercicios de un usuario
@app.route('/api/user-exercises/<user_name>')
def get_user_exercises(user_name):
    """Obtiene los ejercicios actuales y datos personales de un usuario para el strength standard."""
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    
    try:
        # Obtener el DNI del usuario por su nombre
        basededatos = sqlite3.connect("src/Basededatos")
        cursor = basededatos.cursor()
        
        # Verificar estructura de la tabla
        cursor.execute("PRAGMA table_info(PERFILESTATICO)")
        columns = cursor.fetchall()
        
        if not columns:
            return jsonify({'error': 'Tabla PERFILESTATICO no existe'}), 500
        
        # Verificar si existen las columnas necesarias
        column_names = [col[1] for col in columns]
        
        # Obtener datos del perfil estático usando índices directos para evitar problemas con nombres
        try:
            cursor.execute("SELECT * FROM PERFILESTATICO WHERE NOMBRE_APELLIDO = ?", (user_name,))
            user_record = cursor.fetchone()
            
            if not user_record:
                return jsonify({'exercises': [], 'user_name': user_name})
            
            # Usar índices directos según PRAGMA table_info: DNI(1), SEXO(4), FECHA_NACIMIENTO(5) 
            user_dni, sexo, fecha_nacimiento = user_record[1], user_record[4], user_record[5]
            
        except Exception as e:
            return jsonify({'error': f'Error en consulta SQL: {str(e)}'}), 500
        
        # Calcular edad si hay fecha de nacimiento
        edad = None
        if fecha_nacimiento:
            try:
                from datetime import datetime
                nacimiento = datetime.strptime(fecha_nacimiento, '%Y-%m-%d')
                hoy = datetime.now()
                edad = hoy.year - nacimiento.year - ((hoy.month, hoy.day) < (nacimiento.month, nacimiento.day))
            except:
                edad = None
        
        # Obtener último peso corporal del perfil dinámico
        # PERFILDINAMICO usa NOMBRE_APELLIDO, no DNI
        cursor.execute("""
            SELECT PESO FROM PERFILDINAMICO 
            WHERE NOMBRE_APELLIDO = ? 
            ORDER BY FECHA_REGISTRO DESC 
            LIMIT 1
        """, (user_name,))
        
        peso_record = cursor.fetchone()
        peso_corporal = peso_record[0] if peso_record else None
        
        # Verificar estructura de tabla ESTADO_EJERCICIO_USUARIO
        cursor.execute("PRAGMA table_info(ESTADO_EJERCICIO_USUARIO)")
        ejercicio_columns = cursor.fetchall()
        
        # Obtener ejercicios actuales del usuario usando columnas correctas
        # Usar current_columna que es la columna de repeticiones actuales
        cursor.execute("""
            SELECT ejercicio_nombre, current_peso, current_columna, lastre_adicional
            FROM ESTADO_EJERCICIO_USUARIO 
            WHERE user_id = ?
        """, (user_dni,))
        
        exercises = []
        ejercicios_peso_corporal = ['dip', 'chinup', 'pullup']
        for row in cursor.fetchall():
            ejercicio_nombre = row[0]
            current_peso = row[1]
            current_columna = row[2]
            lastre_adicional = row[3] if len(row) > 3 else 0
            
            # Para ejercicios de peso corporal, usar peso corporal + lastre
            if ejercicio_nombre.lower() in ejercicios_peso_corporal:
                weight_final = current_peso + lastre_adicional
            else:
                weight_final = current_peso
                
            exercises.append({
                'name': ejercicio_nombre,
                'weight': weight_final,
                'reps': current_columna
            })
        
        # Verificar estructura de tabla FUERZA
        cursor.execute("PRAGMA table_info(FUERZA)")
        fuerza_columns = cursor.fetchall()
        
        # Obtener último bodyweight de la tabla FUERZA para ejercicios de peso corporal
        if fuerza_columns:
            # Usar la columna de fecha correcta (puede ser fecha_registro, fecha, timestamp, etc.)
            fuerza_column_names = [col[1] for col in fuerza_columns]
            date_column = None
            for col in ['fecha', 'fecha_registro', 'timestamp', 'date']:
                if col in fuerza_column_names:
                    date_column = col
                    break
            
            if date_column and 'bodyweight' in fuerza_column_names:
                cursor.execute(f"""
                    SELECT bodyweight FROM FUERZA 
                    WHERE user_id = ? 
                    ORDER BY {date_column} DESC 
                    LIMIT 1
                """, (user_dni,))
                bodyweight_record = cursor.fetchone()
            else:
                # Si no hay columna de fecha, obtener cualquier registro
                cursor.execute("SELECT bodyweight FROM FUERZA WHERE user_id = ? LIMIT 1", (user_dni,))
                bodyweight_record = cursor.fetchone()
        else:
            bodyweight_record = None
        
        bodyweight = bodyweight_record[0] if bodyweight_record else peso_corporal
        
        return jsonify({
            'exercises': exercises,
            'user_name': user_name,
            'user_dni': user_dni,
            'sexo': sexo,
            'edad': edad,
            'peso_corporal': peso_corporal,
            'bodyweight': bodyweight  # Para comparar con ejercicios de peso corporal
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoints requeridos por SymmetricStrength para inicializar correctamente
@app.route('/api/lifts', methods=['GET', 'POST'])
def api_lifts():
    """Endpoint para compatibilidad con SymmetricStrength - devuelve datos vacíos"""
    return jsonify({})

@app.route('/api/lifts/<username>', methods=['GET'])
def api_lifts_user(username):
    """Endpoint para compatibilidad con SymmetricStrength - devuelve datos vacíos"""
    return jsonify({})

@app.route('/api/past_lifts', methods=['GET'])
def api_past_lifts():
    """Endpoint para compatibilidad con SymmetricStrength - devuelve datos vacíos"""
    return jsonify([])

@app.route('/api/past_lifts/<username>', methods=['GET'])
def api_past_lifts_user(username):
    """Endpoint para compatibilidad con SymmetricStrength - devuelve datos vacíos"""
    return jsonify([])

# Crear la tabla de análisis de fuerza detallado si no existe
functions.crear_tabla_analisis_fuerza_detallado()

# Inicializar nuevas tablas para funcionalidades extendidas
functions.inicializar_nuevas_tablas()

@app.route('/api/submit-strength-results', methods=['POST'])
@csrf.exempt
def submit_strength_results():
    data = request.get_json()
    fecha_actual = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    usuario = session.get('username', 'Usuario no autenticado')
    # Log a snippet of the received data for debugging
    print(f"[{fecha_actual}] Usuario: {usuario} - Datos recibidos en /api/submit-strength-results: {str(data)[:500]}...")

    if not data:
        return jsonify({"error": "No se recibieron datos válidos"}), 400

    raw_data = data.get('rawData')
    # 'calculatedData' is sent by frontend; 'results' is also there and seems to be the same.
    # Prefer 'calculatedData' if present, else 'results'.
    calculated_data = data.get('calculatedData')
    if not calculated_data:
        calculated_data = data.get('results') # Fallback if 'calculatedData' key is missing

    body_svg = data.get('bodySvg') # Check if bodySvg is part of the main POST

    # Get selected patient and custom analysis date from the request
    selected_patient_name = data.get('selectedPatient')
    custom_analysis_date_str = data.get('customAnalysisDate')

    if raw_data and calculated_data:
        if body_svg: # If bodySvg was part of this request's data
            # Ensure calculated_data is a dict before trying to add bodySvg to it
            if isinstance(calculated_data, dict):
                calculated_data['bodySvg'] = body_svg
            else:
                # Handle case where calculated_data might not be a dict (e.g., if 'results' wasn't a dict)
                print(f"[{fecha_actual}] Usuario: {usuario} - Error: calculated_data no es un diccionario, no se puede añadir bodySvg.")
                # Optionally return an error here or proceed without bodySvg

        # Determine username to save for
        username_to_save_for = usuario # Default to logged-in user
        if selected_patient_name and selected_patient_name.strip():
            # Here, you might want to add validation to ensure the selected_patient_name is valid
            # and that the logged-in user (admin) has permission to save for this patient.
            # For now, we'll assume the name is correct and permissions are handled implicitly.
            username_to_save_for = selected_patient_name
            print(f"[{fecha_actual}] Admin {usuario} guardando datos para el paciente: {username_to_save_for}")

        # Guardamos los datos en la base de datos
        if functions.guardar_historia_levantamiento_completa(calculated_data, raw_data, username_to_save_for, custom_analysis_date_str):
            return jsonify({
                "status": "success",
                "message": "Datos guardados exitosamente",
                "redirect": url_for('dashboard')
            })
        else:
            print(f"[{fecha_actual}] Usuario: {usuario} - Error al llamar a functions.guardar_historia_levantamiento_completa")
            return jsonify({
                "status": "error",
                "message": "Error interno al intentar guardar los datos en la base de datos"
            }), 500
    else:
        missing_parts = []
        if not raw_data:
            missing_parts.append("'rawData'")
        if not calculated_data:
            missing_parts.append("'calculatedData' o 'results'")
        error_message = f"Faltan datos necesarios en la solicitud: {', '.join(missing_parts)}."
        print(f"[{fecha_actual}] Usuario: {usuario} - {error_message}")
        return jsonify({
            "status": "error",
            "message": error_message
        }), 400

@app.route('/strengthdata')
def strengthdata_admin_view():
    """Muestra todos los datos de análisis de fuerza para el administrador."""
    if 'username' not in session:
        flash('Por favor, inicia sesión para acceder a esta página.', 'info')
        return redirect(url_for('login'))
    
    # Aunque before_request maneja la protección, una doble verificación es buena práctica.
    if session['username'] != 'Toffaletti, Diego Alejandro':
        flash('Acceso no autorizado. Esta página es solo para administradores.', 'danger')
        return redirect(url_for('dashboard'))

    try:
        all_strength_records = functions.get_all_strength_data_admin()
        return render_template(
            'strengthdata_admin.html', # Nombre de plantilla actualizado
            title='Base de Datos de Fuerza (Admin)',
            registros=all_strength_records,
            username=session['username']
        )
    except Exception as e:
        app.logger.error(f"Error inesperado en strengthdata_admin_view: {str(e)}", exc_info=True)
        flash(f"Error inesperado al cargar los datos de fuerza. Por favor, contacta al administrador.", "error")
        return render_template('strengthdata_admin.html', registros=[], username=session['username'], title='Error - Base de Datos de Fuerza')

# --- Endpoint autocomplete usuarios fuerza ---
@app.route('/admin/api/buscar_usuarios')
def buscar_usuarios_autocomplete():
    if 'username' not in session or session['username'] != 'Toffaletti, Diego Alejandro':
        return jsonify({'usuarios': []}), 403
    q = request.args.get('q', '').strip().lower()
    if not q or len(q) < 2:
        return jsonify({'usuarios': []})
    try:
        # Buscar usuarios únicos por coincidencia parcial
        import sqlite3
        conn = sqlite3.connect(functions.DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT NOMBRE_APELLIDO FROM PERFILESTATICO WHERE lower(NOMBRE_APELLIDO) LIKE ? ORDER BY NOMBRE_APELLIDO ASC LIMIT 15", (f"%{q}%",))
        results = [row[0] for row in cursor.fetchall()]
        conn.close()
        return jsonify({'usuarios': results})
    except Exception as e:
        print(f"Error en buscar_usuarios_autocomplete: {e}")
        return jsonify({'usuarios': []}), 500

@app.route('/historial-fuerza')
def ver_historial_fuerza():
    """Muestra el historial de análisis de fuerza del usuario actual desde la tabla FUERZA."""
    if 'username' not in session:
        flash('Por favor, inicia sesión para ver tu historial.', 'info')
        return redirect(url_for('login'))

    user_dni = None
    con = None
    try:
        # Obtener DNI del usuario actual
        con = sqlite3.connect(functions.DATABASE_PATH) # Usar DATABASE_PATH de functions
        cur = con.cursor()
        cur.execute("SELECT DNI FROM PERFILESTATICO WHERE NOMBRE_APELLIDO = ?", (session['username'],))
        user_row = cur.fetchone()
        
        if not user_row:
            flash('Usuario no encontrado. No se puede cargar el historial.', 'warning')
            return render_template('historial_fuerza.html', historial=[], username=session['username'], title='Historial de Fuerza')
        
        user_dni = user_row[0]
        
        # Obtener historial usando la nueva función de functions.py
        # El límite por defecto en get_user_strength_history es 10, se puede ajustar si es necesario.
        historial_fuerza = functions.get_user_strength_history(user_dni)
        
        return render_template(
            'historial_fuerza.html', 
            title='Historial de Análisis de Fuerza',
            registros=historial_fuerza, # Cambiado de 'historial' a 'registros' para consistencia con strengthdata_admin.html
            username=session['username']
        )

    except sqlite3.Error as e:
        app.logger.error(f"Error de base de datos en ver_historial_fuerza para {session.get('username')}: {e}", exc_info=True)
        flash('Error al cargar el historial de fuerza. Inténtalo más tarde.', 'danger')
        return render_template('historial_fuerza.html', registros=[], username=session.get('username'), title='Error - Historial de Fuerza')
    except Exception as e:
        app.logger.error(f"Error inesperado en ver_historial_fuerza para {session.get('username')}: {e}", exc_info=True)
        flash('Ocurrió un error inesperado. Inténtalo más tarde.', 'danger')
        return render_template('historial_fuerza.html', registros=[], username=session.get('username'), title='Error - Historial de Fuerza')
    finally:
        if con:
            con.close()

@app.route('/api/lifts', methods=['POST'])
@csrf.exempt
def add_lift():
    data = request.get_json()
    print("Lifts recibidos (datos crudos)")
    if not data:
        return jsonify({"error": "No se recibieron datos válidos"}), 400

    # Guardamos los datos crudos en la sesión
    session['rawData'] = data

    # Intentamos unificar si ya se tiene la parte calculada
    usuario = session.get('username', 'Usuario no autenticado')
    if 'calculatedData' in session and 'rawData' in session:
        # Si tenemos la imagen del cuerpo en la sesión, la incluimos en los datos calculados
        if 'bodySvg' in session:
            session['calculatedData']['bodySvg'] = session['bodySvg']
            
        if functions.guardar_historia_levantamiento_completa(session['calculatedData'], session['rawData'], usuario):
            # Limpiamos los datos de la sesión
            session_keys = ['calculatedData', 'rawData', 'bodySvg']
            for key in session_keys:
                if key in session:
                    session.pop(key)
            
            return jsonify({
                "status": "success", 
                "message": "Datos guardados exitosamente",
                "redirect": url_for('dashboard')
            })
        else:
            return jsonify({"error": "Error al guardar los datos"}), 500
            
    return jsonify({"status": "partial", "message": "Datos crudos recibidos, esperando datos calculados"})

### FUNCION DEL PLANIFICADOR DE ENTRENAMIENTOS ###
@app.route('/trainingplanner', methods=['GET', 'POST'])
def trainingplanner():
    tplanner_form = forms.TplannerForm(request.form)
    if request.method == 'POST':
        datos=[tplanner_form.nameuser.data, tplanner_form.squatscore.data, tplanner_form.floorpullscore.data, tplanner_form.horizontalpressscore.data, tplanner_form.verticalpressscore.data, tplanner_form.pullscore.data, tplanner_form.diasdeentrenamiento.data, tplanner_form.numerodeejercicios.data, ]
        trainfunction.planentrenamientopaso1(datos)
        #success_message = 'Actualizado {} !'.format(tplanner_form.nameuser.data)
        #flash(success_message)
    return render_template('trainingplanner.html', title='Configuración del plan de entrenamiento', form=tplanner_form, username=session['username'])

### FUNCIÓN PARA VER EL ENTRENAMIENTO DEL DÍA ###
@app.route('/entrenamiento_actual', methods=['GET'])
def entrenamiento_actual():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    username = session['username']
    print(f"DIAGNÓSTICO - Nombre de usuario en sesión: '{username}'")
    
    # Obtener el DNI del usuario desde PERFILESTATICO
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    
    # SOLUCIÓN: Para este usuario específico, usar directamente su DNI
    if 'Toffaletti' in username:
        user_id = 37070509
        print(f"Usuario Toffaletti detectado - usando DNI fijo: {user_id}")
    else:
        # Para otros usuarios, buscar normalmente
        cursor.execute('SELECT DNI FROM PERFILESTATICO WHERE NOMBRE_APELLIDO=?', [username])
        result = cursor.fetchone()
        
        if result:
            user_id = result[0]
            print(f"Obteniendo entrenamiento para usuario {username} con DNI: {user_id}")
        else:
            print(f"ADVERTENCIA: No se encontró DNI para {username}")
            # Valor predeterminado en caso de no encontrar
            user_id = 37070509
            print(f"Usando DNI por defecto: {user_id}")
        
    basededatos.close()
    
    # Obtener el entrenamiento del día usando la función de training.py
    entrenamiento = obtener_entrenamiento_del_dia(user_id)
    
    # Obtener datos adicionales del último test para cada ejercicio
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    
    # Obtener matriz de progresión para calcular target reps
    cursor.execute("SELECT matriz_json FROM MATRIZ_ENTRENAMIENTO ORDER BY id DESC LIMIT 1")
    matriz_row = cursor.fetchone()
    matriz = json.loads(matriz_row[0]) if matriz_row else []
    
    # Obtener información del último test de cada ejercicio
    cursor.execute("""
        SELECT ejercicio_nombre, last_test_reps, current_columna, lastre_adicional, current_peso
        FROM ESTADO_EJERCICIO_USUARIO
        WHERE user_id = ?
    """, (user_id,))
    estados_ejercicios = cursor.fetchall()
    basededatos.close()

    # Crear diccionario con información del último test
    ultimo_test_info = {}
    for estado in estados_ejercicios:
        ejercicio_nombre, last_test_reps, current_columna, lastre_adicional, current_peso = estado

        # La meta a superar es directamente el valor de current_columna
        target_reps = current_columna if current_columna else 1

        info_ejercicio = {
            'last_reps': last_test_reps if last_test_reps else 0,
            'target_reps': target_reps if target_reps else 1,
            'current_weight': current_peso if current_peso is not None else 0,
            'is_running': ejercicio_nombre.lower() == 'running'
        }

        if info_ejercicio['is_running']:
            reps_base = info_ejercicio['last_reps'] or info_ejercicio['target_reps'] or 0
            info_ejercicio['last_minutes'] = reps_base * 0.5

        ultimo_test_info[ejercicio_nombre] = info_ejercicio
    
    # Convertimos las líneas de texto a una estructura de datos
    # para poder procesarlas mejor en el template
    if isinstance(entrenamiento, str):
        lineas = entrenamiento.strip().split('\n')
        titulo = lineas[0] if lineas else "No hay entrenamiento programado"
        ejercicios = []
        
        for i in range(1, len(lineas)):
            if lineas[i].strip():
                # Limpiamos los espacios y los caracteres de formato
                ejercicio = lineas[i].strip().replace('  ', '')
                ejercicios.append(ejercicio)
    else:
        titulo = "No hay entrenamiento programado"
        ejercicios = []
    
    return render_template('entrenamiento_actual.html', 
                           title='Entrenamiento del día', 
                           username=username,
                           titulo_entrenamiento=titulo,
                           ejercicios=ejercicios,
                           ultimo_test_info=ultimo_test_info)

### FUNCIÓN PARA REGISTRAR SESIÓN COMPLETADA ###
@app.route('/registrar_sesion', methods=['POST'])
def registrar_sesion():
    if 'username' not in session:
        return jsonify({"success": False, "message": "No has iniciado sesión"}), 401
    
    username = session['username']
    data = request.get_json()
    ejercicios_completados = data.get('ejercicios', [])
    datos_test = data.get('datosTest', {})
    sesiones_completadas_data = data.get('sesionesCompletadas', {})
    
    if not ejercicios_completados:
        return jsonify({"success": False, "message": "No se enviaron ejercicios completados"}), 400
        
    print(f"Datos recibidos - ejercicios: {ejercicios_completados}")
    print(f"Datos de TEST recibidos: {datos_test}")
    print(f"Datos de sesiones completadas: {sesiones_completadas_data}")
    
    try:
        # Obtener el DNI del usuario desde PERFILESTATICO
        basededatos = sqlite3.connect('src/Basededatos')
        cursor = basededatos.cursor()
        
        # Verificar si el usuario existe en PERFILESTATICO
        cursor.execute('SELECT DNI FROM PERFILESTATICO WHERE NOMBRE_APELLIDO=?', [username])
        result = cursor.fetchone()
        
        if not result:
            return jsonify({"success": False, "message": "Usuario no encontrado en PERFILESTATICO"}), 404
        
        user_id = result[0]  # El DNI será usado como user_id
        print(f"Registrando sesión para usuario {username} con DNI: {user_id}")
        basededatos.close()
        
        # Extraer nombres de ejercicios y repeticiones de TEST
        ejercicios_nombres = []
        repeticiones_test = {}
        incrementos_peso = {}
        sesiones_completadas = {}
        sesiones_convertidas_test = {}
        
        for ejercicio_completo in ejercicios_completados:
            # Extraer solo el nombre del ejercicio (antes de los dos puntos)
            if ':' in ejercicio_completo:
                nombre_ejercicio = ejercicio_completo.split(':', 1)[0].strip()
            else:
                nombre_ejercicio = ejercicio_completo.strip()
                
            ejercicios_nombres.append(nombre_ejercicio)
            
            # Si hay datos de TEST para este ejercicio, guardarlos
            if nombre_ejercicio in datos_test:
                test_data = datos_test[nombre_ejercicio] or {}

                if nombre_ejercicio.lower() == 'running':
                    running_test_data = {
                        'velocidadBase': test_data.get('velocidadBase'),
                        'incrementoVelocidad': test_data.get('incrementoVelocidad', 0),
                        'tiempo': test_data.get('tiempo', 0),
                        'convertedToTest': test_data.get('convertedToTest', False)
                    }
                    repeticiones_test[nombre_ejercicio] = running_test_data

                    if running_test_data['convertedToTest']:
                        sesiones_convertidas_test[nombre_ejercicio] = True
                        print(
                            f"Ejercicio {nombre_ejercicio} (running) fue CONVERTIDO A TEST: "
                            f"tiempo={running_test_data['tiempo']} min, incremento velocidad={running_test_data['incrementoVelocidad']} km/h"
                        )
                    else:
                        print(
                            f"Datos TEST running para {nombre_ejercicio}: "
                            f"tiempo={running_test_data['tiempo']} min, incremento velocidad={running_test_data['incrementoVelocidad']} km/h"
                        )
                else:
                    repeticiones = test_data.get('repeticiones', 0)
                    incremento = test_data.get('incrementoPeso', 2.5)

                    repeticiones_test[nombre_ejercicio] = repeticiones
                    incrementos_peso[nombre_ejercicio] = incremento
                    
                    # Verificar si fue convertida a TEST
                    if test_data.get('convertedToTest', False):
                        sesiones_convertidas_test[nombre_ejercicio] = True
                        print(f"Ejercicio {nombre_ejercicio} fue CONVERTIDO A TEST: {repeticiones} reps, incremento {incremento} kg")
                    else:
                        print(f"Datos TEST para {nombre_ejercicio}: {repeticiones} reps, incremento {incremento} kg")
            
            # Verificar si el ejercicio tiene información de completado/no completado
            if nombre_ejercicio in sesiones_completadas_data:
                sesiones_completadas[nombre_ejercicio] = sesiones_completadas_data[nombre_ejercicio]
                print(f"Ejercicio {nombre_ejercicio}: {'Completado' if sesiones_completadas[nombre_ejercicio] else 'No completado'}")
        
        # Registrar la sesión como completada o no completada
        registrar_sesion_completada(user_id, ejercicios_nombres, repeticiones_test, incrementos_peso, sesiones_completadas, sesiones_convertidas_test)
        
        return jsonify({"success": True, "message": "Sesión registrada correctamente"})
        
    except Exception as e:
        app.logger.error(f"Error al registrar sesión: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

### FUNCIÓN PARA AVANZAR AL SIGUIENTE DÍA ###
@app.route('/avanzar_dia', methods=['POST'])
def avanzar_dia():
    if 'username' not in session:
        return jsonify({"success": False, "message": "No has iniciado sesión"}), 401
    
    username = session['username']
    
    try:
        # Obtener el DNI del usuario desde PERFILESTATICO
        basededatos = sqlite3.connect('src/Basededatos')
        cursor = basededatos.cursor()
        
        # Verificar si el usuario existe en PERFILESTATICO
        cursor.execute('SELECT DNI FROM PERFILESTATICO WHERE NOMBRE_APELLIDO=?', [username])
        result = cursor.fetchone()
        
        if not result:
            return jsonify({"success": False, "message": "Usuario no encontrado en PERFILESTATICO"}), 404
        
        user_id = result[0]  # El DNI será usado como user_id
        print(f"Avanzando día para usuario {username} con DNI: {user_id}")
        basededatos.close()
        
        # Avanzar al siguiente día del plan
        resultado = avanzar_dia_plan(user_id)
        
        if resultado:
            return jsonify({"success": True, "message": "Avanzado al siguiente día correctamente"})
        else:
            return jsonify({"success": False, "message": "No hay un plan activo para avanzar"}), 400
        
    except Exception as e:
        app.logger.error(f"Error al avanzar día: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

### FUNCIÓN PARA CREAR PERFILES ESTATICOS ###

@app.route('/create', methods=['GET', 'POST'])
def create():
    create_form = forms.CreateForm(request.form)
    if request.method == 'POST' and create_form.validate():
        perfil = (create_form.nameuser.data, create_form.dni.data, create_form.numtel.data, create_form.email.data, create_form.sexo.data, create_form.fdn.data, create_form.estatura.data, create_form.ccuello.data, create_form.cmuneca.data, create_form.ctobillo.data)
        functions.creadordeperfil(perfil)
    return render_template('create.html', title='Crear perfil', form=create_form, username=session['username'], value=0)

### FUNCIÓN PARA EDITAR PERFILES ESTATICOS ###

@app.route('/editperfilest/<string:DNI>', methods=['GET', 'POST'])
def editperfilest(DNI):
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    cursor.execute('SELECT * FROM PERFILESTATICO WHERE DNI=?', [DNI])
    defaultvalue=cursor.fetchall()[0]
    create_form = forms.CreateForm(request.form)
    if request.method == 'POST' and create_form.validate():
        perfil = (create_form.nameuser.data, create_form.dni.data, create_form.numtel.data, create_form.email.data, create_form.sexo.data, create_form.fdn.data, create_form.estatura.data, create_form.ccuello.data, create_form.cmuneca.data, create_form.ctobillo.data)
        functions.actualizarperfilest(perfil)
        return redirect(url_for('databasemanager'))
    return render_template('create.html', title='Actualizar perfil', form=create_form, username=session['username'], value=defaultvalue)

### FUNCIÓN PARA ELIMINAR PERFILES ESTATICOS ###

@app.route('/delperfilest/<string:DNI>')
def delperfilest(DNI):
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    cursor.execute('SELECT NOMBRE_APELLIDO FROM PERFILESTATICO WHERE DNI=?', [DNI])
    NombreApellido=cursor.fetchone()[0]
    cursor.execute('DELETE FROM PERFILESTATICO WHERE DNI=?', [DNI])
    basededatos.commit()
    message= '{} ha sido eliminado satisfactoriamente.'.format(NombreApellido)
    flash (message)
    return redirect(url_for('databasemanager'))

### FUNCIÓN PARA ACTUALIZAR LOS PERFILES DINAMICOS ###

@app.route('/update', methods=['GET', 'POST'])
def update():
    update_form = forms.UpdateForm(request.form)
    if request.method == 'POST':
        functions.actualizarperfil(update_form.nameuser.data, update_form.fdr.data, update_form.peso.data, update_form.cabd.data, update_form.ccin.data, update_form.ccad.data)
    return render_template('update.html', title='Actualizar perfil', form=update_form, username=session['username'], value=0)

### FUNCIÓN PARA EDITAR LOS PERFILES DINAMICOS ###

@app.route('/editperfildin/<string:ID>', methods=['GET', 'POST'])
def editperfildin(ID):
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    cursor.execute('SELECT * FROM PERFILDINAMICO WHERE ID=?', [ID])
    defaultvalue=cursor.fetchall()[0]
    update_form = forms.UpdateForm(request.form)
    if request.method == 'POST' and update_form.validate():
        perfil = (ID, update_form.nameuser.data, update_form.fdr.data, update_form.peso.data, update_form.cabd.data, update_form.ccin.data, update_form.ccad.data)
        functions.actualizarperfildin(perfil)
        return redirect(url_for('databasemanager'))
    return render_template('update.html', title='Actualizar perfil', form=update_form, username=session['username'], value=defaultvalue)

### FUNCIÓN PARA ELIMINAR PERFILES DINAMICOS ###aa

@app.route('/delperfildin/<string:ID>')
def delperfildin(ID):
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    cursor.execute('SELECT NOMBRE_APELLIDO FROM PERFILDINAMICO WHERE ID=?', [ID])
    NombreApellido=cursor.fetchone()[0]
    cursor.execute('DELETE FROM PERFILDINAMICO WHERE ID=?', [ID])
    basededatos.commit()
    message= '{} ha sido eliminado satisfactoriamente.'.format(NombreApellido)
    flash (message)
    return redirect(url_for('databasemanager'))

### FUNCIÓN PARA CONFIGURAR LAS CALORIAS, EL TAMAÑO DE LAS PORCIONES DE LOS PLANES Y LA LIBERTAD ###

@app.route('/planner', methods=['GET', 'POST'])
def planner():
    planner_form = forms.PlannerForm(request.form)
    if request.method == 'POST':
        # Capturar datos de estrategia del formulario
        estrategia = request.form.get('estrategia', '')
        velocidad_cambio = request.form.get('velocidad_cambio', 0)
        deficit_calorico = request.form.get('deficit_calorico', 0)
        disponibilidad_energetica = request.form.get('disponibilidad_energetica', 0)
        factor_actividad = request.form.get('factor_actividad', 1.55)
        
        # Pasar los valores a la función
        functions.plannutricional(planner_form, estrategia, velocidad_cambio, deficit_calorico, disponibilidad_energetica, factor_actividad)
        success_message = 'Actualizado {} !'.format(planner_form.nameuser.data)
        flash(success_message)
    return render_template('planner_nuevo.html', title='Configuración de plan nutricional', form=planner_form, username=session['username'])

# Endpoint API para obtener plan nutricional automático
@app.route('/api/planner/plan-automatico/<string:nombre_usuario>')
def api_plan_automatico(nombre_usuario):
    """Obtiene el plan nutricional automático calculado para un usuario."""
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    
    # Solo Diego puede ver todos los usuarios, otros solo sus propios datos
    if session['username'] != 'Toffaletti, Diego Alejandro' and session['username'] != nombre_usuario:
        return jsonify({"error": "Acceso denegado"}), 403
    
    try:
        # Obtener factor de actividad del último plan guardado O de query params
        factor_actividad_param = request.args.get('factor_actividad')
        
        if not factor_actividad_param:
            # Si no se especifica, buscar el último factor guardado
            basededatos = sqlite3.connect('src/Basededatos')
            cursor = basededatos.cursor()
            cursor.execute("""
                SELECT FACTOR_ACTIVIDAD 
                FROM DIETA 
                WHERE NOMBRE_APELLIDO = ? AND FACTOR_ACTIVIDAD IS NOT NULL
                ORDER BY FECHA_CREACION DESC LIMIT 1
            """, [nombre_usuario])
            
            factor_guardado = cursor.fetchone()
            basededatos.close()
            
            factor_actividad = float(factor_guardado[0]) if factor_guardado and factor_guardado[0] else 1.55
            print(f"   Factor de actividad cargado: {factor_actividad} ({'guardado' if factor_guardado else 'predeterminado'})")
        else:
            factor_actividad = float(factor_actividad_param)
        
        resultado = functions.calcular_plan_nutricional_automatico(nombre_usuario, factor_actividad)
        
        # Agregar el factor usado en la respuesta
        resultado['factor_actividad_usado'] = factor_actividad
        
        return jsonify(resultado)
    except Exception as e:
        return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500

### FUNCIÓN PARA ELIMINAR DIETAS ###

@app.route('/delplan/<string:ID>')
def delplan(ID):
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    cursor.execute("SELECT NOMBRE_APELLIDO FROM DIETA WHERE ID=?", [ID])
    NombreApellido = cursor.fetchone()[0]
    cursor.execute('DELETE FROM DIETA WHERE ID=?', [ID])
    basededatos.commit()
    message= 'Los objetivos de {} han sido eliminados satisfactoriamente.'.format(NombreApellido)
    flash (message)
    return redirect(url_for('databasemanager'))

### FUNCIÓN PARA EDITAR Y PERSONALIZAR DIETAS ###

@app.route('/editplan/<string:ID>', methods=['GET', 'POST'])
def editplan(ID):
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    cursor.execute("SELECT * FROM DIETA WHERE ID=?", ID)
    datos=cursor.fetchall()[0]
    defaultvalue=datos[1], datos[3], datos[4], datos[5]
    customplanner_form = forms.CustomPlannerForm(request.form)
    if request.method == 'POST':
        print(datos[0])
        print(defaultvalue)
        cursor.execute("UPDATE DIETA SET PROTEINA=?, GRASA=?, CH=? WHERE ID=?", (customplanner_form.prot.data, customplanner_form.grasa.data, customplanner_form.ch.data, datos[0]))
        basededatos.commit()
        message = 'El plan de {} ha sido personalizado correctamente.'.format(datos[1])
        flash (message)
        return redirect(url_for('databasemanager'))
    return render_template('customplan.html', title='Personalizar plan', form=customplanner_form, value=defaultvalue, username=session['username'] )

### FUNCIÓN PARA DETERMINAR UN OBJETIVO ###

@app.route('/goal', methods=['GET', 'POST'])
def goal():
    goal_form = forms.goalForm(request.form)
    if request.method == 'POST':
        functions.goal(goal_form)
    return render_template('goal.html', title='Configuración de objetivos', form=goal_form, username=session['username'])

# Endpoint API para obtener objetivos automáticos
@app.route('/api/goal/objetivos-automaticos/<string:nombre_usuario>')
def api_objetivos_automaticos(nombre_usuario):
    """Obtiene los objetivos automáticos calculados para un usuario."""
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    
    # Solo Diego puede ver todos los usuarios, otros solo sus propios datos
    if session['username'] != 'Toffaletti, Diego Alejandro' and session['username'] != nombre_usuario:
        return jsonify({"error": "Acceso denegado"}), 403
    
    try:
        resultado = functions.calcular_objetivos_automaticos(nombre_usuario)
        return jsonify(resultado)
    except Exception as e:
        return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500

### FUNCIÓN PARA ELIMINAR UN OBJETIVO ###

@app.route('/delgoal/<string:NombreApellido>')
def delgoal(NombreApellido):
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    cursor.execute('DELETE FROM OBJETIVO WHERE NOMBRE_APELLIDO=?', [NombreApellido])
    basededatos.commit()
    message= 'Los objetivos de {} han sido eliminados satisfactoriamente.'.format(NombreApellido)
    flash (message)
    return redirect(url_for('databasemanager'))

### FUNCIÓN PARA CREAR ALIMENTOS ###

@app.route('/createfood', methods=['GET', 'POST'])
def createfood():
    createfood_form = forms.CreatefoodForm(request.form)
    if request.method == 'POST' and createfood_form.validate():
        alimento = (createfood_form.namefood.data, createfood_form.prot.data, createfood_form.fat.data, createfood_form.ch.data, createfood_form.fiber.data, createfood_form.gr1.data, createfood_form.p1.data, createfood_form.gr2.data, createfood_form.p2.data)
        functions.creadordealimento(alimento)
    return render_template('createfood.html', title='Crear Alimento', form=createfood_form, username=session['username'], value=0)

### FUNCIÓN PARA EDITAR ALIMENTOS ###

@app.route('/editfood/<string:ID>', methods=['GET', 'POST'])
def editfood(ID):
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    cursor.execute('SELECT * FROM ALIMENTOS WHERE ID=?', [ID])
    defaultvalue=cursor.fetchall()[0]
    createfood_form = forms.CreatefoodForm(request.form)
    if request.method == 'POST' and createfood_form.validate():
        alimento = (ID, createfood_form.namefood.data, createfood_form.prot.data, createfood_form.fat.data, createfood_form.ch.data, createfood_form.fiber.data, createfood_form.gr1.data, createfood_form.p1.data, createfood_form.gr2.data, createfood_form.p2.data)
        functions.editfood(alimento)
        return redirect(url_for('databasemanager'))
    return render_template('createfood.html', title='Actualizar alimento', form=createfood_form, username=session['username'], value=defaultvalue)

### FUNCIÓN PARA ELIMINAR ALIMENTOS ###

@app.route('/deletefood/<string:ID>')
def delfood(ID):
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    cursor.execute('SELECT Largadescripcion FROM ALIMENTOS WHERE ID=?', [ID])
    namefood=cursor.fetchone()[0]
    cursor.execute('DELETE FROM ALIMENTOS WHERE ID=?', [ID])
    basededatos.commit()
    message= '{} ha sido eliminado satisfactoriamente.'.format(namefood)
    flash (message)
    return redirect(url_for('databasemanager'))
    
### FUNCIÓN PARA CREAR NUEVAS RECETAS ###

@app.route('/recipecreator', methods=['GET', 'POST'])
def recipecreator():
    recipecreator_form = forms.RecipecreateForm(request.form)
    if request.method == 'POST':
        functions.recetario(recipecreator_form)
        success_message = 'La siguiente receta ha sido creada: {} !'.format(
            recipecreator_form.recipename.data)
        flash(success_message)
    return render_template('recipecreator.html', title='Creador de recetas', form=recipecreator_form, username=session['username'])

### FUNCIÓN PARA ELIMINAR RECETAS ###

@app.route('/deleterecipe/<string:ID>')
def deleterecipe(ID):
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    cursor.execute('SELECT NOMBRERECETA FROM RECETAS WHERE ID=?', [ID])
    Nombrereceta=cursor.fetchone()[0]
    cursor.execute('DELETE FROM RECETAS WHERE ID=?', [ID])
    basededatos.commit()
    message= '{} ha sido eliminado satisfactoriamente.'.format(Nombrereceta)
    flash (message)
    return redirect(url_for('databasemanager'))

### FUNCIÓN PARA EXTRAER LAS PRESENTACIONES DE LAS PORCIONES DE LOS ALIMENTOS ###

@app.route('/size/<food>')
def size(food):
    sizes = functions.listadeporciones(food)
    return jsonify({'sizes': sizes})

### FUNCIÓN PARA CALCULAR LAS CANTIDADES DE INGREDIENTES PARA UNA RECETA ESPECIFICA ###

@app.route('/recipe', methods=['GET', 'POST'])
def recipe():
    recipe_form = forms.RecipeForm(request.form)
    nameuser = session['username']
    if request.method == 'POST':
        try:
            functions.recipe(recipe_form, nameuser)
        except:
            message= '{} no tiene una dieta definida.'.format(nameuser)
            flash (message)
    return render_template('recipe.html', title='Tu plan nutricional', form=recipe_form, username=session['username'])

# Endpoint para eliminar registros de fuerza detallados (solo admin)
@app.route('/eliminar_registro_fuerza/<int:id>', methods=['DELETE', 'POST'])
def eliminar_strengthdata_admin(id):
    if 'username' not in session or session['username'] != 'Toffaletti, Diego Alejandro':
        return jsonify({'success': False, 'message': 'Permiso denegado: solo el administrador puede eliminar registros.'}), 403
    try:
        basededatos = sqlite3.connect('src/Basededatos')
        cursor = basededatos.cursor()
        cursor.execute('DELETE FROM FUERZA WHERE id=?', (id,))
        basededatos.commit()
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'message': 'No se encontró el registro para eliminar.'}), 404
        return jsonify({'success': True, 'message': 'Registro eliminado correctamente.'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al eliminar: {str(e)}'}), 500

# Endpoint para optimizar entrenamiento (solo admin)
@app.route('/optimizar_entrenamiento/<int:id>', methods=['POST'])
def optimizar_entrenamiento(id):
    """Recibe datos de un registro de fuerza y los optimiza (solo admin)"""
    if 'username' not in session or session['username'] != 'Toffaletti, Diego Alejandro':
        return jsonify({'success': False, 'error': 'No autorizado'}), 403
    
    try:
        # Recibir los parámetros enviados por el frontend
        data = request.get_json()
        numero_dias = 3  # valor por defecto
        numero_ejercicios = 3  # valor por defecto
        
        running_config = {}

        if data:
            numero_dias = int(data.get('numeroDias', 3))
            numero_ejercicios = int(data.get('numeroEjercicios', 3))
            running_config = data.get('runningConfig', {}) or {}

        incluir_correr = bool(running_config.get('enabled', False))
        dias_correr = running_config.get('days') or []
        velocidad_inicial_correr = float(running_config.get('initialSpeed', 0) or 0)
        minutos_iniciales_correr = float(running_config.get('initialMinutes', 0) or 0)

        # Obtener el user_id del registro de fuerza
        conn_temp = sqlite3.connect(functions.DATABASE_PATH)
        cursor_temp = conn_temp.cursor()
        cursor_temp.execute("SELECT user_id FROM FUERZA WHERE id = ?", (id,))
        user_id_row = cursor_temp.fetchone()
        conn_temp.close()

        if user_id_row and incluir_correr:
            user_id_for_running = user_id_row[0]
            functions.actualizar_estado_running(user_id_for_running, velocidad_inicial_correr, minutos_iniciales_correr)
        
        # Ya no imprimimos los parámetros recibidos
        
        # Verificar que el registro existe en la base de datos
        conn = sqlite3.connect(functions.DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Consulta SQL para obtener los datos de la tabla FUERZA por ID
        query = """
            SELECT 
                id, user_id, categories_results_json, lifts_results_json, lift_fields_json
            FROM FUERZA
            WHERE id = ?
        """
        
        cursor.execute(query, (id,))
        row = cursor.fetchone()
        
        if not row:
            return jsonify({'success': False, 'error': f'No se encontró el registro con ID {id}'}), 404
            
        # Utilizar funciones para decodificar los JSON (ya importadas en functions.py)
        categories_results_json = row['categories_results_json']
        lifts_results_json = row['lifts_results_json']
        lift_fields_json = row['lift_fields_json']
        
        # Ya no imprimimos los datos JSON completos
        pass
        
        # Los parámetros ya han sido procesados arriba
        pass
        
        usuario_id = row['user_id']

        # Recuperar el estado existente de las sesiones de correr (si hubiese)
        existing_running_state = None
        running_days_from_plan = []
        training_conn = None
        try:
            training_conn = obtener_conexion_db()
            training_cursor = training_conn.cursor()
            training_cursor.execute(
                """
                SELECT current_peso, last_test_reps, current_columna
                FROM ESTADO_EJERCICIO_USUARIO
                WHERE user_id = ? AND LOWER(ejercicio_nombre) = 'running'
                """,
                (usuario_id,)
            )
            running_row = training_cursor.fetchone()

            if running_row:
                current_speed = running_row['current_peso'] or 0
                base_reps = running_row['last_test_reps'] or running_row['current_columna'] or 1
                minutes_equivalent = max(0.5, min(5.0, (base_reps or 1) * 0.5))

                existing_running_state = {
                    'speed': float(current_speed) if current_speed is not None else 0.0,
                    'minutes': minutes_equivalent,
                    'reps': int(base_reps) if base_reps else 1
                }

            training_cursor.execute(
                """
                SELECT plan_json
                FROM PLANES_ENTRENAMIENTO
                WHERE user_id = ? AND active = 1
                ORDER BY id DESC
                LIMIT 1
                """,
                (usuario_id,)
            )
            plan_row = training_cursor.fetchone()
            if plan_row and plan_row['plan_json']:
                try:
                    plan_data_running = json.loads(plan_row['plan_json'])
                    for dia_info in plan_data_running.get('dias', []):
                        dia_num = dia_info.get('dia')
                        ejercicios = dia_info.get('ejercicios', [])
                        if dia_num and any(ej.lower() == 'running' for ej in ejercicios):
                            running_days_from_plan.append(int(dia_num))
                except (ValueError, TypeError, json.JSONDecodeError):
                    running_days_from_plan = []

        except sqlite3.Error as e:
            app.logger.warning(f"No se pudo recuperar estado de correr para user_id {usuario_id}: {e}")
        finally:
            if training_conn:
                training_conn.close()

        if existing_running_state:
            if running_days_from_plan and 'days' not in existing_running_state:
                existing_running_state['days'] = running_days_from_plan
        elif running_days_from_plan:
            existing_running_state = {'days': running_days_from_plan}

        # Decodificar los datos JSON
        categories_results = decode_json_data(categories_results_json)
        lifts_results = decode_json_data(lifts_results_json)
        lift_fields = decode_json_data(lift_fields_json)

        # Cerrar la conexión a la base de datos
        conn.close()
        
        # Utilizar los datos reales obtenidos de la base de datos
        
        # Primero procesamos las categorías principales
        # Verificamos que tengamos datos válidos
        if categories_results and isinstance(categories_results, dict):
            # Extraemos los valores de las categorías
            squat_score = float(categories_results.get('squat', 0))
            floor_pull_score = float(categories_results.get('floorPull', 0))
            horizontal_press_score = float(categories_results.get('horizontalPress', 0))
            vertical_press_score = float(categories_results.get('verticalPress', 0))
            pullup_score = float(categories_results.get('pullup', 0))
            
            # Ya no imprimimos los valores de categorías
            pass
            
            # Calcular distribución de entrenamientos por categoría
            # 1. Encontrar el máximo score
            scores = [squat_score, floor_pull_score, horizontal_press_score, vertical_press_score, pullup_score]
            scores_no_cero = [s for s in scores if s > 0]
            max_score = max(scores_no_cero) if scores_no_cero else 1
            
            # 2. Calcular los ratios inversos (max_score / score) - a menor score, mayor ratio
            ratios = []
            for score in scores:
                if score > 0:
                    ratios.append(max_score / score)
                else:
                    ratios.append(0)  # Para evitar división por cero
            
            # 3. Calcular multiplicador para que la suma sea igual a (dias * ejercicios)
            total_sesiones = numero_dias * numero_ejercicios
            suma_ratios = sum(ratios)
            
            if suma_ratios > 0:
                multiplicador = total_sesiones / suma_ratios
            else:
                multiplicador = 0
            
            # 4. Calcular entrenamientos por categoría
            entrenamientos_squat = round(ratios[0] * multiplicador) if ratios[0] > 0 else 0
            entrenamientos_floor_pull = round(ratios[1] * multiplicador) if ratios[1] > 0 else 0
            entrenamientos_horizontal = round(ratios[2] * multiplicador) if ratios[2] > 0 else 0
            entrenamientos_vertical = round(ratios[3] * multiplicador) if ratios[3] > 0 else 0
            entrenamientos_pullup = round(ratios[4] * multiplicador) if ratios[4] > 0 else 0
            
            # Ya no imprimimos los resultados iniciales
            pass
            
            # Preparamos estructura para los porcentajes relativos de categorías
            relative_categories = {
                'squat': {'value': squat_score, 'type': 'neutral'},
                'floorPull': {'value': floor_pull_score, 'type': 'neutral'},
                'horizontalPress': {'value': horizontal_press_score, 'type': 'neutral'},
                'verticalPress': {'value': vertical_press_score, 'type': 'neutral'},
                'pullup': {'value': pullup_score, 'type': 'neutral'}
            }
            
            # Mapeamos los ejercicios a sus categorías
            ejercicios_por_categoria = {
                'squat': ['backSquat', 'frontSquat'],
                'floorPull': ['deadlift', 'sumoDeadlift', 'powerClean'],
                'horizontalPress': ['benchPress', 'inclineBenchPress', 'dip'],
                'verticalPress': ['overheadPress', 'snatchPress', 'pushPress'],
                'pullup': ['pullup', 'chinup', 'pendlayRow']
            }
            
            # Procesamos los ejercicios específicos
            exercise_percentages = {}
            exercise_entrenamientos = {}
            
            if lifts_results and isinstance(lifts_results, dict):
                # Recopilamos los scores de todos los ejercicios disponibles silenciosamente
                scores_ejercicios = {}
                for exercise_name, exercise_data in lifts_results.items():
                    # Verificamos que tenga un userScore y que no sea nulo
                    if exercise_data and 'userScore' in exercise_data and exercise_data['userScore'] is not None:
                        user_score = float(exercise_data['userScore'])
                        scores_ejercicios[exercise_name] = user_score
                        exercise_percentages[exercise_name] = {
                            'value': user_score,
                            'type': 'fortaleza' if user_score > 60 else 'debilidad'
                        }
                
                # Calculamos la distribución de entrenamientos por ejercicio silenciosamente
                
                # Numero de sesiones disponibles por categoría
                sesiones_por_categoria = {
                    'squat': entrenamientos_squat,
                    'floorPull': entrenamientos_floor_pull,
                    'horizontalPress': entrenamientos_horizontal,
                    'verticalPress': entrenamientos_vertical,
                    'pullup': entrenamientos_pullup
                }
                
                # Para cada categoría, distribuimos las sesiones entre sus ejercicios
                for categoria, ejercicios in ejercicios_por_categoria.items():
                    # Filtramos ejercicios disponibles (que tienen score)
                    ejercicios_disponibles = [e for e in ejercicios if e in scores_ejercicios]
                    
                    if not ejercicios_disponibles:
                        continue
                    
                    # Obtenemos el score máximo entre los ejercicios disponibles
                    max_score_ejercicio = max([scores_ejercicios[e] for e in ejercicios_disponibles])
                    
                    # Calculamos ratios inversos y multiplicador
                    ratios_ejercicios = [max_score_ejercicio / scores_ejercicios[e] if scores_ejercicios[e] > 0 else 0 for e in ejercicios_disponibles]
                    suma_ratios = sum(ratios_ejercicios)
                    
                    # Total de sesiones para esta categoría
                    total_sesiones_categoria = sesiones_por_categoria[categoria]
                    
                    # Procesamos la categoría sin imprimir información
                    
                    if suma_ratios > 0:
                        multiplicador = total_sesiones_categoria / suma_ratios
                        
                        # Asignamos sesiones a cada ejercicio
                        sesiones_asignadas = 0
                        
                        for i, ejercicio in enumerate(ejercicios_disponibles):
                            # El último ejercicio toma las sesiones restantes para evitar errores de redondeo
                            if i == len(ejercicios_disponibles) - 1:
                                sesiones = total_sesiones_categoria - sesiones_asignadas
                            else:
                                sesiones = round(ratios_ejercicios[i] * multiplicador)
                                sesiones_asignadas += sesiones
                            
                            exercise_entrenamientos[ejercicio] = sesiones
                    else:
                        # No se pueden distribuir sesiones (suma de ratios = 0)
                        pass
            
                # Validación final: asegurarnos que la suma total sea igual a días * ejercicios
                total_sesiones_ejercicios = sum(exercise_entrenamientos.values())
                
                # Si hay discrepancia, hacemos ajustes según la regla:
                # - Si faltan sesiones: agregar al ejercicio con menor score (más débil)
                # - Si sobran sesiones: quitar al ejercicio con mayor score (más fuerte)
                if total_sesiones_ejercicios != total_sesiones and exercise_entrenamientos:
                    diferencia = total_sesiones - total_sesiones_ejercicios
                    
                    if diferencia > 0:  # Faltan sesiones
                        # Encontramos el ejercicio con el menor score (más débil)
                        ejercicio_menor_score = min([(e, scores_ejercicios.get(e, 100)) for e in exercise_entrenamientos.keys()], key=lambda x: x[1])[0]
                        exercise_entrenamientos[ejercicio_menor_score] += diferencia
                    
                    elif diferencia < 0:  # Sobran sesiones
                        # Encontramos el ejercicio con el mayor score (más fuerte)
                        ejercicio_mayor_score = max([(e, scores_ejercicios.get(e, 0)) for e in exercise_entrenamientos.keys()], key=lambda x: x[1])[0]
                        # Verificar que no quede en negativo
                        ajuste = max(diferencia, -exercise_entrenamientos[ejercicio_mayor_score])
                        exercise_entrenamientos[ejercicio_mayor_score] += ajuste
                
                # Ya no imprimimos la distribución final
                
                # Generar plan de entrenamiento optimizado
                try:
                    from workout_optimizer import optimize_split
                    import pulp
                    
                    # Crear el diccionario de sesiones a partir de la distribución calculada
                    sessions_dict = {}
                    for ejercicio, sesiones in exercise_entrenamientos.items():
                        if sesiones > 0:  # Solo incluimos ejercicios con sesiones asignadas
                            sessions_dict[ejercicio] = sesiones
                    
                    # Ejecutar el optimizador
                    grid, penalty = optimize_split(sessions_dict, days=numero_dias, ex_per_day=numero_ejercicios)

                    print(f"\nPlan generado con penalización: {penalty}")
                    for d in grid:
                        print(f"Día {d+1}: {', '.join(grid[d])}")

                    if incluir_correr:
                        dias_validos_correr = []
                        for dia in dias_correr:
                            try:
                                dia_int = int(dia)
                            except (TypeError, ValueError):
                                continue
                            if 1 <= dia_int <= numero_dias:
                                dias_validos_correr.append(dia_int)

                        if not dias_validos_correr:
                            dias_validos_correr = list(range(1, numero_dias + 1))

                        for dia in dias_validos_correr:
                            dia_idx = dia - 1
                            if dia_idx in grid and 'running' not in grid[dia_idx]:
                                grid[dia_idx].append('running')

                    # Guardar el plan para devolverlo al frontend
                    plan_entrenamiento = {}
                    for d in grid:
                        plan_entrenamiento[f"dia_{d+1}"] = grid[d]
                    
                except ImportError:
                    print("\nNOTA: Para generar un plan óptimo, instala pulp: pip install pulp")
                    plan_entrenamiento = {}
                except Exception as e:
                    print(f"Error al generar plan optimizado: {str(e)}")
                    plan_entrenamiento = {}

        else:
            # Si no hay datos, inicializamos estructuras vacías
            relative_categories = {}
            exercise_percentages = {}
        
        # Preparar los datos para devolver al frontend
        relative_data = {
            'categories': relative_categories,
            'exercises': exercise_percentages
        }
        
        # Preparar resultados de la optimización para el frontend
        optimization_results = {
            'categorias': {
                'squat': entrenamientos_squat,
                'floorPull': entrenamientos_floor_pull,
                'horizontalPress': entrenamientos_horizontal,
                'verticalPress': entrenamientos_vertical,
                'pullup': entrenamientos_pullup
            },
            'ejercicios': exercise_entrenamientos,
            'parametros': {
                'numeroDias': numero_dias,
                'numeroEjercicios': numero_ejercicios,
                'totalSesiones': total_sesiones
            },
            'planEntrenamiento': plan_entrenamiento if 'plan_entrenamiento' in locals() else {}
        }
        
        # Si se generó un plan de entrenamiento, guardarlo en la base de datos de training
        if 'plan_entrenamiento' in locals() and plan_entrenamiento:
            try:
                # Formatear el plan para guardar_plan_optimizado
                # De formato {"dia_1": ["ejercicio1", "ejercicio2"], "dia_2": [...]} 
                # a formato [{"dia": 1, "ejercicios": ["ejercicio1", "ejercicio2"]}, ...]
                plan_formato_dias = []
                for dia_key, ejercicios in plan_entrenamiento.items():
                    num_dia = int(dia_key.split('_')[1])
                    plan_formato_dias.append({"dia": num_dia, "ejercicios": ejercicios})
                
                # Obtener usuario_id del registro de fuerza
                # Usar datos de fuerza actuales como pesos iniciales (desde lift_fields)
                datos_fuerza = {}  # Solo necesitamos weight y reps para cada ejercicio
                if not lift_fields:
                    lift_fields = {}
                for ejercicio, datos in lift_fields.items():
                    datos_fuerza[ejercicio] = {
                        "weight": datos.get("weight", 50),  # Default 50kg si no hay dato
                        "reps": datos.get("reps", 1)     # Default 1 rep si no hay dato
                    }

                if incluir_correr:
                    dias_preconfigurados = running_config.get('days') or []
                    if not dias_preconfigurados:
                        if existing_running_state and existing_running_state.get('days'):
                            dias_preconfigurados = existing_running_state.get('days', [])
                        elif running_days_from_plan:
                            dias_preconfigurados = running_days_from_plan

                    dias_correr = dias_preconfigurados

                    velocidad_base = velocidad_inicial_correr if velocidad_inicial_correr > 0 else None
                    if (velocidad_base is None or velocidad_base <= 0) and existing_running_state:
                        velocidad_base = existing_running_state.get('speed', 0)
                    if velocidad_base is None or velocidad_base <= 0:
                        velocidad_base = 8

                    minutos_base = minutos_iniciales_correr if minutos_iniciales_correr > 0 else None
                    if (minutos_base is None or minutos_base <= 0) and existing_running_state:
                        minutos_base = existing_running_state.get('minutes', 3)
                    if minutos_base is None or minutos_base <= 0:
                        minutos_base = 3
                    minutos_base = max(0.5, min(5, minutos_base))
                    repeticiones_equivalentes = int(round(minutos_base / 0.5))
                    repeticiones_equivalentes = max(1, min(10, repeticiones_equivalentes))

                    datos_fuerza['running'] = {
                        "weight": velocidad_base,
                        "reps": repeticiones_equivalentes,
                        "minutes": minutos_base
                    }

                # Simplificación: todos los ejercicios usan la fila 0 de la matriz
                # En una implementación más sofisticada, podrías asignar filas según el tipo de ejercicio
                asignacion_filas = {}
                todos_ejercicios = set()
                for dia_info in plan_formato_dias:
                    todos_ejercicios.update(dia_info["ejercicios"])
                
                for ejercicio in todos_ejercicios:
                    # Por ahora asignamos fila 0 a todos. Una mejora sería clasificar los ejercicios por tipo
                    # y asignar fila según su categoría (por ejemplo, fuerza pura, hipertrofia, resistencia)
                    asignacion_filas[ejercicio] = 0
                
                # Guardar el plan en la base de datos
                plan_id = guardar_plan_optimizado(usuario_id, plan_formato_dias, datos_fuerza)
                print(f"Plan de entrenamiento guardado con ID: {plan_id}")
                
            except Exception as e:
                app.logger.error(f"Error al guardar el plan optimizado: {str(e)}", exc_info=True)
                # Continuamos aunque falle el guardado para no afectar la respuesta al usuario
        
        # Devolver respuesta de éxito con los datos calculados
        return jsonify({
            'success': True,
            'relativeData': relative_data,
            'optimizationResults': optimization_results
        })
    except Exception as e:
        app.logger.error(f"Error al optimizar entrenamiento para registro {id}: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500

# FUNCIÓN PARA CALCULAR LA DIETA

@app.route('/diet', methods=['GET', 'POST'])
def diet():
    diet_form = forms.DietForm(request.form)
    nameuser = session['username']

    if request.method == 'POST':
        try:
            # Aquí llamas a la función que procesa la información del formulario
            functions.process_diet(diet_form, nameuser)

        except Exception as e:
            # Manejo de excepciones con un mensaje específico
            message = '{} no tiene una dieta definida. Error: {}'.format(nameuser, e)
            flash(message)
    
    return render_template('diet.html', title='Tu plan de dieta', form=diet_form, username=session['username'])

# FUNCIÓN EN DESARROLLO, SUPONGO QUE ES PARA HACER RECETAS PERSONALIZADAS 

@app.route('/cooking')
def cooking():
    labels=["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    return render_template('cooking.html', labels=labels, title='cooking')

### FUNCIÓN PARA LOGUEARSE ###

@app.route('/login', methods=['GET', 'POST'])
def login():
    login_form = forms.LoginForm(request.form)
    if request.method == 'POST' and login_form.validate():
        email = login_form.email.data
        password_form = login_form.password.data # This is actually the DNI
        
        conn = sqlite3.connect('src/Basededatos')
        cursor = conn.cursor()
        # La contraseña es el DNI del usuario.
        cursor.execute("SELECT DNI, NOMBRE_APELLIDO FROM PERFILESTATICO WHERE EMAIL = ?", (email,))
        user_data = cursor.fetchone()
        conn.close()

        if user_data:
            dni, username = user_data
            # La contraseña introducida en el formulario debe coincidir con el DNI.
            if str(dni) == str(password_form):
                session['DNI'] = dni
                session['username'] = username
                flash(f'Bienvenido {username}!')
                return redirect(url_for('dashboard'))
            else:
                flash('Email o contraseña (DNI) incorrectos.', 'danger')
        else:
            flash('Email o contraseña (DNI) incorrectos.', 'danger')
            
    return render_template('login.html', title='Login', form=login_form)

### FUNCIÓN PARA DESLOGUEARSE ###

@app.route('/logout')
def logout():
    session.pop('username', None)
    session.pop('DNI', None)
    flash("Has cerrado sesión.")
    return redirect(url_for('login'))

@app.route('/plan_entrenamiento')
def plan_entrenamiento():
    if 'DNI' not in session:
        return redirect(url_for('login'))
    
    user_id = session['DNI']
    training_plan = functions.get_training_plan(user_id)
    
    # Obtener predicciones de próximos entrenamientos
    predictions = functions.predict_next_workouts(user_id, num_predictions=5)
    
    return render_template('plan_entrenamiento.html', 
                             username=session.get('username'),
                             training_plan=training_plan,
                             predictions=predictions)

### FUNCIÓN PARA MOSTRAR LA BASE DE DATOS COMPLETA ###

@app.route('/databasemanager')
def databasemanager():
    """
    Retrieves data from a SQLite database and renders it in a template.

    Returns:
        Rendered template with the retrieved data and other variables.
    """
    # Connect to the SQLite database
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()

    # Execute SQL queries to retrieve data from the tables
    cursor.execute('SELECT * FROM RECETAS')
    recipedata = cursor.fetchall()

    cursor.execute('SELECT * FROM ALIMENTOS')
    alimentodata = cursor.fetchall()

    cursor.execute('SELECT * FROM DIETA')
    dietadata = cursor.fetchall()

    cursor.execute('SELECT * FROM PERFILDINAMICO ORDER BY FECHA_REGISTRO DESC')
    dinamicodata = cursor.fetchall()

    cursor.execute('SELECT * FROM PERFILESTATICO')
    estaticodata = cursor.fetchall()

    cursor.execute('SELECT * FROM OBJETIVO')
    objetivodata = cursor.fetchall()

    # Render the template with the retrieved data and other variables
    return render_template('databasemanager.html', recipes=recipedata, alimento=alimentodata, dieta=dietadata, dinamico=dinamicodata, estatico=estaticodata, objetivo=objetivodata, title='Administrador de base de datos', username=session['username'])

### FUNCIÓN PARA MOSTRAR LA BASE DE DATOS COMPLETA - VERSIÓN BETA ###

@app.route('/databasemanager-beta')
def databasemanager_beta():
    """
    Versión BETA del administrador de base de datos con funcionalidades avanzadas:
    - Edición inline
    - Búsqueda en tiempo real
    - Exportación CSV
    - Confirmación de eliminación
    - TODAS las tablas de la base de datos
    - Interface moderna mejorada
    
    Returns:
        Rendered template con datos completos de TODAS las tablas
    """
    # Connect to the SQLite database
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()

    # Obtener lista de TODAS las tablas
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    todas_tablas = [row[0] for row in cursor.fetchall()]
    
    # Crear diccionario con datos de todas las tablas
    datos_tablas = {}
    columnas_tablas = {}
    
    for tabla in todas_tablas:
        try:
            # Obtener datos
            if tabla == 'PERFILDINAMICO':
                cursor.execute(f'SELECT * FROM {tabla} ORDER BY FECHA_REGISTRO DESC')
            else:
                cursor.execute(f'SELECT * FROM {tabla}')
            datos_tablas[tabla] = cursor.fetchall()
            
            # Obtener nombres de columnas
            cursor.execute(f'PRAGMA table_info({tabla})')
            columnas_tablas[tabla] = [col[1] for col in cursor.fetchall()]
        except:
            datos_tablas[tabla] = []
            columnas_tablas[tabla] = []
    
    basededatos.close()

    # Obtener tipos de datos de cada columna
    tipos_tablas = {}
    for tabla in todas_tablas:
        try:
            cursor = sqlite3.connect('src/Basededatos').cursor()
            cursor.execute(f'PRAGMA table_info({tabla})')
            tipos_tablas[tabla] = [col[2] for col in cursor.fetchall()]  # col[2] es el tipo
        except:
            tipos_tablas[tabla] = []
    
    # Render the BETA template with ALL tables
    return render_template('databasemanager_beta.html', 
                         todas_tablas=todas_tablas,
                         datos_tablas=datos_tablas,
                         columnas_tablas=columnas_tablas,
                         tipos_tablas=tipos_tablas,
                         title='Administrador de base de datos BETA - TODAS LAS TABLAS', 
                         username=session['username'])

### API PARA AJUSTE DE CALORÍAS DEL PLAN NUTRICIONAL ###

@app.route('/api/plan-nutricional/ajustar-calorias', methods=['POST'])
@csrf.exempt
def ajustar_calorias_plan():
    """
    Ajusta las calorías del plan nutricional activo manteniendo la velocidad objetivo.
    El déficit se mantiene igual. Se recalculan macros usando las fórmulas del planner.
    Solo admin puede ajustar calorías de otros pacientes.
    """
    try:
        data = request.get_json()
        ajuste_calorias = int(data.get('ajuste', 0))  # +100 o +150
        current_user = session.get('username')
        
        if not current_user:
            return jsonify({'success': False, 'message': 'Usuario no autenticado'}), 401
        
        # Verificar si es admin
        is_admin = (current_user == 'Toffaletti, Diego Alejandro')
        
        # Obtener paciente objetivo (puede venir del admin)
        paciente_objetivo = data.get('paciente')
        
        if paciente_objetivo:
            # Si se especifica un paciente, verificar permisos
            if not is_admin:
                return jsonify({'success': False, 'message': 'No autorizado. Solo administradores pueden ajustar calorías de otros pacientes.'}), 403
            username = paciente_objetivo
        else:
            # Si no se especifica, usar el usuario actual
            username = current_user
        
        if ajuste_calorias not in [100, 150, -100, -150]:
            return jsonify({'success': False, 'message': 'Ajuste debe ser ±100 o ±150 kcal'}), 400
        
        print(f"\n{'='*60}")
        print(f"📊 AJUSTE DE CALORÍAS - Usuario: {username}")
        print(f"   Ajuste solicitado: {ajuste_calorias:+d} kcal")
        
        basededatos = sqlite3.connect('src/Basededatos')
        cursor = basededatos.cursor()
        
        # Obtener plan nutricional actual
        cursor.execute("""
            SELECT ID, CALORIAS, VELOCIDAD_CAMBIO, DEFICIT_CALORICO
            FROM DIETA 
            WHERE NOMBRE_APELLIDO = ?
            ORDER BY FECHA_CREACION DESC LIMIT 1
        """, [username])
        
        plan = cursor.fetchone()
        
        if not plan:
            basededatos.close()
            return jsonify({'success': False, 'message': 'No se encontró plan nutricional activo'}), 404
        
        plan_id = plan[0]
        calorias_actuales = float(plan[1])
        velocidad_cambio = float(plan[2]) if plan[2] else None
        deficit_actual = float(plan[3]) if plan[3] else 0
        
        # Obtener masa magra
        cursor.execute("""
            SELECT PESO_MAGRO 
            FROM PERFILDINAMICO 
            WHERE NOMBRE_APELLIDO = ?
            ORDER BY FECHA_REGISTRO DESC LIMIT 1
        """, [username])
        
        masa_magra_row = cursor.fetchone()
        if not masa_magra_row or not masa_magra_row[0]:
            basededatos.close()
            return jsonify({'success': False, 'message': 'No se encontró peso magro'}), 404
            
        pm = float(masa_magra_row[0])
        
        print(f"   Plan ID: {plan_id}")
        print(f"   Calorías actuales: {calorias_actuales} kcal")
        print(f"   Déficit actual: {deficit_actual} kcal (SE MANTIENE)")
        print(f"   Velocidad objetivo: {velocidad_cambio} kg/sem (SE MANTIENE)")
        print(f"   Peso magro: {pm} kg")
        
        # CALCULAR NUEVAS CALORÍAS
        calorias_nuevas = calorias_actuales + ajuste_calorias
        
        # EL DÉFICIT SE MANTIENE IGUAL (misma velocidad objetivo)
        deficit_nuevo = deficit_actual  # SE MANTIENE
        
        # RECALCULAR MACROS CON FÓRMULAS DEL PLANNER (functions.py líneas 1661-1664)
        proteina_nueva = 2.513244 * pm  # Constante basada en peso magro
        grasa_nueva = (calorias_nuevas * 0.3) / 9  # 30% de calorías
        ch_nuevo = (calorias_nuevas - (proteina_nueva * 4) - (grasa_nueva * 9)) / 4  # Resto
        
        # Recalcular Disponibilidad Energética (EA)
        ea_nuevo = calorias_nuevas / pm if pm > 0 else None
        
        print(f"\n   CÁLCULOS CON FÓRMULAS DEL PLANNER:")
        print(f"   Calorías: {calorias_actuales} → {calorias_nuevas} kcal ({ajuste_calorias:+d})")
        print(f"   Déficit: {deficit_actual} kcal (IGUAL - misma velocidad)")
        print(f"   Proteína: 2.513244 × {pm} = {proteina_nueva:.1f}g")
        print(f"   Grasa: ({calorias_nuevas} × 0.3) / 9 = {grasa_nueva:.1f}g")
        print(f"   CH: ({calorias_nuevas} - {proteina_nueva*4:.0f} - {grasa_nueva*9:.0f}) / 4 = {ch_nuevo:.1f}g")
        print(f"   EA: {ea_nuevo:.1f} kcal/kg FFM")
        
        # CALCULAR NUEVO FACTOR DE ACTIVIDAD (Katch-McArdle)
        # Fórmula: TMB = 370 + (9.8 × Peso_Magro_lbs)
        # TDEE = TMB × Factor_Actividad
        # Calorías = TDEE - Déficit
        # Por lo tanto: Factor_Actividad = (Calorías + Déficit) / TMB
        
        peso_magro_lbs = pm * 2.20462  # Convertir kg a lbs
        tmb = 370 + (9.8 * peso_magro_lbs)
        tdee_nuevo = calorias_nuevas + deficit_nuevo  # TDEE = Calorías del plan + Déficit
        factor_actividad_nuevo = tdee_nuevo / tmb if tmb > 0 else 1.55
        
        print(f"\n   CÁLCULO DEL NUEVO FACTOR DE ACTIVIDAD:")
        print(f"   Peso magro: {pm} kg = {peso_magro_lbs:.1f} lbs")
        print(f"   TMB (Katch-McArdle): 370 + (9.8 × {peso_magro_lbs:.1f}) = {tmb:.0f} kcal")
        print(f"   TDEE estimado: {calorias_nuevas:.0f} + {deficit_nuevo:.0f} = {tdee_nuevo:.0f} kcal")
        print(f"   Factor actividad: {tdee_nuevo:.0f} / {tmb:.0f} = {factor_actividad_nuevo:.2f}")
        print(f"   (Anterior era probablemente subestimado)")
        
        # Actualizar plan en la base de datos Y REINICIAR FECHA para nuevo período de medición
        cursor.execute("""
            UPDATE DIETA 
            SET CALORIAS = ?,
                PROTEINA = ?,
                GRASA = ?,
                CH = ?,
                DISPONIBILIDAD_ENERGETICA = ?,
                FACTOR_ACTIVIDAD = ?,
                FECHA_CREACION = datetime('now', 'localtime')
            WHERE ID = ?
        """, [
            round(calorias_nuevas, 0),
            round(proteina_nueva, 1),
            round(grasa_nueva, 1),
            round(ch_nuevo, 1),
            round(ea_nuevo, 1) if ea_nuevo else None,
            round(factor_actividad_nuevo, 2),
            plan_id
        ])
        
        print(f"   🔄 Fecha del plan actualizada (nuevo baseline desde hoy)")
        
        basededatos.commit()
        
        # INVALIDAR CACHÉ DEL PLAN ALIMENTARIO para que se recalcule con nuevas calorías
        print(f"\n   Invalidando caché del plan alimentario...")
        
        # Verificar si la tabla y columna existen
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='PLANES_ALIMENTARIOS'")
        tabla_existe = cursor.fetchone()
        
        if tabla_existe:
            # Verificar columnas disponibles
            cursor.execute("PRAGMA table_info(PLANES_ALIMENTARIOS)")
            columnas_existentes = [col[1] for col in cursor.fetchall()]
            
            # Construir UPDATE dinámicamente según columnas disponibles
            campos_update = []
            valores_update = []
            
            if 'CALCULOS_JSON' in columnas_existentes:
                campos_update.append("CALCULOS_JSON = NULL")
            
            if 'CALORIAS_TOTALES' in columnas_existentes:
                campos_update.append("CALORIAS_TOTALES = ?")
                valores_update.append(round(calorias_nuevas, 0))
            
            if 'FECHA_ACTUALIZACION' in columnas_existentes:
                campos_update.append("FECHA_ACTUALIZACION = datetime('now')")
            
            if campos_update:
                valores_update.append(username)  # Para el WHERE
                query = f"UPDATE PLANES_ALIMENTARIOS SET {', '.join(campos_update)} WHERE NOMBRE_APELLIDO = ? AND ACTIVO = 1"
                cursor.execute(query, valores_update)
                
                rows_updated = cursor.rowcount
                if rows_updated > 0:
                    print(f"   ✅ Caché invalidado ({rows_updated} plan(es) alimentario(s) se recalcularán)")
                else:
                    print(f"   ℹ No hay plan alimentario activo (sin cambios)")
                
                basededatos.commit()
            else:
                print(f"   ⚠ Tabla PLANES_ALIMENTARIOS sin columnas de caché (esquema antiguo)")
        else:
            print(f"   ℹ Tabla PLANES_ALIMENTARIOS no existe (sin cambios)")
        
        basededatos.close()
        
        print(f"\n✅ PLAN ACTUALIZADO EXITOSAMENTE")
        print(f"{'='*60}\n")
        
        return jsonify({
            'success': True,
            'message': f'Plan ajustado: +{ajuste_calorias} kcal',
            'datos_nuevos': {
                'calorias': round(calorias_nuevas, 0),
                'proteina': round(proteina_nueva, 1),
                'grasa': round(grasa_nueva, 1),
                'carbohidratos': round(ch_nuevo, 1),
                'deficit': round(deficit_nuevo, 0),  # IGUAL
                'ea': round(ea_nuevo, 1) if ea_nuevo else None,
                'velocidad_objetivo': velocidad_cambio,  # SE MANTIENE
                'factor_actividad': round(factor_actividad_nuevo, 2),
                'tmb': round(tmb, 0),
                'tdee': round(tdee_nuevo, 0)
            }
        })
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        print(f"{'='*60}\n")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

### API PARA EDICIÓN INLINE EN DATABASE MANAGER BETA ###

@app.route('/api/database/update-cell', methods=['POST'])
@csrf.exempt  # Eximir de CSRF para permitir peticiones AJAX
def update_database_cell():
    """
    Endpoint para actualizar una celda específica de cualquier tabla.
    Usado por el sistema de edición inline del Database Manager BETA.
    Funciona con TODAS las tablas dinámicamente.
    """
    try:
        data = request.get_json()
        print(f"\n{'='*60}")
        print(f"📥 REQUEST RECIBIDO:")
        print(f"   Data completa: {data}")
        
        table_name = data.get('table')
        pk_value = data.get('pk')
        column_index = int(data.get('column'))
        new_value = data.get('value')
        
        print(f"   Tabla: {table_name}")
        print(f"   PK Value: {pk_value}")
        print(f"   Columna: {column_index}")
        print(f"   Nuevo valor: {new_value}")
        print(f"   Tipo valor: {type(new_value)}")
        
        # Conectar a la base de datos
        basededatos = sqlite3.connect('src/Basededatos')
        cursor = basededatos.cursor()
        
        # Obtener información de la tabla
        cursor.execute(f'PRAGMA table_info({table_name})')
        columnas_info = cursor.fetchall()
        
        if column_index >= len(columnas_info):
            basededatos.close()
            return jsonify({'success': False, 'message': 'Índice de columna inválido'}), 400
        
        # Obtener nombres y tipos de columnas
        columnas = [col[1] for col in columnas_info]
        tipos_columnas = [col[2] for col in columnas_info]
        columna_pk = columnas[0]
        columna_actualizar = columnas[column_index]
        tipo_columna = tipos_columnas[column_index]
        
        print(f"   Columna PK: {columna_pk}")
        print(f"   Columna a actualizar: {columna_actualizar}")
        print(f"   Tipo de columna: {tipo_columna}")
        
        # Validar y convertir el tipo de dato
        valor_final = new_value
        try:
            if tipo_columna in ['INTEGER', 'INT']:
                valor_final = int(new_value) if new_value else None
            elif tipo_columna in ['REAL', 'FLOAT', 'DOUBLE']:
                valor_final = float(new_value) if new_value else None
            elif tipo_columna in ['DATETIME', 'DATE', 'TIMESTAMP']:
                # Aceptar múltiples formatos de fecha: pipe, espacio, T
                if new_value:
                    # Normalizar el formato: reemplazar | y T por espacio
                    valor_final = new_value.replace('|', ' ').replace('T', ' ').strip()
                else:
                    valor_final = new_value
        except ValueError as ve:
            basededatos.close()
            error_msg = f'Formato inválido para tipo {tipo_columna}: {str(ve)}'
            print(f"❌ ERROR DE VALIDACIÓN: {error_msg}")
            return jsonify({'success': False, 'message': error_msg}), 400
        
        print(f"   Valor final convertido: {valor_final} (tipo: {type(valor_final)})")
        
        # Actualizar el registro directamente por PK
        query = f"UPDATE {table_name} SET {columna_actualizar} = ? WHERE {columna_pk} = ?"
        print(f"   Query SQL: {query}")
        print(f"   Parámetros: ({valor_final}, {pk_value})")
        
        cursor.execute(query, (valor_final, pk_value))
        rows_affected = cursor.rowcount
        print(f"   Filas afectadas: {rows_affected}")
        
        if rows_affected == 0:
            basededatos.close()
            error_msg = f'No se encontró registro con {columna_pk} = {pk_value}'
            print(f"❌ ERROR: {error_msg}")
            return jsonify({'success': False, 'message': error_msg}), 400
        
        basededatos.commit()
        basededatos.close()
        
        print(f"✅ ACTUALIZACIÓN EXITOSA")
        print(f"{'='*60}\n")
        
        return jsonify({
            'success': True, 
            'message': f'✓ Actualizado: {table_name}.{columna_actualizar}',
            'new_value': str(valor_final)
        })
    
    except sqlite3.Error as e:
        error_msg = f'Error de base de datos: {str(e)}'
        print(f"❌ ERROR SQL: {error_msg}")
        print(f"{'='*60}\n")
        return jsonify({'success': False, 'message': error_msg}), 500
    except Exception as e:
        error_msg = f'Error: {str(e)}'
        print(f"❌ ERROR GENERAL: {error_msg}")
        print(f"{'='*60}\n")
        return jsonify({'success': False, 'message': error_msg}), 500

### FUNCIÓN PARA MOSTRAR PROGRAMAS DE ENTRENAMIENTOS GRATUITOS ###

@app.route('/programas-entrenamientos')
def programas_entrenamientos():
    """
    Muestra la galería de programas de entrenamiento gratuitos disponibles.
    """
    if 'username' in session:
        username = session['username']
    else:
        username = None
    
    # Lista de programas de entrenamiento disponibles
    programas = [
        {
            'id': '30-dias-principiantes',
            'titulo': 'Programa de 30 Días para Principiantes',
            'descripcion': 'Programa de bajo impacto perfecto para quienes comienzan su viaje fitness, adultos mayores, personas con obesidad, o cualquiera con problemas de rodillas o espalda.',
            'duracion': '30 días',
            'nivel': 'Principiante',
            'equipamiento': 'Sin equipamiento (opcional: mancuernas ligeras)',
            'imagen': 'programa-principiantes.jpg'
        },
        {
            'id': '30-dias-forma',
            'titulo': 'Desafío de 30 Días para Ponerse en Forma',
            'descripcion': 'Programa intermedio que combina cardio, kickboxing, entrenamiento de fuerza y MMA para obtener resultados rápidos.',
            'duracion': '30 días (5 semanas)',
            'nivel': 'Principiante a Intermedio',
            'equipamiento': 'Mancuernas ligeras (o botellas de agua)',
            'imagen': 'programa-forma.jpg'
        },
        {
            'id': 'warrior-90',
            'titulo': 'Rutina de Entrenamiento Guerrero 90 Días',
            'descripcion': 'Programa avanzado de 90 días con 30 rutinas diferentes que incluye entrenamiento de fuerza, pliometría, kickboxing, MMA y HIIT.',
            'duracion': '90 días (13 semanas)',
            'nivel': 'Intermedio a Avanzado',
            'equipamiento': 'Mancuernas (10-25lbs hombres, 5-10lbs mujeres)',
            'imagen': 'warrior-90.jpg'
        },
        {
            'id': 'hero-90',
            'titulo': 'Hero 90 - Programa de Alta Intensidad',
            'descripcion': 'El programa de ejercicios de alta intensidad más desafiante de HASfit. Contiene 55+ rutinas separadas de alta intensidad para transformar tu cuerpo.',
            'duracion': '90 días (13 semanas)',
            'nivel': 'Avanzado',
            'equipamiento': 'Mancuernas (10-35lbs hombres, 8-15lbs mujeres)',
            'imagen': 'hero-90.jpg'
        },
        {
            'id': '30-abdominales',
            'titulo': '30 Días para Abdominales Marcados',
            'descripcion': 'Programa intensivo especializado en el desarrollo y definición de los músculos abdominales. Ejercicios progresivos con plan nutricional incluido.',
            'duracion': '30 días (5 semanas)',
            'nivel': 'Intermedio',
            'equipamiento': 'Sin equipamiento necesario',
            'imagen': '30-abdominales.jpg'
        },
        {
            'id': '30-dias-adolescentes',
            'titulo': '30 Días Pérdida de Peso para Adolescentes',
            'descripcion': 'Programa especializado para jóvenes de 13 a 19 años que combina ejercicios divertidos y efectivos para perder peso de manera saludable.',
            'duracion': '30 días (5 semanas)',
            'nivel': 'Principiante a Intermedio',
            'equipamiento': 'Sin equipamiento (opcional: mancuernas ligeras)',
            'imagen': '30-dias-adolescentes.jpg'
        },
        {
            'id': '90-dias-musculo',
            'titulo': '90 Días Construcción de Músculo',
            'descripcion': 'Programa intensivo de 90 días diseñado específicamente para maximizar el crecimiento muscular. Combina hipertrofia, fuerza y técnicas avanzadas de entrenamiento.',
            'duracion': '90 días (13 semanas)',
            'nivel': 'Intermedio a Avanzado',
            'equipamiento': 'Mancuernas y acceso a gimnasio recomendado (opcional: barra)',
            'imagen': '90-dias-musculo.jpg'
        }
    ]
    
    return render_template('programas_entrenamientos.html', 
                         title='Programas de Entrenamientos Gratuitos',
                         username=username, 
                         programas=programas)

@app.route('/programa/<programa_id>')
def programa_detalle(programa_id):
    """
    Muestra el detalle de un programa de entrenamiento específico.
    """
    if 'username' in session:
        username = session['username']
    else:
        username = None
    
    # Si es el programa de 30 días principiantes, mostrar el calendario completo
    if programa_id == '30-dias-principiantes':
        return render_template('programa_30_dias_principiantes.html', 
                             title='Programa de 30 Días para Principiantes',
                             username=username)
    
    # Si es el programa de 30 días para ponerse en forma
    if programa_id == '30-dias-forma':
        return render_template('programa_30_dias_forma.html', 
                             title='Desafío de 30 Días para Ponerse en Forma',
                             username=username)
    
    # Si es el programa Warrior 90 Day Workout
    if programa_id == 'warrior-90':
        return render_template('programa_warrior_90.html', 
                             title='Warrior 90 Day Workout Routine',
                             username=username)
    
    # Si es el programa Hero 90 High Intensity
    if programa_id == 'hero-90':
        return render_template('programa_hero_90.html', 
                             title='Hero 90 - Programa de Alta Intensidad 90 Días',
                             username=username)
    
    # Si es el programa 30 Días para Abdominales Marcados
    if programa_id == '30-abdominales':
        return render_template('programa_30_abdominales.html', 
                             title='30 Días para Abdominales Marcados - Programa Intensivo',
                             username=username)
    
    # Si es el programa 30 Días Pérdida de Peso para Adolescentes
    if programa_id == '30-dias-adolescentes':
        return render_template('programa_30_dias_adolescentes.html', 
                             title='30 Días Pérdida de Peso para Adolescentes',
                             username=username)
    
    # Si es el programa 90 Días Construcción de Músculo
    if programa_id == '90-dias-musculo':
        return render_template('programa_90_dias_musculo.html', 
                             title='90 Días Construcción de Músculo - Programa Intensivo',
                             username=username)
    
    # Si llega aquí, el programa no existe
    flash('Programa no encontrado.')
    return redirect(url_for('programas_entrenamientos'))

@app.route('/plan-alimentario')
def plan_alimentario():
    """
    Página del Plan Alimentario - Nueva funcionalidad en desarrollo
    """
    if 'DNI' not in session:
        return redirect(url_for('login'))
    
    username = session['username']
    return render_template('plan_alimentario.html', 
                         title='Plan Alimentario',
                         username=username)

# APIs para el Plan Alimentario
@app.route('/api/plan-alimentario/info')
def api_plan_alimentario_info():
    """Obtiene información del plan nutricional del usuario leyendo tabla DIETA"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    username = session['username']
    
    # Definición de bloques nutricionales estándar
    BLOQUE_PROTEINA = 20  # gramos
    BLOQUE_GRASA = 10     # gramos
    BLOQUE_CARBOHIDRATOS = 25  # gramos
    
    try:
        basededatos = sqlite3.connect('src/Basededatos')
        cursor = basededatos.cursor()
        
        # Obtener plan nutricional actual con todas las columnas
        cursor.execute('SELECT * FROM DIETA WHERE NOMBRE_APELLIDO=?', [username])
        plan_data = cursor.fetchone()
        
        if not plan_data:
            return jsonify({
                'success': False,
                'error': 'No hay plan nutricional configurado. Por favor configura tu plan primero.'
            })
        
        # Mapear columnas según estructura REAL de tabla DIETA (CORREGIDO)
        # 0=ID, 1=NOMBRE_APELLIDO, 2=CALORIAS, 3=PROTEINA, 4=GRASA, 5=CH
        # 6=DP, 7=DG, 8=DC (Desayuno %)
        # 9=MMP, 10=MMG, 11=MMC (Media Mañana %)  
        # 12=AP, 13=AG, 14=AC (Almuerzo %)
        # 15=MP, 16=MG, 17=MC (Merienda %)
        # 18=MTP, 19=MTG, 20=MTC (Media Tarde %)
        # 21=CP, 22=CG, 23=CC (Cena %)
        # 24=LIBERTAD
        
        plan = {
            'usuario': username,
            'calorias': plan_data[2] if len(plan_data) > 2 else 0,
            'proteina_total': plan_data[3] if len(plan_data) > 3 else 0,
            'grasa_total': plan_data[4] if len(plan_data) > 4 else 0,
            'carbohidratos_total': plan_data[5] if len(plan_data) > 5 else 0,
            'libertad': plan_data[24] if len(plan_data) > 24 else 0
        }
        
        # Obtener totales para calcular gramos por comida
        proteina_total = plan['proteina_total']
        grasa_total = plan['grasa_total']
        carbohidratos_total = plan['carbohidratos_total']
        
        # Función helper para calcular bloques
        def calcular_bloques(gramos, gramos_por_bloque):
            """Calcula bloques con decimales exactos y redondeados a 0.5"""
            if gramos == 0:
                return {
                    'bloques': 0, 
                    'bloques_decimal': 0.0,
                    'bloques_redondeados': 0.0,
                    'gramos_objetivo': 0, 
                    'gramos_originales': 0
                }
            # Bloques exactos (precisión para cálculos internos)
            bloques_decimal = round(gramos / gramos_por_bloque, 2)
            # Bloques redondeados a 0.5 (para UI y constructor)
            bloques_redondeados = functions.redondear_a_medio_bloque(bloques_decimal)
            # Bloques enteros (legacy, mostrar en algunos paneles)
            bloques_entero = max(1, round(bloques_decimal))
            return {
                'bloques': bloques_entero,  # Legacy: para algunos paneles
                'bloques_decimal': bloques_decimal,  # Exacto: para auditoría
                'bloques_redondeados': bloques_redondeados,  # UI: constructor, generador, tabla
                'gramos_objetivo': gramos,  # Gramos reales del plan
                'gramos_originales': gramos
            }
        
        # Definir las comidas en el ORDEN DESEADO
        # Usamos OrderedDict para garantizar el orden en todas las versiones de Python
        from collections import OrderedDict
        comidas = OrderedDict()
        
        # ORDEN FIJO: Desayuno → Media Mañana → Almuerzo → Merienda → Media Tarde → Cena
        
        # 1. Desayuno (DP, DG, DC) - índices corregidos
        dp = plan_data[6] if len(plan_data) > 6 else 0  # DP = Desayuno Proteína %
        dg = plan_data[7] if len(plan_data) > 7 else 0  # DG = Desayuno Grasa %
        dc = plan_data[8] if len(plan_data) > 8 else 0  # DC = Desayuno Carbohidratos %
        if dp > 0 or dg > 0 or dc > 0:
            proteina_gramos = round(proteina_total * dp, 2)
            grasa_gramos = round(grasa_total * dg, 2)
            carbohidratos_gramos = round(carbohidratos_total * dc, 2)
            
            bloques_p = calcular_bloques(proteina_gramos, BLOQUE_PROTEINA)
            bloques_g = calcular_bloques(grasa_gramos, BLOQUE_GRASA)
            bloques_c = calcular_bloques(carbohidratos_gramos, BLOQUE_CARBOHIDRATOS)
            
            comidas['desayuno'] = {
                'activa': True,
                'proteina': proteina_gramos,
                'grasa': grasa_gramos,
                'carbohidratos': carbohidratos_gramos,
                'proteina_pct': dp,
                'grasa_pct': dg,
                'carbohidratos_pct': dc,
                'bloques': {
                    'proteina': bloques_p,
                    'grasa': bloques_g,
                    'carbohidratos': bloques_c,
                    'resumen': f"{bloques_p['bloques']}P · {bloques_g['bloques']}G · {bloques_c['bloques']}C"
                },
                'nombre': 'Desayuno',
                'codigo': 'D',
                'orden': 1
            }
        
        # 2. Media Mañana (MMP, MMG, MMC) - índices corregidos
        mmp = plan_data[9] if len(plan_data) > 9 else 0   # MMP = Media Mañana Proteína %
        mmg = plan_data[10] if len(plan_data) > 10 else 0 # MMG = Media Mañana Grasa %
        mmc = plan_data[11] if len(plan_data) > 11 else 0 # MMC = Media Mañana Carbohidratos %
        if mmp > 0 or mmg > 0 or mmc > 0:
            proteina_gramos = round(proteina_total * mmp, 2)
            grasa_gramos = round(grasa_total * mmg, 2)
            carbohidratos_gramos = round(carbohidratos_total * mmc, 2)
            
            bloques_p = calcular_bloques(proteina_gramos, BLOQUE_PROTEINA)
            bloques_g = calcular_bloques(grasa_gramos, BLOQUE_GRASA)
            bloques_c = calcular_bloques(carbohidratos_gramos, BLOQUE_CARBOHIDRATOS)
            
            comidas['media_manana'] = {
                'activa': True,
                'proteina': proteina_gramos,
                'grasa': grasa_gramos,
                'carbohidratos': carbohidratos_gramos,
                'proteina_pct': mmp,
                'grasa_pct': mmg,
                'carbohidratos_pct': mmc,
                'bloques': {
                    'proteina': bloques_p,
                    'grasa': bloques_g,
                    'carbohidratos': bloques_c,
                    'resumen': f"{bloques_p['bloques']}P · {bloques_g['bloques']}G · {bloques_c['bloques']}C"
                },
                'nombre': 'Media Mañana',
                'codigo': 'MM',
                'orden': 2
            }
        
        # 3. Almuerzo (AP, AG, AC) - índices corregidos
        ap = plan_data[12] if len(plan_data) > 12 else 0  # AP = Almuerzo Proteína %
        ag = plan_data[13] if len(plan_data) > 13 else 0  # AG = Almuerzo Grasa %
        ac = plan_data[14] if len(plan_data) > 14 else 0  # AC = Almuerzo Carbohidratos %
        if ap > 0 or ag > 0 or ac > 0:
            proteina_gramos = round(proteina_total * ap, 2)
            grasa_gramos = round(grasa_total * ag, 2)
            carbohidratos_gramos = round(carbohidratos_total * ac, 2)
            
            bloques_p = calcular_bloques(proteina_gramos, BLOQUE_PROTEINA)
            bloques_g = calcular_bloques(grasa_gramos, BLOQUE_GRASA)
            bloques_c = calcular_bloques(carbohidratos_gramos, BLOQUE_CARBOHIDRATOS)
            
            comidas['almuerzo'] = {
                'activa': True,
                'proteina': proteina_gramos,
                'grasa': grasa_gramos,
                'carbohidratos': carbohidratos_gramos,
                'proteina_pct': ap,
                'grasa_pct': ag,
                'carbohidratos_pct': ac,
                'bloques': {
                    'proteina': bloques_p,
                    'grasa': bloques_g,
                    'carbohidratos': bloques_c,
                    'resumen': f"{bloques_p['bloques']}P · {bloques_g['bloques']}G · {bloques_c['bloques']}C"
                },
                'nombre': 'Almuerzo',
                'codigo': 'A',
                'orden': 3
            }
        
        # 4. Merienda (MP, MG, MC) - índices corregidos
        mp = plan_data[15] if len(plan_data) > 15 else 0  # MP = Merienda Proteína %
        mg = plan_data[16] if len(plan_data) > 16 else 0  # MG = Merienda Grasa %
        mc = plan_data[17] if len(plan_data) > 17 else 0  # MC = Merienda Carbohidratos %
        if mp > 0 or mg > 0 or mc > 0:
            proteina_gramos = round(proteina_total * mp, 2)
            grasa_gramos = round(grasa_total * mg, 2)
            carbohidratos_gramos = round(carbohidratos_total * mc, 2)
            
            bloques_p = calcular_bloques(proteina_gramos, BLOQUE_PROTEINA)
            bloques_g = calcular_bloques(grasa_gramos, BLOQUE_GRASA)
            bloques_c = calcular_bloques(carbohidratos_gramos, BLOQUE_CARBOHIDRATOS)
            
            comidas['merienda'] = {
                'activa': True,
                'proteina': proteina_gramos,
                'grasa': grasa_gramos,
                'carbohidratos': carbohidratos_gramos,
                'proteina_pct': mp,
                'grasa_pct': mg,
                'carbohidratos_pct': mc,
                'bloques': {
                    'proteina': bloques_p,
                    'grasa': bloques_g,
                    'carbohidratos': bloques_c,
                    'resumen': f"{bloques_p['bloques']}P · {bloques_g['bloques']}G · {bloques_c['bloques']}C"
                },
                'nombre': 'Merienda',
                'codigo': 'M',
                'orden': 4
            }
        
        # 5. Media Tarde (MTP, MTG, MTC) - índices corregidos
        mtp = plan_data[18] if len(plan_data) > 18 else 0  # MTP = Media Tarde Proteína %
        mtg = plan_data[19] if len(plan_data) > 19 else 0  # MTG = Media Tarde Grasa %
        mtc = plan_data[20] if len(plan_data) > 20 else 0  # MTC = Media Tarde Carbohidratos %
        if mtp > 0 or mtg > 0 or mtc > 0:
            proteina_gramos = round(proteina_total * mtp, 2)
            grasa_gramos = round(grasa_total * mtg, 2)
            carbohidratos_gramos = round(carbohidratos_total * mtc, 2)
            
            bloques_p = calcular_bloques(proteina_gramos, BLOQUE_PROTEINA)
            bloques_g = calcular_bloques(grasa_gramos, BLOQUE_GRASA)
            bloques_c = calcular_bloques(carbohidratos_gramos, BLOQUE_CARBOHIDRATOS)
            
            comidas['media_tarde'] = {
                'activa': True,
                'proteina': proteina_gramos,
                'grasa': grasa_gramos,
                'carbohidratos': carbohidratos_gramos,
                'proteina_pct': mtp,
                'grasa_pct': mtg,
                'carbohidratos_pct': mtc,
                'bloques': {
                    'proteina': bloques_p,
                    'grasa': bloques_g,
                    'carbohidratos': bloques_c,
                    'resumen': f"{bloques_p['bloques']}P · {bloques_g['bloques']}G · {bloques_c['bloques']}C"
                },
                'nombre': 'Media Tarde',
                'codigo': 'MT',
                'orden': 5
            }
        
        # 6. Cena (CP, CG, CC) - índices corregidos
        cp = plan_data[21] if len(plan_data) > 21 else 0  # CP = Cena Proteína %
        cg = plan_data[22] if len(plan_data) > 22 else 0  # CG = Cena Grasa %
        cc = plan_data[23] if len(plan_data) > 23 else 0  # CC = Cena Carbohidratos %
        if cp > 0 or cg > 0 or cc > 0:
            proteina_gramos = round(proteina_total * cp, 2)
            grasa_gramos = round(grasa_total * cg, 2)
            carbohidratos_gramos = round(carbohidratos_total * cc, 2)
            
            bloques_p = calcular_bloques(proteina_gramos, BLOQUE_PROTEINA)
            bloques_g = calcular_bloques(grasa_gramos, BLOQUE_GRASA)
            bloques_c = calcular_bloques(carbohidratos_gramos, BLOQUE_CARBOHIDRATOS)
            
            comidas['cena'] = {
                'activa': True,
                'proteina': proteina_gramos,
                'grasa': grasa_gramos,
                'carbohidratos': carbohidratos_gramos,
                'proteina_pct': cp,
                'grasa_pct': cg,
                'carbohidratos_pct': cc,
                'bloques': {
                    'proteina': bloques_p,
                    'grasa': bloques_g,
                    'carbohidratos': bloques_c,
                    'resumen': f"{bloques_p['bloques']}P · {bloques_g['bloques']}G · {bloques_c['bloques']}C"
                },
                'nombre': 'Cena',
                'codigo': 'C',
                'orden': 6
            }
        
        plan['comidas_activas'] = len(comidas)
        
        basededatos.close()
        
        return jsonify({
            'success': True,
            'plan': plan,
            'comidas': comidas,
            'bloques_config': {
                'proteina': BLOQUE_PROTEINA,
                'grasa': BLOQUE_GRASA,
                'carbohidratos': BLOQUE_CARBOHIDRATOS,
                'descripcion': f'1P = {BLOQUE_PROTEINA}g | 1G = {BLOQUE_GRASA}g | 1C = {BLOQUE_CARBOHIDRATOS}g'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/plan-alimentario/recetas')
def api_plan_alimentario_recetas():
    """Obtiene todas las recetas disponibles"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    try:
        basededatos = sqlite3.connect('src/Basededatos')
        cursor = basededatos.cursor()
        
        # Obtener todas las recetas usando el mismo campo que /recipe (NOMBRERECETA)
        cursor.execute('SELECT ID, NOMBRERECETA FROM RECETAS ORDER BY NOMBRERECETA ASC')
        recetas_raw = cursor.fetchall()
        
        recetas = []
        for receta in recetas_raw:
            recetas.append({
                'id': receta[0],
                'nombre': receta[1],
                'value': receta[1]  # Para compatibilidad con sistema original
            })
        
        basededatos.close()
        
        return jsonify({
            'success': True,
            'recetas': recetas
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/plan-alimentario/guardar', methods=['POST'])
@csrf.exempt
def api_plan_alimentario_guardar():
    """Guarda el plan alimentario con múltiples recetas por comida"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    data = request.get_json()
    username = session['username']
    user_dni = session['DNI']
    
    try:
        basededatos = sqlite3.connect('src/Basededatos')
        cursor = basededatos.cursor()
        
        # Crear tabla si no existe (versión mejorada)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS PLANES_ALIMENTARIOS (
                ID INTEGER PRIMARY KEY AUTOINCREMENT,
                USER_DNI TEXT NOT NULL,
                NOMBRE_APELLIDO TEXT NOT NULL,
                TIPO_PLAN TEXT NOT NULL,
                FECHA_CREACION DATETIME DEFAULT CURRENT_TIMESTAMP,
                FECHA_ACTUALIZACION DATETIME DEFAULT CURRENT_TIMESTAMP,
                PLAN_JSON TEXT NOT NULL,
                ACTIVO INTEGER DEFAULT 1,
                TOTAL_RECETAS INTEGER DEFAULT 0,
                COMIDAS_CONFIGURADAS INTEGER DEFAULT 0
            )
        ''')
        
        # Verificar y agregar columnas faltantes si la tabla ya existía
        cursor.execute("PRAGMA table_info(PLANES_ALIMENTARIOS)")
        columnas_existentes = [col[1] for col in cursor.fetchall()]
        
        # Agregar TOTAL_RECETAS si no existe
        if 'TOTAL_RECETAS' not in columnas_existentes:
            cursor.execute('ALTER TABLE PLANES_ALIMENTARIOS ADD COLUMN TOTAL_RECETAS INTEGER DEFAULT 0')
        
        # Agregar COMIDAS_CONFIGURADAS si no existe
        if 'COMIDAS_CONFIGURADAS' not in columnas_existentes:
            cursor.execute('ALTER TABLE PLANES_ALIMENTARIOS ADD COLUMN COMIDAS_CONFIGURADAS INTEGER DEFAULT 0')
        
        # Agregar CALCULOS_JSON si no existe (cache de cálculos)
        if 'CALCULOS_JSON' not in columnas_existentes:
            cursor.execute('ALTER TABLE PLANES_ALIMENTARIOS ADD COLUMN CALCULOS_JSON TEXT')
        
        # Desactivar planes anteriores
        cursor.execute('''
            UPDATE PLANES_ALIMENTARIOS 
            SET ACTIVO = 0 
            WHERE USER_DNI = ? AND TIPO_PLAN = ?
        ''', (user_dni, data.get('tipo', 'recetas')))
        
        # Contar recetas y comidas
        total_recetas = 0
        comidas_configuradas = 0
        
        for comida, recetas in data.get('comidas', {}).items():
            if recetas and len(recetas) > 0:
                comidas_configuradas += 1
                total_recetas += len(recetas)
        
        # CALCULAR UNA SOLA VEZ y cachear los resultados
        print(f"Calculando plan con {total_recetas} recetas...")
        
        # Obtener información nutricional del usuario (tabla DIETA)
        cursor.execute('SELECT * FROM DIETA WHERE NOMBRE_APELLIDO=?', [username])
        dieta_data = cursor.fetchone()
        
        recetas_calculadas = None
        if dieta_data:
            proteina_total = dieta_data[3] if len(dieta_data) > 3 else 0
            grasa_total = dieta_data[4] if len(dieta_data) > 4 else 0
            carbohidratos_total = dieta_data[5] if len(dieta_data) > 5 else 0
            libertad = dieta_data[24] if len(dieta_data) > 24 else 0
            
            comidas_porcentajes = {
                'desayuno': (6, 7, 8),
                'media_manana': (9, 10, 11),
                'almuerzo': (12, 13, 14),
                'merienda': (15, 16, 17),
                'media_tarde': (18, 19, 20),
                'cena': (21, 22, 23)
            }
            
            recetas_calculadas = {}
            
            for comida_id, recetas_ids in data.get('comidas', {}).items():
                if not recetas_ids:
                    continue
                
                if comida_id not in comidas_porcentajes:
                    continue
                
                idx_p, idx_g, idx_c = comidas_porcentajes[comida_id]
                pct_proteina = dieta_data[idx_p] if len(dieta_data) > idx_p else 0
                pct_grasa = dieta_data[idx_g] if len(dieta_data) > idx_g else 0
                pct_carbos = dieta_data[idx_c] if len(dieta_data) > idx_c else 0
                
                proteina_comida = proteina_total * pct_proteina
                grasa_comida = grasa_total * pct_grasa
                carbos_comida = carbohidratos_total * pct_carbos
                
                recetas_calculadas[comida_id] = {
                    'nombre_comida': comida_id.replace('_', ' ').title(),
                    'macros_objetivo': {
                        'proteina': round(proteina_comida, 2),
                        'grasa': round(grasa_comida, 2),
                        'carbohidratos': round(carbos_comida, 2)
                    },
                    'recetas': []
                }
                
                for receta_id in recetas_ids:
                    cursor.execute('SELECT ID, NOMBRERECETA FROM RECETAS WHERE ID = ?', (receta_id,))
                    receta = cursor.fetchone()
                    
                    if receta:
                        # EJECUTAR EL SOLVER para esta receta
                        resultado_calculo = functions.calculate_recipe_portions(
                            nombrereceta=receta[1],
                            p0=proteina_comida,
                            g0=grasa_comida,
                            ch0=carbos_comida,
                            libertad=libertad
                        )
                        
                        recetas_calculadas[comida_id]['recetas'].append({
                            'id': receta[0],
                            'nombre': receta[1],
                            'calculo': resultado_calculo
                        })
            
            print(f"✓ Cálculos completados y cacheados")
        
        # Guardar nuevo plan CON los cálculos cacheados
        plan_json = json.dumps(data, ensure_ascii=False)
        calculos_json = json.dumps(recetas_calculadas, ensure_ascii=False) if recetas_calculadas else None
        
        cursor.execute('''
            INSERT INTO PLANES_ALIMENTARIOS 
            (USER_DNI, NOMBRE_APELLIDO, TIPO_PLAN, PLAN_JSON, ACTIVO, 
             TOTAL_RECETAS, COMIDAS_CONFIGURADAS, CALCULOS_JSON)
            VALUES (?, ?, ?, ?, 1, ?, ?, ?)
        ''', (user_dni, username, data.get('tipo', 'recetas'), plan_json, 
              total_recetas, comidas_configuradas, calculos_json))
        
        basededatos.commit()
        basededatos.close()
        
        return jsonify({
            'success': True,
            'message': f'Plan guardado con {total_recetas} recetas en {comidas_configuradas} comidas',
            'total_recetas': total_recetas,
            'comidas_configuradas': comidas_configuradas
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/plan-alimentario/plan-guardado')
def api_plan_alimentario_plan_guardado():
    """Obtiene el plan alimentario guardado del usuario y calcula todas las recetas"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    user_dni = session['DNI']
    username = session['username']
    
    try:
        basededatos = sqlite3.connect('src/Basededatos')
        cursor = basededatos.cursor()
        
        # Verificar columnas disponibles para compatibilidad
        cursor.execute("PRAGMA table_info(PLANES_ALIMENTARIOS)")
        columnas_existentes = [col[1] for col in cursor.fetchall()]
        
        # Construir query dinámicamente según columnas disponibles
        columnas_select = ['PLAN_JSON']
        if 'TOTAL_RECETAS' in columnas_existentes:
            columnas_select.append('TOTAL_RECETAS')
        if 'COMIDAS_CONFIGURADAS' in columnas_existentes:
            columnas_select.append('COMIDAS_CONFIGURADAS')
        if 'CALCULOS_JSON' in columnas_existentes:
            columnas_select.append('CALCULOS_JSON')
        columnas_select.append('FECHA_CREACION')
        
        # Obtener plan activo del usuario
        query = f'''
            SELECT {", ".join(columnas_select)}
            FROM PLANES_ALIMENTARIOS 
            WHERE USER_DNI = ? AND ACTIVO = 1 AND TIPO_PLAN = 'recetas'
            ORDER BY FECHA_CREACION DESC LIMIT 1
        '''
        cursor.execute(query, (user_dni,))
        
        plan_row = cursor.fetchone()
        
        if not plan_row:
            return jsonify({
                'success': False,
                'error': 'No hay plan alimentario guardado'
            })
        
        # Parsear el plan guardado
        plan_data = json.loads(plan_row[0])
        
        # INTENTAR USAR CACHE DE CÁLCULOS si existe
        recetas_calculadas = None
        if 'CALCULOS_JSON' in columnas_existentes:
            idx_calculos = columnas_select.index('CALCULOS_JSON')
            if plan_row[idx_calculos]:
                try:
                    recetas_calculadas = json.loads(plan_row[idx_calculos])
                    print(f"✓ Usando cálculos cacheados (carga instantánea)")
                except:
                    print("⚠ Error leyendo cache, recalculando...")
                    recetas_calculadas = None
        
        # Si no hay cache, recalcular (compatibilidad con planes viejos)
        if not recetas_calculadas:
            print("ℹ No hay cache, recalculando plan...")
            
            # Obtener información nutricional del usuario (tabla DIETA)
            cursor.execute('SELECT * FROM DIETA WHERE NOMBRE_APELLIDO=?', [username])
            dieta_data = cursor.fetchone()
            
            if not dieta_data:
                return jsonify({
                    'success': False,
                    'error': 'No hay información nutricional configurada'
                })
            
            # Obtener macros totales del usuario
            proteina_total = dieta_data[3] if len(dieta_data) > 3 else 0
            grasa_total = dieta_data[4] if len(dieta_data) > 4 else 0
            carbohidratos_total = dieta_data[5] if len(dieta_data) > 5 else 0
            libertad = dieta_data[24] if len(dieta_data) > 24 else 0
            
            # Mapeo de comida_id a columnas de la tabla DIETA
            comidas_porcentajes = {
                'desayuno': (6, 7, 8),
                'media_manana': (9, 10, 11),
                'almuerzo': (12, 13, 14),
                'merienda': (15, 16, 17),
                'media_tarde': (18, 19, 20),
                'cena': (21, 22, 23)
            }
            
            recetas_calculadas = {}
            
            for comida_id, recetas_ids in plan_data.get('comidas', {}).items():
                if not recetas_ids:
                    continue
                
                if comida_id not in comidas_porcentajes:
                    continue
                
                idx_p, idx_g, idx_c = comidas_porcentajes[comida_id]
                pct_proteina = dieta_data[idx_p] if len(dieta_data) > idx_p else 0
                pct_grasa = dieta_data[idx_g] if len(dieta_data) > idx_g else 0
                pct_carbos = dieta_data[idx_c] if len(dieta_data) > idx_c else 0
                
                proteina_comida = proteina_total * pct_proteina
                grasa_comida = grasa_total * pct_grasa
                carbos_comida = carbohidratos_total * pct_carbos
                
                recetas_calculadas[comida_id] = {
                    'nombre_comida': comida_id.replace('_', ' ').title(),
                    'macros_objetivo': {
                        'proteina': round(proteina_comida, 2),
                        'grasa': round(grasa_comida, 2),
                        'carbohidratos': round(carbos_comida, 2)
                    },
                    'recetas': []
                }
                
                for receta_id in recetas_ids:
                    cursor.execute('SELECT ID, NOMBRERECETA FROM RECETAS WHERE ID = ?', (receta_id,))
                    receta = cursor.fetchone()
                    
                    if receta:
                        resultado_calculo = functions.calculate_recipe_portions(
                            nombrereceta=receta[1],
                            p0=proteina_comida,
                            g0=grasa_comida,
                            ch0=carbos_comida,
                            libertad=libertad
                        )
                        
                        recetas_calculadas[comida_id]['recetas'].append({
                            'id': receta[0],
                            'nombre': receta[1],
                            'calculo': resultado_calculo
                        })
        
        basededatos.close()
        
        # Construir respuesta según columnas disponibles
        plan_info = {}
        if 'TOTAL_RECETAS' in columnas_existentes:
            idx = columnas_select.index('TOTAL_RECETAS')
            plan_info['total_recetas'] = plan_row[idx]
        if 'COMIDAS_CONFIGURADAS' in columnas_existentes:
            idx = columnas_select.index('COMIDAS_CONFIGURADAS')
            plan_info['comidas_configuradas'] = plan_row[idx]
        if 'FECHA_CREACION' in columnas_select:
            idx = columnas_select.index('FECHA_CREACION')
            plan_info['fecha_creacion'] = plan_row[idx]
        
        return jsonify({
            'success': True,
            'plan': plan_info,
            'recetas_calculadas': recetas_calculadas
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/plan-alimentario/lista-compras', methods=['POST'])
@csrf.exempt
def api_plan_alimentario_lista_compras():
    """Genera lista de compras basada en las recetas seleccionadas"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    data = request.get_json()
    username = session['username']
    
    try:
        basededatos = sqlite3.connect('src/Basededatos')
        cursor = basededatos.cursor()
        
        # Obtener información del plan nutricional para cálculos
        cursor.execute('SELECT * FROM DIETA WHERE NOMBRE_APELLIDO=?', [username])
        dieta_data = cursor.fetchone()
        
        if not dieta_data:
            return jsonify({'success': False, 'error': 'No hay plan nutricional configurado'})
        
        lista_compras = {}
        
        # Para cada receta seleccionada, obtener los ingredientes
        for comida, receta_id in data.get('comidas', {}).items():
            cursor.execute('''
                SELECT NOMBRERECETA FROM RECETAS WHERE ID = ?
            ''', (receta_id,))
            receta = cursor.fetchone()
            
            if receta:
                # TODO: Implementar extracción de ingredientes de la estructura de columnas de RECETAS
                # Por ahora, usar nombre de receta como placeholder
                ingredientes = [{
                    'nombre': receta[0],
                    'cantidad': '1 porción',
                    'categoria': 'General'
                }]
                
                # Agrupar ingredientes por categoría
                for ingrediente in ingredientes:
                    categoria = ingrediente.get('categoria', 'General')
                    if categoria not in lista_compras:
                        lista_compras[categoria] = []
                    
                    # Buscar si ya existe el ingrediente en la categoría
                    encontrado = False
                    for item in lista_compras[categoria]:
                        if item['nombre'].lower() == ingrediente.get('nombre', '').lower():
                            # Si existe, aumentar cantidad (simplificado)
                            item['cantidad'] = f"Múltiples porciones"
                            encontrado = True
                            break
                    
                    if not encontrado:
                        lista_compras[categoria].append({
                            'nombre': ingrediente.get('nombre', 'Ingrediente desconocido'),
                            'cantidad': ingrediente.get('cantidad', '1 porción')
                        })
        
        basededatos.close()
        
        return jsonify({
            'success': True,
            'lista': lista_compras
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/plan-alimentario/bloques/ajustar', methods=['POST'])
@csrf.exempt
def api_plan_alimentario_bloques_ajustar():
    """Ajusta bloques de una comida específica y recalcula objetivos"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    data = request.get_json()
    username = session['username']
    
    # Validar datos requeridos
    if not data.get('comida') or not data.get('ajustes'):
        return jsonify({'success': False, 'error': 'Faltan datos requeridos'}), 400
    
    # Bloques estándar
    BLOQUE_PROTEINA = 20
    BLOQUE_GRASA = 10
    BLOQUE_CARBOHIDRATOS = 25
    
    try:
        basededatos = sqlite3.connect('src/Basededatos')
        cursor = basededatos.cursor()
        
        # Obtener plan actual
        cursor.execute('SELECT * FROM DIETA WHERE NOMBRE_APELLIDO=?', [username])
        plan_data = cursor.fetchone()
        
        if not plan_data:
            return jsonify({'success': False, 'error': 'No hay plan nutricional configurado'})
        
        comida_id = data['comida']  # ej: 'desayuno', 'almuerzo', etc.
        ajustes = data['ajustes']    # ej: {'proteina': +1, 'carbohidratos': -1}
        
        # Mapeo de comidas a índices de columnas en DIETA
        comidas_indices = {
            'desayuno': {'p': 6, 'g': 7, 'c': 8},
            'media_manana': {'p': 9, 'g': 10, 'c': 11},
            'almuerzo': {'p': 12, 'g': 13, 'c': 14},
            'merienda': {'p': 15, 'g': 16, 'c': 17},
            'media_tarde': {'p': 18, 'g': 19, 'c': 20},
            'cena': {'p': 21, 'g': 22, 'c': 23}
        }
        
        if comida_id not in comidas_indices:
            return jsonify({'success': False, 'error': 'Comida no válida'}), 400
        
        # Obtener totales del plan
        proteina_total = plan_data[3] if len(plan_data) > 3 else 0
        grasa_total = plan_data[4] if len(plan_data) > 4 else 0
        carbohidratos_total = plan_data[5] if len(plan_data) > 5 else 0
        libertad = plan_data[24] if len(plan_data) > 24 else 0
        
        # Obtener porcentajes actuales de la comida
        indices = comidas_indices[comida_id]
        pct_proteina_actual = plan_data[indices['p']] if len(plan_data) > indices['p'] else 0
        pct_grasa_actual = plan_data[indices['g']] if len(plan_data) > indices['g'] else 0
        pct_carbos_actual = plan_data[indices['c']] if len(plan_data) > indices['c'] else 0
        
        # Calcular gramos actuales
        gramos_p = proteina_total * pct_proteina_actual
        gramos_g = grasa_total * pct_grasa_actual
        gramos_c = carbohidratos_total * pct_carbos_actual
        
        # Aplicar ajustes (convertir bloques a gramos)
        if 'proteina' in ajustes:
            gramos_p += ajustes['proteina'] * BLOQUE_PROTEINA
        if 'grasa' in ajustes:
            gramos_g += ajustes['grasa'] * BLOQUE_GRASA
        if 'carbohidratos' in ajustes:
            gramos_c += ajustes['carbohidratos'] * BLOQUE_CARBOHIDRATOS
        
        # Validar que no sean negativos
        gramos_p = max(0, gramos_p)
        gramos_g = max(0, gramos_g)
        gramos_c = max(0, gramos_c)
        
        # Calcular nuevos bloques
        bloques_p = round(gramos_p / BLOQUE_PROTEINA) if gramos_p > 0 else 0
        bloques_g = round(gramos_g / BLOQUE_GRASA) if gramos_g > 0 else 0
        bloques_c = round(gramos_c / BLOQUE_CARBOHIDRATOS) if gramos_c > 0 else 0
        
        # Calcular nuevos porcentajes (respecto al total diario)
        nuevo_pct_p = gramos_p / proteina_total if proteina_total > 0 else 0
        nuevo_pct_g = gramos_g / grasa_total if grasa_total > 0 else 0
        nuevo_pct_c = gramos_c / carbohidratos_total if carbohidratos_total > 0 else 0
        
        # Validar que esté dentro del margen de libertad
        margen = 1 + (libertad / 100)
        if (nuevo_pct_p > margen or nuevo_pct_g > margen or nuevo_pct_c > margen):
            return jsonify({
                'success': False,
                'error': f'El ajuste excede el margen de libertad ({libertad}%). Reduce el ajuste o consulta con tu nutricionista.',
                'margen_libertad': libertad
            }), 400
        
        # Registrar el ajuste en el log para historial
        for tipo_ajuste, valor in ajustes.items():
            if valor != 0:  # Solo registrar ajustes no-cero
                cursor.execute('''
                    INSERT INTO PLAN_BLOQUES_AJUSTES_LOG
                    (USER_DNI, COMIDA, TIPO_AJUSTE, VALOR_AJUSTE,
                     BLOQUES_RESULTADO_P, BLOQUES_RESULTADO_G, BLOQUES_RESULTADO_C,
                     GRAMOS_RESULTADO_P, GRAMOS_RESULTADO_G, GRAMOS_RESULTADO_C,
                     APLICADO_DESDE)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    user_dni, comida_id, tipo_ajuste, valor,
                    bloques_p, bloques_g, bloques_c,
                    round(gramos_p, 2), round(gramos_g, 2), round(gramos_c, 2),
                    'web'
                ))
        
        basededatos.commit()
        basededatos.close()
        
        return jsonify({
            'success': True,
            'comida': comida_id,
            'ajuste_aplicado': ajustes,
            'resultado': {
                'bloques': {
                    'proteina': bloques_p,
                    'grasa': bloques_g,
                    'carbohidratos': bloques_c,
                    'resumen': f"{bloques_p}P · {bloques_g}G · {bloques_c}C"
                },
                'gramos': {
                    'proteina': round(gramos_p, 2),
                    'grasa': round(gramos_g, 2),
                    'carbohidratos': round(gramos_c, 2)
                },
                'porcentajes': {
                    'proteina': round(nuevo_pct_p, 4),
                    'grasa': round(nuevo_pct_g, 4),
                    'carbohidratos': round(nuevo_pct_c, 4)
                }
            },
            'nota': 'Estos son valores sugeridos. Para guardarlos permanentemente, actualiza tu plan en la tabla DIETA.'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/plan-alimentario/bloques/sugerencias')
def api_plan_alimentario_bloques_sugerencias():
    """Obtiene sugerencias de bloques: presets globales + sugerencias dinámicas + favoritos del usuario"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    user_dni = session['DNI']
    username = session['username']
    comida_param = request.args.get('comida')  # Opcional: filtrar por comida
    
    # Bloques estándar
    BLOQUE_PROTEINA = 20
    BLOQUE_GRASA = 10
    BLOQUE_CARBOHIDRATOS = 25
    
    try:
        basededatos = sqlite3.connect('src/Basededatos')
        cursor = basededatos.cursor()
        
        # Obtener plan actual del usuario
        cursor.execute('SELECT * FROM DIETA WHERE NOMBRE_APELLIDO=?', [username])
        plan_data = cursor.fetchone()
        
        if not plan_data:
            return jsonify({'success': False, 'error': 'No hay plan nutricional configurado'})
        
        libertad = plan_data[24] if len(plan_data) > 24 else 0
        
        sugerencias = {
            'presets_globales': [],
            'favoritos_usuario': [],
            'sugerencias_dinamicas': [],
            'ajustes_recientes': []
        }
        
        # 1. PRESETS GLOBALES del staff
        query_presets = '''
            SELECT ID, COMIDA, PROTEINA, GRASA, CARBOHIDRATOS,
                   PROTEINA_GRAMOS, GRASA_GRAMOS, CARBOHIDRATOS_GRAMOS,
                   ALIAS, DESCRIPCION, VECES_USADA
            FROM PLAN_BLOQUES_PRESETS
            WHERE ES_PRESET_GLOBAL = 1
        '''
        params_presets = []
        
        if comida_param:
            query_presets += ' AND COMIDA = ?'
            params_presets.append(comida_param)
        
        query_presets += ' ORDER BY VECES_USADA DESC, ALIAS ASC'
        
        cursor.execute(query_presets, params_presets)
        presets = cursor.fetchall()
        
        for preset in presets:
            sugerencias['presets_globales'].append({
                'id': preset[0],
                'comida': preset[1],
                'bloques': {
                    'proteina': preset[2],
                    'grasa': preset[3],
                    'carbohidratos': preset[4],
                    'resumen': f"{preset[2]}P · {preset[3]}G · {preset[4]}C"
                },
                'gramos': {
                    'proteina': preset[5],
                    'grasa': preset[6],
                    'carbohidratos': preset[7]
                },
                'alias': preset[8],
                'descripcion': preset[9],
                'veces_usada': preset[10],
                'tipo': 'preset_global'
            })
        
        # 2. FAVORITOS DEL USUARIO
        query_favoritos = '''
            SELECT ID, COMIDA, PROTEINA, GRASA, CARBOHIDRATOS,
                   PROTEINA_GRAMOS, GRASA_GRAMOS, CARBOHIDRATOS_GRAMOS,
                   ALIAS, DESCRIPCION, ULTIMA_VEZ_USADA
            FROM PLAN_BLOQUES_PRESETS
            WHERE USER_DNI = ? AND ES_FAVORITA = 1
        '''
        params_favoritos = [user_dni]
        
        if comida_param:
            query_favoritos += ' AND COMIDA = ?'
            params_favoritos.append(comida_param)
        
        query_favoritos += ' ORDER BY ULTIMA_VEZ_USADA DESC, ALIAS ASC'
        
        cursor.execute(query_favoritos, params_favoritos)
        favoritos = cursor.fetchall()
        
        for fav in favoritos:
            sugerencias['favoritos_usuario'].append({
                'id': fav[0],
                'comida': fav[1],
                'bloques': {
                    'proteina': fav[2],
                    'grasa': fav[3],
                    'carbohidratos': fav[4],
                    'resumen': f"{fav[2]}P · {fav[3]}G · {fav[4]}C"
                },
                'gramos': {
                    'proteina': fav[5],
                    'grasa': fav[6],
                    'carbohidratos': fav[7]
                },
                'alias': fav[8],
                'descripcion': fav[9],
                'ultima_vez_usada': fav[10],
                'tipo': 'favorito'
            })
        
        # 3. SUGERENCIAS DINÁMICAS basadas en alimentos reales de GRUPOSALIMENTOS
        proteina_total = plan_data[3] if len(plan_data) > 3 else 0
        grasa_total = plan_data[4] if len(plan_data) > 4 else 0
        carbohidratos_total = plan_data[5] if len(plan_data) > 5 else 0
        
        # Cargar catálogo de alimentos con bloques calculados
        catalogo_alimentos = functions.obtener_catalogo_alimentos_bloques()
        
        # Mapeo de comidas
        comidas_indices = {
            'desayuno': {'p': 6, 'g': 7, 'c': 8, 'nombre': 'Desayuno'},
            'media_manana': {'p': 9, 'g': 10, 'c': 11, 'nombre': 'Media Mañana'},
            'almuerzo': {'p': 12, 'g': 13, 'c': 14, 'nombre': 'Almuerzo'},
            'merienda': {'p': 15, 'g': 16, 'c': 17, 'nombre': 'Merienda'},
            'media_tarde': {'p': 18, 'g': 19, 'c': 20, 'nombre': 'Media Tarde'},
            'cena': {'p': 21, 'g': 22, 'c': 23, 'nombre': 'Cena'}
        }
        
        comidas_a_procesar = [comida_param] if comida_param and comida_param in comidas_indices else comidas_indices.keys()
        
        for comida_id in comidas_a_procesar:
            if comida_id not in comidas_indices:
                continue
                
            indices = comidas_indices[comida_id]
            pct_p_base = plan_data[indices['p']] if len(plan_data) > indices['p'] else 0
            pct_g_base = plan_data[indices['g']] if len(plan_data) > indices['g'] else 0
            pct_c_base = plan_data[indices['c']] if len(plan_data) > indices['c'] else 0
            
            if pct_p_base == 0 and pct_g_base == 0 and pct_c_base == 0:
                continue  # Comida no activa
            
            gramos_p_actual = proteina_total * pct_p_base
            gramos_g_actual = grasa_total * pct_g_base
            gramos_c_actual = carbohidratos_total * pct_c_base
            
            # Redondear bloques a pasos de 0.5 para sincronizar con catálogo
            bloques_p_exacto = gramos_p_actual / BLOQUE_PROTEINA if gramos_p_actual > 0 else 0
            bloques_g_exacto = gramos_g_actual / BLOQUE_GRASA if gramos_g_actual > 0 else 0
            bloques_c_exacto = gramos_c_actual / BLOQUE_CARBOHIDRATOS if gramos_c_actual > 0 else 0
            
            bloques_p_actual = functions.redondear_a_medio_bloque(bloques_p_exacto)
            bloques_g_actual = functions.redondear_a_medio_bloque(bloques_g_exacto)
            bloques_c_actual = functions.redondear_a_medio_bloque(bloques_c_exacto)
            
            # Generar combinaciones de alimentos reales FILTRADAS por momento del día
            objetivo_bloques = {
                'proteina': bloques_p_actual,
                'grasa': bloques_g_actual,
                'carbohidratos': bloques_c_actual
            }
            
            combinaciones = functions.generar_combinaciones_alimentos(
                objetivo_bloques, 
                catalogo_alimentos,
                max_alimentos=3,  # Permitir hasta 3 alimentos
                momento_comida=comida_id  # Filtrar por momento del día
            )
            
            # Agregar combinaciones encontradas (ya vienen filtradas por tolerancia)
            for combo in combinaciones:
                bloques_combo = combo['bloques_total']
                
                # Calcular diferencias para mostrar al usuario
                diff_p = bloques_combo['proteina'] - bloques_p_actual
                diff_g = bloques_combo['grasa'] - bloques_g_actual
                diff_c = bloques_combo['carbohidratos'] - bloques_c_actual
                
                # Construir texto de diferencia para badge
                diff_text = []
                if abs(diff_p) > 0.1:
                    diff_text.append(f"{diff_p:+.1f}P")
                if abs(diff_g) > 0.1:
                    diff_text.append(f"{diff_g:+.1f}G")
                if abs(diff_c) > 0.1:
                    diff_text.append(f"{diff_c:+.1f}C")
                diff_display = ' '.join(diff_text) if diff_text else "Exacto"
                
                # Construir descripción enriquecida con porciones
                alimentos_detalle = []
                for a in combo['alimentos']:
                    porciones = a.get('porciones', 1)
                    if porciones > 1:
                        alimentos_detalle.append(f"{a['nombre_completo']} × {porciones}")
                    else:
                        alimentos_detalle.append(a['nombre_completo'])
                
                alimentos_texto = ' + '.join(alimentos_detalle)
                
                # Calcular gramos para la respuesta
                gramos_p_combo = bloques_combo['proteina'] * BLOQUE_PROTEINA
                gramos_g_combo = bloques_combo['grasa'] * BLOQUE_GRASA
                gramos_c_combo = bloques_combo['carbohidratos'] * BLOQUE_CARBOHIDRATOS
                
                # El generador ya aplicó tolerancia estricta, no necesitamos fallback aquí
                sugerencias['sugerencias_dinamicas'].append({
                    'comida': comida_id,
                    'bloques': {
                        'proteina': bloques_combo['proteina'],
                        'grasa': bloques_combo['grasa'],
                        'carbohidratos': bloques_combo['carbohidratos'],
                        'resumen': f"{bloques_combo['proteina']:.2f}P · {bloques_combo['grasa']:.2f}G · {bloques_combo['carbohidratos']:.2f}C"
                    },
                    'gramos': {
                        'proteina': round(gramos_p_combo, 1),
                        'grasa': round(gramos_g_combo, 1),
                        'carbohidratos': round(gramos_c_combo, 1)
                    },
                    'alias': combo['descripcion'],
                    'descripcion': alimentos_texto,
                    'tipo': 'grupos',
                    'comida_nombre': indices['nombre'],
                    'error': round(combo['error'], 2),
                    'diff_display': diff_display,
                    'requiere_validacion': False,  # Ya pasó el filtro estricto
                    'alimentos': [
                        {
                            'categoria': a['categoria'],
                            'descripcion': a['descripcion'],
                            'porcion_base': a['porcion'],
                            'porciones': a.get('porciones', 1),
                            'gramos_estimados': round(a['porcion'] * a.get('porciones', 1), 0),
                            'bloques_unitarios': {
                                'proteina': a['bloques']['proteina'],
                                'grasa': a['bloques']['grasa'],
                                'carbohidratos': a['bloques']['carbohidratos']
                            },
                            'gramos_totales': a.get('gramos_total', {
                                'proteina': round(a['proteina'] * a.get('porciones', 1), 1),
                                'grasa': round(a['grasa'] * a.get('porciones', 1), 1),
                                'carbohidratos': round(a['carbohidratos'] * a.get('porciones', 1), 1)
                            })
                        } for a in combo['alimentos']
                    ]
                })
        
        # 4. AJUSTES RECIENTES del usuario (últimos 7 días)
        cursor.execute('''
            SELECT COMIDA, TIPO_AJUSTE, VALOR_AJUSTE,
                   BLOQUES_RESULTADO_P, BLOQUES_RESULTADO_G, BLOQUES_RESULTADO_C,
                   GRAMOS_RESULTADO_P, GRAMOS_RESULTADO_G, GRAMOS_RESULTADO_C,
                   TIMESTAMP
            FROM PLAN_BLOQUES_AJUSTES_LOG
            WHERE USER_DNI = ? 
            AND TIMESTAMP >= datetime('now', '-7 days')
            ORDER BY TIMESTAMP DESC
            LIMIT 10
        ''', (user_dni,))
        
        ajustes = cursor.fetchall()
        
        for ajuste in ajustes:
            sugerencias['ajustes_recientes'].append({
                'comida': ajuste[0],
                'tipo_ajuste': ajuste[1],
                'valor_ajuste': ajuste[2],
                'bloques': {
                    'proteina': ajuste[3],
                    'grasa': ajuste[4],
                    'carbohidratos': ajuste[5],
                    'resumen': f"{ajuste[3]}P · {ajuste[4]}G · {ajuste[5]}C"
                },
                'gramos': {
                    'proteina': ajuste[6],
                    'grasa': ajuste[7],
                    'carbohidratos': ajuste[8]
                },
                'timestamp': ajuste[9],
                'alias': f"Ajuste reciente: {'+' if ajuste[2] > 0 else ''}{ajuste[2]} {ajuste[1][0].upper()}",
                'tipo': 'reciente'
            })
        
        basededatos.close()
        
        return jsonify({
            'success': True,
            'sugerencias': sugerencias,
            'libertad': libertad,
            'bloques_config': {
                'proteina': BLOQUE_PROTEINA,
                'grasa': BLOQUE_GRASA,
                'carbohidratos': BLOQUE_CARBOHIDRATOS
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/plan-alimentario/bloques/sugerencias', methods=['POST'])
@csrf.exempt
def api_plan_alimentario_bloques_guardar_favorito():
    """Guarda una combinación de bloques como favorita del usuario"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    user_dni = session['DNI']
    data = request.get_json()
    
    # Validar datos requeridos
    required = ['comida', 'proteina', 'grasa', 'carbohidratos']
    if not all(key in data for key in required):
        return jsonify({'success': False, 'error': 'Faltan datos requeridos'}), 400
    
    try:
        basededatos = sqlite3.connect('src/Basededatos')
        cursor = basededatos.cursor()
        
        # Calcular gramos basados en bloques estándar
        BLOQUE_PROTEINA = 20
        BLOQUE_GRASA = 10
        BLOQUE_CARBOHIDRATOS = 25
        
        proteina_gramos = data['proteina'] * BLOQUE_PROTEINA
        grasa_gramos = data['grasa'] * BLOQUE_GRASA
        carbohidratos_gramos = data['carbohidratos'] * BLOQUE_CARBOHIDRATOS
        
        alias = data.get('alias', f"{data['proteina']}P · {data['grasa']}G · {data['carbohidratos']}C")
        descripcion = data.get('descripcion', 'Mi combinación favorita')
        
        # Insertar nuevo favorito
        cursor.execute('''
            INSERT INTO PLAN_BLOQUES_PRESETS
            (USER_DNI, COMIDA, PROTEINA, GRASA, CARBOHIDRATOS,
             PROTEINA_GRAMOS, GRASA_GRAMOS, CARBOHIDRATOS_GRAMOS,
             ALIAS, DESCRIPCION, ES_FAVORITA, ES_PRESET_GLOBAL,
             ULTIMA_VEZ_USADA, VECES_USADA)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, datetime('now'), 0)
        ''', (
            user_dni, data['comida'],
            data['proteina'], data['grasa'], data['carbohidratos'],
            proteina_gramos, grasa_gramos, carbohidratos_gramos,
            alias, descripcion
        ))
        
        favorito_id = cursor.lastrowid
        basededatos.commit()
        basededatos.close()
        
        return jsonify({
            'success': True,
            'message': 'Favorito guardado exitosamente',
            'favorito_id': favorito_id,
            'favorito': {
                'id': favorito_id,
                'comida': data['comida'],
                'bloques': {
                    'proteina': data['proteina'],
                    'grasa': data['grasa'],
                    'carbohidratos': data['carbohidratos'],
                    'resumen': f"{data['proteina']}P · {data['grasa']}G · {data['carbohidratos']}C"
                },
                'alias': alias,
                'descripcion': descripcion
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/plan-alimentario/bloques/sugerencias/<int:favorito_id>', methods=['PATCH'])
@csrf.exempt
def api_plan_alimentario_bloques_actualizar_favorito(favorito_id):
    """Actualiza el alias/descripción o marca/desmarca como favorita una sugerencia"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    user_dni = session['DNI']
    data = request.get_json()
    
    try:
        basededatos = sqlite3.connect('src/Basededatos')
        cursor = basededatos.cursor()
        
        # Verificar que el favorito pertenece al usuario
        cursor.execute('''
            SELECT ID FROM PLAN_BLOQUES_PRESETS
            WHERE ID = ? AND USER_DNI = ?
        ''', (favorito_id, user_dni))
        
        if not cursor.fetchone():
            return jsonify({'success': False, 'error': 'Favorito no encontrado o no autorizado'}), 404
        
        # Construir UPDATE dinámicamente según campos recibidos
        campos_actualizar = []
        valores = []
        
        if 'alias' in data:
            campos_actualizar.append('ALIAS = ?')
            valores.append(data['alias'])
        
        if 'descripcion' in data:
            campos_actualizar.append('DESCRIPCION = ?')
            valores.append(data['descripcion'])
        
        if 'es_favorita' in data:
            campos_actualizar.append('ES_FAVORITA = ?')
            valores.append(1 if data['es_favorita'] else 0)
        
        if 'marcar_usada' in data and data['marcar_usada']:
            campos_actualizar.append('ULTIMA_VEZ_USADA = datetime("now")')
            campos_actualizar.append('VECES_USADA = VECES_USADA + 1')
        
        if not campos_actualizar:
            return jsonify({'success': False, 'error': 'No hay campos para actualizar'}), 400
        
        valores.append(favorito_id)
        
        query = f'''
            UPDATE PLAN_BLOQUES_PRESETS
            SET {', '.join(campos_actualizar)}
            WHERE ID = ?
        '''
        
        cursor.execute(query, valores)
        basededatos.commit()
        basededatos.close()
        
        return jsonify({
            'success': True,
            'message': 'Favorito actualizado exitosamente'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/plan-alimentario/bloques/sugerencias/<int:favorito_id>', methods=['DELETE'])
@csrf.exempt
def api_plan_alimentario_bloques_eliminar_favorito(favorito_id):
    """Elimina un favorito del usuario"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    user_dni = session['DNI']
    
    try:
        basededatos = sqlite3.connect('src/Basededatos')
        cursor = basededatos.cursor()
        
        # Verificar que el favorito pertenece al usuario y NO es preset global
        cursor.execute('''
            SELECT ID FROM PLAN_BLOQUES_PRESETS
            WHERE ID = ? AND USER_DNI = ? AND ES_PRESET_GLOBAL = 0
        ''', (favorito_id, user_dni))
        
        if not cursor.fetchone():
            return jsonify({'success': False, 'error': 'Favorito no encontrado, no autorizado o es preset global'}), 404
        
        # Eliminar favorito
        cursor.execute('DELETE FROM PLAN_BLOQUES_PRESETS WHERE ID = ?', (favorito_id,))
        basededatos.commit()
        basededatos.close()
        
        return jsonify({
            'success': True,
            'message': 'Favorito eliminado exitosamente'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

##############################################
### CONSTRUCTOR DE COMBINACIONES ###
##############################################

@app.route('/api/grupos-alimentos')
def api_grupos_alimentos():
    """
    Retorna alimentos de GRUPOSALIMENTOS filtrados opcionalmente por macro dominante.
    Usado por el constructor de combinaciones.
    
    Query params:
    - macro: P, G o C (opcional) - filtra por macro dominante
    - momento: desayuno, almuerzo, cena, etc. (opcional)
    """
    macro_filtro = request.args.get('macro')
    momento_filtro = request.args.get('momento')
    
    # Obtener catálogo completo
    catalogo = functions.obtener_catalogo_alimentos_bloques()
    
    # Aplicar filtros
    if macro_filtro:
        # Usar macros_fuertes para filtrado más inclusivo
        catalogo = [a for a in catalogo 
                   if macro_filtro.upper() in a.get('macros_fuertes', [a['macro_dominante']])]
    
    if momento_filtro:
        catalogo = [a for a in catalogo if momento_filtro in a.get('momentos', [])]
    
    # Formatear respuesta
    alimentos_response = []
    for alimento in catalogo:
        alimentos_response.append({
            'categoria': alimento['categoria'],
            'descripcion': alimento['descripcion'],
            'porcion_gramos': alimento['porcion'],
            'bloques_unitarios': {
                'proteina': alimento['bloques']['proteina'],  # Ya redondeado a 0.5
                'grasa': alimento['bloques']['grasa'],
                'carbohidratos': alimento['bloques']['carbohidratos']
            },
            'bloques_exactos': {  # Valores exactos para tooltips/auditoría
                'proteina': round(alimento['bloques_exactos']['proteina'], 4),
                'grasa': round(alimento['bloques_exactos']['grasa'], 4),
                'carbohidratos': round(alimento['bloques_exactos']['carbohidratos'], 4)
            },
            'gramos_porcion': {
                'proteina': round(alimento['proteina'], 2),
                'grasa': round(alimento['grasa'], 2),
                'carbohidratos': round(alimento['carbohidratos'], 2)
            },
            'gramos_100g': {
                'proteina': alimento['proteina_100g'],
                'grasa': alimento['grasa_100g'],
                'carbohidratos': alimento['carbohidratos_100g']
            },
            'macro_dominante': alimento['macro_dominante'],
            'macros_fuertes': alimento.get('macros_fuertes', [alimento['macro_dominante']]),
            'momentos': alimento.get('momentos', []),
            'alcohol_info': alimento.get('alcohol_info')
        })
    
    return jsonify({
        'success': True,
        'alimentos': alimentos_response,
        'total': len(alimentos_response)
    })

@app.route('/api/plan-alimentario/bloques/constructor', methods=['POST'])
@csrf.exempt
def api_plan_alimentario_bloques_guardar_constructor():
    """
    Guarda una combinación creada por el usuario en el constructor.
    Similar a guardar favorito pero con detalles completos de alimentos.
    """
    if 'username' not in session:
        return jsonify({'success': False, 'error': 'No autenticado'}), 401
    
    user_dni = session.get('DNI')
    
    data = request.get_json()
    comida = data.get('comida')
    alimentos = data.get('alimentos', [])  # [{categoria, descripcion, porciones}, ...]
    alias = data.get('alias')
    enviar_revision = data.get('enviar_revision', False)
    
    if not comida or not alimentos or not alias:
        return jsonify({'success': False, 'error': 'Faltan datos'}), 400
    
    # Calcular bloques totales
    BLOQUE_PROTEINA = 20
    BLOQUE_GRASA = 10
    BLOQUE_CARBOHIDRATOS = 25
    
    catalogo = functions.obtener_catalogo_alimentos_bloques()
    
    bloques_total_p = 0
    bloques_total_g = 0
    bloques_total_c = 0
    gramos_total_p = 0
    gramos_total_g = 0
    gramos_total_c = 0
    
    alimentos_detalle = []
    
    for alimento_data in alimentos:
        # Buscar en catálogo
        alimento_encontrado = next((a for a in catalogo 
                                   if a['categoria'] == alimento_data['categoria'] 
                                   and a['descripcion'] == alimento_data['descripcion']), None)
        
        if alimento_encontrado:
            porciones = alimento_data.get('porciones', 1)
            bloques_total_p += alimento_encontrado['bloques']['proteina'] * porciones
            bloques_total_g += alimento_encontrado['bloques']['grasa'] * porciones
            bloques_total_c += alimento_encontrado['bloques']['carbohidratos'] * porciones
            
            gramos_total_p += alimento_encontrado['proteina'] * porciones
            gramos_total_g += alimento_encontrado['grasa'] * porciones
            gramos_total_c += alimento_encontrado['carbohidratos'] * porciones
            
            alimentos_detalle.append({
                'categoria': alimento_data['categoria'],
                'descripcion': alimento_data['descripcion'],
                'porciones': porciones,
                'porcion_gramos': alimento_encontrado['porcion'],
                'bloques': {
                    'proteina': alimento_encontrado['bloques']['proteina'],
                    'grasa': alimento_encontrado['bloques']['grasa'],
                    'carbohidratos': alimento_encontrado['bloques']['carbohidratos']
                }
            })
    
    # Preparar datos para biblioteca
    import json
    detalle_json = json.dumps(alimentos_detalle, ensure_ascii=False)
    creador_username = session.get('username', 'Usuario')
    es_publica = 1 if data.get('es_publica') else 0
    
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO PLAN_BLOQUES_PRESETS
            (USER_DNI, COMIDA, PROTEINA, GRASA, CARBOHIDRATOS,
             PROTEINA_GRAMOS, GRASA_GRAMOS, CARBOHIDRATOS_GRAMOS,
             ALIAS, DESCRIPCION, ES_FAVORITA, ES_PRESET_GLOBAL,
             ULTIMA_VEZ_USADA, VECES_USADA,
             CREADOR_USERNAME, DETALLE_JSON, ES_PUBLICA, FAVORITOS_TOTAL)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?, ?, ?, 0)
        ''', (
            user_dni, comida,
            round(bloques_total_p, 1), round(bloques_total_g, 1), round(bloques_total_c, 1),
            round(gramos_total_p, 2), round(gramos_total_g, 2), round(gramos_total_c, 2),
            alias,
            ' + '.join([f"{a['categoria']} ({a['descripcion']}) × {a['porciones']}" for a in alimentos_detalle]),
            1,  # ES_FAVORITA
            0,  # ES_PRESET_GLOBAL
            creador_username,
            detalle_json,
            es_publica
        ))
        
        favorito_id = cursor.lastrowid
        basededatos.commit()
        
        return jsonify({
            'success': True,
            'message': 'Combinación guardada exitosamente',
            'favorito_id': favorito_id,
            'bloques_total': {
                'proteina': round(bloques_total_p, 1),
                'grasa': round(bloques_total_g, 1),
                'carbohidratos': round(bloques_total_c, 1)
            }
        })
        
    except Exception as e:
        basededatos.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        basededatos.close()

@app.route('/api/plan-alimentario/biblioteca')
def api_biblioteca_combinaciones():
    """
    Devuelve todas las combinaciones públicas de la biblioteca.
    Ordenadas por popularidad (favoritos) y fecha.
    """
    if 'DNI' not in session:
        return jsonify({'success': False, 'error': 'No autorizado'}), 401
    
    try:
        conn = sqlite3.connect('src/Basededatos')
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ID, COMIDA, ALIAS, DESCRIPCION,
                   PROTEINA, GRASA, CARBOHIDRATOS,
                   PROTEINA_GRAMOS, GRASA_GRAMOS, CARBOHIDRATOS_GRAMOS,
                   CREADOR_USERNAME, FAVORITOS_TOTAL, DETALLE_JSON, FECHA_CREACION
            FROM PLAN_BLOQUES_PRESETS
            WHERE ES_PUBLICA = 1
            ORDER BY FAVORITOS_TOTAL DESC, FECHA_CREACION DESC
        """)
        filas = cursor.fetchall()
        conn.close()
        
        items = []
        for r in filas:
            items.append({
                'id': r[0],
                'comida': r[1],
                'alias': r[2],
                'descripcion': r[3],
                'bloques': {
                    'proteina': r[4],
                    'grasa': r[5],
                    'carbohidratos': r[6],
                    'resumen': f"{r[4]}P · {r[5]}G · {r[6]}C"
                },
                'gramos': {
                    'proteina': r[7],
                    'grasa': r[8],
                    'carbohidratos': r[9]
                },
                'creador_username': r[10] or 'Anónimo',
                'favoritos_total': r[11] or 0,
                'detalle_json': r[12],
                'fecha_creacion': r[13],
                'tipo': 'biblioteca'
            })
        
        return jsonify({
            'success': True,
            'biblioteca': items
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/plan-alimentario/favoritos/<int:preset_id>', methods=['POST', 'DELETE'])
@csrf.exempt
def api_favorito_toggle(preset_id):
    """
    Marca o desmarca una combinación como favorita.
    POST: Agregar a favoritos
    DELETE: Quitar de favoritos
    Los triggers de BD actualizan FAVORITOS_TOTAL automáticamente.
    """
    if 'DNI' not in session:
        return jsonify({'success': False, 'error': 'No autorizado'}), 401
    
    user_dni = session['DNI']
    
    try:
        conn = sqlite3.connect('src/Basededatos')
        cursor = conn.cursor()
        
        if request.method == 'POST':
            # Agregar a favoritos (INSERT OR IGNORE evita duplicados)
            cursor.execute("""
                INSERT OR IGNORE INTO PLAN_BLOQUES_FAVORITOS (PRESET_ID, USER_DNI)
                VALUES (?, ?)
            """, (preset_id, user_dni))
        else:  # DELETE
            # Quitar de favoritos
            cursor.execute("""
                DELETE FROM PLAN_BLOQUES_FAVORITOS
                WHERE PRESET_ID = ? AND USER_DNI = ?
            """, (preset_id, user_dni))
        
        conn.commit()
        
        # Obtener el contador actualizado (actualizado por trigger)
        cursor.execute("""
            SELECT FAVORITOS_TOTAL FROM PLAN_BLOQUES_PRESETS
            WHERE ID = ?
        """, (preset_id,))
        result = cursor.fetchone()
        favoritos_total = result[0] if result else 0
        
        conn.close()
        
        return jsonify({
            'success': True,
            'favoritos_total': favoritos_total,
            'action': 'added' if request.method == 'POST' else 'removed'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

##############################################
### NUEVOS ENDPOINTS PARA FUNCIONALIDADES EXTENDIDAS ###
##############################################

### MEDIDAS CORPORALES ###

@app.route('/medidas-corporales')
def medidas_corporales():
    """Página de registro y análisis de medidas corporales completas - EN DESARROLLO"""
    if 'DNI' not in session:
        return redirect(url_for('login'))
    
    return render_template('mantenimiento.html')

@app.route('/api/medidas-corporales', methods=['GET', 'POST'])
def api_medidas_corporales():
    """API para medidas corporales"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    user_dni = session['DNI']
    
    if request.method == 'GET':
        # Obtener historial de medidas
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM MEDIDAS_CORPORALES 
                WHERE user_id = ? 
                ORDER BY fecha_registro DESC
            """, (user_dni,))
            medidas = cursor.fetchall()
            conn.close()
            
            return jsonify({
                'success': True,
                'medidas': medidas
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        # Registrar nuevas medidas
        data = request.get_json()
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            
            # Campos a insertar (solo los que tienen valores)
            campos = ['user_id']
            valores = [user_dni]
            placeholders = ['?']
            
            for campo, valor in data.items():
                if valor is not None and valor != '':
                    campos.append(campo)
                    valores.append(valor)
                    placeholders.append('?')
            
            query = f"""
                INSERT INTO MEDIDAS_CORPORALES ({', '.join(campos)})
                VALUES ({', '.join(placeholders)})
            """
            
            cursor.execute(query, valores)
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Medidas registradas exitosamente'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

### RENDIMIENTO FÍSICO ###

@app.route('/rendimiento-velocidad')
def rendimiento_velocidad():
    """Página de análisis de velocidad - EN DESARROLLO"""
    if 'DNI' not in session:
        return redirect(url_for('login'))
    
    return render_template('mantenimiento.html')

@app.route('/api/rendimiento-velocidad', methods=['GET', 'POST'])
def api_rendimiento_velocidad():
    """API para pruebas de velocidad"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    user_dni = session['DNI']
    
    if request.method == 'GET':
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM RENDIMIENTO_VELOCIDAD 
                WHERE user_id = ? 
                ORDER BY fecha_registro DESC
            """, (user_dni,))
            pruebas = cursor.fetchall()
            conn.close()
            
            return jsonify({'success': True, 'pruebas': pruebas})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        data = request.get_json()
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            
            campos = ['user_id']
            valores = [user_dni]
            placeholders = ['?']
            
            for campo, valor in data.items():
                if valor is not None and valor != '':
                    campos.append(campo)
                    valores.append(valor)
                    placeholders.append('?')
            
            query = f"""
                INSERT INTO RENDIMIENTO_VELOCIDAD ({', '.join(campos)})
                VALUES ({', '.join(placeholders)})
            """
            
            cursor.execute(query, valores)
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Prueba de velocidad registrada'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/rendimiento-flexibilidad')
def rendimiento_flexibilidad():
    """Página de análisis de flexibilidad - EN DESARROLLO"""
    if 'DNI' not in session:
        return redirect(url_for('login'))
    
    return render_template('mantenimiento.html')

@app.route('/api/rendimiento-flexibilidad', methods=['GET', 'POST'])
def api_rendimiento_flexibilidad():
    """API para pruebas de flexibilidad"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    user_dni = session['DNI']
    
    if request.method == 'GET':
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM RENDIMIENTO_FLEXIBILIDAD 
                WHERE user_id = ? 
                ORDER BY fecha_registro DESC
            """, (user_dni,))
            pruebas = cursor.fetchall()
            conn.close()
            
            return jsonify({'success': True, 'pruebas': pruebas})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        data = request.get_json()
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            
            campos = ['user_id']
            valores = [user_dni]
            placeholders = ['?']
            
            for campo, valor in data.items():
                if valor is not None and valor != '':
                    campos.append(campo)
                    valores.append(valor)
                    placeholders.append('?')
            
            query = f"""
                INSERT INTO RENDIMIENTO_FLEXIBILIDAD ({', '.join(campos)})
                VALUES ({', '.join(placeholders)})
            """
            
            cursor.execute(query, valores)
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Prueba de flexibilidad registrada'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/rendimiento-movilidad')
def rendimiento_movilidad():
    """Página de análisis de movilidad - EN DESARROLLO"""
    if 'DNI' not in session:
        return redirect(url_for('login'))
    
    return render_template('mantenimiento.html')

@app.route('/api/rendimiento-movilidad', methods=['GET', 'POST'])
def api_rendimiento_movilidad():
    """API para pruebas de movilidad"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    user_dni = session['DNI']
    
    if request.method == 'GET':
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM RENDIMIENTO_MOVILIDAD 
                WHERE user_id = ? 
                ORDER BY fecha_registro DESC
            """, (user_dni,))
            pruebas = cursor.fetchall()
            conn.close()
            
            return jsonify({'success': True, 'pruebas': pruebas})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        data = request.get_json()
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            
            campos = ['user_id']
            valores = [user_dni]
            placeholders = ['?']
            
            for campo, valor in data.items():
                if valor is not None and valor != '':
                    campos.append(campo)
                    valores.append(valor)
                    placeholders.append('?')
            
            query = f"""
                INSERT INTO RENDIMIENTO_MOVILIDAD ({', '.join(campos)})
                VALUES ({', '.join(placeholders)})
            """
            
            cursor.execute(query, valores)
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Evaluación de movilidad registrada'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/rendimiento-resistencia')
def rendimiento_resistencia():
    """Página de análisis de resistencia - EN DESARROLLO"""
    if 'DNI' not in session:
        return redirect(url_for('login'))
    
    return render_template('mantenimiento.html')

@app.route('/api/rendimiento-resistencia', methods=['GET', 'POST'])
def api_rendimiento_resistencia():
    """API para pruebas de resistencia"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    user_dni = session['DNI']
    
    if request.method == 'GET':
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM RENDIMIENTO_RESISTENCIA 
                WHERE user_id = ? 
                ORDER BY fecha_registro DESC
            """, (user_dni,))
            pruebas = cursor.fetchall()
            conn.close()
            
            return jsonify({'success': True, 'pruebas': pruebas})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        data = request.get_json()
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            
            campos = ['user_id']
            valores = [user_dni]
            placeholders = ['?']
            
            for campo, valor in data.items():
                if valor is not None and valor != '':
                    campos.append(campo)
                    valores.append(valor)
                    placeholders.append('?')
            
            query = f"""
                INSERT INTO RENDIMIENTO_RESISTENCIA ({', '.join(campos)})
                VALUES ({', '.join(placeholders)})
            """
            
            cursor.execute(query, valores)
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Prueba de resistencia registrada'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

### TELEMEDICINA ###

@app.route('/telemedicina')
def telemedicina():
    """Página principal de telemedicina - EN DESARROLLO"""
    if 'DNI' not in session:
        return redirect(url_for('login'))
    
    return render_template('mantenimiento.html')

@app.route('/historia-medica')
def historia_medica():
    """Página de historia médica - EN DESARROLLO"""
    if 'DNI' not in session:
        return redirect(url_for('login'))
    
    return render_template('mantenimiento.html')

@app.route('/api/historia-medica', methods=['GET', 'POST'])
def api_historia_medica():
    """API para historia médica"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    user_dni = session['DNI']
    
    if request.method == 'GET':
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM HISTORIA_MEDICA 
                WHERE user_id = ? 
                ORDER BY fecha_registro DESC
            """, (user_dni,))
            historia = cursor.fetchall()
            conn.close()
            
            return jsonify({'success': True, 'historia': historia})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        data = request.get_json()
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            
            campos = ['user_id']
            valores = [user_dni]
            placeholders = ['?']
            
            for campo, valor in data.items():
                if valor is not None and valor != '':
                    campos.append(campo)
                    valores.append(valor)
                    placeholders.append('?')
            
            query = f"""
                INSERT INTO HISTORIA_MEDICA ({', '.join(campos)})
                VALUES ({', '.join(placeholders)})
            """
            
            cursor.execute(query, valores)
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Registro médico agregado'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/citas-medicas')
def citas_medicas():
    """Página de citas médicas - EN DESARROLLO"""
    if 'DNI' not in session:
        return redirect(url_for('login'))
    
    return render_template('mantenimiento.html')

@app.route('/api/citas-medicas', methods=['GET', 'POST'])
def api_citas_medicas():
    """API para citas médicas"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    user_dni = session['DNI']
    
    if request.method == 'GET':
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM CITAS_MEDICAS 
                WHERE user_id = ? 
                ORDER BY fecha_cita DESC
            """, (user_dni,))
            citas = cursor.fetchall()
            conn.close()
            
            return jsonify({'success': True, 'citas': citas})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        data = request.get_json()
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            
            campos = ['user_id']
            valores = [user_dni]
            placeholders = ['?']
            
            for campo, valor in data.items():
                if valor is not None and valor != '':
                    campos.append(campo)
                    valores.append(valor)
                    placeholders.append('?')
            
            query = f"""
                INSERT INTO CITAS_MEDICAS ({', '.join(campos)})
                VALUES ({', '.join(placeholders)})
            """
            
            cursor.execute(query, valores)
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Cita médica programada'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/signos-vitales')
def signos_vitales():
    """Página de registro de signos vitales - EN DESARROLLO"""
    if 'DNI' not in session:
        return redirect(url_for('login'))
    
    return render_template('mantenimiento.html')

@app.route('/api/signos-vitales', methods=['GET', 'POST'])
def api_signos_vitales():
    """API para signos vitales"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    user_dni = session['DNI']
    
    if request.method == 'GET':
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM SIGNOS_VITALES 
                WHERE user_id = ? 
                ORDER BY fecha_registro DESC
            """, (user_dni,))
            signos = cursor.fetchall()
            conn.close()
            
            return jsonify({'success': True, 'signos': signos})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        data = request.get_json()
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            
            campos = ['user_id']
            valores = [user_dni]
            placeholders = ['?']
            
            for campo, valor in data.items():
                if valor is not None and valor != '':
                    campos.append(campo)
                    valores.append(valor)
                    placeholders.append('?')
            
            query = f"""
                INSERT INTO SIGNOS_VITALES ({', '.join(campos)})
                VALUES ({', '.join(placeholders)})
            """
            
            cursor.execute(query, valores)
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Signos vitales registrados'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/programas-prevencion')
def programas_prevencion():
    """Página de programas de prevención - EN DESARROLLO"""
    if 'DNI' not in session:
        return redirect(url_for('login'))
    
    return render_template('mantenimiento.html')

@app.route('/api/programas-prevencion', methods=['GET', 'POST'])
def api_programas_prevencion():
    """API para programas de prevención"""
    if 'DNI' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    user_dni = session['DNI']
    
    if request.method == 'GET':
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM PROGRAMAS_PREVENCION 
                WHERE user_id = ? 
                ORDER BY fecha_creacion DESC
            """, (user_dni,))
            programas = cursor.fetchall()
            conn.close()
            
            return jsonify({'success': True, 'programas': programas})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        data = request.get_json()
        try:
            conn = sqlite3.connect('src/Basededatos')
            cursor = conn.cursor()
            
            campos = ['user_id']
            valores = [user_dni]
            placeholders = ['?']
            
            for campo, valor in data.items():
                if valor is not None and valor != '':
                    campos.append(campo)
                    valores.append(valor)
                    placeholders.append('?')
            
            query = f"""
                INSERT INTO PROGRAMAS_PREVENCION ({', '.join(campos)})
                VALUES ({', '.join(placeholders)})
            """
            
            cursor.execute(query, valores)
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Programa de prevención creado'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

### FUNCIÓN PARA CORRER LA APLICACIÓN

# Inicializar tablas de bloques al startup
functions.crear_tablas_bloques_sugerencias()
functions.insertar_presets_globales_bloques()

if __name__ == '__main__':
    app.config['TEMPLATES AUTO_RELOAD'] = True
    app.run(debug=True, port=8000)
