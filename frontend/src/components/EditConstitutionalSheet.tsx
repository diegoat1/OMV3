import { useState } from 'react'
import { Icon } from './Icon'
import { userService } from '../services/userService'
import { ApiError } from '../services/apiClient'
import type { StaticProfile, UpdateUserPayload } from '../types/api'

interface Props {
  profile: StaticProfile
  onClose: () => void
  onSaved: () => void
}

function num(v: string): number | null {
  const n = parseFloat(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function EditConstitutionalSheet({ profile, onClose, onSaved }: Props) {
  const [sexo, setSexo] = useState<'M' | 'F' | ''>(profile.sexo || '')
  const [fechaNac, setFechaNac] = useState(profile.fecha_nacimiento || '')
  const [altura, setAltura] = useState(profile.altura?.toString() || '')
  const [envergadura, setEnvergadura] = useState(profile.envergadura?.toString() || '')
  const [circCuello, setCircCuello] = useState(profile.circ_cuello?.toString() || '')
  const [circMuneca, setCircMuneca] = useState(profile.circ_muneca?.toString() || '')
  const [circTobillo, setCircTobillo] = useState(profile.circ_tobillo?.toString() || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sexo cannot be unset once stored — backend rule (Fix 16).
  const sexoLocked = !!profile.sexo
  const cuelloLocked = !!profile.circ_cuello

  const submit = async () => {
    setError(null)
    if (!sexo) return setError('Sexo es requerido.')

    const payload: UpdateUserPayload = {}
    if (!sexoLocked) payload.sexo = sexo as 'M' | 'F'
    if (fechaNac && fechaNac !== profile.fecha_nacimiento) payload.fecha_nacimiento = fechaNac

    const aN = num(altura)
    if (aN !== profile.altura) payload.altura = aN
    const eN = num(envergadura)
    if (eN !== profile.envergadura) payload.envergadura = eN
    const ccN = num(circCuello)
    if (!cuelloLocked && ccN !== profile.circ_cuello) payload.circ_cuello = ccN
    const cmN = num(circMuneca)
    if (cmN !== profile.circ_muneca) payload.circ_muneca = cmN
    const ctN = num(circTobillo)
    if (ctN !== profile.circ_tobillo) payload.circ_tobillo = ctN

    if (Object.keys(payload).length === 0) {
      onClose()
      return
    }

    setSubmitting(true)
    try {
      await userService.update(profile.user_id, payload)
      onSaved()
    } catch (e) {
      if (e instanceof ApiError) {
        // Backend returns details.fields[] for validation errors
        const details = (e as unknown as { details?: { fields?: Record<string, string> } }).details
        if (details?.fields) {
          setError(Object.entries(details.fields).map(([k, v]) => `${k}: ${v}`).join(' · '))
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
            <div className="adm-sheet-name">Datos constitucionales</div>
            <div className="adm-sheet-meta">{profile.nombre}</div>
          </div>
          <button type="button" className="adm-sheet-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="sheet-section-label">Identidad</div>
        <div className="adm-field">
          <label className="adm-field-label">Sexo {sexoLocked && '(bloqueado)'}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['M', 'F'] as const).map((s) => {
              const active = sexo === s
              return (
                <button
                  key={s}
                  type="button"
                  className={'reg-sexo-btn' + (active ? ' is-active' : '')}
                  onClick={() => !sexoLocked && setSexo(s)}
                  disabled={sexoLocked}
                  style={{ flex: 1, opacity: sexoLocked && !active ? 0.4 : 1 }}
                >
                  {s === 'M' ? 'Masculino' : 'Femenino'}
                </button>
              )
            })}
          </div>
        </div>
        <div className="adm-field">
          <label className="adm-field-label">Fecha de nacimiento</label>
          <input
            type="date"
            value={fechaNac || ''}
            onChange={(e) => setFechaNac(e.target.value)}
            className="adm-input"
          />
        </div>

        <div className="sheet-section-label">Medidas estructurales (cm)</div>
        <div className="adm-field-row">
          <div className="adm-field" style={{ flex: 1 }}>
            <label className="adm-field-label">Altura</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min={50}
              max={250}
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="170"
              className="adm-input"
            />
          </div>
          <div className="adm-field" style={{ flex: 1 }}>
            <label className="adm-field-label">Envergadura</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min={50}
              max={250}
              value={envergadura}
              onChange={(e) => setEnvergadura(e.target.value)}
              placeholder="172"
              className="adm-input"
            />
          </div>
        </div>

        <div className="sheet-section-label">Circunferencias óseas</div>
        <div className="adm-field-row">
          <div className="adm-field" style={{ flex: 1 }}>
            <label className="adm-field-label">Cuello {cuelloLocked && '🔒'}</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min={20}
              max={80}
              value={circCuello}
              onChange={(e) => setCircCuello(e.target.value)}
              placeholder="38"
              className="adm-input"
              disabled={cuelloLocked}
            />
          </div>
          <div className="adm-field" style={{ flex: 1 }}>
            <label className="adm-field-label">Muñeca</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min={10}
              max={30}
              value={circMuneca}
              onChange={(e) => setCircMuneca(e.target.value)}
              placeholder="17"
              className="adm-input"
            />
          </div>
          <div className="adm-field" style={{ flex: 1 }}>
            <label className="adm-field-label">Tobillo</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min={15}
              max={40}
              value={circTobillo}
              onChange={(e) => setCircTobillo(e.target.value)}
              placeholder="22"
              className="adm-input"
            />
          </div>
        </div>

        {error && <div className="adm-error">{error}</div>}

        <button
          type="button"
          className="btn btn-primary btn-full adm-submit"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </>
  )
}
