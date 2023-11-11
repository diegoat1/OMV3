import sqlite3
from datetime import datetime
import forms
import functions


# import pandas lib as pd
import pandas as pd
 
# read by default 1st sheet of an excel file
df = pd.read_excel('./src/Perfil variable.xlsx')

#for i in df.index:
    #print(i.index)
#    pass

c = list(df.columns)

i = list(df.index)
#print(i)

basededatos = sqlite3.connect('src/Basededatos')
cursor = basededatos.cursor()

for i in i:
    list=[]
    for j in range(0,6):
        data=df.iloc[i,j]
        list.append(data)
    nameuser=str(list[0])
    fdr=list[1].date()
    peso=list[5]
    cursor.execute('SELECT SEXO FROM PERFILESTATICO WHERE NOMBRE_APELLIDO=?', [nameuser])
    sexo=cursor.fetchone()[0]
    if sexo=='M':
        cabd=list[4]
        ccin=0
        ccad=0
    else:
        ccin=list[2]
        cabd=0
        ccad=list[3]

    datos=(nameuser, str(fdr), peso, cabd, ccin, ccad)
    #print(datos)
    functions.actualizarperfil(nameuser, fdr, peso, cabd, ccin, ccad)