import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '@/src/context/NotificationsContext';

/**
 * Component that initializes notifications when the app starts
 * This component doesn't render anything, it just runs side effects
 */
const NotificationInitializer: React.FC = () => {
  const { 
    isNotificationsEnabled, 
    scheduleDailyCheckIn 
  } = useNotifications();

  // Initialize notifications when the app starts (idempotent scheduling)
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!isNotificationsEnabled) return;

      const checkInEnabled = await AsyncStorage.getItem('CHECK_IN_NOTIFICATION_ENABLED');
      if (checkInEnabled === 'false') return;

      // The scheduler is idempotent; calling it here is safe and won't duplicate
      await scheduleDailyCheckIn();
    };

    initializeNotifications();
  }, [isNotificationsEnabled, scheduleDailyCheckIn]);

  // This component doesn't render anything
  return null;
};

export default NotificationInitializer; 