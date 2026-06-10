import { useState } from 'react';
import { ArrowLeft, History, Trophy, Calendar, Users, Zap, Star } from 'lucide-react';
import { useBalance } from '../context/BalanceContext';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

const MyBets = () => {
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
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>No Matches Joined</h3>
            <p>Join an upcoming match to see your history here.</p>
          </div>
        ) : (
          myMatches.map((match) => {
            const joinedCard = (match.innerSections || []).find(c => c.participantIds?.includes(currentUser?.uid || ''));
            const realEntryFee = joinedCard ? (joinedCard.entryFee || 0) : (match.entryFee || 0);
            const realPrize = joinedCard ? (joinedCard.winPrize || 0) : (match.prizePool || 0);
            const cardMode = joinedCard ? joinedCard.entryType : undefined;

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
              const userWin = match.winners?.find(w => w.userId === (currentUser?.uid || displayUserId));
              if (userWin) {
                statusLabel = 'VICTORY';
                statusColor = '#10B981';
                statusBg = 'rgba(16, 185, 129, 0.1)';
                statusBorder = '#10B98133';
                resultText = 'Victory';
                returnText = `+${formatCurrency(userWin.reward)}`;
                returnColor = '#10B981';
              } else {
                statusLabel = 'FINISHED';
                statusColor = '#94A3B8';
                statusBg = 'rgba(148, 163, 184, 0.1)';
                statusBorder = '#94A3B833';
                resultText = 'Match Ended';
                returnText = formatCurrency(realPrize);
                returnColor = 'var(--text-secondary)';
              }
            } else {
              returnText = `Up to ${formatCurrency(realPrize)}`;
            }

            const getGroupLabel = (group: string, entryType?: string) => {
              const base = entryType ? `${entryType} Match` : group;
              const clean = base.trim();
              if (/match$/i.test(clean)) {
                return clean.toUpperCase();
              }
              return `${clean} MATCH`.toUpperCase();
            };

            return (
              <div 
                key={match.id}
                style={{ 
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderRadius: '32px',
                  padding: '24px',
                  border: '1.5px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Background Glow */}
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '200px', height: '200px', background: 'var(--accent-orange)', opacity: 0.05, filter: 'blur(80px)', borderRadius: '50%' }} />

                {/* Status Badge */}
                <div style={{ 
                  position: 'absolute', 
                  top: '24px', 
                  right: '24px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: statusBg,
                  color: statusColor,
                  border: `1.5px solid ${statusBorder}`,
                  boxShadow: `0 4px 15px ${statusBg}`
                }}>
                  {statusLabel}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ color: 'var(--accent-orange)', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                    {getGroupLabel(match.group, cardMode)}
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: 'white', letterSpacing: '-0.02em' }}>{match.name}</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ENTRY FEE</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white' }}>{formatCurrency(realEntryFee)}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: statusColor }}>{resultText}</span>
                  </div>
                </div>

                {/* Participants Section - Professional Community Style */}
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ width: '4px', height: '20px', background: 'var(--accent-orange)', borderRadius: '4px', boxShadow: '0 0 10px var(--accent-orange)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Joined Players ({match.participantIds?.length || 0})
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(match.participantIds || []).slice(0, 5).map(pid => {
                      const user = adminUsers.find(u => u.id === pid);
                      if (!user) return null;
                      const isMe = user.id === currentUser?.uid;

                      return (
                        <div key={user.id} style={{
                          gap: '12px',
                          padding: '16px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <div style={{ flexShrink: 0 }}>
                            <div style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '50%',
                              padding: '2px',
                              border: '1.5px solid var(--glass-border)',
                              background: 'rgba(0, 0, 0, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <img src={user.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                            </div>
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                              <h4 style={{
                                fontSize: '0.95rem',
                                fontWeight: 800,
                                margin: 0,
                                color: 'white',
                                letterSpacing: '-0.01em'
                              }}>
                                {user.name}
                              </h4>
                              {isMe && (
                                <span style={{
                                  fontSize: '8px',
                                  background: 'var(--accent-orange)',
                                  color: 'black',
                                  padding: '2px 8px',
                                  borderRadius: '20px',
                                  fontWeight: 900,
                                  textTransform: 'uppercase',
                                  fontStyle: 'italic'
                                }}>YOU</span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>@{user.username}</div>
                          </div>

                          <div style={{ flexShrink: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={16} style={{ color: '#38BDF8', filter: 'drop-shadow(0 0 5px rgba(56, 189, 248, 0.4))' }} strokeWidth={3} />
                          </div>
                        </div>
                      );
                    })}

                    {(match.participantIds?.length || 0) > 5 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '14px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '16px',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 700,
                        border: '1.5px dashed rgba(255, 255, 255, 0.1)',
                        letterSpacing: '0.02em'
                      }}>
                        +{(match.participantIds?.length || 0) - 5} more players joined this match
                      </div>
                    )}

                    {(match.participantIds?.length || 0) === 0 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '30px',
                        background: 'rgba(255, 255, 255, 0.01)',
                        borderRadius: '24px',
                        border: '1.5px dashed rgba(255, 255, 255, 0.1)',
                        fontSize: '0.9rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600
                      }}>
                        No players have joined yet
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ height: '1.5px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)', marginBottom: '24px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {match.status === 'finished' ? 'Final Prize' : 'Prize Pool'}
                  </span>
                  <span style={{ 
                    fontSize: '1.6rem',
                    fontWeight: 900, 
                    color: returnColor,
                    letterSpacing: '-0.02em',
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
                  }}>
                    {match.status === 'finished' ? returnText : `Up to ${formatCurrency(realPrize)}`}
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

