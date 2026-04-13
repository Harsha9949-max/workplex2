/**
 * TransactionItem Component
 * Single transaction display
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatTimestamp, formatTime, getCategoryInfo, getWalletColor } from '../../utils/wallet';
import { TransactionData } from '../../hooks/useWallets';

interface TransactionItemProps {
  transaction: TransactionData;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const categoryInfo = getCategoryInfo(transaction.category);
  const walletColors = getWalletColor(transaction.wallet);
  const isCredit = transaction.type === 'credit';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 p-4 hover:bg-[#1A1A1A]/50 rounded-xl transition-colors"
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full ${walletColors.icon} flex items-center justify-center text-lg flex-shrink-0`}>
        {categoryInfo.icon}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{transaction.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-500 text-xs">{formatTimestamp(transaction.timestamp)}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${walletColors.bg} ${walletColors.text}`}>
            {transaction.wallet}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className={`font-bold text-sm ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
          {isCredit ? '+' : '-'}{transaction.amount.toLocaleString('en-IN')}
        </p>
      </div>
    </motion.div>
  );
};
