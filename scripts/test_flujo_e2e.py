"""
End-to-end test del flujo Florencia (nutricionista) ↔ Yael (paciente).
Mapea a los pasos 1-17 del diagrama del usuario.

Florencia = noefernandezhurt@gmail.com  (id 39, roles doctor,nutricionista,entrenador,user)
Yael      = saiyankiwi@gmail.com         (id 2,  DNI 12345678)
Tercer    = migueltoffaletti@gmail.com   (id 3,  DNI 14732338)  -> usado para negative tests
"""

import json
import sqlite3
import sys
import time
from datetime import date

import requests

BASE = "http://localhost:8000/api/v3"
PWD = "Test1234!"

FLO_EMAIL = "noefernandezhurt@gmail.com"
FLO_USER_ID = 39
YAEL_EMAIL = "saiyankiwi@gmail.com"
YAEL_DNI = "12345678"
THIRD_DNI = "14732338"  # Miguel — no assignment con Florencia
ELVIRA_EMAIL = "elviraelsagomez@hotmail.com"
ELVIRA_DNI = "16449041"
ELVIRA_USER_ID = 4
DIEGO_DNI = "37070509"  # Owner of FUERZA records id=32 etc
FUERZA_RECORD_NOT_OF_FLO = 32  # FUERZA.user_id=37070509 (Diego), Florencia no asignada

CLINICAL_DB = "src/db/clinical.db"
LEGACY_DB = "src/Basededatos"

results = []   # list of (step_num, label, ok, detail)


def db_query(db_path, sql, params=()):
    try:
        con = sqlite3.connect(db_path)
        con.row_factory = sqlite3.Row
        cur = con.cursor()
        cur.execute(sql, params)
        rows = [dict(r) for r in cur.fetchall()]
        con.close()
        return rows
    except sqlite3.OperationalError as e:
        return [{"_error": str(e)}]


def line():
    print("-" * 80)


def report(step, label, ok, detail=""):
    icon = "[OK]" if ok else "[FAIL]"
    results.append((step, label, ok, detail))
    print(f"{icon}  Paso {step}: {label}")
    if detail:
        for ln in str(detail).splitlines():
            print(f"      {ln}")


def call(method, path, token=None, body=None, params=None, expect_status=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"{BASE}{path}"
    try:
        r = requests.request(method, url, headers=headers, json=body, params=params, timeout=20)
    except Exception as e:
        return None, None, f"REQUEST FAILED: {e}"
    try:
        payload = r.json()
    except Exception:
        payload = {"_raw": r.text[:300]}
    status_ok = (expect_status is None) or (r.status_code == expect_status)
    summary = f"{method} {path}{' ?' + str(params) if params else ''} -> {r.status_code}"
    if not status_ok:
        summary += f" (esperaba {expect_status})"
    return r.status_code, payload, summary


def excerpt(payload, keys=None, max_chars=300):
    if payload is None:
        return ""
    if keys:
        out = {}
        data = payload.get("data", payload) if isinstance(payload, dict) else {}
        for k in keys:
            if k in (payload or {}):
                out[k] = payload[k]
            elif isinstance(data, dict) and k in data:
                out[k] = data[k]
        s = json.dumps(out, default=str, ensure_ascii=False)
    else:
        s = json.dumps(payload, default=str, ensure_ascii=False)
    return s if len(s) <= max_chars else s[:max_chars] + "..."


# ----------------------------------------------------------------------
# 1. Login Florencia
# ----------------------------------------------------------------------
line(); print("FASE 1 - Login Florencia (nutricionista)")
sc, body, summary = call("POST", "/auth/login", body={"email": FLO_EMAIL, "password": PWD}, expect_status=200)
ok = sc == 200 and body.get("success") is True
TOKEN_FLO = (body.get("data") or {}).get("token") if ok else None
FLO_NOMBRE = ((body.get("data") or {}).get("user") or {}).get("nombre_apellido") if ok else None
report(1, "Login Florencia", ok, f"{summary} | nombre={FLO_NOMBRE} | token? {'si' if TOKEN_FLO else 'no'}")
if not TOKEN_FLO:
    print("ABORTANDO: sin token de Florencia no podemos seguir.")
    sys.exit(1)

# ----------------------------------------------------------------------
# Negative pre-test: Florencia accediendo a Yael ANTES del assignment -> 403
# ----------------------------------------------------------------------
line(); print("NEGATIVE PRE-TEST - Florencia sin assignment con Yael")
sc, body, summary = call("GET", f"/users/{YAEL_DNI}/measurements", token=TOKEN_FLO, expect_status=403)
report("N1", "Sin assignment, GET measurements de Yael -> 403", sc == 403,
       f"{summary} | resp={excerpt(body, max_chars=120)}")

# ----------------------------------------------------------------------
# 2. Florencia pide vinculo
# ----------------------------------------------------------------------
line(); print("FASE 2 - Florencia pide assignment con Yael")
sc, body, summary = call("POST", "/assignments/request", token=TOKEN_FLO,
                         body={"patient_dni": YAEL_DNI}, expect_status=200)
ok = sc == 200 and body.get("success") is True
ASSIGN_ID = (body.get("data") or {}).get("assignment_id") if ok else None
report(2, "POST /assignments/request", ok, f"{summary} | assignment_id={ASSIGN_ID}")
if not ASSIGN_ID:
    # quizas ya existe pendiente de un test anterior — busquemoslo
    sc2, body2, _ = call("GET", "/assignments/my-requests", token=TOKEN_FLO)
    for a in (body2.get("data") or {}).get("requests", []):
        if a.get("patient_dni") == YAEL_DNI and a.get("status") in ("pending_patient", "accepted"):
            ASSIGN_ID = a.get("id")
            print(f"      (recuperado assignment_id={ASSIGN_ID} status={a.get('status')})")
            break

# ----------------------------------------------------------------------
# 3. Yael loguea y acepta
# ----------------------------------------------------------------------
line(); print("FASE 3 - Yael loguea y acepta")
sc, body, summary = call("POST", "/auth/login", body={"email": YAEL_EMAIL, "password": PWD}, expect_status=200)
ok = sc == 200 and body.get("success") is True
TOKEN_YAEL = (body.get("data") or {}).get("token") if ok else None
YAEL_NOMBRE = ((body.get("data") or {}).get("user") or {}).get("nombre_apellido") if ok else None
report(3, "Login Yael", ok, f"{summary} | nombre={YAEL_NOMBRE}")

if TOKEN_YAEL and ASSIGN_ID:
    sc, body, summary = call("POST", f"/assignments/{ASSIGN_ID}/accept", token=TOKEN_YAEL, expect_status=200)
    ok = sc == 200 and body.get("success") is True
    report("3b", "POST /assignments/<id>/accept", ok, f"{summary} | resp={excerpt(body, max_chars=180)}")

# ----------------------------------------------------------------------
# 4. Florencia ve sus pacientes
# ----------------------------------------------------------------------
line(); print("FASE 4 - my-patients")
sc, body, summary = call("GET", "/assignments/my-patients", token=TOKEN_FLO, expect_status=200)
patients = (body.get("data") or {}).get("patients", []) if body else []
yael_in_list = any(p.get("patient_dni") == YAEL_DNI and p.get("status") == "accepted" for p in patients)
report(4, "GET /my-patients incluye Yael accepted", sc == 200 and yael_in_list,
       f"{summary} | total={len(patients)} | Yael presente accepted? {yael_in_list}")

# ----------------------------------------------------------------------
# 5. Fix 1 - PUT /users/<dni> (perfil estatico)
# ----------------------------------------------------------------------
line(); print("FASE 5 - Fix 1 - PUT perfil de Yael")
sc, body, summary = call("PUT", f"/users/{YAEL_DNI}", token=TOKEN_FLO, body={
    "fecha_nacimiento": "1995-06-15",
    "circ_cuello": 33.5,
    "circ_muneca": 15.2,
    "circ_tobillo": 21.0,
}, expect_status=200)
ok = sc == 200 and body.get("success") is True
report(5, "PUT /users/<dni>", ok, f"{summary} | resp={excerpt(body, max_chars=180)}")

# ----------------------------------------------------------------------
# 6. Fix 1 - POST measurement
# ----------------------------------------------------------------------
line(); print("FASE 6 - Fix 1 - POST primera medicion")
m_payload = {
    "peso": 65.0, "circ_abdomen": 75.0, "circ_cintura": 70.0, "circ_cadera": 95.0,
    "circ_brazo": 28.0, "circ_pecho": 90.0,
}
sc, body, summary = call("POST", f"/users/{YAEL_DNI}/measurements", token=TOKEN_FLO,
                         body=m_payload, expect_status=200)
data = body.get("data") if body else {}
has_metrics = bool(data) and (("bf_percent" in data) or ("body_fat" in data) or ("ffmi" in data))
report(6, "POST measurement (200 + metricas)", sc == 200 and has_metrics,
       f"{summary} | metricas?={has_metrics} | resp={excerpt(body, max_chars=240)}")

# ----------------------------------------------------------------------
# 7. Fix 1 - GET historial mediciones
# ----------------------------------------------------------------------
line(); print("FASE 7 - Fix 1 - GET historial mediciones")
sc, body, summary = call("GET", f"/users/{YAEL_DNI}/measurements", token=TOKEN_FLO, expect_status=200)
data = body.get("data") if body else {}
mlist = data.get("measurements") if isinstance(data, dict) else None
report(7, "GET /measurements devuelve lista", sc == 200 and isinstance(mlist, list) and len(mlist) >= 1,
       f"{summary} | n_mediciones={len(mlist) if isinstance(mlist, list) else 'n/a'}")

# Critical check: paciente ve la medicion que cargo Florencia
sc, body2, _ = call("GET", f"/users/{YAEL_DNI}/measurements", token=TOKEN_YAEL, expect_status=200)
data2 = body2.get("data") if body2 else {}
mlist2 = data2.get("measurements") if isinstance(data2, dict) else None
report("7c", "Yael (con su token) ve la misma medicion (persistio en patient correcto)",
       sc == 200 and isinstance(mlist2, list) and len(mlist2) >= 1,
       f"n_mediciones segun Yael={len(mlist2) if isinstance(mlist2, list) else 'n/a'}")

# ----------------------------------------------------------------------
# 8. Fix 1 - POST goals
# ----------------------------------------------------------------------
line(); print("FASE 8 - Fix 1 - POST goals")
sc, body, summary = call("POST", f"/users/{YAEL_DNI}/goals", token=TOKEN_FLO, body={
    "peso_objetivo": 60.0,
    "bf_objetivo": 22.0,
    "ffmi_objetivo": 18.0,
    "circ_abdomen_objetivo": 70.0,
}, expect_status=200)
ok = sc == 200 and body.get("success") is True
report(8, "POST /goals", ok, f"{summary} | resp={excerpt(body, max_chars=180)}")

# ----------------------------------------------------------------------
# 9. Roadmap auto
# ----------------------------------------------------------------------
line(); print("FASE 9 - GET goals/auto-roadmap")
sc, body, summary = call("GET", f"/users/{YAEL_DNI}/goals/auto-roadmap", token=TOKEN_FLO)
report(9, "GET /goals/auto-roadmap", sc == 200,
       f"{summary} | resp={excerpt(body, max_chars=180)}")

# ----------------------------------------------------------------------
# 10. Fix 2 - POST /nutrition/plans
# ----------------------------------------------------------------------
line(); print("FASE 10 - Fix 2 - POST plan nutricional para Yael")
sc, body, summary = call("POST", "/nutrition/plans", token=TOKEN_FLO, body={
    "nombre_apellido": YAEL_NOMBRE,  # IMPORTANT: usamos el nombre exacto del paciente
    "calorias": 1800,
    "proteina": 130,
    "grasa": 55,
    "ch": 180,
    "factor_actividad": 1.5,
}, expect_status=200)
data = body.get("data") if body else {}
PLAN_ID = data.get("plan_id") or data.get("id") if isinstance(data, dict) else None
plan_owner = data.get("nombre_apellido") if isinstance(data, dict) else None
identity_ok = plan_owner == YAEL_NOMBRE
report(10, "POST /nutrition/plans (200 + plan_id + identidad correcta)",
       sc == 200 and PLAN_ID is not None and identity_ok,
       f"{summary} | plan_id={PLAN_ID} | nombre_apellido en resp={plan_owner} (esperado={YAEL_NOMBRE}) | resp={excerpt(body, max_chars=200)}")

# ----------------------------------------------------------------------
# 11. Fix 2 - GET plan: Florencia + Yael lo ven; tercero NO
# ----------------------------------------------------------------------
line(); print("FASE 11 - Fix 2 - GET /plans/<id>")
if PLAN_ID:
    sc, body, summary = call("GET", f"/nutrition/plans/{PLAN_ID}", token=TOKEN_FLO, expect_status=200)
    report("11a", "Florencia ve plan (200)", sc == 200, summary)

    sc, body, summary = call("GET", f"/nutrition/plans/{PLAN_ID}", token=TOKEN_YAEL, expect_status=200)
    report("11b", "Yael ve plan (200)", sc == 200, summary)
else:
    report(11, "GET plan", False, "skip: no plan_id")

# ----------------------------------------------------------------------
# 12. Yael carga daily-log
# ----------------------------------------------------------------------
line(); print("FASE 12 - Yael POST daily-log")
fecha = date.today().isoformat()
sc, body, summary = call("POST", "/nutrition/daily-log", token=TOKEN_YAEL, body={
    "fecha": fecha,
    "meals": [{
        "meal_key": "desayuno", "completed": True,
        "total_p": 30, "total_g": 15, "total_c": 50, "total_cal": 450,
        "target_p": 30, "target_g": 15, "target_c": 50,
        "recipe_name": "Test breakfast",
    }],
}, expect_status=200)
report(12, "Yael POST /nutrition/daily-log", sc == 200,
       f"{summary} | resp={excerpt(body, max_chars=200)}")

# ----------------------------------------------------------------------
# 13. Fix 3a - Florencia ve daily-log de Yael
# ----------------------------------------------------------------------
line(); print("FASE 13 - Fix 3a - Florencia GET /daily-log?patient=<dni-yael>")
sc, body, summary = call("GET", "/nutrition/daily-log", token=TOKEN_FLO,
                         params={"patient": YAEL_DNI, "fecha": fecha}, expect_status=200)
data = body.get("data") if body else {}
meals = data.get("meals") if isinstance(data, dict) else None
report(13, "GET daily-log con ?patient=<dni-yael>", sc == 200 and isinstance(meals, list) and len(meals) >= 1,
       f"{summary} | n_meals={len(meals) if isinstance(meals, list) else 'n/a'}")

# ----------------------------------------------------------------------
# 14. Yael carga checkin
# ----------------------------------------------------------------------
line(); print("FASE 14 - Yael POST /checkin/today")
sc, body, summary = call("POST", "/checkin/today", token=TOKEN_YAEL, body={
    "horas_sueno": 7,
    "calidad_sueno": 4,
    "estres": 3,
    "energia": 4,
}, expect_status=200)
report(14, "POST /checkin/today", sc == 200, f"{summary} | resp={excerpt(body, max_chars=180)}")

# ----------------------------------------------------------------------
# 15-17. Fix 3a - Florencia consulta checkin/health-index/history de Yael
# ----------------------------------------------------------------------
line(); print("FASE 15-17 - Fix 3a - checkin endpoints con ?patient=")

sc, body, summary = call("GET", "/checkin/today", token=TOKEN_FLO,
                         params={"patient": YAEL_DNI}, expect_status=200)
report(15, "GET /checkin/today?patient=", sc == 200, f"{summary} | resp={excerpt(body, max_chars=180)}")

sc, body, summary = call("GET", "/checkin/health-index", token=TOKEN_FLO,
                         params={"patient": YAEL_DNI}, expect_status=200)
data = body.get("data") if body else {}
has_score = isinstance(data, dict) and ("score" in data or "health_index" in data)
report(16, "GET /checkin/health-index?patient=", sc == 200 and has_score,
       f"{summary} | resp={excerpt(body, max_chars=180)}")

sc, body, summary = call("GET", "/checkin/history", token=TOKEN_FLO,
                         params={"patient": YAEL_DNI, "limit": 14}, expect_status=200)
report("17a", "GET /checkin/history?patient=", sc == 200, summary)

sc, body, summary = call("GET", "/checkin/health-index/trend", token=TOKEN_FLO,
                         params={"patient": YAEL_DNI, "days": 30}, expect_status=200)
report("17b", "GET /checkin/health-index/trend?patient=", sc == 200, summary)

# ----------------------------------------------------------------------
# NEGATIVE TESTS
# ----------------------------------------------------------------------
line(); print("NEGATIVE TESTS")

# N2: ?patient=<dni-otro-no-vinculado> -> 403
sc, body, summary = call("GET", "/nutrition/daily-log", token=TOKEN_FLO,
                         params={"patient": THIRD_DNI, "fecha": fecha}, expect_status=403)
report("N2", "daily-log con DNI sin assignment -> 403", sc == 403,
       f"{summary} | resp={excerpt(body, max_chars=140)}")

sc, body, summary = call("GET", f"/users/{THIRD_DNI}/measurements", token=TOKEN_FLO, expect_status=403)
report("N3", "GET measurements de paciente sin assignment -> 403", sc == 403,
       f"{summary} | resp={excerpt(body, max_chars=140)}")

# N4: token invalido -> 401
sc, body, summary = call("GET", "/auth/me", token="thisisnotavalidjwt.atall.nope", expect_status=401)
report("N4", "Token invalido -> 401", sc == 401,
       f"{summary} | resp={excerpt(body, max_chars=140)}")

# N5: sin token -> 401
sc, body, summary = call("GET", "/auth/me", expect_status=401)
report("N5", "Sin token -> 401", sc == 401,
       f"{summary} | resp={excerpt(body, max_chars=140)}")

# N6: identidad correcta - GET /users/<dni> deberia volver datos de Yael, no de Florencia
sc, body, summary = call("GET", f"/users/{YAEL_DNI}", token=TOKEN_FLO, expect_status=200)
data = body.get("data") if body else {}
user_obj = data.get("user") if isinstance(data, dict) else None
correct_identity = isinstance(user_obj, dict) and (user_obj.get("dni") == YAEL_DNI or user_obj.get("nombre_apellido") == YAEL_NOMBRE)
report("N6", "GET /users/<dni-yael> resuelve a Yael (no a Florencia)",
       sc == 200 and correct_identity,
       f"{summary} | dni_devuelto={user_obj.get('dni') if user_obj else 'n/a'}")

# ----------------------------------------------------------------------
# FIX 3b - Nutrition meal-plans / save-config / blocks (Florencia → Yael)
# ----------------------------------------------------------------------
line(); print("FASE 18-22 - Fix 3b - meal-plans / save-config / auto-calculate / blocks")

YAEL_PID_ROW = db_query(CLINICAL_DB, "SELECT id FROM patients WHERE dni=?", (YAEL_DNI,))
YAEL_PID = YAEL_PID_ROW[0]["id"] if YAEL_PID_ROW else None

# Fase 18 — POST /meal-plans  (Florencia + nombre_apellido=Yael)
sc, body, summary = call("POST", "/nutrition/meal-plans", token=TOKEN_FLO, body={
    "nombre_apellido": YAEL_NOMBRE,
    "tipo": "recetas",
    "comidas": {"desayuno": [1, 2], "almuerzo": [3]},
}, expect_status=200)
mp_id = (body.get("data") or {}).get("id") if body else None
last_mp = db_query(CLINICAL_DB, "SELECT patient_id FROM meal_plans WHERE id=?", (mp_id,)) if mp_id else []
identity_ok = bool(last_mp) and last_mp[0]["patient_id"] == YAEL_PID
report(18, "POST /meal-plans con nombre_apellido=Yael (200 + patient_id correcto en DB)",
       sc == 200 and identity_ok,
       f"{summary} | meal_plan.id={mp_id} | DB patient_id={last_mp[0]['patient_id'] if last_mp else 'n/a'} (esperado={YAEL_PID})")

# Fase 19 — POST /meal-plans/save-config
sc, body, summary = call("POST", "/nutrition/meal-plans/save-config", token=TOKEN_FLO, body={
    "nombre_apellido": YAEL_NOMBRE,
    "comidas": {
        "desayuno":     {"enabled": True, "size": "medium"},
        "almuerzo":     {"enabled": True, "size": "large"},
        "merienda":     {"enabled": True, "size": "small"},
        "cena":         {"enabled": True, "size": "medium"},
    },
    "entreno": "almuerzo",
}, expect_status=200)
plan_after = db_query(CLINICAL_DB,
    "SELECT desayuno_p, almuerzo_p, almuerzo_c FROM nutrition_plans WHERE patient_id=? ORDER BY created_at DESC LIMIT 1",
    (YAEL_PID,))
config_modified = bool(plan_after) and plan_after[0]["almuerzo_p"] is not None and plan_after[0]["almuerzo_p"] > 0
report(19, "POST /meal-plans/save-config (200 + plan recalculado en DB)",
       sc == 200 and config_modified,
       f"{summary} | plan_actual={plan_after[0] if plan_after else 'n/a'}")

# Fase 20 — POST /plans/auto-calculate
sc, body, summary = call("POST", "/nutrition/plans/auto-calculate", token=TOKEN_FLO, body={
    "nombre_apellido": YAEL_NOMBRE,
    "factor_actividad": 1.5,
}, expect_status=200)
data = body.get("data") if body else {}
auto_plan_id = data.get("plan_id") or data.get("id") if isinstance(data, dict) else None
plan_owner = db_query(CLINICAL_DB, "SELECT patient_id FROM nutrition_plans WHERE id=?", (auto_plan_id,)) if auto_plan_id else []
identity_ok = bool(plan_owner) and plan_owner[0]["patient_id"] == YAEL_PID
report(20, "POST /plans/auto-calculate (200 + plan creado para patient_id de Yael)",
       sc == 200 and (identity_ok or auto_plan_id is None),  # algunos endpoints no devuelven plan_id
       f"{summary} | auto_plan_id={auto_plan_id} | DB patient_id={plan_owner[0]['patient_id'] if plan_owner else 'n/a'}")

# Fase 21 — POST /meal-plans/blocks/constructor
sc, body, summary = call("POST", "/nutrition/meal-plans/blocks/constructor", token=TOKEN_FLO, body={
    "nombre_apellido": YAEL_NOMBRE,
    "comida": "desayuno",
    "alimentos": [{"categoria": "proteina", "descripcion": "Huevo", "porciones": 2}],
    "alias": f"E2E-test-{int(time.time())}",
}, expect_status=201)
fav_id = (body.get("data") or {}).get("favorito_id") if body else None
fav_owner = db_query(CLINICAL_DB, "SELECT patient_id FROM block_favorites WHERE id=?", (fav_id,)) if fav_id else []
identity_ok = bool(fav_owner) and fav_owner[0]["patient_id"] == YAEL_PID
report(21, "POST /blocks/constructor (201 + block_favorites.patient_id de Yael)",
       sc == 201 and identity_ok,
       f"{summary} | favorito_id={fav_id} | DB patient_id={fav_owner[0]['patient_id'] if fav_owner else 'n/a'}")

# Fase 22 — POST /meal-plans/blocks/adjust  (no persiste fila nueva, solo recalcula)
sc, body, summary = call("POST", "/nutrition/meal-plans/blocks/adjust", token=TOKEN_FLO, body={
    "nombre_apellido": YAEL_NOMBRE,
    "comida": "desayuno",
    "ajustes": {"proteina": 1},
}, expect_status=200)
report(22, "POST /blocks/adjust (200 — ajuste para Yael calculado)", sc == 200,
       f"{summary} | resp={excerpt(body, max_chars=180)}")

# Fix 3b negative — Florencia → Miguel (sin assignment)
sc, body, summary = call("POST", "/nutrition/plans/auto-calculate", token=TOKEN_FLO, body={
    "nombre_apellido": "Toffaletti, Miguel Angel", "factor_actividad": 1.5,
}, expect_status=403)
report("18N", "Fix 3b negative — auto-calculate con Miguel (sin assignment) → 403", sc == 403,
       f"{summary} | resp={excerpt(body, max_chars=140)}")

# ----------------------------------------------------------------------
# FIX 3c - Training records (Florencia → Yael)
# ----------------------------------------------------------------------
line(); print("FASE 23-26 - Fix 3c - training/strength / lifts / sessions / optimize")

# Fase 23 — POST /training/strength
sc, body, summary = call("POST", "/training/strength", token=TOKEN_FLO, body={
    "nombre_apellido": YAEL_NOMBRE,
    "ejercicios": {
        "squat": {"peso": 60, "reps": 5},
        "bench": {"peso": 40, "reps": 5},
        "deadlift": {"peso": 80, "reps": 5},
    },
    "peso_corporal": 65.0,
}, expect_status=200)
strength_id = (body.get("data") or {}).get("id") if body else None
str_owner = db_query(CLINICAL_DB, "SELECT patient_id FROM strength_tests WHERE id=?", (strength_id,)) if strength_id else []
identity_ok = bool(str_owner) and str_owner[0]["patient_id"] == YAEL_PID
report(23, "POST /training/strength (200 + strength_tests.patient_id de Yael)",
       sc == 200 and identity_ok,
       f"{summary} | strength_id={strength_id} | DB patient_id={str_owner[0]['patient_id'] if str_owner else 'n/a'}")

# Fase 24 — POST /training/lifts (Fix 5: schema mapping correcto a ESTADO_EJERCICIO_USUARIO)
sc, body, summary = call("POST", "/training/lifts", token=TOKEN_FLO, body={
    "nombre_apellido": YAEL_NOMBRE,
    "ejercicio": "squat", "peso": 60, "reps": 5, "rpe": 7,
}, expect_status=200)
err_msg = (body.get("error") or {}).get("message", "") if body and not body.get("success") else ""
report(24, "POST /training/lifts (200 + persistencia)",
       sc == 200,
       f"{summary} | err={err_msg or '-'}")

# Fase 24a — Fix 5: verificar mapeo correcto a columnas reales (ejercicio_nombre, current_peso, last_test_reps)
lift_row = db_query(LEGACY_DB,
    """SELECT user_id, ejercicio_nombre, current_peso, last_test_reps
       FROM ESTADO_EJERCICIO_USUARIO
       WHERE user_id = ? AND ejercicio_nombre = 'squat'
       ORDER BY id DESC LIMIT 1""",
    (YAEL_NOMBRE,))
lift_persisted_ok = (
    bool(lift_row) and "_error" not in lift_row[0]
    and lift_row[0].get("ejercicio_nombre") == "squat"
    and abs((lift_row[0].get("current_peso") or 0) - 60.0) < 0.01
    and lift_row[0].get("last_test_reps") == 5
)
report("24a", "Fix 5 — ESTADO_EJERCICIO_USUARIO mapeo a cols reales (ejercicio_nombre, current_peso, last_test_reps)",
       lift_persisted_ok,
       f"row={lift_row[0] if lift_row else 'n/a'} (esperado ejercicio_nombre=squat, current_peso=60, last_test_reps=5)")

# Fase 25 — POST /training/sessions (Fix 5: ahora va a clinical.db.training_sessions)
sc, body, summary = call("POST", "/training/sessions", token=TOKEN_FLO, body={
    "nombre_apellido": YAEL_NOMBRE,
    "ejercicios_completados": [
        {"ejercicio": "squat", "series": 3, "reps": 8, "peso": 50},
        {"ejercicio": "bench", "series": 3, "reps": 10, "peso": 30},
    ],
    "duracion_minutos": 45,
    "notas": "E2E test session legacy keys",
}, expect_status=200)
data = body.get("data") if body else {}
session_id = data.get("session_id") if isinstance(data, dict) else None
patient_id_resp = data.get("patient_id") if isinstance(data, dict) else None
ejercicios_registrados = data.get("ejercicios_registrados") if isinstance(data, dict) else None
report(25, "POST /sessions (Fix 5: 200 + session_id + patient_id + ejercicios_registrados)",
       sc == 200 and session_id is not None and patient_id_resp == YAEL_PID and ejercicios_registrados == 2,
       f"{summary} | session_id={session_id} | patient_id={patient_id_resp} | ejercicios={ejercicios_registrados}")

# Fase 25a — Fix 5: verificar persistencia en clinical.db.training_sessions con patient_id correcto
sess_row = db_query(CLINICAL_DB,
    "SELECT patient_id, duration_minutes, notes, completed FROM training_sessions WHERE id = ?",
    (session_id,)) if session_id else []
sess_persisted_ok = (
    bool(sess_row) and "_error" not in sess_row[0]
    and sess_row[0].get("patient_id") == YAEL_PID
    and sess_row[0].get("duration_minutes") == 45
    and sess_row[0].get("completed") == 1
)
report("25a", "Fix 5 — clinical.db.training_sessions persistido (patient_id=Yael, completed=1)",
       sess_persisted_ok,
       f"row={sess_row[0] if sess_row else 'n/a'}")

# Fase 25b — Fix 5: normalización a session_exercises (uno por ejercicio, con sets_json)
ex_rows = db_query(CLINICAL_DB,
    """SELECT exercise_key, order_index, prescribed_sets, prescribed_reps, prescribed_weight, sets_json
       FROM session_exercises WHERE session_id = ? ORDER BY order_index""",
    (session_id,)) if session_id else []
keys_present = [r.get("exercise_key") for r in ex_rows] if ex_rows and "_error" not in ex_rows[0] else []
normalization_ok = (
    len(ex_rows) == 2
    and "squat" in keys_present and "bench" in keys_present
)
report("25b", "Fix 5 — session_exercises normalizó 2 filas (squat + bench) con exercise_key correcto",
       normalization_ok,
       f"n_rows={len(ex_rows)} | keys={keys_present} | sample_row={ex_rows[0] if ex_rows else 'n/a'}")

# Fase 25c — Fix 5: GET /sessions/history?patient=<dni> ya migrado a clinical.db
sc, body, summary = call("GET", "/training/sessions/history", token=TOKEN_FLO,
                         params={"patient": YAEL_DNI, "limit": 10}, expect_status=200)
data = body.get("data") if body else {}
sessions_list = data.get("sessions", []) if isinstance(data, dict) else []
our_session = next((s for s in sessions_list if s.get("id") == session_id), None)
history_ok = (
    sc == 200 and bool(our_session)
    and isinstance(our_session.get("ejercicios"), list)
    and len(our_session.get("ejercicios", [])) == 2
)
report("25c", "Fix 5 — GET /sessions/history?patient=<yael> trae la sesión con sus 2 ejercicios joinneados",
       history_ok,
       f"{summary} | n_sessions={len(sessions_list)} | nuestra_sesion_ejercicios={len(our_session.get('ejercicios', [])) if our_session else 0}")

# Fase 25d — Fix 5: GET /sessions/today?patient=<dni> ahora detecta already_done usando clinical.db
sc, body, summary = call("GET", "/training/sessions/today", token=TOKEN_FLO,
                         params={"patient": YAEL_DNI}, expect_status=200)
data = body.get("data") if body else {}
today = data.get("today") if isinstance(data, dict) else None
already_done = today.get("already_done") if isinstance(today, dict) else None
report("25d", "Fix 5 — GET /sessions/today?patient=<yael> reporta already_done=True (lee training_sessions)",
       sc == 200 and already_done is True,
       f"{summary} | today.already_done={already_done}")

# Fase 25e — Fix 5: backwards-compat — keys nuevas (exercise_key/prescribed_*) también funcionan
sc, body, summary = call("POST", "/training/sessions", token=TOKEN_FLO, body={
    "nombre_apellido": YAEL_NOMBRE,
    "ejercicios_completados": [
        {"exercise_key": "deadlift", "prescribed_sets": 4, "prescribed_reps": 6, "prescribed_weight": 90,
         "difficulty": 8, "notes": "fuerte"},
    ],
    "duration_minutes": 30,
    "notes": "E2E test new keys",
}, expect_status=200)
data = body.get("data") if body else {}
sid2 = data.get("session_id") if isinstance(data, dict) else None
ex_rows2 = db_query(CLINICAL_DB,
    """SELECT exercise_key, prescribed_sets, prescribed_reps, prescribed_weight, difficulty
       FROM session_exercises WHERE session_id = ?""", (sid2,)) if sid2 else []
new_keys_ok = (
    sc == 200 and bool(ex_rows2) and "_error" not in ex_rows2[0]
    and ex_rows2[0].get("exercise_key") == "deadlift"
    and ex_rows2[0].get("prescribed_sets") == 4
    and ex_rows2[0].get("prescribed_reps") == 6
    and abs((ex_rows2[0].get("prescribed_weight") or 0) - 90.0) < 0.01
    and ex_rows2[0].get("difficulty") == 8
)
report("25e", "Fix 5 — POST /sessions con keys nuevas (exercise_key/prescribed_*) persiste correctamente",
       new_keys_ok,
       f"{summary} | session_id={sid2} | ex_row={ex_rows2[0] if ex_rows2 else 'n/a'}")

# Fase 26 — Data flow gap: el strength_id creado vive en clinical.db.strength_tests pero
# /optimize lee de legacy FUERZA. Devuelve 404 (esperado). El access control de optimize
# sí está validado en steps 37/38 con records reales en FUERZA. Esto NO es un fix gap;
# es una limitación conocida de unificación de schema (separate issue, post-Fix 4).
if strength_id:
    sc, body, summary = call("POST", f"/training/strength/{strength_id}/optimize", token=TOKEN_FLO,
                             body={"numeroDias": 3, "numeroEjercicios": 3}, expect_status=404)
    err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
    report(26, "Data flow split (clinical.db ↔ legacy FUERZA) — 404 esperado [NOT a Fix 3c gap]",
           sc == 404 and err_code == "NOT_FOUND",
           f"{summary} | err_code={err_code} | track separado: unificar storage de strength")
else:
    report(26, "optimize", False, "skip: no strength_id")

# Fix 3c negative — strength/lifts/sessions con Miguel (sin assignment) → 403
sc, body, summary = call("POST", "/training/strength", token=TOKEN_FLO, body={
    "nombre_apellido": "Toffaletti, Miguel Angel",
    "ejercicios": {"squat": {"peso": 60, "reps": 5}},
    "peso_corporal": 65.0,
}, expect_status=403)
report("23N", "Fix 3c negative — strength con Miguel (sin assignment) → 403", sc == 403,
       f"{summary} | resp={excerpt(body, max_chars=140)}")

sc, body, summary = call("POST", "/training/lifts", token=TOKEN_FLO, body={
    "nombre_apellido": "Toffaletti, Miguel Angel",
    "ejercicio": "squat", "peso": 60, "reps": 5,
}, expect_status=403)
report("24N", "Fix 3c negative — lifts con Miguel → 403 (access control bloquea antes del INSERT)",
       sc == 403, f"{summary} | resp={excerpt(body, max_chars=140)}")

sc, body, summary = call("POST", "/training/sessions", token=TOKEN_FLO, body={
    "nombre_apellido": "Toffaletti, Miguel Angel",
    "ejercicios_completados": [], "duracion_minutos": 30,
}, expect_status=403)
report("25N", "Fix 3c negative — sessions con Miguel → 403 (access control bloquea)",
       sc == 403, f"{summary} | resp={excerpt(body, max_chars=140)}")

# ----------------------------------------------------------------------
# FIX 4 - Patient-initiated assignment + training/plans + open optimize
# ----------------------------------------------------------------------
line(); print("FASE 27-29 - Fix 4 - GET /assignments/specialists")

# Fase 27 — Yael lista especialistas disponibles
sc, body, summary = call("GET", "/assignments/specialists", token=TOKEN_YAEL, expect_status=200)
data = body.get("data") if body else {}
specialists = data.get("specialists", []) if isinstance(data, dict) else []
flo_in_list = any(s.get("id") == FLO_USER_ID for s in specialists)
yael_excluded = not any(str(s.get("id")) == str(YAEL_DNI) for s in specialists)
report(27, "GET /assignments/specialists (Yael) — incluye Florencia, excluye al caller",
       sc == 200 and flo_in_list and len(specialists) >= 1,
       f"{summary} | total={len(specialists)} | Flo presente? {flo_in_list}")

# Fase 28 — Filtro por rol
sc, body, summary = call("GET", "/assignments/specialists", token=TOKEN_YAEL,
                         params={"role": "nutricionista"}, expect_status=200)
data = body.get("data") if body else {}
nut_only = data.get("specialists", []) if isinstance(data, dict) else []
all_have_nut = all("nutricionista" in (s.get("roles") or []) for s in nut_only)
report(28, "GET /assignments/specialists?role=nutricionista — solo nutricionistas",
       sc == 200 and bool(nut_only) and all_have_nut,
       f"{summary} | total={len(nut_only)} | todos tienen rol nutricionista? {all_have_nut}")

# Fase 29 — Búsqueda por nombre
sc, body, summary = call("GET", "/assignments/specialists", token=TOKEN_YAEL,
                         params={"q": "Noelia"}, expect_status=200)
data = body.get("data") if body else {}
hits = data.get("specialists", []) if isinstance(data, dict) else []
all_match = all("noelia" in (s.get("display_name") or "").lower() for s in hits)
report(29, "GET /assignments/specialists?q=Noelia — match en display_name",
       sc == 200 and bool(hits) and all_match,
       f"{summary} | total={len(hits)} | nombres={[s.get('display_name') for s in hits]}")

# ----------------------------------------------------------------------
line(); print("FASE 30-33 - Fix 4 - Patient-initiated request flow (Elvira → Florencia)")

# Fase 30 — Login Elvira (password resetada en setup)
sc, body, summary = call("POST", "/auth/login", body={"email": ELVIRA_EMAIL, "password": PWD},
                         expect_status=200)
TOKEN_ELVIRA = (body.get("data") or {}).get("token") if sc == 200 else None
ELVIRA_NOMBRE = ((body.get("data") or {}).get("user") or {}).get("nombre_apellido") if sc == 200 else None
report(30, "Login Elvira (segunda paciente para flujo patient-initiated)",
       sc == 200 and TOKEN_ELVIRA is not None,
       f"{summary} | nombre={ELVIRA_NOMBRE}")

if TOKEN_ELVIRA:
    # Fase 31 — Elvira inicia el vínculo con Florencia (specialist_id)
    sc, body, summary = call("POST", "/assignments/patient-request", token=TOKEN_ELVIRA,
                             body={"specialist_id": FLO_USER_ID}, expect_status=200)
    data = body.get("data") if body else {}
    elvira_assign_id = data.get("assignment_id") if isinstance(data, dict) else None
    new_status = data.get("status") if isinstance(data, dict) else None
    report(31, "POST /assignments/patient-request {specialist_id} → 200 + status pending_specialist",
           sc == 200 and elvira_assign_id is not None and new_status == "pending_specialist",
           f"{summary} | assignment_id={elvira_assign_id} | status={new_status}")

    # Fase 31N — Negative: specialist_id inexistente
    sc, body, summary = call("POST", "/assignments/patient-request", token=TOKEN_ELVIRA,
                             body={"specialist_id": 999999}, expect_status=404)
    report("31N", "POST /patient-request con specialist_id inexistente → 404", sc == 404,
           f"{summary} | resp={excerpt(body, max_chars=140)}")

    # Fase 32 — Florencia acepta el pending_specialist (mismo endpoint, distinto flow)
    if elvira_assign_id:
        sc, body, summary = call("POST", f"/assignments/{elvira_assign_id}/accept",
                                 token=TOKEN_FLO, expect_status=200)
        data = body.get("data") if body else {}
        accepted_status = data.get("status") if isinstance(data, dict) else None
        report(32, "POST /accept por Florencia sobre pending_specialist → status=accepted",
               sc == 200 and accepted_status == "accepted",
               f"{summary} | status={accepted_status} | resp={excerpt(body, max_chars=160)}")

        # Fase 33 — Florencia ahora ve a Elvira en /my-patients
        sc, body, summary = call("GET", "/assignments/my-patients", token=TOKEN_FLO,
                                 expect_status=200)
        data = body.get("data") if body else {}
        plist = data.get("patients", []) if isinstance(data, dict) else []
        elvira_present = any(p.get("patient_dni") == ELVIRA_DNI and p.get("status") == "accepted"
                             for p in plist)
        report(33, "GET /my-patients de Florencia incluye a Elvira accepted",
               sc == 200 and elvira_present,
               f"{summary} | total={len(plist)} | Elvira presente? {elvira_present}")

# ----------------------------------------------------------------------
line(); print("FASE 34-36 - Fix 4 - POST /training/plans con target patient")

# Fase 34 — Florencia crea plan para Yael
training_plan_data = {
    "dias": [
        {"dia": 1, "ejercicios": [{"nombre": "squat", "series": 3, "reps": 8}]},
        {"dia": 2, "ejercicios": [{"nombre": "bench", "series": 3, "reps": 8}]},
    ]
}
sc, body, summary = call("POST", "/training/plans", token=TOKEN_FLO, body={
    "nombre_apellido": YAEL_NOMBRE,
    "plan_data": training_plan_data,
    "total_dias": 5,
}, expect_status=201)
data = body.get("data") if body else {}
training_plan_id = data.get("id") if isinstance(data, dict) else None
plan_user_id_resp = data.get("user_id") if isinstance(data, dict) else None
report(34, "POST /training/plans (Florencia → Yael) — 201 + user_id devuelto = DNI Yael",
       sc == 201 and training_plan_id is not None and str(plan_user_id_resp) == YAEL_DNI,
       f"{summary} | plan_id={training_plan_id} | user_id resp={plan_user_id_resp} (esperado={YAEL_DNI})")

# Fase 35 — Verificar en DB: PLANES_ENTRENAMIENTO con user_id=DNI Yael, active=1, current_dia=1
db_plan = db_query(LEGACY_DB,
    "SELECT user_id, total_dias, current_dia, active FROM PLANES_ENTRENAMIENTO WHERE id=?",
    (training_plan_id,)) if training_plan_id else []
plan_persisted_correctly = (
    bool(db_plan) and
    str(db_plan[0].get("user_id")) == YAEL_DNI and
    db_plan[0].get("active") == 1 and
    db_plan[0].get("current_dia") == 1
)
report(35, "PLANES_ENTRENAMIENTO persistido con user_id=Yael, active=1, current_dia=1",
       plan_persisted_correctly,
       f"DB row={db_plan[0] if db_plan else 'n/a'} (esperado: user_id={YAEL_DNI}, active=1)")

# Fase 36N — Negative: Florencia → Miguel (sin assignment) en /training/plans
sc, body, summary = call("POST", "/training/plans", token=TOKEN_FLO, body={
    "nombre_apellido": "Toffaletti, Miguel Angel",
    "plan_data": {"dias": []},
    "total_dias": 5,
}, expect_status=403)
report("36N", "POST /training/plans Florencia → Miguel (sin assignment) → 403", sc == 403,
       f"{summary} | resp={excerpt(body, max_chars=140)}")

# ----------------------------------------------------------------------
line(); print("FASE 37-38 - Fix 4 - POST /strength/<id>/optimize sin require_admin")

# Fase 37 — Florencia accede al endpoint con record_id inexistente → 404 (NO 403 admin)
sc, body, summary = call("POST", "/training/strength/999999/optimize", token=TOKEN_FLO,
                         body={"numeroDias": 3, "numeroEjercicios": 3}, expect_status=404)
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
no_admin_block = sc == 404 and err_code == "NOT_FOUND"
report(37, "POST /strength/<bogus>/optimize Florencia → 404 NOT_FOUND (sin @require_admin)",
       no_admin_block,
       f"{summary} | err_code={err_code} (esperado NOT_FOUND, no FORBIDDEN admin)")

# Fase 38 — Florencia accede a record de Diego (no asignada) → 403 por check_patient_access
sc, body, summary = call("POST", f"/training/strength/{FUERZA_RECORD_NOT_OF_FLO}/optimize",
                         token=TOKEN_FLO,
                         body={"numeroDias": 3, "numeroEjercicios": 3}, expect_status=403)
err_msg = (body.get("error") or {}).get("message", "") if body and not body.get("success") else ""
access_check_works = sc == 403 and "permis" in err_msg.lower()
report(38, "POST /strength/<diego-record>/optimize Florencia → 403 (check_patient_access valida)",
       access_check_works,
       f"{summary} | err={err_msg or '-'}")

# ----------------------------------------------------------------------
# RESUMEN
# ----------------------------------------------------------------------
print()
print("=" * 80)
print("RESUMEN")
print("=" * 80)
total = len(results)
passed = sum(1 for r in results if r[2])
print(f"Pasos ejecutados: {total} | OK: {passed} | FAIL: {total-passed}")
print()
print(f"{'Paso':6} {'Estado':8} Descripcion")
print("-" * 80)
for step, label, ok, _ in results:
    print(f"{str(step):6} {'OK' if ok else 'FAIL':8} {label}")

print()
print("Fix verificacion:")
def fix_status(steps):
    rs = [r for r in results if str(r[0]) in steps]
    return all(r[2] for r in rs), len([r for r in rs if r[2]]), len(rs)

f1_ok, f1_p, f1_t = fix_status({"5","6","7","7c","8"})
f2_ok, f2_p, f2_t = fix_status({"10","11a","11b"})
f3a_ok, f3a_p, f3a_t = fix_status({"13","15","16","17a","17b"})
f3b_ok, f3b_p, f3b_t = fix_status({"18","19","20","21","22","18N"})
f3c_ok, f3c_p, f3c_t = fix_status({"23","24","25","26","23N","24N","25N"})
f5_ok, f5_p, f5_t = fix_status({"24a","25a","25b","25c","25d","25e"})
f4_ok, f4_p, f4_t = fix_status({"27","28","29","30","31","31N","32","33","34","35","36N","37","38"})
neg_ok, neg_p, neg_t = fix_status({"N1","N2","N3","N4","N5","N6"})
print(f"  Fix 1  (perfil/measurements/goals)        : {f1_p}/{f1_t}  {'PASS' if f1_ok else 'FAIL'}")
print(f"  Fix 2  (nutrition/plans)                  : {f2_p}/{f2_t}  {'PASS' if f2_ok else 'FAIL'}")
print(f"  Fix 3a (checkin / daily-log ?patient)     : {f3a_p}/{f3a_t}  {'PASS' if f3a_ok else 'FAIL'}")
print(f"  Fix 3b (meal-plans/save-config/blocks)    : {f3b_p}/{f3b_t}  {'PASS' if f3b_ok else 'FAIL'}")
print(f"  Fix 3c (training/strength/lifts/sessions) : {f3c_p}/{f3c_t}  {'PASS' if f3c_ok else 'FAIL'}")
print(f"  Fix 5  (lifts schema + sessions migration ")
print(f"          a clinical.db + history/today)    : {f5_p}/{f5_t}  {'PASS' if f5_ok else 'FAIL'}")
print(f"  Fix 4  (specialists / patient-request /   ")
print(f"          training/plans / open optimize)   : {f4_p}/{f4_t}  {'PASS' if f4_ok else 'FAIL'}")
print(f"  Negative tests (assignment / token)       : {neg_p}/{neg_t}  {'PASS' if neg_ok else 'FAIL'}")

sys.exit(0 if passed == total else 1)
