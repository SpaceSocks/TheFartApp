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

// Check if we're on iOS
const isIOS = () => {
  return window.Capacitor?.getPlatform?.() === 'ios' ||
    /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Convert file path for Capacitor iOS
const getCapacitorUrl = (path) => {
  // On iOS Capacitor, use Capacitor.convertFileSrc if available
  if (window.Capacitor?.convertFileSrc) {
    // For web assets, they're served from the app's web directory
    // The path should be relative to the web root
    const fullPath = path.startsWith('/') ? path : '/' + path;
    return window.Capacitor.convertFileSrc(fullPath);
  }
  return path;
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
        // Web/Capacitor: use paths from public folder
        FART_SOUNDS.classic.files = ['/sounds/Classic/classic1.mp3', '/sounds/Classic/classic2.mp3', '/sounds/Classic/classic3.mp3'];
        FART_SOUNDS.squeaky.files = ['/sounds/Squeeky/squeeky1.mp3', '/sounds/Squeeky/squeeky2.mp3', '/sounds/Squeeky/squeeky3.mp3'];
        FART_SOUNDS.thunder.files = ['/sounds/Thunder/thunder1.mp3', '/sounds/Thunder/thunder2.mp3', '/sounds/Thunder/thunder3.mp3'];
        FART_SOUNDS.wet.files = ['/sounds/Wet/wet1.mp3', '/sounds/Wet/wet2.mp3', '/sounds/Wet/wet3.mp3'];
        FART_SOUNDS.long.files = ['/sounds/Long/long1.mp3', '/sounds/Long/long2.mp3', '/sounds/Long/long3.mp3'];
        FART_SOUNDS.rapidfire.files = ['/sounds/RapidFire/rapidfire1.mp3', '/sounds/RapidFire/rapidfire2.mp3', '/sounds/RapidFire/rapidfire3.mp3'];

        console.log('Sound files configured for platform:', window.Capacitor?.getPlatform?.() || 'web');
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
let currentHtmlAudio = null;

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

// Play audio using HTML5 Audio element (more reliable on iOS)
const playWithHtmlAudio = (url, volume = 0.8) => {
  return new Promise((resolve, reject) => {
    // Stop any currently playing HTML audio
    if (currentHtmlAudio) {
      try {
        currentHtmlAudio.pause();
        currentHtmlAudio.src = '';
      } catch (e) {}
      currentHtmlAudio = null;
    }

    // Convert URL for Capacitor if needed
    const audioUrl = isCapacitor() ? getCapacitorUrl(url) : url;
    console.log('Playing audio URL:', audioUrl);

    const audio = new Audio();

    // iOS-specific attributes
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');
    audio.preload = 'auto';
    audio.volume = volume;

    currentHtmlAudio = audio;

    audio.oncanplaythrough = () => {
      console.log('Audio can play through, starting playback');
      audio.play().then(() => {
        console.log('Audio playback started successfully');
      }).catch((e) => {
        console.error('Audio play() failed:', e);
        reject(e);
      });
    };

    audio.onended = () => {
      console.log('Audio ended, duration:', audio.duration);
      if (currentHtmlAudio === audio) {
        currentHtmlAudio = null;
      }
      resolve(audio.duration || 1);
    };

    audio.onerror = (e) => {
      console.error('HTML Audio error:', e, 'URL:', audioUrl);
      console.error('Audio error code:', audio.error?.code, 'message:', audio.error?.message);
      if (currentHtmlAudio === audio) {
        currentHtmlAudio = null;
      }
      reject(new Error(`Failed to play audio: ${audio.error?.message || 'Unknown error'}`));
    };

    // Set source and load
    audio.src = audioUrl;
    audio.load();
  });
};

// Stop any currently playing sound
export const stopCurrentSound = () => {
  // Stop Web Audio API source
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Source may have already stopped
    }
    currentSource = null;
    currentGainNode = null;
  }

  // Stop HTML Audio element
  if (currentHtmlAudio) {
    try {
      currentHtmlAudio.pause();
      currentHtmlAudio.currentTime = 0;
    } catch (e) {
      // Audio may have already stopped
    }
    currentHtmlAudio = null;
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
  return new Promise((resolve) => {
    const waitTime = Math.ceil(duration * 1000) + 50;
    setTimeout(() => {
      if (currentSource === source) {
        currentSource = null;
        currentGainNode = null;
      }
      resolve(duration);
    }, waitTime);
  });
};

// Main function to play a fart sound
export const playFartSound = async (soundId, volume = 0.8) => {
  // Ensure sound files are loaded
  await loadSoundFiles();

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
  console.log('Platform:', window.Capacitor?.getPlatform?.() || 'web', 'isIOS:', isIOS());

  // Always try HTML5 Audio first on iOS (more reliable)
  if (isIOS()) {
    try {
      return await playWithHtmlAudio(fileUrl, volume);
    } catch (error) {
      console.error('iOS HTML Audio failed:', error);
      // Try Web Audio API as fallback
    }
  }

  // Web Audio API for non-iOS or as fallback
  try {
    const ctx = getAudioContext();

    // Resume audio context if suspended (needed for user gesture requirement)
    if (ctx.state === 'suspended') {
      console.log('Resuming suspended audio context');
      await ctx.resume();
    }

    const actualUrl = isCapacitor() ? getCapacitorUrl(fileUrl) : fileUrl;
    const audioBuffer = await loadAudioFile(actualUrl);
    return await playAudioBuffer(audioBuffer, volume);
  } catch (error) {
    console.error('Error playing fart sound with Web Audio:', error);

    // Last resort: try HTML5 Audio even on non-iOS
    try {
      return await playWithHtmlAudio(fileUrl, volume);
    } catch (htmlError) {
      console.error('HTML Audio also failed:', htmlError);
      return 0;
    }
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

  // On iOS, try using blob URL with HTML5 Audio
  if (isIOS()) {
    return new Promise((resolve, reject) => {
      const blobUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio();
      audio.setAttribute('playsinline', '');
      audio.setAttribute('webkit-playsinline', '');
      audio.volume = volume;
      currentHtmlAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(blobUrl);
        if (currentHtmlAudio === audio) {
          currentHtmlAudio = null;
        }
        resolve(audio.duration || 1);
      };

      audio.onerror = (e) => {
        URL.revokeObjectURL(blobUrl);
        console.error('Custom audio error:', e);
        reject(new Error('Failed to play custom audio'));
      };

      audio.src = blobUrl;
      audio.play().catch(reject);
    });
  }

  // Web Audio API for non-iOS
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

        currentSource = source;
        currentGainNode = gainNode;

        const duration = audioBuffer.duration;
        source.start();

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
      const actualUrl = isCapacitor() ? getCapacitorUrl(url) : url;
      await loadAudioFile(actualUrl);
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
