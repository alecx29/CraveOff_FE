import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import LottieUniversal from '@/src/components/LottieUniversal';

import { useTheme } from '@/src/context/ThemeProvider';

interface CustomPlanLoadingScreenProps {
  visible: boolean;
  duration?: number; // in milliseconds
}

const CustomPlanLoadingScreen = ({ 
  visible, 
  duration = 4000 
}: CustomPlanLoadingScreenProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Keep a React state for the displayed percentage.
  // Reanimated shared values won't trigger React re-renders when they change.
  const [percent, setPercent] = useState(0);

  // Animation progress value (0 to 1)
  const progress = useSharedValue(0);

  // Percentage text scale animation
  const scaleText = useSharedValue(1);

  // Reset and start animation when visible changes
  useEffect(() => {
    if (visible) {
      // Drive the displayed percent in JS over the same duration.
      // (We keep the visual/opacity animation in Reanimated.)
      setPercent(0);
      const start = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        const p = Math.min(1, elapsed / duration);
        setPercent(Math.round(p * 100));
        if (p >= 1) clearInterval(interval);
      }, 50);

      // Progress animation
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: duration,
        easing: Easing.bezier(0.22, 1, 0.36, 1), // iOS-like easing
      });
      
      // Subtle pulse animation for percentage text
      scaleText.value = 1;
      scaleText.value = withRepeat(
        withTiming(1.1, { 
          duration: 1000,
          easing: Easing.bezier(0.4, 0, 0.6, 1)
        }),
        -1, // Infinite repeat
        true // With reverse (ping-pong)
      );

      return () => clearInterval(interval);
    }
  }, [visible, duration, progress, scaleText]);
  
  // Animated style for percentage text
  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [
        { scale: scaleText.value }
      ],
    };
  });
  
  // Don't render if not visible
  if (!visible) return null;
  
  
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(300)}
    >
      <Animated.View style={styles.content}>
        <Text style={styles.title}>Building your custom plan</Text>
        
        <View style={styles.animationContainer}>
          <LottieUniversal
            source={require('@/assets/images/loading.json')}
            autoPlay
            loop
            pointerEvents="none"
            resizeMode="cover"
            style={styles.lottie}
          />
          <View style={styles.overlayCenter}>
            <View style={styles.percentageBackground} />
            <Animated.Text 
              style={[styles.percentageText, textAnimatedStyle]}
            >
              {percent}%
            </Animated.Text>
          </View>
        </View>
        
        <Text style={styles.subtitle}>
          Analyzing your responses to create a personalized recovery journey
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 100,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 32,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  spinnerContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  animationContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  overlayCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageBackground: {
    width: 78,
    height: 78,
    // backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 39,
  },
  percentageText: {
    position: 'absolute',
    fontSize: 30,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});

export default CustomPlanLoadingScreen; 