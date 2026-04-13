/**
 * FirstTaskCelebration Component
 * Celebration modal with confetti when first task is completed
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { X, PartyPopper, Coins } from 'lucide-react';

interface FirstTaskCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirstTaskCelebration: React.FC<FirstTaskCelebrationProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 80,
          origin: { x: 0 },
          colors: ['#E8B84B', '#00C9A7', '#10B981', '#F59E0B'],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 80,
          origin: { x: 1 },
          colors: ['#E8B84B', '#00C9A7', '#10B981', '#F59E0B'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      // Gold coins falling
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#E8B84B', '#F5C95C'],
          shapes: ['circle'],
          gravity: 0.8,
          scalar: 1.2,
          ticks: 200,
        });
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
          aria-label="First task celebration"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="bg-gradient-to-br from-[#1A1A1A] to-[#111111] rounded-3xl p-8 max-w-sm w-full border border-[#E8B84B]/30 shadow-[0_0_80px_rgba(232,184,75,0.3)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close celebration"
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                className="inline-block mb-6"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-[#E8B84B] to-[#F5C95C] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-[#E8B84B]/30">
                  <PartyPopper size={48} className="text-black" />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black text-white mb-3"
              >
                🎉 First Task Complete!
              </motion.h2>

              {/* Message */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-400 mb-6"
              >
                Your <span className="text-[#E8B84B] font-bold">Rs.27</span> signup bonus is now unlocked and added to your earned wallet!
              </motion.p>

              {/* Bonus Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, delay: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#E8B84B]/10 border border-[#E8B84B]/30 rounded-xl mb-8"
              >
                <Coins size={20} className="text-[#E8B84B]" />
                <span className="text-[#E8B84B] font-bold">Rs.27 Bonus Unlocked!</span>
              </motion.div>

              {/* CTA Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={onClose}
                className="w-full bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] text-black font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[44px] text-lg shadow-lg shadow-[#E8B84B]/20"
              >
                Start Earning More
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
