import { useState } from 'react';
import { ArrowLeft, History, Trophy, Calendar } from 'lucide-react';
import { useBalance } from '../context/BalanceContext';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { currentUser } from '../data/mockData';
import { useCurrency } from '../context/CurrencyContext';

const MyBets = () => {
  const { balance } = useBalance();
  const { formatCurrency } = useCurrency();
  const { adminMatches } = useAdminDashboard();
  const [displayUserId] = useState(() => localStorage.getItem('generatedUserId') || currentUser.id);

  // Filter matches that the user has joined
  const myMatches = adminMatches.filter(match => match.participantIds.includes(displayUserId));

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: 'var(--bg-gradient)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, background: 'var(--modal-bg)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--glass-border)' }}>
        <button 
          onClick={() => window.history.back()}
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

      <div style={{ padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {myMatches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>No Matches Yet</h3>
            <p>Join an upcoming match to see your history here.</p>
          </div>
        ) : (
          myMatches.map((match) => {
            let statusLabel = 'UPCOMING';
            let statusColor = '#F59E0B';
            let statusBg = 'rgba(245, 158, 11, 0.1)';
            let statusBorder = '#F59E0B33';
            let resultText = 'Waiting...';
            let returnText = 'Calculating...';
            let returnColor = 'var(--text-primary)';

            if (match.status === 'live') {
              statusLabel = 'IN PROGRESS';
              statusColor = '#38BDF8';
              statusBg = 'rgba(56, 189, 248, 0.1)';
              statusBorder = '#38BDF833';
              resultText = 'In Progress';
            } else if (match.status === 'finished') {
              const userWin = match.winners?.find(w => w.userId === displayUserId);
              if (userWin) {
                statusLabel = 'VICTORY';
                statusColor = '#10B981';
                statusBg = 'rgba(16, 185, 129, 0.1)';
                statusBorder = '#10B98133';
                resultText = 'Victory';
                returnText = `+${formatCurrency(userWin.reward)}`;
                returnColor = '#10B981';
              } else {
                statusLabel = 'DEFEATED';
                statusColor = '#EF4444';
                statusBg = 'rgba(239, 68, 68, 0.1)';
                statusBorder = '#EF444433';
                resultText = 'Defeat';
                returnText = `-${formatCurrency(match.entryFee)}`;
                returnColor = '#EF4444';
              }
            } else {
              returnText = `Up to ${formatCurrency(match.prizePool)}`;
            }

            return (
              <div 
                key={match.id}
                style={{ 
                  background: 'var(--glass-bg)', 
                  borderRadius: '28px', 
                  padding: '24px',
                  border: '1px solid var(--glass-border)',
                  boxShadow: 'var(--card-shadow)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Status Badge */}
                <div style={{ 
                  position: 'absolute', 
                  top: '24px', 
                  right: '24px',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: statusBg,
                  color: statusColor,
                  border: `1px solid ${statusBorder}`
                }}>
                  {statusLabel}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ color: 'var(--accent-orange)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{match.group} MATCH</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>{match.title}</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>ENTRY FEE</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>{formatCurrency(match.entryFee)}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>STATUS</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: statusColor }}>{resultText}</span>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--glass-border)', marginBottom: '20px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{match.status === 'finished' ? 'Winnings' : 'Prize Pool'}</span>
                  <span style={{ 
                    fontSize: '1.3rem', 
                    fontWeight: 900, 
                    color: returnColor 
                  }}>
                    {returnText}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyBets;
