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
      className="relative rounded-3xl p-6 overflow-hidden glass gold-glow"
      role="banner"
      aria-label="User profile and wallet information"
    >
      {/* Background Glow Orb */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#E8B84B] rounded-full mix-blend-screen filter blur-[80px] opacity-10 pointer-events-none" />

      {/* User Profile Section */}
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="relative">
          <img
            src={userData.photoURL || 'https://via.placeholder.com/64'}
            alt={`${userData.name}'s profile photo`}
            className="w-16 h-16 rounded-2xl object-cover border border-[#E8B84B]/30 shadow-lg shadow-black/50"
            loading="lazy"
          />
          {/* Online indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00C9A7] rounded-full border-2 border-[#111111] shadow-[0_0_10px_#00C9A7]" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-2xl font-display">{userData.name}</h2>
          </div>
          <div className="inline-flex items-center mt-1 px-3 py-1 bg-gradient-to-r from-[#E8B84B]/10 to-transparent border-l-2 border-[#E8B84B]">
            <span className="text-[#E8B84B] text-xs font-semibold tracking-wide uppercase">
              {userData.venture} • {userData.role}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        {/* Wallet Balance Section */}
        <div className="bg-[#0A0A0A]/50 rounded-2xl p-4 border border-white/5">
          <div className="text-gray-400 text-xs font-semibold tracking-wider uppercase mb-1">Total Earned</div>
          <div className="inline-block text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD57E] to-[#E8B84B] font-display pb-1 tracking-normal" aria-label={`Earned wallet balance: ${formatCurrency(userData.wallets.earned)}`}>
            {formatCurrency(userData.wallets.earned)}
          </div>
          <div className="text-gray-500 text-xs mt-2">
            Today: <span className="text-[#00C9A7] font-semibold">+{formatCurrency(userData.todayEarnings ?? 0)}</span>
          </div>
        </div>

        {/* Streak Counter */}
        <div className="bg-[#0A0A0A]/50 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
          <div className="text-gray-400 text-xs font-semibold tracking-wider uppercase mb-1 flex justify-between">
            <span>Daily Streak</span>
          </div>
          <div className="flex items-center gap-3">
            <motion.div
              animate={fireBounce ? { y: -4, scale: 1.2 } : { y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="bg-orange-500/10 p-2 rounded-xl border border-orange-500/20"
            >
              <Flame size={24} className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
            </motion.div>
            <div>
              <span className="text-white font-black text-2xl font-display">{userData.streak || 0}</span>
              <span className="text-gray-400 text-sm ml-1 font-semibold">days</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
