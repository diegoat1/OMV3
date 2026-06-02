"""
Tests funcionales de Fix 10 — pago, membresía, email outbox, doble gate
de aprobación, reject con motivo, login con membresía vencida.

Cubre:
  Schema migrations (3): tabla `payments`, tabla `email_outbox`, columnas
    `users.membership_expires_at` + `users.rejection_reason`.
  Approve flow (5): sin payment, con payment + custom period, doble gate
    (sin email verificado), override force_email_verification, audit log.
  Reject flow (3): con motivo, persistencia, email encolado.
  Login behavior (3): ACCOUNT_REJECTED, MEMBERSHIP_EXPIRED, login OK con
    membership_expires_at top-level.
  Pending users (2): breakdown + sort por email_verified.

Crea ~5 usuarios temporales (`fix10-test-<n>-<ts>@example.com`) y los limpia
al final junto con sus pagos y emails encolados.
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
TS = int(time.time())
EMAIL_PREFIX = f"fix10-test-{TS}"

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


def make_email(slot):
    return f"{EMAIL_PREFIX}-{slot}@example.com"


def register_user(slot):
    """Crea user. Devuelve (user_id, email, verification_token)."""
    email = make_email(slot)
    payload = {
        "nombre": f"Fix10User, Slot{slot}",
        "email": email,
        "password": PWD,
        "sexo": "M",
        "fecha_nacimiento": "1990-01-15",
        "desired_roles": ["patient"],
    }
    sc, body = call("POST", "/auth/register", body=payload)
    if sc != 200:
        raise RuntimeError(f"register slot={slot} failed: sc={sc} body={excerpt(body)}")
    data = body["data"]
    created_user_ids.append(data["user_id"])
    return data["user_id"], email, data["verification_token"]


def verify_email_via_api(token):
    sc, body = call("POST", "/auth/verify-email", body={"token": token})
    return sc == 200


# =============================================================
# Login admin
# =============================================================
line(); print("Setup — login admin (Diego)")
sc, body = call("POST", "/auth/login", body={"email": ADMIN_EMAIL, "password": ADMIN_PWD})
ADMIN_TOKEN = (body.get("data") or {}).get("token") if sc == 200 else None
if not ADMIN_TOKEN:
    print(f"ABORT: admin login failed sc={sc} body={excerpt(body)}")
    sys.exit(1)
print(f"  admin_token? {bool(ADMIN_TOKEN)}")


# =============================================================
# A) SCHEMA MIGRATIONS
# =============================================================
line(); print("A — Schema migrations (Fix 10)")

# 1: tabla payments
cols_payments = db_query(AUTH_DB, "PRAGMA table_info(payments)")
required_payments = {"id", "user_id", "admin_id", "amount", "currency",
                     "payment_method", "transaction_ref", "period_start",
                     "period_end", "status", "notes", "created_at"}
present_payments = {c.get("name") for c in cols_payments}
report(1, "Tabla auth.db.payments con columnas correctas",
       required_payments.issubset(present_payments),
       f"present={sorted(present_payments)} | missing={sorted(required_payments - present_payments)}")

# 2: tabla email_outbox
cols_outbox = db_query(AUTH_DB, "PRAGMA table_info(email_outbox)")
required_outbox = {"id", "user_id", "to_email", "template", "subject", "body",
                   "payload_json", "status", "attempts", "last_error",
                   "created_at", "sent_at"}
present_outbox = {c.get("name") for c in cols_outbox}
report(2, "Tabla auth.db.email_outbox con columnas correctas",
       required_outbox.issubset(present_outbox),
       f"missing={sorted(required_outbox - present_outbox)}")

# 3: columnas users.membership_expires_at + users.rejection_reason
cols_users = db_query(AUTH_DB, "PRAGMA table_info(users)")
present_users = {c.get("name") for c in cols_users}
needed_user_cols = {"membership_expires_at", "rejection_reason"}
report(3, "auth.db.users tiene membership_expires_at + rejection_reason",
       needed_user_cols.issubset(present_users),
       f"missing={sorted(needed_user_cols - present_users)}")


# =============================================================
# B) APPROVE FLOW
# =============================================================
line(); print("B — Approve flow")

# Test 4: register + verify-email + approve sin payment, default 30 days
uid_a, email_a, vtok_a = register_user(1)
verify_email_via_api(vtok_a)
sc, body = call("POST", f"/admin/auth-users/{uid_a}/approve", token=ADMIN_TOKEN, body={})
data = body.get("data") if body else {}
ok_4 = (sc == 200 and data.get("status") == "active"
        and data.get("membership_expires_at")
        and data.get("payment_id") is None
        and data.get("email_queued_id"))
report(4, "Approve sin payment → 200 + status=active + expires_at + email_queued + payment_id=None",
       ok_4,
       f"sc={sc} | resp={excerpt(body)}")

# Test 5: verificar DB — user activo, expires ~30d, no payment row, 1 email outbox
db_user = db_query(AUTH_DB,
    "SELECT status, membership_expires_at FROM users WHERE id=?", (uid_a,))[0]
expires_dt = datetime.fromisoformat(db_user["membership_expires_at"].replace("Z", "+00:00"))
delta_days = (expires_dt - datetime.utcnow()).days
db_pay = db_query(AUTH_DB, "SELECT COUNT(*) AS n FROM payments WHERE user_id=?", (uid_a,))[0]["n"]
db_email = db_query(AUTH_DB,
    "SELECT template, status FROM email_outbox WHERE user_id=? ORDER BY id DESC LIMIT 1",
    (uid_a,))
ok_5 = (db_user["status"] == "active"
        and 28 <= delta_days <= 31  # ~30 days
        and db_pay == 0
        and bool(db_email)
        and db_email[0]["template"] == "account_approved"
        and db_email[0]["status"] == "pending")
report(5, "DB: user.status='active', expires ~30d, NO payment row, email_outbox 'account_approved'",
       ok_5,
       f"status={db_user['status']} | delta_days={delta_days} | payments_count={db_pay} | email={db_email[0] if db_email else 'n/a'}")

# Test 6: approve con payment + membership_period_days=90
uid_b, email_b, vtok_b = register_user(2)
verify_email_via_api(vtok_b)
sc, body = call("POST", f"/admin/auth-users/{uid_b}/approve", token=ADMIN_TOKEN, body={
    "payment": {"amount": 5000, "currency": "ARS", "payment_method": "transferencia",
                "transaction_ref": "TX-FIX10-001", "notes": "test fix10"},
    "membership_period_days": 90,
})
data = body.get("data") if body else {}
payment_id_b = data.get("payment_id")
expires_b = data.get("membership_expires_at")
ok_6 = (sc == 200 and payment_id_b is not None and expires_b is not None
        and data.get("email_queued_id") is not None)
report(6, "Approve con payment + period=90d → 200 + payment_id + email_queued + expires_at",
       ok_6,
       f"sc={sc} | payment_id={payment_id_b} | expires={expires_b}")

# Test 7: payment row con admin_id de Diego (id=41), amount=5000, status='paid'
db_pay_b = db_query(AUTH_DB,
    "SELECT user_id, admin_id, amount, currency, payment_method, transaction_ref, status, period_start, period_end FROM payments WHERE id=?",
    (payment_id_b,))
prow = db_pay_b[0] if db_pay_b else {}
ok_7 = (prow.get("user_id") == uid_b
        and prow.get("admin_id") == 41
        and abs((prow.get("amount") or 0) - 5000) < 0.01
        and prow.get("currency") == "ARS"
        and prow.get("payment_method") == "transferencia"
        and prow.get("transaction_ref") == "TX-FIX10-001"
        and prow.get("status") == "paid"
        and bool(prow.get("period_start"))
        and bool(prow.get("period_end")))
report(7, "DB payments: user_id, admin_id=41 (Diego), amount=5000, method, txref, status='paid', periods set",
       ok_7,
       f"row={prow}")

# Test 8: doble gate — user sin email verificado → 400 EMAIL_NOT_VERIFIED
uid_c, email_c, vtok_c = register_user(3)
# NO verify
sc, body = call("POST", f"/admin/auth-users/{uid_c}/approve", token=ADMIN_TOKEN, body={})
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
ok_8 = sc == 400 and err_code == "EMAIL_NOT_VERIFIED"
report(8, "Approve sin email_verified → 400 EMAIL_NOT_VERIFIED",
       ok_8,
       f"sc={sc} | err_code={err_code} | resp={excerpt(body, 160)}")

# Test 9: override force_email_verification → 200 + audit log con force_email=true
sc, body = call("POST", f"/admin/auth-users/{uid_c}/approve", token=ADMIN_TOKEN, body={
    "force_email_verification": True,
})
data = body.get("data") if body else {}
ok_response = (sc == 200 and data.get("forced_email_verification") is True
               and data.get("status") == "active")
audit = db_query(AUTH_DB,
    "SELECT details FROM audit_log WHERE user_id=41 AND action='user_approved' ORDER BY id DESC LIMIT 1")
audit_has_force = bool(audit) and "force_email=True" in (audit[0].get("details") or "")
report(9, "Override force=true → 200 + audit_log includes force_email=True",
       ok_response and audit_has_force,
       f"sc={sc} | forced={data.get('forced_email_verification')} | audit_force? {audit_has_force} | audit={(audit[0].get('details')[:120] + '...') if audit else 'n/a'}")


# =============================================================
# C) REJECT FLOW
# =============================================================
line(); print("C — Reject flow")

# Test 10: register + reject con reason
uid_d, email_d, vtok_d = register_user(4)
sc, body = call("POST", f"/admin/auth-users/{uid_d}/reject", token=ADMIN_TOKEN, body={
    "reason": "Documentación incompleta",
})
data = body.get("data") if body else {}
ok_10 = (sc == 200 and data.get("status") == "rejected"
         and data.get("rejection_reason") == "Documentación incompleta"
         and data.get("email_queued_id") is not None)
report(10, "Reject con reason → 200 + status=rejected + rejection_reason en response",
       ok_10,
       f"sc={sc} | resp={excerpt(body)}")

# Test 11: DB: status='rejected', is_active=0, rejection_reason persisted
db_d = db_query(AUTH_DB,
    "SELECT status, is_active, rejection_reason FROM users WHERE id=?", (uid_d,))[0]
ok_11 = (db_d.get("status") == "rejected"
         and db_d.get("is_active") == 0
         and db_d.get("rejection_reason") == "Documentación incompleta")
report(11, "DB: status='rejected', is_active=0, rejection_reason='Documentación incompleta'",
       ok_11,
       f"row={db_d}")

# Test 12: email_outbox row template='account_rejected' con motivo en body
db_email_d = db_query(AUTH_DB,
    "SELECT template, body, payload_json FROM email_outbox WHERE user_id=? ORDER BY id DESC LIMIT 1",
    (uid_d,))[0]
payload = json.loads(db_email_d.get("payload_json") or "{}")
ok_12 = (db_email_d.get("template") == "account_rejected"
         and "Documentación incompleta" in (db_email_d.get("body") or "")
         and payload.get("reason") == "Documentación incompleta")
report(12, "email_outbox: template=account_rejected + reason en body + payload_json",
       ok_12,
       f"email={db_email_d}")


# =============================================================
# D) LOGIN BEHAVIOR
# =============================================================
line(); print("D — Login behavior (rejected, expired, OK)")

# Test 13: login user rejected → 403 ACCOUNT_REJECTED
sc, body = call("POST", "/auth/login", body={"email": email_d, "password": PWD})
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
ok_13 = sc == 403 and err_code == "ACCOUNT_REJECTED"
report(13, "Login user rejected → 403 ACCOUNT_REJECTED",
       ok_13,
       f"sc={sc} | err_code={err_code}")

# Test 14: forzar membership vencido en uid_a y login → 403 MEMBERSHIP_EXPIRED
yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
db_exec(AUTH_DB, "UPDATE users SET membership_expires_at=? WHERE id=?", (yesterday, uid_a))
sc, body = call("POST", "/auth/login", body={"email": email_a, "password": PWD})
err_code = (body.get("error") or {}).get("code", "") if body and not body.get("success") else ""
ok_14 = sc == 403 and err_code == "MEMBERSHIP_EXPIRED"
report(14, "Login con membership_expires_at en el pasado → 403 MEMBERSHIP_EXPIRED",
       ok_14,
       f"sc={sc} | err_code={err_code}")

# Test 15: Login user activo (uid_b: aprobado con period=90d) → 200 + membership_expires_at top-level
sc, body = call("POST", "/auth/login", body={"email": email_b, "password": PWD})
data = (body.get("data") if body else None) or {}
ok_15 = (sc == 200 and data.get("token")
         and data.get("membership_expires_at"))
report(15, "Login user activo → 200 + token + membership_expires_at top-level en response",
       ok_15,
       f"sc={sc} | top_level_expires={data.get('membership_expires_at')} | err={excerpt(body, 120) if sc != 200 else '-'}")


# =============================================================
# E) PENDING USERS LISTING
# =============================================================
line(); print("E — /admin/pending-users (breakdown + sort)")

# Crear un user verified (E5) y un no-verified (E6) para tener mezcla
uid_e5, email_e5, vtok_e5 = register_user(5)
verify_email_via_api(vtok_e5)
uid_e6, email_e6, vtok_e6 = register_user(6)
# uid_e6 sin verify

sc, body = call("GET", "/admin/pending-users", token=ADMIN_TOKEN)
data = body.get("data") if body else {}
users_list = data.get("users", [])
breakdown = data.get("breakdown") or {}
# encontrar nuestros users
e5_in_list = next((u for u in users_list if u.get("id") == uid_e5), None)
e6_in_list = next((u for u in users_list if u.get("id") == uid_e6), None)
ok_16 = (sc == 200
         and isinstance(breakdown, dict)
         and "email_verified_awaiting_admin" in breakdown
         and "awaiting_email_verification" in breakdown
         and e5_in_list is not None and e5_in_list.get("email_verified") is True
         and e6_in_list is not None and e6_in_list.get("email_verified") is False)
report(16, "GET /pending-users: breakdown con ambos buckets + email_verified flag por user",
       ok_16,
       f"sc={sc} | breakdown={breakdown} | total={len(users_list)} | e5_verified={e5_in_list.get('email_verified') if e5_in_list else 'n/a'} | e6_verified={e6_in_list.get('email_verified') if e6_in_list else 'n/a'}")

# Test 17: ordering email_verified DESC — todos los verified deben aparecer antes de los no-verified
verified_indexes = [i for i, u in enumerate(users_list) if u.get("email_verified")]
unverified_indexes = [i for i, u in enumerate(users_list) if not u.get("email_verified")]
sort_correct = (not verified_indexes or not unverified_indexes
                or max(verified_indexes) < min(unverified_indexes))
report(17, "Ordering: verified primero, no-verified después (email_verified DESC)",
       sort_correct,
       f"verified_idx={verified_indexes[:5]}{'...' if len(verified_indexes) > 5 else ''} | unverified_idx={unverified_indexes[:5]}")


# =============================================================
# CLEANUP
# =============================================================
line(); print(f"CLEANUP — {len(created_user_ids)} users + payments + emails + audit")
con_a = sqlite3.connect(AUTH_DB)
con_c = sqlite3.connect(CLINICAL_DB)
ca = con_a.cursor(); cc = con_c.cursor()
for uid in created_user_ids:
    cc.execute("DELETE FROM patients WHERE auth_user_id = ?", (uid,))
    ca.execute("DELETE FROM payments WHERE user_id = ?", (uid,))
    ca.execute("DELETE FROM email_outbox WHERE user_id = ?", (uid,))
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
print(f"FIX 10 RESUMEN: {passed}/{total} OK")
print("=" * 80)
for step, label, ok, _ in results:
    print(f"  {str(step):3} {'OK' if ok else 'FAIL':5} {label}")

sys.exit(0 if passed == total else 1)
