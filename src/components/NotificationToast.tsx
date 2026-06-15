import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Gamepad2, Key, ArrowRight } from 'lucide-react';
import { markNotificationRead, type GameNotification } from '../services/notificationService';

interface NotificationToastProps {
  notification: GameNotification | null;
  onDismiss: () => void;
}

const NotificationToast = ({ notification, onDismiss }: NotificationToastProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification) {
      // Small delay before showing for animation
      const showTimer = setTimeout(() => setIsVisible(true), 50);
      
      // Auto-dismiss after 10 seconds
      const dismissTimer = setTimeout(() => handleDismiss(), 10000);

      // Play notification chime using Web Audio API
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + duration);
        };
        playTone(880, 0, 0.15);
        playTone(1100, 0.15, 0.15);
        playTone(1320, 0.3, 0.25);
      } catch {}

      return () => {
        clearTimeout(showTimer);
        clearTimeout(dismissTimer);
      };
    } else {
      setIsVisible(false);
    }
  }, [notification]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      onDismiss();
    }, 300);
  }, [onDismiss]);

  const handleClick = useCallback(() => {
    if (notification) {
      markNotificationRead(notification.id);
      navigate(`/match/${notification.matchId}/card/${notification.cardId}`);
      handleDismiss();
    }
  }, [notification, navigate, handleDismiss]);

  if (!notification || !isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: `translateX(-50%) translateY(${isExiting ? '-120%' : '0'})`,
        width: 'calc(100% - 32px)',
        maxWidth: '420px',
        zIndex: 99999,
        animation: isExiting ? 'none' : 'slideDownBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        transition: isExiting ? 'transform 0.3s ease-in' : 'none',
      }}
    >
      <div
        onClick={handleClick}
        style={{
          background: 'linear-gradient(135deg, rgba(16, 24, 48, 0.98), rgba(10, 14, 23, 0.98))',
          border: '1px solid rgba(249, 115, 22, 0.4)',
          borderRadius: '20px',
          padding: '16px',
          cursor: 'pointer',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(249, 115, 22, 0.2), 0 0 60px rgba(249, 115, 22, 0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated glow bar at top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #F97316, #FBBF24, #F97316, transparent)',
          animation: 'glowPulse 2s ease-in-out infinite',
        }} />

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(251, 191, 36, 0.15))',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'iconPulse 1.5s ease-in-out infinite',
            }}>
              <span style={{ fontSize: '1.3rem' }}>🎮</span>
            </div>
            <div>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#F97316',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Game ID Ready!
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.2,
              }}>
                {notification.cardName}
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              markNotificationRead(notification.id);
              handleDismiss();
            }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Game ID & Password chips */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            flex: 1,
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Gamepad2 size={14} color="#F97316" />
            <div>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Room ID</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#F97316', fontFamily: 'monospace' }}>
                {notification.gameId || '—'}
              </div>
            </div>
          </div>
          <div style={{
            flex: 1,
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Key size={14} color="#FBBF24" />
            <div>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Password</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#FBBF24', fontFamily: 'monospace' }}>
                {notification.gamePassword || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.35)',
            fontWeight: 600,
          }}>
            {notification.matchName}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.7rem',
            fontWeight: 800,
            color: '#F97316',
          }}>
            Open Match <ArrowRight size={12} />
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes slideDownBounce {
          0% { opacity: 0; transform: translateX(-50%) translateY(-100%); }
          60% { opacity: 1; transform: translateX(-50%) translateY(8px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
