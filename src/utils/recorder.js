// Audio Recording Utility
// Handles microphone access and recording

import { Capacitor } from '@capacitor/core';

let mediaRecorder = null;
let audioChunks = [];
let recordingStream = null;

// Check platform
const isIOS = () => Capacitor.getPlatform() === 'ios';
const isNative = () => Capacitor.isNativePlatform();

// Check if recording is supported
export const isRecordingSupported = () => {
  // Check if mediaDevices API exists
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.log('Recording not supported: mediaDevices API not available');
    return false;
  }
  return true;
};

// Request microphone permission
export const requestMicrophonePermission = async () => {
  try {
    console.log('Requesting microphone permission...');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately, we just wanted permission
    stream.getTracks().forEach(track => track.stop());
    console.log('Microphone permission granted');
    return { success: true };
  } catch (error) {
    console.error('Microphone permission error:', error.name, error.message);

    let message = 'Microphone access denied';

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      message = isIOS()
        ? 'Microphone access denied. Go to Settings > Privacy > Microphone and enable access for this app.'
        : 'Microphone access denied - Please enable in settings';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      message = 'No microphone found on this device';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      message = 'Microphone is in use by another app';
    } else if (error.name === 'NotSupportedError') {
      message = isIOS()
        ? 'Recording requires iOS 14.5 or later'
        : 'Recording is not supported on this device';
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
        error: isIOS()
          ? 'Recording requires iOS 14.5 or later'
          : 'Recording is not supported on this device'
      };
    }

    audioChunks = [];

    console.log('Starting getUserMedia...');
    recordingStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });
    console.log('Got media stream');

    // Determine best mime type
    let mimeType = '';
    const types = [
      'audio/mp4',
      'audio/aac',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }

    console.log('Using mimeType:', mimeType || 'default');

    const options = mimeType ? { mimeType } : {};
    mediaRecorder = new MediaRecorder(recordingStream, options);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.start(100);
    console.log('Recording started');

    return { success: true };
  } catch (error) {
    console.error('Error starting recording:', error.name, error.message);

    let errorMessage = 'Recording failed - Please try again';

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = isIOS()
        ? 'Microphone access denied. Go to Settings > Privacy > Microphone to enable.'
        : 'Microphone permission denied';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No microphone found';
    } else if (error.name === 'NotSupportedError' || error.name === 'TypeError') {
      errorMessage = isIOS()
        ? 'Recording requires iOS 14.5 or later'
        : 'Recording not supported on this device';
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
      const mimeType = mediaRecorder.mimeType || 'audio/mp4';
      const audioBlob = new Blob(audioChunks, { type: mimeType });

      // Stop all tracks
      if (recordingStream) {
        recordingStream.getTracks().forEach(track => track.stop());
        recordingStream = null;
      }

      audioChunks = [];
      mediaRecorder = null;

      console.log('Recording stopped, blob size:', audioBlob.size);
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
