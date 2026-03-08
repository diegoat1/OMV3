# Guía de Administración

ONV2 incluye herramientas avanzadas para que los administradores gestionen la plataforma de forma eficiente.

## Database Manager Beta

Usa el endpoint `/database_manager_beta` para acceder a una interfaz de gestión total:
- **Edición Inline**: Haz clic en cualquier celda para editar el valor directamente en la base de datos sin recargar la página.
- **Búsqueda Global**: Filtra registros en todas las tablas simultáneamente.
- **Exportación**: Descarga cualquier tabla en formato CSV para análisis externo.
- **Seguridad**: Solo accesible para usuarios con privilegios administrativos.

## Gestión de Usuarios

Desde el panel de administración se pueden:
- Editar perfiles estáticos y dinámicos (`editperfilest`, `editperfildin`).
- Ajustar planes nutricionales manualmente.
- Ver el análisis completo de cualquier usuario (`obtener_analisis_completo_usuario`) sin necesidad de su contraseña.

## Mantenimiento del Sistema

### Modo Mantenimiento
Activado mediante la función `mantenimiento()` en `main.py`, redirige a los usuarios a una pantalla de aviso mientras se realizan ajustes estructurales o migraciones.

### Scripts Útiles
- `limpiar_cache.py`: Útil cuando se añaden nuevos alimentos o se cambian definiciones de grupos.
- `migrations/`: Directorio con scripts SQL para actualizar la estructura de la base de datos.
