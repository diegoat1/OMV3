import type { Role } from '../../types/api'

interface Props {
  role?: Role
}

const PILL_LABEL: Partial<Record<Role, string>> = {
  doctor: 'Medicina',
  nutritionist: 'Nutrición',
  trainer: 'Entreno',
}

const SUBJECT_NOUN: Partial<Record<Role, string>> = {
  doctor: 'pacientes',
  nutritionist: 'pacientes',
  trainer: 'atletas',
}

export function DoctorHome({ role = 'doctor' }: Props) {
  const pill = PILL_LABEL[role] ?? 'Clínica'
  const subject = SUBJECT_NOUN[role] ?? 'pacientes'

  return (
    <div className="dh-screen" data-mod={role === 'trainer' ? 'training' : role === 'nutritionist' ? 'nutrition' : 'medicine'}>
      {/* Page title — module pill + serif italic display */}
      <div className="ah-title-block">
        <div className="module-pill">{pill}</div>
        <div className="display ah-title">
          <em>Panel</em> de hoy
        </div>
      </div>

      {/* 3 stat tiles — empty */}
      <div className="dh-stats">
        <div className="stat">
          <div className="k">Hoy</div>
          <div className="v">—</div>
          <div className="d">consultas</div>
        </div>
        <div className="stat">
          <div className="k">Semana</div>
          <div className="v">—</div>
          <div className="d">{subject}</div>
        </div>
        <div className="stat">
          <div className="k">Pendientes</div>
          <div className="v">—</div>
          <div className="d">reportes</div>
        </div>
      </div>

      {/* Agenda — empty state */}
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Agenda de hoy</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>0 consultas</div>
        </div>
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Sin consultas programadas para hoy.
          </p>
        </div>
      </div>

      {/* Alertas — empty state */}
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Alertas</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>0 alertas</div>
        </div>
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Sin alertas activas.
          </p>
        </div>
      </div>
    </div>
  )
}
