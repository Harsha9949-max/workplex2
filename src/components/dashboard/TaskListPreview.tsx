/**
 * TaskListPreview Component
 * Displays up to 3 tasks in a horizontal scroll (mobile) or grid (web)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { TaskData } from '../../hooks/useFirestore';
import { TaskCard } from './TaskCard';
import { SkeletonLoader } from './SkeletonLoader';

interface TaskListPreviewProps {
  tasks: TaskData[];
  loading: boolean;
  onAccept: (id: string) => void;
  onSkip: (id: string) => void;
  onViewAll: () => void;
}

export const TaskListPreview: React.FC<TaskListPreviewProps> = ({
  tasks,
  loading,
  onAccept,
  onSkip,
  onViewAll,
}) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-[#1A1A1A] rounded-lg" />
          <div className="h-5 w-20 bg-[#1A1A1A] rounded-lg" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          <SkeletonLoader type="task" count={3} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="space-y-4"
      role="region"
      aria-label="Today's tasks preview"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-xl">Today's Tasks</h3>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-[#00C9A7] hover:text-[#00C9A7]/80 font-semibold text-sm transition-colors min-h-[44px] px-3"
          aria-label="View all tasks"
        >
          View All
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Tasks List */}
      {tasks.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 snap-x snap-mandatory">
          {tasks.slice(0, 3).map((task) => (
            <div key={task.id} className="snap-start">
              <TaskCard task={task} onAccept={onAccept} onSkip={onSkip} />
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#111111] rounded-2xl p-8 border border-gray-800/50 text-center"
        >
          <div className="text-6xl mb-4">📋</div>
          <h4 className="text-white font-bold text-lg mb-2">No tasks available</h4>
          <p className="text-gray-400 text-sm">Check back later for new opportunities!</p>
        </motion.div>
      )}
    </motion.div>
  );
};
