import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Animated, Easing, Text } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import inhaleBell from '@/assets/images/deep-meditation-bell-hit-root-chakra-1.mp3';
import exhaleBell from '@/assets/images/deep-meditation-bell-hit-heart-chakra-4.mp3';

import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { useTheme } from '@/src/context/ThemeProvider';
// Haptics temporarily disabled; keeping toggle UI only

export default function DeepBreathingSessionScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { min } = useLocalSearchParams<{ min?: string }>();

  const totalSeconds = Math.max(1, Number(min) || 4) * 60;
  const INHALE_SEC = 4;
  const EXHALE_SEC = 6;

  const { width, height } = Dimensions.get('window');
  const diameter = Math.min(width, height) * 0.78;
  const inner = diameter * 0.32;
  const innerScale = inner / diameter;

  const scaleAnim = useRef(new Animated.Value(innerScale)).current;
  const [remaining, setRemaining] = useState<number>(totalSeconds);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [, setPhaseLeft] = useState<number>(INHALE_SEC);
  const [hapticsOn, setHapticsOn] = useState<boolean>(true);
  const [paused, setPaused] = useState<boolean>(false);
  const phaseRef = useRef<'inhale' | 'exhale'>('inhale');
  const leftRef = useRef<number>(INHALE_SEC);
  const remainingRef = useRef<number>(totalSeconds);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const pausedRef = useRef<boolean>(false);
  const pendingStopRef = useRef<boolean>(false);
  const inhaleSoundRef = useRef<any>(null);
  const exhaleSoundRef = useRef<any>(null);
  const audioModuleRef = useRef<any>(null);

  useEffect(() => {
    let secTimer: any;
    let isCancelled = false;

    const runInhale = (durationSec: number = INHALE_SEC) => {
      if (isCancelled) return;
      phaseRef.current = 'inhale';
      setPhase('inhale');
      leftRef.current = durationSec;
      setPhaseLeft(durationSec);
      try { void inhaleSoundRef.current?.replayAsync(); } catch {}
      // stop any previous animation to avoid overlapping chains
      animRef.current?.stop?.();
      // native haptics handled by CraveHaptics loop
      animRef.current = Animated.timing(scaleAnim, {
        toValue: 1,
        duration: durationSec * 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });
      animRef.current.start(({ finished }) => {
        if (finished && !isCancelled && !pausedRef.current) {
          // trecem la exhale; dacă timerul a expirat, vom opri la finalul exhale-ului
          runExhale();
        }
      });
    };

    const runExhale = (durationSec: number = EXHALE_SEC) => {
      if (isCancelled) return;
      phaseRef.current = 'exhale';
      setPhase('exhale');
      leftRef.current = durationSec;
      setPhaseLeft(durationSec);
      try { void exhaleSoundRef.current?.replayAsync(); } catch {}
      // stop any previous animation to avoid overlapping chains
      animRef.current?.stop?.();
      // native haptics handled by CraveHaptics loop
      animRef.current = Animated.timing(scaleAnim, {
        toValue: innerScale,
        duration: durationSec * 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });
      animRef.current.start(({ finished }) => {
        if (finished && !isCancelled && !pausedRef.current) {
          if (pendingStopRef.current) {
            // oprim după încheierea exhale-ului curent
            return;
          }
          runInhale();
        }
      });
    };

    runInhale();

    secTimer = setInterval(() => {
      if (pausedRef.current) return;
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(secTimer);
          pendingStopRef.current = true;
          return 0;
        }
        return r - 1;
      });
      setPhaseLeft((p) => {
        leftRef.current = p > 1 ? p - 1 : (phaseRef.current === 'inhale' ? INHALE_SEC : EXHALE_SEC);
        return leftRef.current;
      });
      remainingRef.current = Math.max(0, remainingRef.current - 1);
    }, 1000);

    return () => {
      isCancelled = true;
      try { clearInterval(secTimer); } catch {}
      try { scaleAnim.stopAnimation(); } catch {}
      animRef.current?.stop?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Haptics temporarily disabled (will be re-enabled with native module later)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { Audio } = await import('expo-av');
        audioModuleRef.current = Audio;
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });
        const inhaleCreated = await Audio.Sound.createAsync(inhaleBell, { shouldPlay: false });
        const exhaleCreated = await Audio.Sound.createAsync(exhaleBell, { shouldPlay: false });
        if (!mounted) {
          await inhaleCreated.sound.unloadAsync();
          await exhaleCreated.sound.unloadAsync();
          return;
        }
        inhaleSoundRef.current = inhaleCreated.sound;
        exhaleSoundRef.current = exhaleCreated.sound;
      } catch {}
    })();
    return () => {
      mounted = false;
      try { void inhaleSoundRef.current?.unloadAsync(); } catch {}
      try { void exhaleSoundRef.current?.unloadAsync(); } catch {}
    };
  }, []);

  return (
    <GradientBackground>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.stage, styles.stageShiftFurther, styles.shiftUpSlightly]}>
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle} />
            {!paused && (
              <Animated.View style={[styles.indicatorCircle, { transform: [{ scale: scaleAnim }] }]} />
            )}
            <View style={styles.phaseLabelWrap}>
              <Text style={styles.phaseLabelText}>
                {phase === 'inhale' ? 'Inhale' : 'Exhale'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.controlsBarWrap, styles.shiftUpSlightly]}>
          <TouchableOpacity
            onPress={() => setHapticsOn(v => !v)}
            style={[styles.controlCircle, styles.hapticsLeft, hapticsOn && styles.controlCircleActive]}
            activeOpacity={0.8}
          >
            <Ionicons name={hapticsOn ? 'pulse' : 'pulse-outline'} size={20} color={hapticsOn ? theme.colors.primary : theme.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setPaused(p => {
                const next = !p;
                pausedRef.current = next;
                if (next) {
                  // Pausăm: calculăm timpul rămas precis din poziția curentă a scale-ului
                  animRef.current?.stop?.();
                  scaleAnim.stopAnimation((current: number) => {
                    // Mapăm progresul în funcție de fază pentru a obține secunde rămase
                    const span = 1 - innerScale;
                    if (phaseRef.current === 'inhale') {
                      const progressed = Math.max(0, Math.min(1, (current - innerScale) / span));
                      const left = Math.max(0.05, INHALE_SEC * (1 - progressed));
                      leftRef.current = left;
                      setPhaseLeft(Math.ceil(left));
                    } else {
                      const progressed = Math.max(0, Math.min(1, (1 - current) / span));
                      const left = Math.max(0.05, EXHALE_SEC * (1 - progressed));
                      leftRef.current = left;
                      setPhaseLeft(Math.ceil(left));
                    }
                    // haptics disabled
                  });
                } else {
                  // Restartăm întotdeauna ciclul de la cerc mic (Inhale 4s) și continuăm în buclă
                  animRef.current?.stop?.();
                  try { scaleAnim.stopAnimation(); } catch {}
                  scaleAnim.setValue(innerScale);
                  const continueLoop = () => {
                    if (pausedRef.current || pendingStopRef.current) return;
                    phaseRef.current = 'inhale';
                    setPhase('inhale');
                    leftRef.current = INHALE_SEC;
                    setPhaseLeft(INHALE_SEC);
                    try { void inhaleSoundRef.current?.replayAsync(); } catch {}
                    animRef.current = Animated.timing(scaleAnim, {
                      toValue: 1,
                      duration: INHALE_SEC * 1000,
                      easing: Easing.inOut(Easing.ease),
                      useNativeDriver: true,
                    });
                    animRef.current.start(({ finished }) => {
                      if (finished && !pausedRef.current) {
                        phaseRef.current = 'exhale';
                        setPhase('exhale');
                        leftRef.current = EXHALE_SEC;
                        setPhaseLeft(EXHALE_SEC);
                        try { void exhaleSoundRef.current?.replayAsync(); } catch {}
                        animRef.current = Animated.timing(scaleAnim, {
                          toValue: innerScale,
                          duration: EXHALE_SEC * 1000,
                          easing: Easing.inOut(Easing.ease),
                          useNativeDriver: true,
                        });
                        animRef.current.start(({ finished: f2 }) => {
                          if (f2 && !pausedRef.current) {
                            if (pendingStopRef.current) return;
                            continueLoop();
                          }
                        });
                      }
                    });
                  };
                  continueLoop();
                }
                return next;
              });
            }}
            style={[styles.controlCircle, styles.playPauseBtn]}
            activeOpacity={0.85}
          >
            <Ionicons name={paused ? 'play' : 'pause'} size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.timerBubbleWrap, styles.shiftUpSlightly]}>
          <View style={styles.timerBubble}>
            <Text style={styles.mainTimer}>{formatMMSS(remaining)}</Text>
          </View>
        </View>
      </View>
    </GradientBackground>
  );
}

function formatMMSS(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const createStyles = (theme: any) => {
  const { width, height } = Dimensions.get('window');
  const diameter = Math.min(width, height) * 0.78;
  const inner = diameter * 0.32;
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 44,
      paddingHorizontal: 16,
    },
    headerRow: {
      height: 44,
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      position: 'relative',
      zIndex: 10,
      elevation: 10,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.10)'
    },
    stage: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 0,
    },
    stageShiftFurther: {
      // move circles slightly higher on screen
      marginTop: -48,
    },
    outerCircle: {
      width: diameter,
      height: diameter,
      borderRadius: diameter / 2,
      backgroundColor: `${theme.colors.primary}10`,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    innerCircle: {
      width: inner,
      height: inner,
      borderRadius: inner / 2,
      backgroundColor: 'rgba(255,255,255,0.20)',
    },
    indicatorCircle: {
      position: 'absolute',
      width: diameter,
      height: diameter,
      borderRadius: diameter / 2,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    phaseLabelWrap: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    phaseLabelText: {
      fontSize: 25,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      opacity: 0.9,
      letterSpacing: 0.25,
    },
    timerBubbleWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 56, // not too low
      alignItems: 'center',
    },
    timerBubble: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      minWidth: 140,
    },
    mainTimer: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    controlsBarWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 120, // between circles and timer bubble
      alignItems: 'center',
    },
    controlCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    controlCircleActive: {
      borderColor: theme.colors.primary,
    },
    playPauseBtn: {
      alignSelf: 'center',
    },
    hapticsLeft: {
      position: 'absolute',
      left: 16,
    },
    shiftUpSlightly: {
      transform: [{ translateY: -20 }],
    },
  });
};


