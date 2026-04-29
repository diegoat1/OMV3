import { Icon } from '../components/Icon'
import { Avatar, KPI, Progress } from '../components/atoms'

export function PatientHome({ userName }: { userName: string }) {
  const firstName = (userName || '').split(' ')[0] || 'usuario'
  return (
    <>
      <div className="page-head">
        <div>
          <h1><em>Hola,</em> {firstName}</h1>
          <div className="sub">Tu salud en un vistazo</div>
        </div>
        <div className="actions">
          <button className="btn btn-ghost"><Icon name="calendar" size={14} /> Agendar consulta</button>
          <button className="btn btn-primary"><Icon name="plus" size={14} /> Check-in diario</button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 14 }}>
        <KPI k="Adherencia" v="—" delta="Sin datos aún" mod="analytics" />
        <KPI k="Peso" v="—" delta="Sin datos aún" mod="medicine" />
        <KPI k="Sueño" v="—" delta="Sin datos aún" mod="medicine" />
        <KPI k="Sesiones" v="—" delta="Esta semana" mod="training" />
      </div>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="card" data-mod="analytics">
          <div className="card-head">
            <h3>Progreso</h3>
            <div className="mono">12 semanas</div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            Tus mediciones aparecerán acá cuando tengas registros guardados.
          </p>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Hoy</h3>
            <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }}>Ver semana</button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Sin actividades programadas.</p>
        </div>
      </div>

      <div className="grid-3">
        <div className="card" data-mod="training">
          <div className="card-head"><h3>Entrenamiento</h3><span className="mono">—</span></div>
          <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>Sin plan activo</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14 }}>
            Tu plan de entrenamiento aparecerá acá
          </div>
          <Progress value={0} color="var(--omega)" />
        </div>
        <div className="card" data-mod="nutrition">
          <div className="card-head"><h3>Nutrición</h3><span className="mono">Hoy</span></div>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Sin plan alimentario.</p>
        </div>
        <div className="card" data-mod="medicine">
          <div className="card-head"><h3>Próxima consulta</h3><span className="mono">—</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Avatar name="Sin asignar" color="linear-gradient(135deg, #4FB8A8, #1c5a52)" size={40} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Sin asignar</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Sin médico vinculado</div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>Ver consultas</button>
        </div>
      </div>
    </>
  )
}
