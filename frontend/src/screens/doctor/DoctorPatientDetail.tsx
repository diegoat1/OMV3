import { useState } from 'react'
import { Icon } from '../../components/Icon'

interface Props {
  onClose?: () => void
}

const TABS = ['Resumen', 'Historial', 'Planes', 'Labs', 'Archivos'] as const
type Tab = (typeof TABS)[number]

interface PlanRow {
  label: string
  sub: string
  color: string
}

const PLANS: PlanRow[] = [
  { label: 'Entreno · sin plan', sub: 'Asignar plan de entrenamiento', color: 'var(--omega)' },
  { label: 'Nutri · sin plan', sub: 'Asignar plan alimentario', color: 'var(--nutri)' },
  { label: 'Programa · sin programa', sub: 'Asignar programa clínico', color: 'var(--medic)' },
]

export function DoctorPatientDetail({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('Resumen')

  return (
    <div className="dpd-screen" data-mod="medicine">
      {/* Top bar — back + title + more (mirrors CheckIn modal pattern) */}
      <div className="dpd-top">
        <button
          type="button"
          className="dpd-close"
          aria-label="Volver"
          onClick={onClose}
        >
          <Icon name="chevL" size={22} />
        </button>
        <div className="mono">Ficha de paciente</div>
        <button type="button" className="dpd-more" aria-label="Más opciones">
          <Icon name="more" size={20} />
        </button>
      </div>

      {/* Patient header — avatar + name + bio + video CTA */}
      <div className="dpd-patient">
        <div className="dpd-avatar" aria-hidden="true">—</div>
        <div className="dpd-patient-info">
          <div className="dpd-patient-name">Sin paciente seleccionado</div>
          <div className="dpd-patient-bio">— años · — · Fase: —</div>
        </div>
        <button type="button" className="dpd-video-btn" aria-label="Iniciar videollamada">
          <Icon name="video" size={18} />
        </button>
      </div>

      {/* Quick stats — 4-up empty */}
      <div className="dpd-stats">
        {[
          { k: 'Peso', u: 'kg', c: 'var(--analytic)' },
          { k: '% Grasa', u: '%', c: 'var(--medic)' },
          { k: 'Fuerza', u: 'mSTR', c: 'var(--omega)' },
          { k: 'Adh.', u: '%', c: 'var(--ok)' },
        ].map((s) => (
          <div key={s.k} className="dpd-stat">
            <div className="dpd-stat-k">{s.k}</div>
            <div className="dpd-stat-v" style={{ color: s.c }}>—</div>
            <div className="dpd-stat-u">{s.u}</div>
          </div>
        ))}
      </div>

      {/* Tabs — segmented underline */}
      <div className="dpd-tabs">
        {TABS.map((t) => {
          const active = tab === t
          return (
            <button
              key={t}
              type="button"
              className={'dpd-tab' + (active ? ' is-active' : '')}
              onClick={() => setTab(t)}
              aria-pressed={active}
            >
              {t}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'Resumen' && (
        <>
          <div className="ph-section">
            <div className="section-label">Planes activos</div>
            <div className="dpd-plans">
              {PLANS.map((p) => (
                <div key={p.label} className="card dpd-plan">
                  <div className="dpd-plan-bar" style={{ background: p.color }} />
                  <div style={{ flex: 1 }}>
                    <div className="dpd-plan-label">{p.label}</div>
                    <div className="dpd-plan-sub">{p.sub}</div>
                  </div>
                  <Icon name="edit" size={16} />
                </div>
              ))}
            </div>
          </div>

          <div className="ph-section">
            <div className="section-label">Notas recientes</div>
            <div className="card">
              <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
                Sin notas clínicas registradas.
              </p>
            </div>
          </div>

          <button type="button" className="btn btn-full dpd-new-note">
            <Icon name="edit" size={16} /> Nueva nota clínica
          </button>
        </>
      )}

      {tab !== 'Resumen' && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            {tab === 'Historial' && 'Sin historial registrado.'}
            {tab === 'Planes' && 'Sin planes activos asignados.'}
            {tab === 'Labs' && 'Sin laboratorios cargados.'}
            {tab === 'Archivos' && 'Sin archivos compartidos.'}
          </p>
        </div>
      )}
    </div>
  )
}
