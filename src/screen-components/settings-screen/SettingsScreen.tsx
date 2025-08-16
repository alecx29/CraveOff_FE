import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { useTheme } from '@/src/context/ThemeProvider';
import { useNotifications } from '@/src/context/NotificationsContext';
import { AuthContext } from '@/src/context/AuthContext';
import { useUser } from '@/src/context/UserContext';
import { useLogs } from '@/src/context/LogsContext';
import { useJournal } from '@/src/context/JournalContext';
import AButton from '@/src/components/AButton/AButton';

import SettingCard from './SettingsCard';

const SettingsScreen = () => {
  const { theme } = useTheme();
  const { isNotificationsEnabled, setNotificationsEnabled, requestPermissions } = useNotifications();
  const { signOut, user: authUser } = useContext(AuthContext);
  const { resetUser } = useUser();
  const { resetLogs, lastRelapseData } = useLogs();
  const { resetJournal, entries } = useJournal();
  const styles = createStyles(theme);
  
  // State pentru clean days
  const [cleanDays, setCleanDays] = useState(0);
  
  // Calculăm zilele clean pe baza ultimei recidive
  useEffect(() => {
    if (lastRelapseData && lastRelapseData.last_relapse_date) {
      try {
        // Parse the relapse date which comes in UTC format
        const relapseDateTime = new Date(lastRelapseData.last_relapse_date);
        
        // Check if the date is valid
        if (isNaN(relapseDateTime.getTime())) {
          console.error('Invalid date format:', lastRelapseData.last_relapse_date);
          setCleanDays(0);
          return;
        }
        
        // Get current time
        const now = new Date();
        
        // Calculate the time difference in milliseconds
        const diffTimeMs = now.getTime() - relapseDateTime.getTime();
        
        // Only proceed if the relapse date is in the past
        if (diffTimeMs > 0) {
          // Calculate days based on milliseconds
          const diffDays = Math.floor(diffTimeMs / (24 * 3600 * 1000));
          setCleanDays(diffDays);
        } else {
          setCleanDays(0);
        }
      } catch (e) {
        console.error('Error parsing or calculating time from last_relapse_date:', e);
        setCleanDays(0);
      }
    } else {
      setCleanDays(0);
    }
  }, [lastRelapseData]);

  // Helper function to get the flame color safely
  const getFlameColor = (): string => {
    if ('flame' in theme.colors) return theme.colors.flame as string;
    if ('accentOrange' in theme.colors) return theme.colors.accentOrange as string;
    return theme.colors.accent as string || '#f97316'; // Default orange
  };

  const handleLogout = async () => {
    await signOut();
    resetUser();
    resetLogs();
    resetJournal();
    router.push('/login');
  };

  const navigateToNotifications = () => {
    router.push('/settings/notifications');
  };
  
  const navigateToAchievements = () => {
    router.push('/settings/achievements');
  };

  const openPrivacyPolicy = async () => {
    await WebBrowser.openBrowserAsync('https://www.craveoffapp.com/privacy-policy');
  };

  const openSupport = async () => {
    const emailUrl = 'mailto:romanalexandru123@gmail.com';
    try {
      const supported = await Linking.canOpenURL(emailUrl);
      if (supported) {
        await Linking.openURL(emailUrl);
      } else {
        console.log('Email app not available');
        // Fallback to web browser if email app is not available
        await WebBrowser.openBrowserAsync('https://www.craveoffapp.com/support');
      }
    } catch (error) {
      console.error('Error opening email app:', error);
      // Fallback to web browser on error
      await WebBrowser.openBrowserAsync('https://www.craveoffapp.com/support');
    }
  };

  const openTermsOfService = async () => {
    await WebBrowser.openBrowserAsync('https://www.craveoffapp.com/terms-and-conditions');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.settingsIcon}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.username}>{authUser?.name || 'Your Name'}</Text>
        <Text style={styles.memberSince}>Member since 2025</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Clean Days */}
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{cleanDays}</Text>
          <Ionicons name="flame" size={16} color={getFlameColor()} style={styles.statIcon} />
          <Text style={styles.statLabel}>Days Clean</Text>
        </View>
        
        {/* Journal Entries */}
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{entries?.length || 0}</Text>
          <Text style={styles.statLabel}>Journal Entries</Text>
        </View>
        
        {/* Achievements */}
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>1/2</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
      </View>

      {/* Settings Options */}
      <SettingCard
        icon="trophy-outline"
        title="Achievements"
        value="1 of 2 Unlocked"
        onPress={navigateToAchievements}
        iconComponent={Ionicons}
        variant="primary"
      />
      <SettingCard
        icon="notifications-outline"
        title="Notifications"
        value={isNotificationsEnabled ? "Enabled" : "Disabled"}
        onPress={navigateToNotifications}
        iconComponent={Ionicons}
        variant="primary"
      />
      <SettingCard
        icon="shield-outline"
        title="Privacy & Security"
        value="Privacy Policy & Terms"
        onPress={openPrivacyPolicy}
        iconComponent={Ionicons}
        variant="primary"
      />
      <SettingCard
        icon="help-circle-outline"
        title="Support"
        value="Get Help"
        onPress={openSupport}
        iconComponent={Ionicons}
        variant="primary"
      />
      <SettingCard
        icon="document-text-outline"
        title="Terms of Service"
        onPress={openTermsOfService}
        iconComponent={Ionicons}
        variant="primary"
      />

      {/* Logout Button */}
      <AButton 
        customStyles={{ button: styles.logoutButton }} 
        title="Log Out" 
        onPress={handleLogout}
        variant="outline" 
        leftIcon={<Ionicons name="log-out-outline" size={20} color={theme.colors.primary} />}
      />
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: theme.colors.backgroundDeep,
    borderRadius: theme.borderRadius.medium,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statIcon: {
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 30,
    marginBottom: 30,
  },
});

export default SettingsScreen;

