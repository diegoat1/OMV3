import { useEffect, useState } from 'react'
import { trainingService } from '../services/trainingService'
import type { MuscleRecovery } from '../types/api'

/** Etiquetas en español para las claves de músculo del catálogo de ejercicios. */
const MUSCLE_LABEL: Record<string, string> = {
  quads: 'Cuádriceps', glutes: 'Glúteos', hamstrings: 'Isquiotibiales',
  lowerBack: 'Lumbares', core: 'Core', hipAdductors: 'Aductores',
  upperBack: 'Espalda alta', traps: 'Trapecios', pecs: 'Pectorales',
  triceps: 'Tríceps', biceps: 'Bíceps', frontDelts: 'Deltoides ant.',
  sideDelts: 'Deltoides lat.', rearDelts: 'Deltoides post.', forearms: 'Antebrazos',
  calves: 'Gemelos', abs: 'Abdominales', lats: 'Dorsales', neck: 'Cuello',
}

function label(m: string): string {
  return MUSCLE_LABEL[m] || m
}

function statusColor(status: MuscleRecovery['status']): string {
  if (status === 'fresh') return 'var(--ok)'
  if (status === 'recovering') return 'var(--warn)'
  return 'var(--omega)'
}

interface Props {
  /** Profesional viendo a un paciente; el paciente lo omite (self). */
  patient?: string
}

/** Indicador de recuperación muscular por grupo (concepto Fitbod
 *  `muscleUsageToRecoveryPercentage`), computado del historial de sesiones. */
export function MuscleRecoveryCard({ patient }: Props = {}) {
  const [muscles, setMuscles] = useState<MuscleRecovery[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    trainingService.getMuscleRecovery({ patient })
      .then((r) => { if (alive) setMuscles(r.muscles) })
      .catch(() => { if (alive) setMuscles([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [patient])

  return (
    <div className="ph-section">
      <div className="row-between" style={{ marginBottom: 10 }}>
        <div className="section-label">Recuperación muscular</div>
        {muscles && muscles.length > 0 && (
          <div className="mono" style={{ color: 'var(--text-3)', fontSize: 11 }}>
            {muscles.filter((m) => m.status !== 'fresh').length} en recuperación
          </div>
        )}
      </div>
      {loading ? (
        <div className="card"><p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Cargando…</p></div>
      ) : !muscles || muscles.length === 0 ? (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Sin entrenamientos recientes — todos los grupos frescos. 💪
          </p>
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {muscles.map((m) => (
            <div key={m.muscle}>
              <div className="row-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--text-1)' }}>{label(m.muscle)}</span>
                <span className="mono" style={{ fontSize: 11, color: statusColor(m.status) }}>
                  {m.recovery_pct}%{m.days_ago != null ? ` · ${m.days_ago}d` : ''}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 100, background: 'var(--bg-3)', overflow: 'hidden' }}>
                <div style={{ width: `${m.recovery_pct}%`, height: '100%', background: statusColor(m.status), transition: 'width .3s' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
