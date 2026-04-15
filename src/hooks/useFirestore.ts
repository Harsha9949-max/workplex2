/**
 * Firestore integration hooks for WorkPlex Home Dashboard
 * Real-time data listeners using onSnapshot
 */

import { useState, useEffect, useMemo } from 'react';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  Unsubscribe,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';

// Types
export interface UserData {
  [key: string]: any;
  name: string;
  phone: string;
  photoURL: string;
  venture: string;
  role: string;
  streak: number;
  wallets: {
    earned: number;
    pending: number;
    bonus: number;
    savings: number;
  };
  joinedAt: any;
  totalEarned: number;
  monthlyEarnings: number;
  daysActiveThisMonth: number;
  username?: string;
  todayEarnings?: number;
}

export interface CouponData {
  code: string;
  venture: string;
  ownerId: string;
  isActive: boolean;
  activatedAt: any;
  expiresAt: any;
  usageCount: number;
  totalEarned: number;
}

export interface TaskData {
  id: string;
  title: string;
  description?: string;
  venture: string;
  role: string;
  earning: number;
  deadline: any;
  status: 'assigned' | 'accepted' | 'completed' | 'skipped';
  assignedTo: string | string[];
}

export interface Announcement {
  id: string;
  text: string;
  priority: number;
  createdAt: any;
}

/**
 * Hook to subscribe to user data in real-time
 * @param uid - User ID
 * @returns User data, loading state, error
 */
export const useUser = (uid: string | null) => {
  const [userData, setUserData] = useState<UserData | null>(null);
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
          setUserData({
            name: data.name || '',
            phone: data.phone || '',
            photoURL: data.photoURL || '',
            venture: data.venture || '',
            role: data.role || '',
            streak: data.streak || 0,
            wallets: data.wallets || { earned: 0, pending: 0, bonus: 0, savings: 0 },
            joinedAt: data.joinedAt,
            totalEarned: data.totalEarned || 0,
            monthlyEarnings: data.monthlyEarnings || 0,
            daysActiveThisMonth: data.daysActiveThisMonth || 0,
            username: data.username,
          } as UserData);
        } else {
          setError('User not found');
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

  return { userData, loading, error };
};

/**
 * Hook to subscribe to coupon data in real-time
 * @param uid - User ID
 * @returns Coupon data, loading state, error
 */
export const useCoupon = (uid: string | null) => {
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const couponRef = doc(db, 'coupons', uid);

    const unsubscribe = onSnapshot(
      couponRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setCouponData({
            code: data.code || '',
            venture: data.venture || '',
            ownerId: data.ownerId || '',
            isActive: data.isActive || false,
            activatedAt: data.activatedAt,
            expiresAt: data.expiresAt,
            usageCount: data.usageCount || 0,
            totalEarned: data.totalEarned || 0,
          } as CouponData);
        } else {
          setCouponData(null);
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

  return { couponData, loading, error };
};

/**
 * Hook to subscribe to tasks in real-time
 * @param uid - User ID
 * @param venture - User's venture
 * @param role - User's role
 * @param limitCount - Number of tasks to fetch (default: 3)
 * @returns Tasks array, loading state, error
 */
export const useTasks = (uid: string | null, venture: string | null, role: string | null, limitCount: number = 3) => {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !venture || !role) {
      setLoading(false);
      return;
    }

    const tasksRef = collection(db, 'tasks');

    // Query tasks assigned to user or to 'all', filtered by venture and role
    const q = query(
      tasksRef,
      where('status', '==', 'assigned'),
      orderBy('deadline', 'asc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TaskData[];

        // Filter tasks for this user's venture and role
        const filteredTasks = tasksData.filter((task) => {
          const matchesVenture = task.venture === venture || task.venture === 'all';
          const matchesRole = task.role === role || task.role === 'all';
          const isAssignedToUser =
            task.assignedTo === 'all' ||
            (Array.isArray(task.assignedTo) && task.assignedTo.includes(uid)) ||
            task.assignedTo === uid;

          return matchesVenture && matchesRole && isAssignedToUser;
        });

        setTasks(filteredTasks);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid, venture, role, limitCount]);

  return { tasks, loading, error };
};

/**
 * Hook to subscribe to announcements in real-time
 * @returns Announcements array, loading state, error
 */
export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const announcementsRef = collection(db, 'announcements');
    const q = query(
      announcementsRef,
      orderBy('priority', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const announcementsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Announcement[];

        setAnnouncements(announcementsData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { announcements, loading, error };
};

/**
 * Hook to calculate monthly earnings from tasks
 * @param uid - User ID
 * @returns Monthly earnings amount
 */
export const useMonthlyEarnings = (uid: string | null) => {
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('userId', '==', uid),
      where('status', '==', 'completed')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let total = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.completedAt) {
          const completedDate = data.completedAt.toDate ? data.completedAt.toDate() : new Date(data.completedAt);
          if (completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear) {
            total += data.earning || 0;
          }
        }
      });

      setMonthlyEarnings(total);
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  return { monthlyEarnings, loading };
};
