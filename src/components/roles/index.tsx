/**
 * Phase 6 Role Progression Components
 * Combined file for efficiency
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import {
  Crown, Briefcase, Shield, ClipboardList, Copy, Share2, Download,
  Users, TrendingUp, Coins, Clock, ArrowUpRight, X, Check, Award,
  PieChart, Calendar, MessageCircle, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';
import { formatCurrency, getRoleIcon, getRoleColor, getLevelColor, calculateProgress, getNextRoleInfo, generateReferralLink, canAccessTeam, getCommissionTypeLabel } from '../../utils/roles';
import { useTeamMembers, useCommissionLogs, useReferralStats } from '../../hooks/useRoles';

// ==================== ROLE BADGE ====================
export const RoleBadge: React.FC<{ role: string; level: string; size?: 'sm' | 'lg' }> = ({ role, level, size = 'sm' }) => {
  const colors = getRoleColor(role);
  const levelColors = getLevelColor(level);
  const isLg = size === 'lg';

  return (
    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`inline-flex items-center gap-3 ${isLg ? 'p-6' : 'p-3'} rounded-2xl border ${colors.bg} ${colors.border}`}>
      <div className={`${isLg ? 'text-6xl' : 'text-3xl'}`}>{getRoleIcon(role)}</div>
      <div>
        <p className={`${isLg ? 'text-3xl' : 'text-lg'} font-black ${colors.text}`}>{role}</p>
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${levelColors.bg} ${levelColors.text}`}>{level}</span>
      </div>
    </motion.div>
  );
};

// ==================== PROGRESS TO NEXT ROLE ====================
export const ProgressToNextRole: React.FC<{ role: string; monthlyEarned: number; activeMonths: number }> = ({ role, monthlyEarned, activeMonths }) => {
  const info = getNextRoleInfo(role, monthlyEarned, activeMonths);
  if (info.maxRole || !info.nextRole) return <div className="text-center text-gray-500 text-sm">You've reached the maximum role</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-white font-semibold">Progress to {info.nextRole}</p>
        {info.adminOnly && <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">Admin Only</span>}
      </div>
      <div className="h-3 bg-[#1A1A1A] rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-[#E8B84B] to-[#00C9A7]" initial={{ width: 0 }} animate={{ width: `${info.earningsProgress}%` }} transition={{ duration: 1 }} />
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{formatCurrency(monthlyEarned)} of {formatCurrency(info.earningsRequired || 0)}</span>
        <span className="text-[#E8B84B] font-bold">{info.earningsProgress.toFixed(0)}%</span>
      </div>
      {!info.adminOnly && (
        <div className={`flex items-center gap-2 text-sm ${info.monthsMet ? 'text-green-400' : 'text-yellow-400'}`}>
          <Clock size={14} />
          <span>{info.monthsMet ? '✅' : '⏳'} {activeMonths}/3 active months</span>
        </div>
      )}
    </div>
  );
};

// ==================== REFERRAL LINK SECTION ====================
export const ReferralLinkSection: React.FC<{ uid: string; username?: string }> = ({ uid, username }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const link = generateReferralLink(uid);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copied!', { style: { background: '#111', color: '#fff', border: '1px solid #E8B84B' } });
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Failed to copy'); }
  };

  const handleShareWA = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Join WorkPlex using my referral link: ${link}`)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-gray-400 text-sm mb-2 block">Your Referral Link</label>
        <div className="flex items-center gap-2">
          <input readOnly value={link} className="flex-1 px-4 py-3 bg-[#1A1A1A] border border-gray-800/50 rounded-xl text-white text-sm truncate min-h-[44px]" aria-label="Referral link" />
          <button onClick={handleCopy} className="p-3 bg-[#E8B84B]/10 hover:bg-[#E8B84B]/20 rounded-xl transition-all min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Copy link">
            {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-[#E8B84B]" />}
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleShareWA} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px]">
          <Share2 size={16} /> WhatsApp
        </button>
        <button onClick={() => setShowQR(true)} className="flex-1 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-gray-800/50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px]">
          <ClipboardList size={16} /> QR Code
        </button>
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-6" onClick={() => setShowQR(false)}>
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }} className="bg-[#111111] rounded-3xl p-8 max-w-sm w-full border border-gray-800/50 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white min-w-[44px] min-h-[44px]" aria-label="Close"><X size={20} /></button>
              <h3 className="text-white font-bold text-xl text-center mb-6">Your Referral QR Code</h3>
              <div className="bg-white rounded-2xl p-6 flex items-center justify-center mb-6">
                <QRCodeSVG value={link} size={200} level="H" />
              </div>
              <p className="text-gray-400 text-xs text-center mb-4">Share this QR code offline. When someone scans and joins, they'll be added to your team!</p>
              <div className="flex gap-2">
                <button className="flex-1 bg-[#E8B84B] text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px]"><Download size={16} /> Download</button>
                <button onClick={handleShareWA} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px]"><Share2 size={16} /> Share</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== TEAM STATS ====================
export const TeamStats: React.FC<{ members: any[]; teamEarnings: number; totalCommission: number }> = ({ members, teamEarnings, totalCommission }) => {
  const level1 = members.filter((m) => m.level === 1).length;
  const level2 = members.filter((m) => m.level === 2).length;

  const stats = [
    { label: 'Team Size', value: members.length.toString(), sub: `L1: ${level1} | L2: ${level2}`, icon: <Users size={20} className="text-[#E8B84B]" />, bg: 'bg-[#E8B84B]/10' },
    { label: 'Team Earnings (Month)', value: formatCurrency(teamEarnings), sub: `Your 5%: ${formatCurrency(teamEarnings * 0.05)}`, icon: <TrendingUp size={20} className="text-green-400" />, bg: 'bg-green-500/10' },
    { label: 'Total Commission', value: formatCurrency(totalCommission), sub: 'All-time earnings', icon: <Coins size={20} className="text-purple-400" />, bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-[#111111] rounded-2xl p-5 border border-gray-800/50">
          <div className="flex items-center justify-between mb-3"><div className={`p-2.5 rounded-xl ${s.bg}`}>{s.icon}</div></div>
          <p className="text-gray-500 text-xs mb-1">{s.label}</p>
          <p className="text-white font-black text-xl">{s.value}</p>
          <p className="text-gray-500 text-xs mt-1">{s.sub}</p>
        </motion.div>
      ))}
    </div>
  );
};

// ==================== EARNINGS BREAKDOWN ====================
export const EarningsBreakdown: React.FC<{ logs: any[] }> = ({ logs }) => {
  const data = React.useMemo(() => {
    const direct = logs.filter((l) => l.type === 'direct_task').reduce((s, l) => s + l.amount, 0);
    const team = logs.filter((l) => l.type === 'team_commission').reduce((s, l) => s + l.amount, 0);
    const manager = logs.filter((l) => l.type === 'manager_commission').reduce((s, l) => s + l.amount, 0);
    const total = direct + team + manager || 1;
    return [
      { name: 'Direct Tasks', value: direct, percent: ((direct / total) * 100).toFixed(0), color: '#10B981' },
      { name: 'Team Commission', value: team, percent: ((team / total) * 100).toFixed(0), color: '#3B82F6' },
      { name: 'Manager Commission', value: manager, percent: ((manager / total) * 100).toFixed(0), color: '#8B5CF6' },
    ];
  }, [logs]);

  if (logs.length === 0) return <div className="text-center text-gray-500 py-8">No earnings data yet</div>;

  return (
    <div className="bg-[#111111] rounded-2xl p-6 border border-gray-800/50">
      <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><PieChart size={20} className="text-[#E8B84B]" /> Earnings Breakdown</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%"><RePieChart><Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value"><Cell fill="#10B981" /><Cell fill="#3B82F6" /><Cell fill="#8B5CF6" /></Pie><Tooltip contentStyle={{ background: '#111', border: '1px solid #333', color: '#fff' }} /></RePieChart></ResponsiveContainer>
        </div>
        <div className="space-y-3 flex-1">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-gray-400 text-sm flex-1">{d.name}</span>
              <span className="text-white font-bold text-sm">{formatCurrency(d.value)}</span>
              <span className="text-gray-500 text-xs">({d.percent}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== TEAM MEMBERS TABLE ====================
export const TeamMembersTable: React.FC<{ members: any[] }> = ({ members }) => {
  const [filter, setFilter] = useState<'all' | 'level1' | 'level2' | 'inactive'>('all');
  const filtered = filter === 'all' ? members : filter === 'level1' ? members.filter((m) => m.level === 1) : filter === 'level2' ? members.filter((m) => m.level === 2) : members.filter((m) => !m.isActive);

  if (members.length === 0) return <div className="text-center text-gray-500 py-8">No team members yet</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(['all', 'level1', 'level2', 'inactive'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all min-h-[44px] whitespace-nowrap ${filter === f ? 'bg-[#E8B84B]/20 text-[#E8B84B]' : 'bg-[#1A1A1A] text-gray-500'}`}>
            {f === 'all' ? 'All' : f === 'level1' ? 'Level 1' : f === 'level2' ? 'Level 2' : 'Inactive'}
          </button>
        ))}
      </div>
      <div className="bg-[#111111] rounded-2xl border border-gray-800/50 overflow-hidden">
        {filtered.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-4 p-4 border-b border-gray-800/50 last:border-0">
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-lg">{m.memberName?.charAt(0) || '?'}</div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{m.memberName}</p>
              <p className="text-gray-500 text-xs">Level {m.level} • Joined {m.joinedAt ? new Date(m.joinedAt.seconds * 1000).toLocaleDateString() : ''}</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-bold text-sm">{formatCurrency(m.totalEarnings || 0)}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${m.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{m.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ==================== PROMOTION CELEBRATION MODAL ====================
export const PromotionCelebrationModal: React.FC<{ isOpen: boolean; onClose: () => void; newRole: string }> = ({ isOpen, onClose, newRole }) => {
  React.useEffect(() => {
    if (isOpen) {
      const duration = 4000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 8, angle: 60, spread: 80, origin: { x: 0 }, colors: ['#E8B84B', '#00C9A7', '#10B981', '#F59E0B', '#8B5CF6'] });
        confetti({ particleCount: 8, angle: 120, spread: 80, origin: { x: 1 }, colors: ['#E8B84B', '#00C9A7', '#10B981', '#F59E0B', '#8B5CF6'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      setTimeout(() => {
        confetti({ particleCount: 150, spread: 120, origin: { y: 0.6 }, colors: ['#E8B84B', '#00C9A7', '#10B981'], shapes: ['circle'], gravity: 0.8, scalar: 1.2, ticks: 250 });
      }, 800);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6" onClick={onClose}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: 'spring', damping: 15 }} className="bg-gradient-to-br from-[#1A1A1A] to-[#111111] rounded-3xl p-8 max-w-md w-full border border-[#E8B84B]/30 shadow-[0_0_100px_rgba(232,184,75,0.3)] relative text-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white min-w-[44px] min-h-[44px]" aria-label="Close"><X size={20} /></button>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, delay: 0.2 }} className="text-7xl mb-6">🎉</motion.div>
            <h2 className="text-3xl font-black text-white mb-3">Congratulations!</h2>
            <p className="text-gray-400 mb-6">You've been promoted to <span className="text-[#E8B84B] font-bold">{newRole}</span>!</p>
            <div className="bg-[#1A1A1A] rounded-xl p-4 mb-6 text-left space-y-2">
              <p className="text-green-400 text-sm flex items-center gap-2"><Check size={14} /> Earn 5% from team members</p>
              <p className="text-green-400 text-sm flex items-center gap-2"><Check size={14} /> Unique referral link</p>
              <p className="text-green-400 text-sm flex items-center gap-2"><Check size={14} /> Team chat access</p>
              <p className="text-green-400 text-sm flex items-center gap-2"><Check size={14} /> Priority support</p>
            </div>
            <button onClick={onClose} className="w-full bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] text-black font-bold py-4 rounded-xl min-h-[44px] text-lg">Start Building Your Team</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==================== COMMISSION LOG TABLE ====================
export const CommissionLogTable: React.FC<{ logs: any[]; loading: boolean }> = ({ logs, loading }) => {
  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>;
  if (logs.length === 0) return <div className="text-center text-gray-500 py-8">No commission records yet</div>;

  return (
    <div className="bg-[#111111] rounded-2xl border border-gray-800/50 overflow-hidden">
      {logs.map((log, i) => (
        <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-4 p-4 border-b border-gray-800/50 last:border-0">
          <div className={`p-2 rounded-lg ${log.type === 'direct_task' ? 'bg-green-500/10' : log.type === 'team_commission' ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
            {log.type === 'direct_task' ? <Award size={16} className="text-green-400" /> : log.type === 'team_commission' ? <Users size={16} className="text-blue-400" /> : <Briefcase size={16} className="text-purple-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">{getCommissionTypeLabel(log.type)}</p>
            <p className="text-gray-500 text-xs">{log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleDateString() : ''}</p>
          </div>
          <div className="text-right">
            <p className="text-green-400 font-bold text-sm">+{formatCurrency(log.amount)}</p>
            {log.percentage > 0 && <p className="text-gray-500 text-xs">{log.percentage}%</p>}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ==================== TEAM MANAGEMENT SCREEN ====================
export const TeamManagementScreen: React.FC<{ uid: string; onBack: () => void }> = ({ uid, onBack }) => {
  const { members, loading } = useTeamMembers(uid);
  const { logs } = useCommissionLogs(uid, 50);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-gray-800/50 p-4 flex items-center gap-3 z-10">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-white min-w-[44px] min-h-[44px]" aria-label="Go back"><ArrowUpRight size={24} className="rotate-[135deg]" /></button>
        <h1 className="text-xl font-bold text-white">My Team</h1>
      </div>
      <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#111111] rounded-xl p-3 text-center"><p className="text-[#E8B84B] font-bold text-lg">{members.length}</p><p className="text-gray-500 text-xs">Total Members</p></div>
          <div className="bg-[#111111] rounded-xl p-3 text-center"><p className="text-green-400 font-bold text-lg">{members.filter((m) => m.isActive).length}</p><p className="text-gray-500 text-xs">Active</p></div>
          <div className="bg-[#111111] rounded-xl p-3 text-center"><p className="text-red-400 font-bold text-lg">{members.filter((m) => !m.isActive).length}</p><p className="text-gray-500 text-xs">Inactive</p></div>
        </div>
        <TeamMembersTable members={members} />
      </div>
    </div>
  );
};

// ==================== PROFILE SCREEN ====================
export const ProfileScreen: React.FC<{ uid: string; userData: any; onLogout: () => void; onBack: () => void }> = ({ uid, userData, onLogout, onBack }) => {
  const [showPromo, setShowPromo] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const role = userData?.role || 'Marketer';
  const level = userData?.level || 'Bronze';
  const monthlyEarned = userData?.monthlyEarnings || 0;
  const activeMonths = userData?.activeMonths || 0;
  const totalEarned = userData?.totalEarned || 0;
  const teamEarnings = userData?.teamEarnings || 0;
  const teamSize = userData?.teamSize || 0;
  const canTeam = canAccessTeam(role);

  const { members } = useTeamMembers(canTeam ? uid : null);
  const { logs, loading: logsLoading } = useCommissionLogs(uid, 20);
  const { stats } = useReferralStats(uid);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-gray-800/50 p-4 flex items-center justify-between z-10">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-white min-w-[44px] min-h-[44px]" aria-label="Go back"><ArrowUpRight size={24} className="rotate-[135deg]" /></button>
        <h1 className="text-xl font-bold text-white">Profile</h1>
        <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-400 min-w-[44px] min-h-[44px]" aria-label="Logout"><X size={20} /></button>
      </div>

      <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
        {/* Role Badge */}
        <RoleBadge role={role} level={level} size="lg" />

        {/* Progress */}
        <div className="bg-[#111111] rounded-2xl p-6 border border-gray-800/50">
          <ProgressToNextRole role={role} monthlyEarned={monthlyEarned} activeMonths={activeMonths} />
        </div>

        {/* Referral Link */}
        <div className="bg-[#111111] rounded-2xl p-6 border border-gray-800/50">
          <h3 className="text-white font-bold text-lg mb-4">Referral Link</h3>
          <ReferralLinkSection uid={uid} username={userData?.username} />
        </div>

        {/* Team Stats (Lead+) */}
        {canTeam && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-xl">My Team</h3>
              <button onClick={() => setShowTeam(true)} className="text-[#00C9A7] text-sm font-semibold flex items-center gap-1 min-h-[44px] px-3">View Team <ChevronRight size={16} /></button>
            </div>
            <TeamStats members={members} teamEarnings={teamEarnings} totalCommission={stats.totalCommissionEarned} />
          </>
        )}

        {/* Earnings Breakdown */}
        <EarningsBreakdown logs={logs} />

        {/* Commission History */}
        <div>
          <h3 className="text-white font-bold text-xl mb-4">Commission History</h3>
          <CommissionLogTable logs={logs} loading={logsLoading} />
        </div>

        {/* Achievements */}
        <div className="bg-[#111111] rounded-2xl p-6 border border-gray-800/50">
          <h3 className="text-white font-bold text-lg mb-4">Achievements</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-gray-500 text-xs">Total Earnings</p><p className="text-white font-bold">{formatCurrency(totalEarned)}</p></div>
            <div><p className="text-gray-500 text-xs">Active Months</p><p className="text-white font-bold">{activeMonths}</p></div>
          </div>
        </div>
      </div>

      {/* Team Management Modal */}
      <AnimatePresence>
        {showTeam && <TeamManagementScreen uid={uid} onBack={() => setShowTeam(false)} />}
      </AnimatePresence>

      {/* Promotion Celebration */}
      <PromotionCelebrationModal isOpen={showPromo} onClose={() => setShowPromo(false)} newRole="Lead Marketer" />
    </div>
  );
};
