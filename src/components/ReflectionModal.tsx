import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  StatusBar,
  Animated as RNAnimated,
  ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeIn, 
  FadeOut
} from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';
import LottieUniversal from '@/src/components/LottieUniversal';

interface ReflectionModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height, width } = Dimensions.get('window');
// Define height thresholds for responsive design
const IS_SMALL_DEVICE = height < 700;
const IS_VERY_SMALL_DEVICE = height < 600;

const ReflectionModal = ({ visible, onClose }: ReflectionModalProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Animation values
  const titleOpacity = useRef(new RNAnimated.Value(0)).current;
  const titleScale = useRef(new RNAnimated.Value(1)).current;
  const contentOpacity = useRef(new RNAnimated.Value(0)).current;
  const buttonOpacity = useRef(new RNAnimated.Value(0)).current;
  const pulseAnimRef = useRef<RNAnimated.CompositeAnimation | null>(null);
  
  // Adjust for safe areas
  const bottomPadding = Math.max(insets.bottom, 20);
  const topPadding = Math.max(insets.top, 20);
  
  useEffect(() => {
    if (visible) {
      // Reset animation values
      titleOpacity.setValue(0);
      titleScale.setValue(1);
      contentOpacity.setValue(0);
      buttonOpacity.setValue(0);
      
      // Animate title
      RNAnimated.timing(titleOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // Subtle continuous pulse on title
      if (pulseAnimRef.current) {
        pulseAnimRef.current.stop();
      }
      pulseAnimRef.current = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(titleScale, {
            toValue: 1.04,
            duration: 1400,
            useNativeDriver: true,
          }),
          RNAnimated.timing(titleScale, {
            toValue: 1.0,
            duration: 1400,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimRef.current.start();
      
      // Animate content with delay
      setTimeout(() => {
        RNAnimated.timing(contentOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }, 500);
      
      // Animate button with delay
      setTimeout(() => {
        RNAnimated.timing(buttonOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 1500);
    }

    return () => {
      if (pulseAnimRef.current) {
        pulseAnimRef.current.stop();
        pulseAnimRef.current = null;
      }
    };
  }, [visible]);
  
  if (!visible) return null;
  
  const styles = createStyles(theme, bottomPadding, topPadding);
  
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.backgroundContainer}>
        <LottieUniversal
          source={require('@/assets/images/Animation_SkyStar.json')}
          autoPlay
          loop
          style={styles.backgroundAnimation}
          resizeMode="cover"
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollViewContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Title */}
          <RNAnimated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ scale: titleScale }] }]}>
            REFLECT AND BREATHE
          </RNAnimated.Text>
          
          {/* Reflection content */}
          <RNAnimated.View style={[styles.textContainer, { opacity: contentOpacity }]}>
            <Text style={styles.reflectionText}>
              You&apos;re feeling the urge to relapse again, and that&apos;s okay.
            </Text>
            <Text style={styles.reflectionText}>
              It&apos;s love you&apos;re looking for.
            </Text>
            <Text style={styles.reflectionText}>
              Porn pushes you away from that.
            </Text>
          </RNAnimated.View>
        </View>
      </ScrollView>
      
      {/* Button - Now positioned outside ScrollView with fixed position */}
      <RNAnimated.View style={[styles.fixedButtonContainer, { opacity: buttonOpacity }]}>
        <TouchableOpacity 
          style={styles.finishButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Finish Reflecting</Text>
        </TouchableOpacity>
      </RNAnimated.View>
    </Animated.View>
  );
};

const createStyles = (theme: any, bottomPadding: number, topPadding: number) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  backgroundAnimation: {
    width: '100%',
    height: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 100, // Add padding to ensure content isn't hidden behind the fixed button
  },
  contentContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: IS_VERY_SMALL_DEVICE ? topPadding + 20 : topPadding + 60,
    paddingHorizontal: 30,
  },
  title: {
    fontSize: IS_SMALL_DEVICE ? 16 : 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: IS_SMALL_DEVICE ? 20 : 40,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IS_SMALL_DEVICE ? 10 : 20,
  },
  reflectionText: {
    fontSize: IS_SMALL_DEVICE ? 22 : 28,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: IS_SMALL_DEVICE ? 34 : 45,
    marginBottom: IS_SMALL_DEVICE ? 10 : 20,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: bottomPadding,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  finishButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: IS_SMALL_DEVICE ? 12 : 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: IS_SMALL_DEVICE ? 16 : 18,
    fontWeight: '600',
    lineHeight: 22,
  },
});

export default ReflectionModal; 