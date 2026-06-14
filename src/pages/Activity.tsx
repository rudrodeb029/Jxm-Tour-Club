import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity as ActivityIcon, Globe, Plus, Minus, Sword } from 'lucide-react';
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
        ...doc.data(),
        type: 'Match Join' as const
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
              const { paymentRequests = [], withdrawalRequests = [], activities: globalActivities = [] } = useAdminDashboard();
              const { transactions: localTransactions = [] } = useBalance();

              const userPayments = paymentRequests
                .filter(p => currentUser && p.userId === currentUser.uid)
                .map(p => ({
                  id: p.id,
                  type: 'Deposit' as const,
                  amount: p.isRaw ? p.amount : p.amount * 126,
                  date: p.timestamp,
                  status: (p.status || 'Pending').charAt(0).toUpperCase() + (p.status || 'Pending').slice(1) as any
                }));

              const userWithdrawals = withdrawalRequests
                .filter(w => currentUser && w.userId === currentUser.uid)
                .map(w => ({
                  id: w.id,
                  type: 'Withdraw' as const,
                  amount: -(w.isRaw ? w.amount : w.amount * 126),
                  date: w.timestamp,
                  status: (w.status || 'Pending').charAt(0).toUpperCase() + (w.status || 'Pending').slice(1) as any
                }));

              const userJoins = personalJoins.map(j => ({
                id: j.id,
                type: 'Join' as const,
                amount: -(Number(j.entryFee) || 0),
                date: j.timestamp,
                status: 'Completed' as const,
                matchName: j.cardName || j.matchName
              }));

              // Include user's own global activities (wins, etc)
              const userGlobalActivities = globalActivities
                .filter(act => currentUser && act.userId === currentUser.uid)
                .map(act => ({
                   id: act.id,
                   type: (act.type.charAt(0).toUpperCase() + act.type.slice(1)) as any,
                   amount: act.type === 'win' ? (Number(act.amount) || 0) : (act.amount ? -Number(act.amount) : 0),
                   date: act.timestamp,
                   status: (act.status || 'Completed').charAt(0).toUpperCase() + (act.status || 'Completed').slice(1) as any,
                   matchName: act.matchName
                }));

              // Use a Map to deduplicate by ID if necessary, though these sources should be mostly unique
              const allTxs = [...userPayments, ...userWithdrawals, ...localTransactions, ...userJoins, ...userGlobalActivities]
                .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i) // Deduplicate
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              return allTxs.length > 0 ? allTxs.map((tx: any) => (
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
                      background: tx.type === 'Join' ? 'rgba(249, 111, 46, 0.1)' : tx.amount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {tx.type === 'Join' ? <Sword size={18} color="#F96F2E" /> : tx.amount > 0 ? <Plus size={18} color="#10B981" /> : <Minus size={18} color="#EF4444" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{tx.type === 'Join' ? `${t('joined')} Match` : tx.type}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600 }}>
                        {tx.matchName ? `${tx.matchName} • ` : ''}{new Date(tx.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 900,
                      fontSize: '1rem',
                      color: tx.amount > 0 ? '#10B981' : 'var(--text-primary)'
                    }}>
                      {tx.amount > 0 ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
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
              )) : (
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
