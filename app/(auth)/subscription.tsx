import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

import SubscriptionScreen from '@/src/screen-components/subscription/SubscriptionScreen';
import { useTheme } from '@/src/context/ThemeProvider';

export default function Subscription() {
  const { theme } = useTheme();
  
  // Add onComplete handler to navigate to main app
  const handleComplete = () => {
    // Navigation to main app is now handled after authentication in FreeJourneyContent
    router.replace('/(tabs)');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="auto" />
      <SubscriptionScreen onComplete={handleComplete} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 