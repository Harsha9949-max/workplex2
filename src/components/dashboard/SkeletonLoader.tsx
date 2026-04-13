/**
 * SkeletonLoader Component
 * Shimmer loading effect for all dashboard sections
 */

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  type: 'topbar' | 'coupon' | 'predictor' | 'task' | 'progress' | 'announcement';
  count?: number;
}

const shimmerAnimation = {
  background: 'linear-gradient(90deg, #1A1A1A 0%, #2A2A2A 50%, #1A1A1A 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
};

const SkeletonBlock: React.FC<{ width?: string; height: string; borderRadius?: string }> = ({
  width = '100%',
  height,
  borderRadius = '12px',
}) => (
  <div
    style={{
      ...shimmerAnimation,
      width,
      height,
      borderRadius,
    }}
  />
);

export const SkeletonLoader: React.FC<SkeletonProps> = ({ type, count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'topbar':
        return (
          <div className="bg-[#111111] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonBlock width="48px" height="48px" borderRadius="50%" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock height="20px" width="60%" />
                <SkeletonBlock height="14px" width="40%" />
              </div>
            </div>
            <SkeletonBlock height="32px" width="50%" />
            <div className="flex justify-between">
              <SkeletonBlock height="16px" width="30%" />
              <SkeletonBlock height="16px" width="25%" />
            </div>
          </div>
        );

      case 'coupon':
        return (
          <div className="bg-[#111111] rounded-2xl p-5 space-y-4">
            <SkeletonBlock height="20px" width="40%" />
            <SkeletonBlock height="36px" width="70%" />
            <SkeletonBlock height="8px" width="100%" />
            <div className="flex justify-between">
              <SkeletonBlock height="16px" width="35%" />
              <SkeletonBlock height="40px" width="120px" borderRadius="8px" />
            </div>
          </div>
        );

      case 'predictor':
        return (
          <div className="bg-[#111111] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonBlock width="40px" height="40px" borderRadius="10px" />
              <SkeletonBlock height="18px" width="60%" />
            </div>
            <SkeletonBlock height="16px" width="80%" />
            <SkeletonBlock height="36px" width="100px" borderRadius="8px" />
          </div>
        );

      case 'task':
        return Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-[#111111] rounded-2xl p-4 space-y-3 min-w-[280px]">
            <SkeletonBlock height="18px" width="70%" />
            <SkeletonBlock height="24px" width="80px" borderRadius="6px" />
            <SkeletonBlock height="24px" width="50%" />
            <SkeletonBlock height="16px" width="40%" />
            <div className="flex gap-2">
              <SkeletonBlock height="40px" width="80px" borderRadius="8px" />
              <SkeletonBlock height="40px" width="80px" borderRadius="8px" />
            </div>
          </div>
        ));

      case 'progress':
        return (
          <div className="bg-[#111111] rounded-2xl p-5 space-y-3">
            <SkeletonBlock height="20px" width="50%" />
            <SkeletonBlock height="12px" width="100%" />
            <div className="flex justify-between">
              <SkeletonBlock height="16px" width="35%" />
              <SkeletonBlock height="16px" width="30%" />
            </div>
          </div>
        );

      case 'announcement':
        return (
          <div className="h-10 bg-[#111111] rounded-lg" />
        );

      default:
        return <SkeletonBlock height="100px" />;
    }
  };

  return <>{renderSkeleton()}</>;
};
