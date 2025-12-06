import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/context/ThemeProvider';

interface FixedBottomButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  isLoading?: boolean;
  icon?: string;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  customStyle?: ViewStyle;
  absolute?: boolean;
  extendUnderIOSBottom?: boolean; // if true, iOS bar extends under home indicator
}

const FixedBottomButton: React.FC<FixedBottomButtonProps> = ({
  onPress,
  title,
  disabled = false,
  isLoading = false,
  icon,
  buttonStyle,
  textStyle,
  customStyle,
  absolute = true,
  extendUnderIOSBottom = true,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets, absolute, extendUnderIOSBottom);
  const loaderColor =
    typeof textStyle?.color === 'string' && textStyle.color
      ? (textStyle.color as string)
      : 'white';

  return (
    <View style={[styles.container, customStyle]}>
      <TouchableOpacity
        style={[
          styles.button,
          disabled && styles.disabledButton,
          buttonStyle
        ]}
        onPress={onPress}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={loaderColor} size="small" />
        ) : (
          <>
            <Text style={[styles.buttonText, textStyle]}>{title}</Text>
            {icon && (
              <Ionicons name={icon as any} size={22} color={textStyle?.color || "white"} style={styles.buttonIcon} />
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: any, insets: any, absolute: boolean, extendUnderIOSBottom: boolean) => StyleSheet.create({
  container: {
    position: absolute ? 'absolute' : 'relative',
    // iOS: extend under safe area; Android: stay flush at 0
    bottom: absolute ? (Platform.OS === 'ios' && extendUnderIOSBottom ? -insets.bottom : 0) : undefined,
    left: absolute ? 0 : undefined,
    right: absolute ? 0 : undefined,
    backgroundColor: 'rgb(3 7 18)',
    paddingHorizontal: 16,
    paddingTop: 12,
    // Add back the safe-area as inner padding so content sits above the home indicator
    paddingBottom: Math.max(insets.bottom + 10, 20),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...(absolute ? theme.shadows.medium : {}),
    elevation: absolute ? 5 : 0,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  disabledButton: {
    backgroundColor: theme.colors.disabled || theme.colors.border,
    opacity: 0.8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default FixedBottomButton; 