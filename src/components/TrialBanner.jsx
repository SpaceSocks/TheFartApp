import React from 'react';
import { Zap } from 'lucide-react';
import useStore, { FREE_TRIAL_LIMIT } from '../stores/useStore';

function TrialBanner({ onUpgrade }) {
  const { stats, isPremium } = useStore();
  const totalFarts = stats?.totalFarts ?? 0;
  const fartsLeft = Math.max(0, FREE_TRIAL_LIMIT - totalFarts);

  // Don't show if premium
  if (isPremium) return null;

  // Don't show if trial ended (paywall will show instead)
  if (fartsLeft <= 0) return null;

  return (
    <button
      onClick={onUpgrade}
      className={`
        w-full py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all
        ${fartsLeft <= 10
          ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
          : fartsLeft <= 25
            ? 'bg-gradient-to-r from-orange-400 to-yellow-400 text-white'
            : 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-purple-700 dark:text-purple-300'
        }
      `}
    >
      <Zap size={16} className={fartsLeft <= 10 ? 'animate-pulse' : ''} />
      <span>
        {fartsLeft <= 10
          ? `Only ${fartsLeft} free farts left!`
          : `${fartsLeft} free farts remaining`
        }
      </span>
      <span className="text-xs opacity-75">Tap to upgrade</span>
    </button>
  );
}

export default TrialBanner;
