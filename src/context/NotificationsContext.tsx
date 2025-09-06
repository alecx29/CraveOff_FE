import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import React, { createContext, useState, useContext, useEffect, ReactNode, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { scheduleDailyCheckInNotification, cancelDailyCheckInNotification, setupNotificationChannels } from '@/src/services/notificationService';
import { registerDeviceWithBackend } from '@/src/services/pushService';

// Define the context type
interface NotificationsContextType {
  isNotificationsEnabled: boolean;
  hasAskedForPermission: boolean;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  scheduleNotification: (title: string, body: string, trigger?: Notifications.NotificationTriggerInput) => Promise<string | null>;
  cancelAllNotifications: () => Promise<void>;
  scheduleDailyCheckIn: () => Promise<string | null>;
  cancelDailyCheckIn: () => Promise<void>;
}

// Create context with default values
const NotificationsContext = createContext<NotificationsContextType>({
  isNotificationsEnabled: false,
  hasAskedForPermission: false,
  setNotificationsEnabled: async () => {},
  requestPermissions: async () => false,
  scheduleNotification: async () => null,
  cancelAllNotifications: async () => {},
  scheduleDailyCheckIn: async () => null,
  cancelDailyCheckIn: async () => {},
});

// Custom hook for easy context usage
export const useNotifications = () => useContext(NotificationsContext);

const NOTIFICATIONS_ENABLED_KEY = 'NOTIFICATIONS_ENABLED';
const NOTIFICATIONS_ASKED_KEY = 'NOTIFICATIONS_ASKED';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState<boolean>(false);
  const [hasAskedForPermission, setHasAskedForPermission] = useState<boolean>(false);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    // Load notification settings from storage
    const loadNotificationSettings = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
        const askedValue = await AsyncStorage.getItem(NOTIFICATIONS_ASKED_KEY);
        
        if (storedValue !== null) {
          setIsNotificationsEnabled(storedValue === 'true');
        }
        
        if (askedValue !== null) {
          setHasAskedForPermission(askedValue === 'true');
        }

        // Check if permission is actually granted
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted' && storedValue === 'true') {
          // If we thought we had permission but don't anymore, update state
          setIsNotificationsEnabled(false);
          await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
        }
        
        // Setup notification channels for Android
        await setupNotificationChannels();
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };

    loadNotificationSettings();

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('Notification response received:', response);
        // Handle notification response (e.g., navigate to a specific screen)
      }
    );

    // Clean up listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Register for push notifications
  const registerForPushNotifications = async (): Promise<boolean> => {
    if (!Device.isDevice) {
      Alert.alert(
        'Notifications not available',
        'Notifications are only available on physical devices.'
      );
      return false;
    }

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  };

  // Request permission from the user
  const requestPermissions = async (): Promise<boolean> => {
    try {
      await registerForPushNotifications();
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // Only ask if not determined
      if (existingStatus !== 'granted' && existingStatus !== 'denied') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      } else if (existingStatus === 'denied' && !hasAskedForPermission) {
        // If already denied but we haven't shown our custom dialog yet
        Alert.alert(
          'Enable Notifications',
          'To receive important updates and reminders, please enable notifications in your device settings.',
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'Settings', 
              onPress: () => Notifications.requestPermissionsAsync() 
            }
          ]
        );
      }
      
      // Mark that we've asked for permission
      setHasAskedForPermission(true);
      await AsyncStorage.setItem(NOTIFICATIONS_ASKED_KEY, 'true');
      
      // Update state based on permission result
      const isEnabled = finalStatus === 'granted';
      setIsNotificationsEnabled(isEnabled);
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, isEnabled.toString());
      
      return isEnabled;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  // Schedule a notification
  const scheduleNotification = async (
    title: string, 
    body: string, 
    trigger: Notifications.NotificationTriggerInput = null
  ): Promise<string | null> => {
    if (!isNotificationsEnabled) return null;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
      });
      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  // Schedule daily check-in notification at 11:00 AM
  const scheduleDailyCheckIn = async (): Promise<string | null> => {
    // We now use server-side push notifications; keep this as no-op or legacy support
    if (!isNotificationsEnabled) return null;
    return null;
  };

  // Cancel daily check-in notification
  const cancelDailyCheckIn = async (): Promise<void> => {
    await cancelDailyCheckInNotification();
  };

  // Cancel all notifications
  const cancelAllNotifications = async (): Promise<void> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  };

  // Save notification setting to AsyncStorage
  const setNotificationsEnabled = async (enabled: boolean): Promise<void> => {
    try {
      if (enabled) {
        // If enabling, check/request permissions first
        const permitted = await requestPermissions();
        if (!permitted) {
          console.log('Cannot enable notifications without permissions');
          return;
        }

        // Register device with backend for push notifications
        await registerDeviceWithBackend({ silent: true });
      } else {
        // If disabling, cancel all scheduled notifications
        await cancelAllNotifications();
      }
      
      setIsNotificationsEnabled(enabled);
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled.toString());
    } catch (error) {
      console.error('Error setting notifications enabled:', error);
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        isNotificationsEnabled,
        hasAskedForPermission,
        setNotificationsEnabled,
        requestPermissions,
        scheduleNotification,
        cancelAllNotifications,
        scheduleDailyCheckIn,
        cancelDailyCheckIn,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext; 