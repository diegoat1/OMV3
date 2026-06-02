"""
Tests funcionales de Fix 12 — paso 6 (Training).
Cubre los 7 OMVs:
  OMV-53 POST /plans/<id>/optimize ejecuta PuLP real
  OMV-55 /plans + /sessions/{current,today,advance,complete} migrados a clinical.db
  OMV-56 helpers de training reemplazan imports legacy (functions / main)
  OMV-57 /strength/standards consulta strength_standards (50 filas)
  OMV-58 /strength/<id>/optimize alias deprecado de /plans/<id>/optimize
  OMV-59 /programs y /programs/<id> consultan training_programs (7 filas)
  OMV-61 /sessions/complete avanza exercise_progress; /sessions/advance gira cycle_week

Auth: minta JWT directamente con JWT_SECRET para no depender del password local.
"""

import json
import os
import sqlite3
import sys
from datetime import datetime, timedelta

import jwt
import requests

ROOT = "http://localhost:8000/api/v3"
BASE = f"{ROOT}/training"
CLINICAL_DB = "src/db/clinical.db"
JWT_SECRET = os.getenv("JWT_SECRET", "omega_medicina_secret_key_2025")

ADMIN = {
    "user_id": 41, "dni": "37070509", "email": "datoffaletti@gmail.com",
    "nombre_apellido": "Toffaletti, Diego Alejandro",
    "rol": "admin", "is_admin": True,
}
PATIENT_ID = 42  # Toffaletti
# strength_test con datos completos (lift_inputs, lifts_results, categories_results).
# El #6 es mas reciente pero le falta categories_results_json — el optimizer lo
# rechaza silenciosamente. El #5 es el ultimo con dataset completo.
STRENGTH_TEST_ID = 5

results = []


def line():
    print("-" * 80)


def report(step, label, ok, detail=""):
    icon = "[OK]  " if ok else "[FAIL]"
    results.append((step, label, ok, detail))
    print(f"{icon} Test {step}: {label}")
    if detail:
        for ln in str(detail).splitlines():
            print(f"       {ln}")


def mint_token(claims=None):
    payload = dict(ADMIN)
    if claims:
        payload.update(claims)
    payload["iat"] = datetime.utcnow()
    payload["exp"] = datetime.utcnow() + timedelta(hours=2)
    tok = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return tok if isinstance(tok, str) else tok.decode()


def call(method, path, token=None, body=None, params=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.request(method, f"{BASE}{path}", headers=headers,
                             json=body, params=params, timeout=30)
        try:
            return r.status_code, r.json(), r
        except Exception:
            return r.status_code, {"_raw": r.text[:500]}, r
    except Exception as e:
        return 0, {"_error": str(e)}, None


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


def main():
    print("=" * 80)
    print("FIX 12 — PASO 6 (TRAINING) — SMOKE TEST")
    print(f"Base URL: {BASE}")
    print(f"Patient: id={PATIENT_ID} (Toffaletti, Diego Alejandro)")
    print(f"Strength test seed: id={STRENGTH_TEST_ID}")
    print("=" * 80)

    try:
        r = requests.get(f"{ROOT}/health", timeout=5)
        sc = r.status_code
        body = r.json()
    except Exception as e:
        report(0, "API health", False, str(e)); sys.exit(1)
    if sc != 200:
        report(0, "API health", False, f"status={sc}")
        sys.exit(1)
    report(0, "API health", True, "v3 healthy")

    token = mint_token()
    sc, body, _ = call("GET", "/strength", token=token)
    if sc != 200:
        report(0, "JWT mint smoke (GET /strength)", False,
               f"status={sc} body={json.dumps(body)[:200]}")
        sys.exit(1)
    report(0, "JWT mint smoke (GET /strength)", True,
           f"strength_data.id={(body.get('data', {}).get('strength_data') or {}).get('id')}")

    line()

    # ----------------------------------------------------------------------
    # OMV-57 : /strength/standards
    # ----------------------------------------------------------------------
    print(">>> OMV-57: /strength/standards (clinical.db.strength_standards, 50 filas)")
    line()

    sc, body, _ = call("GET", "/strength/standards")
    ok = (
        sc == 200 and body.get("success")
        and isinstance(body["data"]["standards"], dict)
        and len(body["data"]["standards"]) >= 5
    )
    detail = f"status={sc} lifts={list(body.get('data', {}).get('standards', {}).keys())} sex={body.get('data', {}).get('sex')}"
    report("57.1", "GET /strength/standards (default = M, 5 lifts)", ok, detail)

    sc, body, _ = call("GET", "/strength/standards", params={"sex": "F"})
    ok = (
        sc == 200
        and body["data"]["sex"] == "F"
        and len(body["data"]["standards"]) >= 5
        and abs(body["data"]["standards"]["squat"]["beginner"] - 0.55) < 0.01
    )
    report("57.2", "GET /strength/standards?sex=F (squat.beginner=0.55)", ok,
           f"squat.beginner={body.get('data', {}).get('standards', {}).get('squat', {}).get('beginner')}")

    sc, body, _ = call("GET", "/strength/standards", params={"lift": "deadlift"})
    standards = body.get("data", {}).get("standards", {})
    ok = sc == 200 and list(standards.keys()) == ["deadlift"]
    report("57.3", "GET /strength/standards?lift=deadlift (filter por un solo lift)", ok,
           f"keys={list(standards.keys())}")

    rows = db_query(CLINICAL_DB, "SELECT COUNT(*) AS n FROM strength_standards")
    report("57.4", "DB: strength_standards seed = 50 filas", rows[0]["n"] == 50,
           f"count={rows[0]['n']}")

    line()

    # ----------------------------------------------------------------------
    # OMV-59 : /programs y /programs/<id>
    # ----------------------------------------------------------------------
    print(">>> OMV-59: /programs (clinical.db.training_programs, 7 filas)")
    line()

    sc, body, _ = call("GET", "/programs")
    progs = body.get("data", {}).get("programs", [])
    ok = sc == 200 and len(progs) == 7 and any(p["id"] == "warrior-90" for p in progs)
    report("59.1", "GET /programs (7 programas)", ok,
           f"total={len(progs)} ids={[p['id'] for p in progs[:3]]}...")

    sc, body, _ = call("GET", "/programs/warrior-90")
    pdata = body.get("data", {}).get("program") or body.get("data", {})
    ok = sc == 200 and pdata.get("titulo", "").startswith("Rutina de Entrenamiento Guerrero")
    report("59.2", "GET /programs/warrior-90", ok,
           f"titulo={pdata.get('titulo')}")

    sc, body, _ = call("GET", "/programs/no-existe-xx")
    ok = sc == 404
    report("59.3", "GET /programs/no-existe-xx -> 404", ok, f"status={sc}")

    line()

    # ----------------------------------------------------------------------
    # Snapshot del estado pre-test para poder validar invariantes
    # ----------------------------------------------------------------------
    plans_before = db_query(
        CLINICAL_DB,
        "SELECT id, current_day, total_days, active, cycle_week FROM training_plans_v2 "
        "WHERE patient_id=? ORDER BY id DESC", (PATIENT_ID,)
    )
    active_before = [p for p in plans_before if p["active"]]
    print(f">>> snapshot: planes patient_id={PATIENT_ID} -> {len(plans_before)} (activos={len(active_before)})")
    if active_before:
        print(f"    activo id={active_before[0]['id']} day={active_before[0]['current_day']}/"
              f"{active_before[0]['total_days']} cycle_week={active_before[0]['cycle_week']}")
    line()

    # ----------------------------------------------------------------------
    # OMV-53 : POST /plans/<id>/optimize
    # ----------------------------------------------------------------------
    print(">>> OMV-53: POST /plans/<id>/optimize (PuLP real)")
    line()

    plan_id = active_before[0]["id"] if active_before else None
    if plan_id is None:
        report("53.0", "Plan activo previo", False, "no hay plan activo para PATIENT_ID=42")
        sys.exit(2)

    sc, body, _ = call("POST", f"/plans/{plan_id}/optimize", token=token, body={
        "numeroDias": 4, "numeroEjercicios": 3,
        "source_strength_id": STRENGTH_TEST_ID,
    })
    data = body.get("data", {}) if sc == 200 else {}
    new_plan_id = data.get("plan_id")
    opt = data.get("optimizationResults", {})
    rel = data.get("relativeData", {})
    plan_ent = opt.get("planEntrenamiento", {})
    ok = (
        sc == 200 and isinstance(new_plan_id, int) and new_plan_id != plan_id
        and isinstance(plan_ent, dict) and len(plan_ent) > 0
    )
    report("53.1", "POST /plans/<id>/optimize -> 200, plan nuevo persistido", ok,
           f"status={sc} previous={plan_id} new={new_plan_id} dias={list(plan_ent.keys())}")

    if ok:
        report("53.2", "Opt result trae 4 dias x 3 ejercicios",
               len(plan_ent) == 4 and all(isinstance(v, list) and len(v) == 3 for v in plan_ent.values()),
               f"dias={list(plan_ent.keys())} sizes={[len(v) for v in plan_ent.values()]}")
        report("53.3", "relativeData no vacio (categories + exercises)",
               bool(rel.get("categories")) and bool(rel.get("exercises")),
               f"cats={len(rel.get('categories', {}))} exs={len(rel.get('exercises', {}))}")

        new_active = db_query(CLINICAL_DB,
            "SELECT id, total_days, active, source_strength_id FROM training_plans_v2 "
            "WHERE patient_id=? AND active=1", (PATIENT_ID,))
        is_only_active = len(new_active) == 1 and new_active[0]["id"] == new_plan_id
        report("53.4", "DB: nuevo plan es el unico activo (deactiva los anteriores)",
               is_only_active,
               f"active_now={[p['id'] for p in new_active]}")
        report("53.5", "DB: source_strength_id persiste",
               new_active and new_active[0]["source_strength_id"] == STRENGTH_TEST_ID,
               f"source_strength_id={new_active[0]['source_strength_id'] if new_active else '-'}")

    line()

    # ----------------------------------------------------------------------
    # OMV-55 : /plans (GET/POST/<id>) + /sessions/{current,today}
    # ----------------------------------------------------------------------
    print(">>> OMV-55: /plans + /sessions/{current,today,advance,complete}")
    line()

    sc, body, _ = call("GET", "/plans", token=token)
    plans_api = body.get("data", {}).get("plans", [])
    ok = sc == 200 and len(plans_api) >= len(plans_before) and len(plans_api) >= 1
    report("55.1", "GET /plans (lista desde clinical.db)", ok,
           f"total={len(plans_api)} ids={[p.get('id') for p in plans_api[:5]]}")

    if plans_api:
        pid = plans_api[0]["id"]
        sc2, body2, _ = call("GET", f"/plans/{pid}", token=token)
        ok2 = sc2 == 200 and body2.get("data", {}).get("plan", {}).get("id") == pid
        report("55.2", "GET /plans/<id>", ok2, f"status={sc2} returned id={body2.get('data', {}).get('plan', {}).get('id')}")

    sc, body, _ = call("POST", "/plans", token=token, body={
        "plan_data": {"dias": [
            {"dia": 1, "ejercicios": ["benchPress", "row"]},
            {"dia": 2, "ejercicios": ["squat", "deadlift"]},
        ]},
        "total_dias": 2,
        "name": "Test Manual Plan (fix12)",
    })
    new_manual_id = body.get("data", {}).get("id") if sc == 201 else None
    ok = sc == 201 and isinstance(new_manual_id, int)
    report("55.3", "POST /plans (crear plan manual)", ok,
           f"status={sc} new_id={new_manual_id}")

    sc, body, _ = call("GET", "/sessions/current", token=token)
    cur = body.get("data", {})
    ok = sc == 200 and (cur.get("plan_id") or cur.get("plan") or cur.get("dia_actual") is not None or "ejercicio" in cur or "current_session" in cur or cur != {})
    report("55.4", "GET /sessions/current", sc == 200,
           f"status={sc} keys={list(cur.keys())[:6]}")

    sc, body, _ = call("GET", "/sessions/today", token=token)
    today = body.get("data", {}).get("today")
    ok = sc == 200 and today and "ejercicios" in today and len(today["ejercicios"]) > 0
    first = today["ejercicios"][0] if ok else {}
    report("55.5", "GET /sessions/today (ejercicios + prescription)", ok,
           f"plan_id={today.get('plan_id') if today else None} "
           f"day={today.get('dia_actual') if today else None}/{today.get('total_dias') if today else None} "
           f"first={first.get('exercise_key')} prescription={first.get('prescription')}")

    line()

    # ----------------------------------------------------------------------
    # OMV-61 : /sessions/complete + /sessions/advance + cycle_week
    # ----------------------------------------------------------------------
    print(">>> OMV-61: /sessions/complete avanza exercise_progress; cycle_week se incrementa al cierre del ciclo")
    line()

    snap = db_query(CLINICAL_DB,
        "SELECT id, current_day, total_days, cycle_week FROM training_plans_v2 "
        "WHERE patient_id=? AND active=1", (PATIENT_ID,))
    if not snap:
        report("61.0", "Plan activo presente para complete/advance", False, "no hay plan activo")
        sys.exit(3)
    snap = snap[0]
    plan_active_id = snap["id"]
    day_pre = snap["current_day"]
    total_days = snap["total_days"]
    cycle_pre = snap["cycle_week"]
    print(f"    pre: plan={plan_active_id} day={day_pre}/{total_days} cycle_week={cycle_pre}")

    sc_today, body_today, _ = call("GET", "/sessions/today", token=token)
    today = body_today.get("data", {}).get("today") or {}
    first_ex = (today.get("ejercicios") or [{}])[0].get("exercise_key", "frontSquat")

    progress_pre = db_query(CLINICAL_DB,
        "SELECT exercise_key, current_session, current_level FROM exercise_progress "
        "WHERE patient_id=? AND exercise_key=?", (PATIENT_ID, first_ex))
    sess_pre = progress_pre[0]["current_session"] if progress_pre else 1

    sc, body, _ = call("POST", "/sessions/complete", token=token, body={
        "ejercicios": [{"exercise_key": first_ex, "completed": True}],
        "advance_day": False,
    })
    ok = sc == 200 and body.get("success")
    report("61.1", f"POST /sessions/complete (advance_day=False, ej={first_ex})",
           ok, f"status={sc} updates={len((body.get('data', {}).get('ejercicios_actualizados') or []))}")

    progress_post = db_query(CLINICAL_DB,
        "SELECT exercise_key, current_session, current_level FROM exercise_progress "
        "WHERE patient_id=? AND exercise_key=?", (PATIENT_ID, first_ex))
    sess_post = progress_post[0]["current_session"] if progress_post else 0
    report("61.2", "exercise_progress.current_session avanzo +1",
           sess_post == sess_pre + 1,
           f"{first_ex}: {sess_pre} -> {sess_post}")

    snap_after = db_query(CLINICAL_DB,
        "SELECT current_day, cycle_week FROM training_plans_v2 WHERE id=?",
        (plan_active_id,))[0]
    report("61.3", "advance_day=False NO modifica current_day",
           snap_after["current_day"] == day_pre,
           f"current_day={snap_after['current_day']} (pre={day_pre})")

    sc, body, _ = call("POST", "/sessions/advance", token=token, body={})
    res = body.get("data", {})
    ok = sc == 200 and res.get("dia_actual") in (day_pre + 1, 1)
    report("61.4", "POST /sessions/advance avanza al siguiente dia",
           ok,
           f"day_post={res.get('dia_actual')} cycle_week={res.get('cycle_week')} cycle_completed={res.get('cycle_completed')}")

    snap2 = db_query(CLINICAL_DB,
        "SELECT current_day, cycle_week FROM training_plans_v2 WHERE id=?",
        (plan_active_id,))[0]
    needed_advances = max(0, total_days - snap2["current_day"]) + 1
    print(f"    aplicando {needed_advances} advances mas para forzar wrap (current={snap2['current_day']}/{total_days})")
    last_resp = None
    for _ in range(needed_advances):
        sc, body, _ = call("POST", "/sessions/advance", token=token, body={})
        last_resp = body.get("data", {})
    snap3 = db_query(CLINICAL_DB,
        "SELECT current_day, cycle_week FROM training_plans_v2 WHERE id=?",
        (plan_active_id,))[0]
    report("61.5", "cycle_week se incrementa al cierre del ciclo",
           snap3["cycle_week"] >= cycle_pre + 1,
           f"cycle_week pre={cycle_pre} post={snap3['cycle_week']} day_now={snap3['current_day']} last_resp_completed={last_resp.get('cycle_completed') if last_resp else None}")

    line()

    # ----------------------------------------------------------------------
    # OMV-58 : alias deprecado /strength/<id>/optimize
    # ----------------------------------------------------------------------
    print(">>> OMV-58: /strength/<id>/optimize alias deprecado")
    line()

    sc, body, _ = call("POST", f"/strength/{STRENGTH_TEST_ID}/optimize", token=token, body={
        "numeroDias": 3, "numeroEjercicios": 3,
    })
    data = body.get("data", {}) if sc == 200 else {}
    ok = sc == 200 and "deprecated" in data and "plan_id" in data
    report("58.1", "POST /strength/<id>/optimize -> 200 + 'deprecated' marker",
           ok,
           f"status={sc} plan_id={data.get('plan_id')} deprecated={data.get('deprecated')}")

    sc, body, _ = call("POST", f"/strength/99999/optimize", token=token, body={})
    ok = sc == 404
    report("58.2", "POST /strength/<inexistente>/optimize -> 404",
           ok, f"status={sc}")

    line()

    # ----------------------------------------------------------------------
    # OMV-56 : helpers reemplazan imports legacy (probar que el modulo carga)
    # ----------------------------------------------------------------------
    print(">>> OMV-56: helpers de training (no imports a functions / main)")
    line()

    import re
    routes_src = open("src/api/v3/training/routes.py").read()
    helpers_src = open("src/api/v3/training/helpers.py").read()
    legacy_pat = re.compile(r"^\s*(?:from\s+main\b|import\s+functions\b|from\s+functions\b)", re.MULTILINE)
    routes_hits = legacy_pat.findall(routes_src)
    helpers_hits = legacy_pat.findall(helpers_src)
    report("56.1", "routes.py NO importa functions / main",
           not routes_hits, f"hits={routes_hits}")
    report("56.2", "helpers.py NO importa functions / main",
           not helpers_hits, f"hits={helpers_hits}")

    line()

    # ----------------------------------------------------------------------
    # ACCESS CONTROL : check_patient_access bloquea cross-patient
    # ----------------------------------------------------------------------
    print(">>> Access control: token de paciente Sebastian (patient_id=36) NO puede leer /strength?user=Toffaletti...")
    line()

    seba_token = mint_token({
        "user_id": 35, "dni": "36197940", "email": "seba.tayara@hotmail.com",
        "nombre_apellido": "Tayara, Sebastian", "rol": "patient",
        "is_admin": False,
    })
    sc, body, _ = call("GET", "/strength", token=seba_token,
                       params={"user": "Toffaletti, Diego Alejandro"})
    ok = sc == 403
    report("AC.1", "Paciente A no puede ver datos de paciente B (403)",
           ok, f"status={sc} msg={body.get('error', {}).get('message', '')[:80]}")

    line()
    print("=" * 80)
    passed = sum(1 for _, _, ok, _ in results if ok)
    failed = sum(1 for _, _, ok, _ in results if not ok)
    print(f"RESUMEN: {passed}/{passed + failed} pruebas OK ({failed} fallaron)")
    if failed:
        print("\nFAILED:")
        for s, lab, ok, det in results:
            if not ok:
                print(f"  - Test {s}: {lab}\n      {det}")
    print("=" * 80)
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
