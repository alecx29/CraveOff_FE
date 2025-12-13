import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Pressable, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { useAchievements } from '@/src/context/AchievementsContext';
import LottieUniversal from '@/src/components/LottieUniversal';
import { getAchievementImage } from '@/src/utils/achievementImages';
import { BlurView } from 'expo-blur';

const isStarterAchievement = (code?: string) => code === 'STREAK_0' || code === 'WELCOME';

const AchievementsScreen = () => {
  const { theme } = useTheme();
  const { achievements: ctxAchievements } = useAchievements();
  const styles = createStyles(theme);

  // Helper: format date nice
  const formatDate = (d: Date) => d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  // Helper: format server ISO-like timestamps nicely
  const formatUnlockedAt = (raw?: string): string | undefined => {
    if (!raw) return undefined;
    try {
      const parsed = new Date(raw);
      if (isNaN(parsed.getTime())) return undefined;
      return formatDate(parsed);
    } catch {
      return undefined;
    }
  };

  const achievements = (ctxAchievements || []).map(it => ({
    id: it.code,
    title: it.title,
    description: it.description || '',
    imageSource: getAchievementImage(it.code),
    unlocked: !!it.unlocked,
    date: it.unlocked ? formatUnlockedAt(it.unlockedAt) : undefined,
    xp: typeof it.xp === 'number' ? it.xp : 0,
  }));

  // Showcase overlay state
  const [showcase, setShowcase] = useState<null | (typeof achievements)[number]>(null);

  // Calculăm progresul total (XP-based, excluzând STREAK_365 din target)
  const totalAchievements = achievements.length;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const eligibleForXp = achievements.filter(a => a.id !== 'STREAK_365');
  const totalXpTarget = eligibleForXp.reduce((sum, a) => sum + a.xp, 0);
  const earnedXp = eligibleForXp.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0);
  const progressPercentage = totalXpTarget > 0 ? (earnedXp / totalXpTarget) * 100 : 0;
  const totalXP = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0);

  const openShowcase = (a: (typeof achievements)[number]) => setShowcase(a);

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
      <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Progress Header */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(600)} 
          style={styles.progressCard}
        >
          <LinearGradient
            colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
            style={styles.progressGradient}
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
                <Text style={styles.xpEmoji}>⚡</Text>
                <Text style={styles.xpText}>{totalXP} XP</Text>
              </View>
              <Text style={styles.progressPercentText}>{Math.round(progressPercentage)}% Complete</Text>
            </View>
          </LinearGradient>
        </Animated.View>
        
        {/* Achievements List */}
        <View style={styles.achievementsContainer}>
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>🏆</Text>
            <Text style={styles.sectionTitle}>Your Achievements</Text>
          </View>
          
          {achievements.map((achievement, index) => {
            const starterBadge = isStarterAchievement(achievement.id);
            return (
              <Animated.View 
                key={achievement.id}
                entering={FadeInUp.delay(200 + index * 100).duration(400)}
                style={[
                  styles.achievementCard,
                  achievement.unlocked ? styles.achievementUnlocked : styles.achievementLocked
                ]}
              >
                <View style={styles.achievementRow}>
                  <View style={styles.achievementIconContainer}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => openShowcase(achievement)}
                    >
                      <View style={
                        starterBadge
                          ? (achievement.unlocked ? styles.achievementIconBg : styles.achievementIconBgLocked)
                          : (achievement.unlocked ? styles.achievementIconBgLarge : styles.achievementIconBgLockedLarge)
                      }>
                        {achievement.unlocked ? (
                          starterBadge ? (
                          <LottieUniversal
                            source={require('@/assets/images/Animation - winner.json')}
                            autoPlay
                            loop
                            style={styles.achievementLottie}
                          />
                        ) : (
                          <Image
                            source={achievement.imageSource}
                              style={styles.achievementImage}
                            resizeMode="cover"
                          />
                          )
                        ) : (
                          <Ionicons name="lock-closed" size={20} color={theme.colors.textMuted} />
                        )}
                      </View>
                    </TouchableOpacity>
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
                    !achievement.unlocked && styles.achievementXpLocked,
                    achievement.unlocked && styles.achievementXpUnlocked
                  ]}>
                      {achievement.xp} XP
                    </Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
      
      {/* Showcase Overlay - viewport-level */}
      {showcase && (
        <View pointerEvents="box-none" style={styles.overlayRoot}>
          {Platform.OS === 'android' ? (
            <View style={[styles.overlayCover, { backgroundColor: 'rgba(0,0,0,0.88)' }]} />
          ) : (
            <>
              <BlurView intensity={80} tint="dark" style={styles.overlayCover} />
              <View style={[styles.overlayCover, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
            </>
          )}
          <Pressable
            style={styles.overlayBackdrop}
            onPress={() => {
              setShowcase(null);
            }}
          />
          <View style={styles.overlayCenter}>
            <View style={styles.previewCircle}>
              {isStarterAchievement(showcase.id) ? (
                <LottieUniversal
                  source={require('@/assets/images/Animation - winner.json')}
                  autoPlay
                  loop
                  style={styles.previewLottie}
                />
              ) : (
                <Image source={showcase.imageSource} style={styles.previewImage} resizeMode="cover" />
              )}
            </View>
            <Text style={styles.previewTitle}>{showcase.title}</Text>
            {!!showcase.description && <Text style={styles.previewDesc}>{showcase.description}</Text>}
          </View>
        </View>
      )}
      </View>
    </GradientBackground>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  progressCard: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium || 12,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  progressGradient: {
    padding: 16,
    borderRadius: theme.borderRadius.medium || 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
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
    color:     theme.colors.textSecondary,
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
    backgroundColor: '#a855f7',
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
  xpEmoji: {
    fontSize: 16,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a855f7',
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
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium || 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'transparent'
  },
  achievementGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: theme.borderRadius.medium || 12,
  },
  achievementRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: theme.borderRadius.medium || 12,
    backgroundColor: 'transparent',
  },
  achievementUnlocked: {
    borderLeftWidth: 0,
    borderLeftColor: 'transparent',
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  achievementIconBgLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  achievementIconBgLocked: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    // overflow: 'hidden',
  },
  achievementIconBgLockedLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    // overflow: 'hidden',
  },
  achievementImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  achievementLottie: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
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
  achievementXpUnlocked: {
    color: '#ffffff',
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
  // Overlay
  overlayRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  overlayCenter: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  previewCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewLottie: {
    width: '100%',
    height: '100%',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  previewDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default AchievementsScreen; 