/**
 * CommissionCalculator Component
 * Educational simulator to help workers understand earnings
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, IndianRupee, TrendingUp } from 'lucide-react';
import { getCommissionBreakdown, formatCurrency } from '../../utils/coupon';

interface CommissionCalculatorProps {
  defaultPrice?: number;
}

export const CommissionCalculator: React.FC<CommissionCalculatorProps> = ({
  defaultPrice = 1000,
}) => {
  const [productPrice, setProductPrice] = useState(defaultPrice.toString());

  const breakdown = useMemo(() => {
    const price = parseFloat(productPrice) || 0;
    return getCommissionBreakdown(price);
  }, [productPrice]);

  const presets = [500, 1000, 2000, 5000, 10000];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111111] rounded-2xl border border-gray-800/50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-800/50 flex items-center gap-3">
        <div className="p-2.5 bg-[#E8B84B]/10 rounded-xl">
          <Calculator size={20} className="text-[#E8B84B]" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Commission Calculator</h3>
          <p className="text-gray-500 text-xs">Understand how your earnings are calculated</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Price Input */}
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Simulate Product Price</label>
          <div className="relative">
            <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="number"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              placeholder="Enter price"
              className="w-full pl-12 pr-4 py-3 bg-[#1A1A1A] border border-gray-800/50 rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors min-h-[44px]"
              aria-label="Product price"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <p className="text-gray-500 text-xs mb-2">Quick Select</p>
          <div className="flex gap-2 flex-wrap">
            {presets.map((price) => (
              <button
                key={price}
                onClick={() => setProductPrice(price.toString())}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                  parseFloat(productPrice) === price
                    ? 'bg-[#E8B84B]/20 text-[#E8B84B] border border-[#E8B84B]/30'
                    : 'bg-[#1A1A1A] text-gray-400 border border-gray-800/50'
                }`}
              >
                Rs.{price.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-[#1A1A1A] rounded-xl p-4 space-y-3">
          <h4 className="text-white font-semibold text-sm flex items-center gap-2">
            <TrendingUp size={16} className="text-[#E8B84B]" />
            Earnings Breakdown
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Product Price</span>
              <span className="text-white font-semibold">{formatCurrency(breakdown.productPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">HVRS Margin (17.5%)</span>
              <span className="text-purple-400 font-semibold">{formatCurrency(breakdown.margin)}</span>
            </div>
            <div className="border-t border-gray-800 pt-2 flex justify-between">
              <span className="text-gray-300 font-semibold">Your Commission (10% of margin)</span>
              <span className="text-green-400 font-black text-lg">{formatCurrency(breakdown.commission)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-xs">HVRS Profit</span>
              <span className="text-gray-400 text-xs">{formatCurrency(breakdown.hvrsProfit)}</span>
            </div>
          </div>
        </div>

        {/* Formula Explanation */}
        <div className="bg-[#E8B84B]/5 border border-[#E8B84B]/20 rounded-xl p-4">
          <p className="text-[#E8B84B] text-xs font-semibold mb-1">💡 How it works</p>
          <p className="text-gray-400 text-xs leading-relaxed">
            You earn 10% of HVRS's margin, NOT 10% of the product price. 
            For a Rs.1,000 product, HVRS keeps Rs.175 margin, and you earn Rs.17.50.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
