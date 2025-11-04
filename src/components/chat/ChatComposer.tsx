import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/src/context/ThemeProvider';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function ChatComposer({ value, onChangeText, onSend, disabled, placeholder = 'Type a message...' }: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const canSend = !!value.trim() && !disabled;

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <LinearGradient
          colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
          style={styles.inputGradient}
        >
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            value={value}
            onChangeText={onChangeText}
            multiline
            returnKeyType="send"
            onSubmitEditing={onSend}
            editable={!disabled}
          />
        </LinearGradient>
      </View>
      <TouchableOpacity
        style={[styles.sendButton, !canSend && styles.sendDisabled]}
        onPress={onSend}
        disabled={!canSend}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
          style={styles.sendGradient}
        >
          <Ionicons name="send" size={18} color={canSend ? theme.colors.textPrimary : theme.colors.textMuted} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 32,
    marginRight: 8,
  },
  inputGradient: {
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  input: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    paddingVertical: 12,
    minHeight: 48,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: {
    opacity: 0.6,
  },
});


