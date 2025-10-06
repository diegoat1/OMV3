# ONV2 — Plataforma de Salud, Nutrición y Entrenamiento

Aplicación web (Flask + SQLite + Jinja + Bootstrap) para planificar alimentación por bloques, registrar métricas de salud y ofrecer flujos de coaching/telemedicina y dashboards. Incluye un sistema de “bloques” nutricionales (P/G/C), un constructor de combinaciones, sugerencias inteligentes basadas en catálogo de alimentos y una biblioteca/favoritos de combinaciones.

## Características

- Plan alimentario por bloques (P, G, C) con objetivos por comida y equivalencias visuales.
- Constructor de combinaciones (modal) con cálculo en tiempo real y validación de objetivos.
- Sugerencias inteligentes (combinador) a partir de `GRUPOSALIMENTOS` con tolerancias por macro y filtro por momento del día.
- Biblioteca y favoritos de combinaciones (presets públicos del staff y combinaciones guardadas por usuarios).
- Módulos de salud: medidas corporales, signos vitales, historia clínica, citas médicas, documentos, etc.
- Dashboards y vistas analíticas (fuerza, rendimiento, resúmenes).
- Bot de WhatsApp (enviar/recibir) con tablas de soporte.

## Tecnologías

- Backend: Python 3.x, Flask, SQLite (archivo `src/Basededatos`)
- Frontend: Jinja2, Bootstrap, Font Awesome, JS nativo (Fetch)
- Datos: SQLite (tablas clínicas + nutrición + biblioteca/favoritos)

## Estructura del repositorio

- `src/main.py` — App Flask, rutas y APIs principales
- `src/functions.py` — Lógica de negocio (catálogo de alimentos, combinador, utilidades)
- `src/templates/` — Vistas Jinja (por ejemplo `plan_alimentario.html`, `base.html`)
- `src/static/` — CSS/JS/imagenes (Bootstrap, scripts de páginas, gauges, etc.)
- `scripts/` — Utilidades y sincronización de base (p. ej. `sync_database_schema.py`)
- `docs/` — Documentación funcional y guías
- `requirements.txt` — Dependencias Python
- `src/Basededatos` — Base de datos SQLite usada por la app

## Puesta en marcha

1) Requisitos
- Python 3.9+ (recomendado)
- `pip` y (opcional) `virtualenv`

2) Instalación
```
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# Linux/MacOS
source .venv/bin/activate

pip install -r requirements.txt
```

3) Ejecutar la app
```
python src/main.py
# Servirá en http://127.0.0.1:8000
```
La base de datos se ubica en `src/Basededatos`. El arranque crea/actualiza tablas auxiliares de sugerencias si faltan.

## Endpoints clave

- `GET /api/plan-alimentario/info`
  - Devuelve el plan del usuario (bloques por comida, gramos objetivo y metadatos).
- `GET /api/grupos-alimentos?macro=P|G|C&momento=desayuno|almuerzo|...`
  - Expone el catálogo de `GRUPOSALIMENTOS` con bloques por porción y filtros.
- `GET /api/plan-alimentario/bloques/sugerencias`
  - Entrega “sugerencias inteligentes”, favoritos del usuario y presets globales.
- `POST /api/plan-alimentario/bloques/sugerencias`
  - Guarda una combinación como favorita del usuario.
- `PATCH /api/plan-alimentario/bloques/sugerencias/<id>`
  - Actualiza alias/estado; también se usa para marcar como “usada”.
- `DELETE /api/plan-alimentario/bloques/sugerencias/<id>`
  - Elimina un favorito del usuario.
- `POST /api/plan-alimentario/bloques/constructor`
  - Guarda una combinación creada en el constructor (incluye detalle de alimentos).

Si tu instancia incluye la biblioteca pública de combinaciones:
- `GET /api/plan-alimentario/biblioteca` — Lista combinaciones públicas (autor + favoritos)
- `POST/DELETE /api/plan-alimentario/favoritos/<preset_id>` — Marca/Quita favorito y actualiza contador

## Flujo “Plan Simplificado” (bloques)

1. El usuario define su plan en la tabla `DIETA` (totales y porcentajes por comida).
2. El frontend carga `GET /api/plan-alimentario/info` y muestra objetivos por comida.
3. El usuario usa el “Constructor” para sumar alimentos (desde `GRUPOSALIMENTOS`) y alcanzar el objetivo.
4. Puede guardar combinaciones como favoritos o publicarlas en la biblioteca.

## Base de datos (SQLite)

Archivo: `src/Basededatos`

Tablas relevantes:
- Nutrición: `DIETA`, `GRUPOSALIMENTOS`, `PLANES_ALIMENTARIOS`
- Sugerencias/biblioteca: `PLAN_BLOQUES_PRESETS`, `PLAN_BLOQUES_FAVORITOS`, `PLAN_BLOQUES_AJUSTES_LOG`
- Salud: `MEDIDAS_CORPORALES`, `SIGNOS_VITALES`, `HISTORIA_MEDICA`, `CITAS_MEDICAS`, `DOCUMENTOS_MEDICOS`
- Usuarios/otros: `USUARIOS`, `MATRIZ_ENTRENAMIENTO`, `PLANES_ENTRENAMIENTO`, etc.

Copia/merge de datos entre bases (PowerShell + sqlite3):
```
# Backup
Copy-Item src\Basededatos src\Basededatos_backup -Force
# Adjuntar otra base y copiar una tabla
sqlite3 src\Basededatos "ATTACH 'src/Basededatos (3)' AS old; \
  INSERT OR REPLACE INTO DIETA SELECT * FROM old.DIETA; DETACH old;"
```

## Scripts útiles

- `scripts/sync_database_schema.py` — sincronización de esquema
- `scripts/analyze_db_differences.py` — diferencias entre bases
- `scripts/apply_db_sync.py` — aplica cambios

En PowerShell, para ejecutar scripts `.sql` usa:
```
sqlite3 src\Basededatos ".read migrations/NNN_script.sql"
# o bien
Get-Content migrations\NNN_script.sql | sqlite3 src\Basededatos
```

## Desarrollo

- El servidor corre en modo debug y recarga plantillas automáticamente.
- Estilo JS simple (vanilla), sin bundlers. Mantén las funciones que se usan desde HTML accesibles en `window`.
- Para limpiar la caché del catálogo de alimentos:
```
# Dentro de la app o consola interactiva
from src import functions
functions.limpiar_cache_alimentos()
```

## Pruebas

- `test_planner_api.py` contiene pruebas/ejemplos para los endpoints del planner.
- Ejecuta pruebas si tienes `pytest` instalado (`pip install -r requirements.txt` ya lo incluye si corresponde):
```
python -m pytest -q
```

## Problemas frecuentes

- PowerShell no soporta redirección `<` como bash. Usa `.read` o `Get-Content | sqlite3`.
- “bootstrap.Modal.getInstance is not a function”: usa `getOrCreateInstance` o un fallback a jQuery si tu Bootstrap es antiguo.
- Si no aparecen sugerencias inteligentes, revisa que `GRUPOSALIMENTOS` tenga datos y que `GET /api/plan-alimentario/info` devuelva bloques para la comida elegida.

## Roadmap breve

- Afinar Biblioteca (paginación/filtros y conteo de favoritos en vivo)
- Afinar tolerancias/heurísticas del combinador para todas las comidas
- Exportar/Importar presets (JSON) y compartir por usuario

---

¿Dudas o mejoras? Abre un issue o comenta directamente sobre los archivos en `src/templates/plan_alimentario.html` y `src/main.py`.

