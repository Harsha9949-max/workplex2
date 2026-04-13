/**
 * CountdownTimer Component
 * Live countdown timer with pulse animation when urgent
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { formatTime, getTimeRemaining } from '../../utils/tasks';

interface CountdownTimerProps {
  deadline: any;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  deadline,
  size = 'md',
  showLabel = true,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = getTimeRemaining(deadline);
      setTimeRemaining(remaining);
      setIsUrgent(remaining > 0 && remaining < 7200); // < 2 hours
      setIsCritical(remaining > 0 && remaining < 600); // < 10 minutes
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-4xl';
      default:
        return 'text-base';
    }
  };

  const getColorClasses = () => {
    if (timeRemaining === 0) return 'text-gray-500';
    if (isCritical) return 'text-red-500';
    if (isUrgent) return 'text-yellow-500';
    return 'text-gray-400';
  };

  const getBarColor = () => {
    if (timeRemaining === 0) return 'bg-gray-500';
    if (isCritical) return 'bg-red-500';
    if (isUrgent) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Calculate progress (assuming 24 hour task window)
  const progress = timeRemaining > 0 ? Math.min((timeRemaining / 86400) * 100, 100) : 0;

  return (
    <div className="space-y-2">
      {/* Timer Display */}
      <div className="flex items-center gap-2">
        {showLabel && (
          <Clock
            size={size === 'lg' ? 24 : 14}
            className={`${getColorClasses()} ${isCritical ? 'animate-pulse' : ''}`}
          />
        )}
        <motion.span
          animate={isCritical ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          className={`font-mono font-bold ${getSizeClasses()} ${getColorClasses()}`}
        >
          {timeRemaining > 0 ? formatTime(timeRemaining) : 'Expired'}
        </motion.span>
      </div>

      {/* Progress Bar (for large size) */}
      {size === 'lg' && timeRemaining > 0 && (
        <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${getBarColor()}`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      )}

      {/* Warning Text */}
      {isCritical && (
        <div className="flex items-center gap-2 text-red-500">
          <AlertTriangle size={14} />
          <span className="text-xs font-semibold">Hurry! Less than 10 minutes left</span>
        </div>
      )}
      {isUrgent && !isCritical && (
        <div className="flex items-center gap-2 text-yellow-500">
          <AlertTriangle size={14} />
          <span className="text-xs font-semibold">Less than 2 hours remaining</span>
        </div>
      )}
    </div>
  );
};
