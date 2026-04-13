/**
 * AIEarningsPredictor Component
 * AI-powered earnings prediction banner
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target } from 'lucide-react';
import { UserData } from '../../hooks/useFirestore';
import { formatCurrency } from '../../utils/dashboard';

interface AIEarningsPredictorProps {
  userData: UserData;
  tasksCount: number;
  onViewTasks: () => void;
}

export const AIEarningsPredictor: React.FC<AIEarningsPredictorProps> = ({
  userData,
  tasksCount,
  onViewTasks,
}) => {
  // Calculate prediction based on user data
  const predictedEarnings = tasksCount * 50; // Assuming Rs.50 average per task
  const tasksNeeded = Math.max(0, 5 - (userData.todayEarnings || 0) / 50);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl border border-[#E8B84B]/30"
      role="region"
      aria-label="AI earnings prediction"
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#E8B84B]/20 via-[#F59E0B]/10 to-[#00C9A7]/20" />
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#E8B84B]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00C9A7]/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-[#E8B84B]/20 rounded-lg">
            <TrendingUp size={24} className="text-[#E8B84B]" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">AI Earnings Predictor</h3>
            <p className="text-gray-400 text-sm">Based on your recent performance</p>
          </div>
        </div>

        {/* Prediction Text */}
        <div className="bg-[#0A0A0A]/50 rounded-xl p-4 mb-4">
          <p className="text-white text-base">
            Complete <span className="text-[#E8B84B] font-bold">{Math.ceil(tasksNeeded)}</span> more tasks → earn{' '}
            <span className="text-[#E8B84B] font-bold">{formatCurrency(predictedEarnings)}</span> extra today
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={onViewTasks}
          className="w-full bg-transparent border-2 border-[#00C9A7] text-[#00C9A7] hover:bg-[#00C9A7]/10 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[44px]"
          aria-label="View available tasks"
        >
          <Target size={18} />
          View Tasks
        </button>
      </div>
    </motion.div>
  );
};
