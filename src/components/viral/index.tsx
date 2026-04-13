/**
 * Phase 10 Viral Layer - All Components
 * Public Profiles, Team Chat, Earnings Stories, PWA
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, orderBy, limit, getDoc, addDoc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import {
  Share2, Download, MessageCircle, Bell, ShoppingBag, TrendingUp, Crown,
  Send, Phone, Mail, MapPin, ChevronLeft, Users, Sparkles, Camera,
  Heart, Star, ArrowRight, Check, X, AlertCircle, Gift, Trophy,
} from 'lucide-react';

// ==================== UTILITY FUNCTIONS ====================
const formatCurrency = (n) => `Rs.${(n || 0).toLocaleString('en-IN')}`;
const formatDate = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
const formatTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

// ==================== PUBLIC PROFILE / SHOP ====================
export const PublicProfile = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;

    const unsub = onSnapshot(
      query(collection(db, 'users'), where('username', '==', username), limit(1)),
      (snap) => {
        if (snap.empty) {
          setNotFound(true);
        } else {
          setUser({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
        setLoading(false);
      }
    );

    return unsub;
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E8B84B]/30 border-t-[#E8B84B] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-400 mb-6">This user doesn't exist or has made their profile private.</p>
          <button onClick={() => window.history.back()} className="px-6 py-3 bg-[#E8B84B] text-black font-bold rounded-xl">Go Back</button>
        </div>
      </div>
    );
  }

  // Reseller sees Product Catalog
  if (user.role === 'Reseller') {
    return <ResellerShop user={user} />;
  }

  // Marketer/Lead sees Stats & Achievements
  return <MarketerProfile user={user} />;
};

// ==================== RESELLER SHOP ====================
export const ResellerShop = ({ user: propUser }) => {
  const { username } = useParams();
  const [user, setUser] = useState(propUser);
  const [products, setProducts] = useState([
    { id: 1, name: 'Wireless Earbuds', price: 999, margin: 175, commission: 17.5, image: '🎧', category: 'Electronics' },
    { id: 2, name: 'Smart Watch', price: 1499, margin: 262, commission: 26.2, image: '⌚', category: 'Electronics' },
    { id: 3, name: 'Phone Case', price: 299, margin: 52, commission: 5.2, image: '📱', category: 'Accessories' },
    { id: 4, name: 'Power Bank', price: 799, margin: 140, commission: 14, image: '🔋', category: 'Electronics' },
    { id: 5, name: 'Bluetooth Speaker', price: 1299, margin: 227, commission: 22.7, image: '🔊', category: 'Electronics' },
    { id: 6, name: 'USB Cable Pack', price: 199, margin: 35, commission: 3.5, image: '🔌', category: 'Accessories' },
  ]);
  const [filter, setFilter] = useState('All');

  if (!user) {
    const unsub = onSnapshot(
      query(collection(db, 'users'), where('username', '==', username), limit(1)),
      (snap) => {
        if (!snap.empty) setUser({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    );
    useEffect(() => unsub, [username]);
  }

  const categories = ['All', ...new Set(products.map((p) => p.category))];
  const filtered = filter === 'All' ? products : products.filter((p) => p.category === filter);
  const shopUrl = `https://workplex.app/${user?.username || username}`;

  const handleShareShop = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Shop with ${user?.name} on WorkPlex! Use code ${user?.couponCode || 'N/A'}: ${shopUrl}`)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      {/* Shop Header */}
      <div className="bg-gradient-to-br from-[#111111] to-[#1A1A1A] border-b border-[#2A2A2A]">
        <div className="max-w-screen-lg mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E8B84B] to-[#F5C95C] flex items-center justify-center text-2xl font-black text-black">
              {user?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              <h1 className="text-white font-bold text-2xl">{user?.name || 'Shop'}</h1>
              <p className="text-gray-400 text-sm">Official {user?.venture || 'WorkPlex'} Reseller</p>
            </div>
          </div>

          {/* Shop Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-[#0A0A0A] rounded-xl p-3 text-center">
              <p className="text-[#E8B84B] font-bold text-lg">{products.length}</p>
              <p className="text-gray-500 text-xs">Products</p>
            </div>
            <div className="bg-[#0A0A0A] rounded-xl p-3 text-center">
              <p className="text-green-400 font-bold text-lg">{user?.rating || '4.8'}</p>
              <p className="text-gray-500 text-xs">Rating</p>
            </div>
            <div className="bg-[#0A0A0A] rounded-xl p-3 text-center">
              <p className="text-blue-400 font-bold text-lg">{user?.ordersCompleted || '120+'}</p>
              <p className="text-gray-500 text-xs">Orders</p>
            </div>
          </div>

          {/* Coupon Code */}
          {user?.couponCode && (
            <div className="bg-[#E8B84B]/10 border border-[#E8B84B]/30 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[#E8B84B] font-bold text-lg">{user.couponCode}</p>
                <p className="text-gray-400 text-xs">Use this code for exclusive deals!</p>
              </div>
              <button onClick={handleShareShop} className="p-2 bg-[#E8B84B] text-black rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Share2 size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
        {/* Category Filter */}
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

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111111] rounded-2xl border border-[#2A2A2A] overflow-hidden"
            >
              <div className="h-32 bg-[#1A1A1A] flex items-center justify-center text-5xl">
                {product.image}
              </div>
              <div className="p-4">
                <p className="text-gray-500 text-xs mb-1">{product.category}</p>
                <h3 className="text-white font-semibold text-sm mb-2">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-[#E8B84B] font-bold">{formatCurrency(product.price)}</span>
                  <span className="text-green-400 text-xs">Save {formatCurrency(product.margin)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== MARKETER PROFILE ====================
export const MarketerProfile = ({ user }) => {
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const [stats] = useState({
    totalEarned: user?.totalEarned || 0,
    tasksCompleted: user?.tasksCompleted || 0,
    streak: user?.streak || 0,
    level: user?.level || 'Bronze',
    role: user?.role || 'Marketer',
    joinedDate: user?.joinedAt,
  });

  const handleShareProfile = () => {
    const url = `https://workplex.app/${user?.username}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out ${user?.name}'s WorkPlex profile! ${url}`)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      {/* Profile Header */}
      <div ref={profileRef} className="bg-gradient-to-br from-[#111111] to-[#1A1A1A] border-b border-[#2A2A2A]">
        <div className="max-w-screen-lg mx-auto px-4 py-8 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E8B84B] to-[#F5C95C] flex items-center justify-center text-4xl font-black text-black mx-auto mb-4">
            {user?.name?.charAt(0) || '?'}
          </div>
          <h1 className="text-white font-bold text-2xl mb-1">{user?.name}</h1>
          <p className="text-gray-400 text-sm mb-4">@{user?.username} • {user?.venture}</p>

          {/* Badges */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="px-3 py-1 bg-[#E8B84B]/10 border border-[#E8B84B]/30 rounded-full text-[#E8B84B] text-xs font-semibold">
              {stats.role}
            </span>
            <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-xs font-semibold">
              {stats.level}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#0A0A0A] rounded-xl p-4">
              <p className="text-[#E8B84B] font-bold text-xl">{formatCurrency(stats.totalEarned)}</p>
              <p className="text-gray-500 text-xs">Total Earned</p>
            </div>
            <div className="bg-[#0A0A0A] rounded-xl p-4">
              <p className="text-green-400 font-bold text-xl">{stats.tasksCompleted}</p>
              <p className="text-gray-500 text-xs">Tasks Done</p>
            </div>
            <div className="bg-[#0A0A0A] rounded-xl p-4">
              <p className="text-orange-400 font-bold text-xl">{stats.streak}🔥</p>
              <p className="text-gray-500 text-xs">Day Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex gap-3">
          <button
            onClick={handleShareProfile}
            className="flex-1 py-3 bg-[#E8B84B] text-black font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Share2 size={18} /> Share Profile
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`https://workplex.app/${user?.username}`);
              toast.success('Link copied!');
            }}
            className="flex-1 py-3 bg-[#1A1A1A] border border-[#2A2A2A] text-white font-semibold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Download size={18} /> Copy Link
          </button>
        </div>

        {/* Achievements Preview */}
        <div className="bg-[#111111] rounded-2xl p-6 border border-[#2A2A2A]">
          <h3 className="text-white font-bold text-lg mb-4">Achievements</h3>
          <div className="grid grid-cols-4 gap-3">
            {['🎯', '', '🔥', '🏆'].map((icon, i) => (
              <div key={i} className="aspect-square bg-[#1A1A1A] rounded-xl flex items-center justify-center text-2xl">
                {icon}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== TEAM CHAT ====================
export const TeamChat = ({ leadId, leadName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!leadId) return;
    const unsub = onSnapshot(
      query(collection(db, 'teams', leadId, 'messages'), orderBy('createdAt', 'asc')),
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [leadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    await addDoc(collection(db, 'teams', leadId, 'messages'), {
      text: newMessage,
      senderId: leadId,
      senderName: leadName || 'Lead',
      isUrgent,
      createdAt: serverTimestamp(),
    });

    setNewMessage('');
    setIsUrgent(false);

    // Send push notification for urgent messages
    if (isUrgent) {
      // In production, trigger FCM via Cloud Function
      toast.success('🚨 Urgent message sent to team!');
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-[#111111] rounded-2xl border border-[#2A2A2A]">
      {/* Header */}
      <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8B84B]/20 flex items-center justify-center text-[#E8B84B] font-bold">
            {leadName?.charAt(0) || 'T'}
          </div>
          <div>
            <h3 className="text-white font-bold">Team Chat</h3>
            <p className="text-green-400 text-xs flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Online
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        )}
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.senderId === leadId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.senderId === leadId
                ? msg.isUrgent
                  ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                  : 'bg-[#E8B84B]/20 border border-[#E8B84B]/30 text-[#E8B84B]'
                : 'bg-[#1A1A1A] text-white'
                }`}
            >
              <p className="text-sm font-medium mb-1">{msg.senderName}</p>
              <p className="text-sm">{msg.text}</p>
              <div className="flex items-center gap-2 mt-2">
                {msg.isUrgent && <AlertCircle size={12} className="text-red-400" />}
                <span className="text-[10px] opacity-50">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUrgent(!isUrgent)}
            className={`p-2 rounded-xl transition-all min-w-[44px] min-h-[44px] ${isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-[#1A1A1A] text-gray-400'
              }`}
            aria-label="Toggle urgent"
          >
            <Bell size={18} />
          </button>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={isUrgent ? '🚨 Urgent message...' : 'Type a message...'}
            className="flex-1 px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-500 focus:border-[#E8B84B] transition-colors min-h-[44px]"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-3 bg-[#E8B84B] text-black rounded-xl disabled:opacity-50 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
        {isUrgent && <p className="text-red-400 text-xs mt-2">🚨 This will notify all team members immediately</p>}
      </div>
    </div>
  );
};

// ==================== EARNINGS STORIES GENERATOR ====================
export const EarningsStoryGenerator = ({ earnings, userName, venture, onShare }) => {
  const storyRef = useRef(null);
  const [template, setTemplate] = useState('gold');

  const templates = {
    gold: 'from-[#E8B84B] via-[#F5C95C] to-[#E8B84B]',
    teal: 'from-[#00C9A7] via-[#10B981] to-[#00C9A7]',
    purple: 'from-[#8B5CF6] via-[#EC4899] to-[#8B5CF6]',
  };

  const generateImage = async () => {
    if (!storyRef.current) return;

    try {
      const canvas = await html2canvas(storyRef.current, {
        backgroundColor: null,
        scale: 2,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `workplex-earnings-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Story downloaded! Share it on WhatsApp/Instagram');
        }
      });
    } catch (err) {
      toast.error('Failed to generate image');
    }
  };

  return (
    <div className="space-y-6">
      {/* Story Preview */}
      <div ref={storyRef} className={`w-[320px] h-[560px] mx-auto rounded-3xl bg-gradient-to-br ${templates[template]} p-8 flex flex-col justify-between relative overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={20} className="text-white/80" />
            <span className="text-white/80 font-semibold text-sm">WorkPlex</span>
          </div>

          <div className="text-center mb-8">
            <p className="text-white/80 text-lg mb-2">I just earned</p>
            <p className="text-white font-black text-5xl mb-2">{formatCurrency(earnings)}</p>
            <p className="text-white/80 text-lg">on WorkPlex! 🔥</p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm">User</span>
              <span className="text-white font-bold">{userName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Venture</span>
              <span className="text-white font-bold">{venture}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center">
          <p className="text-white/60 text-xs">Join me on WorkPlex and start earning!</p>
          <p className="text-white/80 font-mono text-sm mt-2">workplex.app</p>
        </div>
      </div>

      {/* Template Selector */}
      <div className="flex justify-center gap-3">
        {Object.keys(templates).map((t) => (
          <button
            key={t}
            onClick={() => setTemplate(t)}
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${templates[t]} ${template === t ? 'ring-4 ring-white/50' : 'opacity-50'
              } transition-all`}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={generateImage}
          className="flex-1 py-3 bg-[#E8B84B] text-black font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Download size={18} /> Download
        </button>
        <button
          onClick={() => {
            generateImage();
            window.open('https://wa.me/', '_blank');
          }}
          className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Share2 size={18} /> Share on WA
        </button>
      </div>
    </div>
  );
};

// ==================== PWA INSTALL PROMPT ====================
export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast.success('WorkPlex installed!');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-24 left-4 right-4 bg-[#111111] border border-[#E8B84B]/30 rounded-2xl p-4 z-50"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#E8B84B]/20 flex items-center justify-center">
          <Sparkles size={24} className="text-[#E8B84B]" />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">Install WorkPlex</p>
          <p className="text-gray-400 text-xs">Get faster access and push notifications</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPrompt(false)} className="p-2 text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={18} />
          </button>
          <button onClick={handleInstall} className="px-4 py-2 bg-[#E8B84B] text-black font-bold rounded-xl text-sm min-h-[44px]">
            Install
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ==================== PUSH NOTIFICATION SETUP ====================
export const usePushNotifications = (userId) => {
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    if (!userId) return;

    // Request permission on mount
    if (permission === 'default') {
      requestPermission();
    }

    // Subscribe to FCM
    const subscribeToPush = async () => {
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(process.env.VITE_VAPID_PUBLIC_KEY),
          });

          // Save subscription to Firestore
          await updateDoc(doc(db, 'users', userId), {
            fcmToken: JSON.stringify(subscription),
            pushEnabled: true,
          });
        }
      } catch (err) {
        console.error('Push subscription error:', err);
      }
    };

    subscribeToPush();
  }, [userId, permission]);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      toast.success('Notifications enabled!');
    }
  };

  return { permission, requestPermission };
};

// Helper function for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Re-export additional components
export { LiveEarningsFeed, WhatsAppShareModal, FamilyTransferModal, ReferralQRModal } from './additional';
