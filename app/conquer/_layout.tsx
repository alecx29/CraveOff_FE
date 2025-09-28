import { Stack } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';

export default function ConquerLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: Platform.OS === 'ios' ? 'fade' : 'none',
          contentStyle: { backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0B0A10' }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0A10',
  },
}); 