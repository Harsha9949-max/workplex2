/**
 * TransactionHistory Component
 * Complete transaction list screen
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Filter, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { TransactionItem } from './TransactionItem';
import { SkeletonTransaction } from './SkeletonWallet';
import { groupTransactionsByDate, formatCurrency } from '../../utils/wallet';
import { TransactionData } from '../../hooks/useWallets';

interface TransactionHistoryProps {
  transactions: TransactionData[];
  loading: boolean;
  onBack: () => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  loading,
  onBack,
}) => {
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const grouped = useMemo(() => groupTransactionsByDate(filtered), [filtered]);

  const summary = useMemo(() => {
    const credits = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const debits = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
    const pending = transactions.filter((t) => t.type === 'pending').reduce((s, t) => s + t.amount, 0);
    return { credits, debits, pending };
  }, [transactions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <div className="p-4 border-b border-gray-800/50 flex items-center gap-3">
          <div className="h-10 w-10 bg-[#1A1A1A] rounded-xl" />
          <div className="h-6 w-40 bg-[#1A1A1A] rounded-lg" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonTransaction key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-gray-800/50 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Go back">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white">Transaction History</h1>
        </div>
      </div>

      <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
            <ArrowUpRight size={16} className="text-green-400 mx-auto mb-1" />
            <p className="text-green-400 font-bold text-sm">{formatCurrency(summary.credits)}</p>
            <p className="text-gray-500 text-xs">Credits</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
            <ArrowDownRight size={16} className="text-red-400 mx-auto mb-1" />
            <p className="text-red-400 font-bold text-sm">{formatCurrency(summary.debits)}</p>
            <p className="text-gray-500 text-xs">Debits</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center">
            <Clock size={16} className="text-yellow-400 mx-auto mb-1" />
            <p className="text-yellow-400 font-bold text-sm">{formatCurrency(summary.pending)}</p>
            <p className="text-gray-500 text-xs">Pending</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'credit', 'debit'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${filter === f ? 'bg-[#E8B84B]/20 text-[#E8B84B]' : 'bg-[#1A1A1A] text-gray-500'
                }`}
            >
              {f === 'all' ? 'All' : f === 'credit' ? 'Credits' : 'Debits'}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        {filtered.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(grouped as Record<string, TransactionData[]>).map(([group, txs]) => (
              <div key={group}>
                <h3 className="text-gray-500 text-sm font-semibold mb-2">{group}</h3>
                <div className="bg-[#111111] rounded-2xl border border-gray-800/50 divide-y divide-gray-800/50">
                  {txs.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#111111] rounded-2xl p-12 border border-gray-800/50 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-white font-bold text-lg mb-2">No transactions yet</h3>
            <p className="text-gray-500 text-sm">Your transaction history will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};
