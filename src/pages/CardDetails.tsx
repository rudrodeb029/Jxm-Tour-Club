import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { ArrowLeft, Trophy, Shield, Crosshair, Map, Smartphone, Coins, Users, Lock, Unlock, Copy, Check, Clock } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useChat } from '../context/ChatContext';
import { useBalance } from '../context/BalanceContext';
import SuccessModal from '../components/SuccessModal';
import InsufficientBalanceModal from '../components/InsufficientBalanceModal';
import ModalPortal from '../components/ModalPortal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { parseTime, formatTime, getCardStatus as getCardStatusFromUtil, getTargetDateTime } from '../utils/timeUtils';


const CardDetails = () => {
  const { matchId, cardId } = useParams();
  const navigate = useNavigate();
  const { adminMatches, adminUsers, updateMatch, addParticipantToMatch } = useAdminDashboard();
  const { balance, deductBalance } = useBalance();
  const { formatCurrency } = useCurrency();
  const { currentUser } = useAuth();
  const { messages, sendMessage } = useChat();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'details' | 'rule' | 'gameId' | 'support'>('details');
  const [inputMessage, setInputMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
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

  // Find the match and card
  const match = adminMatches.find(m => m.id === matchId);
  const cards = match?.innerSections || [];
  const card = cards.find(c => c.id === cardId);

  const [displayUserId] = useState(() => localStorage.getItem('generatedUserId') || 'USER123');
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [userGameId, setUserGameId] = useState('');
  const [userGameIdError, setUserGameIdError] = useState(false);
  const [isInsufficientBalanceOpen, setIsInsufficientBalanceOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);
  const [joinedSlot, setJoinedSlot] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isBetModalOpen) {
      setUserGameId('');
      setUserGameIdError(false);
    }
  }, [isBetModalOpen]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!match || !card) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ fontWeight: 800, marginBottom: '8px' }}>{t('matchNotFound')}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{t('matchNotFoundSub') || "The match card you're looking for doesn't exist."}</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)} style={{ maxWidth: '200px', margin: '0 auto' }}>{t('cancelGoBack')}</button>
        </div>
      </div>
    );
  }

  // Dynamic values from card
  const entryFee = card.entryFee || 10;
  const dynamicEntryType = card.entryType || 'Solo';
  const dynamicEntryFee = card.entryFee || 10;
  const dynamicPrizePool = card.winPrize || 0;
  const dynamicPerKill = card.perKill || match.perKillReward || 0;
  const dynamicMap = card.map || match.map || 'Bermuda';
  const dynamicVersion = card.version || match.version || 'MOBILE';
  const dynamicRules = card.rules || match.rules || [];
  const dynamicGameId = card.gameId || match.gameId || '';
  const dynamicGamePassword = card.gamePassword || match.gamePassword || '';
  const dynamicRevealTime = card.roomDetailsRevealTime || 15;

  const hasJoined = currentUser ? (card.participantIds || []).includes(currentUser.uid) : false;
  const participantCount = card.participantIds ? card.participantIds.length : 0;
  const maxCardParticipants = card.maxParticipants || match.maxParticipants || 48;
  const isFull = participantCount >= maxCardParticipants;

  // Card status
  const getCardStatus = () => {
    return getCardStatusFromUtil(card, match.status);
  };

  const cardStatus = getCardStatus();

  const getTimeLeft = () => {
    if (!card.startTime || cardStatus !== 'upcoming') return '';
    const nowTime = new Date(now);
    const targetTime = getTargetDateTime(card.startTime, nowTime);
    let diff = targetTime.getTime() - nowTime.getTime();
    if (diff <= 0) {
      // Fallback in case of tiny delay/offset issues, though getTargetDateTime handles date rolling
      const tomorrow = new Date(targetTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      diff = tomorrow.getTime() - nowTime.getTime();
    }
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return `${t('startIn')} ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getLiveTimeLeft = () => {
    const timeStr = card.startTime || match.time || '';
    if (!timeStr || cardStatus !== 'live') return t('live').toUpperCase();
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
      return hrs > 0 ? `${t('live').toUpperCase()} (${hrs}:${mm}:${ss})` : `${t('live').toUpperCase()} (${mm}:${ss})`;
    }
    return t('live').toUpperCase();
  };

  const isRoomIdVisible = () => {
    if (!hasJoined) return false;
    if (match.status === 'live' || match.status === 'finished' || cardStatus === 'live' || cardStatus === 'finished') return true;
    const targetTimeString = card.startTime || match.time;
    if (targetTimeString) {
      const nowTime = new Date();
      const targetTime = getTargetDateTime(targetTimeString, nowTime);
      const diffMinutes = (targetTime.getTime() - nowTime.getTime()) / (1000 * 60);
      if (diffMinutes <= dynamicRevealTime && diffMinutes >= -120) return true;
    }
    return false;
  };

  const handleJoinMatch = () => {
    if (!userGameId.trim()) {
      setUserGameIdError(true);
      return;
    }
    setUserGameIdError(false);
    if (isFull) {
      alert("This card is already full!");
      return;
    }
    if (deductBalance(dynamicEntryFee)) {
      const slot = (card?.participantIds?.length || 0) + 1;
      setJoinedSlot(slot);

      updateMatch(match.id, {
        currentParticipants: match.currentParticipants + 1,
        totalBidsCount: `${match.currentParticipants + 1} Players joined`
      });
      addParticipantToMatch(match.id, currentUser?.uid || displayUserId, cardId, userGameId.trim());
      setShowJoinSuccess(true);
    } else {
      setIsInsufficientBalanceOpen(true);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Status badge colors
  const statusConfig = {
    live: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', label: getLiveTimeLeft(), icon: '🔴' },
    upcoming: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)', label: getTimeLeft(), icon: '🕒' },
    finished: { bg: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', border: '1px solid rgba(107, 114, 128, 0.4)', label: t('ended'), icon: '🏁' },
  };

  const currentStatus = statusConfig[cardStatus as keyof typeof statusConfig] || statusConfig.upcoming;

  return (
    <div style={{ minHeight: '100vh', position: 'relative', color: 'var(--text-primary)' }}>
      
      {/* ===== HERO HEADER ===== */}
      <div style={{
        position: 'relative',
        padding: '0',
        overflow: 'hidden',
      }}>
        {/* Background glow from card color */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          height: '300px',
          background: `radial-gradient(circle, ${card.color}30 0%, transparent 70%)`,
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        {/* Navigation Bar */}
        <div style={{
          padding: '16px 16px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '14px',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              boxShadow: 'var(--card-shadow)',
              transition: 'all 0.2s ease'
            }}
            className="hover-scale"
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{
            background: currentStatus.bg,
            color: currentStatus.color,
            border: currentStatus.border,
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.7rem',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            letterSpacing: '0.05em',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {cardStatus === 'live' && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
            )}
            {currentStatus.label}
          </div>
        </div>

        {/* Card Logo & Name Hero Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 16px 32px',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Glowing Logo */}
          <div style={{
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `3px solid ${card.color}cc`,
            boxShadow: `0 0 40px ${card.color}44, 0 10px 30px rgba(0,0,0,0.6)`,
            overflow: 'hidden',
            marginBottom: '16px',
            position: 'relative'
          }}>
            <img
              src={card.logo}
              alt={card.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Lens reflection */}
            <div style={{
              position: 'absolute',
              top: '5%',
              left: '15%',
              width: '70%',
              height: '30%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
          </div>

          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: 900,
            margin: '0 0 6px 0',
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
          }}>
            {card.name}
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem'
          }}>
            <span style={{
              background: `${card.color}25`,
              color: card.color,
              padding: '4px 12px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.7rem',
              border: `1px solid ${card.color}40`,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {dynamicEntryType}
            </span>
            <span style={{ fontWeight: 600 }}>{match.name}</span>
          </div>

          {/* Quick Stats Row */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '20px',
            width: '100%',
            maxWidth: '360px'
          }}>
            <div style={{
              flex: 1,
              background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.1), rgba(16, 185, 129, 0.05))',
              border: '1px solid rgba(74, 222, 128, 0.2)',
              borderRadius: '14px',
              padding: '12px 8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.6rem', color: '#4ADE80', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>{t('winPrize')}</div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#4ADE80' }}>{formatCurrency(dynamicPrizePool)}</div>
            </div>
            <div style={{
              flex: 1,
              background: 'linear-gradient(135deg, rgba(249, 111, 46, 0.1), rgba(234, 88, 12, 0.05))',
              border: '1px solid rgba(249, 111, 46, 0.2)',
              borderRadius: '14px',
              padding: '12px 8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.6rem', color: '#F97316', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>{t('entryFee')}</div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#F97316' }}>{formatCurrency(dynamicEntryFee)}</div>
            </div>
            {/* Joined / Action Pill */}
            {cardStatus === 'finished' ? (
              <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1), rgba(107, 114, 128, 0.05))',
                border: '1px solid rgba(156, 163, 175, 0.2)',
                borderRadius: '14px',
                padding: '12px 8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.6rem', color: '#9CA3AF', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>{t('ended')}</div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#9CA3AF' }}>{participantCount}/{maxCardParticipants} {t('joinedPill')}</div>
              </div>
            ) : cardStatus === 'live' ? (
              <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '14px',
                padding: '12px 8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.6rem', color: '#EF4444', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>{t('live')}</div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#EF4444' }}>{participantCount}/{maxCardParticipants} {t('joinedPill')}</div>
              </div>
            ) : hasJoined ? (
              <button
                onClick={() => setActiveTab('gameId')}
                className="hover-scale"
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '14px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)'
                }}
              >
                <div style={{ fontSize: '0.6rem', color: '#10B981', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>
                  ✅ {cardStatus === 'finished' ? t('joinedEnd') : t('joinedPill')}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10B981' }}>{participantCount}/{maxCardParticipants} {t('joinedPill')}</div>
              </button>
            ) : isFull ? (
              <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(100, 116, 139, 0.05))',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '14px',
                padding: '12px 8px',
                textAlign: 'center',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)'
              }}>
                <div style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>
                  🔒 {t('fullHouse').toUpperCase()}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#94A3B8' }}>{participantCount}/{maxCardParticipants} {t('joinedPill')}</div>
              </div>
            ) : (
              <button
                onClick={() => setIsBetModalOpen(true)}
                className="hover-scale"
                style={{
                  flex: 1,
                  background: 'linear-gradient(180deg, #F97316 0%, #c2410c 100%)',
                  border: '1px solid #fdba74',
                  borderRadius: '14px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)',
                  transition: 'all 0.2s ease',
                  borderTop: '1px solid #fdba74'
                }}
              >
                <div style={{ fontSize: '0.6rem', color: 'white', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>
                  ⚔️ {t('joinNowPill')}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: 'white' }}>{participantCount}/{maxCardParticipants} {t('joinedPill')}</div>
              </button>
            )}
          </div>
        </div>

        {/* Divider wave */}
        <div style={{
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${card.color}44, var(--glass-border), ${card.color}44, transparent)`,
          margin: '0 16px'
        }} />
      </div>

      {/* ===== TAB BAR ===== */}
      <div style={{ padding: '20px 12px 0', marginBottom: '16px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          padding: '4px'
        }}>
          {[
            { id: 'details', label: t('details'), icon: '📋' },
            { id: 'rule', label: t('rule'), icon: '📜' },
            { id: 'gameId', label: t('gameId'), icon: '🎮' },
            { id: 'support', label: t('support'), icon: '💬' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 4px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, #f97316, #9a3412)'
                  : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                boxShadow: activeTab === tab.id
                  ? '0 4px 12px rgba(249, 115, 22, 0.3)'
                  : 'none'
              }}
            >
              <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== TAB CONTENTS ===== */}
      <div style={{ padding: '0 12px', paddingBottom: '40px' }}>

        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             {[
              { label: t('startTime'), value: formatTime(card.startTime) || 'N/A', icon: <Clock size={16} />, gradient: 'linear-gradient(135deg, #115e59, #134e4a)', border: '#2dd4bf', textColor: '#2dd4bf' },
              { label: t('winPrize'), value: formatCurrency(dynamicPrizePool), icon: <Trophy size={16} />, gradient: 'linear-gradient(135deg, #0d5f66, #053338)', border: '#fde047', textColor: '#fde047' },
              { label: t('entry') + ' TYPE', value: dynamicEntryType, icon: <Users size={16} />, gradient: 'linear-gradient(135deg, #d4af37, #8b6b17)', border: '#fef08a', textColor: '#fef08a' },
              { label: t('entryFee'), value: formatCurrency(dynamicEntryFee), icon: <Coins size={16} />, gradient: 'linear-gradient(135deg, #94a3b8, #475569)', border: '#f1f5f9', textColor: '#f1f5f9' },
              { label: t('perKill'), value: formatCurrency(dynamicPerKill), icon: <Crosshair size={16} />, gradient: 'linear-gradient(135deg, #92400e, #5c2705)', border: '#fbbf24', textColor: '#fcd34d' },
              { label: t('map'), value: dynamicMap, icon: <Map size={16} />, gradient: 'linear-gradient(135deg, #1e3a8a, #172554)', border: '#93c5fd', textColor: '#93c5fd' },
              { label: t('version'), value: dynamicVersion, icon: <Smartphone size={16} />, gradient: 'linear-gradient(135deg, #831843, #4c0519)', border: '#f9a8d4', textColor: '#f9a8d4' }
            ].map((item, idx) => (
              <div
                key={item.label}
                className="hover-scale animate-slide-up"
                style={{
                  background: item.gradient,
                  border: `1px solid ${item.border}`,
                  borderRadius: '14px',
                  boxShadow: 'var(--card-shadow)',
                  margin: '0 4px',
                  animationDelay: `${idx * 0.06}s`,
                  opacity: 0,
                  animationFillMode: 'forwards'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 20px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{ color: item.textColor, opacity: 0.8 }}>{item.icon}</div>
                    <span style={{
                      fontSize: '0.85rem',
                      color: item.textColor,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textShadow: 'var(--text-shadow-sm)'
                    }}>
                      {item.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    textShadow: 'var(--text-shadow-md)'
                  }}>
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RULE TAB */}
        {activeTab === 'rule' && (
          <div className="animate-fade-in">
            <div className="glass-panel" style={{
              padding: '24px',
              borderRadius: '20px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(249, 111, 46, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Shield size={18} style={{ color: '#F97316' }} />
                </div>
                <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>{t('matchRules')}</h4>
              </div>
              <ul style={{
                paddingLeft: '0',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                lineHeight: 1.8,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                listStyle: 'none'
              }}>
                {(dynamicRules && dynamicRules.length > 0) ? dynamicRules.map((rule: string, idx: number) => (
                  <li key={idx} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <span style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      background: 'rgba(249, 111, 46, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 900,
                      color: '#F97316',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ lineHeight: 1.6 }}>{rule}</span>
                  </li>
                )) : (
                  <>
                    {[
                      'Players must use mobile devices only. Emulators are strictly prohibited.',
                      'Teaming up with opponents is not allowed and will result in a ban.',
                      'Any form of hacking or cheating will lead to permanent account suspension.',
                      `Room ID and Password will be shared ${dynamicRevealTime} minutes before the match starts.`
                    ].map((rule, idx) => (
                      <li key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <span style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          background: 'rgba(249, 111, 46, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 900,
                          color: '#F97316',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ lineHeight: 1.6 }}>{rule}</span>
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* GAME ID TAB */}
        {activeTab === 'gameId' && (
          <div className="animate-fade-in">
            <div className="glass-panel" style={{
              padding: '24px',
              borderRadius: '20px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: !hasJoined ? 'rgba(239, 68, 68, 0.1)' : !isRoomIdVisible() ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: `1px solid ${!hasJoined ? 'rgba(239, 68, 68, 0.2)' : !isRoomIdVisible() ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
              }}>
                {!hasJoined ? <Lock size={24} style={{ color: '#ef4444' }} /> :
                 !isRoomIdVisible() ? <Lock size={24} style={{ color: '#f59e0b' }} /> :
                 <Unlock size={24} style={{ color: '#10B981' }} />}
              </div>

              <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>{t('gameRoomId')}</h4>

              {!hasJoined ? (
                <div style={{
                  padding: '20px',
                  background: 'var(--input-bg)',
                  borderRadius: '16px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  border: '1px solid rgba(239, 68, 68, 0.1)'
                }}>
                  <p style={{ margin: '0 0 12px 0' }}>{t('gameRoomIdSub')}</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setIsBetModalOpen(true)}
                    style={{ maxWidth: '200px', margin: '0 auto', padding: '10px 20px' }}
                  >
                    {t('joinNow')}
                  </button>
                </div>
              ) : !isRoomIdVisible() ? (
                <div style={{
                  padding: '20px',
                  background: 'var(--input-bg)',
                  borderRadius: '16px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  border: '1px solid rgba(245, 158, 11, 0.1)'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    fontSize: '1.5rem'
                  }}>
                    ⏳
                  </div>
                  {t('revealTimeMsgPrefix')} <strong style={{ color: '#f59e0b' }}>{dynamicRevealTime} {t('revealTimeMsgSuffix')}</strong>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Room ID */}
                  <div style={{
                    padding: '16px',
                    background: 'var(--input-bg)',
                    borderRadius: '16px',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    position: 'relative'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>{t('roomId')}</div>
                    <div style={{
                      fontSize: '1.4rem',
                      color: 'var(--text-primary)',
                      fontWeight: 900,
                      letterSpacing: '3px',
                      userSelect: 'all',
                      fontFamily: 'monospace'
                    }}>
                      {dynamicGameId || t('pending')}
                    </div>
                    {dynamicGameId && (
                      <button
                        onClick={() => handleCopy(dynamicGameId, 'roomId')}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: copiedField === 'roomId' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          padding: '6px',
                          cursor: 'pointer',
                          color: copiedField === 'roomId' ? '#10B981' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {copiedField === 'roomId' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                  {/* Password */}
                  <div style={{
                    padding: '16px',
                    background: 'var(--input-bg)',
                    borderRadius: '16px',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    position: 'relative'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>{t('password')}</div>
                    <div style={{
                      fontSize: '1.4rem',
                      color: 'var(--text-primary)',
                      fontWeight: 900,
                      letterSpacing: '3px',
                      userSelect: 'all',
                      fontFamily: 'monospace'
                    }}>
                      {dynamicGamePassword || t('pending')}
                    </div>
                    {dynamicGamePassword && (
                      <button
                        onClick={() => handleCopy(dynamicGamePassword, 'password')}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: copiedField === 'password' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          padding: '6px',
                          cursor: 'pointer',
                          color: copiedField === 'password' ? '#10B981' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {copiedField === 'password' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === 'support' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{t('matchDiscussion')}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{t('discussStrategies')}</p>
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
                  placeholder={t('typeMessage')}
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
      </div>



      {/* ===== SUCCESS MODAL ===== */}
      <SuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        title={t('joined') || "Match Joined!"}
        message={`${t('success')}! ${t('joined')} ${card.name}.`}
      />

      {/* ===== INSUFFICIENT BALANCE MODAL ===== */}
      <InsufficientBalanceModal
        isOpen={isInsufficientBalanceOpen}
        onClose={() => setIsInsufficientBalanceOpen(false)}
        requiredAmount={dynamicEntryFee}
        currentBalance={balance}
      />

      {/* ===== JOIN CONFIRMATION MODAL ===== */}
      {isBetModalOpen && (
        <ModalPortal>
          <div
            className="animate-fade-in"
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(16px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => { if (!showJoinSuccess) setIsBetModalOpen(false); }}
          >
            <div
              className="animate-scale-up"
              style={{
                background: 'var(--modal-bg)',
                width: '100%',
                maxWidth: '400px',
                borderRadius: '28px',
                padding: '32px 24px',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background glow */}
              <div style={{
                position: 'absolute',
                top: '-60px',
                right: '-60px',
                width: '200px',
                height: '200px',
                background: `radial-gradient(circle, ${card.color}15 0%, transparent 70%)`,
                filter: 'blur(40px)',
                pointerEvents: 'none'
              }} />

              {!showJoinSuccess ? (
                <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
                  {/* Close Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
                    <button onClick={() => setIsBetModalOpen(false)} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}>
                      <X size={18} />
                    </button>
                  </div>
                  {/* Card Info */}
                  <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      border: `2px solid ${card.color}88`,
                      boxShadow: `0 0 20px ${card.color}33`,
                      overflow: 'hidden'
                    }}>
                      <img src={card.logo} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 6px 0' }}>{t('confirmEntry')}</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>{card.name} • {dynamicEntryType}</p>
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
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent-orange)' }}>{formatCurrency(dynamicEntryFee)}</div>
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

                  {/* Balance Info */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    fontSize: '0.85rem'
                  }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t('yourBalance')}</span>
                    <span style={{
                      fontWeight: 900,
                      color: balance >= dynamicEntryFee ? '#4ADE80' : '#ef4444'
                    }}>
                      {formatCurrency(balance)}
                    </span>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      fontSize: '1rem',
                      letterSpacing: '0.05em'
                    }}
                    onClick={handleJoinMatch}
                  >
                    {t('joinNowWithBet')} — {formatCurrency(dynamicEntryFee)}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBetModalOpen(false)}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      marginTop: '16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {t('cancel')}
                  </button>
                </div>
              ) : (
                <div className="animate-scale-up" style={{ textAlign: 'center', padding: '40px 0', position: 'relative', zIndex: 1 }}>
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
                    {t('success')}! {t('joined')} <strong style={{ color: card.color }}>{card.name}</strong>!
                  </p>
                  <button
                    className="btn btn-primary"
                    style={{ width: '80%', padding: '12px', borderRadius: '12px', marginTop: '24px', margin: '24px auto 0' }}
                    onClick={() => setIsBetModalOpen(false)}
                  >
                    {t('continue')}
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

export default CardDetails;
