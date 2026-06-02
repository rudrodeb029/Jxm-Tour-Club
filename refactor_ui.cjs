const fs = require('fs');
const filepath = 'src/components/InnerSectionsTab.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Add imports
content = content.replace(
    /import \{ useAdminDashboard, AdminMatch \} from '\.\.\/context\/AdminDashboardContext';/,
    'import { useAdminDashboard, AdminMatch } from \'../context/AdminDashboardContext\';\nimport { Trophy, Users, UserPlus } from \'lucide-react\';'
);

// 2. Add state for Winners Modal
const stateHooks = `
  const [selectedMatchId, setSelectedMatchId] = useState<string>(adminMatches[0]?.id || '');
  const [editingCard, setEditingCard] = useState<Team | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [selectedCardForWinners, setSelectedCardForWinners] = useState<Team | null>(null);
  
  const [matchWinnerId, setMatchWinnerId] = useState<string>('');
  const [killWinners, setKillWinners] = useState<{userId: string, kills: number}[]>([]);
  
  const { setCardWinners, adminUsers } = useAdminDashboard();
`;
content = content.replace(/const \[selectedMatchId, setSelectedMatchId\] = useState<string>\(adminMatches\[0\]\?\.id \|\| ''\);[\s\S]*?const \[showAddCard, setShowAddCard\] = useState\(false\);/, stateHooks);

// 3. Add handleSaveWinners
const handleSaveWinnersFunction = `
  const handleSaveWinners = () => {
    if (!selectedCardForWinners || !selectedMatchId) return;
    
    setCardWinners(
      selectedMatchId, 
      selectedCardForWinners.id, 
      matchWinnerId || null, 
      killWinners.filter(k => k.kills > 0)
    );
    
    alert('Prizes distributed successfully!');
    setShowWinnersModal(false);
    setMatchWinnerId('');
    setKillWinners([]);
  };

  const handleEdit = (card: Team) => {
`;
content = content.replace(/const handleEdit = \(card: Team\) => \{/, handleSaveWinnersFunction);

// 4. Update the card rendering to include the "Manage Winners" icon and Participants count
const cardRender = `
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

              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users className="w-4 h-4 text-gray-400" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{card.participantIds ? card.participantIds.length : 0} Joined</span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedCardForWinners(card);
                    setMatchWinnerId('');
                    setKillWinners((card.participantIds || []).map(id => ({ userId: id, kills: 0 })));
                    setShowWinnersModal(true);
                  }}
                  style={{ background: 'var(--accent-orange)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Trophy className="w-3 h-3" /> Select Winners
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
`;
content = content.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '0\.9rem' \}\}>[\s\S]*?<\/div>\s*<\/div>\s*<div style=\{\{ display: 'flex', gap: '8px' \}\}>/, cardRender);

// 5. Add the Winners Modal JSX at the bottom before the closing tag
const winnersModalJSX = `
      {showWinnersModal && selectedCardForWinners && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--nav-bg)', border: '1px solid var(--nav-border)', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy className="w-5 h-5 text-yellow-500" /> Select Winners & Kills
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>For card: <strong>{selectedCardForWinners.name}</strong></p>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Select Match Winner (receives {formatCurrency(selectedCardForWinners.winPrize || 0)})</label>
              <select 
                value={matchWinnerId}
                onChange={e => setMatchWinnerId(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', appearance: 'none' }}
              >
                <option value="" style={{ background: '#1E293B' }}>-- Select Winner --</option>
                {(selectedCardForWinners.participantIds || []).map(uid => {
                  const u = adminUsers.find(user => user.id === uid);
                  return <option key={'w_'+uid} value={uid} style={{ background: '#1E293B' }}>{u?.name || 'Unknown'} ({u?.username})</option>
                })}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Kill Prizes (receives {formatCurrency(selectedCardForWinners.perKill || 0)} per kill)</label>
              {(selectedCardForWinners.participantIds || []).length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No users have joined this card yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
                  {(selectedCardForWinners.participantIds || []).map(uid => {
                    const u = adminUsers.find(user => user.id === uid);
                    const kVal = killWinners.find(k => k.userId === uid)?.kills || 0;
                    return (
                      <div key={'k_'+uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={u?.avatar || ''} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333' }} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{u?.name || 'Unknown'}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u?.username}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Kills:</span>
                          <input 
                            type="number" 
                            min="0"
                            value={kVal}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setKillWinners(prev => prev.map(p => p.userId === uid ? { ...p, kills: val } : p));
                            }}
                            style={{ width: '60px', padding: '8px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'white', textAlign: 'center' }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setShowWinnersModal(false)} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button 
                onClick={handleSaveWinners}
                style={{ flex: 1, padding: '14px', background: 'var(--accent-gradient)', border: 'none', color: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: 800 }}
              >
                Distribute Prizes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
`;
content = content.replace(/<\/div>\s*<form.*?>/g, ''); // just safe fallback
content = content.replace(/<\/div>\s*\);\s*\}\s*export default InnerSectionsTab;/, winnersModalJSX + '\nexport default InnerSectionsTab;');

fs.writeFileSync(filepath, content, 'utf8');
console.log('Refactored InnerSectionsTab UI');
