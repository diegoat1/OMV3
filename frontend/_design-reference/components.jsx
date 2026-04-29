// Shared components + icons for Omega Medicina prototype

const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.6 }) => {
  const s = size;
  const common = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'dashboard': return <svg {...common}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>;
    case 'training': return <svg {...common}><path d="M6 9v6M18 9v6M3 11v2M21 11v2M8 7.5v9M16 7.5v9"/></svg>;
    case 'nutrition': return <svg {...common}><path d="M12 3c-3 2-5 5-5 9a5 5 0 0 0 10 0c0-4-2-7-5-9Z"/><path d="M12 9v4"/></svg>;
    case 'medicine': return <svg {...common}><path d="M12 2v20M2 12h20" strokeWidth="2.2"/></svg>;
    case 'data': return <svg {...common}><path d="M3 20V10M9 20V4M15 20v-8M21 20v-4"/></svg>;
    case 'calendar': return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>;
    case 'user': return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>;
    case 'file': return <svg {...common}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>;
    case 'history': return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>;
    case 'chevron-right': return <svg {...common}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevron-left': return <svg {...common}><path d="M15 6l-6 6 6 6"/></svg>;
    case 'chevron-down': return <svg {...common}><path d="M6 9l6 6 6-6"/></svg>;
    case 'play': return <svg {...common} fill={color}><path d="M6 4l14 8-14 8V4z"/></svg>;
    case 'plus': return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'close': return <svg {...common}><path d="M6 6l12 12M6 18L18 6"/></svg>;
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;
    case 'check': return <svg {...common}><path d="M4 12l5 5L20 6"/></svg>;
    case 'heart': return <svg {...common}><path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10Z"/></svg>;
    case 'flame': return <svg {...common}><path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-3 2-5 2-7 0 1 1 2 3 2 0-2 0-4 0-4Z"/></svg>;
    case 'dumbbell': return <svg {...common}><path d="M6 9v6M18 9v6M3 11v2M21 11v2M8 7.5v9M16 7.5v9"/></svg>;
    case 'arrow-up': return <svg {...common}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'arrow-down': return <svg {...common}><path d="M12 5v14M5 12l7 7 7-7"/></svg>;
    case 'video': return <svg {...common}><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4V8Z"/></svg>;
    case 'mic': return <svg {...common}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>;
    case 'phone': return <svg {...common}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z"/></svg>;
    case 'settings': return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>;
    case 'bell': return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>;
    case 'more': return <svg {...common} fill={color} stroke="none"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>;
    case 'upload': return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>;
    case 'edit': return <svg {...common}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    case 'target': return <svg {...common}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill={color} stroke="none"/></svg>;
    case 'timer': return <svg {...common}><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>;
    default: return <svg {...common}><circle cx="12" cy="12" r="8"/></svg>;
  }
};

// Page header — module-colored title row
const PageHeader = ({ module, label, title, titleEm, trailing, onBack }) => (
  <div className="mod-header">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {onBack ? (
        <button onClick={onBack} style={{ background: 'transparent', border: 0, color: 'var(--text-1)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
          <Icon name="chevron-left" size={22}/>
        </button>
      ) : (
        <div className="module-pill">{label}</div>
      )}
      {trailing}
    </div>
    <div className="title" style={{ marginTop: onBack ? 6 : 0 }}>
      {titleEm && <em>{titleEm}</em>}{titleEm && ' '}{title}
    </div>
  </div>
);

const ModuleScreen = ({ module, children }) => (
  <div data-module={module}>{children}</div>
);

const TabBar = ({ tabs, active, onSelect, accentColor }) => (
  <div className="tabbar">
    {tabs.map(t => (
      <button key={t.id} className={active === t.id ? 'active' : ''} onClick={() => onSelect(t.id)}>
        <Icon name={t.icon} size={22}/>
        <span>{t.label}</span>
      </button>
    ))}
  </div>
);

// Small reusable rows
const StatTile = ({ k, v, d, module }) => (
  <div className="stat">
    <div className="k">{k}</div>
    <div className="v" style={module ? { color: `var(--${module})` } : {}}>{v}</div>
    {d && <div className="d">{d}</div>}
  </div>
);

const ListRow = ({ leading, title, sub, trailing, onClick }) => (
  <div className="list-item" onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
    {leading}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{sub}</div>}
    </div>
    {trailing}
  </div>
);

const Avatar = ({ name, color }) => {
  const init = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return <div className="avatar" style={color ? { background: `linear-gradient(135deg, ${color}, ${color}99)` } : {}}>{init}</div>;
};

// Sparkline
const Sparkline = ({ points, color = 'var(--module)', height = 40, width = 120, fill = true }) => {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${height - ((p - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {fill && <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill={color} opacity="0.12"/>}
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// Expose to window so other babel scripts can use them
Object.assign(window, { Icon, PageHeader, ModuleScreen, TabBar, StatTile, ListRow, Avatar, Sparkline });
