from flask import Flask, render_template, request, make_response, session, redirect, url_for, flash, jsonify
from flask_wtf import CSRFProtect
import sqlite3
import math
from datetime import datetime
import json
import forms
import functions
from functions import decode_json_data
from training import crear_tablas, inicializar_matriz_entrenamiento, obtener_entrenamiento_del_dia, registrar_sesion_completada, avanzar_dia_plan, guardar_plan_optimizado

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
    if 'username' in session and username != 'Toffaletti, Diego Alejandro' and request.endpoint in ['create', 'editperfilest', 'delperfilest', 'login', 'update', 'editperfildin', 'delperfildin', 'planner', 'delplan', 'editplan', 'goal', 'delgoal', 'recipecreator', "databasemanager", 'createfood', 'editfood', 'delfood', 'deleterecipe', 'strengthstandard', 'trainingplanner', 'strengthdata_admin_view']:
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
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    cursor.execute('SELECT * FROM DIETA WHERE NOMBRE_APELLIDO=?', [username])
    dietadata=cursor.fetchall()
    cursor.execute('SELECT * FROM PERFILDINAMICO WHERE NOMBRE_APELLIDO=? ORDER BY FECHA_REGISTRO ASC', [username])
    dinamicodata=cursor.fetchall()
    cursor.execute('SELECT * FROM PERFILESTATICO WHERE NOMBRE_APELLIDO=?', [username])
    estaticodata=cursor.fetchall()
    cursor.execute('SELECT * FROM OBJETIVO WHERE NOMBRE_APELLIDO=?', [username])
    objetivodata=cursor.fetchall()
    basededatos.close()

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

    return render_template('dashboard.html', dieta=dietadata, dinamico=dinamicodata, estatico=estaticodata, objetivo=objetivodata, title='Vista Principal', username=session['username'], agua=agua, abdomen=abdomen, abdcatrisk=abdcatrisk, bodyscore=bodyscore, categoria=categoria, habitperformance=habitperformance, deltapeso=deltapeso, deltapg=deltapg, deltapm=deltapm, ffmi=ffmi, imc=imc, bf=bf, deltaimc=deltaimc, listaimc=listaimc, deltaffmi=deltaffmi, listaffmi=listaffmi, deltabf=deltabf, listabf=listabf, bfcat=bfcat, immccat=immccat, imccat=imccat, solver_category=solver_category, training_plan=training_plan)

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
        print(f"DEBUG - Columnas de PERFILESTATICO: {columns}")
        
        if not columns:
            return jsonify({'error': 'Tabla PERFILESTATICO no existe'}), 500
        
        # Verificar si existen las columnas necesarias
        column_names = [col[1] for col in columns]
        print(f"DEBUG - Nombres de columnas: {column_names}")
        
        # Obtener datos del perfil estático usando índices directos para evitar problemas con nombres
        try:
            cursor.execute("SELECT * FROM PERFILESTATICO WHERE NOMBRE_APELLIDO = ?", (user_name,))
            user_record = cursor.fetchone()
            print(f"DEBUG - Fila encontrada: {user_record}")
            
            if not user_record:
                return jsonify({'exercises': [], 'user_name': user_name})
            
            # Usar índices directos según PRAGMA table_info: DNI(1), SEXO(4), FECHA_NACIMIENTO(5) 
            user_dni, sexo, fecha_nacimiento = user_record[1], user_record[4], user_record[5]
            print(f"DEBUG - Datos extraídos: DNI={user_dni}, SEXO={sexo}, FECHA={fecha_nacimiento}")
            
        except Exception as e:
            print(f"DEBUG - Error SQL: {e}")
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
        print(f"DEBUG - Columnas de ESTADO_EJERCICIO_USUARIO: {ejercicio_columns}")
        
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
        print(f"DEBUG - Columnas de FUERZA: {fuerza_columns}")
        
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
        SELECT ejercicio_nombre, last_test_reps, current_columna, lastre_adicional
        FROM ESTADO_EJERCICIO_USUARIO 
        WHERE user_id = ?
    """, (user_id,))
    estados_ejercicios = cursor.fetchall()
    basededatos.close()
    
    # Crear diccionario con información del último test
    ultimo_test_info = {}
    for estado in estados_ejercicios:
        ejercicio_nombre, last_test_reps, current_columna, lastre_adicional = estado
        
        # La meta a superar es directamente el valor de current_columna
        target_reps = current_columna if current_columna else 1
        
        ultimo_test_info[ejercicio_nombre] = {
            'last_reps': last_test_reps if last_test_reps else 0,
            'target_reps': target_reps if target_reps else 1
        }
    
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
                test_data = datos_test[nombre_ejercicio]
                repeticiones_test[nombre_ejercicio] = test_data.get('repeticiones', 0)
                incrementos_peso[nombre_ejercicio] = test_data.get('incrementoPeso', 2.5)
                
                # Verificar si fue convertida a TEST
                if test_data.get('convertedToTest', False):
                    sesiones_convertidas_test[nombre_ejercicio] = True
                    print(f"Ejercicio {nombre_ejercicio} fue CONVERTIDO A TEST: {repeticiones_test[nombre_ejercicio]} reps, incremento {incrementos_peso[nombre_ejercicio]} kg")
                else:
                    print(f"Datos TEST para {nombre_ejercicio}: {repeticiones_test[nombre_ejercicio]} reps, incremento {incrementos_peso[nombre_ejercicio]} kg")
            
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
        functions.plannutricional(planner_form)
        success_message = 'Actualizado {} !'.format(planner_form.nameuser.data)
        flash(success_message)
    return render_template('planner.html', title='Configuración de plan nutricional', form=planner_form, username=session['username'])

### FUNCIÓN PARA ELIMINAR DIETAS ###

@app.route('/delplan/<string:ID>')
def delplan(ID):
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    cursor.execute("SELECT NOMBRE_APELLIDO FROM DIETA WHERE ID=?", ID)
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
        
        if data:
            numero_dias = int(data.get('numeroDias', 3))
            numero_ejercicios = int(data.get('numeroEjercicios', 3))
        
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
                usuario_id = row['user_id']  # Obtenemos el user_id de la consulta
                
                # Usar datos de fuerza actuales como pesos iniciales (desde lift_fields)
                datos_fuerza = {}  # Solo necesitamos weight y reps para cada ejercicio
                for ejercicio, datos in lift_fields.items():
                    datos_fuerza[ejercicio] = {
                        "weight": datos.get("weight", 50),  # Default 50kg si no hay dato
                        "reps": datos.get("reps", 1)     # Default 1 rep si no hay dato
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

### FUNCIÓN PARA CORRER LA APLICACIÓN

if __name__ == '__main__':
    app.config['TEMPLATES AUTO_RELOAD'] = True
    app.run(debug=True, port=8000)