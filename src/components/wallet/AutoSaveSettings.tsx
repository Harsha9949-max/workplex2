/**
 * AutoSaveSettings Component
 * Savings configuration modal
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PiggyBank, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface AutoSaveSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentPercent: number;
  totalEarned: number;
  onSave: (percent: number) => Promise<{ success: boolean; error?: string }>;
}

export const AutoSaveSettings: React.FC<AutoSaveSettingsProps> = ({
  isOpen,
  onClose,
  currentPercent,
  totalEarned,
  onSave,
}) => {
  const [percent, setPercent] = useState(currentPercent);
  const [isSaving, setIsSaving] = useState(false);

  const presets = [0, 10, 20, 30, 50];

  const handleSave = async () => {
    setIsSaving(true);
    const result = await onSave(percent);
    if (result.success) {
      toast.success(`Auto-save set to ${percent}%`, {
        duration: 2000,
        style: { background: '#111', color: '#fff', border: '1px solid #3B82F6' },
      });
      onClose();
    }
    setIsSaving(false);
  };

  const previewSaved = (totalEarned * percent) / 100;
  const previewWallet = totalEarned - previewSaved;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Auto-save settings"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[#111111] w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto border border-gray-800/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#111111] border-b border-gray-800/50 p-4 flex items-center justify-between z-10">
              <h3 className="text-white font-bold text-lg">Auto-Save Settings</h3>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-gray-400 text-sm">
                Automatically save a percentage of every earning to your savings wallet.
              </p>

              {/* Current Settings */}
              <div className="bg-[#1A1A1A] rounded-xl p-4">
                <p className="text-gray-500 text-xs mb-1">Current Setting</p>
                <p className="text-blue-400 font-bold text-xl">{percent}%</p>
              </div>

              {/* Percentage Slider */}
              <div>
                <label className="text-gray-400 text-sm mb-3 block">Savings Percentage</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={percent}
                  onChange={(e) => setPercent(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer accent-blue-500"
                  aria-label="Savings percentage"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-gray-500 text-xs">0%</span>
                  <span className="text-gray-500 text-xs">50%</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <p className="text-gray-500 text-xs mb-2">Quick Presets</p>
                <div className="flex gap-2">
                  {presets.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPercent(p)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                        percent === p
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-[#1A1A1A] text-gray-400 border border-gray-800/50'
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-[#1A1A1A] rounded-xl p-4 space-y-2">
                <p className="text-gray-500 text-xs mb-2">Preview (on Rs.100 earning)</p>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">To Savings</span>
                  <span className="text-blue-400 font-bold">Rs.{((100 * percent) / 100).toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">To Wallet</span>
                  <span className="text-green-400 font-bold">Rs.{(100 - (100 * percent) / 100).toFixed(0)}</span>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-[#1A1A1A] rounded-xl p-4 space-y-2">
                <p className="text-gray-500 text-xs mb-2">How It Works</p>
                <div className="flex items-center gap-2 text-sm text-gray-400"><Check size={14} className="text-green-400" /> Applied to task earnings</div>
                <div className="flex items-center gap-2 text-sm text-gray-400"><Check size={14} className="text-green-400" /> Applied to coupon commissions</div>
                <div className="flex items-center gap-2 text-sm text-gray-400"><Check size={14} className="text-green-400" /> Applied to streak bonuses</div>
                <div className="flex items-center gap-2 text-sm text-gray-400"><X size={14} className="text-red-400" /> Not applied to withdrawals</div>
              </div>

              {/* Benefits */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PiggyBank size={18} className="text-blue-400" />
                  <span className="text-blue-400 font-semibold text-sm">Benefits</span>
                </div>
                <p className="text-gray-400 text-xs">💰 Build savings automatically | 🎯 Reach financial goals faster | 🔒 Separate from spending money</p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] disabled:from-gray-700 disabled:to-gray-700 text-black font-bold py-4 rounded-xl transition-all min-h-[44px]"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
