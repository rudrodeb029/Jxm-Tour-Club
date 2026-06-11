import { useState } from 'react';
import { ArrowLeft, Trophy, Calendar, Wallet, ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useBalance } from '../context/BalanceContext';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

const MyBets = () => {
  const { transactions } = useBalance();
  const { formatCurrency } = useCurrency();
  const { adminMatches, adminUsers } = useAdminDashboard();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [displayUserId] = useState(() => localStorage.getItem('generatedUserId') || 'USER123');
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Filter matches that the user has joined
  const myMatches = adminMatches.filter(match => currentUser && (match.participantIds || []).includes(currentUser.uid));
  
  // Filter transactions
  const historyTransactions = transactions.filter(tx => ['Deposit', 'Withdraw', 'Withdrawal'].includes(tx.type));

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
        
        {myMatches.length === 0 && historyTransactions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>{language === 'bn' ? 'কোনো ইতিহাস নেই' : 'No History Yet'}</h3>
            <p>{language === 'bn' ? 'আপনার সমস্ত লেনদেন এবং ম্যাচ এখানে দেখাবে।' : 'Your matches and transactions will appear here.'}</p>
          </div>
        )}

        {/* Matches List */}
        {myMatches.map((match) => {
          const joinedCard = (match.innerSections || []).find(c => c.participantIds?.includes(currentUser?.uid || ''));
          const cardMode = joinedCard ? joinedCard.entryType : undefined;

          return (
            <div 
              key={match.id}
              onClick={() => navigate(`/match/${match.id}`)}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.name}</h3>
                  {cardMode && (
                    <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      {cardMode.toUpperCase()}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <Calendar size={14} />
                  <span>{language === 'bn' ? 'জয়েন করেছেন' : 'Joined on'} {match.time}</span>
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
