import { Avatar } from './atoms'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatToday(): string {
  const d = new Date()
  return `${DAYS[d.getDay()]} · ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

// Extract first name from "Apellido, Nombre Otronombre" or "Nombre Apellido".
function firstNameOf(full: string): string {
  if (!full) return 'usuario'
  const trimmed = full.trim()
  if (trimmed.includes(',')) return trimmed.split(',')[1].trim().split(/\s+/)[0]
  return trimmed.split(/\s+/)[0]
}

interface Props {
  userName: string
  onAvatarTap?: () => void
}

/**
 * Mobile-only page header: date label + "Hola, <Name>" greeting + avatar
 * with role/logout sheet trigger. Hidden via CSS on tablet/desktop where the
 * Topbar provides the same affordances.
 */
export function MobilePageHeader({ userName, onAvatarTap }: Props) {
  return (
    <header className="ph-header">
      <div className="ph-header-text">
        <div className="mono ph-date">{formatToday()}</div>
        <div className="ph-hello">
          Hola, <em>{firstNameOf(userName)}</em>
        </div>
      </div>
      <button
        className="ph-avatar"
        type="button"
        aria-label="Abrir menú de usuario"
        onClick={onAvatarTap}
      >
        <Avatar name={userName} size={42} />
      </button>
    </header>
  )
}
