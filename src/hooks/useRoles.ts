/**
 * Phase 6 Firestore Hooks
 */

import { useState, useEffect } from 'react';
import {
  doc, onSnapshot, collection, query, where, orderBy, limit, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface TeamMemberData {
  id: string;
  memberId: string;
  memberName: string;
  memberRole: string;
  joinedAt: any;
  totalEarnings: number;
  isActive: boolean;
  level: 1 | 2;
}

export interface CommissionLogData {
  id: string;
  workerId: string;
  type: string;
  sourceWorkerId: string;
  amount: number;
  percentage: number;
  timestamp: any;
  taskId: string;
}

export const useTeamMembers = (uid: string | null) => {
  const [members, setMembers] = useState<TeamMemberData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const q = query(collection(db, 'teams', uid, 'members'), orderBy('joinedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as TeamMemberData[]);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [uid]);

  return { members, loading };
};

export const useCommissionLogs = (uid: string | null, limitCount: number = 20) => {
  const [logs, setLogs] = useState<CommissionLogData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const q = query(collection(db, 'commissionLogs'), where('workerId', '==', uid), orderBy('timestamp', 'desc'), limit(limitCount));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CommissionLogData[]);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [uid, limitCount]);

  return { logs, loading };
};

export const useReferralStats = (uid: string | null) => {
  const [stats, setStats] = useState({ directReferrals: 0, totalCommissionEarned: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const unsub = onSnapshot(doc(db, 'users', uid), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setStats({ directReferrals: d.directReferrals || 0, totalCommissionEarned: d.totalEarned || 0 });
      }
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [uid]);

  return { stats, loading };
};
