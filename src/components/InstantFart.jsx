import React, { useState, useCallback } from 'react';
import { Mic, X, Volume2, Trophy, Flame, Lock } from 'lucide-react';
import useStore, { FREE_TRIAL_LIMIT } from '../stores/useStore';
import { playFartSound, playRandomFartSound, playCustomSound, getBuiltInSounds } from '../utils/audioEngine';
import RecordingModal from './RecordingModal';
import RandomFarts from './RandomFarts';
import { deleteCustomSound, getCustomSound } from '../utils/storage';
import { hapticsMedium, hapticsLight } from '../utils/haptics';

const MAX_CUSTOM_SOUNDS = 20;

const ACHIEVEMENTS = {
  first_10: { name: 'Getting Started', emoji: '🎉', description: '10 farts!' },
  century: { name: 'Century Club', emoji: '💯', description: '100 farts!' },
  fart_master: { name: 'Fart Master', emoji: '🏆', description: '500 farts!' },
  legendary: { name: 'Legendary', emoji: '👑', description: '1000 farts!' },
  week_streak: { name: 'Week Warrior', emoji: '🔥', description: '7 day streak!' },
};

function InstantFart({ customSounds, onCustomSoundsChange, onShowPaywall }) {
  const [isPressed, setIsPressed] = useState(false);
  const [showRecording, setShowRecording] = useState(false);
  const [playingSound, setPlayingSound] = useState(null);
  const [hoveredCustom, setHoveredCustom] = useState(null);
  const [showAchievement, setShowAchievement] = useState(null);

  const { settings = {}, selectedSound = 'classic', setSelectedSound, stats = {}, isPremium, incrementFartCount } = useStore();
  const builtInSounds = getBuiltInSounds();

  // Safe stats defaults
  const totalFarts = stats.totalFarts ?? 0;
  const currentStreak = stats.currentStreak ?? 0;
  const achievements = stats.achievements ?? [];

  // Check trial status
  const isTrialEnded = !isPremium && totalFarts >= FREE_TRIAL_LIMIT;

  const handleFartPress = useCallback(async () => {
    // Check if trial ended
    if (isTrialEnded) {
      if (onShowPaywall) onShowPaywall();
      return;
    }

    setIsPressed(true);
    hapticsMedium(); // Haptic feedback on iOS/Android
    const previousAchievements = [...achievements];

    try {
      if (settings.randomize) {
        await playRandomFartSound(settings.volume);
      } else if (selectedSound.startsWith('custom_')) {
        const sound = await getCustomSound(selectedSound);
        if (sound?.audioBlob) {
          await playCustomSound(sound.audioBlob, settings.volume);
        }
      } else {
        await playFartSound(selectedSound, settings.volume);
      }

      incrementFartCount();

      // Check for new achievements
      setTimeout(() => {
        const currentStats = useStore.getState().stats;
        const newAchievements = currentStats.achievements.filter(
          (a) => !previousAchievements.includes(a)
        );
        if (newAchievements.length > 0) {
          setShowAchievement(newAchievements[0]);
          setTimeout(() => setShowAchievement(null), 3000);
        }
      }, 100);
    } catch (error) {
      console.error('Error playing sound:', error);
    }

    setTimeout(() => setIsPressed(false), 150);
  }, [settings, selectedSound, achievements, incrementFartCount, isTrialEnded, onShowPaywall]);

  const handleSoundSelect = useCallback(async (soundId) => {
    setSelectedSound(soundId);
    setPlayingSound(soundId);
    hapticsLight(); // Light haptic on sound selection

    try {
      if (soundId.startsWith('custom_')) {
        const sound = await getCustomSound(soundId);
        if (sound?.audioBlob) {
          await playCustomSound(sound.audioBlob, settings.volume);
        }
      } else {
        await playFartSound(soundId, settings.volume);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }

    setTimeout(() => setPlayingSound(null), 500);
  }, [settings.volume, setSelectedSound]);

  const handleDeleteCustomSound = useCallback(async (id, e) => {
    e.stopPropagation();
    if (confirm('Delete this custom fart?')) {
      await deleteCustomSound(id);
      onCustomSoundsChange();
      if (selectedSound === id) {
        setSelectedSound('classic');
      }
    }
  }, [selectedSound, setSelectedSound, onCustomSoundsChange]);

  const handleRecordingComplete = useCallback(() => {
    setShowRecording(false);
    onCustomSoundsChange();
  }, [onCustomSoundsChange]);

  const canRecordMore = customSounds.length < MAX_CUSTOM_SOUNDS;

  return (
    <div className="p-4 space-y-6 dark:text-white">
      {/* Achievement Popup */}
      {showAchievement && ACHIEVEMENTS[showAchievement] && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <span className="text-4xl">{ACHIEVEMENTS[showAchievement].emoji}</span>
            <div>
              <p className="font-bold text-lg">{ACHIEVEMENTS[showAchievement].name}</p>
              <p className="text-white/80 text-sm">{ACHIEVEMENTS[showAchievement].description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
          <span className="text-xl">💨</span>
          <span className="font-bold text-purple-700 dark:text-purple-300">{totalFarts}</span>
        </div>
        {currentStreak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/50">
            <Flame size={20} className="text-orange-500" />
            <span className="font-bold text-orange-700 dark:text-orange-300">{currentStreak} day streak</span>
          </div>
        )}
        {achievements.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/50">
            <Trophy size={20} className="text-yellow-600" />
            <span className="font-bold text-yellow-700 dark:text-yellow-300">{achievements.length}</span>
          </div>
        )}
      </div>

      {/* Giant Fart Button */}
      <div className="flex flex-col items-center">
        <button
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          onClick={handleFartPress}
          className={`
            w-48 h-48 rounded-full
            bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500
            fart-button-glow
            flex items-center justify-center
            transition-all duration-150 ease-out
            ${isPressed ? 'scale-90' : 'scale-100 hover:scale-105'}
          `}
        >
          <span className="text-[100px] select-none" style={{ lineHeight: 1 }}>
            💨
          </span>
        </button>
        <p className="mt-4 text-lg font-semibold text-gray-600 dark:text-gray-300">
          Tap to Fart!
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">Press Space for quick fart</p>
      </div>

      {/* Sound Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
          <Volume2 size={20} className="text-purple-500" />
          <h2 className="font-bold text-lg">Choose Your Fart</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Built-in sounds */}
          {builtInSounds.map((sound) => (
            <button
              key={sound.id}
              onClick={() => handleSoundSelect(sound.id)}
              className={`
                sound-item p-3 rounded-2xl glass-card
                flex flex-col items-center gap-1
                ${selectedSound === sound.id
                  ? 'ring-2 ring-purple-500 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50'
                  : 'hover:bg-purple-50 dark:hover:bg-gray-700'
                }
                ${playingSound === sound.id ? 'scale-95' : ''}
              `}
            >
              <span className="text-4xl">{sound.emoji}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                {sound.name}
              </span>
            </button>
          ))}

          {/* Custom sounds */}
          {customSounds.map((sound) => (
            <button
              key={sound.id}
              onClick={() => handleSoundSelect(sound.id)}
              onMouseEnter={() => setHoveredCustom(sound.id)}
              onMouseLeave={() => setHoveredCustom(null)}
              className={`
                sound-item p-3 rounded-2xl glass-card relative
                flex flex-col items-center gap-1
                ${selectedSound === sound.id
                  ? 'ring-2 ring-purple-500 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50'
                  : 'hover:bg-purple-50 dark:hover:bg-gray-700'
                }
                ${playingSound === sound.id ? 'scale-95' : ''}
              `}
            >
              {/* Delete button */}
              {hoveredCustom === sound.id && (
                <button
                  onClick={(e) => handleDeleteCustomSound(sound.id, e)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
              <span className="text-4xl">🎤</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center truncate w-full">
                {sound.name || 'Custom'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Record Button */}
      <button
        onClick={() => canRecordMore && setShowRecording(true)}
        disabled={!canRecordMore}
        className={`
          w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all btn-press
          ${canRecordMore
            ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-xl'
            : 'bg-gray-400 cursor-not-allowed'
          }
        `}
      >
        <Mic size={24} />
        {canRecordMore
          ? `Record Custom Fart (${customSounds.length}/${MAX_CUSTOM_SOUNDS})`
          : `Max ${MAX_CUSTOM_SOUNDS} Custom Sounds`
        }
      </button>

      {/* Random Farts Feature - Prominent placement! */}
      <RandomFarts customSounds={customSounds} />

      {/* Recording Modal */}
      {showRecording && (
        <RecordingModal
          onClose={() => setShowRecording(false)}
          onComplete={handleRecordingComplete}
        />
      )}
    </div>
  );
}

export default InstantFart;
