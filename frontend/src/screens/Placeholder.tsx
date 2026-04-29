interface PlaceholderProps {
  title: string
  hint?: string
}

export function Placeholder({ title, hint }: PlaceholderProps) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          {hint && <div className="sub">{hint}</div>}
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <h3>Pantalla en construcción</h3>
          <span className="mono">Pendiente</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
          Esta sección se va a portar desde los mockups en{' '}
          <code style={{ fontFamily: 'var(--font-mono)' }}>_design-reference/</code>.
          El shell ya está listo — la UI específica se irá agregando pantalla por pantalla.
        </p>
      </div>
    </>
  )
}
