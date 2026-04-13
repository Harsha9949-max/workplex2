/**
 * TasksScreen Component (Phase 3) - Simplified
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, increment, collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import toast, { Toaster } from 'react-hot-toast';
import { useUser } from '../../hooks/useFirestore';
import { useTasks, useCrossVentureTasks, useSubmitProof, useResubmitProof, useSkipTask } from '../../hooks/useTasks';
import { StatusTabs } from './StatusTabs';
import { TaskCard } from './TaskCard';
import { TaskDetail } from './TaskDetail';
import { ProofSubmissionModal } from './ProofSubmissionModal';
import { CrossVentureSection } from './CrossVentureSection';
import { FirstTaskCelebration } from './FirstTaskCelebration';
import { SkeletonTaskList } from './SkeletonTaskList';
import { EmptyState } from './EmptyState';
import { BottomNav } from '../dashboard/BottomNav';

interface TasksScreenProps {
  user: FirebaseUser;
}

const TasksScreen: React.FC<TasksScreenProps> = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitSubmissionId, setResubmitSubmissionId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const { userData, loading: userLoading } = useUser(user.uid);
  const { tasks, loading: tasksLoading } = useTasks(user.uid, userData?.venture || null, userData?.role || null);
  const { tasks: crossVentureTasks, loading: crossVentureLoading } = useCrossVentureTasks(user.uid);
  const { submit: submitProof } = useSubmitProof();
  const { resubmit: resubmitProof } = useResubmitProof();
  const { skip: skipTask } = useSkipTask();

  // Listen for approvals
  useEffect(() => {
    const q = query(collection(db, 'taskSubmissions'), where('workerId', '==', user.uid));
    const unsub = onSnapshot(q, async (snap) => {
      for (const change of snap.docChanges()) {
        if (change.type === 'modified') {
          const data = change.doc.data();
          if (data.status === 'approved' && userData) {
            await updateDoc(doc(db, 'users', user.uid), {
              'wallets.pending': increment(data.earnAmount),
            });
            await addDoc(collection(db, 'transactions'), {
              userId: user.uid, type: 'task_approved', amount: data.earnAmount,
              description: `Task approved`, createdAt: serverTimestamp(),
            });
            toast.success(`✅ Approved! Rs.${data.earnAmount} added to pending`);
            if (!userData.firstTaskDone) {
              await updateDoc(doc(db, 'users', user.uid), {
                firstTaskDone: true,
                'wallets.pending': increment(-27),
                'wallets.earned': increment(27),
              });
              setShowCelebration(true);
            }
          }
        }
      }
    });
    return unsub;
  }, [user.uid, userData]);

  const filteredTasks = useMemo(() => {
    return activeTab === 'all' ? tasks : tasks.filter((t) => t.status === activeTab);
  }, [tasks, activeTab]);

  const counts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    submitted: tasks.filter((t) => t.status === 'submitted').length,
    approved: tasks.filter((t) => t.status === 'approved').length,
    rejected: tasks.filter((t) => t.status === 'rejected').length,
  }), [tasks]);

  const hasTasksToday = useMemo(() => {
    const today = new Date().toDateString();
    return tasks.some((t) => {
      const d = t.createdAt?.toDate ? t.createdAt.toDate() : new Date();
      return d.toDateString() === today;
    });
  }, [tasks]);

  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId) || crossVentureTasks.find((t) => t.id === selectedTaskId);
  }, [selectedTaskId, tasks, crossVentureTasks]);

  const handleStartTask = useCallback((id: string) => {
    setSelectedTaskId(id);
    setShowTaskDetail(true);
  }, []);

  const handleSkipTask = useCallback(async (id: string) => {
    await skipTask(id, user.uid);
    toast('Skipped', { duration: 2000, style: { background: '#111', color: '#fff' } });
  }, [skipTask, user.uid]);

  const handleResubmit = useCallback((subId: string) => {
    setResubmitSubmissionId(subId);
    setIsResubmitting(true);
    setShowSubmitModal(true);
  }, []);

  const handleSubmitProof = useCallback(async (proofUrl: string, proofText: string) => {
    if (!selectedTask || !userData) return { success: false };
    if (isResubmitting && resubmitSubmissionId) {
      return resubmitProof(resubmitSubmissionId, proofUrl, proofText, selectedTask.resubmissionCount || 0);
    }
    return submitProof(selectedTask.id, user.uid, userData.name || 'User', proofUrl, selectedTask.proofType, proofText, selectedTask.earnAmount, selectedTask.isCrossVenture || false, 0);
  }, [selectedTask, userData, isResubmitting, resubmitSubmissionId, submitProof, resubmitProof, user.uid]);

  const handleClose = useCallback(() => {
    setShowTaskDetail(false);
    setSelectedTaskId(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowSubmitModal(false);
    setIsResubmitting(false);
    setResubmitSubmissionId(null);
  }, []);

  // Loading
  if (userLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-24">
        <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
          <div className="space-y-2"><div className="h-8 w-32 bg-[#1A1A1A] rounded-lg" /><div className="h-4 w-48 bg-[#1A1A1A] rounded-lg" /></div>
          <div className="flex gap-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 w-24 bg-[#1A1A1A] rounded-xl" />)}</div>
          <SkeletonTaskList count={5} />
        </div>
        <BottomNav activeTab="tasks" />
      </div>
    );
  }

  // Detail view
  if (showTaskDetail && selectedTask) {
    return (
      <>
        <TaskDetail task={selectedTask} onBack={handleClose} onSubmit={() => { setShowSubmitModal(true); setIsResubmitting(false); }} hasSubmitted={selectedTask.status === 'submitted' || selectedTask.status === 'approved'} />
        {showSubmitModal && <ProofSubmissionModal isOpen={showSubmitModal} onClose={handleCloseModal} task={selectedTask} onSubmit={handleSubmitProof} isResubmit={isResubmitting} />}
      </>
    );
  }

  // Main view
  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <Toaster position="top-center" />
      <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
        <div><h1 className="text-3xl font-bold text-white mb-1">Tasks</h1><p className="text-gray-400 text-sm">Complete tasks to earn money</p></div>
        <StatusTabs activeTab={activeTab} counts={counts} onTabChange={setActiveTab} />
        {filteredTasks.length > 0 ? (
          <div className="space-y-4">{filteredTasks.map((task) => <TaskCard key={task.id} task={task} onStart={handleStartTask} onSkip={handleSkipTask} onResubmit={handleResubmit} />)}</div>
        ) : <EmptyState />}
        {!hasTasksToday && filteredTasks.length === 0 && <CrossVentureSection tasks={crossVentureTasks} loading={crossVentureLoading} onStart={handleStartTask} onSkip={handleSkipTask} onResubmit={handleResubmit} />}
      </div>
      <BottomNav activeTab="tasks" />
      {showSubmitModal && selectedTask && <ProofSubmissionModal isOpen={showSubmitModal} onClose={handleCloseModal} task={selectedTask} onSubmit={handleSubmitProof} isResubmit={isResubmitting} />}
      <FirstTaskCelebration isOpen={showCelebration} onClose={() => setShowCelebration(false)} />
    </div>
  );
};

export default TasksScreen;
