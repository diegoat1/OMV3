from wtforms import Form
from wtforms import StringField
from wtforms import TextField
from wtforms import PasswordField
from wtforms import HiddenField
from wtforms import IntegerField
from wtforms import FloatField
from wtforms import BooleanField
from wtforms import DateField
from wtforms import validators
from wtforms import TimeField
from wtforms import RadioField
from wtforms import FieldList
from wtforms import FormField
from wtforms import SelectField
from wtforms import FileField
from wtforms.widgets import ListWidget
from wtforms.fields.html5 import EmailField
from wtforms.fields.html5 import DateField
from wtforms.fields.html5 import TimeField
from wtforms.fields.html5 import DateTimeField
from wtforms.validators import DataRequired, NumberRange
import sqlite3
import functions

def length_honeypot(form, field):
    if len(field.data) > 0:
        raise validators.ValidationError('El campo debe estar vacio')

class LoginForm(Form):
    email=StringField('Correo electrónico: ', [validators.Required(message='El correo electrónico es requerido.')])
    password = PasswordField('Contraseña: ', [validators.Required(message='El password es requerido.')])

    #def __init__(self, *args, **kwargs):
    #    super(LoginForm, self).__init__(*args, **kwargs)
    #    self.username.choices = functions.creadordelista()

class CommentForm(Form):
    username=StringField('Nombre de usuario: ', 
    [validators.length(min=4, max=25, message='Ingrese un nombre de usuario valido.'),
    validators.Required(message='El nombre de usuario es requerido.')])
    email=EmailField('Correo Electronico: ',
    [validators.Required(message='El correo electronico es requerido.'), validators.Email(message='Ingrese un email valido.')])
    comment=TextField('Comentario: ')

class CreatefoodForm(Form):
    namefood=StringField('Descripción del alimento: ', [validators.Required(message='La descripción del alimento es requerido.'), validators.length(min=4, max=50, message='Ingrese una descripción valida.')])
    prot=StringField('Proteínas en 100 gr.: ', [validators.Required(message='Los gramos de proteínas son requeridos.'), validators.length(min=0, max=8, message='Ingrese un numero en gramos válido.')])
    fat=StringField('Grasas en 100 gr.: ', [validators.Required(message='Los gramos de grasas son requeridos.'), validators.length(min=0, max=8, message='Ingrese un numero en gramos válido.')])
    ch=StringField('Carbohidratos en 100 gr.: ', [validators.Required(message='Los gramos de carbohidratos son requeridos.'), validators.length(min=0, max=8, message='Ingrese un numero en gramos válido.')])
    fiber=StringField('Fibras en 100 gr.: ', [validators.Required(message='Los gramos de fibra son requeridos.'), validators.length(min=0, max=8, message='Ingrese un numero en gramos válido.')])
    gr1=StringField('Gramos de la presentación "1": ', [validators.Required(message='Los gramos de la presentación "1" son requeridos.'), validators.length(min=0, max=8, message='Ingrese un numero en gramos válido.')])
    p1=StringField('Descripción de la presentación "1": ', [validators.Required(message= 'La descripción de la presentación "1" es requerida.')])
    gr2=StringField('Gramos de la presentación "2": ')
    p2=StringField('Descripción de la presentación "2": ')

class CreateForm(Form):
    nameuser=StringField('Apellido y nombre: ', [validators.Required(message='El apellido y nombre es requerido.'), validators.length(min=4, max=50, message='Ingrese un apellido y nombre valido.')])
    dni=StringField('Numero de documento: ', [validators.Required(message='El numero de documento es requerido.'), validators.length(min=8, max=8, message='Ingrese un numero de documento valido')])
    email=EmailField('Correo Electronico: ',
    [validators.Required(message='El correo electronico es requerido.'), validators.Email(message='Ingrese un email valido.')])
    fdn=DateField('Fecha de nacimiento: ', [validators.Required(message='La fecha de nacimiento es requerida.')])
    numtel=StringField('Número de teléfono: ', [validators.Required(message='El número de teléfono es requerido.'), validators.length(min=10, max=10, message='Ingrese un número de teléfono valido.')])
    sexo=SelectField('Sexo: ', [validators.Required(message='El sexo es requerido.')], choices=[('M', 'Masculino'), ('F', 'Femenino')])
    estatura=FloatField('Estatura (en cm.): ', [validators.Required(message= 'La estatura es requerida.'), validators.number_range(min=100, max=250, message='Ingrese una altura valida. Debe ser en centimetros.')])
    ccuello=FloatField('Circ. del cuello (en cm.): ', [validators.Required(message= 'La circunferencia del cuello es requerida.'), validators.number_range(min=20, max=60, message='Ingrese una circunferencia de cuello valida. Debe ser en centimetros.')])
    cmuneca=FloatField('Circ. de la muñeca (en cm.): ', [validators.Required(message= 'La circunferencia de la muñeca es requerida.'), validators.number_range(min=10, max=50, message='Ingrese una circunferencia de muñeca valida. Debe ser en centimetros.')])
    ctobillo=FloatField('Circ. del tobillo (en cm.): ', [validators.Required(message= 'La circunferencia del tobillo es requerida.'), validators.number_range(min=10, max=60, message='Ingrese una circunferencia de tobillo valida. Debe ser en centimetros.')])
    #lista=RadioField('Lista: ', choices=[('1', 'lista 1'), ('2', 'lista 2')])
    #checkbox=BooleanField('Check: ')

class UpdateForm(Form):
    nameuser=SelectField('Apellido y nombre: ', [validators.Required(message='El apellido y nombre es requerido.')])
    fdr=DateField('Fecha de registro: ', [validators.Required(message='La fecha de registro es requerida.')])
    ccin=FloatField('Circ. de la cintura (en cm.): ')
    cabd=FloatField('Circ. del abdomen (en cm.): ')
    ccad=FloatField('Circ. de la cadera (en cm.): ')
    peso=FloatField('Peso (en kg.): ', [validators.Required(message= 'El peso es requerido.')])
    #descheck=BooleanField('Desayuno: ')
    #mmcheck=BooleanField('Media-mañana: ')
    #almcheck=BooleanField('Almuerzo: ')
    #mercheck=BooleanField('Merienda: ')
    #mtcheck=BooleanField('Media-tarde: ')
    #cencheck=BooleanField('Cena: ')
    #cruces=IntegerField('Cruces: ', [validators.Required(message= 'El número de cruces es requerido.')])
    #controlcheck=BooleanField('Solo control: ', default='checked')
    #dias=[('0', '0'),('1', '1'),('2', '2'),('3', '3'),('4', '4'),('5', '5'),('6', '6'),('7', '7')]
    #P1=SelectField('Pregunta 1: ', choices=dias)
    #P2=TimeField(' Pregunta 2: ', format='%H:%M')
    #P3=SelectField('Pregunta 3: ', choices=dias)
    #P4=TimeField(' Pregunta 4: ', format='%H:%M')
    #P5=SelectField('Pregunta 5: ', choices=dias)
    #P6=TimeField(' Pregunta 6: ', format='%H:%M')

    def __init__(self, *args, **kwargs):
        super(UpdateForm, self).__init__(*args, **kwargs)
        self.nameuser.choices = functions.creadordelista()

class goalForm(Form):
    nameuser=SelectField('Apellido y nombre: ', [validators.Required(message='El apellido y nombre es requerido.')])
    goalimmc=FloatField('Índice de masa magra corporal deseada: ')
    goalbf=FloatField('Porcentaje de grasa corporal deseada: ')

    def __init__(self, *args, **kwargs):
        super(goalForm, self).__init__(*args, **kwargs)
        self.nameuser.choices = functions.creadordelista()

class PlannerForm(Form):
    nameuser=SelectField('Apellido y nombre: ', [validators.Required(message='El apellido y nombre es requerido.')])
    cal=FloatField('Calorias: ', [validators.Required(message= 'Las calorias son requeridas.')])
    desplan=BooleanField('Realiza el desayuno: ')
    mmplan=BooleanField('Realiza la media mañana: ')
    almplan=BooleanField('Realiza el almuerzo: ')
    merplan=BooleanField('Realiza la merienda: ')
    mtplan=BooleanField('Realiza la media tarde: ')
    cenplan=BooleanField('Realiza la cena: ')
    tamaños=[('0','Muy pequeña'), ('1','Pequeña'), ('2','Normal'), ('3','Grande'), ('4','Muy grande')]
    tamdes=SelectField('Tamaño de la porción: ', choices=tamaños)
    tammm=SelectField('Tamaño de la porción: ', choices=tamaños)
    tamalm=SelectField('Tamaño de la porción: ', choices=tamaños)
    tammer=SelectField('Tamaño de la porción: ', choices=tamaños)
    tammt=SelectField('Tamaño de la porción: ', choices=tamaños)
    tamcen=SelectField('Tamaño de la porción: ', choices=tamaños)
    menues=[('Desayuno','Desayuno'), ('Media-mañana','Media-mañana'), ('Almuerzo','Almuerzo'), ('Merienda','Merienda'), ('Media-tarde','Media-tarde'), ('Cena','Cena'), ('6', 'Sin definir')]
    entreno=SelectField('Entrenamiento despues de: ', choices=menues)
    libertad=IntegerField('Grado de libertad: ', [validators.Required(message='Se necesita que definas un grado de libertad.')])

    def __init__(self, *args, **kwargs):
        super(PlannerForm, self).__init__(*args, **kwargs)
        self.nameuser.choices = functions.creadordelista()

class CustomPlannerForm(Form):
    nameuser=SelectField('Apellido y nombre: ', [validators.Required(message='El apellido y nombre es requerido.')])
    prot=FloatField('Proteínas: ', [validators.Required(message= 'Las proteínas son requeridas.')])
    grasa=FloatField('Grasas: ', [validators.Required(message= 'Las grasas son requeridas.')])
    ch=FloatField('Carbohidratos: ', [validators.Required(message= 'Los carbohidratos son requeridos.')])

    def __init__(self, *args, **kwargs):
        super(CustomPlannerForm, self).__init__(*args, **kwargs)
        self.nameuser.choices = functions.creadordelista()

class RecipecreateForm(Form):
    recipename=StringField('Nombre de la receta: ', [validators.Required(message='El nombre de la receta es requerido.')])

    #Alimentos dependientes

    food1=SelectField('Alimento dependiente 1: ')
    foodsize1=SelectField('Tamaño de la porción 1: ', choices=[])
    valfood1=FloatField('Valor del alimento 1: ')
    relfood1=SelectField('En relación/porción fija: ', choices=[(-1, ''),(0, 'En relacion a'), (1, 'Porción fija')])
    reffood1=SelectField('Alimento 1 respecto a: ', choices=[(-1,''),(0,1),(1,2),(2,3)])
    food2=SelectField('Alimento dependiente 2: ')
    foodsize2=SelectField('Tamaño de la porción 2: ', choices=[])
    valfood2=FloatField('Valor del alimento 2: ')
    relfood2=SelectField('En relación/porción fija: ', choices=[(-1, ''),(0, 'En relacion a'), (1, 'Porción fija')])
    reffood2=SelectField('Alimento 2 respecto a: ', choices=[(-1,''),(0,1),(1,2),(2,3)])
    food3=SelectField('Alimento dependiente 3: ')
    foodsize3=SelectField('Tamaño de la porción 3: ', choices=[])
    valfood3=FloatField('Valor del alimento 3: ')
    relfood3=SelectField('En relación/porción fija: ', choices=[(-1, ''),(0, 'En relacion a'), (1, 'Porción fija')])
    reffood3=SelectField('Alimento 3 respecto a: ', choices=[(-1,''),(0,1),(1,2),(2,3)])
    food4=SelectField('Alimento dependiente 4: ')
    foodsize4=SelectField('Tamaño de la porción 4: ', choices=[])
    valfood4=FloatField('Valor del alimento 4: ')
    relfood4=SelectField('En relación/porción fija: ', choices=[(-1, ''),(0, 'En relacion a'), (1, 'Porción fija')])
    reffood4=SelectField('Alimento 4 respecto a: ', choices=[(-1,''),(0,1),(1,2),(2,3)])
    food5=SelectField('Alimento dependiente 5: ')
    foodsize5=SelectField('Tamño de la porción 5: ', choices=[])
    valfood5=FloatField('Valor del alimento 5: ')
    relfood5=SelectField('En relación/porción fija: ', choices=[(-1, ''),(0, 'En relacion a'), (1, 'Porción fija')])
    reffood5=SelectField('Alimento 5 respecto a: ', choices=[(-1,''),(0,1),(1,2),(2,3)])
    food6=SelectField('Alimento dependiente 6: ')
    foodsize6=SelectField('Tamaño de la porción 6: ', choices=[])
    valfood6=FloatField('Valor del alimento 6: ')
    relfood6=SelectField('En relación/porción fija: ', choices=[(-1, ''),(0, 'En relacion a'), (1, 'Porción fija')])
    reffood6=SelectField('Alimento 6 respecto a: ', choices=[(-1,''),(0,1),(1,2),(2,3)])
    food7=SelectField('Alimento dependiente 7: ')
    foodsize7=SelectField('Tamaño de la porción 7: ', choices=[])
    valfood7=FloatField('Valor del alimento 7: ')
    relfood7=SelectField('En relación/porción fija: ', choices=[(-1, ''),(0, 'En relacion a'), (1, 'Porción fija')])
    reffood7=SelectField('Alimento 7 respecto a: ', choices=[(-1,''),(0,1),(1,2),(2,3)])
    food8=SelectField('Alimento dependiente 8: ')
    foodsize8=SelectField('Tamaño de la porción 8: ', choices=[])
    valfood8=FloatField('Valor del alimento 8: ')
    relfood8=SelectField('En relación/porción fija: ', choices=[(-1, ''),(0, 'En relacion a'), (1, 'Porción fija')])
    reffood8=SelectField('Alimento 8 respecto a: ', choices=[(-1,''),(0,1),(1,2),(2,3)])
    food9=SelectField('Alimento dependiente 9: ')
    foodsize9=SelectField('Tamaño de la porción 9: ', choices=[])
    valfood9=FloatField('Valor del alimento 9: ')
    relfood9=SelectField('En relación/porción fija: ', choices=[(-1, ''),(0, 'En relacion a'), (1, 'Porción fija')])
    reffood9=SelectField('Alimento 1 respecto a: ', choices=[(-1,''),(0,1),(1,2),(2,3)])
    food10=SelectField('Alimento dependiente 10: ')
    foodsize10=SelectField('Tamaño de la porción 10: ', choices=[])
    valfood10=FloatField('Valor del alimento 10: ')
    relfood10=SelectField('En relación/porción fija: ', choices=[(-1, ''),(0, 'En relacion a'), (1, 'Porción fija')])
    reffood10=SelectField('Alimento 10 respecto a: ', choices=[(-1,''),(0,1),(1,2),(2,3)])

    #Alimentos independientes

    foodi1=SelectField('Alimentos independiente 1: ')
    foodisize1=SelectField('Tamaño de la porción 1: ', choices=[])
    foodi2=SelectField('Alimentos independiente 2: ')
    foodisize2=SelectField('Tamaño de la porción 2: ', choices=[])
    foodi3=SelectField('Alimentos independiente 3: ')
    foodisize3=SelectField('Tamaño de la porción 3: ', choices=[])
    
    def __init__(self, *args, **kwargs):
        super(RecipecreateForm, self).__init__(*args, **kwargs)
        self.foodi1.choices = functions.listadealimentos()
        self.foodi2.choices = functions.listadealimentos()
        self.foodi3.choices = functions.listadealimentos()
        self.food1.choices = functions.listadealimentos()
        self.food2.choices = functions.listadealimentos()
        self.food3.choices = functions.listadealimentos()
        self.food4.choices = functions.listadealimentos()
        self.food5.choices = functions.listadealimentos()
        self.food6.choices = functions.listadealimentos()
        self.food7.choices = functions.listadealimentos()
        self.food8.choices = functions.listadealimentos()
        self.food9.choices = functions.listadealimentos()
        self.food10.choices = functions.listadealimentos()


class RecipeForm(Form):
    momento=[('Desayuno','Desayuno'), ('Media-mañana','Media-mañana'), ('Almuerzo','Almuerzo'), ('Merienda','Merienda'), ('Media-tarde','Media-tarde'), ('Cena','Cena')]
    menues=SelectField('Momento de la comida: ', [validators.Required(message='Debe seleccionar algún momento del día.')], choices=momento)
    receta=SelectField('Seleccione una receta: ', [validators.Required(message='Debe seleccionar una de las recetas.')])

    def __init__(self, *args, **kwargs):
        super(RecipeForm, self).__init__(*args, **kwargs)
        self.receta.choices = functions.listadereceta()

def get_all_food_groups():
    basededatos = sqlite3.connect('src/Basededatos')
    cursor = basededatos.cursor()
    cursor.execute("SELECT CATEGORÍA FROM GRUPOSALIMENTOS")
    all_food_groups = cursor.fetchall()
    cursor.close()
    basededatos.close()
    return all_food_groups

class DietForm(Form):
    all_food_groups = get_all_food_groups()
    nutrients = ['Proteinas', 'Grasas totales', 'Carbohidratos', 'Fibra dietaria', 'Azucar total', 'Calcio', 'Hierro', 'Magnesio', 'Fósforo', 'Potasio', 'Sodio', 'Zinc', 'Vitaminas', 'Acidos grasos']

    for group_name_tuple in all_food_groups:
        group_name = group_name_tuple[0]
        locals()[f"alimento_{group_name}_incluir"] = BooleanField(f'Incluir {group_name}', default="checked")

    for nutrient in nutrients:
        locals()[f"nutriente_{nutrient}_incluir"] = BooleanField(f'Incluir {nutrient}', default="checked")

