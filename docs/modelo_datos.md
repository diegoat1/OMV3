# Modelo de Datos de ONV2

La aplicación utiliza dos bases de datos SQLite principales para separar los datos operativos de los clínicos.

## Base de Datos Principal (`src/Basededatos`)

Contiene la información de usuarios, nutrición, entrenamiento y configuración general.

### Tablas de Usuario y Perfil
- **USUARIOS**: Credenciales y datos básicos (DNI, nombre, password, etc.).
- **PERFILESTATICO**: Datos antropométricos base (altura, sexo, edad).
- **PERFILDINAMICO**: Historial de medidas y cálculo de progresión (fdr, peso, cabd, ccin, ccad).

### Tablas de Nutrición
- **ALIMENTOS**: Catálogo base de alimentos con sus macros.
- **GRUPOSALIMENTOS**: Catálogo organizado para el sistema de bloques.
- **DIETA**: Planes nutricionales asignados a usuarios.
- **RECETAS**: Definición de platos y sus ingredientes.
- **PLANES_ALIMENTARIOS**: Planes completos guardados en formato JSON.
- **PLAN_BLOQUES_PRESETS / FAVORITOS**: Sistema de sugerencias y combinaciones guardadas.

### Tablas de Entrenamiento
- **FUERZA**: Historial detallado de levantamientos y análisis de potencia.
- **PLANES_ENTRENAMIENTO**: Programas de entrenamiento estructurados.
- **MATRIZ_ENTRENAMIENTO**: Configuración de ejercicios y sus parámetros.
- **ESTADO_EJERCICIO_USUARIO**: Progreso actual del usuario en cada ejercicio.

---

## Base de Datos de Telemedicina (`src/telemedicina.db`)

Especializada en la gestión clínica y seguimiento de pacientes.

### Tablas Clínicas
- **TELEMED_PACIENTES**: Ficha médica completa del paciente.
- **TELEMED_SITUACIONES**: Registro de consultas, diagnósticos y evolución clínica.
- **TELEMED_DOCUMENTOS**: Gestión de archivos médicos (analíticas, recetas, etc.) con integración a Google Drive.
- **HISTORIA_MEDICA**: Antecedentes y eventos médicos relevantes.
- **SIGNOS_VITALES**: Seguimiento de parámetros biométricos (presión, FC, glucosa, etc.).
- **CITAS_MEDICAS**: Agenda y registro de visitas médicas.

---

## Relaciones Clave
- La mayoría de las tablas se relacionan mediante el `USER_DNI` o un `user_id` único.
- El sistema de bloques vincula `GRUPOSALIMENTOS` con `PLAN_BLOQUES_PRESETS` para generar sugerencias inteligentes.
