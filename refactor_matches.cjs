const fs = require('fs');
const filepath = 'src/context/AdminDashboardContext.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// Update Matches listener
const listenerCode = `
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
`;
// Replace the return block of the listener useEffect to include Matches
content = content.replace(/return \(\) => \{\s*unsubscribeUsers\(\);\s*unsubscribePayments\(\);\s*unsubscribeWithdrawals\(\);\s*unsubscribeActivities\(\);\s*\};/, listenerCode);

// Update logActivity
const logActivityReplacement = `
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
`;
content = content.replace(/const logActivity = \(activity.*?setActivities.*?;/s, logActivityReplacement);


// Replace match operations
const matchOperations = `
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
            amount: \`$\${winner.reward}\`,
            match: \`\${matchGroup} - \${matchName}\`,
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

  const addParticipantToMatch = async (matchId: string, userId: string) => {
    try {
      const m = adminMatches.find(x => x.id === matchId);
      if (m) {
        const newParticipants = [...(m.participantIds || []), userId];
        await updateDoc(doc(db, 'matches', matchId), { participantIds: newParticipants });
        
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
`;

content = content.replace(/\/\/ Match operations.*?const approvePayment/s, matchOperations + '\n  // Payment operations\n  const approvePayment');

fs.writeFileSync(filepath, content, 'utf8');
console.log('Refactored AdminDashboardContext Matches with Node');
