import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Send, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { signInWithPhoneNumber, RecaptchaVerifier, onAuthStateChanged, getAuth } from 'firebase/auth';
import { auth } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const Step1Phone = ({ onVerified, onExistingUser }) => {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const otpInputsRef = useRef<HTMLInputElement[]>([]);
  const recaptchaVerifierRef = useRef<any>(null);

  useEffect(() => {
    initRecaptcha();
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const initRecaptcha = () => {
    try {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          setRecaptchaReady(true);
        },
        'expired-callback': () => {
          setRecaptchaReady(false);
          initRecaptcha();
        }
      });
      setRecaptchaReady(true);
    } catch (err) {
      console.error('Recaptcha error:', err);
    }
  };

  const checkPhoneExists = async (phoneNumber) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const fullPhone = '+91' + phone;
      const exists = await checkPhoneExists(fullPhone);

      if (exists) {
        setError('This phone number is already registered');
        setLoading(false);
        return;
      }

      const confirmation = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      setStep('otp');
      setResendTimer(60);
    } catch (err) {
      console.error('OTP send error:', err);
      switch (err.code) {
        case 'auth/invalid-phone-number':
          setError('Invalid phone number format');
          break;
        case 'auth/too-many-requests':
          setError('Too many requests. Please try again later');
          break;
        case 'auth/captcha-check-failed':
          setError('Verification failed. Please try again');
          initRecaptcha();
          break;
        default:
          setError('Failed to send OTP. Please try again');
      }
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (!confirmationResult || otpString.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await confirmationResult.confirm(otpString);
      const user = result.user;
      const fullPhone = '+91' + phone;

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', fullPhone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = {
          uid: user.uid,
          phone: fullPhone,
          ...querySnapshot.docs[0].data()
        };
        onExistingUser(userData);
      } else {
        onVerified(fullPhone);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      switch (err.code) {
        case 'auth/invalid-code':
          setError('Invalid OTP. Please check and try again');
          break;
        case 'auth/code-expired':
          setError('OTP expired. Please resend');
          setStep('phone');
          break;
        default:
          setError('Verification failed. Please try again');
      }
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setError('');
    setLoading(true);

    try {
      const fullPhone = '+91' + phone;
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      setResendTimer(60);
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend OTP. Please try again');
    }
    setLoading(false);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const formatPhoneDisplay = (value) => {
    return value.replace(/\D/g, '').slice(0, 10);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div id="recaptcha-container"></div>

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
              <Phone className="w-8 h-8 text-[#E8B84B]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Phone Verification</h2>
            <p className="text-gray-400 text-sm">
              {step === 'phone'
                ? 'Enter your phone number to get started'
                : 'Enter the OTP sent to your phone'}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.div
                key="phone-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="mb-6">
                  <label className="block text-gray-400 text-sm mb-2">Phone Number</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                      <span className="text-gray-400 font-medium">+91</span>
                      <span className="text-gray-600 mx-2">|</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
                      placeholder="9876543210"
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl py-4 pl-20 pr-4 text-white text-lg font-medium placeholder-gray-600 focus:border-[#E8B84B] focus:ring-1 focus:ring-[#E8B84B] transition-colors outline-none"
                      maxLength={10}
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      {error}
                    </p>
                  </motion.div>
                )}

                <button
                  onClick={handleSendOTP}
                  disabled={loading || !recaptchaReady}
                  className="w-full bg-[#E8B84B] hover:bg-[#D4A43A] disabled:bg-[#3A3A3A] disabled:cursor-not-allowed text-black font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send OTP</span>
                    </>
                  )}
                </button>

                <div className="mt-6 pt-6 border-t border-[#2A2A2A]">
                  <button className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Sign In Options</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6">
                  <label className="block text-gray-400 text-sm mb-2">Enter OTP</label>
                  <div className="flex gap-2 justify-between">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { if (el) otpInputsRef.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-14 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white text-center text-xl font-bold focus:border-[#E8B84B] focus:ring-1 focus:ring-[#E8B84B] transition-colors outline-none"
                      />
                    ))}
                  </div>
                  <p className="text-gray-500 text-xs mt-2 text-center">
                    OTP sent to +91 {phone}
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      {error}
                    </p>
                  </motion.div>
                )}

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full bg-[#E8B84B] hover:bg-[#D4A43A] disabled:bg-[#3A3A3A] disabled:cursor-not-allowed text-black font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Verify & Login</span>
                    </>
                  )}
                </button>

                <div className="mt-6 pt-6 border-t border-[#2A2A2A] text-center">
                  <p className="text-gray-400 text-sm mb-2">Didn't receive the OTP?</p>
                  <button
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0 || loading}
                    className="text-[#E8B84B] hover:text-[#D4A43A] disabled:text-gray-600 font-medium transition-colors"
                  >
                    {resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : 'Resend OTP'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-xs">
          <Lock className="w-3 h-3" />
          <span>Your data is secure and encrypted</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Step1Phone;