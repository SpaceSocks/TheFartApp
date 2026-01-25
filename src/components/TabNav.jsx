import React from 'react';
import { Zap, Timer, AlarmClock } from 'lucide-react';

const tabs = [
  { id: 'instant', label: 'Instant', icon: Zap, emoji: '💨' },
  { id: 'timer', label: 'Timer', icon: Timer, emoji: '⏱️' },
  { id: 'alarms', label: 'Alarms', icon: AlarmClock, emoji: '⏰' },
];

function TabNav({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-t border-purple-100 dark:border-gray-700 shadow-lg z-50">
      <div className="flex justify-around items-center py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all btn-press
                ${isActive
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <span className="text-2xl">{tab.emoji}</span>
              <span className={`text-xs font-medium ${isActive ? 'text-white' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default TabNav;
