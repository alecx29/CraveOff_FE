import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { useTheme } from '@/src/context/ThemeProvider';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';

type BackendUser = {
  id: string;
  name?: string;
  gender?: string;
  member_since?: string; // ISO string from backend DTO
  created_at?: string;
};

export default function CommunityUserProfile() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const fetchUser = useCallback(async () => {
    try {
      setError(false);
      setLoading(true);
      const res = await apiClient.get(BackendRoutes.USER_BY_ID(String(userId)));
      setUser(res.data || null);
    } catch {
      setError(true);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // If backend not ready yet, it's okay; we still render a mock
    fetchUser();
  }, [fetchUser]);

  const gender = (user?.gender || '').toLowerCase();
  const avatar = gender === 'female'
    ? require('@/assets/images/girl2.png')
    : require('@/assets/images/boy2.png');
  const memberSince = user?.member_since || user?.created_at;

  return (
    <GradientBackground>
      <Stack.Screen options={{ title: 'Profile', headerBackTitle: 'Back', headerBackTitleVisible: true }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Image source={avatar} style={styles.avatar} />
          <View style={styles.headerText}>
            <Text style={styles.nameText}>{user?.name || 'User'}</Text>
            {!!memberSince && (
              <Text style={styles.metaText}>Member since {formatDate(memberSince)}</Text>
            )}
            {!!user?.gender && (
              <View style={styles.pillRow}>
                <View style={styles.pill}><Text style={styles.pillText}>{user.gender}</Text></View>
              </View>
            )}
          </View>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading profile...</Text>
        ) : error ? (
          <Text style={styles.loadingText}>Could not load profile.</Text>
        ) : null}
      </View>
    </GradientBackground>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return '-';
  }
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  metaText: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  pillRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)'
  },
  pillText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loadingText: {
    color: theme.colors.textSecondary,
  },
  // removed card/table styles
});


