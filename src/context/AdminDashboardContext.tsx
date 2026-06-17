import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { matches as defaultMatches } from '../data/mockData';
import type { Match, Winner, Team } from '../data/mockData';
import { collection, onSnapshot, updateDoc, setDoc, doc, deleteDoc, addDoc, query, orderBy, getDoc, runTransaction, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { sendGameIdNotifications } from '../services/notificationService';
import { isCardLive, parseTime, getCardStatus, getTargetDateTime } from '../utils/timeUtils';


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
  totalEarnings?: number;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  amount: number;
  transactionId: string;
  paymentMethod: string;
  accountNumber: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  isRaw?: boolean;
  displayUserId?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  amount: number;
  withdrawMethod: string;
  accountNumber: string;
  accountName: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  note?: string;
  isRaw?: boolean;
  displayUserId?: string;
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

export interface PaymentSettings {
  bkashNumber: string;
  nagadNumber: string;
  binanceId: string;
  bkashInstructions?: string;
  nagadInstructions?: string;
  binanceInstructions?: string;
}

export interface SupportSettings {
  autoReplyText: string;
  welcomeMessage: string;
  discordLink: string;
  telegramLink: string;
}

interface AdminDashboardContextType {
  // Matches
  adminMatches: AdminMatch[];
  createMatch: (match: Omit<AdminMatch, 'id' | 'createdAt'>) => void;
  updateMatch: (id: string, updates: Partial<AdminMatch>) => void;
  deleteMatch: (id: string) => void;
  toggleMatchStatus: (id: string, status: 'live' | 'upcoming' | 'finished') => void;
  setMatchWinners: (matchId: string, winners: MatchWinner[]) => void;
  addParticipantToMatch: (matchId: string, userId: string, cardId?: string, gameId?: string, entryFee?: number) => void;
  setCardWinners: (matchId: string, cardId: string, winnerId: string | null, killWinners: {userId: string, kills: number}[], customPerKill?: number) => void;
  addMatchCard: (matchId: string, card: Omit<Team, 'id'>) => void;
  updateMatchCard: (matchId: string, cardId: string, cardUpdates: Partial<Team>) => void;
  deleteMatchCard: (matchId: string, cardId: string) => void;
  removeParticipantFromCard: (matchId: string, cardId: string, userId: string) => void;
  resetMatchCard: (matchId: string, cardId: string) => Promise<void>;
  
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
  resetAllBalances: () => Promise<void>;
  resetAllTransactions: () => Promise<void>;
  
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
    totalJoins: number;
  };

  activeWinnerCeremony: WinnerCeremony | null;
  clearWinnerCeremony: () => void;
  
  // Activities
  activities: Activity[];
  logActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;

  // Payment Settings
  paymentSettings: PaymentSettings;
  updatePaymentSettings: (settings: PaymentSettings) => Promise<void>;

  // Support Settings
  supportSettings: SupportSettings;
  updateSupportSettings: (settings: SupportSettings) => Promise<void>;
}

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
  const [adminMatches, setAdminMatches] = useState<AdminMatch[]>(convertToAdminMatches(defaultMatches));
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    bkashNumber: '01700000000',
    nagadNumber: '01800000000',
    binanceId: '0x1234567890abcdef...',
    bkashInstructions: 'Send money to this Bkash personal number and enter your Transaction ID below.',
    nagadInstructions: 'Send money to this Nagad personal number and enter your Transaction ID below.',
    binanceInstructions: 'Transfer USDT to this Binance BEP-20 address and enter your TXN hash.'
  });
  const [supportSettings, setSupportSettings] = useState<SupportSettings>({
    autoReplyText: "Your support ticket is live! If you're asking about prize pool drops, please upload a screenshot of the post-match results screen.",
    welcomeMessage: "Welcome to JXM Support! How can we help you today?",
    discordLink: "discord.gg/jxmtourclub",
    telegramLink: "t.me/jxmtourclub"
  });

  const [activeWinnerCeremony, setActiveWinnerCeremony] = useState<WinnerCeremony | null>(null);
  const [globalJoinsCount, setGlobalJoinsCount] = useState(0);
  const [persistentCommunityCount, setPersistentCommunityCount] = useState(0);

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
          status: data.status || 'active',
          totalEarnings: data.totalEarnings || 0
        };
      });
      setAdminUsers(firebaseUsers);
    }, (error) => console.error('Error fetching firebase users:', error));

    // Payments Listener
    const qPayments = query(collection(db, 'payments'), orderBy('timestamp', 'desc'));
    const unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PaymentRequest[];
      setPaymentRequests(payments);
    });

    // Withdrawals Listener
    const qWithdrawals = query(collection(db, 'withdrawals'), orderBy('timestamp', 'desc'));
    const unsubscribeWithdrawals = onSnapshot(qWithdrawals, (snapshot) => {
      const withdrawals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WithdrawalRequest[];
      setWithdrawalRequests(withdrawals);
    });
    
    // Activities Listener
    const qActivities = query(collection(db, 'activities'), orderBy('timestamp', 'desc'));
    const unsubscribeActivities = onSnapshot(qActivities, (snapshot) => {
      const fbActivities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Activity[];
      setActivities(fbActivities.slice(0, 50));
    });

    
    // Matches Listener
    const qMatches = collection(db, 'matches');
    const unsubscribeMatches = onSnapshot(qMatches, (snapshot) => {
      const fbMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdminMatch[];
      
      // Sort matches in-memory to prevent documents without 'createdAt' field from being filtered out by Firestore
      fbMatches.sort((a, b) => {
        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        return dateB.localeCompare(dateA);
      });

      const converted = convertToAdminMatches(defaultMatches);
      
      const merged = converted.map(dm => {
        const fbMatch = fbMatches.find(m => m.id === dm.id);
        if (fbMatch) {
          // Merge Firebase dynamic data over the static mock data
          return {
            ...dm,
            ...fbMatch,
            // Keep innerSections from Firebase if it has them, else use mock
            innerSections: fbMatch.innerSections !== undefined 
              ? fbMatch.innerSections 
              : dm.innerSections,
          };
        }
        return dm; // Not in Firebase yet, use mock completely
      });
      
      // Also add any matches that are completely new in Firebase (not in defaultMatches)
      fbMatches.forEach(fb => {
        if (!merged.find(m => m.id === fb.id)) {
          merged.push(fb);
        }
      });
      
      // Filter out deleted matches and deleted cards from active display
      const filtered = merged
        .filter(m => !(m as any).isDeleted)
        .map(m => ({
          ...m,
          innerSections: (m.innerSections || []).filter((c: any) => !c.isDeleted)
        }));
      
      setAdminMatches(filtered);
    });

    // Winners Listener
    const qWinners = query(collection(db, 'winners'), orderBy('id', 'desc'));
    const unsubscribeWinners = onSnapshot(qWinners, (snapshot) => {
      const fbWinners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Winner[];
      setWinners(fbWinners);
    });

    // Payment Settings Listener
    const unsubscribePaymentSettings = onSnapshot(doc(db, 'payment_settings', 'accounts'), (docSnap) => {
      if (docSnap.exists()) {
        setPaymentSettings(docSnap.data() as PaymentSettings);
      } else {
        const defaults: PaymentSettings = {
          bkashNumber: '01700000000',
          nagadNumber: '01800000000',
          binanceId: '0x1234567890abcdef...',
          bkashInstructions: 'Send money to this Bkash personal number and enter your Transaction ID below.',
          nagadInstructions: 'Send money to this Nagad personal number and enter your Transaction ID below.',
          binanceInstructions: 'Transfer USDT to this Binance BEP-20 address and enter your TXN hash.'
        };
        setDoc(doc(db, 'payment_settings', 'accounts'), defaults);
      }
    }, (error) => console.error('Error fetching payment settings:', error));

    // Support Settings Listener
    const unsubscribeSupportSettings = onSnapshot(doc(db, 'support_settings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        setSupportSettings(docSnap.data() as SupportSettings);
      } else {
        const defaults: SupportSettings = {
          autoReplyText: "Your support ticket is live! If you're asking about prize pool drops, please upload a screenshot of the post-match results screen.",
          welcomeMessage: "Welcome to JXM Support! How can we help you today?",
          discordLink: "discord.gg/jxmtourclub",
          telegramLink: "t.me/jxmtourclub"
        };
        setDoc(doc(db, 'support_settings', 'config'), defaults);
      }
    });

    // Global Joins Listener
    const unsubscribeJoins = onSnapshot(collection(db, 'user_joins'), (snapshot) => {
      setGlobalJoinsCount(snapshot.size);
    });

    // Persistent Global Stats Listener
    const unsubscribeGlobalStats = onSnapshot(doc(db, 'stats', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setPersistentCommunityCount(docSnap.data().totalJoins || 0);
      } else {
        // Initialize global stats doc if it doesn't exist
        setDoc(doc(db, 'stats', 'global'), { totalJoins: 0 }, { merge: true });
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribePayments();
      unsubscribeWithdrawals();
      unsubscribeActivities();
      unsubscribeMatches();
      unsubscribeWinners();
      unsubscribePaymentSettings();
      unsubscribeSupportSettings();
      unsubscribeJoins();
      unsubscribeGlobalStats();
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
        // Only auto-start if match is explicitly marked as 'upcoming'
        if (m.status === 'upcoming') {
          try {
            const matchTimeStr = m.time;
            if (!matchTimeStr) return m;

            const { hours: targetH, minutes: targetM, seconds: targetS } = parseTime(matchTimeStr);
            const target = new Date();
            target.setHours(targetH, targetM, targetS, 0);
            
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

    const interval = setInterval(checkUpcomingMatches, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [adminMatches]);

  // Auto-conclude finished sub-matches to prevent auto-restart
  useEffect(() => {
    const checkExpiredCards = async () => {
      const now = Date.now();
      for (const match of adminMatches) {
        if (match.status === 'finished') continue;

        let needsUpdate = false;
        const updatedSections = (match.innerSections || []).map(card => {
          if (!card.startTime || card.isConcluded) return card;

          const targetTime = getTargetDateTime(card.startTime);
          const diff = targetTime.getTime() - now;

          if (diff <= 0) {
            const durationMs = (Number(card.liveDuration) || 60) * 60 * 1000;
            if (Math.abs(diff) >= durationMs) {
              needsUpdate = true;
              return { ...card, isConcluded: true };
            }
          }
          return card;
        });

        if (needsUpdate) {
          try {
            await updateDoc(doc(db, 'matches', match.id), { innerSections: updatedSections });
          } catch (e) {
            console.error("Error auto-concluding card:", e);
          }
        }
      }
    };

    const timer = setInterval(checkExpiredCards, 60000); // Check every minute
    return () => clearInterval(timer);
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

  
  // Match operations
  const createMatch = async (match: Omit<AdminMatch, 'id' | 'createdAt'>) => {
    try {
      const cleanMatch = JSON.parse(JSON.stringify(match));
      await addDoc(collection(db, 'matches'), {
        ...cleanMatch,
        createdAt: new Date().toISOString().split('T')[0],
      });
    } catch (e) {
      console.error('Error creating match', e);
    }
  };

  const updateMatch = async (id: string, updates: Partial<AdminMatch>) => {
    try {
      const cleanUpdates = JSON.parse(JSON.stringify(updates));
      await setDoc(doc(db, 'matches', id), cleanUpdates, { merge: true });
    } catch (e) {
      console.error('Error updating match', e);
    }
  };

  const deleteMatch = async (id: string) => {
    try {
      const m = adminMatches.find(x => x.id === id);

      // Backfill: Ensure all participants have permanent user_joins records before archiving
      if (m) {
        for (const card of (m.innerSections || [])) {
          for (const userId of (card.participantIds || [])) {
            try {
              const existingQ = query(
                collection(db, 'user_joins'),
                where('userId', '==', userId),
                where('matchId', '==', id),
                where('cardId', '==', card.id)
              );
              const existing = await getDocs(existingQ);
              if (existing.empty) {
                const slotIdx = (card.participantIds || []).indexOf(userId);
                await addDoc(collection(db, 'user_joins'), {
                  userId,
                  matchId: id,
                  cardId: card.id,
                  matchName: m.name,
                  cardName: card.name,
                  entryType: card.entryType || m.group || 'Solo',
                  entryFee: card.entryFee || 0,
                  gameId: (card.participantGameIds || {})[userId] || '',
                  timestamp: new Date().toISOString(),
                  status: 'finished',
                  startDate: card.startDate || '',
                  startTime: card.startTime || m.time || '',
                  slotNumber: slotIdx !== -1 ? slotIdx + 1 : null
                });
              }
            } catch (backfillErr) {
              console.error('Error backfilling user_joins on delete:', backfillErr);
            }
          }
        }
      }

      // Archive the match instead of deleting it so history data is preserved
      await setDoc(doc(db, 'matches', id), { 
        isDeleted: true, 
        status: 'finished',
        deletedAt: new Date().toISOString()
      }, { merge: true });
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
      
      // Update winners
      for (const winner of winnersList) {
        await runTransaction(db, async (t) => {
          const userRef = doc(db, 'users', winner.userId);
          const uDoc = await t.get(userRef);
          if (uDoc.exists()) {
            const data = uDoc.data();
            t.update(userRef, { 
              totalWins: (data.totalWins || 0) + 1,
              balance: (data.balance || 0) + winner.reward,
              totalEarnings: (data.totalEarnings || 0) + winner.reward
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
            time: new Date().toISOString(),
            type: 'win_prize',
            userId: winner.userId,
            matchName: matchName,
            date: new Date().toISOString(),
            prize: `${winner.reward}`,
            kills: 0
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

  
  const addParticipantToMatch = async (matchId: string, userId: string, cardId?: string, gameId?: string, explicitEntryFee?: number) => {
    try {
      const m = adminMatches.find(x => x.id === matchId);
      if (m) {
        // Update general match participants
        const newParticipants = [...(m.participantIds || []), userId];
        const newParticipantGameIds = {
          ...(m.participantGameIds || {}),
          [userId]: gameId || ''
        };
        
        // Update specific card participants if cardId is provided
        let innerSections = m.innerSections || [];
        if (cardId) {
          innerSections = innerSections.map(c => {
            if (c.id === cardId) {
              const participantIds = [...(c.participantIds || []), userId];
              const participantGameIds = {
                ...(c.participantGameIds || {}),
                [userId]: gameId || ''
              };
              return { ...c, participantIds, participantGameIds };
            }
            return c;
          });
        }

        await setDoc(doc(db, 'matches', matchId), { 
          participantIds: newParticipants,
          participantGameIds: newParticipantGameIds,
          innerSections,
          team1: innerSections[0] || null,
          team2: innerSections[1] || null,
          team3: innerSections[2] || null
        }, { merge: true });

        // Record Join in a permanent collection so it survives match/card deletion
        const card = cardId ? (m.innerSections || []).find(c => c.id === cardId) : null;

        let joinEntryFee = explicitEntryFee !== undefined ? explicitEntryFee : 0;
        if (joinEntryFee === 0) {
           if (card && card.entryFee !== undefined) {
             joinEntryFee = Number(card.entryFee);
           } else if (m.bids && m.bids.length > 0) {
             const firstBid = m.bids[0];
             joinEntryFee = typeof firstBid === 'number' ? firstBid : parseFloat(String(firstBid).replace(/[^0-9.-]+/g, '')) || 0;
           }
        }

        let calculatedSlot = 1;
        if (cardId && card) {
          calculatedSlot = (card.participantIds || []).length + 1;
        } else {
          calculatedSlot = (m.participantIds || []).length + 1;
        }

        await addDoc(collection(db, 'user_joins'), {
          userId,
          matchId,
          cardId: cardId || null,
          matchName: m.name,
          cardName: card?.name || m.name,
          entryType: card?.entryType || m.group || 'Solo',
          entryFee: joinEntryFee,
          gameId: gameId || '',
          timestamp: new Date().toISOString(),
          status: 'joined',
          startDate: card?.startDate || '',
          startTime: card?.startTime || m.time || '',
          slotNumber: calculatedSlot
        });

        // Update user's totalMatches count in Firestore immediately
        const userRef = doc(db, 'users', userId);
        runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (userDoc.exists()) {
            transaction.update(userRef, { totalMatches: (userDoc.data().totalMatches || 0) + 1 });
          }
        }).catch(err => console.error("Error updating user totalMatches:", err));

        // Increment global community joins counter
        const statsRef = doc(db, 'stats', 'global');
        runTransaction(db, async (transaction) => {
          const statsDoc = await transaction.get(statsRef);
          if (statsDoc.exists()) {
            transaction.update(statsRef, { totalJoins: (statsDoc.data().totalJoins || 0) + 1 });
          } else {
            transaction.set(statsRef, { totalJoins: 1 });
          }
        }).catch(err => console.error("Error updating global joins stat:", err));

        const userObj = adminUsers.find(u => u.id === userId);
        await logActivity({
          type: 'join',
          userId: userId,
          userName: userObj?.name || 'A Player',
          userAvatar: userObj?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          amount: joinEntryFee,
          matchName: m.name
        });
      }
    } catch (e) {
      console.error('Error adding participant', e);
    }
  };

  const setCardWinners = async (matchId: string, cardId: string, winnerId: string | null, killWinners: {userId: string, kills: number}[], customPerKill?: number) => {
    try {
      const m = adminMatches.find(x => x.id === matchId);
      if (!m) return;
      const card = (m.innerSections || []).find(c => c.id === cardId);
      if (!card) return;

      const matchName = m.name;
      const matchGroup = m.group;
      
      const winPrize = card.winPrize || 0;
      const perKillReward = customPerKill !== undefined ? customPerKill : (card.perKill || 0);

      // Update perKill reward on the card in Firestore if customPerKill is provided and differs
      if (customPerKill !== undefined && customPerKill !== (card.perKill || 0)) {
        const updatedSections = (m.innerSections || []).map(c => {
          if (c.id === cardId) {
            return { ...c, perKill: customPerKill };
          }
          return c;
        });
        await updateDoc(doc(db, 'matches', matchId), { innerSections: updatedSections });
      }

      // Handle match winner
      if (winnerId && winPrize > 0) {
        await runTransaction(db, async (t) => {
          const userRef = doc(db, 'users', winnerId);
          const uDoc = await t.get(userRef);
          if (uDoc.exists()) {
            const data = uDoc.data();
            t.update(userRef, {
              totalWins: (data.totalWins || 0) + 1,
              balance: (data.balance || 0) + winPrize,
              totalEarnings: (data.totalEarnings || 0) + winPrize
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
            time: new Date().toISOString(),
            type: 'win_prize',
            userId: winnerId,
            matchName: matchName,
            date: new Date().toISOString(),
            prize: `${winPrize}`,
            kills: 0
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
              t.update(userRef, {
                balance: (data.balance || 0) + totalKillReward,
                totalEarnings: (data.totalEarnings || 0) + totalKillReward
              });
            }
          });

          const userObj = adminUsers.find(u => u.id === kw.userId);
          if (userObj) {
            await addDoc(collection(db, 'winners'), {
              id: 'w' + Date.now() + Math.random(),
              name: userObj.name,
              avatar: userObj.avatar,
              amount: `${totalKillReward}`,
              match: `${card.name} - ${matchName} (Kill Reward)`,
              time: new Date().toISOString(),
              type: 'kill_reward',
              userId: kw.userId,
              kills: kw.kills,
              matchName: matchName,
              date: new Date().toISOString(),
              prize: `${totalKillReward}`
            });

            await addDoc(collection(db, 'transactions'), {
              userId: kw.userId,
              type: 'Winning',
              amount: totalKillReward,
              date: new Date().toISOString(),
              status: 'Completed'
            });

            await logActivity({
              type: 'win',
              userId: kw.userId,
              userName: userObj.name,
              userAvatar: userObj.avatar || '',
              amount: totalKillReward,
              matchName: `${m.name} (${card.name}) Kill Prize`
            });
          }
        }
      }

      // Mark the card as concluded so it doesn't auto-restart
      const updatedSections = (m.innerSections || []).map(c => {
        if (c.id === cardId) {
          return { ...c, isConcluded: true };
        }
        return c;
      });

      await updateDoc(doc(db, 'matches', matchId), { innerSections: updatedSections });
      
    } catch (e) {
      console.error('Error setting card winners', e);
    }
  };


  const addMatchCard = async (matchId: string, card: Omit<Team, 'id'>) => {
    try {
      const m = adminMatches.find(x => x.id === matchId);
      if (m) {
        const newCard = {
          ...card,
          id: 'tc' + Date.now() + Math.random().toString(36).substr(2, 5),
          participantIds: [],
          startDate: card.startDate || new Date().toISOString().split('T')[0]
        };
        const innerSections = [...(m.innerSections || []), newCard];
        const cleanInnerSections = JSON.parse(JSON.stringify(innerSections));
        await setDoc(doc(db, 'matches', matchId), { 
          innerSections: cleanInnerSections,
          team1: cleanInnerSections[0] || null,
          team2: cleanInnerSections[1] || null,
          team3: cleanInnerSections[2] || null
        }, { merge: true });
      }
    } catch (e) {
      console.error('Error adding match card', e);
      throw e;
    }
  };

  const updateMatchCard = async (matchId: string, cardId: string, cardUpdates: Partial<Team>) => {
    try {
      const m = adminMatches.find(x => x.id === matchId);
      if (m) {
        // Find the original card before update to check if gameId/password is newly set
        const originalCard = (m.innerSections || []).find(c => c.id === cardId);

        const innerSections = (m.innerSections || []).map(c => {
          if (c.id === cardId) {
            const updated = { ...c, ...cardUpdates };

            // Auto-set startDate to today if admin provided a time but no date
            if (cardUpdates.startTime && !updated.startDate) {
              updated.startDate = new Date().toISOString().split('T')[0];
            }

            // If start time or date was changed, reset conclusion state
            if ((cardUpdates.startTime && cardUpdates.startTime !== c.startTime) ||
                (cardUpdates.startDate && cardUpdates.startDate !== c.startDate)) {
              updated.isConcluded = false;
            }
            return updated;
          }
          return c;
        });
        const cleanInnerSections = JSON.parse(JSON.stringify(innerSections));
        
        await setDoc(doc(db, 'matches', matchId), { 
          innerSections: cleanInnerSections,
          team1: cleanInnerSections[0] || null,
          team2: cleanInnerSections[1] || null,
          team3: cleanInnerSections[2] || null
        }, { merge: true });

        // Send push notifications if gameId or gamePassword was set/changed
        const newGameId = cardUpdates.gameId || '';
        const newGamePassword = cardUpdates.gamePassword || '';
        const oldGameId = originalCard?.gameId || '';
        const oldGamePassword = originalCard?.gamePassword || '';
        const hasNewGameId = newGameId && newGameId !== oldGameId;
        const hasNewPassword = newGamePassword && newGamePassword !== oldGamePassword;

        if (hasNewGameId || hasNewPassword) {
          const updatedCard = cleanInnerSections.find((c: any) => c.id === cardId);
          const participantIds = updatedCard?.participantIds || originalCard?.participantIds || [];
          if (participantIds.length > 0) {
            sendGameIdNotifications(
              participantIds,
              matchId,
              cardId,
              m.name || m.title || 'Match',
              updatedCard?.name || originalCard?.name || 'Card',
              newGameId || oldGameId,
              newGamePassword || oldGamePassword
            ).catch(err => console.error('Error sending game ID notifications:', err));
          }
        }
      }
    } catch (e) {
      console.error('Error updating match card', e);
      throw e;
    }
  };

  const deleteMatchCard = async (matchId: string, cardId: string) => {
    try {
      const m = adminMatches.find(x => x.id === matchId);
      if (m) {
        // Archive the card instead of removing it so history data is preserved
        const innerSections = (m.innerSections || []).map(c => 
          c.id === cardId ? { ...c, isDeleted: true } : c
        );
        const cleanInnerSections = JSON.parse(JSON.stringify(innerSections));
        await setDoc(doc(db, 'matches', matchId), { 
          innerSections: cleanInnerSections,
          team1: cleanInnerSections[0] || null,
          team2: cleanInnerSections[1] || null,
          team3: cleanInnerSections[2] || null
        }, { merge: true });
      }
    } catch (e) {
      console.error('Error deleting match card', e);
      throw e;
    }
  };

  const removeParticipantFromCard = async (matchId: string, cardId: string, userId: string) => {
    try {
      const m = adminMatches.find(x => x.id === matchId);
      if (!m) return;
      const card = (m.innerSections || []).find(c => c.id === cardId);
      if (!card) return;

      // Remove from card participants
      const innerSections = (m.innerSections || []).map(c => 
        c.id === cardId ? { ...c, participantIds: (c.participantIds || []).filter(p => p !== userId) } : c
      );
      // Remove from match participants
      const newParticipants = (m.participantIds || []).filter(p => p !== userId);

      await setDoc(doc(db, 'matches', matchId), { 
        innerSections,
        participantIds: newParticipants,
        currentParticipants: Math.max(0, (m.currentParticipants || 0) - 1),
        team1: innerSections[0] || null,
        team2: innerSections[1] || null,
        team3: innerSections[2] || null
      }, { merge: true });

      // Refund entry fee to user
      const entryFee = card.entryFee || 0;
      if (entryFee > 0) {
        await runTransaction(db, async (t) => {
          const userRef = doc(db, 'users', userId);
          const uDoc = await t.get(userRef);
          if (uDoc.exists()) {
            const data = uDoc.data();
            t.update(userRef, { balance: (data.balance || 0) + entryFee });
          }
        });

        // Log refund transaction
        await addDoc(collection(db, 'transactions'), {
          userId: userId,
          type: 'Refund',
          amount: entryFee,
          date: new Date().toISOString(),
          status: 'Completed'
        });
      }

      const user = adminUsers.find(u => u.id === userId);
      if (user) {
        await logActivity({
          type: 'withdrawal' as const,
          userId: userId,
          userName: user.name,
          userAvatar: user.avatar || '',
          amount: entryFee,
          matchName: `${m.name} (${card.name}) Refund`
        });
      }
    } catch (e) {
      console.error('Error removing participant from card', e);
    }
  };

  const resetMatchCard = async (matchId: string, cardId: string) => {
    try {
      const m = adminMatches.find(x => x.id === matchId);
      if (!m) return;
      const card = (m.innerSections || []).find(c => c.id === cardId);
      if (!card) return;

      const cardParticipants = card.participantIds || [];
      const entryFee = card.entryFee || 0;

      // Refund all participants and ensure permanent user_joins records exist
      for (const userId of cardParticipants) {
        // Backfill: Create user_joins entry if it doesn't exist yet
        // (covers joins that happened before Firestore rules were deployed)
        try {
          const existingQ = query(
            collection(db, 'user_joins'),
            where('userId', '==', userId),
            where('matchId', '==', matchId),
            where('cardId', '==', cardId)
          );
          const existingSnap = await getDocs(existingQ);
          if (existingSnap.empty) {
            const slotIdx = (card.participantIds || []).indexOf(userId);
            await addDoc(collection(db, 'user_joins'), {
              userId,
              matchId,
              cardId,
              matchName: m.name,
              cardName: card.name,
              entryType: card.entryType || m.group || 'Solo',
              entryFee: entryFee,
              gameId: (card.participantGameIds || {})[userId] || '',
              timestamp: new Date().toISOString(),
              status: 'refunded',
              startDate: card.startDate || '',
              startTime: card.startTime || m.time || '',
              slotNumber: slotIdx !== -1 ? slotIdx + 1 : null
            });
          } else {
            // Update existing records to refunded status
            for (const joinDoc of existingSnap.docs) {
              await updateDoc(doc(db, 'user_joins', joinDoc.id), { status: 'refunded' });
            }
          }
        } catch (joinErr) {
          console.error('Error handling user_joins on reset:', joinErr);
        }

        // Refund entry fee
        if (entryFee > 0) {
          await runTransaction(db, async (t) => {
            const userRef = doc(db, 'users', userId);
            const uDoc = await t.get(userRef);
            if (uDoc.exists()) {
              const data = uDoc.data();
              t.update(userRef, { balance: (data.balance || 0) + entryFee });
            }
          });

          await addDoc(collection(db, 'transactions'), {
            userId: userId,
            type: 'Refund',
            amount: entryFee,
            date: new Date().toISOString(),
            status: 'Completed'
          });
        }
      }

      // Keep the same card ID so user_joins records still link correctly
      // Clear participants and reset card stats but preserve identity
      const innerSections = (m.innerSections || []).map(c => 
        c.id === cardId ? { 
          ...c, 
          participantIds: [],
          participantGameIds: {},
          kills: 0,
          damage: 0, 
          headshots: 0, 
          rank: 0,
          isConcluded: false,
          startTime: '',
          startDate: ''
        } : c
      );

      // Remove card participants from the main match list
      const newParticipants = (m.participantIds || []).filter(p => !cardParticipants.includes(p));

      // Reset match status to 'upcoming' if it was 'finished'
      let newStatus = m.status;
      if (m.status === 'finished') {
        newStatus = 'upcoming';
      }

      // Do NOT set winners: null — preserve winner data
      await setDoc(doc(db, 'matches', matchId), { 
        status: newStatus,
        innerSections,
        participantIds: newParticipants,
        currentParticipants: Math.max(0, newParticipants.length),
        totalBidsCount: `${Math.max(0, newParticipants.length)} Players joined`,
        team1: innerSections[0] || null,
        team2: innerSections[1] || null,
        team3: innerSections[2] || null
      }, { merge: true });

    } catch (e) {
      console.error('Error resetting card', e);
      throw e;
    }
  };

  // Payment operations
  const approvePayment = async (id: string) => {
    try {
      const p = paymentRequests.find(pr => pr.id === id);
      if (p && p.status === 'pending') {
        const actualAmount = p.isRaw ? p.amount : p.amount * 126;
        // Update in Firebase
        await updateDoc(doc(db, 'payments', id), { status: 'approved' });
        
        // Use transaction to update user balance safely
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', p.userId);
          const userDoc = await transaction.get(userRef);
          if (userDoc.exists()) {
            const currentBalance = userDoc.data().balance || 0;
            transaction.update(userRef, { balance: currentBalance + actualAmount });
          }
        });

        // Also add a transaction record
        await addDoc(collection(db, 'transactions'), {
          userId: p.userId,
          type: 'Deposit',
          amount: actualAmount,
          date: new Date().toISOString(),
          status: 'Completed'
        });

        // Log Activity
        await addDoc(collection(db, 'activities'), {
          type: 'deposit',
          userId: p.userId,
          userName: p.userName,
          userAvatar: p.userAvatar,
          amount: actualAmount,
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

  const processWithdrawal = async (id: string) => {
    try {
      await updateDoc(doc(db, 'withdrawals', id), { status: 'processing' });
    } catch (e) {
      console.error('Error processing withdrawal', e);
    }
  };

  const completeWithdrawal = async (id: string) => {
    try {
      const w = withdrawalRequests.find(wr => wr.id === id);
      if (w && (w.status === 'pending' || w.status === 'processing')) {
        const actualAmount = w.isRaw ? w.amount : w.amount * 126;
        await updateDoc(doc(db, 'withdrawals', id), { status: 'completed' });

        // Add transaction record
        await addDoc(collection(db, 'transactions'), {
          userId: w.userId,
          type: 'Withdrawal',
          amount: actualAmount,
          date: new Date().toISOString(),
          status: 'Completed'
        });

        await logActivity({
          type: 'withdrawal',
          userId: w.userId,
          userName: w.userName,
          userAvatar: w.userAvatar,
          amount: actualAmount,
          status: 'completed'
        });
      }
    } catch (e) {
      console.error('Error completing withdrawal', e);
    }
  };

  const rejectWithdrawal = async (id: string, note: string) => {
    try {
      const w = withdrawalRequests.find(wr => wr.id === id);
      if (w && (w.status === 'pending' || w.status === 'processing')) {
        const actualAmount = w.isRaw ? w.amount : w.amount * 126;
        await updateDoc(doc(db, 'withdrawals', id), { status: 'rejected', note });

        // Refund balance to user since it was deducted immediately when requested
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', w.userId);
          const userDoc = await transaction.get(userRef);
          if (userDoc.exists()) {
            const currentBalance = userDoc.data().balance || 0;
            transaction.update(userRef, { balance: currentBalance + actualAmount });
          }
        });
      }
    } catch (e) {
      console.error('Error rejecting withdrawal', e);
    }
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
  const updateUserBalance = async (userId: string, newBalance: number) => {
    try {
      await updateDoc(doc(db, 'users', userId), { balance: newBalance });
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, balance: newBalance } : u));
    } catch (e) {
      console.error('Error updating user balance:', e);
    }
  };

  const incrementUserMatches = (userId: string) => {
    setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, totalMatches: u.totalMatches + 1 } : u));
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const u = adminUsers.find(x => x.id === userId);
      if (u) {
        const newStatus = u.status === 'active' ? 'suspended' : 'active';
        await updateDoc(doc(db, 'users', userId), { status: newStatus });
        setAdminUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        ));
      }
    } catch (e) {
      console.error('Error toggling user status:', e);
    }
  };

  const resetAllBalances = async () => {
    try {
      const promises = adminUsers.map(u => updateDoc(doc(db, 'users', u.id), { balance: 0 }));
      await Promise.all(promises);
      setAdminUsers(prev => prev.map(u => ({ ...u, balance: 0 })));
    } catch (e) {
      console.error('Error resetting all user balances:', e);
      throw e;
    }
  };

  const resetAllTransactions = async () => {
    try {
      // 1. Reset all user balances to 0 in Firestore & local state
      const balancePromises = adminUsers.map(u => updateDoc(doc(db, 'users', u.id), { balance: 0 }));
      await Promise.all(balancePromises);
      setAdminUsers(prev => prev.map(u => ({ ...u, balance: 0 })));

      // 2. Delete all documents in the 'winners' collection
      const winnersSnap = await getDocs(collection(db, 'winners'));
      const winnersPromises = winnersSnap.docs.map(docSnap => deleteDoc(doc(db, 'winners', docSnap.id)));
      await Promise.all(winnersPromises);

      // 3. Delete all documents in the 'transactions' collection
      const qSnap = await getDocs(collection(db, 'transactions'));
      const promises = qSnap.docs.map(docSnap => deleteDoc(doc(db, 'transactions', docSnap.id)));
      await Promise.all(promises);

      // 4. Delete all documents in the 'payments' collection
      const paySnap = await getDocs(collection(db, 'payments'));
      const payPromises = paySnap.docs.map(docSnap => deleteDoc(doc(db, 'payments', docSnap.id)));
      await Promise.all(payPromises);

      // 5. Delete all documents in the 'withdrawals' collection
      const drawSnap = await getDocs(collection(db, 'withdrawals'));
      const drawPromises = drawSnap.docs.map(docSnap => deleteDoc(doc(db, 'withdrawals', docSnap.id)));
      await Promise.all(drawPromises);
    } catch (e) {
      console.error('Error resetting all transactions:', e);
      throw e;
    }
  };

  const updatePaymentSettings = async (settings: PaymentSettings) => {
    try {
      await setDoc(doc(db, 'payment_settings', 'accounts'), settings);
    } catch (e) {
      console.error('Error updating payment settings:', e);
    }
  };

  const updateSupportSettings = async (settings: SupportSettings) => {
    try {
      await setDoc(doc(db, 'support_settings', 'config'), settings);
    } catch (e) {
      console.error('Error updating support settings:', e);
    }
  };


  // Stats
  const stats = {
    totalUsers: adminUsers.length,
    totalBalance: adminUsers.reduce((sum, u) => sum + u.balance, 0),
    activeMatches: adminMatches.reduce((total, m) => {
      if (m.status === 'finished') return total;

      const cards = m.innerSections || [];
      if (cards.length > 0) {
        const activeCount = cards.filter(c => {
          const s = getCardStatus(c, m.status);
          return s === 'live' || s === 'upcoming';
        }).length;
        return total + activeCount;
      }

      // Fallback for older match structure
      let count = 0;
      if (m.team1 && (getCardStatus(m.team1, m.status) === 'live' || getCardStatus(m.team1, m.status) === 'upcoming')) count++;
      if (m.team2 && (getCardStatus(m.team2, m.status) === 'live' || getCardStatus(m.team2, m.status) === 'upcoming')) count++;
      if (m.team3 && (getCardStatus(m.team3, m.status) === 'live' || getCardStatus(m.team3, m.status) === 'upcoming')) count++;

      return total + count;
    }, 0),
    pendingPayments: paymentRequests.filter(p => p.status === 'pending').length,
    pendingWithdrawals: withdrawalRequests.filter(w => w.status === 'pending' || w.status === 'processing').length,
    totalRevenue: paymentRequests.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.isRaw ? p.amount : p.amount * 126), 0),
    totalWinners: winners.length,
    totalJoins: Math.max(
      persistentCommunityCount,
      globalJoinsCount,
      winners.length,
      adminUsers.reduce((sum, u) => sum + (u.totalMatches || 0), 0)
    ),
  };

  return (
    <AdminDashboardContext.Provider value={{
      adminMatches, createMatch, updateMatch, deleteMatch, toggleMatchStatus, setMatchWinners,
      paymentRequests, approvePayment, rejectPayment, addPaymentRequest,
      withdrawalRequests, processWithdrawal, completeWithdrawal, rejectWithdrawal, addWithdrawalRequest,
      adminUsers, updateUserBalance, incrementUserMatches, toggleUserStatus, resetAllBalances, resetAllTransactions,
      winners,
      stats,
      addParticipantToMatch,
      setCardWinners,
      addMatchCard,
      updateMatchCard,
      deleteMatchCard,
      removeParticipantFromCard,
      resetMatchCard,
      activeWinnerCeremony,
      clearWinnerCeremony,
      activities,
      logActivity,
      paymentSettings,
      updatePaymentSettings,
      supportSettings,
      updateSupportSettings
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
