from gekko import GEKKO

def strengthdistfx(squat, floorpull, horizontalpress, verticalpress, pulluprow, diasdeentrenamiento, numerodeejercicios):
    # Initialize Model
    m = GEKKO(remote=False)

    #help(m)

    #SCORES

    error=0

    multiplier=10

    scores=(squat,floorpull,horizontalpress,verticalpress,pulluprow)

    maxscore=max(scores)

    #define parameter
    #eq = m.Param(value=40)

    #initialize variables
    x1,x2,x3,x4,x5,x6 = [m.Var() for i in range(6)]

    #initial values
    x1.value = squat
    x2.value = floorpull
    x3.value = horizontalpress
    x4.value = verticalpress
    x5.value = pulluprow
    x6.value = 1

    #lower bounds
    #x1.lower = 1
    #x2.lower = 1
    #x3.lower = 1
    #x4.lower = 1
    #x6.lower = 0

    #upper bounds
    #x1.upper = 5
    #x2.upper = 5
    #x3.upper = 5
    #x4.upper = 5
    #x6.lower = 5

    Total=numerodeejercicios*diasdeentrenamiento

    #Equations
    m.Equation(maxscore*x6/x1+maxscore*x6/x2+maxscore*x6/x3+maxscore*x6/x4+maxscore*x6/x5==Total)
    m.Equation(maxscore*x6/x1<diasdeentrenamiento)
    m.Equation(maxscore*x6/x2<diasdeentrenamiento)
    m.Equation(maxscore*x6/x3<diasdeentrenamiento)
    m.Equation(maxscore*x6/x4<diasdeentrenamiento)
    m.Equation(maxscore*x6/x5<diasdeentrenamiento)

    #Objective
    m.Minimize((squat-x1)**2+(floorpull-x2)**2+(horizontalpress-x3)**2+(verticalpress-x4)**2+(pulluprow-x5)**2)

    #Set global options
    #m.options.IMODE = 3 #steady state optimization
    m.options.SOLVER = 1

    #Solve simulation
    m.solve(disp=False) # solve on public server


    varsquat=x1.value[0]
    varfloorpull=x2.value[0]
    varhorizontalpress=x3.value[0]
    varverticalpress=x4.value[0]
    varpulluprow=x5.value[0]
    multiplier=x6.value[0]

    numerodeejerciciossemanal=round(maxscore*multiplier/varsquat)+round(maxscore*multiplier/varfloorpull)+round(maxscore*multiplier/varhorizontalpress)+round(maxscore*multiplier/varverticalpress)+round(maxscore*multiplier/varpulluprow)

    while numerodeejerciciossemanal!=numerodeejercicios*diasdeentrenamiento:
        if numerodeejerciciossemanal>numerodeejercicios*diasdeentrenamiento:
            multiplier=multiplier-0.01
        elif numerodeejerciciossemanal<numerodeejercicios*diasdeentrenamiento:
            multiplier=multiplier+0.01
        numerodeejerciciossemanal=round(maxscore*multiplier/varsquat)+round(maxscore*multiplier/varfloorpull)+round(maxscore*multiplier/varhorizontalpress)+round(maxscore*multiplier/varverticalpress)+round(maxscore*multiplier/varpulluprow)

    print("Solucionado el multiplicador")
    
    qsquat=round(maxscore*multiplier/varsquat)
    qfloorpull=round(maxscore*multiplier/varfloorpull)
    qhpress=round(maxscore* multiplier /varhorizontalpress)
    qvpress=round(maxscore*multiplier/varverticalpress)
    qpullrow=round(maxscore*multiplier/varpulluprow)

    return qsquat, qfloorpull, qhpress, qvpress, qpullrow, numerodeejercicios, diasdeentrenamiento

def exerdistfx(symmetry, strengthdist):
    minus=min(symmetry.values())
    symmetryfix={}
    for i in symmetry:
        if symmetry[i]!='':
            symmetryfix[i]=symmetry[i]-minus+1
    
    lstsquat=["bs", "fs"]
    lstfloorpull=["dl", "sdl", "cl"]
    lsthpress=["bp", "ibp", "dip"]
    lstvpress=["op", "pp", "sp"]
    lstpulluprow=["cu", "pu", "pr"]

    lst=[lstsquat, lstfloorpull, lsthpress, lstvpress, lstpulluprow]

    k=0
    for i in lst:
        data=[]
        for j in i:
            if symmetryfix.get(j)!=None:
                data.append(symmetryfix.get(j))
            else:
                pass
        max(data)
        suma=0
        for j in range(len(data)):
            suma+=(max(data)/data[j])
        
        # MULTIPLICADOR
        
        multiplier2=strengthdist[k]/suma

        exesemanal=0
        for j in range(len(data)):
            exesemanal+=round(max(data)*multiplier2/data[j])

        while exesemanal!=strengthdist[k]:
            if exesemanal>strengthdist[k]:
                multiplier2=multiplier2-.01
            elif exesemanal<strengthdist[k]:
                multiplier2=multiplier2+.01
            exesemanal=0
            for j in range(len(data)):
                exesemanal+=round(max(data)*multiplier2/data[j])

        exeweek={}
        l=0
        for j in i:
            if symmetryfix.get(j)!=None:
                exeweek[j]=round(max(data)*multiplier2/data[l])
            else:
                pass
            l+=1

        print(exeweek)
        k=k+1

    return


strengthdist=strengthdistfx(55.3,48.1,63.2,57,63.6,6,4)
symmetry={'bs':-10, 'fs':-6, 'dl':-21, 'sdl':-17, 'bp':-7, 'ibp':8, 'op':0, 'cu':0, 'pu':-5, 'pr':8}
exerdist=exerdistfx(symmetry, strengthdist)




