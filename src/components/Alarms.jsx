import React, { useState, useCallback } from 'react';
import { Plus, Clock, Trash2, ChevronDown, ChevronUp, Check, Play } from 'lucide-react';
import useStore from '../stores/useStore';
import { getBuiltInSounds } from '../utils/audioEngine';

const REPEAT_OPTIONS = [
  { id: 'once', label: 'Once', emoji: '1' },
  { id: 'daily', label: 'Daily', emoji: '📅' },
  { id: 'weekdays', label: 'Weekdays', emoji: '💼' },
  { id: 'weekends', label: 'Weekends', emoji: '🎉' },
];

const SOUND_MODES = [
  { id: 'specific', label: 'Single Sound', emoji: '🎯' },
  { id: 'selected', label: 'Pick Sounds', emoji: '✅' },
  { id: 'random', label: 'Random All', emoji: '🎲' },
];

const DURATION_PRESETS = [
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 120, label: '2m' },
  { value: 180, label: '3m' },
  { value: 300, label: '5m' },
];

function SoundMultiPicker({ selectedSounds, onToggleSound, customSounds }) {
  const builtInSounds = getBuiltInSounds();
  const allSounds = [
    ...builtInSounds,
    ...customSounds.map((s) => ({ ...s, emoji: '🎤' })),
  ];

  const isSelected = (soundId) => selectedSounds.includes(soundId);

  return (
    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-2 max-h-48 overflow-auto">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Select sounds to play (at least one):
      </p>
      <div className="grid grid-cols-2 gap-2">
        {allSounds.map((sound) => (
          <button
            key={sound.id}
            onClick={() => onToggleSound(sound.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all
              ${isSelected(sound.id)
                ? 'bg-purple-500 text-white'
                : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-gray-500'
              }
            `}
          >
            <span className="text-lg">{sound.emoji}</span>
            <span className="truncate flex-1">{sound.name}</span>
            {isSelected(sound.id) && <Check size={16} />}
          </button>
        ))}
      </div>
    </div>
  );
}

function AlarmCard({ alarm, customSounds, onUpdate, onDelete, onToggle, onTest }) {
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showSoundModePicker, setShowSoundModePicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const builtInSounds = getBuiltInSounds();
  const allSounds = [
    ...builtInSounds,
    ...customSounds.map((s) => ({ ...s, emoji: '🎤' })),
  ];

  const currentSound = allSounds.find((s) => s.id === alarm.sound) || builtInSounds[0];
  const currentRepeat = REPEAT_OPTIONS.find((r) => r.id === alarm.repeat) || REPEAT_OPTIONS[0];
  const currentSoundMode = SOUND_MODES.find((m) => m.id === alarm.soundMode) || SOUND_MODES[0];

  // Initialize defaults if not set
  const soundMode = alarm.soundMode || 'specific';
  const selectedSounds = alarm.selectedSounds || ['classic'];
  const duration = alarm.duration || 120;
  const gapBetweenSounds = alarm.gapBetweenSounds ?? 1;

  const handleTimeChange = (e) => {
    onUpdate(alarm.id, { time: e.target.value });
  };

  const handleNameChange = (e) => {
    onUpdate(alarm.id, { name: e.target.value });
  };

  const handleToggleSelectedSound = (soundId) => {
    const current = selectedSounds;
    let newSelected;

    if (current.includes(soundId)) {
      // Don't allow removing last sound
      if (current.length === 1) return;
      newSelected = current.filter(id => id !== soundId);
    } else {
      newSelected = [...current, soundId];
    }

    onUpdate(alarm.id, { selectedSounds: newSelected });
  };

  const handleDurationChange = (newDuration) => {
    onUpdate(alarm.id, { duration: newDuration });
  };

  const handleGapChange = (e) => {
    onUpdate(alarm.id, { gapBetweenSounds: parseFloat(e.target.value) });
  };

  // Close all dropdowns when clicking outside
  const closeAllDropdowns = () => {
    setShowSoundPicker(false);
    setShowRepeatPicker(false);
    setShowSoundModePicker(false);
  };

  // When dropdown is open, raise the card above other cards
  const isDropdownOpen = showSoundPicker || showRepeatPicker || showSoundModePicker;

  // Get label for selected sounds
  const getSelectedSoundsLabel = () => {
    if (soundMode === 'specific') {
      return currentSound.name;
    } else if (soundMode === 'random') {
      return 'All Sounds';
    } else {
      const count = selectedSounds.length;
      if (count === 1) {
        const sound = allSounds.find(s => s.id === selectedSounds[0]);
        return sound?.name || '1 sound';
      }
      return `${count} sounds`;
    }
  };

  return (
    <div className={`glass-card rounded-2xl p-4 space-y-3 shadow-lg relative ${isDropdownOpen ? 'z-50' : 'z-0'}`}>
      {/* Top row: Name and Toggle */}
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={alarm.name}
          onChange={handleNameChange}
          className="flex-1 bg-transparent font-bold text-gray-800 dark:text-white text-lg outline-none focus:bg-purple-50 dark:focus:bg-purple-900/30 rounded-lg px-2 py-1 -ml-2 transition-colors"
          placeholder="Alarm name"
        />
        <button
          onClick={() => onToggle(alarm.id)}
          className={`toggle-switch ${alarm.enabled ? 'active' : ''}`}
          aria-label={alarm.enabled ? 'Disable alarm' : 'Enable alarm'}
        />
      </div>

      {/* Time picker */}
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={alarm.time}
          onChange={handleTimeChange}
          className="text-4xl font-bold gradient-text bg-transparent outline-none cursor-pointer"
        />
      </div>

      {/* Settings row */}
      <div className="flex gap-2 flex-wrap">
        {/* Repeat setting */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRepeatPicker(!showRepeatPicker);
              setShowSoundPicker(false);
              setShowSoundModePicker(false);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200 transition-colors"
          >
            <span>{currentRepeat.emoji}</span>
            <span>{currentRepeat.label}</span>
            <ChevronDown size={14} />
          </button>

          {showRepeatPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-[100] min-w-[140px]">
              {REPEAT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onUpdate(alarm.id, { repeat: option.id });
                    setShowRepeatPicker(false);
                  }}
                  className={`
                    w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors
                    ${alarm.repeat === option.id ? 'bg-purple-100 dark:bg-purple-900/50' : ''}
                  `}
                >
                  <span>{option.emoji}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-200">{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sound mode setting */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSoundModePicker(!showSoundModePicker);
              setShowSoundPicker(false);
              setShowRepeatPicker(false);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-pink-100 text-pink-700 text-sm font-medium hover:bg-pink-200 transition-colors"
          >
            <span>{currentSoundMode.emoji}</span>
            <span>{getSelectedSoundsLabel()}</span>
            <ChevronDown size={14} />
          </button>

          {showSoundModePicker && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-[100] min-w-[180px]">
              {SOUND_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    onUpdate(alarm.id, { soundMode: mode.id });
                    if (mode.id !== 'selected') {
                      setShowSoundModePicker(false);
                    }
                  }}
                  className={`
                    w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors
                    ${soundMode === mode.id ? 'bg-pink-100 dark:bg-pink-900/50' : ''}
                  `}
                >
                  <span>{mode.emoji}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-200">{mode.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Single sound picker (only when mode is 'specific') */}
        {soundMode === 'specific' && (
          <div className="relative">
            <button
              onClick={() => {
                setShowSoundPicker(!showSoundPicker);
                setShowRepeatPicker(false);
                setShowSoundModePicker(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-medium hover:bg-orange-200 transition-colors"
            >
              <span>{currentSound.emoji}</span>
              <span>Change</span>
              <ChevronDown size={14} />
            </button>

            {showSoundPicker && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-[100] min-w-[160px] max-h-48 overflow-auto">
                {allSounds.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => {
                      onUpdate(alarm.id, { sound: sound.id });
                      setShowSoundPicker(false);
                    }}
                    className={`
                      w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors
                      ${alarm.sound === sound.id ? 'bg-orange-100 dark:bg-orange-900/50' : ''}
                    `}
                  >
                    <span>{sound.emoji}</span>
                    <span className="text-sm truncate text-gray-700 dark:text-gray-200">{sound.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Test button */}
        <button
          onClick={() => onTest(alarm)}
          className="ml-auto p-2 rounded-full text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
          title="Test alarm"
        >
          <Play size={18} />
        </button>

        {/* Delete button */}
        <button
          onClick={() => {
            if (confirm('Delete this alarm?')) {
              onDelete(alarm.id);
            }
          }}
          className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Multi-sound picker (when mode is 'selected') */}
      {soundMode === 'selected' && (
        <SoundMultiPicker
          selectedSounds={selectedSounds}
          onToggleSound={handleToggleSelectedSound}
          customSounds={customSounds}
        />
      )}

      {/* Advanced settings toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-1"
      >
        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <span>{showAdvanced ? 'Hide' : 'Show'} Duration Settings</span>
      </button>

      {/* Advanced settings */}
      {showAdvanced && (
        <div className="space-y-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Alarm Duration
            </label>
            <div className="flex gap-2 flex-wrap">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleDurationChange(preset.value)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${duration === preset.value
                      ? 'bg-purple-500 text-white'
                      : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-gray-500'
                    }
                  `}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {/* Custom duration input */}
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={duration}
                onChange={(e) => handleDurationChange(Math.max(10, Math.min(600, parseInt(e.target.value) || 60)))}
                className="w-20 px-3 py-2 rounded-lg bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm"
                min="10"
                max="600"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">seconds (max 10 min)</span>
            </div>
          </div>

          {/* Gap between sounds */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gap Between Farts: {gapBetweenSounds}s
            </label>
            <input
              type="range"
              value={gapBetweenSounds}
              onChange={handleGapChange}
              min="0"
              max="5"
              step="0.5"
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>No gap</span>
              <span>5 seconds</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Alarms({ customSounds }) {
  const { alarms, addAlarm, updateAlarm, removeAlarm, toggleAlarm, setActiveAlarm } = useStore();

  const handleTestAlarm = useCallback((alarm) => {
    // Create a test version with short duration
    const testAlarm = {
      ...alarm,
      duration: 10, // 10 seconds for testing
      name: alarm.name + ' (Test)',
    };
    setActiveAlarm(testAlarm);
  }, [setActiveAlarm]);

  const handleAddAlarm = useCallback(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // Get all built-in sounds for default selection
    const builtInSounds = getBuiltInSounds();
    const allSoundIds = builtInSounds.map(s => s.id);

    const newAlarm = {
      id: `alarm_${Date.now()}`,
      name: 'Wake Up Fart',
      time: `${hours}:${minutes}`,
      repeat: 'once',
      sound: 'classic',
      soundMode: 'random', // Default to random for variety
      selectedSounds: allSoundIds, // All built-in sounds selected by default
      duration: 120, // 2 minutes default
      gapBetweenSounds: 1, // 1 second gap after each fart
      enabled: true,
      lastTriggered: null,
    };

    addAlarm(newAlarm);
  }, [addAlarm]);

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Add Alarm Button */}
      <button
        onClick={handleAddAlarm}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all btn-press"
      >
        <Plus size={24} />
        Add Fart Alarm
      </button>

      {/* Alarms List */}
      {alarms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Clock size={48} className="text-gray-300 dark:text-gray-500" />
          </div>
          <p className="text-gray-400 dark:text-gray-400 text-lg">No alarms yet</p>
          <p className="text-gray-300 dark:text-gray-500 text-sm text-center px-8">
            Add a fart alarm to wake up to the sweet sounds of flatulence every morning!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alarms.map((alarm) => (
            <AlarmCard
              key={alarm.id}
              alarm={alarm}
              customSounds={customSounds}
              onUpdate={updateAlarm}
              onDelete={removeAlarm}
              onToggle={toggleAlarm}
              onTest={handleTestAlarm}
            />
          ))}
        </div>
      )}

      {/* Info text */}
      {alarms.length > 0 && (
        <div className="text-center text-gray-400 text-sm pt-4 space-y-1">
          <p>Alarms will ring for the set duration (default 2 min)</p>
          <p>Each fart plays with a gap before the next one 💨</p>
        </div>
      )}
    </div>
  );
}

export default Alarms;
