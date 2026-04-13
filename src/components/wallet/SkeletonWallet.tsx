/**
 * SkeletonWallet Component
 * Shimmer loading skeleton for wallet cards
 */

import React from 'react';

const shimmerStyle = {
  background: 'linear-gradient(90deg, #1A1A1A 0%, #2A2A2A 50%, #1A1A1A 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
};

export const SkeletonWallet: React.FC = () => {
  return (
    <div className="bg-[#111111] rounded-2xl p-6 border border-gray-800/50">
      <div className="flex items-center justify-between mb-4">
        <div style={shimmerStyle} className="h-6 w-28 rounded-lg" />
        <div style={shimmerStyle} className="h-8 w-8 rounded-full" />
      </div>
      <div style={shimmerStyle} className="h-8 w-32 rounded-lg mb-2" />
      <div style={shimmerStyle} className="h-4 w-40 rounded-lg mb-4" />
      <div style={shimmerStyle} className="h-2 w-full rounded-full mb-3" />
      <div style={shimmerStyle} className="h-11 w-full rounded-xl" />
    </div>
  );
};

export const SkeletonTransaction: React.FC = () => {
  return (
    <div className="flex items-center gap-4 p-4">
      <div style={shimmerStyle} className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <div style={shimmerStyle} className="h-4 w-48 rounded-lg mb-2" />
        <div style={shimmerStyle} className="h-3 w-24 rounded-lg" />
      </div>
      <div style={shimmerStyle} className="h-5 w-20 rounded-lg" />
    </div>
  );
};
