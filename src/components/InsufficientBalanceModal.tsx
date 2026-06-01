import React, { useState } from 'react';
import { AlertCircle, Wallet, X, ChevronRight, Check } from 'lucide-react';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { useCurrency } from '../context/CurrencyContext';
import ModalPortal from './ModalPortal';

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
  const { addPaymentRequest } = useAdminDashboard();
  const { formatCurrency } = useCurrency();
  const [displayUserId] = useState(() => localStorage.getItem('generatedUserId') || 'USER123');

  // Deposit States
  const [showQuickDeposit, setShowQuickDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>(Math.max(10, requiredAmount - currentBalance).toString());
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [depositSuccess, setDepositSuccess] = useState(false);

  // Load gateways from local storage or defaults
  const [gateways] = useState(() => {
    const saved = localStorage.getItem('localGateways');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'bkash-default', name: 'Bkash', color: '#E2136E', logo: 'https://raw.githubusercontent.com/ultraDevs/Bangladeshi-Payment-Gateways/master/assets/images/Bkash.png' },
      { id: 'nagad-default', name: 'Nagad', color: '#F15A22', logo: 'https://raw.githubusercontent.com/ultraDevs/Bangladeshi-Payment-Gateways/master/assets/images/Nagad.png' },
      { id: 'binance-default', name: 'Binance', color: '#F3BA2F', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' }
    ];
  });

  if (!isOpen) return null;

  const shortfall = requiredAmount - currentBalance;

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    const gateway = gateways.find((g: any) => g.id === selectedGateway);

    if (!transactionId.trim()) {
      alert("Please enter a valid Transaction ID.");
      return;
    }

    if (!isNaN(amount) && amount > 0 && gateway) {
      addPaymentRequest({
        userId: displayUserId,
        amount: amount,
        transactionId: transactionId,
        paymentMethod: gateway.name,
        accountNumber: 'Quick Deposit',
      });
      setDepositSuccess(true);
      setTimeout(() => {
        setDepositSuccess(false);
        setShowQuickDeposit(false);
        setTransactionId('');
        onClose();
      }, 2000);
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
            <h4 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px', color: 'var(--text-primary)' }}>Request Sent!</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5 }}>
              Your deposit request for {formatCurrency(parseFloat(depositAmount))} has been submitted. Balance will update once approved by admin.
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
                  Insufficient Balance
                </h3>
                
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.9rem', 
                  lineHeight: 1.5, 
                  marginBottom: '24px',
                  fontWeight: 500
                }}>
                  You don't have enough funds to complete this transaction. Let's top up your wallet.
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
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Required Fee:</span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(requiredAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Your Balance:</span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(currentBalance)}</span>
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>Shortfall:</span>
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
                    QUICK DEPOSIT NOW
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
                    CANCEL
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
                    ← Back
                  </button>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Quick Deposit</h3>
                </div>

                <form onSubmit={handleDepositSubmit}>
                  {/* Select Payment Gateway */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>Select Gateway</label>
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
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>Amount to Add</label>
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
                      <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-orange)' }}>$</span>
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

                  {/* Transaction ID Input */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>Transaction ID (Required)</label>
                    <input 
                      type="text" 
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter TXN ID from your payment" 
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
                    SUBMIT DEPOSIT REQUEST
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
