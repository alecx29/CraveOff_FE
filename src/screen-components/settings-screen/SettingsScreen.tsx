import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/context/ThemeProvider';
import { useNotifications } from '@/src/context/NotificationsContext';
import { AuthContext } from '@/src/context/AuthContext';
import { useLogs } from '@/src/context/LogsContext';
import { useAchievements } from '@/src/context/AchievementsContext';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { getAchievementImage } from '@/src/utils/achievementImages';
import AchievementsPlanetsRow from '@/src/components/AchievementsPlanetsRow';

import SettingCard from './SettingsCard';

const SettingsScreen = () => {
  const { theme } = useTheme();
  const { isNotificationsEnabled } = useNotifications();
  const { user: authUser } = useContext(AuthContext);
  const { lastRelapseData } = useLogs();
  const { achievements: achievementsList, summary } = useAchievements();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  
  // State pentru clean days
  const [cleanDays, setCleanDays] = useState(0);
  // Longest streak (din backend – la fel ca în Analytics)
  const [longestStreak, setLongestStreak] = useState(0);
  
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

  // Fetch longest streak from backend (same endpoint as Analytics)
  useEffect(() => {
    const fetchBackendStreaks = async () => {
      try {
        const response = await apiClient.get(BackendRoutes.STREAKS);
        const data = response.data || {};
        const longest = data.longesStreak ?? data.longestStreak ?? data.longest ?? 0;
        if (Number.isFinite(Number(longest))) {
          setLongestStreak(Number(longest));
        } else {
          setLongestStreak(0);
        }
      } catch {
        setLongestStreak(0);
      }
    };
    fetchBackendStreaks();
  }, []);

  // Helper function to get the flame color safely
  const getFlameColor = (): string => {
    if ('flame' in theme.colors) return theme.colors.flame as string;
    if ('accentOrange' in theme.colors) return theme.colors.accentOrange as string;
    return theme.colors.accent as string || '#f97316'; // Default orange
  };

  // Removed local logout button; handled in Account Options screen

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
  
  const openAccountOptions = () => {
    router.push('/settings/account-options');
  };

  // Current (most recently unlocked) achievement to show as avatar
  const currentAchievementImage = useMemo(() => {
    try {
      const unlocked = (achievementsList || []).filter(a => !!a.unlocked);
      if (unlocked.length === 0) return null;
      const withDate = unlocked
        .map(a => ({
          item: a,
          date: a.unlockedAt ? new Date(a.unlockedAt) : null,
          threshold: typeof a.threshold === 'number' ? a.threshold : -1,
        }));
      // Prefer latest by date if available, otherwise by highest threshold
      withDate.sort((a, b) => {
        if (a.date && b.date) return b.date.getTime() - a.date.getTime();
        if (a.date && !b.date) return -1;
        if (!a.date && b.date) return 1;
        return b.threshold - a.threshold;
      });
      const winner = withDate[0]?.item;
      if (!winner) return null;
      return getAchievementImage(winner.code);
    } catch {
      return null;
    }
  }, [achievementsList]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 44) }]} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}>
      {/* Header */}
      
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>

            <View style={styles.avatarContainer}>
              <Image
                source={currentAchievementImage || require('@/assets/images/output1.webp')}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>


          <Text style={styles.username}>{authUser?.name || 'Your Name'}</Text>
          <Text style={styles.memberSince}>Member since 2025</Text>
        {/* </LinearGradient> */}
      </View>
      

      {/* Achievements Planets Banner */}
      <AchievementsPlanetsRow
        achievements={(achievementsList || []).filter(a => a.code !== 'WELCOME').map(a => ({ code: a.code, unlocked: !!a.unlocked }))}
        summary={summary}
        onPress={navigateToAchievements}
        maxItems={9}
        size={34}
        spacing={2}
        showHeader={false}
        bottomSpacing={20}
      />

      {/* Compact Stats Banner: Current Streak + Untill Sober in one container */}
      <View style={styles.statCardCompact}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.35)', 'rgba(76, 62, 98, 0.28)']}
          style={styles.statGradientCompact}
        >
          <View style={styles.statCombinedRow}>
            <View style={styles.statInlineRow}>
              <Ionicons name="flame" size={38} color={getFlameColor()} style={styles.statIconLeft} />
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>{longestStreak}d</Text>
                <Text style={styles.statLabel}>Longest Streak</Text>
              </View>
            </View>
            <View style={styles.statInlineRow}>
              <Text style={[styles.statEmoji, styles.statIconLeft]}>⏳</Text>
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>
                  {cleanDays >= 90 ? '0' : Math.max(0, 90 - cleanDays)}
                </Text>
                <Text style={styles.statLabel}>Untill Sober</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      <SettingCard
        icon="notifications-outline"
        title="Notifications"
        value={isNotificationsEnabled ? "Enabled" : "Disabled"}
        onPress={navigateToNotifications}
        emoji="🔔"
        variant="primary"
      />
      <SettingCard
        icon="shield-outline"
        title="Privacy & Security"
        value="Privacy Policy & Terms"
        onPress={openPrivacyPolicy}
        emoji="🔒"
        variant="primary"
      />
      <SettingCard
        icon="help-circle-outline"
        title="Support"
        value="Get Help"
        onPress={openSupport}
        emoji="💬"
        variant="primary"
      />
      <SettingCard
        icon="document-text-outline"
        title="Terms of Service"
        onPress={openTermsOfService}
        emoji="📜"
        variant="primary"
      />
      <SettingCard
        icon="person-circle-outline"
        title="Account Options"
        value="Manage account actions"
        onPress={openAccountOptions}
        emoji="👤"
        variant="primary"
      />

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
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    padding: 0,
    alignItems: 'center',
    marginBottom: 20,
  },
  profileGradient: {
    width: '100%',
    borderRadius: theme.borderRadius.medium,
    padding: 24,
    alignItems: 'center',
  },
  avatarRing: {
    width: 168,
    height: 168,
    borderRadius: 84,
    padding: 4,
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
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarLottie: {
    width: 80,
    height: 80,
  },
  avatarImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
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
    height: 88,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 88,
  },
  statInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  statNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  statIcon: {
    marginLeft: 6,
  },
  statIconLeft: {
    marginRight: 6,
  },
  statCol: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  statEmoji: {
    fontSize: 30,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  // Compact two-stat row under planets
  statsCompactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCardCompact: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    marginHorizontal: 0,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statGradientCompact: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statCombinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  // Removed logout button styles (moved to Account Options)
});

export default SettingsScreen;

