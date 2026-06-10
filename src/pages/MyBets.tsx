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
                  <div style={{ color: 'var(--accent-orange)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                    {getGroupLabel(match.group, cardMode)}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>{match.name}</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>ENTRY FEE</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>{formatCurrency(realEntryFee)}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>STATUS</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: statusColor }}>{resultText}</span>
                  </div>
                </div>

                {/* Participants Section - Community Style */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '4px', height: '16px', background: 'var(--accent-orange)', borderRadius: '2px' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Joined Players ({match.participantIds?.length || 0})
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(match.participantIds || []).slice(0, 5).map(pid => {
                      const user = adminUsers.find(u => u.id === pid);
                      if (!user) return null;
                      const isMe = user.id === currentUser?.uid;

                      return (
                        <div key={user.id} className="group relative flex items-center overflow-hidden card-skewed" style={{
                          gap: '12px',
                          padding: '12px 16px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '16px',
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{ flexShrink: 0 }}>
                            <div className="relative" style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              padding: '2px',
                              border: '1px solid var(--glass-border)',
                              background: 'rgba(0,0,0,0.4)',
                              boxShadow: isMe ? '0 0 15px rgba(249, 115, 22, 0.2)' : 'none'
                            }}>
                              <img src={user.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                            </div>
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="flex items-center gap-2" style={{ marginBottom: '2px' }}>
                              <h4 className={`truncate ${isMe ? 'text-orange-400' : 'text-white'}`} style={{
                                fontSize: '0.9rem',
                                fontWeight: 900,
                                margin: 0,
                                textShadow: isMe ? '0 0 10px rgba(249, 115, 22, 0.3)' : 'none'
                              }}>
                                {user.name}
                              </h4>
                              {isMe && (
                                <span style={{
                                  fontSize: '8px',
                                  background: 'var(--accent-orange)',
                                  color: 'black',
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  fontWeight: 900,
                                  textTransform: 'uppercase',
                                  fontStyle: 'italic',
                                  letterSpacing: '-0.02em',
                                  boxShadow: '0 0 10px rgba(249,115,22,0.3)'
                                }}>YOU</span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '-0.02em' }}>@{user.username}</div>
                          </div>

                          <div className="shrink-0 flex items-center justify-center p-2 rounded-xl border border-white/10 bg-blue-500/10 shadow-lg">
                            <Zap size={14} className="text-blue-400" strokeWidth={3} />
                          </div>
                        </div>
                      );
                    })}

                    {(match.participantIds?.length || 0) > 5 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 700,
                        border: '1px dashed var(--glass-border)'
                      }}>
                        +{(match.participantIds?.length || 0) - 5} more players joined this match
                      </div>
                    )}

                    {(match.participantIds?.length || 0) === 0 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        background: 'rgba(255,255,255,0.01)',
                        borderRadius: '20px',
                        border: '1px dashed var(--glass-border)',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600
                      }}>
                        No players have joined yet
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--glass-border)', marginBottom: '20px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{match.status === 'finished' ? 'Final Prize' : 'Prize Pool'}</span>
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

