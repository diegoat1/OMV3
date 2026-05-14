import { Icon } from '../components/Icon'

interface Props {
  onLogin: () => void
  onRegister: () => void
  onPrograms?: () => void
}

const FEATURES: { icon: 'training' | 'nutrition' | 'medicine' | 'target'; title: string; sub: string; color: string }[] = [
  { icon: 'training', title: 'Entrenamiento',  sub: 'Planes progresivos, sesión en vivo con timer y registro de cargas.', color: 'var(--omega)' },
  { icon: 'nutrition', title: 'Nutrición',     sub: 'Macros personalizados, bloques alimentarios, daily log y solver.',  color: 'var(--nutri)' },
  { icon: 'medicine',  title: 'Medicina',      sub: 'Citas, historial clínico, signos vitales y telemedicina.',          color: 'var(--medic)' },
  { icon: 'target',    title: 'Performance',   sub: 'Health Index diario, proyecciones y composición corporal real.',     color: 'var(--analytic)' },
]

const ROLES = [
  { name: 'Paciente', sub: 'Llevá tu plan completo en el bolsillo.', color: 'var(--omega)' },
  { name: 'Profesional', sub: 'Médico, nutricionista o entrenador: gestioná pacientes vinculados.', color: 'var(--medic)' },
]

/** Public landing — shown to logged-out users. CTA → Login or Register. */
export function Landing({ onLogin, onRegister, onPrograms }: Props) {
  return (
    <div
      data-mod="analytics"
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 30% 0%, rgba(125,140,255,0.10), transparent 50%), radial-gradient(circle at 90% 100%, rgba(232,169,58,0.06), transparent 50%), var(--bg-1)',
        padding: '24px 20px 40px',
      }}
    >
      {/* Top bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div className="module-pill">Omega Medicina</div>
        <button type="button" className="btn btn-ghost" onClick={onLogin} style={{ padding: '6px 14px' }}>
          Iniciar sesión
        </button>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', padding: '24px 0 32px' }}>
        <div
          className="mono"
          style={{
            color: 'var(--analytic)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Salud integrada · Entrenamiento + Nutrición + Medicina
        </div>
        <h1
          className="display"
          style={{ fontSize: 'clamp(36px, 7vw, 56px)', margin: '0 0 14px', lineHeight: 1.05 }}
        >
          <em>Una sola</em> app para todo tu proceso
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-2)', maxWidth: 520, margin: '0 auto 24px' }}>
          Plan personalizado, check-in diario, sesiones en vivo y seguimiento clínico.
          Trabajá con tu médico, nutricionista y entrenador desde el mismo lugar.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onRegister}
            style={{ padding: '12px 22px', fontSize: 14, fontWeight: 600 }}
          >
            Crear cuenta gratis
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onLogin}
            style={{ padding: '12px 22px', fontSize: 14 }}
          >
            Ya tengo cuenta
          </button>
          {onPrograms && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onPrograms}
              style={{ padding: '12px 22px', fontSize: 14 }}
            >
              Ver programas <Icon name="chevR" size={14} />
            </button>
          )}
        </div>
      </section>

      {/* Feature grid */}
      <section style={{ maxWidth: 1080, margin: '0 auto 32px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card"
              style={{
                padding: 18,
                borderColor: 'var(--line)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div
                style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: `${f.color}22`, color: f.color,
                  display: 'grid', placeItems: 'center', marginBottom: 10,
                }}
              >
                <Icon name={f.icon} size={18} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{f.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section style={{ maxWidth: 720, margin: '0 auto 32px' }}>
        <div className="section-label" style={{ textAlign: 'center', marginBottom: 12 }}>
          Para vos y para tu equipo
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {ROLES.map((r) => (
            <div key={r.name} className="card" style={{ flex: '1 1 280px', padding: 16, borderColor: 'var(--line)' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: r.color, marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{r.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onRegister}
          style={{ padding: '12px 28px', fontSize: 14, fontWeight: 600 }}
        >
          Empezar ahora
        </button>
        <p className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 12 }}>
          © Omega Medicina · Salud integrada
        </p>
      </section>
    </div>
  )
}
