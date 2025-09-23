import { AntDesign, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/src/context/ThemeProvider';

interface SettingCardProps {
  icon: any;
  title: string;
  value?: string;
  onPress?: () => void;
  showSwitch?: boolean;
  isActive?: boolean;
  onToggle?: (value: boolean) => void;
  type?: 'ant-design' | 'ion-icons';
  variant?: 'primary' | 'emergency' | 'default';
  iconComponent?: any;
}

const SettingCard: React.FC<SettingCardProps> = ({
  icon,
  title,
  value,
  onPress,
  showSwitch,
  isActive,
  onToggle,
  type = 'ion-icons',
  variant = 'default',
  iconComponent
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const IconComponent = iconComponent || (type === 'ion-icons' ? Ionicons : AntDesign);

  // Helper functions for safe color access
  const getEmergencyColor = (): string => {
    if ('emergency' in theme.colors) return theme.colors.emergency as string;
    if ('buttonEmergency' in theme.colors) return theme.colors.buttonEmergency as string;
    return theme.colors.error as string || '#ef4444';
  };

  const getCardInteractiveColor = (): string => {
    if ('cardInteractive' in theme.colors) return theme.colors.cardInteractive as string;
    return theme.colors.cardBackgroundAlt as string || theme.colors.neutral200 as string || '#F5F5F5';
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'emergency':
        return getEmergencyColor();
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
  <TouchableOpacity 
      style={[styles.card, onPress && styles.cardInteractive]} 
    onPress={onPress}
      disabled={showSwitch || !onPress}
      activeOpacity={0.7}
  >
    <LinearGradient
      colors={['rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.28)']}
      style={styles.cardGradient}
    >
    <View style={styles.cardContent}>
        <View style={[styles.cardIcon, { backgroundColor: variant === 'default' ? getCardInteractiveColor() : `${getIconColor()}20` }]}>
          <IconComponent name={icon} size={22} color={getIconColor()} />
      </View>
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardTitle}>{title}</Text>
        {value && <Text style={styles.cardValue}>{value}</Text>}
      </View>
      {showSwitch ? (
        <Switch
          value={isActive}
          onValueChange={onToggle}
            trackColor={{ false: getCardInteractiveColor(), true: `${theme.colors.primary}30` }}
            thumbColor={isActive ? theme.colors.primary : theme.colors.textSecondary}
          style={styles.switch}
        />
        ) : onPress ? (
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        ) : null}
    </View>
    </LinearGradient>
  </TouchableOpacity>
);
};

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: theme.borderRadius.medium,
  },
  cardInteractive: {
    // Removed border from left side
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    height: 60, // Reduced height slightly
  },
  cardIcon: {
    width: 36, // Reduced from 40
    height: 36, // Reduced from 40
    borderRadius: theme.borderRadius.circle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15, // Reduced from theme.typography.body
    fontWeight: theme.typography.weightSemiBold,
    color: theme.colors.textPrimary,
  },
  cardValue: {
    fontSize: theme.typography.small,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  switch: {
    transform: [{ scale: 0.8 }],
  },
});

export default SettingCard;
