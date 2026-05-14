import { useState } from 'react'
import { Icon } from '../components/Icon'

interface Props {
  onBack: () => void
  onCta: () => void
}

interface Program {
  id: string
  titulo: string
  descripcion: string
  duracion: string
  nivel: 'Principiante' | 'Intermedio' | 'Avanzado'
  equipamiento: string
  detalle: string[]   // bullets de qué incluye
  color: string
}

/** Public gallery of legacy training programs (`programa_*.html`).
 *  Each program is self-contained marketing content — the actual program
 *  routine is delivered through `/training/programs/<id>` once logged in. */
const PROGRAMS: Program[] = [
  {
    id: '30-dias-principiantes',
    titulo: '30 Días — Principiantes',
    descripcion: 'Bajo impacto, sin equipamiento. Ideal para retomar movimiento, adultos mayores o post-rehabilitación.',
    duracion: '30 días',
    nivel: 'Principiante',
    equipamiento: 'Sin equipamiento (opcional: mancuernas ligeras)',
    detalle: [
      'Movilidad articular guiada',
      'Patrón básico de fuerza con peso corporal',
      'Series de 10-15 repeticiones',
      '3 sesiones / semana',
    ],
    color: 'var(--ok)',
  },
  {
    id: '30-dias-adolescentes',
    titulo: '30 Días — Adolescentes',
    descripcion: 'Pensado para 12-17 años: técnica básica, juego y carga progresiva sin riesgo.',
    duracion: '30 días',
    nivel: 'Principiante',
    equipamiento: 'Mat y mancuernas livianas',
    detalle: [
      'Educación postural',
      'Fuerza con peso corporal y mancuernas',
      'Bloques cortos (20-30 min)',
      'Énfasis en core y movilidad',
    ],
    color: 'var(--analytic)',
  },
  {
    id: '30-dias-forma',
    titulo: '30 Días — En forma',
    descripcion: 'Recomposición express: tonificar y mejorar resistencia en un mes.',
    duracion: '30 días',
    nivel: 'Intermedio',
    equipamiento: 'Mancuernas + banda elástica',
    detalle: [
      'Circuitos full-body 4 días/sem',
      'HIIT 1 día/sem',
      'Movilidad activa diaria',
      'Plan nutricional sugerido',
    ],
    color: 'var(--medic)',
  },
  {
    id: '30-dias-abdominales',
    titulo: '30 Días — Abdominales',
    descripcion: 'Programa exclusivo de core: progresión clara de planchas, hollow body y compresiones.',
    duracion: '30 días',
    nivel: 'Principiante',
    equipamiento: 'Sin equipamiento',
    detalle: [
      '5-10 min diarios',
      'Progresión de planchas',
      'Hollow body, dead bug, compresiones',
      'Cero crunches innecesarios',
    ],
    color: 'var(--nutri)',
  },
  {
    id: '90-dias-musculo',
    titulo: '90 Días — Hipertrofia',
    descripcion: 'Construcción muscular sistemática con periodización lineal y test cada 4 semanas.',
    duracion: '90 días',
    nivel: 'Intermedio',
    equipamiento: 'Gimnasio completo o mancuernas pesadas',
    detalle: [
      'Split push/pull/legs',
      'Mes 1 fuerza · Mes 2 hipertrofia · Mes 3 intensificación',
      'Test 1RM cada 4 semanas',
      'Recomendaciones de nutrición de superávit',
    ],
    color: 'var(--omega)',
  },
  {
    id: 'hero-90',
    titulo: 'Hero 90',
    descripcion: 'Programa híbrido fuerza + resistencia + movilidad inspirado en estándares de fuerza heroicos.',
    duracion: '90 días',
    nivel: 'Avanzado',
    equipamiento: 'Gimnasio completo',
    detalle: [
      '5 días/semana',
      'Squat / Bench / Deadlift / OHP / Pullup',
      'Carrera + AMRAPs intercalados',
      'Test cada 30 días',
    ],
    color: 'var(--analytic)',
  },
  {
    id: 'warrior-90',
    titulo: 'Warrior 90',
    descripcion: 'Resistencia muscular extrema + condicionamiento cardiovascular. Para atletas con base sólida.',
    duracion: '90 días',
    nivel: 'Avanzado',
    equipamiento: 'Gimnasio completo + cinta o aire libre',
    detalle: [
      '6 días/semana',
      'Volumen alto + intervalos',
      'Movilidad obligatoria post-sesión',
      'Recuperación activa los domingos',
    ],
    color: 'var(--warn)',
  },
]

const NIVEL_COLOR: Record<Program['nivel'], string> = {
  Principiante: 'var(--ok)',
  Intermedio:   'var(--warn)',
  Avanzado:     'var(--omega)',
}

export function PublicPrograms({ onBack, onCta }: Props) {
  const [active, setActive] = useState<Program | null>(null)

  if (active) {
    return (
      <div
        data-mod="training"
        style={{
          minHeight: '100vh',
          background: 'var(--bg-1)',
          padding: '24px 20px 40px',
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <button type="button" className="btn btn-ghost" onClick={() => setActive(null)}>
            <Icon name="chevL" size={14} /> Programas
          </button>
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Inicio
          </button>
        </header>

        <section style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="mono" style={{ color: active.color, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>
            {active.nivel} · {active.duracion}
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(28px, 5vw, 44px)', margin: '0 0 14px', lineHeight: 1.1 }}>
            <em>{active.titulo.split(' — ')[0]}</em> {active.titulo.split(' — ')[1] ? `— ${active.titulo.split(' — ')[1]}` : ''}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-2)', margin: '0 0 24px' }}>
            {active.descripcion}
          </p>

          <div className="card" style={{ padding: 16, marginBottom: 20 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Qué incluye</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: 'var(--text-1)', lineHeight: 1.7 }}>
              {active.detalle.map((d) => <li key={d}>{d}</li>)}
            </ul>
          </div>

          <div className="card" style={{ padding: 16, marginBottom: 24 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Equipamiento</div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>{active.equipamiento}</p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={onCta}
            style={{ padding: '14px 22px', fontSize: 15, fontWeight: 600 }}
          >
            Empezar este programa <Icon name="chevR" size={14} />
          </button>
          <p className="mono" style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginTop: 10 }}>
            Necesitás una cuenta para activar el programa.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div
      data-mod="training"
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 70% 0%, rgba(232,169,58,0.08), transparent 50%), var(--bg-1)',
        padding: '24px 20px 40px',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <Icon name="chevL" size={14} /> Inicio
        </button>
        <button type="button" className="btn btn-primary" onClick={onCta} style={{ padding: '6px 14px' }}>
          Crear cuenta
        </button>
      </header>

      <section style={{ maxWidth: 720, margin: '0 auto 28px', textAlign: 'center' }}>
        <div className="module-pill" style={{ display: 'inline-block', marginBottom: 12 }}>Entrenamiento</div>
        <h1 className="display" style={{ fontSize: 'clamp(32px, 6vw, 48px)', margin: '0 0 10px', lineHeight: 1.1 }}>
          <em>Programas</em> guiados
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-2)' }}>
          Elegí un programa para empezar. Cada uno trae rutina semanal, progresión y métricas para que veas tus avances.
        </p>
      </section>

      <section style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          {PROGRAMS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="card"
              onClick={() => setActive(p)}
              style={{
                padding: 18,
                textAlign: 'left',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--line)',
                cursor: 'pointer',
                color: 'var(--text-1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: p.color,
                  }}
                >
                  {p.duracion}
                </span>
                <span
                  className="chip"
                  style={{
                    fontSize: 10, color: NIVEL_COLOR[p.nivel],
                    borderColor: 'var(--line)', padding: '2px 8px',
                  }}
                >
                  {p.nivel}
                </span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{p.titulo}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.45 }}>
                {p.descripcion}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  {p.equipamiento.length > 40 ? p.equipamiento.slice(0, 40) + '…' : p.equipamiento}
                </span>
                <Icon name="chevR" size={14} />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
