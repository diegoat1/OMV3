#!/usr/bin/env python3
"""
extract_exrx_exercises.py  —  P6 / extractor reproducible (catálogo EXRX).

Mina el catálogo de ejercicios de ExRx.net
(ReferenceWeb/EXRX/exrx.net/WeightExercises/<MuscleGroup>/*.html) hacia
clinical.db.exercise_catalog: nombre, grupo muscular, músculo objetivo,
sinergistas, estabilizadores, y clasificación (Utility / Mechanics / Force).

Tabla NUEVA (no pisa las 25 curadas de `exercises` que usan recovery/alternatives
con su propia taxonomía). Sirve para "browse" amplio + alternativas futuras.

Idempotente (full refresh). Patrón = extract_strength_standards.py.

Uso:
    python scripts/extract_exrx_exercises.py
"""

import json
import os
import re
import sqlite3
import sys

from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, 'ReferenceWeb', 'EXRX', 'exrx.net', 'WeightExercises')
SKIP = {'audins.html'}


def _db_path():
    base = os.environ.get('DATABASE_DIR', os.path.join(ROOT, 'src'))
    return os.path.join(base, 'db', 'clinical.db')


def _muscles_after(soup, label):
    """Lista de músculos del <ul> que sigue al <strong>label</strong>."""
    st = soup.find('strong', string=re.compile(r'^\s*' + label + r'\s*$', re.I))
    if not st:
        return []
    p = st.find_parent(['p', 'td', 'div']) or st
    ul = p.find_next_sibling('ul') or st.find_next('ul')
    if not ul:
        return []
    out = []
    for a in ul.find_all('a'):
        t = a.get_text(' ', strip=True)
        if t:
            out.append(t)
    return out


def _classif(soup, label):
    """Palabra de clasificación (Utility/Mechanics/Force).

    Markup EXRX: <td><strong>Utility:</strong></td><td>Basic</td> → el valor está
    en el <td> hermano. Fallback: siguiente string con letras.
    """
    st = soup.find('strong', string=re.compile(r'^\s*' + label, re.I))
    if not st:
        return None
    td = st.find_parent('td')
    if td:
        nxt = td.find_next_sibling('td')
        if nxt:
            val = nxt.get_text(' ', strip=True)
            if val:
                return val
    nxt = st.find_next(string=re.compile(r'[A-Za-z]'))
    if nxt:
        v = str(nxt).strip().strip(':').strip()
        if v and v.lower() not in ('utility', 'mechanics', 'force', 'classification'):
            return v
    return None


def parse_file(path, muscle_group):
    slug = os.path.splitext(os.path.basename(path))[0]
    with open(path, encoding='utf-8', errors='ignore') as f:
        soup = BeautifulSoup(f.read(), 'lxml')
    h1 = soup.find('h1')
    name = h1.get_text(' ', strip=True) if h1 else ''
    if not name or name.lower().startswith('exrx'):
        return None
    target = _muscles_after(soup, 'Target')
    synergists = _muscles_after(soup, 'Synergists')
    stabilizers = _muscles_after(soup, 'Stabilizers')
    # Sin músculo objetivo => probablemente no es una ficha de ejercicio
    if not target:
        return None
    return (
        slug, name, muscle_group,
        json.dumps(target, ensure_ascii=False),
        json.dumps(synergists, ensure_ascii=False),
        json.dumps(stabilizers, ensure_ascii=False),
        _classif(soup, 'Utility'),
        _classif(soup, 'Mechanics'),
        _classif(soup, 'Force'),
    )


def main():
    if not os.path.isdir(SRC_DIR):
        print(f'[err] no existe {SRC_DIR}')
        sys.exit(1)
    db = _db_path()
    if not os.path.exists(db):
        print(f'[err] no existe {db}')
        sys.exit(1)

    conn = sqlite3.connect(db)
    conn.execute("DROP TABLE IF EXISTS exercise_catalog")
    conn.execute("""
        CREATE TABLE exercise_catalog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT, name TEXT, muscle_group TEXT,
            target_json TEXT, synergists_json TEXT, stabilizers_json TEXT,
            utility TEXT, mechanics TEXT, force TEXT
        )
    """)
    conn.execute("CREATE INDEX idx_exrx_group ON exercise_catalog(muscle_group)")
    conn.execute("CREATE INDEX idx_exrx_name ON exercise_catalog(name)")

    total, groups, errs = 0, 0, 0
    for group in sorted(os.listdir(SRC_DIR)):
        gdir = os.path.join(SRC_DIR, group)
        if not os.path.isdir(gdir):
            continue
        rows = []
        for fn in os.listdir(gdir):
            if not fn.endswith('.html') or fn in SKIP:
                continue
            try:
                r = parse_file(os.path.join(gdir, fn), group)
                if r:
                    rows.append(r)
            except Exception as e:
                errs += 1
                print(f'  [warn] {group}/{fn}: {e}')
        if rows:
            groups += 1
            conn.executemany(
                "INSERT INTO exercise_catalog "
                "(slug, name, muscle_group, target_json, synergists_json, stabilizers_json, utility, mechanics, force) "
                "VALUES (?,?,?,?,?,?,?,?,?)",
                rows,
            )
            total += len(rows)
    conn.commit()
    conn.close()
    print(f'listo. {groups} grupos, {total} ejercicios, {errs} errores. -> exercise_catalog')


if __name__ == '__main__':
    main()
