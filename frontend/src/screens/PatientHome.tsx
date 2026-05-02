import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { Progress } from '../components/atoms'

interface ModuleTile {
  label: string
  sub: string
  icon: IconName
  color: string
}

const MODULES: ModuleTile[] = [
  { label: 'Entrenamiento', sub: 'Sin plan activo', icon: 'training', color: 'var(--omega)' },
  { label: 'Nutrición', sub: 'Sin plan alimentario', icon: 'nutrition', color: 'var(--nutri)' },
  { label: 'Medicina', sub: 'Sin médico vinculado', icon: 'medicine', color: 'var(--medic)' },
  { label: 'Performance', sub: 'Clock semanal', icon: 'target', color: 'var(--analytic)' },
]

const HEALTH_STATS: { k: string; v: number; c: string }[] = [
  { k: 'Sueño', v: 0, c: 'var(--analytic)' },
  { k: 'Nutri', v: 0, c: 'var(--nutri)' },
  { k: 'Entreno', v: 0, c: 'var(--omega)' },
  { k: 'Ánimo', v: 0, c: 'var(--medic)' },
]

interface Props {
  userName?: string
  onCheckIn?: () => void
}

export function PatientHome({ onCheckIn }: Props = {}) {
  return (
    <div className="patient-home">
      {/* Health Index hero */}
      <div className="card ph-health">
        <div className="row-between">
          <div className="mono">Health Index · hoy</div>
          <Icon name="chevR" size={16} />
        </div>
        <div className="ph-health-score">
          <div className="ph-score-num">—</div>
          <div className="ph-score-delta">
            <Icon name="arrowUp" size={12} /> Sin datos
          </div>
        </div>
        <div className="ph-stats">
          {HEALTH_STATS.map((s) => (
            <div key={s.k}>
              <div className="mono ph-stat-k">{s.k}</div>
              <div className="ph-stat-v" style={{ color: s.c }}>—</div>
              <Progress value={s.v} color={s.c} />
            </div>
          ))}
        </div>
      </div>

      {/* Modules quick-access */}
      <div className="ph-section">
        <div className="section-label">Módulos</div>
        <div className="ph-modules">
          {MODULES.map((m) => (
            <button key={m.label} className="ph-module-card" type="button">
              <div className="ph-module-ic" style={{ background: `${m.color}22`, color: m.color }}>
                <Icon name={m.icon} size={18} />
              </div>
              <div className="ph-module-label">{m.label}</div>
              <div className="ph-module-sub">{m.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Today agenda — empty state with check-in CTA */}
      <div className="ph-section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label">Hoy</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>Sin eventos</div>
        </div>
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Sin actividades programadas para hoy.
          </p>
          {onCheckIn && (
            <button
              type="button"
              className="ph-cta"
              onClick={onCheckIn}
            >
              <Icon name="heart" size={14} /> Hacer check-in diario
              <Icon name="chevR" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Current phase — empty state */}
      <div className="ph-section">
        <div className="card">
          <div className="row-between">
            <div>
              <div className="mono" style={{ color: 'var(--text-2)' }}>Fase actual</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>Sin fase activa</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 10, marginBottom: 10 }}>
            Tu fase aparecerá acá cuando tu profesional la asigne.
          </p>
          <Progress value={0} color="var(--text-3)" />
        </div>
      </div>
    </div>
  )
}
