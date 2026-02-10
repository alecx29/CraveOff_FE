import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '@/src/context/ThemeProvider';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { apiClient } from '@/src/axios/apiClient';

export default function JournalHubScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const colors = theme.colors as Record<string, string>;
  const getColor = (name: string, fallback: string) => (name in colors ? colors[name] : fallback);
  const primary = getColor('primary', '#3498db');
  const startNowGradient: [string, string, string] = [
    getColor('primaryLight', primary),
    primary,
    getColor('primaryDark', primary),
  ];

  // Static catalog (same ordering as in Learning)
  const catalogSections = [
    {
      title: 'Addiction and Myths',
      items: [
        'The Neuroscience of Porn Addiction—How It Hijacks the Brain',
        'Debunking Common Myths About Porn Addiction',
        'Psychological and Environmental Factors Contributing to Porn Addiction',
        'The Porn Addiction Cycle—Recognizing Triggers and Patterns',
      ],
    },
    {
      title: 'Health Effects',
      items: [
        'Physical Health Consequences of Porn Addiction',
        'Psychological and Emotional Effects of Porn Addiction',
        'Impact of Porn Addiction on Relationships and Social Life',
        'Impact of Porn Addiction on Work and Academic Performance',
      ],
    },
    {
      title: 'Quiting Benefits',
      items: [
        'Reclaiming Mental Clarity and Emotional Well-being',
        'Strengthening Relationships and Deepening Intimacy',
      ],
    },
  ];
  const nextLessonTitle =
    catalogSections.find((section) => Array.isArray(section.items) && section.items.length > 0)?.items[0] ||
    'Your next lesson';

  // Totals (all sections): Addiction (4) + Health (4) + Quiting (2) = 10
  const TOTAL_ARTICLES = 10;
  const [completedCount, setCompletedCount] = useState(0);

  const fetchRead = async () => {
    try {
      const res = await apiClient.get('/articles/read');
      const list = res?.data?.articles || res?.data?.data || res?.data;
      if (Array.isArray(list)) {
        const ids = list
          .map((item: any) => item?.article_id || item)
          .filter((id: any) => typeof id === 'string');
        setCompletedCount(ids.length);
      }
    } catch (e) {
      console.log('Failed to fetch read articles', e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchRead();
    }, [])
  );

  useEffect(() => {
    fetchRead();
  }, []);

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Library</Text>
        </View>

        <View style={styles.buttons}>
          <View style={styles.nextLessonCard}>
            <LinearGradient
              // Match Home "Daily Motivation" background
              colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
              style={styles.nextLessonGradient}
            >
              <View style={styles.nextLessonTopRow}>
                <View style={styles.nextLessonTextCol}>
                  <Text style={styles.nextLessonTitle}>Your next lesson</Text>
                  <Text style={styles.nextLessonSubtitle}>
                    {completedCount}/{TOTAL_ARTICLES} · {nextLessonTitle}
                  </Text>
                </View>

                <View style={styles.nextLessonIconWrap}>
                  <Ionicons name="book-outline" size={26} color="#0b1020" />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/journal/learning')}
                style={styles.startNowTouch}
              >
                <LinearGradient
                  colors={startNowGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.startNowButton}
                >
                  <Text style={styles.startNowText}>Start Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <View style={styles.spacer} />

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.goJournalCard}
            onPress={() => router.push('/journal-modal')}
          >
            <LinearGradient
              // Match Home "Daily Motivation" background
              colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
              style={styles.goJournalGradient}
            >
              <View style={styles.goJournalRow}>
                <View style={styles.goJournalLeft}>
                  <Text style={styles.goJournalText}>Go to Journal</Text>
                  <Text style={styles.goJournalSubtext}>Journal your thoughts in seconds</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textPrimary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 44,
      paddingHorizontal: 20,
    },
    header: {
      marginTop: 10,
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    title: {
      marginTop: 10,
      fontSize: theme.typography.heading2,
      fontWeight: theme.typography.weightBold,
      color: theme.colors.textPrimary,
    },
    buttons: {
      width: '100%',
      maxWidth: 520,
      alignSelf: 'center',
    },
    spacer: {
      height: 14,
    },
    nextLessonCard: {
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
      backgroundColor: 'transparent',
      ...theme.shadows.medium,
    },
    nextLessonGradient: {
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 22,
      justifyContent: 'space-between',
      minHeight: 160,
      // slight inner border like Home "Daily Motivation"
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    nextLessonTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    nextLessonTextCol: {
      flex: 1,
      paddingRight: 14,
    },
    nextLessonTitle: {
      // Match Home "Daily Motivation" title sizing
      fontSize: theme.typography.body,
      fontWeight: theme.typography.weightSemiBold,
      color: '#FFFFFF',
    },
    nextLessonSubtitle: {
      marginTop: 8,
      // Match Home quote sizing
      fontSize: theme.typography.body,
      fontWeight: theme.typography.weightNormal,
      lineHeight: 24,
      fontStyle: 'italic',
      color: 'rgba(255, 255, 255, 0.78)',
    },
    nextLessonIconWrap: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    startNowTouch: {
      marginTop: 16,
    },
    startNowButton: {
      // Match AButton height + ensure it doesn't get clipped inside the rounded card
      height: theme.sizes?.buttonHeight || 48,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: Platform.OS === 'android' ? 0 : 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    startNowText: {
      // Match AButton text styling
      fontSize: theme.typography.body,
      fontWeight: theme.typography.weightSemiBold,
      color: '#FFFFFF',
      letterSpacing: 0.2,
    },
    goJournalCard: {
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: 'transparent',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.06)',
      marginTop: 8,
      ...theme.shadows.light,
    },
    goJournalGradient: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    goJournalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    goJournalLeft: {
      flex: 1,
      paddingRight: 12,
    },
    goJournalText: {
      color: theme.colors.textPrimary,
      fontSize: 15,
      fontWeight: theme.typography.weightSemiBold,
    },
    goJournalSubtext: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: theme.typography.weightMedium,
    },
  });


