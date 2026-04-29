import { useEffect, useState, type ReactNode } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Login } from './screens/Login'
import { Placeholder } from './screens/Placeholder'
import { PatientHome } from './screens/PatientHome'
import { authService } from './services/authService'
import { tokenStore } from './services/apiClient'
import { backendRoleToUIRole, type AuthUser, type Role } from './types/api'

const DEFAULT_SCREEN: Record<Role, string> = {
  patient: 'p-home',
  doctor: 'd-home',
  nutritionist: 'd-home',
  trainer: 'd-home',
  admin: 'a-home',
}

interface ScreenDef {
  node: ReactNode
  crumbs: string[]
}

function resolveScreen(screen: string, role: Role, userName: string): ScreenDef {
  switch (screen) {
    case 'p-home':
      return { node: <PatientHome userName={userName} />, crumbs: ['Omega Medicina', 'Inicio'] }
    case 'p-progress':
      return { node: <Placeholder title="Progreso" hint="Tendencias y composición corporal" />, crumbs: ['Omega Medicina', 'Progreso'] }
    case 'p-appointments':
      return { node: <Placeholder title="Consultas" hint="Tus citas programadas" />, crumbs: ['Omega Medicina', 'Consultas'] }
    case 'p-training':
      return { node: <Placeholder title="Entrenamiento" hint="Tu plan activo y registros" />, crumbs: ['Omega Medicina', 'Entrenamiento'] }
    case 'p-nutrition':
      return { node: <Placeholder title="Nutrición" hint="Plan alimentario" />, crumbs: ['Omega Medicina', 'Nutrición'] }
    case 'p-medicine':
      return { node: <Placeholder title="Medicina" hint="Historial clínico" />, crumbs: ['Omega Medicina', 'Medicina'] }
    case 'd-home':
      return { node: <Placeholder title="Panel" hint={role === 'nutritionist' ? 'Panel nutrición' : role === 'trainer' ? 'Panel entreno' : 'Panel clínico'} />, crumbs: ['Omega Medicina', 'Panel'] }
    case 'd-patients':
      return { node: <Placeholder title={role === 'trainer' ? 'Atletas' : 'Pacientes'} />, crumbs: ['Omega Medicina', role === 'trainer' ? 'Atletas' : 'Pacientes'] }
    case 'd-agenda':
      return { node: <Placeholder title="Agenda" />, crumbs: ['Omega Medicina', 'Agenda'] }
    case 'd-files':
      return { node: <Placeholder title="Archivos" />, crumbs: ['Omega Medicina', 'Archivos'] }
    case 'd-templates':
      return { node: <Placeholder title="Plantillas" />, crumbs: ['Omega Medicina', 'Plantillas'] }
    case 'a-home':
      return { node: <Placeholder title="Sistema" />, crumbs: ['Omega Medicina', 'Sistema'] }
    case 'a-users':
      return { node: <Placeholder title="Usuarios" />, crumbs: ['Omega Medicina', 'Usuarios'] }
    case 'a-audit':
      return { node: <Placeholder title="Auditoría" />, crumbs: ['Omega Medicina', 'Auditoría'] }
    case 'a-db':
      return { node: <Placeholder title="Base de datos" />, crumbs: ['Omega Medicina', 'Base de datos'] }
    default:
      return { node: <Placeholder title="Sección no encontrada" />, crumbs: ['Omega Medicina'] }
  }
}

function userRole(u: AuthUser): Role {
  return backendRoleToUIRole(u.rol, u.is_admin)
}

function userDisplayName(u: AuthUser): string {
  return u.nombre_apellido?.trim() || u.email
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [role, setRole] = useState<Role>('patient')
  const [screen, setScreen] = useState<string>('p-home')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const token = tokenStore.get()
    if (!token) {
      setBootstrapping(false)
      return
    }
    authService.me()
      .then((u) => {
        const r = userRole(u)
        setUser(u)
        setRole(r)
        setScreen(DEFAULT_SCREEN[r])
      })
      .catch(() => {
        tokenStore.clear()
      })
      .finally(() => setBootstrapping(false))
  }, [])

  if (bootstrapping) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-2)', fontSize: 13 }}>
        Cargando…
      </div>
    )
  }

  if (!user) {
    return (
      <Login
        onLogin={(u) => {
          const r = userRole(u)
          setUser(u)
          setRole(r)
          setScreen(DEFAULT_SCREEN[r])
        }}
      />
    )
  }

  const userName = userDisplayName(user)
  const def = resolveScreen(screen, role, userName)

  return (
    <div className={'app' + (collapsed ? ' collapsed' : '')}>
      <Sidebar role={role} screen={screen} setScreen={setScreen} userName={userName} />
      <Topbar
        crumbs={def.crumbs}
        role={role}
        setRole={(r) => { setRole(r); setScreen(DEFAULT_SCREEN[r]) }}
        toggleCollapsed={() => setCollapsed(!collapsed)}
        onLogout={async () => {
          await authService.logout()
          setUser(null)
        }}
      />
      <main className="main">{def.node}</main>
    </div>
  )
}
