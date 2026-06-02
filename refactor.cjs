const fs = require('fs');
const filepath = 'src/context/AdminDashboardContext.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Update imports
content = content.replace(
    /import \{ collection, onSnapshot \} from 'firebase\/firestore';/,
    'import { collection, onSnapshot, updateDoc, doc, deleteDoc, addDoc, query, orderBy, getDoc, runTransaction } from \'firebase/firestore\';'
);

// 2. Update hooks initialization for paymentRequests, withdrawalRequests, adminMatches, activities
const listenerCode = `
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

    return () => {
      unsubscribeUsers();
      unsubscribePayments();
      unsubscribeWithdrawals();
      unsubscribeActivities();
    };
  }, []);
`;

content = content.replace(/useEffect\(\(\) => \{\s*const unsubscribe = onSnapshot\(collection\(db, 'users'\)[\s\S]*?return \(\) => unsubscribe\(\);\s*\}, \[\]\);/, listenerCode);

// 3. Update Payment operations
const paymentOperations = `
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
`;

content = content.replace(/\/\/ Payment operations[\s\S]*?const addWithdrawalRequest = \(/, paymentOperations + '\n  const addWithdrawalRequest = (');

// 4. Update Withdrawal operations
const withdrawalOperations = `
  // Withdrawal operations
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
      if (w) {
        await updateDoc(doc(db, 'withdrawals', id), { status: 'completed' });
        
        // Deduct balance
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', w.userId);
          const userDoc = await transaction.get(userRef);
          if (userDoc.exists()) {
            const currentBalance = userDoc.data().balance || 0;
            transaction.update(userRef, { balance: currentBalance - w.amount });
          }
        });

        // Also add a transaction record
        await addDoc(collection(db, 'transactions'), {
          userId: w.userId,
          type: 'Withdraw',
          amount: -w.amount,
          date: new Date().toISOString(),
          status: 'Completed'
        });

        // Log Activity
        await addDoc(collection(db, 'activities'), {
          type: 'withdrawal',
          userId: w.userId,
          userName: w.userName,
          userAvatar: w.userAvatar,
          amount: w.amount,
          status: 'completed',
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('Error completing withdrawal', e);
    }
  };

  const rejectWithdrawal = async (id: string, note: string) => {
    try {
      await updateDoc(doc(db, 'withdrawals', id), { status: 'rejected', note });
    } catch (e) {
      console.error('Error rejecting withdrawal', e);
    }
  };

  const addWithdrawalRequest = (request: Omit<WithdrawalRequest, 'id' | 'status' | 'timestamp' | 'userName' | 'userAvatar'>) => {
     // Handled directly in Wallet
  };
`;

content = content.replace(/\/\/ Withdrawal operations[\s\S]*?const updateUserBalance = \(/, withdrawalOperations + '\n  const updateUserBalance = (');

// 5. User Management operations
const userOperations = `
  // User Management
  const updateUserBalance = async (userId: string, newBalance: number) => {
    try {
      await updateDoc(doc(db, 'users', userId), { balance: newBalance });
    } catch (e) {
      console.error('Error updating balance', e);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const user = adminUsers.find(u => u.id === userId);
      if (user) {
        const newStatus = user.status === 'active' ? 'suspended' : 'active';
        await updateDoc(doc(db, 'users', userId), { status: newStatus });
      }
    } catch (e) {
      console.error('Error toggling user status', e);
    }
  };
`;

content = content.replace(/\/\/ User Management[\s\S]*?const stats = \{/, userOperations + '\n  const stats = {');

fs.writeFileSync(filepath, content, 'utf8');
console.log('Refactored AdminDashboardContext with Node');
