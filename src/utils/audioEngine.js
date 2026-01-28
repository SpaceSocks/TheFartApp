// Audio Engine - Simple iOS-compatible audio playback

// Sound definitions
export const FART_SOUNDS = {
  classic: { id: 'classic', name: 'Classic', emoji: '💨', description: 'Your standard, everyday fart', files: ['classic1.mp3', 'classic2.mp3', 'classic3.mp3'], folder: 'Classic' },
  squeaky: { id: 'squeaky', name: 'Squeaky', emoji: '🎵', description: 'High-pitched, comical', files: ['squeeky1.mp3', 'squeeky2.mp3', 'squeeky3.mp3'], folder: 'Squeeky' },
  thunder: { id: 'thunder', name: 'Thunder', emoji: '⚡', description: 'Deep, rumbling, impressive', files: ['thunder1.mp3', 'thunder2.mp3', 'thunder3.mp3'], folder: 'Thunder' },
  wet: { id: 'wet', name: 'Wet', emoji: '💦', description: 'Bubbly, moist quality', files: ['wet1.mp3', 'wet2.mp3', 'wet3.mp3'], folder: 'Wet' },
  long: { id: 'long', name: 'Long', emoji: '🌬️', description: 'Extended duration', files: ['long1.mp3', 'long2.mp3', 'long3.mp3'], folder: 'Long' },
  rapidfire: { id: 'rapidfire', name: 'Rapid Fire', emoji: '🔥', description: 'Quick successive bursts', files: ['rapidfire1.mp3', 'rapidfire2.mp3', 'rapidfire3.mp3'], folder: 'RapidFire' },
};

// Single reusable audio element for iOS compatibility
let audioElement = null;

const getAudioElement = () => {
  if (!audioElement) {
    audioElement = document.createElement('audio');
    audioElement.setAttribute('playsinline', '');
    audioElement.setAttribute('webkit-playsinline', '');
    audioElement.preload = 'auto';
    document.body.appendChild(audioElement);
  }
  return audioElement;
};

// Initialize audio element on first user interaction
let audioInitialized = false;
const initAudio = () => {
  if (audioInitialized) return;
  const audio = getAudioElement();
  // Play silent audio to unlock iOS audio
  audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQAAAAAAAAAAaC6hXogAAAAAAAAAAAAAAAAAAAA/+MYxAANCAqYAUAAAP/jGMQADYAOoYOAAAD/4xjEAA2ADpgDgAAA/+MYxAANgA6YA4AAAP/jGMQADYAKmAOAAAD/4xjEAA2ACpgDgAAA/+MYxAANgAqYA4AAAA==';
  audio.volume = 0.01;
  audio.play().then(() => {
    audio.pause();
    audioInitialized = true;
    console.log('Audio initialized for iOS');
  }).catch(e => console.log('Audio init skipped:', e.message));
};

// Call init on any user interaction
if (typeof document !== 'undefined') {
  ['touchstart', 'touchend', 'click'].forEach(event => {
    document.addEventListener(event, initAudio, { once: true, passive: true });
  });
}

// Stop current sound
export const stopCurrentSound = () => {
  const audio = getAudioElement();
  audio.pause();
  audio.currentTime = 0;
};

// Play a fart sound
export const playFartSound = async (soundId, volume = 0.8) => {
  const sound = FART_SOUNDS[soundId] || FART_SOUNDS.classic;
  const randomFile = sound.files[Math.floor(Math.random() * sound.files.length)];
  const url = `/sounds/${sound.folder}/${randomFile}`;

  console.log('Playing:', url);

  const audio = getAudioElement();
  audio.volume = volume;
  audio.src = url;

  return new Promise((resolve) => {
    audio.onended = () => resolve(audio.duration || 1);
    audio.onerror = (e) => {
      console.error('Audio error:', e, audio.error);
      resolve(0);
    };
    audio.play().catch(e => {
      console.error('Play failed:', e);
      resolve(0);
    });
  });
};

// Play random sound
export const playRandomFartSound = async (volume = 0.8) => {
  const ids = Object.keys(FART_SOUNDS);
  return playFartSound(ids[Math.floor(Math.random() * ids.length)], volume);
};

// Play custom recorded sound
export const playCustomSound = async (audioBlob, volume = 0.8) => {
  const url = URL.createObjectURL(audioBlob);
  const audio = getAudioElement();
  audio.volume = volume;
  audio.src = url;

  return new Promise((resolve) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration || 1);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    audio.play().catch(() => resolve(0));
  });
};

// Get built-in sounds list
export const getBuiltInSounds = () => Object.values(FART_SOUNDS).map(s => ({
  id: s.id, name: s.name, emoji: s.emoji, description: s.description
}));

// Check if audio supported
export const isAudioSupported = () => true;

// Preload sounds (optional)
export const preloadAllSounds = async () => {
  console.log('Preload not needed with simple audio');
};

// Get sound file counts
export const getSoundFileCounts = async () => {
  const counts = {};
  for (const [key, sound] of Object.entries(FART_SOUNDS)) {
    counts[key] = sound.files.length;
  }
  return counts;
};
