import React from 'react';
import { StyleSheet, View, ViewStyle, TouchableOpacity } from 'react-native';

import { useTheme } from '@/src/context/ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'interactive' | 'elevated' | 'outlined';
  accentColor?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  accentColor
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const cardStyle = [
    styles.card,
    variant === 'interactive' && styles.cardInteractive,
    variant === 'elevated' && styles.cardElevated,
    variant === 'outlined' && styles.cardOutlined,
    accentColor && { borderLeftColor: accentColor },
    style
  ];

  const getShadowStyle = () => {
    if (variant === 'elevated') {
      return theme.shadows.medium;
    } else if (variant === 'interactive') {
      return theme.shadows.light;
    }
    return {};
  };

  if (onPress) {
    return (
      <TouchableOpacity 
        style={[cardStyle, getShadowStyle()]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyle, getShadowStyle()]}>
      {children}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  cardInteractive: {
    backgroundColor: theme.colors.cardInteractive,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  cardElevated: {
    backgroundColor: theme.colors.cardBackground,
  },
  cardOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  }
});

export default Card; 