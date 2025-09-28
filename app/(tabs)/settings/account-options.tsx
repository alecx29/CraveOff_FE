import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { useTheme } from '@/src/context/ThemeProvider';
import DeleteAccountButton from '@/src/components/DeleteAccountButton';
import { AuthContext } from '@/src/context/AuthContext';

export default function AccountOptionsScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { signOut } = useContext(AuthContext);

  return (
    <GradientBackground>
      <View style={styles.container}>
        {/* <Text style={styles.title}>Account Options</Text> */}

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={signOut}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.textPrimary} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <DeleteAccountButton onSuccess={signOut} />
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundDeep,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },
  logoutText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
});


