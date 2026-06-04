import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Gift, ArrowRight } from 'lucide-react';
import SliderCard from '../components/SliderCard';
import HomeStats from '../components/HomeStats';
import LiveChat from '../components/LiveChat';
import SideMenu from '../components/SideMenu';
import { matches, currentUser, winners, topParticipants } from '../data/mockData';
import type { Match, Winner, TopParticipant } from '../data/mockData';
import { useBalance } from '../context/BalanceContext';
import { useAdmin } from '../context/AdminContext';
import { useTheme } from '../context/ThemeContext';
import ModalPortal from '../components/ModalPortal';
import { useLanguage } from '../context/LanguageContext';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import SuccessModal from '../components/SuccessModal';
import InsufficientBalanceModal from '../components/InsufficientBalanceModal';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { useAuth } from '../context/AuthContext';
import { isMatchLive } from '../utils/timeUtils';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCurrency } from '../context/CurrencyContext';


import { 
  Menu, 
  Sun, 
  Moon, 
  Plus, 
  Users, 
  Activity,
  Trash2,
  Edit2,
  PlusCircle,
  X,
  Target,
  Shield,
  Globe
} from 'lucide-react';


const Home = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAdminMode } = useAdmin();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  
  const { 
    adminMatches: localMatches, 
    stats: adminStats,
    updateMatch,
    winners: globalWinners,
    addPaymentRequest,
    incrementUserMatches,
    adminUsers,
    addParticipantToMatch
  } = useAdminDashboard();
  
  const [localParticipants, setLocalParticipants] = useState<TopParticipant[]>(() => {
    const saved = localStorage.getItem('localParticipants');
    return saved ? JSON.parse(saved) : topParticipants;
  });

  const [userAvatar, setUserAvatar] = useState(() => 
    localStorage.getItem('userAvatar') || 
    (currentUser?.photoURL) || 
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid || 'default'}`
  );

  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (currentUser) {
        // First try local storage
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
          setUserAvatar(savedAvatar);
        }

        // Fetch from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.avatar) {
              setUserAvatar(data.avatar);
              localStorage.setItem('userAvatar', data.avatar);
              return;
            }
          }
        } catch (e) {
          console.error("Failed to fetch user avatar in Home:", e);
        }
        
        // Fallback
        const fallback = currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.displayName || currentUser.uid}`;
        setUserAvatar(fallback);
      }
    };

    fetchUserAvatar();
  }, [currentUser]);

  const displayStats = [
    { id: 'live', value: adminStats.activeMatches.toString(), label: 'Live Matches' },
    { id: 'participants', value: adminStats.totalUsers.toLocaleString(), label: 'Participants' },
    { id: 'winners', value: adminStats.totalWinners.toLocaleString(), label: 'Winners' }
  ];

  const navigate = useNavigate();

  const { balance, deductBalance, addBalance } = useBalance();
  const { formatCurrency } = useCurrency();
  const [selectedBetAmount, setSelectedBetAmount] = useState<number>(10);
  const [isInsufficientBalanceOpen, setIsInsufficientBalanceOpen] = useState(false);
  const [insufficientRequiredAmount, setInsufficientRequiredAmount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<'full_map' | 'lone_wolf' | 'cs_rank' | null>(null);


  const [isAddBalanceOpen, setIsAddBalanceOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);

  const [successConfig, setSuccessConfig] = useState<{ isOpen: boolean, title: string, message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsedTime = (liveStartedAt?: number, fallbackTime?: string) => {
    if (!liveStartedAt) return fallbackTime || '00:00:00';
    const elapsed = Math.max(0, Math.floor((Date.now() - liveStartedAt) / 1000));
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const triggerSuccess = (title: string, message: string) => {
    setSuccessConfig({ isOpen: true, title, message });
  };

  const getModeColor = (group: string) => {
    const g = group.toLowerCase();
    if (g.includes('solo')) return '#FBBF24';
    if (g.includes('duo') || g.includes('dot') || g.includes('lone-wolf') || g.includes('lone_wolf')) return '#38BDF8';
    return '#E879F9';
  };

  const handleCardMouseEnter = (e: React.MouseEvent<HTMLDivElement>, isFull: boolean, isLive: boolean, color: string) => {
    if (!isFull) {
      e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)';
      e.currentTarget.style.borderColor = isLive ? '#10B981' : color;
      e.currentTarget.style.boxShadow = `0 20px 40px ${color}22`;
    }
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>, isFull: boolean, isLive: boolean, color: string) => {
    e.currentTarget.style.transform = 'translateY(0) scale(1)';
    e.currentTarget.style.borderColor = isFull ? 'rgba(239, 68, 68, 0.2)' : isLive ? 'rgba(16, 185, 129, 0.3)' : 'var(--glass-border)';
    e.currentTarget.style.boxShadow = isLive ? `0 0 30px ${color}15` : 'var(--card-shadow)';
  };


  // Persistence effects
  useEffect(() => { localStorage.setItem('localParticipants', JSON.stringify(localParticipants)); }, [localParticipants]);

  // Edit Modals State
  const [editingStat, setEditingStat] = useState<any>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editingWinner, setEditingWinner] = useState<Winner | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<AdminUser | null>(null);

  const handleJoinSuccess = (matchId: string) => {
    const match = localMatches.find(m => m.id === matchId);
    if (match) {
      updateMatch(matchId, { 
        currentParticipants: match.currentParticipants + 1,
        totalBidsCount: `${match.currentParticipants + 1} Players joined`
      });
      addParticipantToMatch(matchId, currentUser?.uid || displayUserId);
    }
  };

  const handleJoinMatch = () => {
    if (deductBalance(selectedBetAmount)) {
      handleJoinSuccess(selectedMatch!.id);
      setSelectedMatch(null);
      triggerSuccess("Match Joined!", `You have successfully joined the ${selectedMatch?.group}. Good luck!`);
    } else {
      setInsufficientRequiredAmount(selectedBetAmount);
      setIsInsufficientBalanceOpen(true);
    }
  };


  const [displayUserId] = useState(() => localStorage.getItem('generatedUserId') || 'USER123');
  
  const isAnyHomeModalOpen = selectedMatch !== null || isMenuOpen || isAddBalanceOpen || isInsufficientBalanceOpen || editingStat !== null || editingMatch !== null || editingWinner !== null || editingParticipant !== null || successConfig.isOpen;
  useLockBodyScroll(isAnyHomeModalOpen);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!isNaN(amount) && amount > 0 && currentUser) {
      if (!transactionId.trim()) {
        alert("Please enter a valid Transaction ID.");
        return;
      }
      try {
        await addDoc(collection(db, 'payments'), {
          userId: currentUser.uid,
          displayUserId: currentUser.email || displayUserId,
          amount: amount,
          transactionId: transactionId.trim(),
          paymentMethod: 'Quick Add',
          accountNumber: 'User Account',
          userName: currentUser.displayName || 'User',
          userAvatar: userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
          timestamp: new Date().toISOString(),
          status: 'pending',
          isRaw: true
        });

        setDepositAmount('');
        setTransactionId('');
        setShowAddConfirm(false);
        setIsAddBalanceOpen(false);
        triggerSuccess("Deposit Request Sent!", `৳${amount} deposit request has been sent for admin approval.`);
      } catch (error) {
        console.error("Error adding payment request in Home:", error);
        alert("Failed to submit deposit request. Please try again.");
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: 'var(--bg-gradient)', color: 'var(--text-primary)', transition: 'all 0.3s ease' }}>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      
      {/* Premium Neumorphic Header */}
      <div style={{ 
        margin: '16px 20px',
        padding: '12px 16px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: '16px',
        zIndex: 50,
        background: 'var(--nav-bg)',
        borderRadius: '24px',
        boxShadow: '10px 15px 25px rgba(0,0,0,0.8), 0 0 15px rgba(179, 144, 70, 0.1)',
        border: '1px solid var(--nav-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setIsMenuOpen(true)}
            style={{ 
              background: 'var(--modal-bg)', 
              border: '1px solid #000', 
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              cursor: 'pointer', 
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(255,255,255,0.05), 0 2px 0 rgba(255,255,255,0.1)'
            }}
          >
            <Menu size={22} strokeWidth={2} />
          </button>

          {/* Modern Theme Toggle */}
          <button 
            onClick={toggleTheme}
            style={{ 
              background: 'var(--modal-bg)', 
              border: '1px solid #000', 
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              cursor: 'pointer', 
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(255,255,255,0.05), 0 2px 0 rgba(255,255,255,0.1)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {isDarkMode ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => setIsAddBalanceOpen(true)}
            style={{ 
              background: 'linear-gradient(180deg, #f97316 0%, #c2410c 100%)', 
              padding: '4px 12px 4px 4px', 
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid #9a3412',
              borderTop: '1px solid #fdba74',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 3px 0 #7c2d12, 0 6px 8px rgba(0,0,0,0.6)',
              textShadow: 'var(--text-shadow-sm)',
              transform: 'translateY(0)',
              transition: 'transform 0.1s ease, box-shadow 0.1s ease'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(3px)';
              e.currentTarget.style.boxShadow = '0 0 0 #7c2d12, 0 3px 4px rgba(0,0,0,0.6)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 3px 0 #7c2d12, 0 6px 8px rgba(0,0,0,0.6)';
            }}
          >
            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
              <Plus size={14} color="white" strokeWidth={3} />
            </div>
            {formatCurrency(balance)}
          </button>
          
          <button 
            onClick={() => navigate('/profile')}
            style={{ 
              width: '46px', height: '46px', 
              borderRadius: '50%', 
              overflow: 'hidden', 
              border: '3px solid var(--nav-border)', 
              background: 'var(--modal-bg)',
              cursor: 'pointer', 
              padding: 0,
              boxShadow: '0 8px 12px rgba(0,0,0,0.8), 0 0 10px rgba(179, 144, 70, 0.3)'
            }}
          >
            <img src={userAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        </div>
      </div>

      {/* Main Title Section */}
      <div style={{ padding: '24px 20px 16px', position: 'relative' }}>
        <h1 style={{ 
          fontSize: '2.8rem', 
          fontWeight: 900, 
          margin: 0, 
          marginBottom: '12px', 
          letterSpacing: '-0.02em', 
          lineHeight: 1.1,
          fontFamily: '"Arial Rounded MT Bold", "Nunito", sans-serif'
        }}>
          <span style={{ 
            color: 'var(--text-secondary)', 
            textShadow: 'var(--text-shadow-3d)' 
          }}>
            {t('gamingArena').split(' ')[0]}
          </span>{' '}
          <span style={{ 
            color: '#f97316', 
            textShadow: 'var(--text-shadow-3d-accent)' 
          }}>
            {t('gamingArena').split(' ')[1]}
          </span>
        </h1>
        <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500, margin: 0 }}>
          {t('arenaSub')}
        </p>
      </div>

      <HomeStats 
        isAdminMode={isAdminMode} 
        customStats={displayStats as any}
        onStatClick={(type) => {
          if (type === 'live') navigate('/live-matches');
          if (type === 'participants') navigate('/participants');
          if (type === 'winners') navigate('/winners');
        }} 
        onEdit={(stat) => setEditingStat(stat)}
      />

      {/* Vertical Match Column */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '20px',
        padding: '0 12px',
        paddingBottom: '24px',
      }}>
        {localMatches.filter(isMatchLive).length > 0 && (
          <>
            {localMatches.filter(isMatchLive).map((match, index) => (
              <div 
                key={match.id} 
                className="animate-slide-up" 
                style={{ animationDelay: `${index * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <SliderCard 
                  group={match.group}
                  players={match.totalPlayersCount}
                  team1={match.team1}
                  team2={match.team2}
                  {...match}
                  currentParticipants={match.participantIds ? match.participantIds.length : (match.currentParticipants || 0)}
                  status={match.status}
                  name={match.name}
                  liveStartedAt={match.liveStartedAt}
                  onClick={() => navigate(`/match/${match.id}`)}
                  onJoin={() => navigate(`/match/${match.id}`)}
                  isAdminMode={isAdminMode}
                  onEdit={() => setEditingMatch(match)}
                />
              </div>
            ))}
          </>
        )}

        {localMatches.filter(m => !isMatchLive(m)).length > 0 && (
          <>
            {localMatches.filter(m => !isMatchLive(m)).map((match, index) => (
              <div 
                key={match.id} 
                className="animate-slide-up" 
                style={{ animationDelay: `${(localMatches.filter(isMatchLive).length + index) * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <SliderCard 
                  group={match.group}
                  players={match.totalPlayersCount}
                  team1={match.team1}
                  team2={match.team2}
                  {...match}
                  currentParticipants={match.participantIds ? match.participantIds.length : (match.currentParticipants || 0)}
                  status={match.status}
                  name={match.name}
                  liveStartedAt={match.liveStartedAt}
                  onClick={() => navigate(`/match/${match.id}`)}
                  onJoin={() => navigate(`/match/${match.id}`)}
                  isAdminMode={isAdminMode}
                  onEdit={() => setEditingMatch(match)}
                />
              </div>
            ))}
          </>
        )}
      </div>
      

      <SuccessModal 
        isOpen={successConfig.isOpen}
        onClose={() => setSuccessConfig(prev => ({ ...prev, isOpen: false }))}
        title={successConfig.title}
        message={successConfig.message}
      />

      <InsufficientBalanceModal 
        isOpen={isInsufficientBalanceOpen}
        onClose={() => setIsInsufficientBalanceOpen(false)}
        requiredAmount={insufficientRequiredAmount}
        currentBalance={balance}
      />


      {/* Modern Betting Modal */}
      {selectedMatch && (
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
          onClick={() => { if(!showJoinSuccess) setSelectedMatch(null); }}
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
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0' }}>{t('confirmEntry')}</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{selectedMatch.group} {t('arena') || 'Arena'}</p>
                </div>


                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '16px' }}>{t('entryFee')}</p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {[100, 10, 5].map((amount) => (
                      <button 
                        key={amount}
                        onClick={() => setSelectedBetAmount(amount)}
                        style={{ 
                          flex: 1, 
                          padding: '20px', 
                          borderRadius: '20px', 
                          border: '2px solid',
                          borderColor: selectedBetAmount === amount ? 'var(--accent-orange)' : 'var(--glass-border)', 
                          background: selectedBetAmount === amount ? 'rgba(249, 111, 46, 0.1)' : 'var(--glass-bg)', 
                          color: 'var(--text-primary)', 
                          fontWeight: 800, 
                          fontSize: '1.2rem', 
                          cursor: 'pointer', 
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                        }}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>


                <button 
                  className="btn btn-primary" 
                  style={{ padding: '20px', borderRadius: '20px', fontSize: '1.1rem', letterSpacing: '0.05em' }}
                  onClick={handleJoinMatch}
                >
                  {t('joinNow')}
                </button>
                
                <button 
                  onClick={() => setSelectedMatch(null)}
                  style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', marginTop: '20px', fontWeight: 600, cursor: 'pointer' }}
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
                <h4 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '12px', color: 'var(--text-primary)' }}>{t('joined')}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500 }}>
                  {t('success')}! {t('joined')}
                </p>
              </div>
            )}
          </div>
        </div>
        </ModalPortal>
      )}


      {isAddBalanceOpen && (
        <ModalPortal>
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(16px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setIsAddBalanceOpen(false)}
        >
          <div 
            className="animate-scale-up"
            style={{
              background: 'var(--modal-bg)',
              width: '100%',
              maxWidth: '420px',
              borderRadius: '40px',
              padding: '24px 16px',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
              position: 'relative',
              overflow: 'hidden'
            }}

            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow */}
            <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(249, 111, 46, 0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, textAlign: 'center', marginBottom: '32px', letterSpacing: '-0.02em' }}>
              Add <span style={{ color: 'var(--accent-orange)' }}>Funds</span>
            </h3>
            
            {!showAddConfirm ? (
              <div className="animate-fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                  {[10, 50, 100, 500].map(amount => (
                    <button 
                      key={amount}
                      onClick={() => setDepositAmount(amount.toString())}
                      style={{
                        padding: '20px',
                        borderRadius: '24px',
                        border: '2px solid',
                        borderColor: depositAmount === amount.toString() ? 'var(--accent-orange)' : 'var(--glass-border)',
                        background: depositAmount === amount.toString() ? 'rgba(249, 111, 46, 0.1)' : 'var(--glass-bg)',
                        color: 'var(--text-primary)',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}

                    >
                      ৳{amount}
                    </button>
                  ))}
                </div>
                
                <div style={{ marginBottom: '40px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Amount</label>
                  <div style={{ position: 'relative' }}>

                    <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-orange)' }}>৳</span>
                    <input 
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        background: 'var(--glass-bg)',
                        border: '2px solid var(--glass-border)',
                        borderRadius: '24px',
                        padding: '20px 20px 20px 45px',
                        color: 'var(--text-primary)',
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}

                      onFocus={(e) => e.target.style.borderColor = 'var(--accent-orange)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}

                    />
                  </div>
                </div>

                <button 
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '13px 20px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.05em' }}
                  onClick={() => setShowAddConfirm(true)}
                >
                  PROCEED TO CONFIRM
                </button>
              </div>
            ) : (
              <div className="animate-scale-up" style={{ textAlign: 'center' }}>
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
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" className="animate-bounce-subtle">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>Confirm Deposit</h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '1rem', lineHeight: 1.6 }}>
                  You are adding <span style={{ color: '#10B981', fontWeight: 900, fontSize: '1.2rem' }}>৳{parseFloat(depositAmount).toLocaleString()}</span> to your secure wallet.
                </p>

                <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase' }}>Transaction ID (Required)</label>
                  <input 
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter TXN ID from your payment"
                    style={{
                      width: '100%',
                      background: 'var(--glass-bg)',
                      border: '2px solid var(--glass-border)',
                      borderRadius: '16px',
                      padding: '16px',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent-orange)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                  />
                </div>

                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    onClick={handleDeposit}
                    style={{ 
                      width: '100%', 
                      padding: '13px 20px', 
                      borderRadius: '12px', 
                      background: '#10B981', 
                      border: 'none', 
                      color: 'white', 
                      fontWeight: 800, 
                      fontSize: '0.95rem', 
                      cursor: 'pointer',
                      boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    CONFIRM & ADD NOW
                  </button>
                  <button 
                    onClick={() => setShowAddConfirm(false)}
                    style={{ 
                      width: '100%', 
                      padding: '12px 18px', 
                      borderRadius: '12px', 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--text-secondary)', 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      fontSize: '0.95rem'
                    }}
                  >
                    Cancel and go back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </ModalPortal>
      )}
      {/* Edit Stat Modal */}
      {editingStat && (
        <ModalPortal>
        <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setEditingStat(null)}>
          <div className="animate-scale-up" style={{ background: 'var(--modal-bg)', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '24px 16px', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '24px', textAlign: 'center' }}>Edit <span style={{ color: 'var(--accent-orange)' }}>{editingStat.label}</span></h3>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>STAT VALUE</label>
              <input 
                type="text"
                defaultValue={editingStat.value}
                id="edit-stat-value"
                style={{ width: '100%', background: 'var(--glass-bg)', border: '2px solid var(--glass-border)', borderRadius: '16px', padding: '16px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '13px 20px', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.95rem' }}
                onClick={() => {
                  const val = (document.getElementById('edit-stat-value') as HTMLInputElement).value;
                  setCustomStats((prev: any) => prev.map((s: any) => s.id === editingStat.id ? { ...s, value: val } : s));
                  setEditingStat(null);
                }}
              >SAVE CHANGES</button>
              <button 
                style={{ flex: 1, padding: '13px 20px', borderRadius: '12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
                onClick={() => setEditingStat(null)}
              >CANCEL</button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Edit Match Modal */}
      {editingMatch && (
        <ModalPortal>
        <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setEditingMatch(null)}>
          <div className="animate-scale-up" style={{ background: 'var(--modal-bg)', width: '100%', maxWidth: '450px', borderRadius: '32px', padding: '24px 16px', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', boxShadow: '0 30px 60px rgba(0,0,0,0.8)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '24px', textAlign: 'center' }}>Edit <span style={{ color: 'var(--accent-orange)' }}>Match</span></h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>MATCH NAME</label>
                <input type="text" id="edit-match-name" defaultValue={editingMatch.name} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 700 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>GAME MODE</label>
                  <input type="text" id="edit-match-group" defaultValue={editingMatch.group} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 700 }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>MATCH TIME</label>
                  <input type="text" id="edit-match-time" defaultValue={editingMatch.time} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 700 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>TEAM 1 NAME</label>
                  <input type="text" id="edit-match-team1" defaultValue={editingMatch.team1.name} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 700 }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>TEAM 2 NAME</label>
                  <input type="text" id="edit-match-team2" defaultValue={editingMatch.team2.name} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 700 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>SCORE</label>
                  <input type="text" id="edit-match-score" defaultValue={editingMatch.score} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 700 }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>STATUS</label>
                  <select id="edit-match-status" defaultValue={editingMatch.status} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 700 }}>
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="finished">Finished</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>PARTICIPANTS</label>
                  <input type="number" id="edit-match-current" defaultValue={editingMatch.currentParticipants} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 700 }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>MAX SLOTS</label>
                  <input type="number" id="edit-match-max" defaultValue={editingMatch.maxParticipants} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 700 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700, whiteSpace: 'nowrap' }}>PRIZE POOL</label>
                  <input type="number" id="edit-match-prizePool" defaultValue={editingMatch.prizePool || 0} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px 6px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700, whiteSpace: 'nowrap' }}>1ST WINNER</label>
                  <input type="number" id="edit-match-firstPrize" defaultValue={editingMatch.firstPrize || 0} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px 6px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700, whiteSpace: 'nowrap' }}>2ND WINNER</label>
                  <input type="number" id="edit-match-secondPrize" defaultValue={editingMatch.secondPrize || 0} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px 6px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700, whiteSpace: 'nowrap' }}>3RD WINNER</label>
                  <input type="number" id="edit-match-thirdPrize" defaultValue={editingMatch.thirdPrize || 0} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px 6px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '15px 20px', borderRadius: '14px', color: 'var(--text-primary)', fontSize: '1rem' }}
                onClick={() => {
                  const name = (document.getElementById('edit-match-name') as HTMLInputElement).value;
                  const score = (document.getElementById('edit-match-score') as HTMLInputElement).value;
                  const status = (document.getElementById('edit-match-status') as HTMLSelectElement).value as any;
                  const group = (document.getElementById('edit-match-group') as HTMLInputElement).value;
                  const time = (document.getElementById('edit-match-time') as HTMLInputElement).value;
                  const team1Name = (document.getElementById('edit-match-team1') as HTMLInputElement).value;
                  const team2Name = (document.getElementById('edit-match-team2') as HTMLInputElement).value;
                  const current = parseInt((document.getElementById('edit-match-current') as HTMLInputElement).value);
                  const max = parseInt((document.getElementById('edit-match-max') as HTMLInputElement).value);
                  const prizePool = parseFloat((document.getElementById('edit-match-prizePool') as HTMLInputElement).value) || 0;
                  const firstPrize = parseFloat((document.getElementById('edit-match-firstPrize') as HTMLInputElement).value) || 0;
                  const secondPrize = parseFloat((document.getElementById('edit-match-secondPrize') as HTMLInputElement).value) || 0;
                  const thirdPrize = parseFloat((document.getElementById('edit-match-thirdPrize') as HTMLInputElement).value) || 0;
                  
                  updateMatch(editingMatch.id, { 
                    name,
                    score, 
                    status, 
                    group, 
                    time,
                    team1: { ...editingMatch.team1, name: team1Name },
                    team2: { ...editingMatch.team2, name: team2Name },
                    currentParticipants: current, 
                    maxParticipants: max,
                    prizePool,
                    firstPrize,
                    secondPrize,
                    thirdPrize
                  });
                  setEditingMatch(null);
                }}
              >SAVE MATCH</button>
              <button 
                style={{ flex: 1, padding: '12px 18px', borderRadius: '12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                onClick={() => setEditingMatch(null)}
              >CANCEL</button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
      {/* Edit Winner Modal */}
      {editingWinner && (
        <ModalPortal>
        <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setEditingWinner(null)}>
          <div className="animate-scale-up" style={{ background: 'var(--modal-bg)', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '24px 16px', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '24px', textAlign: 'center' }}>Edit <span style={{ color: 'var(--accent-orange)' }}>Winner</span></h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>NAME</label>
                <input type="text" id="edit-winner-name" defaultValue={editingWinner.name} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>PRIZE AMOUNT</label>
                <input type="text" id="edit-winner-amount" defaultValue={editingWinner.amount} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 700 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '15px 20px', borderRadius: '14px', color: 'var(--text-primary)', fontSize: '1rem' }}
                onClick={() => {
                  const name = (document.getElementById('edit-winner-name') as HTMLInputElement).value;
                  const amount = (document.getElementById('edit-winner-amount') as HTMLInputElement).value;
                  setLocalWinners(prev => prev.map(w => w.id === editingWinner.id ? { ...w, name, amount } : w));
                  setEditingWinner(null);
                }}
              >SAVE</button>
              <button 
                style={{ flex: 1, padding: '12px 18px', borderRadius: '12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                onClick={() => setEditingWinner(null)}
              >CANCEL</button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Edit Participant Modal */}
      {editingParticipant && (
        <ModalPortal>
        <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setEditingParticipant(null)}>
          <div className="animate-scale-up" style={{ background: 'var(--modal-bg)', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '24px 16px', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '24px', textAlign: 'center' }}>Edit <span style={{ color: 'var(--accent-orange)' }}>Participant</span></h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>NAME</label>
                <input type="text" id="edit-part-name" defaultValue={editingParticipant.name} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>MATCHES PLAYED</label>
                <input type="number" id="edit-part-matches" defaultValue={editingParticipant.matches} style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 700 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '15px 20px', borderRadius: '14px', color: 'var(--text-primary)', fontSize: '1rem' }}
                onClick={() => {
                  const name = (document.getElementById('edit-part-name') as HTMLInputElement).value;
                  const matchesVal = parseInt((document.getElementById('edit-part-matches') as HTMLInputElement).value);
                  setLocalParticipants(prev => prev.map(p => p.id === editingParticipant.id ? { ...p, name, matches: matchesVal } : p));
                  setEditingParticipant(null);
                }}
              >SAVE</button>
              <button 
                style={{ flex: 1, padding: '12px 18px', borderRadius: '12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                onClick={() => setEditingParticipant(null)}
              >CANCEL</button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Admin Reset Button */}
      {isAdminMode && (
        <button 
          onClick={() => {
            if (window.confirm('Are you sure you want to reset all data to default? This will clear all your edits.')) {
              localStorage.removeItem('localMatches');
              localStorage.removeItem('localWinners');
              localStorage.removeItem('localParticipants');
              localStorage.removeItem('customStats');
              window.location.reload();
            }
          }}
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            background: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 800,
            border: 'none',
            boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)',
            zIndex: 100,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          RESET DATA
        </button>
      )}
    </div>
  );
};

export default Home;
