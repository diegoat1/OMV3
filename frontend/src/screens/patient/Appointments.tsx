import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { telemedicineService } from '../../services/telemedicineService'
import { ApiError } from '../../services/apiClient'
import type { Appointment, AppointmentStatus, ClinicalSituation } from '../../types/api'

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  programada: 'var(--medic)',
  confirmada: 'var(--ok)',
  realizada: 'var(--text-3)',
  cancelada: 'var(--omega)',
  reagendada: 'var(--warn)',
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  programada: 'Programada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  reagendada: 'Reagendada',
}

function parseDate(iso: string): Date | null {
  if (!iso) return null
  const d = new Date(iso.replace(' ', 'T'))
  return isNaN(d.getTime()) ? null : d
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [situations, setSituations] = useState<ClinicalSituation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<number | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [apptRes, situRes] = await Promise.all([
        telemedicineService.listAppointments({ limit: 50 }).catch(() => ({ appointments: [], total: 0 })),
        telemedicineService.listSituations({ activa: 1, limit: 20 }).catch(() => ({ situations: [], total: 0 })),
      ])
      setAppointments(Array.isArray(apptRes?.appointments) ? apptRes.appointments : [])
      setSituations(Array.isArray(situRes?.situations) ? situRes.situations : [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando citas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const now = Date.now()
  const upcoming = appointments
    .map((a) => ({ a, d: parseDate(a.fecha_cita) }))
    .filter(({ a, d }) =>
      d != null && d.getTime() >= now && a.estado !== 'cancelada' && a.estado !== 'realizada',
    )
    .sort((x, y) => (x.d!.getTime() - y.d!.getTime()))

  const past = appointments
    .map((a) => ({ a, d: parseDate(a.fecha_cita) }))
    .filter(({ a, d }) => d != null && (d.getTime() < now || a.estado === 'realizada' || a.estado === 'cancelada'))
    .sort((x, y) => (y.d!.getTime() - x.d!.getTime()))
    .slice(0, 5)

  const next = upcoming[0]

  const handleCancel = async (id: number) => {
    if (!confirm('¿Cancelar esta cita?')) return
    setActingId(id)
    try {
      await telemedicineService.updateAppointmentStatus(id, 'cancelada')
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos cancelar la cita')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="ap-screen" data-mod="medicine">
      {/* Page title */}
      <div className="ap-title-block">
        <div className="module-pill">Medicina</div>
        <div className="display ap-title">
          <em>Tus</em> citas
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Próxima cita */}
      <div className="ap-section">
        <div className="card ap-next-card">
          <div className="mono" style={{ color: 'var(--medic)' }}>Próxima</div>
          {loading ? (
            <div className="ap-next-title">Cargando…</div>
          ) : next ? (
            <>
              <div className="ap-next-title">
                {next.a.tipo_cita || 'Consulta'}
                {next.a.especialidad ? ` · ${next.a.especialidad}` : ''}
              </div>
              <div className="ap-next-sub">
                {formatLongDate(next.d!)}
                {next.a.medico_nombre ? ` · ${next.a.medico_nombre}` : ''}
              </div>
              {next.a.link_videollamada && (
                <div style={{ marginTop: 10 }}>
                  <a
                    href={next.a.link_videollamada}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Icon name="play" size={14} /> Unirse al videoconsulta
                  </a>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="ap-next-title">Sin próxima consulta</div>
              <div className="ap-next-sub">Tu próxima cita aparecerá acá cuando se agende.</div>
            </>
          )}
        </div>
      </div>

      {/* Lista próximas */}
      <div className="ap-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Próximas</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>
            {loading ? '…' : `${upcoming.length} agendada${upcoming.length === 1 ? '' : 's'}`}
          </div>
        </div>
        {!loading && upcoming.length === 0 && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              Sin citas próximas.
            </p>
          </div>
        )}
        {upcoming.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {upcoming.map(({ a, d }, i) => (
              <div
                key={a.id}
                className="ph-link-row"
                style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ph-link-name">
                    {a.tipo_cita || 'Consulta'}
                    {a.medico_nombre ? ` · ${a.medico_nombre}` : ''}
                  </div>
                  <div className="ph-link-meta">
                    {formatShortDate(d!)}
                    {a.modalidad ? ` · ${a.modalidad}` : ''}
                  </div>
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: STATUS_COLOR[a.estado] || 'var(--text-3)',
                    marginRight: 8,
                  }}
                >
                  {STATUS_LABEL[a.estado] || a.estado}
                </span>
                <button
                  type="button"
                  className="ph-link-btn ph-link-reject"
                  onClick={() => handleCancel(a.id)}
                  disabled={actingId === a.id}
                  aria-label="Cancelar cita"
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pasadas */}
      {past.length > 0 && (
        <div className="ap-section">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div className="section-label">Historial reciente</div>
            <div className="mono" style={{ color: 'var(--text-3)' }}>{past.length}</div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {past.map(({ a, d }, i) => (
              <div
                key={a.id}
                className="ph-link-row"
                style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ph-link-name">
                    {a.tipo_cita || 'Consulta'}
                    {a.medico_nombre ? ` · ${a.medico_nombre}` : ''}
                  </div>
                  <div className="ph-link-meta">
                    {formatShortDate(d!)}
                    {a.motivo_consulta ? ` · ${a.motivo_consulta}` : ''}
                  </div>
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: STATUS_COLOR[a.estado] || 'var(--text-3)',
                  }}
                >
                  {STATUS_LABEL[a.estado] || a.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Situaciones clínicas activas */}
      <div className="ap-section">
        <div className="section-label">Situaciones clínicas</div>
        {!loading && situations.length === 0 && (
          <div className="card ap-situation">
            <div className="ap-situation-ic">
              <Icon name="heart" size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="ap-situation-title">Sin situaciones registradas</div>
              <div className="ap-situation-sub">Tu historial clínico aparecerá acá.</div>
            </div>
          </div>
        )}
        {situations.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {situations.map((s, i) => (
              <div
                key={s.id}
                className="ap-situation"
                style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)', borderRadius: 0 }}
              >
                <div className="ap-situation-ic">
                  <Icon name="heart" size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ap-situation-title">{s.nombre || s.tipo_situacion || 'Situación'}</div>
                  {s.descripcion && (
                    <div className="ap-situation-sub">{s.descripcion}</div>
                  )}
                  {s.severidad && (
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                      Severidad: {s.severidad}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
