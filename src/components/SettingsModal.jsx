import React, { useState } from 'react';
import { X, Volume2, Repeat, Shuffle, Bell, Clock, Trophy, Flame, Moon, Sun, MessageCircle } from 'lucide-react';
import useStore from '../stores/useStore';
import { requestNotificationPermission, getNotificationPermission } from '../utils/notifications';

const ALL_ACHIEVEMENTS = {
  first_10: { name: 'Getting Started', emoji: '🎉', description: 'Fart 10 times', target: 10 },
  century: { name: 'Century Club', emoji: '💯', description: 'Fart 100 times', target: 100 },
  fart_master: { name: 'Fart Master', emoji: '🏆', description: 'Fart 500 times', target: 500 },
  legendary: { name: 'Legendary', emoji: '👑', description: 'Fart 1000 times', target: 1000 },
  week_streak: { name: 'Week Warrior', emoji: '🔥', description: '7 day streak', target: 7 },
};

function SettingsModal({ onClose }) {
  const { settings = {}, stats = {}, updateSettings, updateRepeatMode, updateRandomFarts, updateFunNotifications } = useStore();
  const [notificationStatus, setNotificationStatus] = useState(getNotificationPermission());

  // Safe stats defaults
  const totalFarts = stats.totalFarts ?? 0;
  const currentStreak = stats.currentStreak ?? 0;
  const achievements = stats.achievements ?? [];

  // Calculate next fart time display
  const getNextFartTimeDisplay = () => {
    if (!settings.randomFarts.enabled || !settings.randomFarts.nextScheduledTime) {
      return null;
    }

    const nextTime = new Date(settings.randomFarts.nextScheduledTime);
    const now = Date.now();
    const diff = settings.randomFarts.nextScheduledTime - now;

    if (diff <= 0) return 'Any moment now...';

    const minutes = Math.floor(diff / 60000);
    const timeStr = nextTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    return `${timeStr} (in ${minutes} min)`;
  };

  const handleNotificationToggle = async () => {
    if (!settings.notificationsEnabled) {
      const permission = await requestNotificationPermission();
      setNotificationStatus(permission);
      if (permission === 'granted') {
        updateSettings({ notificationsEnabled: true });
      }
    } else {
      updateSettings({ notificationsEnabled: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-800 rounded-3xl mx-4 w-full max-w-sm max-h-[85vh] overflow-hidden shadow-2xl modal-content">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="overflow-auto p-6 space-y-6">
          {/* Dark Mode Toggle - AT THE TOP */}
          <section className="p-4 rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                {settings.darkMode ? (
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                    <Moon size={22} className="text-white" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">
                    <Sun size={22} className="text-white" />
                  </div>
                )}
                <div>
                  <span className="font-bold text-gray-800 dark:text-white text-lg">Dark Mode</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {settings.darkMode ? 'Looking spooky!' : 'Switch to dark theme'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                className={`toggle-switch ${settings.darkMode ? 'active' : ''}`}
              />
            </label>
          </section>

          <hr className="border-gray-100 dark:border-gray-700" />

          {/* Stats Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <Trophy size={20} className="text-yellow-500" />
              <h3 className="font-bold">Your Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-center">
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totalFarts}</p>
                <p className="text-xs text-purple-400 dark:text-purple-500">Total Farts</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-center">
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1">
                  {currentStreak} <Flame size={20} />
                </p>
                <p className="text-xs text-orange-400 dark:text-orange-500">Day Streak</p>
              </div>
            </div>
          </section>

          {/* Achievements */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-700 dark:text-gray-200">Achievements</h4>
              <span className="text-sm text-gray-400 dark:text-gray-500">
                {achievements.length}/{Object.keys(ALL_ACHIEVEMENTS).length}
              </span>
            </div>
            <div className="space-y-2">
              {Object.entries(ALL_ACHIEVEMENTS).map(([id, achievement]) => {
                const unlocked = achievements.includes(id);
                return (
                  <div
                    key={id}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl transition-all
                      ${unlocked
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200 dark:border-yellow-800'
                        : 'bg-gray-50 dark:bg-gray-700 opacity-50'
                      }
                    `}
                  >
                    <span className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>
                      {achievement.emoji}
                    </span>
                    <div className="flex-1">
                      <p className={`font-medium ${unlocked ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                        {achievement.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{achievement.description}</p>
                    </div>
                    {unlocked && (
                      <span className="text-green-500 text-sm font-medium">Unlocked!</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <hr className="border-gray-100 dark:border-gray-700" />

          {/* Volume Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <Volume2 size={20} className="text-purple-500" />
              <h3 className="font-bold">Volume</h3>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.volume * 100}
              onChange={(e) => updateSettings({ volume: parseInt(e.target.value) / 100 })}
              className="w-full"
            />
            <p className="text-center text-gray-500 dark:text-gray-400 font-medium">
              {Math.round(settings.volume * 100)}%
            </p>
          </section>

          {/* Randomize */}
          <section className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Shuffle size={20} className="text-purple-500" />
                <span className="font-bold text-gray-700 dark:text-gray-200">Randomize Fart Sounds</span>
              </div>
              <button
                onClick={() => updateSettings({ randomize: !settings.randomize })}
                className={`toggle-switch ${settings.randomize ? 'active' : ''}`}
              />
            </label>
            <p className="text-sm text-gray-400 dark:text-gray-500 pl-7">
              When enabled, plays a random sound each time
            </p>
          </section>

          <hr className="border-gray-100" />

          {/* Repeat Mode */}
          <section className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Repeat size={20} className="text-purple-500" />
                <span className="font-bold text-gray-700 dark:text-gray-200">Repeat Mode</span>
              </div>
              <button
                onClick={() => updateRepeatMode({ enabled: !settings.repeatMode.enabled })}
                className={`toggle-switch ${settings.repeatMode.enabled ? 'active' : ''}`}
              />
            </label>

            {settings.repeatMode.enabled && (
              <div className="pl-7 space-y-3">
                {/* Repeat times option */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="repeatType"
                    checked={settings.repeatMode.type === 'times'}
                    onChange={() => updateRepeatMode({ type: 'times' })}
                    className="w-4 h-4 text-purple-500"
                  />
                  <span className="text-gray-600 dark:text-gray-300">Fart</span>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={settings.repeatMode.count}
                    onChange={(e) => updateRepeatMode({ count: parseInt(e.target.value) || 3 })}
                    className="w-16 px-2 py-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-center"
                    disabled={settings.repeatMode.type !== 'times'}
                  />
                  <span className="text-gray-600 dark:text-gray-300">times</span>
                </label>

                {/* Infinite option */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="repeatType"
                    checked={settings.repeatMode.type === 'infinite'}
                    onChange={() => updateRepeatMode({ type: 'infinite' })}
                    className="w-4 h-4 text-purple-500"
                  />
                  <span className="text-gray-600 dark:text-gray-300">Fart Until I Turn It Off</span>
                </label>
              </div>
            )}
          </section>

          <hr className="border-gray-100" />

          {/* Random Farts Mode */}
          <section className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎲</span>
                <span className="font-bold text-gray-700 dark:text-gray-200">Random Farts</span>
              </div>
              <button
                onClick={() => updateRandomFarts({ enabled: !settings.randomFarts.enabled })}
                className={`toggle-switch ${settings.randomFarts.enabled ? 'active' : ''}`}
              />
            </label>
            <p className="text-sm text-gray-400 dark:text-gray-500 pl-7">
              Surprise you with random farts throughout the day
            </p>

            {settings.randomFarts.enabled && (
              <div className="pl-7 space-y-4 pt-2">
                {/* Min interval */}
                <div className="space-y-1">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    Minimum interval: {settings.randomFarts.minInterval} min
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={120}
                    value={settings.randomFarts.minInterval}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateRandomFarts({ minInterval: val });
                    }}
                    className="w-full"
                  />
                </div>

                {/* Max interval */}
                <div className="space-y-1">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    Maximum interval: {settings.randomFarts.maxInterval} min
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={240}
                    value={settings.randomFarts.maxInterval}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateRandomFarts({ maxInterval: val });
                    }}
                    className="w-full"
                  />
                </div>

                {/* Next fart time */}
                {getNextFartTimeDisplay() && (
                  <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                    <Clock size={18} className="text-purple-500" />
                    <span className="text-sm text-purple-700 dark:text-purple-300">
                      Next fart: {getNextFartTimeDisplay()}
                    </span>
                  </div>
                )}

              </div>
            )}
          </section>

          <hr className="border-gray-100 dark:border-gray-700" />

          {/* Fun Notifications */}
          <section className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <MessageCircle size={20} className="text-purple-500" />
                <span className="font-bold text-gray-700 dark:text-gray-200">Fun Reminders</span>
              </div>
              <button
                onClick={() => updateFunNotifications({ enabled: !(settings.funNotifications?.enabled ?? true) })}
                className={`toggle-switch ${settings.funNotifications?.enabled !== false ? 'active' : ''}`}
              />
            </label>
            <p className="text-sm text-gray-400 dark:text-gray-500 pl-7">
              Get friendly reminders like "Have you farted today?" (1-2 per day max)
            </p>
          </section>

          <hr className="border-gray-100 dark:border-gray-700" />

          {/* Notifications */}
          <section className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-purple-500" />
                <span className="font-bold text-gray-700 dark:text-gray-200">Alarm Notifications</span>
              </div>
              <button
                onClick={handleNotificationToggle}
                className={`toggle-switch ${settings.notificationsEnabled ? 'active' : ''}`}
              />
            </label>
            <p className="text-sm text-gray-400 dark:text-gray-500 pl-7">
              Show notifications when alarms trigger
            </p>
            {notificationStatus === 'denied' && (
              <p className="text-sm text-red-500 pl-7">
                Notifications blocked. Please enable in system settings.
              </p>
            )}
          </section>

          {/* Version info */}
          <div className="text-center pt-4">
            <p className="text-xs text-gray-300 dark:text-gray-600">The Fart App v1.0.0</p>
            <p className="text-xs text-gray-300 dark:text-gray-600">Made with 💨 and love</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
