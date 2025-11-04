import { Stack } from 'expo-router';
import React from 'react';

import { useTheme } from '@/src/context/ThemeProvider';

export default function CommunityLayout() {
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
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="room/[slug]" options={{ headerShown: true }} />
      <Stack.Screen name="user/[userId]" options={{ headerShown: true }} />
    </Stack>
  );
}


