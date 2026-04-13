/**
 * TaskDetail Component
 * Full task view with countdown, instructions, and submit button
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Info, Coins, Clock, CheckCircle, Upload } from 'lucide-react';
import { TaskData } from '../../hooks/useTasks';
import { formatCurrency, getVentureColor, getProofTypeInfo } from '../../utils/tasks';
import { CountdownTimer } from './CountdownTimer';
import { AIProofReviewStatus } from '../ai';

interface TaskDetailProps {
  task: TaskData;
  onBack: () => void;
  onSubmit: () => void;
  hasSubmitted?: boolean;
  aiReview?: any;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
  onBack,
  onSubmit,
  hasSubmitted = false,
  aiReview,
}) => {
  const ventureColors = getVentureColor(task.venture);
  const proofInfo = getProofTypeInfo(task.proofType);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="min-h-screen bg-[#0A0A0A] pb-24"
    >
      {/* Header */}
      <div className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-gray-800/50 p-4 flex items-center justify-between z-10">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
        <span
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${ventureColors.bg} ${ventureColors.text} ${ventureColors.border}`}
        >
          {task.venture}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Task Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-white">{task.title}</h1>

        {/* Earning Amount Hero */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#111111] to-[#1A1A1A] rounded-3xl p-8 border border-gray-800/50 text-center relative overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#E8B84B]/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block mb-4"
            >
              <Coins size={48} className="text-[#E8B84B]" />
            </motion.div>
            <div className="text-5xl font-black text-[#E8B84B] mb-2">
              {formatCurrency(task.earnAmount)}
            </div>
            <p className="text-gray-400 text-sm">Earn on approval</p>
          </div>
        </motion.div>

        {/* Deadline Timer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#111111] rounded-2xl p-6 border border-gray-800/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-gray-400" />
            <h3 className="text-white font-bold">Time Remaining</h3>
          </div>
          <CountdownTimer deadline={task.deadline} size="lg" showLabel={false} />
        </motion.div>

        {/* Task Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#111111] rounded-2xl p-6 border border-gray-800/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Info size={20} className="text-[#00C9A7]" />
            <h3 className="text-white font-bold">Instructions</h3>
          </div>
          <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
            {task.description}
          </div>
        </motion.div>

        {/* Proof Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#111111] rounded-2xl p-6 border border-gray-800/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={20} className="text-[#E8B84B]" />
            <h3 className="text-white font-bold">What to Submit</h3>
          </div>

          <div className="flex items-start gap-4">
            <div className="text-3xl">{proofInfo.icon}</div>
            <div className="flex-1">
              <p className="text-white font-semibold mb-1">{proofInfo.label}</p>
              {task.proofRequirements && (
                <p className="text-gray-400 text-sm leading-relaxed">
                  {task.proofRequirements}
                </p>
              )}
            </div>
          </div>

          {/* AI Review Status */}
          {hasSubmitted && <AIProofReviewStatus status={task.status} aiReview={aiReview} />}
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="sticky bottom-0 bg-[#0A0A0A] pt-4 pb-4"
        >
          {hasSubmitted ? (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center">
              <p className="text-blue-400 font-bold mb-1">✅ Already Submitted</p>
              <p className="text-gray-500 text-sm">Awaiting Review</p>
            </div>
          ) : (
            <button
              onClick={onSubmit}
              className="w-full bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] text-black font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] min-h-[44px] text-lg shadow-lg shadow-[#E8B84B]/20"
              aria-label="Submit proof for this task"
            >
              <Upload size={20} />
              Submit Proof
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TaskDetail;
