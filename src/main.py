from flask import Flask, render_template, request, make_response, session, redirect, url_for, flash, jsonify
from flask_wtf import CSRFProtect
import sqlite3
import math
from datetime import datetime

import forms
import functions

app = Flask(__name__)
app.secret_key = 'my_secret_key'
csrf = CSRFProtect(app)

### FUNCIÓN DE CHEQUEO PREVIO AL INGRESO DE CADA PÁGINA ###

@app.before_request
def before_request():
    if 'username' in session:
        username = session['username']
    else:
        pass
    if 'username' in session and username != 'Toffaletti, Diego Alejandro' and request.endpoint in ['create', 'editperfilest', 'delperfilest', 'login', 'update', 'editperfildin', 'delperfildin', 'planner', 'delplan', 'editplan', 'goal', 'delgoal', 'recipecreator', "databasemanager", 'createfood', 'editfood', 'delfood', 'deleterecipe', 'strengthstandard', 'trainingplanner']:
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
    username = session['username']
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    recipe_form = forms.RecipeForm(request.form)
    return render_template('caloriescal.html', title='Calculadora de calorías',form=recipe_form, username=session['username'], value=0)

@app.route('/dashboard')
def dashboard():
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

    return render_template('dashboard.html', dieta=dietadata, dinamico=dinamicodata, estatico=estaticodata, objetivo=objetivodata, title='Vista Principal', username=session['username'], agua=agua, abdomen=abdomen, abdcatrisk=abdcatrisk, bodyscore=bodyscore, categoria=categoria, habitperformance=habitperformance, deltapeso=deltapeso, deltapg=deltapg, deltapm=deltapm, ffmi=ffmi, imc=imc, bf=bf, deltaimc=deltaimc, listaimc=listaimc, deltaffmi=deltaffmi, listaffmi=listaffmi, deltabf=deltabf, listabf=listabf, bfcat=bfcat, immccat=immccat, imccat=imccat, solver_category=solver_category)

### FUNCIÓN DE MANTENIMIENTO ###

@app.route('/mantenimiento')
def mantenimiento():
    return render_template('mantenimiento.html', title='Mantenimiento')

### FUNCIÓN DEL ESTANDAR DE FUERZA ###

@app.route('/strengthstandard')
def strengthstandard():
    update_form = forms.UpdateForm(request.form)
    return render_template('strength.html', title='Strength Standard', form=update_form, username=session['username'], value=0)

@app.route('/api/lifts', methods=['POST'])
def add_lift():
    # Parsear el JSON recibido en la solicitud
    data = request.json
    print(data)
    try:
        data = request.json
        if not data:
            raise ValueError("No se recibieron datos válidos")
        
        # Aquí estaría tu lógica para manejar los datos
        
        return jsonify({"message": "Datos guardados correctamente"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Ocurrió un error inesperado"}), 500

@app.route('/api/submit-strength-results', methods=['POST'])
def submit_strength_results():
    data = request.json  # Obtener los datos enviados en la solicitud
    csrf_token = request.headers.get('X-CSRFToken')
    # Aquí puedes agregar la lógica para procesar los datos...
    return jsonify({"status": "success", "message": "Datos recibidos correctamente"}), 200


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
        try:
            email=login_form.email.data
            basededatos = sqlite3.connect('src/Basededatos')
            cursor = basededatos.cursor()
            cursor.execute(
                'SELECT NOMBRE_APELLIDO, DNI FROM PERFILESTATICO WHERE EMAIL=?', [email])
            datos = cursor.fetchone()
            username = datos[0]
            password = datos[1]
            if str(password) == str(login_form.password.data):
                success_message = 'Bienvenido {} !'.format(username)
                flash(success_message)
                session['username'] = username
                return redirect(url_for('dashboard'))
            else:
                error_message = 'Ingrese su numero de documento.'
                flash(error_message)
        except:
            error_message = 'El correo ingresado no se encuentra registrado. Hablar con el Administrador.'
            flash(error_message)
            return render_template('login.html', title='Ingrese su usuario', form=login_form)        
    return render_template('login.html', title='Ingrese su usuario', form=login_form)

### FUNCIÓN PARA DESLOGUEARSE ###

@app.route('/logout')
def logout():
    if 'username' in session:
        session.pop('username')
    return redirect(url_for('home'))
    
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