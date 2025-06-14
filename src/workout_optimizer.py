import pulp

# ---------- 1. Datos --------------------------------------------------
MUSCLES = {
    "backSquat": ["glutes", "spinal erectors", "abdominals",
                  "hip flexors", "hip adductors", "quads", "hamstring"],
    "frontSquat": ["glutes", "spinal erectors", "abdominals",
                   "hip flexors", "hip adductors", "quads", "hamstring"],
    "deadlift": ["upper traps", "middle traps", "spinal erectors",
                 "lats & teres major", "forearms", "hip adductors",
                 "hamstring", "glutes", "quads", "abdominals",
                 "obliques & serratus"],
    "sumoDeadlift": ["upper traps", "middle traps", "spinal erectors",
                     "lats & teres major", "forearms", "hip adductors",
                     "hamstring", "glutes", "quads", "abdominals",
                     "obliques & serratus", "hip flexors"],
    "powerClean": ["upper traps", "middle traps", "spinal erectors",
                   "forearms", "hip adductors", "hamstring", "glutes",
                   "quads", "abdominals", "obliques & serratus", "calves"],
    "benchPress": ["pecs (sternal head)", "pecs (clavicular head)",
                   "delts (anterior)", "triceps", "lats & teres major"],
    "inclineBenchPress": ["pecs (sternal head)", "pecs (clavicular head)",
                          "delts (anterior)", "triceps", "lats & teres major"],
    "dip": ["pecs (sternal head)", "pecs (clavicular head)",
            "delts (anterior)", "triceps", "lower traps"],
    "overheadPress": ["upper traps", "middle traps", "lower traps",
                      "pecs (clavicular head)", "delts (anterior)",
                      "delts (lateral)", "triceps", "abdominals"],
    "pushPress": ["upper traps", "middle traps", "lower traps",
                  "delts (anterior)", "delts (lateral)", "triceps",
                  "abdominals", "glutes", "quads", "hip adductors", "calves"],
    "snatchPress": ["upper traps", "middle traps", "lower traps",
                    "pecs (clavicular head)", "delts (anterior)",
                    "delts (lateral)", "triceps", "abdominals"],
    "chinup": ["biceps", "forearms", "obliques & serratus", "abdominals",
               "lats & teres major", "lower traps", "middle traps",
               "rotator cuff", "delts (posterior)"],
    "pullup": ["biceps", "forearms", "obliques & serratus", "abdominals",
               "lats & teres major", "lower traps", "middle traps",
               "rotator cuff", "delts (posterior)"],
    "pendlayRow": ["biceps", "forearms", "obliques & serratus", "abdominals",
                   "lats & teres major", "lower traps", "middle traps",
                   "rotator cuff", "delts (posterior)", "spinal erectors"],
}

# ---------------------------------------------------------------------
def optimize_split(sessions: dict,
                   days: int,
                   ex_per_day: int,
                   weight_same: int = 3,
                   weight_consec: int = 1,
                   solver=pulp.PULP_CBC_CMD(msg=False)):
    """
    sessions      : {'backSquat': 2, 'deadlift': 1, ...}
    days          : Nº de días de la rutina
    ex_per_day    : ejercicios por día (fijo)
    weight_same   : penalización "mismo día"
    weight_consec : penalización "días consecutivos"
    """
    exercises = list(sessions)
    muscles   = sorted({m for lst in MUSCLES.values() for m in lst})
    M         = ex_per_day                           # cota superior útil

    prob = pulp.LpProblem("WorkoutPlanner", pulp.LpMinimize)

    # ---------- variables principales x_{e,d}
    x = {(e, d): pulp.LpVariable(f"x_{e}_{d}", cat="Binary")
         for e in exercises for d in range(days)}

    # ---------- contar cuántas veces se entrena cada músculo en cada día
    n = {(m, d): pulp.LpVariable(f"n_{m}_{d}", lowBound=0,
                                 upBound=M, cat="Integer")
         for m in muscles for d in range(days)}

    # ---------- flags para contar penalizaciones
    # w[m,d,r] = 1 si el músculo m aparece al menos r+1 veces en el día d
    # donde r es el nivel de repetición (1=2 veces, 2=3 veces, etc.)
    max_reps = min(ex_per_day, 5)  # Límite por practicidad computacional
    w = {(m, d, r): pulp.LpVariable(f"w_{m}_{d}_{r}", cat="Binary")
         for m in muscles for d in range(days) for r in range(1, max_reps)}
    y = {(m, d): pulp.LpVariable(f"y_{m}_{d}", cat="Binary")
         for m in muscles for d in range(days)}        # m ≥1 en día d
    # m en día d y día (d+1) % days (cíclico)
    z = {}
    if days > 0: # z solo tiene sentido si hay días
        z = {(m, d): pulp.LpVariable(f"z_{m}_{d}", cat="Binary")
             for m in muscles for d in range(days)}

    # ---------- (1) nº de sesiones por ejercicio
    for e in exercises:
        prob += pulp.lpSum(x[e, d] for d in range(days)) == sessions[e]

    # ---------- (2) tamaño de cada día
    for d in range(days):
        prob += pulp.lpSum(x[e, d] for e in exercises) == ex_per_day

    # ---------- (3) definición de n_{m,d}
    for m in muscles:
        for d in range(days):
            prob += n[m, d] == pulp.lpSum(
                x[e, d] for e in exercises if m in MUSCLES[e])

    # ---------- (4–5) activar w_{m,d,r} ⇔ n >= r+1
    for m in muscles:
        for d in range(days):
            for r in range(1, max_reps):
                # w[m,d,r] = 1 si y solo si n[m,d] >= r+1
                
                # Si n[m,d] >= r+1, entonces w[m,d,r] = 1
                prob += n[m, d] - r >= 1 - M * (1 - w[m, d, r])  
                
                # Si n[m,d] <= r, entonces w[m,d,r] = 0
                prob += n[m, d] <= r + M * w[m, d, r]

    # ---------- (6–7) activar y_{m,d} ⇔ n >= 1
    for m in muscles:
        for d in range(days):
            prob += y[m, d] * M >= n[m, d]
            prob += y[m, d] <= n[m, d]

    # ---------- (8–10) activar z_{m,d} ⇔ y_{m,d}=y_{m,(d+1)%days}=1 (cíclico)
    if days > 0: # Estas restricciones solo aplican si hay días
        for m in muscles:
            for d in range(days):
                d_next = (d + 1) % days
                prob += z[m, d] <= y[m, d]
                prob += z[m, d] <= y[m, d_next]
                prob += z[m, d] >= y[m, d] + y[m, d_next] - 1

    # ---------- objetivo con penalización exponencial
    # Para cada músculo y día, sumamos 3^r por cada nivel de repetición r
    # Así la penalización es: 
    # - 2 ejercicios (r=1): 3^1 = 3 puntos
    # - 3 ejercicios (r=1,2): 3^1 + 3^2 = 12 puntos
    # - 4 ejercicios (r=1,2,3): 3^1 + 3^2 + 3^3 = 39 puntos
    same_day_penalty = pulp.LpAffineExpression()
    for m in muscles:
        for d in range(days):
            for r in range(1, max_reps):
                same_day_penalty += (3**r) * w[m, d, r]
    
    # Función objetivo total
    prob += (same_day_penalty + 
             weight_consec * pulp.lpSum(z.values()))

    # ---------- resolver
    status = prob.solve(solver)
    
    # Ya no imprimimos el estado de la solución
    if prob.status != pulp.LpStatusOptimal:
        # Solo en caso de error mostramos un mensaje
        print(f"ATENCIÓN: No se encontró la solución óptima. Estado: {pulp.LpStatus[prob.status]}")
    
    # ---------- salida
    grid = {d: [] for d in range(days)}
    for e in exercises:
        for d in range(days):
            if pulp.value(x[e, d]) > 0.5:  # x binaria activada
                grid[d].append(e)
                
    # Calcular penalty usando el valor de la función objetivo del problema
    optimizer_penalty = pulp.value(prob.objective)
    
    # Devolvemos el valor que calcula el optimizador
    # Debería coincidir con el de explain_penalty
    return grid, optimizer_penalty


def explain_penalty(grid, weight_same=3, weight_consec=1):
    """
    Explica detalladamente cómo se calculó la penalización para un plan de entrenamiento
    
    grid: Diccionario {día: [ejercicios]} con el plan de entrenamiento
    weight_same: penalización por repetir músculos el mismo día
    weight_consec: penalización por entrenar músculos en días consecutivos
    """
    days = sorted(grid.keys())
    total_penalty = 0
    details = {"same_day": {}, "consecutive": {}}
    
    # Para cada día, encontrar músculos repetidos (mismo día)
    for d in days:
        # Músculos entrenados en cada día
        day_muscles = {}
        for exercise in grid[d]:
            if exercise in MUSCLES:
                for muscle in MUSCLES[exercise]:
                    day_muscles[muscle] = day_muscles.get(muscle, 0) + 1
        
        # Calcular penalización por músculos repetidos el mismo día (exponencial)
        for muscle, count in day_muscles.items():
            if count >= 2:  # Músculos repetidos 2+ veces
                # Calculamos potencias de 3 para cada repetición
                # Para 2 ejercicios (1 repetición): 3^1 = 3
                # Para 3 ejercicios (2 repeticiones): 3^1 + 3^2 = 3 + 9 = 12
                # Para 4 ejercicios (3 repeticiones): 3^1 + 3^2 + 3^3 = 3 + 9 + 27 = 39
                penalty = 0
                for r in range(1, count):  # count-1 repeticiones
                    penalty += 3**r
                
                total_penalty += penalty
                details["same_day"][f"Día {d+1}, {muscle}"] = {
                    "repeticiones": count,
                    "penalización": penalty
                }
    
    # Para días consecutivos (cíclico), encontrar músculos repetidos
    num_days = len(days)
    if num_days > 0:
        for i in range(num_days):
            d1_idx = days[i]
            d2_idx = days[(i + 1) % num_days] # Cíclico
            
            # Encontrar músculos de cada día
            muscles_d1 = set()
            for exercise in grid[d1_idx]:
                if exercise in MUSCLES:
                    muscles_d1.update(MUSCLES[exercise])
            
            muscles_d2 = set()
            for exercise in grid[d2_idx]:
                if exercise in MUSCLES:
                    muscles_d2.update(MUSCLES[exercise])
            
            # Músculos repetidos en días consecutivos
            repeated = muscles_d1.intersection(muscles_d2)
            for muscle in repeated:
                penalty = weight_consec
                total_penalty += penalty
                # Evitar duplicar la penalización si ya se contó en el optimizador (que usa z[m,d])
                # La clave aquí es asegurar que la explicación coincida con cómo el optimizador cuenta
                # El optimizador cuenta una penalización por cada 'z' activado.
                # z[m,d] se activa si m está en día d y día (d+1)%days.
                # Así que la penalización se asocia con el primer día del par.
                details["consecutive"][f"Días {d1_idx+1}-{d2_idx+1}, {muscle}"] = {
                    "penalización": penalty
                }
    
    return total_penalty, details

# Ejemplo de uso
if __name__ == "__main__":
    sessions = {
        "backSquat": 2,
        "deadlift": 1,
        "benchPress": 2,
        "overheadPress": 2,
        "chinup": 2
    }
    grid, penalty = optimize_split(sessions, days=3, ex_per_day=3)
    print("Penalización total:", penalty)
    for d in grid:
        print(f"Día {d+1}: {', '.join(grid[d])}")
