import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity as ActivityIcon, Sword, Trophy } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import GlobalActivityFeed from '../components/GlobalActivityFeed';

const Activity = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { winners = [], adminUsers = [] } = useAdminDashboard();

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

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Community Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(56, 189, 248, 0.03))', 
              border: '1px solid rgba(56, 189, 248, 0.15)', 
              borderRadius: '16px', 
              padding: '12px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '4px'
            }}>
              <div style={{ color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)' }}>
                <Sword size={16} />
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                {language === 'bn' ? 'মোট যোগদান' : 'Total Joined'}
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38BDF8' }}>
                {adminUsers.length || 0}
              </span>
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(251, 191, 36, 0.03))', 
              border: '1px solid rgba(251, 191, 36, 0.15)', 
              borderRadius: '16px', 
              padding: '12px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '4px'
            }}>
              <div style={{ color: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.1)' }}>
                <Trophy size={16} />
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                {language === 'bn' ? 'মোট বিজয়ী' : 'Winners'}
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FBBF24' }}>
                {winners.length}
              </span>
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.03))', 
              border: '1px solid rgba(239, 68, 68, 0.15)', 
              borderRadius: '16px', 
              padding: '12px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '4px'
            }}>
              <div style={{ color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)' }}>
                <span>💀</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                {language === 'bn' ? 'মোট কিল' : 'Total Kills'}
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#EF4444' }}>
                {winners.reduce((sum, w) => sum + (w.kills || 0), 0)}
              </span>
            </div>
          </div>

          {/* Recent Achievements Horizontal Scroll */}
          {winners.length > 0 && (
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {language === 'bn' ? 'সাম্প্রতিক অর্জন' : 'Recent Achievements'}
              </h4>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="hide-scrollbar">
                {winners.slice(0, 10).map((w) => {
                  const isKillReward = w.type === 'kill_reward';
                  return (
                    <div 
                      key={w.id} 
                      style={{ 
                        flex: '0 0 160px', 
                        background: 'var(--glass-bg)', 
                        border: '1px solid var(--glass-border)', 
                        borderRadius: '16px', 
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '6px'
                      }}
                    >
                      <img src={w.avatar} alt={w.name} style={{ width: '40px', height: '40px', borderRadius: '12px', border: isKillReward ? '1.5px solid #EF4444' : '1.5px solid #FBBF24' }} />
                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{w.name}</div>
                      <div style={{ 
                        fontSize: '0.65rem', 
                        background: isKillReward ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 191, 36, 0.15)', 
                        color: isKillReward ? '#EF4444' : '#FBBF24', 
                        padding: '2px 8px', 
                        borderRadius: '8px', 
                        fontWeight: 700 
                      }}>
                        {isKillReward ? `💀 ${w.kills} Kills` : '🏆 Winner'}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                        {w.matchName || w.match}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Global Activity Feed */}
          <GlobalActivityFeed />
        </div>
      </div>
    </div>
  );
};

export default Activity;
