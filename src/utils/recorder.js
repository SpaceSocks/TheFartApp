// Audio Recording Utility
// Handles microphone access and recording
// Uses native plugin on iOS/Android, web MediaRecorder as fallback

import { Capacitor } from '@capacitor/core';
import { VoiceRecorder } from 'capacitor-voice-recorder';

let mediaRecorder = null;
let audioChunks = [];
let recordingStream = null;

// Check platform
const isIOS = () => Capacitor.getPlatform() === 'ios';
const isAndroid = () => Capacitor.getPlatform() === 'android';
const isNative = () => Capacitor.isNativePlatform();

// Check if recording is supported
export const isRecordingSupported = async () => {
  if (isNative()) {
    // On native, use the voice recorder plugin
    try {
      const result = await VoiceRecorder.canDeviceVoiceRecord();
      return result.value === true;
    } catch (error) {
      console.log('Voice recorder check failed:', error);
      return false;
    }
  }

  // On web, check if mediaDevices API exists
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

    if (isNative()) {
      // Use native plugin for permission
      const permStatus = await VoiceRecorder.requestAudioRecordingPermission();
      if (permStatus.value === true) {
        console.log('Microphone permission granted (native)');
        return { success: true };
      } else {
        return {
          success: false,
          error: isIOS()
            ? 'Microphone access denied. Go to Settings > Privacy & Security > Microphone and enable access for The Fart App.'
            : 'Microphone access denied. Please enable in app settings.'
        };
      }
    }

    // Web fallback
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
        ? 'Microphone access denied. Go to Settings > Privacy & Security > Microphone and enable access for The Fart App.'
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
    if (isNative()) {
      const status = await VoiceRecorder.hasAudioRecordingPermission();
      return status.value ? 'granted' : 'prompt';
    }
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
    const supported = await isRecordingSupported();
    if (!supported) {
      return {
        success: false,
        error: isIOS()
          ? 'Recording is not available. Please check microphone permissions in Settings.'
          : 'Recording is not supported on this device'
      };
    }

    if (isNative()) {
      // Use native voice recorder
      console.log('Starting native recording...');
      const result = await VoiceRecorder.startRecording();
      if (result.value === true) {
        console.log('Native recording started');
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Failed to start recording'
        };
      }
    }

    // Web fallback using MediaRecorder
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
        ? 'Microphone access denied. Go to Settings > Privacy & Security > Microphone to enable.'
        : 'Microphone permission denied';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No microphone found';
    } else if (error.name === 'NotSupportedError' || error.name === 'TypeError') {
      errorMessage = isIOS()
        ? 'Recording is not available on this device'
        : 'Recording not supported on this device';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

// Stop recording and return the audio blob
export const stopRecording = async () => {
  if (isNative()) {
    try {
      console.log('Stopping native recording...');
      const result = await VoiceRecorder.stopRecording();

      if (result.value && result.value.recordDataBase64) {
        // Convert base64 to blob
        const base64Data = result.value.recordDataBase64;
        const mimeType = result.value.mimeType || 'audio/aac';

        // Decode base64
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: mimeType });

        console.log('Native recording stopped, blob size:', audioBlob.size);
        return { success: true, audioBlob };
      } else {
        return { success: false, error: 'No recording data received' };
      }
    } catch (error) {
      console.error('Error stopping native recording:', error);
      return { success: false, error: 'Failed to stop recording' };
    }
  }

  // Web fallback
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
export const cancelRecording = async () => {
  if (isNative()) {
    try {
      await VoiceRecorder.stopRecording();
    } catch (error) {
      // Ignore errors when canceling
      console.log('Cancel recording error (ignored):', error);
    }
    return;
  }

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
export const isRecording = async () => {
  if (isNative()) {
    try {
      const status = await VoiceRecorder.getCurrentStatus();
      return status.status === 'RECORDING';
    } catch {
      return false;
    }
  }
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
