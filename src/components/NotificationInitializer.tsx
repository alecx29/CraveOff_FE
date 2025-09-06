import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '@/src/context/NotificationsContext';
import { registerDeviceWithBackend } from '@/src/services/pushService';

/**
 * Component that initializes notifications when the app starts
 * This component doesn't render anything, it just runs side effects
 */
const NotificationInitializer: React.FC = () => {
  const { 
    isNotificationsEnabled
  } = useNotifications();

  // Initialize notifications when the app starts (idempotent scheduling)
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!isNotificationsEnabled) return;
      await registerDeviceWithBackend({ silent: true });
    };

    initializeNotifications();
  }, [isNotificationsEnabled]);

  // This component doesn't render anything
  return null;
};

export default NotificationInitializer; 