import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentUser, mockUsers } from '../data/mockData';
import SecurityNotifications from '../components/SecurityNotifications';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useChat } from '../context/ChatContext';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { useAuth } from '../context/AuthContext';
import ModalPortal from '../components/ModalPortal';
import { db, storage } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { 
  CreditCard, 
  Trash2, 
  PlusCircle, 
  X,
  ChevronRight,
  ArrowLeft,
  Edit2,
  Settings,
  LogOut,
  Shield,
  Bell,
  HelpCircle,
  User,
  Moon,
  Sun,
  Globe,
  MessageSquare,
  Camera,
  Check,
  DollarSign
} from 'lucide-react';

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Shadow&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Blaze&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Storm&backgroundColor=d1f4d1',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Viper&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Nova&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Titan&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Fury&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Ghost&backgroundColor=d1f4d1',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Hawk&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Lynx&backgroundColor=ffd5dc',
];

const Profile = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { setIsChatOpen } = useChat();
  const [showSecurity, setShowSecurity] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { adminUsers } = useAdminDashboard();
  const { currentUser, logout } = useAuth();
  const [displayUserId] = useState(() => currentUser?.uid || 'USER123');
  
  // Sync with Admin Dashboard user data
  const adminUser = adminUsers.find(u => u.id === displayUserId);

  const [user, setUser] = useState(() => ({
    ...currentUser,
    id: displayUserId,
    name: localStorage.getItem('userName') || adminUser?.name || currentUser?.displayName || '',
    username: localStorage.getItem('userUsername') || adminUser?.username || '',
    avatar: localStorage.getItem('userAvatar') || adminUser?.avatar || currentUser?.photoURL || '',
    totalWins: adminUser?.totalWins || 0,
    totalMatches: adminUser?.totalMatches || 0
  }));

  const [editData, setEditData] = useState({ name: user.name, username: user.username, avatar: user.avatar });

  // Update local user state when adminUser changes
  useEffect(() => {
    if (adminUser) {
      setUser(prev => ({
        ...prev,
        name: adminUser.name || prev.name,
        username: adminUser.username || prev.username,
        avatar: adminUser.avatar || prev.avatar,
        totalWins: adminUser.totalWins,
        totalMatches: adminUser.totalMatches
      }));
    }
  }, [adminUser]);

  // Fetch from Firestore on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser(prev => {
              const newState = {
                ...prev,
                name: data.name || currentUser.displayName || prev.name,
                username: data.username || prev.username,
                avatar: data.avatar || currentUser.photoURL || prev.avatar,
              };
              setEditData({ name: newState.name, username: newState.username, avatar: newState.avatar });
              return newState;
            });
          }
        } catch (e) {
          console.error('Failed to fetch profile', e);
        }
      }
    };
    fetchProfile();
  }, [currentUser]);

  // Dynamic Saved Methods State
  const [savedMethods, setSavedMethods] = useState(() => {
    const saved = localStorage.getItem('savedMethods');
    return saved ? JSON.parse(saved) : [];
  });

  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethodData, setNewMethodData] = useState({ name: '', number: '' });
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    const saved = localStorage.getItem('notificationPrefs');
    return saved ? JSON.parse(saved) : { push: true, email: false, updates: true };
  });

  useEffect(() => {
    localStorage.setItem('notificationPrefs', JSON.stringify(notificationPrefs));
  }, [notificationPrefs]);

  useEffect(() => {
    localStorage.setItem('savedMethods', JSON.stringify(savedMethods));
  }, [savedMethods]);

  // Automatic Logo Migration for broken seeklogo URLs
  useEffect(() => {
    const assetMap: Record<string, string> = {
      'bkash': 'https://raw.githubusercontent.com/ultraDevs/Bangladeshi-Payment-Gateways/master/assets/images/Bkash.png',
      'nagad': 'https://raw.githubusercontent.com/ultraDevs/Bangladeshi-Payment-Gateways/master/assets/images/Nagad.png',
      'binance': 'https://cryptologos.cc/logos/bnb-bnb-logo.png'
    };

    let changed = false;
    const updatedMethods = savedMethods.map((m: any) => {
      if (m.icon && m.icon.includes('seeklogo.com')) {
        const key = m.name.toLowerCase();
        if (assetMap[key]) {
          changed = true;
          return { ...m, icon: assetMap[key] };
        }
      }
      return m;
    });

    if (changed) {
      setSavedMethods(updatedMethods);
    }
  }, []);

  const handleDeleteMethod = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmation(id);
  };

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    setSavedMethods(prev => {
      const updated = prev.filter((m: any) => m.id !== deleteConfirmation);
      localStorage.setItem('savedMethods', JSON.stringify(updated));
      return updated;
    });
    setDeleteConfirmation(null);
  };

  const handleAddMethod = () => {
    if (!newMethodData.name || !newMethodData.number) {
      alert('Please fill all fields');
      return;
    }
    const icons: Record<string, string> = {
      'bkash': 'https://raw.githubusercontent.com/ultraDevs/Bangladeshi-Payment-Gateways/master/assets/images/Bkash.png',
      'nagad': 'https://raw.githubusercontent.com/ultraDevs/Bangladeshi-Payment-Gateways/master/assets/images/Nagad.png',
      'binance': 'https://cryptologos.cc/logos/bnb-bnb-logo.png'
    };
    const newEntry = {
      id: Date.now().toString(),
      name: newMethodData.name,
      number: newMethodData.number,
      icon: icons[newMethodData.name.toLowerCase()] || 'https://cdn-icons-png.flaticon.com/512/4021/4021708.png',
      color: '#F96F2E'
    };
    setSavedMethods(prev => [...prev, newEntry]);
    setShowAddMethod(false);
    setNewMethodData({ name: '', number: '' });
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsUploading(true);
    try {
      // 1. Update Firebase Auth Profile
      await updateProfile(currentUser, {
        displayName: editData.name,
        photoURL: editData.avatar,
      });

      // 2. Update Firestore Document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name: editData.name,
        username: editData.username,
        avatar: editData.avatar,
      });

      setUser({ ...user, ...editData });
      setShowEditProfile(false);
    } catch (error) {
      console.error("Error updating profile", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !currentUser) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${currentUser.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setEditData({ ...editData, avatar: url });
    } catch (error) {
      console.error("Error uploading file", error);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '12px',
      flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px', transform: 'translateX(-8px)' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 auto', transform: 'translateX(-16px)' }}>{t('profile')}</h1>
      </div>


      {/* User Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <div style={{ 
            width: '110px', 
            height: '110px', 
            borderRadius: '50%', 
            padding: '4px', 
            background: 'linear-gradient(135deg, #F96F2E 0%, #F53844 100%)',
            boxShadow: '0 10px 25px rgba(249, 111, 46, 0.3)'
          }}>
            <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--modal-bg)' }} />
          </div>
          <button 
            onClick={() => setShowEditProfile(true)}
            style={{ 
              position: 'absolute', 
              bottom: '4px', 
              right: '4px', 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              background: 'var(--accent-gradient)', 
              border: '2px solid var(--modal-bg)', 
              color: 'var(--text-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Edit2 size={18} />
          </button>
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>{user.name}</h2>
        <div style={{ 
          background: 'var(--glass-bg)', 
          padding: '4px 12px', 
          borderRadius: '12px', 
          border: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>{user.username.startsWith('@') ? user.username : `@${user.username}`}</span>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
        </div>
      </div>


      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        {[
          { 
            label: t('matchesWon'), 
            value: user.totalWins.toString(), 
            bg: 'linear-gradient(135deg, #d4af37, #8b6b17)', 
            border: '#fef08a', 
            text: '#fef08a',
            trend: '+12%' 
          },
          { 
            label: t('matchesLost'), 
            value: (user.totalMatches - user.totalWins).toString(), 
            bg: 'linear-gradient(135deg, #94a3b8, #475569)', 
            border: '#f1f5f9', 
            text: '#f1f5f9',
            trend: '-5%' 
          }
        ].map((stat, i) => (
          <div 
            key={i}
            className="hover-scale" 
            style={{ 
              background: stat.bg,
              border: `1px solid ${stat.border}`,
              borderRadius: '12px',
              boxShadow: 'var(--card-shadow)',
              transform: 'skewX(-8deg)',
              cursor: 'default'
            }}
          >
            <div style={{
              padding: '16px 12px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              transform: 'skewX(8deg)'
            }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: stat.text, marginBottom: '4px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }}>{stat.value}</span>
              <span style={{ fontSize: '0.75rem', color: stat.text, opacity: 0.9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
              <div style={{ marginTop: '6px', fontSize: '0.65rem', color: stat.text, fontWeight: 800, background: 'rgba(0,0,0,0.3)', border: `1px solid ${stat.border}40`, padding: '2px 6px', borderRadius: '6px' }}>{stat.trend}</div>
            </div>
          </div>
        ))}
      </div>


      {/* Connections / Joined Users */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 4px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{t('battleBuddy')} <span style={{ color: 'var(--accent-orange)' }}>{t('connections')}</span></h3>
          <button onClick={() => alert('View all functionality coming soon!')} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '6px 12px', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>{t('viewAll')}</button>
        </div>
        <div style={{ 
          overflow: 'hidden', 
          width: '100%', 
          paddingBottom: '12px',
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
        }}>
          <div className="animate-infinite-scroll" style={{ gap: '20px' }}>
            {[...mockUsers, ...mockUsers].map((u, index) => (
              <div key={`${u.id}-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', minWidth: '72px', flexShrink: 0 }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  padding: '2px', 
                  background: 'var(--glass-border)',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--modal-bg)' }} />
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>{u.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Settings Menu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', padding: '0 4px' }}>{t('settings')}</h3>
        
        {[
          { label: t('editProfile'), icon: <Edit2 size={20} />, onClick: () => setShowEditProfile(true) },
          { label: t('accountSecurity'), icon: <Shield size={20} />, onClick: () => setShowSecurity(true) },
          { label: t('paymentMethods'), icon: <CreditCard size={20} />, onClick: () => setShowPayments(true) },
          { label: t('notifications'), icon: <Bell size={20} />, onClick: () => setShowNotifications(true) },
          { label: t('languageRegion'), icon: <Globe size={20} />, onClick: () => setShowLanguage(true) },
          { label: t('appearance'), icon: isDarkMode ? <Moon size={20} /> : <Sun size={20} />, onClick: toggleTheme, isToggle: true, toggleState: isDarkMode },
          { label: 'Currency Preference', icon: <DollarSign size={20} />, onClick: () => setCurrency(currency === 'USD' ? 'BDT' : 'USD'), customToggle: true, toggleState: currency },
          { label: t('helpCenter'), icon: <HelpCircle size={20} />, onClick: () => setShowHelp(true) },
          { label: t('logout'), icon: <LogOut size={20} />, onClick: async () => { await logout(); navigate('/auth'); }, isLogout: true }
        ].map((item, i) => {
          const styles = [
            { bg: 'linear-gradient(135deg, #0d5f66, #053338)', border: '#fde047', text: '#fde047' }, // Teal / Gold
            { bg: 'linear-gradient(135deg, #d4af37, #8b6b17)', border: '#fef08a', text: '#fef08a' }, // Gold
            { bg: 'linear-gradient(135deg, #94a3b8, #475569)', border: '#f1f5f9', text: '#f1f5f9' }, // Silver
            { bg: 'linear-gradient(135deg, #92400e, #5c2705)', border: '#fbbf24', text: '#fcd34d' }, // Bronze
            { bg: 'linear-gradient(135deg, #1e3a8a, #172554)', border: '#93c5fd', text: '#93c5fd' }, // Blue
            { bg: 'linear-gradient(135deg, #831843, #4c0519)', border: '#f9a8d4', text: '#f9a8d4' }, // Pink
            { bg: 'linear-gradient(135deg, #047857, #064e3b)', border: '#a7f3d0', text: '#a7f3d0' }, // Emerald
            { bg: 'linear-gradient(135deg, #7e22ce, #4c1d95)', border: '#d8b4fe', text: '#d8b4fe' }, // Purple
            { bg: 'linear-gradient(135deg, #991b1b, #7f1d1d)', border: '#fca5a5', text: '#fca5a5' } // Red
          ];
          const currentStyle = item.isLogout ? styles[8] : styles[i % (styles.length - 1)];

          return (
          <button 
            key={i}
            onClick={item.onClick}
            className="hover-scale" 
            style={{ 
              display: 'block', 
              width: 'calc(100% - 8px)',
              margin: '0 4px',
              padding: 0,
              borderRadius: '8px', 
              border: `1px solid ${currentStyle.border}`, 
              background: currentStyle.bg, 
              color: currentStyle.text, 
              fontSize: '1rem', 
              fontWeight: 900,
              cursor: 'pointer', 
              textAlign: 'left',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--card-shadow)',
              transform: 'skewX(-8deg)'
            }}
          >
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '16px 20px',
              transform: 'skewX(8deg)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ 
                  color: currentStyle.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))'
                }}>
                  {item.icon}
                </div>
                {item.label}
              </div>
              {item.customToggle ? (
                <div style={{
                  display: 'flex',
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: '100px',
                  padding: '2px',
                  position: 'relative',
                  width: '74px',
                  height: '30px',
                  boxSizing: 'border-box',
                  border: `1px solid ${currentStyle.border}40`
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '1px',
                    left: item.toggleState === 'USD' ? '1px' : '37px',
                    width: '32px',
                    height: '26px',
                    background: currentStyle.border,
                    borderRadius: '100px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    boxShadow: `0 2px 8px ${currentStyle.border}80`
                  }} />
                  
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                    color: item.toggleState === 'USD' ? '#000' : currentStyle.text,
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    transition: 'color 0.3s'
                  }}>
                    $
                  </div>
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                    color: item.toggleState === 'BDT' ? '#000' : currentStyle.text,
                    fontSize: '0.9rem',
                    fontWeight: 900,
                    transition: 'color 0.3s'
                  }}>
                    ৳
                  </div>
                </div>
              ) : item.isToggle ? (
                <div style={{ 
                  width: '44px', 
                  height: '24px', 
                  borderRadius: '20px', 
                  background: item.toggleState ? currentStyle.border : 'rgba(0,0,0,0.4)',
                  border: `1px solid ${currentStyle.border}40`,
                  position: 'relative',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ 
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '50%', 
                    background: item.toggleState ? '#000' : currentStyle.text, 
                    position: 'absolute',
                    top: '2px',
                    left: item.toggleState ? '22px' : '2px',
                    transition: 'all 0.3s'
                  }} />
                </div>
              ) : (
                <ChevronRight size={18} color={currentStyle.text} style={{ opacity: 0.8 }} />
              )}
            </div>
          </button>
          );
        })}
      </div>


      {/* Modals */}
      {showSecurity && <SecurityNotifications onClose={() => setShowSecurity(false)} />}
      
      {showEditProfile && (
        <ModalPortal>
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(20px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowEditProfile(false)}
        >
          <div 
            className="animate-fade-in"
            style={{
              background: 'var(--modal-bg)',
              width: '100%',
              maxWidth: '450px',
              maxHeight: '90vh',
              borderRadius: '24px',
              padding: '32px 24px',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '28px' }}>{t('editProfile').split(' ')[0]} <span style={{ color: 'var(--accent-orange)' }}>{t('editProfile').split(' ')[1]}</span></h3>
            
            {/* Profile Icon Preview */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  width: '100px', 
                  height: '100px', 
                  borderRadius: '50%', 
                  padding: '3px', 
                  background: 'var(--accent-gradient)',
                  boxShadow: '0 8px 30px rgba(249, 111, 46, 0.35)'
                }}>
                  <img 
                    src={editData.avatar} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--modal-bg)' }} 
                  />
                </div>
                <label style={{ 
                  position: 'absolute', 
                  bottom: '0', 
                  right: '0', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: 'var(--accent-gradient)', 
                  border: '3px solid var(--modal-bg)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <Camera size={14} color="#fff" />
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>
              </div>
            </div>

            {/* Avatar Selection Label */}
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Choose Avatar</label>

            {/* Avatar Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '12px', 
              marginBottom: '28px' 
            }}>
              {AVATAR_OPTIONS.map((avatarUrl, i) => {
                const isSelected = editData.avatar === avatarUrl;
                return (
                  <div 
                    key={i}
                    onClick={() => setEditData({ ...editData, avatar: avatarUrl })}
                    style={{ 
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: '20px',
                      padding: '3px',
                      background: isSelected ? 'var(--accent-gradient)' : 'var(--glass-border)',
                      transition: 'all 0.25s ease',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: isSelected ? '0 6px 20px rgba(249, 111, 46, 0.35)' : 'none'
                    }}>
                      <img 
                        src={avatarUrl} 
                        alt={`Avatar ${i + 1}`} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          borderRadius: '18px', 
                          objectFit: 'cover', 
                          background: 'var(--glass-bg)',
                          border: '2px solid var(--modal-bg)'
                        }} 
                      />
                    </div>
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: 'var(--accent-gradient)',
                        border: '2px solid var(--modal-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2
                      }}>
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('fullName')}</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-orange)', opacity: 0.8 }} />
                  <input 
                    type="text" 
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '18px 18px 18px 48px', borderRadius: '18px', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, outline: 'none', transition: 'all 0.2s' }}
                  />
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('username')}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-orange)', fontWeight: 800, fontSize: '1.1rem' }}>@</span>
                  <input 
                    type="text" 
                    value={editData.username.replace('@', '')}
                    onChange={(e) => setEditData({ ...editData, username: `@${e.target.value}` })}
                    style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '18px 18px 18px 48px', borderRadius: '18px', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, outline: 'none', transition: 'all 0.2s' }}
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveProfile}
                disabled={isUploading}
                style={{ 
                  width: '100%', 
                  padding: '15px 20px', 
                  borderRadius: '14px', 
                  background: 'var(--accent-gradient)', 
                  border: 'none', 
                  color: 'var(--text-primary)', 
                  fontWeight: 800, 
                  fontSize: '1rem', 
                  marginTop: '8px', 
                  cursor: isUploading ? 'not-allowed' : 'pointer', 
                  boxShadow: '0 8px 24px rgba(249, 111, 46, 0.4)', 
                  transition: 'transform 0.2s',
                  letterSpacing: '1px',
                  opacity: isUploading ? 0.7 : 1
                }}
                onMouseDown={(e) => !isUploading && (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseUp={(e) => !isUploading && (e.currentTarget.style.transform = 'scale(1)')}
              >
                {isUploading ? 'Updating...' : t('updateProfile')}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {showPayments && (
        <ModalPortal>
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(20px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowPayments(false)}
        >
          <div 
            className="animate-fade-in"
            style={{
              background: 'var(--modal-bg)',
              width: '100%',
              maxWidth: '450px',
              maxHeight: '85vh',
              borderRadius: '24px',
              padding: '32px 24px',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--accent-orange)15', padding: '10px', borderRadius: '14px' }}>
                  <CreditCard size={26} color="var(--accent-orange)" />
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>{t('paymentMethods').split(' ')[0]} <span style={{ color: 'var(--accent-orange)' }}>{t('paymentMethods').split(' ')[1]}</span></h3>
              </div>
              <button onClick={() => setShowPayments(false)} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '10px', borderRadius: '14px', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>


            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {savedMethods.map((method: any) => (
                <div 
                  key={method.id}
                  style={{ 
                    background: 'var(--glass-bg)', 
                    padding: '24px', 
                    borderRadius: '28px', 
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: 'var(--card-shadow)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#FFFFFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                      <img src={method.icon} alt={method.name} style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{method.name}</div>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{method.number}</div>
                    </div>

                  </div>
                  <button 
                    onClick={(e) => handleDeleteMethod(e, method.id)}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444', padding: '12px', borderRadius: '14px', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              
              {!showAddMethod ? (
                <button 
                  onClick={() => setShowAddMethod(true)}
                  style={{ width: '100%', padding: '24px', borderRadius: '28px', background: 'var(--glass-bg)', border: '2px dashed var(--glass-border)', color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--glass-border)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--glass-bg)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <PlusCircle size={22} />
                  {t('linkNew')}
                </button>

              ) : (
                <div style={{ background: 'var(--glass-bg)', padding: '28px', borderRadius: '32px', border: '1px solid var(--glass-border)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 900 }}>Add <span style={{ color: 'var(--accent-orange)' }}>Method</span></h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Provider</label>
                      <select 
                        value={newMethodData.name}
                        onChange={(e) => setNewMethodData({...newMethodData, name: e.target.value})}
                        style={{ width: '100%', background: 'var(--modal-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '16px', color: 'var(--text-primary)', fontWeight: 700, outline: 'none' }}
                      >
                        <option value="" style={{ background: 'var(--modal-bg)' }}>Select Provider</option>
                        <option value="Bkash" style={{ background: 'var(--modal-bg)' }}>Bkash</option>
                        <option value="Nagad" style={{ background: 'var(--modal-bg)' }}>Nagad</option>
                        <option value="Binance" style={{ background: 'var(--modal-bg)' }}>Binance</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('accountSecurity')}</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 017..." 
                        value={newMethodData.number}
                        onChange={(e) => setNewMethodData({...newMethodData, number: e.target.value})}
                        style={{ width: '100%', background: 'var(--modal-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '16px', color: 'var(--text-primary)', fontWeight: 700, outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handleAddMethod} style={{ flex: 2, padding: '15px 20px', borderRadius: '14px', background: 'var(--accent-gradient)', border: 'none', color: 'var(--text-primary)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>Link Account</button>
                    <button onClick={() => setShowAddMethod(false)} style={{ flex: 1, padding: '12px 18px', borderRadius: '12px', background: 'none', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
                  </div>

                </div>
              )}
            </div>

            <button 
              onClick={() => setShowPayments(false)}
              style={{ width: '100%', padding: '15px 20px', borderRadius: '14px', background: 'var(--accent-gradient)', border: 'none', color: 'var(--text-primary)', fontWeight: 800, fontSize: '1rem', marginTop: '40px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(249, 111, 46, 0.4)' }}
            >
              {t('confirmSelection')}
            </button>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <ModalPortal>
        <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowNotifications(false)}>
          <div className="animate-fade-in" style={{ 
            background: 'var(--modal-bg)', 
            width: '100%', 
            maxWidth: '450px',
            borderRadius: '24px', 
            padding: '32px 24px', 
            color: 'var(--text-primary)', 
            border: '1px solid var(--glass-border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>Notification <span style={{ color: 'var(--accent-orange)' }}>Settings</span></h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem', fontWeight: 500 }}>Control how you receive alerts and updates.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { id: 'push', label: 'Push Notifications', desc: 'Alerts for matches and tournaments', icon: <Bell size={20} /> },
                { id: 'email', label: 'Email Alerts', desc: 'Updates about your account and wallet', icon: <Globe size={20} /> },
                { id: 'updates', label: 'Tournament Updates', desc: 'New features and event announcements', icon: <Shield size={20} /> }
              ].map((notif, i) => {
                const enabled = notificationPrefs[notif.id as keyof typeof notificationPrefs];
                return (
                <div key={i} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '20px 24px', 
                  background: 'var(--glass-bg)', 
                  borderRadius: '24px', 
                  border: '1px solid var(--glass-border)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '14px', 
                      background: 'rgba(249, 111, 46, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'var(--accent-orange)'
                    }}>
                      {notif.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{notif.label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{notif.desc}</div>
                    </div>
                  </div>
                  <div 
                    onClick={() => setNotificationPrefs({ ...notificationPrefs, [notif.id]: !enabled })}
                    style={{ 
                    width: '50px', 
                    height: '28px', 
                    borderRadius: '20px', 
                    background: enabled ? 'var(--accent-gradient)' : 'var(--glass-border)', 
                    position: 'relative', 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ 
                      width: '22px', 
                      height: '22px', 
                      borderRadius: '50%', 
                      background: '#FFFFFF', 
                      position: 'absolute', 
                      top: '3px', 
                      left: enabled ? '25px' : '3px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>
              )})}
            </div>
            <button 
              onClick={() => setShowNotifications(false)} 
              style={{ 
                width: '100%', 
                padding: '15px 20px', 
                borderRadius: '14px', 
                background: 'var(--accent-gradient)', 
                border: 'none', 
                color: 'var(--text-primary)', 
                fontWeight: 800, 
                fontSize: '1rem', 
                marginTop: '32px', 
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(249, 111, 46, 0.4)',
                letterSpacing: '1px'
              }}
            >
              {t('savePreferences')}
            </button>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Language Modal */}
      {showLanguage && (
        <ModalPortal>
        <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowLanguage(false)}>
          <div className="animate-fade-in" style={{ 
            background: 'var(--modal-bg)', 
            width: '100%', 
            maxWidth: '450px',
            borderRadius: '24px', 
            padding: '32px 24px', 
            color: 'var(--text-primary)', 
            border: '1px solid var(--glass-border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>Language & <span style={{ color: 'var(--accent-orange)' }}>Region</span></h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem', fontWeight: 500 }}>Select your preferred language for the interface.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'English', native: 'English', region: 'United States', flag: '🇺🇸', code: 'en' },
                { name: 'Bengali', native: 'বাংলা', region: 'Bangladesh', flag: '🇧🇩', code: 'bn' },
                { name: 'Hindi', native: 'हिन्दी', region: 'India', flag: '🇮🇳', code: 'hi' }
              ].map((lang, i) => {
                const isSelected = language === lang.code;
                return (
                  <div 
                    key={i} 
                    onClick={() => setLanguage(lang.code as 'en' | 'bn' | 'hi')}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '20px 24px', 
                      background: isSelected ? 'var(--accent-gradient)' : 'var(--glass-bg)', 
                      borderRadius: '24px', 
                      border: '1px solid var(--glass-border)', 
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isSelected ? '0 10px 25px rgba(249, 111, 46, 0.3)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '16px', 
                        background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                      }}>
                        {lang.flag}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: isSelected ? '#FFFFFF' : 'var(--text-primary)' }}>
                          {lang.name} <span style={{ fontSize: '0.9rem', opacity: 0.7, fontWeight: 500 }}>({lang.native})</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)', fontWeight: 600 }}>{lang.region}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%', 
                        background: '#FFFFFF', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-orange)' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button 
              onClick={() => setShowLanguage(false)} 
              style={{ 
                width: '100%', 
                padding: '15px 20px', 
                borderRadius: '14px', 
                background: 'var(--accent-gradient)', 
                border: 'none', 
                color: 'var(--text-primary)', 
                fontWeight: 800, 
                fontSize: '1rem', 
                marginTop: '32px', 
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(249, 111, 46, 0.4)',
                letterSpacing: '1px'
              }}
            >
              {t('confirmSelection')}
            </button>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Help & Support Modal */}
      {showHelp && (
        <ModalPortal>
        <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowHelp(false)}>
          <div className="animate-fade-in" style={{ 
            background: 'var(--modal-bg)', 
            width: '100%', 
            maxWidth: '450px',
            maxHeight: '85vh', 
            borderRadius: '24px', 
            padding: '32px 24px', 
            color: 'var(--text-primary)', 
            border: '1px solid var(--glass-border)', 
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>Help <span style={{ color: 'var(--accent-orange)' }}>Center</span></h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem', fontWeight: 500 }}>Find answers or contact our support team.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ 
                padding: '28px', 
                background: 'var(--accent-gradient)', 
                borderRadius: '32px', 
                color: 'var(--text-primary)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 15px 35px rgba(249, 111, 46, 0.3)'
              }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', fontWeight: 900, position: 'relative' }}>Need more help?</h4>
                <p style={{ margin: '0 0 24px 0', fontSize: '0.95rem', fontWeight: 600, opacity: 0.9, position: 'relative', lineHeight: 1.4 }}>Our support team is available 24/7 to assist you with any issues.</p>
                <button 
                  onClick={() => {
                    setIsChatOpen(true);
                    setShowHelp(false);
                  }}
                  style={{ 
                  background: '#FFFFFF', 
                  color: 'var(--accent-orange)', 
                  border: 'none', 
                  padding: '14px 28px', 
                  borderRadius: '16px', 
                  fontWeight: 900, 
                  fontSize: '0.95rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                  position: 'relative'
                }}>
                  <MessageSquare size={20} />
                  CHAT WITH US
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: '8px 4px', fontSize: '1.2rem', fontWeight: 800 }}>Frequently Asked Questions</h4>
                {[
                  { q: 'How do I join a match?', a: 'Go to the Home screen, select a tournament, and click Join. Make sure you have enough balance!' },
                  { q: 'When will I get my winnings?', a: 'Winnings are usually credited within 1-2 hours after the match ends.' },
                  { q: 'What are the withdrawal limits?', a: 'Minimum withdrawal is 100 BDT and maximum is 50,000 BDT per day.' },
                  { q: 'Is my data secure?', a: 'Yes, we use enterprise-grade encryption to protect all your personal and financial data.' }
                ].map((faq, i) => (
                  <div key={i} style={{ 
                    padding: '24px', 
                    background: 'var(--glass-bg)', 
                    borderRadius: '24px', 
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '10px', color: 'var(--text-primary)', display: 'flex', gap: '12px' }}>
                      <span style={{ color: 'var(--accent-orange)' }}>Q.</span>
                      {faq.q}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.6, paddingLeft: '28px' }}>{faq.a}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => setShowHelp(false)} 
              style={{ 
                width: '100%', 
                padding: '12px 18px', 
                borderRadius: '12px', 
                border: '1px solid var(--glass-border)', 
                background: 'var(--glass-bg)', 
                color: 'var(--text-primary)', 
                fontWeight: 800, 
                fontSize: '0.9rem', 
                marginTop: '40px', 
                cursor: 'pointer',
                letterSpacing: '1px'
              }}
            >
              CLOSE CENTER
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(24px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setDeleteConfirmation(null)}
        >
          <div 
            className="animate-scale-up"
            style={{
              background: 'var(--modal-bg)',
              width: '100%',
              maxWidth: '400px',
              borderRadius: '44px',
              padding: '40px 24px',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              textAlign: 'center',
              boxShadow: '0 30px 100px rgba(0,0,0,0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >

            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '35px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 32px',
              color: '#EF4444',
              transform: 'rotate(-10deg)',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
              </svg>
            </div>
            
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '16px' }}>Wait a Second!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.6, fontSize: '1.05rem', fontWeight: 500 }}>
              Are you sure you want to remove this <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>payment method</span>? You will need to link it again for future withdrawals.
            </p>

            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <button 
                onClick={confirmDelete}
                style={{ 
                  width: '100%', 
                  padding: '15px 20px', 
                  borderRadius: '14px', 
                  background: '#EF4444', 
                  border: 'none', 
                  color: 'var(--text-primary)', 
                  fontWeight: 800, 
                  fontSize: '1rem', 
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(239, 68, 68, 0.4)'
                }}
              >
                YES, REMOVE IT
              </button>
              <button 
                onClick={() => setDeleteConfirmation(null)}
                style={{ 
                  width: '100%', 
                  padding: '12px 18px', 
                  borderRadius: '12px', 
                  background: 'var(--glass-bg)', 
                  border: '1px solid var(--glass-border)', 
                  color: 'var(--text-primary)', 
                  fontWeight: 800, 
                  fontSize: '0.9rem', 
                  cursor: 'pointer' 
                }}
              >
                Keep Method
              </button>

            </div>
          </div>
        </div>
        </ModalPortal>
      )}

    </div>
  );
};
export default Profile;
