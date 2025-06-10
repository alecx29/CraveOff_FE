import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { useTheme } from '@/src/context/ThemeProvider';
import { useNotifications } from '@/src/context/NotificationsContext';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';

const NotificationsScreen = () => {
  const { theme } = useTheme();
  const { 
    isNotificationsEnabled, 
    setNotificationsEnabled, 
    requestPermissions,
    scheduleNotification
  } = useNotifications();
  const [permissionStatus, setPermissionStatus] = useState<string>('');
  
  const styles = createStyles(theme);

  // Get current permission status
  useEffect(() => {
    checkPermissionStatus();
  }, [isNotificationsEnabled]);

  const checkPermissionStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const handleMainToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermissions();
      if (!granted) {
        // If permissions weren't granted, don't update the UI state
        return;
      }
    }
    await setNotificationsEnabled(enabled);
  };

  const sendTestNotification = async () => {
    if (!isNotificationsEnabled) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications first to receive a test notification.',
        [{ text: 'OK' }]
      );
      return;
    }

    await scheduleNotification(
      'Test Notification',
      'This is a test notification from CraveOff. If you can see this, notifications are working correctly!',
      { seconds: 2 }
    );
    
    Alert.alert(
      'Test Notification Sent',
      'You should receive a notification in a few seconds.',
      [{ text: 'OK' }]
    );
  };

  return (
    <GradientBackground>
      <Stack.Screen options={{ 
        title: 'Notifications', 
        headerShown: true,
        headerBackTitle: 'Settings',
        headerStyle: {
          backgroundColor: theme.colors.backgroundDeep,
        },
        headerShadowVisible: true,
        headerBottomBorderColor: theme.colors.borderLight,
      }} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Main toggle */}
        <View style={styles.section}>
          <View style={styles.header}>
            <Ionicons name="notifications" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Notification Settings</Text>
          </View>
          
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>Notifications {isNotificationsEnabled ? 'Enabled' : 'Disabled'}</Text>
            <Text style={styles.permissionStatus}>
              Status: {
                permissionStatus === 'granted' ? 'Permission granted' :
                permissionStatus === 'denied' ? 'Permission denied' :
                'Not requested'
              }
            </Text>
            {permissionStatus === 'denied' && (
              <TouchableOpacity 
                style={styles.openSettingsButton} 
                onPress={() => Notifications.presentPermissionsRequestAsync()}
              >
                <Text style={styles.openSettingsText}>Open Settings</Text>
              </TouchableOpacity>
            )}
            <Switch
              value={isNotificationsEnabled}
              onValueChange={handleMainToggle}
              trackColor={{ false: theme.colors.cardInteractive, true: `${theme.colors.primary}30` }}
              thumbColor={isNotificationsEnabled ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>
        </View>

        {/* Test notification button */}
        <TouchableOpacity 
          style={[
            styles.testButton, 
            !isNotificationsEnabled && styles.disabledButton
          ]} 
          onPress={sendTestNotification}
          disabled={!isNotificationsEnabled}
        >
          <Ionicons name="paper-plane-outline" size={20} color={isNotificationsEnabled ? theme.colors.primary : theme.colors.textMuted} />
          <Text style={[
            styles.testButtonText,
            !isNotificationsEnabled && styles.disabledText
          ]}>Send Test Notification</Text>
        </TouchableOpacity>
        
        {/* Help text */}
        <Text style={styles.helpText}>
          Notifications help you stay on track with your goals. You'll receive reminders and achievement notifications when enabled.
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
    padding: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: 8,
  },
  permissionCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  permissionStatus: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginRight: 16,
  },
  testButton: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  disabledButton: {
    backgroundColor: `${theme.colors.cardBackground}80`,
  },
  testButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  disabledText: {
    color: theme.colors.textMuted,
  },
  helpText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  openSettingsButton: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.small,
    padding: 8,
    marginVertical: 8,
  },
  openSettingsText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default NotificationsScreen; 