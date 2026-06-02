import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { matches as defaultMatches, winners as defaultWinners } from '../data/mockData';
import type { Match, Winner, Team } from '../data/mockData';
import { collection, onSnapshot, updateDoc, doc, deleteDoc, addDoc, query, orderBy, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';


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
  innerSections?: Team[];
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
  addParticipantToMatch: (matchId: string, userId: string, cardId?: string) => void;
  setCardWinners: (matchId: string, cardId: string, winnerId: string | null, killWinners: {userId: string, kills: number}[]) => void;
  addMatchCard: (matchId: string, card: Omit<Team, 'id'>) => void;
  updateMatchCard: (matchId: string, cardId: string, cardUpdates: Partial<Team>) => void;
  deleteMatchCard: (matchId: string, cardId: string) => void;
  
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

const convertToAdminMatches = (m: Match[]): AdminMatch[] => m.map(match => {
  const innerSections: Team[] = [];
  if (match.team1) innerSections.push({ ...match.team1, id: match.team1.id || 't1' });
  if (match.team2) innerSections.push({ ...match.team2, id: match.team2.id || 't2' });
  if (match.team3) innerSections.push({ ...match.team3, id: match.team3.id || 't3' });

  return {
    ...match,
    innerSections,
    createdAt: '2026-05-01',
    scheduledStart: match.time,
    countdownMinutes: match.status === 'live' ? 600 : 0,
    participantIds: match.joinedUsers.map(u => u.id),
    liveStartedAt: match.status === 'live' ? Date.now() : undefined,
  };
});

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
          let innerSections = match.innerSections;
          if (!innerSections) {
            innerSections = [];
            if (match.team1) innerSections.push({ ...match.team1, id: match.team1.id || 't1' });
            if (match.team2) innerSections.push({ ...match.team2, id: match.team2.id || 't2' });
            if (match.team3) innerSections.push({ ...match.team3, id: match.team3.id || 't3' });
          }
          return {
            ...match,
            innerSections,
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

  
  // Firebase Listeners
  useEffect(() => {
    // Users Listener
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const firebaseUsers = snapshot.docs.map(doc => {
        const data = doc.data();
        let joinDate = new Date().toISOString().split('T')[0];
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            joinDate = data.createdAt.toDate().toISOString().split('T')[0];
          } else if (data.createdAt.seconds) {
            joinDate = new Date(data.createdAt.seconds * 1000).toISOString().split('T')[0];
          }
        }
        return {
          id: doc.id,
          name: data.name || 'Unknown',
          username: data.username || '@user',
          avatar: data.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown',
          balance: data.balance || 0,
          joinDate: joinDate,
          phone: data.phone || 'N/A',
          totalMatches: data.totalMatches || 0,
          totalWins: data.totalWins || 0,
          status: data.status || 'active'
        };
      });
      setAdminUsers(prev => {
        const merged = [...firebaseUsers];
        demoUsers.forEach(du => {
          if (!merged.find(u => u.id === du.id)) merged.push(du);
        });
        return merged;
      });
    }, (error) => console.error('Error fetching firebase users:', error));

    // Payments Listener
    const qPayments = query(collection(db, 'payments'), orderBy('timestamp', 'desc'));
    const unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPaymentRequests(prev => {
        const merged = [...payments];
        demoPayments.forEach(dp => {
          if (!merged.find(p => p.id === dp.id)) merged.push(dp);
        });
        return merged;
      });
    });

    // Withdrawals Listener
    const qWithdrawals = query(collection(db, 'withdrawals'), orderBy('timestamp', 'desc'));
    const unsubscribeWithdrawals = onSnapshot(qWithdrawals, (snapshot) => {
      const withdrawals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWithdrawalRequests(prev => {
        const merged = [...withdrawals];
        demoWithdrawals.forEach(dw => {
          if (!merged.find(w => w.id === dw.id)) merged.push(dw);
        });
        return merged;
      });
    });
    
    // Activities Listener
    const qActivities = query(collection(db, 'activities'), orderBy('timestamp', 'desc'));
    const unsubscribeActivities = onSnapshot(qActivities, (snapshot) => {
      const fbActivities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActivities(prev => {
        const merged = [...fbActivities];
        demoActivities.forEach(da => {
          if (!merged.find(a => a.id === da.id)) merged.push(da);
        });
        return merged.slice(0, 50); // Keep last 50
      });
    });

    
    // Matches Listener
    const qMatches = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
    const unsubscribeMatches = onSnapshot(qMatches, (snapshot) => {
      const fbMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdminMatches(prev => {
        const merged = [...fbMatches];
        defaultMatches.forEach(dm => {
          if (!merged.find(m => m.id === dm.id)) merged.push(dm);
        });
        return merged;
      });
    });

    // Winners Listener
    const qWinners = query(collection(db, 'winners'), orderBy('id', 'desc'));
    const unsubscribeWinners = onSnapshot(qWinners, (snapshot) => {
      const fbWinners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWinners(prev => {
        const merged = [...fbWinners];
        defaultWinners.forEach(dw => {
          if (!merged.find(w => w.id === dw.id)) merged.push(dw);
        });
        return merged;
      });
    });

    return () => {
      unsubscribeUsers();
      unsubscribePayments();
      unsubscribeWithdrawals();
      unsubscribeActivities();
      unsubscribeMatches();
      unsubscribeWinners();
    };

  }, []);


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

  
  const logActivity = async (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    try {
      await addDoc(collection(db, 'activities'), {
        ...activity,
        timestamp: new Date().toISOString()
      });
    } catch(e) {
      console.error('Error logging activity', e);
    }
  };
 // Keep last 50
  };

  
  // Match operations
  const createMatch = async (match: Omit<AdminMatch, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'matches'), {
        ...match,
        createdAt: new Date().toISOString().split('T')[0],
      });
    } catch (e) {
      console.error('Error creating match', e);
    }
  };

  const updateMatch = async (id: string, updates: Partial<AdminMatch>) => {
    try {
      await updateDoc(doc(db, 'matches', id), updates);
    } catch (e) {
      console.error('Error updating match', e);
    }
  };

  const deleteMatch = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'matches', id));
    } catch (e) {
      console.error('Error deleting match', e);
    }
  };

  const toggleMatchStatus = async (id: string, status: 'live' | 'upcoming' | 'finished') => {
    try {
      const m = adminMatches.find(x => x.id === id);
      if (m) {
        await updateDoc(doc(db, 'matches', id), { 
          status,
          liveStartedAt: status === 'live' ? (m.liveStartedAt || Date.now()) : m.liveStartedAt
        });
      }
    } catch (e) {
      console.error('Error toggling status', e);
    }
  };

  const setMatchWinners = async (matchId: string, winnersList: MatchWinner[]) => {
    try {
      const m = adminMatches.find(x => x.id === matchId);
      if (!m) return;
      
      const matchName = m.name;
      const matchGroup = m.group;
      const participants = m.participantIds || [];
      
      // Update participants totalMatches
      for (const pId of participants) {
        await runTransaction(db, async (t) => {
          const userRef = doc(db, 'users', pId);
          const uDoc = await t.get(userRef);
          if (uDoc.exists()) {
            t.update(userRef, { totalMatches: (uDoc.data().totalMatches || 0) + 1 });
          }
        });
      }

      // Update winners
      for (const winner of winnersList) {
        await runTransaction(db, async (t) => {
          const userRef = doc(db, 'users', winner.userId);
          const uDoc = await t.get(userRef);
          if (uDoc.exists()) {
            const data = uDoc.data();
            t.update(userRef, { 
              totalWins: (data.totalWins || 0) + 1,
              balance: (data.balance || 0) + winner.reward
            });
          }
        });

        // Add to winners global
        const userObj = adminUsers.find(u => u.id === winner.userId);
        if (userObj) {
          await addDoc(collection(db, 'winners'), {
            id: 'w' + Date.now() + Math.random(),
            name: userObj.name,
            avatar: userObj.avatar,
            amount: `${winner.reward}`,
            match: `${matchGroup} - ${matchName}`,
            time: new Date().toISOString()
          });
        }
        
        await logActivity({
          type: 'win',
          userId: winner.userId,
          userName: winner.userName,
          userAvatar: userObj?.avatar || '',
          amount: winner.reward,
          matchName: m.name
        });
      }
      
      // Trigger ceremony
      setActiveWinnerCeremony({
        matchId,
        matchName: m.name,
        winners: winnersList
      });

      await updateDoc(doc(db, 'matches', matchId), { winners: winnersList, status: 'finished' });

    } catch (e) {
      console.error('Error setting winners', e);
    }
  };

  
  const addParticipantToMatch = async (matchId: string, userId: string, cardId?: string) => {
    try {
      const m = adminMatches.find(x => x.id === matchId);
      if (m) {
        // Update general match participants
        const newParticipants = [...(m.participantIds || []), userId];
        
        // Update specific card participants if cardId is provided
        let innerSections = m.innerSections || [];
        if (cardId) {
          innerSections = innerSections.map(c => 
            c.id === cardId ? { ...c, participantIds: [...(c.participantIds || []), userId] } : c
          );
        }

        await updateDoc(doc(db, 'matches', matchId), { 
          participantIds: newParticipants,
          innerSections,
          team1: innerSections[0] || null,
          team2: innerSections[1] || null,
          team3: innerSections[2] || null
        });
        
        const user = adminUsers.find(u => u.id === userId);
        if (user) {
          await logActivity({
            type: 'join',
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            matchName: m.name
          });
        }
      }
    } catch (e) {
      console.error('Error adding participant', e);
    }
  };

  const setCardWinners = async (matchId: string, cardId: string, winnerId: string | null, killWinners: {userId: string, kills: number}[]) => {
    try {
      const m = adminMatches.find(x => x.id === matchId);
      if (!m) return;
      const card = (m.innerSections || []).find(c => c.id === cardId);
      if (!card) return;

      const matchName = m.name;
      const matchGroup = m.group;
      
      const winPrize = card.winPrize || 0;
      const perKillReward = card.perKill || 0;

      // Handle match winner
      if (winnerId && winPrize > 0) {
        await runTransaction(db, async (t) => {
          const userRef = doc(db, 'users', winnerId);
          const uDoc = await t.get(userRef);
          if (uDoc.exists()) {
            const data = uDoc.data();
            t.update(userRef, { 
              totalWins: (data.totalWins || 0) + 1,
              balance: (data.balance || 0) + winPrize
            });
          }
        });

        const userObj = adminUsers.find(u => u.id === winnerId);
        if (userObj) {
          await addDoc(collection(db, 'winners'), {
            id: 'w' + Date.now() + Math.random(),
            name: userObj.name,
            avatar: userObj.avatar,
            amount: `${winPrize}`,
            match: `${card.name} - ${matchName}`,
            time: new Date().toISOString()
          });

          await logActivity({
            type: 'win',
            userId: winnerId,
            userName: userObj.name,
            userAvatar: userObj.avatar || '',
            amount: winPrize,
            matchName: `${m.name} (${card.name})`
          });
        }
      }

      // Handle kill prizes
      for (const kw of killWinners) {
        const totalKillReward = perKillReward * kw.kills;
        if (totalKillReward > 0) {
          await runTransaction(db, async (t) => {
            const userRef = doc(db, 'users', kw.userId);
            const uDoc = await t.get(userRef);
            if (uDoc.exists()) {
              const data = uDoc.data();
              t.update(userRef, { balance: (data.balance || 0) + totalKillReward });
            }
          });

          const userObj = adminUsers.find(u => u.id === kw.userId);
          if (userObj) {
            await addDoc(collection(db, 'transactions'), {
              userId: kw.userId,
              type: 'Winning',
              amount: totalKillReward,
              date: new Date().toISOString(),
              status: 'Completed'
            });

            await logActivity({
              type: 'win', // Or you could make a 'kill_prize' type
              userId: kw.userId,
              userName: userObj.name,
              userAvatar: userObj.avatar || '',
              amount: totalKillReward,
              matchName: `${m.name} (${card.name}) Kill Prize`
            });
          }
        }
      }
      
    } catch (e) {
      console.error('Error setting card winners', e);
    }
  };


  const addMatchCard = async (matchId: string, card: Omit<Team, 'id'>) => {
    try {
      const m = adminMatches.find(x => x.id === matchId);
      if (m) {
        const newCard = { ...card, id: 'tc' + Date.now() + Math.random().toString(36).substr(2, 5) };
        const innerSections = [...(m.innerSections || []), newCard];
        await updateDoc(doc(db, 'matches', matchId), { 
          innerSections,
          team1: innerSections[0] || null,
          team2: innerSections[1] || null,
          team3: innerSections[2] || null
        });
      }
    } catch (e) {
      console.error('Error adding match card', e);
    }
  };

  const updateMatchCard = async (matchId: string, cardId: string, cardUpdates: Partial<Team>) => {
    try {
      const m = adminMatches.find(x => x.id === matchId);
      if (m) {
        const innerSections = (m.innerSections || []).map(c => c.id === cardId ? { ...c, ...cardUpdates } : c);
        await updateDoc(doc(db, 'matches', matchId), { 
          innerSections,
          team1: innerSections[0] || null,
          team2: innerSections[1] || null,
          team3: innerSections[2] || null
        });
      }
    } catch (e) {
      console.error('Error updating match card', e);
    }
  };

  const deleteMatchCard = async (matchId: string, cardId: string) => {
    try {
      const m = adminMatches.find(x => x.id === matchId);
      if (m) {
        const innerSections = (m.innerSections || []).filter(c => c.id !== cardId);
        await updateDoc(doc(db, 'matches', matchId), { 
          innerSections,
          team1: innerSections[0] || null,
          team2: innerSections[1] || null,
          team3: innerSections[2] || null
        });
      }
    } catch (e) {
      console.error('Error deleting match card', e);
    }
  };

  // Payment operations
  const approvePayment = async (id: string) => {
    try {
      const p = paymentRequests.find(pr => pr.id === id);
      if (p && p.status === 'pending') {
        // Update in Firebase
        await updateDoc(doc(db, 'payments', id), { status: 'approved' });
        
        // Use transaction to update user balance safely
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', p.userId);
          const userDoc = await transaction.get(userRef);
          if (userDoc.exists()) {
            const currentBalance = userDoc.data().balance || 0;
            transaction.update(userRef, { balance: currentBalance + p.amount });
          }
        });

        // Also add a transaction record
        await addDoc(collection(db, 'transactions'), {
          userId: p.userId,
          type: 'Deposit',
          amount: p.amount,
          date: new Date().toISOString(),
          status: 'Completed'
        });

        // Log Activity
        await addDoc(collection(db, 'activities'), {
          type: 'deposit',
          userId: p.userId,
          userName: p.userName,
          userAvatar: p.userAvatar,
          amount: p.amount,
          status: 'approved',
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('Error approving payment', e);
    }
  };

  const rejectPayment = async (id: string, note: string) => {
    try {
      await updateDoc(doc(db, 'payments', id), { status: 'rejected', note });
    } catch (e) {
      console.error('Error rejecting payment', e);
    }
  };

  const addPaymentRequest = (request: Omit<PaymentRequest, 'id' | 'status' | 'timestamp' | 'userName' | 'userAvatar'>) => {
    console.warn("addPaymentRequest is deprecated. Use addDoc directly in Wallet.");
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
    activeMatches: adminMatches.filter(m => m.status === 'live').reduce((total, m) => total + (m.team1 ? 1 : 0) + (m.team2 ? 1 : 0) + (m.team3 ? 1 : 0), 0),
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
      addMatchCard,
      updateMatchCard,
      deleteMatchCard,
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
