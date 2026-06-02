#!/usr/bin/env python3
"""
extract_cardio_standards.py  —  P6 / extractor reproducible (cardio running).

Mina los estándares de tiempos de carrera de Running Level
(ReferenceWeb/Running level/runninglevel.com/running-times/*-times.html) hacia
clinical.db.cardio_standards.

Cada página (distancia) tiene, por sexo, 3 tablas "Age × nivel": tiempo,
pace/km, pace/milla. Tomamos la de TIEMPO (la primera de cada terna; orden del
sitio: [M tiempo, M km, M milla, F tiempo, F km, F milla]).

Resultado: (sport, distance, sex, age, beginner..elite, wr) con tiempos en
segundos. Complementa el predictor Riegel (/analytics/calculators/race-time).

Idempotente (full refresh). Patrón = extract_strength_standards.py.

Uso:
    python scripts/extract_cardio_standards.py
"""

import os
import re
import sqlite3
import sys

from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, 'ReferenceWeb', 'Running level', 'runninglevel.com', 'running-times')


def _db_path():
    base = os.environ.get('DATABASE_DIR', os.path.join(ROOT, 'src'))
    return os.path.join(base, 'db', 'clinical.db')


def _to_seconds(text):
    """'mm:ss' o 'hh:mm:ss' -> segundos (int). None si no parsea."""
    t = (text or '').strip()
    if not re.match(r'^\d{1,2}(:\d{2}){1,2}$', t):
        return None
    parts = [int(x) for x in t.split(':')]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return None


def _distance_label(fname):
    return re.sub(r'-times$', '', os.path.splitext(fname)[0])


def parse_file(path):
    """Filas: (sport, distance, sex, age, beg, nov, int, adv, elite, wr) en segundos."""
    distance = _distance_label(os.path.basename(path))
    with open(path, encoding='utf-8', errors='ignore') as f:
        soup = BeautifulSoup(f.read(), 'lxml')
    age_tables = []
    for t in soup.find_all('table'):
        ths = [th.get_text(strip=True).lower() for th in t.find_all('th')]
        if ths and ths[0] == 'age':
            age_tables.append(t)
    # Orden del sitio: [M tiempo, M pace/km, M pace/milla, F tiempo, F pace/km, F milla]
    selected = []
    if len(age_tables) >= 4:
        selected = [('M', age_tables[0]), ('F', age_tables[3])]
    elif age_tables:
        selected = [('M', age_tables[0])]

    out = []
    for sex, table in selected:
        for tr in table.find_all('tr'):
            cells = [c.get_text(strip=True) for c in tr.find_all(['td', 'th'])]
            if len(cells) < 6:
                continue
            try:
                age = int(re.sub(r'[^\d]', '', cells[0]))
            except ValueError:
                continue
            secs = [_to_seconds(c) for c in cells[1:7]]  # beg,nov,int,adv,elite,(wr)
            beg, nov, inter, adv, elite = secs[0], secs[1], secs[2], secs[3], secs[4]
            wr = secs[5] if len(secs) > 5 else None
            if None in (beg, nov, inter, adv, elite):
                continue
            out.append(('running', distance, sex, age, beg, nov, inter, adv, elite, wr))
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
    conn.execute("DROP TABLE IF EXISTS cardio_standards")
    conn.execute("""
        CREATE TABLE cardio_standards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sport TEXT NOT NULL,
            distance TEXT NOT NULL,
            sex TEXT NOT NULL,
            age INTEGER NOT NULL,
            beginner INTEGER, novice INTEGER, intermediate INTEGER,
            advanced INTEGER, elite INTEGER, world_record INTEGER
        )
    """)
    conn.execute("CREATE INDEX idx_cardio_lookup ON cardio_standards(sport, distance, sex)")

    files = [os.path.join(SRC_DIR, f) for f in os.listdir(SRC_DIR)
             if f.endswith('-times.html')]
    total, dists, errs = 0, 0, 0
    for path in files:
        try:
            rows = parse_file(path)
        except Exception as e:
            errs += 1
            print(f'  [warn] {os.path.basename(path)}: {e}')
            continue
        if rows:
            dists += 1
            conn.executemany(
                "INSERT INTO cardio_standards "
                "(sport, distance, sex, age, beginner, novice, intermediate, advanced, elite, world_record) "
                "VALUES (?,?,?,?,?,?,?,?,?,?)",
                rows,
            )
            total += len(rows)
    conn.commit()
    conn.close()
    print(f'listo. {dists} distancias, {total} filas, {errs} errores. -> cardio_standards')


if __name__ == '__main__':
    main()
