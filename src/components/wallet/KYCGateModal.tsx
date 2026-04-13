/**
 * KYCGateModal Component
 * Blocks withdrawal if KYC not complete
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Shield, FileText, CreditCard, Building } from 'lucide-react';

interface KYCGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteKYC: () => void;
}

export const KYCGateModal: React.FC<KYCGateModalProps> = ({
  isOpen,
  onClose,
  onCompleteKYC,
}) => {
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
          aria-label="KYC verification required"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="bg-[#111111] rounded-3xl p-8 max-w-sm w-full border border-red-500/30 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close KYC modal"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                className="inline-block mb-6"
              >
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Lock size={40} className="text-red-400" />
                </div>
              </motion.div>

              <h2 className="text-2xl font-black text-white mb-3">KYC Verification Required</h2>
              <p className="text-gray-400 text-sm mb-6">
                To withdraw money, you must complete KYC verification first.
              </p>

              {/* Requirements List */}
              <div className="bg-[#1A1A1A] rounded-xl p-4 mb-6 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-green-400" />
                  <span className="text-gray-300 text-sm">Aadhaar Number</span>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-green-400" />
                  <span className="text-gray-300 text-sm">PAN Card</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building size={18} className="text-green-400" />
                  <span className="text-gray-300 text-sm">Bank Account Details</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-green-400" />
                  <span className="text-gray-300 text-sm">UPI ID</span>
                </div>
              </div>

              {/* Security Note */}
              <p className="text-gray-500 text-xs mb-6 flex items-center justify-center gap-1">
                <Shield size={12} />
                Your documents are encrypted and stored securely
              </p>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={onCompleteKYC}
                  className="w-full bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] text-black font-bold py-3 rounded-xl transition-all min-h-[44px]"
                >
                  Complete KYC Now
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-400 font-semibold py-3 rounded-xl transition-all min-h-[44px]"
                >
                  Later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
