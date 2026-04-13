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
      className="bg-gradient-to-br from-[#111111] to-[#1A1A1A] rounded-2xl p-5 border border-gray-800/50 relative overflow-hidden"
      role="region"
      aria-label="Your coupon code information"
    >
      {/* Background glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8B84B]/5 rounded-full blur-3xl" />

      {/* Card Title */}
      <h3 className="text-white font-bold text-lg mb-4">Your Coupon Code</h3>

      {/* Coupon Code Display */}
      <div className="bg-[#0A0A0A] rounded-xl p-4 mb-4 border border-[#E8B84B]/30">
        <code className="text-2xl font-mono font-black text-[#E8B84B] tracking-wider">
          {couponData.code}
        </code>
      </div>

      {/* 24-Hour Countdown Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={14} className="text-gray-400" />
          <span className="text-gray-400 text-sm">
            {formatCountdown(timeLeft)} remaining
          </span>
        </div>
        <div className="h-2 bg-[#0A0A0A] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
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
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-400 text-sm">
          Used <span className="text-white font-bold">{couponData.usageCount}</span> times today
        </div>
        <div className="text-gray-400 text-sm">
          Earned: <span className="text-[#E8B84B] font-bold">Rs.{couponData.totalEarned.toFixed(2)}</span>
        </div>
      </div>

      {/* Expiry Warning */}
      {isExpiringSoon && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl"
        >
          <AlertTriangle size={16} className="text-red-500" />
          <span className="text-red-500 text-sm font-semibold">
            Expires in {hoursLeft} hours
          </span>
        </motion.div>
      )}

      {/* Share Button */}
      <button
        onClick={handleShareWhatsApp}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[44px]"
        aria-label="Share coupon code on WhatsApp"
      >
        <Share2 size={18} />
        Share on WhatsApp
      </button>
    </motion.div>
  );
};
