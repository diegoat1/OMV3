import sqlite3
import json
from datetime import datetime

DATABASE_PATH = 'src/Basededatos'
WEIGHT_INCREMENT = 2.5  # Incremento de peso estándar
TEST_SESSION_NUMBER = 4 # La sesión número 4 es la de prueba
MAX_REPS_FOR_WEIGHT_INCREASE = 10 # Reps para incrementar peso y reiniciar ciclo

def obtener_conexion_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def crear_tablas():
    conn = obtener_conexion_db()
    cursor = conn.cursor()

    # Tabla de Matriz de Progresión (constante)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS MATRIZ_ENTRENAMIENTO (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        matriz_json TEXT NOT NULL,
        descripcion TEXT
    )
    ''')

    # Tabla de Usuarios (básica, para claves foráneas)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS USUARIOS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
    )
    ''')

    # Tabla de Estado de Ejercicios por Usuario
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ESTADO_EJERCICIO_USUARIO (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ejercicio_nombre TEXT NOT NULL,
        current_columna INTEGER NOT NULL,
        current_sesion INTEGER NOT NULL, -- 1-3 son sesiones normales, 4 es test
        current_peso FLOAT NOT NULL, -- Peso corporal del usuario para ejercicios calisténicos, peso directo para otros
        lastre_adicional FLOAT DEFAULT 0, -- Lastre extra para ejercicios de peso corporal
        last_test_reps INTEGER,
        last_test_date DATETIME,
        fila_matriz INTEGER NOT NULL, -- Fila (0, 1, o 2) a usar en la MATRIZ_ENTRENAMIENTO
        FOREIGN KEY (user_id) REFERENCES USUARIOS(id),
        UNIQUE (user_id, ejercicio_nombre)
    )
    ''')

    # Tabla de Planes de Entrenamiento
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS PLANES_ENTRENAMIENTO (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        created_date DATETIME NOT NULL,
        plan_json TEXT NOT NULL, -- {'dias': [{'dia': 1, 'ejercicios': ['backSquat', 'pullup']}, ...]}
        total_dias INTEGER NOT NULL,
        current_dia INTEGER NOT NULL, -- Próximo día a realizar (1-total_dias)
        active BOOLEAN NOT NULL DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES USUARIOS(id)
    )
    ''')

    conn.commit()
    conn.close()
    print("Tablas creadas o ya existentes.")

def inicializar_matriz_entrenamiento():
    conn = obtener_conexion_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM MATRIZ_ENTRENAMIENTO")
    if cursor.fetchone()[0] == 0:
        matriz = [
            ["1.1.1.1.1", "1.1.1.1.1", "2.1.1.1.1", "2.2.2.1.1", "3.2.2.2.1", "4.3.3.2.2", "4.4.3.2.2", "5.4.4.3.3", "6.5.4.3.3"],
            ["1.1.1.1.1", "1.1.1.1.1", "2.2.1.1.1", "3.2.2.2.1", "3.3.2.2.2", "4.4.3.3.2", "5.4.4.3.2", "6.5.4.4.3", "7.6.5.4.3"],
            ["1.1.1.1.1", "1.1.1.1.1", "2.2.2.1.1", "3.3.2.2.2", "4.3.3.2.2", "5.4.4.3.3", "6.5.4.4.3", "7.6.5.4.4", "8.7.6.5.4"]
        ]
        matriz_json = json.dumps(matriz)
        cursor.execute("INSERT INTO MATRIZ_ENTRENAMIENTO (matriz_json, descripcion) VALUES (?, ?)", 
                       (matriz_json, 'Matriz de progresión estándar 3x9'))
        conn.commit()
        print("Matriz de entrenamiento inicializada.")
    else:
        print("Matriz de entrenamiento ya existe.")
    conn.close()

def obtener_matriz_entrenamiento():
    conn = obtener_conexion_db()
    cursor = conn.cursor()
    cursor.execute("SELECT matriz_json FROM MATRIZ_ENTRENAMIENTO ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return json.loads(row['matriz_json'])
    return None

def guardar_plan_optimizado(user_id, plan_optimizado_dias, datos_fuerza_actual):
    conn = obtener_conexion_db()
    cursor = conn.cursor()

    # ELIMINAR planes antiguos del usuario en lugar de solo desactivarlos
    cursor.execute("DELETE FROM PLANES_ENTRENAMIENTO WHERE user_id = ?", (user_id,))

    plan_data = {"dias": plan_optimizado_dias}
    plan_json_str = json.dumps(plan_data)
    total_dias_plan = len(plan_optimizado_dias)

    # Usar strftime para asegurar un formato de fecha consistente
    fecha_actual = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute('''
    INSERT INTO PLANES_ENTRENAMIENTO (user_id, created_date, plan_json, total_dias, current_dia, active)
    VALUES (?, ?, ?, ?, ?, 1)
    ''', (user_id, fecha_actual, plan_json_str, total_dias_plan, 1))
    plan_id = cursor.lastrowid

    # Inicializar o actualizar ESTADO_EJERCICIO_USUARIO para cada ejercicio en el plan
    todos_los_ejercicios_del_plan = set()
    for dia_info in plan_optimizado_dias:
        for ej in dia_info['ejercicios']:
            todos_los_ejercicios_del_plan.add(ej)

    for ejercicio_nombre in todos_los_ejercicios_del_plan:
        cursor.execute("SELECT * FROM ESTADO_EJERCICIO_USUARIO WHERE user_id = ? AND ejercicio_nombre = ?", (user_id, ejercicio_nombre))
        estado_existente = cursor.fetchone()

        if estado_existente:
            # Si ya existe, lo mantenemos como está sin modificar
            pass
        else:
            # Si no existe, lo creamos con valores iniciales desde los datos de fuerza
            # Verifica la estructura exacta de datos_fuerza_actual para acceder correctamente
            print(f"DEBUG - Datos fuerza para {ejercicio_nombre}: {datos_fuerza_actual.get(ejercicio_nombre, 'No encontrado')}")
            peso_inicial = 60  # Valor predeterminado
            reps_iniciales = 1  # Valor predeterminado
            
            # Si existe el ejercicio en datos_fuerza_actual y tiene estructura correcta
            if ejercicio_nombre in datos_fuerza_actual and isinstance(datos_fuerza_actual[ejercicio_nombre], dict):
                peso_inicial = datos_fuerza_actual[ejercicio_nombre].get('weight', 60)
                reps_iniciales = datos_fuerza_actual[ejercicio_nombre].get('reps', 1)
                print(f"INFO - Usando peso personalizado {peso_inicial}kg y {reps_iniciales} reps para {ejercicio_nombre}")
            
            # La columna inicial debe ser exactamente el número de repeticiones iniciales
            # Limitamos a máximo 9 columnas
            columna_inicial = min(reps_iniciales, 9)

            # Determinar si es ejercicio de peso corporal y calcular lastre
            ejercicios_peso_corporal = ['dip', 'chinup', 'pullup']
            if ejercicio_nombre.lower() in ejercicios_peso_corporal:
                # Para ejercicios de peso corporal: separar peso corporal y lastre
                peso_corporal_usuario = datos_fuerza_actual.get(ejercicio_nombre, {}).get('bodyweight', 60)
                peso_total = datos_fuerza_actual.get(ejercicio_nombre, {}).get('weight', peso_corporal_usuario)
                lastre = max(0, peso_total - peso_corporal_usuario)
                current_peso_bd = peso_corporal_usuario
                lastre_adicional_bd = lastre
            else:
                # Para ejercicios normales: usar peso directamente
                current_peso_bd = peso_inicial
                lastre_adicional_bd = 0
            
            cursor.execute('''
            INSERT INTO ESTADO_EJERCICIO_USUARIO 
                (user_id, ejercicio_nombre, current_columna, current_sesion, current_peso, lastre_adicional, last_test_reps)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, ejercicio_nombre, columna_inicial, 1, current_peso_bd, lastre_adicional_bd, reps_iniciales))

    conn.commit()
    conn.close()
    print(f"Plan {plan_id} guardado para usuario {user_id}.")
    return plan_id

def _parse_prescription(prescription_str, weight, es_peso_corporal=False, mensaje_peso=None):
    """
    Parsea la prescripción de entrenamiento.
    
    Args:
        prescription_str (str): Cadena de prescripción como "5x5" o "5x(5,4,4,3,3)"
        weight (float): Peso a utilizar
        es_peso_corporal (bool): Si es True, usará mensaje_peso en lugar de weight
        mensaje_peso (str): Mensaje personalizado para el peso (ej: "+5kg" o "Peso corporal")
        
    Returns:
        str: Texto formateado para mostrar al usuario
    """
    # Determinar cómo mostrar el peso
    peso_mostrado = mensaje_peso if es_peso_corporal else f"{weight:.1f} kg"
    
    parts = prescription_str.split('.')
    if len(parts) < 2:
        return f"Formato inválido con {peso_mostrado}"
    
    # Asumimos que el formato es Rondas.Series.Reps.Reps.Reps... o Series.Reps.Reps...
    # Para este sistema, parece que es Series.Rep1.Rep2.Rep3.Rep4.Rep5
    # Y el primer número indica la cantidad de series, los siguientes las repeticiones por serie.
    # Dado "1.1.1.1.1", significa 5 series de 1 rep.
    # Dado "2.2.2.1.1", significa 5 series, las primeras tres de 2 reps, las ultimas dos de 1 rep.
    # Simplificaremos: si todos los números de reps son iguales, es X series de Y reps.
    # Si son diferentes, listaremos las reps por serie.

    num_series = len(parts)
    reps_por_serie = parts

    # Chequeamos si todas las repeticiones son iguales
    if len(set(reps_por_serie)) == 1:
        return f"{num_series} series de {reps_por_serie[0]} reps con {peso_mostrado}"
    else:
        return f"{num_series} series ({', '.join(reps_por_serie)} reps por serie) con {peso_mostrado}"

def obtener_entrenamiento_del_dia(user_id):
    """Obtiene el entrenamiento para el día actual del plan activo
    
    Args:
        user_id (int): ID del usuario
        
    Returns:
        str: Texto formateado del entrenamiento para mostrar
    """
    try:
        conn = obtener_conexion_db()
        cursor = conn.cursor()
        
        # Obtener el peso corporal del usuario desde la tabla FUERZA (último registro)
        cursor.execute("""
            SELECT bodyweight 
            FROM FUERZA 
            WHERE user_id = ? 
            ORDER BY fecha_analisis DESC
            LIMIT 1
        """, (user_id,))
        registro_fuerza = cursor.fetchone()
        peso_corporal = registro_fuerza['bodyweight'] if registro_fuerza else 0
        
        # Ejercicios que necesitan ajuste de peso corporal
        ejercicios_peso_corporal = ['dip', 'chinup', 'pullup']
        
        # Obtener plan activo para el usuario
        cursor.execute("""
            SELECT p.id, p.current_dia, p.total_dias, p.plan_json 
            FROM PLANES_ENTRENAMIENTO p 
            WHERE p.user_id = ? AND p.active = 1
        """, (user_id,))        
        plan_activo = cursor.fetchone()

        if not plan_activo:
            print(f"No hay plan activo para el usuario {user_id}")  # Log para diagnóstico
            conn.close()
            return "No hay plan activo para este usuario."
        
        print(f"Plan encontrado: {plan_activo['id']}, día actual: {plan_activo['current_dia']}")  # Log para diagnóstico

        try:
            plan_json = plan_activo['plan_json']
            plan_data = json.loads(plan_json)
            print(f"JSON plan parseado correctamente: {type(plan_data)}")  # Log para diagnóstico
        except json.JSONDecodeError as e:
            print(f"Error al parsear JSON del plan: {e}. JSON: {plan_activo['plan_json'][:100]}...")  # Log error de JSON
            conn.close()
            return f"Error al leer el plan: {str(e)}"
        except Exception as e:
            print(f"Error al procesar el plan: {e}")  # Log error general
            conn.close()
            return f"Error al procesar el plan: {str(e)}"
        
        dia_actual_num = plan_activo['current_dia']

        ejercicios_del_dia_info = None
        try:
            for dia_info in plan_data['dias']:
                if dia_info['dia'] == dia_actual_num:
                    ejercicios_del_dia_info = dia_info['ejercicios']
                    break
            
            print(f"Ejercicios encontrados para día {dia_actual_num}: {ejercicios_del_dia_info}")  # Log ejercicios
        except KeyError as e:
            print(f"Error en estructura de datos: {e}")  # Log error de estructura
            conn.close()
            return f"Error en estructura del plan: {str(e)}"
        
        if not ejercicios_del_dia_info:
            conn.close()
            return f"No se encontraron ejercicios para el día {dia_actual_num} del plan."

        matriz_progresion = obtener_matriz_entrenamiento()
        if not matriz_progresion:
            conn.close()
            return "Error: Matriz de progresión no encontrada."

        entrenamiento_formateado = [f"Día {dia_actual_num} de {plan_activo['total_dias']}:"]

        for ejercicio_nombre in ejercicios_del_dia_info:
            cursor.execute("SELECT * FROM ESTADO_EJERCICIO_USUARIO WHERE user_id = ? AND ejercicio_nombre = ?", (user_id, ejercicio_nombre))
            estado_ejercicio = cursor.fetchone()

            if not estado_ejercicio:
                entrenamiento_formateado.append(f"  {ejercicio_nombre}: Estado no encontrado (error)")
                continue
            
            sesion = estado_ejercicio['current_sesion']
            reps_test_fallo = estado_ejercicio['current_columna']
            peso = estado_ejercicio['current_peso']

            # Lógica de selección de la prescripción:
            # - La 'sesion' (1, 2, o 3) determina la FILA de la matriz (índice 0, 1, o 2).
            # - Las repeticiones del último test ('reps_test_fallo') determinan la COLUMNA de la matriz.
            # Primero, manejar el caso especial de la sesión de TEST
            if sesion == TEST_SESSION_NUMBER:
                columna_actual = estado_ejercicio['current_columna']
                
                # Calcular y mostrar el peso ajustado para ejercicios de calistenia
                if ejercicio_nombre.lower() in ejercicios_peso_corporal:
                    lastre = estado_ejercicio['lastre_adicional']
                    mensaje_peso = f"+{lastre:.1f} kg" if lastre > 0 else "Peso corporal"
                    entrenamiento_formateado.append(f"  {ejercicio_nombre}: TEST - 1 serie al fallo con {mensaje_peso} (Último test: {columna_actual} reps)")
                else:
                    entrenamiento_formateado.append(f"  {ejercicio_nombre}: TEST - 1 serie al fallo con {peso:.1f} kg (Último test: {columna_actual} reps)")
            
            # Si no es sesión de test, proceder con la lógica de la matriz
            else:
                fila_idx = sesion - 1
                col_idx = reps_test_fallo - 1 # El valor en la BD es 1-indexed

                # Verificación de límites para la fila (sesión)
                if not (0 <= fila_idx < len(matriz_progresion)):
                    entrenamiento_formateado.append(f"  {ejercicio_nombre}: Sesión ({sesion}) fuera de rango para la matriz.")
                    continue
                
                # Verificación de límites para la columna (reps al fallo)
                if not (0 <= col_idx < len(matriz_progresion[fila_idx])):
                    entrenamiento_formateado.append(f"  {ejercicio_nombre}: Reps al fallo ({reps_test_fallo}) fuera de rango para la matriz.")
                    continue

                prescripcion_str = matriz_progresion[fila_idx][col_idx]
                
                # Calcular y mostrar el peso ajustado para ejercicios de calistenia
                if ejercicio_nombre.lower() in ejercicios_peso_corporal:
                    lastre = estado_ejercicio['lastre_adicional']
                    mensaje_peso = f"+{lastre:.1f} kg" if lastre > 0 else "Peso corporal"
                    detalle_sesion = _parse_prescription(prescripcion_str, peso, True, mensaje_peso)
                else:
                    detalle_sesion = _parse_prescription(prescripcion_str, peso)
                    
                entrenamiento_formateado.append(f"  {ejercicio_nombre}: Sesión {sesion}/{TEST_SESSION_NUMBER-1} - {detalle_sesion}")
        
        conn.close()
        resultado = "\n".join(entrenamiento_formateado)
        print(f"Entrenamiento generado: {resultado}")  # Log resultado final
        return resultado
    except Exception as e:
        print(f"Error general en obtener_entrenamiento_del_dia: {e}")  # Log error general
        return f"Error al obtener entrenamiento: {str(e)}"

def registrar_sesion_completada(user_id, ejercicios, repeticiones_test={}, incrementos_peso={}, sesiones_completadas={}, sesiones_convertidas_test={}):
    """Registra la sesión completada para uno o varios ejercicios
    
    Args:
        user_id (int): ID del usuario
        ejercicios (str o list): Nombre del ejercicio o lista de nombres de ejercicios
        repeticiones_test (dict): Diccionario con {ejercicio: repeticiones} para sesiones de test
        incrementos_peso (dict): Diccionario con {ejercicio: incremento} para ajuste personalizado de peso
        sesiones_completadas (dict): Diccionario con {ejercicio: completada} donde completada es True o False
        sesiones_convertidas_test (dict): Diccionario con {ejercicio: convertida} donde convertida es True si fue convertida a TEST
    
    Returns:
        dict: Resultados del registro de cada ejercicio
    """
    conn = obtener_conexion_db()
    cursor = conn.cursor()
    
    # Convertir a lista si se recibió un solo ejercicio como string
    if isinstance(ejercicios, str):
        ejercicios = [ejercicios]
    
    resultados = {}
    
    for ejercicio_nombre in ejercicios:
        cursor.execute("SELECT * FROM ESTADO_EJERCICIO_USUARIO WHERE user_id = ? AND ejercicio_nombre = ?", (user_id, ejercicio_nombre))
        estado = cursor.fetchone()

        if not estado:
            resultados[ejercicio_nombre] = f"Error: No se encontró el estado para {ejercicio_nombre}"
            continue

        nueva_columna = estado['current_columna']
        nueva_sesion = estado['current_sesion']
        nuevo_peso = estado['current_peso']
        mensaje_extra = ""

        # Verificar si el ejercicio está marcado como no completado
        sesion_completada = sesiones_completadas.get(ejercicio_nombre, True)  # Por defecto es completada
        
        # Verificar si la sesión fue convertida a TEST
        fue_convertida_test = sesiones_convertidas_test.get(ejercicio_nombre, False)

        if estado['current_sesion'] == TEST_SESSION_NUMBER or fue_convertida_test: # Es día de test O fue convertida a test
            # Obtener las repeticiones para este ejercicio del diccionario
            if ejercicio_nombre in repeticiones_test:
                reps_test = repeticiones_test[ejercicio_nombre]
                print(f"Procesando {'TEST CONVERTIDO' if fue_convertida_test else 'TEST'} para {ejercicio_nombre}: {reps_test} repeticiones")
                
                # Establecer la nueva columna según las repeticiones del test
                nueva_columna = min(reps_test, 9)  # Limitar a máximo 9
                
                # Solo si son exactamente 10 repeticiones y hay incremento elegido, aumentamos el peso
                incremento = 0
                if reps_test == 10:
                    incremento = incrementos_peso.get(ejercicio_nombre, 0)
                
                # Actualizar las repeticiones del test (sin fecha)
                cursor.execute("UPDATE ESTADO_EJERCICIO_USUARIO SET last_test_reps = ? WHERE id = ?",
                            (reps_test, estado['id']))
                
                nueva_sesion = 1 # Resetear a la primera sesión
                
                # Solo aumentamos el peso si son 10 reps y se solicitó un incremento
                if reps_test == 10 and incremento > 0:
                    nuevo_peso += incremento
                    nueva_columna = 1 # Reiniciar a la columna 1 con más peso
                    # Reiniciar también last_test_reps a 1 ya que empezamos un nuevo ciclo con más peso
                    reps_test = 1
                    mensaje_extra = f"Peso incrementado a {nuevo_peso:.1f} kg (+{incremento} kg). {'[CONVERTIDO A TEST]' if fue_convertida_test else ''} Reiniciando ciclo."
                else:
                    mensaje_extra = f"Repeticiones registradas: {reps_test}. {'[CONVERTIDO A TEST]' if fue_convertida_test else ''} Reiniciando ciclo."
            else:
                # Si no hay datos de TEST para este ejercicio, simplemente avanzamos al siguiente día
                nueva_sesion = 1 # Resetear a la primera sesión
                mensaje_extra = f"Sesión de {'TEST CONVERTIDO' if fue_convertida_test else 'TEST'} completada sin datos específicos. Reiniciando ciclo."

        else: # Sesión normal
            if sesion_completada:
                # Si completó la sesión, avanza a la siguiente
                nueva_sesion += 1
            else:
                # Si no completó la sesión, disminuye la sesión actual
                nueva_sesion -= 1
                mensaje_extra = "Sesión no completada. Regresando a sesión anterior."
                
                # Si llega a 0 o estaba en la sesión 1 y no la completó, hacer test de disminución
                if nueva_sesion <= 0:
                    # Se necesita un test de disminución de peso
                    nueva_sesion = TEST_SESSION_NUMBER  # Establecer como sesión de test
                    
                    # Verificar si hay datos de disminución de peso
                    if ejercicio_nombre in incrementos_peso and incrementos_peso[ejercicio_nombre] < 0:
                        # Es una disminución de peso
                        decremento = abs(incrementos_peso[ejercicio_nombre])
                        nuevo_peso -= decremento
                        
                        # Si hay repeticiones de test para este ejercicio
                        if ejercicio_nombre in repeticiones_test:
                            nueva_columna = min(repeticiones_test[ejercicio_nombre], 9)  # Actualizar columna según repeticiones
                            mensaje_extra = f"Peso disminuido a {nuevo_peso:.1f} kg (-{decremento} kg). Ajustando a {nueva_columna} repeticiones."
                        else:
                            mensaje_extra = f"Peso disminuido a {nuevo_peso:.1f} kg (-{decremento} kg). Se requiere test para determinar repeticiones."
                    else:
                        mensaje_extra = "No se pudo completar el ciclo actual. Se necesita un test con peso reducido."

        # Manejar lastre para ejercicios de peso corporal
        ejercicios_peso_corporal = ['dip', 'chinup', 'pullup']
        if ejercicio_nombre.lower() in ejercicios_peso_corporal:
            # Para ejercicios de peso corporal, mantener lastre y actualizar peso corporal si es necesario
            nuevo_lastre = estado.get('lastre_adicional', 0)  # Mantener lastre actual
            if ejercicio_nombre in incrementos_peso:
                # Si hay incremento de peso, ajustar el lastre
                incremento = incrementos_peso[ejercicio_nombre]
                nuevo_lastre = max(0, nuevo_lastre + incremento)
            
            cursor.execute("UPDATE ESTADO_EJERCICIO_USUARIO SET current_columna = ?, current_sesion = ?, current_peso = ?, lastre_adicional = ? WHERE id = ?",
                        (nueva_columna, nueva_sesion, nuevo_peso, nuevo_lastre, estado['id']))
        else:
            # Para ejercicios normales, mantener lógica actual
            cursor.execute("UPDATE ESTADO_EJERCICIO_USUARIO SET current_columna = ?, current_sesion = ?, current_peso = ?, lastre_adicional = 0 WHERE id = ?",
                        (nueva_columna, nueva_sesion, nuevo_peso, estado['id']))
        
        resultados[ejercicio_nombre] = f"Progreso actualizado. {mensaje_extra}"
    
    conn.commit()
    conn.close()
    return resultados

def avanzar_dia_plan(user_id):
    conn = obtener_conexion_db()
    cursor = conn.cursor()
    
    # Obtener datos del plan activo
    cursor.execute("SELECT id, current_dia, total_dias, plan_json FROM PLANES_ENTRENAMIENTO WHERE user_id = ? AND active = 1", (user_id,))
    plan_activo = cursor.fetchone()

    if not plan_activo:
        conn.close()
        return "No hay plan activo para avanzar."

    nuevo_dia_num = plan_activo['current_dia'] + 1
    if nuevo_dia_num > plan_activo['total_dias']:
        nuevo_dia_num = 1 # Reiniciar ciclo
    
    # Actualizar el día actual en la tabla de planes
    cursor.execute("UPDATE PLANES_ENTRENAMIENTO SET current_dia = ? WHERE id = ?", (nuevo_dia_num, plan_activo['id']))
    
    # Obtener los ejercicios del nuevo día para log (pero no actualizamos las sesiones)
    try:
        plan_data = json.loads(plan_activo['plan_json'])
        ejercicios_nuevo_dia = []
        
        # Buscar los ejercicios del nuevo día
        for dia_info in plan_data.get('dias', []):
            if dia_info.get('dia') == nuevo_dia_num:
                ejercicios_nuevo_dia = dia_info.get('ejercicios', [])
                break
        
        print(f"Avanzando a día {nuevo_dia_num}, ejercicios: {ejercicios_nuevo_dia}")
        # Ya no incrementamos el current_sesion aquí, esto se hace solo al completar una sesión
    
    except Exception as e:
        print(f"Error al procesar plan: {e}")
        # Continuamos para al menos actualizar el día del plan
    
    conn.commit()
    conn.close()
    return f"Plan avanzado al día {nuevo_dia_num}."


if __name__ == '__main__':
    # --- EJEMPLO DE USO (Descomentar para probar) ---
    # print("Creando tablas...")
    # crear_tablas()
    # print("Inicializando matriz...")
    # inicializar_matriz_entrenamiento()

    # # Crear un usuario de ejemplo si no existe
    # conn_main = obtener_conexion_db()
    # cursor_main = conn_main.cursor()
    # try:
    #     cursor_main.execute("INSERT INTO USUARIOS (nombre) VALUES (?)", ('usuario_prueba',))
    #     user_id_prueba = cursor_main.lastrowid
    #     conn_main.commit()
    #     print(f"Usuario 'usuario_prueba' creado con ID: {user_id_prueba}")
    # except sqlite3.IntegrityError:
    #     cursor_main.execute("SELECT id FROM USUARIOS WHERE nombre = ?", ('usuario_prueba',))
    #     user_id_prueba = cursor_main.fetchone()['id']
    #     print(f"Usuario 'usuario_prueba' ya existe con ID: {user_id_prueba}")
    # conn_main.close()

    # # Ejemplo de plan optimizado (debería venir de tu optimizador)
    # plan_ejemplo = [
    #     {"dia": 1, "ejercicios": ["backSquat", "pullup"]},
    #     {"dia": 2, "ejercicios": ["frontSquat", "overheadPress"]},
    #     {"dia": 3, "ejercicios": ["benchPress", "chinup"]}
    # ]
    # # Datos de fuerza iniciales (deberían venir de tu tabla FUERZA)
    # fuerza_inicial_ejemplo = {
    #     "backSquat": {"weight": 100, "reps": 1},
    #     "pullup": {"weight": 0, "reps": 5}, # Peso corporal
    #     "frontSquat": {"weight": 70, "reps": 1},
    #     "overheadPress": {"weight": 40, "reps": 1},
    #     "benchPress": {"weight": 80, "reps": 1},
    #     "chinup": {"weight": 0, "reps": 5}
    # }
    # # Asignación de filas de la matriz a ejercicios (0, 1 o 2)
    # asignacion_filas = {
    #     "backSquat": 0,
    #     "pullup": 1,
    #     "frontSquat": 0,
    #     "overheadPress": 2,
    #     "benchPress": 0,
    #     "chinup": 1
    # }

    # print(f"\nGuardando plan para usuario {user_id_prueba}...")
    # guardar_plan_optimizado(user_id_prueba, plan_ejemplo, fuerza_inicial_ejemplo, asignacion_filas)

    # print(f"\nObteniendo entrenamiento del día para usuario {user_id_prueba}:")
    # print(obtener_entrenamiento_del_dia(user_id_prueba))

    # # Simular completar una sesión para backSquat (sesión normal)
    # print(f"\nRegistrando sesión de backSquat para usuario {user_id_prueba}...")
    # print(registrar_sesion_completada(user_id_prueba, 'backSquat'))
    # print(obtener_entrenamiento_del_dia(user_id_prueba)) # Ver cómo cambió

    # # Simular avanzar 3 sesiones más para llegar al test de backSquat
    # # print(registrar_sesion_completada(user_id_prueba, 'backSquat')) # Sesión 2
    # # print(registrar_sesion_completada(user_id_prueba, 'backSquat')) # Sesión 3
    # # print(f"\nEntrenamiento antes del test de backSquat:")
    # # print(obtener_entrenamiento_del_dia(user_id_prueba))
    
    # # # Simular completar un test para backSquat (ej: hizo 5 reps)
    # # print(f"\nRegistrando TEST de backSquat (5 reps) para usuario {user_id_prueba}...")
    # # print(registrar_sesion_completada(user_id_prueba, 'backSquat', repeticiones_hechas_test=5))
    # # print(obtener_entrenamiento_del_dia(user_id_prueba)) # Ver cómo cambió

    # # # Simular completar un test para pullup (ej: hizo 10 reps, debería subir peso si no es peso corporal)
    # # print(f"\nRegistrando TEST de pullup (10 reps) para usuario {user_id_prueba}...")
    # # print(registrar_sesion_completada(user_id_prueba, 'pullup', repeticiones_hechas_test=10))
    # # print(obtener_entrenamiento_del_dia(user_id_prueba))

    # # Avanzar el día del plan
    # # print(f"\nAvanzando día del plan para usuario {user_id_prueba}...")
    # # print(avanzar_dia_plan(user_id_prueba))
    # # print(obtener_entrenamiento_del_dia(user_id_prueba))
    pass
