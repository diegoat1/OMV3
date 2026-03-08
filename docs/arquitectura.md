# Arquitectura de ONV2

ONV2 es una plataforma integral de salud, nutrición y entrenamiento basada en Flask. Utiliza un enfoque modular con una fuerte lógica de negocio en el backend y una interfaz dinámica basada en Jinja2 y JavaScript nativo.

## Stack Tecnológico

- **Backend**: Python 3.9+ con [Flask](https://flask.palletsprojects.com/).
- **Base de Datos**: SQLite (almacenada en local para simplicidad y velocidad).
- **Frontend**: Jinja2 Templates, Bootstrap 5, ApexCharts para visualizaciones.
- **Lógica de Optimización**: [PuLP](https://coin-or.github.io/pulp/) (Programación Lineal) para planes nutricionales y optimización de entrenamientos.

## Componentes Principales

1.  **Core (`src/main.py`)**: Gestiona las rutas, la sesión del usuario y la integración de los diferentes módulos.
2.  **Lógica de Negocio (`src/functions.py`)**: Contiene los motores de cálculo, optimizadores y funciones de persistencia.
3.  **Módulo de Nutrición**: Sistema de bloques, constructor de combinaciones y optimizador de dietas.
4.  **Módulo de Entrenamiento**: Seguimiento de fuerza, previsión de sesiones y estándares de rendimiento.
5.  **Módulo de Telemedicina**: Gestión de pacientes, historia clínica y documentos médicos.

## Flujo de Datos

1.  El usuario interactúa con la interfaz web.
2.  Las peticiones se procesan en `main.py`.
3.  La lógica compleja se delega a `functions.py`.
4.  Los datos se persisten en `src/Basededatos` (SQLite principal) o `src/telemedicina.db`.
5.  Los resultados se renderizan en el cliente o se devuelven como JSON vía API.
