/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, ErrorInfo, ReactNode } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  useNavigate,
  Link,
  useLocation
} from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  addDoc,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage, googleProvider } from './firebase';
import {
  createTask,
  approveSubmission,
  rejectSubmission,
  approveWithdrawal,
  rejectWithdrawal,
  createSubAdmin,
  sendAnnouncement,
  manualCredit,
  updateUserStatus,
  updateUserRole,
  activateCoupon
} from './functions';
import { AdminRouteGuard, AdminLayout, DashboardSection, WorkerManagementSection, TaskManagementSection, CouponManagementSection, WithdrawalManagementSection, SubAdminCreationSection, FraudAlertsSection, AnnouncementBroadcasterSection } from './components/admin';
import { LeaderboardScreen } from './components/gamification/index';
import { PublicProfile, ResellerShop, TeamChat, EarningsStoryGenerator, PWAInstallPrompt, LiveEarningsFeed, WhatsAppShareModal, FamilyTransferModal, ReferralQRModal } from './components/viral';
import { ShopSetupWizard, PublicShopPage, PartnerDashboard, CheckoutModal, AdminCatalogManager } from './components/partnerStore/index';
import { ProfileScreen as ProfileScreenV3 } from './components/roles';
import { PublicProfile as PublicProfileOld, ResellerShop as ResellerShopOld, TeamChat as TeamChatOld } from './ViralLayer';
import AdminPanel from './AdminPanel';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import { TasksScreen as TasksScreenV3 } from './components/tasks';
import { WalletScreen } from './components/wallet';
import { CouponDashboard } from './components/coupon';
import HomeDashboardNew from './components/dashboard/HomeDashboard';
import { ProfileScreen as RolesProfileScreen } from './components/roles';
import {
  StreakDisplay,
  BadgeGrid,
  LevelProgress,
  LeaderboardTab,
  LevelUpCelebration,
  MysteryTaskPopup,
  BADGES,
  LEVELS
} from './components/Gamification';
import { motion, AnimatePresence } from 'framer-motion';
import * as CryptoJS from 'crypto-js';
import {
  Phone,
  User,
  Briefcase,
  CreditCard,
  FileText,
  CheckCircle,
  LogOut,
  ShieldCheck,
  Camera,
  Loader2,
  AlertCircle,
  Flame,
  Wallet,
  Share2,
  Clock,
  ChevronRight,
  TrendingUp,
  Home,
  ListTodo,
  UserCircle,
  ShoppingBag,
  Sparkles,
  Bell,
  Zap,
  X,
  LayoutDashboard,
  Users,
  CheckSquare,
  Ticket,
  Banknote,
  Megaphone,
  ShieldAlert,
  Settings,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Ban,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Send,
  Trash2,
  Calendar,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Trophy
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

// --- Constants & Types ---
const AES_SECRET = (import.meta.env?.VITE_AES_SECRET) ?? 'fallback-secret';
const VENTURES = ['BuyRix', 'Vyuma', 'TrendyVerse', 'Growplex'] as const;
type Venture = typeof VENTURES[number];

const ROLES: Record<Venture, string[]> = {
  BuyRix: ['Marketer', 'Content Creator', 'Reseller'],
  Vyuma: ['Marketer', 'Content Creator', 'Reseller'],
  TrendyVerse: ['Marketer', 'Content Creator', 'Reseller'],
  Growplex: ['Reseller', 'Client Acquirer', 'Support Agent', 'Social Promoter'],
};

interface UserData {
  name: string;
  phone: string;
  photoURL: string;
  age: number;
  venture: Venture;
  upiId: string;
  bankAccount: string;
  aadhaar: string;
  pan: string;
  deviceFingerprint: string;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Legend';
  streak: number;
  lastActiveDate?: string;
  badges?: string[];
  totalTasksCompleted?: number;
  role: string;
  contractSigned: boolean;
  joinedAt: any;
  lastActiveAt: any;
  activeMonths: number;
  totalEarned: number;
  referredBy?: string;
  showPromotionCelebration?: boolean;
  username?: string;
  showTotalEarnedPublicly?: boolean;
  wallets: {
    earned: number;
    pending: number;
    bonus: number;
    savings: number;
  };
  kycDone: boolean;
  firstTaskDone: boolean;
  todayEarnings: number;
  monthlyEarnings: number;
  daysActiveThisMonth: number;
}

interface CouponData {
  code: string;
  venture: Venture;
  ownerId: string;
  isActive: boolean;
  activatedAt: any;
  expiresAt: any;
  usageCount: number;
  totalEarned: number;
}

interface CouponUsage {
  id: string;
  couponCode: string;
  ownerId: string;
  buyerId: string;
  productId: string;
  productPrice: number;
  margin: number;
  commissionAmount: number;
  usedAt: any;
  released: boolean;
}

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'commission_release' | 'coupon_manual_credit' | 'task_earning' | 'bonus';
  description: string;
  createdAt: any;
}

interface TaskData {
  id: string;
  title: string;
  earning: number;
  deadline: any;
  status: 'assigned' | 'accepted' | 'completed' | 'skipped';
}

interface Announcement {
  id: string;
  text: string;
  audience: 'all' | 'venture' | 'role';
  target: string;
  createdAt: any;
}

interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  upiId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: any;
  processedAt?: any;
  rejectionReason?: string;
}

interface TaskSubmission {
  id: string;
  userId: string;
  userName: string;
  taskId: string;
  taskTitle: string;
  proofLink: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  rejectionReason?: string;
}

interface FraudAlert {
  id: string;
  userId: string;
  userName: string;
  reason: string;
  flaggedAt: any;
  status: 'active' | 'dismissed' | 'action_taken';
}

interface SubAdmin {
  id: string;
  email: string;
  venture: string;
  createdAt: any;
}

// --- Utils ---
const encrypt = (text: string) => CryptoJS.AES.encrypt(text, AES_SECRET).toString();

const getDeviceFingerprint = () => {
  const data = navigator.userAgent + screen.width + screen.height + screen.colorDepth;
  return CryptoJS.SHA256(data).toString();
};

const generateCouponCode = (venture: Venture) => {
  const prefixes: Record<Venture, string> = {
    BuyRix: 'BX',
    Vyuma: 'VY',
    TrendyVerse: 'TV',
    Growplex: 'GX'
  };
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefixes[venture]}-${randomPart}`;
};

const calculateCommission = (productPrice: number) => {
  const margin = productPrice * 0.175;
  const commission = margin * 0.10;
  return { margin, commission };
};

const applyCoupon = async (couponCode: string, buyerId: string, productId: string, productPrice: number) => {
  // 1. Find coupon
  const q = query(collection(db, 'coupons'), where('code', '==', couponCode), where('isActive', '==', true));
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error('Invalid or expired coupon code.');

  const couponDoc = snapshot.docs[0];
  const couponData = couponDoc.data() as CouponData;

  // 2. Anti-self-use check
  if (couponData.ownerId === buyerId) {
    throw new Error('You cannot use your own coupon.');
  }

  // 3. Calculate commission
  const { margin, commission } = calculateCommission(productPrice);

  // 4. Create usage record
  const usage: Omit<CouponUsage, 'id'> = {
    couponCode,
    ownerId: couponData.ownerId,
    buyerId,
    productId,
    productPrice,
    margin,
    commissionAmount: commission,
    usedAt: serverTimestamp(),
    released: false
  };
  await addDoc(collection(db, 'couponUsages'), usage);

  // 5. Update coupon stats
  await updateDoc(doc(db, 'coupons', couponData.ownerId), {
    usageCount: increment(1),
    totalEarned: increment(commission)
  });

  return { success: true, commission };
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  // Safely stringify to avoid circular structure errors
  const safeStringify = (obj: any) => {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return '[Circular]';
        cache.add(value);
      }
      return value;
    });
  };

  const errString = safeStringify(errInfo);
  console.error('Firestore Error: ', errString);
  throw new Error(errString);
}

// --- Components ---

function PromotionCelebration({ role, onDismiss }: { role: string, onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-6"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-32 h-32 bg-[#E8B84B] rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_rgba(232,184,75,0.5)]"
        >
          <ShieldCheck size={64} className="text-black" />
        </motion.div>
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-black text-white mb-4"
        >
          Congratulations!
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-gray-400 mb-12"
        >
          You have been promoted to <span className="text-[#E8B84B] font-bold">{role}</span>
        </motion.p>
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={onDismiss}
          className="bg-[#E8B84B] text-black font-black px-12 py-4 rounded-2xl shadow-[0_10px_20px_rgba(232,184,75,0.2)]"
        >
          Claim Badge
        </motion.button>
      </div>
    </motion.div>
  );
}

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
  public state: any = { hasError: false, error: null };
  public props: any;

  constructor(props: any) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black mb-2">Something went wrong</h1>
          <p className="text-gray-400 text-sm mb-8 max-w-xs">
            We've encountered an unexpected error. Our team has been notified.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#E8B84B] text-black font-bold px-8 py-4 rounded-2xl active:scale-95 transition-transform shadow-lg shadow-[#E8B84B]/20"
          >
            Refresh Application
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-8 p-4 bg-black border border-gray-800 rounded-xl text-left text-xs text-red-400 overflow-auto max-w-full">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  // NOTE: Splash screen removal is now handled exclusively in main.tsx
  // AFTER React root.render() completes. This prevents a race condition
  // where App.tsx's useEffect and main.tsx both try to remove the splash.
  // Keeping this comment for architectural clarity.

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<MainApp />} />
          <Route path="/tasks" element={<TasksScreenV3Wrapper />} />
          <Route path="/wallet" element={<WalletScreenWrapper />} />
          <Route path="/coupon" element={<CouponScreenWrapper />} />
          <Route path="/profile" element={<ProfileScreenWrapper />} />
          <Route path="/leaderboard" element={<LeaderboardWrapper />} />
          <Route path="/admin/*" element={<AdminRouteGuard><AdminPanelWrapper /></AdminRouteGuard>} />
          <Route path="/u/:username" element={<PublicProfile />} />
          <Route path="/shop/:slug" element={<PublicShopPage />} />
          <Route path="/team-chat/:leadId" element={<TeamChatWrapper />} />
          <Route path="/setup-shop" element={<ShopSetupWrapper />} />
          <Route path="/partner-dashboard" element={<PartnerDashboardWrapper />} />
          <Route path="/:username" element={<PublicProfile />} />
          <Route path="*" element={<MainApp />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

function TasksScreenV3Wrapper() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        window.location.href = '/auth';
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#E8B84B] animate-spin" />
      </div>
    );
  }

  return <TasksScreenV3 user={user} />;
}

function WalletScreenWrapper() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) setUser(firebaseUser);
      else window.location.href = '/auth';
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#E8B84B] animate-spin" />
      </div>
    );
  }

  return <WalletScreen user={user} />;
}

function CouponScreenWrapper() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) setUser(firebaseUser);
      else window.location.href = '/auth';
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#E8B84B] animate-spin" />
      </div>
    );
  }

  return <CouponDashboard user={user} />;
}

function ProfileScreenWrapper() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (doc) => {
          if (doc.exists()) setUserData(doc.data());
          setLoading(false);
        });
        return () => unsubUser();
      } else {
        window.location.href = '/auth';
      }
      setLoading(false);
    });
    return unsubAuth;
  }, []);

  if (loading || !user || !userData) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#E8B84B] animate-spin" />
      </div>
    );
  }

  return <RolesProfileScreen uid={user.uid} userData={userData} onLogout={() => signOut(auth)} onBack={() => window.history.back()} />;
}

function AdminPanelWrapper() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const location = useLocation();

  // Sync active section with URL
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (['dashboard', 'workers', 'tasks', 'coupons', 'withdrawals', 'subadmins', 'fraud', 'announcements'].includes(path || '')) {
      setActiveSection(path || 'dashboard');
    }
  }, [location.pathname]);

  const navigate = (section: string) => {
    setActiveSection(section);
    window.history.pushState({}, '', `/admin/${section}`);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardSection />;
      case 'workers': return <WorkerManagementSection />;
      case 'tasks': return <TaskManagementSection />;
      case 'coupons': return <CouponManagementSection />;
      case 'withdrawals': return <WithdrawalManagementSection />;
      case 'subadmins': return <SubAdminCreationSection />;
      case 'fraud': return <FraudAlertsSection />;
      case 'announcements': return <AnnouncementBroadcasterSection />;
      default: return <DashboardSection />;
    }
  };

  return <AdminLayout activeSection={activeSection} onNavigate={navigate}>{renderSection()}</AdminLayout>;
}

function LeaderboardWrapper() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (doc) => {
          if (doc.exists()) setUserData(doc.data());
          setLoading(false);
        });
        return () => unsubUser();
      } else {
        window.location.href = '/auth';
      }
      setLoading(false);
    });
    return unsubAuth;
  }, []);

  if (loading || !user || !userData) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#E8B84B] animate-spin" />
      </div>
    );
  }

  return <LeaderboardScreen uid={user.uid} userData={userData} />;
}

function TeamChatWrapper() {
  const { leadId } = useParams();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (doc) => {
          if (doc.exists()) setUserData(doc.data());
          setLoading(false);
        });
        return () => unsubUser();
      } else {
        window.location.href = '/auth';
      }
      setLoading(false);
    });
    return unsubAuth;
  }, []);

  if (loading || !user || !userData) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#E8B84B] animate-spin" />
      </div>
    );
  }

  // Check if user has access to team chat
  const canAccessChat = ['Lead Marketer', 'Manager', 'Sub-Admin', 'Admin'].includes(userData.role || '');

  if (!canAccessChat) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-gray-400 mb-6">Upgrade to Lead Marketer to access Team Chat.</p>
          <button onClick={() => window.history.back()} className="px-6 py-3 bg-[#E8B84B] text-black font-bold rounded-xl">Go Back</button>
        </div>
      </div>
    );
  }

  return <TeamChat leadId={leadId || user.uid} leadName={userData.name} />;
}

function ShopSetupWrapper() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) setUser(firebaseUser);
      else window.location.href = '/auth';
      setLoading(false);
    });
    return unsubAuth;
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#E8B84B] animate-spin" />
      </div>
    );
  }

  return <ShopSetupWizard user={user} onComplete={() => window.location.href = '/partner-dashboard'} />;
}

function PartnerDashboardWrapper() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (doc) => {
          if (doc.exists()) setUserData(doc.data());
          setLoading(false);
        });
        return () => unsubUser();
      } else {
        window.location.href = '/auth';
      }
      setLoading(false);
    });
    return unsubAuth;
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#E8B84B] animate-spin" />
      </div>
    );
  }

  return <PartnerDashboard user={user} />;
}

export function MainApp() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0); // 0: Auth Selection, 1-7: Steps
  const [userData, setUserData] = useState<Partial<UserData>>({
    level: 'Bronze',
    streak: 0,
    contractSigned: false,
    wallets: { earned: 0, pending: 27, bonus: 0, savings: 0 },
    kycDone: false,
    firstTaskDone: false,
    todayEarnings: 0,
    monthlyEarnings: 0,
    daysActiveThisMonth: 0
  });

  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [phoneAuthStep, setPhoneAuthStep] = useState<'number' | 'otp'>('number');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const refId = urlParams.get('ref');
    if (refId) {
      setUserData(prev => ({ ...prev, referredBy: refId }));
    }
  }, [location.search]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.email === 'hvrsindustriespvtltd@gmail.com') {
          setUser(firebaseUser);
          setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(firebaseUser);
          setIsNewUser(false);
          setOnboardingStep(0);
        } else {
          setUser(firebaseUser);
          setIsNewUser(true);
          setOnboardingStep(1);
        }
      } else {
        setUser(null);
        setOnboardingStep(0);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!recaptchaVerifier && recaptchaRef.current) {
      try {
        const verifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: 'invisible',
        });
        setRecaptchaVerifier(verifier);
      } catch (e) {
        console.error('Recaptcha init failed', e);
      }
    }
  }, [recaptchaRef.current]);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePhoneSignIn = async (phone: string) => {
    try {
      setError(null);
      if (!recaptchaVerifier) {
        setError('Recaptcha not ready. Please wait.');
        return;
      }

      const q = query(collection(db, 'users'), where('phone', '==', phone));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error('This phone number is already registered.');
      }

      const result = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
      setConfirmationResult(result);
      setPhoneAuthStep('otp');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const verifyOtp = async (otp: string) => {
    try {
      setError(null);
      if (confirmationResult) {
        await confirmationResult.confirm(otp);
      }
    } catch (err: any) {
      setError('Invalid OTP. Please try again.');
    }
  };

  const handleOnboardingSubmit = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const refId = userData.referredBy;

      const username = `${userData.name?.split(' ')[0].toLowerCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      const finalData: UserData = {
        ...userData,
        username,
        phone: user.phoneNumber || userData.phone || '',
        deviceFingerprint: getDeviceFingerprint(),
        joinedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        activeMonths: 1,
        totalEarned: 0,
        referredBy: refId || '',
        showTotalEarnedPublicly: true,
      } as UserData;

      await setDoc(doc(db, 'users', user.uid), finalData);

      // If referred, add to lead's team
      if (refId) {
        await setDoc(doc(db, `teams/${refId}/members`, user.uid), {
          memberId: user.uid,
          joinedAt: serverTimestamp()
        });
      }

      // Auto-generate Coupon
      const couponCode = generateCouponCode(finalData.venture);
      const couponData: CouponData = {
        code: couponCode,
        venture: finalData.venture,
        ownerId: user.uid,
        isActive: false,
        activatedAt: null,
        expiresAt: null,
        usageCount: 0,
        totalEarned: 0
      };
      await setDoc(doc(db, 'coupons', user.uid), couponData);

      setIsNewUser(false);
      setOnboardingStep(0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#E8B84B] animate-spin" />
      </div>
    );
  }

  if (user?.email === 'hvrsindustriespvtltd@gmail.com' || window.location.pathname === '/admin') {
    if (user?.email !== 'hvrsindustriespvtltd@gmail.com') {
      window.location.href = '/home';
      return null;
    }
    return <AdminPanel user={user} />;
  }

  if (user && !isNewUser) {
    return (
      <>
        <HomeDashboardNew user={user} />
        <PWAInstallPrompt />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#E8B84B]/30">
      {onboardingStep > 0 && (
        <div className="fixed top-0 left-0 w-full h-1 bg-[#1A1A1A] z-50">
          <motion.div
            className="h-full bg-[#E8B84B] shadow-[0_0_10px_#E8B84B]"
            initial={{ width: 0 }}
            animate={{ width: `${(onboardingStep / 7) * 100}%` }}
          />
        </div>
      )}

      <div className="max-w-md mx-auto px-6 pt-12 pb-24">
        <AnimatePresence mode="wait">
          {onboardingStep === 0 && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-[#E8B84B] rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(232,184,75,0.3)]">
                <ShieldCheck size={40} className="text-black" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">WorkPlex</h1>
              <p className="text-gray-400 mb-12 text-center">Join the elite gig workforce of HVRS Innovations</p>

              <div className="w-full space-y-4">
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-[0.98]"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                  Continue with Google
                </button>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px bg-gray-800 flex-1" />
                  <span className="text-gray-600 text-sm">OR</span>
                  <div className="h-px bg-gray-800 flex-1" />
                </div>

                <div className="bg-[#1A1A1A] p-6 rounded-3xl border border-gray-800">
                  {phoneAuthStep === 'number' ? (
                    <PhoneInput onSubmit={handlePhoneSignIn} />
                  ) : (
                    <OtpInput onSubmit={verifyOtp} onBack={() => setPhoneAuthStep('number')} />
                  )}
                </div>
              </div>
              <div ref={recaptchaRef} />
            </motion.div>
          )}

          {onboardingStep === 1 && (
            <StepWrapper key="step1" title="Personal Details" icon={<User className="text-[#E8B84B]" />}>
              <PersonalInfoForm
                onNext={(data) => {
                  setUserData(prev => ({ ...prev, ...data }));
                  setOnboardingStep(2);
                }}
              />
            </StepWrapper>
          )}

          {onboardingStep === 2 && (
            <StepWrapper key="step2" title="Profile Photo" icon={<Camera className="text-[#E8B84B]" />}>
              <PhotoUpload
                onNext={(url) => {
                  setUserData(prev => ({ ...prev, photoURL: url }));
                  setOnboardingStep(3);
                }}
              />
            </StepWrapper>
          )}

          {onboardingStep === 3 && (
            <StepWrapper key="step3" title="Select Venture" icon={<Briefcase className="text-[#E8B84B]" />}>
              <VentureSelect
                onNext={(venture) => {
                  setUserData(prev => ({ ...prev, venture }));
                  setOnboardingStep(4);
                }}
              />
            </StepWrapper>
          )}

          {onboardingStep === 4 && (
            <StepWrapper key="step4" title="Choose Role" icon={<Briefcase className="text-[#E8B84B]" />}>
              <RoleSelect
                venture={userData.venture as Venture}
                onNext={(role) => {
                  setUserData(prev => ({ ...prev, role }));
                  setOnboardingStep(5);
                }}
              />
            </StepWrapper>
          )}

          {onboardingStep === 5 && (
            <StepWrapper key="step5" title="Payment Details" icon={<CreditCard className="text-[#E8B84B]" />}>
              <PaymentForm
                onNext={(data) => {
                  setUserData(prev => ({ ...prev, ...data }));
                  setOnboardingStep(6);
                }}
              />
            </StepWrapper>
          )}

          {onboardingStep === 6 && (
            <StepWrapper key="step6" title="Identity Verification" icon={<ShieldCheck className="text-[#E8B84B]" />}>
              <IdentityForm
                onNext={(data) => {
                  setUserData(prev => ({
                    ...prev,
                    aadhaar: encrypt(data.aadhaar),
                    pan: encrypt(data.pan)
                  }));
                  setOnboardingStep(7);
                }}
              />
            </StepWrapper>
          )}

          {onboardingStep === 7 && (
            <StepWrapper key="step7" title="Agreement" icon={<FileText className="text-[#E8B84B]" />}>
              <AgreementStep
                onNext={() => {
                  setUserData(prev => ({ ...prev, contractSigned: true }));
                  handleOnboardingSubmit();
                }}
              />
            </StepWrapper>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// --- Home Dashboard Component ---

const shareOnWhatsApp = (text: string) => {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

function TaskCard({ task, now, onAccept, onSkip }: { task: TaskData, now: number, onAccept: (id: string) => void, onSkip: (id: string) => void }) {
  const getTimeRemaining = (deadline: any) => {
    if (!deadline) return '0h 0m';
    const end = new Date(deadline).getTime();
    const diff = end - now;
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#1A1A1A] p-4 rounded-2xl border border-gray-800 flex flex-col gap-4"
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-white">{task.title}</h4>
          <div className="flex items-center gap-2 text-gray-500 text-xs mt-1">
            <Clock size={12} />
            <span>Ends in {getTimeRemaining(task.deadline)}</span>
          </div>
        </div>
        <span className="text-[#00C9A7] font-black">₹{task.earning}</span>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onAccept(task.id)}
          className="flex-1 bg-[#00C9A7] text-black font-bold py-2.5 rounded-xl text-sm active:scale-95 transition-transform"
        >
          Accept
        </button>
        <button
          onClick={() => onSkip(task.id)}
          className="flex-1 bg-gray-800 text-gray-400 font-bold py-2.5 rounded-xl text-sm active:scale-95 transition-transform"
        >
          Skip
        </button>
      </div>
    </motion.div>
  );
}

const MemoizedTaskCard = React.memo(TaskCard);

function CouponCard({ coupon, userData, now }: { coupon: CouponData | null, userData: UserData | null, now: number }) {
  const getCouponProgress = () => {
    if (!coupon?.expiresAt) return 0;
    const end = new Date(coupon.expiresAt).getTime();
    const start = end - (24 * 60 * 60 * 1000); // Assume 24h duration
    const total = end - start;
    const remaining = end - now;
    return Math.max(0, Math.min(100, (remaining / total) * 100));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-[#1A1A1A] to-[#111111] p-6 rounded-3xl border border-gray-800 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Zap size={80} className="text-[#E8B84B]" />
      </div>
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Coupon Code</span>
          <span className="text-[#00C9A7] text-xs font-bold bg-[#00C9A7]/10 px-2 py-1 rounded-lg">
            Used {coupon?.usageCount || 0} times
          </span>
        </div>
        <h2 className="text-3xl font-black text-white mb-4 tracking-wider">{coupon?.code || 'PLEX-XXXX'}</h2>

        <div className="w-full h-1.5 bg-gray-800 rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-[#E8B84B]"
            initial={{ width: '100%' }}
            animate={{ width: `${getCouponProgress()}%` }}
            transition={{ type: 'spring', damping: 20 }}
          />
        </div>

        <button
          onClick={() => {
            const message = `Check out ${userData?.venture}! Use my code ${coupon?.code} for discount: https://workplex.hvrs.com/shop`;
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
          }}
          className="w-full bg-[#00C9A7] text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#00b395] transition-all active:scale-[0.98]"
        >
          <Share2 size={20} /> Share on WhatsApp
        </button>
      </div>
    </motion.div>
  );
}

const MemoizedCouponCard = React.memo(CouponCard);

function HomeDashboard({ user }: { user: FirebaseUser }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [coupon, setCoupon] = useState<CouponData | null>(null);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMysteryTask, setShowMysteryTask] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showCelebration, setShowCelebration] = useState(false);
  const [mysteryTask, setMysteryTask] = useState<any>(null);
  const [now, setNow] = useState(Date.now());
  const [teamSize, setTeamSize] = useState(0);
  const [aiPrediction, setAiPrediction] = useState<any>(null);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [globalTransactions, setGlobalTransactions] = useState<any[]>([]);
  const [toast, setToast] = useState<{ amount: number, source: string } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      const txs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (recentTransactions.length > 0 && txs.length > recentTransactions.length) {
        const newTx: any = txs[0];
        setToast({ amount: newTx.amount, source: newTx.description });
        setTimeout(() => setToast(null), 4000);
      }
      setRecentTransactions(txs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));
    return () => unsub();
  }, [user.uid, recentTransactions.length]);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setGlobalTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchAIPrediction = async () => {
      const pendingCount = tasks.filter(t => t.status === 'assigned').length;
      const avgEarning = tasks.reduce((a, b) => a + b.earning, 0) / (tasks.length || 1);
      setAiPrediction({
        predictedEarning: pendingCount * avgEarning,
        message: `Complete ${pendingCount} more tasks to earn Rs.${Math.round(pendingCount * avgEarning)} extra today!`
      });
    };
    if (user.uid) fetchAIPrediction();
  }, [user.uid, tasks]);

  useEffect(() => {
    const fetchAIRecommendations = async () => {
      if (userData?.role !== 'Reseller') return;
      setIsAiLoading(true);
      setAiRecommendations(['Electronics', 'Fashion', 'Home Decor', 'Beauty', 'Sports']);
      setIsAiLoading(false);
    };
    if (userData?.role === 'Reseller') fetchAIRecommendations();
  }, [userData?.role, user.uid]);

  useEffect(() => {
    updateDoc(doc(db, 'users', user.uid), { lastActiveAt: serverTimestamp() });
  }, [user.uid]);

  useEffect(() => {
    if (userData?.role === 'Lead Marketer' || userData?.role === 'Manager') {
      const unsubTeam = onSnapshot(collection(db, `teams/${user.uid}/members`), (snapshot) => {
        setTeamSize(snapshot.size);
      });
      return () => unsubTeam();
    }
  }, [userData?.role, user.uid]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Real-time listeners
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) setUserData(doc.data() as UserData);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    const unsubCoupon = onSnapshot(doc(db, 'coupons', user.uid), (doc) => {
      if (doc.exists()) setCoupon(doc.data() as CouponData);
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupons/${user.uid}`));

    const unsubTasks = onSnapshot(
      query(collection(db, 'tasks', user.uid, 'assigned'), where('status', '==', 'assigned'), limit(3)),
      (snapshot) => {
        setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TaskData)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, `tasks/${user.uid}/assigned`)
    );

    const unsubAnnouncements = onSnapshot(
      query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(5)),
      (snapshot) => {
        setAnnouncements(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'announcements')
    );

    // Mystery Task Trigger
    const checkMysteryTasks = async () => {
      if (Math.random() < 0.15) {
        const q = query(collection(db, 'mysteryTasks'), where('isMystery', '==', true), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setMysteryTask({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      }
    };
    checkMysteryTasks();

    return () => {
      unsubUser();
      unsubCoupon();
      unsubTasks();
      unsubAnnouncements();
    };
  }, [user.uid]);

  useEffect(() => {
    if (userData?.showPromotionCelebration) {
      setShowCelebration(true);
    }
  }, [userData?.showPromotionCelebration]);

  const handleDismissCelebration = async () => {
    setShowCelebration(false);
    await updateDoc(doc(db, 'users', user.uid), { showPromotionCelebration: false });
  };

  const handleAcceptTask = async (taskId: string) => {
    await updateDoc(doc(db, 'tasks', user.uid, 'assigned', taskId), { status: 'accepted' });
  };

  const handleSkipTask = async (taskId: string) => {
    await updateDoc(doc(db, 'tasks', user.uid, 'assigned', taskId), { status: 'skipped' });
  };

  const handleAcceptMysteryTask = async () => {
    const mysteryTask: Partial<TaskData> = {
      title: 'Mystery Task: Quick Survey',
      earning: 75,
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      status: 'assigned'
    };
    await addDoc(collection(db, 'tasks', user.uid, 'assigned'), mysteryTask);
    setShowMysteryTask(false);
  };

  const getTimeRemaining = (deadline: any) => {
    if (!deadline) return '0h 0m';
    const end = new Date(deadline).getTime();
    const diff = end - now;
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getCouponProgress = () => {
    if (!coupon?.expiresAt) return 0;
    const end = new Date(coupon.expiresAt).getTime();
    const start = end - (24 * 60 * 60 * 1000); // Assume 24h duration
    const total = end - start;
    const remaining = end - now;
    return Math.max(0, Math.min(100, (remaining / total) * 100));
  };

  const calculateAIPredictor = () => {
    if (tasks.length === 0) return { count: 0, extra: 0 };
    const avgEarning = tasks.reduce((acc, t) => acc + t.earning, 0) / tasks.length;
    return {
      count: tasks.length,
      extra: Math.round(tasks.length * avgEarning)
    };
  };

  const predictor = calculateAIPredictor();

  if (loading) return <HomeSkeleton />;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-32">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-32 left-6 right-6 z-[100] bg-[#00C9A7] text-black p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,201,167,0.3)] flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="font-black text-sm">₹{toast.amount} Earned!</p>
              <p className="text-xs font-bold opacity-70">{toast.source}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'home' ? (
        <>
          {userData?.showPromotionCelebration && (
            <LevelUpCelebration
              level={userData.level}
              uid={user.uid}
              onClose={() => updateDoc(doc(db, 'users', user.uid), { showPromotionCelebration: false })}
            />
          )}
          {/* Top Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-[#111111] border-b border-gray-800"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={userData?.photoURL || 'https://picsum.photos/seed/user/200'} className="w-14 h-14 rounded-2xl object-cover border border-[#E8B84B]/30" alt="Profile" referrerPolicy="no-referrer" />
                  <div className="absolute -bottom-1 -right-1 bg-[#E8B84B] text-black text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    {userData?.level || 'Bronze'}
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold">{userData?.name || 'User'}</h2>
                  <span className="text-xs bg-[#E8B84B]/10 text-[#E8B84B] px-2 py-0.5 rounded-full border border-[#E8B84B]/20">
                    {userData?.venture} {userData?.role}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-[#E8B84B]">
                  <Flame size={18} fill="currentColor" />
                  <span className="font-bold">{userData?.streak || 0} days</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Earned Balance</p>
                <h1 className="text-4xl font-black text-white">₹{(userData?.wallets?.earned || 0).toLocaleString()}</h1>
                <p className="text-[#00C9A7] text-sm font-medium mt-1">Today: +₹{userData?.todayEarnings || 0}</p>
              </div>
              <button
                onClick={() => setActiveTab('wallet')}
                className="bg-[#E8B84B] text-black p-3 rounded-2xl shadow-[0_0_20px_rgba(232,184,75,0.2)] active:scale-95 transition-transform"
              >
                <Wallet size={24} />
              </button>
            </div>
          </motion.div>

          <div className="px-6 space-y-6 mt-6">
            {/* Live Earnings Feed */}
            <div className="bg-[#111111] py-3 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 mb-2">
                <div className="w-1.5 h-1.5 bg-[#00C9A7] rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Earnings Feed</span>
              </div>
              <div className="h-8 overflow-hidden relative">
                <motion.div
                  animate={{ y: [0, -32 * (globalTransactions.length || 1)] }}
                  transition={{
                    duration: (globalTransactions.length || 1) * 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="space-y-0"
                >
                  {[...globalTransactions, ...globalTransactions].map((tx, idx) => (
                    <div key={idx} className="h-8 flex items-center px-4 gap-2">
                      <span className="text-[#00C9A7] font-black text-xs">₹{tx.amount}</span>
                      <span className="text-gray-400 text-[10px] truncate">from {tx.description}</span>
                      <span className="text-gray-600 text-[9px] ml-auto">
                        {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Coupon Card */}
            {(userData?.role === 'Marketer' || userData?.role === 'Content Creator') && (
              <MemoizedCouponCard coupon={coupon} userData={userData} now={now} />
            )}

            {/* AI Earnings Predictor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#E8B84B] p-6 rounded-3xl text-black flex items-center justify-between shadow-[0_10px_30px_rgba(232,184,75,0.2)]"
            >
              <div className="max-w-[70%]">
                <h3 className="font-black text-lg leading-tight">AI Predictor</h3>
                <p className="text-sm font-bold opacity-80 mt-1">
                  {aiPrediction?.message || `Complete ${predictor.count} more tasks to earn ₹${predictor.extra} extra today`}
                </p>
              </div>
              <div className="w-14 h-14 bg-black/10 rounded-2xl flex items-center justify-center">
                <TrendingUp size={28} />
              </div>
            </motion.div>

            {/* Today's Tasks */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Today's Tasks</h3>
                <button className="text-[#E8B84B] text-sm font-bold flex items-center gap-1">
                  View All <ChevronRight size={16} />
                </button>
              </div>
              <div className="space-y-4">
                {tasks.length > 0 ? tasks.map((task) => (
                  <MemoizedTaskCard
                    key={task.id}
                    task={task}
                    now={now}
                    onAccept={handleAcceptTask}
                    onSkip={handleSkipTask}
                  />
                )) : (
                  <div className="bg-[#1A1A1A] p-8 rounded-3xl border border-dashed border-gray-800 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center mb-3">
                      <ListTodo className="text-gray-600" />
                    </div>
                    <p className="text-gray-600 text-sm italic">No tasks assigned for now. Check back later!</p>
                  </div>
                )}
              </div>
            </section>

            {/* Lead Marketer Progress */}
            <div className="bg-[#111111] p-6 rounded-3xl border border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-300">Journey to Lead Marketer</h3>
                <span className="text-[#E8B84B] font-black">₹{(userData?.monthlyEarnings || 0).toLocaleString()}/50k</span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#E8B84B] to-[#00C9A7]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((userData?.monthlyEarnings || 0) / 50000) * 100)}%` }}
                  transition={{ type: 'spring', damping: 20 }}
                />
              </div>
              <p className="text-gray-500 text-xs font-bold">{userData?.daysActiveThisMonth || 0} days active this month</p>
            </div>
          </div>
        </>
      ) : activeTab === 'leaderboard' && userData ? (
        <div className="p-6 pb-32">
          <LeaderboardTab venture={userData.venture} />
        </div>
      ) : activeTab === 'chat' && userData ? (
        <div className="p-6 pb-32">
          <TeamChat leadId={user.uid} leadName={userData.name} />
        </div>
      ) : activeTab === 'tasks' && userData ? (
        <TasksScreen user={user} userData={userData as UserData} />
      ) : activeTab === 'wallet' && userData ? (
        <WalletScreen user={user!} />
      ) : activeTab === 'catalog' && userData ? (
        <div className="p-6 pb-32">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Product Catalog</h2>
            <div className="flex gap-2">
              <button className="p-2 bg-[#1A1A1A] rounded-xl border border-gray-800"><Search size={20} /></button>
              <button className="p-2 bg-[#1A1A1A] rounded-xl border border-gray-800"><Filter size={20} /></button>
            </div>
          </div>

          {/* AI Recommended Section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-[#E8B84B]" size={20} />
              <h3 className="text-lg font-bold">AI Recommended for You</h3>
            </div>

            {isAiLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {[1, 2, 3].map(i => (
                  <div key={i} className="min-w-[200px] h-32 bg-[#1A1A1A] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : Array.isArray(aiRecommendations) ? (
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {aiRecommendations.map((cat: string, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="min-w-[240px] bg-gradient-to-br from-[#E8B84B]/20 to-[#1A1A1A] p-5 rounded-3xl border border-[#E8B84B]/20"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-[#E8B84B] bg-[#E8B84B]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Trending
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-lg mb-1">{cat}</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">AI Recommended Category</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-[#1A1A1A] rounded-3xl border border-dashed border-gray-800 text-center">
                <p className="text-gray-500 text-sm italic">AI is analyzing trends for you...</p>
              </div>
            )}
          </section>

          {/* Regular Categories */}
          <div className="grid grid-cols-2 gap-4">
            {['Electronics', 'Fashion', 'Home Decor', 'Beauty', 'Gadgets', 'Accessories'].map((cat, idx) => (
              <div key={idx} className="bg-[#1A1A1A] p-6 rounded-3xl border border-gray-800 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform">
                <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="text-gray-400" />
                </div>
                <span className="font-bold text-sm">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'profile' && userData ? (
        <ProfileScreen
          userData={userData}
          teamSize={teamSize}
          onLogout={() => signOut(auth)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-[80vh] text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#E8B84B]" />
          <p className="text-sm font-medium uppercase tracking-widest">{activeTab} screen coming soon</p>
        </div>
      )}

      {/* Admin Announcements Slider */}
      <div className="fixed bottom-24 left-0 w-full bg-[#E8B84B]/5 border-y border-[#E8B84B]/10 py-3 overflow-hidden">
        <AnnouncementSlider announcements={announcements} />
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 w-full bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-gray-800 px-4 py-4 flex justify-between items-center z-40 overflow-x-auto no-scrollbar gap-4">
        <NavButton active={activeTab === 'home'} icon={<Home />} label="Home" onClick={() => setActiveTab('home')} />
        {userData?.role === 'Reseller' && (
          <NavButton active={activeTab === 'catalog'} icon={<ShoppingBag />} label="Catalog" onClick={() => setActiveTab('catalog')} />
        )}
        {(userData?.role === 'Lead Marketer' || userData?.role === 'Manager') && (
          <NavButton active={activeTab === 'chat'} icon={<Users />} label="Team" onClick={() => setActiveTab('chat')} />
        )}
        <NavButton active={activeTab === 'tasks'} icon={<ListTodo />} label="Tasks" onClick={() => setActiveTab('tasks')} />
        <NavButton active={activeTab === 'leaderboard'} icon={<Trophy />} label="Ranks" onClick={() => setActiveTab('leaderboard')} />
        <NavButton active={activeTab === 'wallet'} icon={<Wallet />} label="Wallet" onClick={() => setActiveTab('wallet')} />
        <NavButton active={activeTab === 'profile'} icon={<UserCircle />} label="Profile" onClick={() => setActiveTab('profile')} />
      </div>

      {/* Mystery Task Popup */}
      <AnimatePresence>
        {mysteryTask && (
          <MysteryTaskPopup
            task={mysteryTask}
            onAccept={handleAcceptMysteryTask}
            onClose={() => setMysteryTask(null)}
          />
        )}
      </AnimatePresence>

      {/* Level Up Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <LevelUpCelebration
            level={userData?.level || 'Bronze'}
            uid={user.uid}
            onClose={handleDismissCelebration}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}

function AnnouncementSlider({ announcements }: { announcements: Announcement[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  if (announcements.length === 0) return null;

  return (
    <div className="relative h-6 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={announcements[index]?.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 px-8 absolute"
        >
          <Bell size={14} className="text-[#E8B84B]" />
          <span className="text-sm font-medium text-gray-300 truncate max-w-[80vw]">
            {announcements[index]?.text}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div className={`transition-all ${active ? 'text-[#E8B84B]' : 'text-gray-600'}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 24, strokeWidth: active ? 2.5 : 2 } as any)}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-[#E8B84B]' : 'text-gray-600'}`}>
        {label}
      </span>
    </button>
  );
}

function OldWalletScreen({ userData }: { userData: UserData }) {
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), where('userId', '==', auth.currentUser?.uid), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));
    return () => unsub();
  }, []);

  const handleWithdraw = async (type: 'normal' | 'family_transfer') => {
    if (!amount || parseFloat(amount) < 100) {
      setError('Minimum withdrawal is ₹100');
      return;
    }
    if (type === 'family_transfer' && !upiId) {
      setError('Please enter Family UPI ID');
      return;
    }
    if (parseFloat(amount) > (userData.wallets?.earned || 0)) {
      setError('Insufficient balance');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const withdrawalData = {
        userId: auth.currentUser?.uid,
        amount: parseFloat(amount),
        type: type,
        upiId: type === 'family_transfer' ? upiId : userData.upiId,
        status: 'pending',
        createdAt: serverTimestamp(),
        description: type === 'family_transfer' ? `Family Transfer to ${upiId}` : 'Standard Withdrawal'
      };

      await addDoc(collection(db, 'withdrawals'), withdrawalData);

      await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
        'wallets.earned': increment(-parseFloat(amount))
      });

      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser?.uid,
        amount: -parseFloat(amount),
        type: 'withdrawal',
        description: type === 'family_transfer' ? `Sent to ${upiId}` : 'Withdrawal initiated',
        createdAt: serverTimestamp()
      });

      setSuccess(true);
      setAmount('');
      setUpiId('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#111111] p-8 rounded-[3rem] border border-gray-800 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8B84B]/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-2">Available for Withdrawal</p>
        <h1 className="text-5xl font-black text-[#E8B84B]">₹{(userData.wallets?.earned || 0).toLocaleString()}</h1>
        <div className="flex justify-center gap-4 mt-6">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Pending</p>
            <p className="text-sm font-bold text-gray-300">₹{userData.wallets?.pending || 0}</p>
          </div>
          <div className="w-px h-8 bg-gray-800"></div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Bonus</p>
            <p className="text-sm font-bold text-[#00C9A7]">₹{userData.wallets?.bonus || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#111111] p-6 rounded-3xl border border-gray-800 space-y-4">
        <h3 className="text-sm font-bold text-gray-300">Withdraw Funds</h3>
        <input
          type="number"
          placeholder="Enter Amount (Min ₹100)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-black border border-gray-800 rounded-2xl px-4 py-4 text-lg font-bold focus:outline-none focus:border-[#E8B84B]"
        />

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleWithdraw('normal')}
            disabled={loading}
            className="bg-[#E8B84B] text-black font-bold py-4 rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
          >
            Withdraw
          </button>
          <button
            onClick={() => handleWithdraw('family_transfer')}
            disabled={loading}
            className="bg-white text-black font-bold py-4 rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
          >
            Send to Family
          </button>
        </div>

        {amount && parseFloat(amount) >= 100 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <input
              type="text"
              placeholder="Family UPI ID (for Family Transfer)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-2xl px-4 py-4 text-sm mt-2 focus:outline-none focus:border-[#E8B84B]"
            />
          </motion.div>
        )}

        {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
        {success && <p className="text-[#00C9A7] text-xs font-bold text-center">Withdrawal request sent!</p>}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-2">Recent Transactions</h3>
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-[#111111] p-4 rounded-2xl border border-gray-800 flex justify-between items-center">
              <div>
                <p className="font-bold text-sm">{tx.description}</p>
                <p className="text-[10px] text-gray-500">{tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString() : 'Pending'}</p>
              </div>
              <p className={`font-black ${tx.amount > 0 ? 'text-[#00C9A7]' : 'text-red-500'}`}>
                {tx.amount > 0 ? '+' : ''}₹{tx.amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TasksScreen({ user, userData }: { user: FirebaseUser, userData: UserData }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'tasks'), where('venture', '==', userData.venture), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tasks'));
    return () => unsub();
  }, [userData.venture]);

  return (
    <div className="p-6 space-y-6 pb-32">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Available Tasks</h2>
        <div className="bg-[#E8B84B]/10 text-[#E8B84B] px-3 py-1 rounded-full text-xs font-bold border border-[#E8B84B]/20">
          {tasks.length} Tasks
        </div>
      </div>

      <div className="space-y-4">
        {tasks.map((task, idx) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#111111] p-6 rounded-3xl border border-gray-800 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-800 rounded-2xl group-hover:bg-[#E8B84B] group-hover:text-black transition-colors">
                <ListTodo size={24} />
              </div>
              <div className="text-right">
                <p className="text-[#00C9A7] font-black text-xl">₹{task.earnAmount}</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{task.difficulty}</p>
              </div>
            </div>
            <h3 className="text-lg font-bold mb-2">{task.title}</h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">{task.description}</p>
            <button className="w-full bg-white text-black font-bold py-3 rounded-xl active:scale-95 transition-transform">
              Start Task
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ProfileScreen({ userData, teamSize, onLogout }: { userData: UserData, teamSize: number, onLogout: () => void }) {
  const referralLink = `${window.location.origin}/?ref=${auth.currentUser?.uid}`;
  const profileLink = `${window.location.origin}/${userData.username}`;
  const [copied, setCopied] = useState(false);
  const [profileCopied, setProfileCopied] = useState(false);

  const [showQR, setShowQR] = useState(false);

  return (
    <div className="p-6 space-y-8 pb-32">
      {showQR && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          onClick={() => setShowQR(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-[#111111] p-8 rounded-[3rem] border border-gray-800 flex flex-col items-center text-center max-w-xs w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white p-4 rounded-3xl mb-6">
              <QRCodeSVG value={referralLink} size={200} />
            </div>
            <h3 className="text-xl font-bold mb-2">My Referral QR</h3>
            <p className="text-gray-500 text-sm mb-8">Scan to join WorkPlex under {userData.name}</p>
            <button
              onClick={() => setShowQR(false)}
              className="w-full bg-[#E8B84B] text-black font-bold py-4 rounded-2xl active:scale-95 transition-transform"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}

      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4">
          <img src={userData.photoURL || 'https://picsum.photos/seed/user/200'} className="w-24 h-24 rounded-full border-4 border-[#E8B84B] object-cover" alt="Profile" referrerPolicy="no-referrer" />
          <div className="absolute -bottom-2 -right-2 bg-[#E8B84B] text-black text-xs font-bold px-2 py-1 rounded-full">
            {userData.level}
          </div>
        </div>
        <h2 className="text-2xl font-bold">{userData.name}</h2>
        <p className="text-gray-500 mb-4">{userData.venture} {userData.role}</p>

        <StreakDisplay streak={userData.streak || 0} />
      </div>

      <div className="bg-[#111111] p-6 rounded-[2.5rem] border border-white/5">
        <LevelProgress totalEarned={userData.totalEarned || 0} currentLevel={userData.level} />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-2">Your Badges</h3>
        <BadgeGrid earnedBadges={userData.badges || []} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-gray-800">
          <p className="text-gray-500 text-xs uppercase font-bold mb-1">Total Earned</p>
          <p className="text-xl font-bold text-[#E8B84B]">₹{(userData.totalEarned || 0).toLocaleString()}</p>
        </div>
        {(userData.role === 'Lead Marketer' || userData.role === 'Manager') && (
          <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-gray-800">
            <p className="text-gray-500 text-xs uppercase font-bold mb-1">Team Size</p>
            <p className="text-xl font-bold text-[#00C9A7]">{teamSize} Members</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-2">Privacy & Sharing</h3>
        <div className="bg-[#1A1A1A] p-6 rounded-3xl border border-gray-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold">Public Earnings</h4>
            <p className="text-xs text-gray-500">Show total earned on public profile</p>
          </div>
          <button
            onClick={() => updateDoc(doc(db, 'users', auth.currentUser!.uid), { showTotalEarnedPublicly: userData.showTotalEarnedPublicly === false ? true : false })}
            className={`w-12 h-6 rounded-full transition-colors relative ${userData.showTotalEarnedPublicly !== false ? 'bg-[#00C9A7]' : 'bg-gray-700'}`}
          >
            <motion.div
              animate={{ x: userData.showTotalEarnedPublicly !== false ? 24 : 4 }}
              className="w-4 h-4 bg-white rounded-full absolute top-1"
            />
          </button>
        </div>

        <div className="bg-[#1A1A1A] p-6 rounded-3xl border border-gray-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold">Share Profile</h4>
            <p className="text-xs text-gray-500">Copy your public profile link</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(profileLink);
              setProfileCopied(true);
              setTimeout(() => setProfileCopied(false), 2000);
            }}
            className="p-3 bg-gray-800 rounded-xl text-[#E8B84B] active:scale-95 transition-transform"
          >
            {profileCopied ? <CheckCircle size={20} /> : <Share2 size={20} />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-2">Viral Growth</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowQR(true)}
            className="bg-[#1A1A1A] p-6 rounded-3xl border border-gray-800 flex flex-col items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-[#E8B84B]/10 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="text-[#E8B84B]" />
            </div>
            <span className="font-bold text-xs">My QR Code</span>
          </button>
          <Link
            to={`/${userData.username}`}
            className="bg-[#1A1A1A] p-6 rounded-3xl border border-gray-800 flex flex-col items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-[#00C9A7]/10 rounded-2xl flex items-center justify-center">
              <UserCircle className="text-[#00C9A7]" />
            </div>
            <span className="font-bold text-xs">Public Profile</span>
          </Link>
        </div>
      </div>

      {(userData.role === 'Lead Marketer' || userData.role === 'Manager') && (
        <div className="bg-[#1A1A1A] p-6 rounded-3xl border border-gray-800">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Referral Link</h3>
          <div className="flex items-center gap-3 bg-black p-4 rounded-xl border border-gray-800">
            <span className="text-xs text-gray-400 truncate flex-1">{referralLink}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(referralLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-[#E8B84B] flex items-center gap-1"
            >
              {copied ? <CheckCircle size={18} /> : <Share2 size={18} />}
              {copied && <span className="text-[10px] font-bold">Copied!</span>}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onLogout}
        className="w-full bg-red-500/10 text-red-500 font-bold py-4 rounded-2xl border border-red-500/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        <LogOut size={20} /> Logout
      </button>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#1A1A1A] rounded-2xl animate-pulse" />
          <div className="space-y-2">
            <div className="w-32 h-4 bg-[#1A1A1A] rounded animate-pulse" />
            <div className="w-20 h-3 bg-[#1A1A1A] rounded animate-pulse" />
          </div>
        </div>
        <div className="w-16 h-6 bg-[#1A1A1A] rounded animate-pulse" />
      </div>
      <div className="w-full h-40 bg-[#1A1A1A] rounded-3xl animate-pulse" />
      <div className="w-full h-20 bg-[#1A1A1A] rounded-3xl animate-pulse" />
      <div className="space-y-4">
        <div className="w-full h-32 bg-[#1A1A1A] rounded-2xl animate-pulse" />
        <div className="w-full h-32 bg-[#1A1A1A] rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

// --- Sub-components ---

function StepWrapper({ children, title, icon }: { children: React.ReactNode, title: string, icon: React.ReactNode, key?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center border border-gray-800">
          {icon}
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function PhoneInput({ onSubmit }: { onSubmit: (phone: string) => void }) {
  const [phone, setPhone] = useState('');
  return (
    <div className="space-y-4">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">+91</span>
        <input
          type="tel"
          placeholder="Enter mobile number"
          className="w-full bg-black border border-gray-800 rounded-xl py-4 pl-14 pr-4 focus:border-[#E8B84B] outline-none transition-all"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <button
        onClick={() => onSubmit(`+91${phone}`)}
        disabled={phone.length !== 10}
        className="w-full bg-[#E8B84B] text-black font-bold py-4 rounded-xl disabled:opacity-50 transition-all active:scale-[0.98]"
      >
        Send OTP
      </button>
    </div>
  );
}

function OtpInput({ onSubmit, onBack }: { onSubmit: (otp: string) => void, onBack: () => void }) {
  const [otp, setOtp] = useState('');
  return (
    <div className="space-y-4">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Enter OTP</label>
      <input
        type="text"
        placeholder="6-digit code"
        maxLength={6}
        className="w-full bg-black border border-gray-800 rounded-xl py-4 px-4 text-center text-2xl tracking-[1em] focus:border-[#E8B84B] outline-none transition-all"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />
      <button
        onClick={() => onSubmit(otp)}
        disabled={otp.length !== 6}
        className="w-full bg-[#00C9A7] text-black font-bold py-4 rounded-xl disabled:opacity-50 transition-all active:scale-[0.98]"
      >
        Verify OTP
      </button>
      <button onClick={onBack} className="w-full text-gray-500 text-sm hover:text-white transition-colors">Change Number</button>
    </div>
  );
}

function PersonalInfoForm({ onNext }: { onNext: (data: { name: string, age: number }) => void }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const ageNum = parseInt(age);
    if (ageNum < 18) {
      setError('You must be at least 18 years old to join WorkPlex.');
      return;
    }
    if (!name) {
      setError('Please enter your full name.');
      return;
    }
    onNext({ name, age: ageNum });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
        <input
          type="text"
          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl py-4 px-4 focus:border-[#E8B84B] outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase">Age</label>
        <input
          type="number"
          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl py-4 px-4 focus:border-[#E8B84B] outline-none"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button onClick={handleSubmit} className="w-full bg-[#E8B84B] text-black font-bold py-4 rounded-xl">Continue</button>
    </div>
  );
}

function PhotoUpload({ onNext }: { onNext: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploading(true);
    try {
      setPreview(URL.createObjectURL(file));
      const storageRef = ref(storage, `profiles/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onNext(url);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-40 h-40">
        <div className="w-full h-full rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden bg-[#1A1A1A]">
          {preview ? (
            <img src={preview} className="w-full h-full object-cover" alt="Preview" />
          ) : (
            <Camera size={40} className="text-gray-600" />
          )}
        </div>
        <label className="absolute bottom-2 right-2 w-10 h-10 bg-[#E8B84B] rounded-full flex items-center justify-center cursor-pointer shadow-lg active:scale-90 transition-transform">
          <Camera size={20} className="text-black" />
          <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
        </label>
      </div>
      <p className="text-gray-500 text-center text-sm">Upload a clear profile photo to build trust with clients.</p>
      {uploading && <Loader2 className="animate-spin text-[#E8B84B]" />}
    </div>
  );
}

function VentureSelect({ onNext }: { onNext: (v: Venture) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {VENTURES.map(v => (
        <button
          key={v}
          onClick={() => onNext(v)}
          className="p-6 bg-[#1A1A1A] border border-gray-800 rounded-2xl text-left hover:border-[#E8B84B] hover:bg-[#252525] transition-all group"
        >
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">{v}</span>
            <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center group-hover:border-[#E8B84B] group-hover:bg-[#E8B84B]/10">
              <div className="w-2 h-2 rounded-full bg-[#E8B84B] opacity-0 group-hover:opacity-100" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function RoleSelect({ venture, onNext }: { venture: Venture, onNext: (r: string) => void }) {
  const roles = ROLES[venture];
  return (
    <div className="grid grid-cols-1 gap-4">
      {roles.map(r => (
        <button
          key={r}
          onClick={() => onNext(r)}
          className="p-6 bg-[#1A1A1A] border border-gray-800 rounded-2xl text-left hover:border-[#00C9A7] hover:bg-[#252525] transition-all group"
        >
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">{r}</span>
            <CheckCircle size={20} className="text-[#00C9A7] opacity-0 group-hover:opacity-100" />
          </div>
        </button>
      ))}
    </div>
  );
}

function PaymentForm({ onNext }: { onNext: (data: { upiId: string, bankAccount: string }) => void }) {
  const [upi, setUpi] = useState('');
  const [bank, setBank] = useState('');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase">UPI ID</label>
        <input
          type="text"
          placeholder="username@bank"
          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl py-4 px-4 focus:border-[#E8B84B] outline-none"
          value={upi}
          onChange={(e) => setUpi(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase">Bank Account Number</label>
        <input
          type="text"
          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl py-4 px-4 focus:border-[#E8B84B] outline-none"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
        />
      </div>
      <button
        onClick={() => onNext({ upiId: upi, bankAccount: bank })}
        disabled={!upi || !bank}
        className="w-full bg-[#E8B84B] text-black font-bold py-4 rounded-xl disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}

function IdentityForm({ onNext }: { onNext: (data: { aadhaar: string, pan: string }) => void }) {
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-3 text-blue-400 text-xs">
        <ShieldCheck size={16} className="shrink-0" />
        Your identity documents are encrypted end-to-end and stored securely.
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase">Aadhaar Number</label>
        <input
          type="text"
          maxLength={12}
          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl py-4 px-4 focus:border-[#E8B84B] outline-none"
          value={aadhaar}
          onChange={(e) => setAadhaar(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase">PAN Number</label>
        <input
          type="text"
          maxLength={10}
          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl py-4 px-4 focus:border-[#E8B84B] outline-none uppercase"
          value={pan}
          onChange={(e) => setPan(e.target.value.toUpperCase())}
        />
      </div>
      <button
        onClick={() => onNext({ aadhaar, pan })}
        disabled={aadhaar.length !== 12 || pan.length !== 10}
        className="w-full bg-[#E8B84B] text-black font-bold py-4 rounded-xl disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}

function AgreementStep({ onNext }: { onNext: () => void }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6 h-64 overflow-y-auto text-sm text-gray-400 leading-relaxed">
        <h3 className="text-white font-bold mb-4">Independent Contractor Agreement</h3>
        <p className="mb-4">This agreement is between HVRS Innovations and the Independent Contractor (You).</p>
        <p className="mb-4">1. Services: You agree to provide services as a gig worker in your selected role.</p>
        <p className="mb-4">2. Compensation: You will be paid on a commission basis. Rs.27 pending bonus is credited upon signup.</p>
        <p className="mb-4">3. Independent Status: You are not an employee of HVRS Innovations.</p>
        <p className="mb-4">4. Confidentiality: You agree to keep all business data confidential.</p>
        <p>5. Termination: Either party can terminate this agreement at any time.</p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer group">
        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${agreed ? 'bg-[#00C9A7] border-[#00C9A7]' : 'border-gray-700 group-hover:border-gray-500'}`}>
          <input type="checkbox" className="hidden" checked={agreed} onChange={() => setAgreed(!agreed)} />
          {agreed && <CheckCircle size={16} className="text-black" />}
        </div>
        <span className="text-sm text-gray-300">I Agree to the Independent Contractor Agreement</span>
      </label>

      <button
        onClick={onNext}
        disabled={!agreed}
        className="w-full bg-[#00C9A7] text-black font-bold py-4 rounded-xl disabled:opacity-50 shadow-[0_0_20px_rgba(0,201,167,0.2)]"
      >
        Complete Signup
      </button>
    </div>
  );
}
