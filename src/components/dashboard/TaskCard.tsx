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
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-[#111111] rounded-2xl p-4 border border-gray-800/50 min-w-[280px] max-w-[320px] flex-shrink-0"
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      {/* Task Header */}
      <div className="mb-3">
        <h4 className="text-white font-bold text-base mb-2">{task.title}</h4>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-md text-xs font-semibold border ${getVentureColor(task.venture)}`}
          >
            {task.venture}
          </span>
        </div>
      </div>

      {/* Earning Amount */}
      <div className="mb-3">
        <span className="text-[#E8B84B] font-black text-2xl">
          {formatCurrency(task.earning)}
        </span>
      </div>

      {/* Deadline Timer */}
      <div className={`flex items-center gap-2 mb-4 ${isUrgent ? 'text-red-500' : 'text-gray-400'}`}>
        <Clock size={14} className={isUrgent ? 'animate-pulse' : ''} />
        <span className="text-sm font-mono">
          {timeRemaining > 0 ? formatTime(timeRemaining) : 'Expired'}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onAccept(task.id)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[44px]"
          aria-label={`Accept task: ${task.title}`}
        >
          <Check size={16} />
          Accept
        </button>
        <button
          onClick={() => onSkip(task.id)}
          className="px-3 py-2.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-400 font-semibold rounded-lg flex items-center justify-center transition-all active:scale-[0.98] min-h-[44px]"
          aria-label={`Skip task: ${task.title}`}
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};
