import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieUniversal from '@/src/components/LottieUniversal';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { useTheme } from '@/src/context/ThemeProvider';
import { useNotifications } from '@/src/context/NotificationsContext';
import { AuthContext } from '@/src/context/AuthContext';
import { useUser } from '@/src/context/UserContext';
import { useLogs } from '@/src/context/LogsContext';
import { useJournal } from '@/src/context/JournalContext';
import { useAchievements } from '@/src/context/AchievementsContext';
import AButton from '@/src/components/AButton/AButton';
import DeleteAccountButton from '@/src/components/DeleteAccountButton';

import SettingCard from './SettingsCard';

const SettingsScreen = () => {
  const { theme } = useTheme();
  const { isNotificationsEnabled, setNotificationsEnabled, requestPermissions } = useNotifications();
  const { signOut, user: authUser } = useContext(AuthContext);
  const { resetUser } = useUser();
  const { resetLogs, lastRelapseData } = useLogs();
  const { resetJournal, entries } = useJournal();
  const { summary, refreshFromApi } = useAchievements();
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
    const emailUrl = 'mailto:romanalexandru29@gmail.com';
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.08)']}
          style={styles.avatarRing}
        >
          <View style={styles.avatarContainer}>
            <LottieUniversal
              source={require('@/assets/images/circle.json')}
              autoPlay
              loop
              resizeMode="cover"
              pointerEvents="none"
              style={styles.avatarLottie}
            />
          </View>
        </LinearGradient>
        <Text style={styles.username}>{authUser?.name || 'Your Name'}</Text>
        <Text style={styles.memberSince}>Member since 2025</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Clean Days */}
        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.28)']}
            style={styles.statGradient}
          >
            <Text style={styles.statNumber}>{cleanDays}</Text>
            <Ionicons name="flame" size={16} color={getFlameColor()} style={styles.statIcon} />
            <Text style={styles.statLabel}>Days Clean</Text>
          </LinearGradient>
        </View>
        
        {/* Journal Entries */}
        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.28)']}
            style={styles.statGradient}
          >
            <Text style={styles.statNumber}>{entries?.length || 0}</Text>
            <Text style={styles.statLabel}>Journal Entries</Text>
          </LinearGradient>
        </View>
        
        {/* Achievements */}
        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.28)']}
            style={styles.statGradient}
          >
            <Text style={styles.statNumber}>
              {summary ? `${summary.unlocked}/${summary.total}` : '—'}
            </Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Settings Options */}
      <SettingCard
        icon="trophy-outline"
        title="Achievements"
        value={summary ? `${summary.unlocked} of ${summary.total} Unlocked` : 'Loading...'}
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

      {/* Logout Button (restyled to match Delete button dimensions) */}
      <TouchableOpacity 
        style={[styles.logoutButton, styles.logoutButtonNew]} 
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={20} color={theme.colors.textPrimary} style={{ marginRight: 8 }} />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

      {/* Delete Account Button */}
      <DeleteAccountButton onSuccess={handleLogout} />
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 20,
    paddingTop: 44,
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
  // settingsIcon removed
  profileCard: {
    backgroundColor: theme.colors.backgroundDeep,
    borderRadius: theme.borderRadius.medium,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarLottie: {
    width: 80,
    height: 80,
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
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    padding: 0,
    alignItems: 'center',
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
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
  logoutButtonNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundDeep,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default SettingsScreen;

