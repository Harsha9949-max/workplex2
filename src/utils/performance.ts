/**
 * Performance Optimizations for WorkPlex
 * Lazy loading, memoization, and code splitting utilities
 */

import React, { lazy, Suspense, ComponentType, FC } from 'react';
import { Loader2 } from 'lucide-react';

// ============================================================
// Loading Component - Minimal, fast, no dependencies
// ============================================================
const LoadingFallback: FC = () => (
  <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
    <Loader2 className="w-12 h-12 text-[#E8B84B] animate-spin" />
  </div>
);

// ============================================================
// Lazy Load Utility with Error Boundary
// ============================================================
export const lazyWithRetry = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): T => {
  return lazy(() =>
    importFunc().catch(() => {
      // Retry once on failure
      return importFunc();
    })
  ) as T;
};

// ============================================================
// Lazy Loaded Components (Code Splitting)
// ============================================================

// Pages - Load on demand
export const LazyAuthPage = lazyWithRetry(() => import('./pages/AuthPage'));
export const LazyLandingPage = lazyWithRetry(() => import('./pages/LandingPage'));

// Main App - Load after auth
export const LazyMainApp = lazyWithRetry(() => import('./App').then(mod => ({ default: mod.MainApp })));

// Feature Modules - Load only when needed
export const LazyTasksScreen = lazyWithRetry(() => import('./components/tasks').then(mod => ({ default: mod.TasksScreen })));
export const LazyWalletScreen = lazyWithRetry(() => import('./components/wallet').then(mod => ({ default: mod.WalletScreen })));
export const LazyCouponDashboard = lazyWithRetry(() => import('./components/coupon').then(mod => ({ default: mod.CouponDashboard })));
export const LazyLeaderboardScreen = lazyWithRetry(() => import('./components/gamification/index').then(mod => ({ default: mod.LeaderboardScreen })));

// Admin - Separate chunk
export const LazyAdminPanel = lazyWithRetry(() => import('./AdminPanel'));

// Partner Store - Separate chunk
export const LazyPartnerDashboard = lazyWithRetry(() => import('./components/partnerStore').then(mod => ({ default: mod.PartnerDashboard })));
export const LazyShopSetupWizard = lazyWithRetry(() => import('./components/partnerStore').then(mod => ({ default: mod.ShopSetupWizard })));
export const LazyPublicShopPage = lazyWithRetry(() => import('./components/partnerStore').then(mod => ({ default: mod.PublicShopPage })));

// Viral Components - Separate chunk
export const LazyPublicProfile = lazyWithRetry(() => import('./components/viral').then(mod => ({ default: mod.PublicProfile })));
export const LazyTeamChat = lazyWithRetry(() => import('./components/viral').then(mod => ({ default: mod.TeamChat })));

// Profile - Separate chunk
export const LazyProfileScreen = lazyWithRetry(() => import('./components/roles').then(mod => ({ default: mod.ProfileScreen })));

// ============================================================
// Suspense Wrapper with Fallback
// ============================================================
export const SuspenseWrapper: FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
);

// ============================================================
// Performance Monitoring Utility
// ============================================================
export const measureRenderTime = (componentName: string, renderFn: () => void) => {
  if (import.meta.env.DEV) {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    console.log(`[Performance] ${componentName} rendered in ${(end - start).toFixed(2)}ms`);
  } else {
    renderFn();
  }
};

// ============================================================
// Image Optimization Utility
// ============================================================
export const optimizeImage = (url: string, width = 400, quality = 80) => {
  // If using a CDN or image service, apply transformations here
  // For now, just return the URL as-is
  return url;
};

// ============================================================
// Debounce Utility for Performance
// ============================================================
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// ============================================================
// Throttle Utility for Performance
// ============================================================
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// ============================================================
// Virtual List Helper for Large Lists
// ============================================================
export const useVirtualList = (itemCount: number, itemHeight: number, containerHeight: number, scrollTop: number) => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
  const endIndex = Math.min(
    itemCount,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + 5
  );
  
  const visibleItems = [];
  for (let i = startIndex; i < endIndex; i++) {
    visibleItems.push({
      index: i,
      style: {
        position: 'absolute' as const,
        top: i * itemHeight,
        height: itemHeight,
        width: '100%',
      },
    });
  }
  
  const totalHeight = itemCount * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return { visibleItems, totalHeight, offsetY };
};
