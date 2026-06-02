"""
Tests de Fix 14 — emails encolados a la "otra parte" en cada endpoint de assignments.

Cubre los 4 templates:
  POST /request                  → paciente recibe 'assignment_requested_by_specialist'
  POST /patient-request          → especialista recibe 'assignment_requested_by_patient'
  POST /<id>/accept              → la otra parte recibe 'assignment_accepted'
  POST /<id>/reject              → la otra parte recibe 'assignment_rejected'

Cada response debe incluir `email_queued_id` (no null cuando user tiene email).
Verificamos también `to_email`, `template`, `subject`, `body` y `payload_json.assignment_id`
en cada row insertada en email_outbox.

Cuentas usadas:
  Florencia (Noelia, id 39) — specialist
  Yael (SaiyanKiwi, id 2, dni 12345678) — patient flujo specialist→patient
  Elvira (id 4, dni 16449041) — patient flujo patient→specialist
"""

import json
import sqlite3
import sys
from datetime import datetime

import requests

BASE = "http://localhost:8000/api/v3"
AUTH_DB = "src/auth.db"

FLO_EMAIL = "noefernandezhurt@gmail.com"
YAEL_EMAIL = "saiyankiwi@gmail.com"
ELVIRA_EMAIL = "elviraelsagomez@hotmail.com"
PWD = "Test1234!"
YAEL_DNI = "12345678"
FLO_USER_ID = 39

results = []


def line():
    print("-" * 80)


def report(step, label, ok, detail=""):
    icon = "[OK]" if ok else "[FAIL]"
    results.append((step, label, ok, detail))
    print(f"{icon}  Test {step}: {label}")
    if detail:
        for ln in str(detail).splitlines():
            print(f"      {ln}")


def db_query(db, sql, params=()):
    con = sqlite3.connect(db)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    cur.execute(sql, params)
    rows = [dict(r) for r in cur.fetchall()]
    con.close()
    return rows


def db_exec(db, sql, params=()):
    con = sqlite3.connect(db)
    cur = con.cursor()
    cur.execute(sql, params)
    con.commit()
    con.close()


def call(method, path, token=None, body=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.request(method, f"{BASE}{path}", headers=headers, json=body, timeout=15)
        try:
            payload = r.json()
        except Exception:
            payload = {"_raw": r.text[:300]}
        return r.status_code, payload
    except Exception as e:
        return None, {"_request_error": str(e)}


def login(email, pwd):
    sc, body = call("POST", "/auth/login", body={"email": email, "password": pwd})
    if sc != 200:
        print(f"ABORT: login {email} failed sc={sc} body={body}")
        sys.exit(1)
    return body["data"]["token"]


def email_row_for(template_pattern, after_id, to_email=None):
    """Busca la última fila en email_outbox con ese template insertada después de `after_id`."""
    if to_email:
        rows = db_query(AUTH_DB,
            """SELECT id, user_id, to_email, template, subject, body, payload_json
               FROM email_outbox WHERE template=? AND to_email=? AND id > ?
               ORDER BY id DESC LIMIT 1""",
            (template_pattern, to_email, after_id))
    else:
        rows = db_query(AUTH_DB,
            """SELECT id, user_id, to_email, template, subject, body, payload_json
               FROM email_outbox WHERE template=? AND id > ?
               ORDER BY id DESC LIMIT 1""",
            (template_pattern, after_id))
    return rows[0] if rows else None


# =============================================================
# Setup — limpiar assignments + tomar watermark del email_outbox
# =============================================================
line(); print("Setup — limpiar assignments + login 3 cuentas")
db_exec(AUTH_DB, "DELETE FROM specialist_assignments WHERE specialist_id=? AND patient_id IN (2, 4)", (FLO_USER_ID,))

# Watermark: max id antes de los tests
wm_rows = db_query(AUTH_DB, "SELECT COALESCE(MAX(id), 0) AS m FROM email_outbox")
WM = wm_rows[0]["m"] if wm_rows else 0
print(f"  email_outbox watermark: id > {WM}")

TOK_FLO = login(FLO_EMAIL, PWD)
TOK_YAEL = login(YAEL_EMAIL, PWD)
TOK_ELVIRA = login(ELVIRA_EMAIL, PWD)
print("  tokens OK para Florencia, Yael, Elvira")


# =============================================================
# Flujo A — Specialist initiates → patient accepts
# =============================================================
line(); print("Flujo A — POST /request (Florencia → Yael) + accept")

# Test 1: POST /assignments/request → 200 + email_queued_id != None
sc, body = call("POST", "/assignments/request", token=TOK_FLO,
                body={"patient_dni": YAEL_DNI})
data_a = (body.get("data") if body else None) or {}
A_assignment_id = data_a.get("assignment_id")
A_email_id = data_a.get("email_queued_id")
report(1, "POST /assignments/request → 200 + assignment_id + email_queued_id (no null)",
       sc == 200 and A_assignment_id is not None and A_email_id is not None,
       f"sc={sc} | assignment_id={A_assignment_id} | email_queued_id={A_email_id}")

# Test 2: email_outbox row → template='assignment_requested_by_specialist',
# to_email=Yael, payload.assignment_id == A_assignment_id
row = email_row_for("assignment_requested_by_specialist", WM, YAEL_EMAIL)
payload = json.loads(row.get("payload_json") or "{}") if row else {}
ok_2 = (
    row is not None
    and row.get("to_email") == YAEL_EMAIL
    and row.get("template") == "assignment_requested_by_specialist"
    and bool(row.get("subject"))
    and bool(row.get("body"))
    and payload.get("assignment_id") == A_assignment_id
)
report(2, "email_outbox: template=assignment_requested_by_specialist + to_email=Yael + payload.assignment_id",
       ok_2,
       f"row={row} | payload.assignment_id={payload.get('assignment_id')}")

# Test 3: Yael accepts → 200 + email_queued_id
sc, body = call("POST", f"/assignments/{A_assignment_id}/accept", token=TOK_YAEL)
data_acc = (body.get("data") if body else None) or {}
ACC_email_id = data_acc.get("email_queued_id")
ok_3 = (sc == 200 and data_acc.get("status") == "accepted"
        and ACC_email_id is not None)
report(3, "POST /<id>/accept (Yael acepta) → 200 + status=accepted + email_queued_id",
       ok_3,
       f"sc={sc} | status={data_acc.get('status')} | email_queued_id={ACC_email_id}")

# Test 4: accept email_outbox row → template='assignment_accepted',
# to_email=Florencia (la "otra parte")
row = email_row_for("assignment_accepted", WM, FLO_EMAIL)
payload = json.loads(row.get("payload_json") or "{}") if row else {}
ok_4 = (
    row is not None
    and row.get("to_email") == FLO_EMAIL
    and row.get("template") == "assignment_accepted"
    and payload.get("assignment_id") == A_assignment_id
)
report(4, "email_outbox: template=assignment_accepted + to_email=Florencia (otra parte)",
       ok_4,
       f"row={row} | payload.assignment_id={payload.get('assignment_id')}")


# =============================================================
# Flujo B — Patient initiates → specialist rejects
# =============================================================
line(); print("Flujo B — POST /patient-request (Elvira → Florencia) + reject")

# Test 5: Elvira POST /patient-request → 200 + email_queued_id
sc, body = call("POST", "/assignments/patient-request", token=TOK_ELVIRA,
                body={"specialist_id": FLO_USER_ID})
data_b = (body.get("data") if body else None) or {}
B_assignment_id = data_b.get("assignment_id")
B_email_id = data_b.get("email_queued_id")
ok_5 = sc == 200 and B_assignment_id is not None and B_email_id is not None
report(5, "POST /patient-request → 200 + assignment_id + email_queued_id (no null)",
       ok_5,
       f"sc={sc} | assignment_id={B_assignment_id} | email_queued_id={B_email_id}")

# Test 6: email_outbox row → template='assignment_requested_by_patient',
# to_email=Florencia (especialista que tiene que aceptar)
row = email_row_for("assignment_requested_by_patient", WM, FLO_EMAIL)
payload = json.loads(row.get("payload_json") or "{}") if row else {}
ok_6 = (
    row is not None
    and row.get("to_email") == FLO_EMAIL
    and row.get("template") == "assignment_requested_by_patient"
    and bool(row.get("subject"))
    and bool(row.get("body"))
    and payload.get("assignment_id") == B_assignment_id
)
report(6, "email_outbox: template=assignment_requested_by_patient + to_email=Florencia (especialista)",
       ok_6,
       f"row={row} | payload.assignment_id={payload.get('assignment_id')}")

# Test 7: Florencia rechaza la solicitud de Elvira → 200 + email_queued_id
sc, body = call("POST", f"/assignments/{B_assignment_id}/reject", token=TOK_FLO,
                body={})
data_rej = (body.get("data") if body else None) or {}
REJ_email_id = data_rej.get("email_queued_id")
ok_7 = (sc == 200 and data_rej.get("status") == "rejected"
        and REJ_email_id is not None)
report(7, "POST /<id>/reject (Florencia rechaza) → 200 + status=rejected + email_queued_id",
       ok_7,
       f"sc={sc} | status={data_rej.get('status')} | email_queued_id={REJ_email_id}")

# Test 8: reject email_outbox row → template='assignment_rejected',
# to_email=Elvira (la otra parte)
row = email_row_for("assignment_rejected", WM, ELVIRA_EMAIL)
payload = json.loads(row.get("payload_json") or "{}") if row else {}
ok_8 = (
    row is not None
    and row.get("to_email") == ELVIRA_EMAIL
    and row.get("template") == "assignment_rejected"
    and payload.get("assignment_id") == B_assignment_id
)
report(8, "email_outbox: template=assignment_rejected + to_email=Elvira (otra parte)",
       ok_8,
       f"row={row} | payload.assignment_id={payload.get('assignment_id')}")


# =============================================================
# Cleanup
# =============================================================
line(); print("CLEANUP — borrar assignments + email_outbox creados durante el test")
db_exec(AUTH_DB,
    "DELETE FROM specialist_assignments WHERE id IN (?, ?)",
    (A_assignment_id or 0, B_assignment_id or 0))
db_exec(AUTH_DB, "DELETE FROM email_outbox WHERE id > ?", (WM,))
print("  cleanup OK")


# =============================================================
# RESUMEN
# =============================================================
print()
print("=" * 80)
total = len(results)
passed = sum(1 for r in results if r[2])
print(f"FIX 14 RESUMEN: {passed}/{total} OK")
print("=" * 80)
for step, label, ok, _ in results:
    print(f"  {str(step):3} {'OK' if ok else 'FAIL':5} {label}")

sys.exit(0 if passed == total else 1)
