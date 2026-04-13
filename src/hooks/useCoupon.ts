/**
 * Phase 5 Firestore Hooks
 * Real-time listeners for coupons and coupon usages
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
  startAfter,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

// Types
export interface CouponData {
  id: string;
  code: string;
  venture: string;
  ownerId: string;
  ownerName: string;
  isActive: boolean;
  activatedAt: any;
  expiresAt: any;
  usageCount: number;
  totalEarned: number;
  createdAt: any;
}

export interface CouponUsageData {
  id: string;
  couponCode: string;
  ownerId: string;
  buyerId: string;
  productId: string;
  productName: string;
  productPrice: number;
  margin: number;
  commissionAmount: number;
  usedAt: any;
  released: boolean;
  releaseAt: any;
}

/**
 * Hook to subscribe to user's coupon in real-time
 */
export const useCoupon = (uid: string | null) => {
  const [coupon, setCoupon] = useState<CouponData | null>(null);
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
          setCoupon({
            id: docSnapshot.id,
            code: data.code || '',
            venture: data.venture || '',
            ownerId: data.ownerId || '',
            ownerName: data.ownerName || '',
            isActive: data.isActive || false,
            activatedAt: data.activatedAt,
            expiresAt: data.expiresAt,
            usageCount: data.usageCount || 0,
            totalEarned: data.totalEarned || 0,
            createdAt: data.createdAt,
          });
        } else {
          setCoupon(null);
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

  return { coupon, loading, error };
};

/**
 * Hook to subscribe to user's coupon usages in real-time
 */
export const useCouponUsages = (uid: string | null, limitCount: number = 10) => {
  const [usages, setUsages] = useState<CouponUsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const usagesRef = collection(db, 'couponUsages');
    const q = query(
      usagesRef,
      where('ownerId', '==', uid),
      orderBy('usedAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CouponUsageData[];
        setUsages(usagesData);
        setHasMore(snapshot.docs.length === limitCount);
        if (snapshot.docs.length > 0) {
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid, limitCount]);

  // Load more function
  const loadMore = async () => {
    if (!uid || !lastVisible) return;

    const usagesRef = collection(db, 'couponUsages');
    const q = query(
      usagesRef,
      where('ownerId', '==', uid),
      orderBy('usedAt', 'desc'),
      startAfter(lastVisible),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const newUsages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CouponUsageData[];

    setUsages((prev) => [...prev, ...newUsages]);
    setHasMore(snapshot.docs.length === limitCount);
    if (snapshot.docs.length > 0) {
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    }
  };

  return { usages, loading, error, hasMore, loadMore };
};
