/**
 * HomeDashboard Component
 * Main container for the WorkPlex home dashboard
 * Integrates all sub-components with real-time Firestore data
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { AIEarningsPredictorBanner } from '../ai';

// Custom hooks
import {
  useUser,
  useCoupon,
  useTasks,
  useAnnouncements,
  useMonthlyEarnings,
} from '../../hooks/useFirestore';

// Components
import { TopBar } from './TopBar';
import { CouponCard } from './CouponCard';
import { AIEarningsPredictor } from './AIEarningsPredictor';
import { TaskListPreview } from './TaskListPreview';
import { LeadMarketerProgress } from './LeadMarketerProgress';
import { MysteryBonusModal } from './MysteryBonusModal';
import { AnnouncementBanner } from './AnnouncementBanner';
import { BottomNav } from './BottomNav';
import { SkeletonLoader } from './SkeletonLoader';

// Utils
import { shouldShowCouponCard, isReseller } from '../../utils/dashboard';

interface HomeDashboardProps {
  user: FirebaseUser;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [showMysteryModal, setShowMysteryModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'error'>('connected');

  // Subscribe to real-time data
  const { userData, loading: userLoading, error: userError } = useUser(user.uid);
  const { couponData, loading: couponLoading, error: couponError } = useCoupon(user.uid);
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks(
    user.uid,
    userData?.venture || null,
    userData?.role || null,
    3
  );
  const { announcements, loading: announcementsLoading, error: announcementsError } = useAnnouncements();
  const { monthlyEarnings, loading: earningsLoading } = useMonthlyEarnings(user.uid);

  // Check for errors
  useEffect(() => {
    if (userError || couponError || tasksError) {
      setConnectionStatus('error');
      toast.error('Connection issue. Please refresh the page.', {
        duration: 4000,
        style: {
          background: '#111111',
          color: '#fff',
          border: '1px solid #EF4444',
        },
      });
    }
  }, [userError, couponError, tasksError]);

  // Mystery Bonus Task trigger (15% chance on load)
  useEffect(() => {
    const shouldShow = Math.random() < 0.15;
    if (shouldShow && !userLoading) {
      setShowMysteryModal(true);
    }
  }, [userLoading]);

  // Handlers
  const handleViewTasks = useCallback(() => {
    navigate('/tasks');
  }, [navigate]);

  const handleAcceptTask = useCallback(async (taskId: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        acceptedBy: user.uid,
      });

      toast.success('Task accepted! Complete it to earn rewards.', {
        duration: 3000,
        style: {
          background: '#111111',
          color: '#fff',
          border: '1px solid #10B981',
        },
      });
    } catch (error) {
      toast.error('Failed to accept task. Please try again.', {
        duration: 3000,
        style: {
          background: '#111111',
          color: '#fff',
          border: '1px solid #EF4444',
        },
      });
    }
  }, [user.uid]);

  const handleSkipTask = useCallback(async (taskId: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: 'skipped',
        skippedAt: serverTimestamp(),
        skippedBy: user.uid,
      });

      toast('Task skipped. No worries!', {
        duration: 2000,
        style: {
          background: '#111111',
          color: '#fff',
        },
      });
    } catch (error) {
      toast.error('Failed to skip task. Please try again.', {
        duration: 3000,
        style: {
          background: '#111111',
          color: '#fff',
          border: '1px solid #EF4444',
        },
      });
    }
  }, [user.uid]);

  const handleAcceptMysteryTask = useCallback(async () => {
    try {
      // Create a mystery task in Firestore
      const mysteryTaskRef = doc(db, 'tasks', `mystery_${Date.now()}`);
      await setDoc(mysteryTaskRef, {
        title: '🎁 Mystery Bonus Task',
        description: 'Complete this special task within 2 hours to earn Rs.75 bonus',
        venture: userData?.venture || 'all',
        role: userData?.role || 'all',
        earning: 75,
        deadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        status: 'assigned',
        assignedTo: user.uid,
        isMystery: true,
        createdAt: serverTimestamp(),
        userId: user.uid,
      });

      toast.success('Mystery task added to your tasks!', {
        duration: 3000,
        style: {
          background: '#111111',
          color: '#fff',
          border: '1px solid #E8B84B',
        },
      });
    } catch (error) {
      toast.error('Failed to add mystery task. Please try again.', {
        duration: 3000,
        style: {
          background: '#111111',
          color: '#fff',
          border: '1px solid #EF4444',
        },
      });
    }
  }, [user.uid, userData]);

  const handleRetry = useCallback(() => {
    setConnectionStatus('reconnecting');
    window.location.reload();
  }, []);

  // Memoized values
  const showCoupon = useMemo(() => {
    return userData && shouldShowCouponCard(userData.role);
  }, [userData]);

  const showResellerCatalog = useMemo(() => {
    return userData && isReseller(userData.role);
  }, [userData]);

  // Loading state with progressive loading (top bar first)
  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-24">
        <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
          <SkeletonLoader type="topbar" />
          <SkeletonLoader type="coupon" />
          <SkeletonLoader type="predictor" />
          <SkeletonLoader type="task" count={3} />
          <SkeletonLoader type="progress" />
        </div>
        <BottomNav activeTab="home" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-white mb-2">User not found</h2>
          <p className="text-gray-400 mb-6">Please log in again or contact support.</p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-[#E8B84B] text-black font-bold px-8 py-4 rounded-xl min-h-[44px]"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      {/* Connection Status Banner */}
      {connectionStatus === 'reconnecting' && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 bg-yellow-500/20 border-b border-yellow-500/30 p-3 z-50"
        >
          <p className="text-yellow-500 text-center font-semibold">Reconnecting...</p>
        </motion.div>
      )}

      {connectionStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 bg-red-500/20 border-b border-red-500/30 p-3 z-50 flex items-center justify-center gap-4"
        >
          <p className="text-red-500 font-semibold">Connection lost</p>
          <button
            onClick={handleRetry}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold min-h-[44px]"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
        {/* Toast Notifications */}
        <Toaster position="top-center" />

        {/* SECTION 1: Top Bar */}
        <TopBar userData={userData} loading={userLoading} />

        {/* SECTION 2: Coupon Card (Conditional) */}
        {showCoupon && couponData && (
          <CouponCard
            couponData={couponData}
            loading={couponLoading}
            username={userData.username}
          />
        )}

        {/* Reseller Product Catalog Shortcut */}
        {showResellerCatalog && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            onClick={() => navigate('/reseller-catalog')}
            className="bg-gradient-to-r from-[#00C9A7]/20 to-[#10B981]/20 rounded-2xl p-5 border border-[#00C9A7]/30 cursor-pointer hover:from-[#00C9A7]/30 hover:to-[#10B981]/30 transition-all"
            role="button"
            aria-label="View product catalog"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate('/reseller-catalog');
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className="text-4xl">🛍️</div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">Product Catalog</h3>
                <p className="text-gray-400 text-sm">Browse and share products with your network</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 3: AI Earnings Predictor */}
        <AIEarningsPredictorBanner
          userId={user.uid}
          pendingTasksCount={tasks.length}
          avgEarning={50}
          completionRate={userData?.completionRate || 80}
        />

        {/* SECTION 4: Today's Tasks */}
        <TaskListPreview
          tasks={tasks}
          loading={tasksLoading}
          onAccept={handleAcceptTask}
          onSkip={handleSkipTask}
          onViewAll={handleViewTasks}
        />

        {/* SECTION 5: Lead Marketer Progress */}
        <LeadMarketerProgress
          userData={userData}
          monthlyEarnings={monthlyEarnings}
        />

        {/* SECTION 6: Mystery Bonus Modal */}
        <MysteryBonusModal
          isOpen={showMysteryModal}
          onClose={() => setShowMysteryModal(false)}
          onAccept={handleAcceptMysteryTask}
        />

        {/* SECTION 7: Admin Announcements */}
        <AnnouncementBanner
          announcements={announcements}
          loading={announcementsLoading}
        />
      </div>

      {/* SECTION 8: Bottom Navigation */}
      <BottomNav activeTab="home" />
    </div>
  );
};

export default HomeDashboard;
