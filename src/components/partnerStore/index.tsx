/**
 * Phase 11 Partner Store Components
 * Shop Setup Wizard, Public Shop Page, Partner Dashboard, Checkout Modal, Admin Catalog Manager
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import {
  doc, onSnapshot, collection, query, where, orderBy, limit, getDoc, getDocs,
  addDoc, updateDoc, serverTimestamp, increment, deleteDoc, setDoc, writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import toast from 'react-hot-toast';
import {
  ShoppingBag, Upload, Plus, Minus, Check, X, ArrowRight, ArrowLeft,
  Store, Image as ImageIcon, DollarSign, TrendingUp, Package, Clock,
  Truck, CheckCircle, AlertCircle, Share2, Copy, Download, Filter,
  Search, Edit, Trash2, Eye, Zap, Sparkles, Crown,
} from 'lucide-react';
import {
  formatCurrency, calculatePartnerMargin, calculateMarginPercentage, validateSellingPrice,
  generateShopSlug, formatOrderDate, getDaysUntilMarginRelease, getOrderStatusConfig,
  getMarginStatusConfig, SHOP_CATEGORIES, validateUPI, validatePhone, generateOrderId,
  calculateOrderTotals, parseCatalogCSV, isPartner, isPromoter,
  PartnerShopData, PartnerProductData, ProductData, CatalogProductData, OrderData, OrderItemData,
} from '../../utils/partnerStore';

// ==================== SHOP SETUP WIZARD ====================
export const ShopSetupWizard: React.FC<{ user: FirebaseUser; onComplete: () => void }> = ({ user, onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [shopName, setShopName] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProductData[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map());
  const [isPublishing, setIsPublishing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load catalog products
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'catalogProducts'), where('isActive', '==', true), limit(50)));
        const products = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CatalogProductData));
        setCatalogProducts(products);
      } catch (err) {
        console.error('Failed to load catalog:', err);
      }
      setLoading(false);
    };
    fetchCatalog();
  }, []);

  // Auto-generate slug from shop name
  useEffect(() => {
    if (shopName) {
      setShopSlug(generateShopSlug(shopName));
    }
  }, [shopName]);

  // Handle logo upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  // Toggle product selection and set selling price
  const toggleProduct = (productId: string, basePrice: number) => {
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(productId)) {
        newMap.delete(productId);
      } else {
        // Set default selling price as base price + 20% margin
        newMap.set(productId, Math.round(basePrice * 1.2));
      }
      return newMap;
    });
  };

  // Update selling price for a product
  const updateSellingPrice = (productId: string, price: number) => {
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      newMap.set(productId, price);
      return newMap;
    });
  };

  // Publish shop
  const handlePublish = async () => {
    if (!shopName || !shopSlug || selectedCategories.length === 0 || selectedProducts.size === 0) {
      toast.error('Please complete all steps before publishing');
      return;
    }

    setIsPublishing(true);

    try {
      // Upload logo if provided
      let logoUrl = '';
      if (logoFile) {
        const logoRef = ref(storage, `shopLogos/${user.uid}/${Date.now()}_${logoFile.name}`);
        await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(logoRef);
      }

      // Create partner shop
      const shopData: Partial<PartnerShopData> = {
        shopName,
        shopSlug,
        logo: logoUrl,
        ownerUID: user.uid,
        ownerName: user.displayName || 'Partner',
        isActive: true,
        totalSales: 0,
        categories: selectedCategories,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'partnerShops', user.uid), shopData);

      // Add selected products to partner's shop
      const batch = writeBatch(db);
      selectedProducts.forEach((sellingPrice, productId) => {
        const catalogProduct = catalogProducts.find((p) => p.id === productId);
        if (!catalogProduct) return;

        const margin = calculatePartnerMargin(sellingPrice, catalogProduct.hvrsBasePrice);
        const marginPercentage = calculateMarginPercentage(margin, sellingPrice);

        const productRef = doc(db, 'partnerProducts', user.uid, 'products', productId);
        batch.set(productRef, {
          productId,
          hvrsBasePrice: catalogProduct.hvrsBasePrice,
          partnerSellingPrice: sellingPrice,
          partnerMargin: margin,
          marginPercentage,
          productData: {
            id: productId,
            name: catalogProduct.name,
            description: catalogProduct.description,
            category: catalogProduct.category,
            images: catalogProduct.images,
            sku: catalogProduct.sku,
          },
          isActive: true,
        });
      });
      await batch.commit();

      // Update user mode to Partner
      await updateDoc(doc(db, 'users', user.uid), {
        mode: 'Partner',
        shopSlug,
      });

      toast.success('Shop published successfully!');
      onComplete();
    } catch (err: any) {
      console.error('Failed to publish shop:', err);
      toast.error(err.message || 'Failed to publish shop');
    } finally {
      setIsPublishing(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return shopName.length >= 3;
      case 2: return true; // Logo is optional
      case 3: return selectedCategories.length > 0;
      case 4: return selectedProducts.size > 0;
      default: return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E8B84B]/30 border-t-[#E8B84B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      {/* Progress Bar */}
      <div className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-[#2A2A2A] z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Step {step} of 4</span>
            <span className="text-[#E8B84B] text-sm font-semibold">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#E8B84B] to-[#00C9A7]"
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 1: Shop Name */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center mb-8">
              <Store size={48} className="text-[#E8B84B] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Name Your Shop</h2>
              <p className="text-gray-400">Choose a unique name for your online store</p>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Shop Name</label>
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g., Rahul's Fashion Hub"
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors min-h-[44px]"
              />
            </div>

            {shopSlug && (
              <div className="bg-[#1A1A1A] rounded-xl p-4">
                <p className="text-gray-500 text-xs mb-1">Your shop URL</p>
                <p className="text-[#00C9A7] font-mono text-sm">workplex.app/shop/{shopSlug}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Upload Logo */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center mb-8">
              <ImageIcon size={48} className="text-[#E8B84B] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Upload Logo</h2>
              <p className="text-gray-400">Add a logo to make your shop stand out (optional)</p>
            </div>

            <div className="flex flex-col items-center">
              {logoPreview ? (
                <div className="relative">
                  <img src={logoPreview} alt="Shop logo preview" className="w-32 h-32 rounded-2xl object-cover border-2 border-[#E8B84B]/30" />
                  <button
                    onClick={() => { setLogoFile(null); setLogoPreview(''); }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              ) : (
                <label className="w-32 h-32 rounded-2xl border-2 border-dashed border-[#2A2A2A] flex flex-col items-center justify-center cursor-pointer hover:border-[#E8B84B]/50 transition-colors">
                  <Upload size={32} className="text-gray-500 mb-2" />
                  <span className="text-gray-500 text-xs">Upload Logo</span>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 3: Select Categories */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center mb-8">
              <Filter size={48} className="text-[#E8B84B] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Select Categories</h2>
              <p className="text-gray-400">Choose the product categories you want to sell</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {SHOP_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`p-4 rounded-xl border text-left transition-all min-h-[44px] ${selectedCategories.includes(category)
                    ? 'bg-[#E8B84B]/10 border-[#E8B84B]/30 text-[#E8B84B]'
                    : 'bg-[#1A1A1A] border-[#2A2A2A] text-gray-400 hover:border-[#E8B84B]/20'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{category}</span>
                    {selectedCategories.includes(category) && <Check size={16} />}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 4: Browse Catalog & Set Prices */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center mb-8">
              <Package size={48} className="text-[#E8B84B] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Select Products</h2>
              <p className="text-gray-400">Choose products from the catalog and set your selling prices</p>
            </div>

            <div className="space-y-4">
              {catalogProducts.map((product) => {
                const isSelected = selectedProducts.has(product.id);
                const sellingPrice = selectedProducts.get(product.id) || 0;
                const margin = isSelected ? calculatePartnerMargin(sellingPrice, product.hvrsBasePrice) : 0;

                return (
                  <div key={product.id} className={`bg-[#111111] rounded-xl border overflow-hidden transition-all ${isSelected ? 'border-[#E8B84B]/30' : 'border-[#2A2A2A]'}`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{product.name}</h4>
                          <p className="text-gray-500 text-xs">{product.category} • SKU: {product.sku}</p>
                        </div>
                        <button
                          onClick={() => toggleProduct(product.id, product.hvrsBasePrice)}
                          className={`p-2 rounded-lg transition-all ${isSelected ? 'bg-[#E8B84B] text-black' : 'bg-[#1A1A1A] text-gray-400'}`}
                        >
                          {isSelected ? <Check size={16} /> : <Plus size={16} />}
                        </button>
                      </div>

                      {isSelected && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-3 border-t border-[#2A2A2A]">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">HVRS Base Price</span>
                            <span className="text-gray-400">{formatCurrency(product.hvrsBasePrice)}</span>
                          </div>

                          <div>
                            <label className="text-gray-400 text-xs mb-1 block">Your Selling Price</label>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Rs.</span>
                              <input
                                type="number"
                                value={sellingPrice || ''}
                                onChange={(e) => updateSellingPrice(product.id, parseFloat(e.target.value) || 0)}
                                placeholder="Enter price"
                                className="flex-1 px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors min-h-[44px]"
                              />
                            </div>
                          </div>

                          {sellingPrice > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-green-400 font-semibold">Your Profit</span>
                              <span className="text-green-400 font-bold">{formatCurrency(margin)} ({calculateMarginPercentage(margin, sellingPrice)}%)</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 bg-[#1A1A1A] border border-[#2A2A2A] text-white font-semibold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
            >
              <ArrowLeft size={18} /> Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 py-3 bg-[#E8B84B] disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
            >
              Continue <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={!canProceed() || isPublishing}
              className="flex-1 py-3 bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
            >
              {isPublishing ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Publish Shop
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Export all components
export { PublicShopPage } from './PublicShopPage';
export { PartnerDashboard } from './PartnerDashboard';
export { CheckoutModal } from './CheckoutModal';
export { AdminCatalogManager } from './AdminCatalogManager';
