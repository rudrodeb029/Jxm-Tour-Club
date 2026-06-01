import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import ModalPortal from './ModalPortal';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, title = "Congratulations!", message }) => {
  if (!isOpen) return null;

  return (
    <ModalPortal>
    <div 
      className="animate-fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div 
        className="animate-scale-up"
        style={{
          background: 'var(--modal-bg)',
          width: '100%',
          maxWidth: '380px',
          borderRadius: '32px',
          padding: '40px 24px',
          textAlign: 'center',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background glow */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '200px',
          background: 'var(--accent-gradient)',
          filter: 'blur(60px)',
          opacity: 0.15,
          borderRadius: '50%',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(74, 222, 128, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            border: '1px solid rgba(74, 222, 128, 0.2)'
          }}>
            <CheckCircle2 size={48} color="var(--accent-green)" strokeWidth={2.5} />
          </div>

          <h3 style={{ 
            fontSize: '1.8rem', 
            fontWeight: 900, 
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #FFF 0%, #AAA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            {title}
          </h3>
          
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '1rem', 
            lineHeight: 1.6, 
            marginBottom: '32px',
            fontWeight: 500
          }}>
            {message}
          </p>

          <button 
            onClick={onClose}
            style={{
              width: '100%',
              padding: '15px 20px',
              borderRadius: '14px',
              background: 'var(--accent-gradient)',
              border: 'none',
              color: 'white',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 8px 16px rgba(249, 111, 46, 0.3)',
              transition: 'transform 0.2s ease'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};

export default SuccessModal;
