import { Icon } from '../../components/Icon'

export function Appointments() {
  return (
    <div className="ap-screen" data-mod="medicine">
      {/* Page title — module pill + serif italic display */}
      <div className="ap-title-block">
        <div className="module-pill">Medicina</div>
        <div className="display ap-title">
          <em>Tus</em> citas
        </div>
      </div>

      {/* Próxima — empty state with subtle medic gradient hint */}
      <div className="ap-section">
        <div className="card ap-next-card">
          <div className="mono" style={{ color: 'var(--medic)' }}>Próxima</div>
          <div className="ap-next-title">Sin próxima consulta</div>
          <div className="ap-next-sub">Tu próxima cita aparecerá acá cuando se agende.</div>
        </div>
      </div>

      {/* Upcoming — empty state */}
      <div className="ap-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Próximas</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>0 agendadas</div>
        </div>
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Sin citas próximas.
          </p>
        </div>
      </div>

      {/* Clinical situations — empty state */}
      <div className="ap-section">
        <div className="section-label">Situaciones clínicas</div>
        <div className="card ap-situation">
          <div className="ap-situation-ic">
            <Icon name="heart" size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="ap-situation-title">Sin situaciones registradas</div>
            <div className="ap-situation-sub">Tu historial clínico aparecerá acá.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
