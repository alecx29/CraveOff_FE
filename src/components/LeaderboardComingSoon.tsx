import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/src/context/ThemeProvider';

const LeaderboardComingSoon: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
        style={styles.leaderboardGradient}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Ionicons name="trophy-outline" size={20} color={theme.colors.textPrimary} />
            <Text style={styles.title}>Leaderboard</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Coming Soon</Text>
          </View>
        </View>

        <Text style={styles.description}>
          See how you stack up with the community. Compete on clean days and milestones.
        </Text>

        <TouchableOpacity activeOpacity={0.8} style={styles.ctaButton} disabled>
          <Text style={styles.ctaText}>Stay tuned</Text>
          <Ionicons name="lock-closed-outline" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    marginBottom: 16,
    overflow: 'hidden',
    // ...theme.shadows.light,
  },
  leaderboardGradient: {
    padding: 16,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  badge: {
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundDeep,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginRight: 6,
  },
});

export default LeaderboardComingSoon;

