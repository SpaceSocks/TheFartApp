import React, { useState, useEffect } from 'react';
import { Clock, Shuffle, Check } from 'lucide-react';
import useStore from '../stores/useStore';
import { getBuiltInSounds } from '../utils/audioEngine';
import { getAllCustomSounds } from '../utils/storage';

function RandomFarts() {
  const { settings = {}, updateRandomFarts } = useStore();
  const randomFarts = settings.randomFarts || {};

  const [customSounds, setCustomSounds] = useState([]);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  const builtInSounds = getBuiltInSounds();

  // Load custom sounds
  useEffect(() => {
    const loadSounds = async () => {
      try {
        const sounds = await getAllCustomSounds();
        setCustomSounds(sounds || []);
      } catch (err) {
        setCustomSounds([]);
      }
    };
    loadSounds();
  }, []);

  const allSounds = [
    ...builtInSounds,
    ...customSounds.map((s) => ({ ...s, emoji: '🎤' })),
  ];

  // Safe defaults
  const enabled = randomFarts.enabled ?? false;
  const minInterval = randomFarts.minInterval ?? 30;
  const maxInterval = randomFarts.maxInterval ?? 120;
  const showNotifications = randomFarts.showNotifications ?? true;
  const soundMode = randomFarts.soundMode ?? 'random';
  const selectedSounds = randomFarts.selectedSounds ?? builtInSounds.map(s => s.id);
  const nextScheduledTime = randomFarts.nextScheduledTime;

  // Calculate next fart time display
  const getNextFartTimeDisplay = () => {
    if (!enabled || !nextScheduledTime) return null;

    const nextTime = new Date(nextScheduledTime);
    const now = Date.now();
    const diff = nextScheduledTime - now;

    if (diff <= 0) return 'Any moment now... 💨';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeStr = nextTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    if (hours > 0) {
      return `${timeStr} (${hours}h ${mins}m)`;
    }
    return `${timeStr} (${mins} min)`;
  };

  const toggleSound = (soundId) => {
    const newSelected = selectedSounds.includes(soundId)
      ? selectedSounds.filter(id => id !== soundId)
      : [...selectedSounds, soundId];

    // Must have at least one sound selected
    if (newSelected.length > 0) {
      updateRandomFarts({ selectedSounds: newSelected });
    }
  };

  const selectAll = () => {
    updateRandomFarts({ selectedSounds: allSounds.map(s => s.id) });
  };

  const selectNone = () => {
    // Keep at least classic
    updateRandomFarts({ selectedSounds: ['classic'] });
  };

  return (
    <div className={`
      rounded-2xl p-4 space-y-4 transition-all
      ${enabled
        ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-300 dark:border-green-700'
        : 'bg-white/60 dark:bg-gray-800/60 border-2 border-dashed border-purple-200 dark:border-purple-800'
      }
    `}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            ${enabled ? 'bg-green-500' : 'bg-purple-100'}
          `}>
            <span className="text-2xl">🎲</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Random Farts</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Surprise farts throughout the day!</p>
          </div>
        </div>
        <button
          onClick={() => updateRandomFarts({ enabled: !enabled })}
          className={`toggle-switch ${enabled ? 'active' : ''}`}
        />
      </div>

      {/* When enabled, show settings */}
      {enabled && (
        <div className="space-y-4 pt-2">
          {/* Next fart countdown */}
          {getNextFartTimeDisplay() && (
            <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
              <Clock size={18} className="text-green-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Next surprise: {getNextFartTimeDisplay()}
              </span>
            </div>
          )}

          {/* Interval sliders */}
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Min wait time</span>
                <span className="font-medium text-green-600 dark:text-green-400">{minInterval} min</span>
              </div>
              <input
                type="range"
                min={1}
                max={120}
                value={minInterval}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  updateRandomFarts({ minInterval: val });
                }}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Max wait time</span>
                <span className="font-medium text-green-600 dark:text-green-400">{maxInterval} min</span>
              </div>
              <input
                type="range"
                min={1}
                max={240}
                value={maxInterval}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  updateRandomFarts({ maxInterval: val });
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Sound Selection */}
          <div className="space-y-3">
            <button
              onClick={() => setShowSoundPicker(!showSoundPicker)}
              className="w-full p-3 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Shuffle size={18} className="text-purple-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Which farts can play?
                </span>
              </div>
              <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                {selectedSounds.length} selected
              </span>
            </button>

            {showSoundPicker && (
              <div className="bg-white dark:bg-gray-700 rounded-xl p-3 space-y-3 shadow-sm">
                {/* Quick select buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="flex-1 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={selectNone}
                    className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                  >
                    Clear
                  </button>
                </div>

                {/* Sound grid */}
                <div className="grid grid-cols-3 gap-2">
                  {allSounds.map((sound) => {
                    const isSelected = selectedSounds.includes(sound.id);
                    return (
                      <button
                        key={sound.id}
                        onClick={() => toggleSound(sound.id)}
                        className={`
                          relative p-2 rounded-xl flex flex-col items-center gap-1 transition-all
                          ${isSelected
                            ? 'bg-green-100 dark:bg-green-900/50 ring-2 ring-green-500'
                            : 'bg-gray-50 dark:bg-gray-600 opacity-50 hover:opacity-75'
                          }
                        `}
                      >
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                        <span className="text-2xl">{sound.emoji}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-300 truncate w-full text-center">
                          {sound.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* When disabled, show invitation */}
      {!enabled && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
          Turn on to get surprised with random farts! 🎉
        </p>
      )}
    </div>
  );
}

export default RandomFarts;
