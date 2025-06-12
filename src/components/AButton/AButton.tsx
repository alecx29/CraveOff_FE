import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/src/context/ThemeProvider';

interface ThemeType {
  colors: Record<string, string>;
  spacing: any;
  typography: any;
  borderRadius: any;
  shadows: Record<string, any>;
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
  const styles = createStyles(theme as ThemeType);

  // Helper functions to safely access theme properties
  const getColor = (colorName: string, fallbackColor?: string): string => {
    const colors = theme.colors as Record<string, string>;
    return colorName in colors ? colors[colorName] : (fallbackColor || colors.primary);
  };

  const getShadow = (shadowName: string): any => {
    const shadows = theme.shadows as Record<string, any>;
    return shadowName in shadows ? shadows[shadowName] : shadows.medium;
  };

  // Determine gradient colors based on variant
  const getGradientColors = (): [string, string] => {
    if (disabled) {
      const cardInteractive = getColor('cardInteractive', '#F1F5F9');
      return [cardInteractive, cardInteractive];
    }
    
    switch (variant) {
      case 'primary':
        return [getColor('primaryLight', '#818CF8'), getColor('primary', '#4F46E5')];
      case 'emergency':
        return [getColor('emergencyLight', '#FCA5A5'), getColor('emergency', '#DC2626')];
      case 'secondary':
        return [getColor('cardInteractive', '#F1F5F9'), getColor('cardBackground', '#FFFFFF')];
      case 'outline':
        return ['transparent', 'transparent'];
      default:
        return [getColor('primaryLight', '#818CF8'), getColor('primary', '#4F46E5')];
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
    variant === 'primary' ? getShadow('indigoGlow') :
    variant === 'emergency' ? getShadow('redGlow') :
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
          <ActivityIndicator size="small" color={variant === 'outline' ? getColor('primary') : getColor('textPrimary')} />
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
