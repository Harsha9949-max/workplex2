/**
 * TaskCard Component (Phase 3 - Updated)
 * Reusable task card with status, countdown, and actions
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Play, X, RefreshCw, AlertCircle } from 'lucide-react';
import { TaskData } from '../../hooks/useTasks';
import { formatCurrency, getStatusColor, getVentureColor } from '../../utils/tasks';
import { CountdownTimer } from './CountdownTimer';

interface TaskCardProps {
  task: TaskData;
  onStart: (id: string) => void;
  onSkip: (id: string) => void;
  onResubmit: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStart,
  onSkip,
  onResubmit,
}) => {
  const statusColors = getStatusColor(task.status || 'pending');
  const ventureColors = getVentureColor(task.venture);

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'submitted':
        return 'Submitted';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-[#111111] rounded-2xl p-4 border ${
        task.isCrossVenture ? 'border-orange-500/30' : 'border-gray-800/50'
      } transition-all`}
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      {/* Top Row: Venture + Status */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${ventureColors.bg} ${ventureColors.text} ${ventureColors.border}`}
        >
          {task.venture}
        </span>

        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
        >
          {getStatusLabel(task.status)}
        </span>
      </div>

      {/* Task Title */}
      <h3 className="text-white font-bold text-base mb-2 line-clamp-2">{task.title}</h3>

      {/* Earning Amount */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#E8B84B] font-black text-2xl">
          {formatCurrency(task.earnAmount)}
        </span>

        {/* Countdown Timer */}
        <CountdownTimer deadline={task.deadline} size="sm" showLabel={false} />
      </div>

      {/* Cross-Venture Badge */}
      {task.isCrossVenture && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <span className="text-orange-400 text-xs font-semibold">
            💰 Cross-Venture Task
          </span>
        </div>
      )}

      {/* Action Buttons */}
      {task.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={() => onStart(task.id)}
            className="flex-1 bg-[#00C9A7] hover:bg-[#00b395] text-black font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px]"
            aria-label={`Start task: ${task.title}`}
          >
            <Play size={16} />
            Start
          </button>
          <button
            onClick={() => onSkip(task.id)}
            className="px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-400 font-semibold rounded-xl flex items-center justify-center transition-all min-h-[44px]"
            aria-label={`Skip task: ${task.title}`}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Rejection Details */}
      {task.status === 'rejected' && task.rejectionReason && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 text-sm mb-2">{task.rejectionReason}</p>
              <p className="text-gray-500 text-xs">
                Attempt {task.resubmissionCount || 0} of 3
              </p>
            </div>
          </div>

          {(task.resubmissionCount || 0) < 3 ? (
            <button
              onClick={() => onResubmit(task.submissionId || task.id)}
              className="w-full mt-2 bg-[#E8B84B] hover:bg-[#F5C95C] text-black font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px]"
              aria-label="Resubmit proof"
            >
              <RefreshCw size={16} />
              Resubmit Proof
            </button>
          ) : (
            <div className="w-full mt-2 py-2.5 bg-red-500/20 text-red-400 font-bold rounded-xl text-center text-sm cursor-not-allowed">
              Task Permanently Closed
            </div>
          )}
        </div>
      )}

      {/* Submitted Status */}
      {task.status === 'submitted' && (
        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <p className="text-blue-400 text-sm font-semibold">⏳ Awaiting Review</p>
          <p className="text-gray-500 text-xs mt-1">
            Your proof is under review. You'll be notified once approved.
          </p>
        </div>
      )}

      {/* Approved Status */}
      {task.status === 'approved' && (
        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
          <p className="text-green-400 text-sm font-semibold">✅ Approved</p>
          <p className="text-gray-500 text-xs mt-1">
            {formatCurrency(task.earnAmount)} added to your pending wallet
          </p>
        </div>
      )}
    </motion.div>
  );
};
