import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import AButton from '@/src/components/AButton/AButton';
import { useNotifications } from '@/src/context/NotificationsContext';

import SettingCard from './SettingsCard';

const CircularProgress = ({ progress }: { progress: number }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressBackground} />
    <View style={[styles.progressFill, { transform: [{ rotate: `${progress * 360}deg` }] }]} />
  </View>
);

const SettingsScreen = () => {
  const { isNotificationsEnabled, setNotificationsEnabled } = useNotifications();

  const handleNotificationToggle = async (enabled: boolean) => {
    await setNotificationsEnabled(enabled);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your experience</Text>
        </View>
        <View style={styles.headerIcon}>
          <CircularProgress progress={0.75} />
          <View style={styles.iconWrapper}>
            <Ionicons name="settings" size={24} color="#FFD33D" />
          </View>
        </View>
      </View>

      {/* Preferences Section */}
      <Text style={styles.sectionTitle}>Preferences</Text>
      {/* <SettingCard icon="moon" title="Dark Mode" showSwitch isActive={isDarkMode} onToggle={setIsDarkMode} /> */}
      <SettingCard
        icon="notifications"
        title="Push Notifications"
        showSwitch
        isActive={isNotificationsEnabled}
        onToggle={handleNotificationToggle}
      />
      {/* <SettingCard icon="sync" title="Auto Sync" showSwitch isActive={dataSync} onToggle={setDataSync} /> */}

      {/* Account Section */}
      <Text style={styles.sectionTitle}>Customization</Text>

      {/* Support Section */}
      <Text style={styles.sectionTitle}>Support</Text>
      <SettingCard icon="delete" title="Delete Account" onPress={() => {}} type="ant-design" />
      <SettingCard icon="mail" title="Contact Support" onPress={() => {}} />
      <SettingCard icon="information-circle" title="About" value="Version 1.0.0" onPress={() => {}} />

      {/* Logout Button */}
      <AButton customStyles={{ button: styles.logoutButton }} title="Log Out" onPress={() => router.push('/login')} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#1C1C1E",
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  headerIcon: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C6C6C',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 30,
    marginBottom: 15,
  },
  progressContainer: {
    width: 50,
    height: 50,
    position: 'absolute',
  },
  progressBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#3A3A3C',
    position: 'absolute',
  },
  progressFill: {
    width: 25,
    height: 50,
    position: 'absolute',
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    backgroundColor: '#FFD33D',
    transform: [{ rotate: '45deg' }],
    right: 0,
  },
  logoutButton: {
    marginTop: 30,
    marginBottom: 30,
  },
});

export default SettingsScreen;

