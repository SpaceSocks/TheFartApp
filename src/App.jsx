import React, { useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import useStore from './stores/useStore';
import Header from './components/Header';
import TabNav from './components/TabNav';
import InstantFart from './components/InstantFart';
import Timer from './components/Timer';
import Alarms from './components/Alarms';
import SettingsModal from './components/SettingsModal';
import { getAllCustomSounds, getCustomSound } from './utils/storage';
import { playFartSound, playRandomFartSound, playCustomSound, getBuiltInSounds } from './utils/audioEngine';
import { showAlarmNotification, showRandomFartNotification, showFunNotification, requestNotificationPermission } from './utils/notifications';

function App() {
  const [activeTab, setActiveTab] = useState('instant');
  const [showSettings, setShowSettings] = useState(false);
  const [customSounds, setCustomSounds] = useState([]);

  const { settings, alarms, stats, updateAlarm, updateRandomFarts, updateFunNotifications, incrementFartCount } = useStore();

  // Helper to play a sound from the selected sounds list
  const playFromSelectedSounds = useCallback(async (volume) => {
    const selectedSounds = settings.randomFarts?.selectedSounds || ['classic'];
    if (selectedSounds.length === 0) {
      await playFartSound('classic', volume);
      return;
    }

    // Pick a random sound from selected sounds
    const randomIndex = Math.floor(Math.random() * selectedSounds.length);
    const soundId = selectedSounds[randomIndex];

    try {
      if (soundId.startsWith('custom_')) {
        const sound = await getCustomSound(soundId);
        if (sound?.audioBlob) {
          await playCustomSound(sound.audioBlob, volume);
        } else {
          // Fallback to classic if custom sound not found
          await playFartSound('classic', volume);
        }
      } else {
        await playFartSound(soundId, volume);
      }
      incrementFartCount();
    } catch (error) {
      console.error('Error playing selected sound:', error);
      await playFartSound('classic', volume);
    }
  }, [settings.randomFarts?.selectedSounds, incrementFartCount]);

  // Load custom sounds from IndexedDB
  useEffect(() => {
    const loadCustomSounds = async () => {
      try {
        const sounds = await getAllCustomSounds();
        setCustomSounds(sounds);
      } catch (error) {
        console.error('Failed to load custom sounds:', error);
      }
    };
    loadCustomSounds();
  }, []);

  // Handle custom sound updates
  const refreshCustomSounds = useCallback(async () => {
    const sounds = await getAllCustomSounds();
    setCustomSounds(sounds);
  }, []);

  // Alarm checker - runs every minute
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
      const today = now.toDateString();

      alarms.forEach((alarm) => {
        if (!alarm.enabled) return;
        if (alarm.time !== currentTime) return;

        // Check if already triggered today
        if (alarm.lastTriggered === today) return;

        // Check repeat settings
        const isWeekday = currentDay >= 1 && currentDay <= 5;
        const isWeekend = currentDay === 0 || currentDay === 6;

        if (alarm.repeat === 'weekdays' && !isWeekday) return;
        if (alarm.repeat === 'weekends' && !isWeekend) return;

        // Trigger alarm
        console.log('Triggering alarm:', alarm.name);

        // Play sound
        const soundId = alarm.sound || 'classic';
        if (settings.randomize) {
          playRandomFartSound(settings.volume);
        } else {
          playFartSound(soundId, settings.volume);
        }

        // Show notification
        if (settings.notificationsEnabled) {
          const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          showAlarmNotification(alarm.name, timeStr);
        }

        // Update last triggered
        updateAlarm(alarm.id, { lastTriggered: today });

        // Disable if 'once'
        if (alarm.repeat === 'once') {
          updateAlarm(alarm.id, { enabled: false });
        }
      });
    };

    // Check immediately and then every 30 seconds
    checkAlarms();
    const interval = setInterval(checkAlarms, 30000);

    return () => clearInterval(interval);
  }, [alarms, settings, updateAlarm]);

  // Random farts scheduler
  useEffect(() => {
    if (!settings.randomFarts.enabled) return;

    let timeout;

    const scheduleNextFart = () => {
      const { minInterval, maxInterval, activeHoursEnabled, activeHoursStart, activeHoursEnd } =
        settings.randomFarts;

      // Calculate random delay in minutes, then convert to ms
      const minMinutes = minInterval;
      const maxMinutes = maxInterval;
      const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;

      // Align to the next minute mark
      const now = new Date();
      const nextMinute = new Date(now);
      nextMinute.setSeconds(0, 0);
      nextMinute.setMinutes(nextMinute.getMinutes() + randomMinutes);

      const delay = nextMinute.getTime() - now.getTime();
      const nextTime = nextMinute.getTime();

      updateRandomFarts({ nextScheduledTime: nextTime });

      timeout = setTimeout(() => {
        const now = new Date();

        // Check active hours
        if (activeHoursEnabled) {
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          if (currentTime < activeHoursStart || currentTime > activeHoursEnd) {
            // Outside active hours, schedule next fart
            scheduleNextFart();
            return;
          }
        }

        // Play the random fart sound
        playFromSelectedSounds(settings.volume);

        // Schedule next fart
        scheduleNextFart();
      }, delay);
    };

    // Always schedule a new fart when settings change
    // This ensures the next fart time updates when user adjusts intervals
    scheduleNextFart();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [settings.randomFarts.enabled, settings.randomFarts.minInterval, settings.randomFarts.maxInterval, settings.randomFarts.selectedSounds, playFromSelectedSounds]);

  // Listen for quick fart from tray menu
  useEffect(() => {
    if (window.electronAPI?.onQuickFart) {
      window.electronAPI.onQuickFart(() => {
        if (settings.randomize) {
          playRandomFartSound(settings.volume);
        } else {
          playFartSound('classic', settings.volume);
        }
        incrementFartCount();
      });
    }
  }, [settings, incrementFartCount]);

  // Keyboard shortcut: Space for instant fart
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger if not typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space' && activeTab === 'instant') {
        e.preventDefault();
        if (settings.randomize) {
          playRandomFartSound(settings.volume);
        } else {
          playFartSound('classic', settings.volume);
        }
        incrementFartCount();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, settings, incrementFartCount]);

  // Fun notifications scheduler (1-2 per day)
  useEffect(() => {
    const funNotifs = settings.funNotifications || { enabled: true };
    if (!funNotifs.enabled) return;

    // Request notification permission on first load
    requestNotificationPermission();

    const checkAndSendNotification = () => {
      const today = new Date().toDateString();
      const lastDate = funNotifs.lastNotificationDate;
      const notificationsToday = lastDate === today ? (funNotifs.notificationsToday || 0) : 0;

      // Max 2 notifications per day
      if (notificationsToday >= 2) return;

      // Random chance to send notification (roughly every 4-6 hours when app is open)
      const shouldNotify = Math.random() < 0.15; // 15% chance each check

      if (shouldNotify || (lastDate !== today && notificationsToday === 0)) {
        showFunNotification(stats);
        updateFunNotifications({
          lastNotificationDate: today,
          notificationsToday: notificationsToday + 1,
        });
      }
    };

    // Check after a delay when app starts (don't spam on every reload)
    const initialDelay = setTimeout(() => {
      checkAndSendNotification();
    }, 30000); // Wait 30 seconds after app start

    // Then check periodically
    const interval = setInterval(checkAndSendNotification, 60 * 60 * 1000); // Every hour

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [settings.funNotifications?.enabled, stats, updateFunNotifications]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'instant':
        return (
          <InstantFart
            customSounds={customSounds}
            onCustomSoundsChange={refreshCustomSounds}
          />
        );
      case 'timer':
        return <Timer />;
      case 'alarms':
        return <Alarms customSounds={customSounds} />;
      default:
        return null;
    }
  };

  const darkMode = settings.darkMode ?? false;

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50'}`}>
      <Header onSettingsClick={() => setShowSettings(true)} />

      <main className="flex-1 overflow-auto pb-20">
        <div className="tab-content">{renderTabContent()}</div>
      </main>

      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;
