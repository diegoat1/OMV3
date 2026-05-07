import { useState } from 'react'
import { Icon } from './Icon'
import { measurementService } from '../services/measurementService'
import { ApiError } from '../services/apiClient'
import type { NewMeasurementPayload, StaticProfile } from '../types/api'

interface Props {
  profile: StaticProfile
  onClose: () => void
  onSaved: () => void
}

function num(v: string): number | null {
  const n = parseFloat(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function NewMeasurementSheet({ profile, onClose, onSaved }: Props) {
  const [fecha, setFecha] = useState(todayIso())
  const [peso, setPeso] = useState('')
  const [circAbdomen, setCircAbdomen] = useState('')
  const [circCintura, setCircCintura] = useState('')
  const [circCadera, setCircCadera] = useState('')
  const [showOptional, setShowOptional] = useState(false)
  const [circHombro, setCircHombro] = useState('')
  const [circPecho, setCircPecho] = useState('')
  const [circBrazo, setCircBrazo] = useState('')
  const [circAntebrazo, setCircAntebrazo] = useState('')
  const [circMuslo, setCircMuslo] = useState('')
  const [circPantorrilla, setCircPantorrilla] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFemale = profile.sexo === 'F'

  const submit = async () => {
    setError(null)
    const pesoN = num(peso)
    if (!pesoN) return setError('Peso es requerido.')
    const abdomenN = num(circAbdomen)
    if (!abdomenN) return setError('Circunferencia abdominal es requerida (necesaria para Navy).')

    if (isFemale) {
      const cinturaN = num(circCintura)
      const caderaN = num(circCadera)
      if (!cinturaN || !caderaN) {
        return setError('En mujeres, cintura y cadera también son requeridas para Navy.')
      }
    }

    const payload: NewMeasurementPayload = {
      peso: pesoN,
      circ_abdomen: abdomenN,
      fecha_registro: fecha,
    }
    const cinturaN = num(circCintura); if (cinturaN) payload.circ_cintura = cinturaN
    const caderaN = num(circCadera); if (caderaN) payload.circ_cadera = caderaN
    const hombroN = num(circHombro); if (hombroN) payload.circ_hombro = hombroN
    const pechoN = num(circPecho); if (pechoN) payload.circ_pecho = pechoN
    const brazoN = num(circBrazo); if (brazoN) payload.circ_brazo = brazoN
    const antebrazoN = num(circAntebrazo); if (antebrazoN) payload.circ_antebrazo = antebrazoN
    const musloN = num(circMuslo); if (musloN) payload.circ_muslo = musloN
    const pantorrillaN = num(circPantorrilla); if (pantorrillaN) payload.circ_pantorrilla = pantorrillaN

    setSubmitting(true)
    try {
      await measurementService.create(profile.user_id, payload)
      onSaved()
    } catch (e) {
      if (e instanceof ApiError) {
        const details = (e as unknown as { details?: { fields?: Record<string, string>; navy?: string[] } }).details
        if (details?.fields) {
          setError(Object.entries(details.fields).map(([k, v]) => `${k}: ${v}`).join(' · '))
        } else if (details?.navy) {
          setError(`Navy: ${details.navy.join(' · ')}`)
        } else {
          setError(e.message)
        }
      } else {
        setError('No pudimos guardar.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet adm-sheet">
        <div className="sheet-handle" />
        <div className="adm-sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="adm-sheet-name">Nueva medición</div>
            <div className="adm-sheet-meta">{profile.nombre}</div>
          </div>
          <button type="button" className="adm-sheet-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="adm-field">
          <label className="adm-field-label">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="adm-input"
          />
        </div>

        <div className="adm-field">
          <label className="adm-field-label">Peso (kg) *</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={20}
            max={300}
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            placeholder="65.0"
            className="adm-input"
            autoFocus
          />
        </div>

        <div className="sheet-section-label">
          Necesarias para Navy {isFemale ? '(M: abdomen / F: abdomen + cintura + cadera)' : '(abdomen)'}
        </div>
        <div className="adm-field">
          <label className="adm-field-label">Circ. abdomen (cm) *</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={40}
            max={200}
            value={circAbdomen}
            onChange={(e) => setCircAbdomen(e.target.value)}
            placeholder="82"
            className="adm-input"
          />
        </div>
        <div className="adm-field-row">
          <div className="adm-field" style={{ flex: 1 }}>
            <label className="adm-field-label">Cintura {isFemale && '*'}</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min={40}
              max={180}
              value={circCintura}
              onChange={(e) => setCircCintura(e.target.value)}
              placeholder="—"
              className="adm-input"
            />
          </div>
          <div className="adm-field" style={{ flex: 1 }}>
            <label className="adm-field-label">Cadera {isFemale && '*'}</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min={50}
              max={200}
              value={circCadera}
              onChange={(e) => setCircCadera(e.target.value)}
              placeholder="—"
              className="adm-input"
            />
          </div>
        </div>

        <button
          type="button"
          className="adm-toggle"
          onClick={() => setShowOptional((v) => !v)}
          style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', marginTop: 8, marginBottom: 8 }}
        >
          <Icon name={showOptional ? 'chevD' : 'chevR'} size={14} />
          Otras medidas (opcionales)
        </button>
        {showOptional && (
          <>
            <div className="adm-field-row">
              <div className="adm-field" style={{ flex: 1 }}>
                <label className="adm-field-label">Hombro</label>
                <input type="number" inputMode="decimal" step="0.1" value={circHombro}
                  onChange={(e) => setCircHombro(e.target.value)} className="adm-input" placeholder="—" />
              </div>
              <div className="adm-field" style={{ flex: 1 }}>
                <label className="adm-field-label">Pecho</label>
                <input type="number" inputMode="decimal" step="0.1" value={circPecho}
                  onChange={(e) => setCircPecho(e.target.value)} className="adm-input" placeholder="—" />
              </div>
            </div>
            <div className="adm-field-row">
              <div className="adm-field" style={{ flex: 1 }}>
                <label className="adm-field-label">Brazo</label>
                <input type="number" inputMode="decimal" step="0.1" value={circBrazo}
                  onChange={(e) => setCircBrazo(e.target.value)} className="adm-input" placeholder="—" />
              </div>
              <div className="adm-field" style={{ flex: 1 }}>
                <label className="adm-field-label">Antebrazo</label>
                <input type="number" inputMode="decimal" step="0.1" value={circAntebrazo}
                  onChange={(e) => setCircAntebrazo(e.target.value)} className="adm-input" placeholder="—" />
              </div>
            </div>
            <div className="adm-field-row">
              <div className="adm-field" style={{ flex: 1 }}>
                <label className="adm-field-label">Muslo</label>
                <input type="number" inputMode="decimal" step="0.1" value={circMuslo}
                  onChange={(e) => setCircMuslo(e.target.value)} className="adm-input" placeholder="—" />
              </div>
              <div className="adm-field" style={{ flex: 1 }}>
                <label className="adm-field-label">Pantorrilla</label>
                <input type="number" inputMode="decimal" step="0.1" value={circPantorrilla}
                  onChange={(e) => setCircPantorrilla(e.target.value)} className="adm-input" placeholder="—" />
              </div>
            </div>
          </>
        )}

        {error && <div className="adm-error">{error}</div>}

        <button
          type="button"
          className="btn btn-primary btn-full adm-submit"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? 'Guardando…' : 'Registrar medición'}
        </button>
      </div>
    </>
  )
}
