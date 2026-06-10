import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History, Trophy, Calendar, Users, Zap, Star, ChevronRight } from 'lucide-react';
import { useBalance } from '../context/BalanceContext';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

const MyBets = () => {
  const navigate = useNavigate();
  const { balance } = useBalance();
  const { formatCurrency } = useCurrency();
  const { adminMatches, adminUsers } = useAdminDashboard();
  const { currentUser } = useAuth();
  const [displayUserId] = useState(() => localStorage.getItem('generatedUserId') || 'USER123');

  // Filter matches that the user has joined
  const myMatches = adminMatches.filter(match => currentUser && (match.participantIds || []).includes(currentUser.uid));

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: 'var(--bg-gradient)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, background: 'var(--modal-bg)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--glass-border)' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 auto', transform: 'translateX(-20px)', letterSpacing: '-0.02em' }}>
          Match <span style={{ color: 'var(--accent-orange)' }}>History</span>
        </h1>
      </div>

      <div style={{ padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {myMatches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>No Matches Joined</h3>
            <p>Join an upcoming match to see your history here.</p>
          </div>
        ) : (
          myMatches.map((match) => {
            const joinedCard = (match.innerSections || []).find(c => c.participantIds?.includes(currentUser?.uid || ''));
            const cardMode = joinedCard ? joinedCard.entryType : undefined;
            const matchDate = match.time || 'N/A';

            let statusColor = '#F59E0B';
            if (match.status === 'live') statusColor = '#38BDF8';
            if (match.status === 'finished') statusColor = '#10B981';

            return (
              <button
                key={match.id}
                onClick={() => navigate(`/match/${match.id}`)}
                className="hover-scale"
                style={{
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                {/* Status Indicator Bar */}
                <div style={{ 
                  position: 'absolute', 
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  background: statusColor,
                  boxShadow: `0 0 15px ${statusColor}66`
                }} />

                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    background: 'rgba(249, 111, 46, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(249, 111, 46, 0.2)'
                  }}>
                    <Trophy size={24} style={{ color: 'var(--accent-orange)' }} />
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0, marginLeft: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: 900,
                      margin: 0,
                      color: 'white',
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {match.name}
                    </h4>
                    <span style={{
                      fontSize: '7px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-secondary)',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {cardMode || match.group || 'MATCH'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Joined on {matchDate}
                    </div>
                  </div>
                </div>

                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    padding: '8px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyBets;
