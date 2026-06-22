import { Link, useLocation } from 'react-router-dom';
import { useBalance } from '../context/BalanceContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useState } from 'react';

const BottomNav = () => {
  const location = useLocation();
  const { balance } = useBalance();
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const navItems = [
    { path: '/home', iconPath: '/images/3d_house.png', label: t('home') },
    { path: '/wallet', iconPath: '/images/3d_wallet.png', label: t('wallet'), showBalance: true },
    { path: '/my-bets', iconPath: '/images/3d_poker_chips.png', label: t('myBets') },
    { path: '/rules', iconPath: '/images/3d_rules_book.png', label: t('rule') || 'Rule' },
    { path: '/profile', iconPath: '/images/3d_hologram.png', label: t('profile') }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--nav-bg)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '3px 3px 4px',
      borderTopLeftRadius: '24px',
      borderTopRightRadius: '24px',
      zIndex: 100,
      maxWidth: '480px',
      margin: '0 auto',
      borderTop: '1px solid var(--nav-border)',
      borderLeft: '1px solid var(--nav-border)',
      borderRight: '1px solid var(--nav-border)',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.2)'
    }}>
      {/* Physical Indented Track Background */}
      <div style={{
        position: 'absolute',
        top: '4px', left: '4px', right: '4px', bottom: '4px',
        background: 'var(--modal-bg)',
        borderRadius: '18px',
        boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.1), inset 0 -1px 2px rgba(255,255,255,0.02)',
        zIndex: 0
      }} />

      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const isHovered = hoveredPath === item.path;
        
        return (
          <Link 
            key={item.path} 
            to={item.path}
            onMouseEnter={() => setHoveredPath(item.path)}
            onMouseLeave={() => setHoveredPath(null)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              position: 'relative',
              flex: 1,
              zIndex: 1,
              padding: '4px 0',
              borderRadius: '12px',
              background: isHovered ? 'var(--card-bg-hover)' : 'transparent',
              boxShadow: 'none',
              border: '1px solid transparent',
              borderTop: '1px solid transparent',
              transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              marginBottom: '1px',
              background: isActive ? 'var(--card-bg)' : 'transparent',
              borderRadius: '50%',
              boxShadow: isActive ? 'var(--card-shadow)' : 'none',
              padding: '3px'
            }}>
              <img 
                src={item.iconPath} 
                alt={item.label}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  borderRadius: '50%',
                  filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' : 'grayscale(100%) opacity(0.4)',
                  transform: isActive ? 'scale(1.05)' : 'scale(0.9)',
                  transition: 'all 0.3s ease'
                }} 
              />
              
              {item.showBalance && (
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-12px',
                  background: 'linear-gradient(180deg, #f97316 0%, #c2410c 100%)',
                  color: 'white',
                  fontSize: '0.55rem',
                  fontWeight: 900,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  border: '1px solid #7c2d12',
                  borderTop: '1px solid #fdba74',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.6), 0 1px 0 #7c2d12',
                  textShadow: '0 1px 1px rgba(0,0,0,0.5)',
                  zIndex: 10
                }}>
                  {formatCurrency(balance)}
                </div>
              )}
            </div>
            
            <span style={{ 
              fontSize: '0.55rem', 
              fontWeight: 800,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              lineHeight: 1
            }}>{item.label}</span>
            
            {isActive && (
              <div style={{ 
                position: 'absolute',
                bottom: '-3px',
                width: '16px', 
                height: '3px', 
                borderRadius: '2px', 
                background: 'linear-gradient(90deg, #f97316, #e34360)', 
                boxShadow: '0 0 10px #f97316'
              }} />
            )}
          </Link>
        )
      })}
    </div>
  );
};

export default BottomNav;
