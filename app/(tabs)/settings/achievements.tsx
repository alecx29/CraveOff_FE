import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { useLogs } from '@/src/context/LogsContext';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { useAchievements } from '@/src/context/AchievementsContext';
import LottieUniversal from '@/src/components/LottieUniversal';

const AchievementsScreen = () => {
  const { theme } = useTheme();
  const { currentStreak, lastRelapseData } = useLogs();
  const { achievements: storedAchievements, summary: storedSummary, setFromServer } = useAchievements();
  const styles = createStyles(theme);

  // Helper: format date nice
  const formatDate = (d: Date) => d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  // Helper: estimate unlock date from last relapse
  const estimateUnlockDate = (days: number): string | undefined => {
    try {
      const relapse = lastRelapseData?.last_relapse_date ? new Date(lastRelapseData.last_relapse_date) : null;
      if (!relapse || isNaN(relapse.getTime())) return undefined;
      const unlockDate = new Date(relapse.getTime() + days * 24 * 3600 * 1000);
      const now = new Date();
      // If threshold already passed, cap at today for display
      return formatDate(unlockDate > now ? now : unlockDate);
    } catch {
      return undefined;
    }
  };

  // Dynamic achievements driven by backend codes; fallback definitions
  const milestoneDefs = [
    { id: 'WELCOME', title: 'Welcome to CraveOff', desc: 'You took the first step towards a healthier life', icon: 'ribbon-outline' as const, threshold: 0, xp: 100 },
    { id: 'STREAK_7', title: '7 Days Clean', desc: 'Stay clean for 7 consecutive days', icon: 'medal-outline' as const, threshold: 7, xp: 150 },
    { id: 'STREAK_30', title: '30 Days Clean', desc: 'Stay clean for 30 consecutive days', icon: 'trophy-outline' as const, threshold: 30, xp: 300 },
    { id: 'STREAK_60', title: '60 Days Clean', desc: 'Stay clean for 60 consecutive days', icon: 'trophy-outline' as const, threshold: 60, xp: 600 },
    { id: 'STREAK_90', title: '90 Days Clean', desc: 'Stay clean for 90 consecutive days', icon: 'trophy-outline' as const, threshold: 90, xp: 1000 },
  ];

  const [achievements, setAchievements] = React.useState<Array<{
    id: string;
    title: string;
    description: string;
    icon: any;
    unlocked: boolean;
    date?: string;
    xp: number;
  }>>([]);

  // Fetch achievements on mount
  React.useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const response = await apiClient.get(BackendRoutes.ACHIEVEMENTS);
        const list = response?.data?.achievements || [];

        // Map backend items by code
        const mapped = milestoneDefs.map(def => {
          const serverItem = list.find((it: any) => it.code === def.id);
          const isUnlocked = serverItem ? !!serverItem.unlocked : (def.threshold === 0 ? true : currentStreak >= def.threshold);
          // Only show date if provided by backend; no fallback date
          const unlockedAt = serverItem?.unlockedAt;
          return {
            id: def.id,
            title: serverItem?.title || def.title,
            description: serverItem?.description || def.desc,
            icon: def.icon,
            unlocked: isUnlocked,
            date: unlockedAt,
            xp: serverItem?.xp ?? def.xp,
          };
        });

        setAchievements(mapped);
        // Persist to store for profile usage
        await setFromServer(list);
      } catch (e) {
        // Fallback to local calculation if API fails
        const fallback = milestoneDefs.map(def => ({
          id: def.id,
          title: def.title,
          description: def.desc,
          icon: def.icon,
          unlocked: def.threshold === 0 ? true : currentStreak >= def.threshold,
          date: def.threshold > 0 && currentStreak >= def.threshold ? estimateUnlockDate(def.threshold) : (def.threshold === 0 ? formatDate(new Date()) : undefined),
          xp: def.xp,
        }));
        setAchievements(fallback);
      }
    };

    // Prefer store if available; otherwise fetch
    if (storedAchievements && storedAchievements.length > 0) {
      // Map store entries to UI using defs for icons/xp
      const mapped = milestoneDefs.map(def => {
        const serverItem = storedAchievements.find((it: any) => it.code === def.id);
        const isUnlocked = serverItem ? !!serverItem.unlocked : (def.threshold === 0 ? true : currentStreak >= def.threshold);
        const unlockedAt = serverItem?.unlockedAt;
        return {
          id: def.id,
          title: serverItem?.title || def.title,
          description: serverItem?.description || def.desc,
          icon: def.icon,
          unlocked: isUnlocked,
          date: unlockedAt,
          xp: serverItem?.xp ?? def.xp,
        };
      });
      setAchievements(mapped);
    } else {
      fetchAchievements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculăm progresul total
  const totalAchievements = achievements.length;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const progressPercentage = (unlockedAchievements / totalAchievements) * 100;
  const totalXP = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0);

  return (
    <GradientBackground>
      <Stack.Screen options={{ 
        title: 'Achievements', 
        headerShown: true,
        headerBackTitle: 'Profile',
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerShadowVisible: true,
      }} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Progress Header */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(600)} 
          style={styles.progressCard}
        >
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Achievement Progress</Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{unlockedAchievements}/{totalAchievements}</Text>
            </View>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${progressPercentage}%` }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.progressInfo}>
            <View style={styles.xpContainer}>
              <Ionicons name="flash" size={16} color={theme.colors.primary} />
              <Text style={styles.xpText}>{totalXP} XP</Text>
            </View>
            <Text style={styles.progressPercentText}>{Math.round(progressPercentage)}% Complete</Text>
          </View>
        </Animated.View>
        
        {/* Achievements List */}
        <View style={styles.achievementsContainer}>
          <View style={styles.header}>
            <Ionicons name="trophy" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Your Achievements</Text>
          </View>
          
          {achievements.map((achievement, index) => (
            <Animated.View 
              key={achievement.id}
              entering={FadeInUp.delay(200 + index * 100).duration(400)}
              style={[
                styles.achievementCard,
                achievement.unlocked ? styles.achievementUnlocked : styles.achievementLocked
              ]}
            >
              <View style={styles.achievementIconContainer}>
                {achievement.unlocked ? (
                  <View style={styles.achievementIconBg}>
                    <Ionicons 
                      name={achievement.icon as any} 
                      size={24} 
                      color={theme.colors.textPrimary} 
                    />
                    <View style={styles.checkmarkBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={theme.colors.success || '#22c55e'} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.achievementIconBgLocked}>
                    <Ionicons 
                      name={achievement.icon as any} 
                      size={24} 
                      color={theme.colors.textMuted} 
                    />
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={12} color={theme.colors.textMuted} />
                    </View>
                  </View>
                )}
              </View>
              
              <View style={styles.achievementContent}>
                <Text style={[
                  styles.achievementTitle,
                  !achievement.unlocked && styles.achievementTitleLocked
                ]}>
                  {achievement.title}
                </Text>
                <Text style={[
                  styles.achievementDescription,
                  !achievement.unlocked && styles.achievementDescriptionLocked
                ]}>
                  {achievement.description}
                </Text>
                
                {achievement.unlocked && achievement.date && (
                  <View style={styles.achievementDateContainer}>
                    <Ionicons name="calendar-outline" size={12} color={theme.colors.textMuted} />
                    <Text style={styles.achievementDate}>Unlocked on {achievement.date}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.achievementXpContainer}>
                <Text style={[
                  styles.achievementXp,
                  !achievement.unlocked && styles.achievementXpLocked
                ]}>
                  {achievement.xp} XP
                </Text>
              </View>
            </Animated.View>
          ))}
          
          {/* Animation for first achievement */}
          {unlockedAchievements > 0 && (
            <View style={styles.celebrationContainer}>
              <LottieUniversal
                source={require('@/assets/images/Animation - winner.json')}
                autoPlay
                loop={false}
                style={styles.celebrationAnimation}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium || 12,
    padding: 16,
    marginBottom: 24,
    ...theme.shadows.small,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  progressBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: theme.colors.backgroundDeep,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarBackground: {
    flex: 1,
    borderRadius: 5,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 5,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 4,
  },
  progressPercentText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  achievementsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: theme.typography?.subheading || 18,
    fontWeight: theme.typography?.weightSemiBold || '600',
    color: theme.colors.textPrimary,
    marginLeft: 8,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium || 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  achievementUnlocked: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  achievementLocked: {
    opacity: 0.7,
  },
  achievementIconContainer: {
    marginRight: 16,
  },
  achievementIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  achievementIconBgLocked: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.backgroundDeep,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 10,
    padding: 2,
  },
  lockBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.backgroundDeep,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  achievementContent: {
    flex: 1,
    paddingRight: 8,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  achievementTitleLocked: {
    color: theme.colors.textSecondary,
  },
  achievementDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  achievementDescriptionLocked: {
    color: theme.colors.textMuted,
  },
  achievementDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginLeft: 4,
  },
  achievementXpContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  achievementXp: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  achievementXpLocked: {
    color: theme.colors.textMuted,
  },
  celebrationContainer: {
    position: 'absolute',
    top: -20,
    right: 0,
    width: 150,
    height: 150,
    opacity: 0.8,
    zIndex: -1,
  },
  celebrationAnimation: {
    width: '100%',
    height: '100%',
  },
});

export default AchievementsScreen; 