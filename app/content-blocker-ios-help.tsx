import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/src/context/ThemeProvider';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';

export default function ContentBlockerIosHelpScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <GradientBackground>
      <SafeAreaView style={[styles.container, { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Troubleshooting</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>If content isn&apos;t being blocked on iOS</Text>
          <Text style={styles.subtitle}>
            iOS blocking is controlled by Screen Time. Make sure it&apos;s enabled and web content is restricted.
          </Text>

          <View style={styles.step}>
            <Text style={styles.stepNum}>1</Text>
            <Text style={styles.stepText}>Open <Text style={styles.bold}>Settings</Text></Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNum}>2</Text>
            <Text style={styles.stepText}>Go to <Text style={styles.bold}>Screen Time</Text></Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNum}>3</Text>
            <Text style={styles.stepText}>Turn <Text style={styles.bold}>Screen Time</Text> ON</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNum}>4</Text>
            <Text style={styles.stepText}>Open <Text style={styles.bold}>Content &amp; Privacy Restrictions</Text> → turn it ON</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNum}>5</Text>
            <Text style={styles.stepText}>Tap <Text style={styles.bold}>Content Restrictions</Text> → <Text style={styles.bold}>Web Content</Text></Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNum}>6</Text>
            <Text style={styles.stepText}>Select <Text style={styles.bold}>Limit Adult Websites</Text> (recommended)</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.smallTitle}>Notes</Text>
          <Text style={styles.noteText}>
            - This applies to Safari and any iOS browser
          </Text>


          {Platform.OS !== 'ios' && (
            <Text style={[styles.noteText, { marginTop: 10 }]}>
              This guide is intended for iOS devices.
            </Text>
          )}
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    headerTitle: {
      color: theme.colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    card: {
      backgroundColor: theme.colors.card || theme.colors.surface || '#121218',
      borderRadius: 14,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.inputBorder,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 6,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      marginBottom: 14,
      lineHeight: 18,
    },
    step: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    stepNum: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(255,255,255,0.10)',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 22,
      marginRight: 10,
    },
    stepText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      paddingTop: 2,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.inputBorder,
      marginVertical: 12,
    },
    smallTitle: {
      color: theme.colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 6,
    },
    noteText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 6,
    },
    bold: {
      color: theme.colors.textPrimary,
      fontWeight: '700',
    },
  });


