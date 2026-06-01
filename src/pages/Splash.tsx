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
      color: 'var(--text-primary)'
    }}>
      <div className="animate-slide-up" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '6rem', fontWeight: 900, margin: 0, lineHeight: 0.9, letterSpacing: '-2px' }}>JXM</h1>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '2px', marginTop: '10px' }}>TOUR CLUB</h1>
      </div>
    </div>
  );
};

export default Splash;
