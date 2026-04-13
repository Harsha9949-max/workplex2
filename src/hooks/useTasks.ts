/**
 * Phase 3 Firestore Hooks
 * Real-time listeners for tasks and submissions
 */

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';

// Types
export interface TaskData {
  id: string;
  title: string;
  description: string;
  venture: string;
  role: string;
  earnAmount: number;
  deadline: any;
  proofType: 'image' | 'link' | 'text';
  proofRequirements: string;
  assignedTo: string[] | 'all';
  isCrossVenture: boolean;
  isMystery: boolean;
  createdAt: any;
  createdBy: string;
  status?: 'pending' | 'submitted' | 'approved' | 'rejected' | 'expired';
  submissionId?: string;
  submissionStatus?: string;
  rejectionReason?: string;
  resubmissionCount?: number;
}

export interface SubmissionData {
  id: string;
  taskId: string;
  workerId: string;
  workerName: string;
  proofUrl: string;
  proofType: 'image' | 'link' | 'text';
  proofText: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  reviewedAt: any;
  reviewedBy: string;
  rejectionReason: string;
  resubmissionCount: number;
  earnAmount: number;
  isCrossVenture: boolean;
}

/**
 * Hook to fetch all tasks for a user with real-time updates
 */
export const useTasks = (uid: string | null, venture: string | null, role: string | null) => {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !venture || !role) {
      setLoading(false);
      return;
    }

    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, orderBy('deadline', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const allTasks = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as TaskData[];

          // Filter tasks for this user's venture and role
          const filteredTasks = allTasks.filter((task) => {
            const matchesVenture = task.venture === venture || task.venture === 'all';
            const matchesRole = task.role === role || task.role === 'all';
            const isAssignedToUser =
              task.assignedTo === 'all' ||
              (Array.isArray(task.assignedTo) && task.assignedTo.includes(uid)) ||
              (!Array.isArray(task.assignedTo) && task.assignedTo === uid);

            return matchesVenture && matchesRole && isAssignedToUser;
          });

          // Fetch submission status for each task
          const submissionsRef = collection(db, 'taskSubmissions');
          const submissionsQuery = query(submissionsRef, where('workerId', '==', uid));
          const submissionsSnap = await getDoc(doc(db, 'taskSubmissions', 'placeholder'));

          // Get all submissions for this user
          const userSubmissions: Record<string, SubmissionData> = {};
          const unsubSub = onSnapshot(submissionsQuery, (subSnap) => {
            subSnap.docs.forEach((subDoc) => {
              const sub = { id: subDoc.id, ...subDoc.data() } as SubmissionData;
              userSubmissions[sub.taskId] = sub;
            });

            // Merge task data with submission status
            const tasksWithStatus = filteredTasks.map((task) => {
              const submission = userSubmissions[task.id];
              return {
                ...task,
                status: submission
                  ? (submission.status as TaskData['status'])
                  : 'pending',
                submissionId: submission?.id,
                submissionStatus: submission?.status,
                rejectionReason: submission?.rejectionReason,
                resubmissionCount: submission?.resubmissionCount || 0,
              };
            });

            setTasks(tasksWithStatus);
            setLoading(false);
          });

          return () => unsubSub();
        } catch (err: any) {
          setError(err.message);
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid, venture, role]);

  return { tasks, loading, error };
};

/**
 * Hook to fetch cross-venture tasks
 */
export const useCrossVentureTasks = (uid: string | null) => {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('isCrossVenture', '==', true),
      orderBy('deadline', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const crossTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TaskData[];

        setTasks(crossTasks);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsubscribe;
  }, [uid]);

  return { tasks, loading };
};

/**
 * Hook to submit proof for a task
 */
export const useSubmitProof = () => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (
    taskId: string,
    workerId: string,
    workerName: string,
    proofUrl: string,
    proofType: 'image' | 'link' | 'text',
    proofText: string,
    earnAmount: number,
    isCrossVenture: boolean,
    resubmissionCount: number = 0
  ) => {
    setSubmitting(true);
    setError(null);

    try {
      const submissionData = {
        taskId,
        workerId,
        workerName,
        proofUrl,
        proofType,
        proofText,
        status: 'pending' as const,
        submittedAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: '',
        rejectionReason: '',
        resubmissionCount,
        earnAmount,
        isCrossVenture,
      };

      await addDoc(collection(db, 'taskSubmissions'), submissionData);
      setSubmitting(false);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
      return { success: false, error: err.message };
    }
  };

  return { submit, submitting, error };
};

/**
 * Hook to resubmit proof for a rejected task
 */
export const useResubmitProof = () => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resubmit = async (
    submissionId: string,
    proofUrl: string,
    proofText: string,
    resubmissionCount: number
  ) => {
    setSubmitting(true);
    setError(null);

    try {
      const submissionRef = doc(db, 'taskSubmissions', submissionId);
      await updateDoc(submissionRef, {
        proofUrl,
        proofText,
        status: 'pending',
        submittedAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: '',
        rejectionReason: '',
        resubmissionCount: resubmissionCount + 1,
      });

      setSubmitting(false);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
      return { success: false, error: err.message };
    }
  };

  return { resubmit, submitting, error };
};

/**
 * Hook to skip a task
 */
export const useSkipTask = () => {
  const [skipping, setSkipping] = useState(false);

  const skip = async (taskId: string, uid: string) => {
    setSkipping(true);
    try {
      // Record the skip (optional - for analytics)
      const skipRef = doc(db, 'taskSkips', `${uid}_${taskId}_${Date.now()}`);
      await addDoc(collection(db, 'taskSkips'), {
        taskId,
        userId: uid,
        skippedAt: serverTimestamp(),
      });
      setSkipping(false);
      return { success: true };
    } catch (err: any) {
      setSkipping(false);
      return { success: false, error: err.message };
    }
  };

  return { skip, skipping };
};
