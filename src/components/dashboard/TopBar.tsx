/**
 * TopBar Component
 * Displays user profile, wallet balance, and streak counter
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { UserData } from '../../hooks/useFirestore';
import { formatCurrency } from '../../utils/dashboard';

interface TopBarProps {
  userData: UserData;
  loading: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ userData, loading }) => {
  const [fireBounce, setFireBounce] = React.useState(false);

  // Fire emoji bounce animation every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setFireBounce(true);
      setTimeout(() => setFireBounce(false), 1000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#111111] rounded-2xl p-4 border border-gray-800/50"
      role="banner"
      aria-label="User profile and wallet information"
    >
      {/* User Profile Section */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <img
            src={userData.photoURL || 'https://via.placeholder.com/48'}
            alt={`${userData.name}'s profile photo`}
            className="w-12 h-12 rounded-full object-cover border-2 border-[#E8B84B]"
            loading="lazy"
          />
          {/* Online indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#111111]" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-lg">{userData.name}</h2>
          </div>
          <div className="inline-block mt-1 px-3 py-1 bg-[#E8B84B]/10 border border-[#E8B84B]/30 rounded-full">
            <span className="text-[#E8B84B] text-xs font-semibold">
              {userData.venture} {userData.role}
            </span>
          </div>
        </div>
      </div>

      {/* Wallet Balance Section */}
      <div className="mb-4">
        <div className="text-3xl font-black text-[#E8B84B]" aria-label={`Earned wallet balance: ${formatCurrency(userData.wallets.earned)}`}>
          {formatCurrency(userData.wallets.earned)}
        </div>
        <div className="text-gray-400 text-sm mt-1">
          Today's earnings: <span className="text-white font-semibold">{formatCurrency(userData.todayEarnings ?? 0)}</span>
        </div>
      </div>

      {/* Streak Counter */}
      <div className="flex items-center justify-between bg-[#1A1A1A] rounded-xl p-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={fireBounce ? { y: -4, scale: 1.2 } : { y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Flame size={20} className="text-orange-500" />
          </motion.div>
          <div>
            <span className="text-white font-bold text-lg">{userData.streak || 0}</span>
            <span className="text-gray-400 text-sm ml-1">days</span>
          </div>
        </div>
        <div className="text-gray-500 text-xs">
          Keep it going! 🔥
        </div>
      </div>
    </motion.div>
  );
};
