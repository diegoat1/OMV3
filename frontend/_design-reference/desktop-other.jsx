// Desktop screens: Doctor / Nutritionist / Trainer / Admin / Auth

// ───────── DOCTOR
const DoctorHome = () => (
  <>
    <div className="page-head">
      <div><h1><em>Buen día,</em> Dra. Romero</h1><div className="sub">Martes, 6 de mayo · 4 consultas hoy · 2 pendientes de revisar</div></div>
      <div className="actions"><button className="btn btn-ghost"><Icon name="calendar" size={14}/> Mi agenda</button><button className="btn btn-primary"><Icon name="plus" size={14}/> Nueva consulta</button></div>
    </div>

    <div className="grid-4" style={{ marginBottom: 14 }}>
      <KPI k="Pacientes activos" v="84" delta="+3 esta semana" dir="up" mod="medicine"/>
      <KPI k="Consultas hoy" v="4" delta="2 videoconsultas"/>
      <KPI k="Sin revisar" v="7" delta="Resultados de labs" dir="down" mod="medicine"/>
      <KPI k="Adherencia promedio" v="83%" delta="+2% mensual" dir="up" mod="analytics"/>
    </div>

    <div className="grid-2" style={{ marginBottom: 14 }}>
      <div className="card">
        <div className="card-head"><h3>Agenda de hoy</h3><span className="mono">6 may 2026</span></div>
        {[
          { t: '09:00', p: 'Juan Martínez', r: 'Control trimestral', m: 'Presencial', s: 'ok' },
          { t: '10:30', p: 'Laura Giménez', r: 'Primera consulta', m: 'Videoconsulta', s: 'now' },
          { t: '12:00', p: 'Roberto Díaz', r: 'Seguimiento HTA', m: 'Presencial', s: '' },
          { t: '15:00', p: 'María Castro', r: 'Resultados labs', m: 'Videoconsulta', s: '' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderTop: i > 0 ? '1px solid var(--line)' : 0 }}>
            <div style={{ textAlign: 'center', width: 56 }}>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{r.t}</div>
              <div className="mono">30 min</div>
            </div>
            <div style={{ width: 1, height: 36, background: 'var(--line)' }}/>
            <Avatar name={r.p} size={34}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.p}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.r} · {r.m}</div>
            </div>
            {r.s === 'now' ? <Chip variant="err">Ahora</Chip> : r.s === 'ok' ? <Chip variant="ok">Listo</Chip> : <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>Abrir</button>}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head"><h3>Por revisar</h3><Chip variant="err">7</Chip></div>
        {[
          { p: 'Pablo Herrera', t: 'Perfil lipídico', d: 'hace 2h', s: 'warn' },
          { p: 'Ana Benítez', t: 'Tiroides T3/T4', d: 'hace 5h', s: 'err' },
          { p: 'Diego Torres', t: 'Hemograma completo', d: 'ayer', s: 'ok' },
          { p: 'Carla Núñez', t: 'Check-in semanal', d: 'ayer', s: '' },
          { p: 'Federico Ríos', t: 'Glucemia', d: 'hace 2 días', s: 'warn' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid var(--line)' : 0 }}>
            <Avatar name={r.p} color="linear-gradient(135deg, #4FB8A8, #1c5a52)" size={30}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.p}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.t}</div>
            </div>
            <div className="mono">{r.d}</div>
            {r.s && <Chip variant={r.s}>{r.s === 'warn' ? 'Atención' : r.s === 'err' ? 'Urgente' : 'OK'}</Chip>}
          </div>
        ))}
      </div>
    </div>
  </>
);

const DoctorPatients = () => {
  const pts = [
    { p: 'Juan Martínez', age: 34, next: '9 may', adh: 87, tags: ['Entrenamiento', 'Nutrición'], st: 'ok', g: 'linear-gradient(135deg, #E23E4A, #7a1a22)' },
    { p: 'Laura Giménez', age: 28, next: 'Hoy', adh: 92, tags: ['Nutrición'], st: 'ok', g: 'linear-gradient(135deg, #E8A93A, #7a5a14)' },
    { p: 'Roberto Díaz', age: 58, next: 'Hoy', adh: 71, tags: ['HTA', 'Medicina'], st: 'warn', g: 'linear-gradient(135deg, #4FB8A8, #1c5a52)' },
    { p: 'María Castro', age: 41, next: 'Hoy', adh: 84, tags: ['Medicina'], st: 'ok', g: 'linear-gradient(135deg, #7D8CFF, #2a3180)' },
    { p: 'Pablo Herrera', age: 45, next: '12 may', adh: 62, tags: ['Entreno', 'Metabólico'], st: 'err', g: 'linear-gradient(135deg, #E23E4A, #7a1a22)' },
    { p: 'Ana Benítez', age: 36, next: '14 may', adh: 88, tags: ['Tiroides'], st: 'warn', g: 'linear-gradient(135deg, #E8A93A, #7a5a14)' },
    { p: 'Diego Torres', age: 29, next: '16 may', adh: 95, tags: ['Entrenamiento'], st: 'ok', g: 'linear-gradient(135deg, #4FB8A8, #1c5a52)' },
    { p: 'Carla Núñez', age: 52, next: '20 may', adh: 79, tags: ['Nutrición', 'Medicina'], st: 'ok', g: 'linear-gradient(135deg, #7D8CFF, #2a3180)' },
  ];
  return (
    <>
      <div className="page-head">
        <div><h1><em>Pacientes</em></h1><div className="sub">84 activos · filtrado por todos los módulos</div></div>
        <div className="actions"><button className="btn btn-ghost"><Icon name="filter" size={14}/> Filtros</button><button className="btn btn-primary"><Icon name="plus" size={14}/> Nuevo paciente</button></div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', gap: 10, padding: 14, borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}><Icon name="search" size={14}/></span>
            <input placeholder="Buscar por nombre, DNI, email…" style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text-1)', fontSize: 13, fontFamily: 'inherit' }}/>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['Todos', 'Activos', 'Pendientes', 'Alta'].map((f, i) => <button key={f} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12, background: i === 0 ? 'var(--omega-soft)' : 'var(--bg-2)', color: i === 0 ? 'var(--omega)' : 'var(--text-2)' }}>{f}</button>)}
          </div>
        </div>
        <table className="table">
          <thead><tr><th style={{ paddingLeft: 20 }}>Paciente</th><th>Edad</th><th>Módulos</th><th>Adherencia</th><th>Próx. cita</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {pts.map((r, i) => (
              <tr key={i}>
                <td style={{ paddingLeft: 20 }}><Avatar name={r.p} color={r.g}/> <span style={{ fontWeight: 500, marginLeft: 4 }}>{r.p}</span></td>
                <td style={{ color: 'var(--text-2)' }}>{r.age}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>{r.tags.map(t => <Chip key={t}>{t}</Chip>)}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 120 }}>
                    <div style={{ flex: 1 }}><Progress value={r.adh} color={r.adh > 85 ? 'var(--ok)' : r.adh > 70 ? 'var(--warn)' : 'var(--err)'}/></div>
                    <span style={{ fontSize: 12, color: 'var(--text-2)', minWidth: 30 }}>{r.adh}%</span>
                  </div>
                </td>
                <td>{r.next}</td>
                <td><Chip variant={r.st}>{r.st === 'ok' ? 'En plan' : r.st === 'warn' ? 'Revisar' : 'Riesgo'}</Chip></td>
                <td><button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>Abrir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const DoctorPatientDetail = () => (
  <>
    <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
      <span style={{ cursor: 'pointer' }}>Pacientes</span> <span style={{ margin: '0 6px' }}>/</span> <span style={{ color: 'var(--text-1)' }}>Juan Martínez</span>
    </div>
    <div className="page-head" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <Avatar name="Juan Martínez" size={64}/>
        <div>
          <h1 style={{ fontSize: 26 }}>Juan Martínez</h1>
          <div className="sub">34 años · Plan Entreno + Nutri · desde feb 2026</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <Chip variant="ok">Activo</Chip>
            <Chip variant="info">Videoconsulta viernes</Chip>
          </div>
        </div>
      </div>
      <div className="actions">
        <button className="btn btn-ghost">Enviar mensaje</button>
        <button className="btn btn-ghost"><Icon name="calendar" size={14}/> Agendar</button>
        <button className="btn btn-primary">Iniciar videoconsulta</button>
      </div>
    </div>

    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
      {['Resumen', 'Historia clínica', 'Plan nutricional', 'Plan entreno', 'Estudios', 'Mensajes'].map((t, i) => (
        <button key={t} className="btn btn-ghost" style={{ padding: '10px 14px', fontSize: 13, background: 'transparent', border: 0, borderBottom: `2px solid ${i === 0 ? 'var(--omega)' : 'transparent'}`, color: i === 0 ? 'var(--omega)' : 'var(--text-2)', borderRadius: 0 }}>{t}</button>
      ))}
    </div>

    <div className="grid-4" style={{ marginBottom: 14 }}>
      <KPI k="Peso actual" v="78.2 kg" delta="-3.8 kg · 12 sem" dir="down" mod="analytics"/>
      <KPI k="IMC" v="24.1" delta="Normal" mod="medicine"/>
      <KPI k="Presión arterial" v="118/76" delta="Óptima" dir="up" mod="medicine"/>
      <KPI k="Adherencia global" v="87%" delta="Excelente" dir="up"/>
    </div>

    <div className="grid-2">
      <div className="card">
        <div className="card-head"><h3>Timeline clínica</h3><span className="mono">Últimos eventos</span></div>
        {[
          { d: '28 abr', t: 'Perfil lipídico', dt: 'LDL 142 mg/dL · elevado', ic: 'file', c: 'var(--warn)' },
          { d: '15 abr', t: 'Consulta presencial', dt: 'Control mensual · buena evolución', ic: 'heart', c: 'var(--medic)' },
          { d: '08 abr', t: 'Ajuste plan nutricional', dt: 'Reducción carbohidratos a 280g', ic: 'apple', c: 'var(--nutri)' },
          { d: '01 abr', t: 'Videoconsulta', dt: 'Revisión de objetivos Q2', ic: 'film', c: 'var(--medic)' },
          { d: '20 mar', t: 'DEXA', dt: 'Masa muscular +3.2 kg', ic: 'activity', c: 'var(--analytic)' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderTop: i > 0 ? '1px solid var(--line)' : 0, position: 'relative' }}>
            <div style={{ width: 56 }}><div className="mono" style={{ color: 'var(--text-2)' }}>{r.d}</div></div>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-2)', color: r.c, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={r.ic} size={15}/></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.t}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.dt}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" data-mod="medicine">
          <div className="card-head"><h3>Medicación activa</h3></div>
          {[['Omega-3', '2 cáps/día'], ['Vitamina D3', '1000 UI'], ['Magnesio', '300 mg noche']].map(([n, d]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--line)' }}>
              <Icon name="heart" size={14}/>
              <span style={{ flex: 1, fontSize: 13 }}>{n}</span>
              <span className="mono">{d}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-head"><h3>Notas privadas</h3><button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }}><Icon name="plus" size={11}/> Agregar</button></div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
            Paciente muy consistente. Evaluar reducción de visitas a mensual si mantiene adherencia sobre 85% por 2 ciclos. LDL elevado puede mejorar con ajuste en grasas saturadas.
          </div>
          <div className="mono" style={{ marginTop: 10 }}>Actualizada 28 abr · Dra. Romero</div>
        </div>
      </div>
    </div>
  </>
);

// ───────── NUTRITIONIST
const NutriHome = () => (
  <>
    <div className="page-head">
      <div><h1><em>Panel</em> nutricional</h1><div className="sub">Lic. Carolina Torres · 32 planes activos</div></div>
      <div className="actions"><button className="btn btn-ghost">Biblioteca de recetas</button><button className="btn btn-primary"><Icon name="plus" size={14}/> Nuevo plan</button></div>
    </div>

    <div className="grid-4" style={{ marginBottom: 14 }}>
      <KPI k="Planes activos" v="32" delta="+2 esta semana" dir="up" mod="nutrition"/>
      <KPI k="Adherencia media" v="81%" delta="+3% mensual" dir="up" mod="nutrition"/>
      <KPI k="Registros hoy" v="126" delta="Meta 140" mod="nutrition"/>
      <KPI k="Consultas pendientes" v="8" delta="esta semana" mod="nutrition"/>
    </div>

    <div className="grid-2">
      <div className="card" data-mod="nutrition">
        <div className="card-head"><h3>Pacientes que requieren ajuste</h3><Chip variant="warn">5</Chip></div>
        {[
          { n: 'Juan Martínez', r: 'Plateau de 3 semanas en peso', a: 'Revisar déficit' },
          { n: 'Pablo Herrera', r: 'Adherencia 62% últimos 7 días', a: 'Contactar' },
          { n: 'Sofía López', r: 'Meta alcanzada · actualizar', a: 'Ajustar objetivos' },
          { n: 'Martín Ruiz', r: 'LDL elevado en labs', a: 'Reducir grasas sat.' },
          { n: 'Lucía Fernández', r: 'Reporta hambre nocturna', a: 'Redistribuir kcal' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderTop: i > 0 ? '1px solid var(--line)' : 0 }}>
            <Avatar name={r.n} color="linear-gradient(135deg, #E8A93A, #7a5a14)" size={32}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.n}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.r}</div>
            </div>
            <Chip variant="warn">{r.a}</Chip>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head"><h3>Plan builder · plantillas</h3><button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>Ver todas</button></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { t: 'Déficit 500 kcal', d: 'Balanceada · 35/40/25', u: 12 },
            { t: 'Recomposición', d: 'Alta proteína · 40/35/25', u: 8 },
            { t: 'Mediterránea', d: '2200 kcal · omega 3+', u: 6 },
            { t: 'Cetogénica', d: 'Bajo carbo · 20/5/75', u: 3 },
          ].map((t, i) => (
            <div key={i} style={{ padding: 14, background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t.t}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{t.d}</div>
              <div className="mono" style={{ marginTop: 10 }}>{t.u} pacientes</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

// ───────── TRAINER
const TrainerHome = () => (
  <>
    <div className="page-head">
      <div><h1><em>Panel</em> de entrenamiento</h1><div className="sub">Martín Sosa · 28 atletas activos · 4 sesiones hoy</div></div>
      <div className="actions"><button className="btn btn-ghost">Biblioteca de ejercicios</button><button className="btn btn-primary"><Icon name="plus" size={14}/> Nueva rutina</button></div>
    </div>

    <div className="grid-4" style={{ marginBottom: 14 }}>
      <KPI k="Atletas activos" v="28" delta="+4 este mes" dir="up" mod="training"/>
      <KPI k="Sesiones esta semana" v="82" delta="92% completadas" dir="up" mod="training"/>
      <KPI k="PRs rotos" v="12" delta="último mes" dir="up" mod="training"/>
      <KPI k="Lesiones activas" v="1" delta="en seguimiento" mod="medicine"/>
    </div>

    <div className="grid-2">
      <div className="card" data-mod="training">
        <div className="card-head"><h3>Sesiones programadas hoy</h3><span className="mono">4 atletas</span></div>
        {[
          { t: '08:00', n: 'Diego Torres', r: 'Piernas · Semana 3', e: '6 ejercicios · 60 min' },
          { t: '11:30', n: 'Juan Martínez', r: 'Push Day · Semana 6', e: '8 ejercicios · 55 min' },
          { t: '17:00', n: 'Camila Vargas', r: 'Full body · Semana 1', e: '5 ejercicios · 45 min' },
          { t: '19:30', n: 'Lucas Méndez', r: 'Pull Day · Semana 8', e: '7 ejercicios · 50 min' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderTop: i > 0 ? '1px solid var(--line)' : 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, width: 50 }}>{r.t}</div>
            <Avatar name={r.n} color="linear-gradient(135deg, #E23E4A, #7a1a22)" size={32}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.n}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.r} · {r.e}</div>
            </div>
            <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>Editar</button>
          </div>
        ))}
      </div>

      <div className="card" data-mod="training">
        <div className="card-head"><h3>Rutinas activas</h3></div>
        {[
          { r: 'PPL 6 días · Intermedio', u: 8, d: 12 },
          { r: 'Upper/Lower · 4 días', u: 6, d: 8 },
          { r: 'Full Body · Principiante', u: 7, d: 12 },
          { r: 'Peso muerto especialización', u: 4, d: 6 },
          { r: 'Volumen hombros', u: 3, d: 4 },
        ].map((r, i) => (
          <div key={i} style={{ padding: '12px 0', borderTop: i > 0 ? '1px solid var(--line)' : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.r}</div>
              <div className="mono">{r.u} atletas</div>
            </div>
            <div style={{ marginTop: 6 }}><Progress value={(r.u / r.d) * 100} color="var(--omega)"/></div>
          </div>
        ))}
      </div>
    </div>
  </>
);

// ───────── ADMIN
const AdminHome = () => (
  <>
    <div className="page-head">
      <div><h1><em>Sistema</em></h1><div className="sub">Operación en tiempo real · 3 alertas activas</div></div>
      <div className="actions"><button className="btn btn-ghost">Logs</button><button className="btn btn-primary"><Icon name="settings" size={14}/> Configuración</button></div>
    </div>

    <div className="grid-4" style={{ marginBottom: 14 }}>
      <KPI k="Usuarios totales" v="1.284" delta="+18 hoy" dir="up"/>
      <KPI k="Pacientes activos" v="942" delta="+12 semanal" dir="up"/>
      <KPI k="Profesionales" v="47" delta="12 doctores · 18 nutri · 17 entren."/>
      <KPI k="Uptime 30d" v="99.98%" delta="SLO 99.9%" dir="up" mod="analytics"/>
    </div>

    <div className="grid-2" style={{ marginBottom: 14 }}>
      <div className="card">
        <div className="card-head"><h3>Actividad del sistema</h3><span className="mono">Últimos 30 días</span></div>
        <svg viewBox="0 0 640 180" style={{ width: '100%', height: 180 }}>
          {[0,1,2,3].map(i => <line key={i} x1="20" x2="620" y1={20 + i * 40} y2={20 + i * 40} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>)}
          {Array.from({ length: 30 }).map((_, i) => {
            const h = 30 + Math.sin(i * 0.6) * 30 + Math.random() * 40;
            return <rect key={i} x={22 + i * 20} y={180 - h} width="14" height={h} fill="var(--analytic)" opacity="0.7" rx="2"/>;
          })}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
          <span>6 ABR</span><span>20 ABR</span><span>6 MAY</span>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h3>Alertas activas</h3><Chip variant="err">3</Chip></div>
        {[
          { t: 'Storage 78% capacidad', d: 'DB principal · crecimiento 2%/día', s: 'warn' },
          { t: 'Latencia API videoconsultas', d: 'p99 a 420ms (umbral 300)', s: 'warn' },
          { t: 'Backup fallido', d: 'backup nocturno 05/05 · reintento manual', s: 'err' },
        ].map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderTop: i > 0 ? '1px solid var(--line)' : 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: a.s === 'err' ? 'var(--err)' : 'var(--warn)', marginTop: 4, flexShrink: 0 }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{a.t}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.d}</div>
            </div>
            <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>Revisar</button>
          </div>
        ))}
      </div>
    </div>
  </>
);

const AdminUsers = () => (
  <>
    <div className="page-head">
      <div><h1><em>Usuarios</em></h1><div className="sub">1.284 totales · 1.237 activos</div></div>
      <div className="actions"><button className="btn btn-ghost"><Icon name="upload" size={14}/> Importar</button><button className="btn btn-primary"><Icon name="plus" size={14}/> Invitar usuario</button></div>
    </div>
    <div className="card" style={{ padding: 0 }}>
      <div style={{ display: 'flex', gap: 10, padding: 14, borderBottom: '1px solid var(--line)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}><Icon name="search" size={14}/></span>
          <input placeholder="Buscar usuario…" style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text-1)', fontSize: 13, fontFamily: 'inherit' }}/>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['Todos', 'Paciente', 'Médico', 'Nutricionista', 'Entrenador'].map((f, i) => <button key={f} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12, background: i === 0 ? 'var(--omega-soft)' : 'var(--bg-2)', color: i === 0 ? 'var(--omega)' : 'var(--text-2)' }}>{f}</button>)}
        </div>
      </div>
      <table className="table">
        <thead><tr><th style={{ paddingLeft: 20 }}>Usuario</th><th>Email</th><th>Rol</th><th>Alta</th><th>Último acceso</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {[
            { n: 'Juan Martínez', e: 'juan.m@mail.com', r: 'Paciente', a: '15/02/26', u: 'hace 2h', s: 'ok' },
            { n: 'Dra. Sofía Romero', e: 'sromero@omega.med', r: 'Médico', a: '12/01/24', u: 'hace 20m', s: 'ok' },
            { n: 'Lic. Carolina Torres', e: 'ctorres@omega.med', r: 'Nutricionista', a: '08/03/24', u: 'hace 1h', s: 'ok' },
            { n: 'Martín Sosa', e: 'msosa@omega.med', r: 'Entrenador', a: '20/05/24', u: 'ayer', s: 'ok' },
            { n: 'Laura Giménez', e: 'laura.g@mail.com', r: 'Paciente', a: '28/04/26', u: 'hace 5m', s: 'ok' },
            { n: 'Pablo Herrera', e: 'pablo.h@mail.com', r: 'Paciente', a: '02/03/26', u: 'hace 3 días', s: 'warn' },
            { n: 'Ana Benítez', e: 'ana.b@mail.com', r: 'Paciente', a: '14/04/26', u: 'suspendida', s: 'err' },
          ].map((r, i) => (
            <tr key={i}>
              <td style={{ paddingLeft: 20 }}><Avatar name={r.n}/> <span style={{ fontWeight: 500, marginLeft: 4 }}>{r.n}</span></td>
              <td style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.e}</td>
              <td><Chip>{r.r}</Chip></td>
              <td style={{ color: 'var(--text-3)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{r.a}</td>
              <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{r.u}</td>
              <td><Chip variant={r.s}>{r.s === 'ok' ? 'Activo' : r.s === 'warn' ? 'Inactivo' : 'Suspendido'}</Chip></td>
              <td><button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>•••</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

const AdminAudit = () => (
  <>
    <div className="page-head">
      <div><h1><em>Auditoría</em></h1><div className="sub">Registro inmutable de acciones · últimos 90 días</div></div>
      <div className="actions"><button className="btn btn-ghost"><Icon name="filter" size={14}/> Filtros</button><button className="btn btn-ghost">Exportar CSV</button></div>
    </div>
    <div className="card" style={{ padding: 0 }}>
      <table className="table">
        <thead><tr><th style={{ paddingLeft: 20 }}>Timestamp</th><th>Actor</th><th>Acción</th><th>Recurso</th><th>IP</th><th>Estado</th></tr></thead>
        <tbody>
          {[
            ['2026-05-06 11:42:18', 'sromero@omega.med', 'UPDATE', 'Paciente #284 · notas', '190.120.x.x', 'ok'],
            ['2026-05-06 11:38:02', 'juan.m@mail.com', 'LOGIN', 'Sesión · iOS', '181.22.x.x', 'ok'],
            ['2026-05-06 11:30:15', 'sistema', 'BACKUP', 'DB pacientes · incremental', '—', 'ok'],
            ['2026-05-06 11:22:44', 'ctorres@omega.med', 'CREATE', 'Plan nutricional #1092', '190.120.x.x', 'ok'],
            ['2026-05-06 11:15:09', 'admin@omega.med', 'UPDATE', 'Configuración SMTP', '200.5.x.x', 'ok'],
            ['2026-05-06 10:48:33', 'desconocido', 'LOGIN', 'Intento fallido · 3 tries', '45.155.x.x', 'err'],
            ['2026-05-06 10:32:21', 'msosa@omega.med', 'UPDATE', 'Rutina atleta #481', '190.120.x.x', 'ok'],
            ['2026-05-06 10:14:08', 'sistema', 'ALERT', 'Storage > 75%', '—', 'warn'],
          ].map((r, i) => (
            <tr key={i}>
              <td style={{ paddingLeft: 20, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>{r[0]}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{r[1]}</td>
              <td><span style={{ padding: '2px 8px', background: 'var(--bg-2)', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: r[2] === 'CREATE' ? 'var(--ok)' : r[2] === 'UPDATE' ? 'var(--warn)' : r[2] === 'LOGIN' ? 'var(--medic)' : 'var(--text-2)' }}>{r[2]}</span></td>
              <td style={{ fontSize: 12 }}>{r[3]}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>{r[4]}</td>
              <td><Chip variant={r[5]}>{r[5] === 'ok' ? 'OK' : r[5] === 'err' ? 'Error' : 'Alerta'}</Chip></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

const AdminDB = () => (
  <>
    <div className="page-head">
      <div><h1><em>Base</em> de datos</h1><div className="sub">PostgreSQL 16 · réplica activa</div></div>
      <div className="actions"><button className="btn btn-ghost">Abrir consola</button><button className="btn btn-primary"><Icon name="db" size={14}/> Backup manual</button></div>
    </div>
    <div className="grid-4" style={{ marginBottom: 14 }}>
      <KPI k="Tamaño DB" v="18.4 GB" delta="+120 MB/día" mod="analytics"/>
      <KPI k="Conexiones" v="42/200" delta="carga baja" dir="up"/>
      <KPI k="QPS promedio" v="340" delta="pico 820 en videoconsultas"/>
      <KPI k="Último backup" v="06/05 03:00" delta="incremental · OK" dir="up"/>
    </div>
    <div className="card">
      <div className="card-head"><h3>Tablas principales</h3><span className="mono">Top por tamaño</span></div>
      <table className="table">
        <thead><tr><th style={{ paddingLeft: 0 }}>Tabla</th><th>Filas</th><th>Tamaño</th><th>Crecimiento 7d</th><th>Índices</th></tr></thead>
        <tbody>
          {[
            ['audit_log', '4.280.182', '6.2 GB', '+8%', 12],
            ['meal_entries', '1.820.441', '3.8 GB', '+4%', 8],
            ['training_sets', '2.120.304', '2.4 GB', '+5%', 6],
            ['patients', '942', '48 MB', '+1%', 10],
            ['appointments', '12.480', '120 MB', '+2%', 7],
            ['files', '8.320', '1.2 GB', '+6%', 4],
          ].map((r, i) => (
            <tr key={i}>
              <td style={{ paddingLeft: 0, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r[0]}</td>
              <td>{r[1]}</td>
              <td>{r[2]}</td>
              <td style={{ color: 'var(--ok)' }}>{r[3]}</td>
              <td>{r[4]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

const TrainerAthletes = DoctorPatients;
const NutriPatients = DoctorPatients;
const NutriPlanBuilder = NutriHome;
const TrainerRoutineBuilder = TrainerHome;

// ───────── AUTH (desktop)
const AuthLogin = ({ setScreen }) => (
  <div className="auth-bg">
    <div className="auth-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <img src="assets/logo-white.png" alt="Omega" style={{ width: 32, height: 26, objectFit: 'contain' }}/>
        <div style={{ fontSize: 15, fontWeight: 600 }}><em style={{ fontFamily: 'var(--font-serif)', color: 'var(--omega)' }}>Omega</em> Medicina</div>
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.1 }}><em style={{ fontFamily: 'var(--font-serif)' }}>Bienvenido</em> de vuelta</h1>
      <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6, marginBottom: 24 }}>Ingresá a tu cuenta para continuar.</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="mono" style={{ display: 'block', marginBottom: 6 }}>Email</label>
          <input placeholder="tu@email.com" style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text-1)', fontSize: 14, fontFamily: 'inherit' }}/>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label className="mono">Contraseña</label>
            <button style={{ background: 'transparent', border: 0, color: 'var(--omega)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>¿Olvidaste?</button>
          </div>
          <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text-1)', fontSize: 14, fontFamily: 'inherit' }}/>
        </div>
      </div>

      <button onClick={() => setScreen('role-select')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 20, fontSize: 14 }}>Ingresar</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
        <span className="mono">o continuá con</span>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button className="btn btn-ghost" style={{ justifyContent: 'center', padding: 12 }}>Google</button>
        <button className="btn btn-ghost" style={{ justifyContent: 'center', padding: 12 }}>Apple</button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-2)' }}>
        ¿Sin cuenta? <button onClick={() => setScreen('create-profile')} style={{ background: 'transparent', border: 0, color: 'var(--omega)', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>Crear perfil</button>
      </div>
    </div>
  </div>
);

const AuthRoleSelect = ({ setRole, setScreen }) => {
  const [sel, setSel] = React.useState(null);
  const roles = [
    { id: 'patient', l: 'Paciente', s: 'Tus planes y consultas', c: 'var(--omega)', sc: 'var(--omega-soft)', ic: 'user' },
    { id: 'nutritionist', l: 'Nutricionista', s: 'Planes alimentarios', c: 'var(--nutri)', sc: 'var(--nutri-soft)', ic: 'apple' },
    { id: 'trainer', l: 'Entrenador personal', s: 'Rutinas y seguimientos', c: '#F16B57', sc: 'rgba(241,107,87,0.14)', ic: 'dumbbell' },
    { id: 'doctor', l: 'Médico', s: 'Consultas y expedientes', c: 'var(--medic)', sc: 'var(--medic-soft)', ic: 'heart' },
    { id: 'admin', l: 'Administrador', s: 'Gestión del sistema', c: 'var(--admin)', sc: 'rgba(201,195,186,0.14)', ic: 'shield' },
  ];
  return (
    <div className="auth-bg">
      <div style={{ width: '100%', maxWidth: 720 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <img src="assets/logo-white.png" alt="Omega" style={{ width: 28, height: 22 }}/>
            <div className="mono" style={{ color: 'var(--omega)' }}>Omega Medicina</div>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.03em' }}><em style={{ fontFamily: 'var(--font-serif)' }}>Elegí</em> tu experiencia</h1>
          <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 8 }}>Podés cambiar de rol en cualquier momento desde tu perfil.</div>
        </div>

        <div className="role-grid">
          {roles.map(r => (
            <button key={r.id} onClick={() => setSel(r.id)} className={'role-card ' + (sel === r.id ? 'sel' : '')} style={sel === r.id ? { background: r.sc, borderColor: r.c } : {}}>
              <div className="ic" style={{ background: r.sc, color: r.c }}><Icon name={r.ic} size={18}/></div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{r.l}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{r.s}</div>
            </button>
          ))}
        </div>

        <button disabled={!sel} onClick={() => { setRole(sel); setScreen('home'); }} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14, marginTop: 24, fontSize: 14, opacity: sel ? 1 : 0.4, cursor: sel ? 'pointer' : 'not-allowed' }}>Continuar</button>
      </div>
    </div>
  );
};

const AuthCreateProfile = ({ setScreen }) => {
  const [step, setStep] = React.useState(1);
  return (
    <div className="auth-bg">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <button onClick={() => step === 1 ? setScreen('login') : setStep(step - 1)} className="icon-btn"><Icon name="chevL" size={14}/></button>
          <div style={{ flex: 1 }}>
            <div className="mono">Paso {step} / 3</div>
            <div className="bar" style={{ marginTop: 4 }}><span style={{ width: (step / 3 * 100) + '%', background: 'var(--omega)' }}/></div>
          </div>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.03em' }}><em style={{ fontFamily: 'var(--font-serif)' }}>Creá</em> tu cuenta</h1>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6, marginBottom: 22 }}>Información básica para empezar.</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="mono" style={{ display: 'block', marginBottom: 6 }}>Nombre completo</label><input placeholder="Nombre y apellido" style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text-1)', fontSize: 14, fontFamily: 'inherit' }}/></div>
          <div><label className="mono" style={{ display: 'block', marginBottom: 6 }}>Email</label><input placeholder="tu@email.com" style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text-1)', fontSize: 14, fontFamily: 'inherit' }}/></div>
          <div><label className="mono" style={{ display: 'block', marginBottom: 6 }}>Contraseña</label><input type="password" placeholder="Mínimo 8 caracteres" style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text-1)', fontSize: 14, fontFamily: 'inherit' }}/></div>
        </div>

        <button onClick={() => step < 3 ? setStep(step + 1) : setScreen('role-select')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 22, fontSize: 14 }}>{step < 3 ? 'Continuar' : 'Crear cuenta'}</button>
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: 'var(--text-3)' }}>Al continuar aceptás los <span style={{ color: 'var(--omega)' }}>Términos</span> y la <span style={{ color: 'var(--omega)' }}>Política</span>.</div>
      </div>
    </div>
  );
};

Object.assign(window, {
  DoctorHome, DoctorPatients, DoctorPatientDetail,
  NutriHome, NutriPatients, NutriPlanBuilder,
  TrainerHome, TrainerAthletes, TrainerRoutineBuilder,
  AdminHome, AdminUsers, AdminAudit, AdminDB,
  AuthLogin, AuthRoleSelect, AuthCreateProfile,
});
