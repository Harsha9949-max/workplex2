/**
 * Phase 11 Partner Store - Admin Catalog Manager
 * Excel upload, product list, edit/delete capability
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Plus, Edit, Trash2, Search, Filter, X, Check,
  Package, DollarSign, Image as ImageIcon, Save, AlertCircle,
} from 'lucide-react';
import { formatCurrency, CatalogProductData, parseCatalogCSV } from '../../utils/partnerStore';

export const AdminCatalogManager: React.FC = () => {
  const [products, setProducts] = useState<CatalogProductData[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProductData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formRetailPrice, setFormRetailPrice] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Load catalog products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'catalogProducts'), orderBy('createdAt', 'desc'), limit(100)));
        const productList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CatalogProductData));
        setProducts(productList);
      } catch (err) {
        console.error('Failed to load catalog:', err);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(products.map((p) => p.category))];

  // Handle Excel/CSV upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const text = await file.text();
      const parsedProducts = parseCatalogCSV(text);

      if (parsedProducts.length === 0) {
        toast.error('No valid products found in file');
        setIsUploading(false);
        return;
      }

      // Batch upload
      const batch = writeBatch(db);
      parsedProducts.forEach((product) => {
        const ref = doc(collection(db, 'catalogProducts'));
        batch.set(ref, {
          ...product,
          createdAt: serverTimestamp(),
          isActive: true,
        });
      });

      await batch.commit();
      toast.success(`${parsedProducts.length} products uploaded successfully!`);

      // Refresh list
      const snap = await getDocs(query(collection(db, 'catalogProducts'), orderBy('createdAt', 'desc'), limit(100)));
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CatalogProductData)));
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload products');
    } finally {
      setIsUploading(false);
    }
  };

  // Save product (create or update)
  const handleSaveProduct = async () => {
    if (!formSku || !formName || !formCategory || !formBasePrice) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const productData = {
        sku: formSku,
        name: formName,
        category: formCategory,
        hvrsBasePrice: parseFloat(formBasePrice),
        suggestedRetailPrice: parseFloat(formRetailPrice) || parseFloat(formBasePrice) * 1.5,
        images: formImageUrl ? [formImageUrl] : [],
        description: formDescription,
        isActive: true,
        createdAt: serverTimestamp(),
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'catalogProducts', editingProduct.id), productData);
        toast.success('Product updated!');
      } else {
        await addDoc(collection(db, 'catalogProducts'), productData);
        toast.success('Product created!');
      }

      // Refresh list
      const snap = await getDocs(query(collection(db, 'catalogProducts'), orderBy('createdAt', 'desc'), limit(100)));
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CatalogProductData)));
      resetForm();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save product');
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteDoc(doc(db, 'catalogProducts', productId));
      setProducts(products.filter((p) => p.id !== productId));
      toast.success('Product deleted!');
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete product');
    }
  };

  // Edit product
  const handleEditProduct = (product: CatalogProductData) => {
    setEditingProduct(product);
    setFormSku(product.sku);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormBasePrice(product.hvrsBasePrice.toString());
    setFormRetailPrice(product.suggestedRetailPrice.toString());
    setFormImageUrl(product.images[0] || '');
    setFormDescription(product.description || '');
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setEditingProduct(null);
    setFormSku('');
    setFormName('');
    setFormCategory('');
    setFormBasePrice('');
    setFormRetailPrice('');
    setFormImageUrl('');
    setFormDescription('');
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E8B84B]/30 border-t-[#E8B84B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-500 focus:border-[#E8B84B] transition-colors min-h-[44px]"
            />
          </div>
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white min-h-[44px]"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
          ))}
        </select>
        <label className="px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer hover:bg-[#2A2A2A] transition-colors min-h-[44px]">
          <Upload size={16} />
          Upload CSV
          <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
          {isUploading && <span className="animate-spin">⏳</span>}
        </label>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2.5 bg-[#E8B84B] text-black font-bold rounded-xl flex items-center gap-2 min-h-[44px]"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={resetForm}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-[#111111] rounded-2xl p-6 max-w-lg w-full border border-[#2A2A2A] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-xl">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={resetForm} className="p-2 text-gray-400 hover:text-white" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">SKU *</label>
                  <input
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="SKU-001"
                    className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white focus:border-[#E8B84B] transition-colors min-h-[44px]"
                  >
                    <option value="">Select...</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Home & Kitchen">Home & Kitchen</option>
                    <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                    <option value="Sports & Fitness">Sports & Fitness</option>
                    <option value="Books & Stationery">Books & Stationery</option>
                    <option value="Toys & Games">Toys & Games</option>
                    <option value="Food & Beverages">Food & Beverages</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Product Name *</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter product name"
                  className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">HVRS Base Price (Rs.) *</label>
                  <input
                    type="number"
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(e.target.value)}
                    placeholder="500"
                    className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Suggested Retail Price (Rs.)</label>
                  <input
                    type="number"
                    value={formRetailPrice}
                    onChange={(e) => setFormRetailPrice(e.target.value)}
                    placeholder="750"
                    className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Image URL</label>
                <input
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Product description..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={resetForm} className="flex-1 py-3 bg-[#1A1A1A] text-gray-400 font-semibold rounded-xl min-h-[44px]">
                Cancel
              </button>
              <button onClick={handleSaveProduct} className="flex-1 py-3 bg-[#E8B84B] text-black font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]">
                <Save size={16} /> {editingProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Products Table */}
      <div className="bg-[#111111] rounded-2xl border border-[#2A2A2A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
              <tr>
                {['Image', 'SKU', 'Name', 'Category', 'Base Price', 'Retail Price', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-[#2A2A2A] hover:bg-[#1A1A1A]/50 transition-colors">
                  <td className="px-4 py-3">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                        <Package size={16} className="text-gray-600" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-sm">{product.sku}</td>
                  <td className="px-4 py-3 text-white font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{product.category}</td>
                  <td className="px-4 py-3 text-white font-semibold">{formatCurrency(product.hvrsBasePrice)}</td>
                  <td className="px-4 py-3 text-gray-400">{formatCurrency(product.suggestedRetailPrice)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditProduct(product)} className="p-1.5 text-gray-400 hover:text-[#E8B84B] transition-colors" aria-label="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors" aria-label="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p>No products found</p>
          </div>
        )}
      </div>
    </div>
  );
};
