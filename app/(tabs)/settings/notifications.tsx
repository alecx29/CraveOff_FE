import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '@/src/context/ThemeProvider';
import { useNotifications } from '@/src/context/NotificationsContext';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';

const NotificationsScreen = () => {
  const { theme } = useTheme();
  const { 
    isNotificationsEnabled, 
    setNotificationsEnabled, 
    requestPermissions,
    scheduleNotification,
    scheduleDailyCheckIn,
    cancelDailyCheckIn
  } = useNotifications();
  const [permissionStatus, setPermissionStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [checkInEnabled, setCheckInEnabled] = useState<boolean>(true);
  
  const styles = createStyles(theme);

  // Helper function for safe color access
  const getCardInteractiveColor = (): string => {
    if ('cardInteractive' in theme.colors) return theme.colors.cardInteractive as string;
    return theme.colors.cardBackgroundAlt as string || theme.colors.neutral200 as string || '#F5F5F5';
  };

  // Get current permission status
  useEffect(() => {
    checkPermissionStatus();
    
    // Load check-in notification status
    const loadCheckInStatus = async () => {
      const status = await AsyncStorage.getItem('CHECK_IN_NOTIFICATION_ENABLED');
      setCheckInEnabled(status !== 'false');
    };
    
    loadCheckInStatus();
  }, [isNotificationsEnabled]);

  const checkPermissionStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const handleMainToggle = async (enabled: boolean) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (enabled) {
        // Explică utilizatorului de ce avem nevoie de permisiuni înainte de a le cere
        if (permissionStatus !== 'granted') {
          Alert.alert(
            'Allow notifications',
            'CraveOff uses notifications to help you stay motivated and remind you to track your progress. Would you like to enable notifications?',
            [
              { text: 'Not now', style: 'cancel', onPress: () => setIsLoading(false) },
              { 
                text: 'Enable', 
                onPress: async () => {
                  const granted = await requestPermissions();
                  if (granted) {
                    await setNotificationsEnabled(true);
                    
                    // If check-in is enabled, schedule it
                    if (checkInEnabled) {
                      await scheduleDailyCheckIn();
                    }
                  }
                  setIsLoading(false);
                }
              }
            ],
            { cancelable: false }
          );
          return;
        }
        
        await setNotificationsEnabled(true);
      } else {
        await setNotificationsEnabled(false);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCheckInToggle = async (enabled: boolean) => {
    if (isLoading || !isNotificationsEnabled) return;
    
    setIsLoading(true);
    try {
      setCheckInEnabled(enabled);
      await AsyncStorage.setItem('CHECK_IN_NOTIFICATION_ENABLED', enabled ? 'true' : 'false');
      
      if (enabled) {
        await scheduleDailyCheckIn();
        Alert.alert(
          'Check-in Reminder Set',
          'You will receive a daily reminder at 11:00 AM to check in with your progress.',
          [{ text: 'OK' }]
        );
      } else {
        await cancelDailyCheckIn();
      }
    } catch (error) {
      console.error('Error toggling check-in notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAppSettings = async () => {
    await Linking.openSettings();
  };

  const sendTestNotification = async () => {
    if (!isNotificationsEnabled) {
      Alert.alert(
        'Notifications disabled',
        'Please enable notifications to receive a test notification.',
        [{ text: 'OK' }]
      );
      return;
    }

    await scheduleNotification(
      'Test notification',
      'This is a test notification from CraveOff. If you can see it, notifications are working correctly!',
      { seconds: 2, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL }
    );
    
    Alert.alert(
      'Test notification sent',
      'You should receive a notification in a few seconds.',
      [{ text: 'OK' }]
    );
  };

  // Helper pentru a afișa statusul permisiunii într-un mod prietenos
  const getPermissionStatusText = () => {
    switch(permissionStatus) {
      case 'granted':
        return 'Permission granted';
      case 'denied':
        return 'Permission denied';
      case 'undetermined':
        return 'Permission not requested';
      default:
        return 'Unknown';
    }
  };

  // Helper pentru a afișa culoarea statusului permisiunii
  const getPermissionStatusColor = () => {
    switch(permissionStatus) {
      case 'granted':
        return (theme.colors as any).success || '#22c55e';
      case 'denied':
        return (theme.colors as any).error || '#ef4444';
      default:
        return theme.colors.textMuted;
    }
  };

  return (
    <GradientBackground>
      <Stack.Screen options={{ 
        title: 'Notifications', 
        headerShown: true,
        headerBackTitle: 'Settings',
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerShadowVisible: true,
      }} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Main toggle */}
        <View style={styles.section}>
          <View style={styles.header}>
            <Ionicons name="notifications" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Notification settings</Text>
          </View>
          
          <View style={styles.permissionCard}>
            <View style={styles.permissionContent}>
              <View style={styles.permissionInfo}>
                <Text style={styles.permissionTitle}>
                  Notifications {isNotificationsEnabled ? 'enabled' : 'disabled'}
                </Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: getPermissionStatusColor() }]} />
                  <Text style={[styles.permissionStatus, { color: getPermissionStatusColor() }]}>
                    {getPermissionStatusText()}
                  </Text>
                </View>
              </View>
              
              <Switch
                value={isNotificationsEnabled}
                onValueChange={handleMainToggle}
                trackColor={{ false: getCardInteractiveColor(), true: `${theme.colors.primary}30` }}
                thumbColor={isNotificationsEnabled ? theme.colors.primary : theme.colors.textSecondary}
                disabled={isLoading}
              />
            </View>
            
            {permissionStatus === 'denied' && (
              <View style={styles.settingsButtonContainer}>
                <Text style={styles.settingsHelpText}>
                  To receive notifications, you need to enable them in your device settings.
                </Text>
                <TouchableOpacity 
                  style={styles.openSettingsButton} 
                  onPress={openAppSettings}
                >
                  <Text style={styles.openSettingsText}>Open Settings</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Daily Check-in Section */}
        {isNotificationsEnabled && (
          <View style={styles.section}>
            <View style={styles.header}>
              <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Daily Check-in</Text>
            </View>
            
            <View style={styles.notificationTypeCard}>
              <View style={styles.notificationTypeContent}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.notificationTypeTitle}>
                    Daily Check-in Reminder
                  </Text>
                  <Text style={styles.notificationTypeDescription}>
                    Receive a daily reminder at 11:00 AM to check in with your progress
                  </Text>
                </View>
                
                <Switch
                  value={checkInEnabled}
                  onValueChange={handleCheckInToggle}
                  trackColor={{ false: getCardInteractiveColor(), true: `${theme.colors.primary}30` }}
                  thumbColor={checkInEnabled ? theme.colors.primary : theme.colors.textSecondary}
                  disabled={isLoading || !isNotificationsEnabled}
                />
              </View>
            </View>
          </View>
        )}

        {/* Test notification button */}
        <TouchableOpacity 
          style={[
            styles.testButton, 
            !isNotificationsEnabled && styles.disabledButton
          ]} 
          onPress={sendTestNotification}
          disabled={!isNotificationsEnabled || isLoading}
        >
          <Ionicons name="paper-plane-outline" size={20} color={isNotificationsEnabled ? theme.colors.primary : theme.colors.textMuted} />
          <Text style={[
            styles.testButtonText,
            !isNotificationsEnabled && styles.disabledText
          ]}>Send test notification</Text>
        </TouchableOpacity>
        
        {/* Help text */}
        <Text style={styles.helpText}>
          Notifications help you stay on track with your goals. You will receive reminders and achievement notifications when they are enabled.
        </Text>
      </ScrollView>
    </GradientBackground>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: theme.typography.subheading,
    fontWeight: theme.typography.weightSemiBold,
    color: theme.colors.textPrimary,
    marginLeft: 8,
  },
  permissionCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    marginBottom: 8,
  },
  permissionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weightMedium,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  permissionStatus: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
  },
  settingsButtonContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  settingsHelpText: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 14,
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  testButtonText: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weightMedium,
    color: theme.colors.primary,
    marginLeft: 8,
  },
  disabledText: {
    color: theme.colors.textMuted,
  },
  helpText: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  notificationTypeCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    marginBottom: 8,
  },
  notificationTypeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationTypeTitle: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weightMedium,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  notificationTypeDescription: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    maxWidth: '80%',
    flexShrink: 1,
  },
  openSettingsButton: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.small,
    padding: 10,
    alignItems: 'center',
  },
  openSettingsText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default NotificationsScreen; 