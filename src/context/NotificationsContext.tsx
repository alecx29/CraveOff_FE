import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';

// Define the context type
interface NotificationsContextType {
  isNotificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

// Create context with default values
const NotificationsContext = createContext<NotificationsContextType>({
  isNotificationsEnabled: false,
  setNotificationsEnabled: async () => {},
  requestPermissions: async () => false,
});

// Custom hook for easy context usage
export const useNotifications = () => useContext(NotificationsContext);

const NOTIFICATIONS_ENABLED_KEY = 'NOTIFICATIONS_ENABLED';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState<boolean>(false);

  useEffect(() => {
    // Load notification settings from storage
    const loadNotificationSettings = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
        if (storedValue !== null) {
          setIsNotificationsEnabled(storedValue === 'true');
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };

    loadNotificationSettings();
  }, []);

  // Request permission from the user
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // If we don't have permission, request it
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      // Update state and storage based on permission result
      const isEnabled = finalStatus === 'granted';
      setIsNotificationsEnabled(isEnabled);
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, isEnabled.toString());
      
      // Configure for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      
      return isEnabled;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
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
        setNotificationsEnabled,
        requestPermissions,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext; 