import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: '#25292e' },
        headerTintColor: '#fff',
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
