import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/context/ThemeProvider';

export default function StroopTestScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const androidStatusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const topPadding = Math.max(insets.top, androidStatusBarHeight, 20);
  const bottomPadding = Math.max(insets.bottom, 20);
  const styles = useMemo(() => createStyles(theme, topPadding), [theme, topPadding]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" translucent backgroundColor="#0b0f18" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>🎨</Text>
        <Text style={styles.title}>Stroop Test</Text>
        <Text style={styles.subtitle}>
          Tap the COLOR, {'\n'}
          not the word!
        </Text>
                <Text style={styles.subtitle}>
          Coming Soon...
        </Text>
      </View>

      <View style={[styles.bottomWrap, { paddingBottom: bottomPadding }]}>
        <TouchableOpacity activeOpacity={0.86} style={styles.startButton} onPress={() => {}}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: any, insetTop: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0b0f18',
    },
    header: {
      paddingTop: insetTop + 10,
      paddingBottom: 8,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.10)',
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    bottomWrap: {
      paddingHorizontal: 24,
      paddingTop: 12,
    },
    startButton: {
      height: theme.sizes?.buttonHeight || 52,
      borderRadius: 999,
      backgroundColor: '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.22,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    startButtonText: {
      color: '#111',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    emoji: {
      fontSize: 88,
      marginBottom: 10,
    },
    title: {
      color: '#fff',
      fontSize: 26,
      fontWeight: '700',
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 10,
      color: 'rgba(255, 255, 255, 0.65)',
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 21,
    },
  });

