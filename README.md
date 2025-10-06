# ONV2 â€” Plataforma de Salud, NutriciÃ³n y Entrenamiento

AplicaciÃ³n web (Flask + SQLite + Jinja + Bootstrap) para planificar alimentaciÃ³n por bloques, registrar mÃ©tricas de salud y ofrecer flujos de coaching/telemedicina y dashboards. Incluye un sistema de bloques nutricionales (P/G/C), un constructor de combinaciones, sugerencias inteligentes basadas en catÃ¡logo de alimentos y una biblioteca con favoritos.

## CaracterÃ­sticas

- Plan alimentario por bloques (P, G, C) con objetivos por comida y equivalencias visuales.
- Constructor de combinaciones (modal) con cÃ¡lculo en tiempo real y validaciÃ³n de objetivos.
- Sugerencias inteligentes a partir de `GRUPOSALIMENTOS` con tolerancias por macro y filtro por momento del dÃ­a.
- Biblioteca y favoritos de combinaciones (presets pÃºblicos del staff y combinaciones guardadas por usuarios).
- MÃ³dulos de salud: medidas corporales, signos vitales, historia clÃ­nica, citas mÃ©dicas, documentos, etc.
- Dashboards y vistas analÃ­ticas (fuerza, rendimiento, resÃºmenes).
- Bot de WhatsApp (enviar/recibir) con tablas de soporte.

## TecnologÃ­as

- Backend: Python 3.x, Flask, SQLite (archivo `src/Basededatos`)
- Frontend: Jinja2, Bootstrap, Font Awesome, JS nativo (Fetch)
- Datos: SQLite (tablas clÃ­nicas + nutriciÃ³n + biblioteca/favoritos)

## Estructura del repositorio

- `src/main.py` â€” App Flask, rutas y APIs principales
- `src/functions.py` â€” LÃ³gica de negocio (catÃ¡logo de alimentos, combinador, utilidades)
- `src/templates/` â€” Vistas Jinja (por ejemplo `plan_alimentario.html`, `base.html`)
- `src/static/` â€” CSS/JS/imagenes (Bootstrap, scripts de pÃ¡ginas, gauges, etc.)
- `migrations/` â€” Scripts de migraciÃ³n (SQL/PowerShell)
- `docs/` â€” DocumentaciÃ³n funcional y guÃ­as
- `requirements.txt` â€” Dependencias Python
- `src/Basededatos` â€” Base de datos SQLite usada por la app

## Puesta en marcha

1) Requisitos
- Python 3.9+ (recomendado)
- `pip` y (opcional) `virtualenv`

2) InstalaciÃ³n
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
# ServirÃ¡ en http://127.0.0.1:8000
```
La base de datos se ubica en `src/Basededatos`. El arranque crea/actualiza tablas auxiliares de sugerencias si faltan.

## DocumentaciÃ³n

- Ãndice: `docs/README.md`
- GuÃ­a completa: `docs/guia/guia_completa.md`
- Planner automÃ¡tico: `docs/nutricion/planner_automatico_implementacion.md`
- Biblioteca/favoritos: `docs/biblioteca/implementacion_biblioteca_completa.md`
- Tests/VerificaciÃ³n: `docs/testing/constructor.md`, `docs/testing/verificacion_bloques.md`
- Migraciones: `docs/migraciones/recuperacion_urgente.md`
- Cambios: `CHANGELOG.md`

## Endpoints clave

- `GET /api/plan-alimentario/info`: Plan del usuario (bloques por comida, gramos objetivo y metadatos).
- `GET /api/grupos-alimentos?macro=P|G|C&momento=desayuno|almuerzo|...`: CatÃ¡logo `GRUPOSALIMENTOS` con bloques por porciÃ³n y filtros.
- `GET /api/plan-alimentario/bloques/sugerencias`: Sugerencias inteligentes, favoritos y presets globales.
- `POST /api/plan-alimentario/bloques/sugerencias`: Crear favorito.
- `PATCH /api/plan-alimentario/bloques/sugerencias/<id>`: Actualizar alias/estado; marcar como usada.
- `DELETE /api/plan-alimentario/bloques/sugerencias/<id>`: Eliminar favorito.
- `POST /api/plan-alimentario/bloques/constructor`: Guardar combinaciÃ³n (detalle de alimentos).
- `GET /api/plan-alimentario/biblioteca`: Listar combinaciones pÃºblicas (autor + favoritos).
- `POST/DELETE /api/plan-alimentario/favoritos/<preset_id>`: Toggle de favoritos y contador.

## Base de datos (SQLite)

Archivo: `src/Basededatos`

Tablas relevantes:
- NutriciÃ³n: `DIETA`, `GRUPOSALIMENTOS`, `PLANES_ALIMENTARIOS`
- Sugerencias/biblioteca: `PLAN_BLOQUES_PRESETS`, `PLAN_BLOQUES_FAVORITOS`, `PLAN_BLOQUES_AJUSTES_LOG`
- Salud: `MEDIDAS_CORPORALES`, `SIGNOS_VITALES`, `HISTORIA_MEDICA`, `CITAS_MEDICAS`, `DOCUMENTOS_MEDICOS`
- Usuarios/otros: `USUARIOS`, `MATRIZ_ENTRENAMIENTO`, `PLANES_ENTRENAMIENTO`, etc.

Operaciones comunes (PowerShell + sqlite3):
```
# Backup
Copy-Item src\Basededatos src\Basededatos_backup -Force
# Adjuntar otra base y copiar una tabla
sqlite3 src\Basededatos "ATTACH 'src/Basededatos (3)' AS old; \
  INSERT OR REPLACE INTO DIETA SELECT * FROM old.DIETA; DETACH old;"
```

## Migraciones

- Script automatizado: `migrations/ejecutar_migracion_004.ps1`
- SQL corregido: `migrations/004_biblioteca_favoritos_FIXED.sql`

En PowerShell, para ejecutar `.sql`:
```
sqlite3 src\Basededatos ".read migrations/NNN_script.sql"
# o bien
Get-Content migrations\NNN_script.sql | sqlite3 src\Basededatos
```

## Desarrollo

- Servidor en modo debug con recarga de plantillas.
- JS simple (vanilla), sin bundlers. MantÃ©n funciones usadas desde HTML en `window`.
- Limpiar cachÃ© del catÃ¡logo de alimentos:
```
from src import functions
functions.limpiar_cache_alimentos()
```

## Pruebas

- No se incluyen tests automatizados en el repo por ahora. Usa los pasos de `docs/testing/` y los endpoints anteriores para pruebas manuales.

## Problemas frecuentes

- PowerShell no soporta redirecciÃ³n `<` como bash. Usa `.read` o `Get-Content | sqlite3`.
- Para Bootstrap 5, usa `getOrCreateInstance` para modales.
- Si no aparecen sugerencias inteligentes, revisa que `GRUPOSALIMENTOS` tenga datos y que `GET /api/plan-alimentario/info` devuelva bloques para la comida elegida.

## Roadmap breve

- Afinar biblioteca (paginaciÃ³n/filtros y conteo de favoritos en vivo)
- Afinar tolerancias/heurÃ­sticas del combinador para todas las comidas
- Exportar/Importar presets (JSON) y compartir por usuario

â€”

Â¿Dudas o mejoras? AbrÃ­ un issue o comentÃ¡ en `src/templates/plan_alimentario.html` y `src/main.py`.


