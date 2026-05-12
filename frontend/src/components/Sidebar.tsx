import { Icon } from './Icon'
import type { IconName } from './Icon'
import { RoleColors, RoleLabels, initialsOf } from './atoms'
import type { Role } from '../types/api'

interface NavItem { id: string; label: string; icon: IconName }
interface NavGroup { title: string; items: NavItem[] }

const NAV: Record<Role, NavGroup[]> = {
  patient: [
    { title: 'General', items: [
      { id: 'p-home', label: 'Inicio', icon: 'home' },
      { id: 'p-progress', label: 'Progreso', icon: 'chart' },
      { id: 'p-appointments', label: 'Consultas', icon: 'calendar' },
    ]},
    { title: 'Módulos', items: [
      { id: 'p-training', label: 'Entrenamiento', icon: 'dumbbell' },
      { id: 'p-nutrition', label: 'Nutrición', icon: 'apple' },
      { id: 'p-medicine', label: 'Medicina', icon: 'heart' },
    ]},
  ],
  doctor: [
    { title: 'Clínica', items: [
      { id: 'd-home', label: 'Panel', icon: 'home' },
      { id: 'd-patients', label: 'Pacientes', icon: 'users' },
      { id: 'd-agenda', label: 'Agenda', icon: 'calendar' },
    ]},
    { title: 'Contenido', items: [
      { id: 'd-files', label: 'Archivos', icon: 'file' },
      { id: 'd-templates', label: 'Plantillas', icon: 'film' },
    ]},
  ],
  nutritionist: [
    { title: 'Clínica', items: [
      { id: 'd-home', label: 'Panel', icon: 'home' },
      { id: 'd-patients', label: 'Pacientes', icon: 'users' },
      { id: 'd-agenda', label: 'Agenda', icon: 'calendar' },
    ]},
    { title: 'Nutrición', items: [
      { id: 'd-files', label: 'Plan builder', icon: 'apple' },
      { id: 'd-templates', label: 'Recetas', icon: 'film' },
    ]},
  ],
  trainer: [
    { title: 'Entreno', items: [
      { id: 'd-home', label: 'Panel', icon: 'home' },
      { id: 'd-patients', label: 'Atletas', icon: 'users' },
      { id: 'd-agenda', label: 'Agenda', icon: 'calendar' },
    ]},
    { title: 'Contenido', items: [
      { id: 'd-files', label: 'Rutinas', icon: 'dumbbell' },
      { id: 'd-templates', label: 'Ejercicios', icon: 'film' },
    ]},
  ],
  admin: [
    { title: 'Sistema', items: [
      { id: 'a-home', label: 'Panel', icon: 'home' },
      { id: 'a-pending', label: 'Pendientes', icon: 'user' },
      { id: 'a-users', label: 'Usuarios', icon: 'users' },
      { id: 'a-audit', label: 'Auditoría', icon: 'shield' },
      { id: 'a-db', label: 'Base de datos', icon: 'db' },
    ]},
  ],
}

interface SidebarProps {
  role: Role
  screen: string
  setScreen: (s: string) => void
  userName: string
}

const initialsFor: Record<Role, string> = {
  patient: 'JM', doctor: 'DR', nutritionist: 'NU', trainer: 'TR', admin: 'AD',
}

// Mobile bottom-tab-bar — flat list with short labels, matches mockup PATIENT_TABS/ADMIN_TABS
const MOBILE_TABS: Record<Role, NavItem[]> = {
  patient: [
    { id: 'p-home', label: 'Inicio', icon: 'dashboard' },
    { id: 'p-training', label: 'Entreno', icon: 'training' },
    { id: 'p-nutrition', label: 'Nutri', icon: 'nutrition' },
    { id: 'p-progress', label: 'Progreso', icon: 'data' },
    { id: 'p-medicine', label: 'Medicina', icon: 'medicine' },
  ],
  doctor: [
    { id: 'd-home', label: 'Inicio', icon: 'dashboard' },
    { id: 'd-patients', label: 'Pacientes', icon: 'user' },
    { id: 'd-agenda', label: 'Agenda', icon: 'calendar' },
    { id: 'd-files', label: 'Recursos', icon: 'file' },
  ],
  nutritionist: [
    { id: 'd-home', label: 'Inicio', icon: 'dashboard' },
    { id: 'd-patients', label: 'Pacientes', icon: 'user' },
    { id: 'd-agenda', label: 'Agenda', icon: 'calendar' },
    { id: 'd-files', label: 'Recetas', icon: 'nutrition' },
  ],
  trainer: [
    { id: 'd-home', label: 'Inicio', icon: 'dashboard' },
    { id: 'd-patients', label: 'Atletas', icon: 'user' },
    { id: 'd-agenda', label: 'Agenda', icon: 'calendar' },
    { id: 'd-files', label: 'Rutinas', icon: 'training' },
  ],
  admin: [
    { id: 'a-home', label: 'Panel', icon: 'dashboard' },
    { id: 'a-pending', label: 'Pendientes', icon: 'user' },
    { id: 'a-audit', label: 'Audit', icon: 'history' },
    { id: 'a-db', label: 'Datos', icon: 'data' },
  ],
}

export function Sidebar({ role, screen, setScreen, userName }: SidebarProps) {
  const safeRole: Role = role in NAV ? role : 'patient'
  const groups = (NAV as Record<string, NavGroup[]>)[safeRole]
  const mobileTabs = MOBILE_TABS[safeRole]
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <img src="/assets/logo-white.png" alt="Omega" />
        <div className="wordmark"><em>Omega</em> Medicina</div>
      </div>

      {/* Desktop / tablet: grouped sections */}
      <div className="sidebar-desktop-nav">
        {groups.map((g, gi) => (
          <div key={gi}>
            <div className="nav-section-title">{g.title}</div>
            <div className="nav">
              {g.items.map((it) => (
                <button
                  key={it.id}
                  className={screen === it.id ? 'active' : ''}
                  onClick={() => setScreen(it.id)}
                >
                  <Icon name={it.icon} size={16} />
                  <span>{it.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: flat tab bar with short labels (mockup PATIENT_TABS/ADMIN_TABS) */}
      <div className="nav sidebar-mobile-nav">
        {mobileTabs.map((it) => (
          <button
            key={it.id}
            className={screen === it.id ? 'active' : ''}
            onClick={() => setScreen(it.id)}
          >
            <Icon name={it.icon} size={22} />
            <span>{it.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-foot" onClick={() => setScreen('settings')}>
        <div className="avatar" style={{ background: RoleColors[safeRole].bg }}>
          {initialsOf(userName) || initialsFor[safeRole]}
        </div>
        <div className="info">
          <div className="n">{userName}</div>
          <div className="r">{RoleLabels[safeRole]}</div>
        </div>
        <Icon name="settings" size={14} />
      </div>
    </aside>
  )
}

export { NAV, MOBILE_TABS }
