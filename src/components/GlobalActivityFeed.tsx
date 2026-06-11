import React, { useMemo } from 'react';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TrendingUp, ArrowUpRight, ArrowDownRight, UserPlus, Flame, Trophy, Zap, Star } from 'lucide-react';

const GlobalActivityFeed: React.FC = () => {
  const { activities } = useAdminDashboard();
  const { formatCurrency, currency } = useCurrency();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const currentUserId = currentUser?.uid || 'USER123';

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowUpRight className="w-4 h-4 text-emerald-400" />;
      case 'withdrawal': return <ArrowDownRight className="w-4 h-4 text-rose-400" />;
      case 'join': return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'win': return <Trophy className="w-4 h-4 text-amber-400" />;
      default: return <TrendingUp className="w-4 h-4 text-orange-400" />;
    }
  };

  const getMessage = (activity: any, isPrivate: boolean) => {
    const amountStr = isPrivate ? (currency === 'BDT' ? '৳***' : '$***') : formatCurrency(activity.amount);
    
    switch (activity.type) {
      case 'deposit': 
        return (
          <span className="flex items-center gap-1">
            {t('deposited')} <span className="text-emerald-400 font-bold" style={{ textShadow: '0 0 8px var(--color-success-bg-20)' }}>{amountStr}</span>
          </span>
        );
      case 'withdrawal': 
        return (
          <span className="flex items-center gap-1">
            {t('withdrew')} <span className="text-rose-400 font-bold" style={{ textShadow: '0 0 8px var(--color-danger-bg-20)' }}>{amountStr}</span>
          </span>
        );
      case 'join': 
        return (
          <span>
            {t('joined')} <span className="text-blue-400 font-bold" style={{ textShadow: '0 0 8px var(--color-info-bg-20)' }}>{activity.matchName}</span>
          </span>
        );
      case 'win': 
        return (
          <span>
            {t('won')} <span className="text-amber-400 font-bold" style={{ textShadow: '0 0 8px var(--color-warning-bg-20)' }}>{formatCurrency(activity.amount)}</span> {t('in')} <span className="text-amber-400 font-semibold">{activity.matchName}</span>
          </span>
        );
      default: return t('performedAction');
    }
  };

  return (
    <div className="space-y-4">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '650px', overflowY: 'auto', paddingRight: '8px' }}>
        {activities.length === 0 ? (
          <div className="text-center py-24 rounded-[48px] border-2 border-dashed border-white/5 bg-white/[0.01] backdrop-blur-sm">
            <div className="relative inline-block mb-6">
              <TrendingUp className="w-20 h-20 text-white/5" />
              <div className="absolute inset-0 bg-orange-500/5 blur-3xl rounded-full"></div>
            </div>
            <p className="text-white/30 font-bold italic tracking-wide text-lg">{t('awaitingCommunity')}</p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const isFinancial = activity.type === 'deposit' || activity.type === 'withdrawal';
            const isMine = activity.userId === currentUserId;
            const isPrivate = isFinancial && !isMine;
            
            const displayUserName = isPrivate ? t('player') : activity.userName;
            const displayAvatar = isPrivate 
              ? `https://api.dicebear.com/7.x/avataaars/svg?seed=Anonymous&backgroundColor=b6e3f4`
              : activity.userAvatar;

            const glowClass = activity.type === 'win' ? 'glow-avatar-win' : 
                             activity.type === 'deposit' ? 'glow-avatar-deposit' :
                             activity.type === 'withdrawal' ? 'glow-avatar-withdrawal' : '';

            const isHighValue = activity.amount && activity.amount >= 100;

            return (
              <div 
                key={activity.id}
                className="group relative flex items-center overflow-hidden card-skewed"
                style={{ 
                  gap: '16px', 
                  padding: '20px'
                }}
              >


                <div className="relative z-10" style={{ flexShrink: 0 }}>
                  <div className={`relative overflow-visible bg-black/40`} style={{ width: '48px', height: '48px', borderRadius: '50%', padding: '2px', border: '1px solid var(--glass-border)' }}>
                    <img 
                      src={displayAvatar} 
                      alt={displayUserName}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', position: 'relative', zIndex: 10 }}
                    />
                  </div>
                </div>

                <div className="z-10" style={{ flex: 1, minWidth: 0, paddingRight: '4px' }}>
                  <div className="flex items-start" style={{ marginBottom: '4px' }}>
                    <div className="flex items-center flex-wrap gap-1" style={{ flex: 1, minWidth: 0 }}>
                      <h4 className={`text-bold truncate transition-colors ${isMine ? 'text-orange-400' : 'text-white'}`} style={{ fontSize: '0.85rem', margin: 0, maxWidth: '100px' }}>
                        {displayUserName}
                      </h4>
                      {isMine && (
                        <span style={{ fontSize: '8px', background: 'var(--accent-orange)', color: 'black', padding: '2px 6px', borderRadius: '10px', textTransform: 'uppercase', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em', boxShadow: '0 0 10px rgba(249,115,22,0.3)' }}>
                          {t('you')}
                        </span>
                      )}
                      {isHighValue && (
                        <span style={{ fontSize: '8px', background: 'rgba(251,191,36,0.2)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)', padding: '2px 6px', borderRadius: '10px', textTransform: 'uppercase', fontWeight: 900 }}>
                          {t('highRoller')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span>{getMessage(activity, isPrivate)}</span>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      • {activity.timestamp}
                    </span>
                  </div>
                </div>

                {activity.status && (
                  <div className={`shrink-0 text-[8px] px-2 py-1 rounded-xl border-2 uppercase font-black tracking-widest z-10 transition-all duration-500 ${
                    activity.status === 'approved' || activity.status === 'completed' 
                      ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40'
                      : activity.status === 'pending' || activity.status === 'processing'
                      ? 'bg-orange-500/5 text-orange-400 border-orange-500/20 group-hover:bg-orange-500/20 group-hover:border-orange-500/40'
                      : 'bg-rose-500/5 text-rose-400 border-rose-500/20 group-hover:bg-rose-500/20 group-hover:border-rose-500/40'
                  }`}>
                    {activity.status}
                  </div>
                )}
                
                <div className={`z-10 flex shrink-0 items-center justify-center p-2 rounded-xl border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-110 ${
                    activity.type === 'deposit' ? 'bg-emerald-500/20 backdrop-blur-xl' :
                    activity.type === 'withdrawal' ? 'bg-rose-500/20 backdrop-blur-xl' :
                    activity.type === 'join' ? 'bg-blue-500/20 backdrop-blur-xl' :
                    'bg-amber-500/20 backdrop-blur-xl'
                }`}>
                  {getIcon(activity.type)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GlobalActivityFeed;
