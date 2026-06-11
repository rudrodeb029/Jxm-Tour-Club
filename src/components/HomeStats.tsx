import React from 'react';
import { Edit2 } from 'lucide-react';

interface HomeStatsProps {
  onStatClick: (type: 'live' | 'participants' | 'winners') => void;
  isAdminMode?: boolean;
  onEdit?: (stat: { id: string; label: string; value: string }) => void;
  customStats?: { id: string; label: string; value: string; color: string }[];
}

const HomeStats: React.FC<HomeStatsProps> = ({ onStatClick, isAdminMode, onEdit, customStats }) => {
  const defaultStats = [
    { id: 'live', label: 'LIVE MATCHES', value: '2', color: '#10B981', glow: 'rgba(16, 185, 129, 0.5)' },
    { id: 'participants', label: 'PARTICIPANTS', value: '7', color: '#38BDF8', glow: 'rgba(56, 189, 248, 0.5)' },
    { id: 'winners', label: 'WINNERS', value: '5', color: '#FBBF24', glow: 'rgba(251, 191, 36, 0.5)' }
  ];

  const stats = customStats ? defaultStats.map(ds => {
    const cs = customStats.find(c => c.id === ds.id);
    return cs ? { ...ds, ...cs } : ds;
  }) : defaultStats;

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(3, 1fr)', 
      gap: '12px', 
      padding: '0 16px', 
      marginBottom: '32px',
      position: 'relative'
    }}>
      <style>{`
        .stat-card-3d {
          background: var(--nav-bg);
          border-radius: 20px;
          padding: 24px 8px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: var(--nav-shadow);
          border: 1px solid var(--nav-border);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card-3d:active {
          transform: translateY(4px);
          box-shadow: var(--card-shadow);
        }
        
        .bridge-pipe {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 12px;
          background: var(--text-muted);
          border-radius: 4px;
          box-shadow: var(--card-shadow);
          z-index: 10;
        }
        .bridge-left {
          left: -16px;
        }
        .bridge-right {
          right: -16px;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 900;
          margin-bottom: 2px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }
        .stat-label {
          font-size: 0.65rem;
          font-weight: 900;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-align: center;
          text-shadow: none;
        }

        /* 3D Physical Icon Box */
        .icon-box-3d {
          position: relative;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          background: var(--card-bg);
          border-radius: 12px;
          border: 1px solid var(--card-border);
          box-shadow: var(--card-shadow);
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px #10B981; }
          50% { opacity: 0.4; box-shadow: 0 0 2px #10B981; }
        }
        
        .led-indicator {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 12px;
          height: 12px;
          background: radial-gradient(circle at 30% 30%, #34d399, #047857);
          border-radius: 50%;
          border: 2px solid var(--modal-bg);
          box-shadow: 0 0 10px #10B981;
          animation: blink 1.5s infinite ease-in-out;
        }
      `}</style>
      
      {/* 1. Live Matches */}
      <div 
        className="stat-card-3d"
        onClick={() => onStatClick('live')}
        style={{ cursor: 'pointer' }}
      >
        <div className="icon-box-3d">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4l3-9 5 18 3-9h3"/>
          </svg>
          <div className="led-indicator" />
        </div>
        <div className="stat-value" style={{ color: '#10B981' }}>{stats[0].value}</div>
        <div className="stat-label">{stats[0].label}</div>
      </div>

      {/* 2. Participants */}
      <div 
        className="stat-card-3d"
        onClick={() => onStatClick('participants')}
        style={{ cursor: 'pointer' }}
      >
        <div className="bridge-pipe bridge-left" />
        <div className="bridge-pipe bridge-right" />
        
        <div className="icon-box-3d">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div className="stat-value" style={{ color: '#38BDF8' }}>{stats[1].value}</div>
        <div className="stat-label">{stats[1].label}</div>
      </div>

      {/* 3. Winners */}
      <div 
        className="stat-card-3d"
        onClick={() => onStatClick('winners')}
        style={{ cursor: 'pointer' }}
      >
        <div className="icon-box-3d">
          <div style={{ position: 'relative', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE68A" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#78350F" />
                </linearGradient>
              </defs>
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" fill="url(#goldGradient)" fillOpacity="0.4" />
            </svg>
          </div>
        </div>
        <div className="stat-value" style={{ color: '#FBBF24' }}>{stats[2].value}</div>
        <div className="stat-label">{stats[2].label}</div>
      </div>

    </div>
  );
};

export default HomeStats;
