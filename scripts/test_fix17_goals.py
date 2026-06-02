"""
Tests funcionales de Fix 17 — refactor de goals con workflow de propuesta-aceptación,
plazos, source tracking, histórico, transiciones, roadmap persistido y deprecation
del legacy /goals/auto.

Cubre los 9 OMVs cerrados:
  OMV-35 propuesta→aceptación (proposed/active + accept/reject)
  OMV-36 next-step
  OMV-37 source tracking
  OMV-38 plazo (fecha_objetivo + meses_estimados)
  OMV-39 histórico (archived_at + previous_goal_id + GET /history)
  OMV-40 /complete
  OMV-41 roadmap persistido (tabla + save + get)
  OMV-42 6 circunferencias adicionales
  OMV-43 /goals/auto deprecated

Pacientes usados:
  Florencia (Noelia, id 39, specialist) ↔ Yael (saiyankiwi, id 2, DNI 12345678) — assignment
  Diego (id 41, admin)
  Miguel (id 3, DNI 14732338) — sin assignment con Florencia
"""

import json
import sqlite3
import sys
import time
from datetime import datetime, timedelta

import requests

BASE = "http://localhost:8000/api/v3"
AUTH_DB = "src/auth.db"
CLINICAL_DB = "src/db/clinical.db"

ADMIN_EMAIL = "datoffaletti@gmail.com"
FLO_EMAIL = "noefernandezhurt@gmail.com"
FLO_USER_ID = 39
YAEL_EMAIL = "saiyankiwi@gmail.com"
YAEL_DNI = "12345678"
THIRD_DNI = "14732338"
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
        return r.status_code, payload, dict(r.headers)
    except Exception as e:
        return None, {"_request_error": str(e)}, {}


def excerpt(payload, n=200):
    if payload is None:
        return ""
    s = json.dumps(payload, default=str, ensure_ascii=False)
    return s if len(s) <= n else s[:n] + "..."


# =============================================================
# SETUP
# =============================================================
line(); print("Setup — login + assignment Florencia↔Yael + cleanup goals/roadmaps de Yael")

# Get patient_id de Yael primero
yael_pid_rows = db_query(CLINICAL_DB, "SELECT id FROM patients WHERE dni=?", (YAEL_DNI,))
YAEL_PID = yael_pid_rows[0]["id"] if yael_pid_rows else None
if not YAEL_PID:
    print("ABORT: Yael no encontrada en clinical.db")
    sys.exit(1)

# Cleanup goals + roadmaps de Yael
db_exec(CLINICAL_DB, "DELETE FROM goals WHERE patient_id=?", (YAEL_PID,))
db_exec(CLINICAL_DB, "DELETE FROM roadmaps WHERE patient_id=?", (YAEL_PID,))
db_exec(AUTH_DB, "DELETE FROM specialist_assignments WHERE specialist_id=? AND patient_dni=?",
        (FLO_USER_ID, YAEL_DNI))
db_exec(AUTH_DB, "DELETE FROM login_attempts")

sc, body, _ = call("POST", "/auth/login", body={"email": FLO_EMAIL, "password": PWD})
TOKEN_FLO = (body.get("data") or {}).get("token") if sc == 200 else None
sc, body, _ = call("POST", "/auth/login", body={"email": YAEL_EMAIL, "password": PWD})
TOKEN_YAEL = (body.get("data") or {}).get("token") if sc == 200 else None
sc, body, _ = call("POST", "/auth/login", body={"email": ADMIN_EMAIL, "password": PWD})
TOKEN_ADMIN = (body.get("data") or {}).get("token") if sc == 200 else None
if not (TOKEN_FLO and TOKEN_YAEL and TOKEN_ADMIN):
    print(f"ABORT: login failed | flo={bool(TOKEN_FLO)} yael={bool(TOKEN_YAEL)} admin={bool(TOKEN_ADMIN)}")
    sys.exit(1)

# Recrear assignment
sc, body, _ = call("POST", "/assignments/request", token=TOKEN_FLO, body={"patient_dni": YAEL_DNI})
assign_id = (body.get("data") or {}).get("assignment_id")
call("POST", f"/assignments/{assign_id}/accept", token=TOKEN_YAEL)
print(f"  YAEL_PID={YAEL_PID} | tokens OK | assignment_id={assign_id}")


# =============================================================
# A) SCHEMA MIGRATIONS
# =============================================================
line(); print("A — Schema migrations (goals + roadmaps)")

cols_g = db_query(CLINICAL_DB, "PRAGMA table_info(goals)")
present_g = {c.get("name") for c in cols_g}
new_goal_cols = {
    "status", "archived_at", "completed_at", "accepted_by_user_id",
    "created_by_user_id", "previous_goal_id",
    "fecha_objetivo", "meses_estimados",
    "source", "source_roadmap_id", "source_phase_index",
    "goal_hombro", "goal_pecho", "goal_brazo", "goal_antebrazo",
    "goal_muslo", "goal_pantorrilla",
}
report(1, "goals tiene 16 columnas nuevas (workflow + plazos + source + 6 circ extras)",
       new_goal_cols.issubset(present_g),
       f"missing={sorted(new_goal_cols - present_g)}")

cols_r = db_query(CLINICAL_DB, "PRAGMA table_info(roadmaps)")
present_r = {c.get("name") for c in cols_r}
required_roadmap_cols = {"id", "patient_id", "fases_json", "active", "calculated_at"}
report(2, "tabla roadmaps existe con cols mínimas (id, patient_id, fases_json, active, calculated_at)",
       required_roadmap_cols.issubset(present_r),
       f"missing={sorted(required_roadmap_cols - present_r)}")

# Test 3 — backfill: cualquier goal pre-existente con activo=1 debería tener status='active' o NULL
# (post-Fix17 todos tienen status; pre tenían activo=1 sin status)
backfill_check = db_query(CLINICAL_DB,
    "SELECT COUNT(*) AS n FROM goals WHERE activo = 1 AND (status IS NULL OR status = '')")
unmigrated = backfill_check[0].get("n") if backfill_check else None
report(3, "Backfill: no quedaron goals con activo=1 y status NULL/empty",
       unmigrated == 0,
       f"goals sin migrar={unmigrated}")


# =============================================================
# B) GET /goals con filtro status
# =============================================================
line(); print("B — GET /goals filter status")

# Test 4 — default (status='active'): no hay goals todavía → goal=None
sc, body, _ = call("GET", f"/users/{YAEL_DNI}/goals", token=TOKEN_FLO)
data = body.get("data") if body else {}
report(4, "GET /goals (default) — status='active', goal=None cuando no hay activos",
       sc == 200 and data.get("status") == "active" and data.get("goal") is None,
       f"sc={sc} | status={data.get('status')} | goal_present={data.get('goal') is not None}")

# Test 5 — status=invalid
sc, body, _ = call("GET", f"/users/{YAEL_DNI}/goals", token=TOKEN_FLO, params={"status": "invalid"})
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
report(5, "GET /goals?status=invalid → 400 VALIDATION_ERROR",
       sc == 400 and err_code == "VALIDATION_ERROR",
       f"sc={sc} | err_code={err_code}")


# =============================================================
# C) POST /goals con detección caller (proposed vs active)
# =============================================================
line(); print("C — POST /goals — detección caller + plazo + 6 circ extras")

# Test 6 — Florencia (specialist no-owner) POST → status='proposed'
sc, body, _ = call("POST", f"/users/{YAEL_DNI}/goals", token=TOKEN_FLO, body={
    "peso_objetivo": 60, "bf_objetivo": 22, "ffmi_objetivo": 18,
    "fecha_objetivo": "2026-12-31", "meses_estimados": 7,
    "source": "manual",
})
data = body.get("data") if body else {}
proposed_goal_id = data.get("goal_id")
report(6, "POST por specialist (Florencia) → status='proposed' (OMV-35)",
       sc == 200 and data.get("status") == "proposed" and proposed_goal_id is not None,
       f"sc={sc} | status={data.get('status')} | goal_id={proposed_goal_id}")

# Test 7 — Yael (owner) POST → status='active' + archives previous
sc, body, _ = call("POST", f"/users/{YAEL_DNI}/goals", token=TOKEN_YAEL, body={
    "peso_objetivo": 58, "bf_objetivo": 20, "ffmi_objetivo": 19,
    "circ_abdomen_objetivo": 70, "circ_cintura_objetivo": 65, "circ_cadera_objetivo": 92,
    "circ_hombro_objetivo": 100, "circ_pecho_objetivo": 90, "circ_brazo_objetivo": 28,
    "circ_antebrazo_objetivo": 22, "circ_muslo_objetivo": 55, "circ_pantorrilla_objetivo": 35,
    "fecha_objetivo": "2026-10-01", "meses_estimados": 5,
    "source": "manual",
})
data = body.get("data") if body else {}
active_goal_id = data.get("goal_id")
report(7, "POST por owner (Yael) → status='active' + previous_goal_archived (proposed sigue siendo proposed)",
       sc == 200 and data.get("status") == "active" and active_goal_id is not None,
       f"sc={sc} | status={data.get('status')} | goal_id={active_goal_id} | archived={data.get('previous_goal_archived')}")

# Test 8 — verificar persistencia del plazo y las 6 circ extras
db_g = db_query(CLINICAL_DB, "SELECT * FROM goals WHERE id=?", (active_goal_id,))[0]
extras_present = all(db_g.get(f"goal_{c}") is not None for c in
                     ("hombro", "pecho", "brazo", "antebrazo", "muslo", "pantorrilla"))
plazo_persisted = db_g.get("fecha_objetivo") is not None and db_g.get("meses_estimados") is not None
report(8, "Persistencia: 6 circ extras + fecha_objetivo + meses_estimados (OMV-38, OMV-42)",
       extras_present and plazo_persisted,
       f"extras_present={extras_present} | fecha_obj={db_g.get('fecha_objetivo')} | meses={db_g.get('meses_estimados')}")

# Test 9 — Diego (admin) POST → status='active' (archiva el active anterior)
sc, body, _ = call("POST", f"/users/{YAEL_DNI}/goals", token=TOKEN_ADMIN, body={
    "peso_objetivo": 55, "bf_objetivo": 19, "ffmi_objetivo": 19,
    "source": "manual",
})
data = body.get("data") if body else {}
admin_goal_id = data.get("goal_id")
prev_archived = data.get("previous_goal_archived")
report(9, "POST por admin (Diego) → status='active' + previous_goal_archived = goal_id Yael",
       sc == 200 and data.get("status") == "active" and prev_archived == active_goal_id,
       f"sc={sc} | status={data.get('status')} | previous_archived={prev_archived} (esperado={active_goal_id})")

# Verificar en DB que el goal anterior está archived
prev_status = db_query(CLINICAL_DB, "SELECT status, archived_at FROM goals WHERE id=?", (active_goal_id,))[0]
report("9b", "Goal previo (de Yael) ahora status='archived' + archived_at no-null",
       prev_status.get("status") == "archived" and prev_status.get("archived_at") is not None,
       f"row={prev_status}")


# =============================================================
# D) GOAL TRANSITIONS — accept / reject / complete
# =============================================================
line(); print("D — Transiciones accept/reject/complete")

# Test 10 — Yael (owner) ACCEPT del proposed_goal_id → status='active' + archives admin's active
sc, body, _ = call("POST", f"/users/{YAEL_DNI}/goals/{proposed_goal_id}/accept",
                   token=TOKEN_YAEL)
data = body.get("data") if body else {}
report(10, "POST /accept (Yael owner sobre proposed) → status='active'",
       sc == 200 and data.get("status") == "active",
       f"sc={sc} | resp={excerpt(body, 160)}")

# Verifica que el admin's active también fue archivado (porque accept activa el proposed → archiva otros activos)
admin_status = db_query(CLINICAL_DB, "SELECT status FROM goals WHERE id=?", (admin_goal_id,))[0]
report("10b", "Al activar el proposed, el active anterior (admin's) pasa a 'archived'",
       admin_status.get("status") == "archived",
       f"admin_goal status={admin_status.get('status')}")

# Test 11 — accept sobre goal ya active → 400 (transición inválida)
sc, body, _ = call("POST", f"/users/{YAEL_DNI}/goals/{proposed_goal_id}/accept",
                   token=TOKEN_YAEL)
report(11, "POST /accept sobre goal active → 400 (transición inválida)",
       sc == 400,
       f"sc={sc} | resp={excerpt(body, 160)}")

# Test 12 — Florencia (specialist no-owner) crea otro proposed; Yael lo REJECT
sc, body, _ = call("POST", f"/users/{YAEL_DNI}/goals", token=TOKEN_FLO, body={
    "peso_objetivo": 50, "source": "manual",
})
proposed2 = (body.get("data") or {}).get("goal_id")
sc, body, _ = call("POST", f"/users/{YAEL_DNI}/goals/{proposed2}/reject", token=TOKEN_YAEL)
data = body.get("data") if body else {}
report(12, "POST /reject (Yael owner sobre proposed) → status='rejected'",
       sc == 200 and data.get("status") == "rejected",
       f"sc={sc} | resp={excerpt(body, 160)}")

# Test 13 — Yael COMPLETE su goal active (proposed_goal_id que ahora es active)
sc, body, _ = call("POST", f"/users/{YAEL_DNI}/goals/{proposed_goal_id}/complete",
                   token=TOKEN_YAEL)
data = body.get("data") if body else {}
db_completed = db_query(CLINICAL_DB,
    "SELECT status, completed_at FROM goals WHERE id=?", (proposed_goal_id,))[0]
report(13, "POST /complete → status='completed' + completed_at no-null (OMV-40)",
       sc == 200 and data.get("status") == "completed"
       and db_completed.get("status") == "completed"
       and db_completed.get("completed_at") is not None,
       f"sc={sc} | DB={db_completed}")

# Test 14 — Florencia (no owner) intenta accept un proposed → 403
sc, body, _ = call("POST", f"/users/{YAEL_DNI}/goals", token=TOKEN_FLO, body={
    "peso_objetivo": 70, "source": "manual",
})
proposed3 = (body.get("data") or {}).get("goal_id")
sc, body, _ = call("POST", f"/users/{YAEL_DNI}/goals/{proposed3}/accept", token=TOKEN_FLO)
report(14, "Florencia (specialist NO owner) intenta /accept → 403",
       sc == 403,
       f"sc={sc} | resp={excerpt(body, 160)}")


# =============================================================
# E) GET /goals/history
# =============================================================
line(); print("E — GET /goals/history")

sc, body, _ = call("GET", f"/users/{YAEL_DNI}/goals/history", token=TOKEN_FLO)
data = body.get("data") if body else {}
goals_list = data.get("goals", [])
breakdown = data.get("breakdown") or {}
# A esta altura tenemos: 1 archived (active anterior de Yael), 1 archived (admin's active),
# 1 completed (proposed_goal_id), 1 rejected (proposed2), 1 proposed (proposed3)
has_breakdown = isinstance(breakdown, dict) and any(
    breakdown.get(k, 0) > 0 for k in ("active", "proposed", "rejected", "completed", "archived")
)
report(15, "GET /goals/history devuelve lista de todos + breakdown por status (OMV-39)",
       sc == 200 and len(goals_list) >= 4 and has_breakdown,
       f"sc={sc} | total_goals={len(goals_list)} | breakdown={breakdown}")


# =============================================================
# F) ROADMAP — save + get + next-step
# =============================================================
line(); print("F — Roadmap save + get + next-step")

# Test 16 — POST /goals/auto-roadmap/save con un body sintético
roadmap_body = {
    "datos_actuales": {"peso": 65, "bf": 22, "ffmi": 18},
    "objetivos_geneticos": {"peso_objetivo": 60, "bf_esencial": 18, "ffmi_limite": 22},
    "tiempo_estimado": {"meses": 12},
    "objetivos_parciales": [
        {"fase": 1, "tipo": "cut", "peso_objetivo": 63, "bf_objetivo": 20, "duracion_meses": 3},
        {"fase": 2, "tipo": "bulk", "peso_objetivo": 65, "ffmi_objetivo": 19, "duracion_meses": 4},
        {"fase": 3, "tipo": "cut", "peso_objetivo": 60, "bf_objetivo": 18, "duracion_meses": 5},
    ],
    "metadata": {"calculator_version": "fix17-test"},
}
sc, body, _ = call("POST", f"/users/{YAEL_DNI}/goals/auto-roadmap/save",
                   token=TOKEN_FLO, body=roadmap_body)
data = body.get("data") if body else {}
roadmap_id = data.get("roadmap_id")
report(16, "POST /auto-roadmap/save → 200 + roadmap_id + total_phases=3 + active=true",
       sc == 200 and roadmap_id is not None
       and data.get("total_phases") == 3 and data.get("active") is True,
       f"sc={sc} | roadmap_id={roadmap_id} | total_phases={data.get('total_phases')}")

# Test 17 — GET /goals/roadmap → roadmap activo con fases parsed
sc, body, _ = call("GET", f"/users/{YAEL_DNI}/goals/roadmap", token=TOKEN_FLO)
data = body.get("data") if body else {}
rm = data.get("roadmap") if isinstance(data, dict) else None
fases_parsed = (rm or {}).get("fases") if rm else None
report(17, "GET /goals/roadmap → roadmap activo + fases array parsed",
       sc == 200 and isinstance(rm, dict)
       and rm.get("active") in (1, True)
       and isinstance(fases_parsed, list) and len(fases_parsed) == 3,
       f"sc={sc} | roadmap_active={rm.get('active') if rm else 'n/a'} | fases_count={len(fases_parsed) if fases_parsed else 'n/a'}")

# Test 18 — GET /goals/next-step (sin completar nada del roadmap) → fase 0
sc, body, _ = call("GET", f"/users/{YAEL_DNI}/goals/next-step", token=TOKEN_FLO)
data = body.get("data") if body else {}
report(18, "GET /next-step (sin fases completadas) → next_phase_index=0 + total_phases=3 (OMV-36)",
       sc == 200 and data.get("next_phase_index") == 0
       and data.get("total_phases") == 3
       and data.get("completed_phases") == 0,
       f"sc={sc} | next_idx={data.get('next_phase_index')} | total={data.get('total_phases')} | completed={data.get('completed_phases')}")

# Test 19 — Crear y completar un goal con source_roadmap_id + phase_index=0,
# luego next-step debería devolver phase_index=1
sc, body, _ = call("POST", f"/users/{YAEL_DNI}/goals", token=TOKEN_YAEL, body={
    "peso_objetivo": 63, "bf_objetivo": 20,
    "source": "auto-roadmap", "source_roadmap_id": roadmap_id, "source_phase_index": 0,
})
phase0_goal = (body.get("data") or {}).get("goal_id")
call("POST", f"/users/{YAEL_DNI}/goals/{phase0_goal}/complete", token=TOKEN_YAEL)

sc, body, _ = call("GET", f"/users/{YAEL_DNI}/goals/next-step", token=TOKEN_FLO)
data = body.get("data") if body else {}
report(19, "Tras completar fase 0, /next-step → next_phase_index=1 + completed_phases=1",
       sc == 200 and data.get("next_phase_index") == 1
       and data.get("completed_phases") == 1,
       f"sc={sc} | next_idx={data.get('next_phase_index')} | completed={data.get('completed_phases')}")


# =============================================================
# G) /goals/auto DEPRECATED
# =============================================================
line(); print("G — /goals/auto deprecated")

sc, body, hdrs = call("GET", f"/users/{YAEL_DNI}/goals/auto", token=TOKEN_FLO)
data = body.get("data") if body else {}
hdr_dep = hdrs.get("X-Deprecated") or hdrs.get("x-deprecated")
hdr_succ = hdrs.get("X-Deprecation-Successor") or hdrs.get("x-deprecation-successor")
body_flag = data.get("deprecated") if isinstance(data, dict) else None
report(20, "GET /goals/auto → headers X-Deprecated:true + X-Deprecation-Successor + body deprecated:true",
       sc == 200 and (hdr_dep or "").lower() == "true"
       and (hdr_succ or "").endswith("/auto-roadmap")
       and body_flag is True,
       f"sc={sc} | X-Deprecated={hdr_dep} | X-Successor={hdr_succ} | body.deprecated={body_flag}")


# =============================================================
# H) NEGATIVES
# =============================================================
line(); print("H — Negatives")

# Test 21 — POST /goals para Miguel (sin assignment) por Florencia → 403
sc, body, _ = call("POST", f"/users/{THIRD_DNI}/goals", token=TOKEN_FLO, body={
    "peso_objetivo": 60,
})
report(21, "POST /goals para paciente sin assignment → 403",
       sc == 403,
       f"sc={sc} | resp={excerpt(body, 140)}")

# Test 22 — GET /goals?status=all incluye los archivados
sc, body, _ = call("GET", f"/users/{YAEL_DNI}/goals", token=TOKEN_FLO, params={"status": "all"})
data = body.get("data") if body else {}
all_goals = data.get("goals", [])
has_archived = any(g.get("status") == "archived" for g in all_goals)
has_completed = any(g.get("status") == "completed" for g in all_goals)
has_rejected = any(g.get("status") == "rejected" for g in all_goals)
report(22, "GET /goals?status=all incluye archivados, completados, rejected",
       sc == 200 and has_archived and has_completed and has_rejected,
       f"sc={sc} | total={len(all_goals)} | archived={has_archived} | completed={has_completed} | rejected={has_rejected}")


# =============================================================
# CLEANUP
# =============================================================
line(); print("CLEANUP — borrando goals + roadmaps test de Yael")
db_exec(CLINICAL_DB, "DELETE FROM goals WHERE patient_id=?", (YAEL_PID,))
db_exec(CLINICAL_DB, "DELETE FROM roadmaps WHERE patient_id=?", (YAEL_PID,))


# =============================================================
# RESUMEN
# =============================================================
print()
print("=" * 80)
total = len(results)
passed = sum(1 for r in results if r[2])
print(f"FIX 17 RESUMEN: {passed}/{total} OK")
print("=" * 80)
for step, label, ok, _ in results:
    print(f"  {str(step):4} {'OK' if ok else 'FAIL':5} {label}")

sys.exit(0 if passed == total else 1)
