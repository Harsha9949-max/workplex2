import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase';
import { encrypt, generateDeviceFingerprint } from '../utils/encryption';
import ProgressBar from './ProgressBar';
import Step2Profile from './steps/Step2Profile';
import Step3Venture from './steps/Step3Venture';
import Step4Role from './steps/Step4Role';
import Step5Finance from './steps/Step5Finance';
import Step6KYC from './steps/Step6KYC';
import Step7Agreement from './steps/Step7Agreement';

const STEPS = {
  2: Step2Profile,
  3: Step3Venture,
  4: Step4Role,
  5: Step5Finance,
  6: Step6KYC,
  7: Step7Agreement,
};

export default function OnboardingWizard({ user }: { user: any }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(2);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleStepSubmit = (stepData) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
    setCurrentStep((prev) => prev + 1);
  };

  const handleAgreementSubmit = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userDocRef = doc(db, 'users', user.uid);

      await setDoc(userDocRef, {
        name: formData.name,
        phone: formData.phone,
        email: null,
        photoURL: formData.photoURL,
        age: formData.age,
        venture: formData.venture,
        role: formData.role,
        upiId: formData.upiId,
        bankAccount: formData.bankAccount,
        aadhaar: formData.aadhaar,
        pan: formData.pan,
        deviceFingerprint: generateDeviceFingerprint(),
        level: 'Bronze',
        streak: 0,
        joinedAt: serverTimestamp(),
        contractSigned: true,
        kycDone: false,
        firstTaskDone: false,
        wallets: {
          earned: 0,
          pending: 27,
          bonus: 0,
          savings: 0,
        },
      });

      navigate('/home');
    } catch (err) {
      console.error('Firestore error:', err);
      setError(err.message || 'Failed to create user profile');
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-sm border-b border-[#2A2A2A]">
        <div className="max-w-md mx-auto px-4 py-4">
          <ProgressBar currentStep={currentStep} totalSteps={7} />
        </div>
      </div>

      <div className="pt-20">
        <AnimatePresence mode="wait">
          {CurrentStepComponent && (
            <CurrentStepComponent
              key={currentStep}
              onNext={handleStepSubmit}
              onAgree={handleAgreementSubmit}
              loading={loading}
              formData={formData}
              venture={formData.venture}
            />
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 max-w-md w-full mx-4">
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}