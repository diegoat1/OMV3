"""
Tests funcionales de Fix 15 — refactor de users (perfil constitucional vs medición
dinámica), validación de tipos+rangos, GET /static-profile, PUT /measurements,
y la corrección crítica del Navy BF (OMV-33: resta de cuello).

Cubre los 9 OMVs cerrados:
  OMV-23 PUT users sin validar tipos/rangos
  OMV-24 Sin endpoint perfil constitucional
  OMV-25 Falta envergadura
  OMV-28 Measurements sin validar rangos
  OMV-29 Mezcla estáticos/dinámicos
  OMV-30 No hay PUT measurement
  OMV-31 Sin audit en measurements (created_by/updated_by)
  OMV-32 fecha_registro sin validar (5 años atrás max)
  OMV-33 🔴 Navy sin resta de cuello (regresión)

Usa los pacientes ya en DB:
  Florencia (Noelia, id 39, doctor+nutricionista+entrenador) → admin/specialist
  Yael (saiyankiwi, id 2, DNI 12345678, sexo=F, altura=170.5, circ_cuello=33)
  Miguel (id 3, DNI 14732338) → negative tests (sin assignment)
"""

import json
import math
import sqlite3
import sys
import time
from datetime import datetime, timedelta

import requests

BASE = "http://localhost:8000/api/v3"
AUTH_DB = "src/auth.db"
CLINICAL_DB = "src/db/clinical.db"

ADMIN_EMAIL = "datoffaletti@gmail.com"
ADMIN_PWD = "Test1234!"
FLO_EMAIL = "noefernandezhurt@gmail.com"
FLO_USER_ID = 39
YAEL_EMAIL = "saiyankiwi@gmail.com"
YAEL_DNI = "12345678"
THIRD_DNI = "14732338"  # Miguel sin assignment con Florencia
PWD = "Test1234!"

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


def db_exec(db, sql, params=()):
    con = sqlite3.connect(db)
    cur = con.cursor()
    cur.execute(sql, params)
    con.commit()
    con.close()


def call(method, path, token=None, body=None, params=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.request(method, f"{BASE}{path}", headers=headers,
                             json=body, params=params, timeout=15)
        try:
            payload = r.json()
        except Exception:
            payload = {"_raw": r.text[:300]}
        return r.status_code, payload
    except Exception as e:
        return None, {"_request_error": str(e)}


def excerpt(payload, n=200):
    if payload is None:
        return ""
    s = json.dumps(payload, default=str, ensure_ascii=False)
    return s if len(s) <= n else s[:n] + "..."


def navy_bf_female_with_cuello(altura_cm, circ_cuello, circ_cintura, circ_cadera):
    """Navy BF para mujeres CON resta de cuello (Fix 15)."""
    arg = circ_cintura + circ_cadera - circ_cuello
    return 495 / (1.29579 - 0.35004 * math.log10(arg) + 0.22100 * math.log10(altura_cm)) - 450


def navy_bf_female_buggy(altura_cm, circ_cintura, circ_cadera):
    """Navy BF SIN resta de cuello (versión rota pre-Fix 15)."""
    arg = circ_cintura + circ_cadera
    return 495 / (1.29579 - 0.35004 * math.log10(arg) + 0.22100 * math.log10(altura_cm)) - 450


# ============================================================
# SETUP — limpiar assignments stale, login admin/Florencia/Yael, recrear vínculo
# ============================================================
line(); print("Setup — limpiar + login + assignment Florencia↔Yael")
db_exec(AUTH_DB, "DELETE FROM specialist_assignments WHERE specialist_id=? AND patient_dni=?",
        (FLO_USER_ID, YAEL_DNI))
db_exec(AUTH_DB, "DELETE FROM login_attempts")

sc, body = call("POST", "/auth/login", body={"email": FLO_EMAIL, "password": PWD})
TOKEN_FLO = (body.get("data") or {}).get("token") if sc == 200 else None
sc, body = call("POST", "/auth/login", body={"email": YAEL_EMAIL, "password": PWD})
TOKEN_YAEL = (body.get("data") or {}).get("token") if sc == 200 else None
sc, body = call("POST", "/auth/login", body={"email": ADMIN_EMAIL, "password": ADMIN_PWD})
TOKEN_ADMIN = (body.get("data") or {}).get("token") if sc == 200 else None
if not (TOKEN_FLO and TOKEN_YAEL and TOKEN_ADMIN):
    print("ABORT: login failed")
    sys.exit(1)

# Recreate assignment so Florencia is the assigned specialist
sc, body = call("POST", "/assignments/request", token=TOKEN_FLO, body={"patient_dni": YAEL_DNI})
assign_id = (body.get("data") or {}).get("assignment_id")
call("POST", f"/assignments/{assign_id}/accept", token=TOKEN_YAEL)
print(f"  tokens OK | assignment_id={assign_id}")


# ============================================================
# A) SCHEMA MIGRATIONS
# ============================================================
line(); print("A — Schema migrations")

cols_p = db_query(CLINICAL_DB, "PRAGMA table_info(patients)")
present_p = {c.get("name") for c in cols_p}
report(1, "patients.envergadura column exists",
       "envergadura" in present_p,
       f"present_subset={[c for c in present_p if c in ('envergadura','altura','circ_cuello')]}")

cols_m = db_query(CLINICAL_DB, "PRAGMA table_info(measurements)")
present_m = {c.get("name") for c in cols_m}
audit_cols = {"created_by_user_id", "created_by_role", "updated_by_user_id", "updated_at"}
report(2, "measurements audit columns (created_by_*, updated_by_*)",
       audit_cols.issubset(present_m),
       f"missing={sorted(audit_cols - present_m)}")


# ============================================================
# B) PUT /users — validación constitucional
# ============================================================
line(); print("B — PUT /users con validación")

# 3: envergadura válida persiste
sc, body = call("PUT", f"/users/{YAEL_DNI}", token=TOKEN_FLO, body={"envergadura": 175.0})
db_p = db_query(CLINICAL_DB, "SELECT envergadura FROM patients WHERE dni=?", (YAEL_DNI,))[0]
report(3, "PUT con envergadura válida (175) → 200 + persiste",
       sc == 200 and abs(float(db_p.get("envergadura") or 0) - 175.0) < 0.01,
       f"sc={sc} | DB envergadura={db_p.get('envergadura')}")

# 4: envergadura fuera de rango (RANGES['envergadura']=(50,280))
sc, body = call("PUT", f"/users/{YAEL_DNI}", token=TOKEN_FLO, body={"envergadura": 500})
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
err_details = (body.get("error") or {}).get("details", {}).get("fields", {}) if body else {}
report(4, "PUT con envergadura=500 (>280) → 400 VALIDATION_ERROR + details.fields.envergadura",
       sc == 400 and err_code == "VALIDATION_ERROR" and "envergadura" in err_details,
       f"sc={sc} | err_code={err_code} | fields_in_details={list(err_details.keys())}")

# 5: altura no numérica
sc, body = call("PUT", f"/users/{YAEL_DNI}", token=TOKEN_FLO, body={"altura": "muy alta"})
err_details = (body.get("error") or {}).get("details", {}).get("fields", {}) if body else {}
report(5, "PUT con altura no numérica → 400 + details.fields.altura",
       sc == 400 and "altura" in err_details,
       f"sc={sc} | fields_in_details={list(err_details.keys())}")

# 6: sexo inválido
sc, body = call("PUT", f"/users/{YAEL_DNI}", token=TOKEN_FLO, body={"sexo": "X"})
err_details = (body.get("error") or {}).get("details", {}).get("fields", {}) if body else {}
report(6, "PUT con sexo='X' → 400 + details.fields.sexo",
       sc == 400 and "sexo" in err_details,
       f"sc={sc} | fields_in_details={list(err_details.keys())}")

# 7: telefono inválido
sc, body = call("PUT", f"/users/{YAEL_DNI}", token=TOKEN_FLO, body={"telefono": "abc"})
err_details = (body.get("error") or {}).get("details", {}).get("fields", {}) if body else {}
report(7, "PUT con telefono inválido → 400 + details.fields.telefono",
       sc == 400 and "telefono" in err_details,
       f"sc={sc} | fields_in_details={list(err_details.keys())}")


# ============================================================
# C) GET /static-profile
# ============================================================
line(); print("C — GET /static-profile")

# 8: Florencia (assigned specialist) ve perfil de Yael
sc, body = call("GET", f"/users/{YAEL_DNI}/static-profile", token=TOKEN_FLO)
data = body.get("data") if body else {}
expected_fields = {"user_id", "patient_id", "dni", "nombre", "sexo", "altura", "envergadura",
                   "fecha_nacimiento", "circ_cuello", "circ_muneca", "circ_tobillo",
                   "perfil_completo"}
present_fields = set(data.keys()) if isinstance(data, dict) else set()
report(8, "GET /static-profile (Florencia → Yael) — 200 + todos los campos esperados",
       sc == 200 and expected_fields.issubset(present_fields),
       f"sc={sc} | missing={sorted(expected_fields - present_fields)}")

# 9: perfil_completo true cuando sexo + altura + circ_cuello están
report(9, "perfil_completo=true cuando sexo + altura + circ_cuello están seteados",
       data.get("perfil_completo") is True
       and bool(data.get("sexo"))
       and data.get("altura") is not None
       and data.get("circ_cuello") is not None,
       f"perfil_completo={data.get('perfil_completo')} | sexo={data.get('sexo')} | altura={data.get('altura')} | circ_cuello={data.get('circ_cuello')} | envergadura={data.get('envergadura')}")

# 10: third user sin assignment → 403
sc, body = call("GET", f"/users/{THIRD_DNI}/static-profile", token=TOKEN_FLO)
report(10, "GET /static-profile de paciente sin assignment → 403",
       sc == 403,
       f"sc={sc} | resp={excerpt(body, 130)}")


# ============================================================
# D) POST /measurements — Navy correcto + validaciones
# ============================================================
line(); print("D — POST /measurements (Navy con cuello + validaciones + audit)")

# 11 — POST con datos válidos. Verifico bf_percent contra fórmula manual (con cuello)
peso, ca, ci, ch = 65.0, 75.0, 70.0, 95.0
sc, body = call("POST", f"/users/{YAEL_DNI}/measurements", token=TOKEN_FLO, body={
    "peso": peso, "circ_abdomen": ca, "circ_cintura": ci, "circ_cadera": ch,
    "circ_brazo": 28.0,
})
data = body.get("data") if body else {}
mid = data.get("id") if isinstance(data, dict) else None
api_bf = data.get("bf_percent") if isinstance(data, dict) else None
expected_bf_correct = round(navy_bf_female_with_cuello(170.5, 33, ci, ch), 2)
expected_bf_buggy = round(navy_bf_female_buggy(170.5, ci, ch), 2)
report(11, f"POST measurement → 200 + bf_percent ≈ {expected_bf_correct} (Navy CON cuello)",
       sc == 200 and api_bf is not None
       and abs(float(api_bf) - expected_bf_correct) < 0.5,
       f"sc={sc} | api_bf={api_bf} | esperado_correct={expected_bf_correct} | esperado_buggy={expected_bf_buggy}")

# 12 — Critical OMV-33: API output coincide con fórmula CON cuello, NO con la buggy
api_matches_correct = api_bf is not None and abs(float(api_bf) - expected_bf_correct) < 0.5
api_matches_buggy = api_bf is not None and abs(float(api_bf) - expected_bf_buggy) < 0.5
report(12, "OMV-33: API usa Navy CON resta de cuello (no la fórmula bugged)",
       api_matches_correct and not api_matches_buggy,
       f"matches_correct={api_matches_correct} | matches_buggy={api_matches_buggy}")

# 13 — POST con campo estático en body → 400 (rechazo de mezcla — OMV-29)
sc, body = call("POST", f"/users/{YAEL_DNI}/measurements", token=TOKEN_FLO, body={
    "peso": 65.0, "circ_abdomen": 75.0, "circ_cintura": 70.0, "circ_cadera": 95.0,
    "altura": 175,  # ← estático que no debería ir acá
})
err_msg = (body.get("error") or {}).get("message", "") if body and not body.get("success") else ""
report(13, "POST con campo estático (altura) → 400 + mensaje aclara usar PUT /users",
       sc == 400 and "altura" in err_msg,
       f"sc={sc} | err_msg={err_msg[:140]}")

# 14 — POST con peso fuera de rango (RANGES['peso']=(20,300))
sc, body = call("POST", f"/users/{YAEL_DNI}/measurements", token=TOKEN_FLO, body={
    "peso": 999, "circ_abdomen": 75, "circ_cintura": 70, "circ_cadera": 95,
})
err_details = (body.get("error") or {}).get("details", {}).get("fields", {}) if body else {}
report(14, "POST con peso=999 → 400 VALIDATION_ERROR + details.fields.peso",
       sc == 400 and "peso" in err_details,
       f"sc={sc} | fields={list(err_details.keys())}")

# 15 — POST con fecha_registro 6 años en el pasado (OMV-32)
old_date = (datetime.now() - timedelta(days=365 * 6)).strftime("%Y-%m-%d")
sc, body = call("POST", f"/users/{YAEL_DNI}/measurements", token=TOKEN_FLO, body={
    "peso": 65, "circ_abdomen": 75, "circ_cintura": 70, "circ_cadera": 95,
    "fecha_registro": old_date,
})
err_details = (body.get("error") or {}).get("details", {}).get("fields", {}) if body else {}
report(15, f"POST con fecha_registro 6 años atrás ({old_date}) → 400 + details.fields.fecha_registro",
       sc == 400 and "fecha_registro" in err_details,
       f"sc={sc} | fields={list(err_details.keys())}")

# 16 — created_by persistido en DB (OMV-31)
db_m = db_query(CLINICAL_DB,
    "SELECT created_by_user_id, created_by_role FROM measurements WHERE id=?", (mid,))
created_audit = db_m[0] if db_m and "_error" not in db_m[0] else {}
report(16, "Measurement persiste created_by_user_id + created_by_role del caller (Florencia)",
       str(created_audit.get("created_by_user_id")) == str(FLO_USER_ID)
       and bool(created_audit.get("created_by_role")),
       f"DB row={created_audit} | esperado user_id={FLO_USER_ID}")


# ============================================================
# E) PUT /measurements/<mid> — recálculo + audit
# ============================================================
line(); print("E — PUT /measurements (recalcula derivados + updated_by)")

# 17 — PUT corrige peso, recalcula bf_percent (no debe cambiar mucho — peso no afecta bf Navy,
# pero peso_magro/graso sí). Bf ↔ circunferencias, peso afecta peso_magro = peso*(1-bf/100)
new_peso = 70.0
sc, body = call("PUT", f"/users/{YAEL_DNI}/measurements/{mid}", token=TOKEN_FLO, body={
    "peso": new_peso,
})
data = body.get("data") if body else {}
new_peso_magro = data.get("peso_magro") if isinstance(data, dict) else None
expected_peso_magro = round(new_peso * (1 - expected_bf_correct / 100), 2)
report(17, f"PUT measurement con peso={new_peso} → 200 + peso_magro recalculado ≈ {expected_peso_magro}",
       sc == 200 and new_peso_magro is not None
       and abs(float(new_peso_magro) - expected_peso_magro) < 0.5,
       f"sc={sc} | peso_magro_api={new_peso_magro} | esperado={expected_peso_magro}")

# 18 — updated_by_user_id + updated_at persisten
db_m = db_query(CLINICAL_DB,
    "SELECT updated_by_user_id, updated_at FROM measurements WHERE id=?", (mid,))[0]
report(18, "PUT persiste updated_by_user_id + updated_at",
       str(db_m.get("updated_by_user_id")) == str(FLO_USER_ID)
       and bool(db_m.get("updated_at")),
       f"DB row={db_m}")

# 19 — PUT con campo estático en body → 400
sc, body = call("PUT", f"/users/{YAEL_DNI}/measurements/{mid}", token=TOKEN_FLO, body={
    "circ_cuello": 35,  # ← estático
})
err_msg = (body.get("error") or {}).get("message", "") if body and not body.get("success") else ""
report(19, "PUT measurement con campo estático (circ_cuello) → 400 + aclara usar PUT /users",
       sc == 400 and "circ_cuello" in err_msg,
       f"sc={sc} | err_msg={err_msg[:140]}")

# 20 — PUT recalcula bf cuando cambian circunferencias (sanity: bf cambia)
new_ci = 80.0  # cintura mayor
sc, body = call("PUT", f"/users/{YAEL_DNI}/measurements/{mid}", token=TOKEN_FLO, body={
    "circ_cintura": new_ci,
})
data = body.get("data") if body else {}
new_bf = data.get("bf_percent") if isinstance(data, dict) else None
expected_new_bf = round(navy_bf_female_with_cuello(170.5, 33, new_ci, ch), 2)
report(20, f"PUT con circ_cintura={new_ci} recalcula bf ≈ {expected_new_bf} (Navy con cuello)",
       sc == 200 and new_bf is not None
       and abs(float(new_bf) - expected_new_bf) < 0.5,
       f"sc={sc} | api_bf={new_bf} | esperado={expected_new_bf}")


# ============================================================
# RESUMEN
# ============================================================
print()
print("=" * 80)
total = len(results)
passed = sum(1 for r in results if r[2])
print(f"FIX 15 RESUMEN: {passed}/{total} OK")
print("=" * 80)
for step, label, ok, _ in results:
    print(f"  {str(step):3} {'OK' if ok else 'FAIL':5} {label}")

sys.exit(0 if passed == total else 1)
