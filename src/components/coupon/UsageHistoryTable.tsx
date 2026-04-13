/**
 * UsageHistoryTable Component
 * Paginated coupon usage history
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowUpRight, Loader2 } from 'lucide-react';
import { CouponUsageData } from '../../hooks/useCoupon';
import { StatusBadge } from './StatusBadge';
import { formatDate, formatTimeOfDay, formatCurrency, getDaysUntilRelease } from '../../utils/coupon';

interface UsageHistoryTableProps {
  usages: CouponUsageData[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export const UsageHistoryTable: React.FC<UsageHistoryTableProps> = ({
  usages,
  loading,
  hasMore,
  onLoadMore,
}) => {
  if (loading && usages.length === 0) {
    return (
      <div className="bg-[#111111] rounded-2xl border border-gray-800/50 p-8 text-center">
        <Loader2 size={32} className="text-[#E8B84B] animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading usage history...</p>
      </div>
    );
  }

  if (usages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#111111] rounded-2xl border border-gray-800/50 p-12 text-center"
      >
        <div className="text-5xl mb-4">🎫</div>
        <h3 className="text-white font-bold text-lg mb-2">No uses yet</h3>
        <p className="text-gray-500 text-sm">Share your code to start earning!</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#111111] rounded-2xl border border-gray-800/50 overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-5 gap-4 p-4 border-b border-gray-800/50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
          <span>Date</span>
          <span>Product</span>
          <span>Price</span>
          <span>Your Commission</span>
          <span>Status</span>
        </div>

        {/* Rows */}
        {usages.map((usage, index) => {
          const daysLeft = getDaysUntilRelease(usage.usedAt);
          const status: 'held' | 'released' = usage.released ? 'released' : 'held';

          return (
            <motion.div
              key={usage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 border-b border-gray-800/50 last:border-0 items-center"
            >
              {/* Date */}
              <div>
                <p className="text-white text-sm font-semibold">{formatDate(usage.usedAt)}</p>
                <p className="text-gray-500 text-xs">{formatTimeOfDay(usage.usedAt)}</p>
              </div>

              {/* Product */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#E8B84B]/10 rounded-lg">
                  <ShoppingBag size={14} className="text-[#E8B84B]" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium truncate">{usage.productName || 'Product'}</p>
                  <p className="text-gray-500 text-xs truncate">ID: {usage.productId.slice(0, 8)}</p>
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="text-white text-sm font-semibold">{formatCurrency(usage.productPrice)}</p>
              </div>

              {/* Commission */}
              <div>
                <p className="text-green-400 font-bold text-sm">{formatCurrency(usage.commissionAmount)}</p>
                <p className="text-gray-500 text-xs">Margin: {formatCurrency(usage.margin)}</p>
              </div>

              {/* Status */}
              <div>
                <StatusBadge
                  status={status}
                  extraText={status === 'held' ? `${daysLeft}d left` : ''}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            className="px-6 py-3 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-gray-800/50 text-white font-semibold rounded-xl transition-all min-h-[44px] flex items-center gap-2 mx-auto"
          >
            Load More
            <ArrowUpRight size={16} className="rotate-45" />
          </button>
        </div>
      )}
    </div>
  );
};
