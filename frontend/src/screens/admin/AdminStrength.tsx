import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Avatar } from '../../components/atoms'
import { trainingService } from '../../services/trainingService'
import { ApiError } from '../../services/apiClient'
import type { StrengthResponse, StrengthTest } from '../../types/api'

/** A flattened row: one strength test belonging to one patient. We drop entries
 *  whose `strength_data` is null (patients without any recorded test). */
interface StrengthRow {
  user: string
  test: StrengthTest
}

/** A single lift extracted from a test's `lift_inputs_json` map, normalized for
 *  display. `rm` is the estimated 1RM (Epley) the backend stores per lift. */
interface LiftEntry {
  key: string
  peso: number | null
  reps: number | null
  rm: number | null
}

/** Human labels for the canonical lift keys; unknown keys fall back to a
 *  capitalized version of the raw key. */
const LIFT_LABEL: Record<string, string> = {
  squat: 'Sentadilla',
  sentadilla: 'Sentadilla',
  bench: 'Press banca',
  press_banca: 'Press banca',
  deadlift: 'Peso muerto',
  peso_muerto: 'Peso muerto',
  ohp: 'Press militar',
  press_militar: 'Press militar',
  row: 'Remo',
  remo: 'Remo',
  pullup: 'Dominadas',
  dominadas: 'Dominadas',
}

function liftLabel(key: string): string {
  if (LIFT_LABEL[key]) return LIFT_LABEL[key]
  const clean = key.replace(/_/g, ' ').trim()
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return null
}

/** Pulls the per-lift detail out of a test's `lift_inputs_json`. */
function extractLifts(test: StrengthTest): LiftEntry[] {
  const inputs = test.lift_inputs_json
  if (!inputs || typeof inputs !== 'object') return []
  return Object.entries(inputs)
    .map(([key, raw]) => ({
      key,
      peso: num(raw?.peso),
      reps: num(raw?.reps),
      rm: num(raw?.rm),
    }))
    .filter((l) => l.peso != null || l.rm != null)
}

function fmtDate(raw: string): string {
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtKg(v: number | null): string {
  return v == null ? '—' : `${v % 1 === 0 ? v : v.toFixed(1)} kg`
}

export function AdminStrength() {
  const [rows, setRows] = useState<StrengthRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    trainingService
      .strengthAdmin()
      .then((res: StrengthResponse[]) => {
        if (cancelled) return
        const flattened: StrengthRow[] = res
          .filter((r): r is StrengthResponse & { strength_data: StrengthTest } => r.strength_data != null)
          .map((r) => ({ user: r.user, test: r.strength_data }))
        // Most recent test first.
        flattened.sort((a, b) => (b.test.fecha || '').localeCompare(a.test.fecha || ''))
        setRows(flattened)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Error cargando tests de fuerza')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((r) => r.user.toLowerCase().includes(term))
  }, [rows, q])

  const total = filtered.length

  return (
    <div className="ap-screen" data-mod="admin">
      <div className="ah-title-block">
        <div className="module-pill">Admin</div>
        <div className="display ah-title">
          Tests de <em>fuerza</em>
        </div>
        <div className="ah-subtitle">
          {loading ? 'Cargando…' : `${total} test${total === 1 ? '' : 's'} registrado${total === 1 ? '' : 's'}`}
        </div>
      </div>

      {/* Search */}
      <div className="dp-search">
        <span className="dp-search-icon">
          <Icon name="search" size={18} />
        </span>
        <input
          type="search"
          className="dp-search-input"
          placeholder="Buscar por paciente…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="ph-section">
        {error && (
          <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
            <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
          </div>
        )}

        {!error && loading && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Cargando tests de fuerza…</p>
          </div>
        )}

        {!error && !loading && filtered.length === 0 && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              {q ? `Sin resultados para "${q}".` : 'Todavía no hay tests de fuerza registrados.'}
            </p>
          </div>
        )}

        {!error && !loading && filtered.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {filtered.map((row, i) => {
              const expanded = expandedIdx === i
              const lifts = extractLifts(row.test)
              // Headline = the heaviest few lifts by estimated 1RM, shown in the row.
              const headline = [...lifts]
                .sort((a, b) => (b.rm ?? 0) - (a.rm ?? 0))
                .slice(0, 3)
              return (
                <div key={`${row.test.id}-${i}`} style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}>
                  <button
                    type="button"
                    className="dp-patient-row"
                    onClick={() => setExpandedIdx(expanded ? null : i)}
                    style={{
                      width: '100%', background: 'transparent', border: 0,
                      padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                    aria-expanded={expanded}
                  >
                    <Avatar name={row.user} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ph-link-name">{row.user || '—'}</div>
                      <div className="ph-link-meta">
                        {fmtDate(row.test.fecha)}
                        {row.test.peso_corporal != null && ` · BW ${fmtKg(row.test.peso_corporal)}`}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex', gap: 6, marginRight: 8,
                        flexWrap: 'wrap', justifyContent: 'flex-end',
                      }}
                    >
                      {headline.length === 0 ? (
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>sin lifts</span>
                      ) : (
                        headline.map((l) => (
                          <span
                            key={l.key}
                            className="chip"
                            style={{ fontSize: 11, padding: '3px 8px', borderColor: 'var(--line)' }}
                          >
                            <span style={{ color: 'var(--text-3)' }}>{liftLabel(l.key)} </span>
                            <span style={{ color: 'var(--omega)', fontWeight: 600 }}>{fmtKg(l.rm ?? l.peso)}</span>
                          </span>
                        ))
                      )}
                    </div>
                    <div
                      className="dp-chev"
                      style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)' }}
                    >
                      <Icon name="chevR" size={16} />
                    </div>
                  </button>

                  {expanded && (
                    <div className="dp-actions" style={{ paddingTop: 6 }}>
                      <div style={{ padding: '4px 14px 12px' }}>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 8 }}>
                          DETALLE DEL TEST
                        </div>
                        {lifts.length === 0 ? (
                          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                            Este test no tiene lifts detallados.
                          </p>
                        ) : (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                              <tr>
                                {['Ejercicio', 'Peso', 'Reps', '1RM est.'].map((h, hi) => (
                                  <th
                                    key={h}
                                    style={{
                                      textAlign: hi === 0 ? 'left' : 'right',
                                      padding: '4px 8px',
                                      color: 'var(--text-3)',
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: 10,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em',
                                      borderBottom: '1px solid var(--line)',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {lifts.map((l) => (
                                <tr key={l.key} style={{ borderBottom: '1px solid var(--line)' }}>
                                  <td style={{ padding: '6px 8px', color: 'var(--text-1)' }}>{liftLabel(l.key)}</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
                                    {fmtKg(l.peso)}
                                  </td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
                                    {l.reps ?? '—'}
                                  </td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--omega)', fontWeight: 600 }}>
                                    {fmtKg(l.rm)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
