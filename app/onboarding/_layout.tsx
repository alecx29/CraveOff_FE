import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  const screenOptions = Platform.OS === 'ios'
    ? { headerShown: false, animationDuration: 200, animation: 'slide_from_right' as const, contentStyle: { backgroundColor: '#db042c' } }
    : { headerShown: false, animation: 'slide_from_right' as const, animationDuration: 160, contentStyle: { backgroundColor: '#db042c' } };

  return (
    <Stack screenOptions={screenOptions} />
  );
}