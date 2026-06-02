import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { ArrowLeft, Users, Trophy, Target, Sword, Clock, MessageSquare } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { useChat } from '../context/ChatContext';
import { useBalance } from '../context/BalanceContext';
import SuccessModal from '../components/SuccessModal';
import InsufficientBalanceModal from '../components/InsufficientBalanceModal';
import ModalPortal from '../components/ModalPortal';



const MatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { adminMatches, adminUsers, updateMatch, addParticipantToMatch } = useAdminDashboard();
  const { balance, deductBalance } = useBalance();
  const { formatCurrency } = useCurrency();
  const { messages, sendMessage } = useChat();


  const [activeTab, setActiveTab] = useState<'details' | 'rule' | 'gameId' | 'support'>('details');
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendMessage(inputMessage, 'user');
    setInputMessage('');
  };

  useEffect(() => {
    if (activeTab === 'support') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);
  
  const match = adminMatches.find(m => m.id === id) || adminMatches[0];
  const participants = (match.participantIds || []).map(pid => 
    adminUsers.find(u => u.id === pid)
  ).filter(Boolean);

  if (!match) return <div>Match not found</div>;

  const entryFee = match.bids && match.bids.length > 0 ? parseFloat(match.bids[0].replace(/[^0-9.-]+/g, '')) || 10 : 10;
  const count = match.currentParticipants > 0 ? match.currentParticipants : 12;
  const totalPrizePool = match.prizePool !== undefined && match.prizePool > 0 ? match.prizePool : count * entryFee * 1.8;
  
  const firstPrizeValue = match.firstPrize !== undefined && match.firstPrize > 0 ? match.firstPrize : totalPrizePool * 0.5;
  const secondPrizeValue = match.secondPrize !== undefined && match.secondPrize > 0 ? match.secondPrize : totalPrizePool * 0.3;
  const thirdPrizeValue = match.thirdPrize !== undefined && match.thirdPrize > 0 ? match.thirdPrize : totalPrizePool * 0.2;

  const [displayUserId] = useState(() => localStorage.getItem('generatedUserId') || 'USER123');
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [selectedBetAmount, setSelectedBetAmount] = useState<number>(entryFee);
  const [isInsufficientBalanceOpen, setIsInsufficientBalanceOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const cards = match?.innerSections || [];
  
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    if (!selectedTeam && cards.length > 0) {
      setSelectedTeam(cards[0].id);
    }
  }, [cards, selectedTeam]);
  const hasJoined = (match.participantIds || []).includes(displayUserId);

  // Logic to determine if room ID should be visible is moved down

  const currentTeam = cards.find(c => c.id === selectedTeam) || cards[0];
  const dynamicEntryType = currentTeam?.entryType || 'Solo';
  const dynamicEntryFee = currentTeam?.entryFee || entryFee;
  const dynamicPrizePool = currentTeam?.winPrize || totalPrizePool;
  const dynamicFirstPrize = firstPrizeValue;
  const dynamicSecondPrize = secondPrizeValue;
  const dynamicThirdPrize = thirdPrizeValue;
  
  const dynamicPerKill = currentTeam?.perKill || match.perKillReward || 0;
  const dynamicMap = currentTeam?.map || match.map || 'Bermuda';
  const dynamicVersion = currentTeam?.version || match.version || 'MOBILE';
  const dynamicRules = currentTeam?.rules || match.rules || [];
  const dynamicGameId = currentTeam?.gameId || match.gameId || '';
  const dynamicGamePassword = currentTeam?.gamePassword || match.gamePassword || '';
  const dynamicRevealTime = currentTeam?.roomDetailsRevealTime || 15;

  const isRoomIdVisible = () => {
    if (!hasJoined) return false;
    if (match.status === 'live' || match.status === 'finished') return true;
    
    const targetTimeString = currentTeam?.startTime || match.time;
    if (targetTimeString) {
      const nowTime = new Date();
      const [hours, minutes] = targetTimeString.split(':').map(Number);
      let targetTime = new Date();
      targetTime.setHours(hours || 0, minutes || 0, 0, 0);
      
      const diffMinutes = (targetTime.getTime() - nowTime.getTime()) / (1000 * 60);
      
      if (diffMinutes <= dynamicRevealTime && diffMinutes >= -120) {
        return true;
      }
    }
    return false;
  };

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
    if (deductBalance(dynamicEntryFee)) {
      updateMatch(match.id, { 
        currentParticipants: match.currentParticipants + 1,
        totalBidsCount: `${match.currentParticipants + 1} Players joined`
      });
      addParticipantToMatch(match.id, displayUserId, selectedTeam);
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
        <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>Match Details</span>
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
                if (match.status !== 'finished') {
                  setSelectedTeam(card.id);
                }
              }}
              className="hover-scale"
              style={{
                background: 'var(--glass-bg)',
                border: `1px solid ${selectedTeam === card.id ? 'var(--accent-orange)' : 'var(--glass-border)'}`,
                borderRadius: '28px',
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                cursor: match.status === 'finished' ? 'default' : 'pointer',
                boxShadow: selectedTeam === card.id 
                  ? `0 15px 35px ${card.color}33, 0 0 15px ${card.color}22` 
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
                top: '-20px',
                width: '120px',
                height: '120px',
                background: `radial-gradient(circle, ${card.color}22 0%, transparent 70%)`,
                filter: 'blur(20px)',
                pointerEvents: 'none',
                zIndex: 0
              }} />

              {/* Dynamic Status Badge */}
              {(() => {
                let cardStatus = match.status;
                let cardTimeLeft = match.time;
                
                if (card.startTime && match.status !== 'finished') {
                  const nowTime = new Date(now);
                  const [hours, minutes] = card.startTime.split(':').map(Number);
                  
                  let targetTime = new Date(now);
                  targetTime.setHours(hours || 0, minutes || 0, 0, 0);
                  
                  const diff = targetTime.getTime() - nowTime.getTime();
                  if (diff <= 0) {
                    const durationMs = (card.liveDuration || 60) * 60 * 1000;
                    if (Math.abs(diff) >= durationMs) {
                      cardStatus = 'finished';
                    } else {
                      cardStatus = 'live';
                    }
                  } else {
                    cardStatus = 'upcoming';
                    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diff % (1000 * 60)) / 1000);
                    cardTimeLeft = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                  }
                }
                
                return (
                  <>
                    {cardStatus === 'live' && (
                      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2, background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                        LIVE
                      </div>
                    )}
                    {cardStatus === 'upcoming' && (
                      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2, background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b', padding: '4px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', fontVariantNumeric: 'tabular-nums' }}>
                        <span>🕒</span>
                        {cardTimeLeft}
                      </div>
                    )}
                    {cardStatus === 'finished' && (
                      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2, background: 'rgba(107, 114, 128, 0.2)', color: '#9ca3af', border: '1px solid #9ca3af', padding: '4px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ENDED
                      </div>
                    )}
                  </>
                );
              })()}
              {/* Glowing Logo Container */}
              <div style={{ 
                width: '88px', 
                height: '88px', 
                borderRadius: '50%', 
                background: 'rgba(0,0,0,0.4)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                border: `2px solid ${selectedTeam === card.id ? 'var(--accent-orange)' : card.color + 'cc'}`,
                boxShadow: `0 0 20px ${card.color}55`,
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
              
              <div style={{ zIndex: 1 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, lineHeight: 1.2, color: 'var(--text-primary)' }}>{card.name}</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', borderTop: '1px solid var(--glass-border)', paddingTop: '12px', fontSize: '0.8rem', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Entry Type</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent-orange)' }}>{card.entryType || 'Solo'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Entry Fee</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(card.entryFee || entryFee)}</span>
                </div>
              </div>

              {match.status !== 'finished' && (
                <button
                  type="button"
                  className={selectedTeam === card.id ? 'btn btn-primary' : 'btn btn-outline'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTeam(card.id);
                    setShowJoinSuccess(false);
                    setIsBetModalOpen(true);
                  }}
                  style={{
                    marginTop: '12px'
                  }}
                >
                  JOIN
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4 Button Row (Tabs) */}
      <div style={{ padding: '0 12px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            { id: 'details', label: 'Details' },
            { id: 'rule', label: 'Rule' },
            { id: 'gameId', label: 'Game Id' },
            { id: 'support', label: 'Support' }
          ].map(tab => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'btn btn-primary' : 'btn btn-outline'}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 0',
                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.7rem'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'details' && (
        <div style={{ padding: '0 12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'WIN PRIZE', value: formatCurrency(dynamicPrizePool), color: 'var(--accent-orange)' },
            { label: 'ENTRY TYPE', value: dynamicEntryType, color: 'var(--text-primary)' },
            { label: 'ENTRY FEE', value: formatCurrency(dynamicEntryFee), color: 'var(--text-primary)' },
            { label: 'PER KILL', value: formatCurrency(dynamicPerKill), color: '#4ADE80' },
            { label: 'MAP', value: dynamicMap, color: 'var(--text-primary)' },
            { label: 'VERSION', value: dynamicVersion, color: 'var(--text-primary)' }
          ].map((item, idx, arr) => {
            const styles = [
              { bg: 'linear-gradient(135deg, #0d5f66, #053338)', border: '#fde047', text: '#fde047' }, // Teal / Gold
              { bg: 'linear-gradient(135deg, #d4af37, #8b6b17)', border: '#fef08a', text: '#fef08a' }, // Gold
              { bg: 'linear-gradient(135deg, #94a3b8, #475569)', border: '#f1f5f9', text: '#f1f5f9' }, // Silver
              { bg: 'linear-gradient(135deg, #92400e, #5c2705)', border: '#fbbf24', text: '#fcd34d' }, // Bronze
              { bg: 'linear-gradient(135deg, #1e3a8a, #172554)', border: '#93c5fd', text: '#93c5fd' }, // Blue
              { bg: 'linear-gradient(135deg, #831843, #4c0519)', border: '#f9a8d4', text: '#f9a8d4' }, // Pink
            ];
            const currentStyle = styles[idx % styles.length];

            return (
              <div key={item.label} className="hover-scale" style={{ 
                background: currentStyle.bg, 
                border: `1px solid ${currentStyle.border}`, 
                borderRadius: '12px',
                boxShadow: 'var(--card-shadow)',
                margin: '0 4px'
              }}>
                <div style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '14px 20px'
                }}>
                  <span style={{ fontSize: '0.85rem', color: currentStyle.text, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', textShadow: 'var(--text-shadow-sm)' }}>{item.label}</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)', textShadow: 'var(--text-shadow-md)' }}>{item.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {activeTab === 'rule' && (
        <div style={{ padding: '0 12px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>Match Rules</h4>
            <ul style={{ paddingLeft: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(dynamicRules && dynamicRules.length > 0) ? dynamicRules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              )) : (
                <>
                  <li>Players must use mobile devices only. Emulators are strictly prohibited.</li>
                  <li>Teaming up with opponents is not allowed and will result in a ban.</li>
                  <li>Any form of hacking or cheating will lead to permanent account suspension.</li>
                  <li>Room ID and Password will be shared {dynamicRevealTime} minutes before the match starts.</li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'gameId' && (
        <div style={{ padding: '0 12px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
            <h4 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>Game Room ID</h4>
            {!hasJoined ? (
              <div style={{ padding: '16px', background: 'var(--input-bg)', borderRadius: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                You must join this match to get access to the Room ID and Password.
              </div>
            ) : !isRoomIdVisible() ? (
              <div style={{ padding: '16px', background: 'var(--input-bg)', borderRadius: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Room ID and Password will be revealed {dynamicRevealTime} minutes before the match begins.
              </div>
            ) : (
              <div style={{ padding: '16px', background: 'var(--input-bg)', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Room ID</div>
                <div style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 900, letterSpacing: '2px', userSelect: 'all' }}>{dynamicGameId || 'Pending...'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '12px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Password</div>
                <div style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 900, letterSpacing: '2px', userSelect: 'all' }}>{dynamicGamePassword || 'Pending...'}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'support' && (
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ 
            padding: '20px', 
            borderRadius: '24px', 
            background: 'var(--glass-bg)', 
            border: '1px solid var(--glass-border)', 
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            flexDirection: 'column',
            height: '420px',
            overflow: 'hidden'
          }}>
            <div style={{ borderBottom: '1px solid var(--divider)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>Match Discussion</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Discuss strategies and gameplay live</p>
            </div>

            {/* Messages Area */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              marginBottom: '16px',
              paddingRight: '4px'
            }} className="custom-scrollbar">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div 
                    key={msg.id} 
                    className="animate-message-in"
                    style={{ 
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {!isUser && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-orange)', marginBottom: '2px', fontWeight: 700 }}>
                        {msg.userName || 'Support Bot'}
                      </span>
                    )}
                    <div style={{ 
                      background: isUser ? 'var(--accent-gradient)' : 'var(--card-inner-bg)',
                      padding: '10px 14px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      color: isUser ? '#fff' : 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      border: isUser ? 'none' : '1px solid var(--glass-border)',
                      boxShadow: isUser ? '0 4px 12px rgba(227, 67, 96, 0.15)' : 'none'
                    }}>
                      {msg.text}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{msg.time}</span>
                      {isUser && (
                        <span style={{ 
                          fontSize: '0.6rem', 
                          color: msg.status === 'sending' ? 'var(--text-muted)' : '#10B981', 
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {msg.status === 'sending' ? (
                            <span style={{ 
                              display: 'inline-block',
                              width: '4px',
                              height: '4px',
                              borderRadius: '50%',
                              background: 'var(--text-secondary)',
                              animation: 'pulse 1s infinite'
                            }} />
                          ) : (
                            '✓✓'
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form 
              onSubmit={handleSendMessage}
              style={{ 
                display: 'flex', 
                gap: '10px',
                borderTop: '1px solid var(--glass-border)',
                paddingTop: '12px'
              }}
            >
              <input 
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  background: 'var(--card-inner-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button 
                type="submit"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(227, 67, 96, 0.2)'
                }}
                className="hover-scale"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}




      {match.status === 'finished' && match.winners && (
        <div style={{ padding: '24px', marginTop: '24px', background: 'rgba(249,111,46,0.1)', border: '1px solid rgba(249,111,46,0.2)', borderRadius: '24px', margin: '12px' }}>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-white">Final Winners</h3>
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
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0' }}>Confirm Entry</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{match.group} Arena</p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '10px' }}>Betting Team</p>
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

                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '10px' }}>Entry Fee</p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div
                      style={{ 
                        flex: 1, 
                        padding: '14px', 
                        borderRadius: '16px', 
                        border: '2px solid var(--accent-orange)',
                        background: 'rgba(249, 111, 46, 0.1)', 
                        color: 'var(--text-primary)', 
                        fontWeight: 800, 
                        fontSize: '1.1rem',
                        textAlign: 'center'
                      }}
                    >
                      {formatCurrency(dynamicEntryFee)}
                    </div>
                  </div>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ padding: '16px', borderRadius: '16px', fontSize: '1rem', letterSpacing: '0.05em' }}
                  onClick={handleJoinMatch}
                >
                  Join Now {selectedTeam ? `(Bet ${currentTeam?.name || ''})` : ''}
                </button>
                
                <button 
                  type="button"
                  onClick={() => setIsBetModalOpen(false)}
                  style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', marginTop: '16px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
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
                <h4 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '12px', color: 'var(--text-primary)' }}>Joined Successfully!</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500 }}>
                  You have successfully joined the match!
                </p>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '80%', padding: '12px', borderRadius: '12px', marginTop: '24px', margin: '24px auto 0' }}
                  onClick={() => setIsBetModalOpen(false)}
                >
                  Dismiss
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

