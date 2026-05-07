import { useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { authService } from '../services/authService'
import { ApiError } from '../services/apiClient'
import type { RegisterPayload } from '../types/api'

interface Props {
  onCancel: () => void
  onSuccess: () => void
  onRegistered?: (email: string) => void
}

type Sexo = 'M' | 'F'
type RoleId = 'patient' | 'nutritionist' | 'trainer' | 'doctor'

interface FormData {
  nombre: string
  email: string
  password: string
  fecha_nacimiento: string
  sexo: Sexo | ''
  telefono: string
  roles: RoleId[]
}

const ROLE_OPTIONS: { id: RoleId; label: string; sub: string; color: string }[] = [
  { id: 'patient', label: 'Paciente', sub: 'Quiero seguir mi plan y consultar a mis profesionales.', color: '#E23E4A' },
  { id: 'nutritionist', label: 'Nutricionista', sub: 'Acompaño y ajusto planes alimentarios de mis pacientes.', color: '#E8A93A' },
  { id: 'trainer', label: 'Entrenador', sub: 'Diseño y superviso planes de entrenamiento.', color: '#7D8CFF' },
  { id: 'doctor', label: 'Médico', sub: 'Doy seguimiento clínico y consultas a mis pacientes.', color: '#4FB8A8' },
]

const TOTAL_STEPS = 3

export function Register({ onCancel, onSuccess, onRegistered }: Props) {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<FormData>({
    nombre: '',
    email: '',
    password: '',
    fecha_nacimiento: '',
    sexo: '',
    telefono: '',
    roles: [],
  })

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((d) => ({ ...d, [key]: value }))
  }

  const toggleRole = (id: RoleId) => {
    setData((d) => ({
      ...d,
      roles: d.roles.includes(id) ? d.roles.filter((r) => r !== id) : [...d.roles, id],
    }))
  }

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!data.nombre.trim()) return 'Ingresá tu nombre completo.'
      if (!data.email.trim() || !/.+@.+\..+/.test(data.email)) return 'Email inválido.'
      if (data.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
    }
    if (s === 2) {
      if (!data.fecha_nacimiento) return 'Ingresá tu fecha de nacimiento.'
      if (!data.sexo) return 'Seleccioná el sexo.'
      try {
        const d = new Date(data.fecha_nacimiento + 'T00:00:00')
        if (isNaN(d.getTime())) return 'Fecha de nacimiento inválida.'
      } catch {
        return 'Fecha de nacimiento inválida.'
      }
    }
    if (s === 3) {
      if (data.roles.length === 0) return 'Seleccioná al menos un rol.'
    }
    return null
  }

  const goNext = (e?: FormEvent) => {
    e?.preventDefault()
    setError(null)
    const v = validateStep(step)
    if (v) {
      setError(v)
      return
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
    } else {
      submit()
    }
  }

  const goBack = () => {
    setError(null)
    if (step === 1) onCancel()
    else setStep(step - 1)
  }

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const payload: RegisterPayload = {
        nombre: data.nombre.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        sexo: data.sexo as Sexo,
        fecha_nacimiento: data.fecha_nacimiento,
        telefono: data.telefono.trim() || undefined,
        desired_roles: data.roles,
      }
      await authService.register(payload)
      onRegistered?.(payload.email)
      onSuccess()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No pudimos crear la cuenta.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="reg-screen">
      {/* Top bar with back chevron + step progress */}
      <div className="reg-top">
        <button
          type="button"
          className="reg-back"
          aria-label={step === 1 ? 'Cancelar' : 'Volver'}
          onClick={goBack}
        >
          <Icon name="chevL" size={22} />
        </button>
        <div className="reg-progress">
          <div className="mono">Paso {step} / {TOTAL_STEPS}</div>
          <div className="bar reg-progress-bar">
            <span style={{ width: `${(step / TOTAL_STEPS) * 100}%`, background: 'var(--omega)' }} />
          </div>
        </div>
      </div>

      <form onSubmit={goNext} className="reg-form">
        {step === 1 && (
          <div className="reg-step">
            <div className="display reg-step-title">
              <em>Creá</em> tu cuenta
            </div>
            <div className="reg-step-sub">Información básica para empezar.</div>

            <Field
              label="Nombre completo"
              type="text"
              value={data.nombre}
              onChange={(v) => set('nombre', v)}
              placeholder="Diego Alejandro Toffaletti"
              autoComplete="name"
              required
            />
            <Field
              label="Email"
              type="email"
              value={data.email}
              onChange={(v) => set('email', v)}
              placeholder="tu@correo.com"
              autoComplete="email"
              required
            />
            <Field
              label="Contraseña"
              type="password"
              value={data.password}
              onChange={(v) => set('password', v)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
            />
          </div>
        )}

        {step === 2 && (
          <div className="reg-step">
            <div className="display reg-step-title">
              <em>Datos</em> personales
            </div>
            <div className="reg-step-sub">
              Las medidas constitucionales y objetivos los carga tu profesional al vincularte.
            </div>

            <Field
              label="Teléfono (opcional)"
              type="tel"
              value={data.telefono}
              onChange={(v) => set('telefono', v)}
              placeholder="+54 11 0000 0000"
              autoComplete="tel"
            />
            <Field
              label="Fecha de nacimiento"
              type="date"
              value={data.fecha_nacimiento}
              onChange={(v) => set('fecha_nacimiento', v)}
              required
            />

            <div className="reg-field">
              <label className="reg-field-label">Sexo</label>
              <div className="reg-sexo-row">
                {(['M', 'F'] as const).map((s) => {
                  const active = data.sexo === s
                  return (
                    <button
                      key={s}
                      type="button"
                      className={'reg-sexo-btn' + (active ? ' is-active' : '')}
                      onClick={() => set('sexo', s)}
                      aria-pressed={active}
                    >
                      {s === 'M' ? 'Masculino' : 'Femenino'}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="reg-warning">
              <span className="reg-warning-tag">Importante</span>
              Tu cuenta quedará en estado <b>pendiente de verificación</b>. Un administrador la activará tras confirmar tu email y los datos.
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="reg-step">
            <div className="display reg-step-title">
              <em>¿Qué</em> rol te describe?
            </div>
            <div className="reg-step-sub">
              Podés seleccionar más de uno. Por ejemplo, médico y nutricionista a la vez.
            </div>

            <div className="reg-roles">
              {ROLE_OPTIONS.map((r) => {
                const active = data.roles.includes(r.id)
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={'reg-role-card' + (active ? ' is-active' : '')}
                    style={
                      active
                        ? { borderColor: r.color, background: r.color + '1a' }
                        : undefined
                    }
                    onClick={() => toggleRole(r.id)}
                    aria-pressed={active}
                  >
                    <div
                      className="reg-role-ic"
                      style={{ background: r.color + '22', color: r.color }}
                    >
                      <Icon
                        name={
                          r.id === 'patient' ? 'heart'
                          : r.id === 'nutritionist' ? 'nutrition'
                          : r.id === 'trainer' ? 'training'
                          : 'medicine'
                        }
                        size={16}
                      />
                    </div>
                    <div className="reg-role-text">
                      <div className="reg-role-label">{r.label}</div>
                      <div className="reg-role-sub">{r.sub}</div>
                    </div>
                    <div
                      className={'reg-role-check' + (active ? ' is-active' : '')}
                      style={active ? { background: r.color, borderColor: r.color } : undefined}
                    >
                      {active && <Icon name="check" size={12} />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {error && <div className="reg-error">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary btn-full reg-submit"
          disabled={submitting}
        >
          {submitting
            ? 'Creando…'
            : step < TOTAL_STEPS
              ? 'Continuar'
              : 'Crear cuenta'}
          <Icon name="chevR" size={16} />
        </button>

        <div className="reg-fineprint">
          Al continuar aceptás los <span className="reg-link">Términos</span> y la{' '}
          <span className="reg-link">Política de privacidad</span>.
        </div>

        <div className="reg-back-to-login">
          ¿Ya tenés cuenta?{' '}
          <button type="button" className="reg-link-btn" onClick={onCancel}>
            Iniciar sesión
          </button>
        </div>
      </form>
    </div>
  )
}

interface FieldProps {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
}

function Field({ label, type, value, onChange, placeholder, autoComplete, required }: FieldProps) {
  return (
    <div className="reg-field">
      <label className="reg-field-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="reg-field-input"
      />
    </div>
  )
}
