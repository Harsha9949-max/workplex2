/**
 * CouponHeroCard Component
 * Code display + countdown + share button
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Share2, Check, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { CouponData } from '../../hooks/useCoupon';
import { StatusBadge } from './StatusBadge';
import { CountdownTimer } from './CountdownTimer';
import { isCouponActive, isCouponExpired, generateWhatsAppMessage } from '../../utils/coupon';

interface CouponHeroCardProps {
  coupon: CouponData;
  username?: string;
}

export const CouponHeroCard: React.FC<CouponHeroCardProps> = ({
  coupon,
  username,
}) => {
  const [copied, setCopied] = useState(false);

  const active = isCouponActive(coupon.isActive, coupon.expiresAt);
  const expired = isCouponExpired(coupon.expiresAt);

  const getStatus = (): 'active' | 'inactive' | 'expired' => {
    if (expired) return 'expired';
    if (active) return 'active';
    return 'inactive';
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast.success('Code copied!', {
        duration: 2000,
        style: { background: '#111', color: '#fff', border: '1px solid #E8B84B' },
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShareWhatsApp = () => {
    const link = username ? `https://workplex.app/${username}` : '';
    const message = generateWhatsAppMessage(coupon.venture, coupon.code, link);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-[#E8B84B]/30"
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E8B84B]/10 via-[#E8B84B]/5 to-[#00C9A7]/10" />
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#E8B84B]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00C9A7]/10 rounded-full blur-3xl" />

      <div className="relative p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-[#E8B84B]" />
            <h2 className="text-white font-bold text-lg">My Coupon Code</h2>
          </div>
          <StatusBadge status={getStatus()} />
        </div>

        {/* Code Display */}
        <div className="bg-[#0A0A0A]/60 backdrop-blur-sm rounded-xl p-5 border border-[#E8B84B]/20">
          <div className="flex items-center justify-between">
            <code className="text-3xl md:text-4xl font-mono font-black text-[#E8B84B] tracking-wider">
              {coupon.code}
            </code>
            <button
              onClick={handleCopy}
              className="p-3 bg-[#E8B84B]/10 hover:bg-[#E8B84B]/20 rounded-xl transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Copy coupon code"
            >
              {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} className="text-[#E8B84B]" />}
            </button>
          </div>
        </div>

        {/* Countdown Timer */}
        {coupon.expiresAt && (
          <div className="bg-[#0A0A0A]/40 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-2">Expires in</p>
            <CountdownTimer expiresAt={coupon.expiresAt} />
          </div>
        )}

        {/* Share Button */}
        <button
          onClick={handleShareWhatsApp}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[44px]"
          aria-label="Share coupon on WhatsApp"
        >
          <Share2 size={18} />
          Share on WhatsApp
        </button>
      </div>
    </motion.div>
  );
};
