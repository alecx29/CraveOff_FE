import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { useTheme } from '@/src/context/ThemeProvider';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | any;
}

const Input: React.FC<InputProps> = ({ label, error, style, ...props }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, style, error && styles.inputError]}
        {...props}
        placeholderTextColor={theme.colors.textPlaceholder}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default Input;

const createStyles = (theme) => StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  label: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.small,
    fontWeight: theme.typography.weightMedium,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    height: theme.sizes.inputHeight,
    ...theme.shadows.light,
  },
  inputError: {
    borderColor: theme.colors.buttonEmergency,
    borderWidth: 1,
    ...theme.shadows.redGlow,
  },
  errorText: {
    color: theme.colors.buttonEmergency,
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.small,
    fontWeight: theme.typography.weightMedium,
  },
});
