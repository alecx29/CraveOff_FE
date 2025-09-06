import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';

export type PushPlatform = 'ios' | 'android' | 'unknown';

export interface RegisterDeviceOptions {
  silent?: boolean;
}

export const getExpoPushTokenAsync = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = (Constants?.expoConfig as any)?.extra?.eas?.projectId as string | undefined;
  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined as any);
    const token = tokenResponse?.data ?? (tokenResponse as any);
    return typeof token === 'string' ? token : null;
  } catch (e) {
    return null;
  }
};

export const getPlatform = (): PushPlatform => {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'unknown';
};

export const registerDeviceWithBackend = async (options: RegisterDeviceOptions = {}): Promise<boolean> => {
  const { silent } = options;
  try {
    const token = await getExpoPushTokenAsync();
    if (!token) {
      if (!silent) {
        Alert.alert('Notifications disabled', 'Enable notifications in Settings to receive reminders.');
      }
      return false;
    }
    const platform: PushPlatform = getPlatform();
    await apiClient.post(BackendRoutes.DEVICES_REGISTER, {
      expo_push_token: token,
      platform,
    });
    return true;
  } catch (error) {
    if (!silent) {
      console.log('[pushService] register device failed:', (error as any)?.message);
    }
    return false;
  }
};

