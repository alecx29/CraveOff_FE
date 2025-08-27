import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'ios' ? 'fade' : 'none',
        contentStyle: { backgroundColor: '#db042c' },
      }}
    />
  );
} 