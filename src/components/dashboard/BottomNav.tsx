/**
 * BottomNav Component
 * Sticky bottom navigation bar with 4 tabs
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ListTodo, Wallet, UserCircle, Trophy } from 'lucide-react';

interface BottomNavProps {
  activeTab?: 'home' | 'tasks' | 'leaderboard' | 'wallet' | 'profile' | 'coupon';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab = 'home' }) => {
  const location = useLocation();

  // Determine active tab from route if not explicitly provided
  const getActiveTab = (): string => {
    if (activeTab) return activeTab;
    const path = location.pathname;
    if (path.includes('tasks')) return 'tasks';
    if (path.includes('wallet')) return 'wallet';
    if (path.includes('profile')) return 'profile';
    return 'home';
  };

  const currentTab = getActiveTab();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/home' },
    { id: 'tasks', label: 'Tasks', icon: ListTodo, path: '/tasks' },
    { id: 'leaderboard', label: 'Ranks', icon: Trophy, path: '/leaderboard' },
    { id: 'wallet', label: 'Wallet', icon: Wallet, path: '/wallet' },
    { id: 'profile', label: 'Profile', icon: UserCircle, path: '/profile' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-gray-800/50 z-40 safe-area-bottom"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-screen-lg mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                to={item.path}
                className="relative flex flex-col items-center justify-center min-w-[64px] py-2 px-3 min-h-[44px]"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-[#E8B84B] rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <motion.div
                  animate={{
                    color: isActive ? '#E8B84B' : '#6B7280',
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon size={24} />
                </motion.div>

                {/* Label */}
                <span
                  className={`text-xs mt-1 font-medium ${isActive ? 'text-[#E8B84B]' : 'text-gray-500'
                    }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
