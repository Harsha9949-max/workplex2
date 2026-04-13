/**
 * CrossVentureSection Component
 * Shows tasks from other ventures when user has no tasks in own venture
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { TaskData } from '../../hooks/useTasks';
import { TaskCard } from './TaskCard';
import { EmptyState } from './EmptyState';

interface CrossVentureSectionProps {
  tasks: TaskData[];
  loading: boolean;
  onStart: (id: string) => void;
  onSkip: (id: string) => void;
  onResubmit: (id: string) => void;
}

export const CrossVentureSection: React.FC<CrossVentureSectionProps> = ({
  tasks,
  loading,
  onStart,
  onSkip,
  onResubmit,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-48 bg-[#1A1A1A] rounded-lg" />
        </div>
        <div className="h-4 w-64 bg-[#1A1A1A] rounded-lg" />
      </div>
    );
  }

  if (tasks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Section Header */}
      <div className="bg-gradient-to-r from-orange-500/10 to-orange-500/5 rounded-2xl p-5 border border-orange-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <TrendingUp size={20} className="text-orange-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">💰 Earn from Other Ventures Today</h3>
            <p className="text-gray-400 text-sm">
              Limited tasks available - lower pay but guaranteed earning
            </p>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={{ ...task, isCrossVenture: true }}
            onStart={onStart}
            onSkip={onSkip}
            onResubmit={onResubmit}
          />
        ))}
      </div>
    </motion.div>
  );
};
