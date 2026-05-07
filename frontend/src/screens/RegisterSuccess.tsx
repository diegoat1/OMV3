import { Icon } from '../components/Icon'

interface Props {
  email: string
  onBackToLogin: () => void
}

export function RegisterSuccess({ email, onBackToLogin }: Props) {
  return (
    <div className="reg-screen reg-success">
      <div className="reg-success-icon">
        <Icon name="check" size={32} />
      </div>
      <div className="display reg-success-title">
        <em>Casi</em> listo
      </div>
      <div className="reg-success-sub">
        Creamos tu cuenta y la dejamos <b>pendiente de verificación</b>. Te avisaremos por email cuando un administrador la apruebe.
      </div>

      <div className="reg-success-email">
        <div className="mono reg-success-email-label">Email registrado</div>
        <div className="reg-success-email-value">{email}</div>
      </div>

      <div className="reg-success-steps">
        <div className="reg-success-step">
          <div className="reg-success-step-num">1</div>
          <div className="reg-success-step-text">
            <b>Confirmá tu email</b> revisando tu bandeja de entrada.
          </div>
        </div>
        <div className="reg-success-step">
          <div className="reg-success-step-num">2</div>
          <div className="reg-success-step-text">
            <b>Esperá la aprobación</b> del administrador. Te llegará un mail.
          </div>
        </div>
        <div className="reg-success-step">
          <div className="reg-success-step-num">3</div>
          <div className="reg-success-step-text">
            <b>Iniciá sesión</b> y completá tu perfil con tu profesional.
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-full reg-submit"
        onClick={onBackToLogin}
      >
        Volver al login
      </button>
    </div>
  )
}
