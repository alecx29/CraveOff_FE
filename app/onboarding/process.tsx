import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, SafeAreaView, TouchableOpacity, Image, ScrollView, Dimensions, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTheme } from '@/src/context/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import LottieUniversal from '@/src/components/LottieUniversal';
import OnboardingProgressDots from '@/src/components/OnboardingProgressDots';

const { width, height } = Dimensions.get('window');

type Step = {
  lottie: any;
  title: string;
  subtitle: string;
};

const STEPS: Step[] = [
  {
    lottie: require('@/assets/images/Animation - brain1.json'),
    title: 'Porn is a drug',
    subtitle: "Using porn releases a chemical in the brain called dopamine feel good- it's why you feel pleasure when you watch porn",
  },
  {
    lottie: require('@/assets/images/Animation - brokenHeart.json'),
    title: 'Porn destroys relationships',
    subtitle: 'Porn reduces your hunger for a real relationship - and replaces it with the hunger for more porn.',
  },
  {
    lottie: require('@/assets/images/Animation - sexDrive.json'),
    title: 'Porn shatters sex drive',
    subtitle: 'More than 50% of porn addicts have reported a decrease in libido, loss of interest in real sex, and an overall decrease in their sex drive',
  },
  {
    lottie: require('@/assets/images/Animation - sad.json'),
    title: 'Feeling unhappy?',
    subtitle: 'An elevated dopamine level means you need more dopamine to feel good. This is why so many heavy porn users report feeling depressed, unmotivated , and anti-social',
  },
  {
    lottie: require('@/assets/images/Animation - Recovery.json'),
    title: 'Path to Recovery',
    subtitle: 'Recovery is possible. By abstaining from porn, your brain can rest its dopamine sensitivity, leading to healthier relationship and improved well-being.',
  },
];

export default function OnboardingProcess() {
  const { theme } = useTheme();
  const styles = createStyles();
  const scrollRef = React.useRef<ScrollView | null>(null);
  const [index, setIndex] = React.useState(0);
  const lastNavAtRef = React.useRef(0);
  const lastColor = theme.colors.primary;
  const progress = useSharedValue(0);
  const [hasActivatedRecovery, setHasActivatedRecovery] = React.useState(false);

  React.useEffect(() => {
    progress.value = withTiming(index, { duration: 300 });
  }, [index, progress]);

  React.useEffect(() => {
    if (index === STEPS.length - 1 && !hasActivatedRecovery) {
      setHasActivatedRecovery(true);
    }
  }, [index, hasActivatedRecovery]);

  const bgAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1, 2, 3, 4],
      ['#db042c', '#db042c', '#db042c', '#db042c', lastColor]
    )
  }));

  const isLast = index >= STEPS.length - 1;

  const handleNext = () => {
    const now = Date.now();
    if (now - lastNavAtRef.current < 400) return;
    lastNavAtRef.current = now;
    if (isLast) {
      router.push('/conquer/process');
      return;
    }
    const next = Math.min(index + 1, STEPS.length - 1);
    setIndex(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
  };

  const onMomentumEnd = (e: any) => {
    const x = e?.nativeEvent?.contentOffset?.x || 0;
    const idx = Math.round(x / width);
    if (!Number.isNaN(idx)) setIndex(Math.max(0, Math.min(idx, STEPS.length - 1)));
  };

  return (
    <SafeAreaView style={[styles.container]}> 
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, bgAnimStyle]} />
      <StatusBar style="light" />

      {/* Logo at the top */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.mainContainer}>
        <ScrollView 
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          contentContainerStyle={{ alignItems: 'stretch' }}
          scrollEventThrottle={16}
        >
            {STEPS.map((step, i) => (
            <View key={i} style={{ width, paddingHorizontal: width * 0.06 }}>
              <View style={styles.contentContainer}>
                <View
                  style={[
                    styles.imageContainer,
                    i === 1
                      ? { width: Math.min(width * 0.7, 280), height: Math.min(width * 0.7, 280) }
                      : i === 2
                        ? { width: Math.min(width * 0.4, 160), height: Math.min(width * 0.4, 160), marginTop: height * 0.01 }
                        : null,
                  ]}
                >
                  {i === STEPS.length - 1 ? (
                    <LottieUniversal
                      key={hasActivatedRecovery ? 'recovery-on' : 'recovery-off'}
                      source={step.lottie}
                      autoPlay={hasActivatedRecovery}
                      loop
                      style={styles.lottie}
                    />
                  ) : (
                    <LottieUniversal
                      source={step.lottie}
                      autoPlay
                      loop
                      style={styles.lottie}
                    />
                  )}
                </View>
                <Text style={[styles.title, { color: '#ffffff' }]}>{step.title}</Text>
                <Text style={[styles.subtitle, { color: '#ffffff' }]}>{step.subtitle}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Fixed position elements at bottom */}
        <View style={styles.bottomContainer}>
          {/* Progress dots */}
          <OnboardingProgressDots activeIndex={index} />
          
          {/* Custom button */}
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>{isLast ? 'Continue' : 'Next'}</Text>
            <Ionicons name="arrow-forward" size={20} color="#db042c" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    logoContainer: {
      alignItems: 'center',
      paddingTop: Platform.OS === 'android' ? height * 0.06 + 6 : height * 0.03,
      paddingBottom: height * 0.01,
    },
    logo: {
      width: width * 0.35,
      height: height * 0.04,
      maxWidth: 150,
      maxHeight: 40,
      tintColor: '#ffffff',
    },
    mainContainer: {
      flex: 1,
      position: 'relative',
    },
    contentContainer: {
      paddingVertical: height * 0.04,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: height * 0.6,
    },
    imageContainer: {
      width: Math.min(width * 0.6, 240),
      height: Math.min(width * 0.6, 240),
      overflow: 'hidden',
      marginBottom: height * 0.03,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lottie: {
      width: '100%',
      height: '100%',
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      marginBottom: height * 0.03,
      textAlign: 'center',
      width: '100%',
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 24,
      width: '90%',
    },
    bottomContainer: {
      position: 'absolute',
      bottom: height * 0.08, // Position from bottom
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    nextButton: {
      backgroundColor: '#ffffff',
      borderRadius: 30,
      height: Math.min(52, height * 0.07),
      paddingHorizontal: 30,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: Math.min(150, width * 0.4),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
      marginTop: height * 0.02,
    },
    nextButtonText: {
      color: '#db042c',
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: 8,
    },
  });


