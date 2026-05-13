#!/usr/bin/env node
/**
 * scripts/test-e2e.mjs
 *
 * End-to-end smoke test for OMV3 — checks every user flow added in Slices 1-8
 * against the live PA backend. No browser, no Playwright, no dependencies.
 *
 * USAGE:
 *   node scripts/test-e2e.mjs
 *
 * ENV VARS (required):
 *   ADMIN_EMAIL, ADMIN_PASS         — to test admin flow + pending users
 *   PATIENT_EMAIL, PATIENT_PASS     — patient with data (mediciones, plan, goals)
 *   DOCTOR_EMAIL, DOCTOR_PASS       — professional with patients vinculados
 *
 * OPTIONAL:
 *   BASE_URL                        — default https://omegamedicina.pythonanywhere.com
 *   MUTATIONS=1                     — also runs POST tests (writes data)
 *
 * EXIT CODES:
 *   0 — all PASS or WARN
 *   1 — at least one FAIL (5xx, schema mismatch, network error)
 *
 * What it covers (one section per slice):
 *   Slice 1 — alta de usuarios:        GET /admin/pending-users
 *   Slice 2 — vinculación paciente:    GET /assignments/{my-specialists,pending,my-outgoing-requests,specialists}
 *   Slice 3 — onboarding clínico:      GET /users/<id>/{static-profile,measurements}
 *   Slice 4 — aceptar objetivo:        GET /users/<id>/goals?status=proposed
 *   Slice 5 — daily-log:               GET /nutrition/{plans,daily-log,foods?q=arroz}
 *   Slice 6 — entrenamiento:           GET /training/{sessions/today,plans,strength}
 *   Slice 7 — check-in + health-index: GET /checkin/{today,health-index,health-index/trend}
 *   Slice 8 — panel profesional:       GET /assignments/{my-patients,my-requests}
 */

const BASE_URL = process.env.BASE_URL || 'https://omegamedicina.pythonanywhere.com'
const MUTATIONS = process.env.MUTATIONS === '1'

const C = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  dim:   '\x1b[2m',
  red:   '\x1b[31m',
  green: '\x1b[32m',
  yellow:'\x1b[33m',
  blue:  '\x1b[34m',
  cyan:  '\x1b[36m',
}

const stats = { pass: 0, warn: 0, fail: 0, skip: 0 }
const failures = []

function fmt(level, label, msg = '') {
  const colors = { PASS: C.green, WARN: C.yellow, FAIL: C.red, SKIP: C.dim, INFO: C.cyan }
  const c = colors[level] || ''
  return `${c}${level.padEnd(4)}${C.reset}  ${label}${msg ? '  ' + C.dim + msg + C.reset : ''}`
}

function logStep(level, label, msg = '') {
  console.log(' ', fmt(level, label, msg))
  if (level === 'PASS') stats.pass++
  else if (level === 'WARN') stats.warn++
  else if (level === 'FAIL') { stats.fail++; failures.push(`${label} — ${msg}`) }
  else if (level === 'SKIP') stats.skip++
}

function logSection(name) {
  console.log()
  console.log(`${C.bold}${C.cyan}━━━ ${name} ━━━${C.reset}`)
}

// ───────────────────────────────────────────────────────────────────────────
// HTTP
// ───────────────────────────────────────────────────────────────────────────

async function call(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const opts = { method, headers }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const url = `${BASE_URL}${path}`
  try {
    const res = await fetch(url, opts)
    const text = await res.text()
    let json = null
    try { json = JSON.parse(text) } catch {}
    return { status: res.status, ok: res.ok, json, text, url }
  } catch (e) {
    return { status: 0, ok: false, json: null, text: e.message, url, networkError: true }
  }
}

/** Wrapper that classifies a response into PASS/WARN/FAIL.
 *  - 5xx or network error → FAIL
 *  - response.success === false → FAIL (envelope reported error)
 *  - 4xx → WARN (expected for unauthenticated paths, etc.)
 *  - 2xx with success envelope → PASS, returns json.data
 */
async function check(label, method, path, opts = {}, expectShape = null) {
  const r = await call(method, path, opts)
  if (r.networkError) {
    logStep('FAIL', label, `network: ${r.text}`)
    return null
  }
  if (r.status >= 500) {
    logStep('FAIL', label, `${r.status} ${(r.json?.error?.message || r.text).slice(0, 100)}`)
    return null
  }
  if (r.status >= 400) {
    const m = r.json?.error?.message || r.text.slice(0, 80)
    logStep('WARN', label, `${r.status} ${m}`)
    return null
  }
  if (r.json && r.json.success === false) {
    logStep('FAIL', label, `success:false ${r.json.error?.message || ''}`)
    return null
  }
  const data = r.json?.data ?? r.json
  if (expectShape) {
    const missing = expectShape.filter((k) => data === null || data === undefined || !(k in data))
    if (missing.length > 0) {
      logStep('FAIL', label, `missing fields: ${missing.join(', ')}`)
      return null
    }
  }
  logStep('PASS', label, `${r.status}`)
  return data
}

// ───────────────────────────────────────────────────────────────────────────
// Auth helpers
// ───────────────────────────────────────────────────────────────────────────

async function login(email, password) {
  if (!email || !password) return null
  const r = await call('POST', '/api/v3/auth/login', { body: { email, password } })
  if (!r.ok) {
    logStep('FAIL', `login as ${email}`, `${r.status} ${r.json?.error?.message || r.text.slice(0, 60)}`)
    return null
  }
  const token = r.json?.data?.token
  const user = r.json?.data?.user
  if (!token || !user) {
    logStep('FAIL', `login as ${email}`, 'no token or user in response')
    return null
  }
  logStep('PASS', `login as ${email}`, `role=${user.rol} id=${user.id}`)
  return { token, user }
}

// ───────────────────────────────────────────────────────────────────────────
// Tests by slice
// ───────────────────────────────────────────────────────────────────────────

async function testHealth() {
  logSection('Health (sin auth)')
  const data = await check('GET /health', 'GET', '/api/v3/health', {}, ['status', 'modules'])
  if (data) console.log(`        ${C.dim}modules: ${data.modules.join(', ')}${C.reset}`)
}

async function testLoginErrors() {
  logSection('Login — error paths')
  const r = await call('POST', '/api/v3/auth/login', { body: { email: 'noexiste@test.com', password: 'wrong' } })
  if (r.status === 401) logStep('PASS', 'login con creds inválidas → 401')
  else logStep('FAIL', 'login con creds inválidas', `esperaba 401, recibí ${r.status}`)
}

async function testAdmin(adminSession) {
  logSection('Slice 1 — Admin (alta de usuarios)')
  if (!adminSession) { logStep('SKIP', 'admin tests', 'sin ADMIN_EMAIL/PASS'); return }
  const t = adminSession.token
  await check('GET /admin/pending-users', 'GET', '/api/v3/admin/pending-users', { token: t }, ['users', 'total'])
}

async function testPatientFlows(patientSession) {
  if (!patientSession) { logStep('SKIP', 'patient slices', 'sin PATIENT_EMAIL/PASS'); return }
  const t = patientSession.token
  const uid = patientSession.user.id

  // Slice 2 — Vinculación
  logSection('Slice 2 — Vinculación (lado paciente)')
  await check('GET /assignments/my-specialists', 'GET', '/api/v3/assignments/my-specialists', { token: t }, ['specialists'])
  await check('GET /assignments/pending (incoming)', 'GET', '/api/v3/assignments/pending', { token: t }, ['pending'])
  await check('GET /assignments/my-outgoing-requests (Slice 2 nuevo)', 'GET', '/api/v3/assignments/my-outgoing-requests', { token: t }, ['requests'])
  await check('GET /assignments/specialists?role=doctor (Browse)', 'GET', '/api/v3/assignments/specialists?role=doctor', { token: t }, ['specialists'])

  // Slice 3 — Onboarding clínico
  logSection('Slice 3 — Datos clínicos del paciente')
  // Note: frontend's userService.getStaticProfile() calls GET /users/<id> and
  // derives the StaticProfile shape client-side. The backend doesn't expose
  // /static-profile as a separate endpoint.
  await check(`GET /users/${uid} (proyectado a StaticProfile en frontend)`, 'GET', `/api/v3/users/${uid}`, { token: t }, ['user'])
  await check(`GET /users/${uid}/measurements (limit=1)`, 'GET', `/api/v3/users/${uid}/measurements?limit=1`, { token: t }, ['measurements'])

  // Slice 4 — Aceptar objetivo
  logSection('Slice 4 — Goals (lado paciente)')
  await check(`GET /users/${uid}/goals?status=proposed`, 'GET', `/api/v3/users/${uid}/goals?status=proposed`, { token: t })
  await check(`GET /users/${uid}/goals?status=active`, 'GET', `/api/v3/users/${uid}/goals?status=active`, { token: t })

  // Slice 5 — Daily-log alimentos
  logSection('Slice 5 — Daily-log alimentos')
  await check('GET /nutrition/plans', 'GET', '/api/v3/nutrition/plans', { token: t }, ['plans'])
  const today = new Date().toISOString().slice(0, 10)
  await check(`GET /nutrition/daily-log?fecha=${today}`, 'GET', `/api/v3/nutrition/daily-log?fecha=${today}`, { token: t }, ['meals'])
  await check('GET /nutrition/foods?q=arroz (búsqueda)', 'GET', '/api/v3/nutrition/foods?q=arroz&per_page=3', { token: t })
  await check('GET /nutrition/foods (sin filtro)', 'GET', '/api/v3/nutrition/foods?per_page=3', { token: t })

  // Slice 6 — Entrenamiento
  logSection('Slice 6 — Entrenamiento (lado paciente)')
  await check('GET /training/sessions/today', 'GET', '/api/v3/training/sessions/today', { token: t })
  await check('GET /training/plans', 'GET', '/api/v3/training/plans', { token: t })

  // Slice 7 — Check-in + Health Index
  logSection('Slice 7 — Check-in + Health Index')
  await check('GET /checkin/today', 'GET', '/api/v3/checkin/today', { token: t })
  await check('GET /checkin/health-index', 'GET', '/api/v3/checkin/health-index', { token: t }, ['score'])
  await check('GET /checkin/health-index/trend?days=7', 'GET', '/api/v3/checkin/health-index/trend?days=7', { token: t }, ['trend'])

  if (MUTATIONS) {
    logSection('Slice 7 — POST check-in (--mutations)')
    await check('POST /checkin/today (test write)', 'POST', '/api/v3/checkin/today', {
      token: t,
      body: { animo: 8, energia: 6, horas_sueno: 7.5, dolor_abdominal: 0, completado: 1 },
    }, ['checkin', 'health_index'])
  }
}

async function testDoctorFlows(doctorSession) {
  if (!doctorSession) { logStep('SKIP', 'doctor slices', 'sin DOCTOR_EMAIL/PASS'); return }
  const t = doctorSession.token

  // Slice 8 — Panel profesional
  logSection('Slice 8 — Panel del profesional')
  const myPatients = await check('GET /assignments/my-patients', 'GET', '/api/v3/assignments/my-patients', { token: t }, ['patients'])
  await check('GET /assignments/my-requests', 'GET', '/api/v3/assignments/my-requests', { token: t }, ['requests'])

  // Doctor → un paciente específico (si tiene alguno)
  const firstPatient = myPatients?.patients?.[0]
  if (!firstPatient) {
    logStep('SKIP', 'doctor → paciente', 'el doctor no tiene pacientes vinculados')
    return
  }
  const pid = firstPatient.patient_id
  const pname = firstPatient.patient_name
  logSection(`Slice 3/6 — Doctor → Paciente "${pname}" (id ${pid})`)
  await check(`GET /users/${pid}`, 'GET', `/api/v3/users/${pid}`, { token: t }, ['user'])
  await check(`GET /users/${pid}/measurements`, 'GET', `/api/v3/users/${pid}/measurements?limit=3`, { token: t }, ['measurements'])
  await check(`GET /users/${pid}/goals (todos)`, 'GET', `/api/v3/users/${pid}/goals`, { token: t })
  await check(`GET /training/strength?user=${encodeURIComponent(pname)}`, 'GET', `/api/v3/training/strength?user=${encodeURIComponent(pname)}`, { token: t })
  await check(`GET /training/plans?patient=${encodeURIComponent(pname)}`, 'GET', `/api/v3/training/plans?patient=${encodeURIComponent(pname)}`, { token: t }, ['plans'])
  await check(`GET /nutrition/plans?patient=${encodeURIComponent(pname)}`, 'GET', `/api/v3/nutrition/plans?patient=${encodeURIComponent(pname)}`, { token: t }, ['plans'])
}

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`${C.bold}OMV3 — End-to-end smoke test${C.reset}`)
  console.log(`${C.dim}Base URL: ${BASE_URL}${C.reset}`)
  console.log(`${C.dim}Mutations: ${MUTATIONS ? 'ENABLED (will write data)' : 'disabled'}${C.reset}`)

  await testHealth()
  await testLoginErrors()

  const admin = await login(process.env.ADMIN_EMAIL, process.env.ADMIN_PASS)
  const patient = await login(process.env.PATIENT_EMAIL, process.env.PATIENT_PASS)
  const doctor = await login(process.env.DOCTOR_EMAIL, process.env.DOCTOR_PASS)

  await testAdmin(admin)
  await testPatientFlows(patient)
  await testDoctorFlows(doctor)

  // Summary
  console.log()
  console.log(`${C.bold}━━━ Resumen ━━━${C.reset}`)
  console.log(`  ${C.green}PASS${C.reset} ${stats.pass}   ${C.yellow}WARN${C.reset} ${stats.warn}   ${C.red}FAIL${C.reset} ${stats.fail}   ${C.dim}SKIP${C.reset} ${stats.skip}`)
  if (failures.length > 0) {
    console.log()
    console.log(`${C.red}${C.bold}Fallas:${C.reset}`)
    for (const f of failures) console.log(`  ${C.red}•${C.reset} ${f}`)
  }
  process.exit(stats.fail > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(`${C.red}Unhandled error:${C.reset}`, e)
  process.exit(2)
})
