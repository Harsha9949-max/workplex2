import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, ShoppingBag, Sparkles, TrendingUp } from 'lucide-react';

const VENTURES = [
  {
    id: 'buyrix',
    name: 'BuyRix',
    tagline: 'Shop smarter, save bigger',
    icon: ShoppingBag,
  },
  {
    id: 'vyuma',
    name: 'Vyuma',
    tagline: 'Elevate your everyday',
    icon: Sparkles,
  },
  {
    id: 'trendyverse',
    name: 'TrendyVerse',
    tagline: 'Trends that move with you',
    icon: TrendingUp,
  },
  {
    id: 'growplex',
    name: 'Growplex',
    tagline: 'Build your business future',
    icon: Briefcase,
  },
];

export default function Step3Venture({ onNext }) {
  const [selected, setSelected] = useState(null);

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
        className="max-w-4xl w-full"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-2">
          Select Your Venture
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Choose the path that matches your goals
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {VENTURES.map((venture) => {
            const Icon = venture.icon;
            const isSelected = selected === venture.id;

            return (
              <motion.button
                key={venture.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(venture.id)}
                className={`
                  relative p-6 rounded-xl bg-[#1A1A1A] border-2 transition-all duration-300
                  flex flex-col items-center text-center gap-3
                  ${isSelected
                    ? 'border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                    : 'border-transparent hover:border-gray-600'
                  }
                `}
              >
                <div className={`
                  p-3 rounded-full
                  ${isSelected ? 'bg-[#FFD700]/20' : 'bg-gray-800'}
                `}>
                  <Icon
                    size={32}
                    className={isSelected ? 'text-[#FFD700]' : 'text-gray-400'}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{venture.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{venture.tagline}</p>
                </div>
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