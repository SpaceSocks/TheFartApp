import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, ChevronUp, ChevronDown, Volume2 } from 'lucide-react';
import useStore from '../stores/useStore';
import { playFartSound, playRandomFartSound, playCustomSound, getBuiltInSounds } from '../utils/audioEngine';
import { getCustomSound, getAllCustomSounds } from '../utils/storage';

// Number input with up/down buttons
function TimeInput({ value = 0, onChange, max, label }) {
  const safeValue = value || 0;
  const increment = () => onChange(Math.min(safeValue + 1, max));
  const decrement = () => onChange(Math.max(safeValue - 1, 0));

  const handleInput = (e) => {
    const val = parseInt(e.target.value) || 0;
    onChange(Math.min(Math.max(val, 0), max));
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={increment}
        className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors btn-press"
      >
        <ChevronUp size={24} className="text-purple-500" />
      </button>
      <div className="relative">
        <input
          type="number"
          value={safeValue.toString().padStart(2, '0')}
          onChange={handleInput}
          min={0}
          max={max}
          className="w-20 h-20 text-center text-4xl font-bold gradient-text bg-white/80 dark:bg-gray-700/80 rounded-2xl border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 outline-none"
        />
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 dark:text-gray-500 font-medium">
          {label}
        </span>
      </div>
      <button
        onClick={decrement}
        className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors btn-press mt-6"
      >
        <ChevronDown size={24} className="text-purple-500" />
      </button>
    </div>
  );
}

function Timer() {
  const {
    timer = {},
    settings = {},
    setTimerTime,
    setTimerSound,
    setTimerRunning,
    setTimerRemaining,
    resetTimer,
    incrementFartCount,
  } = useStore();

  // Safe defaults for timer values
  const hours = timer.hours ?? 0;
  const minutes = timer.minutes ?? 1;
  const seconds = timer.seconds ?? 0;
  const isRunning = timer.isRunning ?? false;
  const remainingSeconds = timer.remainingSeconds ?? 60;
  const timerSound = timer.sound ?? 'classic';

  const [customSounds, setCustomSounds] = useState([]);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const intervalRef = useRef(null);
  const builtInSounds = getBuiltInSounds();

  // Load custom sounds
  useEffect(() => {
    const loadSounds = async () => {
      try {
        const sounds = await getAllCustomSounds();
        setCustomSounds(sounds || []);
      } catch (err) {
        console.error('Failed to load custom sounds:', err);
        setCustomSounds([]);
      }
    };
    loadSounds();
  }, []);

  const allSounds = [
    ...builtInSounds,
    ...customSounds.map((s) => ({ ...s, emoji: '🎤' })),
  ];

  const currentSound = allSounds.find((s) => s.id === timerSound) || builtInSounds[0];

  // Timer logic
  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerRemaining(remainingSeconds - 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, remainingSeconds, setTimerRemaining]);

  // Handle timer completion
  useEffect(() => {
    if (isRunning && remainingSeconds <= 0) {
      // Stop timer
      setTimerRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Play fart sound
      const playSound = async () => {
        const soundId = settings.randomize ? null : timerSound;
        const volume = settings.volume ?? 1.0;

        try {
          if (settings.randomize) {
            await playRandomFartSound(volume);
          } else if (soundId?.startsWith('custom_')) {
            const sound = await getCustomSound(soundId);
            if (sound?.audioBlob) {
              await playCustomSound(sound.audioBlob, volume);
            }
          } else {
            await playFartSound(soundId || 'classic', volume);
          }

          if (incrementFartCount) incrementFartCount();

          // Handle repeat mode
          if (settings.repeatMode?.enabled) {
            const count = settings.repeatMode.type === 'infinite' ? 50 : (settings.repeatMode.count || 3) - 1;
            for (let i = 0; i < count; i++) {
              await new Promise((r) => setTimeout(r, 1000));
              if (settings.randomize) {
                await playRandomFartSound(volume);
              } else if (soundId?.startsWith('custom_')) {
                const sound = await getCustomSound(soundId);
                if (sound?.audioBlob) {
                  await playCustomSound(sound.audioBlob, volume);
                }
              } else {
                await playFartSound(soundId || 'classic', volume);
              }
              if (incrementFartCount) incrementFartCount();
            }
          }
        } catch (err) {
          console.error('Error playing sound:', err);
        }
      };

      playSound();

      // Reset timer to original duration
      setTimeout(() => {
        if (resetTimer) resetTimer();
      }, 500);
    }
  }, [isRunning, remainingSeconds, timerSound, settings, setTimerRunning, resetTimer, incrementFartCount]);

  const handleStart = useCallback(() => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds > 0) {
      setTimerRemaining(totalSeconds);
      setTimerRunning(true);
    }
  }, [hours, minutes, seconds, setTimerRemaining, setTimerRunning]);

  const handleStop = useCallback(() => {
    setTimerRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (resetTimer) resetTimer();
  }, [setTimerRunning, resetTimer]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="p-4 space-y-6 dark:text-white">
      {/* Timer Display (when running) */}
      {isRunning ? (
        <div className="flex flex-col items-center pt-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-900 dark:to-pink-900 opacity-50 blur-xl" />
            <div className="relative w-64 h-64 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-2xl flex items-center justify-center border-4 border-purple-100 dark:border-purple-800">
              <div className="text-center">
                <span className="text-5xl font-bold gradient-text">
                  {formatTime(remainingSeconds)}
                </span>
                <p className="text-purple-400 font-medium mt-2 animate-pulse">
                  Counting down...
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <span className="text-4xl opacity-50">💨</span>
            <span className="text-5xl">⏱️</span>
            <span className="text-4xl opacity-50">💨</span>
          </div>
        </div>
      ) : (
        <>
          {/* Time Picker */}
          <div className="flex flex-col items-center pt-4">
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Set Timer Duration</h2>
            <div className="flex items-center gap-2">
              <TimeInput
                value={hours}
                onChange={(h) => setTimerTime(h, minutes, seconds)}
                max={99}
                label="Hours"
              />
              <span className="text-4xl font-bold text-purple-300 mt-[-24px]">:</span>
              <TimeInput
                value={minutes}
                onChange={(m) => setTimerTime(hours, m, seconds)}
                max={59}
                label="Min"
              />
              <span className="text-4xl font-bold text-purple-300 mt-[-24px]">:</span>
              <TimeInput
                value={seconds}
                onChange={(s) => setTimerTime(hours, minutes, s)}
                max={59}
                label="Sec"
              />
            </div>
          </div>

          {/* Sound Picker */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <Volume2 size={18} className="text-purple-500" />
              <span className="font-medium text-sm">Sound when timer ends:</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowSoundPicker(!showSoundPicker)}
                className="w-full p-3 rounded-xl bg-white/80 dark:bg-gray-700/80 border-2 border-purple-200 dark:border-purple-800 flex items-center justify-between hover:border-purple-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentSound?.emoji || '💨'}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200">{currentSound?.name || 'Classic'}</span>
                </div>
                <ChevronDown size={20} className="text-purple-500" />
              </button>

              {showSoundPicker && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 rounded-xl shadow-xl border border-gray-100 dark:border-gray-600 py-1 z-20 max-h-60 overflow-auto">
                  {allSounds.map((sound) => (
                    <button
                      key={sound.id}
                      onClick={() => {
                        setTimerSound(sound.id);
                        setShowSoundPicker(false);
                      }}
                      className={`
                        w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors
                        ${timerSound === sound.id ? 'bg-purple-100 dark:bg-purple-900/50' : ''}
                      `}
                    >
                      <span className="text-2xl">{sound.emoji}</span>
                      <span className="font-medium dark:text-gray-200">{sound.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Start/Stop Button */}
      {!isRunning ? (
        <button
          onClick={handleStart}
          disabled={hours === 0 && minutes === 0 && seconds === 0}
          className={`
            w-full py-5 rounded-2xl text-white font-bold text-xl flex items-center justify-center gap-3 shadow-lg transition-all btn-press
            ${hours === 0 && minutes === 0 && seconds === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-xl'
            }
          `}
        >
          <Play size={28} fill="currentColor" />
          Start Timer
        </button>
      ) : (
        <button
          onClick={handleStop}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all btn-press"
        >
          <Square size={28} fill="currentColor" />
          Stop
        </button>
      )}

      {/* Quick presets */}
      {!isRunning && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">Quick presets:</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {[
              { label: '30s', h: 0, m: 0, s: 30 },
              { label: '1m', h: 0, m: 1, s: 0 },
              { label: '5m', h: 0, m: 5, s: 0 },
              { label: '10m', h: 0, m: 10, s: 0 },
              { label: '30m', h: 0, m: 30, s: 0 },
              { label: '1h', h: 1, m: 0, s: 0 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => setTimerTime(preset.h, preset.m, preset.s)}
                className="px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors btn-press"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info text */}
      <p className="text-center text-gray-400 dark:text-gray-500 text-sm">
        When the timer ends, a fart will sound! 💨
      </p>
    </div>
  );
}

export default Timer;
