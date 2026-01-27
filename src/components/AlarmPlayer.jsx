import React, { useState, useEffect, useRef } from 'react';
import { X, Moon, Volume2 } from 'lucide-react';
import useStore from '../stores/useStore';
import { playFartSound, playCustomSound, stopCurrentSound, getBuiltInSounds } from '../utils/audioEngine';
import { getCustomSound } from '../utils/storage';

const SNOOZE_MINUTES = [5, 10, 15];

function AlarmPlayer({ alarm, customSounds, onStop, onSnooze }) {
  const { settings } = useStore();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [currentSound, setCurrentSound] = useState('Starting...');
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [loopStarted, setLoopStarted] = useState(false);
  const stopRequestedRef = useRef(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  // Get available sounds
  const getAvailableSounds = () => {
    const builtInSounds = getBuiltInSounds();
    const soundMode = alarm.soundMode || 'random';

    if (soundMode === 'specific') {
      return [alarm.sound || 'classic'];
    } else if (soundMode === 'random') {
      const allSoundIds = builtInSounds.map(s => s.id);
      const customSoundIds = (customSounds || []).map(s => s.id);
      return [...allSoundIds, ...customSoundIds];
    } else if (soundMode === 'selected') {
      return alarm.selectedSounds?.length > 0 ? alarm.selectedSounds : ['classic'];
    }
    return ['classic'];
  };

  // Start the alarm sound loop
  const startAlarmLoop = async () => {
    const duration = (alarm.duration || 120) * 1000;
    const gapBetweenSounds = (alarm.gapBetweenSounds ?? 1) * 1000;
    const volume = settings.volume || 0.8;
    const availableSounds = getAvailableSounds();
    const soundMode = alarm.soundMode || 'random';

    stopRequestedRef.current = false;
    setLoopStarted(true);
    setAudioBlocked(false);

    console.log('Starting alarm loop', { duration: duration/1000 + 's', gap: gapBetweenSounds/1000 + 's', sounds: availableSounds });

    // Try to play first sound to check if audio is blocked
    try {
      const testResult = await playFartSound('classic', volume);
      if (testResult === 0) {
        console.log('Audio might be blocked');
        setAudioBlocked(true);
        setLoopStarted(false);
        return;
      }
    } catch (e) {
      console.log('Audio blocked by browser:', e);
      setAudioBlocked(true);
      setLoopStarted(false);
      return;
    }

    let soundIndex = 0;

    while (!stopRequestedRef.current) {
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed >= duration) {
        console.log('Alarm duration completed');
        onStop();
        break;
      }

      // Pick next sound
      let soundId;
      if (soundMode === 'random') {
        soundId = availableSounds[Math.floor(Math.random() * availableSounds.length)];
      } else {
        soundId = availableSounds[soundIndex % availableSounds.length];
        soundIndex++;
      }

      setCurrentSound(soundId);
      console.log('Playing:', soundId);

      try {
        if (soundId.startsWith('custom_')) {
          const customSound = await getCustomSound(soundId);
          if (customSound?.audioBlob) {
            await playCustomSound(customSound.audioBlob, volume);
          } else {
            await playFartSound('classic', volume);
          }
        } else {
          await playFartSound(soundId, volume);
        }
      } catch (error) {
        console.error('Error playing sound:', error);
      }

      // Wait gap between sounds
      if (!stopRequestedRef.current && gapBetweenSounds > 0) {
        await new Promise(resolve => setTimeout(resolve, gapBetweenSounds));
      }
    }
  };

  // Timer for elapsed display
  useEffect(() => {
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // Auto-start the loop
    startAlarmLoop();

    return () => {
      stopRequestedRef.current = true;
      stopCurrentSound();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [alarm.id]);

  const handleStop = () => {
    console.log('Stop button pressed');
    stopRequestedRef.current = true;
    stopCurrentSound();
    onStop();
  };

  const handleSnooze = (minutes) => {
    console.log('Snooze button pressed:', minutes, 'minutes');
    stopRequestedRef.current = true;
    stopCurrentSound();
    onSnooze(minutes);
    setShowSnoozeOptions(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingSeconds = Math.max(0, (alarm.duration || 120) - elapsedSeconds);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-3xl p-8 mx-4 max-w-sm w-full shadow-2xl animate-bounce-gentle">
        {/* Alarm icon */}
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center animate-wiggle">
            <Volume2 size={48} className="text-white" />
          </div>
        </div>

        {/* Alarm name */}
        <h2 className="text-3xl font-bold text-white text-center mb-2">
          {alarm.name || 'Fart Alarm'}
        </h2>

        {/* Time */}
        <p className="text-xl text-white/80 text-center mb-2">
          {alarm.time}
        </p>

        {/* Current sound playing */}
        <p className="text-sm text-white/50 text-center mb-4">
          Playing: {currentSound}
        </p>

        {/* Remaining time */}
        <p className="text-lg text-white/60 text-center mb-8">
          Auto-stop in {formatTime(remainingSeconds)}
        </p>

        {/* Audio blocked - tap to enable */}
        {audioBlocked && (
          <button
            onClick={() => startAlarmLoop()}
            className="w-full py-6 mb-4 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-2xl flex items-center justify-center gap-3 transition-colors shadow-lg animate-pulse"
          >
            <Volume2 size={32} />
            TAP TO ENABLE SOUND
          </button>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          {/* Stop button */}
          <button
            onClick={handleStop}
            className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            <X size={28} />
            Stop
          </button>

          {/* Snooze button */}
          {!showSnoozeOptions ? (
            <button
              onClick={() => setShowSnoozeOptions(true)}
              className="w-full py-4 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Moon size={24} />
              Snooze
            </button>
          ) : (
            <div className="flex gap-2">
              {SNOOZE_MINUTES.map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleSnooze(mins)}
                  className="flex-1 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition-colors"
                >
                  {mins}m
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 1s ease-in-out infinite;
        }
        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default AlarmPlayer;
