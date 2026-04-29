// Boceto — pantallas de auth y home independientes
const { useState: _useS } = React;

const BOCETO_ROLES = [
  { id: 'patient', label: 'Paciente', sub: 'Accede a tus planes y citas', icon: 'user', c: '#E23E4A' },
  { id: 'nutritionist', label: 'Nutricionista', sub: 'Gestiona planes alimentarios', icon: 'nutrition', c: '#E8A93A' },
  { id: 'trainer', label: 'Entrenador', sub: 'Crea rutinas y seguimientos', icon: 'training', c: '#F16B57' },
  { id: 'doctor', label: 'Médico', sub: 'Consultas, labs y expedientes', icon: 'medicine', c: '#4FB8A8' },
  { id: 'admin', label: 'Administrador', sub: 'Gestión del sistema', icon: 'settings', c: '#C9C3BA' },
];

// ───────── HOME WELCOME (landing antes de login)
function BocetoHome({ setScreen }) {
  return (
    <div style={{ padding: '60px 28px 40px', minHeight: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 360,
        background: 'radial-gradient(600px 320px at 50% 0%, rgba(226,62,74,0.18), transparent 70%)',
        pointerEvents: 'none',
      }}/>
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 70 }}>
          <img src="assets/logo-white.png" alt="Omega" style={{ width: 28, height: 22, objectFit: 'contain' }}/>
          <div className="mono" style={{ color: 'var(--omega)' }}>Omega Medicina</div>
        </div>

        <div style={{ marginTop: 30, marginBottom: 28 }}>
          <div style={{ fontSize: 42, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.98 }}>
            <em style={{ fontFamily: 'var(--font-serif)', fontSize: 48 }}>Tu salud</em>,<br/>
            integrada.
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 18, lineHeight: 1.55, maxWidth: 290 }}>
            Entrenamiento, nutrición y medicina en un solo ecosistema. Conectado con tus profesionales de confianza.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
          {[
            { i: 'training', l: 'Plan de entrenamiento personalizado', c: '#E23E4A' },
            { i: 'nutrition', l: 'Seguimiento nutricional diario', c: '#E8A93A' },
            { i: 'medicine', l: 'Consultas con tu equipo médico', c: '#4FB8A8' },
          ].map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: it.c + '22', color: it.c, display: 'grid', placeItems: 'center' }}>
                <Icon name={it.i} size={16}/>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-1)', flex: 1 }}>{it.l}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => setScreen('create-profile')} className="btn btn-primary btn-full">
            Crear cuenta <Icon name="chevron-right" size={16}/>
          </button>
          <button onClick={() => setScreen('login')} className="btn btn-ghost btn-full">
            Ya tengo cuenta
          </button>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
            v1.0 · Boceto exploratorio
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────── LOGIN
function BocetoLogin({ setScreen }) {
  const [email, setEmail] = _useS('');
  const [pass, setPass] = _useS('');
  const [showPass, setShowPass] = _useS(false);

  return (
    <div style={{ padding: '60px 28px 40px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={() => setScreen('home')} style={{ background: 'transparent', border: 0, color: 'var(--text-1)', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <Icon name="chevron-left" size={22}/>
        </button>
        <div className="mono">Iniciar sesión</div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <img src="assets/logo-white.png" alt="Omega" style={{ width: 56, height: 44, objectFit: 'contain', marginBottom: 16 }}/>
        <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          <em style={{ fontFamily: 'var(--font-serif)' }}>Bienvenido</em><br/>de vuelta
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 10 }}>
          Ingresá a tu cuenta de Omega Medicina.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email</label>
          <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', marginTop: 6, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}/>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contraseña</label>
            <button style={{ fontSize: 11, color: 'var(--omega)', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>¿Olvidaste?</button>
          </div>
          <div style={{ position: 'relative', marginTop: 6 }}>
            <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)}
              style={{ width: '100%', padding: '14px 44px 14px 16px', borderRadius: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}/>
            <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 0, color: 'var(--text-3)', cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>{showPass ? 'Ocultar' : 'Mostrar'}</button>
          </div>
        </div>
      </div>

      <button onClick={() => setScreen('role-select')} className="btn btn-primary btn-full" style={{ marginTop: 22 }}>
        Ingresar
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
        <span className="mono">o continuá con</span>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button className="btn btn-ghost" style={{ padding: '12px 14px' }}>Google</button>
        <button className="btn btn-ghost" style={{ padding: '12px 14px' }}>Apple</button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: 24, fontSize: 13, color: 'var(--text-2)' }}>
        ¿Sin cuenta?{' '}
        <button onClick={() => setScreen('create-profile')} style={{ background: 'transparent', border: 0, color: 'var(--omega)', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-sans)' }}>
          Crear perfil
        </button>
      </div>
    </div>
  );
}

// ───────── CREATE PROFILE (2 pasos)
function BocetoCreate({ setScreen }) {
  const [step, setStep] = _useS(1);
  const [data, setData] = _useS({ name: '', email: '', pass: '', dob: '', gender: '', height: '', weight: '' });
  const set = (k, v) => setData({ ...data, [k]: v });
  const total = 2;

  return (
    <div style={{ padding: '60px 28px 40px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => step === 1 ? setScreen('home') : setStep(step - 1)} style={{ background: 'transparent', border: 0, color: 'var(--text-1)', cursor: 'pointer', padding: 0 }}>
          <Icon name="chevron-left" size={22}/>
        </button>
        <div style={{ flex: 1 }}>
          <div className="mono">Paso {step} / {total}</div>
          <div className="bar" style={{ marginTop: 4 }}><span style={{ width: (step / total * 100) + '%', background: 'var(--omega)' }}/></div>
        </div>
      </div>

      {step === 1 && (
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              <em style={{ fontFamily: 'var(--font-serif)' }}>Creá</em> tu cuenta
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8 }}>Información básica para empezar.</div>
          </div>
          {[
            { k: 'name', l: 'Nombre completo', p: 'Tu nombre', t: 'text' },
            { k: 'email', l: 'Email', p: 'tu@email.com', t: 'email' },
            { k: 'pass', l: 'Contraseña', p: 'Mínimo 8 caracteres', t: 'password' },
          ].map(f => (
            <div key={f.k}>
              <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{f.l}</label>
              <input type={f.t} value={data[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.p}
                style={{ width: '100%', marginTop: 6, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}/>
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              <em style={{ fontFamily: 'var(--font-serif)' }}>Datos</em> personales
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8 }}>Nos ayudan a personalizar tu experiencia.</div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fecha de nacimiento</label>
            <input type="date" value={data.dob} onChange={e => set('dob', e.target.value)}
              style={{ width: '100%', marginTop: 6, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}/>
          </div>
          <div>
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Género</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
              {['Masculino','Femenino','Otro','Prefiero no decir'].map(g => (
                <button key={g} onClick={() => set('gender', g)} style={{
                  padding: '12px 8px', borderRadius: 10,
                  background: data.gender === g ? 'var(--omega-soft)' : 'var(--bg-1)',
                  border: `1px solid ${data.gender === g ? 'rgba(226,62,74,0.4)' : 'var(--line)'}`,
                  color: data.gender === g ? 'var(--omega)' : 'var(--text-2)',
                  fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>{g}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Altura (cm)</label>
              <input type="number" value={data.height} onChange={e => set('height', e.target.value)} placeholder="178"
                style={{ width: '100%', marginTop: 6, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}/>
            </div>
            <div>
              <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Peso (kg)</label>
              <input type="number" value={data.weight} onChange={e => set('weight', e.target.value)} placeholder="65"
                style={{ width: '100%', marginTop: 6, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}/>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => step < total ? setStep(step + 1) : setScreen('role-select')} className="btn btn-primary btn-full" style={{ marginTop: 20 }}>
        {step < total ? 'Continuar' : 'Crear cuenta'} <Icon name="chevron-right" size={16}/>
      </button>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
        Al continuar aceptás los <span style={{ color: 'var(--omega)' }}>Términos</span> y la <span style={{ color: 'var(--omega)' }}>Política de privacidad</span>.
      </div>
    </div>
  );
}

// ───────── ROLE SELECTOR
function BocetoRole({ setScreen }) {
  const [selected, setSelected] = _useS(null);
  return (
    <div style={{ padding: '60px 28px 40px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <img src="assets/logo-white.png" alt="Omega" style={{ width: 22, height: 18, objectFit: 'contain' }}/>
          <div className="mono" style={{ color: 'var(--omega)' }}>Omega Medicina</div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 12, lineHeight: 1.05 }}>
          <em style={{ fontFamily: 'var(--font-serif)' }}>Elegí</em> tu<br/>experiencia
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 10, lineHeight: 1.5 }}>
          Cada rol muestra una interfaz diferente. Podés cambiar luego desde tu perfil.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {BOCETO_ROLES.map(r => (
          <button key={r.id} onClick={() => setSelected(r.id)} style={{
            display: 'flex', gap: 14, padding: 16, borderRadius: 14, alignItems: 'center',
            background: selected === r.id ? r.c + '1a' : 'var(--bg-1)',
            border: `1.5px solid ${selected === r.id ? r.c : 'var(--line)'}`,
            cursor: 'pointer', color: 'var(--text-1)', textAlign: 'left', fontFamily: 'var(--font-sans)',
            transition: 'all 0.15s',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: r.c + '22', color: r.c, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name={r.icon} size={20}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{r.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{r.sub}</div>
            </div>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              border: `1.5px solid ${selected === r.id ? r.c : 'var(--text-3)'}`,
              background: selected === r.id ? r.c : 'transparent',
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
              {selected === r.id && <Icon name="check" size={12} color="#0B0A0C"/>}
            </div>
          </button>
        ))}
      </div>

      <button disabled={!selected} onClick={() => setScreen('done')} className="btn btn-primary btn-full" style={{
        marginTop: 20, opacity: selected ? 1 : 0.4, cursor: selected ? 'pointer' : 'not-allowed',
      }}>
        Continuar <Icon name="chevron-right" size={18}/>
      </button>
    </div>
  );
}

// ───────── DONE (confirmación de éxito)
function BocetoDone({ setScreen }) {
  return (
    <div style={{ padding: '60px 28px 40px', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
      <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'var(--omega-soft)', border: '1px solid rgba(226,62,74,0.3)', display: 'grid', placeItems: 'center', marginBottom: 24 }}>
        <Icon name="check" size={36} color="var(--omega)"/>
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
        <em style={{ fontFamily: 'var(--font-serif)' }}>Listo,</em><br/>todo configurado
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 12, lineHeight: 1.55, maxWidth: 280 }}>
        Tu cuenta está activa. Este boceto cubre el flujo de entrada — el resto del prototipo principal continúa desde acá.
      </div>
      <button onClick={() => setScreen('home')} className="btn btn-ghost" style={{ marginTop: 32 }}>
        Volver al inicio
      </button>
    </div>
  );
}

Object.assign(window, { BocetoHome, BocetoLogin, BocetoCreate, BocetoRole, BocetoDone, BOCETO_ROLES });
