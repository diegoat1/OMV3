import { Icon } from './Icon'
import { RoleColors, RoleLabels } from './atoms'
import type { Role } from '../types/api'

interface Props {
  open: boolean
  onClose: () => void
  role: Role
  setRole: (r: Role) => void
  availableRoles: Role[]
  onLogout: () => void
  userName: string
}

export function UserMenuSheet({
  open,
  onClose,
  role,
  setRole,
  availableRoles,
  onLogout,
  userName,
}: Props) {
  if (!open) return null
  // Hide the role list entirely when there's only one approved role —
  // showing a one-item "switcher" is misleading.
  const showRoleList = availableRoles.length > 1
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">{userName}</div>

        {showRoleList && (
          <>
            <div className="sheet-section-label">Cambiar de rol</div>
            <div className="sheet-list">
              {availableRoles.map((r) => (
                <button
                  key={r}
                  className={'sheet-row' + (r === role ? ' is-active' : '')}
                  onClick={() => { setRole(r); onClose() }}
                >
                  <span className="sheet-row-av" style={{ background: RoleColors[r].bg, color: RoleColors[r].txt }}>
                    {RoleLabels[r][0]}
                  </span>
                  <span className="sheet-row-label">{RoleLabels[r]}</span>
                  {r === role && <Icon name="check" size={16} />}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="sheet-section-label">Sesión</div>
        <div className="sheet-list">
          <button
            className="sheet-row"
            onClick={() => { onClose(); onLogout() }}
          >
            <span className="sheet-row-av" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <Icon name="logout" size={14} />
            </span>
            <span className="sheet-row-label">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </>
  )
}
