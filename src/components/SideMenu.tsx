import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentUser } from '../data/mockData';
import { useBalance } from '../context/BalanceContext';
import { useAdmin } from '../context/AdminContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideMenu = ({ isOpen, onClose }: SideMenuProps) => {
  const navigate = useNavigate();
  const { balance } = useBalance();
  const { isAdminMode, toggleAdminMode } = useAdmin();
  const { formatCurrency } = useCurrency();
  const { currentUser, logout } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: 'Player',
    username: '@player',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        setProfileData(prev => ({
          ...prev,
          name: currentUser.displayName || prev.name,
          avatar: currentUser.photoURL || prev.avatar,
        }));
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfileData({
              name: data.name || currentUser.displayName || 'Player',
              username: data.username || '@player',
              avatar: data.avatar || currentUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=player'
            });
          }
        } catch (e) {
          console.error('Failed to fetch profile in SideMenu', e);
        }
      }
    };
    if (isOpen) {
      fetchProfile();
    }
  }, [currentUser, isOpen]);
  
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 200,
      display: 'flex',
    }} onClick={onClose}>
      <div 
        className="animate-fade-in"
        style={{
          width: '85%',
          maxWidth: '340px',
          height: '100%',
          background: 'var(--nav-bg)', // Deep Metallic
          padding: '24px 20px 100px 20px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'inset -20px 0 30px rgba(0,0,0,0.6), 10px 0 20px rgba(179, 144, 70, 0.2)',
          borderRight: '2px solid #b39046',
          overflowY: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Section with Neon Tube */}
        <div style={{
          position: 'relative',
          padding: '12px',
          borderRadius: '16px',
          background: 'var(--nav-bg)',
          boxShadow: '10px 10px 20px rgba(0,0,0,0.8), 0 0 15px rgba(179, 144, 70, 0.1)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: '1px solid var(--nav-border)'
        }}>
          {/* Removed Neon Tube Border as requested */}
          
          <div style={{ 
            width: '44px', height: '44px', 
            borderRadius: '50%', 
            overflow: 'hidden', 
            position: 'relative',
            zIndex: 2,
            border: '2px solid #64748b',
            boxShadow: '0 4px 8px rgba(0,0,0,0.6)'
          }}>
            <img src={profileData.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontWeight: 950, fontSize: '1rem', color: 'var(--text-primary)', textShadow: 'var(--text-shadow-md)' }}>{profileData.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{profileData.username}</div>
          </div>
        </div>

        {/* Menu Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          {/* Home */}
          <button onClick={() => { navigate('/home'); onClose(); }} style={{ background: 'var(--nav-bg)', border: '1px solid var(--nav-border)', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', boxShadow: 'var(--card-shadow)' }}>
            <img src="/images/3d_house.png" alt="Home" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '50%', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }} />
            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)', textShadow: 'var(--text-shadow-3d-sm)', letterSpacing: '0.01em' }}>Home</span>
          </button>
          
          {/* Wallet */}
          <button onClick={() => { navigate('/wallet'); onClose(); }} style={{ background: 'var(--nav-bg)', border: '1px solid var(--nav-border)', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', boxShadow: 'var(--card-shadow)' }}>
            <img src="/images/3d_wallet.png" alt="Wallet" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '50%', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }} />
            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)', textShadow: 'var(--text-shadow-3d-sm)', letterSpacing: '0.01em' }}>Wallet</span>
          </button>

          {/* My Bets */}
          <button onClick={() => { navigate('/my-bets'); onClose(); }} style={{ background: 'var(--nav-bg)', border: '1px solid var(--nav-border)', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', boxShadow: 'var(--card-shadow)' }}>
            <img src="/images/3d_poker_chips.png" alt="My Bets" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '50%', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }} />
            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)', textShadow: 'var(--text-shadow-3d-sm)', letterSpacing: '0.01em' }}>My Bets</span>
          </button>

          {/* Support */}
          <button onClick={() => { navigate('/support'); onClose(); }} style={{ background: 'var(--nav-bg)', border: '1px solid var(--nav-border)', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', boxShadow: 'var(--card-shadow)' }}>
            <img src="/images/3d_hologram.png" alt="Support" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '50%', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }} />
            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)', textShadow: 'var(--text-shadow-3d-sm)', letterSpacing: '0.01em' }}>Support</span>
          </button>

          {/* Logout */}
          <button onClick={async () => { await logout(); navigate('/auth'); onClose(); }} style={{ background: 'var(--nav-bg)', border: '1px solid var(--nav-border)', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', border: '1px solid rgba(239, 68, 68, 0.3)', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </div>
            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ef4444', textShadow: 'var(--text-shadow-3d-danger)', letterSpacing: '0.01em' }}>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;
