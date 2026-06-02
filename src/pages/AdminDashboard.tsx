import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminDashboard } from '../context/AdminDashboardContext';
import { useCurrency } from '../context/CurrencyContext';
import type { AdminMatch } from '../context/AdminDashboardContext';
import { useChat } from '../context/ChatContext';
import { useRef } from 'react';
import InnerSectionsTab from '../components/InnerSectionsTab';


const AdminDashboard = () => {
  const navigate = useNavigate();
  const {
    adminMatches, createMatch, updateMatch, deleteMatch, toggleMatchStatus,
    paymentRequests, approvePayment, rejectPayment,
    withdrawalRequests, processWithdrawal, completeWithdrawal, rejectWithdrawal,
    adminUsers, updateUserBalance, toggleUserStatus, stats, setMatchWinners,
  } = useAdminDashboard();
  const { formatCurrency } = useCurrency();
  const { messages, sendMessage } = useChat();
  const [adminReply, setAdminReply] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [newMatch, setNewMatch] = useState({ name: '', group: 'Squad Match', maxParticipants: 12, time: '21:00', bids: ['$5','$10','$25','$50'], prizePool: '', firstPrize: '', secondPrize: '', thirdPrize: '' });
  const [editBalanceUser, setEditBalanceUser] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [isViewingChat, setIsViewingChat] = useState(false);
  const [selectingWinnersMatch, setSelectingWinnersMatch] = useState<AdminMatch | null>(null);
  const [editingMatchData, setEditingMatchData] = useState<AdminMatch | null>(null);
  const [winnersData, setWinnersData] = useState<{ rank: 1|2|3; userId: string; reward: string }[]>([
    { rank: 1, userId: '', reward: '100' },
    { rank: 2, userId: '', reward: '50' },
    { rank: 3, userId: '', reward: '25' },
  ]);

  useEffect(() => {
    if (localStorage.getItem('adminLoggedIn') !== 'true') navigate('/admin');
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'chats') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleLogout = () => { localStorage.removeItem('adminLoggedIn'); navigate('/admin'); };

  const handleCreateMatch = () => {
    const m: any = {
      name: newMatch.name || 'New Match',
      group: newMatch.group,
      totalPlayersCount: `${newMatch.maxParticipants} Players`,
      status: 'upcoming' as const,
      score: '0 - 0',
      time: newMatch.time,
      bids: newMatch.bids,
      totalBidsCount: '0 Players joined',
      currentParticipants: 0,
      maxParticipants: newMatch.maxParticipants,
      joinedUsers: [],
      timeline: [],
      scheduledStart: newMatch.time,
      countdownMinutes: 0,
      team1: { id: 'nt1', name: 'Team Alpha', shortName: 'ALP', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=alpha', color: '#F59E0B', percentage: '50%', kills: 0, damage: 0, headshots: 0, rank: 0 },
      team2: { id: 'nt2', name: 'Team Omega', shortName: 'OMG', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=omega', color: '#3B82F6', percentage: '50%', kills: 0, damage: 0, headshots: 0, rank: 0 },
      prizePool: newMatch.prizePool ? parseFloat(newMatch.prizePool) : undefined,
      firstPrize: newMatch.firstPrize ? parseFloat(newMatch.firstPrize) : undefined,
      secondPrize: newMatch.secondPrize ? parseFloat(newMatch.secondPrize) : undefined,
      thirdPrize: newMatch.thirdPrize ? parseFloat(newMatch.thirdPrize) : undefined,
    };
    createMatch(m);
    setShowCreateMatch(false);
    setNewMatch({ name: '', group: 'Squad Match', maxParticipants: 12, time: '21:00', bids: ['$5','$10','$25','$50'], prizePool: '', firstPrize: '', secondPrize: '', thirdPrize: '' });
  };

  const handleDuplicateMatch = (m: AdminMatch) => {
    const { id, createdAt, winners, liveStartedAt, ...rest } = m as any;
    createMatch({
      ...rest,
      name: `${m.name} (Copy)`,
      status: 'upcoming',
      joinedUsers: [],
      participantIds: [],
      currentParticipants: 0,
      totalBidsCount: '0 Players joined',
      score: '0 - 0'
    });
  };

  const statusColor = (s: string) => {
    const map: Record<string,string> = { live: '#10B981', upcoming: '#F59E0B', finished: '#6B7280', pending: '#F59E0B', approved: '#10B981', rejected: '#EF4444', processing: '#3B82F6', completed: '#10B981', active: '#10B981', suspended: '#EF4444' };
    return map[s] || '#9CA3AF';
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span style={{ background: statusColor(status) + '22', color: statusColor(status), padding: '4px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{status}</span>
  );

  const Card = ({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) => (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: isMobile ? '16px' : '24px', flex: 1, minWidth: isMobile ? '0' : '200px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>{icon}</div>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: isMobile ? '1.35rem' : '1.8rem', fontWeight: 900, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );

  const Btn = ({ children, onClick, variant = 'primary', small = false, disabled = false }: any) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? '5px 10px' : '9px 16px', borderRadius: '10px', border: 'none', fontFamily: "'Outfit',sans-serif",
      fontWeight: 700, fontSize: small ? '0.7rem' : '0.85rem', cursor: disabled ? 'not-allowed' : 'pointer',
      background: variant === 'primary' ? 'linear-gradient(90deg,#F96F2E,#E34360)' : variant === 'danger' ? '#EF4444' : variant === 'success' ? '#10B981' : 'rgba(255,255,255,0.08)',
      color: 'var(--text-primary)', opacity: disabled ? 0.5 : 1, transition: 'all 0.2s',
    }}>{children}</button>
  );

  const tabs = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'matches', icon: '⚔️', label: 'Matches' },
    { id: 'payments', icon: '💳', label: 'Payments' },
    { id: 'withdrawals', icon: '💸', label: 'Withdrawals' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'inner_sections', icon: '🎴', label: 'Inner Sections' },
    { id: 'chats', icon: '💬', label: 'Support' },
  ];

  return (
    <div className="admin-layout" style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'var(--bg-dark)', 
      fontFamily: "'Outfit',sans-serif", 
      color: 'var(--text-primary)',
      flexDirection: isMobile ? 'column' : 'row'
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{ 
          padding: '16px 20px', 
          background: 'var(--input-bg)', 
          borderBottom: '1px solid var(--divider)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span style={{ fontWeight: 900, fontSize: '1rem' }}>FireAdmin</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
      )}

      {/* Sidebar / Mobile Drawer */}
      <div style={{ 
        width: isMobile ? '280px' : '260px', 
        background: isMobile ? '#0F111A' : 'rgba(255,255,255,0.02)', 
        borderRight: '1px solid rgba(255,255,255,0.06)', 
        padding: isMobile ? '24px 16px' : '32px 16px', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'fixed', 
        top: 0, 
        left: isMobile ? (isSidebarOpen ? 0 : '-300px') : 0, 
        bottom: 0, 
        zIndex: 1000,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isMobile && isSidebarOpen ? '20px 0 50px rgba(0,0,0,0.5)' : 'none'
      }}>
        {/* Mobile Close Button */}
        {isMobile && (
          <button 
            onClick={() => setIsSidebarOpen(false)}
            style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '16px', 
              background: 'var(--input-bg)', 
              border: 'none', 
              color: 'var(--text-primary)', 
              width: '32px', 
              height: '32px', 
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer' 
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px', padding: '0 8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#F96F2E,#E34360)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div><div style={{ fontWeight: 900, fontSize: '1.1rem' }}>FireAdmin</div></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {tabs.map(tab => (
            <div key={tab.id} onClick={() => {
              setActiveTab(tab.id);
              if (isMobile) setIsSidebarOpen(false);
            }} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
              background: activeTab === tab.id ? 'linear-gradient(90deg,rgba(249,111,46,0.15),rgba(227,67,96,0.08))' : 'transparent',
              color: activeTab === tab.id ? '#F96F2E' : '#9CA3AF', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s',
              borderLeft: activeTab === tab.id ? '3px solid #F96F2E' : '3px solid transparent',
            }}>
              <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span> {tab.label}
              {tab.id === 'payments' && stats.pendingPayments > 0 && <span style={{ marginLeft: 'auto', background: '#EF4444', color: 'var(--text-primary)', borderRadius: '10px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 800 }}>{stats.pendingPayments}</span>}
              {tab.id === 'withdrawals' && stats.pendingWithdrawals > 0 && <span style={{ marginLeft: 'auto', background: '#F59E0B', color: 'var(--text-primary)', borderRadius: '10px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 800 }}>{stats.pendingWithdrawals}</span>}
            </div>
          ))}
        </div>

        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: 'none', color: '#EF4444', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
          🚪 Logout
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Main Content */}
      <div style={{ 
        marginLeft: isMobile ? 0 : '260px', 
        flex: 1, 
        padding: (isMobile && activeTab === 'chats' && isViewingChat) ? '0' : (isMobile ? '24px 16px' : '32px 40px'), 
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {!(isMobile && activeTab === 'chats' && isViewingChat) && (
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}</h1>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: isMobile ? '12px' : '20px', 
              marginBottom: '32px' 
            }}>
              <Card icon="👥" label="Users" value={stats.totalUsers} color="#3B82F6" />
              <Card icon="💰" label="Balance" value={formatCurrency(stats.totalBalance)} color="#10B981" />
              <Card icon="🔴" label="Live" value={stats.activeMatches} color="#EF4444" />
              <Card icon="💳" label="Payments" value={stats.pendingPayments} color="#F59E0B" />
              <Card icon="💸" label="Withdraw" value={stats.pendingWithdrawals} color="#E34360" />
              <Card icon="📈" label="Revenue" value={formatCurrency(stats.totalRevenue)} color="#8B5CF6" />
            </div>
            {/* Recent activity */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '24px' }}>
              <h3 style={{ fontWeight: 800, marginBottom: '20px' }}>📋 Recent Activity</h3>
              {paymentRequests.slice(0, 5).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--divider)' }}>
                  <img src={p.userAvatar} style={{ width: '36px', height: '36px', borderRadius: '10px' }} alt="" />
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.userName}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Deposit {formatCurrency(p.amount)} via {p.paymentMethod}</div></div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ color: 'var(--text-secondary)' }}>{adminMatches.length} total matches</div>
              <Btn onClick={() => setShowCreateMatch(!showCreateMatch)}>+ Create Match</Btn>
            </div>

            {showCreateMatch && (
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: isMobile ? '20px' : '28px', marginBottom: '24px' }}>
                <h3 style={{ fontWeight: 800, marginBottom: '20px' }}>🆕 Create New Match</h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Match Name</label>
                    <input value={newMatch.name} onChange={e => setNewMatch({ ...newMatch, name: e.target.value })} placeholder="Bermuda Battle Royale" style={{ width: '100%', padding: '14px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', color: 'var(--text-primary)', fontFamily: "'Outfit',sans-serif", fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Group Type</label>
                    <select value={newMatch.group} onChange={e => setNewMatch({ ...newMatch, group: e.target.value })} style={{ width: '100%', padding: '14px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', color: 'var(--text-primary)', fontFamily: "'Outfit',sans-serif", fontSize: '0.95rem', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                      <option value="Squad Match" style={{ background: '#1E293B', color: '#F8FAFC' }}>Squad Match</option>
                      <option value="Duo Match" style={{ background: '#1E293B', color: '#F8FAFC' }}>Duo Match</option>
                      <option value="Solo Match" style={{ background: '#1E293B', color: '#F8FAFC' }}>Solo Match</option>
                    </select>
                  </div>
                  </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <Btn onClick={handleCreateMatch}>Create Match</Btn>
                  <Btn variant="ghost" onClick={() => setShowCreateMatch(false)}>Cancel</Btn>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
              {adminMatches.map(match => (
                <div key={match.id} style={{ 
                  background: 'var(--card-bg)', 
                  border: '1px solid var(--card-border)', 
                  borderRadius: '24px', 
                  padding: '24px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Background Accent */}
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: statusColor(match.status) + '10', borderRadius: '50%', filter: 'blur(30px)' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{match.name}</div>
                      <div style={{ color: '#F96F2E', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{match.group}</div>
                    </div>
                    <StatusBadge status={match.status} />
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <Btn small variant="primary" onClick={() => setEditingMatchData(match)} style={{ flex: 1 }}>Edit</Btn>
                    <Btn small variant="ghost" onClick={() => deleteMatch(match.id)} style={{ width: '44px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EDIT MATCH MODAL */}
        {editingMatchData && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '24px' }}>
            <div style={{ background: 'var(--modal-bg)', border: '1px solid var(--card-border)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ fontWeight: 800, marginBottom: '24px' }}>⚙️ Edit Match Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Match Name</label>
                  <input value={editingMatchData.name} onChange={e => setEditingMatchData({...editingMatchData, name: e.target.value})} style={{ width: '100%', padding: '14px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Group Type (Squad/Duo/Solo)</label>
                  <select value={editingMatchData.group} onChange={e => setEditingMatchData({...editingMatchData, group: e.target.value})} style={{ width: '100%', padding: '14px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' }}>
                    <option value="Squad Match" style={{ background: '#1E293B', color: '#F8FAFC' }}>Squad Match</option>
                    <option value="Duo Match" style={{ background: '#1E293B', color: '#F8FAFC' }}>Duo Match</option>
                    <option value="Solo Match" style={{ background: '#1E293B', color: '#F8FAFC' }}>Solo Match</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Rules (One per line)</label>
                  <textarea 
                    value={(editingMatchData.rules || []).join('\n')} 
                    onChange={e => setEditingMatchData({...editingMatchData, rules: e.target.value.split('\n')})} 
                    rows={4}
                    style={{ width: '100%', padding: '14px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Btn style={{ flex: 1 }} onClick={() => { updateMatch(editingMatchData.id, editingMatchData); setEditingMatchData(null); }}>Save Changes</Btn>
                <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setEditingMatchData(null)}>Cancel</Btn>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ color: 'var(--text-secondary)' }}>{stats.pendingPayments} pending approvals</div>
            </div>
            
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {paymentRequests.map(p => (
                  <div key={p.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <img src={p.userAvatar} style={{ width: '40px', height: '40px', borderRadius: '12px' }} alt="" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{p.userName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{p.timestamp}</div>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    
                    <div style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '16px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Amount</span>
                        <span style={{ fontWeight: 800, color: '#10B981', fontSize: '1.1rem' }}>{formatCurrency(p.amount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Method</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{p.paymentMethod}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>TXN ID</span>
                        <code style={{ color: '#F96F2E', fontSize: '0.8rem', fontWeight: 800 }}>{p.transactionId}</code>
                      </div>
                    </div>

                    {p.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <Btn small variant="success" onClick={() => approvePayment(p.id)} style={{ flex: 1 }}>Approve</Btn>
                        <Btn small variant="danger" onClick={() => rejectPayment(p.id, 'Rejected')} style={{ flex: 1 }}>Reject</Btn>
                      </div>
                    )}
                    {p.note && <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '12px', textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '8px', borderRadius: '8px' }}>{p.note}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--divider)' }}>
                      {['User', 'Amount', 'Transaction ID', 'Method', 'Time', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '20px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paymentRequests.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={p.userAvatar} style={{ width: '36px', height: '36px', borderRadius: '10px' }} alt="" />
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.userName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: 800, color: '#10B981', fontSize: '1.1rem' }}>{formatCurrency(p.amount)}</td>
                        <td style={{ padding: '16px 20px' }}><code style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', color: '#F96F2E' }}>{p.transactionId}</code></td>
                        <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600 }}>{p.paymentMethod}</td>
                        <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.timestamp}</td>
                        <td style={{ padding: '16px 20px' }}><StatusBadge status={p.status} /></td>
                        <td style={{ padding: '16px 20px' }}>
                          {p.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Btn small variant="success" onClick={() => approvePayment(p.id)}>Approve</Btn>
                              <Btn small variant="danger" onClick={() => rejectPayment(p.id, 'Rejected')}>Reject</Btn>
                            </div>
                          )}
                          {p.note && <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', maxWidth: '150px' }}>{p.note}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* WITHDRAWALS TAB */}
        {activeTab === 'withdrawals' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ color: 'var(--text-secondary)' }}>{stats.pendingWithdrawals} pending requests</div>
            </div>

            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {withdrawalRequests.map(w => (
                  <div key={w.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <img src={w.userAvatar} style={{ width: '40px', height: '40px', borderRadius: '12px' }} alt="" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{w.userName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{w.timestamp}</div>
                      </div>
                      <StatusBadge status={w.status} />
                    </div>

                    <div style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '16px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Amount</span>
                        <span style={{ fontWeight: 800, color: '#EF4444', fontSize: '1.1rem' }}>-{formatCurrency(w.amount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Method</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{w.withdrawMethod}</span>
                      </div>
                      <div style={{ borderTop: '1px solid var(--divider)', marginTop: '8px', paddingTop: '8px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Account Details</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>{w.accountName}</div>
                        <code style={{ color: '#F96F2E', fontSize: '0.85rem', fontWeight: 800 }}>{w.accountNumber}</code>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      {w.status === 'pending' && <Btn small variant="primary" onClick={() => processWithdrawal(w.id)} style={{ flex: 1 }}>Process</Btn>}
                      {w.status === 'processing' && <Btn small variant="success" onClick={() => completeWithdrawal(w.id)} style={{ flex: 1 }}>Complete</Btn>}
                      {(w.status === 'pending' || w.status === 'processing') && <Btn small variant="danger" onClick={() => rejectWithdrawal(w.id, 'Rejected')} style={{ flex: 1 }}>Reject</Btn>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--divider)' }}>
                      {['User', 'Amount', 'Method', 'Account', 'Account Name', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '20px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalRequests.map(w => (
                      <tr key={w.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={w.userAvatar} style={{ width: '36px', height: '36px', borderRadius: '10px' }} alt="" />
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{w.userName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: 800, color: '#EF4444', fontSize: '1.1rem' }}>-{formatCurrency(w.amount)}</td>
                        <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600 }}>{w.withdrawMethod}</td>
                        <td style={{ padding: '16px 20px' }}><code style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>{w.accountNumber}</code></td>
                        <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>{w.accountName}</td>
                        <td style={{ padding: '16px 20px' }}><StatusBadge status={w.status} /></td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {w.status === 'pending' && <Btn small variant="primary" onClick={() => processWithdrawal(w.id)}>Process</Btn>}
                            {w.status === 'processing' && <Btn small variant="success" onClick={() => completeWithdrawal(w.id)}>Complete</Btn>}
                            {(w.status === 'pending' || w.status === 'processing') && <Btn small variant="danger" onClick={() => rejectWithdrawal(w.id, 'Rejected')}>Reject</Btn>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ color: 'var(--text-secondary)' }}>{adminUsers.length} total users registered</div>
            </div>
            
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {adminUsers.map(u => (
                  <div key={u.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <img src={u.avatar} style={{ width: '48px', height: '48px', borderRadius: '14px' }} alt="" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{u.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.username} • UID: {u.id.slice(-5)}</div>
                      </div>
                      <StatusBadge status={u.status} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', background: 'var(--input-bg)', padding: '12px', borderRadius: '12px' }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Balance</div>
                        <div style={{ fontWeight: 800, color: '#10B981' }}>{formatCurrency(u.balance)}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Wins/Matches</div>
                        <div style={{ fontWeight: 800 }}>{u.totalWins}/{u.totalMatches}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Btn small style={{ flex: 1 }} onClick={() => { setEditBalanceUser(u.id); setNewBalance(u.balance.toString()); }}>Edit Balance</Btn>
                      <Btn small variant={u.status === 'active' ? 'danger' : 'success'} onClick={() => toggleUserStatus(u.id)} style={{ flex: 1 }}>{u.status === 'active' ? 'Suspend' : 'Activate'}</Btn>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--divider)' }}>
                      {['User', 'Status', 'Balance', 'Matches', 'Wins', 'Phone', 'Joined', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '20px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={u.avatar} style={{ width: '36px', height: '36px', borderRadius: '10px' }} alt="" />
                            <div>
                              <div style={{ fontWeight: 700 }}>{u.name}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}><StatusBadge status={u.status} /></td>
                        <td style={{ padding: '16px 20px', fontWeight: 800, color: '#10B981' }}>{formatCurrency(u.balance)}</td>
                        <td style={{ padding: '16px 20px' }}>{u.totalMatches}</td>
                        <td style={{ padding: '16px 20px' }}>{u.totalWins}</td>
                        <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{u.phone}</td>
                        <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>{u.joinDate}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Btn small onClick={() => { setEditBalanceUser(u.id); setNewBalance(u.balance.toString()); }}>Edit</Btn>
                            <Btn small variant={u.status === 'active' ? 'danger' : 'success'} onClick={() => toggleUserStatus(u.id)}>{u.status === 'active' ? 'Suspend' : 'Activate'}</Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Edit Balance Modal */}
            {editBalanceUser && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                <div style={{ background: 'var(--modal-bg)', border: '1px solid var(--card-border)', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '400px' }}>
                  <h3 style={{ fontWeight: 800, marginBottom: '24px' }}>💰 Edit User Balance</h3>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>New Balance Amount ({currency === 'BDT' ? '৳' : '$'})</label>
                  <input type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)} style={{ width: '100%', padding: '16px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 800, outline: 'none', marginBottom: '24px', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Btn style={{ flex: 1 }} onClick={() => { updateUserBalance(editBalanceUser, parseFloat(newBalance)); setEditBalanceUser(null); }}>Update Balance</Btn>
                    <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setEditBalanceUser(null)}>Cancel</Btn>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SELECT WINNERS MODAL */}
        {selectingWinnersMatch && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: '20px' }}>
            <div style={{ background: 'var(--modal-bg)', border: '1px solid var(--card-border)', borderRadius: '28px', padding: isMobile ? '24px' : '36px', width: '100%', maxWidth: '500px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏆</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Set Match Winners</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectingWinnersMatch.name}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {winnersData.map((w, idx) => (
                  <div key={w.rank} style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '20px', border: '1px solid var(--divider)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.9rem', color: w.rank === 1 ? '#F59E0B' : w.rank === 2 ? '#9CA3AF' : '#B45309' }}>
                        {w.rank === 1 ? '🥇 1st Place' : w.rank === 2 ? '🥈 2nd Place' : '🥉 3rd Place'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px' }}>
                      <select 
                        value={w.userId} 
                        onChange={(e) => {
                          const newWinners = [...winnersData];
                          newWinners[idx].userId = e.target.value;
                          setWinnersData(newWinners);
                        }}
                        style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', borderRadius: '12px', color: 'var(--text-primary)', fontFamily: "'Outfit',sans-serif" }}
                      >
                        <option value="" style={{ background: 'var(--bg-dark)', color: 'var(--text-primary)' }}>Select User</option>
                        {selectingWinnersMatch.joinedUsers.map(u => (
                          <option key={u.id} value={u.id} style={{ background: 'var(--bg-dark)', color: 'var(--text-primary)' }}>{u.name}</option>
                        ))}
                      </select>
                      <input 
                        type="number" 
                        value={w.reward} 
                        onChange={(e) => {
                          const newWinners = [...winnersData];
                          newWinners[idx].reward = e.target.value;
                          setWinnersData(newWinners);
                        }}
                        placeholder="Reward"
                        style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', borderRadius: '12px', color: '#10B981', fontWeight: 800, textAlign: 'center', fontFamily: "'Outfit',sans-serif" }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <Btn style={{ flex: 1 }} onClick={() => {
                  const finalWinners = winnersData
                    .filter(w => w.userId)
                    .map(w => ({
                      userId: w.userId,
                      userName: selectingWinnersMatch.joinedUsers.find(u => u.id === w.userId)?.name || 'Unknown',
                      rank: w.rank,
                      reward: parseFloat(w.reward) || 0
                    }));
                  
                  if (finalWinners.length === 0) return alert('Select at least one winner');
                  
                  setMatchWinners(selectingWinnersMatch.id, finalWinners);
                  setSelectingWinnersMatch(null);
                  setWinnersData([
                    { rank: 1, userId: '', reward: '100' },
                    { rank: 2, userId: '', reward: '50' },
                    { rank: 3, userId: '', reward: '25' },
                  ]);
                }}>Distribute Rewards</Btn>
                <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setSelectingWinnersMatch(null)}>Cancel</Btn>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inner_sections' && (
          <InnerSectionsTab />
        )}

        {/* CHATS TAB */}
        {activeTab === 'chats' && (
          <div style={{ 
            flex: 1,
            height: (isMobile && isViewingChat) ? 'calc(100vh - 65px)' : (isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 200px)'), 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile && isViewingChat ? '0' : (isMobile ? '16px' : '24px'),
            marginTop: isMobile && !isViewingChat ? '-10px' : 0
          }}>
            {/* User List */}
            <div style={{ 
              width: isMobile ? '100%' : '320px', 
              background: 'var(--input-bg)', 
              border: '1px solid var(--card-border)', 
              borderRadius: '24px', 
              padding: '20px',
              display: isMobile && isViewingChat ? 'none' : 'block'
            }}>
              <h3 style={{ fontWeight: 800, marginBottom: '20px', fontSize: '1rem' }}>Active Conversations</h3>
              <div 
                onClick={() => isMobile && setIsViewingChat(true)}
                style={{ 
                  background: 'linear-gradient(135deg,rgba(249,111,46,0.1),rgba(227,67,96,0.05))', 
                  padding: '16px', 
                  borderRadius: '18px', 
                  border: '1px solid rgba(249,111,46,0.2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '14px', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" style={{ width: '44px', height: '44px', borderRadius: '14px' }} alt="" />
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', background: '#10B981', borderRadius: '50%', border: '2px solid #0F111A' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Felix Player</div>
                  <div style={{ color: '#10B981', fontSize: '0.7rem', fontWeight: 700 }}>ONLINE</div>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div style={{ 
              flex: 1, 
              background: 'var(--input-bg)', 
              border: (isMobile && isViewingChat) ? 'none' : '1px solid rgba(255,255,255,0.08)', 
              borderRadius: (isMobile && isViewingChat) ? '0' : '24px', 
              display: isMobile && !isViewingChat ? 'none' : 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden',
              boxShadow: (isMobile && isViewingChat) ? 'none' : '0 8px 32px rgba(0,0,0,0.2)'
            }}>
              <div style={{ padding: '18px 24px', background: 'var(--card-bg)', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isMobile && (
                   <button onClick={() => setIsViewingChat(false)} style={{ background: 'none', border: 'none', color: '#F96F2E', fontWeight: 800, marginRight: '8px', fontSize: '1.2rem', cursor: 'pointer' }}>←</button>
                )}
                <div style={{ position: 'relative' }}>
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" style={{ width: '32px', height: '32px', borderRadius: '10px' }} alt="" />
                  <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', border: '1.5px solid #0F111A' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Felix Player</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>UID: 55291</div>
                </div>
              </div>

              <div style={{ flex: 1, padding: isMobile ? '16px' : '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ 
                    alignSelf: msg.sender === 'support' ? 'flex-end' : 'flex-start',
                    maxWidth: isMobile ? '85%' : '70%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'support' ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{ 
                      background: msg.sender === 'support' ? 'linear-gradient(135deg,#F96F2E,#E34360)' : 'rgba(255,255,255,0.06)',
                      padding: '12px 18px',
                      borderRadius: msg.sender === 'support' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      border: msg.sender === 'support' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: msg.sender === 'support' ? '0 4px 12px rgba(227,67,96,0.2)' : 'none'
                    }}>
                      {msg.text}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 600 }}>{msg.time} {msg.sender === 'support' ? '• ADMIN' : ''}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!adminReply.trim()) return;
                  sendMessage(adminReply, 'support');
                  setAdminReply('');
                }}
                style={{ padding: '16px', background: 'var(--card-bg)', borderTop: '1px solid var(--divider)', display: 'flex', gap: '10px' }}
              >
                <input 
                  value={adminReply}
                  onChange={e => setAdminReply(e.target.value)}
                  placeholder="Type a message..."
                  style={{ flex: 1, background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '12px 16px', color: 'var(--text-primary)', fontFamily: "'Outfit',sans-serif", outline: 'none', fontSize: '0.95rem' }}
                />
                <button type="submit" style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#F96F2E,#E34360)', border: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(227,67,96,0.3)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
