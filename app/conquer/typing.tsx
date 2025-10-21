import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, Platform, TouchableOpacity, Dimensions } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieUniversal from '@/src/components/LottieUniversal';
import * as Haptics from 'expo-haptics';
import Animated, { SlideInUp, FadeInUp } from 'react-native-reanimated';

const { height } = Dimensions.get('window');

function useTypewriterSequence(sequences: { text: string; holdMs?: number }[]) {
  const [display, setDisplay] = React.useState('');
  const [seqIndex, setSeqIndex] = React.useState(0);
  const [charIndex, setCharIndex] = React.useState(0);
  const [showCursor, setShowCursor] = React.useState(true);
  const [isComplete, setIsComplete] = React.useState(false);

  // Enterprise-grade haptic strategy: subtle per-character (throttled) + boundary feedback per message
  const lastHapticRef = React.useRef(0);
  const isAndroid = Platform.OS === 'android';
  const ENABLE_ANDROID_CHAR_HAPTICS = false; // disable per-char haptics on Android for performance
  // Android: fewer, lighter haptics to avoid performance impact and strong vibration
  const CHAR_HAPTIC_EVERY_N = isAndroid ? 3 : 1;
  const MIN_INTERVAL_MS = isAndroid ? 90 : 40;

  const maybeHapticChar = React.useCallback((i: number) => {
    if (Platform.OS === 'web') return;
    if (isAndroid && !ENABLE_ANDROID_CHAR_HAPTICS) return;
    if (i % CHAR_HAPTIC_EVERY_N !== 0) return;
    const now = Date.now();
    if (now - lastHapticRef.current < MIN_INTERVAL_MS) return;
    lastHapticRef.current = now;
    // Use lighter selection haptic; Android already throttled above
    Haptics.selectionAsync();
  }, [CHAR_HAPTIC_EVERY_N, MIN_INTERVAL_MS, isAndroid, ENABLE_ANDROID_CHAR_HAPTICS]);

  const boundaryHaptic = React.useCallback(() => {
    if (Platform.OS === 'web') return;
    // Slightly stronger feedback at message boundary: lighter on Android
    if (isAndroid) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [isAndroid]);

  const TYPING_DELAY_MS = isAndroid ? 16 : 18;
  const CHARS_PER_TICK = isAndroid ? 2 : 1;

  React.useEffect(() => {
    if (seqIndex >= sequences.length) {
      // All sequences have been displayed; keep final text on screen
      setIsComplete(true);
      return;
    }

    const current = sequences[seqIndex];
    const target = current.text;

    if (charIndex < target.length) {
      const t = setTimeout(() => {
        const nextIndex = Math.min(target.length, charIndex + CHARS_PER_TICK);
        setDisplay(target.slice(0, nextIndex));
        setCharIndex(nextIndex);
        // Haptic per character (throttled)
        try { maybeHapticChar(nextIndex - 1); } catch {}
      }, TYPING_DELAY_MS);
      return () => clearTimeout(t);
    } else {
      const hold = current.holdMs ?? 1500;
      const t = setTimeout(() => {
        // Boundary haptic then advance; keep final message without clearing
        if (seqIndex < sequences.length - 1) {
          try { boundaryHaptic(); } catch {}
          setDisplay('');
          setCharIndex(0);
          setSeqIndex(seqIndex + 1);
        } else {
          setIsComplete(true);
        }
      }, hold);
      return () => clearTimeout(t);
    }
  }, [charIndex, seqIndex, sequences, maybeHapticChar, boundaryHaptic, TYPING_DELAY_MS, CHARS_PER_TICK]);

  React.useEffect(() => {
    const blink = setInterval(() => setShowCursor((c) => !c), 500);
    return () => clearInterval(blink);
  }, []);

  return { display, showCursor, isComplete, seqIndex };
}

export default function ConquerTyping() {
  const insets = useSafeAreaInsets();
  const styles = createStyles(insets);
  const router = useRouter();
  const [name, setName] = React.useState<string>('User');
  React.useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('signup.personalName');
        if (stored && stored.trim().length > 0) setName(stored.trim());
      } catch {}
    })();
  }, []);

  const sequences = React.useMemo(() => (
    [
      { text: `Hey ${name},`, holdMs: 500 },
      { text: 'Welcome to CraveOff, your path to freedom.', holdMs: 500 },
      { text: "Based on your answers, we've built a plan just for you.", holdMs: 700 },
      { text: "It's designed to help you quit porn forever.", holdMs: 700 },
      { text: "Now it's time to invest in yourself.", holdMs: 800 },
    ]
  ), [name]);

  const { display, showCursor, isComplete, seqIndex } = useTypewriterSequence(sequences);

  const handleContinue = React.useCallback(() => {
    // Prefer push to keep back navigation; fall back to replace just in case
    try { router.push('/(auth)/subscription'); } catch { router.replace('/(auth)/subscription'); }
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background Animation */}
      <View style={styles.backgroundContainer}>
        <LottieUniversal
          source={require('@/assets/images/Animation_SkyStar.json')}
          autoPlay
          loop
          style={styles.backgroundAnimation}
          resizeMode="cover"
        />
      </View>

      {/* Security animation appears only after the second message completes */}
      {seqIndex >= 2 && (
        <View style={styles.animationAbsoluteContainer} pointerEvents="none">
          <Animated.View entering={SlideInUp.duration(600).springify()} style={styles.animationShift}>
            <View style={styles.animationBox}>
              <LottieUniversal
                source={require('@/assets/images/SecuritySystem.json')}
                autoPlay
                loop
                style={styles.animation}
                resizeMode="cover"
              />
            </View>
          </Animated.View>
        </View>
      )}

      <View style={styles.contentWrapper}>
        <Text style={styles.typingText}>
          {display}
          {!isComplete && (
            <Text style={[styles.cursor, { opacity: showCursor ? 1 : 0 }]}>|</Text>
          )}
        </Text>
      </View>
      {isComplete && (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.ctaContainer}>
          {Platform.OS === 'android' ? (
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.85}>
              <View style={styles.continueContent}>
                <Text style={styles.continueText}>Continue</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradientBorder}
            >
              <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.85}>
                <View style={styles.continueContent}>
                  <Text style={styles.continueText}>Continue</Text>
                </View>
              </TouchableOpacity>
            </LinearGradient>
          )}
        </Animated.View>
      )}
      {!isComplete && (
        <View style={styles.bottomHintContainer} pointerEvents="none">
          <View style={styles.bottomCircle} />
        </View>
      )}
    </View>
  );
}

const createStyles = (insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0B0A10',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0B0A10',
    overflow: 'hidden',
  },
  backgroundAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  contentWrapper: {
    flex: 1,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: insets.top + 120,
    paddingBottom: insets.bottom + 24,
  },
  typingText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 38,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  cursor: {
    color: '#ffffff',
    fontSize: 24,
    opacity: 0.9,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: height * 0.06 + insets.bottom,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },
  continueButton: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    height: Math.min(52, height * 0.07),
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaGradientBorder: {
    borderRadius: 34,
    padding: 2,
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueIcon: {
    marginLeft: 6,
  },
  continueText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  animationAbsoluteContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationBox: {
    width: 300,
    height: 300,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  animationShift: {
    transform: [{ translateY: 20 }],
  },
  bottomHintContainer: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'transparent',
  },
});


