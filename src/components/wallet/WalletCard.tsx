/**
 * WalletCard Component
 * Reusable wallet card with colored glow and animated counter
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Clock, Gift, Building2, Info, ArrowUpRight } from 'lucide-react';
import { formatCurrency, getWalletColor } from '../../utils/wallet';

interface WalletCardProps {
  title: string;
  balance: number;
  subtitle: string;
  wallet: 'earned' | 'pending' | 'bonus' | 'savings';
  statusBadge?: { label: string; unlocked?: boolean };
  progress?: { current: number; target: number; label: string };
  actionButton?: { label: string; onClick: () => void };
  extraInfo?: React.ReactNode;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  title,
  balance,
  subtitle,
  wallet,
  statusBadge,
  progress,
  actionButton,
  extraInfo,
}) => {
  const [displayBalance, setDisplayBalance] = useState(0);
  const colors = getWalletColor(wallet);

  const getIcon = () => {
    switch (wallet) {
      case 'earned': return <Wallet size={24} className={colors.text} />;
      case 'pending': return <Clock size={24} className={colors.text} />;
      case 'bonus': return <Gift size={24} className={colors.text} />;
      case 'savings': return <Building2 size={24} className={colors.text} />;
    }
  };

  // Animate counter
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const stepTime = duration / steps;
    const increment = balance / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= balance) {
        setDisplayBalance(balance);
        clearInterval(timer);
      } else {
        setDisplayBalance(current);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [balance]);

  const totalBalance = ['earned', 'pending', 'bonus', 'savings'].reduce(
    (sum, w) => sum + (w === wallet ? balance : 0), 0
  );
  const progressPercent = totalBalance > 0 ? (balance / totalBalance) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, boxShadow: `0 20px 40px ${colors.glow.replace('shadow-', '').replace('/20', '/30')}` }}
      className={`bg-[#111111] rounded-2xl p-6 border ${colors.border} relative overflow-hidden`}
    >
      {/* Background glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full blur-3xl opacity-50`} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${colors.icon}`}>
              {getIcon()}
            </div>
            <h3 className="text-white font-bold text-lg">{title}</h3>
          </div>
          {statusBadge && (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                statusBadge.unlocked
                  ? 'bg-green-500/20 text-green-400'
                  : `${colors.bg} ${colors.text}`
              }`}
            >
              {statusBadge.label}
            </span>
          )}
        </div>

        {/* Balance */}
        <div className="mb-2">
          <span className={`text-3xl font-black ${colors.text}`}>
            {formatCurrency(displayBalance)}
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-4">{subtitle}</p>

        {/* Progress Bar */}
        {progress && (
          <div className="mb-4">
            <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden mb-2">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${wallet === 'earned' ? 'from-green-500 to-green-400' : wallet === 'pending' ? 'from-yellow-500 to-yellow-400' : wallet === 'bonus' ? 'from-purple-500 to-purple-400' : 'from-blue-500 to-blue-400'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((progress.current / progress.target) * 100, 100)}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
            <p className="text-gray-500 text-xs">{progress.label}</p>
          </div>
        )}

        {/* Extra Info */}
        {extraInfo && <div className="mb-4">{extraInfo}</div>}

        {/* Action Button */}
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className={`w-full bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[44px]`}
          >
            {actionButton.label}
            <ArrowUpRight size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
};
