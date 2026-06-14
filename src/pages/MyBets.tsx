import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Calendar, Wallet, ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useBalance } from '../context/BalanceContext';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const MyBets = () => {
  const { transactions } = useBalance();
  const { formatCurrency } = useCurrency();
  const { adminMatches } = useAdminDashboard();
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [joinedEntries, setJoinedEntries] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    // Use a simple query first to avoid index requirements
    const q = query(
      collection(db, 'user_joins'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJoinedEntries(entries);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Combine data from user_joins collection and live adminMatches for maximum coverage
  const myJoinedEntries = (() => {
    // We use a Map keyed by the unique join ID to deduplicate
    const entriesMap = new Map();

    // 1. Add entries from the permanent user_joins collection (Survives deletion/reset)
    joinedEntries.forEach(entry => {
      const liveMatch = adminMatches.find(m => m.id === entry.matchId);

      let currentSlot = null;
      if (liveMatch) {
        if (entry.cardId) {
          const card = (liveMatch.innerSections || []).find(c => c.id === entry.cardId);
          if (card) {
            const idx = (card.participantIds || []).indexOf(currentUser?.uid || '');
            if (idx !== -1) currentSlot = idx + 1;
          }
        } else {
          const idx = (liveMatch.participantIds || []).indexOf(currentUser?.uid || '');
          if (idx !== -1) currentSlot = idx + 1;
        }
      }

      entriesMap.set(entry.id, {
        ...entry,
        originalMatchId: entry.matchId,
        name: entry.cardName || entry.matchName,
        matchCategory: entry.matchName,
        mode: entry.entryType,
        time: entry.startTime,
        // If user is no longer in current participants list of a live match,
        // it means the match was reset or they were removed, so mark as finished.
        status: (liveMatch && currentSlot) ? liveMatch.status : 'finished',
        slotNumber: currentSlot || entry.slotNumber || null,
        sortTime: new Date(entry.timestamp).getTime()
      });
    });

    // 2. Add entries from currently active arena (Legacy fallback)
    adminMatches.forEach(match => {
      const joinedCards = (match.innerSections || []).filter(c =>
        currentUser && (c.participantIds || []).includes(currentUser.uid)
      );

      if (joinedCards.length > 0) {
        joinedCards.forEach(card => {
          const fallbackId = `legacy-${match.id}-${card.id}`;
          // Only add if not already in user_joins
          const alreadyExists = joinedEntries.some(e => e.matchId === match.id && e.cardId === card.id);
          if (!alreadyExists) {
            const slotIndex = (card.participantIds || []).indexOf(currentUser?.uid || '');
            entriesMap.set(fallbackId, {
              id: fallbackId,
              originalMatchId: match.id,
              name: card.name,
              matchCategory: match.name,
              mode: card.entryType,
              time: card.startTime || match.time,
              status: match.status,
              slotNumber: slotIndex !== -1 ? slotIndex + 1 : null,
              sortTime: 0
            });
          }
        });
      } else if (currentUser && (match.participantIds || []).includes(currentUser.uid)) {
        const fallbackId = `legacy-${match.id}`;
        const alreadyExists = joinedEntries.some(e => e.matchId === match.id && !e.cardId);
        if (!alreadyExists) {
          const slotIndex = (match.participantIds || []).indexOf(currentUser.uid);
          entriesMap.set(fallbackId, {
            id: fallbackId,
            originalMatchId: match.id,
            name: match.name,
            matchCategory: match.group,
            mode: match.group,
            time: match.time,
            status: match.status,
            slotNumber: slotIndex !== -1 ? slotIndex + 1 : null,
            sortTime: 0
          });
        }
      }
    });

    return Array.from(entriesMap.values()).sort((a, b) => {
      const rank = { 'live': 0, 'upcoming': 1, 'finished': 2 };
      const statusDiff = (rank[a.status as keyof typeof rank] ?? 2) - (rank[b.status as keyof typeof rank] ?? 2);
      if (statusDiff !== 0) return statusDiff;
      return b.sortTime - a.sortTime;
    });
  })();
  
  // Show ALL relevant transaction types in history
  const historyTransactions = transactions.filter(tx =>
    ['Deposit', 'Withdraw', 'Withdrawal', 'Match Join', 'Winning', 'Refund'].includes(tx.type)
  );

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: 'var(--bg-gradient)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, background: 'var(--modal-bg)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--glass-border)' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 auto', transform: 'translateX(-20px)', letterSpacing: '-0.02em' }}>
          {t('myBets')}
        </h1>
      </div>

      <div style={{ padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {myJoinedEntries.length === 0 && historyTransactions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>{language === 'bn' ? 'কোনো ইতিহাস নেই' : 'No History Yet'}</h3>
            <p>{language === 'bn' ? 'আপনার সমস্ত লেনদেন এবং ম্যাচ এখানে দেখাবে।' : 'Your matches and transactions will appear here.'}</p>
          </div>
        )}

        {/* Matches List */}
        {myJoinedEntries.map((entry) => {
          return (
            <div 
              key={entry.id}
              onClick={() => {
                const matchExists = adminMatches.some(m => m.id === entry.originalMatchId);
                if (matchExists) {
                  navigate(`/match/${entry.originalMatchId}`);
                }
              }}
              style={{ 
                background: 'var(--glass-bg)', 
                borderRadius: '16px', 
                padding: '16px',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--card-shadow)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                cursor: 'pointer'
              }}
            >
              <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '4px', background: '#F59E0B', borderTopRightRadius: '4px', borderBottomRightRadius: '4px' }} />

              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '8px' }}>
                <Trophy size={24} color="#F59E0B" />
              </div>

              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</h3>
                    {entry.mode && (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, flexShrink: 0 }}>
                        {entry.mode.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {entry.slotNumber && (
                    <div style={{
                      background: 'rgba(249, 111, 46, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      border: '1px solid rgba(249, 111, 46, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flexShrink: 0
                    }}>
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>{t('slotNumber')}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--accent-orange)' }}>#{entry.slotNumber}</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <Calendar size={14} />
                  <span>{language === 'bn' ? 'জয়েন করেছেন' : 'Joined on'} {entry.time}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>
                  {entry.matchCategory}
                </div>
              </div>

              <ChevronRight size={20} color="var(--text-secondary)" />
            </div>
          );
        })}

        {/* Transactions List */}
        {historyTransactions.map((tx) => {
          const isDeposit = tx.type === 'Deposit';
          const color = isDeposit ? '#10B981' : '#EF4444';
          const bg = isDeposit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
          const Icon = isDeposit ? ArrowDownLeft : ArrowUpRight;
          
          let statusText = tx.status;
          if (language === 'bn') {
            if (tx.status === 'Completed') statusText = 'সম্পন্ন';
            if (tx.status === 'Pending') statusText = 'অপেক্ষমান';
            if (tx.status === 'Failed') statusText = 'ব্যর্থ';
          }

          let typeText = tx.type;
          if (language === 'bn') {
             if (tx.type === 'Deposit') typeText = 'জমা';
             if (tx.type === 'Withdraw' || tx.type === 'Withdrawal') typeText = 'উত্তোলন';
          }

          return (
            <div 
              key={tx.id}
              style={{ 
                background: 'var(--glass-bg)', 
                borderRadius: '16px', 
                padding: '16px',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--card-shadow)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '4px', background: color, borderTopRightRadius: '4px', borderBottomRightRadius: '4px' }} />

              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '8px' }}>
                <Icon size={24} color={color} />
              </div>

              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>{typeText}</h3>
                  <span style={{ fontSize: '0.65rem', background: bg, color: color, padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    {statusText}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <Calendar size={14} />
                  <span>{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>

              <div style={{ fontWeight: 900, color: color, fontSize: '1.1rem' }}>
                {isDeposit ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
};

export default MyBets;
