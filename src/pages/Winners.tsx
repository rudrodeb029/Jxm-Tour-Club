import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const Winners = () => {
  const navigate = useNavigate();
  const { winners } = useAdminDashboard();
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  return (
    <div className="page-container" style={{ padding: '20px', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(251, 191, 36, 0.2)', padding: '8px', borderRadius: '12px', color: '#FBBF24' }}>
              <Trophy size={24} />
            </div>
            {t('recentWinners').split(' ')[0]} <span style={{ color: 'var(--accent-orange)' }}>{t('recentWinners').split(' ')[1] || ''}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem', fontWeight: 600 }}>{t('hallOfFame')}</p>
        </div>
      </div>

      {/* Winners List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {winners.map((winner, index) => (
          <div 
            key={winner.id} 
            className="animate-slide-up"
            style={{ 
              animationDelay: `${index * 0.1}s`,
              opacity: 0,
              animationFillMode: 'forwards',
              background: 'linear-gradient(145deg, var(--glass-bg), rgba(30, 41, 59, 0.4))', 
              padding: '16px',
              borderRadius: '20px',
              border: '1px solid var(--glass-border)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              position: 'relative',
              boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ position: 'relative' }}>
              <img src={winner.avatar} alt={winner.name} style={{ width: '50px', height: '50px', borderRadius: '14px', border: '1.5px solid #FBBF24', boxShadow: '0 4px 10px rgba(251, 191, 36, 0.2)' }} />
              <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#FBBF24', borderRadius: '50%', padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(251, 191, 36, 0.4)' }}>
                <Trophy size={12} color="#000" />
              </div>
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{winner.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px', fontWeight: 600 }}>
                <div style={{ color: '#FBBF24', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{winner.match || winner.matchName}</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>{winner.time || winner.date}</div>
              </div>
            </div>

            <div style={{ textAlign: 'right', background: 'rgba(251, 191, 36, 0.08)', padding: '10px 14px', borderRadius: '16px', border: '1px solid rgba(251, 191, 36, 0.2)', flexShrink: 0 }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FBBF24', lineHeight: 1, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{formatCurrency(winner.amount || winner.prize || 0)}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.05em' }}>{t('won')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Winners;
