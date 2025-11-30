# Pendientes de commit

- Rama `master` con 1 commit local por encima de `origin/master` y más de 2k archivos modificados sin commitear.
- Cambios principales detectados (muestra de `git status -sb`):
  - Documentación bajo `docs/` (cambios en guías, migraciones, nutrición, testing, changelog).
  - Backend: `src/forms.py` (campo fecha ajustado a `type="date"`), `src/functions.py`, `src/main.py`, modelos LP (`src/metodo*.lp`) y base `src/Basededatos`.
  - Scripts y config nuevos: `scripts/google_drive_auth.py`, carpeta `config/`, carpeta `scripts/` (no versionadas previamente).
  - Frontend y assets: múltiples JS en `src/static/assets/_js/**`, SCSS en `src/static/assets/_scss/**`, minificados y fuentes; CSS minificados; posible regenerado de bundle OneUI.
  - Templates y páginas (ver `src/templates/`), más estáticos en `src/static/res/**` y `src/static/js/**`.
- Sugerencia de commits (orden recomendado):
  1) Documentación (`docs/**`).
  2) Backend (formularios, funciones, main, modelos LP) y cambios de base de datos (ver si debe versionarse).
  3) Frontend/assets (JS, SCSS, CSS minificados, bundles).
  4) Nuevos scripts/configuración (`config/**`, `scripts/**`, `requirements.txt`).
- Antes de commitear: revisar `git status` completo, decidir si versionar `src/Basededatos` y demás binarios/minificados, y eliminar generados que no deban ir al repo.
