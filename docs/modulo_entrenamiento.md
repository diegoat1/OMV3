# Módulo de Entrenamiento

ONV2 incluye un sistema avanzado de seguimiento y previsión de entrenamiento basado en el rendimiento real del usuario.

## Seguimiento de Fuerza

Se basa en la tabla `FUERZA`, donde se registran los levantamientos principales.
- **Estándares de Fuerza**: Compara el rendimiento del usuario con niveles competitivos o de salud (SymmetricStrength).
- **Optimización de Entrenamiento**: Analiza la fatiga y el volumen para sugerir ajustes en las cargas.

## ProgramaciÃ³n y PrevisiÃ³n

### FilosofÃ­a de Entrenamiento (3 Ejercicios)
El sistema estÃ¡ diseÃ±ado para maximizar la eficiencia mediante:
- **Ejercicios Multiarticulares**: Foco en movimientos compuestos que involucran mÃºltiples grupos musculares.
- **SimplificaciÃ³n**: Rutinas de 3 ejercicios por sesiÃ³n para optimizar el tiempo y la recuperaciÃ³n.
- **Foco en Debilidades**: El optimizador prioriza los grupos musculares con menor estÃ¡ndar de fuerza relativo.

### PrevisiÃ³n de Sesiones (`predict_next_workouts`)
Utiliza el historial del usuario para predecir los prÃ³ximos entrenamientos:
- Analiza la frecuencia de cada ejercicio.
- Calcula progresiones estimadas basadas en el rendimiento pasado.
- Genera un calendario tentativo de las prÃ³ximas 5+ sesiones.

## Matriz de Entrenamiento
Define la relaciÃ³n entre ejercicios, grupos musculares y tipos de esfuerzo. Es la base para que el sistema "entienda" quÃ© ejercicios son sustituibles o complementarios.

## Funciones Clave
- `entrenamiento_actual`: Calcula y muestra la sesiÃ³n que le corresponde al usuario hoy, siguiendo la regla de los 3 ejercicios si estÃ¡ configurado.
- `registrar_sesion`: Registra el volumen de trabajo y actualiza el estado del ejercicio.
- `actualizar_estado_running`: MÃ³dulo especÃ­fico para monitorizar el progreso en carrera (velocidad/distancia), integrable como complemento post-fuerza o en dÃ­as independientes.
