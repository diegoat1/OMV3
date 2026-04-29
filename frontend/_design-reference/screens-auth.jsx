// Auth flow + user menu modal for Omega Medicina
const { useState: useAS } = React;

const ROLES = [
  { id: 'patient', label: 'Paciente', sub: 'Accede a tus planes y citas', icon: 'user', c: '#E23E4A' },
  { id: 'nutritionist', label: 'Nutricionista', sub: 'Gestiona planes alimentarios', icon: 'nutrition', c: '#E8A93A' },
  { id: 'trainer', label: 'Entrenador personal', sub: 'Crea rutinas y seguimientos', icon: 'training', c: '#F16B57' },
  { id: 'doctor', label: 'Médico', sub: 'Consultas, labs y expedientes', icon: 'medicine', c: '#4FB8A8' },
  { id: 'admin', label: 'Administrador', sub: 'Gestión del sistema', icon: 'settings', c: '#C9C3BA' },
];

// ───────── USER MENU MODAL (tapped from top-right avatar)
function UserMenu({ close, setScreen, switchRole, currentRole }) {
  const [showRoles, setShowRoles] = useAS(false);
  return (
    <>
      <div className="sheet-backdrop" onClick={close}/>
      <div className="sheet" style={{ maxHeight: '70%' }}>
        <div className="sheet-handle"/>
        {!showRoles ? (
          <>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 4px 18px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--omega), #7a1a22)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 600, fontSize: 18 }}>DA</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Diego Alejandro T.</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>diego.a@omega.med</div>
                <div className="module-pill" style={{ marginTop: 6 }}>
                  {ROLES.find(r => r.id === currentRole)?.label || 'Paciente'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', padding: '12px 0' }}>
              {[
                { i: 'user', l: 'Mi perfil', onClick: () => { close(); setScreen('profile-edit'); } },
                { i: 'settings', l: 'Ajustes', onClick: () => {} },
                { i: 'bell', l: 'Notificaciones', onClick: () => {} },
                { i: 'file', l: 'Términos & privacidad', onClick: () => {} },
              ].map((m, i) => (
                <button key={i} onClick={m.onClick} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 4px',
                  background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--text-1)',
                  borderBottom: '1px solid var(--line)', textAlign: 'left', fontFamily: 'var(--font-sans)',
                }}>
                  <Icon name={m.i} size={18} color="var(--text-2)"/>
                  <span style={{ flex: 1, fontSize: 14 }}>{m.l}</span>
                  <Icon name="chevron-right" size={16} color="var(--text-3)"/>
                </button>
              ))}
              <button onClick={() => setShowRoles(true)} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 4px',
                background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--text-1)',
                borderBottom: '1px solid var(--line)', textAlign: 'left', fontFamily: 'var(--font-sans)',
              }}>
                <Icon name="dashboard" size={18} color="var(--omega)"/>
                <span style={{ flex: 1, fontSize: 14 }}>Cambiar de rol</span>
                <Icon name="chevron-right" size={16} color="var(--text-3)"/>
              </button>
            </div>

            <button onClick={() => { close(); setScreen('login'); }} style={{
              width: '100%', padding: 14, marginTop: 8, borderRadius: 12,
              background: 'var(--omega-soft)', border: '1px solid rgba(226,62,74,0.3)',
              color: 'var(--omega)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0 14px' }}>
              <button onClick={() => setShowRoles(false)} style={{ background: 'transparent', border: 0, color: 'var(--text-1)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <Icon name="chevron-left" size={20}/>
              </button>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Cambiar de rol</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>Tu cuenta tiene acceso a varios roles. Elegí cuál querés usar ahora.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ROLES.map(r => (
                <button key={r.id} onClick={() => { switchRole(r.id); close(); }} style={{
                  display: 'flex', gap: 12, padding: 14, borderRadius: 12, alignItems: 'center',
                  background: currentRole === r.id ? r.c + '1a' : 'var(--bg-1)',
                  border: `1px solid ${currentRole === r.id ? r.c + '66' : 'var(--line)'}`,
                  cursor: 'pointer', color: 'var(--text-1)', textAlign: 'left', fontFamily: 'var(--font-sans)',
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: r.c + '22', color: r.c, display: 'grid', placeItems: 'center' }}>
                    <Icon name={r.icon} size={18}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{r.sub}</div>
                  </div>
                  {currentRole === r.id && (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: r.c, display: 'grid', placeItems: 'center' }}>
                      <Icon name="check" size={12} color="#0B0A0C"/>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ───────── ROLE SELECTOR (full screen — shown after login or first sign-in)
function RoleSelector({ setScreen, switchRole }) {
  const [selected, setSelected] = useAS(null);
  return (
    <div style={{ padding: '60px 28px 40px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <img src="assets/logo-white.png" alt="Omega" style={{ width: 24, height: 18, objectFit: 'contain' }}/>
          <div className="mono" style={{ color: 'var(--omega)' }}>Omega Medicina</div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 8, lineHeight: 1.05 }}>
          <em style={{ fontFamily: 'var(--font-serif)' }}>Elegí</em> tu<br/>experiencia
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 10, lineHeight: 1.5 }}>
          Cada rol muestra una interfaz diferente. Podés cambiar de rol en cualquier momento desde tu perfil.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {ROLES.map(r => (
          <button key={r.id} onClick={() => setSelected(r.id)} style={{
            display: 'flex', gap: 14, padding: 16, borderRadius: 14, alignItems: 'center',
            background: selected === r.id ? r.c + '1a' : 'var(--bg-1)',
            border: `1.5px solid ${selected === r.id ? r.c : 'var(--line)'}`,
            cursor: 'pointer', color: 'var(--text-1)', textAlign: 'left', fontFamily: 'var(--font-sans)',
            transition: 'all 0.15s',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: r.c + '22', color: r.c, display: 'grid', placeItems: 'center' }}>
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
              display: 'grid', placeItems: 'center',
            }}>
              {selected === r.id && <Icon name="check" size={12} color="#0B0A0C"/>}
            </div>
          </button>
        ))}
      </div>

      <button disabled={!selected} onClick={() => { switchRole(selected); }} className="btn btn-primary btn-full" style={{
        marginTop: 20, opacity: selected ? 1 : 0.4, cursor: selected ? 'pointer' : 'not-allowed',
      }}>
        Continuar <Icon name="chevron-right" size={18}/>
      </button>
    </div>
  );
}

// ───────── LOGIN
function Login({ setScreen }) {
  const [email, setEmail] = useAS('');
  const [pass, setPass] = useAS('');
  const [showPass, setShowPass] = useAS(false);
  return (
    <div style={{ padding: '60px 28px 40px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 36 }}>
        <img src="assets/logo-white.png" alt="Omega" style={{ width: 72, height: 56, objectFit: 'contain', marginBottom: 18 }}/>
        <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          <em style={{ fontFamily: 'var(--font-serif)' }}>Bienvenido</em><br/>de vuelta
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 10 }}>
          Ingresá a tu cuenta de Omega Medicina.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email</label>
          <input
            type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', marginTop: 6, padding: '14px 16px', borderRadius: 12,
              background: 'var(--bg-1)', border: '1px solid var(--line)', color: 'var(--text-1)',
              fontSize: 14, fontFamily: 'var(--font-sans)',
            }}
          />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contraseña</label>
            <button style={{ fontSize: 11, color: 'var(--omega)', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>¿Olvidaste?</button>
          </div>
          <div style={{ position: 'relative', marginTop: 6 }}>
            <input
              type={showPass ? 'text' : 'password'} placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)}
              style={{
                width: '100%', padding: '14px 44px 14px 16px', borderRadius: 12,
                background: 'var(--bg-1)', border: '1px solid var(--line)', color: 'var(--text-1)',
                fontSize: 14, fontFamily: 'var(--font-sans)',
              }}
            />
            <button onClick={() => setShowPass(!showPass)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 0, color: 'var(--text-3)', cursor: 'pointer', fontSize: 11, fontWeight: 500,
            }}>{showPass ? 'Ocultar' : 'Mostrar'}</button>
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
        ¿Sin cuenta? <button onClick={() => setScreen('create-profile')} style={{ background: 'transparent', border: 0, color: 'var(--omega)', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-sans)' }}>Crear perfil</button>
      </div>
    </div>
  );
}

// ───────── CREATE PROFILE
function CreateProfile({ setScreen }) {
  const [step, setStep] = useAS(1);
  const [data, setData] = useAS({
    name: '', email: '', pass: '', dob: '', gender: '', height: '', weight: '', role: 'patient',
  });
  const set = (k, v) => setData({ ...data, [k]: v });
  const total = 3;

  return (
    <div style={{ padding: '60px 28px 40px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => step === 1 ? setScreen('login') : setStep(step - 1)} style={{ background: 'transparent', border: 0, color: 'var(--text-1)', cursor: 'pointer', padding: 0 }}>
          <Icon name="chevron-left" size={22}/>
        </button>
        <div style={{ flex: 1 }}>
          <div className="mono">Paso {step} / {total}</div>
          <div className="bar" style={{ marginTop: 4 }}><span style={{ width: (step / total * 100) + '%', background: 'var(--omega)' }}/></div>
        </div>
      </div>

      {step === 1 && (
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              <em style={{ fontFamily: 'var(--font-serif)' }}>Creá</em> tu cuenta
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8 }}>Información básica para empezar.</div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nombre completo</label>
            <input value={data.name} onChange={e => set('name', e.target.value)} placeholder="Diego Alejandro T."
              style={{ width: '100%', marginTop: 6, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'var(--font-sans)' }}/>
          </div>
          <div>
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email</label>
            <input value={data.email} onChange={e => set('email', e.target.value)} placeholder="tu@email.com"
              style={{ width: '100%', marginTop: 6, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'var(--font-sans)' }}/>
          </div>
          <div>
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contraseña</label>
            <input type="password" value={data.pass} onChange={e => set('pass', e.target.value)} placeholder="Mínimo 8 caracteres"
              style={{ width: '100%', marginTop: 6, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'var(--font-sans)' }}/>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              <em style={{ fontFamily: 'var(--font-serif)' }}>Datos</em> personales
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8 }}>Nos ayudan a personalizar tus planes.</div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fecha de nacimiento</label>
            <input type="date" value={data.dob} onChange={e => set('dob', e.target.value)}
              style={{ width: '100%', marginTop: 6, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'var(--font-sans)' }}/>
          </div>
          <div>
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Género</label>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {['Masculino','Femenino','Otro','Prefiero no decir'].map(g => (
                <button key={g} onClick={() => set('gender', g)} style={{
                  flex: 1, padding: '12px 4px', borderRadius: 10,
                  background: data.gender === g ? 'var(--omega-soft)' : 'var(--bg-1)',
                  border: `1px solid ${data.gender === g ? 'rgba(226,62,74,0.4)' : 'var(--line)'}`,
                  color: data.gender === g ? 'var(--omega)' : 'var(--text-2)',
                  fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>{g}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Altura (cm)</label>
              <input type="number" value={data.height} onChange={e => set('height', e.target.value)} placeholder="178"
                style={{ width: '100%', marginTop: 6, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'var(--font-sans)' }}/>
            </div>
            <div>
              <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Peso (kg)</label>
              <input type="number" value={data.weight} onChange={e => set('weight', e.target.value)} placeholder="65"
                style={{ width: '100%', marginTop: 6, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'var(--font-sans)' }}/>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              <em style={{ fontFamily: 'var(--font-serif)' }}>¿Qué</em> rol<br/>te describe?
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8 }}>Podés solicitar acceso a más roles luego.</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ROLES.map(r => (
              <button key={r.id} onClick={() => set('role', r.id)} style={{
                display: 'flex', gap: 12, padding: 12, borderRadius: 12, alignItems: 'center',
                background: data.role === r.id ? r.c + '1a' : 'var(--bg-1)',
                border: `1.5px solid ${data.role === r.id ? r.c : 'var(--line)'}`,
                cursor: 'pointer', color: 'var(--text-1)', textAlign: 'left', fontFamily: 'var(--font-sans)',
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: r.c + '22', color: r.c, display: 'grid', placeItems: 'center' }}>
                  <Icon name={r.icon} size={16}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{r.sub}</div>
                </div>
                {data.role === r.id && (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: r.c, display: 'grid', placeItems: 'center' }}>
                    <Icon name="check" size={10} color="#0B0A0C"/>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => step < total ? setStep(step + 1) : setScreen('role-select')}
        className="btn btn-primary btn-full" style={{ marginTop: 'auto', marginBottom: 0 }}>
        {step < total ? 'Continuar' : 'Crear cuenta'} <Icon name="chevron-right" size={16}/>
      </button>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
        Al continuar aceptás los <span style={{ color: 'var(--omega)' }}>Términos</span> y la <span style={{ color: 'var(--omega)' }}>Política de privacidad</span>.
      </div>
    </div>
  );
}

Object.assign(window, { UserMenu, RoleSelector, Login, CreateProfile, ROLES });
