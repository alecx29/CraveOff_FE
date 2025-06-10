import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { useTheme } from '@/src/context/ThemeProvider';
import { useNotifications } from '@/src/context/NotificationsContext';
import { AuthContext } from '@/src/context/AuthContext';
import AButton from '@/src/components/AButton/AButton';

import SettingCard from './SettingsCard';

const SettingsScreen = () => {
  const { theme } = useTheme();
  const { isNotificationsEnabled, setNotificationsEnabled, requestPermissions } = useNotifications();
  const { signOut } = useContext(AuthContext);
  const styles = createStyles(theme);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const navigateToNotifications = () => {
    router.push('/settings/notifications');
  };

  const openPrivacyPolicy = async () => {
    await WebBrowser.openBrowserAsync('https://www.craveoff.app/privacy-policy');
  };

  const openSupport = async () => {
    await WebBrowser.openBrowserAsync('https://www.craveoff.app/support');
  };

  const openTermsOfService = async () => {
    await WebBrowser.openBrowserAsync('https://www.craveoff.app/terms-of-service');
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
      />
      <SettingCard
        icon="help-circle-outline"
        title="Support"
        value="Get Help"
        onPress={openSupport}
        iconComponent={Ionicons}
      />
      <SettingCard
        icon="document-text-outline"
        title="Terms of Service"
        onPress={openTermsOfService}
        iconComponent={Ionicons}
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

