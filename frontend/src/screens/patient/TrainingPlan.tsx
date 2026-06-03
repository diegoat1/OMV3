import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Avatar } from '../../components/atoms'
import { trainingService } from '../../services/trainingService'
import { ApiError } from '../../services/apiClient'
import type { TodayExercise, TodaySession } from '../../types/api'
import { ActiveTrainingSession } from './ActiveTrainingSession'
import { MuscleRecoveryCard } from '../../components/MuscleRecoveryCard'
import { ExerciseAlternativesSheet } from '../../components/ExerciseAlternativesSheet'

interface Props {
  userName?: string
}

function exerciseLabel(ex: TodayExercise): string {
  const raw = ex.ejercicio || ex.exercise_key || ''
  if (!raw) return 'Ejercicio'
  // Pretty-print snake_case
  return raw
    .split('_')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function exerciseDescriptor(ex: TodayExercise): string {
  const parts: string[] = []
  if (ex.prescription) parts.push(String(ex.prescription))
  if (ex.current_weight != null) parts.push(`${ex.current_weight} kg`)
  if (ex.current_level) parts.push(`nivel ${ex.current_level}`)
  if (ex.is_test) parts.push('TEST')
  if (parts.length === 0 && ex.sets && Array.isArray(ex.sets)) {
    parts.push(`${ex.sets.length} series`)
  }
  return parts.join(' · ')
}

export function TrainingPlan({ userName = '' }: Props) {
  const [session, setSession] = useState<TodaySession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [activeMode, setActiveMode] = useState(false)
  const [altFor, setAltFor] = useState<TodayExercise | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await trainingService.getTodaySession()
      setSession(r.today)
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 404)) {
        setSession(null)
      } else {
        setError(e instanceof ApiError ? e.message : 'Error cargando entrenamiento')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const handleRegisterSession = async () => {
    if (!session) return
    if (!confirm('¿Registrar la sesión de hoy como completada?')) return
    setRegistering(true)
    setError(null)
    try {
      // /sessions/complete marks the session done AND advances progression in
      // a single round-trip. This replaces the legacy two-step pattern
      // (createSession + advanceDay).
      const res = await trainingService.completeSession({
        ejercicios: session.ejercicios.map((ex) => ({
          exercise_key: ex.exercise_key,
          ejercicio: ex.ejercicio || ex.exercise_key,
          completed: true,
        })),
        advance_day: true,
      })
      const nextDay = res.current_day
      const advanced = res.advanced !== false
      setInfo(advanced && nextDay != null
        ? `Sesión registrada. Próximo día: ${nextDay}.`
        : 'Sesión registrada.')
      reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos registrar la sesión.')
    } finally {
      setRegistering(false)
    }
  }

  const handleSkipDay = async () => {
    if (!session) return
    if (!confirm('¿Saltar este día sin registrar la sesión?')) return
    setRegistering(true)
    setError(null)
    try {
      const res = await trainingService.advanceDay()
      setInfo(`Día saltado. Próximo día: ${res.current_day}.`)
      reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos avanzar el día.')
    } finally {
      setRegistering(false)
    }
  }

  if (activeMode && session) {
    return (
      <ActiveTrainingSession
        session={session}
        onClose={() => setActiveMode(false)}
        onCompleted={() => {
          setActiveMode(false)
          setInfo('Sesión registrada. ¡Bien hecho!')
          reload()
        }}
      />
    )
  }

  return (
    <div className="tp-screen" data-mod="training">
      <div className="tp-toprow">
        <div className="tp-myplan">
          <Avatar name={userName} color="var(--omega)" size={28} />
          <span className="tp-myplan-label">Mi Plan</span>
          <Icon name="chevR" size={14} />
        </div>
        <div className="module-pill">Entrenamiento</div>
      </div>

      {/* "Siguiente" hero card */}
      <div className="card tp-next-card">
        <div className="tp-next-glow" aria-hidden="true" />
        <div className="row-between">
          <div>
            <div className="display tp-next-title">
              <em>{session?.already_done ? 'Hecho' : 'Hoy'}</em>
            </div>
            <div className="tp-next-sub">
              {loading
                ? 'Cargando…'
                : session
                  ? `${session.plan_nombre} · Día ${session.dia_actual} / ${session.total_dias}`
                  : 'Sin plan activo'}
            </div>
          </div>
        </div>
        <div className="tp-chips">
          {session ? (
            <>
              <div className="chip">{session.ejercicios?.length ?? 0} ejercicios</div>
              {session.cycle_week ? <div className="chip">Sem {session.cycle_week}</div> : null}
            </>
          ) : (
            <>
              <div className="chip">— min</div>
              <div className="chip">Sin gym</div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{error}</p>
        </div>
      )}
      {info && (
        <div className="card" style={{ borderColor: 'rgba(111,207,111,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--ok)', margin: 0 }}>{info}</p>
        </div>
      )}

      {/* Exercises list */}
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Ejercicios</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>
            {session?.ejercicios?.length ?? 0} ejercicio{(session?.ejercicios?.length ?? 0) === 1 ? '' : 's'}
          </div>
        </div>
        {loading && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Cargando…</p>
          </div>
        )}
        {!loading && !session && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              Tu plan de entrenamiento aparecerá acá cuando tu profesional lo asigne.
            </p>
          </div>
        )}
        {!loading && session && (session.ejercicios?.length ?? 0) === 0 && (
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              Día de descanso · sin ejercicios programados para hoy.
            </p>
          </div>
        )}
        {!loading && session && (session.ejercicios?.length ?? 0) > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {session.ejercicios?.map((ex, i) => {
              const descriptor = exerciseDescriptor(ex)
              return (
                <div
                  key={`${ex.exercise_key}-${i}`}
                  className="ph-link-row"
                  style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
                >
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: 'rgba(226,62,74,0.18)', color: 'var(--omega)',
                      display: 'grid', placeItems: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ph-link-name">{exerciseLabel(ex)}</div>
                    {descriptor && (
                      <div className="ph-link-meta">{descriptor}</div>
                    )}
                  </div>
                  {ex.is_test && (
                    <span
                      className="mono"
                      style={{
                        fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
                        background: 'rgba(232,169,58,0.12)', color: 'var(--warn)',
                        padding: '2px 8px', borderRadius: 100,
                        border: '1px solid rgba(232,169,58,0.3)',
                      }}
                    >
                      test
                    </span>
                  )}
                  <button
                    type="button"
                    className="ph-link-btn"
                    onClick={() => setAltFor(ex)}
                    aria-label="Ver ejercicios alternativos"
                    title="Cambiar ejercicio"
                    style={{ color: 'var(--text-3)' }}
                  >
                    <Icon name="history" size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recuperación muscular (Fitbod) — P3 */}
      <MuscleRecoveryCard />

      {/* Action: start active session OR quick-register */}
      {!loading && session && (session.ejercicios?.length ?? 0) > 0 && !session.already_done && (
        <>
          <button
            type="button"
            className="btn btn-full"
            onClick={() => setActiveMode(true)}
            style={{
              background: 'var(--omega)', color: '#fff', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Icon name="play" size={14} /> Iniciar entrenamiento
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-full"
            onClick={handleRegisterSession}
            disabled={registering}
            style={{ marginTop: 8 }}
          >
            {registering ? 'Registrando…' : 'Registrar como completada (sin detalle)'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-full"
            onClick={handleSkipDay}
            disabled={registering}
            style={{ marginTop: 8 }}
          >
            Saltar día sin registrar
          </button>
        </>
      )}
      {session?.already_done && (
        <div className="card" style={{ borderColor: 'rgba(111,207,111,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--ok)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="check" size={14} /> Sesión de hoy registrada.
          </p>
        </div>
      )}

      {/* Tu progreso — stats grid (still placeholders, history endpoint exists
          but is out of scope for this slice; wire in slice 7). */}
      <div className="ph-section">
        <div className="section-label">Tu progreso</div>
        <div className="tp-stats-grid">
          <div className="stat">
            <div className="k">Racha</div>
            <div className="v">—</div>
            <div className="d">semanas</div>
          </div>
          <div className="stat">
            <div className="k">Sesiones</div>
            <div className="v">—</div>
            <div className="d">totales</div>
          </div>
          <div className="stat">
            <div className="k">Volumen</div>
            <div className="v">—</div>
            <div className="d">esta semana</div>
          </div>
        </div>
      </div>

      {altFor && (
        <ExerciseAlternativesSheet
          exerciseKey={altFor.exercise_key || altFor.ejercicio || ''}
          exerciseName={exerciseLabel(altFor)}
          onClose={() => setAltFor(null)}
        />
      )}
    </div>
  )
}
