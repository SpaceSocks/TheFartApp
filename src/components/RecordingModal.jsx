import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Square, AlertCircle } from 'lucide-react';
import {
  startRecording,
  stopRecording,
  cancelRecording,
  isRecordingSupported,
  requestMicrophonePermission,
  getAudioDuration,
} from '../utils/recorder';
import { saveCustomSound, generateId } from '../utils/storage';

function RecordingModal({ onClose, onComplete }) {
  const [state, setState] = useState('idle'); // idle, requesting, ready, recording, saving
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  // Check permissions on mount
  useEffect(() => {
    const init = async () => {
      if (!isRecordingSupported()) {
        setError('Recording is not supported in this browser');
        return;
      }

      setState('requesting');
      const result = await requestMicrophonePermission();

      if (result.success) {
        setState('ready');
      } else {
        setError(result.error);
        setState('idle');
      }
    };

    init();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cancelRecording();
    };
  }, []);

  const handleStartRecording = async () => {
    setError(null);
    const result = await startRecording();

    if (result.success) {
      setState('recording');
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 0.1);
      }, 100);
    } else {
      setError(result.error);
    }
  };

  const handleStopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState('saving');
    const result = await stopRecording();

    if (result.success && result.audioBlob) {
      try {
        const audioDuration = await getAudioDuration(result.audioBlob);

        const sound = {
          id: generateId(),
          name: name.trim() || `Custom Fart ${new Date().toLocaleTimeString()}`,
          emoji: '🎤',
          audioBlob: result.audioBlob,
          dateCreated: Date.now(),
          duration: audioDuration,
          fileSize: result.audioBlob.size,
        };

        await saveCustomSound(sound);
        onComplete();
      } catch (err) {
        setError('Failed to save recording. Please try again.');
        setState('ready');
      }
    } else {
      setError(result.error || 'Recording failed');
      setState('ready');
    }
  };

  const handleClose = () => {
    cancelRecording();
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 mx-4 w-full max-w-sm shadow-2xl modal-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Record Fart</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Recording Indicator */}
        <div className="flex justify-center mb-6">
          <div
            className={`
              w-36 h-36 rounded-full flex items-center justify-center
              transition-all duration-300
              ${state === 'recording'
                ? 'bg-red-500 pulse-recording'
                : state === 'ready'
                  ? 'bg-gradient-to-br from-emerald-400 to-green-500'
                  : 'bg-gray-200'
              }
            `}
          >
            <Mic
              size={60}
              className={`
                ${state === 'recording' ? 'text-white' :
                  state === 'ready' ? 'text-white' : 'text-gray-400'}
              `}
            />
          </div>
        </div>

        {/* Duration */}
        {state === 'recording' && (
          <div className="text-center mb-4">
            <span className="text-4xl font-bold text-red-500">
              {duration.toFixed(1)}s
            </span>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Recording in progress...</p>
          </div>
        )}

        {/* Name Input */}
        {(state === 'ready' || state === 'idle') && (
          <div className="mb-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              placeholder="Name your fart..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all"
              maxLength={20}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
              {name.length}/20
            </p>
          </div>
        )}

        {/* Action Button */}
        {state === 'ready' && (
          <>
            <button
              onClick={handleStartRecording}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all btn-press"
            >
              Start Recording
            </button>
            <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-3">
              Press record and make your best fart sound!
            </p>
          </>
        )}

        {state === 'recording' && (
          <button
            onClick={handleStopRecording}
            className="w-full py-4 rounded-xl bg-gray-800 text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:bg-gray-700 transition-all btn-press"
          >
            <Square size={20} fill="currentColor" />
            Stop & Save
          </button>
        )}

        {state === 'requesting' && (
          <div className="text-center py-4">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Requesting microphone access...</p>
          </div>
        )}

        {state === 'saving' && (
          <div className="text-center py-4">
            <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Saving your fart...</p>
          </div>
        )}

        {state === 'idle' && error && (
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl border-2 border-purple-500 text-purple-600 font-medium hover:bg-purple-50 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export default RecordingModal;
