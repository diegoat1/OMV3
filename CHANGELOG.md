# Changelog

Este changelog resume cambios funcionales documentados. Para detalles, ver los archivos enlazados.

## 2025-10-06

- Biblioteca y favoritos: implementaciÃ³n completa de endpoints y UI.
  - Detalles: `docs/biblioteca/implementacion_biblioteca_completa.md`
- Fixes crÃ­ticos de constructor y generador (redondeo a 0.5, scope global de funciones, momentos ampliados, etc.).
  - Detalles: `docs/cambios/fixes_constructor_generador.md`
- MigraciÃ³n corregida 004 (preserva columnas y agrega ES_PUBLICA/DETALLE_JSON/FAVORITOS_TOTAL) + script PowerShell.
  - SQL: `migrations/004_biblioteca_favoritos_FIXED.sql`
  - PS1: `migrations/ejecutar_migracion_004.ps1`
  - GuÃ­a: `migrations/RECUPERACION_URGENTE.md`

## 2025-10-04

- Sistema de sugerencias con alimentos reales desde `GRUPOSALIMENTOS`.
  - Detalles: `docs/nutricion/actualizacion_sugerencias_alimentos.md`
- CorrecciÃ³n: bloques decimales en API y uso en generador/constructor.
  - Detalles: `docs/cambios/correccion_bloques_decimales.md`
- VerificaciÃ³n integral del sistema de bloques + plan de testing del constructor.
  - VerificaciÃ³n: `docs/testing/verificacion_bloques.md`
  - Testing: `docs/testing/constructor.md`

â€”

Notas:
- Documentos histÃ³ricos `CORRECCION_*` y `REDONDEO_*` amplÃ­an el detalle tÃ©cnico de cada fix.


