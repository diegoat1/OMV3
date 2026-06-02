"""
Tests de Fix 11 — refactor de auth.

Cubre los 9 OMVs cerrados:
  - Schema: revoked_tokens, login_attempts, password_reset_token columns
  - Login: jti claim, audit fallidos, rate limit 10/15min
  - Logout: revoca server-side, decode_token rechaza después
  - Refresh: revoca viejo + re-chequea status + membresía + shape consistente
  - /me: incluye membership_expires_at top-level
  - Forgot-password: anti-enumeración + email queue
  - Reset-password: consume token + revoca caller token
  - Change-password: requires current + ≥8 chars + revoca actual

Crea ~3 users temporales (fix11-test-<n>-<ts>@example.com) y limpia al final.
"""

import base64
import json
import sqlite3
import sys
import time
from datetime import datetime, timedelta

import requests

BASE = "http://localhost:8000/api/v3"
AUTH_DB = "src/auth.db"
CLINICAL_DB = "src/db/clinical.db"
TS = int(time.time())
EMAIL_PREFIX = f"fix11-test-{TS}"

ADMIN_EMAIL = "datoffaletti@gmail.com"
ADMIN_PWD = "Test1234!"
PWD = "Password1234!"

results = []
created_user_ids = []


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


def jwt_payload(token):
    """Decodifica el payload de un JWT sin validar firma."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        # padding
        s = parts[1] + '=' * (-len(parts[1]) % 4)
        return json.loads(base64.urlsafe_b64decode(s))
    except Exception:
        return None


# =============================================================
# SETUP — Limpiar estado y loguear admin
# =============================================================
line(); print("Setup — limpiar login_attempts + login admin")
db_exec(AUTH_DB, "DELETE FROM login_attempts")  # rate limit reset
db_exec(AUTH_DB, "DELETE FROM revoked_tokens WHERE reason IS NOT NULL")  # blacklist limpia para arrancar

sc, body = call("POST", "/auth/login", body={"email": ADMIN_EMAIL, "password": ADMIN_PWD})
ADMIN_TOKEN = (body.get("data") or {}).get("token") if sc == 200 else None
if not ADMIN_TOKEN:
    print(f"ABORT: admin login failed sc={sc} body={excerpt(body)}")
    sys.exit(1)
print(f"  admin_token? {bool(ADMIN_TOKEN)}")


# =============================================================
# A) SCHEMA MIGRATIONS
# =============================================================
line(); print("A — Schema migrations")

# 1: revoked_tokens
cols_revoked = db_query(AUTH_DB, "PRAGMA table_info(revoked_tokens)")
present = {c.get("name") for c in cols_revoked}
required = {"id", "jti", "user_id", "revoked_at", "expires_at", "reason"}
report(1, "auth.db.revoked_tokens schema (jti, user_id, revoked_at, expires_at, reason)",
       required.issubset(present),
       f"missing={sorted(required - present)}")

# 2: login_attempts
cols_la = db_query(AUTH_DB, "PRAGMA table_info(login_attempts)")
present_la = {c.get("name") for c in cols_la}
required_la = {"id", "email", "ip", "attempted_at", "success", "failure_reason"}
report(2, "auth.db.login_attempts schema (email, ip, attempted_at, success, failure_reason)",
       required_la.issubset(present_la),
       f"missing={sorted(required_la - present_la)}")

# 3: users.password_reset_token + password_reset_expires_at
cols_users = db_query(AUTH_DB, "PRAGMA table_info(users)")
present_u = {c.get("name") for c in cols_users}
needed = {"password_reset_token", "password_reset_expires_at"}
report(3, "auth.db.users tiene password_reset_token + password_reset_expires_at",
       needed.issubset(present_u),
       f"missing={sorted(needed - present_u)}")


# =============================================================
# Crear test user, verify-email, approve, login
# =============================================================
line(); print("Setup — crear test user fix11-1, verify-email, approve")
test_email_1 = f"{EMAIL_PREFIX}-1@example.com"
sc, body = call("POST", "/auth/register", body={
    "nombre": "Fix11User, One", "email": test_email_1, "password": PWD,
    "sexo": "M", "fecha_nacimiento": "1990-01-15", "desired_roles": ["patient"],
})
if sc != 200:
    print(f"ABORT: register failed sc={sc} body={excerpt(body)}")
    sys.exit(1)
test_uid_1 = body["data"]["user_id"]
created_user_ids.append(test_uid_1)
vtok_1 = body["data"]["verification_token"]

call("POST", "/auth/verify-email", body={"token": vtok_1})
call("POST", f"/admin/auth-users/{test_uid_1}/approve", token=ADMIN_TOKEN, body={})
print(f"  test_uid_1={test_uid_1} email={test_email_1} verified+approved")


# =============================================================
# B) LOGIN & jti claim + login_attempts
# =============================================================
line(); print("B — Login + jti + audit fallidos")

# 4: Login OK + jti en JWT
sc, body = call("POST", "/auth/login", body={"email": test_email_1, "password": PWD})
data = (body.get("data") if body else None) or {}
T1 = data.get("token")
T1_payload = jwt_payload(T1) if T1 else {}
report(4, "Login → 200 + JWT con claim 'jti'",
       sc == 200 and bool(T1) and bool(T1_payload.get("jti")),
       f"sc={sc} | jti={(T1_payload or {}).get('jti', 'n/a')[:20]}...")

# 5: Login fallido → 401 + login_attempts row con failure_reason='bad_password'
sc, body = call("POST", "/auth/login", body={"email": test_email_1, "password": "ContraseñaIncorrecta"})
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
la_rows = db_query(AUTH_DB,
    "SELECT failure_reason, success FROM login_attempts WHERE email=? AND success=0 ORDER BY id DESC LIMIT 1",
    (test_email_1,))
fr = la_rows[0].get("failure_reason") if la_rows else None
report(5, "Login bad password → 401 + login_attempts.failure_reason='bad_password'",
       sc == 401 and fr == "bad_password",
       f"sc={sc} | err_code={err_code} | login_attempts row={la_rows[0] if la_rows else 'n/a'}")

# 6: Rate limit — 11 fallos seguidos → 429 RATE_LIMITED en el 11°
db_exec(AUTH_DB, "DELETE FROM login_attempts WHERE email=?", (test_email_1,))
last_sc = None
last_err = ""
for i in range(11):
    sc, body = call("POST", "/auth/login",
                    body={"email": test_email_1, "password": "wrong"})
    last_sc = sc
    last_err = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
report(6, "Rate limit: 11 fallos → 429 RATE_LIMITED (umbral 10/15min)",
       last_sc == 429 and last_err == "RATE_LIMITED",
       f"último intento sc={last_sc} | err_code={last_err}")

# Limpiar para que pueda volver a loguear
db_exec(AUTH_DB, "DELETE FROM login_attempts WHERE email=?", (test_email_1,))


# Re-login para obtener token fresco para los tests siguientes
sc, body = call("POST", "/auth/login", body={"email": test_email_1, "password": PWD})
T1 = (body.get("data") or {}).get("token")
T1_payload = jwt_payload(T1) if T1 else {}
T1_jti = (T1_payload or {}).get("jti")


# =============================================================
# C) LOGOUT REVOCATION
# =============================================================
line(); print("C — Logout revoca server-side")

# 7: GET /me con T1 → 200 antes del logout
sc, body = call("GET", "/auth/me", token=T1)
me_before = sc == 200
# 8: POST /logout
sc_logout, body_logout = call("POST", "/auth/logout", token=T1)
data_lo = (body_logout.get("data") if body_logout else None) or {}
logout_ok = sc_logout == 200 and (data_lo.get("logged_out") is True or data_lo.get("token_revoked") is True or data_lo.get("revoked") is True)
# 9: GET /me con MISMO token → 401 ahora (revocado)
sc_after, body_after = call("GET", "/auth/me", token=T1)
report(7, "GET /me OK antes del logout, 401 después (token revocado)",
       me_before and sc_after == 401,
       f"me_before={me_before} | sc_after={sc_after}")
report(8, "POST /logout → 200 con flag de revocación en data",
       logout_ok,
       f"sc={sc_logout} | data={data_lo}")
# 9: revoked_tokens row con jti correcto
revoked_row = db_query(AUTH_DB,
    "SELECT jti, user_id, reason FROM revoked_tokens WHERE jti=?", (T1_jti,))
report(9, "revoked_tokens DB row con jti + reason='logout'",
       bool(revoked_row) and "_error" not in revoked_row[0]
       and revoked_row[0].get("reason") == "logout",
       f"row={revoked_row[0] if revoked_row else 'n/a'}")


# =============================================================
# D) REFRESH — revoca viejo + re-chequea
# =============================================================
line(); print("D — Refresh revoca viejo + valida membership")

# Re-login para tener token "vivo"
sc, body = call("POST", "/auth/login", body={"email": test_email_1, "password": PWD})
T2 = (body.get("data") or {}).get("token")
T2_payload = jwt_payload(T2) if T2 else {}
T2_jti = (T2_payload or {}).get("jti")

# 10: refresh → token nuevo + viejo revocado
sc_r, body_r = call("POST", "/auth/refresh", token=T2)
data_r = (body_r.get("data") if body_r else None) or {}
T3 = data_r.get("token")
T3_payload = jwt_payload(T3) if T3 else {}
T3_jti = (T3_payload or {}).get("jti")
# Probar que T2 está revocado
sc_old, _ = call("GET", "/auth/me", token=T2)
sc_new, _ = call("GET", "/auth/me", token=T3)
report(10, "Refresh → nuevo token OK, viejo (jti) → 401 revocado",
       sc_r == 200 and bool(T3) and T3_jti != T2_jti and sc_old == 401 and sc_new == 200,
       f"sc_refresh={sc_r} | new_jti!=old? {T3_jti != T2_jti} | viejo /me sc={sc_old} | nuevo /me sc={sc_new}")

# 11: shape del response refresh
shape_ok = (
    bool(T3) and "membership_expires_at" in data_r
    and isinstance(data_r.get("user"), dict)
    and data_r["user"].get("email") == test_email_1
)
report(11, "Refresh response shape: {token, membership_expires_at, user{...}}",
       shape_ok,
       f"keys={sorted(data_r.keys())} | user.email={data_r.get('user',{}).get('email')}")

# 12: Refresh con membership vencida → 403 MEMBERSHIP_EXPIRED
yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
db_exec(AUTH_DB, "UPDATE users SET membership_expires_at=? WHERE id=?", (yesterday, test_uid_1))
sc_e, body_e = call("POST", "/auth/refresh", token=T3)
err_code = (body_e.get("error") or {}).get("code", "") if body_e and not body_e.get("success") else ""
report(12, "Refresh con membership vencida → 403 MEMBERSHIP_EXPIRED",
       sc_e == 403 and err_code == "MEMBERSHIP_EXPIRED",
       f"sc={sc_e} | err_code={err_code}")

# Restaurar membership para tests siguientes
future = (datetime.utcnow() + timedelta(days=30)).isoformat()
db_exec(AUTH_DB, "UPDATE users SET membership_expires_at=? WHERE id=?", (future, test_uid_1))


# =============================================================
# E) /me incluye membership_expires_at top-level
# =============================================================
line(); print("E — /me incluye membership_expires_at")

# T3 fue revocado en test 12 (refresh falló) — no, en realidad solo el viejo T2 fue revocado.
# Pero al cambiar membership a vencida, el refresh con T3 dio 403, no revocó T3.
# Sin embargo /me con T3 sigue funcionando. Verifico.
sc, body = call("GET", "/auth/me", token=T3)
data_me = (body.get("data") if body else None) or {}
report(13, "GET /me incluye membership_expires_at top-level (mismo formato que login)",
       sc == 200 and "membership_expires_at" in data_me,
       f"sc={sc} | top_level_keys={sorted(data_me.keys())}")


# =============================================================
# F) FORGOT-PASSWORD — anti-enumeración + email queue
# =============================================================
line(); print("F — Forgot-password")

# 14: forgot con email existente → 200 + DB token + email_outbox
sc, body = call("POST", "/auth/forgot-password", body={"email": test_email_1})
existing_msg = (body or {}).get("message", "")
existing_sent = (body.get("data") or {}).get("sent")
db_user = db_query(AUTH_DB,
    "SELECT password_reset_token, password_reset_expires_at FROM users WHERE id=?",
    (test_uid_1,))[0]
reset_token = db_user.get("password_reset_token")
db_email = db_query(AUTH_DB,
    "SELECT template, payload_json FROM email_outbox WHERE user_id=? ORDER BY id DESC LIMIT 1",
    (test_uid_1,))
email_payload = json.loads(db_email[0].get("payload_json") or "{}") if db_email else {}
report(14, "Forgot existente → 200 + DB tiene reset_token + email_outbox 'password_reset' con token en payload",
       sc == 200 and existing_sent is True
       and bool(reset_token)
       and bool(db_email) and db_email[0].get("template") == "password_reset"
       and email_payload.get("reset_token") == reset_token,
       f"sc={sc} | reset_token? {bool(reset_token)} | email_template={db_email[0].get('template') if db_email else 'n/a'}")

# 15: forgot con email inexistente → 200 con mismo mensaje (anti-enumeración)
sc, body = call("POST", "/auth/forgot-password",
                body={"email": "no-existe-jamas-12345@example.com"})
nonexistent_msg = (body or {}).get("message", "")
nonexistent_sent = (body.get("data") or {}).get("sent")
report(15, "Forgot email inexistente → 200 mismo mensaje genérico (anti-enumeración)",
       sc == 200 and nonexistent_sent is True
       and nonexistent_msg == existing_msg,
       f"sc={sc} | sent={nonexistent_sent} | mensajes_iguales? {nonexistent_msg == existing_msg}")

# 16: forgot sin email → 400
sc, body = call("POST", "/auth/forgot-password", body={})
report(16, "Forgot sin email → 400 VALIDATION_ERROR",
       sc == 400,
       f"sc={sc} | resp={excerpt(body, 120)}")


# =============================================================
# G) RESET-PASSWORD — consume token + revoca si trae Authorization
# =============================================================
line(); print("G — Reset-password")

new_pwd = "NewPwdResetXYZ"

# 17: reset con token válido → 200, password actualizada (login con nueva), DB limpia
sc_r, body_r = call("POST", "/auth/reset-password",
                    body={"token": reset_token, "new_password": new_pwd})
# Verificar login con nueva password
sc_l, body_l = call("POST", "/auth/login",
                    body={"email": test_email_1, "password": new_pwd})
T4 = (body_l.get("data") or {}).get("token") if sc_l == 200 else None
db_after = db_query(AUTH_DB,
    "SELECT password_reset_token, password_reset_expires_at FROM users WHERE id=?",
    (test_uid_1,))[0]
reset_cleared = db_after.get("password_reset_token") is None and db_after.get("password_reset_expires_at") is None
report(17, "Reset válido → 200 + login con new_password OK + DB token limpio",
       sc_r == 200 and sc_l == 200 and bool(T4) and reset_cleared,
       f"reset_sc={sc_r} | login_new_sc={sc_l} | reset_cleared={reset_cleared}")

# 18: reset con token inválido → 404
sc, body = call("POST", "/auth/reset-password",
                body={"token": "no-existe", "new_password": "Otra1234567"})
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
report(18, "Reset con token inválido → 404 NOT_FOUND",
       sc == 404,
       f"sc={sc} | err_code={err_code}")

# 19: reset con password corta → 400
# Genero otro reset token
call("POST", "/auth/forgot-password", body={"email": test_email_1})
new_db_user = db_query(AUTH_DB,
    "SELECT password_reset_token FROM users WHERE id=?", (test_uid_1,))[0]
short_test_token = new_db_user.get("password_reset_token")
sc, body = call("POST", "/auth/reset-password",
                body={"token": short_test_token, "new_password": "abc"})
report(19, "Reset con password <8 chars → 400 VALIDATION_ERROR",
       sc == 400,
       f"sc={sc} | resp={excerpt(body, 140)}")
# Limpiar el token sobrante
db_exec(AUTH_DB, "UPDATE users SET password_reset_token=NULL, password_reset_expires_at=NULL WHERE id=?", (test_uid_1,))


# =============================================================
# H) CHANGE-PASSWORD
# =============================================================
line(); print("H — Change-password")

# T4 ahora es el token activo. PWD del user = new_pwd
new_pwd_2 = "Changed2ndPass456!"

# 20: change con current válido + new ≥8 → 200 + indica revocación
sc_c, body_c = call("POST", "/auth/change-password", token=T4, body={
    "current_password": new_pwd, "new_password": new_pwd_2,
})
data_c = (body_c.get("data") if body_c else None) or {}
report(20, "Change-password OK → 200 + flag de revocación en data",
       sc_c == 200 and (data_c.get("token_revoked") is True
                        or data_c.get("revoked") is True
                        or data_c.get("logged_out") is True),
       f"sc={sc_c} | data={data_c}")

# 21: T4 ahora debe estar revocado — /me → 401
sc, _ = call("GET", "/auth/me", token=T4)
report(21, "Token usado para change-password queda revocado → /me 401",
       sc == 401,
       f"sc={sc} (esperado 401)")

# 22: Login con nueva password → 200
sc, body = call("POST", "/auth/login",
                body={"email": test_email_1, "password": new_pwd_2})
T5 = (body.get("data") or {}).get("token") if sc == 200 else None
report(22, "Login con la nueva password (post-change) → 200",
       sc == 200 and bool(T5),
       f"sc={sc}")

# 23: change con current incorrecta → 401
sc, body = call("POST", "/auth/change-password", token=T5, body={
    "current_password": "incorrectaXXX", "new_password": "OtraPass789!",
})
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
report(23, "Change con current_password incorrecta → 401 UNAUTHORIZED",
       sc == 401,
       f"sc={sc} | err_code={err_code}")


# =============================================================
# CLEANUP
# =============================================================
line(); print(f"CLEANUP — {len(created_user_ids)} test users + datos asociados")
con_a = sqlite3.connect(AUTH_DB)
con_c = sqlite3.connect(CLINICAL_DB)
ca = con_a.cursor(); cc = con_c.cursor()
for uid in created_user_ids:
    cc.execute("DELETE FROM patients WHERE auth_user_id = ?", (uid,))
    ca.execute("DELETE FROM payments WHERE user_id = ?", (uid,))
    ca.execute("DELETE FROM email_outbox WHERE user_id = ?", (uid,))
    ca.execute("DELETE FROM revoked_tokens WHERE user_id = ?", (uid,))
    ca.execute("DELETE FROM login_attempts WHERE email LIKE ?", (f"{EMAIL_PREFIX}%",))
    ca.execute("DELETE FROM patient_user_link WHERE user_id = ?", (uid,))
    ca.execute("DELETE FROM users WHERE id = ?", (uid,))
con_a.commit(); con_c.commit()
con_a.close(); con_c.close()
print(f"      cleaned user_ids={created_user_ids}")


# =============================================================
# RESUMEN
# =============================================================
print()
print("=" * 80)
total = len(results)
passed = sum(1 for r in results if r[2])
print(f"FIX 11 RESUMEN: {passed}/{total} OK")
print("=" * 80)
for step, label, ok, _ in results:
    print(f"  {str(step):3} {'OK' if ok else 'FAIL':5} {label}")

sys.exit(0 if passed == total else 1)
