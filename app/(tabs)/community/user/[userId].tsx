import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { useTheme } from '@/src/context/ThemeProvider';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { getAchievementImage, KNOWN_ACHIEVEMENT_IMAGE_CODES } from '@/src/utils/achievementImages';

type BackendUser = {
  id: string;
  name?: string;
  gender?: string;
  member_since?: string; // ISO string from backend DTO
  created_at?: string;
  streak?: number;
  last_achievement_code?: string;
};

export default function CommunityUserProfile() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { userId, achievementCode: achievementCodeParam } = useLocalSearchParams<{ userId: string; achievementCode?: string }>();

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
  // Prefer latest achievement avatar (same logic as chat). Fallback to gender placeholder.
  const lastAchievementCode =
    (achievementCodeParam as string) ||
    (user as any)?.last_achievement_code ||
    (user as any)?.sender_last_achievement_code ||
    (user as any)?.achievement_code ||
    (user as any)?.lastAchievementCode ||
    '';
  const achievementAvatarSource = lastAchievementCode ? getAchievementImage(String(lastAchievementCode)) : null;
  const avatar = achievementAvatarSource
    ? achievementAvatarSource
    : (gender === 'female'
    ? require('@/assets/images/girl2.png')
        : require('@/assets/images/boy2.png'));

  // Streak and "Til sober" (to 90 days)
  const rawStreak = Number((user as any)?.streak);
  const streakDays = Number.isFinite(rawStreak) && rawStreak >= 0 ? rawStreak : 0;
  const tillSober = Math.max(0, 90 - streakDays);

  // Build achievements list: unlocked if user's streak reached the threshold; others show a lock
  const achCodes = KNOWN_ACHIEVEMENT_IMAGE_CODES.filter(code => code !== 'WELCOME');
  const getDaysFromCode = (code: string): number => {
    const m = /^STREAK_(\d+)/.exec(code || '');
    return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
  };
  const achForRender = achCodes
    .slice()
    .sort((a, b) => getDaysFromCode(a) - getDaysFromCode(b))
    .map(code => ({
      code,
      unlocked: getDaysFromCode(code) <= streakDays,
    }));
  const memberSince = user?.member_since || user?.created_at;

  return (
    <GradientBackground>
      <Stack.Screen options={{ title: 'Profile', headerBackTitle: 'Back' }} />
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

        {/* Stats Widget */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Streak (d)</Text>
            <Text style={styles.statValue}>{streakDays}</Text>
          </View>

          <View style={styles.statColCenter}>
            <Text style={styles.statLabel}>Achievements</Text>
            <View style={styles.achScrollWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.achScrollContent}
              >
                {achForRender.map(({ code, unlocked }) => (
                  <View key={code} style={[styles.achItem, !unlocked && styles.achItemLock]}>
                    {unlocked ? (
                      <Image source={getAchievementImage(code)} style={styles.achImageFill} resizeMode="cover" />
                    ) : (
                      <Ionicons name="lock-closed" size={12} color={theme.colors.textMuted} />
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Til sober (d)</Text>
            <Text style={styles.statValue}>{tillSober}</Text>
          </View>
        </View>

        {/* User's posts section */}
        <View style={styles.postsSection}>
          <Text style={styles.postsSectionTitle}>User&apos;s posts</Text>
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
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  statCol: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statColCenter: {
    width: '40%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  achRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  achDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  achImage: {
    width: '100%',
    height: '100%',
  },
  achScrollWrap: {
    width: '100%',
  },
  achScrollContent: {
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  achItem: {
    width: 26,
    height: 26,
    borderRadius: 16,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  achItemLock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  achImageFill: {
    width: '100%',
    height: '100%',
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
  postsSection: {
    marginBottom: 16,
  },
  postsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  // removed card/table styles
});


