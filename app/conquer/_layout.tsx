import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function ConquerLayout() {
  const screenOptions = Platform.OS === 'ios'
    ? { headerShown: false, animationDuration: 200, animation: 'slide_from_right' as const, contentStyle: { backgroundColor: '#0B0A10' } }
    : { headerShown: false, animation: 'slide_from_right' as const, animationDuration: 160, contentStyle: { backgroundColor: '#0B0A10' } };

  return (
    <Stack screenOptions={screenOptions} />
  );
}