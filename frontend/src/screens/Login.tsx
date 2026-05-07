import { useState, type FormEvent } from 'react'
import { authService } from '../services/authService'
import { ApiError } from '../services/apiClient'
import type { AuthUser } from '../types/api'

interface LoginProps {
  onLogin: (user: AuthUser) => void
  onCreateAccount?: () => void
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await authService.login(email, password)
      onLogin(user)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No pudimos iniciar sesión.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--bg-1)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: '32px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <img src="/assets/logo-white.png" alt="Omega" style={{ width: 28, height: 24 }} />
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
            <em style={{ fontFamily: 'var(--font-serif)', color: 'var(--omega)', fontSize: 18 }}>Omega</em> Medicina
          </div>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 4 }}>
          <em style={{ fontFamily: 'var(--font-serif)', color: 'var(--omega)', fontSize: 26 }}>Bienvenido</em>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>
          Iniciá sesión para acceder a tu panel
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="tu@correo.com"
            autoComplete="email"
            required
          />
          <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          {error && (
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--omega-soft)',
                border: '1px solid rgba(226,62,74,0.3)',
                borderRadius: 8,
                color: 'var(--omega)',
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 8, justifyContent: 'center', height: 40, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
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
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="mono" style={{ margin: 0 }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        style={{
          padding: '10px 12px',
          background: 'var(--bg-0)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          color: 'var(--text-1)',
          fontSize: 14,
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />
    </label>
  )
}
