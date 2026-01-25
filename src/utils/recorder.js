// Audio Recording Utility
// Handles microphone access and recording

let mediaRecorder = null;
let audioChunks = [];
let recordingStream = null;

// Check if recording is supported
export const isRecordingSupported = () => {
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
    audioChunks = [];

    recordingStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });

    // Prefer webm for smaller file size, fallback to mp4
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

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
    return {
      success: false,
      error: error.message || 'Recording failed - Please try again'
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
