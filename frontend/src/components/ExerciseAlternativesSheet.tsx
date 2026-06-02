import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { trainingService } from '../services/trainingService'
import { ApiError } from '../services/apiClient'
import type { ExerciseAlternative } from '../types/api'

interface Props {
  exerciseKey: string
  exerciseName: string
  /** Profesional viendo a un paciente (no usado para alternativas, que son globales). */
  onClose: () => void
}

function muscleList(json?: string): string {
  if (!json) return ''
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? arr.join(', ') : ''
  } catch {
    return ''
  }
}

/** "Exercise replacement" estilo Fitbod: muestra ejercicios que trabajan los
 *  mismos músculos primarios. Informativo — para cambiarlo en el plan, el
 *  profesional ajusta la prescripción. */
export function ExerciseAlternativesSheet({ exerciseKey, exerciseName, onClose }: Props) {
  const [alts, setAlts] = useState<ExerciseAlternative[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    trainingService.getExerciseAlternatives(exerciseKey)
      .then((r) => { if (alive) setAlts(r.alternatives) })
      .catch((e) => { if (alive) setError(e instanceof ApiError ? e.message : 'Error cargando alternativas') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [exerciseKey])

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet adm-sheet" role="dialog" aria-label={`Alternativas · ${exerciseName}`} data-mod="training">
        <div className="sheet-handle" />
        <div className="adm-sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="adm-sheet-name">Cambiar ejercicio</div>
            <div className="adm-sheet-meta">{exerciseName} · mismos músculos</div>
          </div>
          <button type="button" className="adm-sheet-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 10px' }}>
          Ejercicios que trabajan los mismos grupos musculares. Para reemplazarlo
          en tu plan, coordiná con tu profesional.
        </p>

        {loading && <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Cargando…</p>}
        {error && <div className="adm-error">{error}</div>}
        {!loading && !error && (!alts || alts.length === 0) && (
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Sin alternativas equivalentes en el catálogo.</p>
        )}
        {!loading && !error && alts && alts.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            {alts.map((a, i) => (
              <div
                key={a.key}
                className="ph-link-row"
                style={{ borderTop: i === 0 ? 0 : '1px solid var(--line)' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ph-link-name">{a.name_es || a.key}</div>
                  <div className="ph-link-meta">
                    {muscleList(a.muscle_groups)}
                    {a.equipment ? ` · ${a.equipment}` : ''}
                    {a.is_compound ? ' · compuesto' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
