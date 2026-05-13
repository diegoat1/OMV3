import { useEffect, useState, type ReactNode } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { UserMenuSheet } from './components/UserMenuSheet'
import { MobilePageHeader } from './components/MobilePageHeader'
import { Login } from './screens/Login'
import { Register } from './screens/Register'
import { RegisterSuccess } from './screens/RegisterSuccess'
import { Placeholder } from './screens/Placeholder'
import { PatientHome } from './screens/PatientHome'
import { CheckIn } from './screens/patient/CheckIn'
import { Appointments } from './screens/patient/Appointments'
import { BrowseSpecialists } from './screens/patient/BrowseSpecialists'
import { TrainingPlan } from './screens/patient/TrainingPlan'
import { Nutrition } from './screens/patient/Nutrition'
import { Progress as PatientProgress } from './screens/patient/Progress'
import { AdminHome } from './screens/AdminHome'
import { AdminAudit } from './screens/admin/AdminAudit'
import { AdminPending } from './screens/admin/AdminPending'
import { DoctorHome } from './screens/doctor/DoctorHome'
import { DoctorPatients } from './screens/doctor/DoctorPatients'
import { DoctorPatientDetail } from './screens/doctor/DoctorPatientDetail'
import { authService } from './services/authService'
import { tokenStore } from './services/apiClient'
import { availableUIRoles, backendRoleToUIRole, type AuthUser, type Role } from './types/api'

const DEFAULT_SCREEN: Record<Role, string> = {
  patient: 'p-home',
  doctor: 'd-home',
  nutritionist: 'd-home',
  trainer: 'd-home',
  admin: 'a-home',
}

// Screens that present as a modal sub-window — they hide the global mobile
// page header (date + greeting + avatar) and render their own top bar.
const FOCUSED_SCREENS = new Set<string>(['p-checkin', 'd-patient-detail', 'p-browse-specialists'])

interface ScreenDef {
  node: ReactNode
  crumbs: string[]
}

function resolveScreen(
  screen: string,
  role: Role,
  userName: string,
  userId: string | null,
  setScreen: (s: string) => void,
  selectedPatientId: number | null,
  setSelectedPatientId: (id: number | null) => void,
): ScreenDef {
  switch (screen) {
    case 'p-home':
      return {
        node: (
          <PatientHome
            userName={userName}
            userId={userId}
            onCheckIn={() => setScreen('p-checkin')}
            onBrowseSpecialists={() => setScreen('p-browse-specialists')}
          />
        ),
        crumbs: ['Omega Medicina', 'Inicio'],
      }
    case 'p-checkin':
      return { node: <CheckIn onClose={() => setScreen('p-home')} />, crumbs: ['Omega Medicina', 'Inicio', 'Check-in'] }
    case 'p-browse-specialists':
      return { node: <BrowseSpecialists onClose={() => setScreen('p-home')} />, crumbs: ['Omega Medicina', 'Inicio', 'Buscar profesional'] }
    case 'p-progress':
      return { node: <PatientProgress />, crumbs: ['Omega Medicina', 'Progreso'] }
    case 'p-appointments':
      return { node: <Appointments />, crumbs: ['Omega Medicina', 'Consultas'] }
    case 'p-training':
      return { node: <TrainingPlan userName={userName} />, crumbs: ['Omega Medicina', 'Entrenamiento'] }
    case 'p-nutrition':
      return { node: <Nutrition />, crumbs: ['Omega Medicina', 'Nutrición'] }
    case 'p-medicine':
      return { node: <Appointments />, crumbs: ['Omega Medicina', 'Medicina'] }
    case 'd-home':
      return { node: <DoctorHome role={role} />, crumbs: ['Omega Medicina', 'Panel'] }
    case 'd-patients':
      return {
        node: (
          <DoctorPatients
            role={role}
            onOpenPatient={(pid) => {
              setSelectedPatientId(pid)
              setScreen('d-patient-detail')
            }}
          />
        ),
        crumbs: ['Omega Medicina', role === 'trainer' ? 'Atletas' : 'Pacientes'],
      }
    case 'd-patient-detail':
      return {
        node: (
          <DoctorPatientDetail
            patientId={selectedPatientId}
            onClose={() => setScreen('d-patients')}
          />
        ),
        crumbs: ['Omega Medicina', 'Paciente'],
      }
    case 'd-agenda':
      return { node: <Placeholder title="Agenda" />, crumbs: ['Omega Medicina', 'Agenda'] }
    case 'd-files':
      return { node: <Placeholder title="Archivos" />, crumbs: ['Omega Medicina', 'Archivos'] }
    case 'd-templates':
      return { node: <Placeholder title="Plantillas" />, crumbs: ['Omega Medicina', 'Plantillas'] }
    case 'a-home':
      return {
        node: <AdminHome onOpenPending={() => setScreen('a-pending')} />,
        crumbs: ['Omega Medicina', 'Sistema'],
      }
    case 'a-pending':
      return { node: <AdminPending />, crumbs: ['Omega Medicina', 'Pendientes'] }
    case 'a-users':
      return { node: <Placeholder title="Usuarios" />, crumbs: ['Omega Medicina', 'Usuarios'] }
    case 'a-audit':
      return { node: <AdminAudit />, crumbs: ['Omega Medicina', 'Auditoría'] }
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
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  // Auth flow state when there's no logged-in user
  const [authScreen, setAuthScreen] = useState<'login' | 'register' | 'register-success'>('login')
  const [registeredEmail, setRegisteredEmail] = useState<string>('')
  // ID of the patient whose detail screen is open (set when navigating to
  // d-patient-detail). null while no patient is selected.
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)

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
    if (authScreen === 'register') {
      return (
        <Register
          onCancel={() => setAuthScreen('login')}
          onSuccess={() => setAuthScreen('register-success')}
          onRegistered={(email) => setRegisteredEmail(email)}
        />
      )
    }
    if (authScreen === 'register-success') {
      return (
        <RegisterSuccess
          email={registeredEmail}
          onBackToLogin={() => setAuthScreen('login')}
        />
      )
    }
    return (
      <Login
        onLogin={(u) => {
          const r = userRole(u)
          setUser(u)
          setRole(r)
          setScreen(DEFAULT_SCREEN[r])
        }}
        onCreateAccount={() => setAuthScreen('register')}
      />
    )
  }

  const userName = userDisplayName(user)
  const availableRoles = availableUIRoles(user)
  const handleLogout = async () => {
    await authService.logout()
    setUser(null)
  }
  const switchRole = (r: Role) => {
    if (!availableRoles.includes(r)) return
    setRole(r)
    setScreen(DEFAULT_SCREEN[r])
  }
  const def = resolveScreen(
    screen,
    role,
    userName,
    user.id ?? null,
    setScreen,
    selectedPatientId,
    setSelectedPatientId,
  )

  return (
    <div className={'app' + (collapsed ? ' collapsed' : '')}>
      <Sidebar role={role} screen={screen} setScreen={setScreen} userName={userName} />
      <Topbar
        crumbs={def.crumbs}
        role={role}
        setRole={switchRole}
        availableRoles={availableRoles}
        toggleCollapsed={() => setCollapsed(!collapsed)}
        onLogout={handleLogout}
      />
      <main className="main">
        {!FOCUSED_SCREENS.has(screen) && (
          <MobilePageHeader userName={userName} onAvatarTap={() => setUserMenuOpen(true)} />
        )}
        {def.node}
      </main>
      <UserMenuSheet
        open={userMenuOpen}
        onClose={() => setUserMenuOpen(false)}
        role={role}
        setRole={switchRole}
        availableRoles={availableRoles}
        onLogout={handleLogout}
        userName={userName}
      />
    </div>
  )
}
