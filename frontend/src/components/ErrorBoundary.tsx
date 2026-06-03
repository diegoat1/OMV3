import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Al cambiar, resetea el estado de error (p. ej. al navegar a otra pantalla). */
  resetKey?: string | number
  onReset?: () => void
}
interface State {
  error: Error | null
}

/** Error Boundary global: si una pantalla lanza una excepción durante el render,
 *  la contiene y muestra un fallback EN LUGAR de dejar toda la app en blanco.
 *  El Sidebar/Topbar viven fuera del boundary, así que el usuario puede seguir
 *  navegando. Se resetea automáticamente al cambiar de pantalla (resetKey). */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Visible en la consola del browser para depurar qué pantalla y por qué.
    console.error('[OMV3] Error de render contenido:', error, info?.componentStack)
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="card" style={{ margin: 16, borderColor: 'rgba(226,62,74,0.35)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--err)' }}>
              Algo falló en esta pantalla
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              Contuvimos el error para que no se caiga toda la app. Probá de nuevo
              o cambiá de sección desde el menú lateral.
            </p>
            <pre
              style={{
                fontSize: 11, color: 'var(--text-3)', whiteSpace: 'pre-wrap',
                margin: '4px 0 0', maxHeight: 160, overflow: 'auto',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {this.state.error.message}
            </pre>
            <button
              type="button"
              className="btn"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => {
                this.setState({ error: null })
                this.props.onReset?.()
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
