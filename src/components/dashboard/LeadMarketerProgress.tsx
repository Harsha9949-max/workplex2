/**
 * LeadMarketerProgress Component
 * Progress bar showing journey to Lead Marketer status
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Calendar, TrendingUp } from 'lucide-react';
import { UserData } from '../../hooks/useFirestore';
import { formatCurrency, calculateProgress } from '../../utils/dashboard';

interface LeadMarketerProgressProps {
  userData: UserData;
  monthlyEarnings: number;
}

export const LeadMarketerProgress: React.FC<LeadMarketerProgressProps> = ({
  userData,
  monthlyEarnings,
}) => {
  const targetAmount = 50000; // Rs.50,000 for Lead Marketer
  const progress = calculateProgress(monthlyEarnings, targetAmount);
  const remaining = Math.max(0, targetAmount - monthlyEarnings);
  const daysActive = userData.daysActiveThisMonth || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-[#111111] rounded-2xl p-5 border border-gray-800/50"
      role="region"
      aria-label="Lead Marketer progress tracker"
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <Crown size={20} className="text-[#E8B84B]" />
        <h3 className="text-white font-bold text-lg">Journey to Lead Marketer</h3>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-3 bg-[#0A0A0A] rounded-full overflow-hidden border border-gray-800/50">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#E8B84B] to-[#F59E0B]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-gray-400 text-sm">
            {formatCurrency(monthlyEarnings)} of {formatCurrency(targetAmount)}
          </span>
          <span className="text-[#E8B84B] font-bold text-sm">
            {progress.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-[#1A1A1A] rounded-xl p-3 flex items-center gap-2">
          <Calendar size={16} className="text-[#00C9A7]" />
          <div>
            <div className="text-white font-bold">{daysActive}</div>
            <div className="text-gray-500 text-xs">days active</div>
          </div>
        </div>
        <div className="bg-[#1A1A1A] rounded-xl p-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-[#E8B84B]" />
          <div>
            <div className="text-white font-bold">{formatCurrency(monthlyEarnings)}</div>
            <div className="text-gray-500 text-xs">earned</div>
          </div>
        </div>
      </div>

      {/* Motivational Text */}
      {remaining > 0 ? (
        <p className="text-gray-400 text-sm text-center">
          <span className="text-[#E8B84B] font-semibold">{formatCurrency(remaining)}</span> more to unlock Lead Marketer benefits! 👑
        </p>
      ) : (
        <motion.p
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-green-500 font-bold text-center text-sm"
        >
          🎉 Congratulations! You've reached Lead Marketer status!
        </motion.p>
      )}
    </motion.div>
  );
};
