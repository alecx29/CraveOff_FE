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

  return (
    <GradientBackground>
      <Stack.Screen options={{ title: 'Profile' }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Image source={avatar} style={styles.avatar} />
          <View style={styles.headerText}>
            <Text style={styles.nameText}>{user?.name || 'User'}</Text>
          </View>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading profile...</Text>
        ) : user ? (
          <View style={styles.details}>
            <Text style={styles.detailRow}>Name: <Text style={styles.detailValue}>{user.name || '-'}</Text></Text>
            <Text style={styles.detailRow}>Gender: <Text style={styles.detailValue}>{user.gender || '-'}</Text></Text>
            <Text style={styles.detailRow}>Joined: <Text style={styles.detailValue}>{formatDate(user.created_at)}</Text></Text>
          </View>
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
    width: 64,
    height: 64,
    borderRadius: 32,
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
  loadingText: {
    color: theme.colors.textSecondary,
  },
  details: {
    marginTop: 8,
    gap: 6,
  },
  detailRow: {
    color: theme.colors.textSecondary,
  },
  detailValue: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});


