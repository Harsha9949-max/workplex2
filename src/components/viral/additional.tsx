/**
 * Phase 10 Viral Layer - Additional Components
 * Live Feed, Share Modal, Family Transfer, QR Modal
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot, collection, query, where, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Share2, Download, MessageCircle, Bell, TrendingUp, Send, Copy, QrCode,
  Wallet, X, Check, AlertCircle, Gift, ChevronRight, Zap,
} from 'lucide-react';

const formatCurrency = (n) => `Rs.${(n || 0).toLocaleString('en-IN')}`;
const formatTimeAgo = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = Math.floor(((now as any) - (d as any)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ==================== LIVE EARNINGS FEED ====================
export const LiveEarningsFeed = ({ venture, limitCount = 20 }) => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'liveFeed'),
      ...(venture ? [where('venture', '==', venture)] : []),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFeed(items);
      setLoading(false);
    }, () => setLoading(false));

    return unsub;
  }, [venture, limitCount]);

  if (loading || feed.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={18} className="text-[#E8B84B]" />
        <h3 className="text-white font-bold text-sm">Live Earnings</h3>
        <span className="text-gray-500 text-xs">Real-time activity</span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
        {feed.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-3 bg-[#111111] rounded-xl border border-[#2A2A2A]"
          >
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">💸</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm">
                <span className="font-semibold">{item.name}</span> earned{' '}
                <span className="text-green-400 font-bold">{formatCurrency(item.amount)}</span>
              </p>
              <p className="text-gray-500 text-xs">from {item.source} • {item.venture}</p>
            </div>
            <span className="text-gray-500 text-xs flex-shrink-0">{formatTimeAgo(item.timestamp)}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ==================== WHATSAPP SHARE MODAL ====================
export const WhatsAppShareModal = ({ isOpen, onClose, message, type = 'referral' }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShareWA = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#111111] rounded-2xl p-6 max-w-md w-full border border-[#2A2A2A]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Share on WhatsApp</h3>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white" aria-label="Close"><X size={20} /></button>
            </div>

            <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4">
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{message}</p>
            </div>

            <div className="space-y-3">
              <button onClick={handleShareWA} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px]">
                <Share2 size={18} /> Share on WhatsApp
              </button>
              <button onClick={handleCopy} className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px]">
                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
              <button onClick={onClose} className="w-full text-gray-400 font-semibold py-2 min-h-[44px]">Dismiss</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==================== FAMILY TRANSFER MODAL ====================
export const FamilyTransferModal = ({ isOpen, onClose, earnedBalance, userId, userName }) => {
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = () => {
    setStep('input');
    setUpiId('');
    setAmount('');
    setError('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateUPI = (upi) => /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi);

  const handleNext = () => {
    if (!validateUPI(upiId)) {
      setError('Enter a valid UPI ID (e.g., name@upi)');
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num < 100) {
      setError('Minimum transfer is Rs.100');
      return;
    }
    if (num > 10000) {
      setError('Maximum transfer is Rs.10,000');
      return;
    }
    if (num > earnedBalance) {
      setError('Insufficient balance');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'familyTransfers'), {
        senderId: userId,
        senderName: userName || '',
        recipientUpi: upiId,
        amount: parseFloat(amount),
        status: 'pending',
        type: 'family_transfer',
        createdAt: serverTimestamp(),
      });
      setStep('success');
    } catch (err) {
      setError('Transfer failed. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-[#111111] w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border border-gray-800/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#111111] border-b border-gray-800/50 p-4 flex items-center justify-between z-10">
              <h3 className="text-white font-bold text-lg">Send to Family</h3>
              <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white" aria-label="Close"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {step === 'input' && (
                <>
                  <p className="text-gray-400 text-sm">Transfer money to any UPI ID instantly</p>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">UPI ID</label>
                    <input
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="name@upi"
                      className="w-full px-4 py-3 bg-[#1A1A1A] border border-gray-800/50 rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Amount (Rs.)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Min Rs.100, Max Rs.10,000"
                      className="w-full px-4 py-3 bg-[#1A1A1A] border border-gray-800/50 rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors min-h-[44px]"
                    />
                  </div>
                  <div className="bg-[#1A1A1A] rounded-xl p-4">
                    <p className="text-gray-500 text-xs mb-1">Available Balance</p>
                    <p className="text-green-400 font-bold text-xl">{formatCurrency(earnedBalance)}</p>
                  </div>
                  <button onClick={handleNext} className="w-full bg-[#E8B84B] text-black font-bold py-4 rounded-xl min-h-[44px]">Continue</button>
                </>
              )}

              {step === 'confirm' && (
                <>
                  <div className="bg-[#1A1A1A] rounded-xl p-4 space-y-3">
                    <div className="flex justify-between"><span className="text-gray-500 text-sm">Send to</span><span className="text-white font-semibold">{upiId}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 text-sm">Amount</span><span className="text-white font-bold">{formatCurrency(parseFloat(amount))}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 text-sm">Fee</span><span className="text-green-400 font-bold">FREE</span></div>
                    <div className="border-t border-gray-800 pt-3 flex justify-between"><span className="text-gray-300 font-semibold">Total</span><span className="text-[#E8B84B] font-black text-xl">{formatCurrency(parseFloat(amount))}</span></div>
                  </div>
                  <button onClick={handleConfirm} disabled={isSubmitting} className="w-full bg-[#E8B84B] disabled:bg-gray-700 text-black font-bold py-4 rounded-xl min-h-[44px]">{isSubmitting ? 'Processing...' : 'Confirm Transfer'}</button>
                </>
              )}

              {step === 'success' && (
                <div className="text-center space-y-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Check size={40} className="text-green-400" />
                  </motion.div>
                  <div>
                    <h4 className="text-white font-bold text-xl mb-2">Transfer Initiated!</h4>
                    <p className="text-gray-400 text-sm">{formatCurrency(parseFloat(amount))} will be sent to {upiId} after admin approval.</p>
                  </div>
                  <button onClick={handleClose} className="w-full bg-[#E8B84B] text-black font-bold py-4 rounded-xl min-h-[44px]">Done</button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==================== REFERRAL QR MODAL ====================
export const ReferralQRModal = ({ isOpen, onClose, userId, username }) => {
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      setQrGenerated(true);
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const link = `https://workplex.hvrs.in/join?ref=${userId}`;

  const handleDownload = () => {
    const canvas = document.querySelector('#qr-canvas canvas');
    if (canvas) {
      const downloadLink = document.createElement('a');
      downloadLink.download = `workplex-referral-${username || userId}.png`;
      downloadLink.href = canvas.toDataURL();
      downloadLink.click();
      toast.success('QR Code downloaded!');
    }
  };

  const handleShareWA = () => {
    const link = `https://workplex.hvrs.in/join?ref=${userId}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`Join WorkPlex using my referral link: ${link}`)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://workplex.hvrs.in/join?ref=${userId}`);
    toast.success('Link copied!');
  };

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
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-[#111111] rounded-3xl p-8 max-w-sm w-full border border-[#E8B84B]/30 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white" aria-label="Close"><X size={20} /></button>

            <h3 className="text-white font-bold text-xl text-center mb-6">Your Referral QR Code</h3>

            {/* QR Code Container */}
            <div className="bg-white rounded-2xl p-6 flex items-center justify-center mb-6 relative overflow-hidden" id="qr-canvas">
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#E8B84B] to-[#00C9A7] opacity-20" />
              <div className="relative z-10">
                <QRCodeCanvas
                  value={link}
                  size={200}
                  level="H"
                  includeMargin={true}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
            </div>

            <p className="text-gray-400 text-xs text-center mb-6">
              Share this QR code offline. When someone scans and joins, they'll be added to your team!
            </p>

            <div className="space-y-3">
              <button onClick={handleDownload} className="w-full bg-[#E8B84B] text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px]">
                <Download size={16} /> Download PNG
              </button>
              <div className="flex gap-3">
                <button onClick={handleShareWA} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px]">
                  <Share2 size={16} /> WhatsApp
                </button>
                <button onClick={handleCopyLink} className="flex-1 bg-[#1A1A1A] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px]">
                  <Copy size={16} /> Copy Link
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
