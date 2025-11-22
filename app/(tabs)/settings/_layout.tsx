import { Stack } from 'expo-router';
import React from 'react';

import { useTheme } from '@/src/context/ThemeProvider';

export default function SettingsLayout() {
  const { theme } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.textPrimary,
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="account-options" options={{ title: 'Account Options' }} />
    </Stack>
  );
}
