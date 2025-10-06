# 🧭 Guía completa de ONV2

## Objetivo general
ONV2 centraliza la gestión clínica y deportiva de los pacientes de Omega Nutrición: permite capturar perfiles estáticos y dinámicos, calcular diagnósticos corporales, generar planes nutricionales y de entrenamiento personalizados, y mantener un historial integral de progreso para el equipo profesional.

## Índice rápido
- [Flujos de usuario clave](#flujos-de-usuario-clave)
  - [Inicio y recursos públicos](#inicio-y-recursos-publicos)
  - [Autenticación y sesión](#autenticacion-y-sesion)
  - [Dashboard clínico](#dashboard-clinico)
  - [Generadores de planes](#generadores-de-planes)
  - [Administración de datos](#administracion-de-datos)
- [Funciones de soporte en `src/functions.py`](#funciones-de-soporte-en-srcfunctionspy)
- [Módulo de entrenamiento (`src/training.py`)](#modulo-de-entrenamiento-srctrainingpy)
- [Optimizador de rutinas (`src/workout_optimizer.py`)](#optimizador-de-rutinas-srcworkout_optimizerpy)
- [Mapa de datos y dependencias](#mapa-de-datos-y-dependencias)

---

## Flujos de usuario clave
Los siguientes flujos están orquestados desde `src/main.py` y renderizan plantillas dentro de `templates/` apoyándose en formularios WTForms definidos en `src/forms.py`.

### Inicio y recursos públicos
<<<<<<< ours
- **`/` (`home`)**: muestra `home.html` y redirige al dashboard si la sesión está activa.
- **`/caloriescal`**: expone `caloriescal.html`, permitiendo a usuarios autenticados o invitados usar la calculadora de calorías.
- **`/resume`**: genera un resumen analítico en `resume.html` con datos corporales, disponible para usuarios autenticados.
- **`/mantenimiento`**: retorna `mantenimiento.html` para indicar tareas en curso.

### Autenticación y sesión
- **`/login`**: usa `forms.LoginForm` y la plantilla `login.html` para validar el email contra `PERFILESTATICO` y establecer `session['DNI']` y `session['username']`.
- **`/logout`**: elimina credenciales de sesión y redirige al formulario de acceso.
- El `@app.before_request` controla el acceso a rutas sensibles, redirigiendo a `login` o `dashboard` según el rol (el administrador `Toffaletti, Diego Alejandro` tiene acceso extendido).

### Dashboard clínico
- **`/dashboard`**: renderiza `dashboard.html` consolidando tablas como `PERFILESTATICO`, `PERFILDINAMICO`, `DIETA`, `OBJETIVO` y métricas de progreso. Permite al administrador seleccionar pacientes mediante un selector dinámico.
- **`/resume`** complementa el dashboard con simulaciones de recomposición corporal.

### Generadores de planes
- **Plan nutricional manual (`/planner`)**: utiliza `forms.PlannerForm` y `planner_nuevo.html` para capturar estrategias, tamaños de porción y factores de actividad. Procesa la información con `functions.plannutricional`.
- **Plan nutricional automático (`/api/planner/plan-automatico/<nombre>`)**: expone un endpoint JSON apoyado en `functions.calcular_plan_nutricional_automatico` para recalcular macronutrientes y energía disponible.
- **Plan de entrenamiento (`/trainingplanner`)**: se basa en `forms.TplannerForm` y `trainingplanner.html`. Los datos son enviados a `trainfunction.planentrenamientopaso1` (módulo heredado) para diseñar macro ciclos.
- **Plan diario (`/entrenamiento_actual`)**: toma el DNI del usuario, consulta `training.obtener_entrenamiento_del_dia` y muestra `entrenamiento_actual.html` con las series prescritas y el estado de la última sesión de test.
- **Seguimiento**: `/registrar_sesion` y `/avanzar_dia` reciben JSON desde la interfaz para marcar sesiones como completadas o mover el plan a la siguiente jornada; ambos interactúan con utilidades de `training.py`.
- **`/plan_entrenamiento`**: combina `functions.get_training_plan` y `predict_next_workouts` para renderizar `plan_entrenamiento.html` con el plan vigente y predicciones futuras.

### Administración de datos
- **`/databasemanager`**: despliega `databasemanager.html` con tablas completas de recetas, alimentos, dietas, perfiles y objetivos.
- **`/databasemanager-beta`**: misma finalidad con UI moderna e interacciones dinámicas (`databasemanager_beta.html`).
- **Gestión de perfiles**: rutas como `/create`, `/editperfilest/<DNI>`, `/update`, `/editperfildin/<ID>` y sus equivalentes de eliminación renderizan plantillas (`create.html`, `editperfilest.html`, `update.html`, `editperfildin.html`) alimentadas por formularios `CreateForm`, `UpdateForm` y operaciones de `functions.py`.
- **Recetario y alimentos**: `/createfood`, `/editfood/<ID>`, `/recipecreator` y endpoints auxiliares utilizan formularios `CreatefoodForm` y `RecipecreateForm` para mantener las tablas `ALIMENTOS` y `RECETAS`.
- **Gestión de objetivos**: `/goal` y `/api/goal/objetivos-automaticos/<usuario>` delegan en `functions.goal` y `calcular_objetivos_automaticos`.
=======
- **`/` (`home`)**: renderiza `home.html` y, si en `session` ya existen `username` y `DNI`, redirige inmediatamente a `/dashboard`. La plantilla comparte la estructura común definida en `base.html` y sirve como punto de entrada público.
- **`/caloriescal`**: expone `caloriescal.html`, donde se muestra la calculadora de calorías incluso sin autenticación. Si hay sesión activa se pasa el nombre de usuario a la vista para personalizar el saludo, pero no se realizan escrituras sobre la base de datos.
- **`/resume`**: consulta `DIETA`, `PERFILDINAMICO`, `PERFILESTATICO` y `OBJETIVO` para el usuario en sesión, calcula métricas clave (IMC, FFMI, porcentaje graso) mediante fórmulas logarítmicas (`math.log`) y entrega a `resume.html` un resumen con recomendaciones de ritmo de cambio de peso y comparativas con el objetivo registrado.
- **`/mantenimiento`**: devuelve `mantenimiento.html`, una página estática activada cuando el sistema necesita mostrar un mensaje de mantenimiento planificado.

### Autenticación y sesión
- **`/login`**: instancia `forms.LoginForm` y renderiza `login.html`. En un envío válido, busca por `EMAIL` dentro de `PERFILESTATICO`, compara el DNI almacenado con la contraseña introducida (se utiliza el DNI como password) y, si coincide, persiste `session['DNI']` y `session['username']` además de emitir un `flash` de bienvenida.
- **`/logout`**: borra `username` y `DNI` de `session`, muestra un mensaje informativo y redirige al formulario de acceso.
- **`@app.before_request`**: restringe la navegación. Los usuarios no autenticados son enviados a `/login` cuando intentan acceder a formularios de administración, y los no administradores son redirigidos al dashboard si intentan rutas exclusivas (creación/edición de perfiles, recetario, gestor de base de datos, planificador de entrenamiento). El administrador identificado como `Toffaletti, Diego Alejandro` queda exceptuado de dichas limitaciones.

### Dashboard clínico
- **`/dashboard`**: abre `dashboard.html`, consulta `DIETA`, `PERFILDINAMICO`, `PERFILESTATICO` y `OBJETIVO` para el usuario activo (o para el paciente elegido por el administrador vía parámetro `?paciente=`) y calcula indicadores como hidratación diaria sugerida, categoría corporal y evolución de % graso. Si faltan registros dinámicos se lanza un `flash` solicitando completar el perfil antes de continuar.
- **Selección administrativa**: cuando el usuario en sesión es el administrador, se construye `lista_pacientes` con todos los nombres de `PERFILESTATICO` y se habilita un selector para cambiar de paciente sin abandonar la vista.
- **`/resume`**: comparte la misma capa de datos y ofrece desde `resume.html` un resumen de tiempos estimados para lograr objetivos de grasa y músculo, utilizando las fórmulas definidas en el propio controlador.

### Generadores de planes

- **Plan nutricional manual (`/planner`)**: utiliza `forms.PlannerForm` y `planner_nuevo.html` para capturar nombre del paciente, estrategia (`estrategia`, `velocidad_cambio`, `deficit_calorico`, `disponibilidad_energetica`, `factor_actividad`) y delega en `functions.plannutricional` el cálculo de macros y totales diarios antes de mostrar un `flash` de confirmación.
- **Plan nutricional automático (`/api/planner/plan-automatico/<nombre>`)**: endpoint JSON que valida permisos, recupera el factor de actividad desde los parámetros o desde el último registro en `DIETA` y llama a `functions.calcular_plan_nutricional_automatico`. Devuelve escenarios de calorías/macros junto con el factor utilizado para que el frontend ajuste las tarjetas.
- **Ajustes rápidos (`/api/plan-nutricional/ajustar-calorias`)**: servicio POST que recibe un incremento/decremento objetivo, recalcula las calorías manteniendo la velocidad de cambio y actualiza los campos del plan activo mediante helpers en `functions.py`.
- **Plan de entrenamiento (`/trainingplanner`)**: formulario `forms.TplannerForm` que recopila puntuaciones de fuerza (sentadilla, peso muerto, presses, tracción) y parámetros de volumen. En el POST se envía la tupla `datos` a `trainfunction.planentrenamientopaso1`, heredado de versiones previas, para generar propuestas.
- **Entrenamiento diario (`/entrenamiento_actual`)**: detecta el DNI del usuario (con un fallback específico para el administrador), invoca `training.obtener_entrenamiento_del_dia` y transforma la cadena devuelta en bloques legibles dentro de `entrenamiento_actual.html`. Además consulta `ESTADO_EJERCICIO_USUARIO` para mostrar repeticiones objetivo, lastre y, en el caso de running, minutos de referencia.
- **Seguimiento del plan**: `/registrar_sesion` recibe JSON con `ejercicios`, `datosTest`, `sesionesCompletadas` y marca cada ejercicio llamando a `training.registrar_sesion_completada`, gestionando incrementos de peso, reconversiones a test y equivalencias de tiempo para running. `/avanzar_dia` vuelve a obtener el DNI y usa `training.avanzar_dia_plan` para mover el plan activo al siguiente día.
- **`/plan_entrenamiento`**: combina `functions.get_training_plan` (para deserializar `PLANES_ENTRENAMIENTO.plan_json`) y `functions.predict_next_workouts` (para estimar los próximos cinco días) antes de renderizar `plan_entrenamiento.html` con la tabla del plan y las predicciones.

### Administración de datos
- **`/databasemanager`**: obtiene de SQLite los conjuntos completos de `RECETAS`, `ALIMENTOS`, `DIETA`, `PERFILDINAMICO`, `PERFILESTATICO` y `OBJETIVO` para mostrarlos en `databasemanager.html`. Esta vista sirve como panel tradicional de revisión masiva.
- **`/databasemanager-beta`**: recorre dinámicamente `sqlite_master`, carga cada tabla con sus columnas mediante `PRAGMA table_info` y renderiza `databasemanager_beta.html` con búsqueda, edición en línea y exportación. Las ediciones usan el endpoint `POST /api/database/update-cell`, que valida tipos antes de ejecutar el `UPDATE` correspondiente.
- **Gestión de perfiles**: rutas como `/create`, `/editperfilest/<DNI>`, `/update`, `/editperfildin/<ID>` y sus equivalentes de eliminación renderizan plantillas (`create.html`, `editperfilest.html`, `update.html`, `editperfildin.html`) basadas en `forms.CreateForm`/`UpdateForm`. Cada acción invoca `functions.creadordeperfil`, `functions.actualizarperfilest` o `functions.actualizarperfil` para persistir en `PERFILESTATICO` y `PERFILDINAMICO`.
- **Recetario y alimentos**: `/createfood`, `/editfood/<ID>`, `/recipecreator` y sus endpoints asociados alimentan las tablas `ALIMENTOS` y `RECETAS` llamando a `functions.creadordealimento`, `editfood`, `listadealimentos`, `recetario` o `calculate_recipe_portions`. Se validan entradas numéricas de macronutrientes antes de grabar.
- **Gestión de objetivos**: `/goal` usa `forms.goalForm` para crear metas que se guardan mediante `functions.goal`, mientras que `/api/goal/objetivos-automaticos/<usuario>` expone la automatización de objetivos calculada en `functions.calcular_objetivos_automaticos`.
>>>>>>> theirs

---

## Funciones de soporte en `src/functions.py`
El módulo concentra la lógica de negocio reutilizable:

### Perfiles y objetivos
<<<<<<< ours
- `creadordeperfil`, `actualizarperfilest` y `actualizarperfil` crean o actualizan `PERFILESTATICO` y `PERFILDINAMICO`, calculando IMC, % graso, masa magra y métricas derivadas.
- `creadordelista` genera opciones para SelectFields basándose en los pacientes disponibles.
- `goal` y `calcular_objetivos_automaticos` definen metas de composición corporal derivadas de los datos actuales y proyecciones calculadas por `calcular_objetivos_parciales`.

### Nutrición y recetas
- `plannutricional` ajusta distribuciones de comidas manuales, mientras `calcular_plan_nutricional_automatico` produce planes completos con restricciones de disponibilidad energética y macronutrientes.
- `process_diet` guarda planes personalizados enviados desde `diet.html`.
- `creadordealimento`, `editfood`, `listadealimentos`, `listadeporciones`, `recetario`, `recipe` y `calculate_recipe_portions` gestionan catálogo y composición de recetas, incluyendo porciones dependientes e independientes.

### Entrenamiento y predicciones
- `get_training_plan` y `predict_next_workouts` consultan tablas de entrenamiento para mostrar la secuencia de días pendientes y estimar próximos estímulos.
- `actualizar_estado_running` sincroniza el progreso del ejercicio "running" dentro de `ESTADO_EJERCICIO_USUARIO`.

### Soporte de reportes
- Utilidades como `guardar_historia_levantamiento_completa`, `get_user_strength_history`, `crear_tabla_analisis_fuerza_detallado` y `obtener_analisis_completo_usuario` alimentan la vista de fuerza y los dashboards analíticos.
- Procedimientos de inicialización (`crear_tablas_medidas_corporales`, `crear_tablas_rendimiento_fisico`, `crear_tablas_telemedicina`, `crear_tabla_planes_alimentarios`, `inicializar_nuevas_tablas`) preparan estructuras adicionales cuando se despliega el sistema.
=======
- `creadordeperfil` crea la tabla `PERFILESTATICO` si no existe e inserta nuevos pacientes con validación de clave primaria (DNI), mostrando mensajes informativos cuando el registro ya existe. `actualizarperfilest` actualiza los datos de contacto y medidas perimetrales, mientras `actualizarperfil` recalcula porcentaje graso, peso magro/graso, IMC y deltas históricos antes de insertar una nueva fila en `PERFILDINAMICO`.
- `creadordelista` ordena alfabéticamente los registros de `PERFILESTATICO` y devuelve pares `[nombre, nombre]` usados para poblar `SelectField` en formularios administrativos.
- `goal` inserta o actualiza la tabla `OBJETIVO` con IMMC y porcentaje graso objetivo, y `calcular_objetivos_automaticos` proyecta fases sucesivas utilizando `calcular_objetivos_parciales`, categorizaciones de FFMI y umbrales específicos por sexo para producir un JSON consumido por `/api/goal/objetivos-automaticos`.

### Nutrición y recetas
- `plannutricional` toma los valores del formulario (`cal`, banderas de comidas, tamaños relativos, hora de entrenamiento), calcula proteínas a partir de la masa magra y distribuye macronutrientes por comida ajustando porciones según preferencia y horario antes de persistir o actualizar el registro correspondiente en `DIETA` con metadatos como estrategia, déficit y disponibilidad energética.
- `calcular_plan_nutricional_automatico` reúne datos recientes de `PERFILDINAMICO`, objetivos registrados y factor de actividad para generar escenarios de velocidad de cambio. Cada escenario incluye calorías, macronutrientes, estimaciones de semanas y banderas de riesgo (por ejemplo, energía disponible por kilo de FFM) que se devuelven en JSON.
- `process_diet` lee matrices de `GRUPOSALIMENTOS`, calcula porcentajes consumidos por grupo, aplica restricciones nutricionales según la libertad configurada y arma estructuras listas para almacenarse en `PLANES_ALIMENTARIOS` o para generar reportes personalizados.
- `creadordealimento`, `editfood`, `listadealimentos`, `listadeporciones`, `recetario`, `recipe` y `calculate_recipe_portions` proporcionan CRUD completo sobre `ALIMENTOS` y `RECETAS`, devolviendo macronutrientes por porción, listas de ingredientes y ajustes de tamaño que se reutilizan tanto en la planificación manual como en la automática.

### Entrenamiento y predicciones
- `get_training_plan` deserializa `plan_json` desde `PLANES_ENTRENAMIENTO` para entregar al frontend la estructura completa (`dias` con ejercicios por jornada) del plan activo.
- `predict_next_workouts` lee la matriz de progresión, el día actual del plan y el estado de cada ejercicio (`ESTADO_EJERCICIO_USUARIO`) para simular hasta cinco sesiones futuras, teniendo en cuenta si existen columnas `fila_matriz` y ajustes de lastre.
- `actualizar_estado_running` actualiza o crea el registro de running para un usuario, convirtiendo minutos a repeticiones (1 rep = 0,5 min) y manteniendo sincronizado `current_peso` con la velocidad objetivo.

### Soporte de reportes
- `guardar_historia_levantamiento_completa` unifica los datos crudos y calculados recibidos desde la UI de fuerza, decodifica campos JSON, genera nombres de archivo para adjuntos (SVG corporal) y persiste registros en `FUERZA`. `get_user_strength_history` reconstruye esos registros decodificando los JSON embebidos para alimentar tablas y gráficos.
- `crear_tabla_analisis_fuerza_detallado` garantiza la existencia de tablas auxiliares para guardar informes de fuerza, mientras `obtener_analisis_completo_usuario` arma dashboards personalizados combinando planes, historial corporal y métricas comparativas.
- Procedimientos de inicialización como `crear_tablas_medidas_corporales`, `crear_tablas_rendimiento_fisico`, `crear_tablas_telemedicina`, `crear_tabla_planes_alimentarios` e `inicializar_nuevas_tablas` expanden el esquema SQLite con tablas e índices adicionales (mediciones, telemedicina, cache de planes) cuando se despliega el sistema.
>>>>>>> theirs

---

## Módulo de entrenamiento (`src/training.py`)
<<<<<<< ours
El módulo encapsula toda la progresión de fuerza utilizando SQLite como almacenamiento:

1. **Esquema de datos**
   - `MATRIZ_ENTRENAMIENTO`: almacena la matriz 3×9 de progresión en formato JSON (`matriz_json`).
   - `USUARIOS`: índice simple de atletas para enlazar estados.
   - `ESTADO_EJERCICIO_USUARIO`: seguimiento por ejercicio con columnas para sesión actual, columna objetivo, peso corporal, lastre y resultados de la última prueba.
   - `PLANES_ENTRENAMIENTO`: guarda la estructura del plan (`plan_json`), fecha de creación, días totales y día actual.

2. **Inicialización**
   - `crear_tablas` crea el esquema si no existe.
   - `inicializar_matriz_entrenamiento` inserta la matriz base con progresiones en forma de cadena "1.1.1.1.1".

3. **Generación y persistencia**
   - `guardar_plan_optimizado` limpia planes previos del usuario, guarda el nuevo plan serializado y crea estados iniciales para cada ejercicio (considerando pesos corporales y lastre para dips/pullups y conversión de minutos en reps para running).

4. **Prescripción diaria**
   - `obtener_entrenamiento_del_dia` toma el plan activo, consulta la matriz y genera instrucciones legibles con pesos y repeticiones adaptados.
   - `_parse_prescription` y `_formatear_sesion_correr` normalizan la presentación de sets, repeticiones y ritmos para ejercicios de fuerza y cardio.

5. **Seguimiento de progreso**
   - `registrar_sesion_completada` actualiza pesos, columnas y datos de test (incluyendo lastre para peso corporal) según los resultados reportados desde la interfaz.
   - `avanzar_dia_plan` incrementa `current_dia`, reinicia sesiones cuando corresponde y asegura que el plan se marque como completado al finalizar.
=======
El módulo centraliza la progresión de fuerza basándose en SQLite:

1. **Esquema de datos**
   - `MATRIZ_ENTRENAMIENTO`: tabla con un único registro JSON que representa la matriz 3×9 de progresión y una descripción asociada.
   - `USUARIOS`: catálogo mínimo (`id`, `nombre`) utilizado como referencia para `PLANES_ENTRENAMIENTO` y `ESTADO_EJERCICIO_USUARIO`.
   - `ESTADO_EJERCICIO_USUARIO`: almacena por ejercicio el número de columna actual, sesión (1-3 normales, 4 test), peso asignado, lastre adicional, repeticiones del último test y la fila de la matriz utilizada.
   - `PLANES_ENTRENAMIENTO`: registra el plan activo por usuario con `plan_json`, fecha de creación, total de días, día actual y flag `active`.

2. **Inicialización**
   - `crear_tablas()` crea las tablas anteriores con sus restricciones `UNIQUE` y claves foráneas cuando no existen.
   - `inicializar_matriz_entrenamiento()` inserta la matriz estándar si la tabla está vacía, evitando duplicados en ejecuciones posteriores.

3. **Generación y persistencia**
   - `guardar_plan_optimizado(user_id, plan_optimizado_dias, datos_fuerza_actual)` elimina planes previos del usuario, serializa la lista de días recibida y rellena `ESTADO_EJERCICIO_USUARIO` para cada ejercicio calculando columna inicial, sesión y ajustes de lastre cuando se trata de ejercicios de peso corporal o running.

4. **Prescripción diaria**
   - `obtener_entrenamiento_del_dia` lee el plan activo y la matriz de progresión para construir un resumen tipo "Día X de N" con instrucciones detalladas; detecta sesiones de test y formatea running como minutos y velocidad.
   - `_parse_prescription` transforma cadenas como `"2.2.2.1.1"` en texto amigable y `_formatear_sesion_correr` convierte columnas de la matriz en bloques de minutos, respetando la conversión 1 rep = 0,5 minutos.

5. **Seguimiento de progreso**
   - `registrar_sesion_completada` recibe listas de ejercicios y resultados, actualiza columnas y sesiones según si se completó o no, guarda repeticiones de test, incrementa o reduce pesos y ajusta lastre en ejercicios de peso corporal.
   - `avanzar_dia_plan` incrementa `current_dia` (reiniciando a 1 al finalizar el ciclo) y registra en consola los ejercicios del nuevo día para diagnóstico.
>>>>>>> theirs

---

## Optimizador de rutinas (`src/workout_optimizer.py`)
<<<<<<< ours
- `optimize_split(sessions, days, ex_per_day, weight_same=3, weight_consec=1, solver=PULP_CBC_CMD)` construye un modelo de programación lineal entero.
  - **Entradas**: número de sesiones deseadas por ejercicio (`sessions`), cantidad de días y ejercicios por día, más penalizaciones por coincidir músculos el mismo día o en días consecutivos.
  - **Modelo**: define variables binarias `x_{ejercicio,día}` y auxiliares para contar repeticiones musculares (`n`, `w`, `y`, `z`). El objetivo minimiza la suma ponderada de penalizaciones exponenciales (3^r) y penalizaciones por consecutividad (`weight_consec`).
  - **Salida**: retorna `grid` (distribución de ejercicios por día) y la penalización global (`optimizer_penalty`).
- `explain_penalty` recompone la penalización explicando los aportes por músculo y por día, útil para depurar planes generados.
=======
- `optimize_split(sessions, days, ex_per_day, weight_same=3, weight_consec=1, solver=PULP_CBC_CMD)` plantea un problema de programación lineal entera con variables binarias `x_{ejercicio,día}`. Las restricciones obligan a que cada ejercicio aparezca la cantidad de veces solicitada y que cada día tenga `ex_per_day` movimientos; se crean variables auxiliares (`n`, `w`, `y`, `z`) para medir cuántas veces se repite un grupo muscular por día y en días consecutivos.
  - **Objetivo**: minimizar penalizaciones exponenciales (3^r) por músculos repetidos el mismo día más una penalización lineal por trabajar el mismo músculo en días consecutivos (`weight_consec`).
  - **Salida**: un diccionario `grid` donde cada clave de día contiene la lista de ejercicios asignados y el valor total de penalización (`optimizer_penalty`) obtenido de la función objetivo.
- `explain_penalty(grid, weight_same=3, weight_consec=1)` reevalúa la solución calculando cuánto aporta cada músculo a la penalización tanto por repeticiones en el mismo día como por días consecutivos, devolviendo un detalle estructurado que ayuda a depurar combinaciones conflictivas.
>>>>>>> theirs

---

## Mapa de datos y dependencias
<<<<<<< ours
- **Tablas SQLite principales**: `PERFILESTATICO`, `PERFILDINAMICO`, `DIETA`, `OBJETIVO`, `ALIMENTOS`, `RECETAS`, `FUERZA`, `PLANES_ENTRENAMIENTO`, `ESTADO_EJERCICIO_USUARIO`, `MATRIZ_ENTRENAMIENTO`, junto con tablas de métricas (medidas corporales, rendimientos, telemedicina) creadas bajo demanda.
- **Campos JSON**: `MATRIZ_ENTRENAMIENTO.matriz_json`, `PLANES_ENTRENAMIENTO.plan_json`, históricos de fuerza y análisis guardados como JSON en columnas de `FUERZA` y tablas auxiliares.
- **Archivos JSON externos**: los endpoints de nutrición devuelven estructuras JSON para los clientes (por ejemplo `/api/planner/plan-automatico`).
- **Dependencias clave**: Flask (servidor web), Flask-WTF (formularios y CSRF), SQLite3 (persistencia), NumPy (cálculos numéricos), PuLP (optimización lineal), y módulos estándar (`math`, `statistics`, `datetime`, `json`).
=======
- **Base de datos**: todo el backend persiste en `src/Basededatos` (SQLite). Las tablas más consultadas son `PERFILESTATICO`, `PERFILDINAMICO`, `OBJETIVO`, `DIETA`, `PLANES_ALIMENTARIOS`, `ALIMENTOS`, `RECETAS`, `GRUPOSALIMENTOS`, `FUERZA`, `PLANES_ENTRENAMIENTO`, `ESTADO_EJERCICIO_USUARIO` y `MATRIZ_ENTRENAMIENTO`.
- **Campos JSON**: `MATRIZ_ENTRENAMIENTO.matriz_json` almacena la matriz 3×9; `PLANES_ENTRENAMIENTO.plan_json` guarda la lista de días; `FUERZA` incluye múltiples columnas JSON (por ejemplo `lifts_results_json`, `muscle_groups_results_json`); las tablas derivadas creadas por funciones de inicialización utilizan columnas JSON para caches (`CALCULOS_JSON` en `PLANES_ALIMENTARIOS`).
- **Intercambios JSON**: los endpoints `/api/planner/plan-automatico/<usuario>`, `/api/plan-nutricional/ajustar-calorias`, `/api/goal/objetivos-automaticos/<usuario>`, `/registrar_sesion` y `/avanzar_dia` forman el núcleo de la comunicación asincrónica con el frontend.
- **Dependencias clave**: Flask y Flask-WTF (enrutamiento, templates, formularios), SQLite3 (`sqlite3` estándar), NumPy (cálculos nutricionales), PuLP (optimizador de rutinas), además de utilidades estándar (`math`, `statistics`, `datetime`, `json`). El formulario de validación usa `email-validator` y WTForms según lo definido en `requirements.txt`.
>>>>>>> theirs

---

Esta guía sirve como punto de partida para nuevos desarrolladores y debe mantenerse sincronizada con la lógica de negocio. Cada módulo cuenta con puntos de extensión claros para ampliar formularios, cálculos y almacenamiento según evolucionen los requisitos clínicos o deportivos.
