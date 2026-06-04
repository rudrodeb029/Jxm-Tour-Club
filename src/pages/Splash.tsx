import { useState, useEffect } from 'react';

interface SplashProps {
  onComplete?: () => void;
}

const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Checking for updates...');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      // Fast start, slow middle, fast end to mimic real OTA downloads
      if (currentProgress < 20) {
        currentProgress += Math.floor(Math.random() * 3) + 2;
        setStatusText('Checking for updates...');
      } else if (currentProgress < 75) {
        currentProgress += Math.floor(Math.random() * 4) + 1;
        setStatusText('Downloading live updates...');
      } else if (currentProgress < 98) {
        currentProgress += Math.floor(Math.random() * 2) + 1;
        setStatusText('Installing configuration...');
      } else {
        currentProgress = 100;
        setStatusText('Your app is updated');
        setIsDone(true);
        clearInterval(interval);
      }
      setProgress(Math.min(currentProgress, 100));
    }, 45); // Takes around 3-4 seconds total

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isDone) {
      // Hold the success message for 1 second, then call onComplete
      const timeout = setTimeout(() => {
        if (onComplete) onComplete();
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [isDone, onComplete]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-gradient)',
      position: 'relative',
      color: 'var(--text-primary)',
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <style>{`
        /* 3D Orbit Rotations */
        @keyframes rotate3DOuter {
          0% { transform: rotateX(60deg) rotateY(20deg) rotateZ(0deg); }
          100% { transform: rotateX(60deg) rotateY(20deg) rotateZ(360deg); }
        }
        @keyframes rotate3DInner {
          0% { transform: rotateX(60deg) rotateY(-20deg) rotateZ(360deg); }
          100% { transform: rotateX(60deg) rotateY(-20deg) rotateZ(0deg); }
        }
        
        /* Pulse Effects */
        @keyframes neonPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(249, 111, 46, 0.4), inset 0 0 15px rgba(249, 111, 46, 0.2); }
          50% { box-shadow: 0 0 30px rgba(249, 111, 46, 0.8), inset 0 0 25px rgba(249, 111, 46, 0.4); }
        }
        @keyframes neonPulseGreen {
          0%, 100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.4), inset 0 0 15px rgba(16, 185, 129, 0.2); }
          50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.8), inset 0 0 25px rgba(16, 185, 129, 0.4); }
        }
        @keyframes bounceArrow {
          0%, 100% { transform: translateY(-5px); }
          50% { transform: translateY(5px); }
        }
        
        /* General Glows */
        @keyframes glowAmbient {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        
        /* 3D Transform Setup */
        .stage-3d {
          perspective: 800px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 260px;
          height: 260px;
          position: relative;
        }
        
        .orbit-outer {
          position: absolute;
          width: 220px;
          height: 220px;
          border: 4px solid var(--accent-orange);
          border-radius: 50%;
          border-top-color: transparent;
          border-bottom-color: transparent;
          animation: rotate3DOuter 3s linear infinite;
          transform-style: preserve-3d;
          box-shadow: 0 0 15px rgba(249, 111, 46, 0.3);
        }

        .orbit-inner {
          position: absolute;
          width: 160px;
          height: 160px;
          border: 3px dashed #10B981;
          border-radius: 50%;
          border-left-color: transparent;
          border-right-color: transparent;
          animation: rotate3DInner 2s linear infinite;
          transform-style: preserve-3d;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
        }

        /* Centered 3D Core Sphere */
        .core-sphere {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 10;
        }
        
        .updating-core {
          background: radial-gradient(circle at 35% 35%, #ffedd5 0%, #f97316 60%, #c2410c 100%);
          border: 1px solid rgba(255,255,255,0.2);
          animation: neonPulse 2s infinite ease-in-out;
        }

        .completed-core {
          background: radial-gradient(circle at 35% 35%, #d1fae5 0%, #10b981 60%, #047857 100%);
          border: 1px solid rgba(255,255,255,0.2);
          animation: neonPulseGreen 2s infinite ease-in-out;
          transform: scale(1.1);
        }
        
        .arrow-down-3d {
          animation: bounceArrow 1.5s infinite ease-in-out;
          color: white;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        }

        .success-checkmark-3d {
          color: white;
          filter: drop-shadow(0 2px 8px rgba(16,185,129,0.8));
          animation: scaleCheckmark 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes scaleCheckmark {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Glassmorphic progress tracker */
        .glass-progress-container {
          background: var(--nav-bg);
          border: 1px solid var(--nav-border);
          border-radius: 20px;
          padding: 16px 24px;
          width: 85%;
          max-width: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          box-shadow: var(--nav-shadow);
          margin-top: 32px;
          backdrop-filter: blur(8px);
        }

        .progress-bar-bg {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-orange), #10B981);
          border-radius: 10px;
          transition: width 0.1s ease-out;
          box-shadow: 0 0 10px var(--accent-orange);
        }

        .progress-text {
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
      `}</style>

      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: isDone 
          ? 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(249, 111, 46, 0.15) 0%, transparent 70%)',
        filter: 'blur(50px)',
        animation: 'glowAmbient 4s ease-in-out infinite',
        pointerEvents: 'none',
        transition: 'background 0.5s ease'
      }} />

      {/* JXM Logo in background */}
      <div style={{ position: 'absolute', top: '40px', opacity: 0.15 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '8px', color: 'var(--text-secondary)' }}>JXM ARENA</h1>
      </div>

      {/* 3D Animated Update Area */}
      <div className="stage-3d">
        <div className="orbit-outer" style={{ borderColor: isDone ? '#10B981' : 'var(--accent-orange)', transition: 'border-color 0.5s ease' }} />
        <div className="orbit-inner" style={{ borderStyle: isDone ? 'solid' : 'dashed', transition: 'border-style 0.5s ease' }} />
        
        <div className={`core-sphere ${isDone ? 'completed-core' : 'updating-core'}`}>
          {isDone ? (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="success-checkmark-3d">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="arrow-down-3d">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
          )}
        </div>
      </div>

      {/* Progress & Status Card */}
      <div className="glass-progress-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <span className="progress-text" style={{ color: isDone ? '#10B981' : 'var(--text-secondary)' }}>
            {statusText}
          </span>
          <span className="progress-text" style={{ color: isDone ? '#10B981' : 'var(--text-primary)' }}>
            {progress}%
          </span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ 
            width: `${progress}%`,
            background: isDone ? '#10B981' : 'linear-gradient(90deg, var(--accent-orange), #10B981)',
            boxShadow: isDone ? '0 0 10px #10B981' : '0 0 10px var(--accent-orange)'
          }} />
        </div>
      </div>
    </div>
  );
};

export default Splash;
