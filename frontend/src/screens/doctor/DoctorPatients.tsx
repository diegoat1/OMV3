import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Avatar } from '../../components/atoms'
import { assignmentService } from '../../services/assignmentService'
import { userService } from '../../services/userService'
import { ApiError } from '../../services/apiClient'
import type { MyPatient, MyRequest, Role, StaticProfile } from '../../types/api'
import { EditConstitutionalSheet } from '../../components/EditConstitutionalSheet'
import { NewMeasurementSheet } from '../../components/NewMeasurementSheet'
import { AddPatientSheet } from '../../components/AddPatientSheet'

const FILTERS = ['Todos', 'Hoy', 'Alta adherencia', 'Necesitan atención', 'Nuevos'] as const

interface Props {
  role?: Role
  /** Called when a patient row is tapped. Receives the auth_user_id of the
   *  selected patient so the detail screen can fetch its profile. */
  onOpenPatient?: (patientId: number) => void
}

export function DoctorPatients({ role = 'doctor', onOpenPatient }: Props) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Todos')
  const [patients, setPatients] = useState<MyPatient[]>([])
  const [requests, setRequests] = useState<MyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<number | null>(null)
  // Inline accordion state — patient_id of the currently expanded row, or null
  const [expandedId, setExpandedId] = useState<number | null>(null)
  // Quick-action sheets opened from the accordion. We pre-load the static
  // profile so the sheets can render without a second screen navigation.
  const [sheetTarget, setSheetTarget] = useState<{ profile: StaticProfile; kind: 'edit' | 'measure' } | null>(null)
  const [loadingSheet, setLoadingSheet] = useState<number | null>(null)
  const [showAddSheet, setShowAddSheet] = useState(false)

  const subjectPlural = role === 'trainer' ? 'atletas' : 'pacientes'
  const subjectAct = role === 'trainer' ? 'Atletas' : 'Pacientes'
  const dataMod = role === 'trainer' ? 'training' : role === 'nutritionist' ? 'nutrition' : 'medicine'

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pRes, rRes] = await Promise.all([
        assignmentService.myPatients().catch((e) => {
          if (e instanceof ApiError) return { patients: [] as MyPatient[] }
          throw e
        }),
        assignmentService.myRequests().catch((e) => {
          if (e instanceof ApiError) return { requests: [] as MyRequest[] }
          throw e
        }),
      ])
      setPatients(pRes.patients)
      setRequests(rRes.requests)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando vinculaciones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  // Patient-initiated requests (status='pending_specialist') — accept/reject
  const incomingRequests = requests.filter((r) => r.status === 'pending_specialist')
  // Specialist-initiated requests still waiting on patient
  const outgoingRequests = requests.filter((r) => r.status === 'pending_patient')

  /** Returns true if the patient was linked within the last 14 days. */
  const isNewPatient = (p: MyPatient): boolean => {
    if (!p.created_at) return false
    const d = new Date(p.created_at.replace(' ', 'T')).getTime()
    if (isNaN(d)) return false
    return Date.now() - d < 14 * 24 * 60 * 60 * 1000
  }

  /** Returns true if the patient updated their assignment in the last 24h. */
  const isToday = (p: MyPatient): boolean => {
    const src = p.updated_at || p.created_at
    if (!src) return false
    const d = new Date(src.replace(' ', 'T')).getTime()
    if (isNaN(d)) return false
    return Date.now() - d < 24 * 60 * 60 * 1000
  }

  const filteredPatients = patients.filter((p) => {
    if (q) {
      const hay = (p.patient_name || '').toLowerCase() + ' ' + (p.patient_email || '').toLowerCase()
      if (!hay.includes(q.toLowerCase())) return false
    }
    switch (filter) {
      case 'Hoy': return isToday(p)
      case 'Nuevos': return isNewPatient(p)
      // 'Alta adherencia' y 'Necesitan atención' requieren engagement.performance
      // por paciente (no expuesto desde el listado). Hasta que se cablee, no
      // filtramos para no esconder pacientes.
      case 'Alta adherencia':
      case 'Necesitan atención':
        return true
      case 'Todos':
      default:
        return true
    }
  })

  const handleAccept = async (id: number) => {
    setActingId(id)
    try {
      await assignmentService.accept(id)
      await reload()
    } finally {
      setActingId(null)
    }
  }
  const handleReject = async (id: number) => {
    setActingId(id)
    try {
      await assignmentService.reject(id)
      await reload()
    } finally {
      setActingId(null)
    }
  }
  const handleCancel = async (id: number) => {
    setActingId(id)
    try {
      await assignmentService.cancel(id)
      await reload()
    } finally {
      setActingId(null)
    }
  }
  /** Desvinculación definitiva para asignaciones ya aceptadas. */
  const handleUnassign = async (p: MyPatient) => {
    setActingId(p.id)
    try {
      await assignmentService.unassignPatient(p.patient_id)
      setExpandedId(null)
      await reload()
    } finally {
      setActingId(null)
    }
  }
  const openSheetFor = async (patientId: number, kind: 'edit' | 'measure') => {
    setLoadingSheet(patientId)
    try {
      const profile = await userService.getStaticProfile(patientId)
      setSheetTarget({ profile, kind })
    } catch {
      // swallow — leave UI in idle state
    } finally {
      setLoadingSheet(null)
    }
  }

  return (
    <div className="dp-screen" data-mod={dataMod}>
      {/* Page title — module pill + plus icon */}
      <div className="row-between">
        <div className="module-pill">{subjectAct}</div>
        <button
          type="button"
          className="dp-add"
          aria-label={`Agregar ${subjectPlural.slice(0, -1)}`}
          onClick={() => setShowAddSheet(true)}
        >
          <Icon name="plus" size={22} />
        </button>
      </div>

      <div className="display ah-title" style={{ marginTop: 4 }}>
        <em>{loading ? '…' : patients.length}</em> activos
      </div>

      {/* Incoming requests — patient-initiated, waiting for specialist accept */}
      {incomingRequests.length > 0 && (
        <div className="ph-section">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div className="section-label">Solicitudes entrantes</div>
            <div className="mono" style={{ color: 'var(--text-3)' }}>
              {incomingRequests.length} pendiente{incomingRequests.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {incomingRequests.map((r, i) => (
              <div
                key={r.id}
                className="row-between dp-link-row"
                style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <Avatar name={r.patient_name} color="#E23E4A" size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div className="ph-link-name">{r.patient_name}</div>
                    <div className="ph-link-meta">Pidió vincularse</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="ph-link-btn ph-link-accept"
                    onClick={() => handleAccept(r.id)}
                    disabled={actingId === r.id}
                  ><Icon name="check" size={14} /></button>
                  <button
                    type="button"
                    className="ph-link-btn ph-link-reject"
                    onClick={() => handleReject(r.id)}
                    disabled={actingId === r.id}
                  ><Icon name="x" size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing — already sent by me, waiting for the patient */}
      {outgoingRequests.length > 0 && (
        <div className="ph-section">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div className="section-label">Solicitudes enviadas</div>
            <div className="mono" style={{ color: 'var(--text-3)' }}>
              {outgoingRequests.length} esperando
            </div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {outgoingRequests.map((r, i) => (
              <div
                key={r.id}
                className="row-between dp-link-row"
                style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <Avatar name={r.patient_name} color="#7D8CFF" size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div className="ph-link-name">{r.patient_name}</div>
                    <div className="ph-link-meta" style={{ color: 'var(--warn)' }}>Esperando respuesta</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="ph-link-btn ph-link-reject"
                  onClick={() => handleCancel(r.id)}
                  disabled={actingId === r.id}
                  aria-label="Cancelar"
                ><Icon name="x" size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="dp-search">
        <span className="dp-search-icon">
          <Icon name="search" size={18} />
        </span>
        <input
          type="search"
          className="dp-search-input"
          placeholder={`Buscar ${subjectPlural.slice(0, -1)}…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Filter chips */}
      <div className="dp-filters">
        {FILTERS.map((f) => {
          const active = filter === f
          return (
            <button
              key={f}
              type="button"
              className={'chip dp-chip' + (active ? ' is-active' : '')}
              onClick={() => setFilter(f)}
              aria-pressed={active}
            >
              {f}
            </button>
          )
        })}
      </div>

      {/* Patients list */}
      <div className="ph-section">
        {error && (
          <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
            <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
          </div>
        )}
        {!error && !loading && filteredPatients.length === 0 && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              {q
                ? `Sin resultados para “${q}”.`
                : `Sin ${subjectPlural} vinculados todavía. Cuando aceptes una solicitud o se vincule un nuevo ${subjectPlural.slice(0, -1)} aparecerá acá.`}
            </p>
          </div>
        )}
        {!error && filteredPatients.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {filteredPatients.map((p, i) => {
              const expanded = expandedId === p.patient_id
              return (
                <div
                  key={p.id}
                  style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
                >
                  <button
                    type="button"
                    className="dp-patient-row"
                    onClick={() => setExpandedId(expanded ? null : p.patient_id)}
                    style={{
                      width: '100%', background: 'transparent', border: 0,
                      padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                    aria-expanded={expanded}
                  >
                    <Avatar name={p.patient_name} color="#E23E4A" size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ph-link-name">{p.patient_name}</div>
                      <div className="ph-link-meta">{p.patient_email || '—'}</div>
                    </div>
                    <div
                      className="dp-chev"
                      style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)' }}
                    >
                      <Icon name="chevR" size={16} />
                    </div>
                  </button>

                  {expanded && (
                    <div className="dp-actions">
                      <button
                        type="button"
                        className="dp-action"
                        onClick={() => onOpenPatient?.(p.patient_id)}
                      >
                        <Icon name="user" size={16} />
                        <span>Ver ficha completa</span>
                        <Icon name="chevR" size={14} />
                      </button>
                      <button
                        type="button"
                        className="dp-action"
                        onClick={() => openSheetFor(p.patient_id, 'measure')}
                        disabled={loadingSheet === p.patient_id}
                      >
                        <Icon name="data" size={16} />
                        <span>Nueva medición</span>
                        {loadingSheet === p.patient_id && (
                          <span className="mono dp-action-loading">…</span>
                        )}
                      </button>
                      <button
                        type="button"
                        className="dp-action"
                        onClick={() => openSheetFor(p.patient_id, 'edit')}
                        disabled={loadingSheet === p.patient_id}
                      >
                        <Icon name="edit" size={16} />
                        <span>Editar datos constitucionales</span>
                      </button>
                      <button
                        type="button"
                        className="dp-action dp-action-danger"
                        onClick={() => {
                          if (confirm(`¿Desvincular a ${p.patient_name}?`)) {
                            handleUnassign(p)
                          }
                        }}
                        disabled={actingId === p.id}
                      >
                        <Icon name="x" size={16} />
                        <span>Desvincular paciente</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick-action sheets opened from the accordion */}
      {sheetTarget?.kind === 'edit' && (
        <EditConstitutionalSheet
          profile={sheetTarget.profile}
          onClose={() => setSheetTarget(null)}
          onSaved={() => { setSheetTarget(null); reload() }}
        />
      )}
      {sheetTarget?.kind === 'measure' && (
        <NewMeasurementSheet
          profile={sheetTarget.profile}
          onClose={() => setSheetTarget(null)}
          onSaved={() => { setSheetTarget(null); reload() }}
        />
      )}

      {showAddSheet && (
        <AddPatientSheet
          subjectSingular={subjectPlural.slice(0, -1)}
          onClose={() => setShowAddSheet(false)}
          onCreated={() => { setShowAddSheet(false); reload() }}
        />
      )}
    </div>
  )
}
