import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  time: string;
  avatar?: string;
  userName?: string;
  status?: 'sending' | 'sent';
}

interface ChatContextType {
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
  messages: Message[];
  sendMessage: (text: string, sender: 'user' | 'support') => void;
  clearMessages: () => void;
  isTyping: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Listen to Firestore messages
  useEffect(() => {
    if (!currentUser) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, 'chats', currentUser.uid, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let timeString = 'Just now';
        if (data.timestamp) {
           const date = data.timestamp.toDate ? data.timestamp.toDate() : new Date();
           timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        msgs.push({
          id: doc.id,
          text: data.text,
          sender: data.sender,
          time: timeString,
          avatar: data.avatar,
          userName: data.userName,
          status: 'sent'
        });
      });

      // Add default welcome message if chat is empty
      if (msgs.length === 0) {
        msgs.push({
          id: 'welcome-msg',
          text: 'Welcome to Esports Support! Could you please provide your in-game name or Match ID so we can assist you faster?',
          sender: 'support',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          userName: 'Support Bot',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Support',
          status: 'sent'
        });
      }

      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const botReplies = [
    "Thanks for reaching out! A live admin is grabbing their gear and will join your lobby shortly.",
    "Got it. Let me pull up your player profile. Could you drop your in-game name or registered email?",
    "Our servers are currently optimizing for faster payouts. Are you checking on a deposit or tournament winnings?",
    "Your support ticket is live! If you're asking about prize pool drops, please upload a screenshot of the post-match results screen.",
    "To keep your account safe from hackers, never share your password in chat. Official admins will never ask for your login credentials!"
  ];

  const getSmartReply = (userText: string): string => {
    const text = userText.toLowerCase();
    const links = "\n\nJoin our community:\n🎮 Discord: discord.gg/jxmtourclub\n📱 Telegram: t.me/jxmtourclub";
    
    if (text.includes('wallet') || text.includes('deposit') || text.includes('withdraw') || text.includes('money') || text.includes('balance') || text.includes('add fund')) {
      return "Wallet transactions and payouts usually hit your account within 5-15 minutes. If it's been longer, please drop your Transaction ID so we can trace it!" + links;
    }
    if (text.includes('prize') || text.includes('win') || text.includes('winner') || text.includes('pool') || text.includes('1st') || text.includes('reward')) {
      return "GG! Tournament prize pools are distributed within 10 minutes after the match officially ends. Your winnings will automatically be added to your Wallet balance." + links;
    }
    if (text.includes('admin') || text.includes('owner') || text.includes('live') || text.includes('human') || text.includes('help')) {
      return "Copy that! I'm calling in a live admin to assist you. Hold tight in the lobby..." + links;
    }
    return botReplies[Math.floor(Math.random() * botReplies.length)] + links;
  };

  const sendMessage = async (text: string, sender: 'user' | 'support') => {
    if (!currentUser) return;
    
    // Optimistic UI update could be added here if desired, 
    // but onSnapshot will handle it fast enough in most cases.
    
    try {
      const messagesRef = collection(db, 'chats', currentUser.uid, 'messages');
      await addDoc(messagesRef, {
        text,
        sender,
        timestamp: serverTimestamp(),
        avatar: sender === 'user' ? (currentUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user') : 'https://api.dicebear.com/7.x/bottts/svg?seed=Support',
        userName: sender === 'user' ? (currentUser.displayName || currentUser.email) : 'Support Bot',
      });

      if (sender === 'user') {
        setIsTyping(true);
        setTimeout(async () => {
          setIsTyping(false);
          const replyText = getSmartReply(text);
          await addDoc(messagesRef, {
            text: replyText,
            sender: 'support',
            timestamp: serverTimestamp(),
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Support',
            userName: 'Support Bot',
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };

  const clearMessages = () => {
    // We typically wouldn't allow standard users to delete their chat history in support chats,
    // but if needed, we would delete the documents from the collection.
    // For now, this is a no-op or you can implement a batch delete here.
  };

  return (
    <ChatContext.Provider value={{ isChatOpen, setIsChatOpen, messages, sendMessage, clearMessages, isTyping }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
