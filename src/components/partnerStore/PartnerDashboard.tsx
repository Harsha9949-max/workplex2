/**
 * Phase 11 Partner Store - Partner Dashboard
 * Replaces Tasks screen for Partners. Shows sales stats + recent orders.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import {
  TrendingUp, Package, Clock, DollarSign, Eye, Share2, Plus, Settings,
  ChevronRight, CheckCircle, Truck, AlertCircle, Copy,
} from 'lucide-react';
import {
  formatCurrency, formatOrderDate, getOrderStatusConfig, getMarginStatusConfig, getDaysUntilMarginRelease,
  PartnerShopData, OrderData, PartnerProductData,
} from '../../utils/partnerStore';

interface PartnerDashboardProps {
  user: FirebaseUser;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [shop, setShop] = useState<PartnerShopData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [products, setProducts] = useState<PartnerProductData[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [pendingMargin, setPendingMargin] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load shop data
  useEffect(() => {
    const unsubShop = onSnapshot(doc(db, 'partnerShops', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setShop({ id: docSnap.id, ...docSnap.data() } as PartnerShopData);
      } else {
        // User doesn't have a shop yet - redirect to setup
        toast.error('Shop not found. Please create one first.');
        navigate('/setup-shop');
      }
    });

    return unsubShop;
  }, [user.uid, navigate]);

  // Load orders and calculate stats
  useEffect(() => {
    if (!user.uid) return;

    const unsubOrders = onSnapshot(
      query(collection(db, 'partnerOrders'), where('partnerId', '==', user.uid), orderBy('createdAt', 'desc'), limit(20)),
      (snap) => {
        const orderList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderData));
        setOrders(orderList);

        // Calculate total sales
        const sales = orderList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        setTotalSales(sales);

        // Calculate pending margin (orders with marginStatus === 'holding')
        const pending = orderList
          .filter((o) => o.marginStatus === 'holding')
          .reduce((sum, o) => sum + (o.totalPartnerMargin || 0), 0);
        setPendingMargin(pending);
      }
    );

    // Load products count
    const unsubProducts = onSnapshot(
      query(collection(db, 'partnerProducts', user.uid, 'products'), where('isActive', '==', true)),
      (snap) => {
        const productList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PartnerProductData));
        setProducts(productList);
        setLoading(false);
      }
    );

    return () => { unsubOrders(); unsubProducts(); };
  }, [user.uid]);

  if (loading || !shop) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E8B84B]/30 border-t-[#E8B84B] rounded-full animate-spin" />
      </div>
    );
  }

  const shopUrl = `https://workplex.app/shop/${shop.shopSlug}`;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-[#2A2A2A] px-4 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl">{shop.shopName}</h1>
            <p className="text-gray-400 text-xs">{shop.categories.join(', ')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.open(shopUrl, '_blank')}
              className="p-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="View Shop"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={() => navigate('/edit-shop')}
              className="p-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Shop Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
        {/* Shop URL Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#111111] to-[#1A1A1A] rounded-2xl p-5 border border-[#E8B84B]/20"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Your Shop URL</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(shopUrl);
                toast.success('Shop link copied!');
              }}
              className="p-2 bg-[#E8B84B]/10 rounded-lg text-[#E8B84B] hover:bg-[#E8B84B]/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Copy shop link"
            >
              <Copy size={16} />
            </button>
          </div>
          <p className="text-white font-mono text-sm truncate">{shopUrl}</p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out ${shop.shopName}: ${shopUrl}`)}`, '_blank')}
              className="flex-1 py-2.5 bg-green-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm min-h-[44px]"
            >
              <Share2 size={16} /> WhatsApp
            </button>
            <button
              onClick={() => navigate('/setup-shop')}
              className="flex-1 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm min-h-[44px]"
            >
              <Plus size={16} /> Add Products
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#111111] rounded-2xl p-5 border border-[#2A2A2A]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/10 rounded-xl">
                <DollarSign size={20} className="text-green-400" />
              </div>
            </div>
            <p className="text-gray-500 text-xs mb-1">Total Shop Sales</p>
            <p className="text-white font-black text-2xl">{formatCurrency(totalSales)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#111111] rounded-2xl p-5 border border-[#2A2A2A]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-500/10 rounded-xl">
                <Clock size={20} className="text-yellow-400" />
              </div>
            </div>
            <p className="text-gray-500 text-xs mb-1">Pending Margin</p>
            <p className="text-yellow-400 font-black text-2xl">{formatCurrency(pendingMargin)}</p>
            {pendingMargin > 0 && (
              <p className="text-gray-500 text-xs mt-1">7-day hold</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#111111] rounded-2xl p-5 border border-[#2A2A2A]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Package size={20} className="text-blue-400" />
              </div>
            </div>
            <p className="text-gray-500 text-xs mb-1">Active Products</p>
            <p className="text-white font-black text-2xl">{products.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#111111] rounded-2xl p-5 border border-[#2A2A2A]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/10 rounded-xl">
                <TrendingUp size={20} className="text-purple-400" />
              </div>
            </div>
            <p className="text-gray-500 text-xs mb-1">Total Orders</p>
            <p className="text-white font-black text-2xl">{orders.length}</p>
          </motion.div>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-xl">Recent Orders</h3>
            <button className="text-[#00C9A7] text-sm font-semibold flex items-center gap-1 min-h-[44px] px-3">
              View All <ChevronRight size={16} />
            </button>
          </div>

          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#111111] rounded-2xl p-12 border border-[#2A2A2A] text-center"
            >
              <Package size={48} className="text-gray-600 mx-auto mb-4" />
              <h4 className="text-white font-bold text-lg mb-2">No orders yet</h4>
              <p className="text-gray-500 text-sm">Share your shop link to get your first order!</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order, i) => {
                const statusConfig = getOrderStatusConfig(order.status);
                const marginConfig = getMarginStatusConfig(order.marginStatus);
                const daysUntilRelease = getDaysUntilMarginRelease(order.createdAt);

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#111111] rounded-xl p-4 border border-[#2A2A2A]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-mono text-sm">{order.orderId}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Customer</span>
                        <span className="text-white">{order.customerDetails?.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Amount</span>
                        <span className="text-white font-semibold">{formatCurrency(order.totalAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Your Margin</span>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-semibold">{formatCurrency(order.totalPartnerMargin)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${marginConfig.bg} ${marginConfig.color}`}>
                            {marginConfig.label}
                            {order.marginStatus === 'holding' && ` (${daysUntilRelease}d)`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Date</span>
                        <span className="text-gray-400">{formatOrderDate(order.createdAt)}</span>
                      </div>
                    </div>

                    {/* Items Preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
                        <p className="text-gray-500 text-xs mb-1">Items</p>
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-white">{item.productName} x{item.quantity}</span>
                            <span className="text-gray-400">{formatCurrency(item.sellingPrice * item.quantity)}</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-gray-500 text-xs mt-1">+{order.items.length - 2} more items</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
