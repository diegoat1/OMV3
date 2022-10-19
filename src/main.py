from flask import Flask, render_template, request, make_response, session, redirect, url_for, flash, jsonify
from flask_wtf import CSRFProtect
import sqlite3

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
    if 'username' in session and username != 'Toffaletti, Diego Alejandro' and request.endpoint in ['create', 'login', 'update', 'planner', 'recipecreator']:
        return redirect(url_for('home'))
    if 'username' not in session and request.endpoint in ['create', 'recipe', 'update', 'planner', 'recipecreator']:
        return redirect(url_for('login'))

### PÁGINA EN MANTENIMIENTO ###

@app.route('/')
def home():
    if 'username' in session:
        username = session['username']
        return redirect(url_for('dashboard'))
    #return render_template('home.html', title='Página principal')
    return redirect("https://linktr.ee/omeganutricion", code=302)

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
    
    bodycat=["Obeso", "Sobrepeso", "Robusto", "Falto de ejercicio", "Balanceado", "Balanceado muscular", "Delgado", "Balanceado delgado", "Delgado muscular"]
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
    try:
        habitperformance=round(idealdays/dinamicodata[-1][29]*100)
    except:
        habitperformance=0

    deltapeso=round(dinamicodata[-1][13]*1000)
    deltapg=round(dinamicodata[-1][15]*1000)
    deltapm=round(dinamicodata[-1][17]*1000)

    deltaimc=round((dinamicodata[-1][8]-dinamicodata[-2][8])*100/dinamicodata[-2][8],1)
    deltaffmi=round((dinamicodata[-1][9]-dinamicodata[-2][9])*100/dinamicodata[-2][9],1)
    deltabf=round((dinamicodata[-1][7]-dinamicodata[-2][7])*100/dinamicodata[-2][7],1)

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

    return render_template('dashboard.html', dieta=dietadata, dinamico=dinamicodata, estatico=estaticodata, objetivo=objetivodata, title='Vista Principal', username=session['username'], agua=agua, abdomen=abdomen, abdcatrisk=abdcatrisk, bodyscore=bodyscore, categoria=categoria, habitperformance=habitperformance, deltapeso=deltapeso, deltapg=deltapg, deltapm=deltapm, ffmi=ffmi, imc=imc, bf=bf, deltaimc=deltaimc, listaimc=listaimc, deltaffmi=deltaffmi, listaffmi=listaffmi, deltabf=deltabf, listabf=listabf)

@app.route('/mantenimiento')
def mantenimiento():
    return render_template('mantenimiento.html', title='Mantenimiento')

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

### FUNCIÓN PARA ELIMINAR PERFILES DINAMICOS ###

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
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    cursor.execute('SELECT * FROM RECETAS')
    recipedata= cursor.fetchall()
    cursor.execute('SELECT * FROM ALIMENTOS')
    alimentodata= cursor.fetchall()
    cursor.execute('SELECT * FROM DIETA')
    dietadata=cursor.fetchall()
    cursor.execute('SELECT * FROM PERFILDINAMICO ORDER BY FECHA_REGISTRO DESC')
    dinamicodata=cursor.fetchall()
    cursor.execute('SELECT * FROM PERFILESTATICO')
    estaticodata=cursor.fetchall()
    cursor.execute('SELECT * FROM OBJETIVO')
    objetivodata=cursor.fetchall()
    return render_template('databasemanager.html', recipes=recipedata, alimento=alimentodata, dieta=dietadata, dinamico=dinamicodata, estatico=estaticodata, objetivo=objetivodata, title='Administrador de base de datos', username=session['username'])

### FUNCIÓN PARA CORRER LA APLICACIÓN

if __name__ == '__main__':
    app.config['TEMPLATES AUTO_RELOAD'] = True
    app.run(debug=True, port=8000)