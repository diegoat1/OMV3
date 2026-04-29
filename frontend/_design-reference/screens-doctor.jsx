// Doctor + Admin screens for Omega Medicina
const { useState: useDS } = React;

// ───────── DOCTOR HOME
function DoctorHome({ setScreen }) {
  return (
    <ModuleScreen module="medicine">
      <div style={{ padding: '8px 20px 0' }}>
        <div className="row-between">
          <div>
            <div className="mono">Lun · 20 abr · 09:12</div>
            <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 4 }}>
              <em style={{ fontFamily: 'var(--font-serif)' }}>Dra.</em> Laura Gómez
            </div>
          </div>
          <Avatar name="Laura Gómez" color="#4FB8A8"/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16 }}>
          <StatTile k="Hoy" v="7" d="consultas"/>
          <StatTile k="Semana" v="24" d="pacientes"/>
          <StatTile k="Pendientes" v="3" d="reportes"/>
        </div>

        <div className="section-label" style={{ marginTop: 22 }}>Agenda de hoy</div>
        <div className="card" style={{ padding: 0 }}>
          {[
            { t: '09:30', p: 'Diego Alejandro T.', w: 'Seguimiento nutricional', type: 'Video', status: 'next' },
            { t: '10:15', p: 'María Fernández', w: 'Primera consulta', type: 'Presencial' },
            { t: '11:00', p: 'Santiago Ríos', w: 'Revisión de labs', type: 'Video' },
            { t: '12:30', p: 'Valentina Pérez', w: 'Check-in mensual', type: 'Video' },
          ].map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: 14, borderTop: i ? '1px solid var(--line)' : 0, alignItems: 'center', background: a.status === 'next' ? 'rgba(79,184,168,0.06)' : 'transparent' }}>
              <div style={{ width: 46, textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: a.status === 'next' ? 'var(--medic)' : 'var(--text-1)' }}>{a.t}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.p}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{a.w}</div>
              </div>
              <div className="chip" style={a.type === 'Video' ? { color: 'var(--medic)', borderColor: 'rgba(79,184,168,0.3)', background: 'var(--medic-soft)' } : {}}>
                {a.type === 'Video' && <Icon name="video" size={10} color="var(--medic)"/>}
                {a.type}
              </div>
            </div>
          ))}
        </div>

        <div className="section-label" style={{ marginTop: 22 }}>Alertas</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { t: 'Adherencia baja', p: 'Santiago Ríos · 42% semana', c: 'var(--omega)' },
            { t: 'Labs recibidos', p: 'Valentina Pérez · perfil lipídico', c: 'var(--medic)' },
            { t: 'Meta alcanzada', p: 'Diego A. · fuerza +5%', c: 'var(--ok)' },
          ].map((a, i) => (
            <div key={i} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 28, background: a.c, borderRadius: 2 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.t}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{a.p}</div>
              </div>
              <Icon name="chevron-right" size={16} color="var(--text-3)"/>
            </div>
          ))}
        </div>
      </div>
    </ModuleScreen>
  );
}

// ───────── DOCTOR PATIENTS
function DoctorPatients({ setScreen }) {
  const [q, setQ] = useDS('');
  const patients = [
    { n: 'Diego Alejandro T.', age: 29, tag: 'Fuerza', last: 'Hoy 09:30', adh: 92, c: 'var(--omega)' },
    { n: 'María Fernández', age: 34, tag: 'Nutrición', last: '2d · cita', adh: 78, c: 'var(--nutri)' },
    { n: 'Santiago Ríos', age: 41, tag: 'Cardio', last: '5d · labs', adh: 42, c: 'var(--medic)' },
    { n: 'Valentina Pérez', age: 27, tag: 'Movilidad', last: '1w', adh: 88, c: 'var(--analytic)' },
    { n: 'Martín Ortiz', age: 52, tag: 'Fuerza', last: '3d', adh: 64, c: 'var(--omega)' },
    { n: 'Ana Belén C.', age: 38, tag: 'Nutrición', last: '6d', adh: 81, c: 'var(--nutri)' },
  ].filter(p => !q || p.n.toLowerCase().includes(q.toLowerCase()));
  return (
    <ModuleScreen module="medicine">
      <div style={{ padding: '8px 20px 0' }}>
        <div className="row-between">
          <div className="module-pill">Pacientes</div>
          <Icon name="plus" size={22} color="var(--medic)"/>
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="display" style={{ fontSize: 28 }}><em>24</em> activos</div>
        </div>

        <div style={{ marginTop: 14, position: 'relative' }}>
          <input
            placeholder="Buscar paciente..."
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
          {['Todos', 'Hoy', 'Alta adherencia', 'Necesitan atención', 'Nuevos'].map((t, i) => (
            <div key={t} className="chip" style={i === 0 ? { background: 'var(--medic-soft)', color: 'var(--medic)', borderColor: 'rgba(79,184,168,0.3)' } : {}}>{t}</div>
          ))}
        </div>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column' }}>
          {patients.map((p, i) => (
            <div key={i} onClick={() => setScreen('doc-patient-detail')} className="list-item" style={{ cursor: 'pointer' }}>
              <Avatar name={p.n} color={p.c}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{p.n}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{p.age} años · {p.last}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: p.adh < 60 ? 'var(--omega)' : p.adh > 85 ? 'var(--ok)' : 'var(--text-1)' }}>{p.adh}%</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>adherencia</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModuleScreen>
  );
}

// ───────── DOCTOR PATIENT DETAIL
function DoctorPatientDetail({ setScreen }) {
  const [tab, setTab] = useDS('resumen');
  return (
    <ModuleScreen module="medicine">
      <div style={{ padding: '8px 20px 0' }}>
        <div className="row-between">
          <button onClick={() => setScreen('doc-patients')} style={{ background: 'transparent', border: 0, color: 'var(--text-1)', cursor: 'pointer' }}>
            <Icon name="chevron-left" size={22}/>
          </button>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Ficha de paciente</div>
          <Icon name="more" size={20} color="var(--text-1)"/>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--omega), #7a1a22)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 600, fontSize: 18 }}>DA</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Diego Alejandro T.</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>29 años · 1.78 m · Fase: Ganancia Muscular</div>
          </div>
          <button onClick={() => setScreen('video-call')} style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--medic)', color: '#0b2523', border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <Icon name="video" size={18} color="#0b2523"/>
          </button>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 16 }}>
          {[
            { k: 'Peso', v: '65,0', u: 'kg', c: 'var(--analytic)' },
            { k: '% Grasa', v: '18,9', u: '%', c: 'var(--medic)' },
            { k: 'Fuerza', v: '69', u: 'mSTR', c: 'var(--omega)' },
            { k: 'Adh.', v: '92', u: '%', c: 'var(--ok)' },
          ].map(s => (
            <div key={s.k} style={{ padding: 10, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 10 }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.k}</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginTop: 2, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 9, color: 'var(--text-3)' }}>{s.u}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 18, overflow: 'auto', borderBottom: '1px solid var(--line)' }}>
          {['resumen', 'historial', 'planes', 'labs', 'archivos'].map(t => (
            <button key={t} onClick={() => t === 'archivos' ? setScreen('doc-files') : setTab(t)} style={{
              padding: '10px 14px', background: 'transparent', border: 0, cursor: 'pointer',
              color: tab === t ? 'var(--medic)' : 'var(--text-2)',
              borderBottom: '2px solid',
              borderBottomColor: tab === t ? 'var(--medic)' : 'transparent',
              fontSize: 12, fontWeight: 500, textTransform: 'capitalize', fontFamily: 'var(--font-sans)',
            }}>{t}</button>
          ))}
        </div>

        {tab === 'resumen' && (
          <>
            <div className="section-label" style={{ marginTop: 18 }}>Planes activos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { m: 'training', label: 'Entreno · Full body 5d', sub: '18 sesiones · racha 4w', c: 'var(--omega)' },
                { m: 'nutrition', label: 'Nutri · 1832 kcal', sub: '165P / 183C / 81G', c: 'var(--nutri)' },
                { m: 'medicine', label: 'Programa · Prevención CV', sub: '3 meses · mes 2', c: 'var(--medic)' },
              ].map(p => (
                <div key={p.m} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 4, height: 36, background: p.c, borderRadius: 2 }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{p.sub}</div>
                  </div>
                  <Icon name="edit" size={16} color="var(--text-3)"/>
                </div>
              ))}
            </div>

            <div className="section-label" style={{ marginTop: 20 }}>Notas recientes</div>
            <div className="card">
              <div className="mono" style={{ color: 'var(--text-3)' }}>13 abr · seguimiento</div>
              <div style={{ fontSize: 13, lineHeight: 1.55, marginTop: 6, color: 'var(--text-1)' }}>
                Paciente muestra buena adherencia al plan de fuerza. Peso estable en 65kg tras 4 semanas. Ajustar ingesta calórica +120kcal para continuar fase de ganancia.
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <div className="chip">Nutrición</div>
                <div className="chip">Entrenamiento</div>
              </div>
            </div>

            <button className="btn btn-full" style={{ marginTop: 16, background: 'var(--medic)', color: '#0b2523' }}>
              <Icon name="edit" size={16} color="#0b2523"/> Nueva nota clínica
            </button>
          </>
        )}
      </div>
    </ModuleScreen>
  );
}

// ───────── DOCTOR FILES (upload / view patient files)
function DoctorFiles({ setScreen }) {
  const [dragHover, setDragHover] = useDS(false);
  const files = [
    { n: 'Perfil lipídico · abril 2026.pdf', s: '340 KB', t: 'PDF', d: 'hace 2 días', c: 'var(--omega)' },
    { n: 'RX tórax frontal.jpg', s: '1.8 MB', t: 'IMG', d: 'hace 1 semana', c: 'var(--medic)' },
    { n: 'Estudio cardiológico.pdf', s: '2.4 MB', t: 'PDF', d: 'hace 3 semanas', c: 'var(--omega)' },
    { n: 'Composición corporal DXA.pdf', s: '580 KB', t: 'PDF', d: 'mes pasado', c: 'var(--omega)' },
  ];
  return (
    <ModuleScreen module="medicine">
      <div style={{ padding: '8px 20px 0' }}>
        <div className="row-between">
          <button onClick={() => setScreen('doc-patient-detail')} style={{ background: 'transparent', border: 0, color: 'var(--text-1)', cursor: 'pointer' }}>
            <Icon name="chevron-left" size={22}/>
          </button>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Archivos · Diego A.</div>
          <div style={{ width: 22 }}/>
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="display" style={{ fontSize: 24 }}><em>12</em> documentos</div>
        </div>

        {/* Upload drop */}
        <div
          onMouseEnter={() => setDragHover(true)} onMouseLeave={() => setDragHover(false)}
          style={{
            marginTop: 14, padding: 24, borderRadius: 14,
            border: `1.5px dashed ${dragHover ? 'var(--medic)' : 'var(--line-strong)'}`,
            background: dragHover ? 'rgba(79,184,168,0.06)' : 'var(--bg-1)',
            textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
          }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--medic-soft)', color: 'var(--medic)', margin: '0 auto', display: 'grid', placeItems: 'center' }}>
            <Icon name="upload" size={20}/>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, marginTop: 10 }}>Subir estudio o imagen</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>PDF · JPG · PNG · DICOM · hasta 25MB</div>
        </div>

        <div className="section-label" style={{ marginTop: 22 }}>Categorías</div>
        <div style={{ display: 'flex', gap: 6, overflow: 'auto' }}>
          {['Todos', 'Laboratorios', 'Imágenes', 'Informes', 'Recetas'].map((t, i) => (
            <div key={t} className="chip" style={i === 0 ? { background: 'var(--medic-soft)', color: 'var(--medic)', borderColor: 'rgba(79,184,168,0.3)' } : {}}>{t}</div>
          ))}
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column' }}>
          {files.map((f, i) => (
            <div key={i} className="list-item">
              <div style={{ width: 42, height: 42, borderRadius: 10, background: f.c + '1a', color: f.c, display: 'grid', placeItems: 'center', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {f.t}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.n}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{f.s} · {f.d}</div>
              </div>
              <Icon name="more" size={18} color="var(--text-3)"/>
            </div>
          ))}
        </div>

        <div className="section-label" style={{ marginTop: 22 }}>Plantillas rápidas</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { t: 'Orden de laboratorio', i: 'file' },
            { t: 'Receta médica', i: 'edit' },
            { t: 'Certificado', i: 'check' },
            { t: 'Plan alimentario', i: 'nutrition' },
          ].map(p => (
            <div key={p.t} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--medic-soft)', color: 'var(--medic)', display: 'grid', placeItems: 'center' }}>
                <Icon name={p.i} size={14}/>
              </div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{p.t}</div>
            </div>
          ))}
        </div>
      </div>
    </ModuleScreen>
  );
}

// ───────── ADMIN HOME
function AdminHome({ setScreen }) {
  return (
    <ModuleScreen module="admin">
      <div style={{ padding: '8px 20px 0' }}>
        <div className="row-between">
          <div className="module-pill">Admin</div>
          <Icon name="bell" size={20} color="var(--text-2)"/>
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="display" style={{ fontSize: 28 }}><em>Panel</em> de control</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Omega Medicina · producción</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginTop: 16 }}>
          <StatTile k="Usuarios" v="1,284" d="+12 esta semana"/>
          <StatTile k="Activos 30d" v="892" d="69%"/>
          <StatTile k="Pendientes" v="4" d="aprobación"/>
          <StatTile k="Errores 24h" v="0" d="sin incidentes"/>
        </div>

        <div className="section-label" style={{ marginTop: 22 }}>Uso por módulo · 7 días</div>
        <div className="card">
          {[
            { n: 'Entrenamiento', v: 78, c: 'var(--omega)' },
            { n: 'Nutrición', v: 92, c: 'var(--nutri)' },
            { n: 'Medicina', v: 54, c: 'var(--medic)' },
            { n: 'Analítica', v: 41, c: 'var(--analytic)' },
          ].map((m, i) => (
            <div key={m.n} style={{ marginTop: i ? 12 : 0 }}>
              <div className="row-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{m.n}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: m.c }}>{m.v}%</span>
              </div>
              <div className="bar"><span style={{ width: m.v + '%', background: m.c }}/></div>
            </div>
          ))}
        </div>

        <div className="section-label" style={{ marginTop: 22 }}>Aprobaciones pendientes</div>
        <div className="card" style={{ padding: 0 }}>
          {[
            { n: 'María F.', role: 'Doctor · Nutrición', d: 'hace 2h' },
            { n: 'Juan C.', role: 'Doctor · Cardiología', d: 'hace 5h' },
            { n: 'Lucía P.', role: 'Paciente', d: 'hace 1d' },
            { n: 'Rodrigo M.', role: 'Doctor · Endocrinología', d: 'hace 2d' },
          ].map((u, i) => (
            <div key={i} className="row-between" style={{ padding: 14, borderTop: i ? '1px solid var(--line)' : 0 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Avatar name={u.n} color="#C9C3BA"/>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{u.n}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{u.role} · {u.d}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--ok)', border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#0a1a0a' }}>
                  <Icon name="check" size={14} color="#0a1a0a"/>
                </button>
                <button style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--line)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--text-2)' }}>
                  <Icon name="close" size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="section-label" style={{ marginTop: 22 }}>Sistema</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { t: 'Backup BD', sub: 'Último: hoy 03:00', i: 'data' },
            { t: 'Exportar datos', sub: 'CSV / JSON', i: 'upload' },
            { t: 'Audit log', sub: '3,421 eventos', i: 'history' },
            { t: 'Limpieza', sub: 'temporales · logs', i: 'settings' },
          ].map(c => (
            <div key={c.t} className="card" style={{ padding: 12, cursor: 'pointer' }}>
              <Icon name={c.i} size={16} color="var(--admin)"/>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 10 }}>{c.t}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </ModuleScreen>
  );
}

// ───────── ADMIN AUDIT
function AdminAudit({ setScreen }) {
  const events = [
    { t: '09:42', u: 'dra.gomez', e: 'Creó nota clínica', r: 'Diego A.', c: 'var(--medic)' },
    { t: '09:31', u: 'diego.a', e: 'Completó sesión', r: 'Plan fuerza · 4 ej.', c: 'var(--omega)' },
    { t: '08:55', u: 'dra.gomez', e: 'Inició videollamada', r: 'Valentina P.', c: 'var(--medic)' },
    { t: '08:14', u: 'admin', e: 'Aprobó usuario', r: 'Dr. Carlos M.', c: 'var(--admin)' },
    { t: '07:01', u: 'system', e: 'Backup completado', r: '2.4 GB', c: 'var(--ok)' },
    { t: '06:45', u: 'santiago.r', e: 'Subió archivo', r: 'Perfil lipídico.pdf', c: 'var(--omega)' },
    { t: 'Ayer', u: 'dra.gomez', e: 'Editó plan nutri.', r: 'Diego A.', c: 'var(--nutri)' },
    { t: 'Ayer', u: 'admin', e: 'Exportó CSV', r: 'users · 1,284 filas', c: 'var(--admin)' },
  ];
  return (
    <ModuleScreen module="admin">
      <div style={{ padding: '8px 20px 0' }}>
        <div className="row-between">
          <button onClick={() => setScreen('admin-home')} style={{ background: 'transparent', border: 0, color: 'var(--text-1)', cursor: 'pointer' }}>
            <Icon name="chevron-left" size={22}/>
          </button>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Audit log</div>
          <Icon name="upload" size={18} color="var(--text-1)"/>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 6, overflow: 'auto' }}>
          {['Todo', 'Clínico', 'Admin', 'Sistema', 'Errores'].map((t, i) => (
            <div key={t} className="chip" style={i === 0 ? { background: 'rgba(201,195,186,0.14)', color: 'var(--admin)', borderColor: 'rgba(201,195,186,0.3)' } : {}}>{t}</div>
          ))}
        </div>

        <div style={{ marginTop: 20, position: 'relative', paddingLeft: 18 }}>
          <div style={{ position: 'absolute', left: 6, top: 8, bottom: 8, width: 1, background: 'var(--line)' }}/>
          {events.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 16, position: 'relative' }}>
              <div style={{ position: 'absolute', left: -16, top: 4, width: 10, height: 10, borderRadius: '50%', background: e.c, border: '2px solid var(--bg-0)' }}/>
              <div style={{ width: 40, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', flexShrink: 0, paddingTop: 2 }}>{e.t}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: e.c }}>{e.u}</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{e.e}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{e.r}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-full" style={{ marginTop: 4, background: 'var(--bg-2)', color: 'var(--text-1)' }}>
          Cargar más eventos
        </button>
      </div>
    </ModuleScreen>
  );
}

Object.assign(window, { DoctorHome, DoctorPatients, DoctorPatientDetail, DoctorFiles, AdminHome, AdminAudit });
