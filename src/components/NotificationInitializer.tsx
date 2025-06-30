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

  // Initialize notifications when the app starts
  useEffect(() => {
    const initializeNotifications = async () => {
      if (isNotificationsEnabled) {
        // Check if check-in notifications are enabled
        const checkInEnabled = await AsyncStorage.getItem('CHECK_IN_NOTIFICATION_ENABLED');
        
        // If not explicitly disabled, schedule the check-in notification
        if (checkInEnabled !== 'false') {
          console.log('Scheduling daily check-in notification on app start');
          await scheduleDailyCheckIn();
        }
      }
    };

    initializeNotifications();
  }, [isNotificationsEnabled]);

  // This component doesn't render anything
  return null;
};

export default NotificationInitializer; 