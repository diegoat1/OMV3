#!/usr/bin/env python3
"""
extract_strength_standards.py  —  P6 / extractor reproducible.

Mina los estándares de fuerza por percentil de Strength Level
(ReferenceWeb/Strength Level/strengthlevel.com/strength-standards/*.html, 874
ejercicios) hacia clinical.db.strength_standards_pop.

Cada página tiene secciones Male / Female; dentro, tablas "By Weight and Age":
  - BW:  bodyweight (lb) -> Beg / Nov / Int / Adv / Elite   (1RM en lb)
  - Age: edad (años)     -> Beg / Nov / Int / Adv / Elite

Esto desbloquea el "Strength Score por percentil" (P3): dado (ejercicio, sexo,
peso corporal, levantamiento) se clasifica el nivel y se estima el percentil.

Idempotente: recrea la tabla en cada corrida (full refresh).

Uso:
    python scripts/extract_strength_standards.py
    DATABASE_DIR=/home/omegamedicina/omv3-data python3 scripts/extract_strength_standards.py
"""

import os
import re
import sqlite3
import sys

from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, 'ReferenceWeb', 'Strength Level', 'strengthlevel.com', 'strength-standards')


def _db_path():
    base = os.environ.get('DATABASE_DIR', os.path.join(ROOT, 'src'))
    return os.path.join(base, 'db', 'clinical.db')


def _num(text):
    """Primer número (float) en `text`, o None."""
    m = re.search(r'-?\d+(?:\.\d+)?', (text or '').replace(',', ''))
    return float(m.group()) if m else None


def _table_sex_unit(table):
    """(sex, unit) buscando el h2 de sección más cercano hacia arriba."""
    for h2 in table.find_all_previous('h2'):
        txt = h2.get_text(' ', strip=True).lower()
        sex = None
        if 'female' in txt:
            sex = 'F'
        elif 'male' in txt:
            sex = 'M'
        if sex:
            unit = 'kg' if 'kg' in txt else 'lb'
            return sex, unit
    return None, 'lb'


def _exercise_name(soup, slug):
    h1 = soup.find('h1')
    if h1:
        name = re.sub(r'\s+', ' ', h1.get_text(' ', strip=True))
        name = re.sub(r'\s*Standards\s*$', '', name, flags=re.I).strip()
        if name:
            return name
    return slug.replace('-', ' ').title()


def parse_file(path):
    """Devuelve filas: (slug, name, sex, metric, bin, beg, nov, int, adv, elite, unit)."""
    slug = os.path.splitext(os.path.basename(path))[0]
    with open(path, encoding='utf-8', errors='ignore') as f:
        soup = BeautifulSoup(f.read(), 'lxml')
    name = _exercise_name(soup, slug)
    out = []
    for table in soup.find_all('table'):
        ths = [th.get_text(strip=True) for th in table.find_all('th')]
        if not ths:
            continue
        head = ths[0].lower()
        if head in ('bw', 'bodyweight'):
            metric = 'bodyweight'
        elif head == 'age':
            metric = 'age'
        else:
            continue  # tablas "Strength Level / Weight / Ratio" — no nos sirven
        sex, unit = _table_sex_unit(table)
        if not sex:
            continue
        for tr in table.find_all('tr'):
            cells = [c.get_text(strip=True) for c in tr.find_all(['td', 'th'])]
            if len(cells) < 6:
                continue
            binv = _num(cells[0])
            vals = [_num(c) for c in cells[1:6]]
            if binv is None or any(v is None for v in vals):
                continue
            out.append((slug, name, sex, metric, binv, *vals, unit))
    return out


def main():
    if not os.path.isdir(SRC_DIR):
        print(f'[err] no existe {SRC_DIR}')
        sys.exit(1)
    db = _db_path()
    if not os.path.exists(db):
        print(f'[err] no existe {db}')
        sys.exit(1)

    conn = sqlite3.connect(db)
    conn.execute("DROP TABLE IF EXISTS strength_standards_pop")
    conn.execute("""
        CREATE TABLE strength_standards_pop (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exercise_slug TEXT NOT NULL,
            exercise_name TEXT,
            sex TEXT NOT NULL,        -- 'M' | 'F'
            metric TEXT NOT NULL,     -- 'bodyweight' | 'age'
            bin REAL NOT NULL,
            beginner REAL, novice REAL, intermediate REAL, advanced REAL, elite REAL,
            unit TEXT DEFAULT 'lb'
        )
    """)
    conn.execute("CREATE INDEX idx_ssp_lookup ON strength_standards_pop(exercise_slug, sex, metric)")

    files = [os.path.join(SRC_DIR, f) for f in os.listdir(SRC_DIR) if f.endswith('.html')]
    total_rows = 0
    exercises = 0
    errs = 0
    for path in files:
        try:
            rows = parse_file(path)
        except Exception as e:
            errs += 1
            print(f'  [warn] {os.path.basename(path)}: {e}')
            continue
        if rows:
            exercises += 1
            conn.executemany(
                "INSERT INTO strength_standards_pop "
                "(exercise_slug, exercise_name, sex, metric, bin, beginner, novice, intermediate, advanced, elite, unit) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                rows,
            )
            total_rows += len(rows)
    conn.commit()
    conn.close()
    print(f'listo. {exercises} ejercicios, {total_rows} filas, {errs} errores. -> strength_standards_pop')


if __name__ == '__main__':
    main()
