/**
 * Phase 6 Utility Functions
 * Role progression, referral links, commission math, QR codes
 */

/**
 * Generate referral link
 */
export const generateReferralLink = (uid: string): string => {
  return `https://workplex.hvrs.in/join?ref=${uid}`;
};

/**
 * Calculate commission based on level
 * Level 1 (direct referrer): 5%
 * Level 2 (referrer's referrer): 3%
 */
export const calculateCommission = (earnAmount: number, level: 1 | 2): number => {
  const rate = level === 1 ? 0.05 : 0.03;
  return Math.round(earnAmount * rate * 100) / 100;
};

/**
 * Check if total commission is within 35% cap of HVRS margin
 */
export const checkCommissionCap = (
  direct: number,
  level1: number,
  level2: number,
  hvrsMargin: number
): boolean => {
  const total = direct + level1 + level2;
  const maxCap = hvrsMargin * 0.35;
  return total <= maxCap;
};

/**
 * Calculate adjusted commission within cap
 * Reduces level2 first, then level1 if needed
 */
export const adjustCommissionForCap = (
  direct: number,
  level1: number,
  level2: number,
  hvrsMargin: number
): { level1: number; level2: number; withinCap: boolean } => {
  const maxCap = hvrsMargin * 0.35;
  let currentTotal = direct + level1 + level2;

  if (currentTotal <= maxCap) {
    return { level1, level2, withinCap: true };
  }

  // Reduce level2 first
  let newLevel2 = level2;
  currentTotal = direct + level1 + newLevel2;
  if (currentTotal > maxCap) {
    const excess = currentTotal - maxCap;
    newLevel2 = Math.max(0, level2 - excess);
    currentTotal = direct + level1 + newLevel2;
  }

  // Then reduce level1 if still over
  let newLevel1 = level1;
  if (currentTotal > maxCap) {
    const excess = currentTotal - maxCap;
    newLevel1 = Math.max(0, level1 - excess);
  }

  return { level1: newLevel1, level2: newLevel2, withinCap: true };
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return `Rs.${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

/**
 * Get role icon emoji
 */
export const getRoleIcon = (role: string): string => {
  const icons: Record<string, string> = {
    Marketer: '📋',
    'Lead Marketer': '👑',
    Manager: '💼',
    'Sub-Admin': '🔐',
    Admin: '🛡️',
  };
  return icons[role] || '👤';
};

/**
 * Get role display color
 */
export const getRoleColor = (role: string): { text: string; bg: string; border: string } => {
  const colors: Record<string, { text: string; bg: string; border: string }> = {
    Marketer: { text: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
    'Lead Marketer': { text: 'text-[#E8B84B]', bg: 'bg-[#E8B84B]/10', border: 'border-[#E8B84B]/30' },
    Manager: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    'Sub-Admin': { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    Admin: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  };
  return colors[role] || colors.Marketer;
};

/**
 * Get level badge color
 */
export const getLevelColor = (level: string): { text: string; bg: string } => {
  const colors: Record<string, { text: string; bg: string }> = {
    Bronze: { text: 'text-orange-400', bg: 'bg-orange-500/10' },
    Silver: { text: 'text-gray-300', bg: 'bg-gray-400/10' },
    Gold: { text: 'text-[#E8B84B]', bg: 'bg-[#E8B84B]/10' },
    Platinum: { text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    Legend: { text: 'text-purple-400', bg: 'bg-purple-500/10' },
  };
  return colors[level] || colors.Bronze;
};

/**
 * Calculate progress percentage
 */
export const calculateProgress = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
};

/**
 * Get next role requirements
 */
export const getNextRoleInfo = (currentRole: string, monthlyEarned: number, activeMonths: number) => {
  if (currentRole === 'Marketer') {
    const earningsProgress = calculateProgress(monthlyEarned, 50000);
    const monthsMet = activeMonths >= 3;
    return {
      nextRole: 'Lead Marketer',
      earningsRequired: 50000,
      earningsProgress,
      monthsRequired: 3,
      monthsMet,
      canPromote: monthlyEarned >= 50000 && monthsMet,
    };
  }
  if (currentRole === 'Lead Marketer') {
    return { nextRole: 'Manager (Admin Only)', earningsProgress: 100, canPromote: false, adminOnly: true };
  }
  return { nextRole: null, earningsProgress: 100, canPromote: false, maxRole: true };
};

/**
 * Generate QR code data URL (simple implementation)
 * In production, use a proper QR code library
 */
export const generateQRCodeDataUrl = (link: string): string => {
  // This is a placeholder - in production use qrcode.react or similar
  return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect fill="#fff" width="300" height="300"/><text x="150" y="140" text-anchor="middle" font-family="Arial" font-size="14" fill="#333">QR Code</text><text x="150" y="170" text-anchor="middle" font-family="Arial" font-size="10" fill="#666">${link.slice(0, 30)}...</text></svg>`)}`;
};

/**
 * Format timestamp to relative time
 */
export const formatRelativeTime = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/**
 * Check if user can access team features
 */
export const canAccessTeam = (role: string): boolean => {
  return ['Lead Marketer', 'Manager', 'Sub-Admin', 'Admin'].includes(role);
};

/**
 * Get commission type label
 */
export const getCommissionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    direct_task: 'Direct Task',
    team_commission: 'Team Commission (5%)',
    manager_commission: 'Manager Commission (3%)',
  };
  return labels[type] || type;
};
