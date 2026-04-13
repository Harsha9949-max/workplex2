/**
 * Phase 11 Partner Store - Public Shop Page
 * Displays partner's shop at /shop/:slug for customers
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import {
  Share2, Copy, ShoppingBag, Star, Phone, MessageCircle, ChevronRight,
  Check, X, ArrowLeft, Package, Truck, Clock, CreditCard,
} from 'lucide-react';
import {
  formatCurrency, PartnerShopData, PartnerProductData, OrderData, OrderItemData,
} from '../../utils/partnerStore';
import { CheckoutModal } from './CheckoutModal';

export const PublicShopPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<PartnerShopData | null>(null);
  const [products, setProducts] = useState<PartnerProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<PartnerProductData | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Load shop data
  useEffect(() => {
    if (!slug) return;

    // Find shop by slug
    const fetchShop = async () => {
      try {
        const shopsSnap = await getDocs(query(collection(db, 'partnerShops'), where('shopSlug', '==', slug), where('isActive', '==', true)));
        if (shopsSnap.empty) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const shopDoc = shopsSnap.docs[0];
        const shopData = { id: shopDoc.id, ...shopDoc.data() } as PartnerShopData;
        setShop(shopData);

        // Load shop products
        const unsub = onSnapshot(
          query(collection(db, 'partnerProducts', shopDoc.id, 'products'), where('isActive', '==', true)),
          (snap) => {
            const prods = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PartnerProductData));
            setProducts(prods);
            setLoading(false);
          }
        );

        return unsub;
      } catch (err) {
        console.error('Failed to load shop:', err);
        setLoading(false);
      }
    };

    fetchShop();
  }, [slug]);

  const handleShareShop = () => {
    const url = window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out ${shop?.shopName} on WorkPlex! ${url}`)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  const handleBuyNow = (product: PartnerProductData) => {
    setSelectedProduct(product);
    setShowCheckout(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E8B84B]/30 border-t-[#E8B84B] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !shop) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-white mb-2">Shop Not Found</h2>
          <p className="text-gray-400 mb-6">This shop doesn't exist or has been deactivated.</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-[#E8B84B] text-black font-bold rounded-xl">Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      {/* Shop Header */}
      <div className="bg-gradient-to-br from-[#111111] to-[#1A1A1A] border-b border-[#2A2A2A]">
        <div className="max-w-screen-lg mx-auto px-4 py-8">
          {/* Back Button (if embedded) */}
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 min-h-[44px]">
            <ArrowLeft size={18} /> Back
          </button>

          <div className="flex items-center gap-4 mb-6">
            {shop.logo ? (
              <img src={shop.logo} alt={shop.shopName} className="w-20 h-20 rounded-2xl object-cover border-2 border-[#E8B84B]/30" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E8B84B] to-[#F5C95C] flex items-center justify-center text-3xl font-black text-black">
                {shop.shopName.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-white font-bold text-2xl">{shop.shopName}</h1>
              <p className="text-gray-400 text-sm">Official {shop.categories.join(', ')} Store</p>
              <div className="flex items-center gap-1 mt-1">
                <Star size={14} className="text-[#E8B84B]" fill="#E8B84B" />
                <Star size={14} className="text-[#E8B84B]" fill="#E8B84B" />
                <Star size={14} className="text-[#E8B84B]" fill="#E8B84B" />
                <Star size={14} className="text-[#E8B84B]" fill="#E8B84B" />
                <Star size={14} className="text-[#E8B84B]" fill="#E8B84B" />
                <span className="text-gray-500 text-xs ml-1">Trusted Seller</span>
              </div>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-3">
            <button onClick={handleShareShop} className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 min-h-[44px]">
              <Share2 size={16} /> Share Shop
            </button>
            <button onClick={handleCopyLink} className="flex-1 py-3 bg-[#1A1A1A] border border-[#2A2A2A] text-white font-semibold rounded-xl flex items-center justify-center gap-2 min-h-[44px]">
              <Copy size={16} /> Copy Link
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-xl">Products ({products.length})</h2>
          <span className="text-gray-500 text-sm">Powered by WorkPlex</span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">No products available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#111111] rounded-2xl border border-[#2A2A2A] overflow-hidden"
              >
                {/* Product Image */}
                <div className="h-40 bg-[#1A1A1A] flex items-center justify-center text-5xl">
                  {product.productData?.images?.[0] ? (
                    <img src={product.productData.images[0]} alt={product.productData?.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={48} className="text-gray-600" />
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <p className="text-gray-500 text-xs mb-1">{product.productData?.category}</p>
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">{product.productData?.name}</h3>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[#E8B84B] font-bold text-lg">{formatCurrency(product.partnerSellingPrice)}</span>
                    <span className="text-green-400 text-xs">Save {formatCurrency(product.partnerMargin)}</span>
                  </div>

                  {/* Buy Now Button */}
                  <button
                    onClick={() => handleBuyNow(product)}
                    className="w-full py-2.5 bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    Buy Now <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#2A2A2A] py-6 text-center">
        <p className="text-gray-500 text-xs">Powered by WorkPlex • Secure Payments by Razorpay</p>
      </div>

      {/* Checkout Modal */}
      {showCheckout && selectedProduct && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => { setShowCheckout(false); setSelectedProduct(null); }}
          product={selectedProduct}
          shopSlug={slug || ''}
          partnerId={shop.id}
        />
      )}
    </div>
  );
};
