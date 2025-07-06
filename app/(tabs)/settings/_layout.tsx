import { Stack } from 'expo-router';
import React from 'react';

import { useTheme } from '@/src/context/ThemeProvider';

export default function SettingsLayout() {
  const { theme } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.textPrimary,
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="personal-details" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="achievements" />
    </Stack>
  );
}
