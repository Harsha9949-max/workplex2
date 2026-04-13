/**
 * Phase 4 Firestore Hooks
 * Real-time listeners for wallets, withdrawals, and transactions
 */

import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';

// Types
export interface WalletData {
  earned: number;
  pending: number;
  bonus: number;
  savings: number;
}

export interface UserData {
  uid: string;
  name: string;
  kycDone: boolean;
  upiId: string;
  bankAccount: string;
  savingsPercent: number;
  totalEarned: number;
  wallets: WalletData;
}

export interface WithdrawalData {
  id: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  amount: number;
  upiId: string;
  status: 'pending' | 'approved' | 'processing' | 'paid' | 'rejected' | 'failed';
  type: 'standard' | 'family_transfer';
  requestedAt: any;
  approvedAt: any;
  paidAt: any;
  rejectionReason: string;
  razorpayPayoutId: string;
  processedBy: string;
}

export interface TransactionData {
  id: string;
  type: 'credit' | 'debit' | 'pending' | 'hold';
  category: string;
  amount: number;
  wallet: 'earned' | 'pending' | 'bonus' | 'savings';
  description: string;
  timestamp: any;
  referenceId: string;
  balanceAfter: number;
}

/**
 * Hook to subscribe to user wallet data in real-time
 */
export const useWallets = (uid: string | null) => {
  const [wallets, setWallets] = useState<WalletData>({ earned: 0, pending: 0, bonus: 0, savings: 0 });
  const [userData, setUserData] = useState<Partial<UserData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(
      userRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setWallets(data.wallets || { earned: 0, pending: 0, bonus: 0, savings: 0 });
          setUserData({
            uid: docSnapshot.id,
            name: data.name || '',
            kycDone: data.kycDone || false,
            upiId: data.upiId || '',
            bankAccount: data.bankAccount || '',
            savingsPercent: data.savingsPercent || 0,
            totalEarned: data.totalEarned || 0,
          });
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  return { wallets, userData, loading, error };
};

/**
 * Hook to subscribe to user's withdrawals in real-time
 */
export const useWithdrawals = (uid: string | null) => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const withdrawalsRef = collection(db, 'withdrawals');
    const q = query(
      withdrawalsRef,
      where('workerId', '==', uid),
      orderBy('requestedAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const withdrawalsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as WithdrawalData[];
        setWithdrawals(withdrawalsData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  return { withdrawals, loading, error };
};

/**
 * Hook to subscribe to user's transactions in real-time
 */
export const useTransactions = (uid: string | null, limitCount: number = 20) => {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const transactionsRef = collection(db, 'users', uid, 'transactions');
    const q = query(transactionsRef, orderBy('timestamp', 'desc'), limit(limitCount));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const transactionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TransactionData[];
        setTransactions(transactionsData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid, limitCount]);

  return { transactions, loading, error };
};

/**
 * Hook to request withdrawal
 */
export const useRequestWithdrawal = (uid: string | null) => {
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async (
    amount: number,
    upiId: string,
    workerName: string,
    workerPhone: string,
    type: 'standard' | 'family_transfer' = 'standard'
  ) => {
    if (!uid) return { success: false, error: 'User not authenticated' };

    setRequesting(true);
    setError(null);

    try {
      const withdrawalData = {
        workerId: uid,
        workerName,
        workerPhone,
        amount,
        upiId,
        status: 'pending' as const,
        type,
        requestedAt: serverTimestamp(),
        approvedAt: null,
        paidAt: null,
        rejectionReason: '',
        razorpayPayoutId: '',
        processedBy: '',
      };

      const docRef = await addDoc(collection(db, 'withdrawals'), withdrawalData);

      // Deduct from earned wallet
      await updateDoc(doc(db, 'users', uid), {
        'wallets.earned': increment(-amount),
      });

      // Create transaction record
      await addDoc(collection(db, 'users', uid, 'transactions'), {
        type: 'debit',
        category: 'withdrawal',
        amount,
        wallet: 'earned',
        description: `Withdrawal request to ${upiId}`,
        timestamp: serverTimestamp(),
        referenceId: docRef.id,
        balanceAfter: 0, // Will be updated by listener
      });

      setRequesting(false);
      return { success: true, withdrawalId: docRef.id };
    } catch (err: any) {
      setError(err.message);
      setRequesting(false);
      return { success: false, error: err.message };
    }
  };

  return { request, requesting, error };
};

/**
 * Hook to update savings percentage
 */
export const useUpdateSavings = (uid: string | null) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (savingsPercent: number) => {
    if (!uid) return { success: false, error: 'User not authenticated' };

    setUpdating(true);
    setError(null);

    try {
      await updateDoc(doc(db, 'users', uid), {
        savingsPercent: Math.min(50, Math.max(0, savingsPercent)),
      });
      setUpdating(false);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      setUpdating(false);
      return { success: false, error: err.message };
    }
  };

  return { update, updating, error };
};

/**
 * Hook to send family transfer
 */
export const useFamilyTransfer = (uid: string | null) => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (targetUpi: string, amount: number, senderName: string) => {
    if (!uid) return { success: false, error: 'User not authenticated' };

    setSending(true);
    setError(null);

    try {
      const transferData = {
        workerId: uid,
        workerName: senderName,
        workerPhone: '',
        amount,
        upiId: targetUpi,
        status: 'pending' as const,
        type: 'family_transfer' as const,
        requestedAt: serverTimestamp(),
        approvedAt: null,
        paidAt: null,
        rejectionReason: '',
        razorpayPayoutId: '',
        processedBy: '',
      };

      const docRef = await addDoc(collection(db, 'withdrawals'), transferData);

      // Deduct from earned wallet
      await updateDoc(doc(db, 'users', uid), {
        'wallets.earned': increment(-amount),
      });

      // Create transaction record
      await addDoc(collection(db, 'users', uid, 'transactions'), {
        type: 'debit',
        category: 'family_transfer',
        amount,
        wallet: 'earned',
        description: `Transfer to ${targetUpi}`,
        timestamp: serverTimestamp(),
        referenceId: docRef.id,
        balanceAfter: 0,
      });

      setSending(false);
      return { success: true, transferId: docRef.id };
    } catch (err: any) {
      setError(err.message);
      setSending(false);
      return { success: false, error: err.message };
    }
  };

  return { send, sending, error };
};
