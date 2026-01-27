import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings } from 'lucide-react';
import useStore, { FREE_TRIAL_LIMIT } from './stores/useStore';
import Header from './components/Header';
import TabNav from './components/TabNav';
import InstantFart from './components/InstantFart';
import Timer from './components/Timer';
import Alarms from './components/Alarms';
import AlarmPlayer from './components/AlarmPlayer';
import SettingsModal from './components/SettingsModal';
import PaywallModal from './components/PaywallModal';
import TrialBanner from './components/TrialBanner';
import { getAllCustomSounds, getCustomSound } from './utils/storage';
import { playFartSound, playRandomFartSound, playCustomSound, getBuiltInSounds } from './utils/audioEngine';
import { showAlarmNotification, showRandomFartNotification, showFunNotification, requestNotificationPermission } from './utils/notifications';

function App() {
  const [activeTab, setActiveTab] = useState('instant');
  const [showSettings, setShowSettings] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [customSounds, setCustomSounds] = useState([]);

  const { settings, alarms, stats, isPremium, activeAlarm, setActiveAlarm, clearActiveAlarm, updateAlarm, updateRandomFarts, updateFunNotifications, incrementFartCount } = useStore();

  // Track snoozed alarms
  const snoozedAlarmsRef = useRef(new Map()); // Map of alarmId -> snoozeUntilTime

  // Check if trial has ended
  const isTrialEnded = !isPremium && (stats?.totalFarts ?? 0) >= FREE_TRIAL_LIMIT;

  // Show paywall automatically when trial ends
  useEffect(() => {
    if (isTrialEnded) {
      setShowPaywall(true);
    }
  }, [isTrialEnded]);

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
      // Don't trigger new alarms if one is already active
      if (activeAlarm) {
        console.log('Alarm checker: skipping, alarm already active');
        return;
      }

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
      const today = now.toDateString();
      const currentTimestamp = now.getTime();

      console.log('Alarm checker running at', currentTime, '| Alarms:', alarms.length);

      for (const alarm of alarms) {
        if (!alarm.enabled) {
          console.log(`Alarm "${alarm.name}" is disabled, skipping`);
          continue;
        }

        console.log(`Checking alarm "${alarm.name}" - time: ${alarm.time} vs current: ${currentTime}`);

        // Check if alarm is snoozed
        const snoozeUntil = snoozedAlarmsRef.current.get(alarm.id);
        if (snoozeUntil && currentTimestamp < snoozeUntil) {
          continue; // Still snoozed
        } else if (snoozeUntil && currentTimestamp >= snoozeUntil) {
          // Snooze time is up - trigger the alarm!
          snoozedAlarmsRef.current.delete(alarm.id);
          console.log('Snooze ended, triggering alarm:', alarm.name);
          setActiveAlarm(alarm);

          // Show notification
          if (settings.notificationsEnabled) {
            const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            showAlarmNotification(alarm.name + ' (Snoozed)', timeStr);
          }
          return; // Only trigger one alarm at a time
        }

        // Normal alarm check
        if (alarm.time !== currentTime) {
          console.log(`  Time mismatch: ${alarm.time} !== ${currentTime}`);
          continue;
        }

        // Check if already triggered today
        if (alarm.lastTriggered === today) {
          console.log(`  Already triggered today`);
          continue;
        }

        console.log(`  TIME MATCH! Checking repeat settings...`);

        // Check repeat settings
        const isWeekday = currentDay >= 1 && currentDay <= 5;
        const isWeekend = currentDay === 0 || currentDay === 6;

        if (alarm.repeat === 'weekdays' && !isWeekday) continue;
        if (alarm.repeat === 'weekends' && !isWeekend) continue;

        // Trigger alarm - activate the alarm player
        console.log('Triggering alarm:', alarm.name);
        setActiveAlarm(alarm);

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

        return; // Only trigger one alarm at a time
      }
    };

    // Check immediately and then every 5 seconds (more responsive)
    checkAlarms();
    const interval = setInterval(checkAlarms, 5000);

    return () => clearInterval(interval);
  }, [alarms, settings, updateAlarm, activeAlarm, setActiveAlarm]);

  // Handle alarm stop
  const handleAlarmStop = useCallback(() => {
    clearActiveAlarm();
  }, [clearActiveAlarm]);

  // Handle alarm snooze
  const handleAlarmSnooze = useCallback((minutes) => {
    if (!activeAlarm) return;

    const snoozeUntil = Date.now() + (minutes * 60 * 1000);
    snoozedAlarmsRef.current.set(activeAlarm.id, snoozeUntil);
    console.log(`Alarm snoozed for ${minutes} minutes until ${new Date(snoozeUntil).toLocaleTimeString()}`);
    clearActiveAlarm();
  }, [activeAlarm, clearActiveAlarm]);

  // Random farts scheduler
  useEffect(() => {
    // Don't run random farts if trial ended or feature disabled
    if (!settings.randomFarts.enabled || isTrialEnded) return;

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
        // Check trial status again when timer fires
        const currentStats = useStore.getState().stats;
        const currentPremium = useStore.getState().isPremium;
        if (!currentPremium && (currentStats?.totalFarts ?? 0) >= FREE_TRIAL_LIMIT) {
          // Trial ended, don't play
          return;
        }

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
  }, [settings.randomFarts.enabled, settings.randomFarts.minInterval, settings.randomFarts.maxInterval, settings.randomFarts.selectedSounds, playFromSelectedSounds, isTrialEnded]);

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
            onShowPaywall={() => setShowPaywall(true)}
          />
        );
      case 'timer':
        return <Timer customSounds={customSounds} onShowPaywall={() => setShowPaywall(true)} />;
      case 'alarms':
        return <Alarms customSounds={customSounds} />;
      default:
        return null;
    }
  };

  const darkMode = settings.darkMode ?? false;

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50'}`}>
      {/* Trial Banner - shows farts remaining */}
      <TrialBanner onUpgrade={() => setShowPaywall(true)} />

      <Header onSettingsClick={() => setShowSettings(true)} />

      <main className="flex-1 overflow-auto pb-20">
        <div className="tab-content">{renderTabContent()}</div>
      </main>

      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* Paywall Modal - shows when trial ends or user taps upgrade */}
      {showPaywall && (
        <PaywallModal onClose={() => !isTrialEnded && setShowPaywall(false)} />
      )}

      {/* Alarm Player - shows when an alarm is ringing */}
      {activeAlarm && (
        <AlarmPlayer
          alarm={activeAlarm}
          customSounds={customSounds}
          onStop={handleAlarmStop}
          onSnooze={handleAlarmSnooze}
        />
      )}
    </div>
  );
}

export default App;
