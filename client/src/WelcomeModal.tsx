import { Map, Eye, Plus } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const WelcomeModal = ({ onClose }: Props) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">
          Bienvenido al <span className="text-highlight">Mapa Oculto</span>
        </h2>
        
        <p className="modal-description">
          Una plataforma anónima para compartir secretos, confesiones y sucesos extraños en ubicaciones reales.
        </p>

        <div className="modal-step">
          <div className="modal-icon-box"><Map size={20} /></div>
          <div>
            <h4 className="step-title">Explora</h4>
            <p className="step-desc">
              Navega por el mapa y descubre historias ocultas a tu alrededor.
            </p>
          </div>
        </div>

        <div className="modal-step">
          <div className="modal-icon-box"><Eye size={20} /></div>
          <div>
            <h4 className="step-title">Lee Secretos</h4>
            <p className="step-desc">
              Haz clic en los pines para leer confesiones anónimas clasificadas por emoción.
            </p>
          </div>
        </div>

        <div className="modal-step">
          <div className="modal-icon-box"><Plus size={20} /></div>
          <div>
            <h4 className="step-title">Participa</h4>
            <p className="step-desc">
              Haz clic en cualquier lugar del mapa para dejar tu propia huella. Es 100% anónimo.
            </p>
          </div>
        </div>

        <button className="modal-button" onClick={onClose}>
          Entendido, quiero entrar
        </button>

        <p className="modal-footer">
          Al continuar, aceptas respetar a la comunidad.
        </p>
      </div>
    </div>
  );
};