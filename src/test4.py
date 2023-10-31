import math

def calculate_exercise_distribution(scores, num_days, num_exercises_per_day):
    max_score = max(scores)
    constant = max_score / scores[0]
    rounded_values = [round(constant * score) for score in scores]
    total_exercises = num_days * num_exercises_per_day
    
    while sum(rounded_values) > total_exercises:
        max_index = rounded_values.index(max(rounded_values))
        rounded_values[max_index] -= 1
    
    while sum(rounded_values) < total_exercises:
        max_index = rounded_values.index(max(rounded_values))
        rounded_values[max_index] += 1
    
    return rounded_values

# Obtener los scores desde el usuario
scores = []
categories = ["Squat", "Floor Pull", "Horizontal Press", "Vertical Press", "Pull"]
for category in categories:
    score = float(input(f"Ingresa el score para {category}: "))
    scores.append(score)

# Obtener los parámetros de entrenamiento desde el usuario
num_days = int(input("Ingresa el número de días a la semana: "))
num_exercises_per_day = int(input("Ingresa el número de ejercicios por día: "))

# Calcular la distribución de ejercicios
exercise_distribution = calculate_exercise_distribution(scores, num_days, num_exercises_per_day)

# Imprimir los resultados
for i in range(len(categories)):
    print(f"{categories[i]}: {exercise_distribution[i]} días")
