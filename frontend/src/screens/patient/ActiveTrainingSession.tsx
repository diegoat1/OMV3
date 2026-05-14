import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { trainingService } from '../../services/trainingService'
import { ApiError } from '../../services/apiClient'
import type { TodayExercise, TodaySession } from '../../types/api'

interface Props {
  session: TodaySession
  onClose: () => void
  onCompleted: () => void
}

interface ExerciseLog {
  done: boolean
  reps: string
  peso: string
  rir: string
  test_reps: string
}

function defaultLog(ex: TodayExercise): ExerciseLog {
  return {
    done: false,
    reps: '',
    peso: ex.current_weight != null ? String(ex.current_weight) : '',
    rir: '',
    test_reps: '',
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function exerciseLabel(ex: TodayExercise): string {
  const raw = ex.ejercicio || ex.exercise_key || ''
  if (!raw) return 'Ejercicio'
  return raw.split('_').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ')
}

const REST_DEFAULTS = [60, 90, 120, 180] as const

/** Live training session — timer + per-exercise reps/peso/rir log, then
 *  POST /training/sessions/complete. Mimics the legacy `entrenamiento_actual.html`
 *  flow but with a single shared rest timer for simplicity. */
export function ActiveTrainingSession({ session, onClose, onCompleted }: Props) {
  const [logs, setLogs] = useState<Record<string, ExerciseLog>>(() => {
    const init: Record<string, ExerciseLog> = {}
    session.ejercicios.forEach((ex) => { init[ex.exercise_key] = defaultLog(ex) })
    return init
  })

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerTarget, setTimerTarget] = useState(90)
  const [timerRunning, setTimerRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<AudioContext | null>(null)

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!timerRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setTimerSeconds((s) => {
        if (s + 1 >= timerTarget) {
          // Time's up — short beep via WebAudio.
          try {
            if (!audioRef.current) audioRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
            const ctx = audioRef.current
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain); gain.connect(ctx.destination)
            osc.frequency.value = 880
            gain.gain.setValueAtTime(0.001, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
            osc.start()
            osc.stop(ctx.currentTime + 0.4)
          } catch { /* audio not available */ }
          setTimerRunning(false)
          return timerTarget
        }
        return s + 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerRunning, timerTarget])

  const startTimer = useCallback((target: number) => {
    setTimerTarget(target)
    setTimerSeconds(0)
    setTimerRunning(true)
  }, [])

  const resetTimer = useCallback(() => {
    setTimerRunning(false)
    setTimerSeconds(0)
  }, [])

  const adjustTimer = useCallback((deltaSec: number) => {
    setTimerTarget((t) => Math.max(15, Math.min(600, t + deltaSec)))
  }, [])

  const update = (key: string, patch: Partial<ExerciseLog>) => {
    setLogs((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  const toggleDone = (key: string) => {
    const next = !logs[key].done
    update(key, { done: next })
    if (next) startTimer(timerTarget)
  }

  const allDone = session.ejercicios.length > 0 && session.ejercicios.every((ex) => logs[ex.exercise_key]?.done)
  const someDone = session.ejercicios.some((ex) => logs[ex.exercise_key]?.done)

  const submit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        advance_day: true,
        ejercicios: session.ejercicios.map((ex) => {
          const log = logs[ex.exercise_key] || defaultLog(ex)
          const out: {
            exercise_key?: string
            ejercicio?: string
            completed: boolean
            test_reps?: number
            weight_increment?: number
          } = {
            exercise_key: ex.exercise_key,
            ejercicio: ex.ejercicio || ex.exercise_key,
            completed: log.done,
          }
          if (ex.is_test && log.test_reps) {
            out.test_reps = Number(log.test_reps)
          }
          // If user typed a weight different from current_weight, send the delta.
          if (log.peso && ex.current_weight != null) {
            const delta = Number(log.peso) - ex.current_weight
            if (Number.isFinite(delta) && Math.abs(delta) >= 0.5) {
              out.weight_increment = delta
            }
          }
          return out
        }),
      }
      await trainingService.completeSession(payload)
      onCompleted()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos cerrar la sesión.')
      setSubmitting(false)
    }
  }

  return (
    <div className="checkin" data-mod="training" style={{ paddingBottom: 24 }}>
      <div className="checkin-top">
        <button type="button" className="checkin-close" aria-label="Cerrar" onClick={onClose}>
          <Icon name="x" size={22} />
        </button>
        <div className="mono">Sesión activa</div>
        <div className="checkin-top-spacer" />
      </div>

      <div className="checkin-hero">
        <div className="display checkin-title">
          <em>{session.plan_nombre || 'Sesión'}</em>
        </div>
        <div className="checkin-sub">
          Día {session.dia_actual}/{session.total_dias}
          {session.cycle_week ? ` · Sem ${session.cycle_week}` : ''}
        </div>
      </div>

      {/* Shared rest timer */}
      <div className="card" style={{ padding: 14, textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.16em', marginBottom: 6 }}>
          DESCANSO
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 48,
            fontWeight: 600,
            color: timerSeconds >= timerTarget ? 'var(--ok)' : 'var(--omega)',
            lineHeight: 1,
            margin: '4px 0 10px',
          }}
        >
          {formatTime(Math.max(0, timerTarget - timerSeconds))}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          {REST_DEFAULTS.map((s) => (
            <button
              key={s}
              type="button"
              className={'chip dp-chip' + (timerTarget === s ? ' is-active' : '')}
              onClick={() => { setTimerTarget(s); setTimerSeconds(0); setTimerRunning(true) }}
            >{s}s</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center' }}>
          <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px' }} onClick={() => adjustTimer(-15)}>-15s</button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '6px 14px' }}
            onClick={() => setTimerRunning((r) => !r)}
          >
            {timerRunning ? 'Pausar' : 'Iniciar'}
          </button>
          <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px' }} onClick={() => adjustTimer(15)}>+15s</button>
          <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px' }} onClick={resetTimer}>↺</button>
        </div>
      </div>

      {/* Exercises */}
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Ejercicios</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>
            {session.ejercicios.filter((ex) => logs[ex.exercise_key]?.done).length}/{session.ejercicios.length}
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {session.ejercicios.map((ex, i) => {
            const log = logs[ex.exercise_key] || defaultLog(ex)
            return (
              <div
                key={ex.exercise_key + '-' + i}
                style={{
                  borderTop: i === 0 ? 0 : '1px solid var(--line)',
                  padding: 12,
                  background: log.done ? 'rgba(60,200,140,0.05)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => toggleDone(ex.exercise_key)}
                    aria-label={log.done ? 'Marcar como pendiente' : 'Marcar como hecho'}
                    style={{
                      width: 28, height: 28, borderRadius: 10,
                      background: log.done ? 'var(--ok)' : 'transparent',
                      border: log.done ? 0 : '2px solid var(--line-strong)',
                      color: '#0a1a0a',
                      display: 'grid', placeItems: 'center', cursor: 'pointer',
                    }}
                  >
                    {log.done && <Icon name="check" size={16} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ph-link-name">{exerciseLabel(ex)}</div>
                    <div className="ph-link-meta">
                      {ex.prescription || (ex.current_level ? `nivel ${ex.current_level}` : 'sin prescripción')}
                      {ex.current_weight != null ? ` · ${ex.current_weight} kg sugerido` : ''}
                    </div>
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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: ex.is_test ? '1fr 1fr 1fr' : '1fr 1fr 1fr', gap: 6 }}>
                  <div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--text-3)', marginBottom: 2 }}>REPS</div>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={log.reps}
                      onChange={(e) => update(ex.exercise_key, { reps: e.target.value })}
                      className="adm-input"
                      style={{ padding: '6px 8px', fontSize: 13, textAlign: 'center' }}
                    />
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--text-3)', marginBottom: 2 }}>PESO (kg)</div>
                    <input
                      type="number"
                      inputMode="decimal"
                      step={0.5}
                      value={log.peso}
                      onChange={(e) => update(ex.exercise_key, { peso: e.target.value })}
                      className="adm-input"
                      style={{ padding: '6px 8px', fontSize: 13, textAlign: 'center' }}
                    />
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--text-3)', marginBottom: 2 }}>
                      {ex.is_test ? 'REPS TEST' : 'RIR'}
                    </div>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={ex.is_test ? log.test_reps : log.rir}
                      onChange={(e) => update(ex.exercise_key, ex.is_test ? { test_reps: e.target.value } : { rir: e.target.value })}
                      className="adm-input"
                      style={{ padding: '6px 8px', fontSize: 13, textAlign: 'center' }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="adm-error" style={{ marginTop: 8 }}>{error}</div>
      )}

      <button
        type="button"
        className="btn btn-full"
        onClick={submit}
        disabled={submitting || !someDone}
        style={{
          marginTop: 16,
          background: allDone ? 'var(--ok)' : 'var(--omega)',
          color: '#fff', fontWeight: 600,
        }}
      >
        <Icon name="check" size={14} />
        {submitting ? ' Cerrando…' : allDone ? ' ✓ Terminar sesión' : ' Terminar parcial'}
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-full"
        onClick={onClose}
        disabled={submitting}
        style={{ marginTop: 8 }}
      >
        Volver al plan sin registrar
      </button>
    </div>
  )
}
