import type { ReactNode } from 'react'
import type { Role } from '../types/api'

export const RoleLabels: Record<Role, string> = {
  patient: 'Paciente',
  doctor: 'Médico',
  nutritionist: 'Nutricionista',
  trainer: 'Entrenador',
  admin: 'Administrador',
}

export const RoleColors: Record<Role, { bg: string; txt: string }> = {
  patient: { bg: 'linear-gradient(135deg, #E23E4A, #7a1a22)', txt: '#fff' },
  doctor: { bg: 'linear-gradient(135deg, #4FB8A8, #1c5a52)', txt: '#fff' },
  nutritionist: { bg: 'linear-gradient(135deg, #E8A93A, #7a5a14)', txt: '#fff' },
  trainer: { bg: 'linear-gradient(135deg, #7D8CFF, #2a3180)', txt: '#fff' },
  admin: { bg: 'linear-gradient(135deg, #C9C3BA, #6b6860)', txt: '#1a1a1a' },
}

interface KPIProps {
  k: string
  v: string
  delta?: string
  dir?: 'up' | 'down'
  mod?: string
}

export function KPI({ k, v, delta, dir, mod }: KPIProps) {
  return (
    <div className="kpi" data-mod={mod}>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      {delta && (
        <div className={`d ${dir || ''}`}>
          {dir === 'up' ? '▲' : dir === 'down' ? '▼' : '•'} {delta}
        </div>
      )}
    </div>
  )
}

interface AvatarProps {
  name: string
  color?: string
  size?: number
}

// Returns "DT" for "Toffaletti, Diego Alejandro" or "Diego Toffaletti".
// Falls back to a single initial when the name has only one word.
export function initialsOf(name: string): string {
  if (!name) return ''
  const trimmed = name.trim()
  if (trimmed.includes(',')) {
    const [last, first] = trimmed.split(',').map((s) => s.trim())
    const fi = first?.charAt(0) ?? ''
    const li = last?.charAt(0) ?? ''
    return (fi + li).toUpperCase()
  }
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (parts[0]?.charAt(0) ?? '').toUpperCase()
}

export function Avatar({ name, color, size = 30 }: AvatarProps) {
  const initials = initialsOf(name)
  return (
    <span
      className="av"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: color || RoleColors.patient.bg,
      }}
    >
      {initials}
    </span>
  )
}

interface ChipProps {
  children: ReactNode
  variant?: string
}

export function Chip({ children, variant }: ChipProps) {
  return <span className={`chip ${variant || ''}`}>{children}</span>
}

interface ProgressProps {
  value: number
  color?: string
}

export function Progress({ value, color = 'var(--omega)' }: ProgressProps) {
  return (
    <div className="bar">
      <span style={{ width: value + '%', background: color }} />
    </div>
  )
}
