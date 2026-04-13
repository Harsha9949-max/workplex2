/**
 * SkeletonTaskList Component
 * Shimmer loading skeleton for task list
 */

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonTaskListProps {
  count?: number;
}

const shimmerStyle = {
  background: 'linear-gradient(90deg, #1A1A1A 0%, #2A2A2A 50%, #1A1A1A 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
};

export const SkeletonTaskList: React.FC<SkeletonTaskListProps> = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#111111] rounded-2xl p-4 border border-gray-800/50">
          {/* Venture Badge + Status */}
          <div className="flex justify-between mb-3">
            <div
              style={shimmerStyle}
              className="h-6 w-20 rounded-lg"
            />
            <div
              style={shimmerStyle}
              className="h-6 w-24 rounded-lg"
            />
          </div>

          {/* Title */}
          <div
            style={shimmerStyle}
            className="h-5 w-3/4 rounded-lg mb-2"
          />
          <div
            style={shimmerStyle}
            className="h-5 w-1/2 rounded-lg mb-3"
          />

          {/* Earning + Timer */}
          <div className="flex justify-between mb-3">
            <div
              style={shimmerStyle}
              className="h-8 w-28 rounded-lg"
            />
            <div
              style={shimmerStyle}
              className="h-6 w-20 rounded-lg"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <div
              style={shimmerStyle}
              className="h-11 flex-1 rounded-xl"
            />
            <div
              style={shimmerStyle}
              className="h-11 w-11 rounded-xl"
            />
          </div>
        </div>
      ))}

      {/* Shimmer animation style */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};
