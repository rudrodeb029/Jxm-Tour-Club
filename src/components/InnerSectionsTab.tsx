import React, { useState, useEffect } from 'react';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { Trophy, Users, X, AlertTriangle, CheckCircle, Clock, Zap, UserMinus } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import type { Team } from '../data/mockData';
import { parseTime, formatTime, to24hTime, getCardStatus as getCardStatusFromUtil, getTargetDateTime } from '../utils/timeUtils';

const InnerSectionsTab = () => {
  const { adminMatches, addMatchCard, updateMatchCard, deleteMatchCard, setCardWinners, adminUsers, removeParticipantFromCard, resetMatchCard } = useAdminDashboard();
  const { formatCurrency } = useCurrency();
  
  const [selectedMatchId, setSelectedMatchId] = useState<string>(adminMatches[0]?.id || '');
  const [editingCard, setEditingCard] = useState<Team | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [selectedCardForWinners, setSelectedCardForWinners] = useState<Team | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedCardForParticipants, setSelectedCardForParticipants] = useState<Team | null>(null);
  
  const [matchWinnerId, setMatchWinnerId] = useState<string>('');
  const [customPerKillRate, setCustomPerKillRate] = useState<number>(0);
  const [killWinners, setKillWinners] = useState<{userId: string, kills: number}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const defaultEmptyCard: Partial<Team> = {
    name: '', logo: '', color: '#DC2626', entryType: 'Solo', mainCategory: 'Full Map Match',
    entryFee: '' as any, winPrize: '' as any, perKill: '' as any, map: '', version: '', startTime: '',
    liveDuration: '' as any, gameId: '', gamePassword: '', roomDetailsRevealTime: '' as any, maxParticipants: '' as any, rules: [],
    percentage: '50%', kills: 0, damage: 0, headshots: 0, rank: 0
  };

  const [cardForm, setCardForm] = useState<Partial<Team>>(defaultEmptyCard);

  // Tick every second for live status
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss success messages
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  const selectedMatch = adminMatches.find(m => m.id === selectedMatchId);
  const cards: Team[] = selectedMatch?.innerSections || [];

  const getCardStatus = (card: Team): { status: 'live' | 'upcoming' | 'finished' | 'idle', timeLeft?: string } => {
    if (!card.startTime) return { status: 'idle' };
    const status = getCardStatusFromUtil(card, selectedMatch?.status || 'upcoming');
    
    if (status === 'upcoming') {
      const nowTime = new Date(now);
      const targetTime = getTargetDateTime(card.startTime, nowTime);
      let diff = targetTime.getTime() - nowTime.getTime();
      if (diff <= 0) {
        const tomorrow = new Date(targetTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        diff = tomorrow.getTime() - nowTime.getTime();
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      return { status: 'upcoming', timeLeft: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` };
    }
    
    if (status === 'live') {
      const nowTime = new Date(now);
      const targetTime = getTargetDateTime(card.startTime, nowTime);
      const elapsedMs = nowTime.getTime() - targetTime.getTime();
      const liveDurationMins = Number(card.liveDuration) || 60;
      const remainingMs = (liveDurationMins * 60 * 1000) - elapsedMs;
      if (remainingMs > 0) {
        const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const mm = mins.toString().padStart(2, '0');
        const ss = secs.toString().padStart(2, '0');
        const timeLeftStr = hrs > 0 ? `${hrs}:${mm}:${ss}` : `${mm}:${ss}`;
        return { status: 'live', timeLeft: timeLeftStr };
      }
      return { status: 'live', timeLeft: '00:00' };
    }
    
    return { status };
  };

  const handleSaveCard = async () => {
    if (!selectedMatchId || !cardForm.name || !cardForm.logo) return;
    setIsProcessing(true);
    try {
      if (editingCard) {
        await updateMatchCard(selectedMatchId, editingCard.id, cardForm);
        setSuccessMessage('Card updated successfully!');
      } else {
        await addMatchCard(selectedMatchId, cardForm as Omit<Team, 'id'>);
        setSuccessMessage('New card added successfully!');
      }
      setShowAddCard(false);
      setEditingCard(null);
      setCardForm(defaultEmptyCard);
    } catch (e: any) {
      console.error(e);
      setSuccessMessage('Error saving card. Check connection or data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveWinners = async () => {
    if (!selectedCardForWinners || !selectedMatchId) return;
    setIsProcessing(true);
    try {
      await setCardWinners(
        selectedMatchId, 
        selectedCardForWinners.id, 
        matchWinnerId || null, 
        killWinners.filter(k => k.kills > 0),
        customPerKillRate
      );
      setSuccessMessage('Prizes distributed successfully!');
      setShowWinnersModal(false);
      setMatchWinnerId('');
      setKillWinners([]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (card: Team) => {
    setEditingCard(card);
    setCardForm({ ...card });
    setShowAddCard(true);
  };

  const handleDelete = async (cardId: string) => {
    if (window.confirm("Are you sure you want to delete this card? This cannot be undone.")) {
      setIsProcessing(true);
      try {
        await deleteMatchCard(selectedMatchId, cardId);
        setSuccessMessage('Card deleted successfully!');
      } catch (e: any) {
        console.error(e);
        setSuccessMessage('Error deleting card. Check connection or data.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleResetCard = async (cardId: string) => {
    if (window.confirm("Are you sure you want to reset this card? All joined participants will be removed, and stats will be cleared.")) {
      setIsProcessing(true);
      try {
        await resetMatchCard(selectedMatchId, cardId);
        setSuccessMessage('Card reset successfully!');
      } catch (e: any) {
        console.error(e);
        setSuccessMessage('Error resetting card.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleRemoveParticipant = async (cardId: string, userId: string, userName: string) => {
    if (window.confirm(`Remove ${userName} from this card and refund their entry fee?`)) {
      setIsProcessing(true);
      try {
        await removeParticipantFromCard(selectedMatchId, cardId, userId);
        setSuccessMessage(`${userName} removed and refunded!`);
        // Update local participants view
        if (selectedCardForParticipants) {
          setSelectedCardForParticipants({
            ...selectedCardForParticipants,
            participantIds: (selectedCardForParticipants.participantIds || []).filter(p => p !== userId)
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div>
      {/* Success Toast */}
      {successMessage && (
        <div style={{ 
          position: 'fixed', top: '20px', right: '20px', zIndex: 200,
          background: 'linear-gradient(135deg, #065F46, #047857)', 
          color: '#A7F3D0', 
          padding: '16px 24px', 
          borderRadius: '16px', 
          border: '1px solid #10B981',
          display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
          animation: 'fadeIn 0.3s ease-out',
          fontWeight: 700, fontSize: '0.9rem'
        }}>
          <CheckCircle className="w-5 h-5" style={{ color: '#34D399' }} />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingCard(null);
            setCardForm(defaultEmptyCard);
            setShowAddCard(true);
          }}
          disabled={!selectedMatchId}
        >
          + Add New Card
        </button>
      </div>

      {/* Match Selector */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Select Match to Manage Cards</label>
        <select 
          value={selectedMatchId}
          onChange={(e) => setSelectedMatchId(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', appearance: 'none', cursor: 'pointer' }}
        >
          {adminMatches.map(m => (
            <option key={m.id} value={m.id} style={{ background: '#1E293B', color: '#F8FAFC' }}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Cards Grid */}
      {selectedMatch && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {cards.map(card => {
            const cardStatus = getCardStatus(card);
            const participantCount = card.participantIds ? card.participantIds.length : 0;
            
            return (
              <div key={card.id} style={{ 
                background: 'var(--glass-bg)', 
                border: `1px solid ${card.color}44`, 
                borderRadius: '20px', 
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}>
                {/* Left accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: card.color }}></div>
                
                {/* Status Badge */}
                {cardStatus.status !== 'idle' && (
                  <div style={{ 
                    position: 'absolute', top: '12px', right: '12px',
                    padding: '4px 10px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900,
                    display: 'flex', alignItems: 'center', gap: '5px',
                    ...(cardStatus.status === 'live' ? {
                      background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)'
                    } : cardStatus.status === 'upcoming' ? {
                      background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)'
                    } : {
                      background: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', border: '1px solid rgba(107, 114, 128, 0.4)'
                    })
                  }}>
                    {cardStatus.status === 'live' && <><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span> LIVE ({cardStatus.timeLeft})</>}
                    {cardStatus.status === 'upcoming' && <><Clock className="w-3 h-3" /> START IN {cardStatus.timeLeft}</>}
                    {cardStatus.status === 'finished' && 'ENDED'}
                  </div>
                )}
                
                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <img src={card.logo} alt={card.name} style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', objectFit: 'cover', border: `2px solid ${card.color}` }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{card.name}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ color: card.color, fontWeight: 700, fontSize: '0.85rem' }}>{card.entryType}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '8px' }}>{card.mainCategory || 'Full Map Match'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Entry Fee / Win Prize */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '0.9rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Entry Fee</div>
                    <div style={{ fontWeight: 800 }}>{formatCurrency(card.entryFee || 0)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Win Prize</div>
                    <div style={{ fontWeight: 800, color: '#4ADE80' }}>{formatCurrency(card.winPrize || 0)}</div>
                  </div>
                </div>

                {/* Extra Info Row */}
                {(card.startTime || card.map) && (
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {card.startTime && <span>⏰ {formatTime(card.startTime)}</span>}
                    {card.map && <span>🗺️ {card.map}</span>}
                    {card.version && <span>📱 {card.version}</span>}
                    {(card.perKill || 0) > 0 && <span>💀 {formatCurrency(card.perKill || 0)}/kill</span>}
                  </div>
                )}

                {/* Participants & Select Winners Row */}
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={() => {
                      setSelectedCardForParticipants(card);
                      setShowParticipantsModal(true);
                    }}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: 0
                    }}
                  >
                    <Users className="w-4 h-4" style={{ color: participantCount > 0 ? '#60A5FA' : '#6B7280' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: participantCount > 0 ? '#60A5FA' : 'var(--text-primary)' }}>
                      {participantCount} Joined
                    </span>
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedCardForWinners(card);
                      setMatchWinnerId('');
                      setCustomPerKillRate(card.perKill || 0);
                      setKillWinners((card.participantIds || []).map(id => ({ userId: id, kills: 0 })));
                      setShowWinnersModal(true);
                    }}
                    disabled={participantCount === 0}
                    style={{ 
                      background: participantCount > 0 ? 'var(--accent-orange)' : 'rgba(255,255,255,0.1)', 
                      color: participantCount > 0 ? 'white' : 'var(--text-muted)', 
                      border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 800, 
                      display: 'flex', alignItems: 'center', gap: '6px', 
                      cursor: participantCount > 0 ? 'pointer' : 'not-allowed',
                      opacity: participantCount > 0 ? 1 : 0.5,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Trophy className="w-3 h-3" /> Select Winners
                  </button>
                </div>

                {/* Edit / Reset / Delete Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(card)} style={{ flex: 1, padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s ease' }}>Edit</button>
                  <button onClick={() => handleResetCard(card.id)} disabled={isProcessing} style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#f59e0b', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s ease' }}>Reset</button>
                  <button onClick={() => handleDelete(card.id)} disabled={isProcessing} style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s ease' }}>Delete</button>
                </div>
              </div>
            );
          })}
          {cards.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--input-bg)', borderRadius: '20px' }}>
              No cards found for this match. Click "Add New Card" to create one.
            </div>
          )}
        </div>
      )}

      {/* ============ ADD/EDIT CARD MODAL ============ */}
      {showAddCard && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--nav-bg)', border: '1px solid var(--nav-border)', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem' }}>{editingCard ? 'Edit Match Card' : 'Add New Match Card'}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Team/Card Name</label>
                <input type="text" value={cardForm.name} onChange={e => setCardForm({...cardForm, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} placeholder="e.g. Red Dragons" />
              </div>
              
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Logo URL</label>
                <input type="text" value={cardForm.logo} onChange={e => setCardForm({...cardForm, logo: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} placeholder="/images/teams/red_dragons.png" />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Main Category</label>
                <select value={cardForm.mainCategory} onChange={e => setCardForm({...cardForm, mainCategory: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px', appearance: 'none', cursor: 'pointer' }}>
                  <option value="Full Map Match" style={{ background: '#1E293B', color: '#F8FAFC' }}>Full Map Match</option>
                  <option value="Lone-Wolf Match" style={{ background: '#1E293B', color: '#F8FAFC' }}>Lone-Wolf Match</option>
                  <option value="CS Rank Match" style={{ background: '#1E293B', color: '#F8FAFC' }}>CS Rank Match</option>
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Entry Type</label>
                  <select value={cardForm.entryType} onChange={e => setCardForm({...cardForm, entryType: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px', appearance: 'none', cursor: 'pointer' }}>
                    <option value="Solo" style={{ background: '#1E293B', color: '#F8FAFC' }}>Solo</option>
                    <option value="Duo" style={{ background: '#1E293B', color: '#F8FAFC' }}>Duo</option>
                    <option value="Squad" style={{ background: '#1E293B', color: '#F8FAFC' }}>Squad</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Theme Color</label>
                  <input type="color" value={cardForm.color} onChange={e => setCardForm({...cardForm, color: e.target.value})} style={{ width: '100%', height: '44px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', marginTop: '4px', padding: '2px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Entry Fee</label>
                  <input type="number" value={cardForm.entryFee ?? ''} onChange={e => setCardForm({...cardForm, entryFee: e.target.value === '' ? undefined : Number(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Win Prize</label>
                  <input type="number" value={cardForm.winPrize ?? ''} onChange={e => setCardForm({...cardForm, winPrize: e.target.value === '' ? undefined : Number(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Map</label>
                  <input type="text" value={cardForm.map || ''} onChange={e => setCardForm({...cardForm, map: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} placeholder="e.g. Bermuda" />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Version</label>
                  <input type="text" value={cardForm.version || ''} onChange={e => setCardForm({...cardForm, version: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} placeholder="e.g. MOBILE" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Per Kill Reward</label>
                  <input type="number" value={cardForm.perKill ?? ''} onChange={e => setCardForm({...cardForm, perKill: e.target.value === '' ? undefined : Number(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Start Time</label>
                  <input type="time" step="1" value={to24hTime(cardForm.startTime) || ''} onChange={e => setCardForm({...cardForm, startTime: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Live Duration (mins)</label>
                  <input 
                    type="number" 
                    id="liveDuration"
                    name="liveDuration"
                    autoComplete="off"
                    value={cardForm.liveDuration ?? ''} 
                    onChange={e => setCardForm({...cardForm, liveDuration: e.target.value === '' ? undefined : Number(e.target.value)})} 
                    placeholder="e.g. 60" 
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} 
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Game Room ID</label>
                  <input type="text" value={cardForm.gameId || ''} onChange={e => setCardForm({...cardForm, gameId: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} placeholder="e.g. 1234567" />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Game Password</label>
                  <input type="text" value={cardForm.gamePassword || ''} onChange={e => setCardForm({...cardForm, gamePassword: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} placeholder="e.g. PASS123" />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reveal Details Before (mins)</label>
                  <input type="number" value={cardForm.roomDetailsRevealTime ?? ''} onChange={e => setCardForm({...cardForm, roomDetailsRevealTime: e.target.value === '' ? undefined : Number(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} placeholder="e.g. 15" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Max Players Limit</label>
                  <input type="number" value={cardForm.maxParticipants ?? ''} onChange={e => setCardForm({...cardForm, maxParticipants: e.target.value === '' ? undefined : Number(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} placeholder="e.g. 48" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Match Rules (One per line)</label>
                <textarea value={(cardForm.rules || []).join('\n')} onChange={e => setCardForm({...cardForm, rules: e.target.value.split('\n').filter(Boolean)})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px', resize: 'vertical', minHeight: '80px' }} placeholder="Enter rules here..." />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowAddCard(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveCard} disabled={!cardForm.name || !cardForm.logo || isProcessing} style={{ flex: 1, padding: '12px', background: 'var(--accent-gradient)', border: 'none', color: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, opacity: (!cardForm.name || !cardForm.logo || isProcessing) ? 0.5 : 1 }}>
                {isProcessing ? 'Saving...' : 'Save Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ SELECT WINNERS MODAL ============ */}
      {showWinnersModal && selectedCardForWinners && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => !isProcessing && setShowWinnersModal(false)}
        >
          <div 
            style={{ background: 'var(--nav-bg)', border: '1px solid var(--nav-border)', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(249, 111, 46, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy className="w-5 h-5" style={{ color: '#F97316' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Select Winners</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedCardForWinners.name}</span>
                </div>
              </div>
              <button onClick={() => setShowWinnersModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split layout: Winner vs Per Kill Configuration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              {/* Left Column: Match Winner */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.2)', borderRadius: '14px', padding: '14px', textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#4ADE80', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Win Prize</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#4ADE80' }}>{formatCurrency(selectedCardForWinners.winPrize || 0)}</div>
                </div>

                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  🏆 Match Winner
                </label>
                <select 
                  value={matchWinnerId} 
                  onChange={e => setMatchWinnerId(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="" style={{ background: '#1E293B', color: '#F8FAFC' }}>-- No Winner --</option>
                  {(selectedCardForWinners.participantIds || []).map(pid => {
                    const user = adminUsers.find(u => u.id === pid);
                    return (
                      <option key={pid} value={pid} style={{ background: '#1E293B', color: '#F8FAFC' }}>
                        {user ? `${user.name} (${user.username})${selectedCardForWinners.participantGameIds?.[pid] ? ` [ID: ${selectedCardForWinners.participantGameIds[pid]}]` : ''}` : pid}
                      </option>
                    );
                  })}
                </select>
                {matchWinnerId && (
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#4ADE80', fontWeight: 600 }}>
                    ✓ Will receive {formatCurrency(selectedCardForWinners.winPrize || 0)}
                  </div>
                )}
              </div>

              {/* Right Column: Per Kill Price */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '14px', padding: '14px', textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Per Kill</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F59E0B' }}>{formatCurrency(customPerKillRate)}</div>
                </div>

                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  💀 Kill Price (৳)
                </label>
                <input 
                  type="number"
                  min="0"
                  value={customPerKillRate ?? ''}
                  onChange={e => setCustomPerKillRate(Math.max(0, Number(e.target.value) || 0))}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', fontWeight: 700 }}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Kill Rewards List */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '12px' }}>
                💀 Participant Kills (Reward: {formatCurrency(customPerKillRate)}/kill)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                {killWinners.map((kw, idx) => {
                  const user = adminUsers.find(u => u.id === kw.userId);
                  const totalReward = customPerKillRate * kw.kills;
                  return (
                    <div key={kw.userId} style={{ 
                      display: 'flex', alignItems: 'center', gap: '12px', 
                      background: 'var(--input-bg)', borderRadius: '12px', padding: '10px 14px',
                      border: kw.kills > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent'
                    }}>
                      <div style={{
                        background: 'rgba(249, 111, 46, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        border: '1px solid rgba(249, 111, 46, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: '35px'
                      }}>
                        <span style={{ fontSize: '0.45rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>SLOT</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent-orange)' }}>#{idx + 1}</span>
                      </div>
                      <img
                        src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${kw.userId}`}
                        alt=""
                        style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user?.name || kw.userId}
                        </div>
                        {selectedCardForWinners.participantGameIds?.[kw.userId] && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent-orange)', fontWeight: 800 }}>
                            ID: {selectedCardForWinners.participantGameIds[kw.userId]}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="number" 
                          min="0"
                          value={kw.kills}
                          onChange={e => {
                            const newKills = [...killWinners];
                            newKills[idx] = { ...kw, kills: Math.max(0, parseInt(e.target.value) || 0) };
                            setKillWinners(newKills);
                          }}
                          style={{ width: '60px', padding: '6px 8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', textAlign: 'center', fontWeight: 700 }}
                          placeholder="0"
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: '30px' }}>kills</span>
                        {totalReward > 0 && (
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F59E0B', minWidth: '60px', textAlign: 'right' }}>
                            +{formatCurrency(totalReward)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {killWinners.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No participants to assign kills to
                  </div>
                )}
              </div>
            </div>

            {/* Warning */}
            {(matchWinnerId || killWinners.some(k => k.kills > 0)) && (
              <div style={{ marginTop: '20px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <AlertTriangle className="w-4 h-4" style={{ color: '#F59E0B', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '0.8rem', color: '#FBBF24' }}>
                  <strong>This action is permanent.</strong> Prizes will be added to winners' balances and recorded as transactions in Firestore.
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button 
                onClick={() => setShowWinnersModal(false)} 
                disabled={isProcessing}
                style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveWinners}
                disabled={isProcessing || (!matchWinnerId && !killWinners.some(k => k.kills > 0))}
                style={{ 
                  flex: 1, padding: '14px', 
                  background: (!matchWinnerId && !killWinners.some(k => k.kills > 0)) ? 'rgba(255,255,255,0.1)' : 'var(--accent-gradient)', 
                  border: 'none', color: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: 800,
                  opacity: isProcessing || (!matchWinnerId && !killWinners.some(k => k.kills > 0)) ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                {isProcessing ? (
                  <><span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span> Processing...</>
                ) : (
                  <><Trophy className="w-4 h-4" /> Distribute Prizes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ PARTICIPANTS VIEWER MODAL ============ */}
      {showParticipantsModal && selectedCardForParticipants && (() => {
        // Get fresh card data from context
        const freshCard = cards.find(c => c.id === selectedCardForParticipants.id) || selectedCardForParticipants;
        const pIds = freshCard.participantIds || [];
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setShowParticipantsModal(false)}
          >
            <div 
              style={{ background: 'var(--nav-bg)', border: '1px solid var(--nav-border)', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '450px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(96, 165, 250, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users className="w-5 h-5" style={{ color: '#60A5FA' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Participants</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{freshCard.name} • {pIds.length} joined</span>
                  </div>
                </div>
                <button onClick={() => setShowParticipantsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Participants List */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pIds.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No participants have joined this card yet.
                  </div>
                ) : (
                  pIds.map((pid, idx) => {
                    const user = adminUsers.find(u => u.id === pid);
                    return (
                      <div key={pid} style={{ 
                        display: 'flex', alignItems: 'center', gap: '12px', 
                        background: 'var(--input-bg)', borderRadius: '14px', padding: '12px 16px',
                        border: '1px solid var(--glass-border)'
                      }}>
                        <div style={{
                          background: 'rgba(249, 111, 46, 0.1)',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          border: '1px solid rgba(249, 111, 46, 0.2)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          minWidth: '45px'
                        }}>
                          <span style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>SLOT</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent-orange)' }}>#{idx + 1}</span>
                        </div>
                        <img 
                          src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pid}`}
                          alt=""
                          style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.name || 'Unknown User'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span>{user?.username || pid}</span>
                            {freshCard.participantGameIds?.[pid] && (
                              <span style={{ color: 'var(--accent-orange)', fontWeight: 800 }}>Game ID: {freshCard.participantGameIds[pid]}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {user && (
                            <span style={{ fontSize: '0.75rem', color: '#4ADE80', fontWeight: 600 }}>
                              {formatCurrency(user.balance || 0)}
                            </span>
                          )}
                          <button 
                            onClick={() => handleRemoveParticipant(freshCard.id, pid, user?.name || pid)}
                            disabled={isProcessing}
                            title="Remove & Refund"
                            style={{ 
                              background: 'rgba(239, 68, 68, 0.15)', 
                              border: '1px solid rgba(239, 68, 68, 0.3)', 
                              borderRadius: '8px', 
                              padding: '6px',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <UserMinus className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Info */}
              {pIds.length > 0 && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Entry Fee: {formatCurrency(freshCard.entryFee || 0)}</span>
                  <span>Total Collected: {formatCurrency((freshCard.entryFee || 0) * pIds.length)}</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default InnerSectionsTab;
