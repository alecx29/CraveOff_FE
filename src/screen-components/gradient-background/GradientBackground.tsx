import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeProvider';

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
      borderColor: theme.colors.emergency,
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={StyleSheet.absoluteFill} // Covers full screen
      />
      {children}
    </View>
  );
};

export default GradientBackground;
