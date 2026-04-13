import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Check } from 'lucide-react';

const ROLES = {
  buyrix: ['Marketer', 'Content Creator', 'Reseller'],
  vyuma: ['Marketer', 'Content Creator', 'Reseller'],
  trendyverse: ['Marketer', 'Content Creator', 'Reseller'],
  growplex: ['Reseller', 'Client Acquirer', 'Support Agent', 'Social Promoter'],
};

export default function Step4Role({ venture, onNext }) {
  const [selected, setSelected] = useState(null);
  const roles = ROLES[venture] || ROLES.buyrix;

  const handleContinue = () => {
    if (selected) {
      onNext(selected);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-6 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-2">
          Choose Your Role
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Select how you want to contribute to {venture}
        </p>

        <div className="space-y-3 mb-8">
          {roles.map((role) => {
            const isSelected = selected === role;

            return (
              <motion.button
                key={role}
                whileHover={{ scale: 1.01, backgroundColor: '#1F1F1F' }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelected(role)}
                className={`
                  w-full p-4 rounded-xl bg-[#161616] border-2 transition-all duration-300
                  flex items-center justify-between
                  ${isSelected
                    ? 'border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.25)]'
                    : 'border-transparent hover:border-gray-700'
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`
                    p-2 rounded-full
                    ${isSelected ? 'bg-[#FFD700]/20' : 'bg-gray-800'}
                  `}>
                    <User
                      size={20}
                      className={isSelected ? 'text-[#FFD700]' : 'text-gray-400'}
                    />
                  </div>
                  <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {role}
                  </span>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-[#FFD700] flex items-center justify-center"
                  >
                    <Check size={16} className="text-black" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <motion.button
            whileHover={selected ? { scale: 1.02 } : {}}
            whileTap={selected ? { scale: 0.98 } : {}}
            onClick={handleContinue}
            disabled={!selected}
            className={`
              px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300
              ${selected
                ? 'bg-[#FFD700] text-black hover:bg-[#E5C700] shadow-[0_0_20px_rgba(255,215,0,0.4)]'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Continue
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}