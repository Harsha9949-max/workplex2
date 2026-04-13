/**
 * Utility functions for WorkPlex Home Dashboard
 * Handles formatting, calculations, and common operations
 */

/**
 * Format currency to Indian Rupee format
 * @param amount - Number to format
 * @returns Formatted string with Rs. prefix
 */
export const formatCurrency = (amount: number): string => {
  return `Rs.${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format time remaining in HH:MM:SS format
 * @param seconds - Total seconds remaining
 * @returns Formatted time string
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format countdown to human-readable format
 * @param milliseconds - Time in milliseconds
 * @returns Human-readable time string
 */
export const formatCountdown = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Calculate progress percentage
 * @param current - Current value
 * @param target - Target value
 * @returns Percentage (0-100)
 */
export const calculateProgress = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
};

/**
 * Get days active in current month
 * @param joinedAt - Join timestamp
 * @returns Number of days active
 */
export const getDaysActiveThisMonth = (joinedAt: any): number => {
  if (!joinedAt) return 0;
  
  const joinDate = joinedAt.toDate ? joinedAt.toDate() : new Date(joinedAt);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const joinMonth = joinDate.getMonth();
  const joinYear = joinDate.getFullYear();
  
  // If joined before current month, count all days of current month
  if (joinYear < currentYear || (joinYear === currentYear && joinMonth < currentMonth)) {
    return now.getDate();
  }
  
  // If joined in current month, count from join date
  if (joinYear === currentYear && joinMonth === currentMonth) {
    return now.getDate() - joinDate.getDate() + 1;
  }
  
  return 0;
};

/**
 * Calculate monthly earnings from tasks
 * @param tasks - Array of completed tasks
 * @returns Total earnings this month
 */
export const calculateMonthlyEarnings = (tasks: any[]): number => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return tasks.reduce((total, task) => {
    if (!task.completedAt) return total;
    
    const completedDate = task.completedAt.toDate ? task.completedAt.toDate() : new Date(task.completedAt);
    if (completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear) {
      return total + (task.earning || 0);
    }
    return total;
  }, 0);
};

/**
 * Get time remaining until deadline
 * @param deadline - Firestore timestamp
 * @returns Seconds remaining (0 if past)
 */
export const getTimeRemaining = (deadline: any): number => {
  if (!deadline) return 0;
  
  const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline);
  const now = new Date();
  const diff = Math.floor((deadlineDate.getTime() - now.getTime()) / 1000);
  
  return Math.max(0, diff);
};

/**
 * Get coupon expiry progress (0-1)
 * @param activatedAt - Activation timestamp
 * @param expiresAt - Expiry timestamp
 * @returns Progress value (0-1)
 */
export const getCouponExpiryProgress = (activatedAt: any, expiresAt: any): number => {
  if (!activatedAt || !expiresAt) return 0;
  
  const activated = activatedAt.toDate ? activatedAt.toDate() : new Date(activatedAt);
  const expires = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
  const now = new Date();
  
  const total = expires.getTime() - activated.getTime();
  const elapsed = now.getTime() - activated.getTime();
  
  return Math.min(Math.max(elapsed / total, 0), 1);
};

/**
 * Get hours remaining until coupon expires
 * @param expiresAt - Expiry timestamp
 * @returns Hours remaining
 */
export const getHoursUntilExpiry = (expiresAt: any): number => {
  if (!expiresAt) return 0;
  
  const expires = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
  const now = new Date();
  const diff = expires.getTime() - now.getTime();
  
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param timestamp - Firestore timestamp
 * @returns Human-readable relative time
 */
export const formatRelativeTime = (timestamp: any): string => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
};

/**
 * Generate WhatsApp share link
 * @param venture - Venture name
 * @param code - Coupon code
 * @param link - Share link
 * @returns WhatsApp URL
 */
export const generateWhatsAppLink = (venture: string, code: string, link: string): string => {
  const message = `Shop on ${venture}! Use code ${code} for exclusive deals: ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Get role display name with venture
 * @param venture - Venture name
 * @param role - User role
 * @returns Formatted role string
 */
export const getRoleDisplayName = (venture: string, role: string): string => {
  const roleMap: Record<string, string> = {
    'Marketer': `${venture} Marketer`,
    'Content Creator': `${venture} Creator`,
    'Reseller': `${venture} Reseller`,
    'Lead Marketer': `${venture} Lead`,
    'Manager': `${venture} Manager`,
  };
  
  return roleMap[role] || role;
};

/**
 * Get venture color class
 * @param venture - Venture name
 * @returns Tailwind color class
 */
export const getVentureColor = (venture: string): string => {
  const colorMap: Record<string, string> = {
    'BuyRix': 'text-blue-400',
    'Vyuma': 'text-purple-400',
    'TrendyVerse': 'text-pink-400',
    'Growplex': 'text-green-400',
  };
  
  return colorMap[venture] || 'text-white';
};

/**
 * Check if user should see coupon card
 * @param role - User role
 * @returns Boolean
 */
export const shouldShowCouponCard = (role: string): boolean => {
  return role === 'Marketer' || role === 'Content Creator';
};

/**
 * Check if user is a reseller
 * @param role - User role
 * @returns Boolean
 */
export const isReseller = (role: string): boolean => {
  return role === 'Reseller';
};
