"""
Tests funcionales de Fix 18 — refactor del plan nutricional con separación
macros/estructura, parámetros configurables, multi-entreno, persistencia
de auto-calculate, y wrapper del solver legacy.

Cubre los 8 OMVs del paso 5:
  OMV-45 PUT /plans separación macros vs structure (paciente vs specialist)
  OMV-46 POST /auto-calculate/accept (persistir opción elegida)
  OMV-47 parámetros_macros configurable en auto-calculate
  OMV-48 entreno se persiste en nutrition_plans
  OMV-49 multi-entreno + intensidad en save-config
  OMV-50 save-config acepta plan_id opcional
  OMV-51 libertad_pct alias de libertad
  OMV-52 wrapper de solver (no se testea directamente — solo es refactor interno)
"""

import json
import sqlite3
import sys
import time
from datetime import datetime

import requests

BASE = "http://localhost:8000/api/v3"
AUTH_DB = "src/auth.db"
CLINICAL_DB = "src/db/clinical.db"

ADMIN_EMAIL = "datoffaletti@gmail.com"
FLO_EMAIL = "noefernandezhurt@gmail.com"
FLO_USER_ID = 39
YAEL_EMAIL = "saiyankiwi@gmail.com"
YAEL_DNI = "12345678"
THIRD_DNI = "14732338"   # Miguel
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


# =============================================================
# SETUP
# =============================================================
line(); print("Setup — reset passwords + login + assignment + ensure goal")

# Reset known passwords
con = sqlite3.connect(AUTH_DB)
cur = con.cursor()
import bcrypt
hashed = bcrypt.hashpw(PWD.encode(), bcrypt.gensalt()).decode()
for uid in (2, 39, 41):
    cur.execute(
        'UPDATE users SET password_hash=?, status=?, is_active=1, membership_expires_at=NULL WHERE id=?',
        [hashed, 'active', uid]
    )
con.commit()
con.close()

# Resolve Yael patient_id
yp = db_query(CLINICAL_DB, "SELECT id FROM patients WHERE dni=?", (YAEL_DNI,))
YAEL_PID = yp[0]["id"] if yp else None
mp = db_query(CLINICAL_DB, "SELECT id FROM patients WHERE dni=?", (THIRD_DNI,))
MIGUEL_PID = mp[0]["id"] if mp else None

# Limpiar planes y assignments para arrancar fresco
db_exec(CLINICAL_DB, "DELETE FROM nutrition_plans WHERE patient_id=?", (YAEL_PID,))
db_exec(AUTH_DB, "DELETE FROM specialist_assignments WHERE specialist_id=? AND patient_dni=?",
        (FLO_USER_ID, YAEL_DNI))
db_exec(AUTH_DB, "DELETE FROM login_attempts")

sc, body = call("POST", "/auth/login", body={"email": FLO_EMAIL, "password": PWD})
TOKEN_FLO = (body.get("data") or {}).get("token") if sc == 200 else None
sc, body = call("POST", "/auth/login", body={"email": YAEL_EMAIL, "password": PWD})
TOKEN_YAEL = (body.get("data") or {}).get("token") if sc == 200 else None
sc, body = call("POST", "/auth/login", body={"email": ADMIN_EMAIL, "password": PWD})
TOKEN_ADMIN = (body.get("data") or {}).get("token") if sc == 200 else None
if not (TOKEN_FLO and TOKEN_YAEL and TOKEN_ADMIN):
    print("ABORT: login failed")
    sys.exit(1)

# Florencia ↔ Yael assignment
sc, body = call("POST", "/assignments/request", token=TOKEN_FLO, body={"patient_dni": YAEL_DNI})
assign_id = (body.get("data") or {}).get("assignment_id")
call("POST", f"/assignments/{assign_id}/accept", token=TOKEN_YAEL)

# Asegurar que Yael tiene un goal activo (lo borramos en Fix 17 cleanup)
db_exec(CLINICAL_DB, "DELETE FROM goals WHERE patient_id=?", (YAEL_PID,))
sc, body = call("POST", f"/users/{YAEL_DNI}/goals", token=TOKEN_YAEL, body={
    "peso_objetivo": 60, "bf_objetivo": 22, "ffmi_objetivo": 18,
    "source": "manual",
})
yael_goal_id = (body.get("data") or {}).get("goal_id")

# Crear un plan nutricional inicial para Yael (Florencia → Yael)
sc, body = call("POST", "/nutrition/plans", token=TOKEN_FLO, body={
    "nombre_apellido": "SaiyanKiwi",
    "calorias": 1800, "proteina": 130, "grasa": 55, "ch": 180,
    "factor_actividad": 1.5,
})
yael_plan_id = (body.get("data") or {}).get("id")

# Crear un plan para Miguel (cross-patient test) — usa Diego (admin)
sc, body = call("POST", "/nutrition/plans", token=TOKEN_ADMIN, body={
    "nombre_apellido": "Toffaletti, Miguel Angel",
    "calorias": 2200, "proteina": 150, "grasa": 70, "ch": 220,
})
miguel_plan_id = (body.get("data") or {}).get("id")
print(f"  YAEL_PID={YAEL_PID} | yael_plan_id={yael_plan_id} | miguel_plan_id={miguel_plan_id} | yael_goal_id={yael_goal_id}")
if not (yael_plan_id and miguel_plan_id):
    print("ABORT: setup nutrition_plans failed")
    sys.exit(1)


# =============================================================
# A) SCHEMA MIGRATIONS
# =============================================================
line(); print("A — Schema migrations en nutrition_plans")

cols = db_query(CLINICAL_DB, "PRAGMA table_info(nutrition_plans)")
present = {c.get("name") for c in cols}
new_cols = {
    "entreno_meal_key", "entreno_meal_keys_json", "entreno_intensidad",
    "comidas_config_json", "parametros_macros_json",
    "source_auto_calculate_id", "updated_by_user_id", "updated_at",
}
report(1, "nutrition_plans tiene 8 columnas nuevas (entreno + config + audit)",
       new_cols.issubset(present),
       f"missing={sorted(new_cols - present)}")


# =============================================================
# B) PUT /plans/<id>/macros — solo specialist/admin
# =============================================================
line(); print("B — PUT /plans/<id>/macros")

# Test 2 — Florencia (specialist asignada) → 200
sc, body = call("PUT", f"/nutrition/plans/{yael_plan_id}/macros", token=TOKEN_FLO, body={
    "calorias": 1900, "proteina": 140, "grasa": 60, "ch": 190,
})
report(2, "Florencia (specialist asignada) PUT /macros → 200",
       sc == 200,
       f"sc={sc} | resp={excerpt(body, 160)}")

# DB check
db_p = db_query(CLINICAL_DB,
    "SELECT calorias, proteina, updated_by_user_id, updated_at FROM nutrition_plans WHERE id=?",
    (yael_plan_id,))[0]
report("2b", "Macros + audit (updated_by + updated_at) persistidos en DB",
       abs((db_p.get("calorias") or 0) - 1900) < 0.1
       and abs((db_p.get("proteina") or 0) - 140) < 0.1
       and str(db_p.get("updated_by_user_id")) == str(FLO_USER_ID)
       and bool(db_p.get("updated_at")),
       f"DB={db_p}")

# Test 3 — Yael (owner puro) PUT → 403
sc, body = call("PUT", f"/nutrition/plans/{yael_plan_id}/macros", token=TOKEN_YAEL, body={
    "calorias": 1500,
})
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
report(3, "Yael (owner puro) PUT /macros → 403 FORBIDDEN",
       sc == 403 and err_code == "FORBIDDEN",
       f"sc={sc} | err_code={err_code}")

# Test 4 — PUT /macros con campo de structure → 400
sc, body = call("PUT", f"/nutrition/plans/{yael_plan_id}/macros", token=TOKEN_FLO, body={
    "calorias": 1900, "libertad": 5,
})
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
report(4, "PUT /macros con campo structure (libertad) → 400 VALIDATION_ERROR",
       sc == 400 and err_code == "VALIDATION_ERROR",
       f"sc={sc} | err_code={err_code}")


# =============================================================
# C) PUT /plans/<id>/structure — paciente puede usar
# =============================================================
line(); print("C — PUT /plans/<id>/structure")

# Test 5 — Yael (owner) PUT structure → 200
sc, body = call("PUT", f"/nutrition/plans/{yael_plan_id}/structure", token=TOKEN_YAEL, body={
    "libertad": 7,
    "dp": 0.30, "ap": 0.35, "cp": 0.35,  # distribución desayuno/almuerzo/cena para proteína
})
report(5, "Yael (owner) PUT /structure → 200",
       sc == 200,
       f"sc={sc} | resp={excerpt(body, 160)}")

db_p = db_query(CLINICAL_DB,
    "SELECT libertad, desayuno_p, almuerzo_p, cena_p FROM nutrition_plans WHERE id=?",
    (yael_plan_id,))[0]
report("5b", "Structure persiste: libertad=7, desayuno_p=0.30, almuerzo_p=0.35, cena_p=0.35",
       db_p.get("libertad") == 7
       and abs((db_p.get("desayuno_p") or 0) - 0.30) < 0.01
       and abs((db_p.get("almuerzo_p") or 0) - 0.35) < 0.01
       and abs((db_p.get("cena_p") or 0) - 0.35) < 0.01,
       f"DB={db_p}")

# Test 6 — libertad_pct alias funciona igual que libertad
sc, body = call("PUT", f"/nutrition/plans/{yael_plan_id}/structure", token=TOKEN_YAEL, body={
    "libertad_pct": 9,
})
db_p = db_query(CLINICAL_DB, "SELECT libertad FROM nutrition_plans WHERE id=?", (yael_plan_id,))[0]
report(6, "libertad_pct alias → mapea a la misma columna libertad (OMV-51)",
       sc == 200 and db_p.get("libertad") == 9,
       f"sc={sc} | DB libertad={db_p.get('libertad')} (esperado 9)")

# Test 7 — PUT /structure con macros → 400
sc, body = call("PUT", f"/nutrition/plans/{yael_plan_id}/structure", token=TOKEN_YAEL, body={
    "calorias": 2000,
})
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
report(7, "PUT /structure con macros (calorias) → 400 VALIDATION_ERROR",
       sc == 400 and err_code == "VALIDATION_ERROR",
       f"sc={sc} | err_code={err_code}")


# =============================================================
# D) PUT /plans/<id> general — auto-detección macros vs structure
# =============================================================
line(); print("D — PUT /plans/<id> general")

# Test 8 — Yael PUT con SOLO macros → 403 (auto-detect macros)
sc, body = call("PUT", f"/nutrition/plans/{yael_plan_id}", token=TOKEN_YAEL, body={
    "calorias": 1700,
})
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
report(8, "Yael PUT con SOLO macros → 403 (auto-detect requires elevated)",
       sc == 403 and err_code == "FORBIDDEN",
       f"sc={sc} | err_code={err_code}")

# Test 9 — Yael PUT con SOLO structure → 200 (mismo path)
sc, body = call("PUT", f"/nutrition/plans/{yael_plan_id}", token=TOKEN_YAEL, body={
    "libertad": 6,
})
report(9, "Yael PUT con SOLO structure → 200",
       sc == 200,
       f"sc={sc} | resp={excerpt(body, 160)}")


# =============================================================
# E) POST /plans/auto-calculate
# =============================================================
line(); print("E — POST /plans/auto-calculate con parametros_macros")

# Test 10 — Sin parametros_macros → defaults
sc, body = call("POST", "/nutrition/plans/auto-calculate", token=TOKEN_FLO, body={
    "nombre_apellido": "SaiyanKiwi",
    "factor_actividad": 1.5,
})
data = body.get("data") if body else {}
pm_used = data.get("parametros_macros_usados") if isinstance(data, dict) else {}
report(10, "auto-calculate sin parametros_macros → defaults (proteina 2.51 g/kg LM, etc.)",
       sc == 200 and isinstance(pm_used, dict)
       and abs((pm_used.get("proteina_g_per_kg_lm") or 0) - 2.513244) < 0.001
       and abs((pm_used.get("grasa_pct_kcal_min") or 0) - 0.30) < 0.001
       and abs((pm_used.get("grasa_g_per_kg_min") or 0) - 0.6) < 0.001,
       f"sc={sc} | parametros_usados={pm_used}")

# Test 11 — Con parametros_macros custom → respuesta refleja custom
custom_pm = {
    "proteina_g_per_kg_lm": 2.0,
    "grasa_pct_kcal_min": 0.25,
    "grasa_g_per_kg_min": 0.5,
}
sc, body = call("POST", "/nutrition/plans/auto-calculate", token=TOKEN_FLO, body={
    "nombre_apellido": "SaiyanKiwi",
    "factor_actividad": 1.5,
    "parametros_macros": custom_pm,
})
data = body.get("data") if body else {}
pm_used = data.get("parametros_macros_usados") if isinstance(data, dict) else {}
report(11, "auto-calculate con parametros_macros custom → response refleja custom (OMV-47)",
       sc == 200 and pm_used == custom_pm,
       f"sc={sc} | enviado={custom_pm} | devuelto={pm_used}")

# Test 12 — opciones_velocidad presente
opciones = data.get("opciones_velocidad") if isinstance(data, dict) else None
report(12, "auto-calculate devuelve opciones_velocidad (3 opciones para perdida/ganancia)",
       isinstance(opciones, list) and len(opciones) >= 1
       and all("calorias" in o for o in opciones),
       f"opciones_count={len(opciones) if isinstance(opciones, list) else 'n/a'}")


# =============================================================
# F) POST /plans/auto-calculate/accept
# =============================================================
line(); print("F — POST /auto-calculate/accept")

# Test 13 — Accept con opcion → persiste plan nuevo
opcion_elegida = {
    "calorias": 1750,
    "macros": {"proteina_g": 135, "grasa_g": 58, "carbohidratos_g": 175},
    "velocidad_semanal_kg": 0.3,
    "deficit_diario": 350,
}
sc, body = call("POST", "/nutrition/plans/auto-calculate/accept", token=TOKEN_FLO, body={
    "nombre_apellido": "SaiyanKiwi",
    "opcion": opcion_elegida,
    "factor_actividad": 1.5,
    "parametros_macros": custom_pm,
    "libertad": 5,
})
data = body.get("data") if body else {}
new_plan_id = data.get("plan_id") if isinstance(data, dict) else None
report(13, "POST /accept con opcion → 200 + plan_id nuevo + persisted=true",
       sc == 200 and new_plan_id is not None
       and data.get("persisted") is True
       and abs((data.get("calorias") or 0) - 1750) < 0.1,
       f"sc={sc} | plan_id={new_plan_id} | persisted={data.get('persisted')}")

# Test 14 — parametros_macros_json persistido en DB
db_p = db_query(CLINICAL_DB,
    "SELECT calorias, proteina, parametros_macros_json FROM nutrition_plans WHERE id=?",
    (new_plan_id,))[0]
pm_persisted = json.loads(db_p.get("parametros_macros_json") or "{}")
report(14, "DB persiste calorias + macros + parametros_macros_json (snapshot custom)",
       abs((db_p.get("calorias") or 0) - 1750) < 0.1
       and abs((db_p.get("proteina") or 0) - 135) < 0.1
       and pm_persisted == custom_pm,
       f"DB calorias={db_p.get('calorias')} | proteina={db_p.get('proteina')} | pm_json={pm_persisted}")

# Test 15 — Accept sin opcion → 400
sc, body = call("POST", "/nutrition/plans/auto-calculate/accept", token=TOKEN_FLO, body={
    "nombre_apellido": "SaiyanKiwi",
})
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
report(15, "POST /accept sin opcion (campos macros incompletos) → 400 VALIDATION_ERROR",
       sc == 400 and err_code == "VALIDATION_ERROR",
       f"sc={sc} | err_code={err_code}")

# Para los tests siguientes, usamos new_plan_id como plan activo de Yael
yael_active_plan_id = new_plan_id


# =============================================================
# G) POST /meal-plans/save-config
# =============================================================
line(); print("G — POST /meal-plans/save-config (multi-entreno + intensidad + plan_id)")

# Test 16 — Con plan_id explícito + multi-entreno + intensidad alta
sc, body = call("POST", "/nutrition/meal-plans/save-config", token=TOKEN_FLO, body={
    "nombre_apellido": "SaiyanKiwi",
    "plan_id": yael_active_plan_id,
    "comidas": {
        "desayuno": {"enabled": True, "size": "medium"},
        "almuerzo": {"enabled": True, "size": "large"},
        "merienda": {"enabled": True, "size": "small"},
        "cena": {"enabled": True, "size": "medium"},
    },
    "entreno_meal_keys": ["almuerzo", "merienda"],
    "entreno_intensidad": "alta",
})
data = body.get("data") if body else {}
report(16, "save-config con plan_id + multi-entreno + intensidad=alta → 200 + factor_aplicado=3.0",
       sc == 200
       and data.get("plan_id") == yael_active_plan_id
       and data.get("entreno_meal_keys") == ["almuerzo", "merienda"]
       and data.get("entreno_intensidad") == "alta"
       and abs((data.get("factor_aplicado") or 0) - 3.0) < 0.01,
       f"sc={sc} | plan_id={data.get('plan_id')} | keys={data.get('entreno_meal_keys')} | factor={data.get('factor_aplicado')}")

# Test 17 — DB persiste entreno_meal_keys_json + entreno_intensidad + comidas_config_json
db_p = db_query(CLINICAL_DB, """
    SELECT entreno_meal_key, entreno_meal_keys_json, entreno_intensidad,
           comidas_config_json, updated_by_user_id
    FROM nutrition_plans WHERE id=?
""", (yael_active_plan_id,))[0]
keys_json = json.loads(db_p.get("entreno_meal_keys_json") or "[]")
config_json = json.loads(db_p.get("comidas_config_json") or "{}")
report(17, "DB persiste entreno_meal_keys_json + entreno_intensidad + comidas_config_json + audit (OMV-48)",
       keys_json == ["almuerzo", "merienda"]
       and db_p.get("entreno_meal_key") == "almuerzo"  # legacy single = primero
       and db_p.get("entreno_intensidad") == "alta"
       and isinstance(config_json, dict) and "desayuno" in config_json
       and str(db_p.get("updated_by_user_id")) == str(FLO_USER_ID),
       f"DB={db_p}")

# Test 18 — Sin plan_id → usa el más reciente del paciente (= yael_active_plan_id)
sc, body = call("POST", "/nutrition/meal-plans/save-config", token=TOKEN_FLO, body={
    "nombre_apellido": "SaiyanKiwi",
    "comidas": {
        "desayuno": {"enabled": True, "size": "medium"},
        "cena": {"enabled": True, "size": "medium"},
    },
    "entreno_meal_keys": ["cena"],
    "entreno_intensidad": "media",
})
data = body.get("data") if body else {}
report(18, "save-config SIN plan_id → usa el más reciente del paciente",
       sc == 200 and data.get("plan_id") == yael_active_plan_id
       and abs((data.get("factor_aplicado") or 0) - 2.0) < 0.01,
       f"sc={sc} | plan_id={data.get('plan_id')} (esperado={yael_active_plan_id})")

# Test 19 — plan_id de OTRO paciente → 403 cross-patient (OMV-50)
sc, body = call("POST", "/nutrition/meal-plans/save-config", token=TOKEN_FLO, body={
    "nombre_apellido": "SaiyanKiwi",
    "plan_id": miguel_plan_id,  # ← plan de Miguel, no de Yael
    "comidas": {"desayuno": {"enabled": True, "size": "medium"}},
})
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
err_msg = (body.get("error") or {}).get("message", "") if body and not body.get("success") else ""
report(19, "save-config con plan_id de OTRO paciente → 403 (validación cross-patient)",
       sc == 403 and err_code == "FORBIDDEN" and "no pertenece" in err_msg.lower(),
       f"sc={sc} | err_msg={err_msg[:100]}")

# Test 20 — entreno_intensidad inválida → 400
sc, body = call("POST", "/nutrition/meal-plans/save-config", token=TOKEN_FLO, body={
    "nombre_apellido": "SaiyanKiwi",
    "comidas": {"desayuno": {"enabled": True, "size": "medium"}},
    "entreno_intensidad": "extrema",  # no válida
})
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
report(20, "entreno_intensidad inválida → 400 VALIDATION_ERROR",
       sc == 400 and err_code == "VALIDATION_ERROR",
       f"sc={sc} | err_code={err_code}")

# Test 21 — entreno_intensidad='baja' → factor=1.5
sc, body = call("POST", "/nutrition/meal-plans/save-config", token=TOKEN_FLO, body={
    "nombre_apellido": "SaiyanKiwi",
    "comidas": {
        "desayuno": {"enabled": True, "size": "medium"},
        "cena": {"enabled": True, "size": "medium"},
    },
    "entreno_meal_keys": ["desayuno"],
    "entreno_intensidad": "baja",
})
data = body.get("data") if body else {}
report(21, "intensidad='baja' → factor_aplicado=1.5",
       sc == 200 and abs((data.get("factor_aplicado") or 0) - 1.5) < 0.01,
       f"sc={sc} | factor={data.get('factor_aplicado')}")


# =============================================================
# H) NEGATIVES
# =============================================================
line(); print("H — Negatives")

# Test 22 — PUT /macros sin token → 401
sc, body = call("PUT", f"/nutrition/plans/{yael_plan_id}/macros", body={"calorias": 2000})
report(22, "PUT /macros sin token → 401 UNAUTHORIZED",
       sc == 401,
       f"sc={sc} | resp={excerpt(body, 130)}")


# =============================================================
# CLEANUP
# =============================================================
line(); print("CLEANUP — borrando planes test + goal + assignments")
db_exec(CLINICAL_DB, "DELETE FROM nutrition_plans WHERE patient_id=?", (YAEL_PID,))
if MIGUEL_PID:
    db_exec(CLINICAL_DB, "DELETE FROM nutrition_plans WHERE id=?", (miguel_plan_id,))
db_exec(CLINICAL_DB, "DELETE FROM goals WHERE patient_id=?", (YAEL_PID,))


# =============================================================
# RESUMEN
# =============================================================
print()
print("=" * 80)
total = len(results)
passed = sum(1 for r in results if r[2])
print(f"FIX 18 RESUMEN: {passed}/{total} OK")
print("=" * 80)
for step, label, ok, _ in results:
    print(f"  {str(step):4} {'OK' if ok else 'FAIL':5} {label}")

sys.exit(0 if passed == total else 1)
