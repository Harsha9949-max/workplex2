/**
 * TaskCard Component
 * Reusable task card with timer, accept/skip buttons
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Clock } from 'lucide-react';
import { TaskData } from '../../hooks/useFirestore';
import { formatCurrency, getTimeRemaining, formatTime } from '../../utils/dashboard';

interface TaskCardProps {
  task: TaskData;
  onAccept: (id: string) => void;
  onSkip: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onAccept, onSkip }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = getTimeRemaining(task.deadline);
      setTimeRemaining(remaining);
      setIsUrgent(remaining < 7200); // Less than 2 hours
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [task.deadline]);

  const getVentureColor = (venture: string) => {
    const colors: Record<string, string> = {
      BuyRix: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      Vyuma: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      TrendyVerse: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      Growplex: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return colors[venture] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -4, backgroundColor: 'rgba(26,26,26,0.8)' }}
      transition={{ duration: 0.2 }}
      className="glass rounded-3xl p-5 min-w-[280px] max-w-[320px] flex-shrink-0 relative overflow-hidden group"
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      {/* Background radial glow on hover */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8B84B] rounded-full mix-blend-screen filter blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />

      {/* Task Header */}
      <div className="mb-4 relative z-10">
        <h4 className="text-white font-bold text-lg mb-2 font-display">{task.title}</h4>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-white/5 ${getVentureColor(task.venture)}`}
          >
            {task.venture}
          </span>
        </div>
      </div>

      {/* Earning Amount */}
      <div className="mb-4 relative z-10">
        <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#FFD57E] to-[#E8B84B] font-black text-3xl font-display pb-1 tracking-normal">
          {formatCurrency(task.earning)}
        </span>
      </div>

      {/* Deadline Timer */}
      <div className={`flex items-center gap-2 mb-6 ${isUrgent ? 'text-red-500' : 'text-gray-400'} relative z-10`}>
        <Clock size={16} className={isUrgent ? 'animate-pulse' : ''} />
        <span className="text-sm font-semibold tracking-wide">
          {timeRemaining > 0 ? formatTime(timeRemaining) : 'Expired'}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 relative z-10">
        <button
          onClick={() => onAccept(task.id)}
          className="flex-1 bg-gradient-to-br from-[#FFD57E] to-[#E8B84B] hover:shadow-[0_0_20px_rgba(232,184,75,0.4)] text-[#402D00] font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[48px]"
          aria-label={`Accept task: ${task.title}`}
        >
          <Check size={18} strokeWidth={3} />
          Accept
        </button>
        <button
          onClick={() => onSkip(task.id)}
          className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold rounded-xl flex items-center justify-center transition-all active:scale-[0.98] min-h-[48px] border border-white/5"
          aria-label={`Skip task: ${task.title}`}
        >
          <X size={20} />
        </button>
      </div>
    </motion.div>
  );
};
