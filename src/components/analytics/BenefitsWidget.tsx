import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/src/context/ThemeProvider';

type BenefitDefinition = {
  key: string;
  emoji: string;
  title: string;
  description: string;
  minProgress: number;
  targetDay: number;
  growthExponent: number;
};

type BenefitsWidgetProps = {
  cleanDays?: number;
};

const benefitDefinitions: BenefitDefinition[] = [
  {
    key: 'confidence',
    emoji: '💬',
    title: 'Improved confidence',
    description: 'Confidence grows, especially in social and personal interactions.',
    minProgress: 4,
    targetDay: 90,
    growthExponent: 1.25,
  },
  {
    key: 'sleep',
    emoji: '😴',
    title: 'Better Sleep',
    description: 'Improved sleep quality often seen within a few days.',
    minProgress: 5,
    targetDay: 85,
    growthExponent: 1.25,
  },
  {
    key: 'sexDrive',
    emoji: '🔥',
    title: 'Increased Sex Drive',
    description: 'Healthier sex drive and performance after 30–45 days.',
    minProgress: 4,
    targetDay: 110,
    growthExponent: 1.3,
  },
  {
    key: 'selfEsteem',
    emoji: '⭐',
    title: 'Increased Self-Esteem',
    description: 'Improving control boosts your self-image and self-esteem.',
    minProgress: 3,
    targetDay: 130,
    growthExponent: 1.4,
  },
  {
    key: 'mentalClarity',
    emoji: '🧘‍♂️',
    title: 'Mental Clarity',
    description: 'Clear thinking and focus returns after quitting.',
    minProgress: 3,
    targetDay: 140,
    growthExponent: 1.4,
  },
  {
    key: 'healthierThoughts',
    emoji: '🧠',
    title: 'Healthier Thoughts',
    description: 'Less anxiety; healthier views on sex and relationships develop over time.',
    minProgress: 2,
    targetDay: 160,
    growthExponent: 1.45,
  },
  {
    key: 'productivity',
    emoji: '⏱️',
    title: 'More Time & Productivity',
    description: 'More energy and focus for meaningful, productive daily activities.',
    minProgress: 2,
    targetDay: 180,
    growthExponent: 1.5,
  },
];

const calculateProgress = (
  cleanDays: number,
  minProgress: number,
  targetDay: number,
  growthExponent: number
) => {
  const safeDays = Math.max(0, cleanDays);
  const ratio = Math.min(1, safeDays / targetDay);
  const eased = Math.pow(ratio, growthExponent);
  const progress = minProgress + eased * (100 - minProgress);
  return Math.round(Math.min(100, progress));
};

const BenefitsWidget: React.FC<BenefitsWidgetProps> = ({ cleanDays = 0 }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const benefitsWithProgress = useMemo(() => {
    return benefitDefinitions.map(def => ({
      ...def,
      progress: calculateProgress(cleanDays, def.minProgress, def.targetDay, def.growthExponent),
    }));
  }, [cleanDays]);

  return (
    <LinearGradient
      colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
      style={styles.container}
    >
      {benefitsWithProgress.map((benefit, index) => (
        <View
          key={benefit.key}
          style={[
            styles.item,
            index !== benefitsWithProgress.length - 1 && styles.divider,
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

