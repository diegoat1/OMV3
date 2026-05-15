import { useCallback, useEffect, useState } from 'react'
import { Avatar, Progress } from '../../components/atoms'
import { Icon } from '../../components/Icon'
import { assignmentService } from '../../services/assignmentService'
import { ApiError } from '../../services/apiClient'
import type { MyPatient, PendingAssignment, Role } from '../../types/api'

interface Props {
  role?: Role
}

const PILL_LABEL: Partial<Record<Role, string>> = {
  doctor: 'Medicina',
  nutritionist: 'Nutrición',
  trainer: 'Entreno',
}

const SUBJECT_NOUN: Partial<Record<Role, string>> = {
  doctor: 'pacientes',
  nutritionist: 'pacientes',
  trainer: 'atletas',
}

const SUBJECT_AVATAR_COLOR: Partial<Record<Role, string>> = {
  doctor: '#4FB8A8',
  nutritionist: '#E8A93A',
  trainer: '#7D8CFF',
}

export function DoctorHome({ role = 'doctor' }: Props) {
  const pill = PILL_LABEL[role] ?? 'Clínica'
  const subject = SUBJECT_NOUN[role] ?? 'pacientes'
  const subjectSingular = subject.endsWith('s') ? subject.slice(0, -1) : subject
  const subjectAvatarColor = SUBJECT_AVATAR_COLOR[role] ?? 'var(--medic)'

  const [patients, setPatients] = useState<MyPatient[]>([])
  const [incoming, setIncoming] = useState<PendingAssignment[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<number | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pat, inc] = await Promise.all([
        assignmentService.myPatients().catch(() => ({ patients: [] })),
        // /assignments/pending is the patient-side feed of incoming; specialists
        // get their incoming requests via /my-requests filtered by status.
        // We use myRequests() and keep only `pending_specialist`.
        assignmentService.myRequests().catch(() => ({ requests: [] })),
      ])
      setPatients(pat.patients)
      setIncoming(
        inc.requests
          .filter((r) => r.status === 'pending_specialist')
          .map((r) => ({
            id: r.id,
            specialist_id: r.specialist_id,
            specialist_name: r.specialist_name,
            specialist_role: r.specialist_role,
            patient_id: r.patient_id,
            patient_name: r.patient_name,
            status: r.status,
            created_at: r.created_at,
          })),
      )
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando panel')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const handleAccept = async (id: number) => {
    setActingId(id)
    try {
      await assignmentService.accept(id)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos aceptar la solicitud')
    } finally {
      setActingId(null)
    }
  }
  const handleReject = async (id: number) => {
    setActingId(id)
    try {
      await assignmentService.reject(id)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos rechazar la solicitud')
    } finally {
      setActingId(null)
    }
  }

  const pendingCount = incoming?.length ?? 0
  const patientsCount = patients.length

  return (
    <div className="dh-screen" data-mod={role === 'trainer' ? 'training' : role === 'nutritionist' ? 'nutrition' : 'medicine'}>
      {/* Page title — module pill + serif italic display */}
      <div className="ah-title-block">
        <div className="module-pill">{pill}</div>
        <div className="display ah-title">
          <em>Panel</em> de hoy
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Stats — 3 real tiles */}
      <div className="dh-stats">
        <div className="stat">
          <div className="k">Vinculados</div>
          <div className="v">{loading ? '…' : patientsCount}</div>
          <div className="d">{subject} activos</div>
        </div>
        <div className="stat">
          <div className="k">Pendientes</div>
          <div className="v">{loading ? '…' : pendingCount}</div>
          <div className="d">por aceptar</div>
        </div>
        <div className="stat">
          <div className="k">Consultas hoy</div>
          <div className="v">—</div>
          <div className="d">próximamente</div>
        </div>
      </div>

      {/* Solicitudes pendientes — incoming patient-initiated requests */}
      {!loading && incoming && incoming.length > 0 && (
        <div className="ph-section">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div className="section-label">Solicitudes recibidas</div>
            <div className="mono" style={{ color: 'var(--text-3)' }}>
              {incoming.length} pendiente{incoming.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {incoming.slice(0, 5).map((r, i) => (
              <div
                key={r.id}
                className="ph-link-row"
                style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
              >
                <Avatar name={r.patient_name} color="var(--omega)" size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ph-link-name">{r.patient_name}</div>
                  <div className="ph-link-meta">Pidió vincularse</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="ph-link-btn ph-link-accept"
                    onClick={() => handleAccept(r.id)}
                    disabled={actingId === r.id}
                    aria-label="Aceptar"
                  ><Icon name="check" size={14} /></button>
                  <button
                    type="button"
                    className="ph-link-btn ph-link-reject"
                    onClick={() => handleReject(r.id)}
                    disabled={actingId === r.id}
                    aria-label="Rechazar"
                  ><Icon name="x" size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent patients — preview of linked list */}
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Mis {subject}</div>
          {!loading && patientsCount > 0 && (
            <div className="mono" style={{ color: 'var(--text-3)' }}>
              {patientsCount} vinculad{patientsCount === 1 ? 'o' : 'os'}
            </div>
          )}
        </div>
        {loading && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Cargando…</p>
          </div>
        )}
        {!loading && patientsCount === 0 && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              Sin {subject} vinculados todavía. Cuando aceptes una solicitud o vincules un {subjectSingular} nuevo aparecerá acá.
            </p>
          </div>
        )}
        {!loading && patientsCount > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {patients.slice(0, 5).map((p, i) => (
              <div
                key={p.id}
                className="ph-link-row"
                style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
              >
                <Avatar name={p.patient_name} color={subjectAvatarColor} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ph-link-name">{p.patient_name}</div>
                  <div className="ph-link-meta">{p.patient_email || '—'}</div>
                </div>
              </div>
            ))}
            {patientsCount > 5 && (
              <div className="ph-link-row">
                <span
                  className="mono"
                  style={{ flex: 1, fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}
                >
                  +{patientsCount - 5} más · ver listado completo
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Agenda — placeholder con tooltip "próximamente" */}
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Agenda de hoy</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>próximamente</div>
        </div>
        <div className="card" style={{ opacity: 0.7 }}>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            La agenda y citas todavía no están conectadas al panel del profesional.
          </p>
        </div>
      </div>

      {/* Alertas — placeholder, endpoint backend pendiente */}
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Alertas clínicas</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>próximamente</div>
        </div>
        <div className="card" style={{ opacity: 0.7 }}>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Las alertas de signos rojos por paciente aparecerán acá cuando estén implementadas en backend.
          </p>
        </div>
      </div>

      {/* Quick activity preview — simple progress placeholder reminding the
          professional that there's work to do for each linked patient. */}
      {!loading && patientsCount > 0 && (
        <div className="ph-section">
          <div className="section-label">Actividad esta semana</div>
          <div className="card">
            <div className="row-between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                Pacientes con seguimiento activo
              </span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {patientsCount}
              </span>
            </div>
            <Progress value={Math.min(100, patientsCount * 10)} color={subjectAvatarColor} />
          </div>
        </div>
      )}
    </div>
  )
}
