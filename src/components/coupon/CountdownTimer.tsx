/**
 * CountdownTimer Component (Phase 5)
 * Live HH:MM:SS countdown with urgency alerts
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { formatTime, getTimeRemaining } from '../../utils/coupon';

interface CountdownTimerProps {
  expiresAt: any;
  showLabel?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  showLabel = true,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = getTimeRemaining(expiresAt);
      setTimeRemaining(remaining);
      setIsUrgent(remaining > 0 && remaining < 7200); // < 2 hours
      setIsCritical(remaining > 0 && remaining < 600); // < 10 minutes
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeRemaining === 0) {
    return (
      <div className="flex items-center gap-2 text-red-400">
        <AlertTriangle size={16} />
        <span className="font-semibold text-sm">Expired</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {showLabel && <Clock size={16} className={isCritical ? 'text-red-400 animate-pulse' : isUrgent ? 'text-yellow-400' : 'text-gray-400'} />}
        <motion.span
          animate={isCritical ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          className={`font-mono font-bold text-lg ${isCritical ? 'text-red-400' : isUrgent ? 'text-yellow-400' : 'text-white'}`}
        >
          {formatTime(timeRemaining)}
        </motion.span>
      </div>

      {isUrgent && !isCritical && (
        <div className="flex items-center gap-1 text-yellow-400 text-xs">
          <AlertTriangle size={12} />
          <span>Less than 2 hours remaining</span>
        </div>
      )}
      {isCritical && (
        <div className="flex items-center gap-1 text-red-400 text-xs">
          <AlertTriangle size={12} />
          <span>Hurry! Less than 10 minutes left</span>
        </div>
      )}
    </div>
  );
};
