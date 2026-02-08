import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, ImageBackground } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeProvider';

const DURATION_MIN = 4;

export default function DeepBreathingScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [selectedMin] = useState<number>(DURATION_MIN);
  const navigatingRef = useRef(false);
  const onStart = () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    router.push({ pathname: '/deep-breathing/session', params: { min: String(selectedMin) } });
    setTimeout(() => { navigatingRef.current = false; }, 800);
  };

  return (
    <ImageBackground
      source={require('@/assets/images/afterPay2.webp')}
      style={styles.background}
      resizeMode="cover"
    >
      <Stack.Screen options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <Text style={styles.title}>Deep Breathing</Text>
          <View style={styles.durationRow}>
            <View style={[styles.durationFixed]}>
              <Text style={styles.durationFixedText}>{DURATION_MIN} min</Text>
            </View>
          </View>

          <TouchableOpacity onPress={onStart} activeOpacity={0.85} style={styles.playOuter} disabled={navigatingRef.current}>
            <View style={styles.playInner}>
              <Ionicons name="play" size={28} color={'#111'} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    paddingTop: 44,
    paddingHorizontal: 16,
  },
  headerRow: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  closeBtn: {
    padding: 8,
  },
  controls: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  durationRow: {
    flexDirection: 'row',
    marginBottom: 28,
  },
  durationFixed: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  durationFixedText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  playOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.light,
  },
  playInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});


