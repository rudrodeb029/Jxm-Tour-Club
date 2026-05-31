import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, orderBy, addDoc } from 'firebase/firestore';

export interface Transaction {
  id: string;
  type: 'Deposit' | 'Withdraw' | 'Match Join' | 'Winning';
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

interface BalanceContextType {
  balance: number;
  transactions: Transaction[];
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  deductBalance: (amount: number, type?: Transaction['type']) => boolean;
  addBalance: (amount: number, type?: Transaction['type']) => void;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setBalance(0);
      setTransactions([]);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBalance(data.balance || 0);
      }
    });

    const txRef = collection(db, 'transactions');
    const q = query(txRef, where('userId', '==', currentUser.uid), orderBy('date', 'desc'));
    
    const unsubscribeTx = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(txs);
    });

    return () => {
      unsubscribeUser();
      unsubscribeTx();
    };
  }, [currentUser]);

  const addTransaction = async (type: Transaction['type'], amount: number, status: Transaction['status'] = 'Completed') => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        type,
        amount,
        date: new Date().toISOString(),
        status
      });
    } catch (error) {
      console.error("Error adding transaction", error);
    }
  };

  const deductBalance = (amount: number, type: Transaction['type'] = 'Match Join') => {
    if (!currentUser || balance < amount) return false;
    try {
      const newBalance = balance - amount;
      updateDoc(doc(db, 'users', currentUser.uid), { balance: newBalance });
      addTransaction(type, -amount);
      return true;
    } catch (error) {
      console.error("Error deducting balance", error);
      return false;
    }
  };

  const addBalance = (amount: number, type: Transaction['type'] = 'Deposit') => {
    if (!currentUser) return;
    try {
      const newBalance = balance + amount;
      updateDoc(doc(db, 'users', currentUser.uid), { balance: newBalance });
      addTransaction(type, amount);
    } catch (error) {
      console.error("Error adding balance", error);
    }
  };

  return (
    <BalanceContext.Provider value={{ balance, transactions, setBalance, deductBalance, addBalance }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};

