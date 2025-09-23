import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import { useTheme } from '@/src/context/ThemeProvider';
import LottieUniversal from '@/src/components/LottieUniversal';

// Helper function to safely access theme colors
const getColor = (theme: any, colorName: string, fallbackColor: string): string => {
  const colors = theme.colors as Record<string, string>;
  if (colorName in colors) return colors[colorName];
  return fallbackColor;
};

// background-image: linear-gradient(rgba(22 23 24, 1), rgba(37, 41, 46, 0.89));

// colors={['rgba(37, 41, 46, 1.00)', 'rgba(37, 41, 46, 0.89)']}

// Static style for background Lottie to keep it stable across renders
const BG_Lottie_Styles = StyleSheet.create({
  bgLottie: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
    zIndex: 1,
  },
});

const BackgroundLottie = React.memo(() => (
  <LottieUniversal 
    source={require('@/assets/images/Animation_SkyStar.json')}
    autoPlay 
    loop 
    pointerEvents="none"
    speed={0.9}
    resizeMode="cover"
    style={BG_Lottie_Styles.bgLottie}
  />
));
BackgroundLottie.displayName = 'BackgroundLottie';

const GradientBackground = ({ children }: any) => {
  const { theme } = useTheme();
  const isFocused = useIsFocused();
  const [isAppActive, setIsAppActive] = useState(true);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setIsAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
    },
    stopButton: {
      backgroundColor: theme.colors.cardBackground,
      borderWidth: 1,
      borderColor: getColor(theme, 'emergency', '#ef4444'),
    },
  }), [theme]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          getColor(theme, 'gradientStart', '#16171a'), 
          getColor(theme, 'gradientEnd', '#25292e')
        ]}
        style={StyleSheet.absoluteFill} // Covers full screen
      />
      {isFocused && isAppActive && <BackgroundLottie />}
      <View style={{ flex: 1, zIndex: 2 }}>
        {children}
      </View>
    </View>
  );
};

export default GradientBackground;
