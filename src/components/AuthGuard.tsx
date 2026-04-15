/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AuthGuard — Centralized authentication guard component.
 *
 * Replaces 10 duplicate wrapper components that each independently:
 * - subscribed to onAuthStateChanged
 * - redirected via window.location.href (causing full page reloads)
 * - showed identical spinner UI
 *
 * This component:
 * - Uses React Router's useNavigate for SPA-style redirects (no page reload)
 * - Optionally fetches user data from Firestore
 * - Passes authenticated user (and optionally userData) to children via render props
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  /** Content to render when authenticated */
  children: (user: FirebaseUser, userData?: Record<string, unknown> | null) => ReactNode;
  /** If true, also fetches and passes userData from Firestore */
  requireUserData?: boolean;
}

/**
 * Loading spinner shown while auth state is resolving.
 * Matches the existing UI pattern used across all wrapper components.
 */
function AuthSpinner() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-[#E8B84B] animate-spin" />
    </div>
  );
}

export function AuthGuard({ children, requireUserData = false }: AuthGuardProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubUser: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        if (requireUserData) {
          // Subscribe to user data in Firestore
          unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data() as Record<string, unknown>);
            }
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } else {
        // SPA navigation — no full page reload!
        navigate('/auth', { replace: true });
      }
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, [navigate, requireUserData]);

  if (loading || !user) {
    return <AuthSpinner />;
  }

  if (requireUserData && !userData) {
    return <AuthSpinner />;
  }

  return <>{children(user, userData)}</>;
}

export default AuthGuard;
