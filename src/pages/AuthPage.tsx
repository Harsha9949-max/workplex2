import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Phone, Loader2 } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, RecaptchaVerifier } from 'firebase/auth';
import { signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';
import OnboardingWizard from '../components/OnboardingWizard';
import Step1Phone from '../components/steps/Step1Phone';

const AuthPage = () => {
  const navigate = useNavigate();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const [authStep, setAuthStep] = useState<'selection' | 'phone' | 'otp' | 'onboarding'>('selection');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [user, setUser] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recaptchaRef.current || recaptchaVerifier) return;

    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => { },
    });
    setRecaptchaVerifier(verifier);
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      if (googleUser.email === 'marateyh@gmail.com') {
        navigate('/admin');
        return;
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', googleUser.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        navigate('/home');
      } else {
        setUser(googleUser);
        setAuthStep('onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (phoneNumber: string) => {
    setLoading(true);
    setError('');
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier!);
      setConfirmationResult(result);
      setPhone(formattedPhone);
      setAuthStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const renderSelectionStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-[#1A1A1A] rounded-2xl p-8 border border-neutral-800">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome to WorkPlex</h1>
          <p className="text-neutral-400 mt-2">Sign in to continue</p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white hover:bg-neutral-100 text-black font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 mb-4"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Continue with Google
        </button>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-neutral-800" />
          <span className="text-neutral-500 text-sm">OR</span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>

        <button
          onClick={() => setAuthStep('phone')}
          className="w-full bg-[#1A1A1A] hover:bg-neutral-800 text-white font-medium py-3 px-4 rounded-xl border border-neutral-700 flex items-center justify-center gap-3 transition-all duration-200"
        >
          <Phone className="w-5 h-5 text-amber-400" />
          Continue with Phone
        </button>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm mt-4 text-center"
          >
            {error}
          </motion.p>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div id="recaptcha-container" ref={recaptchaRef}></div>

      <AnimatePresence mode="wait">
        {authStep === 'selection' && (
          <motion.div
            key="selection"
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full"
          >
            {renderSelectionStep()}
          </motion.div>
        )}

        {authStep === 'phone' && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md mx-auto"
          >
            <Step1Phone
              onVerified={() => setAuthStep('onboarding')}
              onExistingUser={() => setAuthStep('onboarding')}
            />
          </motion.div>
        )}

        {authStep === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md mx-auto"
          >
            <Step1Phone
              onVerified={() => setAuthStep('onboarding')}
              onExistingUser={() => setAuthStep('onboarding')}
            />
          </motion.div>
        )}

        {authStep === 'onboarding' && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <OnboardingWizard user={user} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthPage;