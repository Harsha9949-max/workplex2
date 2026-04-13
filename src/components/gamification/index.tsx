/**
 * Phase 8 Gamification Engine - All Components
 * Combined file for efficiency
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Flame, Trophy, Crown, Award, Lock, Zap, Star, TrendingUp, TrendingDown,
  Clock, Gift, Shield, Target, Users, ChevronRight, X, Check, AlertCircle,
  Sparkles, Rocket, Heart, ThumbsUp, Timer,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';
import { doc, onSnapshot, collection, query, where, orderBy, limit, getDocs, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

// ==================== CONSTANTS & DATA ====================
export const LEVELS = [
  { name: 'Bronze', min: 0, max: 5000, color: '#CD7F32', icon: '🥉' },
  { name: 'Silver', min: 5000, max: 25000, color: '#C0C0C0', icon: '🥈' },
  { name: 'Gold', min: 25000, max: 100000, color: '#FFD700', icon: '🥇' },
  { name: 'Platinum', min: 100000, max: 500000, color: '#E5E4E2', icon: '💎' },
  { name: 'Legend', min: 500000, max: Infinity, color: '#FF00FF', icon: '👑' },
];

export const BADGES = [
  { id: 'first_task', name: 'First Sale', description: 'Complete your first task', icon: '🎯', rarity: 'Common', condition: 'earn_0', category: 'Earning' },
  { id: 'earn_1000', name: 'Rs.1K Club', description: 'Earn Rs.1,000 total', icon: '💰', rarity: 'Common', condition: 'earn_1000', category: 'Earning' },
  { id: 'earn_10000', name: 'Rs.10K Club', description: 'Earn Rs.10,000 total', icon: '🏆', rarity: 'Rare', condition: 'earn_10000', category: 'Earning' },
  { id: 'earn_50000', name: 'Rs.50K Legend', description: 'Earn Rs.50,000 total', icon: '👑', rarity: 'Epic', condition: 'earn_50000', category: 'Earning' },
  { id: 'earn_100000', name: 'Rs.1L Champion', description: 'Earn Rs.1,00,000 total', icon: '💎', rarity: 'Legendary', condition: 'earn_100000', category: 'Earning' },
  { id: 'streak_3', name: '3-Day Streak', description: '3 days in a row', icon: '🔥', rarity: 'Common', condition: 'streak_3', category: 'Streak' },
  { id: 'streak_7', name: '7-Day Streak', description: '7 days in a row', icon: '🔥', rarity: 'Rare', condition: 'streak_7', category: 'Streak' },
  { id: 'streak_30', name: '30-Day Warrior', description: '30 days in a row', icon: '⚡', rarity: 'Epic', condition: 'streak_30', category: 'Streak' },
  { id: 'top_earner', name: 'Top Earner', description: 'Reach #1 on leaderboard', icon: '🏅', rarity: 'Legendary', condition: 'rank_1', category: 'Activity' },
  { id: 'team_builder', name: 'Team Builder', description: 'Recruit 5 members', icon: '👥', rarity: 'Rare', condition: 'team_5', category: 'Social' },
  { id: 'coupon_master', name: 'Coupon Master', description: '100 coupon uses', icon: '🎫', rarity: 'Epic', condition: 'coupon_100', category: 'Activity' },
  { id: 'early_bird', name: 'Early Bird', description: 'Joined in first month', icon: '🐦', rarity: 'Legendary', condition: 'early', category: 'Activity' },
];

const RARITY_COLORS = {
  Common: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', glow: '' },
  Rare: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  Epic: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
  Legendary: { bg: 'bg-[#FFD700]/10', border: 'border-[#FFD700]/30', text: 'text-[#FFD700]', glow: 'shadow-[#FFD700]/30' },
};

const VENTURES = ['BuyRix', 'Vyuma', 'TrendyVerse', 'Growplex'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ==================== UTILITY FUNCTIONS ====================
const formatCurrency = (n) => `Rs.${(n || 0).toLocaleString('en-IN')}`;
const getCurrentLevel = (totalEarned) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalEarned >= LEVELS[i].min) return { ...LEVELS[i], index: i };
  }
  return { ...LEVELS[0], index: 0 };
};
const getNextLevel = (totalEarned) => {
  const current = getCurrentLevel(totalEarned);
  return current.index < LEVELS.length - 1 ? LEVELS[current.index + 1] : null;
};
const getLevelProgress = (totalEarned) => {
  const current = getCurrentLevel(totalEarned);
  const range = current.max - current.min;
  const progress = range > 0 ? ((totalEarned - current.min) / range) * 100 : 100;
  return Math.min(progress, 100);
};
const getWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = (now as any) - (start as any);
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
};
const getDaysUntilReset = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  return daysUntilMonday;
};

// ==================== STREAK DISPLAY ====================
export const StreakDisplay = ({ streak, lastActiveDate }) => {
  const today = new Date().getDay();
  const adjustedToday = today === 0 ? 6 : today - 1;
  const weekProgress = DAYS.map((_, i) => i < adjustedToday || (i === adjustedToday && lastActiveDate));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#111111] rounded-2xl p-5 border border-[#2A2A2A] relative overflow-hidden"
    >
      {/* Animated fire background */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute top-2 right-2 text-4xl"
      >
        🔥
      </motion.div>

      <div className="flex items-center gap-4">
        {/* Fire Emoji with animation */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="relative"
        >
          <div className="text-5xl">🔥</div>
          <motion.div
            animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 bg-orange-500/30 rounded-full blur-xl"
          />
        </motion.div>

        <div className="flex-1">
          <p className="text-white font-bold text-xl">{streak || 0} Day Streak</p>
          <p className="text-gray-500 text-sm">Complete a task today to keep the fire burning!</p>
        </div>
      </div>

      {/* Week Progress Ring */}
      <div className="mt-4">
        <div className="flex justify-between mb-2">
          {DAYS.map((day, i) => (
            <div key={day} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < adjustedToday
                  ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
                  : i === adjustedToday
                    ? 'bg-gradient-to-br from-orange-400 to-red-400 text-white animate-pulse'
                    : 'bg-[#1A1A1A] text-gray-600'
                  }`}
              >
                {i < adjustedToday || (i === adjustedToday && lastActiveDate) ? '✓' : day[0]}
              </div>
              <span className="text-[10px] text-gray-500">{day}</span>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden mt-2">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${((adjustedToday + 1) / 7) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// ==================== LEADERBOARD SCREEN ====================
export const LeaderboardScreen = ({ uid, userData }) => {
  const [venture, setVenture] = useState(userData?.venture || 'BuyRix');
  const [entries, setEntries] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const weekId = `week-${getWeekNumber()}`;
    const unsub = onSnapshot(
      query(collection(db, 'leaderboard', venture, weekId, 'entries'), orderBy('earnings', 'desc'), limit(50)),
      (snap) => {
        const ents = snap.docs.map((d, i) => ({ id: d.id, ...d.data(), rank: i + 1 }));
        setEntries(ents);
        const myEntry = ents.find((e) => e.id === uid);
        setMyRank(myEntry?.rank || null);
        setLoading(false);
      }
    );
    return unsub;
  }, [venture, uid]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const daysUntilReset = getDaysUntilReset();

  const rankColors = ['from-[#FFD700] to-[#FFA500]', 'from-[#C0C0C0] to-[#A0A0A0]', 'from-[#CD7F32] to-[#B8860B]'];
  const rankIcons = [<Crown size={24} className="text-[#FFD700]" />, <Trophy size={20} className="text-[#C0C0C0]" />, <Award size={20} className="text-[#CD7F32]" />];

  if (loading) return <div className="text-gray-500 text-center py-12">Loading leaderboard...</div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-[#2A2A2A] px-4 py-4 z-10">
        <h1 className="text-white font-bold text-2xl text-center">🏆 Top Earners This Week</h1>
        <p className="text-gray-500 text-xs text-center mt-1">Resets in {daysUntilReset} days</p>
      </div>

      <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
        {/* Venture Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {VENTURES.map((v) => (
            <button
              key={v}
              onClick={() => setVenture(v)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all min-h-[44px] ${venture === v ? 'bg-[#E8B84B] text-black' : 'bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A]'
                }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Top 3 Cards */}
        <div className="grid grid-cols-3 gap-3">
          {top3.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-4 text-center ${i === 0 ? 'bg-gradient-to-b from-[#FFD700]/20 to-[#111111] border-2 border-[#FFD700]/50' : 'bg-[#111111] border border-[#2A2A2A]'}`}
            >
              {i === 0 && <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-3 left-1/2 -translate-x-1/2"><Crown size={24} className="text-[#FFD700]" /></motion.div>}
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-xl ${i === 0 ? 'bg-[#FFD700]/20' : 'bg-[#1A1A1A]'}`}>
                {entry.photoURL ? <img src={entry.photoURL} className="w-12 h-12 rounded-full object-cover" alt="" /> : entry.name?.charAt(0) || '?'}
              </div>
              <p className="text-white font-bold text-sm truncate">{entry.name || 'Anonymous'}</p>
              <p className="text-[#00C9A7] font-bold text-lg">{formatCurrency(entry.earnings)}</p>
              <p className="text-gray-500 text-xs">Rank #{i + 1}</p>
            </motion.div>
          ))}
        </div>

        {/* Rest of List */}
        <div className="bg-[#111111] rounded-2xl border border-[#2A2A2A] overflow-hidden">
          {rest.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (i + 3) * 0.05 }}
              className={`flex items-center gap-4 p-4 border-b border-[#2A2A2A] last:border-0 ${entry.uid === uid ? 'bg-[#E8B84B]/5' : ''}`}
            >
              <span className="text-gray-500 font-bold w-8 text-center">{entry.rank}</span>
              <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-sm">{entry.name?.charAt(0) || '?'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{entry.name || 'Anonymous'}</p>
              </div>
              <span className="text-[#00C9A7] font-bold">{formatCurrency(entry.earnings)}</span>
            </motion.div>
          ))}
        </div>

        {/* My Rank Sticky Footer */}
        {myRank && myRank > 10 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-20 left-4 right-4 bg-[#111111] border border-[#E8B84B]/30 rounded-2xl p-4 flex items-center justify-between z-10"
          >
            <div className="flex items-center gap-3">
              <span className="text-[#E8B84B] font-bold text-lg">#{myRank}</span>
              <span className="text-white font-medium">Your Rank</span>
            </div>
            <span className="text-[#00C9A7] font-bold">{formatCurrency(entries.find((e) => e.uid === uid)?.earnings || 0)}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ==================== BADGE SHOWCASE ====================
export const BadgeShowcase = ({ userBadges = [], totalEarned, streak }) => {
  const [filter, setFilter] = useState('All');
  const categories = ['All', 'Earning', 'Streak', 'Activity', 'Social'];

  const checkBadgeUnlocked = (badge) => {
    if (userBadges?.includes(badge.id)) return true;
    switch (badge.condition) {
      case 'earn_0': return totalEarned >= 0;
      case 'earn_1000': return totalEarned >= 1000;
      case 'earn_10000': return totalEarned >= 10000;
      case 'earn_50000': return totalEarned >= 50000;
      case 'earn_100000': return totalEarned >= 100000;
      case 'streak_3': return streak >= 3;
      case 'streak_7': return streak >= 7;
      case 'streak_30': return streak >= 30;
      default: return false;
    }
  };

  const filteredBadges = filter === 'All' ? BADGES : BADGES.filter((b) => b.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all min-h-[44px] ${filter === cat ? 'bg-[#E8B84B] text-black' : 'bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A]'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredBadges.map((badge, i) => {
          const unlocked = checkBadgeUnlocked(badge);
          const rarity = RARITY_COLORS[badge.rarity] || RARITY_COLORS.Common;

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={unlocked ? { scale: 1.05 } : {}}
              className={`relative rounded-2xl p-5 border text-center transition-all ${unlocked
                ? `${rarity.bg} ${rarity.border} ${rarity.glow ? `shadow-lg ${rarity.glow}` : ''}`
                : 'bg-[#1A1A1A]/50 border-[#2A2A2A] opacity-50'
                }`}
            >
              {!unlocked && (
                <div className="absolute top-2 right-2">
                  <Lock size={14} className="text-gray-500" />
                </div>
              )}
              <motion.div
                animate={unlocked ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="text-4xl mb-3"
              >
                {badge.icon}
              </motion.div>
              <p className={`font-bold text-sm ${unlocked ? 'text-white' : 'text-gray-500'}`}>{badge.name}</p>
              <p className="text-gray-500 text-xs mt-1">{badge.description}</p>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${rarity.bg} ${rarity.text}`}>
                {badge.rarity}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== LEVEL PROGRESS ====================
export const LevelProgress = ({ totalEarned }) => {
  const current = getCurrentLevel(totalEarned);
  const next = getNextLevel(totalEarned);
  const progress = getLevelProgress(totalEarned);

  if (!next) return (
    <div className="bg-[#111111] rounded-2xl p-6 border border-[#2A2A2A] text-center">
      <p className="text-4xl mb-2">👑</p>
      <p className="text-white font-bold text-xl">Legend Level</p>
      <p className="text-gray-500 text-sm">You've reached the maximum level!</p>
    </div>
  );

  return (
    <div className="bg-[#111111] rounded-2xl p-6 border border-[#2A2A2A]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{current.icon}</span>
          <div>
            <p className="text-white font-bold">{current.name}</p>
            <p className="text-gray-500 text-xs">Level {current.index + 1} of {LEVELS.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ChevronRight size={20} className="text-gray-600" />
          <span className="text-2xl opacity-50">{next.icon}</span>
          <p className="text-gray-400 font-semibold">{next.name}</p>
        </div>
      </div>

      <div className="h-3 bg-[#1A1A1A] rounded-full overflow-hidden mb-3 relative">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${current.color}, ${next.color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1 }}
        />
        {/* Milestone markers */}
        {[25, 50, 75].map((pct) => (
          <div key={pct} className="absolute top-0 h-full w-0.5 bg-white/20" style={{ left: `${pct}%` }} />
        ))}
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{formatCurrency(totalEarned)} earned</span>
        <span className="text-white font-bold">{progress.toFixed(0)}%</span>
        <span className="text-gray-400">{formatCurrency(next.min)} to next</span>
      </div>
    </div>
  );
};

// ==================== MYSTERY TASK MODAL ====================
export const MysteryTaskModal = ({ isOpen, onClose, onAccept }) => {
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours

  useEffect(() => {
    if (!isOpen) { setTimeLeft(7200); return; }
    const interval = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 }, colors: ['#8B5CF6', '#EC4899', '#FFD700'] });
    }
  }, [isOpen]);

  const formatTimer = (s) => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              boxShadow: ['0 0 30px rgba(139,92,246,0.3)', '0 0 50px rgba(236,72,153,0.5)', '0 0 30px rgba(139,92,246,0.3)']
            }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, repeat: Infinity, duration: 2 }}
            className="bg-gradient-to-br from-[#1A1A1A] to-[#111111] rounded-3xl p-8 max-w-sm w-full border border-purple-500/30 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white" aria-label="Close"><X size={20} /></button>

            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }} className="text-6xl text-center mb-4">🎁</motion.div>

            <h2 className="text-2xl font-black text-white text-center mb-2">Mystery Task!</h2>
            <p className="text-gray-400 text-center mb-6">High Reward • Limited Time</p>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center mb-6">
              <p className="text-purple-400 font-bold text-3xl">Rs. 150 Instant</p>
              <p className="text-gray-500 text-xs mt-1">Complete within 2 hours</p>
            </div>

            <div className={`text-center mb-6 ${timeLeft < 600 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
              <Timer size={20} className="inline mr-2" />
              <span className="font-mono font-bold text-lg">{formatTimer(timeLeft)}</span>
            </div>

            <div className="space-y-3">
              <button onClick={onAccept} className="w-full bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] text-black font-bold py-4 rounded-xl min-h-[44px]">Accept Task</button>
              <button onClick={onClose} className="w-full bg-[#1A1A1A] text-gray-400 font-semibold py-3 rounded-xl min-h-[44px]">Decline</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==================== LEVEL UP CELEBRATION ====================
export const LevelUpCelebration = ({ isOpen, onClose, newLevel }) => {
  useEffect(() => {
    if (isOpen) {
      // Initial burst
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#FFD700', '#00C9A7', '#10B981', '#8B5CF6', '#EC4899'] });
      // Side cannons
      setTimeout(() => {
        confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#FFD700', '#00C9A7'] });
        confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FFD700', '#00C9A7'] });
      }, 300);
      // Final burst
      setTimeout(() => {
        confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, colors: ['#FFD700', '#00C9A7', '#10B981'] });
      }, 1000);
    }
  }, [isOpen]);

  const level = LEVELS.find((l) => l.name === newLevel) || LEVELS[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[300] flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.3, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.3, rotate: 180 }}
            transition={{ type: 'spring', damping: 12, stiffness: 100 }}
            className="text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow effect */}
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-[#FFD700]/20 rounded-full blur-3xl"
            />

            <div className="relative z-10">
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl mb-6"
              >
                {level.icon}
              </motion.div>

              <h2 className="text-4xl font-black text-white mb-2">Level Up!</h2>
              <p className="text-2xl font-bold mb-6" style={{ color: level.color }}>{newLevel}</p>

              <div className="bg-[#1A1A1A] rounded-2xl p-6 mb-8 border border-[#2A2A2A]">
                <p className="text-gray-400">You've unlocked:</p>
                <ul className="text-white text-left mt-3 space-y-2">
                  <li>✅ Higher commission rates</li>
                  <li>✅ Priority task access</li>
                  <li>✅ Exclusive badges</li>
                  <li>✅ Team building perks</li>
                </ul>
              </div>

              <button onClick={onClose} className="px-12 py-4 bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] text-black font-bold rounded-2xl text-lg min-h-[44px]">
                Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
