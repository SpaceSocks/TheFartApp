// Audio Engine - Plays MP3 fart sounds with dynamic file loading

let audioContext = null;
let soundFilesLoaded = false;
let soundFilesPromise = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// Fart sound definitions - files will be loaded dynamically
export const FART_SOUNDS = {
  classic: {
    id: 'classic',
    name: 'Classic',
    emoji: '💨',
    description: 'Your standard, everyday fart',
    files: [],
  },
  squeaky: {
    id: 'squeaky',
    name: 'Squeaky',
    emoji: '🎵',
    description: 'High-pitched, comical',
    files: [],
  },
  thunder: {
    id: 'thunder',
    name: 'Thunder',
    emoji: '⚡',
    description: 'Deep, rumbling, impressive',
    files: [],
  },
  wet: {
    id: 'wet',
    name: 'Wet',
    emoji: '💦',
    description: 'Bubbly, moist quality',
    files: [],
  },
  long: {
    id: 'long',
    name: 'Long',
    emoji: '🌬️',
    description: 'Extended duration',
    files: [],
  },
  rapidfire: {
    id: 'rapidfire',
    name: 'Rapid Fire',
    emoji: '🔥',
    description: 'Quick successive bursts',
    files: [],
  },
};

// Detect if running in Capacitor
const isCapacitor = () => {
  return window.Capacitor !== undefined;
};

// Load sound files from Electron or use web/Capacitor fallback
const loadSoundFiles = async () => {
  if (soundFilesLoaded) return;
  if (soundFilesPromise) return soundFilesPromise;

  soundFilesPromise = (async () => {
    try {
      // Try to get files from Electron (desktop only)
      if (window.electronAPI?.getSoundFiles) {
        const files = await window.electronAPI.getSoundFiles();

        for (const [key, fileList] of Object.entries(files)) {
          if (FART_SOUNDS[key] && fileList.length > 0) {
            FART_SOUNDS[key].files = fileList;
          }
        }

        console.log('Sound files loaded from Electron:', files);
      } else {
        // Web/Capacitor: use absolute paths from public folder
        const basePath = window.Capacitor ? '.' : '';
        FART_SOUNDS.classic.files = [`${basePath}/sounds/Classic/classic1.mp3`, `${basePath}/sounds/Classic/classic2.mp3`, `${basePath}/sounds/Classic/classic3.mp3`];
        FART_SOUNDS.squeaky.files = [`${basePath}/sounds/Squeeky/squeeky1.mp3`, `${basePath}/sounds/Squeeky/squeeky2.mp3`, `${basePath}/sounds/Squeeky/squeeky3.mp3`];
        FART_SOUNDS.thunder.files = [`${basePath}/sounds/Thunder/thunder1.mp3`, `${basePath}/sounds/Thunder/thunder2.mp3`, `${basePath}/sounds/Thunder/thunder3.mp3`];
        FART_SOUNDS.wet.files = [`${basePath}/sounds/Wet/wet1.mp3`, `${basePath}/sounds/Wet/wet2.mp3`, `${basePath}/sounds/Wet/wet3.mp3`];
        FART_SOUNDS.long.files = [`${basePath}/sounds/Long/long1.mp3`, `${basePath}/sounds/Long/long2.mp3`, `${basePath}/sounds/Long/long3.mp3`];
        FART_SOUNDS.rapidfire.files = [`${basePath}/sounds/RapidFire/rapidfire1.mp3`, `${basePath}/sounds/RapidFire/rapidfire2.mp3`, `${basePath}/sounds/RapidFire/rapidfire3.mp3`];

        console.log('Using web/Capacitor sound files');
      }

      soundFilesLoaded = true;
    } catch (error) {
      console.error('Error loading sound files:', error);
      // Use fallback
      FART_SOUNDS.classic.files = ['/sounds/Classic/classic1.mp3'];
      soundFilesLoaded = true;
    }
  })();

  return soundFilesPromise;
};

// Initialize sound files on load
loadSoundFiles();

// Cache for loaded audio buffers
const audioCache = new Map();

// Track the currently playing audio source so we can stop it
let currentSource = null;
let currentGainNode = null;

// Load an MP3 file and return audio buffer
const loadAudioFile = async (url) => {
  // Check cache first
  if (audioCache.has(url)) {
    return audioCache.get(url);
  }

  const ctx = getAudioContext();

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    // Cache the buffer
    audioCache.set(url, audioBuffer);

    return audioBuffer;
  } catch (error) {
    console.error('Failed to load audio file:', url, error);
    throw error;
  }
};

// Stop any currently playing sound
export const stopCurrentSound = () => {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Source may have already stopped
    }
    currentSource = null;
    currentGainNode = null;
  }
};

// Play an audio buffer with volume control
const playAudioBuffer = (audioBuffer, volume = 0.8) => {
  // Stop any currently playing sound first
  stopCurrentSound();

  const ctx = getAudioContext();

  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();

  source.buffer = audioBuffer;
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);

  source.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Track this as the current source
  currentSource = source;
  currentGainNode = gainNode;

  const duration = audioBuffer.duration;
  console.log('Playing audio buffer, duration:', duration, 'seconds');

  source.start();

  // Wait for the sound to finish using a timeout based on duration
  // This is more reliable than onended which can be flaky
  return new Promise((resolve) => {
    const waitTime = Math.ceil(duration * 1000) + 50; // Add 50ms buffer
    setTimeout(() => {
      // Clear tracking if this is still the current source
      if (currentSource === source) {
        currentSource = null;
        currentGainNode = null;
      }
      console.log('Sound finished after', duration, 'seconds');
      resolve(duration);
    }, waitTime);
  });
};

// Main function to play a fart sound
export const playFartSound = async (soundId, volume = 0.8) => {
  // Ensure sound files are loaded
  await loadSoundFiles();

  const ctx = getAudioContext();

  // Resume audio context if suspended (needed for user gesture requirement)
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const sound = FART_SOUNDS[soundId];
  if (!sound || !sound.files || sound.files.length === 0) {
    // Fallback to classic if sound not found
    if (soundId !== 'classic') {
      return playFartSound('classic', volume);
    }
    console.error('No sound files available');
    return 0;
  }

  // Pick a random file from the available variants
  const randomIndex = Math.floor(Math.random() * sound.files.length);
  const fileUrl = sound.files[randomIndex];

  console.log(`Playing ${soundId} (${randomIndex + 1}/${sound.files.length}): ${fileUrl}`);

  try {
    const audioBuffer = await loadAudioFile(fileUrl);
    return await playAudioBuffer(audioBuffer, volume);
  } catch (error) {
    console.error('Error playing fart sound:', error);
    return 0;
  }
};

// Play a random fart sound
export const playRandomFartSound = async (volume = 0.8) => {
  await loadSoundFiles();
  const soundIds = Object.keys(FART_SOUNDS);
  const randomId = soundIds[Math.floor(Math.random() * soundIds.length)];
  return playFartSound(randomId, volume);
};

// Play custom recorded sound
export const playCustomSound = async (audioBlob, volume = 0.8) => {
  // Stop any currently playing sound first
  stopCurrentSound();

  const ctx = getAudioContext();

  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();

        source.buffer = audioBuffer;
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Track this as the current source
        currentSource = source;
        currentGainNode = gainNode;

        const duration = audioBuffer.duration;
        console.log('Playing custom sound, duration:', duration, 'seconds');

        source.start();

        // Wait for the sound to finish using timeout
        const waitTime = Math.ceil(duration * 1000) + 50;
        setTimeout(() => {
          if (currentSource === source) {
            currentSource = null;
            currentGainNode = null;
          }
          resolve(duration);
        }, waitTime);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(audioBlob);
  });
};

// Get list of all built-in sounds
export const getBuiltInSounds = () => Object.values(FART_SOUNDS).map(sound => ({
  id: sound.id,
  name: sound.name,
  emoji: sound.emoji,
  description: sound.description,
}));

// Check if Web Audio API is supported
export const isAudioSupported = () => {
  return !!(window.AudioContext || window.webkitAudioContext);
};

// Preload all sounds for faster playback
export const preloadAllSounds = async () => {
  await loadSoundFiles();

  const allFiles = Object.values(FART_SOUNDS).flatMap(sound => sound.files);

  await Promise.all(allFiles.map(async (url) => {
    try {
      await loadAudioFile(url);
    } catch (error) {
      console.warn('Failed to preload:', url);
    }
  }));

  console.log('All fart sounds preloaded!');
};

// Get count of files for each sound type
export const getSoundFileCounts = async () => {
  await loadSoundFiles();

  const counts = {};
  for (const [key, sound] of Object.entries(FART_SOUNDS)) {
    counts[key] = sound.files.length;
  }
  return counts;
};
