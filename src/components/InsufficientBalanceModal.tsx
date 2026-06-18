import React, { useState } from 'react';
import { AlertCircle, Wallet, X, ChevronRight, Check } from 'lucide-react';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../firebase';
import { collection, addDoc, doc, onSnapshot } from 'firebase/firestore';
import ModalPortal from './ModalPortal';
import { useBalance } from '../context/BalanceContext';

interface InsufficientBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredAmount: number;
  currentBalance: number;
}

const InsufficientBalanceModal: React.FC<InsufficientBalanceModalProps> = ({
  isOpen,
  onClose,
  requiredAmount,
  currentBalance,
}) => {
  const { formatCurrency, currency } = useCurrency();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { status } = useBalance();
  const [displayUserId] = useState(() => localStorage.getItem('generatedUserId') || 'USER123');
  const [profileUsername, setProfileUsername] = useState<string>('');

  React.useEffect(() => {
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

  // Deposit States
  const [showQuickDeposit, setShowQuickDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>(Math.max(10, requiredAmount - currentBalance).toString());
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [depositSuccess, setDepositSuccess] = useState(false);

  // Load gateways from context
  const { paymentSettings } = useAdminDashboard();
  const gateways = [
    { id: 'bkash-default', name: 'Bkash', color: '#E2136E', logo: 'https://raw.githubusercontent.com/ultraDevs/Bangladeshi-Payment-Gateways/master/assets/images/Bkash.png' },
    { id: 'nagad-default', name: 'Nagad', color: '#F15A22', logo: 'https://raw.githubusercontent.com/ultraDevs/Bangladeshi-Payment-Gateways/master/assets/images/Nagad.png' },
    { id: 'binance-default', name: 'Binance', color: '#F3BA2F', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' }
  ];

  if (!isOpen) return null;

  const shortfall = requiredAmount - currentBalance;

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'suspended') {
      alert("Your account has been suspended by the administrator. You cannot deposit funds.");
      return;
    }
    const amount = parseFloat(depositAmount);
    const gateway = gateways.find((g: any) => g.id === selectedGateway);

    if (amount < 50) {
      alert(`${t('minimumDeposit')} ৳50`);
      return;
    }

    if (!transactionId.trim()) {
      alert(t('txnIdRequired'));
      return;
    }

    if (!isNaN(amount) && amount > 0 && gateway) {
      try {
        await addDoc(collection(db, 'payments'), {
          userId: currentUser?.uid || 'anonymous',
          displayUserId: profileUsername || displayUserId,
          amount: amount,
          transactionId: transactionId,
          paymentMethod: gateway.name,
          accountNumber: 'Quick Deposit',
          userName: currentUser?.displayName || 'User',
          userAvatar: currentUser?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
          timestamp: new Date().toISOString(),
          status: 'pending',
          isRaw: true
        });
        setDepositSuccess(true);
        setTimeout(() => {
          setDepositSuccess(false);
          setShowQuickDeposit(false);
          setTransactionId('');
          onClose();
        }, 2000);
      } catch (error) {
        console.error("Error submitting quick deposit request:", error);
        alert(t('authFailed'));
      }
    }
  };

  const handleQuickAmountSelect = (amount: number) => {
    setDepositAmount(amount.toString());
  };

  return (
    <ModalPortal>
    <div 
      className="animate-fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 5, 10, 0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="animate-scale-up"
        style={{
          background: 'var(--modal-bg)',
          width: '100%',
          maxWidth: '400px',
          borderRadius: '32px',
          padding: '32px 20px',
          border: '1px solid rgba(251, 113, 133, 0.15)', // Subtle danger color border
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(251, 113, 133, 0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(251, 113, 133, 0.12) 0%, transparent 70%)',
          filter: 'blur(30px)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'var(--card-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
          className="hover-scale"
        >
          <X size={16} />
        </button>

        {/* Success State */}
        {depositSuccess ? (
          <div className="animate-scale-up" style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'rgba(74, 222, 128, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px',
              border: '1px solid rgba(74, 222, 128, 0.2)',
              boxShadow: '0 0 30px rgba(74, 222, 128, 0.2)'
            }}>
              <Check size={40} color="var(--accent-green)" strokeWidth={3} />
            </div>
            <h4 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px', color: 'var(--text-primary)' }}>{t('requestSent')}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5 }}>
              {t('depositSuccessSub', { amount: formatCurrency(parseFloat(depositAmount)) })}
            </p>
          </div>
        ) : (
          <div style={{ position: 'relative', zIndex: 1 }}>
            {!showQuickDeposit ? (
              <div className="animate-fade-in" style={{ textAlign: 'center' }}>
                {/* Warning Icon Container */}
                <div style={{
                  width: '76px',
                  height: '76px',
                  background: 'rgba(251, 113, 133, 0.08)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  border: '1px solid rgba(251, 113, 133, 0.2)',
                  position: 'relative'
                }}>
                  <AlertCircle size={40} color="var(--color-danger)" strokeWidth={2} />
                  <div style={{
                    position: 'absolute',
                    top: '-4px', left: '-4px', right: '-4px', bottom: '-4px',
                    borderRadius: '50%',
                    border: '1px dashed rgba(251, 113, 133, 0.4)',
                    animation: 'ripple 3s infinite linear'
                  }} />
                </div>

                <h3 style={{ 
                  fontSize: '1.6rem', 
                  fontWeight: 900, 
                  marginBottom: '10px',
                  background: 'linear-gradient(135deg, #FFF 0%, #FB7185 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em'
                }}>
                  {t('insufficientBalance')}
                </h3>
                
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.9rem', 
                  lineHeight: 1.5, 
                  marginBottom: '24px',
                  fontWeight: 500
                }}>
                  {t('insufficientBalanceSub')}
                </p>

                {/* Amount Breakdown Box */}
                <div style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '20px',
                  padding: '16px',
                  marginBottom: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t('requiredFee')}:</span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(requiredAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t('balance')}:</span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(currentBalance)}</span>
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>{t('shortfall')}:</span>
                    <span style={{ fontWeight: 900, color: 'var(--color-danger)' }}>{formatCurrency(shortfall)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    onClick={() => setShowQuickDeposit(true)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: '14px',
                      background: 'var(--accent-gradient)',
                      border: 'none',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 8px 16px rgba(249, 111, 46, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    className="hover-scale"
                  >
                    <Wallet size={16} />
                    {t('quickDepositNow')}
                    <ChevronRight size={16} />
                  </button>

                  <button 
                    onClick={onClose}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: '14px',
                      background: 'var(--card-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                    className="hover-scale"
                  >
                    {t('cancel').toUpperCase()}
                  </button>
                </div>
              </div>
            ) : (
              // Integrated Quick Deposit Flow
              <div className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                  <button 
                    onClick={() => setShowQuickDeposit(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      padding: '4px'
                    }}
                  >
                    ← {t('back')}
                  </button>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>{t('quickDeposit')}</h3>
                </div>

                <form onSubmit={handleDepositSubmit}>
                  {/* Select Payment Gateway */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>{t('selectGateway')}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {gateways.map((gw: any) => (
                        <div 
                          key={gw.id}
                          onClick={() => setSelectedGateway(gw.id)}
                          style={{
                            background: selectedGateway === gw.id ? `${gw.color}15` : 'rgba(255,255,255,0.02)',
                            border: '1px solid',
                            borderColor: selectedGateway === gw.id ? gw.color : 'var(--glass-border)',
                            padding: '12px 6px',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <img src={gw.logo} alt={gw.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                          <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>{gw.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preset Amount Grid */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>{t('amountToAdd')}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {[Math.max(10, Math.ceil(shortfall)), 50, 100].map((amount) => (
                        <button
                          type="button"
                          key={amount}
                          onClick={() => handleQuickAmountSelect(amount)}
                          style={{
                            background: depositAmount === amount.toString() ? 'rgba(249, 111, 46, 0.1)' : 'rgba(255,255,255,0.02)',
                            border: '1px solid',
                            borderColor: depositAmount === amount.toString() ? 'var(--accent-orange)' : 'var(--glass-border)',
                            padding: '12px 0',
                            borderRadius: '14px',
                            color: 'var(--text-primary)',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          +{formatCurrency(amount)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount Input */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-orange)' }}>{currency === 'BDT' ? '৳' : '$'}</span>
                      <input 
                        type="number" 
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.00" 
                        style={{
                          width: '100%',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '16px',
                          padding: '14px 14px 14px 32px',
                          color: 'var(--text-primary)',
                          fontSize: '1rem',
                          fontWeight: 700,
                          outline: 'none'
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Deposit Account Details Configuration */}
                  {(() => {
                    const gw = gateways.find((g: any) => g.id === selectedGateway);
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
                        marginBottom: '20px',
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
                                {t('copy') || 'Copy'}
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

                  {/* Transaction ID Input */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>{t('txnIdRequired')}</label>
                    <input 
                      type="text" 
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder={t('enterTxnId')}
                      style={{
                        width: '100%',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '16px',
                        padding: '14px',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        fontWeight: 700,
                        outline: 'none'
                      }}
                      required
                    />
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={!depositAmount || parseFloat(depositAmount) <= 0 || !selectedGateway}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: '14px',
                      background: '#10B981',
                      border: 'none',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)',
                      opacity: (!depositAmount || parseFloat(depositAmount) <= 0 || !selectedGateway) ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    className="hover-scale"
                  >
                    {t('submitDepositRequest')}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
};

export default InsufficientBalanceModal;

