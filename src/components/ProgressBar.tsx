import { motion } from 'framer-motion';

const ProgressBar = ({ currentStep, totalSteps = 7 }) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#121212]">
      <div className="mb-2 text-sm font-medium text-gray-300">
        Step {currentStep} of {totalSteps}
      </div>
      <div className="w-full h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#E8B84B] rounded-full shadow-[0_0_10px_#E8B84B]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;