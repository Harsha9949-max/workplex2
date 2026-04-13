/**
 * BonusUnlockCelebration Component
 * Celebration when bonus wallet converts to earned
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { X, Gift, Coins } from 'lucide-react';

interface BonusUnlockCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  bonusAmount: number;
}

export const BonusUnlockCelebration: React.FC<BonusUnlockCelebrationProps> = ({
  isOpen,
  onClose,
  bonusAmount,
}) => {
  useEffect(() => {
    if (isOpen) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 80, origin: { x: 0 }, colors: ['#8B5CF6', '#E8B84B', '#10B981'] });
        confetti({ particleCount: 5, angle: 120, spread: 80, origin: { x: 1 }, colors: ['#8B5CF6', '#E8B84B', '#10B981'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();

      setTimeout(() => {
        confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 }, colors: ['#8B5CF6', '#E8B84B'], shapes: ['circle'], gravity: 0.8, scalar: 1.2, ticks: 200 });
      }, 500);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Bonus unlocked celebration"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="bg-gradient-to-br from-[#1A1A1A] to-[#111111] rounded-3xl p-8 max-w-sm w-full border border-purple-500/30 shadow-[0_0_80px_rgba(139,92,246,0.3)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Close"><X size={20} /></button>

            <div className="text-center">
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12, delay: 0.2 }} className="inline-block mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
                  <Gift size={48} className="text-white" />
                </div>
              </motion.div>

              <h2 className="text-3xl font-black text-white mb-3">🎉 Bonus Unlocked!</h2>
              <p className="text-gray-400 mb-6">
                You've earned Rs.200 from tasks. Your signup bonus has been moved to your earned wallet!
              </p>

              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, delay: 0.5 }} className="inline-flex items-center gap-2 px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-8">
                <Coins size={20} className="text-purple-400" />
                <span className="text-purple-400 font-bold">Rs.{bonusAmount} Moved to Earned!</span>
              </motion.div>

              <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} onClick={onClose} className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-4 rounded-xl transition-all min-h-[44px] text-lg">
                Start Withdrawing
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
