import { useEffect, useState, type ReactNode } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { UserMenuSheet } from './components/UserMenuSheet'
import { EditConstitutionalSheet } from './components/EditConstitutionalSheet'
import { MobilePageHeader } from './components/MobilePageHeader'
import { Landing } from './screens/Landing'
import { PublicPrograms } from './screens/PublicPrograms'
import { Login } from './screens/Login'
import { Register } from './screens/Register'
import { RegisterSuccess } from './screens/RegisterSuccess'
import { SelectRole } from './screens/SelectRole'
import { Placeholder } from './screens/Placeholder'
import { PatientHome } from './screens/PatientHome'
import { CheckIn } from './screens/patient/CheckIn'
import { Appointments } from './screens/patient/Appointments'
import { BrowseSpecialists } from './screens/patient/BrowseSpecialists'
import { TrainingPlan } from './screens/patient/TrainingPlan'
import { Nutrition } from './screens/patient/Nutrition'
import { Progress as PatientProgress } from './screens/patient/Progress'
import { Prevention } from './screens/patient/Prevention'
import { MobilityTest } from './screens/patient/MobilityTest'
import { AdminHome } from './screens/AdminHome'
import { AdminAudit } from './screens/admin/AdminAudit'
import { AdminPending } from './screens/admin/AdminPending'
import { AdminUsers } from './screens/admin/AdminUsers'
import { AdminDatabase } from './screens/admin/AdminDatabase'
import { AdminStrength } from './screens/admin/AdminStrength'
import { DoctorResources } from './screens/doctor/DoctorResources'
import { DoctorTrainingLab } from './screens/doctor/DoctorTrainingLab'
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

/** Persisted role choice per auth user (only when the user opted to remember).
 *  Scoped by userId so multiple users on the same browser do not collide. */
const PREFERRED_ROLE_PREFIX = 'omd.preferred_role:'
function readRememberedRole(userId: string | null | undefined, allowed: Role[]): Role | null {
  if (!userId) return null
  try {
    const raw = window.localStorage.getItem(PREFERRED_ROLE_PREFIX + userId)
    if (!raw) return null
    return (allowed as string[]).includes(raw) ? (raw as Role) : null
  } catch {
    return null
  }
}
function writeRememberedRole(userId: string | null | undefined, role: Role) {
  if (!userId) return
  try {
    window.localStorage.setItem(PREFERRED_ROLE_PREFIX + userId, role)
  } catch {
    // best-effort; storage may be disabled (private mode)
  }
}
function clearRememberedRole(userId: string | null | undefined) {
  if (!userId) return
  try {
    window.localStorage.removeItem(PREFERRED_ROLE_PREFIX + userId)
  } catch {
    // best-effort
  }
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
            onOpenModule={(m: 'training' | 'nutrition' | 'medicine' | 'performance') => {
              if (m === 'training') setScreen('p-training')
              else if (m === 'nutrition') setScreen('p-nutrition')
              else if (m === 'medicine') setScreen('p-medicine')
              else if (m === 'performance') setScreen('p-progress')
            }}
          />
        ),
        crumbs: ['Omega Medicina', 'Inicio'],
      }
    case 'p-checkin':
      return { node: <CheckIn onClose={() => setScreen('p-home')} />, crumbs: ['Omega Medicina', 'Inicio', 'Check-in'] }
    case 'p-browse-specialists':
      return { node: <BrowseSpecialists onClose={() => setScreen('p-home')} />, crumbs: ['Omega Medicina', 'Inicio', 'Buscar profesional'] }
    case 'p-progress':
      return { node: <PatientProgress userId={userId} />, crumbs: ['Omega Medicina', 'Progreso'] }
    case 'p-appointments':
      return { node: <Appointments />, crumbs: ['Omega Medicina', 'Consultas'] }
    case 'p-training':
      return { node: <TrainingPlan userName={userName} />, crumbs: ['Omega Medicina', 'Entrenamiento'] }
    case 'p-nutrition':
      return { node: <Nutrition />, crumbs: ['Omega Medicina', 'Nutrición'] }
    case 'p-medicine':
      return { node: <Appointments />, crumbs: ['Omega Medicina', 'Medicina'] }
    case 'p-prevention':
      return { node: <Prevention />, crumbs: ['Omega Medicina', 'Prevención'] }
    case 'p-mobility':
      return { node: <MobilityTest />, crumbs: ['Omega Medicina', 'Movilidad'] }
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
      return { node: <DoctorResources />, crumbs: ['Omega Medicina', 'Recursos'] }
    case 'd-templates':
      return { node: <DoctorTrainingLab />, crumbs: ['Omega Medicina', 'Training Lab'] }
    case 'a-home':
      return {
        node: (
          <AdminHome
            onOpenPending={() => setScreen('a-pending')}
            onOpenAudit={() => setScreen('a-audit')}
            onOpenUsers={() => setScreen('a-users')}
            onOpenDb={() => setScreen('a-db')}
            onOpenStrength={() => setScreen('a-strength')}
          />
        ),
        crumbs: ['Omega Medicina', 'Sistema'],
      }
    case 'a-pending':
      return { node: <AdminPending />, crumbs: ['Omega Medicina', 'Pendientes'] }
    case 'a-users':
      return { node: <AdminUsers />, crumbs: ['Omega Medicina', 'Usuarios'] }
    case 'a-audit':
      return { node: <AdminAudit />, crumbs: ['Omega Medicina', 'Auditoría'] }
    case 'a-db':
      return { node: <AdminDatabase />, crumbs: ['Omega Medicina', 'Base de datos'] }
    case 'a-strength':
      return { node: <AdminStrength />, crumbs: ['Omega Medicina', 'Fuerza'] }
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
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  // True between login/bootstrap and the moment the user picks a role; only
  // ever true when the user has more than one role available AND no remembered
  // choice for this device. Single-role users skip this entirely.
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false)
  // Auth flow state when there's no logged-in user
  const [authScreen, setAuthScreen] = useState<'landing' | 'login' | 'register' | 'register-success' | 'programs'>('landing')
  const [registeredEmail, setRegisteredEmail] = useState<string>('')
  // ID of the patient whose detail screen is open (set when navigating to
  // d-patient-detail). null while no patient is selected.
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)

  /** Sets role/screen post-auth, deciding whether the user has to go through
   *  the role selector first. Used by both bootstrap (token in storage) and
   *  the Login screen success handler. */
  const resolvePostAuth = (u: AuthUser) => {
    setUser(u)
    const allowed = availableUIRoles(u)
    if (allowed.length <= 1) {
      const r = allowed[0] ?? userRole(u)
      setRole(r)
      setScreen(DEFAULT_SCREEN[r])
      setNeedsRoleSelection(false)
      return
    }
    const remembered = readRememberedRole(u.id, allowed)
    if (remembered) {
      setRole(remembered)
      setScreen(DEFAULT_SCREEN[remembered])
      setNeedsRoleSelection(false)
      return
    }
    setNeedsRoleSelection(true)
  }

  useEffect(() => {
    const token = tokenStore.get()
    if (!token) {
      setBootstrapping(false)
      return
    }
    authService.me()
      .then((u) => resolvePostAuth(u))
      .catch(() => {
        tokenStore.clear()
      })
      .finally(() => setBootstrapping(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (authScreen === 'programs') {
      return (
        <PublicPrograms
          onBack={() => setAuthScreen('landing')}
          onCta={() => setAuthScreen('register')}
        />
      )
    }
    if (authScreen === 'login') {
      return (
        <Login
          onLogin={(u) => resolvePostAuth(u)}
          onCreateAccount={() => setAuthScreen('register')}
        />
      )
    }
    return (
      <Landing
        onLogin={() => setAuthScreen('login')}
        onRegister={() => setAuthScreen('register')}
        onPrograms={() => setAuthScreen('programs')}
      />
    )
  }

  const userName = userDisplayName(user)
  const availableRoles = availableUIRoles(user)
  const handleLogout = async () => {
    await authService.logout()
    setUser(null)
    setNeedsRoleSelection(false)
  }

  if (needsRoleSelection) {
    return (
      <SelectRole
        userName={userName}
        availableRoles={availableRoles}
        onSelect={(r, remember) => {
          if (remember) writeRememberedRole(user.id, r)
          else clearRememberedRole(user.id)
          setRole(r)
          setScreen(DEFAULT_SCREEN[r])
          setNeedsRoleSelection(false)
        }}
        onLogout={handleLogout}
      />
    )
  }

  const switchRole = (r: Role) => {
    if (!availableRoles.includes(r)) return
    setRole(r)
    setScreen(DEFAULT_SCREEN[r])
    // When the user manually switches roles inside the app, update the
    // remembered choice IF one was already saved — so the next login lands
    // on whatever they most recently used. If they never opted to remember,
    // do nothing (they'll see the picker again next login).
    if (user.id && window.localStorage.getItem(PREFERRED_ROLE_PREFIX + user.id)) {
      writeRememberedRole(user.id, r)
    }
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
        onEditProfile={role === 'patient' ? () => setEditProfileOpen(true) : undefined}
        userName={userName}
      />
      {editProfileOpen && user?.id && (
        <PatientProfileLoader
          userId={user.id}
          onClose={() => setEditProfileOpen(false)}
        />
      )}
    </div>
  )
}

/** Loads the patient's static profile then opens EditConstitutionalSheet with
 *  patient-only field set (the doctor uses the same sheet with admin perms). */
function PatientProfileLoader({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [profile, setProfile] = useState<import('./types/api').StaticProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    import('./services/userService').then(({ userService }) => userService.getStaticProfile(userId))
      .then((p) => { if (!cancelled) setProfile(p) })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Error') })
    return () => { cancelled = true }
  }, [userId])

  if (error) {
    return (
      <>
        <div className="sheet-backdrop" onClick={onClose} />
        <div className="sheet adm-sheet">
          <div className="sheet-handle" />
          <div className="adm-sheet-head">
            <div style={{ flex: 1 }}>
              <div className="adm-sheet-name">No pudimos cargar tu perfil</div>
              <div className="adm-sheet-meta">{error}</div>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-full" onClick={onClose}>Cerrar</button>
        </div>
      </>
    )
  }
  if (!profile) {
    return (
      <>
        <div className="sheet-backdrop" onClick={onClose} />
        <div className="sheet adm-sheet">
          <div className="sheet-handle" />
          <div className="adm-sheet-head">
            <div style={{ flex: 1 }}>
              <div className="adm-sheet-name">Cargando perfil…</div>
            </div>
          </div>
        </div>
      </>
    )
  }
  return (
    <EditConstitutionalSheet
      profile={profile}
      onClose={onClose}
      onSaved={onClose}
    />
  )
}
