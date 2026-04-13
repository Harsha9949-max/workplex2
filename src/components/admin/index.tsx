/**
 * Phase 7 Admin Panel - All Components
 * Combined file for efficiency
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  doc, onSnapshot, collection, query, where, orderBy, limit, getDocs,
  updateDoc, addDoc, serverTimestamp, increment, deleteDoc, setDoc, getDoc,
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import toast, { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Users, ClipboardList, Ticket, Wallet, Shield, AlertTriangle,
  Megaphone, LogOut, Bell, Search, Filter, ChevronRight, Eye, Ban, Check, X,
  ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Clock, Plus, Send,
  Trash2, Settings, Zap, Crown, Zap as ZapIcon,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const ADMIN_EMAIL = 'hvrsindustriespvtltd@gmail.com';
const VENTURES = ['BuyRix', 'Vyuma', 'TrendyVerse', 'Growplex'];
const ROLES = ['Marketer', 'Lead Marketer', 'Manager', 'Sub-Admin'];
const DAILY_CAP = 50000;

// ==================== UTILITY ====================
const formatCurrency = (n) => `Rs.${(n || 0).toLocaleString('en-IN')}`;
const formatDate = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const formatTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};
const getRoleColor = (role) => {
  const c = { Marketer: 'text-gray-400', 'Lead Marketer': 'text-[#E8B84B]', Manager: 'text-purple-400', 'Sub-Admin': 'text-blue-400', Admin: 'text-red-400' };
  return c[role] || 'text-gray-400';
};
const getStatusColor = (status) => {
  const c = { pending: 'text-yellow-400 bg-yellow-500/10', approved: 'text-green-400 bg-green-500/10', rejected: 'text-red-400 bg-red-500/10', paid: 'text-green-400 bg-green-500/10', processing: 'text-blue-400 bg-blue-500/10', failed: 'text-red-400 bg-red-500/10', active: 'text-green-400 bg-green-500/10', suspended: 'text-red-400 bg-red-500/10' };
  return c[status] || 'text-gray-400 bg-gray-500/10';
};

// ==================== ADMIN ROUTE GUARD ====================
export const AdminRouteGuard = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && u.email === ADMIN_EMAIL) {
        setUser(u);
      } else {
        navigate('/home');
      }
      setLoading(false);
    });
    return unsub;
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E8B84B]/30 border-t-[#E8B84B] rounded-full animate-spin" />
      </div>
    );
  }

  return children;
};

// ==================== ADMIN LAYOUT ====================
export const AdminLayout = ({ children, activeSection, onNavigate }) => {
  const [user, setUser] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    const unsubPending = onSnapshot(
      query(collection(db, 'withdrawals'), where('status', '==', 'pending')),
      (snap) => setPendingCount(snap.size)
    );
    return () => { unsubAuth(); unsubPending(); };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workers', label: 'Workers', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'coupons', label: 'Coupons', icon: Ticket },
    { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
    { id: 'subadmins', label: 'Sub-Admins', icon: Shield },
    { id: 'fraud', label: 'Fraud Alerts', icon: AlertTriangle },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <Toaster position="top-center" />
      {/* Sidebar */}
      <aside className="w-64 bg-[#111111] border-r border-[#2A2A2A] fixed h-full flex flex-col z-20">
        <div className="p-6 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <ZapIcon size={24} className="text-[#E8B84B]" />
            <div>
              <h1 className="text-white font-bold text-lg">WorkPlex</h1>
              <p className="text-gray-500 text-xs">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${isActive ? 'bg-[#E8B84B]/10 text-[#E8B84B]' : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                  }`}
              >
                <Icon size={18} />
                {item.label}
                {item.id === 'withdrawals' && pendingCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingCount}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#2A2A2A]">
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#E8B84B]/20 flex items-center justify-center text-[#E8B84B] text-sm font-bold">A</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.email}</p>
                <p className="text-gray-500 text-xs">Super Admin</p>
              </div>
            </div>
          )}
          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all min-h-[44px]">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-[#2A2A2A] px-8 py-4 flex items-center justify-between z-10">
          <h2 className="text-white font-bold text-xl capitalize">{activeSection}</h2>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors" aria-label="Notifications">
              <Bell size={20} />
              {pendingCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">{pendingCount}</span>}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E8B84B]/20 flex items-center justify-center text-[#E8B84B] text-sm font-bold">A</div>
              <span className="text-white text-sm font-medium">{user?.email}</span>
            </div>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

// ==================== DASHBOARD ====================
export const DashboardSection = () => {
  const [stats, setStats] = useState({ totalWorkers: 0, activeToday: 0, pendingWithdrawals: 0, totalPaidMonth: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Total workers
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const activeToday = snap.docs.filter((d) => {
        const la = d.data().lastActiveAt?.toDate ? d.data().lastActiveAt.toDate() : new Date(0);
        return la.toDateString() === today.toDateString();
      }).length;
      setStats((prev) => ({ ...prev, totalWorkers: snap.size, activeToday }));
      setLoading(false);
    });

    // Pending withdrawals
    const unsubPending = onSnapshot(
      query(collection(db, 'withdrawals'), where('status', '==', 'pending')),
      (snap) => setStats((prev) => ({ ...prev, pendingWithdrawals: snap.size }))
    );

    // Total paid this month
    const unsubPaid = onSnapshot(
      query(collection(db, 'withdrawals'), where('status', '==', 'paid')),
      (snap) => {
        const total = snap.docs.reduce((sum, d) => {
          const paidAt = d.data().paidAt?.toDate ? d.data().paidAt.toDate() : new Date(0);
          return paidAt >= startOfMonth ? sum + (d.data().amount || 0) : sum;
        }, 0);
        setStats((prev) => ({ ...prev, totalPaidMonth: total }));
      }
    );

    // Chart data (last 7 days for demo)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push({ date: date.toLocaleDateString('en-IN', { weekday: 'short' }), payouts: Math.floor(Math.random() * 5000 + 1000), commissions: Math.floor(Math.random() * 2000 + 500) });
    }
    setChartData(days);

    return () => { unsubUsers(); unsubPending(); unsubPaid(); };
  }, []);

  if (loading) return <div className="text-gray-500">Loading dashboard...</div>;

  const statCards = [
    { label: 'Total Workers', value: stats.totalWorkers, icon: Users, color: 'text-[#E8B84B]', bg: 'bg-[#E8B84B]/10' },
    { label: 'Active Today', value: stats.activeToday, icon: Zap, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Paid This Month', value: formatCurrency(stats.totalPaidMonth), icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111111] rounded-2xl p-6 border border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${s.bg}`}><s.icon size={20} className={s.color} /></div>
            </div>
            <p className="text-gray-500 text-sm mb-1">{s.label}</p>
            <p className="text-white font-black text-2xl">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button className="px-6 py-3 bg-[#E8B84B] text-black font-bold rounded-xl flex items-center gap-2 min-h-[44px]"><Check size={16} /> Approve Withdrawals</button>
        <button className="px-6 py-3 bg-[#1A1A1A] border border-[#2A2A2A] text-white font-semibold rounded-xl flex items-center gap-2 min-h-[44px]"><Plus size={16} /> Create Task</button>
        <button className="px-6 py-3 bg-[#1A1A1A] border border-[#2A2A2A] text-white font-semibold rounded-xl flex items-center gap-2 min-h-[44px]"><Send size={16} /> Send Announcement</button>
      </div>

      {/* Chart */}
      <div className="bg-[#111111] rounded-2xl p-6 border border-[#2A2A2A]">
        <h3 className="text-white font-bold text-lg mb-6">Earnings Trends (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis dataKey="date" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid #2A2A2A', color: '#fff' }} />
            <Legend />
            <Line type="monotone" dataKey="payouts" stroke="#E8B84B" strokeWidth={2} name="Payouts" />
            <Line type="monotone" dataKey="commissions" stroke="#00C9A7" strokeWidth={2} name="Commissions" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ==================== WORKER MANAGEMENT ====================
export const WorkerManagementSection = () => {
  const [workers, setWorkers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterVenture, setFilterVenture] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'users'), orderBy('joinedAt', 'desc')), (snap) => {
      setWorkers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const filtered = workers.filter((w) => {
    const matchSearch = !search || w.name?.toLowerCase().includes(search.toLowerCase()) || w.phone?.includes(search);
    const matchVenture = filterVenture === 'all' || w.venture === filterVenture;
    const matchRole = filterRole === 'all' || w.role === filterRole;
    return matchSearch && matchVenture && matchRole;
  });

  const handleRoleChange = async (workerId, newRole) => {
    await updateDoc(doc(db, 'users', workerId), { role: newRole });
    toast.success(`Role updated to ${newRole}`);
  };

  const handleToggleStatus = async (workerId, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    await updateDoc(doc(db, 'users', workerId), { status: newStatus });
    toast.success(`Worker ${newStatus}`);
  };

  const handleManualCredit = async (workerId, amount) => {
    if (!amount || amount <= 0) return;
    await updateDoc(doc(db, 'users', workerId), {
      'wallets.pending': increment(parseFloat(amount)),
    });
    toast.success(`Rs.${amount} credited to worker`);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone..." className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-500 focus:border-[#E8B84B] transition-colors min-h-[44px]" />
          </div>
        </div>
        <select value={filterVenture} onChange={(e) => setFilterVenture(e.target.value)} className="px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white min-h-[44px]">
          <option value="all">All Ventures</option>
          {VENTURES.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white min-h-[44px]">
          <option value="all">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#111111] rounded-2xl border border-[#2A2A2A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
              <tr>
                {['Name', 'Phone', 'Venture', 'Role', 'Level', 'Total Earned', 'Joined', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr key={w.id} className="border-b border-[#2A2A2A] hover:bg-[#1A1A1A]/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{w.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-400">{w.phone || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-400">{w.venture || 'N/A'}</td>
                  <td className={`px-4 py-3 font-semibold ${getRoleColor(w.role)}`}>{w.role || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-400">{w.level || 'Bronze'}</td>
                  <td className="px-4 py-3 text-green-400 font-semibold">{formatCurrency(w.totalEarned || 0)}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{formatDate(w.joinedAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(w.status || 'active')}`}>{w.status || 'Active'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setSelectedWorker(w); setShowDrawer(true); }} className="p-1.5 text-gray-400 hover:text-white transition-colors" aria-label="View profile"><Eye size={16} /></button>
                      <button onClick={() => handleToggleStatus(w.id, w.status)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors" aria-label="Toggle status"><Ban size={16} /></button>
                      <select onChange={(e) => handleRoleChange(w.id, e.target.value)} defaultValue={w.role} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-xs text-white px-2 py-1 min-h-[44px]">
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Worker Detail Drawer */}
      <AnimatePresence>
        {showDrawer && selectedWorker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex justify-end" onClick={() => setShowDrawer(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="w-full max-w-lg bg-[#111111] h-full overflow-y-auto border-l border-[#2A2A2A]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-xl">Worker Details</h3>
                  <button onClick={() => setShowDrawer(false)} className="p-2 text-gray-400 hover:text-white" aria-label="Close"><X size={20} /></button>
                </div>
                <div className="space-y-3">
                  {[['Name', selectedWorker.name], ['Phone', selectedWorker.phone], ['Email', selectedWorker.email], ['Venture', selectedWorker.venture], ['Role', selectedWorker.role], ['Level', selectedWorker.level], ['Total Earned', formatCurrency(selectedWorker.totalEarned || 0)], ['KYC', selectedWorker.kycDone ? 'Verified' : 'Pending']].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-2 border-b border-[#2A2A2A]">
                      <span className="text-gray-500">{label}</span>
                      <span className="text-white font-medium">{value || 'N/A'}</span>
                    </div>
                  ))}
                </div>
                {/* Manual Credit */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Manual Wallet Credit (Rs.)</label>
                  <div className="flex gap-2">
                    <input type="number" id={`credit-${selectedWorker.id}`} placeholder="Amount" className="flex-1 px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white min-h-[44px]" />
                    <button
                      onClick={() => {
                        const input = document.getElementById(`credit-${selectedWorker.id}`) as HTMLInputElement;
                        handleManualCredit(selectedWorker.id, input?.value || '');
                        if (input) input.value = '';
                      }}
                      className="px-4 py-2.5 bg-[#E8B84B] text-black font-bold rounded-xl min-h-[44px]"
                    >
                      Credit
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== TASK MANAGEMENT ====================
export const TaskManagementSection = () => {
  const [submissions, setSubmissions] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', venture: 'BuyRix', role: 'Marketer', earning: '', deadline: '', proofType: 'image' });

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'taskSubmissions'), orderBy('submittedAt', 'desc'), limit(50)),
      (snap) => setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  const handleApprove = async (submissionId) => {
    await updateDoc(doc(db, 'taskSubmissions', submissionId), {
      status: 'approved',
      reviewedAt: serverTimestamp(),
      reviewedBy: ADMIN_EMAIL,
    });
    toast.success('Task approved! Worker wallet will be credited.');
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason) return;
    await updateDoc(doc(db, 'taskSubmissions', rejectModal), {
      status: 'rejected',
      rejectionReason: rejectReason,
      reviewedAt: serverTimestamp(),
      reviewedBy: ADMIN_EMAIL,
    });
    setRejectModal(null);
    setRejectReason('');
    toast.success('Task rejected');
  };

  const handleCreateTask = async () => {
    if (!taskForm.title || !taskForm.earning) { toast.error('Fill required fields'); return; }
    await addDoc(collection(db, 'tasks'), {
      ...taskForm,
      earnAmount: parseFloat(taskForm.earning),
      assignedTo: 'all',
      isCrossVenture: false,
      isMystery: false,
      createdAt: serverTimestamp(),
      createdBy: ADMIN_EMAIL,
    });
    toast.success('Task created!');
    setShowCreateForm(false);
    setTaskForm({ title: '', description: '', venture: 'BuyRix', role: 'Marketer', earning: '', deadline: '', proofType: 'image' });
  };

  return (
    <div className="space-y-6">
      <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-6 py-3 bg-[#E8B84B] text-black font-bold rounded-xl flex items-center gap-2 min-h-[44px]"><Plus size={16} /> Create Task</button>

      {/* Create Task Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-[#111111] rounded-2xl p-6 border border-[#2A2A2A] space-y-4">
            <h3 className="text-white font-bold text-lg">Create New Task</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task Title" className="px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white min-h-[44px]" />
              <input value={taskForm.earning} onChange={(e) => setTaskForm({ ...taskForm, earning: e.target.value })} placeholder="Earning Amount (Rs.)" type="number" className="px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white min-h-[44px]" />
              <select value={taskForm.venture} onChange={(e) => setTaskForm({ ...taskForm, venture: e.target.value })} className="px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white min-h-[44px]">
                {VENTURES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={taskForm.role} onChange={(e) => setTaskForm({ ...taskForm, role: e.target.value })} className="px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white min-h-[44px]">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={taskForm.proofType} onChange={(e) => setTaskForm({ ...taskForm, proofType: e.target.value })} className="px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white min-h-[44px]">
                <option value="image">Image</option>
                <option value="link">Link</option>
                <option value="text">Text</option>
              </select>
              <input value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} placeholder="Deadline" type="datetime-local" className="px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white min-h-[44px]" />
            </div>
            <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Task Description" rows={3} className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white resize-none" />
            <button onClick={handleCreateTask} className="px-6 py-3 bg-[#E8B84B] text-black font-bold rounded-xl min-h-[44px]">Create Task</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submissions Table */}
      <div className="bg-[#111111] rounded-2xl border border-[#2A2A2A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
              <tr>
                {['Worker', 'Task', 'Submitted', 'Proof', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-b border-[#2A2A2A]">
                  <td className="px-4 py-3 text-white">{s.workerName || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-400">{s.taskId || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{formatDate(s.submittedAt)}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{s.proofType === 'link' ? s.proofUrl : s.proofType}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(s.status)}`}>{s.status}</span></td>
                  <td className="px-4 py-3">
                    {s.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(s.id)} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg min-h-[44px] flex items-center"><Check size={14} className="mr-1" /> Approve</button>
                        <button onClick={() => setRejectModal(s.id)} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg min-h-[44px] flex items-center"><X size={14} className="mr-1" /> Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setRejectModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#111111] rounded-2xl p-6 max-w-md w-full border border-[#2A2A2A]" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-white font-bold text-lg mb-4">Reject Submission</h3>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Rejection reason..." rows={3} className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white resize-none mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setRejectModal(null)} className="flex-1 py-3 bg-[#1A1A1A] text-gray-400 font-semibold rounded-xl min-h-[44px]">Cancel</button>
                <button onClick={handleReject} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl min-h-[44px]">Confirm Reject</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== COUPON MANAGEMENT ====================
export const CouponManagementSection = () => {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coupons'), (snap) => {
      setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleToggle = async (couponId, currentActive) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    await updateDoc(doc(db, 'coupons', couponId), {
      isActive: !currentActive,
      activatedAt: !currentActive ? serverTimestamp() : null,
      expiresAt: !currentActive ? expiresAt : null,
    });
    toast.success(`Coupon ${!currentActive ? 'activated' : 'deactivated'}`);
  };

  return (
    <div className="bg-[#111111] rounded-2xl border border-[#2A2A2A] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
            <tr>
              {['Worker', 'Venture', 'Coupon Code', 'Status', 'Uses', 'Total Earned', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-[#2A2A2A]">
                <td className="px-4 py-3 text-white">{c.ownerName || 'N/A'}</td>
                <td className="px-4 py-3 text-gray-400">{c.venture || 'N/A'}</td>
                <td className="px-4 py-3 text-[#E8B84B] font-mono font-bold">{c.code || 'N/A'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.isActive ? 'text-green-400 bg-green-500/10' : 'text-gray-400 bg-gray-500/10'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="px-4 py-3 text-gray-400">{c.usageCount || 0}</td>
                <td className="px-4 py-3 text-green-400 font-semibold">{formatCurrency(c.totalEarned || 0)}</td>
                <td className="px-4 py-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={c.isActive || false} onChange={() => handleToggle(c.id, c.isActive)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#1A1A1A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E8B84B] peer-checked:after:bg-white"></div>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== WITHDRAWAL MANAGEMENT ====================
export const WithdrawalManagementSection = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const unsub = onSnapshot(
      query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc'), limit(50)),
      (snap) => {
        const wds = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
          id: string;
          workerId: string;
          amount: number;
          status: string;
          requestedAt: any;
          [key: string]: any;
        }>;
        setWithdrawals(wds);
        // Calculate daily total
        const todayTotal = wds.filter((w) => {
          const d = w.requestedAt?.toDate ? w.requestedAt.toDate() : new Date();
          return d.toISOString().split('T')[0] === today && (w.status === 'paid' || w.status === 'approved');
        }).reduce((sum, w) => sum + (w.amount || 0), 0);
        setDailyTotal(todayTotal);
      }
    );
    return unsub;
  }, []);

  const handleApprove = async (wdId, amount) => {
    if (dailyTotal + amount > DAILY_CAP) {
      toast.error(`Daily cap exceeded! Total: ${formatCurrency(dailyTotal + amount)}`);
      return;
    }
    await updateDoc(doc(db, 'withdrawals', wdId), {
      status: 'approved',
      approvedAt: serverTimestamp(),
      processedBy: ADMIN_EMAIL,
    });
    toast.success('Withdrawal approved! Razorpay payout triggered.');
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason) return;
    const wd = withdrawals.find((w) => w.id === rejectModal);
    if (wd) {
      // Return funds to wallet
      await updateDoc(doc(db, 'users', wd.workerId), {
        'wallets.earned': increment(wd.amount),
      });
    }
    await updateDoc(doc(db, 'withdrawals', rejectModal), {
      status: 'rejected',
      rejectionReason: rejectReason,
      processedBy: ADMIN_EMAIL,
    });
    setRejectModal(null);
    setRejectReason('');
    toast.success('Withdrawal rejected. Funds returned to worker.');
  };

  const isNearCap = dailyTotal >= 45000;
  const isOverCap = dailyTotal >= DAILY_CAP;

  return (
    <div className="space-y-6">
      {/* Daily Cap Banner */}
      <div className={`rounded-2xl p-6 border ${isOverCap ? 'bg-red-500/10 border-red-500/30' : isNearCap ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-[#111111] border-[#2A2A2A]'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Daily Payout</p>
            <p className={`text-2xl font-black ${isOverCap ? 'text-red-400' : isNearCap ? 'text-yellow-400' : 'text-white'}`}>{formatCurrency(dailyTotal)} of {formatCurrency(DAILY_CAP)}</p>
          </div>
          <div className="flex-1 ml-6">
            <div className="h-3 bg-[#1A1A1A] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${isOverCap ? 'bg-red-500' : isNearCap ? 'bg-yellow-500' : 'bg-[#E8B84B]'}`} style={{ width: `${Math.min((dailyTotal / DAILY_CAP) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
        {isNearCap && <p className="text-yellow-400 text-sm mt-2">⚠️ Approaching daily limit. Approvals will be blocked at ₹50,000.</p>}
      </div>

      {/* Table */}
      <div className="bg-[#111111] rounded-2xl border border-[#2A2A2A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
              <tr>
                {['Worker', 'Amount', 'UPI ID', 'Requested', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-[#2A2A2A]">
                  <td className="px-4 py-3 text-white">{w.workerName || 'N/A'}</td>
                  <td className="px-4 py-3 text-[#E8B84B] font-bold">{formatCurrency(w.amount || 0)}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{w.upiId || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{formatDate(w.requestedAt)} {formatTime(w.requestedAt)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(w.status)}`}>{w.status}</span></td>
                  <td className="px-4 py-3">
                    {w.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(w.id, w.amount)} disabled={isOverCap} className="px-3 py-1.5 bg-green-600 disabled:bg-gray-700 text-white text-xs font-bold rounded-lg min-h-[44px] flex items-center"><Check size={14} className="mr-1" /> Approve</button>
                        <button onClick={() => setRejectModal(w.id)} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg min-h-[44px] flex items-center"><X size={14} className="mr-1" /> Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setRejectModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#111111] rounded-2xl p-6 max-w-md w-full border border-[#2A2A2A]" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-white font-bold text-lg mb-4">Reject Withdrawal</h3>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Rejection reason..." rows={3} className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white resize-none mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setRejectModal(null)} className="flex-1 py-3 bg-[#1A1A1A] text-gray-400 font-semibold rounded-xl min-h-[44px]">Cancel</button>
                <button onClick={handleReject} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl min-h-[44px]">Confirm Reject</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== SUB-ADMIN CREATION ====================
export const SubAdminCreationSection = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [form, setForm] = useState({ email: '', ventures: [] });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'admins'), (snap) => {
      setSubAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleCreate = async () => {
    if (!form.email) { toast.error('Enter email address'); return; }
    await setDoc(doc(db, 'admins', form.email.replace(/[.@]/g, '_')), {
      email: form.email,
      role: 'SubAdmin',
      assignedVentures: form.ventures,
      createdAt: serverTimestamp(),
    });
    toast.success(`Sub-admin created: ${form.email}`);
    setForm({ email: '', ventures: [] });
  };

  const toggleVenture = (v) => {
    setForm((prev) => ({
      ...prev,
      ventures: prev.ventures.includes(v) ? prev.ventures.filter((x) => x !== v) : [...prev.ventures, v],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <div className="bg-[#111111] rounded-2xl p-6 border border-[#2A2A2A] space-y-4">
        <h3 className="text-white font-bold text-lg">Create Sub-Admin</h3>
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white min-h-[44px]" />
        <div>
          <p className="text-gray-400 text-sm mb-2">Assign Ventures</p>
          <div className="flex flex-wrap gap-2">
            {VENTURES.map((v) => (
              <button key={v} onClick={() => toggleVenture(v)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${form.ventures.includes(v) ? 'bg-[#E8B84B] text-black' : 'bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A]'}`}>{v}</button>
            ))}
          </div>
        </div>
        <button onClick={handleCreate} className="px-6 py-3 bg-[#E8B84B] text-black font-bold rounded-xl min-h-[44px]">Create Sub-Admin</button>
      </div>

      {/* Sub-Admins List */}
      <div className="bg-[#111111] rounded-2xl border border-[#2A2A2A] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
            <tr>
              {['Email', 'Role', 'Ventures', 'Created'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subAdmins.map((sa) => (
              <tr key={sa.id} className="border-b border-[#2A2A2A]">
                <td className="px-4 py-3 text-white">{sa.email}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-semibold text-blue-400 bg-blue-500/10">{sa.role}</span></td>
                <td className="px-4 py-3 text-gray-400">{sa.assignedVentures?.join(', ') || 'All'}</td>
                <td className="px-4 py-3 text-gray-400 text-sm">{formatDate(sa.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== FRAUD ALERTS ====================
export const FraudAlertsSection = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'fraudAlerts'), orderBy('flaggedAt', 'desc')), (snap) => {
      setAlerts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleDismiss = async (id) => {
    await updateDoc(doc(db, 'fraudAlerts', id), { status: 'dismissed' });
    toast.success('Alert dismissed');
  };

  const handleSuspend = async (userId) => {
    await updateDoc(doc(db, 'users', userId), { status: 'suspended' });
    toast.success('Account suspended');
  };

  const handleBan = async (userId) => {
    await updateDoc(doc(db, 'users', userId), { status: 'banned' });
    toast.success('Account permanently banned');
  };

  return (
    <div className="space-y-4">
      {alerts.length === 0 && (
        <div className="bg-[#111111] rounded-2xl p-12 border border-[#2A2A2A] text-center">
          <AlertTriangle size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No fraud alerts</p>
        </div>
      )}
      {alerts.filter((a) => a.status !== 'dismissed').map((a) => (
        <div key={a.id} className="bg-[#111111] rounded-2xl p-6 border border-red-500/20">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-500/10 rounded-lg"><AlertTriangle size={20} className="text-red-400" /></div>
              <div>
                <p className="text-white font-semibold">{a.workerName || 'Unknown Worker'}</p>
                <p className="text-red-400 text-sm">{a.alertType || 'Fraud detected'}</p>
                <p className="text-gray-500 text-xs mt-1">{formatDate(a.flaggedAt)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDismiss(a.id)} className="px-3 py-1.5 bg-[#1A1A1A] text-gray-400 text-xs font-semibold rounded-lg min-h-[44px]">Dismiss</button>
              <button onClick={() => handleSuspend(a.userId)} className="px-3 py-1.5 bg-yellow-600 text-white text-xs font-semibold rounded-lg min-h-[44px]">Suspend</button>
              <button onClick={() => handleBan(a.userId)} className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg min-h-[44px]">Ban</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== ANNOUNCEMENT BROADCASTER ====================
export const AnnouncementBroadcasterSection = () => {
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [target, setTarget] = useState('');

  const handleBroadcast = async () => {
    if (!message) { toast.error('Enter message content'); return; }
    await addDoc(collection(db, 'announcements'), {
      text: message,
      audience,
      target: audience !== 'all' ? target : '',
      priority: audience === 'all' ? 1 : 2,
      createdAt: serverTimestamp(),
    });
    toast.success('Announcement broadcasted!');
    setMessage('');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-[#111111] rounded-2xl p-6 border border-[#2A2A2A] space-y-4">
        <h3 className="text-white font-bold text-lg">Broadcast Announcement</h3>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Enter announcement message..." rows={4} className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white resize-none" />
        <div>
          <p className="text-gray-400 text-sm mb-2">Audience</p>
          <div className="flex gap-2">
            {['all', 'venture', 'role'].map((a) => (
              <button key={a} onClick={() => setAudience(a)} className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize min-h-[44px] ${audience === a ? 'bg-[#E8B84B] text-black' : 'bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A]'}`}>{a}</button>
            ))}
          </div>
        </div>
        {audience !== 'all' && (
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white min-h-[44px]">
            <option value="">Select {audience}...</option>
            {(audience === 'venture' ? VENTURES : ROLES).map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        )}
        <button onClick={handleBroadcast} className="w-full px-6 py-3 bg-[#E8B84B] text-black font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"><Send size={16} /> Broadcast</button>
      </div>
    </div>
  );
};
