import { useState } from 'react'
import { Icon } from '../components/Icon'
import type { Role } from '../types/api'

interface SelectRoleProps {
  userName: string
  availableRoles: Role[]
  onSelect: (role: Role, remember: boolean) => void
  onLogout?: () => void
}

interface RoleMeta {
  label: string
  description: string
  icon: 'heart' | 'medicine' | 'apple' | 'dumbbell' | 'shield'
  /** Solid accent color (also drives icon stroke). */
  color: string
  /** Soft / translucent backdrop for the icon chip. */
  soft: string
}

const ROLE_META: Record<Role, RoleMeta> = {
  patient: {
    label: 'Paciente',
    description: 'Tu plan, check-ins, progreso y consultas.',
    icon: 'heart',
    color: 'var(--analytic)',
    soft: 'var(--analytic-soft)',
  },
  doctor: {
    label: 'Médico',
    description: 'Panel clínico de pacientes asignados.',
    icon: 'medicine',
    color: 'var(--medic)',
    soft: 'var(--medic-soft)',
  },
  nutritionist: {
    label: 'Nutricionista',
    description: 'Planes alimentarios y seguimiento nutricional.',
    icon: 'apple',
    color: 'var(--nutri)',
    soft: 'var(--nutri-soft)',
  },
  trainer: {
    label: 'Entrenador',
    description: 'Atletas asignados y matrices de entrenamiento.',
    icon: 'dumbbell',
    color: 'var(--omega)',
    soft: 'var(--omega-soft)',
  },
  admin: {
    label: 'Administrador',
    description: 'Aprobaciones, usuarios, auditoría y base de datos.',
    icon: 'shield',
    color: 'var(--admin)',
    soft: 'rgba(201,195,186,0.14)',
  },
}

export function SelectRole({ userName, availableRoles, onSelect, onLogout }: SelectRoleProps) {
  const [remember, setRemember] = useState(false)
  const [hoveredRole, setHoveredRole] = useState<Role | null>(null)

  const handlePick = (role: Role) => onSelect(role, remember)

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
          maxWidth: 560,
          background: 'var(--bg-1)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: '32px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <img src="/assets/logo-white.png" alt="Omega" style={{ width: 28, height: 24 }} />
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
            <em style={{ fontFamily: 'var(--font-serif)', color: 'var(--omega)', fontSize: 18 }}>Omega</em> Medicina
          </div>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 4 }}>
          <em style={{ fontFamily: 'var(--font-serif)', color: 'var(--omega)', fontSize: 26 }}>Hola</em> {userName}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 22 }}>
          Tenés más de un rol activo. ¿Con cuál querés entrar ahora?
        </p>

        <div className="role-grid" style={{ marginBottom: 18 }}>
          {availableRoles.map((r) => {
            const meta = ROLE_META[r]
            const isHover = hoveredRole === r
            return (
              <button
                key={r}
                type="button"
                className="role-card"
                onClick={() => handlePick(r)}
                onMouseEnter={() => setHoveredRole(r)}
                onMouseLeave={() => setHoveredRole(null)}
                style={{
                  font: 'inherit',
                  color: 'var(--text-1)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  borderColor: isHover ? meta.color : undefined,
                  borderLeft: `3px solid ${meta.color}`,
                  background: isHover ? meta.soft : undefined,
                  transition: 'all 0.15s',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: meta.soft,
                    color: meta.color,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name={meta.icon} size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: meta.color }}>{meta.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
                    {meta.description}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--text-2)',
            cursor: 'pointer',
            paddingTop: 16,
            borderTop: '1px solid var(--line)',
          }}
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>
            Recordar mi elección en este dispositivo
            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-2)', marginTop: 2, opacity: 0.8 }}>
              Podés cambiar de rol desde el menú una vez adentro.
            </span>
          </span>
        </label>

        {onLogout && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              type="button"
              onClick={onLogout}
              style={{
                background: 'transparent',
                border: 0,
                color: 'var(--text-2)',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: 12,
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
