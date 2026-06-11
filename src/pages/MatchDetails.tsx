import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { ArrowLeft, Users, Trophy } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { useBalance } from '../context/BalanceContext';
import SuccessModal from '../components/SuccessModal';
import InsufficientBalanceModal from '../components/InsufficientBalanceModal';
import ModalPortal from '../components/ModalPortal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { parseTime, formatTime, getCardStatus as getCardStatusFromUtil, getTargetDateTime } from '../utils/timeUtils';



const MatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { adminMatches, adminUsers, updateMatch, addParticipantToMatch } = useAdminDashboard();
  const { balance, deductBalance } = useBalance();
  const { formatCurrency } = useCurrency();
  const { currentUser } = useAuth();
  const { t } = useLanguage();





  
  const match = adminMatches.find(m => m.id === id) || adminMatches[0];
  const participants = (match.participantIds || []).map(pid => 
    adminUsers.find(u => u.id === pid)
  ).filter(Boolean);

  if (!match) return <div>Match not found</div>;

  const entryFee = match.bids && match.bids.length > 0 ? parseFloat(match.bids[0].replace(/[^0-9.-]+/g, '')) || 10 : 10;
  const count = match.currentParticipants > 0 ? match.currentParticipants : 12;
  const cardPrizeSum = (match.team1?.winPrize || 0) + (match.team2?.winPrize || 0) + (match.team3?.winPrize || 0);
  const totalPrizePool = cardPrizeSum > 0 ? cardPrizeSum : (match.prizePool !== undefined && match.prizePool > 0 ? match.prizePool : count * entryFee * 1.8);
  
  const firstPrizeValue = match.firstPrize !== undefined && match.firstPrize > 0 ? match.firstPrize : totalPrizePool * 0.5;
  const secondPrizeValue = match.secondPrize !== undefined && match.secondPrize > 0 ? match.secondPrize : totalPrizePool * 0.3;
  const thirdPrizeValue = match.thirdPrize !== undefined && match.thirdPrize > 0 ? match.thirdPrize : totalPrizePool * 0.2;

  const [displayUserId] = useState(() => localStorage.getItem('generatedUserId') || 'USER123');
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [userGameId, setUserGameId] = useState('');
  const [userGameIdError, setUserGameIdError] = useState(false);
  const [selectedBetAmount, setSelectedBetAmount] = useState<number>(entryFee);
  const [isInsufficientBalanceOpen, setIsInsufficientBalanceOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);
  const [joinedSlot, setJoinedSlot] = useState<number | null>(null);

  useEffect(() => {
    if (!isBetModalOpen) {
      setUserGameId('');
      setUserGameIdError(false);
    }
  }, [isBetModalOpen]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Sort sub-matches: Live first, then Upcoming, then Finished
  const cards = [...(match?.innerSections || [])].sort((a, b) => {
    const statusA = getCardStatusFromUtil(a, match.status);
    const statusB = getCardStatusFromUtil(b, match.status);

    const rank = { 'live': 0, 'upcoming': 1, 'revealed': 1, 'idle': 2, 'finished': 3 };
    return (rank[statusA] ?? 2) - (rank[statusB] ?? 2);
  });
  
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    if (!selectedTeam && cards.length > 0) {
      setSelectedTeam(cards[0].id);
    }
  }, [cards, selectedTeam]);
  const hasJoined = currentUser ? (match.participantIds || []).includes(currentUser.uid) : false;

  // Logic to determine if room ID should be visible is moved down

  const currentTeam = cards.find(c => c.id === selectedTeam) || cards[0];
  const dynamicEntryFee = currentTeam?.entryFee || entryFee;

  useEffect(() => {
    if (entryFee) {
      setSelectedBetAmount(entryFee);
    }
  }, [entryFee]);

  const handleJoinMatch = () => {
    if (!selectedTeam) {
      alert("Please select a team to bet on!");
      return;
    }
    if (!userGameId.trim()) {
      setUserGameIdError(true);
      return;
    }
    setUserGameIdError(false);
    if (deductBalance(dynamicEntryFee)) {
      const targetCard = cards.find(c => c.id === selectedTeam);
      const slot = (targetCard?.participantIds?.length || 0) + 1;
      setJoinedSlot(slot);

      updateMatch(match.id, {
        currentParticipants: match.currentParticipants + 1,
        totalBidsCount: `${match.currentParticipants + 1} Players joined`
      });
      addParticipantToMatch(match.id, currentUser?.uid || displayUserId, selectedTeam, userGameId.trim());
      setShowJoinSuccess(true);
    } else {
      setSelectedBetAmount(dynamicEntryFee);
      setIsInsufficientBalanceOpen(true);
    }
  };

  return (

    <div style={{ minHeight: '100vh', position: 'relative', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ padding: '16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>{t('matchDetails')}</span>
        <div style={{ width: '24px' }}></div>
      </div>



      {/* Match Overview: Two Team Cards */}
      <div style={{ padding: '0 12px', marginBottom: '32px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: cards.length > 2 ? 'repeat(auto-fit, minmax(130px, 1fr))' : '1fr 1fr', 
          gap: '12px' 
        }}>
          {cards.map((card) => (
            <div 
              key={card.id}
              onClick={() => {
                navigate(`/match/${match.id}/card/${card.id}`);
              }}
              className="hover-scale"
              style={{
                background: 'var(--glass-bg)',
                border: `1px solid ${selectedTeam === card.id ? 'var(--accent-orange)' : 'var(--glass-border)'}`,
                borderRadius: '20px',
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: selectedTeam === card.id 
                  ? `0 10px 25px ${card.color}22, 0 0 10px ${card.color}15` 
                  : 'var(--card-shadow)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* 3D Glow Backlight */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                width: '80px',
                height: '80px',
                background: `radial-gradient(circle, ${card.color}15 0%, transparent 70%)`,
                filter: 'blur(15px)',
                pointerEvents: 'none',
                zIndex: 0
              }} />

              {/* Glowing Logo Container */}
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                background: 'rgba(0,0,0,0.4)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                border: `1.5px solid ${selectedTeam === card.id ? 'var(--accent-orange)' : card.color + 'aa'}`,
                boxShadow: `0 0 12px ${card.color}44`,
                position: 'relative',
                zIndex: 1,
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}>
                <img 
                  src={card.logo} 
                  alt={card.name} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease'
                  }} 
                />
              </div>
              
              <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 900, margin: 0, lineHeight: 1.2, color: 'var(--text-primary)' }}>{card.name}</h3>
                
                {/* Dynamic Status Badge (Positioned below the Title) */}
                {(() => {
                  let cardStatus = getCardStatusFromUtil(card, match.status);
                  let cardTimeLeft = match.time;
                  let liveTimeLeft = '';
                  
                  if (card.startTime && cardStatus === 'upcoming') {
                    const nowTime = new Date(now);
                    const targetTime = getTargetDateTime(card.startTime, nowTime);
                    let diff = targetTime.getTime() - nowTime.getTime();
                    if (diff <= 0) {
                      const tomorrow = new Date(targetTime);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      diff = tomorrow.getTime() - nowTime.getTime();
                    }
                    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diff % (1000 * 60)) / 1000);
                    cardTimeLeft = `${t('startIn')} ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                  } else if (cardStatus === 'live') {
                    const timeStr = card.startTime || match.time || '';
                    if (timeStr) {
                      const nowTime = new Date(now);
                      const targetTime = getTargetDateTime(timeStr, nowTime);
                      const elapsedMs = nowTime.getTime() - targetTime.getTime();
                      const liveDurationMins = Number(card.liveDuration) || 60;
                      const remainingMs = (liveDurationMins * 60 * 1000) - elapsedMs;
                      if (remainingMs > 0) {
                        const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
                        const hrs = Math.floor(totalSeconds / 3600);
                        const mins = Math.floor((totalSeconds % 3600) / 60);
                        const secs = totalSeconds % 60;
                        const mm = mins.toString().padStart(2, '0');
                        const ss = secs.toString().padStart(2, '0');
                        liveTimeLeft = hrs > 0 ? ` (${hrs}:${mm}:${ss})` : ` (${mm}:${ss})`;
                      }
                    }
                  }
                  
                  return (
                    <>
                      {cardStatus === 'live' && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 6px', borderRadius: '8px', fontSize: '0.58rem', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                          {t('live')}{liveTimeLeft}
                        </div>
                      )}
                      {cardStatus === 'upcoming' && (
                        <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 6px', borderRadius: '8px', fontSize: '0.58rem', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                          <span>🕒</span>
                          {cardTimeLeft}
                        </div>
                      )}
                      {cardStatus === 'finished' && (
                        <div style={{ background: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', border: '1px solid rgba(107, 114, 128, 0.3)', padding: '2px 6px', borderRadius: '8px', fontSize: '0.58rem', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                          {t('ended')}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', borderTop: '1px solid var(--glass-border)', paddingTop: '8px', fontSize: '0.72rem', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>{t('entry')} Type</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent-orange)' }}>{card.entryType || 'Solo'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>{t('entryFee')}</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(card.entryFee || entryFee)}</span>
                </div>
              </div>

              {match.status !== 'finished' && (
                (() => {
                  const cardHasJoined = currentUser ? (card.participantIds || []).includes(currentUser.uid) : false;
                  return (
                    <button
                      type="button"
                      className={`btn ${cardHasJoined ? 'btn-joined' : 'btn-primary'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/match/${match.id}/card/${card.id}`);
                      }}
                      style={{
                        marginTop: '6px',
                        padding: '6px 12px',
                        fontSize: '0.78rem'
                      }}
                    >
                      {cardHasJoined ? `✅ ${t('joined').toUpperCase()}` : t('join').toUpperCase()}
                    </button>
                  );
                })()
              )}
            </div>
          ))}
        </div>
      </div>






      {match.status === 'finished' && match.winners && (
        <div style={{ padding: '24px', marginTop: '24px', background: 'rgba(249,111,46,0.1)', border: '1px solid rgba(249,111,46,0.2)', borderRadius: '24px', margin: '12px' }}>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-white">{t('finalWinners')}</h3>
          </div>
          <div className="space-y-3">
            {match.winners.map((winner, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-slate-300 text-black' : 'bg-amber-700 text-white'}`}>
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold">{winner.userName}</span>
                </div>
                <span className="text-emerald-400 font-bold">+{formatCurrency(winner.reward)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal 
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        title="Match Joined!"
        message={`You have successfully joined the ${match.group}. Good luck!`}
      />

      {/* Insufficient Balance Modal */}
      <InsufficientBalanceModal 
        isOpen={isInsufficientBalanceOpen}
        onClose={() => setIsInsufficientBalanceOpen(false)}
        requiredAmount={selectedBetAmount}
        currentBalance={balance}
      />

      {/* Bet Modal */}
      {isBetModalOpen && (
        <ModalPortal>
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(12px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => { if(!showJoinSuccess) setIsBetModalOpen(false); }}
        >
          <div 
            className="animate-fade-in"
            style={{
              background: 'var(--modal-bg)',
              width: '100%',
              maxWidth: '400px',
              borderRadius: '24px',
              padding: '32px 24px',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >

            {!showJoinSuccess ? (
              <div className="animate-fade-in">
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0' }}>{t('confirmEntry')}</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{match.group} {t('arena')}</p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '10px' }}>{t('bettingTeam')}</p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {cards.map(card => (
                      <button 
                        key={card.id}
                        type="button"
                        onClick={() => setSelectedTeam(card.id)}
                        style={{ 
                          flex: 1, 
                          minWidth: '100px',
                          padding: '12px 10px', 
                          borderRadius: '16px', 
                          border: '2px solid',
                          borderColor: selectedTeam === card.id ? 'var(--accent-orange)' : 'var(--glass-border)', 
                          background: selectedTeam === card.id ? 'rgba(249, 111, 46, 0.1)' : 'var(--glass-bg)', 
                          color: 'var(--text-primary)', 
                          fontWeight: 700, 
                          fontSize: '0.85rem', 
                          cursor: 'pointer', 
                          transition: 'all 0.3s ease' 
                        }}
                      >
                        {card.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Entry Fee Display & Game ID Input side-by-side */}
                <div style={{
                  background: 'rgba(249, 111, 46, 0.08)',
                  border: '1px solid rgba(249, 111, 46, 0.2)',
                  borderRadius: '16px',
                  padding: '18px',
                  marginBottom: '24px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.2fr',
                  gap: '16px',
                  alignItems: 'center',
                  textAlign: 'left'
                }}>
                  {/* Left side: Entry Fee */}
                  <div style={{ borderRight: '1px solid rgba(249, 111, 46, 0.2)', paddingRight: '16px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>{t('entryFee')}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-orange)' }}>{formatCurrency(dynamicEntryFee)}</div>
                  </div>

                  {/* Right side: Game ID Input */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                      {t('gameIdName')} <span style={{ color: '#ef4444' }}>*</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder={t('enterGameIdName')}
                      value={userGameId} 
                      onChange={e => {
                        setUserGameId(e.target.value);
                        if (e.target.value.trim()) setUserGameIdError(false);
                      }} 
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: userGameIdError ? '1.5px solid #ef4444' : '1px solid rgba(249, 111, 46, 0.4)',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none',
                        fontWeight: 700
                      }} 
                    />
                  </div>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ padding: '16px', borderRadius: '16px', fontSize: '1rem', letterSpacing: '0.05em' }}
                  onClick={handleJoinMatch}
                >
                  {t('joinNowWithBet')} {selectedTeam ? `(${t('join')} ${currentTeam?.name || ''})` : ''}
                </button>
                
                <button 
                  type="button"
                  onClick={() => setIsBetModalOpen(false)}
                  style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', marginTop: '16px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('cancel')}
                </button>
              </div>
            ) : (
              <div className="animate-scale-up" style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ 
                  width: '100px', 
                  height: '100px', 
                  borderRadius: '50%', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 32px',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h4 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '12px', color: 'var(--text-primary)' }}>{t('joinedSuccessfully')}</h4>

                {joinedSlot && (
                  <div style={{
                    background: 'rgba(249, 111, 46, 0.1)',
                    padding: '16px 20px',
                    borderRadius: '20px',
                    marginBottom: '24px',
                    border: '1px solid rgba(249, 111, 46, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('assignedSlot')}</span>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-orange)', textShadow: '0 0 15px rgba(249, 111, 46, 0.3)' }}>#{joinedSlot}</span>
                  </div>
                )}

                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500 }}>
                  {t('success')}! {t('joined')}
                </p>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '80%', padding: '12px', borderRadius: '12px', marginTop: '24px', margin: '24px auto 0' }}
                  onClick={() => setIsBetModalOpen(false)}
                >
                  {t('dismiss')}
                </button>
              </div>
            )}
          </div>
        </div>
        </ModalPortal>
      )}

    </div>
  );
};

export default MatchDetails;

