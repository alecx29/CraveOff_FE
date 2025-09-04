import React, { useEffect, useRef, useState } from 'react';
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
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeIn, 
  FadeOut
} from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';
import LottieUniversal from '@/src/components/LottieUniversal';
import { AntDesign } from '@expo/vector-icons';

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
  
  // Sequence state
  type Phase = 'intro' | 'instruction' | 'countdown' | 'countup' | 'outro';
  const [phase, setPhase] = useState<Phase>('intro');
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [countupValue, setCountupValue] = useState<number>(0);
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const intervalsRef = useRef<Array<ReturnType<typeof setInterval>>>([]);
  
  const clearAllTimers = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    intervalsRef.current.forEach((i) => clearInterval(i));
    timeoutsRef.current = [];
    intervalsRef.current = [];
  };
  
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
      
      // Reset sequence
      clearAllTimers();
      setPhase('intro');
      setCountdownValue(3);
      setCountupValue(0);
      
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
      
      // Sequence scheduling
      const toInstruction = setTimeout(() => {
        setPhase('instruction');
      }, 3500);
      timeoutsRef.current.push(toInstruction);

      const toCountdown = setTimeout(() => {
        setPhase('countdown');
        setCountdownValue(3);
        const countdownInterval = setInterval(() => {
          setCountdownValue((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              // Vibrate at 0
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              // Move to count up
              setPhase('countup');
              setCountupValue(0);
              const countupInterval = setInterval(() => {
                setCountupValue((prevUp) => {
                  if (prevUp >= 7) {
                    clearInterval(countupInterval);
                    // Vibrate at 7
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setPhase('outro');
                    return prevUp;
                  }
                  return prevUp + 1;
                });
              }, 1000);
              intervalsRef.current.push(countupInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        intervalsRef.current.push(countdownInterval);
      }, 3500 + 3000);
      timeoutsRef.current.push(toCountdown);
    }

    return () => {
      if (pulseAnimRef.current) {
        pulseAnimRef.current.stop();
        pulseAnimRef.current = null;
      }
      clearAllTimers();
    };
  }, [visible]);

  // Animate content on phase change and reveal button only at outro
  useEffect(() => {
    if (!visible) return;
    contentOpacity.setValue(0);
    RNAnimated.timing(contentOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    if (phase === 'outro') {
      buttonOpacity.setValue(0);
      RNAnimated.timing(buttonOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      buttonOpacity.setValue(0);
    }
  }, [phase, visible]);
  
  if (!visible) return null;
  
  const styles = createStyles(theme, bottomPadding, topPadding);
  
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      <StatusBar barStyle="light-content" />
      {/* Header with Close button (hidden in outro when Finish appears) */}
      {phase !== 'outro' && (
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            activeOpacity={0.7}
          >
            <AntDesign name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
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
            {phase === 'intro' && (
              <Text style={styles.reflectionText}>
                You&apos;re feeling the urge o relapse again, and that&apos;s okay.
              </Text>
            )}
            {phase === 'instruction' && (
              <Text style={styles.reflectionText}>
                Close your eyes and count until 7.
              </Text>
            )}
            {phase === 'countdown' && (
              <Text style={styles.timerText}>
                {countdownValue}
              </Text>
            )}
            {phase === 'countup' && (
              <Text style={styles.timerText}>
                {countupValue}
              </Text>
            )}
            {phase === 'outro' && (
              <>
                <Text style={styles.reflectionText}>
                  It&apos;s love you&apos;re looking for.
                </Text>
                <Text style={styles.reflectionText}>
                  Porn pushes you away from that.
                </Text>
              </>
            )}
          </RNAnimated.View>
        </View>
      </ScrollView>
      
      {/* Button - Now positioned outside ScrollView with fixed position */}
      {phase === 'outro' && (
        <RNAnimated.View style={[styles.fixedButtonContainer, { opacity: buttonOpacity }]}>
          <TouchableOpacity 
            style={styles.finishButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Finish Reflecting</Text>
          </TouchableOpacity>
        </RNAnimated.View>
      )}
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
  headerContainer: {
    position: 'absolute',
    top: topPadding + 10,
    right: 16,
    zIndex: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  timerText: {
    fontSize: IS_SMALL_DEVICE ? 72 : 96,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: IS_SMALL_DEVICE ? 80 : 104,
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