import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckSquare, Check, Loader2, Shield } from 'lucide-react';

const Step7Agreement = ({ onAgree, loading }) => {
  const [agreed, setAgreed] = useState(false);

  const agreementText = `INDEPENDENT CONTRACTOR AGREEMENT

This Agreement is entered into between the Independent Contractor ("Contractor") and HVRS Innovations Private Limited ("Company").

1. ENGAGEMENT: Contractor agrees to perform tasks as assigned by the Company through the WorkPlex platform.

2. INDEPENDENT STATUS: Contractor is an independent contractor and not an employee of the Company. Contractor is responsible for their own taxes and insurance.

3. COMPENSATION: Contractor will be paid for completed tasks as per the task specifications. Payment will be processed within the specified timeline.

4. CONFIDENTIALITY: Contractor agrees to maintain confidentiality of all proprietary information.

5. TERMINATION: Either party may terminate this agreement with appropriate notice.

6. ACCEPTANCE: By checking the box below, Contractor acknowledges having read and understood this agreement.`;

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
            className="text-center mb-6"
          >
            <div className="w-16 h-16 bg-[#E8B84B]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[#E8B84B]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Independent Contractor Agreement</h2>
            <p className="text-gray-400 text-sm">
              Please review and accept the terms to continue
            </p>
          </motion.div>

          <div className="mb-6">
            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 h-64 overflow-y-auto">
              <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                {agreementText}
              </pre>
            </div>
          </div>

          <motion.label
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-3 mb-6 cursor-pointer"
          >
            <div
              onClick={() => setAgreed(!agreed)}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${
                agreed
                  ? 'bg-[#E8B84B]'
                  : 'bg-transparent border-2 border-[#3A3A3A] hover:border-[#E8B84B]'
              }`}
            >
              {agreed && <Check className="w-4 h-4 text-black" />}
            </div>
            <span className="text-gray-300 text-sm">I Agree to Terms & Conditions</span>
          </motion.label>

          <button
            onClick={onAgree}
            disabled={!agreed || loading}
            className={`w-full py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold ${
              agreed && !loading
                ? 'bg-[#E8B84B] hover:bg-[#D4A43A] text-black'
                : 'bg-[#3A3A3A] text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>Submit & Start Earning</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-xs">
          <Shield className="w-3 h-3" />
          <span>Your agreement is securely processed</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Step7Agreement;
