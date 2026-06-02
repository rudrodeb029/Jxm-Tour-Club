import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { useAdmin } from '../context/AdminContext';

const Participants = () => {
  const navigate = useNavigate();
  const { adminUsers } = useAdminDashboard();
  const { isAdminMode } = useAdmin();

  return (
    <div className="page-container" style={{ padding: '20px', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '8px', borderRadius: '12px', color: '#38BDF8' }}>
              <Users size={24} />
            </div>
            Top <span style={{ color: 'var(--accent-orange)' }}>Participants</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem', fontWeight: 600 }}>Most Active Players</p>
        </div>
      </div>

      {/* Participants List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {adminUsers.map((player, index) => (
          <div 
            key={player.id} 
            className="animate-slide-up"
            style={{ 
              animationDelay: `${index * 0.1}s`,
              opacity: 0,
              animationFillMode: 'forwards',
              background: 'linear-gradient(145deg, var(--glass-bg), rgba(30, 41, 59, 0.4))', 
              padding: '20px', 
              borderRadius: '24px', 
              border: '1px solid var(--glass-border)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px', 
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
          >
            {isAdminMode && (
              <button 
                onClick={(e) => { e.stopPropagation(); navigate('/admin/dashboard'); }}
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--accent-orange)', border: 'none', borderRadius: '8px', padding: '4px 8px', color: 'white', fontSize: '10px', fontWeight: 800, cursor: 'pointer', zIndex: 10 }}
              >EDIT</button>
            )}
            <div style={{ position: 'relative' }}>
              <img src={player.avatar} alt={player.name} style={{ width: '64px', height: '64px', borderRadius: '18px', border: '2px solid var(--glass-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
              <div style={{ position: 'absolute', bottom: '-6px', right: '-6px', background: '#38BDF8', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 900, border: '2px solid var(--bg-dark)' }}>
                {index + 1}
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{player.name}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <span style={{ color: '#38BDF8' }}>@{player.username}</span> 
                <span>•</span>
                <span>Joined {new Date(player.joinDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div style={{ textAlign: 'right', background: 'rgba(56, 189, 248, 0.1)', padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', lineHeight: 1 }}>{player.totalMatches}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.05em' }}>PLAYED</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Participants;
