import { useState, useEffect } from 'react';
import { currentUser as mockUser } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { ArrowLeft, Plus, History, ArrowDownToLine, ArrowUpFromLine, RefreshCcw, Check, DollarSign } from 'lucide-react';
import { useBalance } from '../context/BalanceContext';
import { useAdmin } from '../context/AdminContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { 
  Trash2, 
  PlusCircle, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  CreditCard,
  ChevronLeft,
  Edit2,
  Minus,
  Globe
} from 'lucide-react';
import GlobalActivityFeed from '../components/GlobalActivityFeed';
import SuccessModal from '../components/SuccessModal';
import ModalPortal from '../components/ModalPortal';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

const Wallet = () => {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { formatCurrency, currency } = useCurrency();
  const { isAdminMode } = useAdmin();
  const { balance, addBalance, deductBalance, transactions: localTransactions } = useBalance();
  const { paymentRequests, withdrawalRequests, paymentSettings } = useAdminDashboard();
  const { currentUser } = useAuth();
  const [displayUserId] = useState(() => localStorage.getItem('generatedUserId') || mockUser.id);
  const [profileUsername, setProfileUsername] = useState<string>('');

  useEffect(() => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileUsername(data.username || '');
      }
    });
    return () => unsubscribe();
  }, [currentUser]);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isWithdrawConfirming, setIsWithdrawConfirming] = useState(false);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [selectedWithdrawMethod, setSelectedWithdrawMethod] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, type: 'gateway' | 'method' } | null>(null);
  const [historyTab, setHistoryTab] = useState<'personal' | 'community'>('personal');
  const [successConfig, setSuccessConfig] = useState<{ isOpen: boolean, title: string, message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  // Dynamic Gateways State
  const localGateways = [
    { id: 'bkash-default', name: 'Bkash', color: '#E2136E', logo: 'https://raw.githubusercontent.com/ultraDevs/Bangladeshi-Payment-Gateways/master/assets/images/Bkash.png' },
    { id: 'nagad-default', name: 'Nagad', color: '#F15A22', logo: 'https://raw.githubusercontent.com/ultraDevs/Bangladeshi-Payment-Gateways/master/assets/images/Nagad.png' },
    { id: 'binance-default', name: 'Binance', color: '#F3BA2F', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' }
  ];

  const [showAddGateway, setShowAddGateway] = useState(false);
  const [newGateway, setNewGateway] = useState({ name: '', color: '#F96F2E', logo: '' });

  // User's Personal Saved Methods
  const [savedMethods, setSavedMethods] = useState(() => {
    const saved = localStorage.getItem('savedMethods');
    return saved ? JSON.parse(saved) : [];
  });

  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethodData, setNewMethodData] = useState({ name: '', number: '' });

  useEffect(() => {
    localStorage.setItem('savedMethods', JSON.stringify(savedMethods));
  }, [savedMethods]);

  const isAnyWalletModalOpen = isConfirming || isWithdrawConfirming || showAddGateway || showAddMethod || deleteConfirmation !== null || successConfig.isOpen;
  useLockBodyScroll(isAnyWalletModalOpen);

  const handleDeleteGateway = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    const { id } = deleteConfirmation;

    setSavedMethods(prev => {
      const updated = prev.filter((m: any) => m.id !== id);
      localStorage.setItem('savedMethods', JSON.stringify(updated));
      return updated;
    });
    if (selectedWithdrawMethod === id) setSelectedWithdrawMethod(null);
    setDeleteConfirmation(null);
  };

  const handleDeleteMethod = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmation({ id, type: 'method' });
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
    const colors: Record<string, string> = {
      'bkash': '#E2136E',
      'nagad': '#F15A22',
      'binance': '#F3BA2F'
    };
    const newEntry = {
      id: Date.now().toString(),
      name: newMethodData.name,
      number: newMethodData.number,
      icon: icons[newMethodData.name.toLowerCase()] || 'https://cdn-icons-png.flaticon.com/512/4021/4021708.png',
      color: colors[newMethodData.name.toLowerCase()] || '#F96F2E'
    };
    setSavedMethods(prev => [...prev, newEntry]);
    setShowAddMethod(false);
    setNewMethodData({ name: '', number: '' });
  };

  const getUSDAmount = (input: string) => {
    const val = parseFloat(input);
    if (isNaN(val)) return 0;
    return val;
  };

  const handleWithdraw = () => {
    const amountUSD = getUSDAmount(withdrawAmount);
    if (!selectedWithdrawMethod) {
      alert('Please select a withdrawal method');
      return;
    }
    if (amountUSD < 50) {
      alert(`${t('minimumWithdraw')} ৳50`);
      return;
    }
    if (amountUSD > balance) {
      alert('Insufficient balance');
      return;
    }
    setIsWithdrawConfirming(true);
  };

  const confirmWithdraw = async () => {
    const amountUSD = getUSDAmount(withdrawAmount);
    const method = savedMethods.find(m => m.id === selectedWithdrawMethod);
    
    if (amountUSD > 0 && method && currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        
        // 1. Transaction to safely verify and deduct the balance immediately
        await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) {
            throw new Error("User profile does not exist.");
          }
          const currentBalance = userDoc.data().balance || 0;
          if (currentBalance < amountUSD) {
            throw new Error("Insufficient balance.");
          }
          // Deduct from Firestore balance
          transaction.update(userRef, { balance: currentBalance - amountUSD });
        });

        // 2. Add withdrawal request document
        await addDoc(collection(db, 'withdrawals'), {
          userId: currentUser.uid,
          displayUserId: profileUsername || displayUserId,
          amount: amountUSD,
          withdrawMethod: method.name,
          accountNumber: method.number,
          accountName: currentUser.displayName || 'User Account',
          userName: currentUser.displayName || 'User',
          userAvatar: currentUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
          timestamp: new Date().toISOString(),
          status: 'pending',
          isRaw: true
        });
        
        setWithdrawAmount('');
        setSelectedWithdrawMethod(null);
        setIsWithdrawConfirming(false);
        setSuccessConfig({
          isOpen: true,
          title: "Withdrawal Requested!",
          message: "Your withdrawal request has been submitted. Your balance has been updated and the request will be processed by the admin."
        });
      } catch (error: any) {
        console.error("Error adding withdrawal request:", error);
        alert(error.message || "Failed to submit withdrawal request.");
      }
    }
  };

  const handleDeposit = async () => {
    const amountUSD = getUSDAmount(depositAmount);
    const gateway = localGateways.find(g => g.id === selectedGateway);
    
    if (amountUSD < 50) {
      alert(`${t('minimumDeposit')} ৳50`);
      return;
    }

    if (!transactionId.trim()) {
      alert("Please enter a valid Transaction ID.");
      return;
    }

    if (amountUSD > 0 && gateway && currentUser) {
      try {
        await addDoc(collection(db, 'payments'), {
          userId: currentUser.uid,
          displayUserId: profileUsername || displayUserId,
          amount: amountUSD,
          transactionId: transactionId,
          paymentMethod: gateway.name,
          accountNumber: 'User Account',
          userName: currentUser.displayName || 'User',
          userAvatar: currentUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
          timestamp: new Date().toISOString(),
          status: 'pending',
          isRaw: true
        });
        
        setDepositAmount('');
        setTransactionId('');
        setSelectedGateway(null);
        setIsConfirming(false);
        setSuccessConfig({
          isOpen: true,
          title: "Deposit Requested!",
          message: "Deposit request submitted! Balance will update after admin approval."
        });
      } catch (error) {
        console.error("Error adding deposit request:", error);
        alert("Failed to submit deposit request.");
      }
    }
  };




  const handleQuickSelect = (amountUSD: number) => {
    setDepositAmount(amountUSD.toString());
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)', color: 'var(--text-primary)', position: 'relative' }}>
      {/* Premium Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 10, background: 'var(--modal-bg)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--glass-border)' }}>

        <button 
          onClick={() => window.history.back()}
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >

          <ChevronLeft size={20} strokeWidth={3} />
        </button>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 auto', transform: 'translateX(-20px)', letterSpacing: '-0.02em' }}>
          {t('myWallet')}
        </h1>
      </div>

      {/* Mastercard Style Balance Card */}
      <div style={{ padding: '20px 16px 32px' }}>
        <div 
          className="animate-slide-up"
          style={{ 
            background: 'linear-gradient(135deg, #1A1C2E 0%, #2A203F 100%)',
            borderRadius: '28px',
            padding: '24px',
            minHeight: '220px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--card-border)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
            position: 'relative',
            overflow: 'hidden',
            aspectRatio: '1.58 / 1',
            width: '100%'
          }}
        >
          {/* Card Textures/Glows */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--accent-gradient)', opacity: 0.15, filter: 'blur(40px)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '120px', height: '120px', background: '#38BDF8', opacity: 0.1, filter: 'blur(35px)', borderRadius: '50%' }} />
          
          {/* Card Top: Chip and Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ 
                width: '45px', 
                height: '35px', 
                background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)', 
                borderRadius: '8px',
                position: 'relative',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
              }}>
                <div style={{ position: 'absolute', top: '15%', left: '0', width: '100%', height: '1px', background: 'rgba(0,0,0,0.1)' }} />
                <div style={{ position: 'absolute', top: '45%', left: '0', width: '100%', height: '1px', background: 'rgba(0,0,0,0.1)' }} />
                <div style={{ position: 'absolute', top: '75%', left: '0', width: '100%', height: '1px', background: 'rgba(0,0,0,0.1)' }} />
                <div style={{ position: 'absolute', left: '30%', top: '0', width: '1px', height: '100%', background: 'rgba(0,0,0,0.1)' }} />
                <div style={{ position: 'absolute', left: '70%', top: '0', width: '1px', height: '100%', background: 'rgba(0,0,0,0.1)' }} />
              </div>
            </div>
          </div>

          {/* Card Middle: Balance */}
          <div style={{ zIndex: 1, marginTop: '10px' }}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('totalBalance')}</div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', lineHeight: 1, color: 'white' }}>
                {formatCurrency(balance)}
              </h2>
            </div>
          </div>

          {/* Card Bottom: User ID & Mastercard Logo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px' }}>{t('userId')}: {profileUsername || displayUserId}</div>
            </div>
            
            <div style={{ position: 'relative', width: '50px', height: '32px' }}>
              <div style={{ position: 'absolute', left: '0', width: '32px', height: '32px', borderRadius: '50%', background: '#EB001B', opacity: 0.9 }} />
              <div style={{ position: 'absolute', right: '0', width: '32px', height: '32px', borderRadius: '50%', background: '#FF5F00', opacity: 0.9 }} />
              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '14px', height: '32px', background: 'linear-gradient(90deg, #EB001B 0%, #FF5F00 100%)', opacity: 0.8 }} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => setActiveTab('deposit')}
            className={activeTab === 'deposit' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ 
              flex: 1, 
              padding: '18px', 
              fontSize: '1rem',
              gap: '10px'
            }}
          >
            <ArrowDownCircle size={20} />
            {t('deposit')}
          </button>
          <button 
            onClick={() => setActiveTab('withdraw')}
            className={activeTab === 'withdraw' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ 
              flex: 1, 
              padding: '18px', 
              fontSize: '1rem',
              gap: '10px'
            }}
          >
            <ArrowUpCircle size={20} />
            {t('withdraw')}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '0 12px' }}>
        {activeTab === 'deposit' ? (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.01em' }}>{t('selectGateway')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
              {localGateways.length === 0 && !isAdminMode && (
                <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '20px', background: 'var(--glass-bg)', borderRadius: '24px', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>
                  {language === 'bn' ? 'কোনো পেমেন্ট পদ্ধতি উপলব্ধ নেই।' : 'No payment methods available.'}
                </div>
              )}

              {localGateways.map((gw: any) => (
                <div key={gw.id} style={{ position: 'relative' }}>
                  <button 
                    onClick={() => setSelectedGateway(gw.id)}
                    className={selectedGateway === gw.id ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{
                      padding: '16px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      height: '100%',
                      textTransform: 'none'
                    }}
                  >
                    <img src={gw.logo} alt={gw.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{gw.name}</span>
                  </button>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.01em' }}>{t('quickAmount')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
              {[10, 50, 100, 250, 500, 1000].map((amountUSD) => {
                return (
                <button 
                  key={amountUSD}
                  onClick={() => handleQuickSelect(amountUSD)}
                  className={depositAmount === amountUSD.toString() ? 'btn btn-primary' : 'btn btn-outline'}
                  style={{
                    padding: '16px 0',
                    fontSize: '1rem'
                  }}
                >
                  {formatCurrency(amountUSD)}
                </button>
                );
              })}
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '12px', fontWeight: 700, textTransform: 'uppercase' }}>{t('customAmount')}</label>

              <div className="card-skewed" style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-orange)' }}>{currency === 'BDT' ? '৳' : '$'}</span>
                <input 
                  type="number" 
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder={language === 'bn' ? 'পরিমাণ লিখুন' : 'Enter amount'} 
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '20px 20px 20px 45px',
                    color: 'var(--text-primary)',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button 
              onClick={() => setIsConfirming(true)}
              disabled={!depositAmount || parseFloat(depositAmount) < 50 || !selectedGateway}
              className="btn btn-primary" 
              style={{ width: '100%', padding: '15px 20px', borderRadius: '14px', fontSize: '1rem', fontWeight: 800, marginBottom: '48px', opacity: (!depositAmount || parseFloat(depositAmount) < 50 || !selectedGateway) ? 0.5 : 1 }}
            >
              {!selectedGateway ? (language === 'bn' ? 'গেটওয়ে নির্বাচন করুন' : 'SELECT GATEWAY') : t('addFunds').toUpperCase()}
            </button>
          </div>
        ) : (
          <>
            {/* Linked Accounts Section */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{t('linkedAccounts')}</h3>
                <button 
                  onClick={() => setShowAddMethod(true)}
                  style={{ 
                    background: 'rgba(249, 111, 46, 0.1)', 
                    border: 'none', 
                    color: 'var(--accent-orange)', 
                    padding: '8px 16px', 
                    borderRadius: '12px', 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <PlusCircle size={14} />
                  {t('addNew')}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {savedMethods.map((method: any) => (
                  <div key={method.id} style={{ background: 'var(--glass-bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--glass-border)', boxShadow: 'var(--card-shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                        <img src={method.icon} alt={method.name} style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '50%' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{method.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{method.number}</div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteMethod(e, method.id)}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

              </div>
            </div>

          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(249, 111, 46, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CreditCard size={40} color="var(--accent-orange)" strokeWidth={2.5} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '12px' }}>{t('withdrawWinnings')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>{t('selectLinkedAccount')}</p>

            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {savedMethods.map((method: any) => (
                <button 
                  key={method.id}
                  onClick={() => setSelectedWithdrawMethod(method.id)}
                  className={selectedWithdrawMethod === method.id ? 'btn btn-primary' : 'btn btn-outline'}
                  style={{ 
                    padding: '16px', 
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    gap: '12px'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                    <img src={method.icon} alt={method.name} style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '50%' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{method.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{method.number}</div>
                  </div>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: selectedWithdrawMethod === method.id ? method.color : 'var(--glass-border)', background: selectedWithdrawMethod === method.id ? method.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedWithdrawMethod === method.id && <Check size={12} color="white" strokeWidth={4} />}
                  </div>
                </button>

              ))}
              <button 
                onClick={() => setShowAddMethod(true)}
                className="btn btn-outline"
                style={{ 
                  padding: '16px', 
                  gap: '8px'
                }}
              >

                <PlusCircle size={18} />
                {t('linkNew')}
              </button>
            </div>

            <div className="card-skewed" style={{ position: 'relative', marginBottom: '24px' }}>
              <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-orange)' }}>{currency === 'BDT' ? '৳' : '$'}</span>
              <input 
                type="number" 
                placeholder={t('withdrawAmount')}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '18px 20px 18px 45px',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />

              <button 
                onClick={() => setWithdrawAmount(balance.toString())}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(249, 111, 46, 0.1)',
                  border: '1px solid rgba(249, 111, 46, 0.2)',
                  color: 'var(--accent-orange)',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  zIndex: 2
                }}
              >
                {t('max')}
              </button>
            </div>

            <button 
              onClick={handleWithdraw}
              disabled={!selectedWithdrawMethod || !withdrawAmount || parseFloat(withdrawAmount) < 50}
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                padding: '15px 20px', 
                borderRadius: '14px', 
                fontSize: '1rem',
                fontWeight: 800,
                opacity: (!selectedWithdrawMethod || !withdrawAmount || parseFloat(withdrawAmount) < 50) ? 0.5 : 1,
                cursor: (!selectedWithdrawMethod || !withdrawAmount || parseFloat(withdrawAmount) < 50) ? 'not-allowed' : 'pointer'
              }}
            >
              {parseFloat(withdrawAmount) < 50 ? `${t('minimumWithdraw')} ৳50` : t('requestWithdrawal').toUpperCase()}
            </button>
          </div>
        </>
      )}

        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={20} color="var(--accent-orange)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>{t('activity')}</h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setHistoryTab('personal')}
                className={historyTab === 'personal' ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '0.75rem', 
                }}
              >
                {t('personal')}
              </button>
              <button 
                onClick={() => setHistoryTab('community')}
                className={historyTab === 'community' ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '0.75rem', 
                  gap: '4px'
                }}
              >
                <Globe size={12} />
                {t('community')}
              </button>
            </div>
          </div>
          
          {historyTab === 'community' ? (
            <div className="animate-fade-in">
              <GlobalActivityFeed />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(() => {
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

              const allTxs = [...userPayments, ...userWithdrawals, ...localTransactions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              return allTxs.length > 0 ? allTxs.map((tx) => (
                <div key={tx.id} className="card-skewed hover-scale" style={{ 
                  padding: '16px 20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '14px', 
                      background: tx.amount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {tx.amount > 0 ? (
                        <Plus size={20} color="#10B981" strokeWidth={3} />
                      ) : (
                        <Minus size={20} color="#EF4444" strokeWidth={3} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '2px', color: 'var(--text-primary)' }}>{tx.type}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>{tx.date}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontWeight: 900, 
                      fontSize: '1.1rem', 
                      color: tx.amount > 0 ? '#10B981' : 'var(--text-primary)',
                      marginBottom: '2px'
                    }}>
                      {tx.amount > 0 ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                    </div>
                    <div style={{ 
                      color: tx.status === 'Completed' || tx.status === 'Approved' ? '#10B981' : tx.status === 'Rejected' ? '#EF4444' : '#F59E0B', 
                      fontSize: '0.65rem', 
                      fontWeight: 800, 
                      textTransform: 'uppercase' 
                    }}>
                      {tx.status}
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--glass-bg)', borderRadius: '24px', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>
                  {t('noTransactions')}
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>

      {/* Modals */}


      {isConfirming && (
        <ModalPortal>
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(16px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setIsConfirming(false)}
        >
          <div 
            className="animate-scale-up"
            style={{
              background: 'var(--modal-bg)',
              width: '100%',
              maxWidth: '400px',
              borderRadius: '40px',
              padding: '24px 16px',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >

            <div style={{ 
              width: '90px', 
              height: '90px', 
              borderRadius: '50%', 
              background: `${localGateways.find((g: any) => g.id === selectedGateway)?.color || '#f97316'}15`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px',
              border: `1px solid ${localGateways.find((g: any) => g.id === selectedGateway)?.color || '#f97316'}33`
            }}>
              <img src={localGateways.find((g: any) => g.id === selectedGateway)?.logo} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%' }} alt="" />
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px' }}>{t('confirmVia')} {localGateways.find((g: any) => g.id === selectedGateway)?.name || 'Gateway'}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              {t('addingFundsPrefix')} <span style={{ color: '#10B981', fontWeight: 900 }}>{formatCurrency(parseFloat(depositAmount) || 0)}</span> {t('addingFundsSuffix')} <span style={{ color: localGateways.find((g: any) => g.id === selectedGateway)?.color || 'var(--accent-orange)', fontWeight: 800 }}>{localGateways.find((g: any) => g.id === selectedGateway)?.name || 'Gateway'}</span>.
            </p>

            {/* Deposit Account Details Configuration */}
            {(() => {
              const gw = localGateways.find((g: any) => g.id === selectedGateway);
              if (!gw) return null;
              
              let accountNumber = '';
              let instructions = '';
              let label = 'Send Money To (Personal)';
              
              if (gw.name === 'Bkash') {
                accountNumber = paymentSettings.bkashNumber || '';
                instructions = paymentSettings.bkashInstructions || '';
              } else if (gw.name === 'Nagad') {
                accountNumber = paymentSettings.nagadNumber || '';
                instructions = paymentSettings.nagadInstructions || '';
              } else if (gw.name === 'Binance') {
                accountNumber = paymentSettings.binanceId || '';
                instructions = paymentSettings.binanceInstructions || '';
                label = 'Binance Wallet Address';
              }
              
              if (!accountNumber && !instructions) return null;
              
              return (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '20px',
                  padding: '16px',
                  marginBottom: '24px',
                  textAlign: 'left'
                }}>
                  {accountNumber && (
                    <div style={{ marginBottom: instructions ? '12px' : '0' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-orange)' }}>{accountNumber}</span>
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(accountNumber);
                            alert('Account number copied to clipboard!');
                          }}
                          style={{
                            background: 'rgba(249, 111, 46, 0.1)',
                            border: '1px solid rgba(249, 111, 46, 0.2)',
                            color: 'var(--accent-orange)',
                            padding: '6px 12px',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                  {instructions && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Instructions</div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{instructions}</p>
                    </div>
                  )}
                </div>
              );
            })()}
            
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase' }}>{t('txnIdRequired')}</label>
              <input 
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder={t('enterTxnId')}
                style={{
                  width: '100%',
                  background: 'var(--glass-bg)',
                  border: '2px solid var(--glass-border)',
                  borderRadius: '16px',
                  padding: '16px',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-orange)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={handleDeposit}
                style={{ 
                  width: '100%', 
                  padding: '15px 20px', 
                  borderRadius: '14px', 
                  background: localGateways.find((g: any) => g.id === selectedGateway)?.color, 
                  border: 'none', 
                  color: 'white', 
                  fontWeight: 800, 
                  fontSize: '1rem', 
                  cursor: 'pointer', 
                  boxShadow: `0 8px 20px ${localGateways.find((g: any) => g.id === selectedGateway)?.color}33` 
                }}
              >
                {t('confirmAndAddNow').toUpperCase()}
              </button>
              <button 
                onClick={() => setIsConfirming(false)}
                style={{ width: '100%', padding: '12px 18px', borderRadius: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
      
      {isWithdrawConfirming && (
        <ModalPortal>
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(16px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setIsWithdrawConfirming(false)}
        >
          <div 
            className="animate-scale-up"
            style={{
              background: 'var(--modal-bg)',
              width: '100%',
              maxWidth: '400px',
              borderRadius: '40px',
              padding: '24px 16px',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >

            <div style={{ 
              width: '90px', 
              height: '90px', 
              borderRadius: '50%', 
              background: `${savedMethods.find((m: any) => m.id === selectedWithdrawMethod)?.color || '#f97316'}15`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px',
              border: `1px solid ${savedMethods.find((m: any) => m.id === selectedWithdrawMethod)?.color || '#f97316'}33`
            }}>
              <img src={savedMethods.find((m: any) => m.id === selectedWithdrawMethod)?.icon} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%' }} alt="" />
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px' }}>{t('confirmWithdrawal')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.6 }}>
              {t('withdrawingFundsPrefix') || 'You are requesting to withdraw'} <span style={{ color: 'var(--accent-orange)', fontWeight: 900 }}>{formatCurrency(parseFloat(withdrawAmount) || 0)}</span> {t('withdrawingFundsSuffix') || 'to your'} <span style={{ color: savedMethods.find((m: any) => m.id === selectedWithdrawMethod)?.color || 'var(--accent-orange)', fontWeight: 800 }}>{savedMethods.find((m: any) => m.id === selectedWithdrawMethod)?.name || 'Account'}</span> {t('account') || 'account'} ({savedMethods.find((m: any) => m.id === selectedWithdrawMethod)?.number || 'N/A'}).
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={confirmWithdraw}
                style={{ 
                  width: '100%', 
                  padding: '15px 20px', 
                  borderRadius: '14px', 
                  background: 'var(--accent-gradient)', 
                  border: 'none', 
                  color: 'white', 
                  fontWeight: 800, 
                  fontSize: '1rem', 
                  cursor: 'pointer', 
                  boxShadow: '0 8px 20px rgba(249, 111, 46, 0.2)' 
                }}
              >
                {t('confirmAndWithdraw').toUpperCase() || 'CONFIRM & WITHDRAW'}
              </button>
              <button 
                onClick={() => setIsWithdrawConfirming(false)}
                style={{ width: '100%', padding: '12px 18px', borderRadius: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}



      {/* Add Saved Method Modal */}
      {showAddMethod && (
        <ModalPortal>
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(16px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setShowAddMethod(false)}
        >
          <div 
            className="animate-scale-up"
            style={{
              background: 'var(--modal-bg)',
              width: '100%',
              maxWidth: '400px',
              borderRadius: '40px',
              padding: '24px 16px',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >

            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px' }}>{t('linkAccountTitle')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>{t('linkAccountSub')}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              <select 
                value={newMethodData.name}
                onChange={(e) => setNewMethodData({...newMethodData, name: e.target.value})}
                style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '16px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem', outline: 'none' }}
              >
                <option value="" style={{ background: 'var(--modal-bg)', color: 'var(--text-primary)' }}>{t('selectProvider')}</option>
                <option value="Bkash" style={{ background: 'var(--modal-bg)', color: 'var(--text-primary)' }}>Bkash</option>
                <option value="Nagad" style={{ background: 'var(--modal-bg)', color: 'var(--text-primary)' }}>Nagad</option>
                <option value="Binance" style={{ background: 'var(--modal-bg)', color: 'var(--text-primary)' }}>Binance</option>
              </select>

              <input 
                type="text" 
                placeholder={t('enterAccountNumber')}
                value={newMethodData.number}
                onChange={(e) => setNewMethodData({...newMethodData, number: e.target.value})}
                style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '16px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem', outline: 'none' }}
              />

            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={handleAddMethod}
                style={{ width: '100%', padding: '15px 20px', borderRadius: '14px', background: 'var(--accent-gradient)', border: 'none', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}
              >
                {t('linkAccountBtn')}
              </button>
              <button 
                onClick={() => setShowAddMethod(false)}
                style={{ width: '100%', padding: '12px 18px', borderRadius: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <ModalPortal>
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(16px)',
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
              borderRadius: '40px',
              padding: '24px 16px',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'rgba(239, 68, 68, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px',
              color: '#EF4444'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
              </svg>
            </div>
            
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px' }}>{t('confirmDeletion')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.6 }}>
              {t('deleteConfirmationMsg')}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={confirmDelete}
                style={{ 
                  width: '100%', 
                  padding: '15px 20px', 
                  borderRadius: '14px', 
                  background: '#EF4444', 
                  border: 'none', 
                  color: 'white', 
                  fontWeight: 800, 
                  fontSize: '1rem', 
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)'
                }}
              >
                {t('deleteNow')}
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
                  fontWeight: 700, 
                  fontSize: '0.9rem',
                  cursor: 'pointer' 
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      <SuccessModal 
        isOpen={successConfig.isOpen}
        onClose={() => setSuccessConfig(prev => ({ ...prev, isOpen: false }))}
        title={successConfig.title}
        message={successConfig.message}
      />
    </div>
  );
};
export default Wallet;
