import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  interpolate,
  Extrapolate,
  Easing,
  FadeIn,
  useAnimatedProps
} from 'react-native-reanimated';
import { Svg, Circle, G } from 'react-native-svg';

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
  
  // Animation progress value (0 to 1)
  const progress = useSharedValue(0);
  
  // Rotation animation value
  const rotation = useSharedValue(0);
  
  // Percentage text scale animation
  const scaleText = useSharedValue(1);
  
  // Reset and start animation when visible changes
  useEffect(() => {
    if (visible) {
      // Progress animation
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: duration,
        easing: Easing.bezier(0.22, 1, 0.36, 1), // iOS-like easing
      });
      
      // Rotation animation
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(1, { 
          duration: 1500,
          easing: Easing.linear
        }),
        -1, // Infinite repeat
        false // No reverse
      );
      
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
    }
  }, [visible, duration]);
  
  // Animated style for rotation
  const spinAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value * 360}deg` }
      ],
    };
  });
  
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
  
  // Circle parameters
  const size = 120;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(300)}
    >
      <Animated.View style={styles.content}>
        <Text style={styles.title}>Building your custom plan</Text>
        
        <View style={styles.spinnerContainer}>
          {/* Background Circle */}
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.colors.cardInteractive}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
          </Svg>
          
          {/* Animated Progress Circle */}
          <Animated.View style={[StyleSheet.absoluteFill, spinAnimatedStyle]}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={theme.colors.primary}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={[circumference * 0.7, circumference * 0.3]}
                  strokeLinecap="round"
                />
              </G>
            </Svg>
          </Animated.View>
          
          {/* Percentage Text Background */}
          <View style={styles.percentageBackground} />
          
          {/* Percentage Text */}
          <Animated.Text 
            style={[styles.percentageText, textAnimatedStyle]}
          >
            {Math.round(progress.value * 100)}%
          </Animated.Text>
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
    backgroundColor: theme.colors.background,
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
  percentageBackground: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: theme.colors.background,
    opacity: 0.8,
    borderRadius: 30,
  },
  percentageText: {
    position: 'absolute',
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});

export default CustomPlanLoadingScreen; 