/**
 * Phase 4 Utility Functions
 * Wallet system utilities: formatting, validation, calculations
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
 * Format timestamp to human-readable format
 */
export const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/**
 * Format time for transaction items
 */
export const formatTime = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Validate UPI ID format
 */
export const validateUPI = (upiId: string): boolean => {
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId);
};

/**
 * Calculate percentage amount
 */
export const calculatePercentage = (amount: number, percent: number): number => {
  return Math.round(amount * (percent / 100) * 100) / 100;
};

/**
 * Get wallet color classes
 */
export const getWalletColor = (wallet: string): { bg: string; text: string; border: string; glow: string; icon: string } => {
  const colors: Record<string, { bg: string; text: string; border: string; glow: string; icon: string }> = {
    earned: {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      border: 'border-green-500/30',
      glow: 'shadow-green-500/20',
      icon: 'bg-green-500/20',
    },
    pending: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30',
      glow: 'shadow-yellow-500/20',
      icon: 'bg-yellow-500/20',
    },
    bonus: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      glow: 'shadow-purple-500/20',
      icon: 'bg-purple-500/20',
    },
    savings: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      glow: 'shadow-blue-500/20',
      icon: 'bg-blue-500/20',
    },
  };
  return colors[wallet] || colors.earned;
};

/**
 * Get transaction category icon and label
 */
export const getCategoryInfo = (category: string): { icon: string; label: string } => {
  const categories: Record<string, { icon: string; label: string }> = {
    task_approved: { icon: '📋', label: 'Task Approved' },
    coupon_commission: { icon: '🎫', label: 'Coupon Commission' },
    streak_bonus: { icon: '🔥', label: 'Streak Bonus' },
    withdrawal: { icon: '💸', label: 'Withdrawal' },
    savings_split: { icon: '🏦', label: 'Auto-Saved' },
    bonus_unlock: { icon: '🎁', label: 'Bonus Unlocked' },
    family_transfer: { icon: '👨‍👩‍👧', label: 'Family Transfer' },
    signup_bonus: { icon: '🎉', label: 'Signup Bonus' },
  };
  return categories[category] || { icon: '💰', label: 'Transaction' };
};

/**
 * Generate unique transaction ID
 */
export const generateTransactionId = (): string => {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate withdrawal ID
 */
export const generateWithdrawalId = (): string => {
  return `WD-${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
};

/**
 * Mask bank account number (show last 4 digits)
 */
export const maskBankAccount = (account: string): string => {
  if (!account || account.length < 4) return 'XXXX';
  return `XXXX XXXX ${account.slice(-4)}`;
};

/**
 * Check if withdrawal amount is valid
 */
export const isValidWithdrawalAmount = (amount: number, balance: number): { valid: boolean; error?: string } => {
  if (amount < 200) return { valid: false, error: 'Minimum withdrawal is Rs.200' };
  if (amount > balance) return { valid: false, error: `Insufficient balance. You have ${formatCurrency(balance)}` };
  if (amount > 50000) return { valid: false, error: 'Maximum withdrawal is Rs.50,000 per request' };
  return { valid: true };
};

/**
 * Calculate hours until pending funds release (24-48hr hold)
 */
export const getPendingReleaseHours = (submittedAt: any): number => {
  if (!submittedAt) return 48;
  const submitted = submittedAt.toDate ? submittedAt.toDate() : new Date(submittedAt);
  const now = new Date();
  const hoursSince = Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60));
  const remaining = Math.max(0, 48 - hoursSince);
  return remaining;
};

/**
 * Group transactions by date
 */
export const groupTransactionsByDate = (transactions: any[]): Record<string, any[]> => {
  const groups: Record<string, any[]> = {};
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toDateString();

  transactions.forEach((tx) => {
    const date = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date();
    const dateStr = date.toDateString();

    let groupKey: string;
    if (dateStr === today) groupKey = 'Today';
    else if (dateStr === yesterday) groupKey = 'Yesterday';
    else if (date > new Date(weekAgo)) groupKey = 'This Week';
    else groupKey = 'Older';

    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(tx);
  });

  return groups;
};
