import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

import { useTheme } from '@/src/context/ThemeProvider';
import { useNotifications } from '@/src/context/NotificationsContext';

import SettingCard from './SettingsCard';

const SettingsScreen = () => {
  const { theme } = useTheme();
  const { isNotificationsEnabled, setNotificationsEnabled } = useNotifications();
  const styles = createStyles(theme);

  const handleNotificationToggle = async (enabled: boolean) => {
    await setNotificationsEnabled(enabled);
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
        <Text style={styles.username}>Your Name</Text>
        <Text style={styles.memberSince}>Member since January 2024</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Clean Days */}
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>7</Text>
          <Ionicons name="flame" size={16} color={theme.colors.flame} style={styles.statIcon} />
          <Text style={styles.statLabel}>Days Clean</Text>
        </View>
        
        {/* Journal Entries */}
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Journal Entries</Text>
        </View>
        
        {/* Achievements */}
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
      </View>

      {/* Settings Options */}
      <SettingCard
        icon="notifications-outline"
        title="Notifications"
        onPress={() => {}}
        iconComponent={Ionicons}
      />
      <SettingCard
        icon="shield-outline"
        title="Privacy & Security"
        onPress={() => {}}
        iconComponent={Ionicons}
      />
      <SettingCard
        icon="help-circle-outline"
        title="Support"
        onPress={() => {}}
        iconComponent={Ionicons}
      />

      {/* Logout Button (hidden for now) */}
      {/* <AButton customStyles={{ button: styles.logoutButton }} title="Log Out" onPress={() => router.push('/login')} /> */}
    </ScrollView>
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

