import React, { useEffect, useState, useMemo } from 'react';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { Trophy, Medal, Star, X, Crown, Sparkles, Target } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import ModalPortal from './ModalPortal';

const WinnerCelebration: React.FC = () => {
  const { activeWinnerCeremony, clearWinnerCeremony } = useAdminDashboard();
  const { formatCurrency } = useCurrency();
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Generate random particles
  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2
    }));
  }, []);

  useEffect(() => {
    if (activeWinnerCeremony) {
      setMounted(true);
      setTimeout(() => setIsVisible(true), 50);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          clearWinnerCeremony();
          setMounted(false);
        }, 500); 
      }, 5000); // Show for 5s
      return () => clearTimeout(timer);
    }
  }, [activeWinnerCeremony, clearWinnerCeremony]);

  if (!mounted) return null;

  return (
    <ModalPortal>
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: isVisible ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0)',
        backdropFilter: isVisible ? 'blur(12px)' : 'blur(0px)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      {/* Background Particles */}
      {isVisible && particles.map((p) => (
        <div 
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: 'white',
            borderRadius: '50%',
            opacity: 0.3,
            filter: 'blur(1px)',
            animation: `float-particle ${p.duration}s infinite ease-in-out ${p.delay}s`,
            pointerEvents: 'none'
          }}
        />
      ))}

      <div 
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--card-bg)',
          backdropFilter: 'blur(30px) saturate(150%)',
          borderRadius: '48px',
          border: '1px solid rgba(255,255,255,0.12)',
          padding: '40px 32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.05)',
          textAlign: 'center',
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(40px)',
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Animated Accent Glows */}
        <div style={{
          position: 'absolute',
          top: '-20%', left: '-20%',
          width: '60%', height: '60%',
          background: 'radial-gradient(circle, rgba(249, 111, 46, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'pulse-glow 4s infinite alternate'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%', right: '-20%',
          width: '60%', height: '60%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'pulse-glow 4s infinite alternate-reverse'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ 
              width: '100px', height: '100px', 
              background: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)', 
              borderRadius: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 20px 40px rgba(217, 119, 6, 0.3)',
              transform: 'rotate(-8deg)',
              animation: 'bounce-trophy 2s infinite ease-in-out'
            }}>
              <Trophy size={50} color="white" />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={16} className="text-yellow-400" />
              <span style={{ 
                fontSize: '0.85rem', 
                fontWeight: 800, 
                color: 'var(--accent-orange)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.2em' 
              }}>
                Victory Ceremony
              </span>
              <Sparkles size={16} className="text-yellow-400" />
            </div>

            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 900, 
              color: 'white', 
              margin: 0, 
              lineHeight: 1.1,
              textShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              MATCH <br />
              <span style={{ 
                background: 'linear-gradient(to right, #fff, var(--accent-orange))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                COMPLETE!
              </span>
            </h2>
            <div style={{ 
              marginTop: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              background: 'var(--input-bg)',
              borderRadius: '100px',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600,
              border: '1px solid var(--card-border)'
            }}>
              <Target size={14} />
              {activeWinnerCeremony?.matchName}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
            {[...(activeWinnerCeremony?.winners || [])].sort((a, b) => a.rank - b.rank).map((winner, idx) => (
              <div 
                key={winner.userId}
                style={{
                  background: 'var(--input-bg)',
                  padding: '20px',
                  borderRadius: '28px',
                  border: '1px solid var(--card-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  animation: `slide-in-celebration 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards ${idx * 0.15 + 0.3}s`,
                  opacity: 0,
                  transform: 'translateX(-20px)',
                  transition: 'all 0.3s ease'
                }}
                className="winner-item-hover"
              >
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '56px', height: '56px',
                    borderRadius: '18px',
                    background: winner.rank === 1 
                      ? 'linear-gradient(135deg, #FBBF24 0%, #B45309 100%)' 
                      : winner.rank === 2 
                      ? 'linear-gradient(135deg, #94A3B8 0%, #475569 100%)' 
                      : 'linear-gradient(135deg, #D97706 0%, #78350F 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 900, fontSize: '1.5rem',
                    boxShadow: `0 8px 20px ${winner.rank === 1 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(0,0,0,0.3)'}`
                  }}>
                    {winner.rank}
                  </div>
                  {winner.rank === 1 && (
                    <div style={{ 
                      position: 'absolute', top: '-12px', left: '50%', 
                      transform: 'translateX(-50%) rotate(-10deg)',
                      animation: 'float-crown 2s infinite ease-in-out'
                    }}>
                      <Crown size={24} className="text-yellow-400 fill-yellow-400" />
                    </div>
                  )}
                </div>
                
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, color: 'white', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>{winner.userName}</div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: winner.rank === 1 ? '#FBBF24' : 'rgba(255,255,255,0.4)', 
                    fontWeight: 700, 
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {winner.rank === 1 ? 'Ultimate Champion' : winner.rank === 2 ? 'Elite Runner Up' : 'Bronze Contender'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, color: '#10B981', fontSize: '1.4rem', fontFamily: 'monospace' }}>+{formatCurrency(winner.reward)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>CLAIMED</div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setIsVisible(false)}
            style={{ 
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid var(--card-border)',
              padding: '12px 24px',
              borderRadius: '100px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            DISMISS CEREMONY
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse-glow {
          from { opacity: 0.3; transform: scale(1); }
          to { opacity: 0.6; transform: scale(1.2); }
        }
        @keyframes bounce-trophy {
          0%, 100% { transform: translateY(0) rotate(-8deg) scale(1); }
          50% { transform: translateY(-15px) rotate(-8deg) scale(1.05); }
        }
        @keyframes float-crown {
          0%, 100% { transform: translateX(-50%) translateY(0) rotate(-10deg); }
          50% { transform: translateX(-50%) translateY(-5px) rotate(-5deg); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 0.4; }
          80% { opacity: 0.4; }
          100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
        }
        @keyframes slide-in-celebration {
          from { opacity: 0; transform: translateX(-30px); filter: blur(10px); }
          to { opacity: 1; transform: translateX(0); filter: blur(0); }
        }
        .winner-item-hover:hover {
          background: rgba(255,255,255,0.08) !important;
          transform: scale(1.03) translateX(5px) !important;
          border-color: rgba(255,255,255,0.2) !important;
        }
      `}</style>
    </div>
    </ModalPortal>
  );
};

export default WinnerCelebration;
