import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { matches as defaultMatches, winners as defaultWinners } from '../data/mockData';
import type { Match, Winner } from '../data/mockData';


// ============ TYPES ============

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  balance: number;
  joinDate: string;
  phone: string;
  totalMatches: number;
  totalWins: number;
  status: 'active' | 'suspended';
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  amount: number;
  transactionId: string;
  paymentMethod: string;
  accountNumber: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  amount: number;
  withdrawMethod: string;
  accountNumber: string;
  accountName: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  note?: string;
}

export interface Activity {
  id: string;
  type: 'deposit' | 'withdrawal' | 'join' | 'win';
  userId: string;
  userName: string;
  userAvatar: string;
  amount?: number;
  matchName?: string;
  timestamp: string;
  status?: string;
}

export type MatchWinner = {
  userId: string;
  userName: string;
  rank: 1 | 2 | 3;
  reward: number;
};

export type AdminMatch = Match & {
  createdAt: string;
  scheduledStart: string;
  countdownMinutes: number;
  winners?: MatchWinner[];
  participantIds: string[]; // Track who joined for accurate stat updates
  liveStartedAt?: number; // Unix timestamp when match went live
};

export interface WinnerCeremony {
  matchId: string;
  matchName: string;
  winners: MatchWinner[];
}

interface AdminDashboardContextType {
  // Matches
  adminMatches: AdminMatch[];
  createMatch: (match: Omit<AdminMatch, 'id' | 'createdAt'>) => void;
  updateMatch: (id: string, updates: Partial<AdminMatch>) => void;
  deleteMatch: (id: string) => void;
  toggleMatchStatus: (id: string, status: 'live' | 'upcoming' | 'finished') => void;
  setMatchWinners: (matchId: string, winners: MatchWinner[]) => void;
  addParticipantToMatch: (matchId: string, userId: string) => void;
  
  // Payments
  paymentRequests: PaymentRequest[];
  approvePayment: (id: string) => void;
  rejectPayment: (id: string, note: string) => void;
  addPaymentRequest: (request: Omit<PaymentRequest, 'id' | 'status' | 'timestamp' | 'userName' | 'userAvatar'>) => void;
  
  // Withdrawals
  withdrawalRequests: WithdrawalRequest[];
  processWithdrawal: (id: string) => void;
  completeWithdrawal: (id: string) => void;
  rejectWithdrawal: (id: string, note: string) => void;
  addWithdrawalRequest: (request: Omit<WithdrawalRequest, 'id' | 'status' | 'timestamp' | 'userName' | 'userAvatar'>) => void;
  
  // Users
  adminUsers: AdminUser[];
  updateUserBalance: (userId: string, newBalance: number) => void;
  incrementUserMatches: (userId: string) => void;
  toggleUserStatus: (userId: string) => void;
  
  // Winners
  winners: Winner[];
  // Stats
  stats: {
    totalUsers: number;
    totalBalance: number;
    activeMatches: number;
    pendingPayments: number;
    pendingWithdrawals: number;
    totalRevenue: number;
    totalWinners: number;
  };

  activeWinnerCeremony: WinnerCeremony | null;
  clearWinnerCeremony: () => void;
  
  // Activities
  activities: Activity[];
  logActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
}

// ============ DEMO DATA ============

const demoUsers: AdminUser[] = [
  { id: 'u1', name: 'Elite Moco', username: '@mocotech', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Moco', balance: 2450.00, joinDate: '2025-01-15', phone: '+880 1712 345678', totalMatches: 45, totalWins: 12, status: 'active' },
  { id: 'u2', name: 'Kelly Swift', username: '@kellyrunner', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kelly', balance: 1890.50, joinDate: '2024-11-20', phone: '+880 1812 987654', totalMatches: 38, totalWins: 8, status: 'active' },
  { id: 'u3', name: 'Alok Rhythms', username: '@alokdj', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alok', balance: 5200.00, joinDate: '2025-02-01', phone: '+880 1912 456789', totalMatches: 67, totalWins: 21, status: 'active' },
  { id: 'u4', name: 'Hayato Bushido', username: '@hayatosword', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hayato', balance: 320.75, joinDate: '2025-03-10', phone: '+880 1612 112233', totalMatches: 15, totalWins: 3, status: 'active' },
  { id: 'u5', name: 'Chrono Shield', username: '@chronos', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chrono', balance: 8900.00, joinDate: '2024-12-05', phone: '+880 1512 778899', totalMatches: 92, totalWins: 35, status: 'active' },
  { id: 'u6', name: 'Wukong Simian', username: '@monkeyking', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wukong', balance: 0, joinDate: '2025-01-20', phone: '+880 1412 334455', totalMatches: 5, totalWins: 0, status: 'suspended' },
  { 
    id: localStorage.getItem('generatedUserId') || 'USER123', 
    name: 'Current User', 
    username: '@user', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User', 
    balance: 5678.98, 
    joinDate: new Date().toISOString().split('T')[0], 
    phone: '+880 1234 567890', 
    totalMatches: 24, 
    totalWins: 5, 
    status: 'active' 
  },
];

const demoPayments: PaymentRequest[] = [
  { id: 'pay1', userId: 'u1', userName: 'Elite Moco', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Moco', amount: 500, transactionId: 'TXN8A7B2C9D', paymentMethod: 'Bkash', accountNumber: '01712345678', timestamp: '2026-05-04 10:30 AM', status: 'pending' },
  { id: 'pay2', userId: 'u2', userName: 'Kelly Swift', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kelly', amount: 1000, transactionId: 'TXN3E4F5G6H', paymentMethod: 'Nagad', accountNumber: '01812987654', timestamp: '2026-05-04 09:15 AM', status: 'pending' },
  { id: 'pay3', userId: 'u3', userName: 'Alok Rhythms', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alok', amount: 2500, transactionId: 'TXN1I2J3K4L', paymentMethod: 'Bkash', accountNumber: '01912456789', timestamp: '2026-05-04 08:00 AM', status: 'pending' },
  { id: 'pay4', userId: 'u5', userName: 'Chrono Shield', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chrono', amount: 200, transactionId: 'TXN5M6N7O8P', paymentMethod: 'Binance', accountNumber: '01512778899', timestamp: '2026-05-03 11:45 PM', status: 'approved' },
  { id: 'pay5', userId: 'u4', userName: 'Hayato Bushido', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hayato', amount: 100, transactionId: 'TXN9Q0R1S2T', paymentMethod: 'Bkash', accountNumber: '01612112233', timestamp: '2026-05-03 06:30 PM', status: 'rejected', note: 'Invalid transaction ID' },
];

const demoWithdrawals: WithdrawalRequest[] = [
  { id: 'wd1', userId: 'u3', userName: 'Alok Rhythms', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alok', amount: 1500, withdrawMethod: 'Bkash', accountNumber: '01912456789', accountName: 'Alok Rahman', timestamp: '2026-05-04 11:00 AM', status: 'pending' },
  { id: 'wd2', userId: 'u5', userName: 'Chrono Shield', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chrono', amount: 3000, withdrawMethod: 'Nagad', accountNumber: '01512778899', accountName: 'Chrono Ahmed', timestamp: '2026-05-04 09:30 AM', status: 'pending' },
  { id: 'wd3', userId: 'u1', userName: 'Elite Moco', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Moco', amount: 800, withdrawMethod: 'Bkash', accountNumber: '01712345678', accountName: 'Moco Khan', timestamp: '2026-05-03 05:00 PM', status: 'processing' },
  { id: 'wd4', userId: 'u2', userName: 'Kelly Swift', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kelly', amount: 500, withdrawMethod: 'Binance', accountNumber: '01812987654', accountName: 'Kelly Akter', timestamp: '2026-05-02 02:00 PM', status: 'completed' },
];

const demoActivities: Activity[] = [
  { id: 'act1', type: 'join', userId: 'u1', userName: 'Elite Moco', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Moco', matchName: 'Pro Tournament #102', timestamp: '2 mins ago' },
  { id: 'act2', type: 'deposit', userId: 'u2', userName: 'Kelly Swift', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kelly', amount: 500, timestamp: '5 mins ago', status: 'approved' },
  { id: 'act3', type: 'join', userId: 'u3', userName: 'Alok Rhythms', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alok', matchName: 'Elite Scrims', timestamp: '12 mins ago' },
  { id: 'act4', type: 'withdrawal', userId: 'u5', userName: 'Chrono Shield', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chrono', amount: 1200, timestamp: '25 mins ago', status: 'completed' },
  { id: 'act5', type: 'win', userId: 'u1', userName: 'Elite Moco', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Moco', amount: 2500, matchName: 'Weekend Clash', timestamp: '1 hour ago' },
];

// ============ CONTEXT ============

const AdminDashboardContext = createContext<AdminDashboardContextType | undefined>(undefined);

const convertToAdminMatches = (m: Match[]): AdminMatch[] => m.map(match => ({
  ...match,
  createdAt: '2026-05-01',
  scheduledStart: match.time,
  countdownMinutes: match.status === 'live' ? 600 : 0,
  participantIds: match.joinedUsers.map(u => u.id),
  liveStartedAt: match.status === 'live' ? Date.now() : undefined,
}));

export const AdminDashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [adminMatches, setAdminMatches] = useState<AdminMatch[]>(() => {
    const saved = localStorage.getItem('adminMatches');
    if (saved) {
      const parsed = JSON.parse(saved) as AdminMatch[];
      
      // If the number of matches changed in mockData, override localStorage
      if (parsed.length !== defaultMatches.length) {
        return convertToAdminMatches(defaultMatches);
      }

      return parsed.map(match => {
        const defaultMatch = defaultMatches.find(dm => dm.id === match.id);
        if (defaultMatch) {
          return {
            ...match,
            name: defaultMatch.name,
            group: defaultMatch.group,
            team1: { ...match.team1, logo: defaultMatch.team1.logo, entryType: match.team1.entryType || defaultMatch.team1.entryType, entryFee: match.team1.entryFee || defaultMatch.team1.entryFee, winPrize: match.team1.winPrize || defaultMatch.team1.winPrize },
            team2: { ...match.team2, logo: defaultMatch.team2.logo, entryType: match.team2.entryType || defaultMatch.team2.entryType, entryFee: match.team2.entryFee || defaultMatch.team2.entryFee, winPrize: match.team2.winPrize || defaultMatch.team2.winPrize },
            team3: defaultMatch.team3 ? { ...(match.team3 || {}), ...defaultMatch.team3, entryType: (match.team3 && match.team3.entryType) || defaultMatch.team3.entryType, entryFee: (match.team3 && match.team3.entryFee) || defaultMatch.team3.entryFee, winPrize: (match.team3 && match.team3.winPrize) || defaultMatch.team3.winPrize } : match.team3,
            category: defaultMatch.category,
            map: defaultMatch.map,
            version: defaultMatch.version,
            perKillReward: defaultMatch.perKillReward,
            prizePool: defaultMatch.prizePool,
            bids: defaultMatch.bids,
            rules: defaultMatch.rules || match.rules,
            gameId: defaultMatch.gameId || match.gameId,
            gamePassword: defaultMatch.gamePassword || match.gamePassword,
            entryType: defaultMatch.entryType || match.entryType,
            entryFee: defaultMatch.entryFee || match.entryFee
          };
        }
        return match;
      });
    }
    return convertToAdminMatches(defaultMatches);
  });

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => {
    const saved = localStorage.getItem('adminPayments');
    return saved ? JSON.parse(saved) : demoPayments;
  });

  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem('adminWithdrawals');
    return saved ? JSON.parse(saved) : demoWithdrawals;
  });

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('adminUsers');
    return saved ? JSON.parse(saved) : demoUsers;
  });

  const [winners, setWinners] = useState<Winner[]>(() => {
    const saved = localStorage.getItem('adminWinners');
    return saved ? JSON.parse(saved) : defaultWinners;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('adminActivities');
    return saved ? JSON.parse(saved) : demoActivities;
  });

  const [activeWinnerCeremony, setActiveWinnerCeremony] = useState<WinnerCeremony | null>(null);

  const clearWinnerCeremony = () => setActiveWinnerCeremony(null);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem('adminMatches', JSON.stringify(adminMatches)); }, [adminMatches]);
  useEffect(() => { localStorage.setItem('adminPayments', JSON.stringify(paymentRequests)); }, [paymentRequests]);
  useEffect(() => { localStorage.setItem('adminWithdrawals', JSON.stringify(withdrawalRequests)); }, [withdrawalRequests]);
  useEffect(() => { localStorage.setItem('adminUsers', JSON.stringify(adminUsers)); }, [adminUsers]);
  useEffect(() => { localStorage.setItem('adminWinners', JSON.stringify(winners)); }, [winners]);
  useEffect(() => { localStorage.setItem('adminActivities', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { 
    if (activeWinnerCeremony) {
      localStorage.setItem('activeWinnerCeremony', JSON.stringify(activeWinnerCeremony));
    } else {
      localStorage.removeItem('activeWinnerCeremony');
    }
  }, [activeWinnerCeremony]);

  // Sync state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      const data = JSON.parse(e.newValue);
      
      switch (e.key) {
        case 'adminMatches': setAdminMatches(data); break;
        case 'adminPayments': setPaymentRequests(data); break;
        case 'adminWithdrawals': setWithdrawalRequests(data); break;
        case 'adminUsers': setAdminUsers(data); break;
        case 'adminWinners': setWinners(data); break;
        case 'adminActivities': setActivities(data); break;
        case 'activeWinnerCeremony': setActiveWinnerCeremony(data); break;
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auto-start matches when scheduled time is reached
  useEffect(() => {
    const checkUpcomingMatches = () => {
      const now = Date.now();
      let hasChanges = false;
      
      const updatedMatches = adminMatches.map(m => {
        if (m.status === 'upcoming') {
          try {
            const trimmedTime = m.time.trim();
            const match12 = trimmedTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            const match24 = trimmedTime.match(/(\d{1,2}):(\d{2})/);
            
            let targetH = 0, targetM = 0;
            
            if (match12) {
              let [_, hours, mins, ampm] = match12;
              targetH = parseInt(hours);
              targetM = parseInt(mins);
              if (ampm.toUpperCase() === 'PM' && targetH < 12) targetH += 12;
              if (ampm.toUpperCase() === 'AM' && targetH === 12) targetH = 0;
            } else if (match24) {
              targetH = parseInt(match24[1]);
              targetM = parseInt(match24[2]);
            } else {
              return m;
            }
            
            const target = new Date();
            target.setHours(targetH, targetM, 0, 0);
            
            // Auto-start if time reached (with a 30-minute window safety)
            if (target.getTime() <= now && target.getTime() > now - 30 * 60 * 1000) {
              hasChanges = true;
              return { 
                ...m, 
                status: 'live' as const, 
                liveStartedAt: target.getTime() // Sync live start with scheduled time
              };
            }
          } catch (e) {
            console.error("Auto-start parsing error:", e);
          }
        }
        return m;
      });
      
      if (hasChanges) {
        setAdminMatches(updatedMatches);
      }
    };

    const interval = setInterval(checkUpcomingMatches, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [adminMatches]);

  const logActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: 'act-' + Date.now() + Math.random().toString(36).substr(2, 5),
      timestamp: 'Just now'
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep last 50
  };

  // Match operations
  const createMatch = (match: Omit<AdminMatch, 'id' | 'createdAt'>) => {
    const newMatch: AdminMatch = {
      ...match,
      id: 'm' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAdminMatches(prev => [newMatch, ...prev]);
  };

  const updateMatch = (id: string, updates: Partial<AdminMatch>) => {
    setAdminMatches(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMatch = (id: string) => {
    setAdminMatches(prev => prev.filter(m => m.id !== id));
  };

  const toggleMatchStatus = (id: string, status: 'live' | 'upcoming' | 'finished') => {
    setAdminMatches(prev => prev.map(m => m.id === id ? { 
      ...m, 
      status,
      liveStartedAt: status === 'live' ? (m.liveStartedAt || Date.now()) : m.liveStartedAt
    } : m));
  };

  const setMatchWinners = (matchId: string, winnersList: MatchWinner[]) => {
    setAdminMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        const matchName = m.name;
        const matchGroup = m.group;
        const participants = m.participantIds || [];
        
        // 1. Update EVERY participant's totalMatches
        setAdminUsers(users => users.map(u => 
          participants.includes(u.id) ? { ...u, totalMatches: u.totalMatches + 1 } : u
        ));

        // 2. Update winners' totalWins and balance
        winnersList.forEach(winner => {
          setAdminUsers(users => users.map(u => 
            u.id === winner.userId ? { ...u, balance: u.balance + winner.reward, totalWins: u.totalWins + 1 } : u
          ));

          // Add to global winners list for Home page
          const userObj = adminUsers.find(u => u.id === winner.userId);
          if (userObj) {
            const newWinnerRecord: Winner = {
              id: 'w' + Date.now() + Math.random(),
              name: userObj.name,
              avatar: userObj.avatar,
              amount: `$${winner.reward}`,
              match: `${matchGroup} - ${matchName}`,
              time: 'Just now'
            };
            setWinners(prevWinners => [newWinnerRecord, ...prevWinners]);
          }

          // Log Activity
          logActivity({
            type: 'win',
            userId: winner.userId,
            userName: winner.userName,
            userAvatar: adminUsers.find(u => u.id === winner.userId)?.avatar || '',
            amount: winner.reward,
            matchName: m.name
          });
        });
        // 3. Trigger Ceremony
        const ceremony: WinnerCeremony = {
          matchId,
          matchName: m.name,
          winners: winnersList
        };
        setActiveWinnerCeremony(ceremony);

        return { ...m, winners: winnersList, status: 'finished' as const };
      }
      return m;
    }));
  };
  const addParticipantToMatch = (matchId: string, userId: string) => {
    setAdminMatches(prev => prev.map(m => 
      m.id === matchId ? { ...m, participantIds: [...(m.participantIds || []), userId] } : m
    ));

    // Log Activity
    const match = adminMatches.find(m => m.id === matchId);
    const user = adminUsers.find(u => u.id === userId);
    if (match && user) {
      logActivity({
        type: 'join',
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        matchName: match.name
      });
    }
  };

  // Payment operations
  const approvePayment = (id: string) => {
    setPaymentRequests(prev => prev.map(p => {
      if (p.id === id && p.status === 'pending') {
        // Credit user balance
        setAdminUsers(users => users.map(u => 
          u.id === p.userId ? { ...u, balance: u.balance + p.amount } : u
        ));

        // Log Activity
        logActivity({
          type: 'deposit',
          userId: p.userId,
          userName: p.userName,
          userAvatar: p.userAvatar,
          amount: p.amount,
          status: 'approved'
        });

        return { ...p, status: 'approved' as const };
      }
      return p;
    }));
  };

  const rejectPayment = (id: string, note: string) => {
    setPaymentRequests(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'rejected' as const, note } : p
    ));
  };

  const addPaymentRequest = (request: Omit<PaymentRequest, 'id' | 'status' | 'timestamp' | 'userName' | 'userAvatar'>) => {
    const user = adminUsers.find(u => u.id === request.userId);
    const newRequest: PaymentRequest = {
      ...request,
      id: 'pay' + Date.now(),
      status: 'pending',
      timestamp: new Date().toLocaleString(),
      userName: user?.name || 'Current User',
      userAvatar: user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
    };
    setPaymentRequests(prev => [newRequest, ...prev]);

    // Log Activity (Initial pending)
    logActivity({
      type: 'deposit',
      userId: request.userId,
      userName: user?.name || 'Current User',
      userAvatar: user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
      amount: request.amount,
      status: 'pending'
    });
  };

  // Withdrawal operations
  const processWithdrawal = (id: string) => {
    setWithdrawalRequests(prev => prev.map(w => 
      w.id === id && w.status === 'pending' ? { ...w, status: 'processing' as const } : w
    ));
  };

  const completeWithdrawal = (id: string) => {
    setWithdrawalRequests(prev => prev.map(w => {
      if (w.id === id && w.status === 'processing') {
        // Deduct user balance
        setAdminUsers(users => users.map(u => 
          u.id === w.userId ? { ...u, balance: Math.max(0, u.balance - w.amount) } : u
        ));

        // Log Activity
        logActivity({
          type: 'withdrawal',
          userId: w.userId,
          userName: w.userName,
          userAvatar: w.userAvatar,
          amount: w.amount,
          status: 'completed'
        });

        return { ...w, status: 'completed' as const };
      }
      return w;
    }));
  };

  const rejectWithdrawal = (id: string, note: string) => {
    setWithdrawalRequests(prev => prev.map(w => 
      w.id === id ? { ...w, status: 'rejected' as const, note } : w
    ));
  };

  const addWithdrawalRequest = (request: Omit<WithdrawalRequest, 'id' | 'status' | 'timestamp' | 'userName' | 'userAvatar'>) => {
    const user = adminUsers.find(u => u.id === request.userId);
    const newRequest: WithdrawalRequest = {
      ...request,
      id: 'wd' + Date.now(),
      status: 'pending',
      timestamp: new Date().toLocaleString(),
      userName: user?.name || 'Current User',
      userAvatar: user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
    };
    setWithdrawalRequests(prev => [newRequest, ...prev]);

    // Log Activity
    logActivity({
      type: 'withdrawal',
      userId: request.userId,
      userName: user?.name || 'Current User',
      userAvatar: user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
      amount: request.amount,
      status: 'pending'
    });
  };

  // User operations
  const updateUserBalance = (userId: string, newBalance: number) => {
    setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, balance: newBalance } : u));
  };

  const incrementUserMatches = (userId: string) => {
    setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, totalMatches: u.totalMatches + 1 } : u));
  };

  const toggleUserStatus = (userId: string) => {
    setAdminUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, status: u.status === 'active' ? 'suspended' as const : 'active' as const } : u
    ));
  };

  // Stats
  const stats = {
    totalUsers: adminUsers.length,
    totalBalance: adminUsers.reduce((sum, u) => sum + u.balance, 0),
    activeMatches: adminMatches.filter(m => m.status === 'live').length,
    pendingPayments: paymentRequests.filter(p => p.status === 'pending').length,
    pendingWithdrawals: withdrawalRequests.filter(w => w.status === 'pending' || w.status === 'processing').length,
    totalRevenue: paymentRequests.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0),
    totalWinners: winners.length,
  };

  return (
    <AdminDashboardContext.Provider value={{
      adminMatches, createMatch, updateMatch, deleteMatch, toggleMatchStatus, setMatchWinners,
      paymentRequests, approvePayment, rejectPayment, addPaymentRequest,
      withdrawalRequests, processWithdrawal, completeWithdrawal, rejectWithdrawal, addWithdrawalRequest,
      adminUsers, updateUserBalance, incrementUserMatches, toggleUserStatus,
      winners,
      stats,
      addParticipantToMatch,
      activeWinnerCeremony,
      clearWinnerCeremony,
      activities,
      logActivity
    }}>
      {children}
    </AdminDashboardContext.Provider>
  );
};

export const useAdminDashboard = () => {
  const context = useContext(AdminDashboardContext);
  if (context === undefined) {
    throw new Error('useAdminDashboard must be used within AdminDashboardProvider');
  }
  return context;
};
