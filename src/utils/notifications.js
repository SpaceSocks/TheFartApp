// Desktop & Mobile Notification Utilities
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Check if running on native platform (iOS/Android)
const isNative = () => Capacitor.isNativePlatform();

// Check if notifications are supported
export const isNotificationSupported = () => {
  if (isNative()) return true;
  return 'Notification' in window;
};

// Check current notification permission status
export const getNotificationPermission = () => {
  if (isNative()) {
    // For native, we'll check async but return 'default' for sync calls
    return 'default';
  }
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (isNative()) {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted' ? 'granted' : 'denied';
    } catch (error) {
      console.error('Error requesting native notification permission:', error);
      return 'denied';
    }
  }

  if (!isNotificationSupported()) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return 'denied';
};

// Notification ID counter for native notifications
let notificationId = 1;

// Show a notification
export const showNotification = async (title, body, options = {}) => {
  // Try Capacitor native notifications first (iOS/Android)
  if (isNative()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: notificationId++,
            schedule: { at: new Date(Date.now() + 100) }, // Immediate
            sound: options.silent ? undefined : 'default',
            actionTypeId: '',
            extra: null
          }
        ]
      });
      return;
    } catch (error) {
      console.error('Native notification error:', error);
    }
  }

  // Try Electron API (desktop)
  if (window.electronAPI?.showNotification) {
    window.electronAPI.showNotification(title, body);
    return;
  }

  // Fallback to browser notifications (web)
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    console.log('Notification not shown:', title, body);
    return;
  }

  const notification = new Notification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    ...options,
  });

  // Auto-close after 5 seconds
  setTimeout(() => notification.close(), 5000);

  return notification;
};

// Show alarm notification
export const showAlarmNotification = (alarmName, time) => {
  showNotification(
    `${alarmName}`,
    `It's ${time}! Time for a fart!`,
    { requireInteraction: true }
  );
};

// Show random fart notification
export const showRandomFartNotification = () => {
  showNotification(
    'Incoming fart!',
    'Brace yourself...',
    { silent: true }
  );
};

// Fun notification messages
const FUN_NOTIFICATIONS = [
  { title: 'Hey there!', body: 'Have you farted today? Your streak depends on it!' },
  { title: 'Daily Reminder', body: "Don't forget to let one rip today!" },
  { title: 'Fart Check!', body: 'Time for your daily fart. Open the app!' },
  { title: 'Missing You!', body: "The Fart App misses your toots. Come back!" },
  { title: 'Streak Alert!', body: "Keep your streak alive - fart today!" },
  { title: 'Achievement Unlocked?', body: "You're getting closer to your next milestone!" },
  { title: "Fart O'Clock!", body: "It's the perfect time for a quick toot!" },
  { title: 'Pro Tip', body: 'Try recording a custom fart sound today!' },
  { title: 'Random Thought', body: 'Did you know the average person farts 14 times a day?' },
  { title: 'Hello!', body: 'Your fart button is feeling lonely...' },
];

// Get a random fun notification
export const getRandomFunNotification = (stats = {}) => {
  const { totalFarts = 0, currentStreak = 0 } = stats;

  // Custom messages based on stats
  const customMessages = [];

  if (currentStreak > 0 && currentStreak < 7) {
    customMessages.push({
      title: `${currentStreak} Day Streak!`,
      body: `You're ${7 - currentStreak} days away from Week Warrior!`
    });
  }

  if (totalFarts > 0 && totalFarts < 10) {
    customMessages.push({
      title: 'Almost There!',
      body: `Just ${10 - totalFarts} more farts to your first achievement!`
    });
  }

  if (totalFarts >= 10 && totalFarts < 100) {
    customMessages.push({
      title: 'Keep Going!',
      body: `${100 - totalFarts} farts until Century Club!`
    });
  }

  // Combine custom and default messages
  const allMessages = [...customMessages, ...FUN_NOTIFICATIONS];
  const randomIndex = Math.floor(Math.random() * allMessages.length);

  return allMessages[randomIndex];
};

// Show fun notification
export const showFunNotification = (stats) => {
  const notification = getRandomFunNotification(stats);
  showNotification(
    notification.title,
    notification.body + '\n\n(Turn off in Settings)',
    { silent: false }
  );
};
