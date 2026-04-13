/**
 * WalletScreen Component (Phase 4)
 * Main wallet container with 4 wallet cards, transactions, and withdrawal
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as FirebaseUser } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowRight, Settings, History, Users, FileDown, Shield, Clock, Info } from 'lucide-react';

// Hooks
import { useWallets, useTransactions, useRequestWithdrawal, useUpdateSavings, useFamilyTransfer } from '../../hooks/useWallets';

// Components
import { WalletCard } from './WalletCard';
import { WithdrawalModal } from './WithdrawalModal';
import { TransactionHistory } from './TransactionHistory';
import { TransactionItem } from './TransactionItem';
import { AutoSaveSettings } from './AutoSaveSettings';
import { FamilyTransferModal } from './FamilyTransferModal';
import { BonusUnlockCelebration } from './BonusUnlockCelebration';
import { KYCGateModal } from './KYCGateModal';
import { WithdrawalStatusBadge } from './WithdrawalStatusBadge';
import { SkeletonWallet, SkeletonTransaction } from './SkeletonWallet';
import { BottomNav } from '../dashboard/BottomNav';
import { formatCurrency, getPendingReleaseHours } from '../../utils/wallet';

interface WalletScreenProps {
  user: FirebaseUser;
}

const WalletScreen: React.FC<WalletScreenProps> = ({ user }) => {
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showAutoSave, setShowAutoSave] = useState(false);
  const [showFamilyTransfer, setShowFamilyTransfer] = useState(false);
  const [showKYC, setShowKYC] = useState(false);
  const [showBonusCelebration, setShowBonusCelebration] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(0);

  const { wallets, userData, loading: walletLoading } = useWallets(user.uid);
  const { transactions, loading: txLoading } = useTransactions(user.uid, 5);
  const { request: requestWithdrawal, requesting } = useRequestWithdrawal(user.uid);
  const { update: updateSavings } = useUpdateSavings(user.uid);
  const { send: sendFamilyTransfer } = useFamilyTransfer(user.uid);

  const totalBalance = wallets.earned + wallets.pending + wallets.bonus + wallets.savings;
  const kycDone = userData.kycDone || false;
  const upiId = userData.upiId || '';
  const bankAccount = userData.bankAccount || '';
  const savingsPercent = userData.savingsPercent || 0;
  const totalEarned = userData.totalEarned || 0;

  // Check for bonus unlock (earned >= 200)
  useEffect(() => {
    if (wallets.earned >= 200 && wallets.bonus > 0 && totalEarned >= 200) {
      setBonusAmount(wallets.bonus);
      setShowBonusCelebration(true);
    }
  }, [wallets.earned, wallets.bonus, totalEarned]);

  // Handlers
  const handleWithdrawal = async (amount: number, targetUpi: string) => {
    const result = await requestWithdrawal(amount, targetUpi, userData.name || 'User', userData.phone || '');
    if (result.success) {
      setShowWithdrawal(false);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const handleFamilyTransfer = async (targetUpi: string, amount: number) => {
    const result = await sendFamilyTransfer(targetUpi, amount, userData.name || 'User');
    if (result.success) {
      setShowFamilyTransfer(false);
      toast.success('Transfer successful!', { style: { background: '#111', color: '#fff' } });
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const handleSaveSettings = async (percent: number) => {
    return updateSavings(percent);
  };

  // Transaction History View
  if (showTransactionHistory) {
    return (
      <>
        <TransactionHistory
          transactions={transactions}
          loading={txLoading}
          onBack={() => setShowTransactionHistory(false)}
        />
      </>
    );
  }

  // Loading State
  if (walletLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-24">
        <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
          <div className="space-y-2"><div className="h-8 w-32 bg-[#1A1A1A] rounded-lg" /><div className="h-4 w-48 bg-[#1A1A1A] rounded-lg" /></div>
          <div className="bg-[#111111] rounded-2xl p-6 border border-gray-800/50"><div className="h-6 w-40 bg-[#1A1A1A] rounded-lg mb-2" /><div className="h-10 w-56 bg-[#1A1A1A] rounded-lg" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <SkeletonWallet key={i} />)}
          </div>
        </div>
        <BottomNav activeTab="wallet" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <Toaster position="top-center" />

      <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">My Wallet</h1>
          <p className="text-gray-400 text-sm">Track your earnings & withdraw anytime</p>
        </div>

        {/* Total Balance Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-[#111111] to-[#1A1A1A] rounded-2xl p-6 border border-gray-800/50">
          <p className="text-gray-400 text-sm mb-1">Total Balance</p>
          <p className="text-[#E8B84B] font-black text-4xl">{formatCurrency(totalBalance)}</p>
          <p className="text-gray-500 text-xs mt-1">Last updated: Just now</p>
        </motion.div>

        {/* 4 Wallet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Earned Wallet */}
          <WalletCard
            title="Earned Wallet"
            balance={wallets.earned}
            subtitle="Available for withdrawal"
            wallet="earned"
            statusBadge={{ label: 'Withdrawable', unlocked: true }}
            actionButton={{ label: 'Withdraw', onClick: () => setShowWithdrawal(true) }}
          />

          {/* Pending Wallet */}
          <WalletCard
            title="Pending Wallet"
            balance={wallets.pending}
            subtitle="Awaiting 24-48hr confirmation"
            wallet="pending"
            statusBadge={{ label: 'On Hold' }}
            extraInfo={
              <div className="flex items-center gap-2 text-yellow-500 text-xs">
                <Info size={12} />
                <span>Funds held for security verification</span>
              </div>
            }
          />

          {/* Bonus Wallet */}
          <WalletCard
            title="Bonus Wallet"
            balance={wallets.bonus}
            subtitle="Signup bonus + streak rewards"
            wallet="bonus"
            statusBadge={{ label: totalEarned >= 200 ? 'Unlocked' : 'Locked', unlocked: totalEarned >= 200 }}
            progress={{
              current: Math.min(totalEarned, 200),
              target: 200,
              label: `${formatCurrency(Math.min(totalEarned, 200))} of ${formatCurrency(200)} to unlock`,
            }}
          />

          {/* Savings Wallet */}
          <WalletCard
            title="Savings Wallet"
            balance={wallets.savings}
            subtitle="Auto-saved from earnings"
            wallet="savings"
            statusBadge={{ label: savingsPercent > 0 ? `${savingsPercent}% Active` : 'Inactive', unlocked: savingsPercent > 0 }}
            actionButton={{ label: 'Configure', onClick: () => setShowAutoSave(true) }}
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => setShowWithdrawal(true)} className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] text-black font-bold rounded-xl flex items-center gap-2 transition-all min-h-[44px]">
            Withdraw <ArrowRight size={16} />
          </button>
          <button onClick={() => setShowTransactionHistory(true)} className="flex-shrink-0 px-6 py-3 bg-[#1A1A1A] border border-[#00C9A7]/30 text-[#00C9A7] font-semibold rounded-xl flex items-center gap-2 transition-all min-h-[44px]">
            <History size={16} /> History
          </button>
          <button onClick={() => setShowFamilyTransfer(true)} className="flex-shrink-0 px-6 py-3 bg-[#1A1A1A] border border-purple-500/30 text-purple-400 font-semibold rounded-xl flex items-center gap-2 transition-all min-h-[44px]">
            <Users size={16} /> Family
          </button>
          <button className="flex-shrink-0 px-6 py-3 bg-[#1A1A1A] border border-gray-700/50 text-gray-400 font-semibold rounded-xl flex items-center gap-2 transition-all min-h-[44px]">
            <FileDown size={16} /> Statement
          </button>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-xl">Recent Activity</h3>
            <button onClick={() => setShowTransactionHistory(true)} className="text-[#00C9A7] text-sm font-semibold flex items-center gap-1 min-h-[44px] px-3">
              View All <ArrowRight size={14} />
            </button>
          </div>

          {transactions.length > 0 ? (
            <div className="bg-[#111111] rounded-2xl border border-gray-800/50 divide-y divide-gray-800/50">
              {transactions.slice(0, 5).map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} />
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

        {/* Withdrawal Stats */}
        <div className="bg-[#111111] rounded-2xl p-6 border border-gray-800/50">
          <h3 className="text-white font-bold text-lg mb-4">Withdrawal Information</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><p className="text-gray-500 text-xs">Minimum Withdrawal</p><p className="text-white font-semibold">Rs.200</p></div>
            <div><p className="text-gray-500 text-xs">Processing Time</p><p className="text-white font-semibold">24-48 hours</p></div>
            <div><p className="text-gray-500 text-xs">Daily Limit</p><p className="text-white font-semibold">Rs.50,000</p></div>
            <div><p className="text-gray-500 text-xs">Processing Fee</p><p className="text-green-400 font-semibold">FREE</p></div>
          </div>

          <div className="flex items-center justify-between bg-[#1A1A1A] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Shield size={20} className={kycDone ? 'text-green-400' : 'text-red-400'} />
              <div>
                <p className="text-white font-semibold text-sm">{kycDone ? 'KYC Verified' : 'KYC Pending'}</p>
                <p className="text-gray-500 text-xs">{kycDone ? 'You can withdraw anytime' : 'Complete KYC to withdraw'}</p>
              </div>
            </div>
            {!kycDone && (
              <button onClick={() => setShowKYC(true)} className="text-[#E8B84B] text-sm font-semibold min-h-[44px] px-3">
                Complete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab="wallet" />

      {/* Modals */}
      <WithdrawalModal
        isOpen={showWithdrawal}
        onClose={() => setShowWithdrawal(false)}
        earnedBalance={wallets.earned}
        upiId={upiId}
        bankAccount={bankAccount}
        kycDone={kycDone}
        onSubmit={handleWithdrawal}
        onShowKYC={() => setShowKYC(true)}
      />

      <AutoSaveSettings
        isOpen={showAutoSave}
        onClose={() => setShowAutoSave(false)}
        currentPercent={savingsPercent}
        totalEarned={totalEarned}
        onSave={handleSaveSettings}
      />

      <FamilyTransferModal
        isOpen={showFamilyTransfer}
        onClose={() => setShowFamilyTransfer(false)}
        earnedBalance={wallets.earned}
        onSubmit={handleFamilyTransfer}
      />

      <KYCGateModal
        isOpen={showKYC}
        onClose={() => setShowKYC(false)}
        onCompleteKYC={() => { setShowKYC(false); toast('Navigate to KYC screen', { style: { background: '#111', color: '#fff' } }); }}
      />

      <BonusUnlockCelebration
        isOpen={showBonusCelebration}
        onClose={() => setShowBonusCelebration(false)}
        bonusAmount={bonusAmount}
      />
    </div>
  );
};

export default WalletScreen;
