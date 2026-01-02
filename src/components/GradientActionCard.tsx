import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeProvider';

type Props = {
  title: string;
  description?: string;
  icon: React.ReactNode;
  onPress: () => void;
  titleColor?: string;
  showChevron?: boolean;
};

export default function GradientActionCard({
  title,
  description,
  icon,
  onPress,
  titleColor,
  showChevron = true,
}: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <LinearGradient
        colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
        style={styles.gradient}
      >
        <View style={styles.row}>
          <View style={styles.left}>
            <View style={styles.iconCircle}>{icon}</View>
            <View style={styles.texts}>
              <Text style={[styles.title, titleColor ? { color: titleColor } : null]}>
                {title}
              </Text>
              {description ? (
                <Text style={styles.description}>{description}</Text>
              ) : null}
            </View>
          </View>
          {showChevron ? (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textPrimary}
            />
          ) : null}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: 'transparent',
      borderRadius: theme.borderRadius.medium,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    gradient: {
      padding: 16,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 8,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    texts: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    description: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });


