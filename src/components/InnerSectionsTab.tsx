import React, { useState } from 'react';
import { useAdminDashboard, AdminMatch } from '../context/AdminDashboardContext';
import { useCurrency } from '../context/CurrencyContext';
import type { Team } from '../data/mockData';

const InnerSectionsTab = () => {
  const { adminMatches, addMatchCard, updateMatchCard, deleteMatchCard } = useAdminDashboard();
  const { formatCurrency } = useCurrency();
  
  const [selectedMatchId, setSelectedMatchId] = useState<string>(adminMatches[0]?.id || '');
  const [editingCard, setEditingCard] = useState<Team | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState<Partial<Team>>({
    name: '',
    logo: '',
    color: '#DC2626',
    entryType: 'Solo',
    mainCategory: 'Full Map Match',
    entryFee: 10,
    winPrize: 500,
    perKill: 0,
    map: 'Bermuda',
    version: 'MOBILE',
    startTime: '',
    percentage: '50%',
    kills: 0,
    damage: 0,
    headshots: 0,
    rank: 0
  });

  const selectedMatch = adminMatches.find(m => m.id === selectedMatchId);
  const cards = selectedMatch?.innerSections || [];

  const handleSaveCard = () => {
    if (!selectedMatchId || !cardForm.name || !cardForm.logo) return;
    
    if (editingCard) {
      updateMatchCard(selectedMatchId, editingCard.id, cardForm);
    } else {
      addMatchCard(selectedMatchId, cardForm as Omit<Team, 'id'>);
    }
    
    setShowAddCard(false);
    setEditingCard(null);
    setCardForm({
      name: '', logo: '', color: '#DC2626', entryType: 'Solo', mainCategory: 'Full Map Match', entryFee: 10, winPrize: 500,
      perKill: 0, map: 'Bermuda', version: 'MOBILE', startTime: '',
      percentage: '50%', kills: 0, damage: 0, headshots: 0, rank: 0
    });
  };

  const handleEdit = (card: Team) => {
    setEditingCard(card);
    setCardForm({ ...card });
    setShowAddCard(true);
  };

  const handleDelete = (cardId: string) => {
    if (window.confirm("Are you sure you want to delete this card?")) {
      deleteMatchCard(selectedMatchId, cardId);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Inner Sections (Match Cards)</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingCard(null);
            setCardForm({
              name: '', logo: '', color: '#DC2626', entryType: 'Solo', mainCategory: 'Full Map Match', entryFee: 10, winPrize: 500,
              perKill: 0, map: 'Bermuda', version: 'MOBILE', startTime: '',
              percentage: '50%', kills: 0, damage: 0, headshots: 0, rank: 0
            });
            setShowAddCard(true);
          }}
          disabled={!selectedMatchId}
        >
          + Add New Card
        </button>
      </div>

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

      {selectedMatch && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {cards.map(card => (
            <div key={card.id} style={{ 
              background: 'var(--glass-bg)', 
              border: `1px solid ${card.color}44`, 
              borderRadius: '20px', 
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: card.color }}></div>
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEdit(card)} style={{ flex: 1, padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(card.id)} style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#ef4444', borderRadius: '8px', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
          {cards.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--input-bg)', borderRadius: '20px' }}>
              No cards found for this match. Click "Add New Card" to create one.
            </div>
          )}
        </div>
      )}

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
                  <input type="number" value={cardForm.entryFee} onChange={e => setCardForm({...cardForm, entryFee: Number(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Win Prize</label>
                  <input type="number" value={cardForm.winPrize} onChange={e => setCardForm({...cardForm, winPrize: Number(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} />
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
                  <input type="number" value={cardForm.perKill || 0} onChange={e => setCardForm({...cardForm, perKill: Number(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Start Time</label>
                  <input type="time" value={cardForm.startTime || ''} onChange={e => setCardForm({...cardForm, startTime: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Live Duration (mins)</label>
                  <input type="number" value={cardForm.liveDuration || ''} onChange={e => setCardForm({...cardForm, liveDuration: Number(e.target.value)})} placeholder="e.g. 60" style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowAddCard(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveCard} disabled={!cardForm.name || !cardForm.logo} style={{ flex: 1, padding: '12px', background: 'var(--accent-gradient)', border: 'none', color: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, opacity: (!cardForm.name || !cardForm.logo) ? 0.5 : 1 }}>Save Card</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InnerSectionsTab;
