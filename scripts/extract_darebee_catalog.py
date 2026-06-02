#!/usr/bin/env python3
"""
extract_darebee_catalog.py  —  P6 / extractor reproducible (catálogo Darebee).

Mina el índice filtrable de Darebee
(ReferenceWeb/Darebee/darebee.com/media/com_jamegafilter/en_gb/*.json) hacia
clinical.db.darebee_catalog: workouts / exercises / programs / recipes con sus
tags (focus, dificultad, equipo, tipo).

Fuente JSON (confiable, no HTML). Idempotente (full refresh).

Uso:
    python scripts/extract_darebee_catalog.py
"""

import json
import os
import re
import sqlite3
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, 'ReferenceWeb', 'Darebee', 'darebee.com',
                       'media', 'com_jamegafilter', 'en_gb')


def _db_path():
    base = os.environ.get('DATABASE_DIR', os.path.join(ROOT, 'src'))
    return os.path.join(base, 'db', 'clinical.db')


def _kind_from_url(url):
    u = (url or '').lower()
    for k in ('workouts', 'exercises', 'programs', 'recipes', 'challenges'):
        if f'/{k}/' in u or u.startswith(f'/{k}'):
            return k.rstrip('s')  # workout, exercise, program, recipe, challenge
    return 'other'


def _flatten_tags(attr):
    """attr = {ct10: {value:[...], frontend_value:[...]}, ...} -> lista plana de valores."""
    tags = []
    if isinstance(attr, dict):
        for v in attr.values():
            if isinstance(v, dict):
                fv = v.get('frontend_value') or v.get('value')
                if isinstance(fv, list):
                    tags.extend(str(x) for x in fv)
                elif fv:
                    tags.append(str(fv))
    # dedupe preservando orden
    seen, out = set(), []
    for t in tags:
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out


def main():
    if not os.path.isdir(SRC_DIR):
        print(f'[err] no existe {SRC_DIR}')
        sys.exit(1)
    db = _db_path()
    if not os.path.exists(db):
        print(f'[err] no existe {db}')
        sys.exit(1)

    items = {}  # darebee_id -> row (dedupe across json files)
    for fn in os.listdir(SRC_DIR):
        if not fn.endswith('.json'):
            continue
        try:
            data = json.load(open(os.path.join(SRC_DIR, fn), encoding='utf-8', errors='ignore'))
        except Exception as e:
            print(f'  [warn] {fn}: {e}')
            continue
        entries = data.values() if isinstance(data, dict) else data
        for it in entries:
            if not isinstance(it, dict) or 'id' not in it:
                continue
            did = it.get('id')
            url = it.get('url') or ''
            thumb = (it.get('thumbnail') or '').split('#')[0]
            tags = _flatten_tags(it.get('attr'))
            items[did] = (
                did, _kind_from_url(url), (it.get('name') or '').strip(),
                url, thumb, int(it.get('hits') or 0),
                json.dumps(tags, ensure_ascii=False),
            )

    conn = sqlite3.connect(db)
    conn.execute("DROP TABLE IF EXISTS darebee_catalog")
    conn.execute("""
        CREATE TABLE darebee_catalog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            darebee_id INTEGER UNIQUE,
            kind TEXT, name TEXT, url TEXT, thumbnail TEXT, hits INTEGER,
            tags_json TEXT
        )
    """)
    conn.execute("CREATE INDEX idx_darebee_kind ON darebee_catalog(kind)")
    conn.executemany(
        "INSERT INTO darebee_catalog (darebee_id, kind, name, url, thumbnail, hits, tags_json) "
        "VALUES (?,?,?,?,?,?,?)",
        list(items.values()),
    )
    conn.commit()
    by_kind = dict(conn.execute("SELECT kind, COUNT(*) FROM darebee_catalog GROUP BY kind").fetchall())
    conn.close()
    print(f'listo. {len(items)} items -> darebee_catalog. Por tipo: {by_kind}')


if __name__ == '__main__':
    main()
