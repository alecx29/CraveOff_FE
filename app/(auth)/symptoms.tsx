import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

import SymptomsScreen from '@/src/screen-components/symptoms/SymptomsScreen';
import { useTheme } from '@/src/context/ThemeProvider';

export default function Symptoms() {
  const { theme } = useTheme();
  
  // After symptoms, go to onboarding process
  const handleComplete = () => {
    router.replace('/onboarding/process');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="auto" />
      <SymptomsScreen onComplete={handleComplete} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 