import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Splash = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-gradient)',
      position: 'relative',
      transition: 'background 0.5s ease',
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes splashFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.02); }
        }
        @keyframes splashGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.15); }
        }
        @keyframes splashFadeIn {
          from { opacity: 0; transform: scale(0.8) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes splashPulseRing {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      {/* Background ambient glow */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249, 111, 46, 0.12) 0%, rgba(16, 185, 129, 0.06) 40%, transparent 70%)',
        filter: 'blur(50px)',
        animation: 'splashGlow 3s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Pulse ring effect */}
      <div style={{
        position: 'absolute',
        width: '220px',
        height: '220px',
        borderRadius: '50%',
        border: '2px solid rgba(249, 111, 46, 0.15)',
        animation: 'splashPulseRing 2.5s ease-out infinite',
        pointerEvents: 'none'
      }} />

      {/* 3D Logo */}
      <div style={{
        animation: 'splashFadeIn 0.8s ease-out forwards, splashFloat 3s ease-in-out 0.8s infinite',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <img 
          src="/images/jxm_3d_logo.png" 
          alt="JXM Tour Club" 
          style={{
            width: '200px',
            height: '200px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 8px 24px rgba(249, 111, 46, 0.3)) drop-shadow(0 4px 12px rgba(16, 185, 129, 0.2))',
            marginBottom: '24px'
          }}
        />
        <h1 style={{ 
          fontSize: '1.2rem', 
          fontWeight: 800, 
          margin: 0, 
          letterSpacing: '6px', 
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          textShadow: '0 2px 8px rgba(0,0,0,0.6)'
        }}>
          TOUR CLUB
        </h1>
      </div>

      {/* Loading dots */}
      <div style={{
        position: 'absolute',
        bottom: '60px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--accent-orange)',
            opacity: 0.4,
            animation: `splashGlow 1.2s ease-in-out ${i * 0.2}s infinite`
          }} />
        ))}
      </div>
    </div>
  );
};

export default Splash;
