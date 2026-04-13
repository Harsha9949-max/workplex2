import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Wallet, AlertCircle, CheckCircle } from 'lucide-react';

export default function Step5Finance({ onNext }) {
  const [upiId, setUpiId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [showBankAccount, setShowBankAccount] = useState(false);
  const [errors, setErrors] = useState({ upiId: '', bankAccount: '' });

  const validateUpiId = (value) => {
    if (!value) return 'UPI ID is required';
    if (!value.includes('@')) return 'UPI ID must contain @ symbol';
    const parts = value.split('@');
    if (parts[0].length < 3) return 'UPI ID must have at least 3 characters before @';
    if (!/^[a-zA-Z0-9@.]+$/.test(value)) return 'Invalid UPI ID format';
    return '';
  };

  const validateBankAccount = (value) => {
    if (!value) return 'Bank account number is required';
    if (!/^\d+$/.test(value)) return 'Only numbers are allowed';
    if (value.length < 9) return 'Bank account must be at least 9 digits';
    return '';
  };

  const handleUpiIdChange = (e) => {
    const value = e.target.value;
    setUpiId(value);
    if (errors.upiId) {
      setErrors((prev) => ({ ...prev, upiId: '' }));
    }
  };

  const handleBankAccountChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setBankAccount(value);
    if (errors.bankAccount) {
      setErrors((prev) => ({ ...prev, bankAccount: '' }));
    }
  };

  const isValid = () => {
    return !validateUpiId(upiId) && !validateBankAccount(bankAccount);
  };

  const handleSubmit = () => {
    const upiError = validateUpiId(upiId);
    const bankError = validateBankAccount(bankAccount);

    if (upiError || bankError) {
      setErrors({ upiId: upiError, bankAccount: bankError });
      return;
    }

    onNext({ upiId, bankAccount });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#1A1A1A] rounded-2xl p-8 shadow-2xl border border-[#2A2A2A]">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 bg-[#FFD700]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-[#FFD700]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Financial Setup</h2>
            <p className="text-gray-400 text-sm">
              Add your payment details
            </p>
          </motion.div>

          <div className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">UPI ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={upiId}
                  onChange={handleUpiIdChange}
                  placeholder="name@upi"
                  className={`
                    w-full bg-[#0A0A0A] border rounded-xl py-4 px-4 pr-12 text-white text-lg font-medium placeholder-gray-600 transition-colors outline-none
                    ${errors.upiId 
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                      : 'border-[#2A2A2A] focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]'
                    }
                  `}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {upiId && !errors.upiId ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : errors.upiId ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : null}
                </div>
              </div>
              {errors.upiId && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-2 flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.upiId}
                </motion.p>
              )}
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Bank Account Number</label>
              <div className="relative">
                <input
                  type={showBankAccount ? 'text' : 'password'}
                  value={bankAccount}
                  onChange={handleBankAccountChange}
                  placeholder="Enter 9-18 digit account number"
                  className={`
                    w-full bg-[#0A0A0A] border rounded-xl py-4 px-4 pr-12 text-white text-lg font-medium placeholder-gray-600 transition-colors outline-none
                    ${errors.bankAccount 
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                      : 'border-[#2A2A2A] focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]'
                    }
                  `}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {bankAccount && !errors.bankAccount && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {errors.bankAccount && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              {errors.bankAccount && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-2 flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.bankAccount}
                </motion.p>
              )}
              <button
                type="button"
                onClick={() => setShowBankAccount(!showBankAccount)}
                className="text-gray-500 text-sm mt-2 hover:text-gray-400 transition-colors"
              >
                {showBankAccount ? 'Hide' : 'Show'} account number
              </button>
            </div>

            <div className="flex items-start gap-3 p-4 bg-[#FFD700]/5 border border-[#FFD700]/20 rounded-xl">
              <CreditCard className="w-5 h-5 text-[#FFD700] mt-0.5 flex-shrink-0" />
              <p className="text-gray-400 text-sm">
                Your financial information is encrypted and secure. We never share your payment details with third parties.
              </p>
            </div>

            <motion.button
              whileHover={isValid() ? { scale: 1.02 } : {}}
              whileTap={isValid() ? { scale: 0.98 } : {}}
              onClick={handleSubmit}
              disabled={!isValid()}
              className={`
                w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2
                ${isValid()
                  ? 'bg-[#FFD700] text-black hover:bg-[#E5C700] shadow-[0_0_20px_rgba(255,215,0,0.4)]'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Continue
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}