import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedProps } from 'react-native-reanimated';
import { Svg, Circle, G } from 'react-native-svg';

import { useTheme } from '@/src/context/ThemeProvider';
import { useLogs } from '@/src/context/LogsContext';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAchievementImage } from '@/src/utils/achievementImages';
import { useAchievements } from '@/src/context/AchievementsContext';
import BenefitsWidget from '@/src/components/analytics/BenefitsWidget';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
// Helper function to safely access theme colors
const getColor = (theme: any, colorName: string, fallbackColor: string): string => {
  const colors = theme.colors as Record<string, string>;
  if (colorName in colors) return colors[colorName];
  return fallbackColor;
};

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const { lastRelapseData, logs, currentStreak } = useLogs();
  const { achievements, summary } = useAchievements();
  const styles = createStyles(theme, getColor);

  // State for clean days progress (derived from context currentStreak)
  const [cleanDays, setCleanDays] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Stats for streak statistics (from backend only)
  const [averageStreak, setAverageStreak] = useState(0);

  // Animation value for circle progress
  const progressAnimation = useSharedValue(0);

  // Circle parameters
  const size = 280;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Derive clean days from shared context currentStreak
  useEffect(() => {
    const diffDays = Number.isFinite(Number(currentStreak)) ? Number(currentStreak) : 0;
    setCleanDays(diffDays);
    const percentage = Math.min(100, Math.round((diffDays / 90) * 100));
    setProgressPercentage(percentage);
  }, [currentStreak]);

  // Use backend streaks
  useEffect(() => {
    if (logs && logs.length > 0) {
      fetchBackendStreaks();
    }
  }, [logs]);

  // Always fetch backend-provided streaks on mount
  useEffect(() => {
    fetchBackendStreaks();
  }, []);

  // Removed local longest/average streak calculations to rely solely on backend values

  // Fetch longest and average streak from backend (/streak/summary)
  const fetchBackendStreaks = async () => {
    try {
      const response = await apiClient.get(BackendRoutes.STREAKS);
      const data = response.data || {};
      const toNumber = (value: any) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
      };
      const average =
        data.avg_streak ??
        data.avgStreak ??
        data.averageStreak ??
        data.average ??
        0;
      if (average !== undefined) setAverageStreak(toNumber(average));
    } catch (error) {
      console.error('Failed to fetch backend streaks:', error);
      // Keep locally computed values as fallback
    }
  };


  // Update animated values when progress percentage changes
  useEffect(() => {
    progressAnimation.value = withTiming(progressPercentage / 100, {
      duration: 1500,
      easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
    });
  }, [progressPercentage, progressAnimation]);

  // Animated props for the circle
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progressAnimation.value);
    return {
      strokeDashoffset
    };
  });

  // Helper: format date as "Feb 17 2026"
  const formatDateShort = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = months[date.getMonth()];
    const d = date.getDate();
    const y = date.getFullYear();
    return `${m} ${d} ${y}`;
  };

  // Quit by date: last relapse + 90 days (fallback to today if unknown)
  const relapseIso = (lastRelapseData as any)?.last_relapse_date
    ?? (lastRelapseData as any)?.lastRelapseDate
    ?? (lastRelapseData as any)?.date
    ?? null;
  const relapseBase = relapseIso ? new Date(relapseIso) : new Date();
  const quitByDate = new Date(relapseBase.getTime() + (90 * 24 * 60 * 60 * 1000));
  const quitByText = formatDateShort(quitByDate);

  // removed Monthly Progress calculations

  // Chart configuration
  // Derived achievement widget data
  const achievementStats = useMemo(() => {
    const total = summary?.total ?? achievements.length ?? 0;
    const unlocked = summary?.unlocked ?? achievements.filter(a => a.unlocked).length ?? 0;
    const progress = total > 0 ? Math.min(100, Math.round((unlocked / total) * 100)) : 0;

    const sorted = [...achievements].sort(
      (a, b) => (a.threshold ?? 0) - (b.threshold ?? 0)
        );

    const current =
      sorted.slice().reverse().find(item => item.unlocked) ||
      (sorted.length > 0 ? sorted[0] : undefined);

    return {
      level: unlocked,
      progress,
      currentAchievement: current,
    };
  }, [achievements, summary]);

  const achievementWidgetProgress = achievementStats.progress;
  const achievementWidgetImage = getAchievementImage(
    achievementStats.currentAchievement?.code || 'STREAK_1'
  );
  const achievementWidgetDescription =
    achievementStats.currentAchievement?.description ||
    "You don't have urges anymore, mind is clear and physical form is almost at it's peak.";

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1, paddingTop: 12 }} edges={['top','left','right']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Analytics</Text>
        <Text style={styles.screenSubtitle}>Track your progress and insights</Text>

        {/* Main progress circle - no section background and without title */}
        <View style={styles.circleProgressCard}>
          <View style={styles.circleProgressPlain}>
            <View style={styles.circleContainer}>
              <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background Circle */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={'rgba(76, 62, 98, 0.25)'}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />

                {/* Progress Circle */}
                <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                  <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(34, 197, 94, 0.3)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={[circumference, circumference]}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                  />
                </G>
              </Svg>

              <Animated.View style={[styles.progressTextContainer]}>
                <Text style={styles.recoveryText}>RECOVERY</Text>
                <Text style={styles.percentageText}>{progressPercentage}%</Text>
              </Animated.View>
            </View>
            <Text style={styles.goalText}>Goal: 90 days porn-free</Text>
          </View>
        </View>

        {/* Quit by (last relapse + 90d) */}
        <View style={[styles.card]}>
          <LinearGradient
            colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
            style={[styles.cardGradient, styles.quitByCard]}
          >
            <View style={styles.singleStatCenter}>
              <Text style={styles.statLabel}>Quit by</Text>
              <Text style={styles.statValue}>{quitByText}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* General stats as two separate bubbles */}
        <View style={styles.twoBubbleRow}>
          <View style={styles.bubbleWrap}>
            <LinearGradient
              colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
              style={[styles.cardGradient, styles.bubbleCard]}
            >
              <View style={styles.singleStatCenter}>
                <Text style={styles.statLabel}>Current Streak</Text>
                <Text style={styles.statValue}>{cleanDays}d</Text>
              </View>
            </LinearGradient>
          </View>
          <View style={styles.bubbleWrap}>
            <LinearGradient
              colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
              style={[styles.cardGradient, styles.bubbleCard]}
            >
              <View style={styles.singleStatCenter}>
                <Text style={styles.statLabel}>Avg. Streak</Text>
                <Text style={styles.statValue}>{averageStreak}d</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Hardcoded achievement widget */}
        <View style={styles.achievementWidget}>
          <LinearGradient
            colors={['#7c2dbf', '#c02670']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.achievementGradient}
          >
            <Image source={achievementWidgetImage} style={styles.achievementImage} />
            <View style={styles.achievementContent}>
              <View style={styles.achievementHeaderRow}>
                <Text style={styles.achievementLevel}>Level {achievementStats.level}</Text>
                <Text style={styles.achievementPercent}>{achievementWidgetProgress}%</Text>
              </View>
              <View style={styles.achievementProgressTrack}>
                <View
                    style={[
                    styles.achievementProgressFill,
                    { width: `${achievementWidgetProgress}%` }
                  ]}
                />
                  </View>
              <Text style={styles.achievementDescription}>
                {achievementWidgetDescription}
            </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Monthly Progress removed */}

        {/* Benefits list widget */}
        <BenefitsWidget cleanDays={cleanDays} />

        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const createStyles = (theme: any, getColor: (theme: any, colorName: string, fallbackColor: string) => string) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  circleProgressCard: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    padding: 0,
    marginBottom: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  circleProgressGradient: {
    padding: 16,
    borderRadius: theme.borderRadius.medium,
    width: '100%',
    alignItems: 'center',
  },
  circleProgressPlain: {
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  circleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 12,
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    elevation: 0,
    zIndex: 10,
  },
  recoveryText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  percentageText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  progressPercentText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  goalText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    padding: 0,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    borderRadius: theme.borderRadius.medium,
  },
  quitByCard: {
    minHeight: 100,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  twoBubbleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bubbleWrap: {
    width: '48%',
  },
  bubbleCard: {
    paddingVertical: 10,
    minHeight: 70,
    justifyContent: 'center',
  },
  achievementWidget: {
    marginBottom: 16,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  achievementGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: theme.borderRadius.medium,
  },
  achievementImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementLevel: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  achievementPercent: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  achievementProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  achievementProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  achievementDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  singleStatCenter: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    paddingBottom: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  // removed monthly progress bar styles
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: getColor(theme, 'cardInteractive', '#F1F5F9'),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  activePledgeBanner: {
    flexDirection: 'row',
    backgroundColor: getColor(theme, 'success', '#4ade80'),
    borderRadius: 12,
    marginHorizontal: 0,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activePledgeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activePledgeContent: {
    flex: 1,
  },
  activePledgeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  activePledgeText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 6,
  },
  activePledgeTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activePledgeTimerIcon: {
    marginRight: 4,
  },
  activePledgeTimerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  
  noDataContainer: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 20,
  },
  noDataText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  contentContainer: {
    paddingBottom: 60,
  },
});

