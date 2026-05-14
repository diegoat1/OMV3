import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { nutritionService } from '../services/nutritionService'
import { ApiError } from '../services/apiClient'

interface Props {
  onClose: () => void
  onSaved?: () => void
}

const GROUPS: { key: string; label: string; hint?: string }[] = [
  { key: 'lacteos', label: 'Lácteos', hint: 'Leche, yogur, queso' },
  { key: 'carnes_rojas', label: 'Carnes rojas', hint: 'Vaca, cerdo, cordero' },
  { key: 'aves', label: 'Aves', hint: 'Pollo, pavo' },
  { key: 'pescados', label: 'Pescados / mariscos' },
  { key: 'huevos', label: 'Huevos' },
  { key: 'legumbres', label: 'Legumbres', hint: 'Lentejas, garbanzos, porotos' },
  { key: 'cereales_integrales', label: 'Cereales integrales', hint: 'Avena, arroz integral' },
  { key: 'cereales_refinados', label: 'Cereales refinados', hint: 'Pan blanco, fideos, arroz blanco' },
  { key: 'frutas', label: 'Frutas' },
  { key: 'verduras', label: 'Verduras' },
  { key: 'grasas_buenas', label: 'Grasas buenas', hint: 'Palta, frutos secos, aceite oliva' },
  { key: 'azucares', label: 'Azúcares / dulces' },
  { key: 'ultraprocesados', label: 'Ultraprocesados', hint: 'Snacks, embutidos, golosinas' },
  { key: 'alcohol', label: 'Alcohol' },
  { key: 'agua', label: 'Agua (vasos/día)' },
]

export function DietSurveySheet({ onClose, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [notas, setNotas] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    nutritionService.getDietSurveys({ limit: 1 })
      .then((r) => {
        const last = r.surveys[0]
        if (last) {
          const init: Record<string, string> = {}
          for (const [k, v] of Object.entries(last.groups || {})) {
            const p = (v as { porciones_semana?: number })?.porciones_semana
            if (p != null) init[k] = String(p)
          }
          setValues(init)
          if (last.notas) setNotas(last.notas)
        }
      })
      .catch(() => { /* first-fill or no auth — silent */ })
  }, [])

  const submit = async () => {
    setError(null); setOk(false)
    const groups: Record<string, { porciones_semana: number }> = {}
    for (const [k, v] of Object.entries(values)) {
      const n = Number(v)
      if (Number.isFinite(n) && n >= 0) groups[k] = { porciones_semana: n }
    }
    if (Object.keys(groups).length === 0) {
      setError('Ingresá al menos un grupo con valor numérico.')
      return
    }
    setSubmitting(true)
    try {
      await nutritionService.submitDietSurvey({ groups, notas: notas.trim() || undefined })
      setOk(true)
      setTimeout(() => { onSaved?.(); onClose() }, 700)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos guardar.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet adm-sheet" role="dialog" aria-label="Encuesta dietética">
        <div className="sheet-handle" />
        <div className="adm-sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="adm-sheet-name">Hábitos alimentarios — semanal</div>
            <div className="adm-sheet-meta">
              Indicá cuántas porciones por semana consumís de cada grupo.
            </div>
          </div>
          <button type="button" className="adm-sheet-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>

        {GROUPS.map((g) => (
          <div key={g.key} className="adm-field" style={{ marginBottom: 8 }}>
            <label className="adm-field-label">
              {g.label}
              {g.hint && (
                <span style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 6 }}>
                  · {g.hint}
                </span>
              )}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={0.5}
              value={values[g.key] ?? ''}
              onChange={(e) => setValues((p) => ({ ...p, [g.key]: e.target.value }))}
              placeholder="porciones / semana"
              className="adm-input"
            />
          </div>
        ))}

        <div className="adm-field">
          <label className="adm-field-label">Notas (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            className="adm-input"
            placeholder="Alergias, intolerancias, preferencias, restricciones…"
          />
        </div>

        {error && <div className="adm-error">{error}</div>}
        {ok && (
          <div className="adm-error" style={{ background: 'rgba(60,200,140,0.08)', color: 'var(--ok)', borderColor: 'rgba(60,200,140,0.3)' }}>
            ✓ Encuesta guardada.
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary btn-full adm-submit"
          onClick={submit}
          disabled={submitting || ok}
        >
          <Icon name="check" size={14} />
          {submitting ? ' Guardando…' : ok ? ' ✓ Guardada' : ' Guardar encuesta'}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-full"
          onClick={onClose}
          disabled={submitting}
          style={{ marginTop: 8 }}
        >
          Cancelar
        </button>
      </div>
    </>
  )
}
