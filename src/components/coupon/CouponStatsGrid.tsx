/**
 * CouponStatsGrid Component
 * Usage count, total earned, pending release
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Coins, Clock, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../../utils/coupon';

interface CouponStatsGridProps {
  usageCount: number;
  totalEarned: number;
  pendingAmount: number;
  usageTrend?: number;
}

export const CouponStatsGrid: React.FC<CouponStatsGridProps> = ({
  usageCount,
  totalEarned,
  pendingAmount,
  usageTrend = 0,
}) => {
  const stats = [
    {
      label: 'Times Used Today',
      value: usageCount.toString(),
      icon: <TrendingUp size={20} className="text-[#E8B84B]" />,
      bg: 'bg-[#E8B84B]/10',
      trend: usageTrend > 0 ? `+${usageTrend}%` : undefined,
    },
    {
      label: 'Total Commission Earned',
      value: formatCurrency(totalEarned),
      icon: <Coins size={20} className="text-green-400" />,
      bg: 'bg-green-500/10',
      trend: undefined,
    },
    {
      label: 'Pending Release',
      value: formatCurrency(pendingAmount),
      icon: <Clock size={20} className="text-yellow-400" />,
      bg: 'bg-yellow-500/10',
      trend: '7-day hold',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-[#111111] rounded-2xl p-5 border border-gray-800/50"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-xl ${stat.bg}`}>
              {stat.icon}
            </div>
            {stat.trend && (
              <span className={`text-xs font-semibold ${stat.trend.includes('+') ? 'text-green-400' : 'text-yellow-400'}`}>
                {stat.trend}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
          <p className="text-white font-black text-xl">{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
};
