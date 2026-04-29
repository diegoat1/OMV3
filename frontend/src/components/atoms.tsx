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

export function Avatar({ name, color, size = 30 }: AvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
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
