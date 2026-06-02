"""
Tests para multi-rol en POST /api/v3/auth/register.

Cubre:
  - desired_roles array (formato preferido)
  - desired_role CSV (formato alternativo)
  - desired_role single legacy
  - desired_roles tiene precedencia sobre desired_role cuando ambos vienen
  - alias 'professional' → 'doctor'
  - dedupe preservando orden
  - validación de roles inválidos
  - persistencia en users.role (CSV) + users.desired_role (single)
  - error si faltan ambos campos

Cada test crea un usuario único (multirol-test-<n>-<ts>@e2e.local) y luego limpia.
"""

import json
import sqlite3
import sys
import time

import requests

BASE = "http://localhost:8000/api/v3"
AUTH_DB = "src/auth.db"
CLINICAL_DB = "src/db/clinical.db"
TS = int(time.time())
EMAIL_PREFIX = f"multirol-test-{TS}"
EMAIL_DOMAIN = "example.com"   # email_validator rechaza .local/.test (reserved TLDs)

results = []
created_user_ids = []  # para cleanup al final
created_emails = []


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
    try:
        con = sqlite3.connect(db)
        con.row_factory = sqlite3.Row
        cur = con.cursor()
        cur.execute(sql, params)
        rows = [dict(r) for r in cur.fetchall()]
        con.close()
        return rows
    except sqlite3.OperationalError as e:
        return [{"_error": str(e)}]


def make_email(slot):
    e = f"{EMAIL_PREFIX}-{slot}@{EMAIL_DOMAIN}"
    created_emails.append(e)
    return e


def base_payload(slot):
    return {
        "nombre": f"TestUser, Slot{slot}",
        "email": make_email(slot),
        "password": "Password1234!",
        "sexo": "M",
        "fecha_nacimiento": "1990-05-15",
    }


def register(payload):
    try:
        r = requests.post(f"{BASE}/auth/register", json=payload, timeout=15)
        try:
            body = r.json()
        except Exception:
            body = {"_raw": r.text[:300]}
        return r.status_code, body
    except Exception as e:
        return None, {"_request_error": str(e)}


def excerpt(payload, n=200):
    if payload is None:
        return ""
    s = json.dumps(payload, default=str, ensure_ascii=False)
    return s if len(s) <= n else s[:n] + "..."


# ================================================================
# 1 — desired_roles array multi-rol
# ================================================================
line(); print("Test 1 — desired_roles=['doctor','nutricionista'] (formato preferido)")
p = base_payload(1)
p["desired_roles"] = ["doctor", "nutricionista"]
sc, body = register(p)
data = body.get("data") if body else {}
roles = data.get("roles") if isinstance(data, dict) else None
role_csv = data.get("role") if isinstance(data, dict) else None
uid = data.get("user_id") if isinstance(data, dict) else None
if uid:
    created_user_ids.append(uid)
ok = (sc == 200 and roles == ["doctor", "nutricionista"]
      and role_csv == "doctor,nutricionista")
report(1, "Array multi-rol → response.roles array y response.role CSV correctos",
       ok, f"sc={sc} | roles={roles} | role={role_csv}")

# ================================================================
# 2 — Persistencia DB del test 1
# ================================================================
line(); print("Test 2 — Verificar persistencia en auth.db.users")
db_row = db_query(AUTH_DB,
    "SELECT role, desired_role FROM users WHERE id=?", (uid,)) if uid else []
db_role = db_row[0].get("role") if db_row else None
db_desired = db_row[0].get("desired_role") if db_row else None
ok = (db_role == "doctor,nutricionista" and db_desired == "doctor")
report(2, "DB users.role='doctor,nutricionista' y users.desired_role='doctor' (primer rol)",
       ok, f"db_row={db_row[0] if db_row else 'n/a'}")

# ================================================================
# 3 — desired_role CSV string
# ================================================================
line(); print("Test 3 — desired_role='doctor,nutricionista' (CSV)")
p = base_payload(3)
p["desired_role"] = "doctor,nutricionista"
sc, body = register(p)
data = body.get("data") if body else {}
roles = data.get("roles") if isinstance(data, dict) else None
role_csv = data.get("role") if isinstance(data, dict) else None
uid = data.get("user_id") if isinstance(data, dict) else None
if uid:
    created_user_ids.append(uid)
ok = (sc == 200 and roles == ["doctor", "nutricionista"]
      and role_csv == "doctor,nutricionista")
report(3, "CSV string → mismo resultado que el array",
       ok, f"sc={sc} | roles={roles} | role={role_csv}")

# ================================================================
# 4 — Legacy single role
# ================================================================
line(); print("Test 4 — desired_role='patient' (legacy single)")
p = base_payload(4)
p["desired_role"] = "patient"
p["sexo"] = "F"
sc, body = register(p)
data = body.get("data") if body else {}
roles = data.get("roles") if isinstance(data, dict) else None
role_csv = data.get("role") if isinstance(data, dict) else None
uid = data.get("user_id") if isinstance(data, dict) else None
if uid:
    created_user_ids.append(uid)
ok = sc == 200 and roles == ["patient"] and role_csv == "patient"
report(4, "Legacy single string sigue funcionando",
       ok, f"sc={sc} | roles={roles}")

# ================================================================
# 5 — Ambos presentes: array gana
# ================================================================
line(); print("Test 5 — desired_roles=['doctor'] + desired_role='patient' (array gana)")
p = base_payload(5)
p["desired_roles"] = ["doctor"]
p["desired_role"] = "patient"   # debería ignorarse
sc, body = register(p)
data = body.get("data") if body else {}
roles = data.get("roles") if isinstance(data, dict) else None
uid = data.get("user_id") if isinstance(data, dict) else None
if uid:
    created_user_ids.append(uid)
ok = sc == 200 and roles == ["doctor"]
report(5, "Si vienen los dos, desired_roles (array) tiene precedencia",
       ok, f"sc={sc} | roles={roles} (esperado=['doctor'])")

# ================================================================
# 6 — Alias 'professional' → 'doctor'
# ================================================================
line(); print("Test 6 — desired_roles=['professional'] (alias legacy)")
p = base_payload(6)
p["desired_roles"] = ["professional"]
sc, body = register(p)
data = body.get("data") if body else {}
roles = data.get("roles") if isinstance(data, dict) else None
uid = data.get("user_id") if isinstance(data, dict) else None
if uid:
    created_user_ids.append(uid)
ok = sc == 200 and roles == ["doctor"]
report(6, "'professional' se normaliza a 'doctor' antes de persistir",
       ok, f"sc={sc} | roles={roles}")

# ================================================================
# 7 — Dedupe preservando orden
# ================================================================
line(); print("Test 7 — desired_roles=['doctor','doctor','nutricionista'] (dedupe ordenado)")
p = base_payload(7)
p["desired_roles"] = ["doctor", "doctor", "nutricionista"]
sc, body = register(p)
data = body.get("data") if body else {}
roles = data.get("roles") if isinstance(data, dict) else None
uid = data.get("user_id") if isinstance(data, dict) else None
if uid:
    created_user_ids.append(uid)
ok = sc == 200 and roles == ["doctor", "nutricionista"]
report(7, "Dedupe elimina duplicados preservando orden de aparición",
       ok, f"sc={sc} | roles={roles} (esperado=['doctor','nutricionista'])")

# ================================================================
# 8 — Mix con alias + dedupe
# ================================================================
line(); print("Test 8 — desired_roles=['doctor','professional','entrenador'] (alias post-dedupe)")
p = base_payload(8)
p["desired_roles"] = ["doctor", "professional", "entrenador"]
sc, body = register(p)
data = body.get("data") if body else {}
roles = data.get("roles") if isinstance(data, dict) else None
uid = data.get("user_id") if isinstance(data, dict) else None
if uid:
    created_user_ids.append(uid)
# 'professional' → 'doctor' después de la normalización; el dedupe corre POST-alias
ok = sc == 200 and roles == ["doctor", "entrenador"]
report(8, "Alias se aplica antes del dedupe → 'doctor' aparece una sola vez",
       ok, f"sc={sc} | roles={roles} (esperado=['doctor','entrenador'])")

# ================================================================
# 9 — Negative: rol inválido en array
# ================================================================
line(); print("Test 9 — desired_roles=['doctor','oso'] → 400 con mensaje específico")
p = base_payload(9)
p["desired_roles"] = ["doctor", "oso"]
sc, body = register(p)
err_msg = (body.get("error") or {}).get("message", "") if body and not body.get("success") else ""
ok = sc == 400 and "oso" in err_msg.lower() and "inválido" in err_msg.lower()
report(9, "Rol inválido en array → 400 con mensaje específico ('oso')",
       ok, f"sc={sc} | err={err_msg}")

# ================================================================
# 10 — Negative: rol inválido en CSV
# ================================================================
line(); print("Test 10 — desired_role='doctor,oso' → 400")
p = base_payload(10)
p["desired_role"] = "doctor,oso"
sc, body = register(p)
err_msg = (body.get("error") or {}).get("message", "") if body and not body.get("success") else ""
ok = sc == 400 and "oso" in err_msg.lower()
report(10, "Rol inválido dentro del CSV string → 400",
       ok, f"sc={sc} | err={err_msg}")

# ================================================================
# 11 — Negative: sin ningún campo de rol
# ================================================================
line(); print("Test 11 — sin desired_roles ni desired_role → 400")
p = base_payload(11)  # sin agregar roles
sc, body = register(p)
err_msg = (body.get("error") or {}).get("message", "") if body and not body.get("success") else ""
ok = sc == 400 and "desired_roles" in err_msg.lower()
report(11, "Faltan ambos campos → 400 menciona 'desired_roles'",
       ok, f"sc={sc} | err={err_msg}")

# ================================================================
# 12 — Negative: array vacío sin desired_role fallback
# ================================================================
line(); print("Test 12 — desired_roles=[] sin desired_role → 400")
p = base_payload(12)
p["desired_roles"] = []
sc, body = register(p)
err_msg = (body.get("error") or {}).get("message", "") if body and not body.get("success") else ""
ok = sc == 400 and "desired_roles" in err_msg.lower()
report(12, "Array vacío sin fallback → 400",
       ok, f"sc={sc} | err={err_msg}")

# ================================================================
# CLEANUP — borrar los users + patients creados
# ================================================================
line(); print(f"CLEANUP — borrando {len(created_user_ids)} users de prueba + sus patients")
con_a = sqlite3.connect(AUTH_DB)
con_c = sqlite3.connect(CLINICAL_DB)
ca = con_a.cursor(); cc = con_c.cursor()
for uid in created_user_ids:
    cc.execute("DELETE FROM patients WHERE auth_user_id = ?", (uid,))
    ca.execute("DELETE FROM patient_user_link WHERE user_id = ?", (uid,))
    ca.execute("DELETE FROM users WHERE id = ?", (uid,))
con_a.commit(); con_c.commit()
con_a.close(); con_c.close()
print(f"      cleaned: user_ids={created_user_ids}")

# ================================================================
# RESUMEN
# ================================================================
print()
print("=" * 80)
total = len(results)
passed = sum(1 for r in results if r[2])
print(f"RESUMEN multi-rol register: {passed}/{total} OK")
print("=" * 80)
for step, label, ok, _ in results:
    print(f"  {str(step):3} {'OK' if ok else 'FAIL':5} {label}")

sys.exit(0 if passed == total else 1)
