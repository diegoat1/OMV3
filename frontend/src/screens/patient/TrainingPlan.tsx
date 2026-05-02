import { Icon } from '../../components/Icon'
import { Avatar } from '../../components/atoms'

interface Props {
  userName?: string
}

export function TrainingPlan({ userName = '' }: Props) {
  return (
    <div className="tp-screen" data-mod="training">
      {/* Top row — Mi Plan affordance (left) + Entrenamiento module pill (right) */}
      <div className="tp-toprow">
        <div className="tp-myplan">
          <Avatar name={userName} color="var(--omega)" size={28} />
          <span className="tp-myplan-label">Mi Plan</span>
          <Icon name="chevR" size={14} />
        </div>
        <div className="module-pill">Entrenamiento</div>
      </div>

      {/* "Siguiente" hero card — empty state */}
      <div className="card tp-next-card">
        <div className="tp-next-glow" aria-hidden="true" />
        <div className="row-between">
          <div>
            <div className="display tp-next-title">
              <em>Siguiente</em>
            </div>
            <div className="tp-next-sub">Sin sesión programada</div>
          </div>
        </div>
        <div className="tp-chips">
          <div className="chip">— min</div>
          <div className="chip">Sin gym</div>
        </div>
      </div>

      {/* Empty exercises list */}
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Ejercicios</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>0 ejercicios</div>
        </div>
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Tu plan de entrenamiento aparecerá acá cuando tu profesional lo asigne.
          </p>
        </div>
      </div>

      {/* Tu progreso — stats grid + benchmarks teaser */}
      <div className="ph-section">
        <div className="section-label">Tu progreso</div>
        <div className="tp-stats-grid">
          <div className="stat">
            <div className="k">Racha</div>
            <div className="v">—</div>
            <div className="d">semanas</div>
          </div>
          <div className="stat">
            <div className="k">Sesiones</div>
            <div className="v">—</div>
            <div className="d">totales</div>
          </div>
          <div className="stat">
            <div className="k">Volumen</div>
            <div className="v">—</div>
            <div className="d">esta semana</div>
          </div>
        </div>
        <div className="card tp-benchmarks">
          <Icon name="data" size={18} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Fuerza general & benchmarks</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>mSTRENGTH por grupo muscular</div>
          </div>
          <Icon name="chevR" size={16} />
        </div>
      </div>
    </div>
  )
}
