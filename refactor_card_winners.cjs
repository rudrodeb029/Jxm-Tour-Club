const fs = require('fs');
const filepath = 'src/context/AdminDashboardContext.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Update the type for setCardWinners and addParticipantToMatch in the Context interface
content = content.replace(
    /addParticipantToMatch: \(matchId: string, userId: string\) => void;/,
    'addParticipantToMatch: (matchId: string, userId: string, cardId?: string) => void;\n  setCardWinners: (matchId: string, cardId: string, winnerId: string | null, killWinners: {userId: string, kills: number}[]) => void;'
);

// 2. Replace addParticipantToMatch implementation
const addParticipantReplacement = `
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
            amount: \`$\${winPrize}\`,
            match: \`\${card.name} - \${matchName}\`,
            time: new Date().toISOString()
          });

          await logActivity({
            type: 'win',
            userId: winnerId,
            userName: userObj.name,
            userAvatar: userObj.avatar || '',
            amount: winPrize,
            matchName: \`\${m.name} (\${card.name})\`
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
              matchName: \`\${m.name} (\${card.name}) Kill Prize\`
            });
          }
        }
      }
      
    } catch (e) {
      console.error('Error setting card winners', e);
    }
  };
`;

content = content.replace(/const addParticipantToMatch = async \(matchId: string, userId: string\) => \{[\s\S]*?console\.error\('Error adding participant', e\);\n    \}\n  \};/, addParticipantReplacement);

// 3. Update the Provider value array
content = content.replace(
    /setMatchWinners,\n\s*addParticipantToMatch/,
    'setMatchWinners,\n        addParticipantToMatch,\n        setCardWinners'
);

fs.writeFileSync(filepath, content, 'utf8');
console.log('Refactored AdminDashboardContext Card Winners');
