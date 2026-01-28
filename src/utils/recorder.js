// Audio Recording Utility
// Handles microphone access and recording

let mediaRecorder = null;
let audioChunks = [];
let recordingStream = null;

// Check if we're on iOS Capacitor
const isIOSCapacitor = () => {
  return window.Capacitor?.getPlatform?.() === 'ios';
};

// Check if recording is supported
export const isRecordingSupported = () => {
  // On iOS Capacitor, we need to check more carefully
  if (isIOSCapacitor()) {
    // iOS WKWebView supports getUserMedia in iOS 14.5+
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

// Request microphone permission
export const requestMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately, we just wanted permission
    stream.getTracks().forEach(track => track.stop());
    return { success: true };
  } catch (error) {
    let message = 'Microphone access denied';

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      message = 'Microphone access denied - Please enable in system settings';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      message = 'No microphone found - Please connect a microphone';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      message = 'Microphone in use by another app';
    }

    return { success: false, error: message };
  }
};

// Check if we have microphone permission
export const checkMicrophonePermission = async () => {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' });
    return result.state; // 'granted', 'denied', or 'prompt'
  } catch {
    // Firefox doesn't support permissions.query for microphone
    return 'prompt';
  }
};

// Start recording
export const startRecording = async () => {
  try {
    // Check if recording is supported
    if (!isRecordingSupported()) {
      return {
        success: false,
        error: isIOSCapacitor()
          ? 'Recording requires iOS 14.5 or later. Please update your device.'
          : 'Recording is not supported on this device'
      };
    }

    audioChunks = [];

    recordingStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });

    // On iOS, prefer mp4/aac, on other platforms prefer webm
    let mimeType = 'audio/webm';
    if (isIOSCapacitor() || /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // iOS supports mp4 better
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/aac')) {
        mimeType = 'audio/aac';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      }
    } else {
      // Prefer webm for smaller file size on non-iOS
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }
    }

    console.log('Starting recording with mimeType:', mimeType);
    mediaRecorder = new MediaRecorder(recordingStream, { mimeType });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.start(100); // Collect data every 100ms

    return { success: true };
  } catch (error) {
    console.error('Error starting recording:', error);

    let errorMessage = 'Recording failed - Please try again';
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = 'Microphone permission denied. Please allow microphone access in Settings.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No microphone found on this device.';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'Recording is not supported on this device.';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

// Stop recording and return the audio blob
export const stopRecording = () => {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      resolve({ success: false, error: 'No active recording' });
      return;
    }

    mediaRecorder.onstop = () => {
      const mimeType = mediaRecorder.mimeType;
      const audioBlob = new Blob(audioChunks, { type: mimeType });

      // Stop all tracks
      if (recordingStream) {
        recordingStream.getTracks().forEach(track => track.stop());
        recordingStream = null;
      }

      audioChunks = [];
      mediaRecorder = null;

      resolve({ success: true, audioBlob });
    };

    mediaRecorder.stop();
  });
};

// Cancel recording without saving
export const cancelRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }

  if (recordingStream) {
    recordingStream.getTracks().forEach(track => track.stop());
    recordingStream = null;
  }

  audioChunks = [];
  mediaRecorder = null;
};

// Check if currently recording
export const isRecording = () => {
  return mediaRecorder && mediaRecorder.state === 'recording';
};

// Get audio blob duration
export const getAudioDuration = async (audioBlob) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(audioBlob);

    audio.onloadedmetadata = () => {
      // Handle infinity duration bug in some browsers
      if (audio.duration === Infinity || isNaN(audio.duration)) {
        audio.currentTime = 1e101;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = null;
          resolve(audio.duration);
          URL.revokeObjectURL(audio.src);
        };
      } else {
        resolve(audio.duration);
        URL.revokeObjectURL(audio.src);
      }
    };

    audio.onerror = () => {
      resolve(0);
      URL.revokeObjectURL(audio.src);
    };
  });
};
