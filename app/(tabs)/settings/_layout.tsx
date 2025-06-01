import { Stack } from 'expo-router';
import React from 'react';

import { useTheme } from '@/src/context/ThemeProvider';

export default function SettingsLayout() {
  const { theme } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: theme.colors.backgroundDeep },
        headerTintColor: theme.colors.textPrimary,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="personal-details" />
      <Stack.Screen name="edit-weight-goal" />
      <Stack.Screen name="edit-current-weight" />
      <Stack.Screen name="edit-height" />
      <Stack.Screen name="edit-birthdate" />
      <Stack.Screen name="edit-gender" />
      <Stack.Screen name="edit-macro-goals" />
    </Stack>
  );
}
