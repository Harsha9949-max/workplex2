/**
 * WithdrawalStatusBadge Component
 * Status indicator for withdrawals
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, XCircle, Loader2 } from 'lucide-react';

interface WithdrawalStatusBadgeProps {
  status: string;
}

export const WithdrawalStatusBadge: React.FC<WithdrawalStatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-yellow-500/10',
          text: 'text-yellow-400',
          border: 'border-yellow-500/30',
          icon: <Clock size={14} />,
          label: 'Pending',
          message: 'Admin will review within 24-48 hours',
        };
      case 'approved':
        return {
          bg: 'bg-green-500/10',
          text: 'text-green-400',
          border: 'border-green-500/30',
          icon: <CheckCircle size={14} />,
          label: 'Approved',
          message: 'Processing payment to your UPI...',
        };
      case 'processing':
        return {
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          icon: <Loader2 size={14} className="animate-spin" />,
          label: 'Processing',
          message: 'Payment initiated. You\'ll receive it soon.',
        };
      case 'paid':
        return {
          bg: 'bg-green-500/10',
          text: 'text-green-400',
          border: 'border-green-500/30',
          icon: <CheckCircle size={14} />,
          label: 'Paid',
          message: 'Credited to your UPI',
        };
      case 'rejected':
        return {
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          border: 'border-red-500/30',
          icon: <XCircle size={14} />,
          label: 'Rejected',
          message: 'Amount returned to wallet',
        };
      case 'failed':
        return {
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          border: 'border-red-500/30',
          icon: <AlertCircle size={14} />,
          label: 'Failed',
          message: 'Payment failed. Contact support.',
        };
      default:
        return {
          bg: 'bg-gray-500/10',
          text: 'text-gray-400',
          border: 'border-gray-500/30',
          icon: <Clock size={14} />,
          label: 'Unknown',
          message: '',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      {config.icon}
      <span className="text-xs font-semibold">{config.label}</span>
    </div>
  );
};
