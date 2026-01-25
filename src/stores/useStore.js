import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Free trial limit
export const FREE_TRIAL_LIMIT = 50;

const useStore = create(
  persist(
    (set, get) => ({
      // Premium status
      isPremium: false,

      // Selected sound for instant fart
      selectedSound: 'classic',

      // Custom recorded sounds
      customSounds: [],

      // Settings
      settings: {
        volume: 1.0, // Default to 100%
        darkMode: true, // Dark mode by default
        randomize: false,
        repeatMode: {
          enabled: false,
          type: 'times', // 'times' or 'infinite'
          count: 3,
        },
        randomFarts: {
          enabled: false,
          minInterval: 30, // minutes
          maxInterval: 120, // minutes
          nextScheduledTime: null,
          showNotifications: true,
          activeHoursEnabled: false,
          activeHoursStart: '09:00',
          activeHoursEnd: '17:00',
          soundMode: 'random', // 'random' or 'specific'
          selectedSounds: ['classic', 'squeaky', 'thunder', 'wet', 'long', 'rapidfire'], // All built-in by default
        },
        notificationsEnabled: true,
        funNotifications: {
          enabled: true,
          lastNotificationDate: null,
          notificationsToday: 0,
        },
      },

      // Timer state - now with hours, minutes, seconds
      timer: {
        hours: 0,
        minutes: 1,
        seconds: 0,
        isRunning: false,
        remainingSeconds: 60,
        sound: 'classic', // Selected sound for timer
      },

      // Alarms
      alarms: [],

      // Fun stats
      stats: {
        totalFarts: 0,
        longestStreak: 0,
        currentStreak: 0,
        lastFartDate: null,
        achievements: [],
      },

      // Actions
      setPremium: (isPremium) => set({ isPremium }),

      setSelectedSound: (sound) => set({ selectedSound: sound }),

      addCustomSound: (sound) =>
        set((state) => ({
          customSounds: [...state.customSounds, sound],
        })),

      removeCustomSound: (id) =>
        set((state) => ({
          customSounds: state.customSounds.filter((s) => s.id !== id),
        })),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      updateRepeatMode: (repeatMode) =>
        set((state) => ({
          settings: {
            ...state.settings,
            repeatMode: { ...state.settings.repeatMode, ...repeatMode },
          },
        })),

      updateRandomFarts: (randomFarts) =>
        set((state) => ({
          settings: {
            ...state.settings,
            randomFarts: { ...state.settings.randomFarts, ...randomFarts },
          },
        })),

      updateFunNotifications: (funNotifications) =>
        set((state) => ({
          settings: {
            ...state.settings,
            funNotifications: { ...state.settings.funNotifications, ...funNotifications },
          },
        })),

      // Timer actions - updated for hours/minutes/seconds
      setTimerTime: (hours, minutes, seconds) =>
        set((state) => {
          const totalSeconds = hours * 3600 + minutes * 60 + seconds;
          return {
            timer: {
              ...state.timer,
              hours,
              minutes,
              seconds,
              remainingSeconds: totalSeconds,
            },
          };
        }),

      setTimerSound: (sound) =>
        set((state) => ({
          timer: { ...state.timer, sound },
        })),

      setTimerRunning: (isRunning) =>
        set((state) => ({
          timer: { ...state.timer, isRunning },
        })),

      setTimerRemaining: (remainingSeconds) =>
        set((state) => ({
          timer: { ...state.timer, remainingSeconds },
        })),

      resetTimer: () =>
        set((state) => {
          const totalSeconds = state.timer.hours * 3600 + state.timer.minutes * 60 + state.timer.seconds;
          return {
            timer: { ...state.timer, remainingSeconds: totalSeconds, isRunning: false },
          };
        }),

      // Alarm actions
      addAlarm: (alarm) =>
        set((state) => ({
          alarms: [...state.alarms, alarm],
        })),

      updateAlarm: (id, updates) =>
        set((state) => ({
          alarms: state.alarms.map((alarm) =>
            alarm.id === id ? { ...alarm, ...updates } : alarm
          ),
        })),

      removeAlarm: (id) =>
        set((state) => ({
          alarms: state.alarms.filter((alarm) => alarm.id !== id),
        })),

      toggleAlarm: (id) =>
        set((state) => ({
          alarms: state.alarms.map((alarm) =>
            alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm
          ),
        })),

      // Stats actions
      resetStats: () =>
        set({
          isPremium: false,
          stats: {
            totalFarts: 0,
            longestStreak: 0,
            currentStreak: 0,
            lastFartDate: null,
            achievements: [],
          },
        }),

      incrementFartCount: () =>
        set((state) => {
          const today = new Date().toDateString();
          const lastDate = state.stats.lastFartDate;
          const yesterday = new Date(Date.now() - 86400000).toDateString();

          let newStreak = state.stats.currentStreak;
          if (lastDate === today) {
            // Same day, keep streak
          } else if (lastDate === yesterday) {
            // Consecutive day, increase streak
            newStreak += 1;
          } else {
            // Streak broken, reset to 1
            newStreak = 1;
          }

          const newTotal = state.stats.totalFarts + 1;
          const longestStreak = Math.max(state.stats.longestStreak, newStreak);

          // Check for achievements
          const achievements = [...state.stats.achievements];
          if (newTotal === 10 && !achievements.includes('first_10')) {
            achievements.push('first_10');
          }
          if (newTotal === 100 && !achievements.includes('century')) {
            achievements.push('century');
          }
          if (newTotal === 500 && !achievements.includes('fart_master')) {
            achievements.push('fart_master');
          }
          if (newTotal === 1000 && !achievements.includes('legendary')) {
            achievements.push('legendary');
          }
          if (newStreak >= 7 && !achievements.includes('week_streak')) {
            achievements.push('week_streak');
          }

          return {
            stats: {
              totalFarts: newTotal,
              currentStreak: newStreak,
              longestStreak,
              lastFartDate: today,
              achievements,
            },
          };
        }),
    }),
    {
      name: 'fart-app-storage',
      partialize: (state) => ({
        isPremium: state.isPremium,
        selectedSound: state.selectedSound,
        settings: state.settings,
        timer: {
          hours: state.timer.hours,
          minutes: state.timer.minutes,
          seconds: state.timer.seconds,
          sound: state.timer.sound,
        },
        alarms: state.alarms,
        stats: state.stats,
        // Note: customSounds are stored separately in IndexedDB
      }),
    }
  )
);

export default useStore;
