import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity as ActivityIcon, Globe, Plus, Minus, Sword, Trophy } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { useBalance } from '../context/BalanceContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import GlobalActivityFeed from '../components/GlobalActivityFeed';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const Activity = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { formatCurrency } = useCurrency();
  const [activityTab, setActivityTab] = useState<'personal' | 'community'>('community');
  const [personalJoins, setPersonalJoins] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'user_joins'), where('userId', '==', currentUser.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const joins = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPersonalJoins(joins);
    });
    return () => unsub();
  }, [currentUser]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)', color: 'var(--text-primary)', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '10px', borderRadius: '14px', cursor: 'pointer' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '10px', borderRadius: '14px' }}>
            <ActivityIcon size={24} color="#38BDF8" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
              {t('activity')}
            </h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button
          onClick={() => setActivityTab('personal')}
          className={activityTab === 'personal' ? 'btn btn-primary' : 'btn btn-outline'}
          style={{ flex: 1, padding: '12px', fontSize: '0.9rem', fontWeight: 800 }}
        >
          {t('personal').toUpperCase()}
        </button>
        <button
          onClick={() => setActivityTab('community')}
          className={activityTab === 'community' ? 'btn btn-primary' : 'btn btn-outline'}
          style={{ flex: 1, padding: '12px', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Globe size={16} />
          {t('community').toUpperCase()}
        </button>
      </div>

      <div style={{ flex: 1 }}>
        {activityTab === 'community' ? (
          <GlobalActivityFeed />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(() => {
              const { paymentRequests = [], withdrawalRequests = [] } = useAdminDashboard();
              const { transactions: localTransactions = [] } = useBalance();

              // 1. Transactions are source of truth for completed financial events
              const txItems = localTransactions.map(tx => {
                let matchName = '';
                if (tx.type === 'Match Join' || tx.type === 'Join') {
                   const join = personalJoins.find(j =>
                     Math.abs(new Date(j.timestamp).getTime() - new Date(tx.date).getTime()) < 30000
                   );
                   matchName = join?.cardName || join?.matchName || '';
                }
                return {
                  id: tx.id,
                  type: tx.type,
                  amount: tx.amount,
                  date: tx.date,
                  status: tx.status,
                  matchName
                };
              });

              // 2. Add PENDING/REJECTED payments
              const pendingPayments = paymentRequests
                .filter(p => currentUser && p.userId === currentUser.uid && p.status !== 'approved')
                .map(p => ({
                  id: p.id,
                  type: 'Deposit' as const,
                  amount: p.isRaw ? p.amount : p.amount * 126,
                  date: p.timestamp,
                  status: (p.status || 'Pending').charAt(0).toUpperCase() + (p.status || 'Pending').slice(1) as any,
                  matchName: ''
                }));

              // 3. Add PENDING/REJECTED withdrawals
              const pendingWithdrawals = withdrawalRequests
                .filter(w => currentUser && w.userId === currentUser.uid && w.status !== 'completed')
                .map(w => ({
                  id: w.id,
                  type: 'Withdraw' as const,
                  amount: -(w.isRaw ? w.amount : w.amount * 126),
                  date: w.timestamp,
                  status: (w.status || 'Pending').charAt(0).toUpperCase() + (w.status || 'Pending').slice(1) as any,
                  matchName: ''
                }));

              // 4. Combine and sort
              const allItems = [...txItems, ...pendingPayments, ...pendingWithdrawals]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              return allItems.length > 0 ? allItems.map((tx: any) => {
                const amountValue = Math.abs(tx.amount || 0);
                const isPositive = tx.amount > 0;

                const isJoin = tx.type === 'Match Join' || tx.type === 'Join';
                const isWin = tx.type === 'Winning' || tx.type === 'Win';
                const isDeposit = tx.type === 'Deposit';
                const isRefund = tx.type === 'Refund';

                const iconBg = isJoin ? 'rgba(249, 111, 46, 0.1)' :
                               isWin ? 'rgba(251, 191, 36, 0.1)' :
                               isDeposit ? 'rgba(16, 185, 129, 0.1)' :
                               isRefund ? 'rgba(56, 189, 248, 0.1)' :
                               'rgba(239, 68, 68, 0.1)';

                const iconColor = isJoin ? '#F96F2E' :
                                  isWin ? '#FBBF24' :
                                  isDeposit ? '#10B981' :
                                  isRefund ? '#38BDF8' :
                                  '#EF4444';

                const Icon = isJoin ? Sword :
                             isWin ? Trophy :
                             isDeposit ? Plus :
                             isRefund ? ArrowLeft :
                             Minus;

                return (
                  <div key={tx.id} className="card-skewed" style={{
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={18} color={iconColor} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{isJoin ? `${t('joined')} Match` : tx.type}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600 }}>
                          {tx.matchName ? `${tx.matchName} • ` : ''}{new Date(tx.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontWeight: 900,
                        fontSize: '1rem',
                        color: isWin || isDeposit || (isRefund && isPositive) ? '#10B981' : 'var(--text-primary)'
                      }}>
                        {isPositive ? '+' : '-'}{formatCurrency(amountValue)}
                      </div>
                      <div style={{
                        color: tx.status === 'Completed' || tx.status === 'Approved' ? '#10B981' : tx.status === 'Rejected' ? '#EF4444' : '#F59E0B',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        textTransform: 'uppercase'
                      }}>
                        {tx.status}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  {t('noTransactions')}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;
