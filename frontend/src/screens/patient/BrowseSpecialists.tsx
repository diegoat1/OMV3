import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Avatar } from '../../components/atoms'
import { assignmentService } from '../../services/assignmentService'
import { ApiError } from '../../services/apiClient'
import type { AvailableSpecialist } from '../../types/api'

interface Props {
  onClose: () => void
  onRequested?: () => void
  /** When the patient navigates here from the manage-roles sheet, the
   *  desired role is pre-selected so they can replace one specific role
   *  (e.g. "Médico" only). */
  preselectRole?: string
}

const ROLE_FILTERS: { id: '' | 'doctor' | 'nutricionista' | 'entrenador'; label: string }[] = [
  { id: '', label: 'Todos' },
  { id: 'doctor', label: 'Médicos' },
  { id: 'nutricionista', label: 'Nutricionistas' },
  { id: 'entrenador', label: 'Entrenadores' },
]

const ROLE_COLOR: Record<string, string> = {
  doctor: '#4FB8A8',
  nutricionista: '#E8A93A',
  entrenador: '#7D8CFF',
}

const ROLE_LABEL: Record<string, string> = {
  doctor: 'Médico',
  nutricionista: 'Nutricionista',
  entrenador: 'Entrenador',
}

export function BrowseSpecialists({ onClose, onRequested, preselectRole }: Props) {
  const [q, setQ] = useState('')
  // Server query — kept separate from `q` so we can debounce keystrokes
  // instead of firing one request per character.
  const [qDebounced, setQDebounced] = useState('')
  const [role, setRole] = useState<string>(preselectRole?.toLowerCase() || '')
  const [list, setList] = useState<AvailableSpecialist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestingId, setRequestingId] = useState<number | null>(null)
  const [successIds, setSuccessIds] = useState<Set<number>>(new Set())

  // Debounce the search input so rapid typing doesn't spam the backend or
  // race responses out of order.
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 250)
    return () => clearTimeout(t)
  }, [q])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await assignmentService.listAvailableSpecialists(role || undefined, qDebounced || undefined)
      setList(Array.isArray(res?.specialists) ? res.specialists : [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando profesionales')
    } finally {
      setLoading(false)
    }
  }, [role, qDebounced])

  useEffect(() => { reload() }, [reload])

  const handleRequest = async (s: AvailableSpecialist, chosenRole: string) => {
    setRequestingId(s.id)
    setError(null)
    try {
      await assignmentService.patientRequest({
        specialist_id: s.id,
        specialist_role: chosenRole,
      })
      setSuccessIds((prev) => {
        const next = new Set(prev)
        next.add(s.id)
        return next
      })
      onRequested?.()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos enviar la solicitud')
    } finally {
      setRequestingId(null)
    }
  }

  return (
    <div className="bs-screen" data-mod="medicine">
      {/* Top bar — same modal pattern as CheckIn / DoctorPatientDetail */}
      <div className="checkin-top">
        <button type="button" className="checkin-close" aria-label="Volver" onClick={onClose}>
          <Icon name="chevL" size={22} />
        </button>
        <div className="mono">Buscar profesional</div>
        <div className="checkin-top-spacer" />
      </div>

      <div className="display" style={{ fontSize: 26, marginTop: 6 }}>
        <em>Conectá</em> con un profesional
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6 }}>
        Tu solicitud queda pendiente hasta que el profesional la acepte.
      </p>

      {/* Search input */}
      <div className="dp-search" style={{ marginTop: 14 }}>
        <span className="dp-search-icon">
          <Icon name="search" size={18} />
        </span>
        <input
          type="search"
          className="dp-search-input"
          placeholder="Buscar por nombre o email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Role filter chips */}
      <div className="dp-filters" style={{ marginTop: 12 }}>
        {ROLE_FILTERS.map((f) => {
          const active = role === f.id
          return (
            <button
              key={f.id || 'all'}
              type="button"
              className={'chip dp-chip' + (active ? ' is-active' : '')}
              onClick={() => setRole(f.id)}
              aria-pressed={active}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Results */}
      <div className="ph-section" style={{ marginTop: 14 }}>
        {error && (
          <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
            <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
          </div>
        )}
        {!error && loading && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Cargando…</p>
          </div>
        )}
        {!error && !loading && list.length === 0 && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              {q ? `Sin resultados para “${q}”.` : 'Sin profesionales disponibles.'}
            </p>
          </div>
        )}
        {!error && !loading && list.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {list.map((s, i) => (
              <SpecialistRow
                key={s.id}
                spec={s}
                isFirst={i === 0}
                preselectRole={preselectRole?.toLowerCase()}
                requestingId={requestingId}
                wasRequested={successIds.has(s.id)}
                onRequest={handleRequest}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface SpecialistRowProps {
  spec: AvailableSpecialist
  isFirst: boolean
  preselectRole?: string
  requestingId: number | null
  wasRequested: boolean
  onRequest: (spec: AvailableSpecialist, role: string) => void
}

function SpecialistRow({
  spec,
  isFirst,
  preselectRole,
  requestingId,
  wasRequested,
  onRequest,
}: SpecialistRowProps) {
  // Default to the preselected role if this specialist offers it; otherwise
  // the first available role.
  const roles = Array.isArray(spec.roles) ? spec.roles : []
  const initialRole =
    preselectRole && roles.includes(preselectRole) ? preselectRole : roles[0]
  const [chosen, setChosen] = useState<string>(initialRole)
  const color = ROLE_COLOR[chosen] || 'var(--medic)'

  return (
    <div
      className="ph-link-row"
      style={{
        borderTop: isFirst ? 0 : '1px solid var(--line)',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name={spec.display_name} color={color} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ph-link-name">{spec.display_name}</div>
          <div className="ph-link-meta">{spec.email}</div>
        </div>
      </div>
      {roles.length > 1 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {roles.map((r) => {
            const active = chosen === r
            const c = ROLE_COLOR[r] || 'var(--medic)'
            return (
              <button
                key={r}
                type="button"
                className="bs-role-chip"
                onClick={() => setChosen(r)}
                style={
                  active
                    ? { background: c + '22', borderColor: c, color: c }
                    : undefined
                }
                aria-pressed={active}
              >
                {ROLE_LABEL[r] || r}
              </button>
            )
          })}
        </div>
      )}
      <button
        type="button"
        className="btn btn-full"
        style={{
          background: wasRequested ? 'var(--ok)' : 'var(--medic)',
          color: '#0b2523',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
        onClick={() => onRequest(spec, chosen)}
        disabled={requestingId === spec.id || wasRequested}
      >
        {wasRequested ? (
          <><Icon name="check" size={14} /> Solicitud enviada</>
        ) : requestingId === spec.id ? (
          'Enviando…'
        ) : (
          <>Solicitar como {ROLE_LABEL[chosen] || chosen} <Icon name="chevR" size={14} /></>
        )}
      </button>
    </div>
  )
}
