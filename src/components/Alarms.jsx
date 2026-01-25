import React, { useState, useCallback } from 'react';
import { Plus, Clock, Trash2, ChevronDown } from 'lucide-react';
import useStore from '../stores/useStore';
import { getBuiltInSounds } from '../utils/audioEngine';

const REPEAT_OPTIONS = [
  { id: 'once', label: 'Once', emoji: '1️⃣' },
  { id: 'daily', label: 'Daily', emoji: '📅' },
  { id: 'weekdays', label: 'Weekdays', emoji: '💼' },
  { id: 'weekends', label: 'Weekends', emoji: '🎉' },
];

function AlarmCard({ alarm, customSounds, onUpdate, onDelete, onToggle }) {
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);

  const builtInSounds = getBuiltInSounds();
  const allSounds = [
    ...builtInSounds,
    ...customSounds.map((s) => ({ ...s, emoji: '🎤' })),
  ];

  const currentSound = allSounds.find((s) => s.id === alarm.sound) || builtInSounds[0];
  const currentRepeat = REPEAT_OPTIONS.find((r) => r.id === alarm.repeat) || REPEAT_OPTIONS[0];

  const handleTimeChange = (e) => {
    onUpdate(alarm.id, { time: e.target.value });
  };

  const handleNameChange = (e) => {
    onUpdate(alarm.id, { name: e.target.value });
  };

  // When dropdown is open, raise the card above other cards
  const isDropdownOpen = showSoundPicker || showRepeatPicker;

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

        {/* Sound setting */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSoundPicker(!showSoundPicker);
              setShowRepeatPicker(false);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-pink-100 text-pink-700 text-sm font-medium hover:bg-pink-200 transition-colors"
          >
            <span>{currentSound.emoji}</span>
            <span>{currentSound.name}</span>
            <ChevronDown size={14} />
          </button>

          {showSoundPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-[100] min-w-[160px] max-h-48 overflow-auto">
              {allSounds.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => {
                    onUpdate(alarm.id, { sound: sound.id });
                    setShowSoundPicker(false);
                  }}
                  className={`
                    w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors
                    ${alarm.sound === sound.id ? 'bg-pink-100 dark:bg-pink-900/50' : ''}
                  `}
                >
                  <span>{sound.emoji}</span>
                  <span className="text-sm truncate text-gray-700 dark:text-gray-200">{sound.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={() => {
            if (confirm('Delete this alarm?')) {
              onDelete(alarm.id);
            }
          }}
          className="ml-auto p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

function Alarms({ customSounds }) {
  const { alarms, addAlarm, updateAlarm, removeAlarm, toggleAlarm } = useStore();

  const handleAddAlarm = useCallback(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const newAlarm = {
      id: `alarm_${Date.now()}`,
      name: 'New Fart Alarm',
      time: `${hours}:${minutes}`,
      repeat: 'once',
      sound: 'classic',
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
          <p className="text-gray-300 dark:text-gray-500 text-sm text-center">
            Add an alarm to get surprised by farts at scheduled times!
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
            />
          ))}
        </div>
      )}

      {/* Info text */}
      {alarms.length > 0 && (
        <p className="text-center text-gray-400 text-sm pt-4">
          Alarms work even when the app is minimized to tray 🎉
        </p>
      )}
    </div>
  );
}

export default Alarms;
