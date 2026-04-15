/**
 * CouponCard Component
 * Displays coupon code, countdown, usage stats, and WhatsApp share
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Clock, AlertTriangle } from 'lucide-react';
import { CouponData } from '../../hooks/useFirestore';
import { getCouponExpiryProgress, getHoursUntilExpiry, formatCountdown, generateWhatsAppLink } from '../../utils/dashboard';

interface CouponCardProps {
  couponData: CouponData;
  loading: boolean;
  username?: string;
}

export const CouponCard: React.FC<CouponCardProps> = ({ couponData, loading, username }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hoursLeft, setHoursLeft] = useState(0);

  useEffect(() => {
    if (!couponData.activatedAt || !couponData.expiresAt) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expires = couponData.expiresAt.toDate ? couponData.expiresAt.toDate().getTime() : new Date(couponData.expiresAt).getTime();
      const activated = couponData.activatedAt.toDate ? couponData.activatedAt.toDate().getTime() : new Date(couponData.activatedAt).getTime();
      
      const remaining = expires - now;
      setTimeLeft(Math.max(0, remaining));
      
      const expiryProgress = getCouponExpiryProgress(couponData.activatedAt, couponData.expiresAt);
      setProgress(expiryProgress);
      
      const hours = getHoursUntilExpiry(couponData.expiresAt);
      setHoursLeft(hours);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [couponData]);

  if (loading || !couponData.isActive) return null;

  const isExpiringSoon = hoursLeft < 4;
  const shareLink = `https://workplex.app/${username || 'shop'}`;
  const whatsappMessage = `Shop on ${couponData.venture}! Use code ${couponData.code}: ${shareLink}`;

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass rounded-3xl p-6 relative overflow-hidden group"
      role="region"
      aria-label="Your coupon code information"
    >
      {/* Background glow effect */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#00C9A7] rounded-full mix-blend-screen filter blur-[80px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-500" />

      {/* Card Title */}
      <h3 className="text-white font-bold text-xl mb-5 font-display hover:text-[#00C9A7] transition-colors">Your Coupon Code</h3>

      {/* Coupon Code Display */}
      <div className="bg-[#0A0A0A]/60 rounded-2xl p-5 mb-5 border border-white/5 relative overflow-hidden">
        {/* Inner glow for coupon box effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#E8B84B]/5 to-transparent pointer-events-none" />
        <code className="inline-block text-3xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD57E] to-[#E8B84B] tracking-widest relative z-10 pb-1">
          {couponData.code}
        </code>
      </div>

      {/* 24-Hour Countdown Bar */}
      <div className="mb-6 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <span className="text-gray-300 text-sm font-semibold tracking-wide">
              {formatCountdown(timeLeft)} remaining
            </span>
          </div>
        </div>
        <div className="h-2 bg-[#0A0A0A]/80 rounded-full overflow-hidden border border-white/5">
          <motion.div
            className="h-full rounded-full shadow-[0_0_10px_rgba(232,184,75,0.5)]"
            style={{
              background: `linear-gradient(90deg, ${progress > 0.7 ? '#EF4444' : '#E8B84B'} 0%, ${progress > 0.7 ? '#F59E0B' : '#00C9A7'} 100%)`,
            }}
            initial={{ width: `${(1 - progress) * 100}%` }}
            animate={{ width: `${(1 - progress) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      {/* Usage Counter */}
      <div className="flex items-center justify-between mb-6 bg-[#0A0A0A]/40 rounded-xl p-4 border border-white/5 relative z-10">
        <div className="text-gray-400 text-sm font-medium">
          Used <span className="text-white font-black font-display text-lg mx-1">{couponData.usageCount}</span> times today
        </div>
        <div className="text-gray-400 text-sm font-medium">
          Earned: <span className="text-[#00C9A7] font-black font-display text-lg ml-1 text-shadow-teal">Rs.{couponData.totalEarned.toFixed(2)}</span>
        </div>
      </div>

      {/* Expiry Warning */}
      {isExpiringSoon && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl relative z-10"
        >
          <AlertTriangle size={20} className="text-red-500" />
          <span className="text-red-400 text-sm font-bold tracking-wide">
            Expires in {hoursLeft} hours - Final Push!
          </span>
        </motion.div>
      )}

      {/* Share Button */}
      <button
        onClick={handleShareWhatsApp}
        className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#32DF73] hover:to-[#17A596] shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:shadow-[0_0_30px_rgba(37,211,102,0.5)] text-white font-black py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] min-h-[52px] relative z-10"
        aria-label="Share coupon code on WhatsApp"
      >
        <Share2 size={20} />
        Share on WhatsApp
      </button>
    </motion.div>
  );
};
