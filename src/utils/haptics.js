// Haptic feedback utilities for iOS/Android
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = () => Capacitor.isNativePlatform();

// Light haptic feedback (for button taps)
export const hapticsLight = async () => {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (error) {
    console.log('Haptics not available');
  }
};

// Medium haptic feedback (for fart button)
export const hapticsMedium = async () => {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (error) {
    console.log('Haptics not available');
  }
};

// Heavy haptic feedback (for big farts)
export const hapticsHeavy = async () => {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (error) {
    console.log('Haptics not available');
  }
};

// Vibrate for a duration (notification style)
export const hapticsVibrate = async () => {
  if (!isNative()) return;
  try {
    await Haptics.vibrate();
  } catch (error) {
    console.log('Haptics not available');
  }
};
