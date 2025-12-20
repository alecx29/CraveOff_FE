import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { useTheme } from '@/src/context/ThemeProvider';

const SETTINGS_INFO = {
  push: {
    title: 'Push Notifications',
  },
  community_notify_on_my_posts: {
    title: 'Notify on My Posts',
  },
  community_notify_on_followed_posts: {
    title: 'Notify on Followed Posts',
  },
};

export default function NotificationSettingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [notifyMyPosts, setNotifyMyPosts] = useState(true);
  const [notifyFollowedPosts, setNotifyFollowedPosts] = useState(true);

  const switches = [
    {
      key: 'push' as const,
      value: pushEnabled,
      onChange: setPushEnabled,
    },
    {
      key: 'community_notify_on_my_posts' as const,
      value: notifyMyPosts,
      onChange: setNotifyMyPosts,
    },
    {
      key: 'community_notify_on_followed_posts' as const,
      value: notifyFollowedPosts,
      onChange: setNotifyFollowedPosts,
    },
  ];

  const getTrackColor = (value: boolean) => ({
    false: 'rgba(255,255,255,0.15)',
    true: theme.colors.primary + '55',
  });

  const getThumbColor = (value: boolean) =>
    value ? theme.colors.primary : theme.colors.cardBackground;

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.back()}
            style={styles.iconButton}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.title}>Notifications</Text>

          <View style={styles.iconButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.caption}>
            Choose what you want to be notified about. You can tweak these anytime.
          </Text>

          <Text style={styles.sectionTitle}>Push Notifications</Text>

          <View style={styles.switchGroup}>
            {switches.map(({ key, value, onChange }) => {
              const info = SETTINGS_INFO[key];
              return (
                <View key={key} style={styles.settingCard}>
                  <View style={styles.settingCopy}>
                    <Text style={styles.settingTitle}>{info.title}</Text>
                  </View>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={getTrackColor(value)}
                    thumbColor={getThumbColor(value)}
                    ios_backgroundColor="rgba(255,255,255,0.15)"
                  />
                </View>
              );
            })}
          </View>

        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const createStyles = (theme: any, insetTop: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: Math.max(insetTop, 16) + 8,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    iconButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    content: {
      paddingBottom: 32,
      gap: 16,
    },
    caption: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    sectionTitle: {
      marginTop: 12,
      marginBottom: 8,
      fontSize: 20,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: 0.2,
    },
    switchGroup: {
      gap: 12,
    },
    settingCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: 12,
    },
    settingCopy: {
      flex: 1,
      paddingRight: 12,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
  });

