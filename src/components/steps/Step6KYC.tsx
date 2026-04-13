import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, Lock } from 'lucide-react';
import { encrypt } from '../../utils/encryption';

const Step6KYC = ({ onNext }) => {
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatAadhaar = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += digits[i];
    }
    return formatted;
  };

  const formatPan = (value) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  };

  const handleAadhaarChange = (e) => {
    setAadhaar(formatAadhaar(e.target.value));
    setError('');
  };

  const handlePanChange = (e) => {
    setPan(formatPan(e.target.value));
    setError('');
  };

  const validateAadhaar = (aadhaarNumber) => {
    const digits = aadhaarNumber.replace(/\D/g, '');
    return digits.length === 12;
  };

  const validatePan = (panNumber) => {
    if (panNumber.length !== 10) return false;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    return panRegex.test(panNumber);
  };

  const handleContinue = async () => {
    const aadhaarDigits = aadhaar.replace(/\D/g, '');
    const panUpper = pan.toUpperCase();

    if (!validateAadhaar(aadhaar)) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    if (!validatePan(pan)) {
      setError('Please enter a valid 10-character PAN (e.g., ABCDE1234F)');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const encryptedAadhaar = encrypt(aadhaarDigits);
      const encryptedPan = encrypt(panUpper);

      onNext({
        aadhaar: encryptedAadhaar,
        pan: encryptedPan
      });
    } catch (err) {
      console.error('Encryption error:', err);
      setError('Failed to encrypt data. Please try again');
    }
    setLoading(false);
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
            <div className="w-16 h-16 bg-[#E8B84B]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-[#E8B84B]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Secure KYC</h2>
            <p className="text-gray-400 text-sm">
              Enter your identity details for verification
            </p>
          </motion.div>

          <div className="mb-6">
            <label className="block text-gray-400 text-sm mb-2">Aadhaar Number</label>
            <div className="relative">
              <input
                type="text"
                value={aadhaar}
                onChange={handleAadhaarChange}
                placeholder="XXXX XXXX XXXX"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl py-4 px-4 text-white text-lg font-medium placeholder-gray-600 focus:border-[#E8B84B] focus:ring-1 focus:ring-[#E8B84B] transition-colors outline-none"
                maxLength={14}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Lock className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            <p className="text-gray-600 text-xs mt-1">12 digits • Auto-formatted</p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-400 text-sm mb-2">PAN Number</label>
            <div className="relative">
              <input
                type="text"
                value={pan}
                onChange={handlePanChange}
                placeholder="ABCDE1234F"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl py-4 px-4 text-white text-lg font-medium placeholder-gray-600 focus:border-[#E8B84B] focus:ring-1 focus:ring-[#E8B84B] transition-colors outline-none"
                maxLength={10}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Lock className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            <p className="text-gray-600 text-xs mt-1">10 characters • Last character must be a letter</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            </motion.div>
          )}

          <div className="mb-4 p-3 bg-[#E8B84B]/10 border border-[#E8B84B]/20 rounded-lg">
            <p className="text-[#E8B84B] text-sm flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Your data is encrypted with AES-256
            </p>
          </div>

          <button
            onClick={handleContinue}
            disabled={loading || !aadhaar || !pan}
            className="w-full bg-[#E8B84B] hover:bg-[#D4A43A] disabled:bg-[#3A3A3A] disabled:cursor-not-allowed text-black font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Continue</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-xs">
          <Lock className="w-3 h-3" />
          <span>Aadhaar & PAN are encrypted before storage</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Step6KYC;