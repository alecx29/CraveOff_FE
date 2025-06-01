import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useLogs } from '@/src/context/LogsContext';
import DailyCheckInPopup from './DailyCheckInPopup';

const DailyCheckInController: React.FC = () => {
  const { logs, fetchLogs, isLoading } = useLogs();
  const [showPopup, setShowPopup] = useState(false);
  const [logsChecked, setLogsChecked] = useState(false);
  
  // Function to check if a log entry for today already exists
  const hasLoggedToday = () => {
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return false;
    }
    
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    return logs.some(log => {
      // Check if the log date is today
      return log.date.startsWith(today);
    });
  };
  
  // Check whether to show the popup
  const checkShouldShowPopup = async () => {
    if (!logsChecked) {
      await fetchLogs(); // Make sure we have the latest logs
      setLogsChecked(true);
    }
  };
  
  // Handle app state changes (foreground, background)
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App came to foreground, check if we need to show the popup
      checkShouldShowPopup();
    }
  };
  
  // Set up app state listener and initial check
  useEffect(() => {
    // Check on initial mount
    checkShouldShowPopup();
    
    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Clean up
    return () => {
      subscription.remove();
    };
  }, []);
  
  // Determine whether to show popup based on logs and loading state
  useEffect(() => {
    // Only make a decision after loading is complete and logs have been checked
    if (!isLoading && logsChecked) {
      setShowPopup(!hasLoggedToday());
    }
  }, [isLoading, logs, logsChecked]);
  
  // If popup should not be shown, don't render anything
  if (!showPopup) {
    return null;
  }
  
  return (
    <DailyCheckInPopup onDismiss={() => setShowPopup(false)} />
  );
};

export default DailyCheckInController; 