/**
 * FamilyTransferModal Component
 * Send money to any UPI ID
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Check, AlertCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, validateUPI } from '../../utils/wallet';

interface FamilyTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  earnedBalance: number;
  onSubmit: (targetUpi: string, amount: number) => Promise<{ success: boolean; error?: string }>;
}

export const FamilyTransferModal: React.FC<FamilyTransferModalProps> = ({
  isOpen,
  onClose,
  earnedBalance,
  onSubmit,
}) => {
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [targetUpi, setTargetUpi] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = () => {
    setStep('input');
    setTargetUpi('');
    setAmount('');
    setError('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleNext = () => {
    if (!validateUPI(targetUpi)) {
      setError('Please enter a valid UPI ID (e.g., name@upi)');
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num < 100) {
      setError('Minimum transfer amount is Rs.100');
      return;
    }
    if (num > earnedBalance) {
      setError('Insufficient balance');
      return;
    }
    if (num > 10000) {
      setError('Maximum transfer is Rs.10,000');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const result = await onSubmit(targetUpi, parseFloat(amount));
    if (result.success) {
      setStep('success');
    } else {
      setError(result.error || 'Transfer failed');
    }
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Send to family"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[#111111] w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border border-gray-800/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#111111] border-b border-gray-800/50 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                {step !== 'input' && (
                  <button onClick={() => step === 'success' ? handleClose() : setStep('input')} className="p-2 text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Go back">
                    <ArrowLeft size={20} />
                  </button>
                )}
                <h3 className="text-white font-bold text-lg">Send to Family</h3>
              </div>
              <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Close"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {step === 'input' && (
                <>
                  <p className="text-gray-400 text-sm">Transfer money to any UPI ID instantly</p>

                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">UPI ID</label>
                    <input
                      type="text"
                      value={targetUpi}
                      onChange={(e) => setTargetUpi(e.target.value)}
                      placeholder="name@upi"
                      className="w-full px-4 py-3 bg-[#1A1A1A] border border-gray-800/50 rounded-xl text-white placeholder-gray-600 focus:border-purple-500 transition-colors min-h-[44px]"
                      aria-label="Target UPI ID"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Amount</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Min Rs.100, Max Rs.10,000"
                      className="w-full px-4 py-3 bg-[#1A1A1A] border border-gray-800/50 rounded-xl text-white placeholder-gray-600 focus:border-purple-500 transition-colors min-h-[44px]"
                      aria-label="Transfer amount"
                    />
                  </div>

                  <div className="bg-[#1A1A1A] rounded-xl p-4">
                    <p className="text-gray-500 text-xs mb-1">Available Balance</p>
                    <p className="text-green-400 font-bold text-xl">{formatCurrency(earnedBalance)}</p>
                  </div>

                  <button onClick={handleNext} className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px]">
                    <Send size={18} /> Continue
                  </button>
                </>
              )}

              {step === 'confirm' && (
                <>
                  <div className="bg-[#1A1A1A] rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Send to</span>
                      <span className="text-white font-semibold">{targetUpi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Amount</span>
                      <span className="text-white font-bold">{formatCurrency(parseFloat(amount))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Fee</span>
                      <span className="text-green-400 font-bold">FREE</span>
                    </div>
                    <div className="border-t border-gray-800 pt-3 flex justify-between">
                      <span className="text-gray-300 font-semibold">Total</span>
                      <span className="text-purple-400 font-black text-xl">{formatCurrency(parseFloat(amount))}</span>
                    </div>
                  </div>

                  <button onClick={handleConfirm} disabled={isSubmitting} className="w-full bg-gradient-to-r from-purple-500 to-purple-600 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold py-4 rounded-xl transition-all min-h-[44px]">
                    {isSubmitting ? 'Sending...' : 'Confirm Transfer'}
                  </button>
                </>
              )}

              {step === 'success' && (
                <div className="text-center space-y-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Check size={40} className="text-green-400" />
                  </motion.div>
                  <div>
                    <h4 className="text-white font-bold text-xl mb-2">Transfer Successful!</h4>
                    <p className="text-gray-400 text-sm">{formatCurrency(parseFloat(amount))} sent to {targetUpi}</p>
                  </div>
                  <button onClick={handleClose} className="w-full bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] text-black font-bold py-4 rounded-xl transition-all min-h-[44px]">Done</button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
