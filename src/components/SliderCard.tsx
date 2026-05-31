import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { AnimatedCounter } from './AnimatedCounter';

interface SliderCardProps {
  group: string;
  players: string;
  team1: { name: string; logo: string; percentage: string; color: string };
  team2: { name: string; logo: string; percentage: string; color: string };
  score: string;
  time: string;
  bids: string[];
  totalBids: string;
  currentParticipants: number;
  maxParticipants: number;
  status: 'upcoming' | 'live' | 'finished';
  name: string;
  onClick?: () => void;
  onJoin?: (e: React.MouseEvent) => void;
  isAdminMode?: boolean;
  onEdit?: () => void;
  liveStartedAt?: number;
  prizePool?: number;
  firstPrize?: number;
  secondPrize?: number;
  thirdPrize?: number;
  version?: string;
  perKillReward?: number;
  map?: string;
}

const SliderCard = ({ group, players, team1, team2, score, time, bids, totalBids, currentParticipants, maxParticipants, onClick, onJoin, isAdminMode, onEdit, status, name, liveStartedAt, prizePool, firstPrize, secondPrize, thirdPrize, version, perKillReward, map }: SliderCardProps) => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const isLive = status === 'live';
  const [now, setNow] = useState(Date.now());
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    if (status === 'finished') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const isFull = false; // Removed limit: currentParticipants >= maxParticipants;
  const progress = Math.min((currentParticipants / maxParticipants) * 100, 100);

  const parsedTotalBids = totalBids ? parseFloat(totalBids.replace(/[^0-9.-]+/g, '')) || 0 : 0;
  const entryFee = bids && bids.length > 0 ? parseFloat(bids[0].replace(/[^0-9.-]+/g, '')) || 10 : 10;
  const count = currentParticipants > 0 ? currentParticipants : 12;
  const totalPrizePool = prizePool !== undefined && prizePool > 0 ? prizePool : (parsedTotalBids > 0 ? parsedTotalBids : count * entryFee * 1.8);
  
  const firstPrizeValue = Math.round((firstPrize !== undefined && firstPrize > 0 ? firstPrize : totalPrizePool * 0.5) * 100) / 100;
  const secondPrizeValue = Math.round((secondPrize !== undefined && secondPrize > 0 ? secondPrize : totalPrizePool * 0.3) * 100) / 100;
  const thirdPrizeValue = Math.round((thirdPrize !== undefined && thirdPrize > 0 ? thirdPrize : totalPrizePool * 0.2) * 100) / 100;

  return (
    <div 
      onClick={!isFull ? onClick : undefined}
      style={{
        background: 'var(--nav-bg)',
        color: 'var(--text-primary)',
        borderRadius: '28px',
        padding: '80px 20px 24px',
        marginTop: '65px',
        width: '100%',
        border: '1px solid var(--nav-border)',
        cursor: isFull ? 'not-allowed' : 'pointer',
        position: 'relative',
        boxShadow: '15px 20px 35px rgba(0,0,0,0.8), 0 0 15px rgba(179, 144, 70, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {isAdminMode && (
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
          style={{ 
            position: 'absolute', top: '16px', right: '16px', 
            background: 'linear-gradient(180deg, #f97316 0%, #c2410c 100%)', 
            border: '1px solid #9a3412',
            borderTop: '1px solid #fdba74',
            borderRadius: '8px', padding: '6px 12px', color: 'white', 
            fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', zIndex: 10,
            boxShadow: '0 4px 0 #7c2d12, 0 8px 10px rgba(0,0,0,0.5)',
            textShadow: 'var(--text-shadow-sm)',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(4px)';
            e.currentTarget.style.boxShadow = '0 0 0 #7c2d12, 0 4px 5px rgba(0,0,0,0.5)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 0 #7c2d12, 0 8px 10px rgba(0,0,0,0.5)';
          }}
        >
          EDIT
        </button>
      )}

      {/* Overlapping Map Circle (Physical Lens) */}
      <div style={{
        position: 'absolute',
        top: '-65px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '130px',
        height: '130px',
        borderRadius: '50%',
        border: '3px solid var(--nav-border)',
        boxShadow: 'var(--card-shadow)',
        backgroundImage: `url('/images/gaming_arena_banner.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 10
      }}>
        {/* Glass reflection highlight on the map */}
        <div style={{
          position: 'absolute', top: '5%', left: '15%', width: '70%', height: '30%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        {isLive && (
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '-15px',
            background: 'linear-gradient(180deg, #10B981, #047857)',
            border: '2px solid #064e3b',
            borderTop: '2px solid #34d399',
            borderRadius: '16px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 0 #022c22, 0 8px 15px rgba(0,0,0,0.6)'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px #fff' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.05em', textShadow: 'var(--text-shadow-sm)' }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 -1px 1px rgba(255,255,255,0.1)' }}>{name}</h3>
      </div>

      {/* Skewed Metallic Prize Pool Cards */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '36px', padding: '0 4px' }}>
        
        {/* Total Prize Pool */}
        <div style={{ 
          flex: 1.2, 
          background: 'linear-gradient(135deg, #0d5f66, #053338)', 
          border: '1px solid #fde047',
          borderRadius: '8px', 
          padding: '12px 6px', 
          transform: 'skewX(-8deg)',
          boxShadow: 'var(--card-shadow)',
          display: 'flex', justifyContent: 'center'
        }}>
          <div style={{ transform: 'skewX(8deg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#fde047', textTransform: 'uppercase', marginBottom: '4px', lineHeight: 1.1, textAlign: 'center' }}>
              <span>💰 TOTAL</span><br/><span>PRIZE POOL</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#4ADE80', textShadow: 'var(--text-shadow-md)' }}>{formatCurrency(totalPrizePool)}</div>
          </div>
        </div>
        
        {/* 1st Win (Gold) */}
        <div style={{ 
          flex: 1, 
          background: 'linear-gradient(135deg, #d4af37, #8b6b17)', 
          border: '1px solid #fef08a',
          borderRadius: '8px', 
          padding: '12px 6px', 
          transform: 'skewX(-8deg)',
          boxShadow: 'var(--card-shadow)',
          display: 'flex', justifyContent: 'center'
        }}>
          <div style={{ transform: 'skewX(8deg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px', color: '#fef08a', textShadow: 'var(--text-shadow-sm)' }}>🏆 1ST WIN</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)', textShadow: 'var(--text-shadow-md)' }}>{formatCurrency(firstPrizeValue)}</div>
          </div>
        </div>

        {/* 2nd Win (Silver) */}
        <div style={{ 
          flex: 1, 
          background: 'linear-gradient(135deg, #94a3b8, #475569)', 
          border: '1px solid #f1f5f9',
          borderRadius: '8px', 
          padding: '12px 6px', 
          transform: 'skewX(-8deg)',
          boxShadow: 'var(--card-shadow)',
          display: 'flex', justifyContent: 'center'
        }}>
          <div style={{ transform: 'skewX(8deg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px', color: '#f1f5f9', textShadow: 'var(--text-shadow-sm)' }}>🥈 2ND WIN</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)', textShadow: 'var(--text-shadow-md)' }}>{formatCurrency(secondPrizeValue)}</div>
          </div>
        </div>

        {/* 3rd Win (Bronze) */}
        <div style={{ 
          flex: 1, 
          background: 'linear-gradient(135deg, #92400e, #5c2705)', 
          border: '1px solid #fbbf24',
          borderRadius: '8px', 
          padding: '12px 6px', 
          transform: 'skewX(-8deg)',
          boxShadow: 'var(--card-shadow)',
          display: 'flex', justifyContent: 'center'
        }}>
          <div style={{ transform: 'skewX(8deg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px', color: '#fcd34d', textShadow: 'var(--text-shadow-sm)' }}>🥉 3RD WIN</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)', textShadow: 'var(--text-shadow-md)' }}>{formatCurrency(thirdPrizeValue)}</div>
          </div>
        </div>
      </div>

      {/* Capacity & Physical Speedometer Section */}
      <div style={{ position: 'relative', marginBottom: '45px', marginTop: '10px' }}>
        {/* Capacity labels removed */}
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '50px' }}>
          {/* Left Bar (Recessed Track) */}
          <div style={{ flex: 1, height: '16px', background: 'var(--modal-bg)', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.8)' }}>
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #F96F2E, #E34360)', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), 0 0 10px rgba(227, 67, 96, 0.5)' }} />
          </div>
          
          {/* Speedometer Center Dial */}
          <div style={{ 
            width: '120px', height: '60px', 
            background: 'linear-gradient(180deg, #334155, #1e293b)', 
            borderTopLeftRadius: '60px', borderTopRightRadius: '60px',
            border: '4px solid #0f172a', borderBottom: 'none',
            boxShadow: '0 -10px 20px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1)',
            position: 'relative',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '6px',
            marginLeft: '-4px', marginRight: '-4px', zIndex: 2
          }}>
            {/* Ticks arc SVG */}
            <svg viewBox="0 0 100 50" style={{ position: 'absolute', top: 8, left: 6, width: '100px', height: '50px' }}>
              <path d="M 5 45 A 40 40 0 0 1 95 45" fill="none" stroke="#f97316" strokeWidth="6" strokeDasharray="4 6" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))' }} />
              {/* Active Pointer */}
              <line 
                x1="50" y1="45" 
                x2={50 + 32 * Math.cos(Math.PI - (progress / 100) * Math.PI)} 
                y2={45 - 32 * Math.sin(Math.PI - (progress / 100) * Math.PI)} 
                stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" 
                style={{ transition: 'all 1s ease', transformOrigin: '50px 45px', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.8))' }}
              />
              {/* Center Dot (Screw) */}
              <circle cx="50" cy="45" r="6" fill="#94a3b8" />
              <circle cx="50" cy="45" r="3" fill="#334155" />
            </svg>
          </div>

          {/* Right Bar (Recessed Empty Track) */}
          <div style={{ flex: 1, height: '16px', background: 'var(--modal-bg)', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.8)' }} />
        </div>
      </div>

      {/* Bottom Join Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', marginLeft: '0px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #334155', background: 'var(--modal-bg)', marginLeft: i > 1 ? '-14px' : '0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.6)' }}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+123}`} alt="" style={{ width: '100%' }} />
              </div>
            ))}
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{currentParticipants} Joined</span>
        </div>
        
        {/* Giant Physical 3D Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onJoin?.(e); }}
          disabled={isFull}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          style={{ 
            background: isFull ? '#334155' : 'linear-gradient(180deg, #F97316 0%, #c2410c 100%)', 
            padding: '8px 20px', 
            borderRadius: '10px', 
            border: 'none', 
            borderTop: isFull ? '1px solid #475569' : '1px solid #fdba74',
            color: isFull ? '#94a3b8' : 'white', 
            fontWeight: 900, 
            fontSize: '0.9rem',
            letterSpacing: '0.05em',
            boxShadow: isFull 
              ? 'inset 0 4px 6px rgba(0,0,0,0.6)'
              : (isPressed 
                  ? '0 0 0 #7c2d12, inset 0 4px 8px rgba(0,0,0,0.6)' 
                  : '0 4px 0 #7c2d12, 0 8px 15px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.3)'),
            transform: isPressed ? 'translateY(4px)' : 'translateY(0)',
            cursor: isFull ? 'not-allowed' : 'pointer',
            transition: 'all 0.1s ease',
            textShadow: isFull ? 'none' : '0 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {isFull ? 'FULL' : 'JOIN'}
        </button>
      </div>
    </div>
  );
};

export default SliderCard;
