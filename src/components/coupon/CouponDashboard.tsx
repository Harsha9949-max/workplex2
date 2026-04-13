/**
 * CouponDashboard Component (Phase 5)
 * Main container for coupon management system
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User as FirebaseUser } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { useUser } from '../../hooks/useFirestore';
import { useCoupon, useCouponUsages } from '../../hooks/useCoupon';
import { CouponHeroCard } from './CouponHeroCard';
import { CouponStatsGrid } from './CouponStatsGrid';
import { UsageHistoryTable } from './UsageHistoryTable';
import { CommissionCalculator } from './CommissionCalculator';
import { SkeletonCoupon } from './SkeletonCoupon';
import { BottomNav } from '../dashboard/BottomNav';
import { getDaysUntilRelease } from '../../utils/coupon';

interface CouponDashboardProps {
  user: FirebaseUser;
}

const CouponDashboard: React.FC<CouponDashboardProps> = ({ user }) => {
  const { userData, loading: userLoading } = useUser(user.uid);
  const { coupon, loading: couponLoading } = useCoupon(user.uid);
  const { usages, loading: usagesLoading, hasMore, loadMore } = useCouponUsages(user.uid, 10);

  // Calculate pending amount (unreleased commissions)
  const pendingAmount = useMemo(() => {
    return usages
      .filter((u) => !u.released)
      .reduce((sum, u) => sum + u.commissionAmount, 0);
  }, [usages]);

  // Calculate usage trend (simple: compare today vs yesterday)
  const usageTrend = useMemo(() => {
    if (usages.length < 2) return 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const todayCount = usages.filter((u) => {
      const d = u.usedAt?.toDate ? u.usedAt.toDate() : new Date();
      return d.toDateString() === today;
    }).length;
    const yesterdayCount = usages.filter((u) => {
      const d = u.usedAt?.toDate ? u.usedAt.toDate() : new Date();
      return d.toDateString() === yesterday;
    }).length;
    if (yesterdayCount === 0) return todayCount > 0 ? 100 : 0;
    return Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);
  }, [usages]);

  // Loading state
  if (userLoading || couponLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-24">
        <div className="max-w-screen-lg mx-auto px-4 py-6">
          <SkeletonCoupon />
        </div>
        <BottomNav activeTab="coupon" />
      </div>
    );
  }

  // No coupon yet
  if (!coupon) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-24">
        <div className="max-w-screen-lg mx-auto px-4 py-6">
          <div className="bg-[#111111] rounded-2xl p-12 border border-gray-800/50 text-center">
            <div className="text-5xl mb-4">🎫</div>
            <h3 className="text-white font-bold text-xl mb-2">No Coupon Yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Your coupon will be auto-generated when you complete onboarding.
            </p>
            <p className="text-[#E8B84B] text-sm">
              Contact support if you believe this is an error.
            </p>
          </div>
        </div>
        <BottomNav activeTab="coupon" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <Toaster position="top-center" />

      <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">My Coupon</h1>
            <span className="px-3 py-1 bg-[#E8B84B]/10 border border-[#E8B84B]/30 rounded-full text-[#E8B84B] text-xs font-semibold">
              {coupon.venture}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">Share your code and earn commissions</p>
        </motion.div>

        {/* Hero Card */}
        <CouponHeroCard coupon={coupon} username={userData?.username} />

        {/* Stats Grid */}
        <CouponStatsGrid
          usageCount={coupon.usageCount}
          totalEarned={coupon.totalEarned}
          pendingAmount={pendingAmount}
          usageTrend={usageTrend}
        />

        {/* Usage History */}
        <div>
          <h3 className="text-white font-bold text-xl mb-4">Usage History</h3>
          <UsageHistoryTable
            usages={usages}
            loading={usagesLoading}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />
        </div>

        {/* Commission Calculator */}
        <CommissionCalculator />
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab="coupon" />
    </div>
  );
};

export default CouponDashboard;
