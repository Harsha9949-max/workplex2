/**
 * WithdrawalModal Component
 * Multi-step withdrawal flow with KYC gate
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Check, AlertCircle, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, validateUPI, isValidWithdrawalAmount } from '../../utils/wallet';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  earnedBalance: number;
  upiId: string;
  bankAccount: string;
  kycDone: boolean;
  onSubmit: (amount: number, upiId: string) => Promise<{ success: boolean; error?: string }>;
  onShowKYC: () => void;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  earnedBalance,
  upiId,
  bankAccount,
  kycDone,
  onSubmit,
  onShowKYC,
}) => {
  const [step, setStep] = useState<'amount' | 'confirm' | 'success'>('amount');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = () => {
    setStep('amount');
    setAmount('');
    setError('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateAmount = (value: string): boolean => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      setError('Please enter a valid amount');
      return false;
    }
    const validation = isValidWithdrawalAmount(num, earnedBalance);
    if (!validation.valid) {
      setError(validation.error || 'Invalid amount');
      return false;
    }
    setError('');
    return true;
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value) validateAmount(value);
    else setError('');
  };

  const handleQuickAmount = (value: number) => {
    const amt = Math.min(value, earnedBalance).toString();
    setAmount(amt);
    validateAmount(amt);
  };

  const handleNext = () => {
    if (!kycDone) {
      onShowKYC();
      return;
    }
    if (validateAmount(amount)) {
      setStep('confirm');
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const result = await onSubmit(parseFloat(amount), upiId);
    if (result.success) {
      setStep('success');
    } else {
      setError(result.error || 'Withdrawal failed. Please try again.');
    }
    setIsSubmitting(false);
  };

  const maskAccount = (acc: string) => {
    if (!acc || acc.length < 4) return 'XXXX XXXX XXXX';
    return `XXXX XXXX ${acc.slice(-4)}`;
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
          aria-label="Withdraw money"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[#111111] w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto border border-gray-800/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#111111] border-b border-gray-800/50 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                {step !== 'amount' && (
                  <button
                    onClick={() => step === 'success' ? handleClose() : setStep('amount')}
                    className="p-2 text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Go back"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <h3 className="text-white font-bold text-lg">
                  {step === 'amount' ? 'Withdraw Money' : step === 'confirm' ? 'Confirm Withdrawal' : 'Success!'}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Step 1: Amount Entry */}
              {step === 'amount' && (
                <>
                  {/* Available Balance */}
                  <div className="bg-[#1A1A1A] rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">Earned Wallet Balance</p>
                    <p className="text-green-400 font-bold text-2xl">{formatCurrency(earnedBalance)}</p>
                    <p className="text-gray-500 text-xs mt-1">Available for withdrawal</p>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Enter Amount</label>
                    <div className="relative">
                      <IndianRupee size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="Min Rs.200"
                        className="w-full pl-12 pr-4 py-4 bg-[#1A1A1A] border border-gray-800/50 rounded-xl text-white text-xl font-bold placeholder-gray-600 focus:border-[#E8B84B] transition-colors min-h-[44px]"
                        aria-label="Withdrawal amount"
                      />
                    </div>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div>
                    <p className="text-gray-500 text-xs mb-3">Quick Select</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[500, 1000, 2000].map((val) => (
                        <button
                          key={val}
                          onClick={() => handleQuickAmount(val)}
                          className="py-2.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-gray-800/50 rounded-xl text-white text-sm font-semibold transition-all min-h-[44px]"
                        >
                          Rs.{val.toLocaleString()}
                        </button>
                      ))}
                      <button
                        onClick={() => handleQuickAmount(earnedBalance)}
                        className="py-2.5 bg-[#E8B84B]/10 hover:bg-[#E8B84B]/20 border border-[#E8B84B]/30 rounded-xl text-[#E8B84B] text-sm font-semibold transition-all min-h-[44px]"
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex items-start gap-2 text-gray-500 text-xs">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <p>Minimum withdrawal: Rs.200 | Processing time: 24-48 hours | No fees</p>
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={handleNext}
                    disabled={!amount || parseFloat(amount) < 200 || parseFloat(amount) > earnedBalance}
                    className="w-full bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-black font-bold py-4 rounded-xl transition-all min-h-[44px] text-lg"
                  >
                    {kycDone ? 'Continue' : 'Complete KYC to Withdraw'}
                  </button>
                </>
              )}

              {/* Step 2: Confirmation */}
              {step === 'confirm' && (
                <>
                  {/* UPI Details */}
                  <div className="space-y-4">
                    <div className="bg-[#1A1A1A] rounded-xl p-4">
                      <p className="text-gray-500 text-xs mb-1">UPI ID</p>
                      <p className="text-white font-semibold">{upiId || 'Not set'}</p>
                    </div>

                    <div className="bg-[#1A1A1A] rounded-xl p-4">
                      <p className="text-gray-500 text-xs mb-1">Bank Account</p>
                      <p className="text-white font-semibold">{maskAccount(bankAccount)}</p>
                    </div>

                    {/* Amount Summary */}
                    <div className="bg-[#1A1A1A] rounded-xl p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Withdrawal Amount</span>
                        <span className="text-white font-bold">{formatCurrency(parseFloat(amount))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Processing Fee</span>
                        <span className="text-green-400 font-bold">FREE</span>
                      </div>
                      <div className="border-t border-gray-800 pt-3 flex justify-between">
                        <span className="text-gray-300 font-semibold">Total Credit</span>
                        <span className="text-[#E8B84B] font-black text-xl">{formatCurrency(parseFloat(amount))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] disabled:from-gray-700 disabled:to-gray-700 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px] text-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Withdrawal'
                    )}
                  </button>
                </>
              )}

              {/* Step 3: Success */}
              {step === 'success' && (
                <div className="text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto"
                  >
                    <Check size={40} className="text-green-400" />
                  </motion.div>

                  <div>
                    <h4 className="text-white font-bold text-xl mb-2">Withdrawal Request Submitted!</h4>
                    <p className="text-gray-400 text-sm">
                      Your request for {formatCurrency(parseFloat(amount))} has been submitted successfully.
                      Admin will process within 24-48 hours.
                    </p>
                  </div>

                  <div className="bg-[#1A1A1A] rounded-xl p-4 space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Amount</span>
                      <span className="text-white font-semibold">{formatCurrency(parseFloat(amount))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">UPI</span>
                      <span className="text-white font-semibold">{upiId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Status</span>
                      <span className="text-yellow-400 font-semibold">Pending</span>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] text-black font-bold py-4 rounded-xl transition-all min-h-[44px] text-lg"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
