import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme } from '@/src/context/ThemeProvider';

// Helper function to safely access theme colors
const getColor = (theme: any, colorName: string, fallbackColor: string): string => {
  const colors = theme.colors as Record<string, string>;
  if (colorName in colors) return colors[colorName];
  return fallbackColor;
};

// background-image: linear-gradient(rgba(22 23 24, 1), rgba(37, 41, 46, 0.89));

// colors={['rgba(37, 41, 46, 1.00)', 'rgba(37, 41, 46, 0.89)']}

const GradientBackground = ({ children }: any) => {
  const { theme } = useTheme();
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
    },
    stopButton: {
      backgroundColor: theme.colors.cardBackground,
      borderWidth: 1,
      borderColor: getColor(theme, 'emergency', '#ef4444'),
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          getColor(theme, 'gradientStart', '#16171a'), 
          getColor(theme, 'gradientEnd', '#25292e')
        ]}
        style={StyleSheet.absoluteFill} // Covers full screen
      />
      {children}
    </View>
  );
};

export default GradientBackground;
