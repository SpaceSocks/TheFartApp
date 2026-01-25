import React, { useState } from 'react';
import { X, Crown, Check, Zap, Sparkles } from 'lucide-react';
import useStore, { FREE_TRIAL_LIMIT } from '../stores/useStore';

function PaywallModal({ onClose }) {
  const { setPremium, isPremium } = useStore();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePurchase = async () => {
    setIsPurchasing(true);

    // TODO: Implement actual in-app purchase with App Store
    // For now, simulate a brief loading then success
    await new Promise(resolve => setTimeout(resolve, 1000));

    setPremium(true);
    setIsPurchasing(false);
    setShowSuccess(true);

    // Auto close after showing success
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For testing, just unlock premium
    setPremium(true);
    setIsPurchasing(false);
    setShowSuccess(true);

    setTimeout(() => {
      onClose();
    }, 2000);
  };

  // Show success state
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center modal-backdrop">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl mx-4 w-full max-w-sm overflow-hidden shadow-2xl modal-content p-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-6">
            <Sparkles size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            You're Premium!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Unlimited farts unlocked forever!
          </p>
          <p className="text-4xl">🎉💨🎉</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center modal-backdrop">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-800 rounded-3xl mx-4 w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden shadow-2xl modal-content">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors z-10"
        >
          <X size={24} className="text-white/80" />
        </button>

        {/* Header - fixed */}
        <div className="flex-shrink-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 px-6 py-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-3">
            <Crown size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Free Trial Ended</h2>
          <p className="text-white/80 text-sm">
            You've used all {FREE_TRIAL_LIMIT} free farts!
          </p>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Unlock <span className="font-bold text-purple-600 dark:text-purple-400">unlimited farts</span> forever!
            </p>

            {/* Price */}
            <div className="inline-flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-gray-800 dark:text-white">$0.99</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">USD</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">One-time purchase</p>
          </div>

          {/* Features */}
          <div className="space-y-2">
            {[
              'Unlimited fart sounds',
              'All 6 fart types + custom recordings',
              'Timer & Alarm features',
              'Random farts throughout the day',
              'Achievements & stats tracking',
              'No ads, ever!',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-200">{feature}</span>
              </div>
            ))}
          </div>

          {/* Purchase button */}
          <button
            onClick={handlePurchase}
            disabled={isPurchasing}
            className={`
              w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all btn-press
              ${isPurchasing
                ? 'bg-gray-400 cursor-wait'
                : 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:shadow-xl'
              }
            `}
          >
            {isPurchasing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap size={22} />
                Unlock Unlimited Farts
              </>
            )}
          </button>

          {/* Restore purchases */}
          <button
            onClick={handleRestore}
            disabled={isPurchasing}
            className="w-full py-2 text-purple-600 dark:text-purple-400 font-medium hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-colors text-sm"
          >
            Restore Purchase
          </button>

          {/* Footer */}
          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            Payment will be charged to your Apple ID account at confirmation of purchase.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaywallModal;
