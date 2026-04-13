/**
 * SkeletonCoupon Component
 * Loading skeleton for coupon dashboard
 */

import React from 'react';

const shimmerStyle = {
  background: 'linear-gradient(90deg, #1A1A1A 0%, #2A2A2A 50%, #1A1A1A 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
};

export const SkeletonCoupon: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero Card Skeleton */}
      <div className="rounded-2xl border border-gray-800/50 p-6 space-y-5">
        <div className="flex justify-between">
          <div style={shimmerStyle} className="h-6 w-40 rounded-lg" />
          <div style={shimmerStyle} className="h-6 w-20 rounded-full" />
        </div>
        <div style={shimmerStyle} className="h-16 w-full rounded-xl" />
        <div style={shimmerStyle} className="h-20 w-full rounded-xl" />
        <div style={shimmerStyle} className="h-12 w-full rounded-xl" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#111111] rounded-2xl p-5 border border-gray-800/50 space-y-3">
            <div className="flex justify-between">
              <div style={shimmerStyle} className="h-10 w-10 rounded-xl" />
              <div style={shimmerStyle} className="h-4 w-12 rounded-lg" />
            </div>
            <div style={shimmerStyle} className="h-3 w-28 rounded-lg" />
            <div style={shimmerStyle} className="h-7 w-24 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-[#111111] rounded-2xl border border-gray-800/50 p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div style={shimmerStyle} className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div style={shimmerStyle} className="h-4 w-32 rounded-lg" />
              <div style={shimmerStyle} className="h-3 w-20 rounded-lg" />
            </div>
            <div style={shimmerStyle} className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};
