import Constants from 'expo-constants';

// Determine if realtime debug logs should be enabled
// Priority: EXPO_PUBLIC_REALTIME_DEBUG env → app.config extra → __DEV__ fallback false
const getRealtimeDebugFlag = (): boolean => {
  try {
    // Prefer Expo public env
    if (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_REALTIME_DEBUG !== undefined) {
      const raw = String(process.env.EXPO_PUBLIC_REALTIME_DEBUG).toLowerCase();
      return raw === 'true' || raw === '1';
    }
  } catch {}
  try {
    const extra = (Constants?.expoConfig as any)?.extra;
    const raw = extra?.REALTIME_DEBUG;
    if (raw !== undefined) {
      const s = String(raw).toLowerCase();
      return s === 'true' || s === '1';
    }
  } catch {}
  // Default: enable in dev, disable in prod
  // eslint-disable-next-line no-undef
  return typeof __DEV__ !== 'undefined' ? !!__DEV__ : false;
};

export const REALTIME_DEBUG = getRealtimeDebugFlag();

export const rtLog = (...args: any[]) => {
  if (REALTIME_DEBUG) {
    // Prefix to make filtering easier
    // eslint-disable-next-line no-console
    console.log('[RT]', ...args);
  }
};

export const rtWarn = (...args: any[]) => {
  if (REALTIME_DEBUG) {
    // eslint-disable-next-line no-console
    console.warn('[RT]', ...args);
  }
};

export const rtError = (...args: any[]) => {
  if (REALTIME_DEBUG) {
    // eslint-disable-next-line no-console
    console.error('[RT]', ...args);
  }
};




