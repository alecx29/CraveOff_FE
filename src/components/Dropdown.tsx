// src/components/Dropdown.tsx

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/src/context/ThemeProvider';

interface DropdownProps extends TextInputProps {
  label?: string;
  error?: string;
  onPress?: () => void;
  value?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ label, error, style, onPress, value, ...props }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity 
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.dropdown, style, error && styles.dropdownError]}
      >
        <Text 
          style={[
            styles.dropdownText, 
            !value && styles.placeholder
          ]}
        >
          {value || props.placeholder || 'Select option'}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color={theme.colors.textSecondary} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default Dropdown;

const createStyles = (theme) => StyleSheet.create({
  container: {
    marginVertical: theme.spacing.sm,
    width: '100%',
  },
  label: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.small,
    fontWeight: theme.typography.weightMedium,
  },
  dropdown: {
    height: theme.sizes.inputHeight,
    borderColor: theme.colors.inputBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.inputBackground,
    fontSize: theme.typography.body,
    color: theme.colors.textPrimary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.light,
  },
  dropdownText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
  },
  placeholder: {
    color: theme.colors.textPlaceholder,
  },
  dropdownError: {
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
