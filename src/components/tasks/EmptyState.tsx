/**
 * EmptyState Component
 * No tasks illustration and message
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No tasks available',
  subtitle = 'Check back later for new opportunities!',
  icon,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#111111] rounded-2xl p-12 border border-gray-800/50 text-center"
    >
      <div className="w-20 h-20 bg-[#1A1A1A] rounded-2xl flex items-center justify-center mx-auto mb-6">
        {icon || <ClipboardList size={40} className="text-gray-600" />}
      </div>
      <h3 className="text-white font-bold text-xl mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{subtitle}</p>
    </motion.div>
  );
};
