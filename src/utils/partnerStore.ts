/**
 * Phase 11 Utility Functions
 * Partner store logic, pricing calculations, order management
 */

/**
 * Format currency to Indian Rupee format
 */
export const formatCurrency = (amount: number): string => {
  return `Rs.${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Calculate partner margin from selling price and base price
 */
export const calculatePartnerMargin = (sellingPrice: number, basePrice: number): number => {
  return Math.max(0, sellingPrice - basePrice);
};

/**
 * Calculate partner margin percentage
 */
export const calculateMarginPercentage = (margin: number, sellingPrice: number): number => {
  if (sellingPrice === 0) return 0;
  return Math.round((margin / sellingPrice) * 100);
};

/**
 * Validate selling price (must be higher than base price)
 */
export const validateSellingPrice = (sellingPrice: number, basePrice: number): { valid: boolean; error?: string } => {
  if (sellingPrice <= basePrice) {
    return { valid: false, error: 'Selling price must be higher than base price' };
  }
  if (sellingPrice > basePrice * 3) {
    return { valid: false, error: 'Selling price cannot exceed 3x base price' };
  }
  return { valid: true };
};

/**
 * Generate unique shop slug from shop name
 */
export const generateShopSlug = (shopName: string): string => {
  return shopName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

/**
 * Format timestamp for order display
 */
export const formatOrderDate = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get days until margin release (7-day hold)
 */
export const getDaysUntilMarginRelease = (createdAt: any): number => {
  if (!createdAt) return 7;
  const created = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const releaseDate = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = Math.ceil((releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

/**
 * Get order status badge configuration
 */
export const getOrderStatusConfig = (status: string): { color: string; bg: string; label: string } => {
  const configs: Record<string, { color: string; bg: string; label: string }> = {
    pending: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Pending' },
    processing: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Processing' },
    shipped: { color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Shipped' },
    delivered: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Delivered' },
    cancelled: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Cancelled' },
  };
  return configs[status] || configs.pending;
};

/**
 * Get margin status badge configuration
 */
export const getMarginStatusConfig = (status: string): { color: string; bg: string; label: string } => {
  const configs: Record<string, { color: string; bg: string; label: string }> = {
    holding: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Holding (7 days)' },
    released: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Released' },
  };
  return configs[status] || configs.holding;
};

/**
 * Available shop categories
 */
export const SHOP_CATEGORIES = [
  'Fashion',
  'Electronics',
  'Home & Kitchen',
  'Beauty & Personal Care',
  'Sports & Fitness',
  'Books & Stationery',
  'Toys & Games',
  'Food & Beverages',
];

/**
 * Default product data structure
 */
export interface ProductData {
  id: string;
  name: string;
  description: string;
  category: string;
  hvrsBasePrice: number;
  suggestedRetailPrice: number;
  images: string[];
  isActive: boolean;
  sku: string;
}

/**
 * Partner shop data structure
 */
export interface PartnerShopData {
  id: string;
  shopName: string;
  shopSlug: string;
  logo: string;
  ownerUID: string;
  ownerName: string;
  isActive: boolean;
  totalSales: number;
  categories: string[];
  createdAt: any;
}

/**
 * Partner product data structure
 */
export interface PartnerProductData {
  id: string;
  productId: string;
  hvrsBasePrice: number;
  partnerSellingPrice: number;
  partnerMargin: number;
  marginPercentage: number;
  productData: ProductData;
  isActive: boolean;
}

/**
 * Order item data structure
 */
export interface OrderItemData {
  productId: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  margin: number;
  image: string;
}

/**
 * Order data structure
 */
export interface OrderData {
  id: string;
  orderId: string;
  shopSlug: string;
  partnerId: string;
  customerId: string;
  customerDetails: {
    name: string;
    phone: string;
    address: string;
    upiId: string;
  };
  items: OrderItemData[];
  totalAmount: number;
  totalPartnerMargin: number;
  status: string;
  marginStatus: string;
  createdAt: any;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

/**
 * Catalog product data structure
 */
export interface CatalogProductData {
  id: string;
  sku: string;
  name: string;
  category: string;
  hvrsBasePrice: number;
  suggestedRetailPrice: number;
  images: string[];
  description: string;
  isActive: boolean;
}

/**
 * Validate UPI ID format
 */
export const validateUPI = (upiId: string): boolean => {
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId);
};

/**
 * Validate phone number (Indian format)
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Generate order ID
 */
export const generateOrderId = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ORD-${timestamp}${random}`;
};

/**
 * Calculate order totals
 */
export const calculateOrderTotals = (items: OrderItemData[]): { totalAmount: number; totalMargin: number } => {
  let totalAmount = 0;
  let totalMargin = 0;

  items.forEach((item) => {
    totalAmount += item.sellingPrice * item.quantity;
    totalMargin += item.margin * item.quantity;
  });

  return { totalAmount, totalMargin };
};

/**
 * Parse Excel data for catalog upload (simplified CSV/TSV parser)
 */
export const parseCatalogCSV = (csvText: string): CatalogProductData[] => {
  const lines = csvText.split('\n').filter((line) => line.trim());
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const products: CatalogProductData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    if (values.length < headers.length) continue;

    const product: any = {};
    headers.forEach((header, index) => {
      product[header] = values[index];
    });

    products.push({
      id: `prod_${Date.now()}_${i}`,
      sku: product.sku || `SKU-${Date.now()}-${i}`,
      name: product.name || 'Unnamed Product',
      category: product.category || 'General',
      hvrsBasePrice: parseFloat(product.baseprice || product['base price'] || '0'),
      suggestedRetailPrice: parseFloat(product.suggestedretailprice || product['suggested retail price'] || '0'),
      images: product.imageurl ? [product.imageurl] : [],
      description: product.description || '',
      isActive: true,
    });
  }

  return products;
};

/**
 * Check if user is a partner (has active shop)
 */
export const isPartner = (userMode: string): boolean => {
  return userMode === 'Partner';
};

/**
 * Check if user is a promoter (does tasks/coupons)
 */
export const isPromoter = (userMode: string): boolean => {
  return userMode === 'Promoter' || userMode === 'Marketer' || userMode === 'Reseller' || userMode === 'Content Creator';
};
