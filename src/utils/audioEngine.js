// Audio Engine - Uses Capgo Native Audio plugin for iOS compatibility
import { NativeAudio } from '@capgo/native-audio';
import { Capacitor } from '@capacitor/core';

// Sound definitions
export const FART_SOUNDS = {
  classic: { id: 'classic', name: 'Classic', emoji: '💨', description: 'Your standard, everyday fart', files: ['classic1', 'classic2', 'classic3'], folder: 'Classic' },
  squeaky: { id: 'squeaky', name: 'Squeaky', emoji: '🎵', description: 'High-pitched, comical', files: ['squeeky1', 'squeeky2', 'squeeky3'], folder: 'Squeeky' },
  thunder: { id: 'thunder', name: 'Thunder', emoji: '⚡', description: 'Deep, rumbling, impressive', files: ['thunder1', 'thunder2', 'thunder3'], folder: 'Thunder' },
  wet: { id: 'wet', name: 'Wet', emoji: '💦', description: 'Bubbly, moist quality', files: ['wet1', 'wet2', 'wet3'], folder: 'Wet' },
  long: { id: 'long', name: 'Long', emoji: '🌬️', description: 'Extended duration', files: ['long1', 'long2', 'long3'], folder: 'Long' },
  rapidfire: { id: 'rapidfire', name: 'Rapid Fire', emoji: '🔥', description: 'Quick successive bursts', files: ['rapidfire1', 'rapidfire2', 'rapidfire3'], folder: 'RapidFire' },
};

const isNative = Capacitor.isNativePlatform();
const isIOS = Capacitor.getPlatform() === 'ios';
let soundsPreloaded = false;
let preloadPromise = null;
let currentAssetId = null;

// Get the correct asset path based on platform
const getAssetPath = (folder, file) => {
  // Both iOS and Android: path relative to public/web folder root
  return `sounds/${folder}/${file}.mp3`;
};

// Configure and preload all sounds for native platforms
const preloadSounds = async () => {
  if (!isNative) return;
  if (soundsPreloaded) return;
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    console.log('Configuring native audio for', Capacitor.getPlatform());

    // Configure audio session for playback (important for iOS)
    try {
      await NativeAudio.configure({
        focus: true,
        background: false
      });
      console.log('✓ Audio configured');
    } catch (e) {
      console.error('Audio configure error:', e.message);
    }

    console.log('Preloading sounds...');

    for (const [soundId, sound] of Object.entries(FART_SOUNDS)) {
      for (const file of sound.files) {
        const assetId = `${soundId}_${file}`;
        const assetPath = getAssetPath(sound.folder, file);

        try {
          await NativeAudio.preload({
            assetId,
            assetPath,
            audioChannelNum: 1,
            isUrl: false
          });
          console.log('✓ Preloaded:', assetId, 'from', assetPath);
        } catch (e) {
          console.error('✗ Failed to preload:', assetId, assetPath, e.message);
        }
      }
    }

    soundsPreloaded = true;
    console.log('Sound preloading complete');
  })();

  return preloadPromise;
};

// HTML5 Audio fallback for web
let webAudio = null;
const getWebAudio = () => {
  if (!webAudio && typeof document !== 'undefined') {
    webAudio = new Audio();
  }
  return webAudio;
};

// Stop current sound
export const stopCurrentSound = async () => {
  if (isNative && currentAssetId) {
    try {
      await NativeAudio.stop({ assetId: currentAssetId });
    } catch (e) {
      // Ignore stop errors
    }
    currentAssetId = null;
  } else if (webAudio) {
    webAudio.pause();
    webAudio.currentTime = 0;
  }
};

// Play a fart sound
export const playFartSound = async (soundId, volume = 0.8) => {
  const sound = FART_SOUNDS[soundId] || FART_SOUNDS.classic;
  const randomFile = sound.files[Math.floor(Math.random() * sound.files.length)];
  const assetId = `${sound.id}_${randomFile}`;

  console.log('Playing:', assetId, '| Platform:', Capacitor.getPlatform(), '| Native:', isNative);

  // Stop any currently playing sound
  await stopCurrentSound();

  if (isNative) {
    // Ensure sounds are preloaded
    await preloadSounds();

    // Use Native Audio plugin
    try {
      await NativeAudio.setVolume({ assetId, volume });
      await NativeAudio.play({ assetId });
      currentAssetId = assetId;
      console.log('✓ Playing native audio:', assetId);

      // Get duration
      try {
        const { duration } = await NativeAudio.getDuration({ assetId });
        return duration || 1;
      } catch {
        return 1;
      }
    } catch (e) {
      console.error('✗ Native audio play error:', e.message);
      // Try web audio as fallback
      return playWithWebAudio(sound.folder, randomFile, volume);
    }
  } else {
    return playWithWebAudio(sound.folder, randomFile, volume);
  }
};

// Web audio fallback
const playWithWebAudio = async (folder, file, volume) => {
  const audio = getWebAudio();
  if (!audio) return 0;

  const url = `/sounds/${folder}/${file}.mp3`;
  audio.src = url;
  audio.volume = volume;

  return new Promise((resolve) => {
    audio.onended = () => resolve(audio.duration || 1);
    audio.onerror = (e) => {
      console.error('Web audio error:', e);
      resolve(0);
    };
    audio.play().catch((e) => {
      console.error('Web audio play failed:', e);
      resolve(0);
    });
  });
};

// Play random sound
export const playRandomFartSound = async (volume = 0.8) => {
  const ids = Object.keys(FART_SOUNDS);
  return playFartSound(ids[Math.floor(Math.random() * ids.length)], volume);
};

// Play custom recorded sound (always uses web audio for blobs)
export const playCustomSound = async (audioBlob, volume = 0.8) => {
  await stopCurrentSound();

  const url = URL.createObjectURL(audioBlob);
  const audio = getWebAudio() || new Audio();
  audio.src = url;
  audio.volume = volume;

  return new Promise((resolve) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration || 1);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    audio.play().catch(() => {
      URL.revokeObjectURL(url);
      resolve(0);
    });
  });
};

// Get built-in sounds list
export const getBuiltInSounds = () => Object.values(FART_SOUNDS).map(s => ({
  id: s.id, name: s.name, emoji: s.emoji, description: s.description
}));

// Check if audio supported
export const isAudioSupported = () => true;

// Preload all sounds
export const preloadAllSounds = preloadSounds;

// Get sound file counts
export const getSoundFileCounts = async () => {
  const counts = {};
  for (const [key, sound] of Object.entries(FART_SOUNDS)) {
    counts[key] = sound.files.length;
  }
  return counts;
};
