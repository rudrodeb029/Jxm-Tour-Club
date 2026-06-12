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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {winners.map((winner, index) => (
          <div 
            key={winner.id} 
            className="animate-slide-up"
            style={{ 
              animationDelay: `${index * 0.1}s`,
              opacity: 0,
              animationFillMode: 'forwards',
              background: 'linear-gradient(145deg, var(--glass-bg), rgba(30, 41, 59, 0.4))', 
              padding: '24px', 
              borderRadius: '24px', 
              border: '1px solid var(--glass-border)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ position: 'relative' }}>
              <img src={winner.avatar} alt={winner.name} style={{ width: '70px', height: '70px', borderRadius: '20px', border: '2px solid #FBBF24', boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)' }} />
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#FBBF24', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(251, 191, 36, 0.5)' }}>
                <Trophy size={16} color="#000" />
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{winner.name}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600 }}>
                <div style={{ color: '#FBBF24', fontWeight: 800 }}>{winner.match || winner.matchName}</div>
                <div style={{ fontSize: '0.8rem' }}>{winner.time || winner.date}</div>
              </div>
            </div>

            <div style={{ textAlign: 'right', background: 'rgba(251, 191, 36, 0.1)', padding: '16px 20px', borderRadius: '20px', border: '1px solid rgba(251, 191, 36, 0.3)', boxShadow: 'inset 0 2px 10px rgba(251, 191, 36, 0.1)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FBBF24', lineHeight: 1, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{formatCurrency(winner.amount || winner.prize || 0)}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.1em' }}>{t('won')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Winners;
