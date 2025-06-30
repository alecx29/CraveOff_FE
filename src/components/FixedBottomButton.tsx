import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
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
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets, absolute);

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
          <ActivityIndicator color="white" size="small" />
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

const createStyles = (theme: any, insets: any, absolute: boolean) => StyleSheet.create({
  container: {
    position: absolute ? 'absolute' : 'relative',
    bottom: absolute ? 0 : undefined,
    left: absolute ? 0 : undefined,
    right: absolute ? 0 : undefined,
    backgroundColor: 'rgb(3 7 18)',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Math.max(insets.bottom + 16, 32),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...(absolute ? theme.shadows.medium : {}),
    elevation: absolute ? 5 : 0,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 24,
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