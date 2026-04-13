/**
 * Phase 5 Utility Functions
 * Coupon system utilities: code generation, commission math, time formatting
 */

/**
 * Format currency to Indian Rupee format
 */
export const formatCurrency = (amount: number): string => {
  return `Rs.${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format time as HH:MM:SS
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Generate coupon code based on venture prefix
 * Format: PREFIX-6CHARS (e.g., BX-A7K2P9)
 */
export const generateCouponCode = (venture: string): string => {
  const prefixes: Record<string, string> = {
    BuyRix: 'BX',
    Vyuma: 'VY',
    TrendyVerse: 'TV',
    Growplex: 'GP',
  };
  const prefix = prefixes[venture] || 'WX';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${randomPart}`;
};

/**
 * Calculate HVRS margin (17.5% of product price)
 */
export const calculateMargin = (productPrice: number): number => {
  return Math.round(productPrice * 0.175 * 100) / 100;
};

/**
 * Calculate worker commission (10% of margin ONLY)
 * NEVER 10% of product price
 */
export const calculateCommission = (productPrice: number): number => {
  const margin = calculateMargin(productPrice);
  return Math.round(margin * 0.10 * 100) / 100;
};

/**
 * Calculate full commission breakdown
 */
export const getCommissionBreakdown = (productPrice: number) => {
  const margin = calculateMargin(productPrice);
  const commission = calculateCommission(productPrice);
  const hvrsProfit = margin - commission;
  return {
    productPrice,
    margin,
    commission,
    hvrsProfit,
  };
};

/**
 * Get time remaining until expiry in seconds
 */
export const getTimeRemaining = (expiresAt: any): number => {
  if (!expiresAt) return 0;
  const expires = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
  const now = new Date();
  const diff = Math.floor((expires.getTime() - now.getTime()) / 1000);
  return Math.max(0, diff);
};

/**
 * Get expiry progress (0-1) based on activatedAt and expiresAt
 */
export const getExpiryProgress = (activatedAt: any, expiresAt: any): number => {
  if (!activatedAt || !expiresAt) return 0;
  const activated = activatedAt.toDate ? activatedAt.toDate() : new Date(activatedAt);
  const expires = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
  const now = new Date();
  const total = expires.getTime() - activated.getTime();
  const elapsed = now.getTime() - activated.getTime();
  return Math.min(Math.max(elapsed / total, 0), 1);
};

/**
 * Get days remaining until commission release (7-day hold)
 */
export const getDaysUntilRelease = (usedAt: any): number => {
  if (!usedAt) return 7;
  const used = usedAt.toDate ? usedAt.toDate() : new Date(usedAt);
  const releaseDate = new Date(used.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = Math.ceil((releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

/**
 * Format timestamp to human-readable date
 */
export const formatDate = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * Format time for usage entries
 */
export const formatTimeOfDay = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Get venture display info
 */
export const getVentureInfo = (venture: string): { name: string; color: string; bgColor: string } => {
  const info: Record<string, { name: string; color: string; bgColor: string }> = {
    BuyRix: { name: 'BuyRix', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    Vyuma: { name: 'Vyuma', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    TrendyVerse: { name: 'TrendyVerse', color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
    Growplex: { name: 'Growplex', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  };
  return info[venture] || { name: venture, color: 'text-gray-400', bgColor: 'bg-gray-500/10' };
};

/**
 * Check if coupon is expired
 */
export const isCouponExpired = (expiresAt: any): boolean => {
  if (!expiresAt) return true;
  const expires = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
  return new Date() > expires;
};

/**
 * Check if coupon is active
 */
export const isCouponActive = (isActive: boolean, expiresAt: any): boolean => {
  return isActive && !isCouponExpired(expiresAt);
};

/**
 * Generate WhatsApp share message
 */
export const generateWhatsAppMessage = (venture: string, code: string, link: string = ''): string => {
  return `Shop on ${venture}! Use code ${code} for exclusive deals.${link ? ' ' + link : ''}`;
};
