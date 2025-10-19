import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieUniversal from '@/src/components/LottieUniversal';


function useTypewriterSequence(sequences: { text: string; holdMs?: number }[], onDone: () => void) {
  const [display, setDisplay] = React.useState('');
  const [seqIndex, setSeqIndex] = React.useState(0);
  const [charIndex, setCharIndex] = React.useState(0);
  const [showCursor, setShowCursor] = React.useState(true);

  React.useEffect(() => {
    if (seqIndex >= sequences.length) {
      const timer = setTimeout(onDone, 600);
      return () => clearTimeout(timer);
    }

    const current = sequences[seqIndex];
    const target = current.text;

    if (charIndex < target.length) {
      const t = setTimeout(() => {
        setDisplay(target.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 42); // typing speed
      return () => clearTimeout(t);
    } else {
      const hold = current.holdMs ?? 1500;
      const t = setTimeout(() => {
        // Erase
        setDisplay('');
        setCharIndex(0);
        setSeqIndex(seqIndex + 1);
      }, hold);
      return () => clearTimeout(t);
    }
  }, [charIndex, seqIndex, sequences, onDone]);

  React.useEffect(() => {
    const blink = setInterval(() => setShowCursor((c) => !c), 500);
    return () => clearInterval(blink);
  }, []);

  return { display, showCursor };
}

export default function ConquerTyping() {
  const insets = useSafeAreaInsets();
  const styles = createStyles(insets);
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
      { text: `Hey ${name}`, holdMs: 1500 },
      { text: 'Welcome to CraveOff,\n your path to freedom', holdMs: 1800 },
      { text: "Based on your answers, we've built a plan just for you", holdMs: 1800 },
    ]
  ), [name]);

  const onDone = React.useCallback(() => {
    router.replace('/(auth)/subscription');
  }, []);

  const { display, showCursor } = useTypewriterSequence(sequences, onDone);

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

      <View style={styles.contentWrapper}>
        <Text style={styles.typingText}>
          {display}
          <Text style={[styles.cursor, { opacity: showCursor ? 1 : 0 }]}>|</Text>
        </Text>
      </View>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: insets.top + 24,
    paddingBottom: insets.bottom + 24,
  },
  typingText: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
  },
  cursor: {
    color: '#ffffff',
    fontSize: 24,
    opacity: 0.9,
  },
});


