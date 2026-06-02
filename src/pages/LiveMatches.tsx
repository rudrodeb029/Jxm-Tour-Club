import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { useAdmin } from '../context/AdminContext';

const LiveMatches = () => {
  const navigate = useNavigate();
  const { adminMatches } = useAdminDashboard();
  const { isAdminMode } = useAdmin();

  const liveTeams = adminMatches.filter(m => m.status === 'live').flatMap((match) => {
    const teams = [];
    if (match.team1) teams.push({ ...match.team1, matchId: match.id, matchName: match.name, liveStartedAt: match.liveStartedAt, score: match.score, time: match.time, currentParticipants: match.currentParticipants, maxParticipants: match.maxParticipants });
    if (match.team2) teams.push({ ...match.team2, matchId: match.id, matchName: match.name, liveStartedAt: match.liveStartedAt, score: match.score, time: match.time, currentParticipants: match.currentParticipants, maxParticipants: match.maxParticipants });
    if (match.team3) teams.push({ ...match.team3, matchId: match.id, matchName: match.name, liveStartedAt: match.liveStartedAt, score: match.score, time: match.time, currentParticipants: match.currentParticipants, maxParticipants: match.maxParticipants });
    return teams;
  });

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
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981', animation: 'pulse 1.5s infinite' }} />
            Live <span style={{ color: 'var(--accent-orange)' }}>Matches</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem', fontWeight: 600 }}>Currently Active Gaming Arenas</p>
        </div>
      </div>

      {/* Matches List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {liveTeams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'var(--glass-bg)', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 600 }}>No live matches at the moment.</p>
          </div>
        ) : (
          liveTeams.map((team, index) => (
            <div 
              key={`${team.matchId}-${team.id}`} 
              className="animate-slide-up"
              style={{ 
                animationDelay: `${index * 0.1}s`,
                opacity: 0,
                animationFillMode: 'forwards',
                background: 'linear-gradient(145deg, var(--glass-bg), rgba(30, 41, 59, 0.4))', 
                padding: '24px', 
                borderRadius: '24px', 
                border: '1px solid var(--glass-border)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                position: 'relative',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }}
            >
              {isAdminMode && (
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/admin/dashboard'); }}
                  style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--accent-orange)', border: 'none', borderRadius: '8px', padding: '4px 8px', color: 'white', fontSize: '10px', fontWeight: 800, cursor: 'pointer', zIndex: 10 }}
                >EDIT IN ADMIN</button>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-orange)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>{team.entryType} MATCH</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px', color: 'var(--text-primary)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{team.matchName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1rem' }}>👥</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{team.currentParticipants}/{team.maxParticipants} Joined</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div className="live-badge-glow" style={{ background: '#10B981', padding: '6px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 900, color: 'white', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>
                  <div style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%' }} />
                  LIVE
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'monospace', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{team.score}</div>
                <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>{team.time} Elapsed</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveMatches;
