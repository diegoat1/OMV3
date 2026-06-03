import { useState } from 'react'
import { Icon } from './Icon'
import { RoleColors, RoleLabels } from './atoms'
import type { Role } from '../types/api'

interface TopbarProps {
  crumbs: string[]
  role: Role
  setRole: (r: Role) => void
  availableRoles: Role[]
  toggleCollapsed: () => void
  onLogout: () => void
}

export function Topbar({ crumbs, role, setRole, availableRoles, toggleCollapsed, onLogout }: TopbarProps) {
  return (
    <header className="topbar">
      <button className="icon-btn" onClick={toggleCollapsed} title="Colapsar panel">
        <Icon name="menu" size={16} />
      </button>
      <div className="crumb">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <span className="sep">/</span>}
            <span style={{ color: i === crumbs.length - 1 ? 'var(--text-1)' : 'var(--text-2)' }}>{c}</span>
          </span>
        ))}
      </div>
      <div className="search">
        <span className="ic"><Icon name="search" size={14} /></span>
        <input placeholder="Buscar pacientes, consultas, archivos…" />
      </div>
      <div className="actions">
        <button className="icon-btn" title="Notificaciones"><Icon name="bell" size={16} /></button>
        <div style={{ width: 1, height: 22, background: 'var(--line)', margin: '0 4px' }} />
        <RoleSwitcher role={role} setRole={setRole} availableRoles={availableRoles} />
        <button className="icon-btn" onClick={onLogout} title="Cerrar sesión">
          <Icon name="logout" size={16} />
        </button>
      </div>
    </header>
  )
}

function RoleSwitcher({
  role,
  setRole,
  availableRoles = [],
}: {
  role: Role
  setRole: (r: Role) => void
  availableRoles: Role[]
}) {
  const [open, setOpen] = useState(false)
  const safeRole: Role = role in RoleColors ? role : 'patient'
  // Users with only one approved role have nothing to switch to — render a
  // static badge instead of a dropdown so the affordance matches the
  // permission.
  const isStatic = availableRoles.length <= 1
  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-ghost"
        style={{
          height: 34, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 6,
          cursor: isStatic ? 'default' : 'pointer',
        }}
        onClick={() => { if (!isStatic) setOpen(!open) }}
        aria-haspopup={!isStatic}
        aria-expanded={open}
      >
        <span
          className="av"
          style={{ width: 20, height: 20, fontSize: 10, background: RoleColors[safeRole].bg }}
        >
          {RoleLabels[safeRole][0]}
        </span>
        <span style={{ fontSize: 12 }}>{RoleLabels[safeRole]}</span>
        {!isStatic && <Icon name="chevD" size={12} />}
      </button>
      {open && !isStatic && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
          <div
            style={{
              position: 'absolute', right: 0, top: 40, width: 220,
              background: 'var(--bg-2)', border: '1px solid var(--line-strong)',
              borderRadius: 12, padding: 6, zIndex: 70,
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div className="mono" style={{ padding: '8px 10px 4px' }}>Cambiar de rol</div>
            {availableRoles.map((r) => {
              const colors = RoleColors[r] ?? RoleColors.patient
              const label = RoleLabels[r] ?? r
              return (
              <button
                key={r}
                onClick={() => { setRole(r); setOpen(false) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px',
                  background: r === role ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: 0, color: 'var(--text-1)', cursor: 'pointer',
                  borderRadius: 6, fontSize: 13, textAlign: 'left',
                }}
              >
                <span
                  className="av"
                  style={{
                    width: 24, height: 24, fontSize: 10,
                    background: colors.bg, color: colors.txt,
                  }}
                >
                  {label[0]}
                </span>
                <span style={{ flex: 1 }}>{label}</span>
                {r === role && <Icon name="check" size={14} />}
              </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
