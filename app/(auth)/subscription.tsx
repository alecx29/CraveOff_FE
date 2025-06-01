import React, { useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

import SubscriptionScreen from '@/src/screen-components/subscription/SubscriptionScreen';
import { useTheme } from '@/src/context/ThemeProvider';
import { AuthContext } from '@/src/context/AuthContext';

export default function Subscription() {
  const { theme } = useTheme();
  const { signUp } = useContext(AuthContext);
  
  // Add onComplete handler to finish signup
  const handleComplete = () => {
    // Here you would typically register the user with all the collected data
    // For now, we'll simulate sign up completion and redirect to the main app
    signUp({ accessToken: 'test-token', refreshToken: 'test-refresh-token' });
    router.push('/(tabs)');
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