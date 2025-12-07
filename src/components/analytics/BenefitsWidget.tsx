import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/src/context/ThemeProvider';

type BenefitItem = {
  emoji: string;
  title: string;
  description: string;
  progress: number;
};

const benefitsList: BenefitItem[] = [
  {
    emoji: '💬',
    title: 'Improved confidence',
    description: 'Confidence grows, especially in social and personal interactions.',
    progress: 35,
  },
  {
    emoji: '⭐',
    title: 'Increased Self-Esteem',
    description: 'Improving control boosts your self-image and self-esteem.',
    progress: 30,
  },
  {
    emoji: '🧘‍♂️',
    title: 'Mental Clarity',
    description: 'Clear thinking and focus returns after quitting.',
    progress: 40,
  },
  {
    emoji: '🔥',
    title: 'Increased Sex Drive',
    description: 'Healthier sex drive and performance after 30–45 days.',
    progress: 28,
  },
  {
    emoji: '🧠',
    title: 'Healthier Thoughts',
    description: 'Less anxiety; healthier views on sex and relationships develop over time.',
    progress: 32,
  },
  {
    emoji: '⏱️',
    title: 'More Time & Productivity',
    description: 'More energy and focus for meaningful, productive daily activities.',
    progress: 36,
  },
  {
    emoji: '😴',
    title: 'Better Sleep',
    description: 'Improved sleep quality often seen within a few days.',
    progress: 38,
  },
];

const BenefitsWidget = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <LinearGradient
      colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
      style={styles.container}
    >
      {benefitsList.map((benefit, index) => (
        <View
          key={benefit.title}
          style={[
            styles.item,
            index !== benefitsList.length - 1 && styles.divider,
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.emoji}>{benefit.emoji}</Text>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{benefit.title}</Text>
              <Text style={styles.description}>{benefit.description}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${benefit.progress}%` },
              ]}
            />
          </View>
        </View>
      ))}
    </LinearGradient>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      borderRadius: theme.borderRadius.large,
      padding: 20,
      paddingBottom: 12,
      marginBottom: 24,
    },
    item: {
      paddingVertical: 12,
    },
    divider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    emoji: {
      fontSize: 24,
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    description: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      marginLeft: 36,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: '#a855f7',
    },
  });

export default BenefitsWidget;

