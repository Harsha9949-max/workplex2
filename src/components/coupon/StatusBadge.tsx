/**
 * StatusBadge Component (Phase 5)
 * Reusable status indicator
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'expired' | 'held' | 'released' | 'pending';
  extraText?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, extraText }) => {
  const getConfig = () => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-green-500/10',
          text: 'text-green-400',
          border: 'border-green-500/30',
          icon: <CheckCircle size={14} className="animate-pulse" />,
          label: 'Active',
        };
      case 'inactive':
        return {
          bg: 'bg-gray-500/10',
          text: 'text-gray-400',
          border: 'border-gray-500/30',
          icon: <Clock size={14} />,
          label: 'Inactive',
        };
      case 'expired':
        return {
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          border: 'border-red-500/30',
          icon: <XCircle size={14} />,
          label: 'Expired',
        };
      case 'held':
        return {
          bg: 'bg-yellow-500/10',
          text: 'text-yellow-400',
          border: 'border-yellow-500/30',
          icon: <Clock size={14} />,
          label: 'Held',
        };
      case 'released':
        return {
          bg: 'bg-green-500/10',
          text: 'text-green-400',
          border: 'border-green-500/30',
          icon: <CheckCircle size={14} />,
          label: 'Released',
        };
      case 'pending':
        return {
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          icon: <AlertCircle size={14} />,
          label: 'Pending',
        };
      default:
        return {
          bg: 'bg-gray-500/10',
          text: 'text-gray-400',
          border: 'border-gray-500/30',
          icon: <Clock size={14} />,
          label: status,
        };
    }
  };

  const config = getConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${config.bg} ${config.text} ${config.border}`}
    >
      {config.icon}
      {config.label}
      {extraText && <span className="opacity-70">({extraText})</span>}
    </span>
  );
};
