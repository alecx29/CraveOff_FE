import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';

export default function ConquerLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: '#db042c' }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#db042c',
  },
}); 