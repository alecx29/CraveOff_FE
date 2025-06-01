import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme } from '@/src/context/ThemeProvider';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';

export default function CommunityScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Connect with others on the same journey</Text>
      </View>
    </GradientBackground>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
