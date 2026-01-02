import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { useTheme } from '@/src/context/ThemeProvider';
import DeleteAccountButton from '@/src/components/DeleteAccountButton';
import GradientActionCard from '@/src/components/GradientActionCard';
import { AuthContext } from '@/src/context/AuthContext';

export default function AccountOptionsScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { signOut } = useContext(AuthContext);

  return (
    <GradientBackground>
      <View style={styles.container}>
        {/* <Text style={styles.title}>Account Options</Text> */}

        <GradientActionCard
          title="Log Out"
          description="Sign out from this device"
          icon={<Ionicons name="log-out-outline" size={20} color={theme.colors.textPrimary} />}
          onPress={signOut}
        />

        <DeleteAccountButton onSuccess={signOut} />

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            Version {Constants.expoConfig?.version}
            {Platform.OS === 'android' && Constants.expoConfig?.android?.versionCode ? ` (${Constants.expoConfig.android.versionCode})` : ''}
          </Text>
        </View>
      </View>
    </GradientBackground>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 20,
  },
  versionContainer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  versionText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
});


