// Desktop shared components: Sidebar, Topbar, Icons, avatars
const Icon = ({ name, size = 16 }) => {
  const paths = {
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z',
    users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    calendar: 'M3 9h18M8 3v4m8-4v4M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6',
    chart: 'M3 3v18h18M7 16l4-4 4 4 5-6',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.5 7.5 0 0 0-.1-1.4l2-1.5-2-3.4-2.3.9a7.3 7.3 0 0 0-2.4-1.4l-.4-2.4h-4l-.3 2.4a7.3 7.3 0 0 0-2.4 1.4l-2.4-.9-2 3.4 2 1.5a7.5 7.5 0 0 0 0 2.8l-2 1.5 2 3.4 2.4-.9a7.3 7.3 0 0 0 2.4 1.4l.3 2.4h4l.4-2.4a7.3 7.3 0 0 0 2.4-1.4l2.3.9 2-3.4-2-1.5c.1-.4.1-.9.1-1.4Z',
    bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.3-4.3',
    plus: 'M12 5v14M5 12h14',
    chevL: 'm15 18-6-6 6-6',
    chevR: 'm9 6 6 6-6 6',
    chevD: 'm6 9 6 6 6-6',
    menu: 'M3 12h18M3 6h18M3 18h18',
    db: 'M21 5c0 1.7-4 3-9 3s-9-1.3-9-3 4-3 9-3 9 1.3 9 3Zm0 0v14c0 1.7-4 3-9 3s-9-1.3-9-3V5m18 7c0 1.7-4 3-9 3s-9-1.3-9-3',
    shield: 'M12 2 4 5v7c0 5.5 3.8 8.5 8 10 4.2-1.5 8-4.5 8-10V5l-8-3Z',
    dumbbell: 'M6 7v10m12-10v10M6 12h12M2 10v4m20-4v4',
    apple: 'M12 20a6 6 0 0 1-6-6 6 6 0 0 1 6-6c1.5 0 2 .5 3 1.5M12 20a6 6 0 0 0 6-6 6 6 0 0 0-6-6M12 8V5a3 3 0 0 1 3-3',
    heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8Z',
    film: 'M2 4h20v16H2zM2 8h4m12 0h4M2 16h4m12 0h4M6 4v16m12-16v16',
    check: 'M5 12l5 5L20 7',
    upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
    logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5M21 12H9',
    filter: 'M3 4h18l-7 9v7l-4-2v-5L3 4Z',
    x: 'M18 6 6 18M6 6l12 12',
  };
  const d = paths[name] || '';
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d.split('M').filter(Boolean).map((p, i) => <path key={i} d={'M' + p}/>)}</svg>;
};

const NavGroups = {
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
  admin: [
    { title: 'Sistema', items: [
      { id: 'a-home', label: 'Panel', icon: 'home' },
      { id: 'a-users', label: 'Usuarios', icon: 'users' },
      { id: 'a-audit', label: 'Auditoría', icon: 'shield' },
      { id: 'a-db', label: 'Base de datos', icon: 'db' },
    ]},
  ],
};

const RoleLabels = {
  patient: 'Paciente',
  doctor: 'Médico',
  nutritionist: 'Nutricionista',
  trainer: 'Entrenador',
  admin: 'Administrador',
};

const RoleColors = {
  patient: { bg: 'linear-gradient(135deg, #E23E4A, #7a1a22)', txt: '#fff' },
  doctor: { bg: 'linear-gradient(135deg, #4FB8A8, #1c5a52)', txt: '#fff' },
  nutritionist: { bg: 'linear-gradient(135deg, #E8A93A, #7a5a14)', txt: '#fff' },
  trainer: { bg: 'linear-gradient(135deg, #7D8CFF, #2a3180)', txt: '#fff' },
  admin: { bg: 'linear-gradient(135deg, #C9C3BA, #6b6860)', txt: '#1a1a1a' },
};

const Sidebar = ({ role, screen, setScreen, collapsed, toggleCollapsed }) => {
  const groups = role === 'patient' ? NavGroups.patient : role === 'admin' ? NavGroups.admin : NavGroups.doctor;
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <img src="assets/logo-white.png" alt="Omega"/>
        <div className="wordmark"><em>Omega</em> Medicina</div>
      </div>
      {groups.map((g, gi) => (
        <React.Fragment key={gi}>
          <div className="nav-section-title">{g.title}</div>
          <div className="nav">
            {g.items.map(it => (
              <button key={it.id} className={screen === it.id ? 'active' : ''} onClick={() => setScreen(it.id)}>
                <Icon name={it.icon} size={16}/>
                <span>{it.label}</span>
              </button>
            ))}
          </div>
        </React.Fragment>
      ))}
      <div className="sidebar-foot" onClick={() => setScreen('settings')}>
        <div className="avatar" style={{ background: RoleColors[role]?.bg }}>{role === 'patient' ? 'JM' : role === 'doctor' ? 'DR' : role === 'admin' ? 'AD' : 'OM'}</div>
        <div className="info">
          <div className="n">{role === 'patient' ? 'Juan Martínez' : role === 'doctor' ? 'Dra. Romero' : role === 'admin' ? 'Admin OM' : 'Usuario'}</div>
          <div className="r">{RoleLabels[role]}</div>
        </div>
        <Icon name="settings" size={14}/>
      </div>
    </aside>
  );
};

const Topbar = ({ title, crumbs, role, setRole, toggleCollapsed, onLogout }) => (
  <header className="topbar">
    <button className="icon-btn" onClick={toggleCollapsed} title="Colapsar panel">
      <Icon name="menu" size={16}/>
    </button>
    <div className="crumb">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep">/</span>}
          <span style={{ color: i === crumbs.length - 1 ? 'var(--text-1)' : 'var(--text-2)' }}>{c}</span>
        </React.Fragment>
      ))}
    </div>
    <div className="search">
      <span className="ic"><Icon name="search" size={14}/></span>
      <input placeholder="Buscar pacientes, consultas, archivos…"/>
    </div>
    <div className="actions">
      <button className="icon-btn" title="Notificaciones"><Icon name="bell" size={16}/></button>
      <div style={{ width: 1, height: 22, background: 'var(--line)', margin: '0 4px' }}/>
      <RoleSwitcher role={role} setRole={setRole}/>
      <button className="icon-btn" onClick={onLogout} title="Cerrar sesión"><Icon name="logout" size={16}/></button>
    </div>
  </header>
);

const RoleSwitcher = ({ role, setRole }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-ghost" style={{ height: 34, padding: '0 10px' }} onClick={() => setOpen(!open)}>
        <span className="av" style={{ width: 20, height: 20, fontSize: 10, background: RoleColors[role]?.bg }}>{RoleLabels[role]?.[0]}</span>
        <span style={{ fontSize: 12 }}>{RoleLabels[role]}</span>
        <Icon name="chevD" size={12}/>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60 }}/>
          <div style={{ position: 'absolute', right: 0, top: 40, width: 220, background: 'var(--bg-2)', border: '1px solid var(--line-strong)', borderRadius: 12, padding: 6, zIndex: 70, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div className="mono" style={{ padding: '8px 10px 4px' }}>Cambiar de rol</div>
            {Object.keys(RoleLabels).map(r => (
              <button key={r} onClick={() => { setRole(r); setOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: r === role ? 'rgba(255,255,255,0.04)' : 'transparent', border: 0, color: 'var(--text-1)', cursor: 'pointer', borderRadius: 6, fontSize: 13, textAlign: 'left' }}>
                <span className="av" style={{ width: 24, height: 24, fontSize: 10, background: RoleColors[r]?.bg, color: RoleColors[r]?.txt }}>{RoleLabels[r][0]}</span>
                <span style={{ flex: 1 }}>{RoleLabels[r]}</span>
                {r === role && <Icon name="check" size={14}/>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Small reusable pieces
const KPI = ({ k, v, delta, dir, mod }) => (
  <div className="kpi" data-mod={mod}>
    <div className="k">{k}</div>
    <div className="v">{v}</div>
    {delta && <div className={`d ${dir || ''}`}>{dir === 'up' ? '▲' : dir === 'down' ? '▼' : '•'} {delta}</div>}
  </div>
);

const Avatar = ({ name, color, size = 30 }) => {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return <span className="av" style={{ width: size, height: size, fontSize: size * 0.38, background: color || 'linear-gradient(135deg, #E23E4A, #7a1a22)' }}>{initials}</span>;
};

const Chip = ({ children, variant }) => <span className={`chip ${variant || ''}`}>{children}</span>;

const Progress = ({ value, color = 'var(--omega)' }) => (
  <div className="bar"><span style={{ width: value + '%', background: color }}/></div>
);

Object.assign(window, { Icon, NavGroups, RoleLabels, RoleColors, Sidebar, Topbar, RoleSwitcher, KPI, Avatar, Chip, Progress });
