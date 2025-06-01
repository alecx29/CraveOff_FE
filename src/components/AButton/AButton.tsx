import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/src/context/ThemeProvider';

interface ThemeType {
  colors: any;
  spacing: any;
  typography: any;
  borderRadius: any;
  shadows: any;
  sizes: any;
}

interface AButtonProps {
  onPress: () => void;
  title?: string;
  color?: string;
  customStyles?: {
    button?: any;
    text?: any;
  };
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'emergency' | 'outline';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const AButton: React.FC<AButtonProps> = ({
  title,
  onPress,
  color,
  customStyles,
  disabled,
  loading,
  variant = 'primary',
  leftIcon,
  rightIcon,
  children,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Determine gradient colors based on variant
  const getGradientColors = () => {
    if (disabled) return [theme.colors.cardInteractive, theme.colors.cardInteractive];
    
    switch (variant) {
      case 'primary':
        return [theme.colors.primaryLight, theme.colors.primary];
      case 'emergency':
        return [theme.colors.emergencyLight, theme.colors.emergency];
      case 'secondary':
        return [theme.colors.cardInteractive, theme.colors.cardBackground];
      case 'outline':
        return ['transparent', 'transparent'];
      default:
        return [theme.colors.primaryLight, theme.colors.primary];
    }
  };

  // Get button style
  const buttonStyle = [
    styles.button,
    variant === 'outline' && styles.outlineButton,
    disabled && styles.disabledButton,
    color && { backgroundColor: color },
    customStyles?.button,
  ];

  // Get text style
  const textStyle = [
    styles.buttonText,
    variant === 'outline' && styles.outlineText,
    disabled && styles.disabledText,
    customStyles?.text,
  ];

  // Get shadow style
  const shadowStyle = disabled ? {} : (
    variant === 'primary' ? theme.shadows.indigoGlow :
    variant === 'emergency' ? theme.shadows.redGlow :
    theme.shadows.medium
  );

  return (
    <TouchableOpacity 
      onPress={!disabled && !loading ? onPress : () => {}}
      activeOpacity={0.8}
      style={shadowStyle}
      disabled={disabled || loading}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={buttonStyle}>
        
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'outline' ? theme.colors.primary : theme.colors.textPrimary} />
        ) : (
          <>
            {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
            {title && <Text style={textStyle}>{title}</Text>}
            {children}
            {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const createStyles = (theme: ThemeType) => StyleSheet.create({
  button: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.sizes.buttonHeight,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weightSemiBold,
    textAlign: 'center',
    color: theme.colors.textPrimary,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  disabledText: {
    color: theme.colors.textMuted,
  },
  iconContainer: {
    marginHorizontal: theme.spacing.xs,
  },
});

export default AButton;
