// Desktop patient screens
const PatientHome = () => (
  <>
    <div className="page-head">
      <div>
        <h1><em>Hola,</em> Juan</h1>
        <div className="sub">Martes, 6 de mayo · Tu salud en un vistazo</div>
      </div>
      <div className="actions">
        <button className="btn btn-ghost"><Icon name="calendar" size={14}/> Agendar consulta</button>
        <button className="btn btn-primary"><Icon name="plus" size={14}/> Check-in diario</button>
      </div>
    </div>

    <div className="grid-4" style={{ marginBottom: 14 }}>
      <KPI k="Adherencia" v="87%" delta="+4% vs semana pasada" dir="up" mod="analytics"/>
      <KPI k="Peso" v="78.2 kg" delta="-0.8 kg" dir="down" mod="medicine"/>
      <KPI k="Sueño" v="7h 12m" delta="Meta: 8h" mod="medicine"/>
      <KPI k="Sesiones" v="4/5" delta="Esta semana" dir="up" mod="training"/>
    </div>

    <div className="grid-2" style={{ marginBottom: 14 }}>
      <div className="card" data-mod="analytics">
        <div className="card-head">
          <h3>Progreso de 12 semanas</h3>
          <div className="mono">Composición corporal</div>
        </div>
        <ChartArea/>
        <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 12, color: 'var(--text-2)' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--omega)', borderRadius: 2, marginRight: 6 }}/>Peso (kg)</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--nutri)', borderRadius: 2, marginRight: 6 }}/>% Grasa</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--medic)', borderRadius: 2, marginRight: 6 }}/>Masa muscular</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Hoy</h3>
          <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }}>Ver semana</button>
        </div>
        <div className="row-list">
          {[
            { t: '07:30', l: 'Desayuno', d: 'Avena + frutos rojos + proteína', tag: 'nutrition', ic: 'apple' },
            { t: '12:00', l: 'Entrenamiento', d: 'Push Day · 55 min', tag: 'training', ic: 'dumbbell' },
            { t: '15:00', l: 'Consulta', d: 'Dra. Romero · Videoconsulta', tag: 'medicine', ic: 'heart' },
            { t: '19:00', l: 'Medicación', d: 'Omega-3 · 2 cápsulas', tag: 'medicine', ic: 'heart' },
          ].map((r, i) => (
            <div className="row" key={i}>
              <div className="mono" style={{ width: 44, color: 'var(--text-2)' }}>{r.t}</div>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `var(--${r.tag === 'nutrition' ? 'nutri' : r.tag === 'training' ? 'omega' : 'medic'}-soft)`, color: `var(--${r.tag === 'nutrition' ? 'nutri' : r.tag === 'training' ? 'omega' : 'medic'})`, display: 'grid', placeItems: 'center' }}>
                <Icon name={r.ic} size={14}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.l}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="grid-3">
      <div className="card" data-mod="training">
        <div className="card-head"><h3>Entrenamiento</h3><span className="mono">Semana 6</span></div>
        <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>Push Day</div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14 }}>Pecho, hombros, tríceps · 8 ejercicios</div>
        <Progress value={67} color="var(--omega)"/>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-3)' }}>
          <span>5 de 8 ejercicios</span>
          <span>52 min</span>
        </div>
      </div>
      <div className="card" data-mod="nutrition">
        <div className="card-head"><h3>Nutrición</h3><span className="mono">Hoy</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          {[['Prot', '142', '180'], ['Carb', '220', '280'], ['Gras', '58', '72']].map(([l, c, t]) => (
            <div key={l}>
              <div className="mono">{l}</div>
              <div style={{ fontSize: 18, fontWeight: 500, marginTop: 2 }}>{c}<span style={{ color: 'var(--text-3)', fontSize: 12 }}>/{t}</span></div>
            </div>
          ))}
        </div>
        <Progress value={72} color="var(--nutri)"/>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-3)' }}>
          <span>1.840 / 2.550 kcal</span>
          <span>72%</span>
        </div>
      </div>
      <div className="card" data-mod="medicine">
        <div className="card-head"><h3>Próxima consulta</h3><span className="mono">En 3 días</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Avatar name="Sofía Romero" color="linear-gradient(135deg, #4FB8A8, #1c5a52)" size={40}/>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Dra. Sofía Romero</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Medicina interna</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Viernes, 9 de mayo · 15:00</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>Videoconsulta · Control trimestral</div>
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>Ver detalle</button>
      </div>
    </div>
  </>
);

const ChartArea = () => {
  // Fake 12-week chart
  const pts = [
    { w: 82, f: 22, m: 58 }, { w: 81.6, f: 21.8, m: 58.2 }, { w: 81.2, f: 21.5, m: 58.5 },
    { w: 80.8, f: 21.2, m: 58.9 }, { w: 80.4, f: 20.9, m: 59.2 }, { w: 80, f: 20.5, m: 59.6 },
    { w: 79.7, f: 20.2, m: 59.9 }, { w: 79.4, f: 19.9, m: 60.1 }, { w: 79, f: 19.6, m: 60.4 },
    { w: 78.7, f: 19.3, m: 60.7 }, { w: 78.5, f: 19.0, m: 60.9 }, { w: 78.2, f: 18.7, m: 61.2 },
  ];
  const W = 640, H = 200, P = 20;
  const minY = 18, maxY = 82;
  const line = (key, color) => {
    const d = pts.map((p, i) => {
      const x = P + (i / (pts.length - 1)) * (W - 2 * P);
      const y = P + (1 - (p[key] - minY) / (maxY - minY)) * (H - 2 * P);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    return <path d={d} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 200 }}>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E23E4A" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#E23E4A" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map(i => <line key={i} x1={P} x2={W - P} y1={P + i * ((H - 2 * P) / 3)} y2={P + i * ((H - 2 * P) / 3)} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>)}
      {line('w', '#E23E4A')}
      {line('f', '#E8A93A')}
      {line('m', '#4FB8A8')}
    </svg>
  );
};

const PatientTraining = () => (
  <>
    <div className="page-head">
      <div><h1><em>Entrenamiento</em></h1><div className="sub">Fase 2 · Semana 6 de 12 · Hipertrofia</div></div>
      <div className="actions"><button className="btn btn-primary"><Icon name="plus" size={14}/> Iniciar sesión</button></div>
    </div>
    <div className="grid-2" style={{ marginBottom: 14 }}>
      <div className="card" data-mod="training">
        <div className="card-head"><h3>Plan semanal</h3><Chip variant="ok">Activo</Chip></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 12 }}>
          {['L','M','X','J','V','S','D'].map((d, i) => {
            const done = i < 3;
            const today = i === 3;
            const rest = i === 6 || i === 2;
            return (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 10, border: `1.5px solid ${today ? 'var(--omega)' : 'var(--line)'}`, background: done ? 'var(--omega-soft)' : 'var(--bg-2)', display: 'grid', placeItems: 'center', position: 'relative' }}>
                <span className="mono" style={{ color: today ? 'var(--omega)' : 'var(--text-3)' }}>{d}</span>
                {done && <span style={{ position: 'absolute', bottom: 6, color: 'var(--omega)' }}><Icon name="check" size={12}/></span>}
                {rest && !done && <span style={{ position: 'absolute', bottom: 6, fontSize: 9, color: 'var(--text-3)' }}>•</span>}
              </div>
            );
          })}
        </div>
        <div className="hr"/>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Split: Push / Pull / Piernas · 2 días descanso</div>
      </div>
      <div className="card" data-mod="training">
        <div className="card-head"><h3>Progresión de cargas</h3><span className="mono">Press banca</span></div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, padding: '10px 0' }}>
          {[62.5, 65, 65, 67.5, 67.5, 70].map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{v}</div>
              <div style={{ width: '100%', height: `${(v - 55) * 7}px`, background: 'var(--omega)', borderRadius: '4px 4px 0 0', opacity: 0.4 + i * 0.1 }}/>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>S{i + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="card" data-mod="training">
      <div className="card-head"><h3>Sesión de hoy · Push Day</h3><span className="mono">55 min estimado</span></div>
      <table className="table">
        <thead><tr><th>Ejercicio</th><th>Series × Reps</th><th>Peso</th><th>Última sesión</th><th>Notas</th></tr></thead>
        <tbody>
          {[
            ['Press banca plano', '4 × 8', '70 kg', '67.5 kg × 8', 'RPE 7'],
            ['Press inclinado con mancuernas', '3 × 10', '26 kg', '24 kg × 10', '—'],
            ['Aperturas en polea', '3 × 12', '15 kg', '15 kg × 12', 'Contracción lenta'],
            ['Press militar barra', '4 × 8', '45 kg', '42.5 kg × 8', 'RPE 8'],
            ['Elevaciones laterales', '4 × 12', '10 kg', '10 kg × 12', 'Drop set última'],
            ['Extensión tríceps polea', '3 × 12', '30 kg', '27.5 kg × 12', '—'],
            ['Fondos', '3 × AMRAP', 'Peso corporal', '12, 10, 9', 'Descenso controlado'],
            ['Press francés', '3 × 10', '22 kg', '22 kg × 10', 'Última'],
          ].map((r, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 500 }}>{r[0]}</td>
              <td>{r[1]}</td>
              <td><span style={{ color: 'var(--omega)', fontWeight: 500 }}>{r[2]}</span></td>
              <td style={{ color: 'var(--text-2)' }}>{r[3]}</td>
              <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{r[4]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

const PatientNutrition = () => (
  <>
    <div className="page-head">
      <div><h1><em>Nutrición</em></h1><div className="sub">Plan personalizado · 2.550 kcal objetivo</div></div>
      <div className="actions"><button className="btn btn-ghost"><Icon name="search" size={14}/> Buscar alimento</button><button className="btn btn-primary"><Icon name="plus" size={14}/> Registrar comida</button></div>
    </div>

    <div className="grid-4" style={{ marginBottom: 14 }}>
      <KPI k="Calorías hoy" v="1.840" delta="710 kcal restantes" mod="nutrition"/>
      <KPI k="Proteína" v="142g" delta="Meta 180g · 79%" dir="up" mod="nutrition"/>
      <KPI k="Agua" v="2.1 L" delta="Meta 3 L" mod="nutrition"/>
      <KPI k="Adherencia 7d" v="91%" delta="Excelente" dir="up" mod="nutrition"/>
    </div>

    <div className="grid-2">
      <div className="card" data-mod="nutrition">
        <div className="card-head"><h3>Comidas de hoy</h3><Chip variant="warn">1 pendiente</Chip></div>
        {[
          { m: 'Desayuno', t: '07:30', i: 'Avena + frutos rojos + whey', k: 420, done: true },
          { m: 'Colación', t: '10:30', i: 'Yogur griego + almendras', k: 280, done: true },
          { m: 'Almuerzo', t: '13:00', i: 'Pollo + quinoa + vegetales', k: 620, done: true },
          { m: 'Merienda', t: '16:30', i: 'Tostadas + palta + huevo', k: 380, done: true },
          { m: 'Cena', t: '20:30', i: 'Salmón + batata + ensalada', k: 710, done: false },
        ].map((r, i) => (
          <div key={i} className="row-list">
            <div className="row" style={{ padding: '14px 0' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: r.done ? 'var(--nutri-soft)' : 'var(--bg-2)', color: r.done ? 'var(--nutri)' : 'var(--text-3)', display: 'grid', placeItems: 'center' }}>
                {r.done ? <Icon name="check" size={16}/> : <Icon name="plus" size={16}/>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{r.m}</div>
                  <div className="mono">{r.t}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{r.i}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{r.k}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>kcal</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" data-mod="nutrition">
        <div className="card-head"><h3>Macros</h3><span className="mono">Distribución</span></div>
        <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
          <MacroRing pct={79} color="var(--omega)" label="Proteína" value="142 / 180g"/>
          <MacroRing pct={78} color="var(--nutri)" label="Carbos" value="220 / 280g"/>
          <MacroRing pct={80} color="var(--medic)" label="Grasas" value="58 / 72g"/>
        </div>
        <div className="hr"/>
        <div className="mono" style={{ marginTop: 14, marginBottom: 8 }}>Adherencia últimos 7 días</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[92, 88, 95, 79, 91, 86, 94].map((v, i) => (
            <div key={i} style={{ flex: 1, height: 40, background: 'var(--bg-2)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: v + '%', background: 'var(--nutri)', opacity: 0.7 }}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

const MacroRing = ({ pct, color, label, value }) => {
  const r = 28, c = 2 * Math.PI * r;
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={`${c * pct / 100} ${c}`} strokeLinecap="round"/>
      </svg>
      <div style={{ fontSize: 20, fontWeight: 500, marginTop: -52, color: 'var(--text-1)' }}>{pct}%</div>
      <div style={{ marginTop: 36, fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{value}</div>
    </div>
  );
};

const PatientProgress = () => (
  <>
    <div className="page-head">
      <div><h1><em>Progreso</em></h1><div className="sub">12 semanas · desde 15 feb 2026</div></div>
      <div className="actions"><button className="btn btn-ghost">Compartir con médico</button><button className="btn btn-primary"><Icon name="plus" size={14}/> Nueva medición</button></div>
    </div>
    <div className="grid-4" style={{ marginBottom: 14 }}>
      <KPI k="Peso" v="78.2 kg" delta="-3.8 kg en 12 sem" dir="down" mod="analytics"/>
      <KPI k="% Grasa corporal" v="18.7%" delta="-3.3 pts" dir="down" mod="analytics"/>
      <KPI k="Masa muscular" v="61.2 kg" delta="+3.2 kg" dir="up" mod="analytics"/>
      <KPI k="Cintura" v="84 cm" delta="-6 cm" dir="down" mod="analytics"/>
    </div>
    <div className="card" data-mod="analytics" style={{ marginBottom: 14 }}>
      <div className="card-head"><h3>Evolución</h3><div style={{ display: 'flex', gap: 4 }}>{['1M', '3M', '6M', '1A'].map((t, i) => <button key={t} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11, background: i === 1 ? 'var(--omega-soft)' : 'var(--bg-2)', color: i === 1 ? 'var(--omega)' : 'var(--text-2)' }}>{t}</button>)}</div></div>
      <ChartArea/>
    </div>
    <div className="grid-2">
      <div className="card"><div className="card-head"><h3>Histórico de mediciones</h3></div>
        <table className="table">
          <thead><tr><th>Fecha</th><th>Peso</th><th>% Grasa</th><th>Músculo</th><th>Cintura</th></tr></thead>
          <tbody>{[
            ['06/05', '78.2', '18.7%', '61.2', '84'],
            ['22/04', '78.9', '19.3%', '60.7', '85.5'],
            ['08/04', '79.4', '19.9%', '60.1', '86.5'],
            ['25/03', '80.0', '20.5%', '59.6', '88'],
            ['11/03', '80.8', '21.2%', '58.9', '89'],
            ['25/02', '81.6', '21.8%', '58.2', '89.5'],
            ['15/02', '82.0', '22.0%', '58.0', '90'],
          ].map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={j === 0 ? { color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 12 } : {}}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="card"><div className="card-head"><h3>Objetivos</h3><span className="mono">Del plan</span></div>
        {[
          { l: 'Bajar a 75 kg', p: 73, v: '78.2 / 75 kg', c: 'var(--omega)' },
          { l: '% Grasa < 15%', p: 58, v: '18.7 / 15%', c: 'var(--nutri)' },
          { l: 'Press banca 80 kg', p: 87, v: '70 / 80 kg', c: 'var(--medic)' },
          { l: '10.000 pasos diarios', p: 94, v: '9.400 prom.', c: 'var(--analytic)' },
        ].map((g, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>{g.l}</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{g.v}</span>
            </div>
            <Progress value={g.p} color={g.c}/>
          </div>
        ))}
      </div>
    </div>
  </>
);

const PatientMedicine = () => (
  <>
    <div className="page-head">
      <div><h1><em>Medicina</em></h1><div className="sub">Historia clínica, medicación y estudios</div></div>
      <div className="actions"><button className="btn btn-ghost"><Icon name="upload" size={14}/> Subir estudio</button><button className="btn btn-primary">Nueva consulta</button></div>
    </div>
    <div className="grid-2" style={{ marginBottom: 14 }}>
      <div className="card" data-mod="medicine">
        <div className="card-head"><h3>Medicación actual</h3><Chip variant="ok">Al día</Chip></div>
        {[
          { n: 'Omega-3', d: '2 cápsulas · diario', p: 'Mañana' },
          { n: 'Vitamina D3', d: '1000 UI · diario', p: 'Mañana' },
          { n: 'Magnesio', d: '300 mg · noche', p: 'Antes de dormir' },
          { n: 'Creatina', d: '5 g · diario', p: 'Post-entreno' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid var(--line)' : 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--medic-soft)', color: 'var(--medic)', display: 'grid', placeItems: 'center' }}><Icon name="heart" size={16}/></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.n}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.d}</div>
            </div>
            <div className="mono" style={{ color: 'var(--text-2)' }}>{r.p}</div>
          </div>
        ))}
      </div>
      <div className="card" data-mod="medicine">
        <div className="card-head"><h3>Últimos estudios</h3><button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>Ver todos</button></div>
        {[
          { n: 'Análisis de sangre completo', d: '28 abr 2026', s: 'ok', sl: 'Normal' },
          { n: 'Perfil lipídico', d: '28 abr 2026', s: 'warn', sl: 'LDL alto' },
          { n: 'Vitamina D', d: '28 abr 2026', s: 'ok', sl: 'Óptimo' },
          { n: 'ECG en reposo', d: '15 mar 2026', s: 'ok', sl: 'Normal' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid var(--line)' : 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-2)', color: 'var(--text-2)', display: 'grid', placeItems: 'center' }}><Icon name="file" size={16}/></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.n}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.d}</div>
            </div>
            <Chip variant={r.s}>{r.sl}</Chip>
          </div>
        ))}
      </div>
    </div>
  </>
);

const PatientAppointments = () => (
  <>
    <div className="page-head">
      <div><h1><em>Consultas</em></h1><div className="sub">Agenda y videoconsultas</div></div>
      <div className="actions"><button className="btn btn-primary"><Icon name="plus" size={14}/> Solicitar turno</button></div>
    </div>
    <AgendaGrid/>
  </>
);

const AgendaGrid = () => {
  const days = ['Lun 5', 'Mar 6', 'Mié 7', 'Jue 8', 'Vie 9', 'Sáb 10', 'Dom 11'];
  const hours = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'];
  const events = [
    { d: 0, h: 1, dur: 1, t: 'Entrenamiento', cls: 'train', sub: 'Push day · 55 min' },
    { d: 1, h: 7, dur: 1, t: 'Consulta nutrición', cls: 'nutri', sub: 'Lic. Torres' },
    { d: 3, h: 4, dur: 1, t: 'Entrenamiento', cls: 'train', sub: 'Pull day' },
    { d: 4, h: 7, dur: 1, t: 'Dra. Romero', cls: '', sub: 'Control trimestral' },
    { d: 5, h: 2, dur: 2, t: 'Entrenamiento', cls: 'train', sub: 'Piernas · 75 min' },
  ];
  return (
    <div className="agenda-grid">
      <div className="col-head">&nbsp;</div>
      {days.map(d => <div key={d} className="col-head">{d}</div>)}
      {hours.map((h, hi) => (
        <React.Fragment key={h}>
          <div className="hour">{h}:00</div>
          {days.map((_, di) => {
            const evt = events.find(e => e.d === di && e.h === hi);
            return (
              <div key={di} className="cell">
                {evt && (
                  <div className={`evt ${evt.cls}`} style={{ height: `calc(${evt.dur * 100}% - 8px)` }}>
                    <div style={{ fontWeight: 500 }}>{evt.t}</div>
                    <div style={{ color: 'var(--text-3)', fontSize: 10, marginTop: 2 }}>{evt.sub}</div>
                  </div>
                )}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

Object.assign(window, { PatientHome, PatientTraining, PatientNutrition, PatientProgress, PatientMedicine, PatientAppointments, AgendaGrid, ChartArea, MacroRing });
