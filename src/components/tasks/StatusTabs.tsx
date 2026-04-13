/**
 * StatusTabs Component
 * Filter tabs with count badges
 */

import React from 'react';
import { motion } from 'framer-motion';

interface StatusTabsProps {
  activeTab: string;
  counts: {
    all: number;
    pending: number;
    submitted: number;
    approved: number;
    rejected: number;
  };
  onTabChange: (tab: string) => void;
}

export const StatusTabs: React.FC<StatusTabsProps> = ({
  activeTab,
  counts,
  onTabChange,
}) => {
  const tabs = [
    { id: 'all', label: 'All Tasks', count: counts.all, color: 'text-white' },
    { id: 'pending', label: 'Pending', count: counts.pending, color: 'text-yellow-400' },
    { id: 'submitted', label: 'Submitted', count: counts.submitted, color: 'text-blue-400' },
    { id: 'approved', label: 'Approved', count: counts.approved, color: 'text-green-400' },
    { id: 'rejected', label: 'Rejected', count: counts.rejected, color: 'text-red-400' },
  ];

  return (
    <div className="relative">
      {/* Horizontal scroll container */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all min-h-[44px]"
              aria-label={`${tab.label}: ${tab.count} tasks`}
              aria-pressed={isActive}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#1A1A1A] rounded-xl border border-white/[0.06]"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Content */}
              <span className={`relative z-10 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                {tab.label}
              </span>
              <span
                className={`relative z-10 px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-[#E8B84B]/20 text-[#E8B84B]'
                    : `bg-gray-800 ${tab.color}`
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
