// Patient-side screens for Omega Medicina
const { useState: usePS, useEffect: useEP } = React;

// ───────── HOME (patient dashboard)
function PatientHome({ setScreen }) {
  return (
    <ModuleScreen module="home">
      <div style={{ padding: '8px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div className="mono" style={{ color: 'var(--text-3)' }}>Lunes · 20 Abr</div>
            <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 4 }}>
              Hola, <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Diego</em>
            </div>
          </div>
          <Avatar name="Diego Alejandro"/>
        </div>

        {/* Health score hero */}
        <div className="card" style={{ background: 'linear-gradient(160deg, rgba(226,62,74,0.14), rgba(79,184,168,0.08)), var(--bg-1)', padding: 18 }}>
          <div className="row-between">
            <div className="mono" style={{ color: 'var(--text-2)' }}>Health Index · hoy</div>
            <Icon name="chevron-right" size={16} color="var(--text-3)"/>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 10 }}>
            <div style={{ fontSize: 54, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1 }}>78</div>
            <div style={{ color: 'var(--ok)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon name="arrow-up" size={12} color="var(--ok)"/> +4 vs ayer
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 14 }}>
            {[
              { k: 'Sueño', v: 82, c: 'var(--analytic)' },
              { k: 'Nutri', v: 64, c: 'var(--nutri)' },
              { k: 'Entreno', v: 88, c: 'var(--omega)' },
              { k: 'Ánimo', v: 75, c: 'var(--medic)' },
            ].map(s => (
              <div key={s.k}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.k}</div>
                <div style={{ fontSize: 18, fontWeight: 500, marginTop: 2, color: s.c }}>{s.v}</div>
                <div className="bar" style={{ marginTop: 4 }}><span style={{ width: s.v + '%', background: s.c }}/></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modules quick-access */}
      <div style={{ padding: '20px 20px 0' }}>
        <div className="section-label">Módulos</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { m: 'training', label: 'Entrenamiento', sub: 'Hoy: 4 ejercicios', icon: 'training', screen: 'training-plan', c: 'var(--omega)' },
            { m: 'nutrition', label: 'Nutrición', sub: '0 / 1832 kcal', icon: 'nutrition', screen: 'nutrition', c: 'var(--nutri)' },
            { m: 'medicine', label: 'Medicina', sub: 'Cita mañana 11:00', icon: 'medicine', screen: 'appointments', c: 'var(--medic)' },
            { m: 'analytics', label: 'Performance', sub: 'Clock semanal', icon: 'target', screen: 'performance', c: 'var(--analytic)' },
          ].map(t => (
            <button key={t.m} onClick={() => setScreen(t.screen)} style={{
              background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 14,
              padding: 14, textAlign: 'left', cursor: 'pointer', color: 'var(--text-1)',
              fontFamily: 'var(--font-sans)',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: t.c + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.c }}>
                <Icon name={t.icon} size={18}/>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 10 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{t.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Today agenda */}
      <div style={{ padding: '24px 20px 0' }}>
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="section-label" style={{ margin: 0 }}>Hoy</div>
          <div className="mono" style={{ color: 'var(--text-3)' }}>3 eventos</div>
        </div>
        <div className="card" style={{ padding: 0 }}>
          {[
            { t: '09:00', title: 'Check-in diario', sub: 'Sueño, ánimo, dolor', icon: 'heart', c: 'var(--medic)', onClick: () => setScreen('checkin') },
            { t: '13:00', title: 'Almuerzo — 313 kcal', sub: 'Pollo · Papa · Olivas', icon: 'nutrition', c: 'var(--nutri)', onClick: () => setScreen('nutrition') },
            { t: '18:30', title: 'Sesión: Piernas', sub: '4 ejercicios · 30 min', icon: 'dumbbell', c: 'var(--omega)', onClick: () => setScreen('training-plan') },
          ].map((e, i) => (
            <div key={i} onClick={e.onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderTop: i ? '1px solid var(--line)' : 0, cursor: 'pointer' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)', width: 36 }}>{e.t}</div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: e.c + '1a', color: e.c, display: 'grid', placeItems: 'center' }}>
                <Icon name={e.icon} size={16}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{e.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{e.sub}</div>
              </div>
              <Icon name="chevron-right" size={16} color="var(--text-3)"/>
            </div>
          ))}
        </div>
      </div>

      {/* Fase */}
      <div style={{ padding: '24px 20px 0' }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="row-between">
            <div>
              <div className="mono" style={{ color: 'var(--text-2)' }}>Fase actual</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>Ganancia Muscular</div>
            </div>
            <div className="chip accent" style={{ background: 'var(--nutri-soft)', color: 'var(--nutri)', borderColor: 'rgba(232,169,58,0.3)' }}>7 semanas</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: 'var(--text-2)' }}>
            <span>65,0 kg</span>
            <span>70,0 kg</span>
          </div>
          <div className="bar" style={{ marginTop: 6 }}><span style={{ width: '20%', background: 'var(--nutri)' }}/></div>
        </div>
      </div>
    </ModuleScreen>
  );
}

// ───────── TRAINING PLAN (next session preview)
function TrainingPlan({ setScreen, openSheet }) {
  const [showPlan, setShowPlan] = usePS(false);
  const [showMenu, setShowMenu] = usePS(false);
  const exercises = [
    { name: 'Sentadilla Trasera', sets: 4, reps: 8, weight: '57,5 kg', muscle: 'Piernas' },
    { name: 'Peso Muerto', sets: 5, reps: 5, weight: '85 kg', muscle: 'Posterior' },
    { name: 'Hip Thrust con Barra', sets: 3, reps: 10, weight: '52,5 kg', muscle: 'Glúteo' },
    { name: 'Crunches', sets: 5, reps: 17, weight: 'Corporal', muscle: 'Core' },
  ];
  return (
    <ModuleScreen module="training">
      <div style={{ padding: '8px 20px 0' }}>
        <div className="row-between">
          <button onClick={() => setShowPlan(true)} style={{ background: 'transparent', border: 0, color: 'var(--text-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}>
            <Avatar name="Diego A" color="#E23E4A"/>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Mi Plan</span>
            <Icon name="chevron-right" size={14} color="var(--omega)"/>
          </button>
          <div className="module-pill">Entrenamiento</div>
        </div>
      </div>

      <div style={{ padding: '22px 20px 0' }}>
        <div className="card" style={{ padding: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'radial-gradient(circle at top right, rgba(226,62,74,0.2), transparent)', pointerEvents: 'none' }}/>
          <div className="row-between">
            <div>
              <div className="display" style={{ fontSize: 30 }}><em>Siguiente</em></div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>4 Ejercicios · 4 Músculos · 30 min</div>
            </div>
            <button onClick={() => setShowMenu(true)} style={{ background: 'transparent', border: 0, color: 'var(--text-1)', cursor: 'pointer' }}>
              <Icon name="more" size={20}/>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <div className="chip">30m ▾</div>
            <div className="chip">Omega Gym ▾</div>
            <div className="chip accent" style={{ background: 'var(--omega-soft)', color: 'var(--omega)', borderColor: 'rgba(226,62,74,0.3)', marginLeft: 'auto' }}>
              ↺ Cambiar
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          {exercises.map((e, i) => (
            <div key={i} onClick={() => setScreen('exercise-detail')} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
              borderBottom: '1px solid var(--line)', cursor: 'pointer', position: 'relative',
            }}>
              {/* timeline dot */}
              <div style={{ position: 'absolute', left: 28, top: 64, bottom: i === exercises.length - 1 ? 14 : -2, width: 1, background: 'var(--line)', display: i === exercises.length - 1 ? 'none' : 'block' }}/>
              <div className="ph-img" style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 10 }}>ex</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{e.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{e.sets} series · {e.reps} reps · {e.weight}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: 'var(--text-3)' }}>
                <Icon name="arrow-up" size={14} color="var(--ok)"/>
                <Icon name="more" size={14}/>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary btn-full" style={{ marginTop: 22 }} onClick={() => setScreen('session-active')}>
          <em style={{ fontFamily: 'var(--font-serif)' }}>Iniciar</em> Entrenamiento
        </button>

        <div style={{ marginTop: 18 }}>
          <div className="section-label">Tu progreso</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <StatTile k="Racha" v="0" d="semanas" module="omega"/>
            <StatTile k="Sesiones" v="231" d="totales"/>
            <StatTile k="Volumen" v="12.4t" d="esta semana"/>
          </div>
          <div onClick={() => setScreen('training-stats')} className="card" style={{ marginTop: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="data" size={18} color="var(--omega)"/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Fuerza general & benchmarks</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>mSTRENGTH por grupo muscular</div>
            </div>
            <Icon name="chevron-right" size={16} color="var(--text-3)"/>
          </div>
        </div>
      </div>

      {/* Plan sheet */}
      {showPlan && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowPlan(false)}/>
          <div className="sheet">
            <div className="sheet-handle"/>
            <div className="row-between" style={{ marginBottom: 14 }}>
              <div/>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Mi Plan</div>
              <button onClick={() => setShowPlan(false)} style={{ background: 'transparent', border: 0, color: 'var(--omega)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Listo</button>
            </div>
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(79,184,168,0.2), rgba(79,184,168,0.08))', border: '1px solid rgba(79,184,168,0.3)', marginBottom: 12 }}>
              <div className="row-between">
                <div>
                  <div className="mono" style={{ color: 'var(--medic)' }}>Meta</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Mejorar Condición Física</div>
                </div>
                <Icon name="chevron-right" size={16} color="var(--medic)"/>
              </div>
            </div>
            <div className="card" style={{ padding: 0 }}>
              {[
                ['Lesiones / Limitaciones', null, 'BETA'],
                ['Equipo', '7 Seleccionado(s)', null],
                ['Entrenamientos / Sem.', '5', null],
                ['Duración', '30 min', null],
                ['Experiencia', 'Avanzado', null],
              ].map((r, i) => (
                <div key={i} className="row-between" style={{ padding: 14, borderTop: i ? '1px solid var(--line)' : 0 }}>
                  <span style={{ fontSize: 13 }}>{r[0]}{r[2] && <span className="chip" style={{ marginLeft: 6, fontSize: 9, padding: '2px 6px' }}>{r[2]}</span>}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>{r[1]} <Icon name="chevron-right" size={14} color="var(--text-3)"/></span>
                </div>
              ))}
            </div>
            <div className="section-label" style={{ marginTop: 16 }}>Preferencias</div>
            <div className="card" style={{ padding: 0 }}>
              {[
                ['Unidades', 'kg'],
                ['Cardio', 'Apagado'],
                ['Estiramiento', 'Apagado'],
              ].map((r, i) => (
                <div key={i} className="row-between" style={{ padding: 14, borderTop: i ? '1px solid var(--line)' : 0 }}>
                  <span style={{ fontSize: 13 }}>{r[0]}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{r[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Menu sheet */}
      {showMenu && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowMenu(false)}/>
          <div className="sheet" style={{ maxHeight: '40%' }}>
            <div className="sheet-handle"/>
            {[
              ['file', 'Guardar entrenamiento'],
              ['training', 'Crear superset o circuito'],
              ['upload', 'Compartir link'],
              ['history', 'Actualizar entrenamiento'],
            ].map(([i, l], k) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 4px', borderTop: k ? '1px solid var(--line)' : 0 }}>
                <Icon name={i} size={18} color="var(--text-1)"/>
                <span style={{ fontSize: 14 }}>{l}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </ModuleScreen>
  );
}

// ───────── ACTIVE SESSION (no tab bar)
function SessionActive({ setScreen }) {
  const [currentSet, setCurrentSet] = usePS(2);
  const [restTime, setRestTime] = usePS(90);
  const [resting, setResting] = usePS(false);

  useEP(() => {
    if (!resting) return;
    const t = setInterval(() => setRestTime(x => {
      if (x <= 1) { setResting(false); return 90; }
      return x - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [resting]);

  const totalSets = 4;
  return (
    <ModuleScreen module="training">
      <div style={{ padding: '54px 20px 0', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="row-between" style={{ marginBottom: 8 }}>
          <button onClick={() => setScreen('training-plan')} style={{ background: 'transparent', border: 0, color: 'var(--text-1)', cursor: 'pointer' }}>
            <Icon name="close" size={22}/>
          </button>
          <div className="mono">Ejercicio 1 / 4</div>
          <Icon name="settings" size={20} color="var(--text-2)"/>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="module-pill">En sesión</div>
          <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 8 }}>
            <em style={{ fontFamily: 'var(--font-serif)' }}>Sentadilla</em> Trasera
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Piernas · Cuádriceps · Glúteos</div>
        </div>

        <div className="card" style={{ marginTop: 16, padding: 0, overflow: 'hidden' }}>
          <div className="ph-img" style={{ height: 140, borderRadius: 0 }}>ejercicio · video demo</div>
        </div>

        {/* Set tracker */}
        <div style={{ marginTop: 18 }}>
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div className="section-label" style={{ margin: 0 }}>Serie {currentSet} / {totalSets}</div>
            <div className="mono">57,5 kg · 8 reps</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: totalSets }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 6, borderRadius: 100,
                background: i < currentSet - 1 ? 'var(--omega)' : i === currentSet - 1 ? 'var(--omega)' : 'rgba(255,255,255,0.08)',
                opacity: i < currentSet ? 1 : 0.4,
              }}/>
            ))}
          </div>
        </div>

        {/* Weight / reps inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
          <div className="card" style={{ padding: 14, textAlign: 'center' }}>
            <div className="mono" style={{ color: 'var(--text-2)' }}>Peso</div>
            <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 4 }}>57,5</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>kg</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 8, justifyContent: 'center' }}>
              <button style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-2)', border: 0, color: 'var(--text-1)', cursor: 'pointer' }}>−</button>
              <button style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-2)', border: 0, color: 'var(--text-1)', cursor: 'pointer' }}>+</button>
            </div>
          </div>
          <div className="card" style={{ padding: 14, textAlign: 'center' }}>
            <div className="mono" style={{ color: 'var(--text-2)' }}>Reps</div>
            <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 4 }}>8</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>objetivo</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 8, justifyContent: 'center' }}>
              <button style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-2)', border: 0, color: 'var(--text-1)', cursor: 'pointer' }}>−</button>
              <button style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-2)', border: 0, color: 'var(--text-1)', cursor: 'pointer' }}>+</button>
            </div>
          </div>
        </div>

        {resting ? (
          <div style={{ marginTop: 18, padding: 20, borderRadius: 16, background: 'var(--omega-soft)', border: '1px solid rgba(226,62,74,0.3)', textAlign: 'center' }}>
            <div className="mono" style={{ color: 'var(--omega)' }}>Descanso</div>
            <div style={{ fontSize: 52, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 4, color: 'var(--omega)' }}>0:{String(restTime).padStart(2, '0')}</div>
            <button onClick={() => { setResting(false); setRestTime(90); }} className="btn btn-ghost" style={{ marginTop: 10, padding: '10px 18px' }}>Saltar descanso</button>
          </div>
        ) : (
          <button className="btn btn-primary btn-full" style={{ marginTop: 18 }} onClick={() => { setCurrentSet(s => Math.min(totalSets, s + 1)); setResting(true); }}>
            <Icon name="check" size={18}/> Completar serie
          </button>
        )}

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1, padding: '12px 14px', fontSize: 13 }}>Anterior</button>
          <button className="btn btn-ghost" style={{ flex: 1, padding: '12px 14px', fontSize: 13 }}>Siguiente ejercicio</button>
        </div>
      </div>
    </ModuleScreen>
  );
}

// ───────── EXERCISE DETAIL / PROGRESSION
function ExerciseDetail({ setScreen }) {
  const [period, setPeriod] = usePS('Mes');
  const periods = ['Semana', 'Mes', '6 Meses', 'Año'];
  const data = period === 'Mes' ? [113, 114, 115, 117] : period === 'Semana' ? [115, 116, 115, 117, 117] : [112, 112, 113, 113, 117];
  return (
    <ModuleScreen module="training">
      <div style={{ padding: '8px 20px 0' }}>
        <div className="row-between">
          <button onClick={() => setScreen('training-plan')} style={{ background: 'transparent', border: 0, color: 'var(--omega)', cursor: 'pointer' }}>
            <Icon name="chevron-left" size={22} color="var(--omega)"/>
          </button>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Peso Muerto</div>
          <Icon name="upload" size={18} color="var(--omega)"/>
        </div>

        {/* Period tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg-2)', borderRadius: 10, marginTop: 16 }}>
          {periods.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              flex: 1, padding: '7px 0', borderRadius: 8, border: 0, cursor: 'pointer',
              background: period === p ? 'var(--bg-3)' : 'transparent',
              color: period === p ? 'var(--text-1)' : 'var(--text-2)',
              fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-sans)',
            }}>{p}</button>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <div className="mono" style={{ color: 'var(--omega)' }}>▪ 1RM ESTIMADO</div>
          <div style={{ fontSize: 38, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 4 }}>112,9–117,0 <span style={{ fontSize: 14, color: 'var(--text-2)' }}>kg en 1 rep</span></div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>24 mar – 20 abr</div>
        </div>

        {/* Chart */}
        <div className="card" style={{ marginTop: 16, padding: 14, paddingRight: 24 }}>
          <svg viewBox="0 0 300 140" style={{ width: '100%', height: 140 }}>
            {[111, 113, 115, 117, 119].map((v, i) => (
              <React.Fragment key={v}>
                <line x1="20" y1={20 + i * 25} x2="290" y2={20 + i * 25} stroke="rgba(255,255,255,0.06)"/>
                <text x="295" y={24 + i * 25} fill="var(--text-3)" fontSize="9" fontFamily="var(--font-mono)">{v}</text>
              </React.Fragment>
            ))}
            {data.map((v, i) => {
              const x = 30 + (i * (250 / (data.length - 1)));
              const y = 20 + (119 - v) * (100 / 8);
              return (
                <React.Fragment key={i}>
                  {i > 0 && <line x1={30 + ((i - 1) * (250 / (data.length - 1)))} y1={20 + (119 - data[i - 1]) * (100 / 8)} x2={x} y2={y} stroke="var(--omega)" strokeWidth="2"/>}
                  <circle cx={x} cy={y} r="4" fill="var(--omega)"/>
                </React.Fragment>
              );
            })}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 6, paddingLeft: 16 }}>
            {['23–29', '30–5', '6–12', '13–19', '20–26'].map(d => <span key={d}>{d}</span>)}
          </div>
        </div>

        <div className="card" style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Récord Personal (PR)</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>146,1 kg</span>
        </div>
        <div className="card" style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Tu Promedio</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>119,3 kg</span>
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="display" style={{ fontSize: 22 }}><em>Rep</em> Máxima Estimada</div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8, lineHeight: 1.6 }}>
            El 1RM estimado se calcula con los datos de tus series y progresiones registradas. Se actualiza tras cada sesión.
          </p>
        </div>
      </div>
    </ModuleScreen>
  );
}

// ───────── TRAINING STATS (Cuerpo)
function TrainingStats({ setScreen }) {
  const [tab, setTab] = usePS('Resultados');
  return (
    <ModuleScreen module="training">
      <div style={{ padding: '8px 20px 0' }}>
        <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg-2)', borderRadius: 10 }}>
          {['Resultados', 'Recuperación'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 0, cursor: 'pointer',
              background: tab === t ? 'var(--bg-3)' : 'transparent',
              color: tab === t ? 'var(--text-1)' : 'var(--text-2)',
              fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-sans)',
            }}>{t}</button>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <div className="row-between">
            <div className="display" style={{ fontSize: 26 }}><em>Fuerza</em> General</div>
            <Icon name="chevron-right" size={16} color="var(--omega)"/>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
            <div style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1 }}>69</div>
            <div style={{ display: 'flex', gap: 3 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ width: 14, height: 28, background: i < 6 ? '#F2D35F' : 'rgba(255,255,255,0.08)', transform: 'skewX(-20deg)', borderRadius: 2 }}/>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { name: 'Músculos de empuje', val: 65, c: '#F2D35F' },
            { name: 'Músculos de jalón', val: 66, c: 'var(--omega)' },
            { name: 'Músculos de piernas', val: 75, c: 'var(--medic)' },
          ].map(m => (
            <div key={m.name} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>{m.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                  <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>{m.val}</div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: m.c, textTransform: 'uppercase', letterSpacing: '0.08em' }}>mSTRENGTH</div>
                </div>
              </div>
              <div style={{ width: 28, height: 40, borderRadius: 6, background: m.c + '22', display: 'grid', placeItems: 'center' }}>
                <div style={{ width: 8, height: 20, background: m.c, borderRadius: 2 }}/>
              </div>
              <Icon name="chevron-right" size={16} color="var(--text-3)"/>
            </div>
          ))}
        </div>

        {/* Benchmark */}
        <div style={{ marginTop: 22 }}>
          <div className="display" style={{ fontSize: 22 }}><em>Benchmark</em> Lifts</div>
          <div onClick={() => setScreen('exercise-detail')} className="card" style={{ marginTop: 10, padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="mono" style={{ color: 'var(--text-2)' }}>Deadlift</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>1RM Estimado</div>
                <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 4 }}>117,0 <span style={{ fontSize: 12, color: 'var(--text-2)' }}>kg en 1 rep</span></div>
              </div>
              <div className="ph-img" style={{ width: 72, height: 72, borderRadius: 10 }}>lift</div>
            </div>
            <div style={{ padding: '0 14px 14px' }}>
              <Sparkline points={[113, 113, 114, 115, 117]} color="var(--omega)" height={40} width={330}/>
            </div>
          </div>
        </div>

        {/* Weekly goals hexagon */}
        <div style={{ marginTop: 22 }}>
          <div className="display" style={{ fontSize: 22 }}><em>Objetivos</em> Semanales</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>20 abr – 26 abr</div>
          <div className="card" style={{ marginTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20 }}>
            <svg viewBox="-75 -75 150 150" style={{ width: 140, height: 140 }}>
              <polygon points="0,-60 52,-30 52,30 0,60 -52,30 -52,-30" fill="none" stroke="url(#hex)" strokeWidth="6" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="hex" x1="0" y1="-60" x2="0" y2="60">
                  <stop offset="0" stopColor="#4FB8A8"/>
                  <stop offset="0.5" stopColor="#F2D35F"/>
                  <stop offset="1" stopColor="#E23E4A"/>
                </linearGradient>
              </defs>
              <text x="0" y="6" textAnchor="middle" fontSize="22" fontWeight="600" fill="var(--text-1)" fontFamily="var(--font-sans)">0%</text>
            </svg>
          </div>
        </div>
      </div>
    </ModuleScreen>
  );
}

// ───────── NUTRITION (plan of the day)
function Nutrition({ setScreen, openSheet }) {
  const [day, setDay] = usePS(20);
  const meals = [
    { name: 'Desayuno', kcal: 0, p: 0, c: 0, g: 0, items: [] },
    { name: 'Media Mañana', kcal: 91, p: 2, c: 17, g: 1, items: [{ name: 'Apple', q: '1 und (182 g)', kcal: 91 }] },
    { name: 'Almuerzo', kcal: 313, p: 26, c: 33, g: 9, items: [
      { name: 'Chicken', q: '100 g · peso crudo', kcal: 120, emoji: '🍗' },
      { name: 'Potato', q: '3/4 cup (150 g)', kcal: 129, emoji: '🥔' },
      { name: 'Olives', q: '11 count (55 g)', kcal: 64, emoji: '🫒' },
    ] },
    { name: 'Merienda', kcal: 268, p: 15, c: 17, g: 17, items: [
      { name: 'Peanuts', q: '2 tablespoon (28 g)', kcal: 159, emoji: '🥜', done: true },
      { name: 'Milk', q: '1 cup (240 ml)', kcal: 110, emoji: '🥛' },
    ] },
    { name: 'Cena', kcal: 369, p: 22, c: 52, g: 7, items: [] },
  ];
  const total = { eaten: 159, target: 1832, p: [0, 92], c: [0, 183], g: [0, 81] };
  return (
    <ModuleScreen module="nutrition">
      <div style={{ padding: '8px 20px 0' }}>
        <div className="row-between">
          <div className="module-pill">Nutrición</div>
          <button onClick={() => setScreen('food-search')} style={{ background: 'transparent', border: 0, color: 'var(--nutri)', cursor: 'pointer' }}>
            <Icon name="search" size={20}/>
          </button>
        </div>

        {/* Day selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, gap: 4 }}>
          {['L','M','M','J','V','S','D'].map((d, i) => {
            const date = 20 + i;
            return (
              <button key={i} onClick={() => setDay(date)} style={{
                flex: 1, padding: '8px 0', borderRadius: 10, border: 0, cursor: 'pointer',
                background: day === date ? 'var(--nutri)' : 'var(--bg-2)',
                color: day === date ? '#1a1304' : 'var(--text-2)',
                display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center',
                fontFamily: 'var(--font-sans)',
              }}>
                <span style={{ fontSize: 10, opacity: 0.8 }}>{d}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{date}</span>
              </button>
            );
          })}
        </div>

        {/* Totals */}
        <div className="card" style={{ marginTop: 14, padding: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.03em' }}>
              <span style={{ color: 'var(--nutri)' }}>{total.eaten}</span>
              <span style={{ color: 'var(--text-3)' }}> / {total.target.toLocaleString()}</span>
            </div>
            <div className="mono" style={{ marginTop: 2 }}>kcal</div>
          </div>
          <div style={{ position: 'relative', height: 8, background: 'var(--bg-2)', borderRadius: 100, marginTop: 12 }}>
            <div style={{ position: 'absolute', left: '25%', top: -2, width: 2, height: 12, background: 'var(--text-2)' }}/>
            <div style={{ position: 'absolute', right: '18%', top: -2, width: 2, height: 12, background: 'var(--text-2)' }}/>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: (total.eaten / total.target * 100) + '%', background: 'var(--nutri)', borderRadius: 100 }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            <span>1,648</span><span>2,015</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16 }}>
            {[['Proteína', total.p, '#E8A93A'], ['Carbos', total.c, '#F2D35F'], ['Grasas', total.g, '#F16B57']].map(([n, v, c]) => (
              <div key={n}>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{n}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{v[0]} / {v[1]} g</div>
                <div className="bar" style={{ marginTop: 6 }}><span style={{ width: (v[0] / v[1] * 100) + '%', background: c }}/></div>
              </div>
            ))}
          </div>

          <button className="btn btn-full" style={{ marginTop: 14, background: 'var(--bg-2)', color: 'var(--text-1)' }}>Terminar día</button>
        </div>

        {/* Meals */}
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {meals.map((m, i) => (
            <div key={i} className="card" style={{ padding: 14 }}>
              <div className="row-between">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--nutri)' }}>{m.kcal} kcal</span> · {m.p} P · {m.c} C · {m.g} G
                  </div>
                </div>
                <Icon name="more" size={18} color="var(--text-3)"/>
              </div>
              {m.items.map((it, k) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--line)', marginTop: k === 0 ? 12 : 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-2)', display: 'grid', placeItems: 'center', fontSize: 14 }}>
                    {it.emoji || '🍽'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{it.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{it.q}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginRight: 6 }}>{it.kcal} kcal</div>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: `1.5px solid ${it.done ? 'var(--ok)' : 'var(--text-3)'}`,
                    background: it.done ? 'var(--ok)' : 'transparent',
                    display: 'grid', placeItems: 'center',
                  }}>{it.done && <Icon name="check" size={12} color="#0B0A0C"/>}</div>
                </div>
              ))}
              <button style={{
                width: '100%', marginTop: m.items.length ? 4 : 10, padding: 12, borderRadius: 10,
                background: 'var(--bg-2)', border: 0, color: 'var(--text-2)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Icon name="plus" size={14}/> Añadir alimento
              </button>
            </div>
          ))}
        </div>
      </div>
    </ModuleScreen>
  );
}

// ───────── FOOD SEARCH
function FoodSearch({ setScreen }) {
  const [q, setQ] = usePS('');
  const foods = [
    { name: 'Chicken breast', brand: 'Genérico', kcal: 165, p: 31, c: 0, g: 3.6, emoji: '🍗' },
    { name: 'Arroz blanco cocido', brand: 'Genérico', kcal: 130, p: 2.7, c: 28, g: 0.3, emoji: '🍚' },
    { name: 'Huevo entero', brand: 'Genérico', kcal: 155, p: 13, c: 1.1, g: 11, emoji: '🥚' },
    { name: 'Yogurt natural', brand: 'La Serenísima', kcal: 59, p: 10, c: 3.6, g: 0.4, emoji: '🥛' },
    { name: 'Palta', brand: 'Genérico', kcal: 160, p: 2, c: 9, g: 15, emoji: '🥑' },
    { name: 'Atún al natural', brand: 'La Campagnola', kcal: 116, p: 26, c: 0, g: 1, emoji: '🐟' },
  ].filter(f => !q || f.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <ModuleScreen module="nutrition">
      <div style={{ padding: '8px 20px 0' }}>
        <div className="row-between">
          <button onClick={() => setScreen('nutrition')} style={{ background: 'transparent', border: 0, color: 'var(--text-1)', cursor: 'pointer' }}>
            <Icon name="chevron-left" size={22}/>
          </button>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Añadir a Almuerzo</div>
          <div style={{ width: 22 }}/>
        </div>

        <div style={{ marginTop: 16, position: 'relative' }}>
          <Icon name="search" size={18} color="var(--text-3)"/>
          <input
            placeholder="Buscar alimentos, marcas, recetas..."
            value={q} onChange={e => setQ(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px 12px 40px', borderRadius: 12,
              background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--text-1)',
              fontSize: 14, fontFamily: 'var(--font-sans)',
            }}
          />
          <div style={{ position: 'absolute', left: 12, top: 12 }}><Icon name="search" size={18} color="var(--text-3)"/></div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 12, overflow: 'auto' }}>
          {['Todo', 'Favoritos', 'Recientes', 'Mis recetas', 'Escanear'].map((t, i) => (
            <div key={t} className="chip" style={i === 0 ? { background: 'var(--nutri-soft)', color: 'var(--nutri)', borderColor: 'rgba(232,169,58,0.3)' } : {}}>{t}</div>
          ))}
        </div>

        <div className="section-label" style={{ marginTop: 20 }}>Sugerencias del plan</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {foods.map((f, i) => (
            <div key={i} className="list-item" style={{ alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-2)', display: 'grid', placeItems: 'center', fontSize: 18 }}>{f.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  <span style={{ color: 'var(--nutri)' }}>{f.kcal} kcal</span> · {f.p}P {f.c}C {f.g}G · 100g
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{f.brand}</div>
              </div>
              <button style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--nutri)', border: 0, color: '#1a1304', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                <Icon name="plus" size={16} color="#1a1304"/>
              </button>
            </div>
          ))}
        </div>
      </div>
    </ModuleScreen>
  );
}

// ───────── PROGRESS (body composition trends)
function Progress({ setScreen }) {
  const [metric, setMetric] = usePS('peso');
  const [period, setPeriod] = usePS('3M');
  return (
    <ModuleScreen module="analytics">
      <div style={{ padding: '8px 20px 0' }}>
        <div className="row-between">
          <div className="module-pill">Progreso</div>
          <button onClick={() => setScreen('performance')} style={{ background: 'transparent', border: 0, color: 'var(--analytic)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500 }}>
            Performance Clock <Icon name="chevron-right" size={14} color="var(--analytic)"/>
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="display" style={{ fontSize: 26 }}><em>Composición</em> Corporal</div>
        </div>

        {/* Metric selector */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, overflow: 'auto' }}>
          {[
            { k: 'peso', l: 'Peso', v: '65,0', u: 'kg', c: '#7D8CFF', d: '−0.8 · mes' },
            { k: 'grasa', l: '% Grasa', v: '18,9', u: '%', c: '#4FB8A8', d: '−1,1 · mes' },
            { k: 'musculo', l: 'Masa Mag.', v: '52,7', u: 'kg', c: '#E23E4A', d: '+0.3 · mes' },
            { k: 'cintura', l: 'Cintura', v: '82', u: 'cm', c: '#E8A93A', d: '−1 · mes' },
          ].map(m => (
            <button key={m.k} onClick={() => setMetric(m.k)} style={{
              padding: '12px 14px', borderRadius: 12, border: '1px solid',
              borderColor: metric === m.k ? m.c : 'var(--line)',
              background: metric === m.k ? m.c + '1a' : 'var(--bg-1)',
              color: 'var(--text-1)', cursor: 'pointer', textAlign: 'left', minWidth: 120,
              flexShrink: 0, fontFamily: 'var(--font-sans)',
            }}>
              <div className="mono" style={{ color: 'var(--text-2)' }}>{m.l}</div>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4 }}>{m.v} <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{m.u}</span></div>
              <div style={{ fontSize: 10, color: m.c, marginTop: 2 }}>{m.d}</div>
            </button>
          ))}
        </div>

        {/* Period tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg-2)', borderRadius: 10, marginTop: 16 }}>
          {['3M', '12M', 'Máx', 'Personalizado'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              flex: 1, padding: '7px 0', borderRadius: 8, border: 0, cursor: 'pointer',
              background: period === p ? 'var(--bg-3)' : 'transparent',
              color: period === p ? 'var(--text-1)' : 'var(--text-2)',
              fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-sans)',
            }}>{p}</button>
          ))}
        </div>

        {/* Chart */}
        <div className="card" style={{ marginTop: 12, padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Promedio 90 días</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 4 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em' }}>65,0 <span style={{ fontSize: 12, color: 'var(--text-2)' }}>kg</span></div>
              <div style={{ fontSize: 10, color: 'var(--analytic)', fontFamily: 'var(--font-mono)' }}>■ balanza</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--text-2)' }}>65,0 <span style={{ fontSize: 12 }}>kg</span></div>
              <div style={{ fontSize: 10, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>● promedio</div>
            </div>
          </div>
          <svg viewBox="0 0 320 140" style={{ width: '100%', height: 140, marginTop: 10 }}>
            {[62, 64, 66, 68].map((v, i) => (
              <line key={v} x1="0" y1={140 - ((v - 62) / 6) * 120 - 10} x2="320" y2={140 - ((v - 62) / 6) * 120 - 10} stroke="rgba(255,255,255,0.05)"/>
            ))}
            <path d="M 0 40 Q 80 60, 160 85 T 320 95" fill="none" stroke="#E8A93A" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="220" cy="90" r="5" fill="#E8A93A"/>
            <text x="60" y="133" fill="var(--text-3)" fontSize="9" fontFamily="var(--font-mono)">feb</text>
            <text x="150" y="133" fill="var(--text-3)" fontSize="9" fontFamily="var(--font-mono)">mar</text>
            <text x="270" y="133" fill="var(--text-3)" fontSize="9" fontFamily="var(--font-mono)">abr</text>
          </svg>
        </div>

        {/* Measurements list */}
        <div className="section-label" style={{ marginTop: 22 }}>Registros</div>
        <div className="card" style={{ padding: 0 }}>
          {[
            { d: '20 abr · 07:30', v: '65,0 kg · 18.9%', note: 'En ayunas' },
            { d: '13 abr · 08:10', v: '65,4 kg · 19.2%', note: '' },
            { d: '06 abr · 07:45', v: '65,8 kg · 19.5%', note: 'Post-carga' },
            { d: '30 mar · 08:00', v: '66,2 kg · 20.0%', note: '' },
          ].map((r, i) => (
            <div key={i} className="row-between" style={{ padding: 14, borderTop: i ? '1px solid var(--line)' : 0 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{r.d} · {r.note || '—'}</div>
              </div>
              <Icon name="edit" size={16} color="var(--text-3)"/>
            </div>
          ))}
        </div>
        <button className="btn btn-full" style={{ marginTop: 12, background: 'var(--analytic-soft)', color: 'var(--analytic)' }}>
          <Icon name="plus" size={16} color="var(--analytic)"/> Registrar medición
        </button>
      </div>
    </ModuleScreen>
  );
}

// ───────── PERFORMANCE CLOCK
function Performance({ setScreen }) {
  const categories = [
    { k: 'Fuerza', v: 78, c: '#E23E4A' },
    { k: 'Cardio', v: 62, c: '#E8A93A' },
    { k: 'Movilidad', v: 71, c: '#4FB8A8' },
    { k: 'Nutrición', v: 55, c: '#F2D35F' },
    { k: 'Sueño', v: 84, c: '#7D8CFF' },
    { k: 'Recuperación', v: 68, c: '#F16B57' },
  ];
  // Radar geometry
  const cx = 140, cy = 140, r = 110;
  const n = categories.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, val) => {
    const rr = r * (val / 100);
    return [cx + Math.cos(angle(i)) * rr, cy + Math.sin(angle(i)) * rr];
  };
  const poly = categories.map((c, i) => pt(i, c.v).join(',')).join(' ');

  return (
    <ModuleScreen module="analytics">
      <div style={{ padding: '8px 20px 0' }}>
        <div className="row-between">
          <button onClick={() => setScreen('progress')} style={{ background: 'transparent', border: 0, color: 'var(--text-1)', cursor: 'pointer' }}>
            <Icon name="chevron-left" size={22}/>
          </button>
          <div className="module-pill">Performance</div>
          <Icon name="upload" size={18} color="var(--analytic)"/>
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="display" style={{ fontSize: 30 }}><em>Performance</em> Clock</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Semana 16 · 13–19 abr</div>
        </div>

        <div className="card" style={{ marginTop: 16, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(160deg, rgba(125,140,255,0.08), transparent)' }}>
          <svg viewBox="0 0 280 280" style={{ width: 280, height: 280 }}>
            {/* Gridlines */}
            {[0.25, 0.5, 0.75, 1].map(p => (
              <polygon key={p}
                points={categories.map((_, i) => {
                  const [x, y] = [cx + Math.cos(angle(i)) * r * p, cy + Math.sin(angle(i)) * r * p];
                  return `${x},${y}`;
                }).join(' ')}
                fill="none" stroke="rgba(255,255,255,0.06)"
              />
            ))}
            {/* Spokes */}
            {categories.map((_, i) => {
              const [x, y] = [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
              return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.06)"/>;
            })}
            {/* Data */}
            <polygon points={poly} fill="rgba(125,140,255,0.18)" stroke="#7D8CFF" strokeWidth="2" strokeLinejoin="round"/>
            {categories.map((c, i) => {
              const [x, y] = pt(i, c.v);
              return <circle key={i} cx={x} cy={y} r="5" fill={c.c}/>;
            })}
            {/* Labels */}
            {categories.map((c, i) => {
              const [x, y] = [cx + Math.cos(angle(i)) * (r + 22), cy + Math.sin(angle(i)) * (r + 22)];
              return <text key={c.k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="500" fill={c.c} fontFamily="var(--font-sans)">{c.k}</text>;
            })}
          </svg>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <div className="mono">Puntaje Global</div>
            <div style={{ fontSize: 38, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 4, color: 'var(--analytic)' }}>70<span style={{ fontSize: 16, color: 'var(--text-2)' }}>/100</span></div>
          </div>
        </div>

        <div className="section-label" style={{ marginTop: 18 }}>Desglose</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {categories.map(c => (
            <div key={c.k} className="card" style={{ padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c.c }}/>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{c.k}</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4 }}>{c.v}</div>
              <div className="bar" style={{ marginTop: 6 }}><span style={{ width: c.v + '%', background: c.c }}/></div>
            </div>
          ))}
        </div>
      </div>
    </ModuleScreen>
  );
}

// ───────── APPOINTMENTS (medicine)
function Appointments({ setScreen }) {
  return (
    <ModuleScreen module="medicine">
      <div style={{ padding: '8px 20px 0' }}>
        <div className="row-between">
          <div className="module-pill">Medicina</div>
          <Icon name="plus" size={22} color="var(--medic)"/>
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="display" style={{ fontSize: 28 }}><em>Tus</em> citas</div>
        </div>

        {/* Next appt */}
        <div className="card" style={{ marginTop: 14, padding: 16, background: 'linear-gradient(160deg, rgba(79,184,168,0.14), transparent)', border: '1px solid rgba(79,184,168,0.25)' }}>
          <div className="mono" style={{ color: 'var(--medic)' }}>Próxima</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>Consulta de seguimiento</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>Dra. Laura Gómez · Nutrición deportiva</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-2)' }}>
              <Icon name="calendar" size={14} color="var(--medic)"/> Mar 21 abr · 11:00
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-2)' }}>
              <Icon name="video" size={14} color="var(--medic)"/> Videollamada
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn" style={{ flex: 1, background: 'var(--medic)', color: '#0b2523', padding: '12px 14px' }} onClick={() => setScreen('video-call')}>
              <Icon name="video" size={16} color="#0b2523"/> Unirme
            </button>
            <button className="btn btn-ghost" style={{ padding: '12px 14px' }}>Reagendar</button>
          </div>
        </div>

        {/* Upcoming */}
        <div className="section-label" style={{ marginTop: 22 }}>Próximas</div>
        <div className="card" style={{ padding: 0 }}>
          {[
            { d: 'Vie 24 abr', t: '09:30', w: 'Control cardiológico', who: 'Dr. Carlos Méndez', type: 'Presencial' },
            { d: 'Mié 29 abr', t: '16:00', w: 'Check-in mensual', who: 'Dra. Laura Gómez', type: 'Video' },
            { d: 'Jue 07 may', t: '10:00', w: 'Revisión de labs', who: 'Dr. Carlos Méndez', type: 'Video' },
          ].map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: 14, borderTop: i ? '1px solid var(--line)' : 0, alignItems: 'center' }}>
              <div style={{ textAlign: 'center', width: 44 }}>
                <div style={{ fontSize: 10, color: 'var(--medic)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{a.d.split(' ')[0]}</div>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>{a.d.split(' ')[1]}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.w}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{a.who} · {a.t}</div>
              </div>
              <div className="chip" style={{ fontSize: 10 }}>{a.type}</div>
            </div>
          ))}
        </div>

        {/* Situations */}
        <div className="section-label" style={{ marginTop: 22 }}>Situaciones clínicas</div>
        <div className="card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--medic-soft)', color: 'var(--medic)', display: 'grid', placeItems: 'center' }}>
            <Icon name="heart" size={18}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Hipertensión controlada</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>Seguimiento mensual · Losartán 50mg</div>
          </div>
          <Icon name="chevron-right" size={16} color="var(--text-3)"/>
        </div>
        <div className="card" style={{ marginTop: 8, padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--medic-soft)', color: 'var(--medic)', display: 'grid', placeItems: 'center' }}>
            <Icon name="file" size={18}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Labs pendientes</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>Perfil lipídico · antes del 25 abr</div>
          </div>
          <div className="chip" style={{ background: 'rgba(232,169,58,0.15)', color: 'var(--warn)', borderColor: 'rgba(232,169,58,0.3)' }}>Urgente</div>
        </div>
      </div>
    </ModuleScreen>
  );
}

// ───────── VIDEO CALL (no status bar, no tab bar)
function VideoCall({ setScreen }) {
  const [muted, setMuted] = usePS(false);
  const [camOn, setCamOn] = usePS(true);
  return (
    <ModuleScreen module="medicine">
      <div style={{ position: 'relative', width: '100%', height: 844, background: '#050506' }}>
        {/* Doctor video placeholder */}
        <div style={{
          position: 'absolute', inset: 0,
          background:
            'radial-gradient(circle at 50% 35%, rgba(79,184,168,0.3), transparent 60%), repeating-linear-gradient(-45deg, rgba(255,255,255,0.025), rgba(255,255,255,0.025) 8px, transparent 8px, transparent 16px), #0a1614',
        }}>
          <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%)', width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #4FB8A8, #2a6d63)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 36, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
            LG
          </div>
          <div style={{ position: 'absolute', top: '55%', left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Dra. Laura Gómez</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>CONECTADA · 02:14</div>
          </div>
        </div>

        {/* Self preview */}
        <div style={{
          position: 'absolute', top: 60, right: 16,
          width: 100, height: 140, borderRadius: 14,
          background: camOn ? 'repeating-linear-gradient(45deg, #1a1a1a, #1a1a1a 4px, #252525 4px, #252525 8px)' : '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
        }}>
          {camOn ? (
            <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #E23E4A, #7a1a22)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 14, fontWeight: 600 }}>DA</div>
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>
              <Icon name="video" size={20} color="var(--text-3)"/>
            </div>
          )}
        </div>

        {/* Top bar */}
        <div style={{ position: 'absolute', top: 54, left: 16, display: 'flex', gap: 6 }}>
          <div style={{ padding: '6px 10px', borderRadius: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', fontSize: 11, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)' }}/> HD · cifrado
          </div>
        </div>

        {/* Context card */}
        <div style={{ position: 'absolute', bottom: 180, left: 16, right: 16, background: 'rgba(15,47,43,0.85)', backdropFilter: 'blur(14px)', borderRadius: 16, padding: 14, border: '1px solid rgba(79,184,168,0.3)' }}>
          <div className="mono" style={{ color: 'var(--medic)' }}>Notas de la consulta</div>
          <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
            Seguimiento nutricional — semana 4 fase ganancia muscular. Revisar adherencia y progreso de peso.
          </div>
        </div>

        {/* Controls */}
        <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button onClick={() => setMuted(!muted)} style={{
            width: 58, height: 58, borderRadius: '50%', border: 0, cursor: 'pointer',
            background: muted ? '#fff' : 'rgba(255,255,255,0.12)', color: muted ? '#000' : '#fff',
            display: 'grid', placeItems: 'center', backdropFilter: 'blur(10px)',
          }}>
            <Icon name="mic" size={22}/>
          </button>
          <button onClick={() => setCamOn(!camOn)} style={{
            width: 58, height: 58, borderRadius: '50%', border: 0, cursor: 'pointer',
            background: !camOn ? '#fff' : 'rgba(255,255,255,0.12)', color: !camOn ? '#000' : '#fff',
            display: 'grid', placeItems: 'center', backdropFilter: 'blur(10px)',
          }}>
            <Icon name="video" size={22}/>
          </button>
          <button style={{
            width: 58, height: 58, borderRadius: '50%', border: 0, cursor: 'pointer',
            background: 'rgba(255,255,255,0.12)', color: '#fff',
            display: 'grid', placeItems: 'center', backdropFilter: 'blur(10px)',
          }}>
            <Icon name="file" size={22}/>
          </button>
          <button onClick={() => setScreen('appointments')} style={{
            width: 58, height: 58, borderRadius: '50%', border: 0, cursor: 'pointer',
            background: 'var(--omega)', color: '#fff',
            display: 'grid', placeItems: 'center',
          }}>
            <Icon name="phone" size={22}/>
          </button>
        </div>
      </div>
    </ModuleScreen>
  );
}

// ───────── CHECK-IN
function CheckIn({ setScreen }) {
  const [mood, setMood] = usePS(4);
  const [sleep, setSleep] = usePS(7.5);
  const [energy, setEnergy] = usePS(3);
  const [pain, setPain] = usePS(null);
  return (
    <ModuleScreen module="medicine">
      <div style={{ padding: '8px 20px 0' }}>
        <div className="row-between">
          <button onClick={() => setScreen('home')} style={{ background: 'transparent', border: 0, color: 'var(--text-1)', cursor: 'pointer' }}>
            <Icon name="close" size={22}/>
          </button>
          <div className="mono">Check-in · Lun 20 abr</div>
          <div style={{ width: 22 }}/>
        </div>

        <div style={{ marginTop: 20 }}>
          <div className="display" style={{ fontSize: 32 }}><em>¿Cómo</em> amaneciste?</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>1 minuto · ayuda a calibrar tu plan</div>
        </div>

        {/* Mood */}
        <div style={{ marginTop: 28 }}>
          <div className="section-label">Ánimo</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} onClick={() => setMood(i)} style={{
                flex: 1, aspectRatio: '1', borderRadius: 14, border: 0, cursor: 'pointer',
                background: mood === i ? 'var(--medic)' : 'var(--bg-1)',
                color: mood === i ? '#0b2523' : 'var(--text-2)',
                fontSize: 24,
              }}>
                {['😞','😕','😐','🙂','😄'][i - 1]}
              </button>
            ))}
          </div>
        </div>

        {/* Sleep */}
        <div style={{ marginTop: 24 }}>
          <div className="row-between">
            <div className="section-label" style={{ margin: 0 }}>Sueño</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}><span style={{ color: 'var(--medic)' }}>{sleep}</span> h</div>
          </div>
          <input type="range" min="0" max="12" step="0.5" value={sleep} onChange={e => setSleep(parseFloat(e.target.value))}
            style={{ width: '100%', marginTop: 10, accentColor: 'var(--medic)' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            <span>0h</span><span>6h</span><span>12h</span>
          </div>
        </div>

        {/* Energy */}
        <div style={{ marginTop: 24 }}>
          <div className="section-label">Energía</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} onClick={() => setEnergy(i)} style={{
                flex: 1, padding: '12px 0', borderRadius: 10, border: 0, cursor: 'pointer',
                background: i <= energy ? 'var(--medic)' : 'var(--bg-2)',
                color: i <= energy ? '#0b2523' : 'var(--text-3)',
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)',
              }}>{i}</button>
            ))}
          </div>
        </div>

        {/* Pain */}
        <div style={{ marginTop: 24 }}>
          <div className="section-label">¿Dolor o molestia?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['No', 'Leve', 'Moderado', 'Fuerte'].map(l => (
              <button key={l} onClick={() => setPain(l)} style={{
                flex: 1, padding: '12px 6px', borderRadius: 10, border: '1px solid',
                borderColor: pain === l ? 'var(--medic)' : 'var(--line)',
                background: pain === l ? 'var(--medic-soft)' : 'var(--bg-1)',
                color: pain === l ? 'var(--medic)' : 'var(--text-2)',
                cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-sans)',
              }}>{l}</button>
            ))}
          </div>
        </div>

        <button className="btn btn-full" style={{ marginTop: 28, background: 'var(--medic)', color: '#0b2523' }} onClick={() => setScreen('home')}>
          <Icon name="check" size={18} color="#0b2523"/> Guardar check-in
        </button>
      </div>
    </ModuleScreen>
  );
}

Object.assign(window, { PatientHome, TrainingPlan, SessionActive, ExerciseDetail, TrainingStats, Nutrition, FoodSearch, Progress, Performance, Appointments, VideoCall, CheckIn });
