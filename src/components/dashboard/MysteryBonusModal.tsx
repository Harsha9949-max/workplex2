/**
 * MysteryBonusModal Component
 * Random popup modal offering bonus tasks
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Clock, X } from 'lucide-react';
import { formatTime } from '../../utils/dashboard';
import toast from 'react-hot-toast';

interface MysteryBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const MysteryBonusModal: React.FC<MysteryBonusModalProps> = ({
  isOpen,
  onClose,
  onAccept,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(7200); // 2 hours in seconds

  useEffect(() => {
    if (!isOpen) {
      setTimeRemaining(7200);
      return;
    }

    const updateTimer = () => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    };

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleAccept = () => {
    onAccept();
    toast.success('🎁 Mystery task accepted! Complete it within 2 hours for Rs.75 bonus', {
      duration: 4000,
      style: {
        background: '#111111',
        color: '#fff',
        border: '1px solid #E8B84B',
      },
    });
    onClose();
  };

  const handleDismiss = () => {
    onClose();
    toast('Maybe next time! 👋', {
      icon: '🎁',
      duration: 2000,
      style: {
        background: '#111111',
        color: '#fff',
      },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleDismiss}
          role="dialog"
          aria-modal="true"
          aria-label="Mystery bonus task offer"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="bg-gradient-to-br from-[#1A1A1A] to-[#111111] rounded-3xl p-6 max-w-sm w-full border border-[#E8B84B]/30 shadow-[0_0_60px_rgba(232,184,75,0.3)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close mystery bonus modal"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-6"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
                className="inline-block mb-4"
              >
                <Gift size={64} className="text-[#E8B84B]" />
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-2">🎁 Mystery Task!</h2>
            </motion.div>

            {/* Body */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-4 mb-6"
            >
              <div className="bg-[#0A0A0A] rounded-xl p-4 text-center">
                <p className="text-white text-lg font-semibold mb-2">
                  Complete in 2 hours → <span className="text-[#E8B84B] font-black">Rs.75 instant bonus</span>
                </p>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Clock size={16} className={timeRemaining < 3600 ? 'animate-pulse text-red-500' : ''} />
                <span className={`font-mono text-xl ${timeRemaining < 3600 ? 'text-red-500' : 'text-white'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(232,184,75,0.3)',
                    '0 0 30px rgba(232,184,75,0.5)',
                    '0 0 20px rgba(232,184,75,0.3)',
                  ],
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                onClick={handleAccept}
                className="w-full bg-[#E8B84B] hover:bg-[#F5C95C] text-black font-black py-4 px-6 rounded-xl text-lg transition-all min-h-[44px]"
                aria-label="Accept mystery bonus task"
              >
                Accept Bonus Task
              </motion.button>

              <button
                onClick={handleDismiss}
                className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-400 font-semibold py-3 px-6 rounded-xl transition-all min-h-[44px]"
                aria-label="Dismiss mystery bonus offer"
              >
                Maybe Later
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
